import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { and, desc, eq, sql } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import { db } from './src/db/index.ts';
import {
  admissionRequirements,
  cities,
  countries,
  paperJournalStates,
  paymentTransactions,
  programs,
  rankings,
  researchLibraryWorkspaces,
  researchResources,
  savedUniversities,
  scholarships,
  subscriptionRecords,
  universities,
  userAdmissionChecklists,
  userJourneyTasks,
  userNotifications,
  userScholarships,
  userWorkspaceExtensions,
  users,
} from './src/db/schema.ts';
import { ensureCatalogSeeded } from './src/db/seed.ts';
import {
  CURRENCY_REFERENCE_RATES,
  getUniversityCampusImageUrl,
} from './src/data/seedCatalog.ts';
import {
  discoverCountryUniversities,
  discoverUniversityVideos,
} from './src/services/explorerServerService.ts';
import {
  getCityUniversitiesPaginated,
  getCountryUniversitiesPaginated,
  getGlobalUniversityDetail,
  listGlobalCountries,
  searchGlobalCities,
  searchGlobalScholarships,
  searchGlobalUniversities,
} from './src/services/globalDirectoryService.ts';
import {
  analyzeMaterialWithGemini,
  crossAnalyzeLibraryWithGemini,
  generateStudyScheduleWithGemini,
  inspectWebResourceUrl,
} from './src/services/researchLibraryServerService.ts';
import { optionalAuth, requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  enforceActorQuota,
  generateGoalStrategyWithGemini,
  generateRoadmapWithGemini,
  generateRoutineWithGemini,
  generateTodoRecommendationsWithGemini,
  getActorUsage,
  incrementActorUsage,
  orchestrateAdvisorRequest,
  recommendCertificatesWithGemini,
} from './src/services/multiAgentOrchestratorService.ts';
import {
  checkActiveGoalQuota,
  getTierEntitlements,
  type SubscriptionTierId,
} from './src/utils/entitlements.ts';
import {
  getAuthoritativeAccountAccess,
  provisionPlatformOwnerGrant,
} from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '16mb' }));

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    databaseConfigured: Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME),
  });
});

app.get('/api/catalog', async (_req, res) => {
  try {
    await ensureCatalogSeeded();
    const [
      countryRows,
      cityRows,
      universityRows,
      programRows,
      rankingRows,
      scholarshipRows,
      admissionRows,
    ] = await Promise.all([
      db.select().from(countries),
      db.select().from(cities),
      db.select().from(universities),
      db.select().from(programs),
      db.select().from(rankings),
      db.select().from(scholarships),
      db.select().from(admissionRequirements),
    ]);

    const enrichedUniversities = universityRows.map((row) => ({
      ...row,
      imageUrl: getUniversityCampusImageUrl(row.slug),
    }));

    res.json({
      countries: countryRows,
      cities: cityRows,
      universities: enrichedUniversities,
      programs: programRows,
      rankings: rankingRows,
      scholarships: scholarshipRows,
      admissions: admissionRows,
      currencyRates: CURRENCY_REFERENCE_RATES,
    });
  } catch (error) {
    console.error('Failed to load catalog:', error);
    res.status(500).json({ error: 'Unable to load academic catalog from PostgreSQL.' });
  }
});

app.get('/api/currency-rates', async (_req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('https://api.frankfurter.app/latest?from=USD', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = (await resp.json()) as {
        date?: string;
        rates?: Record<string, number>;
      };
      if (data?.rates) {
        return res.json({
          updatedAt: data.date || CURRENCY_REFERENCE_RATES.updatedAt,
          sourceOrg: 'European Central Bank (via Frankfurter API)',
          isLive: true,
          ratesFromUsd: {
            ...CURRENCY_REFERENCE_RATES.ratesFromUsd,
            ...data.rates,
            USD: 1,
          },
        });
      }
    }
  } catch {
    // Fall back to curated reference benchmark below
  }

  res.json({
    ...CURRENCY_REFERENCE_RATES,
    isLive: false,
  });
});

// Dynamic Global University Discovery (OpenAlex + Wikipedia) for any country on the 3D Earth
app.get('/api/explorer/country', async (req, res) => {
  const iso2 = typeof req.query.iso2 === 'string' ? req.query.iso2 : '';
  const name = typeof req.query.name === 'string' ? req.query.name : iso2;
  if (!iso2 || !/^[A-Za-z]{2}$/.test(iso2.trim())) {
    return res.status(400).json({ error: 'Valid 2-letter ISO country code (iso2) is required.' });
  }
  try {
    const universitiesList = await discoverCountryUniversities(iso2, name);
    res.json({
      iso2: iso2.trim().toUpperCase(),
      universities: universitiesList,
      source: 'OpenAlex & Wikipedia Institutional Registry',
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dynamic country university discovery error:', error);
    res.status(500).json({ error: 'Unable to retrieve university registry for this country.' });
  }
});

// Authentic University Campus & Drone Video Discovery (YouTube Search + oEmbed verification)
app.get('/api/explorer/videos', async (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  const shortName = typeof req.query.shortName === 'string' ? req.query.shortName.trim() : '';
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  if (!name) {
    return res.status(400).json({ error: 'University name query parameter is required.' });
  }
  try {
    const media = await discoverUniversityVideos({
      universityName: name,
      shortName: shortName || undefined,
      city: city || undefined,
    });
    res.json(media);
  } catch (error) {
    console.error('Authentic video discovery error:', error);
    res.status(500).json({ error: 'Unable to retrieve verified campus media.' });
  }
});

// =========================================================================
// SCALABLE GLOBAL HIGHER-EDUCATION DIRECTORY & INTELLIGENT SEARCH APIS
// =========================================================================

app.get('/api/global/countries', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const continent = typeof req.query.continent === 'string' ? req.query.continent : 'All';
    const data = await listGlobalCountries({ q, continent });
    res.json(data);
  } catch (error) {
    console.error('Global countries lookup error:', error);
    res.status(500).json({ error: 'Unable to load global countries directory.' });
  }
});

