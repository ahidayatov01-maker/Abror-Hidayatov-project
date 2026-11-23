import type { LanguageCode } from '../types/domain';

export type SupportedDisplayLang = 'uz' | 'en' | 'ru';

export function normalizeDisplayLang(lang: LanguageCode | string | undefined): SupportedDisplayLang {
  if (lang === 'uz' || lang === 'ru' || lang === 'en') return lang;
  return 'en';
}

/**
 * Strips parenthetical aliases like "(formerly Tokyo Tech)" or "(as Tokyo Tech)"
 * purely for clean surface presentation without altering underlying catalog records.
 */
export function formatCleanUniversityName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .replace(/\s*\((?:formerly|as|previously|also known as|aka)[^)]*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Strips parenthetical notes like "(as Tokyo Tech)" from ranking badge values.
 */
export function formatCleanRankDisplay(rankDisplay: string | null | undefined): string {
  if (!rankDisplay) return '';
  return rankDisplay
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface TuitionSplit {
  primary: string;
  note: string | null;
}

/**
 * Separates raw tuition display strings into a crisp card value and an optional
 * tooltip note (e.g., "verify program fee", "undergraduate standard").
 */
export function splitTuitionDisplay(tuition: string | null | undefined): TuitionSplit {
  if (!tuition) return { primary: '—', note: null };
  const notes: string[] = [];
  const primary = tuition
    .replace(/\s*\(([^)]*(?:verify|standard|undergraduate|estimate|approx|program fee|subject to|varies|official|per semester|domestic|international|note)[^)]*)\)/gi, (_m, inner: string) => {
      const cleaned = inner.trim();
      if (cleaned) notes.push(cleaned);
      return '';
    })
    .replace(/\s{2,}/g, ' ')
    .trim();

  return {
    primary: primary || tuition.trim(),
    note: notes.length > 0 ? notes.join(' · ') : null,
  };
}

/**
 * Converts verbose milestone titles into crisp, scannable 1–2 word planetary labels
 * (e.g., "01. Baza", "02. Til", "03. Imtihon", "04. Ariza", "05. Viza") while keeping
 * full descriptions inside the slide-over focus panel.
 */
