import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PLATFORM_OWNER_EMAIL,
  isPlatformOwnerEmail,
  resolveEffectiveAccountAccess,
} from './ownerAccess.ts';
import { AI_AGENTS } from './aiAgentsRegistry.ts';
import { canAccessAgent, checkDailyQuota } from './entitlements.ts';

test('isPlatformOwnerEmail matches only the exact authorized owner email (case-insensitive)', () => {
  assert.equal(DEFAULT_PLATFORM_OWNER_EMAIL, 'ahidayatov01@gmail.com');
  assert.equal(isPlatformOwnerEmail('ahidayatov01@gmail.com'), true);
  assert.equal(isPlatformOwnerEmail('  AHIDAYATOV01@GMAIL.COM  '), true);

  // Strict anti-spoofing and ordinary-user isolation
  assert.equal(isPlatformOwnerEmail('other.student@gmail.com'), false);
  assert.equal(isPlatformOwnerEmail('ahidayatov01@gmail.com.evil.com'), false);
  assert.equal(isPlatformOwnerEmail('fake+ahidayatov01@gmail.com'), false);
  assert.equal(isPlatformOwnerEmail(''), false);
  assert.equal(isPlatformOwnerEmail(null), false);
  assert.equal(isPlatformOwnerEmail(undefined), false);
});

test('resolveEffectiveAccountAccess grants permanent Global Elite Pro exclusively to authenticated owner', () => {
  const ownerAccess = resolveEffectiveAccountAccess({
    isGuest: false,
    verifiedEmail: 'ahidayatov01@gmail.com',
    dbSubscriptionTier: 'free',
    hasPersistedOwnerGrant: true,
  });

  assert.equal(ownerAccess.role, 'owner');
  assert.equal(ownerAccess.isOwner, true);
  assert.equal(ownerAccess.tier, 'premium');
  assert.equal(ownerAccess.subscriptionStatus, 'permanent_owner');
  assert.equal(ownerAccess.billingCycle, 'lifetime');
  assert.equal(ownerAccess.billingExempt, true);
  assert.equal(ownerAccess.unlimitedQuotas, true);
  assert.equal(ownerAccess.expiresAt, null);

  // Ordinary authenticated user remains strictly on their DB tier (free by default)
  const ordinaryUser = resolveEffectiveAccountAccess({
    isGuest: false,
    verifiedEmail: 'student.applicant@example.com',
    dbSubscriptionTier: 'free',
    hasPersistedOwnerGrant: false,
  });

  assert.equal(ordinaryUser.role, 'user');
  assert.equal(ordinaryUser.isOwner, false);
  assert.equal(ordinaryUser.tier, 'free');
  assert.equal(ordinaryUser.billingExempt, false);
  assert.equal(ordinaryUser.unlimitedQuotas, false);

  // Guest caller can never receive owner privileges even if a flag were passed erroneously
  const guestAccess = resolveEffectiveAccountAccess({
    isGuest: true,
    verifiedEmail: 'ahidayatov01@gmail.com',
    dbSubscriptionTier: 'premium',
    hasPersistedOwnerGrant: true,
  });

  assert.equal(guestAccess.isOwner, false);
  assert.equal(guestAccess.tier, 'free');
  assert.equal(guestAccess.unlimitedQuotas, false);
});

test('Owner unlocks all 10 AI agents and unlimited quotas while ordinary users stay strictly gated', () => {
  assert.equal(AI_AGENTS.length, 10);
  for (const agent of AI_AGENTS) {
    assert.equal(canAccessAgent('premium', agent.id, true), true);
  }

  // Ordinary Free Explorer user remains blocked from Scholar Plus / Global Elite Pro agents
  assert.equal(canAccessAgent('free', 'transfer_architect', false), false);
  assert.equal(canAccessAgent('free', 'tuition_analyst', false), false);
  assert.equal(canAccessAgent('free', 'university_scout', false), true);

  // Unlimited quota for verified owner vs strict daily cap for ordinary Free user
  const ownerQuota = checkDailyQuota('premium', 'ai_message', 5000, true);
  assert.equal(ownerQuota.allowed, true);
  assert.equal(ownerQuota.unlimited, true);

  const freeQuotaExhausted = checkDailyQuota('free', 'ai_message', 12, false);
  assert.equal(freeQuotaExhausted.allowed, false);
  assert.equal(freeQuotaExhausted.unlimited, false);
});
