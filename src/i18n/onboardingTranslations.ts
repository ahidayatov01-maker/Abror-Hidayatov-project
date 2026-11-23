import type { LanguageCode } from '../types/domain';

export interface OnboardingCopy {
  officialBrand: string;
  officialTagline: string;
  step1Subtitle: string;
  continueWithGoogle: string;
  authenticatingGoogle: string;
  continueAsGuest: string;
  securityNote: string;
  step2Header: string;
  step2Subtitle: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  firstNameRequiredError: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  countryLabel: string;
  countrySearchPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  degreeLabel: string;
  degreeBachelor: string;
  degreeMaster: string;
  degreePhd: string;
  destinationsLabel: string;
  destinationsHint: string;
  interestsLabel: string;
  interestsHint: string;
  saveAndContinueBtn: string;
  savingProfile: string;
  profileSavedSuccess: string;
  skipOptionalBtn: string;
  signOutAccountBtn: string;
  accountTypeAuthenticated: string;
  accountTypeGuest: string;
}

export const ONBOARDING_TRANSLATIONS: Record<LanguageCode, OnboardingCopy> = {
  en: {
    officialBrand: 'GLOBAL UNIVERSITY INTELLIGENCE',
    officialTagline: 'Your Education. Your World. Your Future.',
    step1Subtitle:
      'Enter the international academic intelligence platform for verified global universities, city dossiers, scholarships, and admission pathways.',
    continueWithGoogle: 'Continue with Google',
    authenticatingGoogle: 'Connecting to Google...',
    continueAsGuest: 'Continue as Guest / Free Explorer',
    securityNote: 'Secured with Google OAuth 2.0 & PostgreSQL Cloud Sync',
    step2Header: 'Complete Your Profile',
    step2Subtitle: 'Personalize your global education journey.',
    firstNameLabel: 'Ism · First Name',
    firstNamePlaceholder: 'Enter your first name',
    firstNameRequiredError: 'Please enter your first name (Ism) to continue.',
    lastNameLabel: 'Familiya · Last Name',
    lastNamePlaceholder: 'Enter your last name',
    countryLabel: 'Mamlakat · Country',
    countrySearchPlaceholder: 'Search or select your country...',
    cityLabel: 'Shahar · City',
    cityPlaceholder: 'Enter your city or select a suggestion',
    degreeLabel: "Ta'lim bosqichi · Target Degree Level",
    degreeBachelor: 'Bakalavr',
    degreeMaster: 'Magistratura',
    degreePhd: 'PhD',
    destinationsLabel: "O'qishni xohlagan davlatlar · Preferred Study Destinations",
    destinationsHint: 'Select one or more study destinations (optional)',
    interestsLabel: "Qiziqqan yo'nalish · Field of Interest",
    interestsHint: 'Select your academic fields of interest (optional)',
    saveAndContinueBtn: 'Platformaga kirish / Save & Continue',
    savingProfile: 'Saving profile...',
    profileSavedSuccess: 'Profile synchronized — launching dashboard...',
    skipOptionalBtn: 'Skip optional fields & enter',
    signOutAccountBtn: 'Switch account',
    accountTypeAuthenticated: 'Verified Scholar',
    accountTypeGuest: 'Free Explorer',
  },
  uz: {
    officialBrand: 'GLOBAL UNIVERSITY INTELLIGENCE',
    officialTagline: 'Your Education. Your World. Your Future.',
    step1Subtitle:
      'Tasdiqlangan jahon universitetlari, akademik shaharlar, stipendiyalar va qabul tahlili bo‘yicha xalqaro ta’lim platformasiga xush kelibsiz.',
    continueWithGoogle: 'Continue with Google · Google orqali kirish',
    authenticatingGoogle: 'Google orqali tasdiqlanmoqda...',
    continueAsGuest: 'Continue as Guest / Free Explorer',
    securityNote: 'Google OAuth 2.0 va bulutli ma’lumotlar bazasi orqali himoyalangan',
    step2Header: 'Complete Your Profile · Profilingizni to‘ldiring',
    step2Subtitle: 'Personalize your global education journey.',
    firstNameLabel: 'Ism',
    firstNamePlaceholder: 'Ismingizni kiriting',
    firstNameRequiredError: 'Davom etish uchun ismingizni kiriting.',
    lastNameLabel: 'Familiya',
    lastNamePlaceholder: 'Familiyangizni kiriting',
    countryLabel: 'Mamlakat',
    countrySearchPlaceholder: 'Mamlakatni qidiring yoki tanlang...',
    cityLabel: 'Shahar',
    cityPlaceholder: 'Shaharni kiriting yoki tanlang',
    degreeLabel: "Ta'lim bosqichi",
    degreeBachelor: 'Bakalavr',
    degreeMaster: 'Magistratura',
    degreePhd: 'PhD',
    destinationsLabel: "O'qishni xohlagan davlatlar",
    destinationsHint: 'Bir yoki bir nechta davlatni tanlang (ixtiyoriy)',
    interestsLabel: "Qiziqqan yo'nalish",
    interestsHint: 'Qiziqqan sohalaringizni belgilang (ixtiyoriy)',
    saveAndContinueBtn: 'Platformaga kirish / Save & Continue',
    savingProfile: 'Saqlanmoqda...',
    profileSavedSuccess: 'Profil saqlandi — platformaga kirilmoqda...',
    skipOptionalBtn: 'Ixtiyoriy maydonlarni o‘tkazib yuborish',
    signOutAccountBtn: 'Boshqa hisob tanlash',
    accountTypeAuthenticated: 'Tasdiqlangan talaba',
    accountTypeGuest: 'Free Explorer',
  },
  ru: {
    officialBrand: 'GLOBAL UNIVERSITY INTELLIGENCE',
    officialTagline: 'Your Education. Your World. Your Future.',
    step1Subtitle:
      'Международная аналитическая платформа проверенных университетов мира, академических столиц, стипендий и требований к поступлению.',
    continueWithGoogle: 'Continue with Google · Войти через Google',
    authenticatingGoogle: 'Авторизация через Google...',
    continueAsGuest: 'Continue as Guest / Free Explorer',
    securityNote: 'Защищено Google OAuth 2.0 и облачной синхронизацией',
    step2Header: 'Complete Your Profile · Заполните профиль',
    step2Subtitle: 'Personalize your global education journey.',
    firstNameLabel: 'Ism · Имя',
    firstNamePlaceholder: 'Введите ваше имя',
    firstNameRequiredError: 'Пожалуйста, укажите ваше имя для продолжения.',
    lastNameLabel: 'Familiya · Фамилия',
    lastNamePlaceholder: 'Введите вашу фамилию',
    countryLabel: 'Mamlakat · Страна',
    countrySearchPlaceholder: 'Поиск или выбор страны...',
    cityLabel: 'Shahar · Город',
    cityPlaceholder: 'Введите город или выберите из списка',
    degreeLabel: "Ta'lim bosqichi · Целевая степень",
    degreeBachelor: 'Bakalavr · Бакалавр',
    degreeMaster: 'Magistratura · Магистратура',
    degreePhd: 'PhD · Докторантура',
    destinationsLabel: "O'qishni xohlagan davlatlar · Страны для обучения",
    destinationsHint: 'Выберите одну или несколько стран (необязательно)',
    interestsLabel: "Qiziqqan yo'nalish · Направление обучения",
    interestsHint: 'Выберите интересующие области (необязательно)',
    saveAndContinueBtn: 'Platformaga kirish / Save & Continue',
    savingProfile: 'Сохранение профиля...',
    profileSavedSuccess: 'Профиль сохранен — вход в платформу...',
    skipOptionalBtn: 'Пропустить необязательные поля',
    signOutAccountBtn: 'Сменить аккаунт',
    accountTypeAuthenticated: 'Авторизованный исследователь',
    accountTypeGuest: 'Free Explorer',
  },
  ja: {
    officialBrand: 'GLOBAL UNIVERSITY INTELLIGENCE',
    officialTagline: 'Your Education. Your World. Your Future.',
    step1Subtitle:
      '世界の検証済み大学、学術都市、奨学金、入試要件を網羅する国際高等教育インテリジェンス・プラットフォーム。',
    continueWithGoogle: 'Continue with Google · Googleで続行',
    authenticatingGoogle: 'Google認証を処理中...',
    continueAsGuest: 'Continue as Guest / Free Explorer',
    securityNote: 'Google OAuth 2.0 & クラウド同期による安全なセッション',
    step2Header: 'Complete Your Profile · プロフィール設定',
    step2Subtitle: 'Personalize your global education journey.',
    firstNameLabel: 'Ism · 名 (First Name)',
    firstNamePlaceholder: '名を入力してください',
    firstNameRequiredError: '続行するには名（First Name）を入力してください。',
    lastNameLabel: 'Familiya · 姓 (Last Name)',
    lastNamePlaceholder: '姓を入力してください',
    countryLabel: 'Mamlakat · 国',
    countrySearchPlaceholder: '国を検索または選択...',
    cityLabel: 'Shahar · 都市',
    cityPlaceholder: '都市名を入力または選択',
    degreeLabel: "Ta'lim bosqichi · 希望する学位レベル",
    degreeBachelor: 'Bakalavr · 学士',
    degreeMaster: 'Magistratura · 修士',
    degreePhd: 'PhD · 博士',
    destinationsLabel: "O'qishni xohlagan davlatlar · 希望留学先国",
    destinationsHint: '複数の国を選択可能（任意）',
    interestsLabel: "Qiziqqan yo'nalish · 関心のある学問分野",
    interestsHint: '複数の分野を選択可能（任意）',
    saveAndContinueBtn: 'Platformaga kirish / Save & Continue',
    savingProfile: '保存中...',
    profileSavedSuccess: 'プロフィールを同期しました — ダッシュボードへ移動中...',
    skipOptionalBtn: '任意項目をスキップして開始',
    signOutAccountBtn: 'アカウントを切り替え',
    accountTypeAuthenticated: '認証済みスカラー',
    accountTypeGuest: 'Free Explorer',
  },
  zh: {
    officialBrand: 'GLOBAL UNIVERSITY INTELLIGENCE',
    officialTagline: 'Your Education. Your World. Your Future.',
    step1Subtitle:
      '连接全球权威高等院校、学术名城、奖学金项目与录取情报的国际教育技术平台。',
    continueWithGoogle: 'Continue with Google · 使用 Google 继续',
    authenticatingGoogle: '正在连接 Google...',
    continueAsGuest: 'Continue as Guest / Free Explorer',
    securityNote: '由 Google OAuth 2.0 与云端数据库安全同步提供保障',
    step2Header: 'Complete Your Profile · 完善您的个人资料',
    step2Subtitle: 'Personalize your global education journey.',
    firstNameLabel: 'Ism · 名 (First Name)',
    firstNamePlaceholder: '请输入您的名字',
    firstNameRequiredError: '请输入您的名字以继续。',
    lastNameLabel: 'Familiya · 姓 (Last Name)',
    lastNamePlaceholder: '请输入您的姓氏',
    countryLabel: 'Mamlakat · 所在国家',
    countrySearchPlaceholder: '搜索或选择国家...',
    cityLabel: 'Shahar · 所在城市',
    cityPlaceholder: '输入城市或选择推荐城市',
    degreeLabel: "Ta'lim bosqichi · 目标学位阶段",
    degreeBachelor: 'Bakalavr · 本科',
    degreeMaster: 'Magistratura · 硕士',
    degreePhd: 'PhD · 博士',
    destinationsLabel: "O'qishni xohlagan davlatlar · 意向留学国家",
    destinationsHint: '可多选意向留学目的地（选填）',
    interestsLabel: "Qiziqqan yo'nalish · 感兴趣的研究领域",
    interestsHint: '可多选感兴趣的专业领域（选填）',
    saveAndContinueBtn: 'Platformaga kirish / Save & Continue',
    savingProfile: '正在保存资料...',
    profileSavedSuccess: '个人资料已同步 — 正在进入主控台...',
    skipOptionalBtn: '跳过选填项并直接进入',
    signOutAccountBtn: '切换账户',
    accountTypeAuthenticated: '已认证学者',
    accountTypeGuest: 'Free Explorer',
  },
  de: {
    officialBrand: 'GLOBAL UNIVERSITY INTELLIGENCE',
    officialTagline: 'Your Education. Your World. Your Future.',
    step1Subtitle:
      'Internationale Bildungsplattform für verifizierte Spitzenuniversitäten, Universitätsstädte, Stipendien und Zulassungswege.',
    continueWithGoogle: 'Continue with Google · Mit Google fortfahren',
    authenticatingGoogle: 'Verbindung mit Google wird hergestellt...',
    continueAsGuest: 'Continue as Guest / Free Explorer',
    securityNote: 'Gesichert durch Google OAuth 2.0 & Cloud-Synchronisierung',
    step2Header: 'Complete Your Profile · Profil vervollständigen',
    step2Subtitle: 'Personalize your global education journey.',
    firstNameLabel: 'Ism · Vorname',
    firstNamePlaceholder: 'Vorname eingeben',
    firstNameRequiredError: 'Bitte geben Sie Ihren Vornamen ein, um fortzufahren.',
    lastNameLabel: 'Familiya · Nachname',
    lastNamePlaceholder: 'Nachname eingeben',
    countryLabel: 'Mamlakat · Land',
    countrySearchPlaceholder: 'Land suchen oder auswählen...',
    cityLabel: 'Shahar · Stadt',
    cityPlaceholder: 'Stadt eingeben oder Vorschlag wählen',
    degreeLabel: "Ta'lim bosqichi · Angestrebter Studienabschluss",
    degreeBachelor: 'Bakalavr · Bachelor',
    degreeMaster: 'Magistratura · Master',
    degreePhd: 'PhD · Doktorat',
    destinationsLabel: "O'qishni xohlagan davlatlar · Bevorzugte Studienländer",
    destinationsHint: 'Mehrere Zielländer auswählbar (optional)',
    interestsLabel: "Qiziqqan yo'nalish · Studien- & Fachbereich",
    interestsHint: 'Mehrere Fachgebiete auswählbar (optional)',
    saveAndContinueBtn: 'Platformaga kirish / Save & Continue',
    savingProfile: 'Profil wird gespeichert...',
    profileSavedSuccess: 'Profil synchronisiert — Dashboard wird geöffnet...',
    skipOptionalBtn: 'Optionale Felder überspringen',
    signOutAccountBtn: 'Konto wechseln',
    accountTypeAuthenticated: 'Verifizierter Scholar',
    accountTypeGuest: 'Free Explorer',
  },
};
