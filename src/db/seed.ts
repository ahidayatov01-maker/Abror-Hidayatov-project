import { count } from 'drizzle-orm';
import { db } from './index';
import {
  admissionRequirements,
  cities,
  countries,
  globalSyncLogs,
  programs,
  rankings,
  scholarships,
  universities,
  universityAliases,
} from './schema';
import {
  SEED_ADMISSIONS,
  SEED_CITIES,
  SEED_COUNTRIES,
  SEED_PROGRAMS,
  SEED_RANKINGS,
  SEED_SCHOLARSHIPS,
  SEED_UNIVERSITIES,
} from '../data/seedCatalog';
import {
  EXPANDED_ADMISSIONS,
  EXPANDED_COUNTRIES,
  EXPANDED_PROGRAMS,
  EXPANDED_SCHOLARSHIPS,
} from '../data/expandedGlobalCatalog';
import { CURATED_UNIVERSITY_ALIASES } from '../data/universityAliases';
import { normalizeSearchText } from '../utils/globalSearchEngine';

let seededPromise: Promise<void> | null = null;

export async function ensureCatalogSeeded(): Promise<void> {
  if (seededPromise) return seededPromise;

  seededPromise = (async () => {
    const [countryCountRow, scholarshipCountRow, aliasCountRow, programCountRow, admissionCountRow] =
      await Promise.all([
        db.select({ value: count() }).from(countries),
        db.select({ value: count() }).from(scholarships),
        db.select({ value: count() }).from(universityAliases),
        db.select({ value: count() }).from(programs),
        db.select({ value: count() }).from(admissionRequirements),
      ]);

    const currentCountries = Number(countryCountRow[0]?.value ?? 0);
    const currentScholarships = Number(scholarshipCountRow[0]?.value ?? 0);
    const currentAliases = Number(aliasCountRow[0]?.value ?? 0);
    const currentPrograms = Number(programCountRow[0]?.value ?? 0);
    const currentAdmissions = Number(admissionCountRow[0]?.value ?? 0);

    const needsBaseSeed = currentCountries === 0;
    const needsExpansionSync =
      currentCountries < SEED_COUNTRIES.length + EXPANDED_COUNTRIES.length ||
      currentScholarships < SEED_SCHOLARSHIPS.length + EXPANDED_SCHOLARSHIPS.length ||
      currentAliases < CURATED_UNIVERSITY_ALIASES.length ||
      currentPrograms < SEED_PROGRAMS.length + EXPANDED_PROGRAMS.length ||
      currentAdmissions < SEED_ADMISSIONS.length + EXPANDED_ADMISSIONS.length;

    if (!needsBaseSeed && !needsExpansionSync) {
      return;
    }

    console.log(
      `Synchronizing curated Global University Intelligence catalog (countries=${currentCountries}, scholarships=${currentScholarships}, aliases=${currentAliases})...`
    );

    const allCountries = [...SEED_COUNTRIES, ...EXPANDED_COUNTRIES];
    await db
      .insert(countries)
      .values(allCountries)
      .onConflictDoNothing({ target: countries.isoCode });

    if (needsBaseSeed) {
      await db
        .insert(cities)
        .values(SEED_CITIES)
        .onConflictDoNothing({ target: cities.slug });

      await db
        .insert(universities)
        .values(SEED_UNIVERSITIES)
        .onConflictDoNothing({ target: universities.slug });

      for (const r of SEED_RANKINGS) {
        await db.insert(rankings).values(r).onConflictDoNothing();
      }
    }

    const allPrograms = [...SEED_PROGRAMS, ...EXPANDED_PROGRAMS];
    await db
      .insert(programs)
      .values(allPrograms)
      .onConflictDoNothing({ target: programs.slug });

    const allScholarships = [...SEED_SCHOLARSHIPS, ...EXPANDED_SCHOLARSHIPS];
    await db
      .insert(scholarships)
      .values(allScholarships)
      .onConflictDoNothing({ target: scholarships.slug });

    // Upsert admissions safely without duplicating existing universitySlug entries
    const existingAdmRows = await db
      .select({ universitySlug: admissionRequirements.universitySlug })
      .from(admissionRequirements);
    const existingAdmSet = new Set(existingAdmRows.map((r) => r.universitySlug));
    const missingAdmissions = [...SEED_ADMISSIONS, ...EXPANDED_ADMISSIONS].filter(
      (a) => !existingAdmSet.has(a.universitySlug)
    );
    if (missingAdmissions.length > 0) {
      await db.insert(admissionRequirements).values(missingAdmissions);
    }

    const aliasRows = CURATED_UNIVERSITY_ALIASES.map((a) => ({
      universitySlug: a.universitySlug,
      alias: a.alias,
      normalizedAlias: normalizeSearchText(a.alias),
      aliasType: a.aliasType,
      language: a.language,
    })).filter((a) => Boolean(a.normalizedAlias));

    if (aliasRows.length > 0) {
      await db.insert(universityAliases).values(aliasRows).onConflictDoNothing();
    }

    await db.insert(globalSyncLogs).values({
      sourceName: 'Curated Verified Catalog Expansion',
      scopeKey: 'countries+scholarships+programs+admissions+aliases',
      status: 'success',
      recordsProcessed:
        allCountries.length +
        allScholarships.length +
        allPrograms.length +
        missingAdmissions.length +
        aliasRows.length,
      errorMessage: '',
    });

    console.log(
      `Global catalog sync complete: ${allCountries.length} country dossiers, ${allScholarships.length} scholarships, ${allPrograms.length} programs, ${aliasRows.length} university aliases.`
    );
  })().catch((err) => {
    seededPromise = null;
    throw err;
  });

  return seededPromise;
}