app.get('/api/global/countries/:iso2/universities', async (req, res) => {
  const iso2 = String(req.params.iso2 || '').trim();
  if (!/^[A-Za-z]{2}$/.test(iso2)) {
    return res.status(400).json({ error: 'Valid 2-letter ISO country code is required.' });
  }
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const city = typeof req.query.city === 'string' ? req.query.city : '';
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'prominence';
    const sort = sortRaw === 'name' || sortRaw === 'citations' ? sortRaw : 'prominence';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    const data = await getCountryUniversitiesPaginated({
      iso2,
      q,
      city,
      sort,
      page,
      limit,
    });
    res.json(data);
  } catch (error) {
    console.error('Global country universities error:', error);
    res.status(500).json({ error: 'Unable to load universities for this country.' });
  }
});

app.get('/api/global/universities', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const country = typeof req.query.country === 'string' ? req.query.country : '';
    const city = typeof req.query.city === 'string' ? req.query.city : '';
    const continent = typeof req.query.continent === 'string' ? req.query.continent : '';
    const type = typeof req.query.type === 'string' ? req.query.type : '';
    const field = typeof req.query.field === 'string' ? req.query.field : '';
    const hasRanking = req.query.hasRanking === 'true' || req.query.hasRanking === '1';
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : '';
    const sort =
      sortRaw === 'relevance' || sortRaw === 'rank' || sortRaw === 'name' || sortRaw === 'citations'
        ? sortRaw
        : undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    const data = await searchGlobalUniversities({
      q,
      country,
      city,
      continent,
      type,
      field,
      hasRanking,
      sort,
      page,
      limit,
    });
    res.json(data);
  } catch (error) {
    console.error('Global universities search error:', error);
    res.status(500).json({ error: 'Unable to search global university registry.' });
  }
});

app.get('/api/global/universities/:slug', async (req, res) => {
  const slug = String(req.params.slug || '').trim();
  if (!slug || slug.length > 120 || !/^[A-Za-z0-9_-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Invalid university identifier.' });
  }
  try {
    const detail = await getGlobalUniversityDetail(slug);
    if (!detail) {
      return res.status(404).json({ error: 'University not found in verified registries.' });
    }
    res.json(detail);
  } catch (error) {
    console.error('Global university detail error:', error);
    res.status(500).json({ error: 'Unable to load university detail profile.' });
  }
});

app.get('/api/global/cities', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const country = typeof req.query.country === 'string' ? req.query.country : '';
    const data = await searchGlobalCities({ q, country });
    res.json(data);
  } catch (error) {
    console.error('Global cities lookup error:', error);
    res.status(500).json({ error: 'Unable to search global student cities.' });
  }
});

app.get('/api/global/cities/universities', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  if (!city) {
    return res.status(400).json({ error: 'City query parameter is required.' });
  }
  try {
    const country = typeof req.query.country === 'string' ? req.query.country : '';
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'prominence';
    const sort = sortRaw === 'name' || sortRaw === 'citations' ? sortRaw : 'prominence';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;

    const data = await getCityUniversitiesPaginated({
      city,
      country,
      q,
      sort,
      page,
      limit,
    });
    res.json(data);
  } catch (error) {
    console.error('Global city universities error:', error);
    res.status(500).json({ error: 'Unable to load universities for this city.' });
  }
});

app.get('/api/global/scholarships', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const country = typeof req.query.country === 'string' ? req.query.country : 'all';
    const degree = typeof req.query.degree === 'string' ? req.query.degree : 'all';
    const fundingType = typeof req.query.fundingType === 'string' ? req.query.fundingType : 'all';
    const status = typeof req.query.status === 'string' ? req.query.status : 'all';
    const field = typeof req.query.field === 'string' ? req.query.field : 'all';
    const nationality = typeof req.query.nationality === 'string' ? req.query.nationality : 'all';

    const data = await searchGlobalScholarships({
      q,
      country,
      degree,
      fundingType,
      status,
      field,
      nationality,
    });
    res.json(data);
  } catch (error) {
    console.error('Global scholarships search error:', error);
    res.status(500).json({ error: 'Unable to load verified scholarships.' });
  }
});

// User Workspace Bootstrap (Authenticated)
app.get('/api/user/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  try {
    const [
      profileRows,
      savedUniRows,
      journeyRows,
      checklistRows,
      scholarshipRows,
      researchRows,
      notificationRows,
      subscriptionRows,
      paymentRows,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.uid, uid)).limit(1),
      db.select().from(savedUniversities).where(eq(savedUniversities.userUid, uid)),
      db
        .select()
        .from(userJourneyTasks)
        .where(eq(userJourneyTasks.userUid, uid))
        .orderBy(desc(userJourneyTasks.createdAt)),
      db.select().from(userAdmissionChecklists).where(eq(userAdmissionChecklists.userUid, uid)),
      db.select().from(userScholarships).where(eq(userScholarships.userUid, uid)),
      db
        .select()
        .from(researchResources)
        .where(eq(researchResources.userUid, uid))
        .orderBy(desc(researchResources.createdAt)),
      db
        .select()
        .from(userNotifications)
        .where(eq(userNotifications.userUid, uid))
        .orderBy(desc(userNotifications.createdAt)),
      db.select().from(subscriptionRecords).where(eq(subscriptionRecords.userUid, uid)).limit(1),
      db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userUid, uid))
        .orderBy(desc(paymentTransactions.createdAt)),
    ]);

    const access = await getAuthoritativeAccountAccess(uid, req.user?.email);
    const rawProfile = profileRows[0] ?? null;
    const enrichedProfile = rawProfile
      ? {
          ...rawProfile,
          subscriptionTier: access.tier,
          role: access.role,
          isOwner: access.isOwner,
          billingExempt: access.billingExempt,
          subscriptionStatus: access.subscriptionStatus,
        }
      : null;

    const effectiveSubscription = access.isOwner
      ? {
          userUid: uid,
          tier: 'premium',
          status: 'permanent_owner',
          provider: 'platform_owner',
          billingCycle: 'lifetime',
          expiresAt: null,
          billingExempt: true,
        }
      : subscriptionRows[0] ?? {
          userUid: uid,
          tier: access.tier,
          status: 'active',
          provider: 'none',
          billingCycle: 'monthly',
          expiresAt: null,
          billingExempt: false,
        };

    res.json({
      profile: enrichedProfile,
      savedUniversities: savedUniRows,
      journeyTasks: journeyRows,
      admissionChecklists: checklistRows,
      savedScholarships: scholarshipRows,
      researchResources: researchRows,
      notifications: notificationRows,
      subscription: effectiveSubscription,
      payments: paymentRows,
      access: {
        role: access.role,
        isOwner: access.isOwner,
        tier: access.tier,
        billingExempt: access.billingExempt,
        unlimitedQuotas: access.unlimitedQuotas,
        expiresAt: access.expiresAt,
      },
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Failed to load user workspace.' });
  }
});

