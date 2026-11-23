import { normalizeTier, type SubscriptionTierId } from './entitlements.ts';

export const DEFAULT_PLATFORM_OWNER_EMAIL = 'ahidayatov01@gmail.com';

export type AccountRole = 'owner' | 'user';

export interface ResolvedAccountAccess {
  role: AccountRole;
  isOwner: boolean;
  tier: SubscriptionTierId;
  subscriptionStatus: 'permanent_owner' | 'active';
  billingCycle: 'lifetime' | 'monthly' | 'annual';
  provider: string;
  billingExempt: boolean;
  unlimitedQuotas: boolean;
  expiresAt: string | null;
}

export function normalizeEmailAddress(email?: string | null): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function getConfiguredPlatformOwnerEmail(envEmail?: string | null): string {
  const normalizedEnv = normalizeEmailAddress(envEmail);
  return normalizedEnv || DEFAULT_PLATFORM_OWNER_EMAIL;
}

/**
 * Strictly checks whether a verified authenticated email matches the
 * single authorized platform owner email. Never uses substring matching
 * and never returns true for empty/guest identities.
 */
export function isPlatformOwnerEmail(
  email?: string | null,
  configuredOwnerEmail?: string | null
): boolean {
  const normalizedCandidate = normalizeEmailAddress(email);
  if (!normalizedCandidate || !normalizedCandidate.includes('@')) {
    return false;
  }
  const ownerEmail = getConfiguredPlatformOwnerEmail(configuredOwnerEmail);
  return normalizedCandidate === ownerEmail;
}

/**
 * Resolves authoritative server-side account role, tier, and billing flags.
 * Only an authenticated user whose verified email matches the platform owner
 * grant (or persisted owner record in DB) receives permanent Global Elite Pro.
 */
export function resolveEffectiveAccountAccess(params: {
  isGuest: boolean;
  verifiedEmail?: string | null;
  dbSubscriptionTier?: string | null;
  hasPersistedOwnerGrant?: boolean;
  configuredOwnerEmail?: string | null;
}): ResolvedAccountAccess {
  if (params.isGuest) {
    return {
      role: 'user',
      isOwner: false,
      tier: 'free',
      subscriptionStatus: 'active',
      billingCycle: 'monthly',
      provider: 'none',
      billingExempt: false,
      unlimitedQuotas: false,
      expiresAt: null,
    };
  }

  const emailMatchesOwner = isPlatformOwnerEmail(
    params.verifiedEmail,
    params.configuredOwnerEmail
  );
  const isOwner = Boolean(params.hasPersistedOwnerGrant || emailMatchesOwner);

  if (isOwner) {
    return {
      role: 'owner',
      isOwner: true,
      tier: 'premium',
      subscriptionStatus: 'permanent_owner',
      billingCycle: 'lifetime',
      provider: 'platform_owner',
      billingExempt: true,
      unlimitedQuotas: true,
      expiresAt: null,
    };
  }

  return {
    role: 'user',
    isOwner: false,
    tier: normalizeTier(params.dbSubscriptionTier),
    subscriptionStatus: 'active',
    billingCycle: 'monthly',
    provider: 'none',
    billingExempt: false,
    unlimitedQuotas: false,
    expiresAt: null,
  };
}
