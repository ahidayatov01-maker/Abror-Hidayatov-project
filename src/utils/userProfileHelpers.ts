export interface ParsedNameResult {
  firstName: string;
  lastName: string;
  fullName: string;
}

export function parseFullName(
  displayName?: string | null,
  email?: string | null
): ParsedNameResult {
  const cleaned = (displayName || '').trim().replace(/\s+/g, ' ');
  if (cleaned) {
    const parts = cleaned.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');
    return {
      firstName,
      lastName,
      fullName: [firstName, lastName].filter(Boolean).join(' '),
    };
  }

  const emailLocal = (email || '').split('@')[0]?.trim() || '';
  if (emailLocal) {
    const tokens = emailLocal
      .replace(/[._-]+/g, ' ')
      .replace(/\d+/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length > 0) {
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      const firstName = cap(tokens[0]);
      const lastName = tokens.slice(1).map(cap).join(' ');
      return {
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(' '),
      };
    }
  }

  return {
    firstName: '',
    lastName: '',
    fullName: '',
  };
}

export function formatUserDisplayName(
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    accountType?: string | null;
  },
  isGuest = false
): string {
  if (isGuest || profile.accountType === 'guest') {
    const customFirst = (profile.firstName || '').trim();
    const customLast = (profile.lastName || '').trim();
    if (customFirst || customLast) {
      return [customFirst, customLast].filter(Boolean).join(' ');
    }
    const dn = (profile.displayName || '').trim();
    if (dn && dn !== 'Guest Scholar' && dn !== 'Scholar') {
      return dn;
    }
    return 'Free Explorer';
  }

  const first = (profile.firstName || '').trim();
  const last = (profile.lastName || '').trim();
  if (first || last) {
    return [first, last].filter(Boolean).join(' ');
  }

  const fallback = (profile.displayName || '').trim();
  return fallback || 'Scholar';
}

export function computeUserInitials(
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    accountType?: string | null;
  },
  isGuest = false
): string {
  if (isGuest || profile.accountType === 'guest') {
    const customFirst = (profile.firstName || '').trim();
    const customLast = (profile.lastName || '').trim();
    if (customFirst && customLast) {
      return `${customFirst.charAt(0)}${customLast.charAt(0)}`.toUpperCase();
    }
    return 'FE';
  }

  const first = (profile.firstName || '').trim();
  const last = (profile.lastName || '').trim();

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
  if (first) {
    const parts = first.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return first.slice(0, 2).toUpperCase();
  }

  const display = (profile.displayName || '').trim();
  if (display) {
    const parts = display.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  return 'SC';
}

export interface OnboardingFormInput {
  firstName: string;
  lastName?: string;
  country?: string;
  city?: string;
  targetDegree?: string;
  targetCountries?: string[];
  targetDisciplines?: string[];
}

export interface OnboardingValidationResult {
  valid: boolean;
  errorField?: 'firstName';
  sanitized: {
    firstName: string;
    lastName: string;
    displayName: string;
    country: string;
    city: string;
    targetDegree: string;
    targetCountries: string[];
    targetDisciplines: string[];
  };
}

export function validateOnboardingProfile(
  input: OnboardingFormInput
): OnboardingValidationResult {
  const firstName = (input.firstName || '').trim().slice(0, 60);
  const lastName = (input.lastName || '').trim().slice(0, 60);
  const country = (input.country || '').trim().slice(0, 80);
  const city = (input.city || '').trim().slice(0, 80);
  const targetDegree = ['Bachelor', 'Master', 'PhD'].includes(input.targetDegree || '')
    ? (input.targetDegree as string)
    : 'Bachelor';
  const targetCountries = Array.isArray(input.targetCountries)
    ? Array.from(new Set(input.targetCountries.map((c) => c.trim()).filter(Boolean))).slice(0, 12)
    : [];
  const targetDisciplines = Array.isArray(input.targetDisciplines)
    ? Array.from(new Set(input.targetDisciplines.map((d) => d.trim()).filter(Boolean))).slice(0, 12)
    : [];

  if (!firstName) {
    return {
      valid: false,
      errorField: 'firstName',
      sanitized: {
        firstName: '',
        lastName,
        displayName: lastName,
        country,
        city,
        targetDegree,
        targetCountries,
        targetDisciplines,
      },
    };
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ').slice(0, 120);

  return {
    valid: true,
    sanitized: {
      firstName,
      lastName,
      displayName,
      country,
      city,
      targetDegree,
      targetCountries,
      targetDisciplines,
    },
  };
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  cities: string[];
}

export const ONBOARDING_COUNTRIES_LIST: CountryOption[] = [
  {
    code: 'UZ',
    name: 'Uzbekistan',
    flag: '🇺🇿',
    cities: ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus'],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    cities: ['Tokyo', 'Kyoto', 'Osaka', 'Nagoya', 'Sendai', 'Fukuoka', 'Sapporo'],
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    cities: ['Cambridge', 'Boston', 'Stanford', 'New York', 'San Francisco', 'Chicago', 'Los Angeles'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    cities: ['London', 'Oxford', 'Cambridge', 'Edinburgh', 'Manchester', 'Bristol'],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    cities: ['Munich', 'Berlin', 'Heidelberg', 'Aachen', 'Frankfurt', 'Stuttgart'],
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    cities: ['Seoul', 'Daejeon', 'Busan', 'Incheon', 'Suwon'],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    cities: ['Zurich', 'Lausanne', 'Geneva', 'Basel', 'Bern'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    cities: ['Singapore'],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Waterloo', 'Ottawa'],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    cities: ['Melbourne', 'Sydney', 'Canberra', 'Brisbane', 'Perth'],
  },
  {
    code: 'CN',
    name: 'China',
    flag: '🇨🇳',
    cities: ['Beijing', 'Shanghai', 'Hangzhou', 'Shenzhen', 'Nanjing'],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    cities: ['Paris', 'Lyon', 'Toulouse', 'Grenoble', 'Strasbourg'],
  },
  {
    code: 'KZ',
    name: 'Kazakhstan',
    flag: '🇰🇿',
    cities: ['Almaty', 'Astana', 'Shymkent', 'Karaganda'],
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    cities: ['Istanbul', 'Ankara', 'Izmir', 'Antalya'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    cities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    cities: ['Amsterdam', 'Delft', 'Eindhoven', 'Rotterdam', 'Leiden'],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    cities: ['Milan', 'Rome', 'Bologna', 'Turin', 'Florence'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    cities: ['Kuala Lumpur', 'Penang', 'Johor Bahru'],
  },
];

export function getCitySuggestionsForCountry(countryNameOrCode?: string | null): string[] {
  if (!countryNameOrCode) return ['Tashkent', 'Tokyo', 'London', 'Munich', 'Seoul'];
  const q = countryNameOrCode.trim().toLowerCase();
  const match = ONBOARDING_COUNTRIES_LIST.find(
    (c) => c.code.toLowerCase() === q || c.name.toLowerCase() === q
  );
  return match ? match.cities : ['Tashkent', 'Tokyo', 'London', 'Munich', 'Seoul'];
}

export const STUDY_DESTINATION_OPTIONS: Array<{ code: string; name: string; flag: string }> = [
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
];

export const FIELD_OF_INTEREST_OPTIONS: string[] = [
  'Computer Science',
  'Artificial Intelligence',
  'Information Technology',
  'Engineering',
  'Business',
  'Medicine',
  'Economics',
  'Other',
];