app.patch('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const {
    firstName,
    lastName,
    displayName,
    avatarUrl,
    country,
    city,
    preferredLanguage,
    appearanceMode,
    currentEducationLevel,
    targetDegree,
    targetDisciplines,
    targetCountries,
    accountType,
    onboardingCompleted,
    notificationPrefs,
  } = req.body ?? {};

  const sanitizedFirstName =
    typeof firstName === 'string' ? firstName.trim().slice(0, 60) : undefined;
  const sanitizedLastName =
    typeof lastName === 'string' ? lastName.trim().slice(0, 60) : undefined;
  const computedDisplayName =
    typeof displayName === 'string' && displayName.trim()
      ? displayName.trim().slice(0, 120)
      : sanitizedFirstName !== undefined || sanitizedLastName !== undefined
      ? [sanitizedFirstName ?? '', sanitizedLastName ?? ''].filter(Boolean).join(' ').slice(0, 120)
      : undefined;

  try {
    const updated = await db
      .update(users)
      .set({
        ...(sanitizedFirstName !== undefined ? { firstName: sanitizedFirstName } : {}),
        ...(sanitizedLastName !== undefined ? { lastName: sanitizedLastName } : {}),
        ...(computedDisplayName !== undefined ? { displayName: computedDisplayName } : {}),
        ...(typeof avatarUrl === 'string' ? { avatarUrl: avatarUrl.slice(0, 500) } : {}),
        ...(typeof country === 'string' ? { country: country.trim().slice(0, 80) } : {}),
        ...(typeof city === 'string' ? { city: city.trim().slice(0, 80) } : {}),
        ...(typeof preferredLanguage === 'string' ? { preferredLanguage } : {}),
        ...(typeof appearanceMode === 'string' ? { appearanceMode } : {}),
        ...(typeof currentEducationLevel === 'string' ? { currentEducationLevel } : {}),
        ...(typeof targetDegree === 'string' ? { targetDegree } : {}),
        ...(Array.isArray(targetDisciplines) ? { targetDisciplines } : {}),
        ...(Array.isArray(targetCountries) ? { targetCountries } : {}),
        ...(typeof accountType === 'string' ? { accountType } : {}),
        ...(typeof onboardingCompleted === 'boolean' ? { onboardingCompleted } : {}),
        ...(notificationPrefs && typeof notificationPrefs === 'object' ? { notificationPrefs } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    res.json({ profile: updated[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.get('/api/user/export', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  try {
    const [profileRows, savedUniRows, journeyRows, scholarshipRows, researchRows] =
      await Promise.all([
        db.select().from(users).where(eq(users.uid, uid)).limit(1),
        db.select().from(savedUniversities).where(eq(savedUniversities.userUid, uid)),
        db.select().from(userJourneyTasks).where(eq(userJourneyTasks.userUid, uid)),
        db.select().from(userScholarships).where(eq(userScholarships.userUid, uid)),
        db.select().from(researchResources).where(eq(researchResources.userUid, uid)),
      ]);

    res.json({
      exportedAt: new Date().toISOString(),
      platform: 'Global University Intelligence',
      profile: profileRows[0] ?? null,
      savedUniversities: savedUniRows,
      journeyTasks: journeyRows,
      savedScholarships: scholarshipRows,
      researchResources: researchRows,
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export account data.' });
  }
});

app.delete('/api/user/account', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  try {
    await db.delete(users).where(eq(users.uid, uid));
    res.json({ deleted: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete user data.' });
  }
});

// Saved Universities
app.post('/api/user/saved-universities', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { universitySlug, collectionName, priority, applicationStatus, personalNotes } =
    req.body ?? {};

  if (!universitySlug || typeof universitySlug !== 'string') {
    return res.status(400).json({ error: 'universitySlug is required.' });
  }

  try {
    const rows = await db
      .insert(savedUniversities)
      .values({
        userUid: uid,
        universitySlug,
        collectionName: collectionName || 'Shortlist',
        priority: priority || 'Target',
        applicationStatus: applicationStatus || 'Researching',
        personalNotes: personalNotes || '',
      })
      .onConflictDoUpdate({
        target: [savedUniversities.userUid, savedUniversities.universitySlug],
        set: {
          ...(collectionName ? { collectionName } : {}),
          ...(priority ? { priority } : {}),
          ...(applicationStatus ? { applicationStatus } : {}),
          ...(typeof personalNotes === 'string' ? { personalNotes } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json({ item: rows[0] });
  } catch (error) {
    console.error('Save university error:', error);
    res.status(500).json({ error: 'Failed to save university.' });
  }
});

app.delete('/api/user/saved-universities/:slug', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const slug = String(req.params.slug);
  try {
    await db
      .delete(savedUniversities)
      .where(
        and(eq(savedUniversities.userUid, uid), eq(savedUniversities.universitySlug, slug))
      );
    res.json({ removed: true });
  } catch (error) {
    console.error('Remove university error:', error);
    res.status(500).json({ error: 'Failed to remove saved university.' });
  }
});

// Journey Tasks
app.post('/api/user/journey-tasks', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { title, category, targetUniversitySlug, dueDate, status, notes } = req.body ?? {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required.' });
  }
  try {
    const rows = await db
      .insert(userJourneyTasks)
      .values({
        userUid: uid,
        title: title.trim(),
        category: category || 'Milestone',
        targetUniversitySlug: targetUniversitySlug || null,
        dueDate: dueDate || null,
        status: status || 'pending',
        notes: notes || '',
      })
      .returning();
    res.json({ task: rows[0] });
  } catch (error) {
    console.error('Create journey task error:', error);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

app.patch('/api/user/journey-tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const id = Number(req.params.id);
  const { status, title, notes, dueDate } = req.body ?? {};
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }
  try {
    const rows = await db
      .update(userJourneyTasks)
      .set({
        ...(status ? { status } : {}),
        ...(title ? { title } : {}),
        ...(typeof notes === 'string' ? { notes } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      })
      .where(and(eq(userJourneyTasks.id, id), eq(userJourneyTasks.userUid, uid)))
      .returning();
    res.json({ task: rows[0] });
  } catch (error) {
    console.error('Update journey task error:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

app.delete('/api/user/journey-tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }
  try {
    await db
      .delete(userJourneyTasks)
      .where(and(eq(userJourneyTasks.id, id), eq(userJourneyTasks.userUid, uid)));
    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete journey task error:', error);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// Admission Checklist Toggle
app.post('/api/user/checklists/toggle', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { universitySlug, requirementKey, label, completed } = req.body ?? {};
  if (!universitySlug || !requirementKey || !label) {
    return res.status(400).json({ error: 'Checklist parameters required.' });
  }
  try {
    const rows = await db
      .insert(userAdmissionChecklists)
      .values({
        userUid: uid,
        universitySlug,
        requirementKey,
        label,
        completed: Boolean(completed),
      })
      .onConflictDoUpdate({
        target: [
          userAdmissionChecklists.userUid,
          userAdmissionChecklists.universitySlug,
          userAdmissionChecklists.requirementKey,
        ],
        set: {
          completed: Boolean(completed),
          label,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ item: rows[0] });
  } catch (error) {
    console.error('Checklist toggle error:', error);
    res.status(500).json({ error: 'Failed to update checklist item.' });
  }
});

// Scholarships Tracking
app.post('/api/user/scholarships', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { scholarshipSlug, status, notes } = req.body ?? {};
  if (!scholarshipSlug) {
    return res.status(400).json({ error: 'scholarshipSlug required.' });
  }
  try {
    const rows = await db
      .insert(userScholarships)
      .values({
        userUid: uid,
        scholarshipSlug,
        status: status || 'Saved',
        notes: notes || '',
      })
      .onConflictDoUpdate({
        target: [userScholarships.userUid, userScholarships.scholarshipSlug],
        set: {
          ...(status ? { status } : {}),
          ...(typeof notes === 'string' ? { notes } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ item: rows[0] });
  } catch (error) {
    console.error('Save scholarship error:', error);
    res.status(500).json({ error: 'Failed to save scholarship.' });
  }
});

app.delete('/api/user/scholarships/:slug', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const slug = String(req.params.slug);
  try {
    await db
      .delete(userScholarships)
      .where(and(eq(userScholarships.userUid, uid), eq(userScholarships.scholarshipSlug, slug)));
    res.json({ removed: true });
  } catch (error) {
    console.error('Delete scholarship error:', error);
    res.status(500).json({ error: 'Failed to remove scholarship.' });
  }
});

// Research Library
app.post('/api/user/research-resources', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { title, url, folder, tags, universitySlug, notes } = req.body ?? {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Resource title is required.' });
  }
  try {
    const rows = await db
      .insert(researchResources)
      .values({
        userUid: uid,
        title: title.trim(),
        url: url || '',
        folder: folder || 'General Research',
        tagsJson: Array.isArray(tags) ? tags : [],
        universitySlug: universitySlug || null,
        notes: notes || '',
      })
      .returning();
    res.json({ resource: rows[0] });
  } catch (error) {
    console.error('Create research resource error:', error);
    res.status(500).json({ error: 'Failed to save research resource.' });
  }
});

app.delete('/api/user/research-resources/:id', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid resource ID.' });
  }
  try {
    await db
      .delete(researchResources)
      .where(and(eq(researchResources.id, id), eq(researchResources.userUid, uid)));
    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete research resource error:', error);
    res.status(500).json({ error: 'Failed to delete research resource.' });
  }
});

app.patch('/api/user/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid notification ID.' });
  }
  try {
    await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(and(eq(userNotifications.id, id), eq(userNotifications.userUid, uid)));
    res.json({ updated: true });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Paper Journal Persistence (Authenticated PostgreSQL)
async function ensurePaperJournalTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS paper_journal_states (
        id serial PRIMARY KEY,
        user_uid text NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
        state_json jsonb NOT NULL,
        updated_at timestamp DEFAULT now()
      )
    `);
  } catch {
    // Table is already managed by Drizzle schema migrations
  }
}

app.get('/api/user/journal', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  try {
    await ensurePaperJournalTable();
    const rows = await db
      .select()
      .from(paperJournalStates)
      .where(eq(paperJournalStates.userUid, uid))
      .limit(1);
    res.json({ state: rows[0]?.stateJson ?? null, updatedAt: rows[0]?.updatedAt ?? null });
  } catch (error) {
    console.error('Paper journal load error:', error);
    res.status(500).json({ error: 'Failed to load Paper Journal state.' });
  }
});

app.put('/api/user/journal', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { state } = req.body ?? {};
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'Valid journal state object is required.' });
  }
  try {
    await ensurePaperJournalTable();
    const rows = await db
      .insert(paperJournalStates)
      .values({
        userUid: uid,
        stateJson: state as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: paperJournalStates.userUid,
        set: {
          stateJson: state as Record<string, unknown>,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ ok: true, updatedAt: rows[0]?.updatedAt ?? new Date().toISOString() });
  } catch (error) {
    console.error('Paper journal save error:', error);
    res.status(500).json({ error: 'Failed to persist Paper Journal state.' });
  }
});

// Intelligent Research Library Persistence & AI Analysis
async function ensureResearchLibraryTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS research_library_workspaces (
        id serial PRIMARY KEY,
        user_uid text NOT NULL UNIQUE REFERENCES users(uid) ON DELETE CASCADE,
        state_json jsonb NOT NULL,
        updated_at timestamp DEFAULT now()
      )
    `);
  } catch {
    // Table is already managed by Drizzle schema migrations
  }
}

app.get('/api/user/library-workspace', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  try {
    await ensureResearchLibraryTable();
    const rows = await db
      .select()
      .from(researchLibraryWorkspaces)
      .where(eq(researchLibraryWorkspaces.userUid, uid))
      .limit(1);
    res.json({ state: rows[0]?.stateJson ?? null, updatedAt: rows[0]?.updatedAt ?? null });
  } catch (error) {
    console.error('Research library workspace load error:', error);
    res.status(500).json({ error: 'Failed to load Research Library workspace.' });
  }
});

app.put('/api/user/library-workspace', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { state } = req.body ?? {};
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'Valid library workspace state object is required.' });
  }
  try {
    await ensureResearchLibraryTable();
    const rows = await db
      .insert(researchLibraryWorkspaces)
      .values({
        userUid: uid,
        stateJson: state as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: researchLibraryWorkspaces.userUid,
        set: {
          stateJson: state as Record<string, unknown>,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ ok: true, updatedAt: rows[0]?.updatedAt ?? new Date().toISOString() });
  } catch (error) {
    console.error('Research library workspace save error:', error);
    res.status(500).json({ error: 'Failed to persist Research Library workspace.' });
  }
});

app.post('/api/library/inspect-url', async (req, res) => {
  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ ok: false, error: 'A valid HTTP/HTTPS URL is required.' });
  }
  const result = await inspectWebResourceUrl(url);
  res.json(result);
});

app.post('/api/library/analyze', async (req, res) => {
  const { material, binaryBase64, binaryMimeType, otherMaterialTitles } = req.body ?? {};
  if (!material || typeof material !== 'object') {
    return res.status(400).json({ error: 'Material payload is required.' });
  }
  if (!geminiClient) {
    return res.status(503).json({
      error:
        'AI Material Analysis requires GEMINI_API_KEY configured on the server environment.',
    });
  }
  try {
    const analysis = await analyzeMaterialWithGemini({
      ai: geminiClient,
      material,
      binaryBase64: typeof binaryBase64 === 'string' ? binaryBase64 : undefined,
      binaryMimeType: typeof binaryMimeType === 'string' ? binaryMimeType : undefined,
      otherMaterialTitles: Array.isArray(otherMaterialTitles) ? otherMaterialTitles : [],
    });
    res.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to analyze material.';
    const isUnreadable = message.toLowerCase().includes('readable material content');
    res.status(isUnreadable ? 422 : 502).json({ error: message });
  }
});

app.post('/api/library/cross-analyze', async (req, res) => {
  const { materials } = req.body ?? {};
  if (!Array.isArray(materials)) {
    return res.status(400).json({ error: 'Materials list is required.' });
  }
  if (!geminiClient) {
    return res.status(503).json({
      error:
        'Cross-material AI intelligence requires GEMINI_API_KEY configured on the server environment.',
    });
  }
  try {
    const crossAnalysis = await crossAnalyzeLibraryWithGemini({
      ai: geminiClient,
      materials,
    });
    res.json({ crossAnalysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to run cross-material analysis.';
    const isInsufficient = message.toLowerCase().includes('analyze at least');
    res.status(isInsufficient ? 422 : 502).json({ error: message });
  }
});

app.post('/api/library/generate-schedule', async (req, res) => {
  const { materials, prerequisiteLinks, preferences, existingManualSessions } = req.body ?? {};
  if (!Array.isArray(materials) || !preferences || typeof preferences !== 'object') {
    return res.status(400).json({ error: 'Materials and schedule preferences are required.' });
  }
  if (!geminiClient) {
    return res.status(503).json({
      error:
        'AI Study Planner requires GEMINI_API_KEY configured on the server environment.',
    });
  }
  try {
    const result = await generateStudyScheduleWithGemini({
      ai: geminiClient,
      materials,
      prerequisiteLinks: Array.isArray(prerequisiteLinks) ? prerequisiteLinks : [],
      preferences,
      existingManualSessions: Array.isArray(existingManualSessions) ? existingManualSessions : [],
    });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to generate study schedule.';
    const isInsufficient = message.toLowerCase().includes('analyze at least');
    res.status(isInsufficient ? 422 : 502).json({ error: message });
  }
});

// Honest Payment Provider Status & Architecture
app.get('/api/payments/config', (_req, res) => {
  const providers = [
    {
      id: 'stripe_cards',
      name: 'Visa & Mastercard (Stripe Checkout)',
      region: 'Global',
      configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      requiredEnvVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
      mode: 'Hosted Checkout + Webhook Verification',
    },
    {
      id: 'payme',
      name: 'Payme (Uzcard & HUMO)',
      region: 'Uzbekistan',
      configured: Boolean(process.env.PAYME_MERCHANT_ID && process.env.PAYME_SECRET_KEY),
      requiredEnvVars: ['PAYME_MERCHANT_ID', 'PAYME_SECRET_KEY'],
      mode: 'Merchant JSON-RPC + Hosted Redirect',
    },
    {
      id: 'click',
      name: 'Click (Uzcard & HUMO)',
      region: 'Uzbekistan',
      configured: Boolean(process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY),
      requiredEnvVars: ['CLICK_SERVICE_ID', 'CLICK_MERCHANT_ID', 'CLICK_SECRET_KEY'],
      mode: 'Prepare/Complete Signed Webhook',
    },
    {
      id: 'uzum',
      name: 'Uzum Bank Checkout',
      region: 'Uzbekistan',
      configured: Boolean(process.env.UZUM_TERMINAL_ID && process.env.UZUM_API_KEY),
      requiredEnvVars: ['UZUM_TERMINAL_ID', 'UZUM_API_KEY'],
      mode: 'Tokenized Hosted Payment Flow',
    },
  ];
  res.json({ providers });
});

app.post('/api/payments/checkout', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { tier, providerId, billingCycle } = req.body ?? {};

  const access = await getAuthoritativeAccountAccess(uid, req.user?.email);
  if (access.isOwner) {
    return res.json({
      status: 'permanent_owner',
      tier: 'premium',
      isOwner: true,
      billingExempt: true,
      message:
        'Platform Owner account holds permanent Global Elite Pro access with no billing or recurring payments required.',
    });
  }

  if (tier === 'free') {
    try {
      await db
        .insert(subscriptionRecords)
        .values({
          userUid: uid,
          tier: 'free',
          status: 'active',
          provider: 'none',
          billingCycle: 'monthly',
        })
        .onConflictDoUpdate({
          target: subscriptionRecords.userUid,
          set: { tier: 'free', status: 'active', provider: 'none', updatedAt: new Date() },
        });
      await db
        .update(users)
        .set({ subscriptionTier: 'free', updatedAt: new Date() })
        .where(eq(users.uid, uid));
      return res.json({ status: 'updated', tier: 'free' });
    } catch (error) {
      console.error('Free tier switch error:', error);
      return res.status(500).json({ error: 'Unable to update subscription tier.' });
    }
  }

  return res.status(501).json({
    error: `Payment provider "${providerId || 'selected provider'}" is not configured with live merchant credentials in this environment.`,
    requiresConfiguration: true,
    requestedTier: tier,
    billingCycle: billingCycle || 'monthly',
  });
});

async function resolveActorIdentity(req: AuthRequest): Promise<{
  actorKey: string;
  tier: SubscriptionTierId;
  isGuest: boolean;
  isOwner: boolean;
  role: 'owner' | 'user';
  billingExempt: boolean;
  unlimitedQuotas: boolean;
  expiresAt: string | null;
}> {
  if (req.user?.uid) {
    const access = await getAuthoritativeAccountAccess(req.user.uid, req.user.email);
    return {
      actorKey: `uid:${req.user.uid}`,
      tier: access.tier,
      isGuest: false,
      isOwner: access.isOwner,
      role: access.role,
      billingExempt: access.billingExempt,
      unlimitedQuotas: access.unlimitedQuotas,
      expiresAt: access.expiresAt,
    };
  }
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : '') ||
    req.socket?.remoteAddress ||
    'guest-local';
  return {
    actorKey: `guest:${ip}`,
    tier: 'free',
    isGuest: true,
    isOwner: false,
    role: 'user',
    billingExempt: false,
    unlimitedQuotas: false,
    expiresAt: null,
  };
}

// Non-destructive Workspace Extensions Persistence (Roadmap, Routine, To-Do AI Suggestions, Agent Logs, Creator Profile)
app.get('/api/user/workspace-extensions', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  try {
    const rows = await db
      .select()
      .from(userWorkspaceExtensions)
      .where(eq(userWorkspaceExtensions.userUid, uid))
      .limit(1);
    res.json({
      state: rows[0]?.stateJson ?? null,
      updatedAt: rows[0]?.updatedAt ?? null,
    });
  } catch (error) {
    console.error('Workspace extensions load error:', error);
    res.status(500).json({ error: 'Failed to load workspace extensions.' });
  }
});

app.put('/api/user/workspace-extensions', requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user!.uid;
  const { state } = req.body ?? {};
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'Valid workspace extension state object is required.' });
  }
  try {
    const actor = await resolveActorIdentity(req);
    const incomingGoals = (state as { goalsState?: { goals?: Array<{ lifecycleOverride?: string }> } })
      ?.goalsState?.goals;
    if (Array.isArray(incomingGoals) && !actor.isOwner) {
      const activeGoalsCount = incomingGoals.filter(
        (g) => g && g.lifecycleOverride !== 'achieved' && g.lifecycleOverride !== 'archived'
      ).length;
      const goalQuota = checkActiveGoalQuota(actor.tier, activeGoalsCount, false);
      if (activeGoalsCount > goalQuota.limit) {
        return res.status(403).json({
          error: `Active goal limit (${goalQuota.limit}) exceeded for your current plan. Archive or complete an existing goal, or upgrade your plan.`,
          quota: goalQuota,
        });
      }
    }

    const rows = await db
      .insert(userWorkspaceExtensions)
      .values({
        userUid: uid,
        stateJson: state as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userWorkspaceExtensions.userUid,
        set: {
          stateJson: state as Record<string, unknown>,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ ok: true, updatedAt: rows[0]?.updatedAt ?? new Date().toISOString() });
  } catch (error) {
    console.error('Workspace extensions save error:', error);
    res.status(500).json({ error: 'Failed to persist workspace extensions.' });
  }
});

