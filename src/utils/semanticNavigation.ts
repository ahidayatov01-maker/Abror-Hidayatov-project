import type { NavSectionId } from '../types/domain';

export type SemanticAction =
  | { type: 'navigateToSection'; section: NavSectionId; reason: string }
  | { type: 'locateCountry'; countryCode: string; countryName: string; reason: string }
  | { type: 'locateUniversity'; universitySlug: string; universityName: string; countryCode: string; reason: string }
  | { type: 'searchUniversities'; query: string; reason: string }
  | { type: 'saveUniversity'; universitySlug: string; universityName: string; reason: string }
  | { type: 'addToComparison'; universitySlug: string; universityName: string; reason: string }
  | { type: 'createTask'; title: string; category?: string; reason: string }
  | { type: 'generateAcademicRoadmap'; targetUniversityName?: string; targetCountry?: string; reason: string }
  | { type: 'openTutorial'; section: NavSectionId; reason: string };

export interface SemanticCommandMatch {
  matched: boolean;
  actions: SemanticAction[];
  spokenReply: string;
}

export interface UniversityLookupRecord {
  slug: string;
  name: string;
  shortName: string;
  countryCode: string;
}

const COUNTRY_SYNONYMS: Array<{ code: string; name: string; aliases: string[] }> = [
  { code: 'UZ', name: 'Uzbekistan', aliases: ['uzbekistan', "o'zbekiston", 'ozbekiston', 'узбекистан', 'tashkent', 'toshkent', 'ウズベキスタン', '乌兹别克斯坦', 'usbekistan'] },
  { code: 'JP', name: 'Japan', aliases: ['japan', 'yaponiya', 'япония', 'tokyo', 'kyoto', '日本'] },
  { code: 'US', name: 'United States', aliases: ['united states', 'usa', 'america', 'aqsh', 'amerika', 'сша', 'америка', 'アメリカ', '美国'] },
  { code: 'GB', name: 'United Kingdom', aliases: ['united kingdom', 'uk', 'britain', 'england', 'buyuk britaniya', 'angliya', 'великобритания', 'london', 'イギリス', '英国'] },
  { code: 'DE', name: 'Germany', aliases: ['germany', 'germaniya', 'германия', 'deutschland', 'munich', 'berlin', 'ドイツ', '德国'] },
  { code: 'KR', name: 'South Korea', aliases: ['south korea', 'korea', 'koreya', 'корея', 'seoul', '韓国', '韩国'] },
  { code: 'SG', name: 'Singapore', aliases: ['singapore', 'singapur', 'сингапур', 'シンガポール', '新加坡'] },
  { code: 'CH', name: 'Switzerland', aliases: ['switzerland', 'shveytsariya', 'швейцария', 'zurich', 'schweiz', 'スイス', '瑞士'] },
  { code: 'CA', name: 'Canada', aliases: ['canada', 'kanada', 'канада', 'toronto', 'カナダ', '加拿大'] },
  { code: 'AU', name: 'Australia', aliases: ['australia', 'avstraliya', 'австралия', 'melbourne', 'sydney', 'オーストラリア', '澳大利亚'] },
  { code: 'CN', name: 'China', aliases: ['china', 'xitoy', 'китай', 'beijing', 'shanghai', '中国'] },
  { code: 'FR', name: 'France', aliases: ['france', 'fransiya', 'франция', 'paris', 'フランス', '法国', 'frankreich'] },
  { code: 'NL', name: 'Netherlands', aliases: ['netherlands', 'gollandiya', 'niderlandiya', 'нидерланды', 'amsterdam', 'delft'] },
  { code: 'IT', name: 'Italy', aliases: ['italy', 'italiya', 'италия', 'milan', 'rome'] },
  { code: 'TR', name: 'Turkey', aliases: ['turkey', 'turkiya', 'турция', 'istanbul', 'ankara'] },
  { code: 'KZ', name: 'Kazakhstan', aliases: ['kazakhstan', "qozog'iston", 'qozogiston', 'казахстан', 'astana', 'almaty'] },
];