export function formatCompactMilestoneLabel(
  order: number,
  title: string,
  language: LanguageCode | string = 'en'
): string {
  const lang = normalizeDisplayLang(language);
  const num = String(Math.max(1, Math.round(order))).padStart(2, '0');
  const lower = (title || '').toLowerCase();

  const labelMap: Array<{ match: RegExp; uz: string; en: string; ru: string }> = [
    { match: /foundation|baseline|profile|goal|academ|grade|gpa|baza/, uz: 'Baza', en: 'Foundation', ru: 'База' },
    { match: /language|ielts|toefl|jlpt|topik|testdaf|til/, uz: 'Til', en: 'Language', ru: 'Язык' },
    { match: /exam|sat|act|gre|gmat|eju|test|imtihon/, uz: 'Imtihon', en: 'Exams', ru: 'Экзамены' },
    { match: /scholarship|grant|mext|daad|fund|stipend/, uz: 'Grant', en: 'Grants', ru: 'Гранты' },
    { match: /research|portfolio|essay|sop|document|dossier|hujjat/, uz: 'Hujjatlar', en: 'Dossier', ru: 'Документы' },
    { match: /transfer|credit|bridge|community/, uz: 'Transfer', en: 'Transfer', ru: 'Перевод' },
    { match: /appl|submit|portal|interview|ariza/, uz: 'Ariza', en: 'Apply', ru: 'Заявка' },
    { match: /visa|immigrat|embassy|viza/, uz: 'Viza', en: 'Visa', ru: 'Виза' },
    { match: /depart|arrival|housing|enroll|relocat|ketish/, uz: 'Ketish', en: 'Arrival', ru: 'Прибытие' },
  ];

  for (const entry of labelMap) {
    if (entry.match.test(lower)) {
      return `${num}. ${entry[lang]}`;
    }
  }

  const fallbackWord = (title || '')
    .replace(/[^a-zA-Z0-9\u0400-\u04FF\s'-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');

  return `${num}. ${fallbackWord || (lang === 'uz' ? 'Bosqich' : lang === 'ru' ? 'Этап' : 'Step')}`;
}

export interface DiamondMicroCopy {
  idleTooltip: string;
  coreHint: string;
  coreLabel: string;
  selectFacet: string;
  reassemble: string;
  openSection: string;
  back: string;
  exploredLabel: string;
  passportBadge: string;
  reassembling: string;
  horizonExiting: string;
}

export function getDiamondMicroCopy(language: LanguageCode | string): DiamondMicroCopy {
  const lang = normalizeDisplayLang(language);
  if (lang === 'uz') {
    return {
      idleTooltip: 'Ikki marta bosing ✨',
      coreHint: 'Yadroni bosing',
      coreLabel: 'YADRO',
      selectFacet: 'Qirrani tanlang',
      reassemble: 'Qayta yig‘ish',
      openSection: 'Ochish',
      back: 'Orqaga',
      exploredLabel: 'o‘rganildi',
      passportBadge: 'Salohiyat Pasporti',
      reassembling: 'Qayta yig‘ilmoqda…',
      horizonExiting: 'Chiqilmoqda…',
    };
  }
  if (lang === 'ru') {
    return {
      idleTooltip: 'Двойной клик ✨',
      coreHint: 'Нажмите на ядро',
      coreLabel: 'ЯДРО',
      selectFacet: 'Выберите грань',
      reassemble: 'Собрать',
      openSection: 'Перейти',
      back: 'Назад',
      exploredLabel: 'изучено',
      passportBadge: 'Паспорт раздела',
      reassembling: 'Сборка…',
      horizonExiting: 'Выход…',
    };
  }
  return {
    idleTooltip: 'Double-click ✨',
    coreHint: 'Click core',
    coreLabel: 'CORE',
    selectFacet: 'Select facet',
    reassemble: 'Reassemble',
    openSection: 'Open',
    back: 'Back',
    exploredLabel: 'explored',
    passportBadge: 'Capability Card',
    reassembling: 'Reassembling…',
    horizonExiting: 'Exiting…',
  };
}

export interface CompactShardCopy {
  title: string;
  valueLine: string; // Strictly 1 short sentence (<= 12 words)
  bullets: [string, string, string]; // Strictly 3 crisp bullets (3-5 words each)
}

const SHARD_COPY_MAP: Record<string, Record<SupportedDisplayLang, CompactShardCopy>> = {
  'ai-ecosystem': {
    uz: {
      title: 'AI Maslahatchi',
      valueLine: '10 ta ixtisoslashgan AI agenti bilan shaxsiy qabul strategiyasi.',
      bullets: ['10 ta ixtisoslashgan agent', 'Profilga mos aniq tahlil', '6 tilda tezkor maslahat'],
    },
    en: {
      title: 'AI Advisor',
      valueLine: 'Personalized admissions strategy powered by 10 specialized AI agents.',
      bullets: ['10 specialized AI agents', 'Profile-aware deep analysis', 'Instant multilingual guidance'],
    },
    ru: {
      title: 'ИИ-советник',
      valueLine: 'Персональная стратегия поступления от 10 профильных ИИ-агентов.',
      bullets: ['10 профильных ИИ-агентов', 'Анализ по вашему профилю', 'Ответы на 6 языках'],
    },
  },
  'world-explorer': {
    uz: {
      title: 'Dunyo xaritasi',
      valueLine: 'Global ta’lim mamlakatlari va universitetlarini interaktiv xaritada kashf eting.',
      bullets: ['Interaktiv 3D dunyo xaritasi', 'Shahar byudjeti ko‘rsatkichlari', 'Tezkor universitet profillari'],
    },
    en: {
      title: 'World Map',
      valueLine: 'Discover top study countries, student cities, and universities interactively.',
      bullets: ['Interactive 3D world map', 'City living cost benchmarks', 'Instant university profiles'],
    },
    ru: {
      title: 'Карта мира',
      valueLine: 'Изучайте страны обучения, города и университеты на 3D-карте.',
      bullets: ['Интерактивная 3D-карта', 'Бюджет жизни по городам', 'Быстрый переход к вузам'],
    },
  },
  'academic-roadmap': {
    uz: {
      title: 'Akademik yo‘lim',
      valueLine: 'Maqsadli universitetgacha bo‘lgan aniq bosqichli kosmik yo‘l xaritasi.',
      bullets: ['Direct, Transfer, Grant yo‘llari', 'Har bosqichda aniq vazifalar', 'Jonli tayyorlik nazorati'],
    },
    en: {
      title: 'My Pathway',
      valueLine: 'Step-by-step cosmic roadmap from today to your target university.',
      bullets: ['Direct, Transfer, Grant routes', 'Actionable milestone tasks', 'Live readiness progress'],
    },
    ru: {
      title: 'Учебный путь',
      valueLine: 'Пошаговая космическая дорожная карта до целевого университета.',
      bullets: ['Direct, Transfer и Грант', 'Конкретные задачи этапов', 'Живой прогресс готовности'],
    },
  },
  'goals-certificates': {
    uz: {
      title: 'Maqsadlar',
      valueLine: '60+ xalqaro sertifikat, ball simulyatori va shaxsiy muddatlar nazorati.',
      bullets: ['60+ xalqaro sertifikatlar', 'Davlatlar bo‘yicha simulyator', 'AI tayyorlov rejasi'],
    },
    en: {
      title: 'Goals',
      valueLine: '60+ international exams, country simulator, and personal milestone tracking.',
      bullets: ['60+ international certificates', 'Country value simulator', 'AI preparation roadmap'],
    },
    ru: {
      title: 'Цели',
      valueLine: '60+ международных сертификатов, симулятор стран и личные дедлайны.',
      bullets: ['60+ сертификатов в каталоге', 'Симулятор ценности стран', 'ИИ-план подготовки'],
    },
  },
  'smart-routine': {
    uz: {
      title: 'AI Routine',
      valueLine: 'Kunlik o‘qish quvvatingizga mos aqlli fokus va dam olish jadvali.',
      bullets: ['Kunlik va haftalik bloklar', 'Qulflangan bloklar himoyasi', 'AI jadval optimizatsiyasi'],
    },
    en: {
      title: 'AI Routine',
      valueLine: 'Smart daily focus blocks balanced around your realistic study capacity.',
      bullets: ['Daily and weekly blocks', 'Protected locked time slots', 'AI schedule optimization'],
    },
    ru: {
      title: 'AI Routine',
      valueLine: 'Умные учебные блоки с учётом вашей реальной дневной нагрузки.',
      bullets: ['Дневные и недельные блоки', 'Защита закреплённых слотов', 'Оптимизация расписания ИИ'],
    },
  },
  'admission-intelligence': {
    uz: {
      title: 'Qabul tahlili',
      valueLine: 'Har bir universitet uchun minimal ballar, talablar va hujjatlar auditi.',
      bullets: ['GPA va til talablari', 'Interaktiv hujjat chek-listi', 'Rasmiy qabul portallari'],
    },
    en: {
      title: 'Admissions',
      valueLine: 'Verified GPA, language requirements, and document checklists per university.',
      bullets: ['GPA and test benchmarks', 'Interactive document checklist', 'Official portal links'],
    },
    ru: {
      title: 'Поступление',
      valueLine: 'Проверенные требования по GPA, языку и чек-лист документов.',
      bullets: ['Требования GPA и тестов', 'Чек-лист всех документов', 'Официальные порталы вузов'],
    },
  },
  scholarships: {
    uz: {
      title: 'Stipendiyalar',
      valueLine: 'To‘liq va qisman xalqaro grantlarni mamlakat va daraja bo‘yicha toping.',
      bullets: ['MEXT, DAAD, Chevening grantlari', 'To‘liq qoplamali filtrlar', 'Rasmiy ariza havolalari'],
    },
    en: {
      title: 'Scholarships',
      valueLine: 'Filter full and partial global scholarships by country and degree.',
      bullets: ['MEXT, DAAD, Chevening grants', 'Full-funding quick filters', 'Direct official portals'],
    },
    ru: {
      title: 'Стипендии',
      valueLine: 'Отбирайте полные и частичные гранты по странам и степеням.',
      bullets: ['Гранты MEXT, DAAD, Chevening', 'Фильтр полного покрытия', 'Прямые ссылки на подачу'],
    },
  },
  'financial-planner': {
    uz: {
      title: 'Moliyaviy reja',
      valueLine: 'Kontrakt, turar joy va grant chegirmalarini real valyutada hisoblang.',
      bullets: ['Yillik sof byudjet hisobi', 'Shahar yashash xarajatlari', '10+ valyuta konvertatsiyasi'],
    },
    en: {
      title: 'Finance',
      valueLine: 'Model tuition, living costs, and scholarship offsets in live currencies.',
      bullets: ['Net annual cost model', 'Global city living benchmarks', 'Live currency conversion'],
    },
    ru: {
      title: 'Финансы',
      valueLine: 'Рассчитывайте контракт, проживание и скидки грантов в нужной валюте.',
      bullets: ['Чистый годовой бюджет', 'Расходы жизни по городам', 'Конвертация валют онлайн'],
    },
  },
  'voice-ai-guide': {
    uz: {
      title: 'Ovozli gid',
      valueLine: 'Ovozli buyruqlar orqali xarita va barcha bo‘limlarni tezkor boshqaring.',
      bullets: ['Semantik ovozli buyruqlar', 'Sahifa audio qo‘llanmasi', '6 tilda ovozli yordam'],
    },
    en: {
      title: 'Voice Guide',
      valueLine: 'Navigate maps and modules effortlessly using natural voice commands.',
      bullets: ['Natural voice commands', 'Contextual page audio guide', '6-language speech support'],
    },
    ru: {
      title: 'Голосовой гид',
      valueLine: 'Управляйте картой и разделами с помощью естественных голосовых команд.',
      bullets: ['Голосовая навигация', 'Аудиогид по разделам', 'Поддержка 6 языков'],
    },
  },
  'habits-tracker': {
    uz: {
      title: 'Habits Tracker',
      valueLine: 'Til, mutolaa va imtihon intizomini kundalik odatlarga aylantiring.',
      bullets: ['Kundalik bir bosishda belgilash', 'Uzluksiz streak statistikasi', 'Haftalik intizom tahlili'],
    },
    en: {
      title: 'Habits',
      valueLine: 'Turn language study and exam prep into consistent daily streaks.',
      bullets: ['One-tap daily check-ins', 'Schedule-aware streak engine', 'Weekly consistency insights'],
    },
    ru: {
      title: 'Привычки',
      valueLine: 'Превратите подготовку к экзаменам в стабильные ежедневные привычки.',
      bullets: ['Отметка в одно касание', 'Умный подсчёт серий', 'Недельная аналитика ритма'],
    },
  },
  'global-rankings': {
    uz: {
      title: 'Reytinglar',
      valueLine: 'Top universitetlarni QS, THE va ARWU reytinglari bo‘yicha solishtiring.',
      bullets: ['QS, THE, ARWU bazasi', 'Mamlakat bo‘yicha saralash', 'Profilga bir klikda o‘tish'],
    },
    en: {
      title: 'Rankings',
      valueLine: 'Compare leading universities across QS, THE, and ARWU benchmarks.',
      bullets: ['QS, THE, ARWU tables', 'Instant country filtering', 'One-click profile access'],
    },
    ru: {
      title: 'Рейтинги',
      valueLine: 'Сравнивайте ведущие университеты по рейтингам QS, THE и ARWU.',
      bullets: ['Таблицы QS, THE, ARWU', 'Фильтрация по странам', 'Быстрый переход к вузу'],
    },
  },
  'university-comparison': {
    uz: {
      title: 'Taqqoslash',
      valueLine: 'Tanlangan universitetlarni kontrakt, reyting va talablar bo‘yicha solishtiring.',
      bullets: ['Yonma-yon aniq jadval', 'Xarajat va reyting grafiklari', 'Saqlangan OTMlar sinxroni'],
    },
    en: {
      title: 'Compare',
      valueLine: 'Compare shortlisted universities side by side on cost and rankings.',
      bullets: ['Side-by-side decision matrix', 'Tuition and living charts', 'Synced with saved list'],
    },
    ru: {
      title: 'Сравнение',
      valueLine: 'Сравнивайте выбранные вузы по стоимости, рейтингам и требованиям.',
      bullets: ['Наглядная матрица выбора', 'Графики затрат и рейтинга', 'Синхронизация с избранным'],
    },
  },
};

export function getLocalizedShardCopy(
  sectionId: string,
  language: LanguageCode | string,
  fallbackTitle: string
): CompactShardCopy {
  const lang = normalizeDisplayLang(language);
  const entry = SHARD_COPY_MAP[sectionId];
  if (entry) return entry[lang];
  return {
    title: fallbackTitle,
    valueLine: fallbackTitle,
    bullets: [fallbackTitle, fallbackTitle, fallbackTitle],
  };
}

export interface AdvisorQuickChip {
  label: string;
  prompt: string;
}

export interface PricingCardCopy {
  tierId: 'free' | 'standard' | 'premium';
  name: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  badge?: string;
  bullets: string[];
}

export interface UniversalMicroCopy {
  save: string;
  saved: string;
  view: string;
  back: string;
  open: string;
  aiPlan: string;
  addGoal: string;
  gallery: string;
  portal: string;
  reassemble: string;
  compare: string;
  compared: string;
  docsKpi: string;
  savedKpi: string;
  goalsKpi: string;
  students: string;
  intlPct: string;
  tuition: string;
  verifiedInfoTitle: string;
  verifiedDateLabel: string;
  feeNoteLabel: string;
  sourceNoteLabel: string;
  universitiesCountUnit: string;
  fullGrantLabel: string;
  partialGrantLabel: string;
  advisorGreeting: (name: string) => string;
  advisorChips: AdvisorQuickChip[];
  simulatorGroups: {
    universities: string;
    careers: string;
    privileges: string;
  };
  pricingCards: PricingCardCopy[];
  about: {
    title: string;
    mission: string;
    creatorBadge: string;
    creatorName: string;
    creatorRole: string;
    creatorLocation: string;
    creatorNote: string;
    platformTab: string;
    creatorTab: string;
    agentsHeading: string;
  };
  productivity: {
    routineTitle: string;
    todoTitle: string;
    habitsTitle: string;
    aiSuggestionsTitle: string;
    myTasksTitle: string;
    suggestBtn: string;
    addBlockBtn: string;
    generateAiBtn: string;
    newHabitBtn: string;
    quickAddPlaceholder: string;
    activeLabel: string;
    doneLabel: string;
    overdueLabel: string;
    daysLeftShort: string;
  };
}

export function getUniversalMicroCopy(language: LanguageCode | string): UniversalMicroCopy {
  const lang = normalizeDisplayLang(language);

  if (lang === 'uz') {
    return {
      save: 'Saqlash',
      saved: 'Saqlangan',
      view: 'Ko‘rish',
      back: 'Orqaga',
      open: 'Ochish',
      aiPlan: 'AI Reja',
      addGoal: '+ Maqsad',
      gallery: 'Galereya',
      portal: 'Portal',
      reassemble: 'Qayta yig‘ish',
      compare: 'Taqqoslash',
      compared: 'Tanlangan',
      docsKpi: 'Hujjatlar',
      savedKpi: 'Saqlangan',
      goalsKpi: 'Maqsadlar',
      students: 'Talabalar',
      intlPct: 'Xalqaro %',
      tuition: 'Kontrakt',
      verifiedInfoTitle: 'Ma’lumot manbasi',
      verifiedDateLabel: 'Tasdiqlangan',
      feeNoteLabel: 'Kontrakt izohi',
      sourceNoteLabel: 'Rasmiy portalda tekshiring',
      universitiesCountUnit: 'universitet',
      fullGrantLabel: '100% Grant',
      partialGrantLabel: 'Qisman grant',
      advisorGreeting: (name) => `Salom, ${name}. Qanday yordam beray?`,
      advisorChips: [
        {
          label: 'Yaponiya grantlari',
          prompt:
            'O‘zbekistonlik talaba uchun Yaponiyadagi top universitetlar va MEXT hamda boshqa to‘liq grantlar bo‘yicha aniq strategiya tuzib bering.',
        },
        {
          label: 'Qabul tahlili',
          prompt:
            'Mening profilim va saqlangan universitetlarim bo‘yicha qabul talablari, minimal ballar va yetishmayotgan hujjatlar auditini o‘tkazing.',
        },
        {
          label: 'O‘qish rejasi',
          prompt:
            'Kelgusi 6 oy uchun IELTS, asosiy fanlar va universitet arizalari bo‘yicha real o‘qish rejasini tuzib bering.',
        },
      ],
      simulatorGroups: {
        universities: 'Universitetlar',
        careers: 'Kasblar',
        privileges: 'Imtiyozlar',
      },
      pricingCards: [
        {
          tierId: 'free',
          name: 'Free Explorer',
          priceMonthlyUsd: 0,
          priceYearlyUsd: 0,
          bullets: [
            '3D Dunyo xaritasi va katalog',
            '3 ta faol shaxsiy maqsad',
            '3 ta asosiy AI agent',
            'Kuniga 12 ta AI so‘rov',
            'Routine, To-Do va Habits',
          ],
        },
        {
          tierId: 'standard',
          name: 'Scholar Plus',
          priceMonthlyUsd: 9,
          priceYearlyUsd: 90,
          badge: 'Tavsiya etiladi',
          bullets: [
            '25 ta faol maqsad va AI Reja',
            'Ko‘p sertifikatli simulyator',
            '7 ta ixtisoslashgan AI agent',
            '3 ta akademik yo‘l xaritasi',
            'Kuniga 60 ta AI so‘rov',
          ],
        },
        {
          tierId: 'premium',
          name: 'Global Elite Pro',
          priceMonthlyUsd: 24,
          priceYearlyUsd: 240,
          bullets: [
            'Barcha 10 ta AI agent ochiq',
            'Cheklovsiz maqsad va eksport',
            'Transfer va Moliya arxitektori',
            'Kuniga 250 ta AI so‘rov',
            '6 tagacha OTM taqqoslash',
          ],
        },
      ],
      about: {
        title: 'Global University Intelligence',
        mission:
          'Xalqaro universitetlar, grantlar va qabul strategiyasini yagona intellektual maydonda jamlovchi zamonaviy platforma. Har bir qaror tasdiqlangan ma’lumotlar va 10 ta AI agent tahliliga tayanadi.',
        creatorBadge: 'Muallif',
        creatorName: 'Abror Hidoyatov',
        creatorRole: 'Asoschi va Arxitektor',
        creatorLocation: 'O‘zbekiston',
        creatorNote: 'Talabalarga global ta’lim yo‘lida aniq, shaffof va zamonaviy intellektual vosita yaratish maqsadida ishlab chiqilgan.',
        platformTab: 'Platforma',
        creatorTab: 'Muallif',
        agentsHeading: '10 ta AI agent',
      },
      productivity: {
        routineTitle: 'AI Routine',
        todoTitle: 'To-Do List',
        habitsTitle: 'Habits Tracker',
        aiSuggestionsTitle: 'AI tavsiyalari',
        myTasksTitle: 'Mening vazifalarim',
        suggestBtn: 'AI tavsiya',
        addBlockBtn: '+ Blok',
        generateAiBtn: 'AI Reja',
        newHabitBtn: '+ Odat',
        quickAddPlaceholder: 'Yangi odat...',
        activeLabel: 'Faol',
        doneLabel: 'Bajarildi',
        overdueLabel: 'Kechikkan',
        daysLeftShort: 'kun qoldi',
      },
    };
  }

  if (lang === 'ru') {
    return {
      save: 'Сохранить',
      saved: 'Сохранено',
      view: 'Открыть',
      back: 'Назад',
      open: 'Перейти',
      aiPlan: 'ИИ-план',
      addGoal: '+ Цель',
      gallery: 'Галерея',
      portal: 'Портал',
      reassemble: 'Собрать',
      compare: 'Сравнить',
      compared: 'В сравнении',
      docsKpi: 'Документы',
      savedKpi: 'Сохранённые',
      goalsKpi: 'Цели',
      students: 'Студенты',
      intlPct: 'Иностр. %',
      tuition: 'Контракт',
      verifiedInfoTitle: 'Источник данных',
      verifiedDateLabel: 'Проверено',
      feeNoteLabel: 'Примечание по оплате',
      sourceNoteLabel: 'Уточняйте на официальном портале',
      universitiesCountUnit: 'вузов',
      fullGrantLabel: '100% Грант',
      partialGrantLabel: 'Частичный грант',
      advisorGreeting: (name) => `Привет, ${name}. Чем помочь?`,
      advisorChips: [
        {
          label: 'Гранты Японии',
          prompt:
            'Составь чёткую стратегию поступления в ведущие университеты Японии и получения MEXT или других полных стипендий.',
        },
        {
          label: 'Анализ поступления',
          prompt:
            'Проведи аудит требований, проходных баллов и недостающих документов по моему профилю и сохранённым университетам.',
        },
        {
          label: 'Учебный план',
          prompt:
            'Составь реалистичный учебный план на ближайшие 6 месяцев по IELTS, экзаменам и подаче заявок.',
        },
      ],
      simulatorGroups: {
        universities: 'Университеты',
        careers: 'Профессии',
        privileges: 'Льготы',
      },
      pricingCards: [
        {
          tierId: 'free',
          name: 'Free Explorer',
          priceMonthlyUsd: 0,
          priceYearlyUsd: 0,
          bullets: [
            '3D-карта и каталог вузов',
            'До 3 активных целей',
            '3 базовых ИИ-агента',
            '12 ИИ-запросов в день',
            'Routine, To-Do и Habits',
          ],
        },
        {
          tierId: 'standard',
          name: 'Scholar Plus',
          priceMonthlyUsd: 9,
          priceYearlyUsd: 90,
          badge: 'Рекомендуем',
          bullets: [
            '25 активных целей и ИИ-план',
            'Мульти-сертификат симулятор',
            '7 профильных ИИ-агентов',
            '3 маршрута дорожной карты',
            '60 ИИ-запросов в день',
          ],
        },
        {
          tierId: 'premium',
          name: 'Global Elite Pro',
          priceMonthlyUsd: 24,
          priceYearlyUsd: 240,
          bullets: [
            'Все 10 ИИ-агентов открыты',
            'Безлимит целей и экспорт',
            'Архитектор перевода и финансов',
            '250 ИИ-запросов в день',
            'Сравнение до 6 вузов сразу',
          ],
        },
      ],
      about: {
        title: 'Global University Intelligence',
        mission:
          'Единое интеллектуальное пространство для поиска зарубежных университетов, грантов и стратегии поступления. Каждое решение опирается на проверенные данные и 10 профильных ИИ-агентов.',
        creatorBadge: 'Создатель',
        creatorName: 'Abror Hidoyatov',
        creatorRole: 'Основатель и архитектор',
        creatorLocation: 'Узбекистан',
        creatorNote: 'Создано, чтобы дать абитуриентам ясный, прозрачный и современный инструмент для поступления в мировые вузы.',
        platformTab: 'Платформа',
        creatorTab: 'Создатель',
        agentsHeading: '10 ИИ-агентов',
      },
      productivity: {
        routineTitle: 'AI Routine',
        todoTitle: 'To-Do List',
        habitsTitle: 'Habits Tracker',
        aiSuggestionsTitle: 'Рекомендации ИИ',
        myTasksTitle: 'Мои задачи',
        suggestBtn: 'ИИ-задачи',
        addBlockBtn: '+ Блок',
        generateAiBtn: 'ИИ-план',
        newHabitBtn: '+ Привычка',
        quickAddPlaceholder: 'Новая привычка...',
        activeLabel: 'Активные',
        doneLabel: 'Готово',
        overdueLabel: 'Просрочено',
        daysLeftShort: 'дн. осталось',
      },
    };
  }

  return {
    save: 'Save',
    saved: 'Saved',
    view: 'View',
    back: 'Back',
    open: 'Open',
    aiPlan: 'AI Plan',
    addGoal: '+ Goal',
    gallery: 'Gallery',
    portal: 'Portal',
    reassemble: 'Reassemble',
    compare: 'Compare',
    compared: 'Comparing',
    docsKpi: 'Documents',
    savedKpi: 'Saved',
    goalsKpi: 'Goals',
    students: 'Students',
    intlPct: 'Intl %',
    tuition: 'Tuition',
    verifiedInfoTitle: 'Verification info',
    verifiedDateLabel: 'Verified',
    feeNoteLabel: 'Tuition note',
    sourceNoteLabel: 'Confirm details on official portal',
    universitiesCountUnit: 'universities',
    fullGrantLabel: '100% Grant',
    partialGrantLabel: 'Partial Grant',
    advisorGreeting: (name) => `Hello, ${name}. How can I help?`,
    advisorChips: [
      {
        label: 'Japan grants',
        prompt:
          'Build a concrete strategy for applying to top Japanese universities and winning MEXT or other full scholarships.',
      },
      {
        label: 'Admission audit',
        prompt:
          'Audit my profile and shortlisted universities for admission thresholds, test requirements, and missing documents.',
      },
      {
        label: 'Study plan',
        prompt:
          'Create a realistic 6-month study plan covering IELTS, standardized exams, and university application milestones.',
      },
    ],
    simulatorGroups: {
      universities: 'Universities',
      careers: 'Careers',
      privileges: 'Privileges',
    },
    pricingCards: [
      {
        tierId: 'free',
        name: 'Free Explorer',
        priceMonthlyUsd: 0,
        priceYearlyUsd: 0,
        bullets: [
          '3D World Map & catalog',
          'Up to 3 active goals',
          '3 core AI agents',
          '12 AI messages per day',
          'Routine, To-Do & Habits',
        ],
      },
      {
        tierId: 'standard',
        name: 'Scholar Plus',
        priceMonthlyUsd: 9,
        priceYearlyUsd: 90,
        badge: 'Recommended',
        bullets: [
          '25 active goals & AI Plan',
          'Multi-exam country simulator',
          '7 specialized AI agents',
          '3-route academic roadmap',
          '60 AI messages per day',
        ],
      },
      {
        tierId: 'premium',
        name: 'Global Elite Pro',
        priceMonthlyUsd: 24,
        priceYearlyUsd: 240,
        bullets: [
          'All 10 AI agents unlocked',
          'Unlimited goals & exports',
          'Transfer & Finance architects',
          '250 AI messages per day',
          'Compare up to 6 universities',
        ],
      },
    ],
    about: {
      title: 'Global University Intelligence',
      mission:
        'A unified workspace for discovering global universities, scholarships, and admissions strategy. Every recommendation is grounded in verified catalog records and 10 specialized AI agents.',
      creatorBadge: 'Creator',
      creatorName: 'Abror Hidoyatov',
      creatorRole: 'Founder & Architect',
      creatorLocation: 'Uzbekistan',
      creatorNote: 'Built to give students a calm, transparent, high-precision intelligence system for international higher education.',
      platformTab: 'Platform',
      creatorTab: 'Creator',
      agentsHeading: '10 AI Agents',
    },
    productivity: {
      routineTitle: 'AI Routine',
      todoTitle: 'To-Do List',
      habitsTitle: 'Habits Tracker',
      aiSuggestionsTitle: 'AI Suggestions',
      myTasksTitle: 'My Tasks',
      suggestBtn: 'AI Suggest',
      addBlockBtn: '+ Block',
      generateAiBtn: 'AI Plan',
      newHabitBtn: '+ Habit',
      quickAddPlaceholder: 'New habit...',
      activeLabel: 'Active',
      doneLabel: 'Done',
      overdueLabel: 'Overdue',
      daysLeftShort: 'days left',
    },
  };
}