// Server-enforced Entitlements & Quota Status
app.get('/api/entitlements/status', optionalAuth, async (req: AuthRequest, res) => {
  const actor = await resolveActorIdentity(req);
  const entitlements = getTierEntitlements(actor.tier);
  const usage = getActorUsage(actor.actorKey);
  res.json({
    tier: actor.tier,
    isGuest: actor.isGuest,
    isOwner: actor.isOwner,
    role: actor.role,
    billingExempt: actor.billingExempt,
    unlimitedQuotas: actor.unlimitedQuotas,
    expiresAt: actor.expiresAt,
    entitlements,
    usage,
  });
});

// Server-Side 10-Agent Central AI Orchestrator (optionalAuth with explicit guest quota enforcement)
app.post('/api/ai/advisor', optionalAuth, async (req: AuthRequest, res) => {
  const { message, history, userContext, language, preferredAgentId, preferredTeamId } =
    req.body ?? {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Question message is required.' });
  }

  if (!geminiClient) {
    return res.status(503).json({
      error: 'AI Maslahatchi requires GEMINI_API_KEY configured on the server environment.',
    });
  }

  const actor = await resolveActorIdentity(req);
  const quotaCheck = enforceActorQuota(actor.actorKey, actor.tier, 'ai_message', actor.isOwner);
  if (!quotaCheck.quota.allowed) {
    return res.status(429).json({
      error: quotaCheck.quota.reason,
      quota: quotaCheck.quota,
      tier: actor.tier,
    });
  }

  try {
    await ensureCatalogSeeded();
    const [uniRows, scholRows] = await Promise.all([
      db.select().from(universities),
      db.select().from(scholarships),
    ]);

    const result = await orchestrateAdvisorRequest({
      ai: geminiClient,
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      userContext: userContext && typeof userContext === 'object' ? userContext : {},
      language: typeof language === 'string' ? language : 'en',
      tier: actor.tier,
      preferredAgentId: typeof preferredAgentId === 'string' ? (preferredAgentId as never) : null,
      preferredTeamId: typeof preferredTeamId === 'string' ? (preferredTeamId as never) : null,
      universities: uniRows.map((u) => ({
        slug: u.slug,
        name: u.name,
        shortName: u.shortName,
        citySlug: u.citySlug,
        countryCode: u.countryCode,
        institutionType: u.institutionType,
        primaryLanguage: u.primaryLanguage,
        tuitionLocalDisplay: u.tuitionLocalDisplay,
        academicStrengthsJson: u.academicStrengthsJson,
        officialWebsite: u.officialWebsite,
        verificationStatus: u.verificationStatus,
      })),
      scholarships: scholRows.map((s) => ({
        slug: s.slug,
        name: s.name,
        countryCode: s.countryCode,
        degreeLevelsJson: s.degreeLevelsJson,
        deadlineText: s.deadlineText,
        coverageSummary: s.coverageSummary,
        officialUrl: s.officialUrl,
      })),
    });

    const updatedUsage = incrementActorUsage(actor.actorKey, 'ai_message');
    res.json({
      ...result,
      tier: actor.tier,
      usage: updatedUsage,
      quota: {
        used: updatedUsage.aiMessagesToday,
        limit: quotaCheck.entitlements.dailyAiMessages,
        remaining: Math.max(0, quotaCheck.entitlements.dailyAiMessages - updatedUsage.aiMessagesToday),
      },
    });
  } catch (error: unknown) {
    console.error('AI Orchestrator error:', error);
    const errMsg = error instanceof Error ? error.message : 'Upstream AI service error';
    res.status(502).json({
      error: `AI Maslahatchi encountered an error: ${errMsg}`,
    });
  }
});