const SECTION_SYNONYMS: Array<{ section: NavSectionId; label: string; aliases: string[] }> = [
  { section: 'world-explorer', label: 'World Explorer', aliases: ['world explorer', 'world map', 'dunyo xaritasi', 'xarita', 'globe', 'globus', 'карта мира', '世界地図', 'weltkarte'] },
  { section: 'universities', label: 'Universities', aliases: ['universities', 'universitetlar', 'университеты', '大学'] },
  { section: 'scholarships', label: 'Scholarships', aliases: ['scholarships', 'grantlar', 'stipendiyalar', 'гранты', 'стипендии', '奨学金'] },
  { section: 'university-comparison', label: 'Compare Universities', aliases: ['compare', 'taqqoslash', 'сравнение', '比較'] },
  { section: 'goals', label: 'Maqsadlar', aliases: ['maqsadlar', 'maqsad', 'goals', 'goal', 'certificates', 'sertifikatlar', 'sertifikat', 'цели', 'сертификаты', '目標', '目标', 'ziele'] },
  { section: 'my-academic-journey', label: "Akademik yo'lim", aliases: ['akademik yolim', "akademik yo'lim", 'roadmap', 'academic roadmap', 'дорожная карта', 'ロードマップ'] },
  { section: 'routine', label: 'Routine', aliases: ['routine', 'kun tartibi', 'tartib', 'jadval', 'расписание', 'ルーティン'] },
  { section: 'todo-list', label: 'To-Do List', aliases: ['to-do', 'todo', 'vazifalar', 'tasks', 'список задач', 'タスク'] },
  { section: 'paper-journal', label: 'Habits Tracker', aliases: ['habits tracker', 'habit tracker', 'habits', 'odatlar', 'привычки', '習慣'] },
  { section: 'ai-advisor', label: 'AI Maslahatchi', aliases: ['ai maslahatchi', 'ai advisor', 'ai agent', 'maslahatchi', 'ии советник', 'aiアドバイザー'] },
  { section: 'research-library', label: 'Research Library', aliases: ['research library', 'kutubxona', 'библиотека', 'ライブラリ'] },
  { section: 'financial-planner', label: 'Financial Planner', aliases: ['financial planner', 'moliya', 'budget', 'finance', 'финансы', '財務'] },
  { section: 'my-universities', label: 'My Universities', aliases: ['my universities', 'mening universitetlarim', 'saved universities', 'мои вузы'] },
  { section: 'about', label: 'About & Creator', aliases: ['about', 'muallif', 'ilova haqida', 'о платформе', 'об авторе'] },
  { section: 'subscriptions', label: 'Subscriptions', aliases: ['subscription', 'billing', 'tarif', 'pricing', 'подписка', '料金'] },
  { section: 'account-settings', label: 'Settings', aliases: ['settings', 'sozlamalar', 'настройки', '設定'] },
  { section: 'dashboard', label: 'Dashboard', aliases: ['dashboard', 'bosh sahifa', 'home', 'главная', 'ホーム'] },
];

