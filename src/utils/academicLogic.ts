import type {
  ProgramRecord,
  RankingRecord,
  SubscriptionTier,
  UniversityRecord,
} from '../types/domain';

export interface FinancialPlanInput {
  tuitionAnnualUsd: number;
  housingMonthlyUsd: number;
  foodMonthlyUsd: number;
  transportMonthlyUsd: number;
  insuranceAnnualUsd: number;
  studyMaterialsAnnualUsd: number;
  otherExpensesAnnualUsd: number;
  scholarshipDeductionAnnualUsd: number;
  monthsPerAcademicYear?: number;
}

export interface FinancialPlanBreakdown {
  tuitionUsd: number;
  accommodationUsd: number;
  foodUsd: number;
  transportationUsd: number;
  insuranceUsd: number;
  studyMaterialsUsd: number;
  otherExpensesUsd: number;
  grossAnnualCostUsd: number;
  scholarshipDeductionUsd: number;
  netAnnualCostUsd: number;
}

export function calculateAnnualStudyCost(input: FinancialPlanInput): FinancialPlanBreakdown {
  const months = Math.max(1, Math.min(12, input.monthsPerAcademicYear ?? 12));
  const tuitionUsd = Math.max(0, Math.round(input.tuitionAnnualUsd));
  const accommodationUsd = Math.max(0, Math.round(input.housingMonthlyUsd * months));
  const foodUsd = Math.max(0, Math.round(input.foodMonthlyUsd * months));
  const transportationUsd = Math.max(0, Math.round(input.transportMonthlyUsd * months));
  const insuranceUsd = Math.max(0, Math.round(input.insuranceAnnualUsd));
  const studyMaterialsUsd = Math.max(0, Math.round(input.studyMaterialsAnnualUsd));
  const otherExpensesUsd = Math.max(0, Math.round(input.otherExpensesAnnualUsd));

  const grossAnnualCostUsd =
    tuitionUsd +
    accommodationUsd +
    foodUsd +
    transportationUsd +
    insuranceUsd +
    studyMaterialsUsd +
    otherExpensesUsd;

  const scholarshipDeductionUsd = Math.min(
    grossAnnualCostUsd,
    Math.max(0, Math.round(input.scholarshipDeductionAnnualUsd))
  );

  return {
    tuitionUsd,
    accommodationUsd,
    foodUsd,
    transportationUsd,
    insuranceUsd,
    studyMaterialsUsd,
    otherExpensesUsd,
    grossAnnualCostUsd,
    scholarshipDeductionUsd,
    netAnnualCostUsd: grossAnnualCostUsd - scholarshipDeductionUsd,
  };
}

export function convertCurrencyAmount(
  amountUsd: number,
  targetCurrency: string,
  ratesFromUsd: Record<string, number>
): number {
  const rate = ratesFromUsd[targetCurrency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    return amountUsd;
  }
  return Math.round(amountUsd * rate * 100) / 100;
}

export function convertUsdToCurrency(
  amountUsd: number,
  targetCurrency: string,
  ratesFromUsd: Record<string, number>
): number {
  return convertCurrencyAmount(amountUsd, targetCurrency, ratesFromUsd);
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KRW: '₩',
    CHF: 'CHF ',
    SGD: 'S$',
    CAD: 'CA$',
    AUD: 'A$',
    UZS: 'UZS ',
  };
  const prefix = symbols[currency] ?? `${currency} `;
  return `${prefix}${rounded.toLocaleString()}`;
}

export interface ProgramFilterCriteria {
  query?: string;
  countryCode?: string;
  universitySlug?: string;
  degreeLevel?: string;
  language?: string;
  discipline?: string;
  maxTuitionUsd?: number | null;
  maxDurationYears?: number | null;
}

export function filterAcademicPrograms(
  programs: ProgramRecord[],
  universitiesBySlug: Record<string, UniversityRecord>,
  criteria: ProgramFilterCriteria
): ProgramRecord[] {
  const q = (criteria.query || '').trim().toLowerCase();
  return programs.filter((p) => {
    const uni = universitiesBySlug[p.universitySlug];
    if (criteria.countryCode && criteria.countryCode !== 'all') {
      if (!uni || uni.countryCode !== criteria.countryCode) return false;
    }
    if (criteria.universitySlug && criteria.universitySlug !== 'all') {
      if (p.universitySlug !== criteria.universitySlug) return false;
    }
    if (criteria.degreeLevel && criteria.degreeLevel !== 'all') {
      if (p.degreeLevel !== criteria.degreeLevel) return false;
    }
    if (criteria.language && criteria.language !== 'all') {
      if (!p.language.toLowerCase().includes(criteria.language.toLowerCase())) return false;
    }
    if (criteria.discipline && criteria.discipline !== 'all') {
      if (p.discipline !== criteria.discipline) return false;
    }
    if (criteria.maxTuitionUsd !== undefined && criteria.maxTuitionUsd !== null) {
      if (p.tuitionAnnualUsd !== null && p.tuitionAnnualUsd > criteria.maxTuitionUsd) return false;
    }
    if (criteria.maxDurationYears !== undefined && criteria.maxDurationYears !== null) {
      if (p.durationYears > criteria.maxDurationYears) return false;
    }
    if (q) {
      const haystack = `${p.name} ${p.discipline} ${p.overview} ${uni?.name || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function computeChecklistProgress(items: Array<{ completed: boolean }>): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = items.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = items.filter((item) => item.completed).length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

export function getBestRankByProvider(
  rankings: RankingRecord[],
  universitySlug: string,
  provider: RankingRecord['provider']
): RankingRecord | undefined {
  return rankings.find(
    (r) => r.universitySlug === universitySlug && r.provider === provider && r.subjectArea === 'Overall'
  );
}

export interface TierDefinition {
  id: SubscriptionTier;
  name: string;
  audience: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  maxSavedUniversities: number;
  maxCompareSlots: number;
  aiAdvisorDailyLimit: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: TierDefinition[] = [
  {
    id: 'free',
    name: 'Free Explorer',
    audience: 'For early exploration',
    monthlyPriceUsd: 0,
    annualPriceUsd: 0,
    maxSavedUniversities: 8,
    maxCompareSlots: 4,
    aiAdvisorDailyLimit: 5,
    features: [
      'Full interactive World Explorer & City Discovery',
      'Complete verified university, country & scholarship profiles',
      'Save up to 8 universities & 4-way side-by-side comparison',
      '5 AI University Advisor queries per day',
    ],
  },
  {
    id: 'standard',
    name: 'Standard Scholar',
    audience: 'For active applicants',
    monthlyPriceUsd: 14,
    annualPriceUsd: 120,
    maxSavedUniversities: 40,
    maxCompareSlots: 4,
    aiAdvisorDailyLimit: 40,
    features: [
      'Save up to 40 universities across unlimited collections',
      'Full admission checklist sync & multi-year roadmap planner',
      '40 AI University Advisor sessions per day with source grounding',
      'Financial planner CSV/JSON export & currency scenario history',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Strategist',
    audience: 'For global admissions cohorts',
    monthlyPriceUsd: 29,
    annualPriceUsd: 260,
    maxSavedUniversities: 200,
    maxCompareSlots: 4,
    aiAdvisorDailyLimit: 200,
    features: [
      'Unlimited research library folders & up to 200 saved institutions',
      'Deep comparative admission intelligence & deadline priority alerts',
      '200 AI University Advisor sessions per day with multi-country analysis',
      'Priority support & structured portfolio export',
    ],
  },
];
