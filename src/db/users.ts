import { eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { subscriptionRecords, users } from './schema.ts';
import { parseFullName } from '../utils/userProfileHelpers.ts';
import {
  getConfiguredPlatformOwnerEmail,
  isPlatformOwnerEmail,
  resolveEffectiveAccountAccess,
  type ResolvedAccountAccess,
} from '../utils/ownerAccess.ts';

async function persistOwnerRecordsForUid(uid: string) {
  await db
    .update(users)
    .set({
      subscriptionTier: 'premium',
      updatedAt: new Date(),
    })
    .where(eq(users.uid, uid));

  await db
    .insert(subscriptionRecords)
    .values({
      userUid: uid,
      tier: 'premium',
      status: 'permanent_owner',
      provider: 'platform_owner',
      billingCycle: 'lifetime',
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptionRecords.userUid,
      set: {
        tier: 'premium',
        status: 'permanent_owner',
        provider: 'platform_owner',
        billingCycle: 'lifetime',
        updatedAt: new Date(),
      },
    });
}

/**
 * Idempotently upgrades any existing PostgreSQL account matching the configured
 * Platform Owner email (ahidayatov01@gmail.com) to permanent Global Elite Pro
 * in `users` and `subscription_records`, without modifying any other user account.
 */
export async function provisionPlatformOwnerGrant() {
  try {
    const ownerEmail = getConfiguredPlatformOwnerEmail(process.env.PLATFORM_OWNER_EMAIL);
    const existingResult = await db.execute(sql`
      SELECT uid, email FROM users WHERE lower(trim(email)) = ${ownerEmail}
    `);
    const matchingRows =
      (existingResult as unknown as { rows?: Array<{ uid?: string; email?: string }> })?.rows ??
      [];

    for (const row of matchingRows) {
      if (row?.uid) {
        await persistOwnerRecordsForUid(row.uid);
      }
    }
  } catch (error) {
    console.error('Error provisioning platform owner grant:', error);
  }
}

export async function getAuthoritativeAccountAccess(
  uid: string,
  verifiedEmail?: string | null
): Promise<ResolvedAccountAccess> {
  try {
    const [userRows, subRows] = await Promise.all([
      db
        .select({ email: users.email, subscriptionTier: users.subscriptionTier })
        .from(users)
        .where(eq(users.uid, uid))
        .limit(1),
      db
        .select({
          tier: subscriptionRecords.tier,
          status: subscriptionRecords.status,
          provider: subscriptionRecords.provider,
        })
        .from(subscriptionRecords)
        .where(eq(subscriptionRecords.userUid, uid))
        .limit(1),
    ]);

    const effectiveEmail = verifiedEmail || userRows[0]?.email || '';
    const persistedOwnerGrant = Boolean(
      subRows[0] &&
        subRows[0].status === 'permanent_owner' &&
        subRows[0].provider === 'platform_owner'
    );

    const access = resolveEffectiveAccountAccess({
      isGuest: false,
      verifiedEmail: effectiveEmail,
      dbSubscriptionTier: userRows[0]?.subscriptionTier ?? subRows[0]?.tier,
      hasPersistedOwnerGrant: persistedOwnerGrant,
      configuredOwnerEmail: process.env.PLATFORM_OWNER_EMAIL,
    });

    if (
      access.isOwner &&
      userRows[0] &&
      (userRows[0].subscriptionTier !== 'premium' || !persistedOwnerGrant)
    ) {
      await persistOwnerRecordsForUid(uid);
    }

    return access;
  } catch (error) {
    console.error('Error resolving authoritative account access:', error);
    return resolveEffectiveAccountAccess({
      isGuest: false,
      verifiedEmail,
      dbSubscriptionTier: 'free',
      hasPersistedOwnerGrant: false,
      configuredOwnerEmail: process.env.PLATFORM_OWNER_EMAIL,
    });
  }
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string,
  avatarUrl?: string
) {
  try {
    const existingSubRows = await db
      .select({ status: subscriptionRecords.status, provider: subscriptionRecords.provider })
      .from(subscriptionRecords)
      .where(eq(subscriptionRecords.userUid, uid))
      .limit(1);

    const hasPersistedGrant = Boolean(
      existingSubRows[0] &&
        existingSubRows[0].status === 'permanent_owner' &&
        existingSubRows[0].provider === 'platform_owner'
    );
    const isOwner =
      isPlatformOwnerEmail(email, process.env.PLATFORM_OWNER_EMAIL) || hasPersistedGrant;

    const existingRows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existingRows.length > 0) {
      const existing = existingRows[0];
      const parsed = parseFullName(displayName, email);
      const nextFirstName = existing.firstName || parsed.firstName;
      const nextLastName = existing.lastName || parsed.lastName;
      const nextDisplayName =
        existing.displayName || parsed.fullName || email.split('@')[0] || 'Scholar';
      const nextAvatarUrl = existing.avatarUrl || avatarUrl || '';

      const updated = await db
        .update(users)
        .set({
          email: email || existing.email,
          firstName: nextFirstName,
          lastName: nextLastName,
          displayName: nextDisplayName,
          avatarUrl: nextAvatarUrl,
          ...(isOwner ? { subscriptionTier: 'premium' } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.uid, uid))
        .returning();

      if (isOwner) {
        await persistOwnerRecordsForUid(uid);
      }

      return updated[0] ?? existing;
    }

    const parsed = parseFullName(displayName, email);
    const resolvedDisplayName = parsed.fullName || displayName || email.split('@')[0] || 'Scholar';

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        displayName: resolvedDisplayName,
        avatarUrl: avatarUrl || '',
        subscriptionTier: isOwner ? 'premium' : 'free',
        accountType: 'authenticated',
        onboardingCompleted: false,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(isOwner ? { subscriptionTier: 'premium' } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    if (isOwner) {
      await persistOwnerRecordsForUid(uid);
    }

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user account.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('Failed to load user profile.', { cause: error });
  }
}