// Academic Cartographer Agent Route Generation
app.post('/api/ai/generate-roadmap', optionalAuth, async (req: AuthRequest, res) => {
  if (!geminiClient) {
    return res.status(503).json({
      error: 'Academic Cartographer Agent requires GEMINI_API_KEY configured on the server.',
    });
  }

  const actor = await resolveActorIdentity(req);
  const quotaCheck = enforceActorQuota(actor.actorKey, actor.tier, 'roadmap', actor.isOwner);
  if (!quotaCheck.quota.allowed) {
    return res.status(429).json({
      error: quotaCheck.quota.reason,
      quota: quotaCheck.quota,
    });
  }

  const {
    originCountry,
    originEducationLevel,
    targetCountry,
    targetUniversityName,
    targetDegree,
    targetDiscipline,
    mode,
    language,
  } = req.body ?? {};

  const safeMode = mode === 'transfer' || mode === 'scholarship' ? mode : 'direct';
  try {
    const generated = await generateRoadmapWithGemini({
      ai: geminiClient,
      originCountry: String(originCountry || 'Uzbekistan'),
      originEducationLevel: String(originEducationLevel || 'High School / Bachelor Prep'),
      targetCountry: String(targetCountry || 'Japan'),
      targetUniversityName: String(targetUniversityName || 'The University of Tokyo'),
      targetDegree: String(targetDegree || 'Bachelor'),
      targetDiscipline: String(targetDiscipline || 'Computer Science'),
      mode: safeMode,
      language: typeof language === 'string' ? language : 'en',
    });

    const updatedUsage = incrementActorUsage(actor.actorKey, 'roadmap');
    res.json({
      mode: safeMode,
      ...generated,
      usage: updatedUsage,
    });
  } catch (error: unknown) {
    console.error('Roadmap generation error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate academic roadmap.';
    res.status(502).json({ error: msg });
  }
});

// Smart Routine Architect Agent Schedule Generation
app.post('/api/ai/generate-routine', optionalAuth, async (req: AuthRequest, res) => {
  if (!geminiClient) {
    return res.status(503).json({
      error: 'Smart Routine Architect Agent requires GEMINI_API_KEY configured on the server.',
    });
  }

  const actor = await resolveActorIdentity(req);
  const quotaCheck = enforceActorQuota(actor.actorKey, actor.tier, 'routine', actor.isOwner);
  if (!quotaCheck.quota.allowed) {
    return res.status(429).json({
      error: quotaCheck.quota.reason,
      quota: quotaCheck.quota,
    });
  }

  const { horizon, focusGoal, dailyCapacityHours, targetUniversityName, language } = req.body ?? {};
  const safeHorizon =
    horizon === 'weekly' || horizon === 'monthly' || horizon === 'yearly' ? horizon : 'daily';

  try {
    const generated = await generateRoutineWithGemini({
      ai: geminiClient,
      horizon: safeHorizon,
      focusGoal: String(focusGoal || 'International University Admission Preparation'),
      dailyCapacityHours: Math.max(1, Math.min(10, Number(dailyCapacityHours) || 4)),
      targetUniversityName: typeof targetUniversityName === 'string' ? targetUniversityName : undefined,
      language: typeof language === 'string' ? language : 'en',
    });

    const updatedUsage = incrementActorUsage(actor.actorKey, 'routine');
    res.json({
      horizon: safeHorizon,
      ...generated,
      usage: updatedUsage,
    });
  } catch (error: unknown) {
    console.error('Routine generation error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate study routine.';
    res.status(502).json({ error: msg });
  }
});

// Task & Priority Orchestrator Agent To-Do Recommendations
app.post('/api/ai/todo-recommendations', optionalAuth, async (req: AuthRequest, res) => {
  if (!geminiClient) {
    return res.status(503).json({
      error: 'Task & Priority Orchestrator Agent requires GEMINI_API_KEY configured on the server.',
    });
  }

  const actor = await resolveActorIdentity(req);
  const quotaCheck = enforceActorQuota(actor.actorKey, actor.tier, 'todo', actor.isOwner);
  if (!quotaCheck.quota.allowed) {
    return res.status(429).json({
      error: quotaCheck.quota.reason,
      quota: quotaCheck.quota,
    });
  }

  const { userContext, existingTaskTitles, language } = req.body ?? {};
  try {
    const recommendations = await generateTodoRecommendationsWithGemini({
      ai: geminiClient,
      userContext: userContext && typeof userContext === 'object' ? userContext : {},
      existingTaskTitles: Array.isArray(existingTaskTitles) ? existingTaskTitles : [],
      language: typeof language === 'string' ? language : 'en',
    });

    const updatedUsage = incrementActorUsage(actor.actorKey, 'todo');
    res.json({
      recommendations: recommendations.map((rec, idx) => ({
        id: `todo-rec-${Date.now()}-${idx}`,
        ...rec,
        agentId: 'task_orchestrator',
        createdAt: new Date().toISOString(),
      })),
      usage: updatedUsage,
    });
  } catch (error: unknown) {
    console.error('To-Do recommendation error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate task recommendations.';
    res.status(502).json({ error: msg });
  }
});

// Maqsadlar AI Goal Strategist (coordinates existing 10-agent ecosystem)
app.post('/api/ai/goal-strategy', optionalAuth, async (req: AuthRequest, res) => {
  if (!geminiClient) {
    return res.status(503).json({
      error: 'AI Goal Strategist requires GEMINI_API_KEY configured on the server.',
    });
  }

  const actor = await resolveActorIdentity(req);
  const quotaCheck = enforceActorQuota(actor.actorKey, actor.tier, 'goal_strategy', actor.isOwner);
  if (!quotaCheck.quota.allowed) {
    return res.status(403).json({
      error: quotaCheck.quota.reason,
      quota: quotaCheck.quota,
      requiresUpgrade: quotaCheck.quota.limit === 0,
    });
  }

  const { goal, dailyStudyHours, workspaceContext, language } = req.body ?? {};
  if (!goal || typeof goal !== 'object') {
    return res.status(400).json({ error: 'Goal object is required.' });
  }

  try {
    const generated = await generateGoalStrategyWithGemini({
      ai: geminiClient,
      goal: goal as Record<string, unknown>,
      dailyStudyHours: typeof dailyStudyHours === 'number' ? dailyStudyHours : null,
      workspaceContext:
        workspaceContext && typeof workspaceContext === 'object'
          ? (workspaceContext as Record<string, unknown>)
          : {},
      language: typeof language === 'string' ? language : 'uz',
    });

    const updatedUsage = incrementActorUsage(actor.actorKey, 'goal_strategy');
    res.json({
      plan: {
        id: `plan-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-4-hydrogen',
        ...generated,
        syncedTargets: {},
      },
      usage: updatedUsage,
    });
  } catch (error: unknown) {
    console.error('Goal strategy generation error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate goal strategy.';
    res.status(502).json({ error: msg });
  }
});

// Maqsadlar Smart Certificate Recommendations ("Qaysi sertifikat menga kerak?")
app.post('/api/ai/certificate-recommendation', optionalAuth, async (req: AuthRequest, res) => {
  if (!geminiClient) {
    return res.status(503).json({
      error: 'Certificate Advisor requires GEMINI_API_KEY configured on the server.',
    });
  }

  const actor = await resolveActorIdentity(req);
  const quotaCheck = enforceActorQuota(actor.actorKey, actor.tier, 'ai_message', actor.isOwner);
  if (!quotaCheck.quota.allowed) {
    return res.status(429).json({
      error: quotaCheck.quota.reason,
      quota: quotaCheck.quota,
    });
  }

  const {
    targetCountry,
    targetUniversity,
    intendedDegree,
    studyLanguage,
    intendedCareer,
    currentQualifications,
    targetAdmissionYear,
    language,
  } = req.body ?? {};

  if (!targetCountry || typeof targetCountry !== 'string') {
    return res.status(400).json({ error: 'Target country is required.' });
  }

  try {
    const recommendation = await recommendCertificatesWithGemini({
      ai: geminiClient,
      targetCountry: String(targetCountry),
      targetUniversity: typeof targetUniversity === 'string' ? targetUniversity : undefined,
      intendedDegree: String(intendedDegree || 'Bachelor'),
      studyLanguage: String(studyLanguage || 'English'),
      intendedCareer: String(intendedCareer || ''),
      currentQualifications: String(currentQualifications || ''),
      targetAdmissionYear: String(targetAdmissionYear || ''),
      language: typeof language === 'string' ? language : 'uz',
    });

    const updatedUsage = incrementActorUsage(actor.actorKey, 'ai_message');
    res.json({ recommendation, usage: updatedUsage });
  } catch (error: unknown) {
    console.error('Certificate recommendation error:', error);
    const msg =
      error instanceof Error ? error.message : 'Failed to generate certificate recommendations.';
    res.status(502).json({ error: msg });
  }
});

async function startServer() {
  await provisionPlatformOwnerGrant();

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa',
    });

    // In middlewareMode with HMR disabled (e.g., proxied preview environments where port 24678
    // is unreachable), Vite 8 still serves /@vite/client which attempts a failing WebSocket upgrade.
    // Serve a clean WebSocket-free /@vite/client shim preserving CSS injection (updateStyle/removeStyle).
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(`
const sheetsMap = new Map();

export function updateStyle(id, content) {
  if (typeof document === 'undefined') return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  }
  style.textContent = content;
}

export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}

export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}

export function injectQuery(url, queryToInject) {
  if (typeof url !== 'string' || (!url.startsWith('.') && !url.startsWith('/'))) return url;
  const pathname = url.replace(/[?#].*$/, '');
  const search = url.slice(pathname.length);
  return pathname + (search.includes('?') ? search.replace('?', '?' + queryToInject + '&') : '?' + queryToInject + search);
}

export class ErrorOverlay extends (typeof HTMLElement !== 'undefined' ? HTMLElement : Object) {}
`);
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Global University Intelligence server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