export function resolveSemanticVoiceCommand(
  rawText: string,
  universities: UniversityLookupRecord[],
  activeSection: NavSectionId
): SemanticCommandMatch {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  if (!text) {
    return { matched: false, actions: [], spokenReply: '' };
  }

  // 1. Page tutorial / explanation intent
  if (
    lower.includes('explain this page') ||
    lower.includes('tutorial') ||
    lower.includes('bu sahifani tushuntir') ||
    lower.includes('qanday ishlaydi') ||
    lower.includes('объясни страницу') ||
    lower.includes('how does this page work')
  ) {
    return {
      matched: true,
      actions: [
        {
          type: 'openTutorial',
          section: activeSection,
          reason: `Contextual page tutorial for ${activeSection}`,
        },
      ],
      spokenReply: `Opening the contextual guide for this workspace section.`,
    };
  }

  // 2. Explicit task creation intent ("add task ...", "vazifa qo'sh ...")
  const taskMatch =
    text.match(/(?:create|add)\s+(?:a\s+)?task[:\s]+(.+)/i) ||
    text.match(/(?:vazifa\s+qo['’]?sh|vazifa\s+yarat)[:\s]+(.+)/i) ||
    text.match(/(?:добавь|создай)\s+задачу[:\s]+(.+)/i);
  if (taskMatch && taskMatch[1]?.trim()) {
    const title = taskMatch[1].trim();
    return {
      matched: true,
      actions: [
        { type: 'createTask', title, category: 'Personal', reason: `Create task: ${title}` },
        { type: 'navigateToSection', section: 'todo-list', reason: 'Open To-Do List to confirm task' },
      ],
      spokenReply: `Created task "${title}" and opened your To-Do List.`,
    };
  }

  // 3. University lookup (Locate on map, Save, or Compare)
  const matchedUni = universities.find((u) => {
    const nameL = u.name.toLowerCase();
    const shortL = u.shortName.toLowerCase();
    return (
      lower.includes(nameL) ||
      (shortL.length >= 3 && new RegExp(`\\b${escapeRegex(shortL)}\\b`, 'i').test(lower))
    );
  });

  if (matchedUni) {
    if (lower.includes('save') || lower.includes('saqla') || lower.includes('сохран')) {
      return {
        matched: true,
        actions: [
          {
            type: 'saveUniversity',
            universitySlug: matchedUni.slug,
            universityName: matchedUni.name,
            reason: `Save ${matchedUni.name}`,
          },
        ],
        spokenReply: `Saved ${matchedUni.name} to My Universities.`,
      };
    }

    if (lower.includes('compare') || lower.includes('taqqosla') || lower.includes('сравн')) {
      return {
        matched: true,
        actions: [
          {
            type: 'addToComparison',
            universitySlug: matchedUni.slug,
            universityName: matchedUni.name,
            reason: `Add ${matchedUni.name} to comparison`,
          },
          { type: 'navigateToSection', section: 'university-comparison', reason: 'Open Compare Universities' },
        ],
        spokenReply: `Added ${matchedUni.name} to your comparison table.`,
      };
    }

    if (lower.includes('roadmap') || lower.includes("yo'l") || lower.includes('yolim')) {
      return {
        matched: true,
        actions: [
          {
            type: 'generateAcademicRoadmap',
            targetUniversityName: matchedUni.name,
            reason: `Navigate to Akademik yo'lim for ${matchedUni.name}`,
          },
          { type: 'navigateToSection', section: 'my-academic-journey', reason: "Open Akademik yo'lim" },
        ],
        spokenReply: `Opening Akademik yo'lim targeted at ${matchedUni.name}.`,
      };
    }

    return {
      matched: true,
      actions: [
        { type: 'navigateToSection', section: 'world-explorer', reason: 'Open World Explorer' },
        {
          type: 'locateUniversity',
          universitySlug: matchedUni.slug,
          universityName: matchedUni.name,
          countryCode: matchedUni.countryCode,
          reason: `Locate ${matchedUni.name} on the interactive globe`,
        },
      ],
      spokenReply: `Locating ${matchedUni.name} on the World Explorer map and opening its institutional profile.`,
    };
  }

  // 4. Country location on map ("Uzbekistan on world map", "O'zbekistonni xaritada ko'rsat", etc.)
  const matchedCountry = COUNTRY_SYNONYMS.find((c) =>
    c.aliases.some((alias) => lower.includes(alias))
  );
  if (matchedCountry) {
    return {
      matched: true,
      actions: [
        { type: 'navigateToSection', section: 'world-explorer', reason: 'Open World Explorer' },
        {
          type: 'locateCountry',
          countryCode: matchedCountry.code,
          countryName: matchedCountry.name,
          reason: `Focus 3D World Explorer on ${matchedCountry.name}`,
        },
      ],
      spokenReply: `Navigating to World Explorer and highlighting ${matchedCountry.name} on the globe.`,
    };
  }

  // 5. Section navigation
  const matchedSection = SECTION_SYNONYMS.find((s) =>
    s.aliases.some((alias) => lower.includes(alias))
  );
  if (matchedSection) {
    return {
      matched: true,
      actions: [
        {
          type: 'navigateToSection',
          section: matchedSection.section,
          reason: `Navigate to ${matchedSection.label}`,
        },
      ],
      spokenReply: `Opened ${matchedSection.label}.`,
    };
  }

  return {
    matched: false,
    actions: [],
    spokenReply: '',
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
