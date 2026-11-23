import type { LanguageCode } from '../../types/domain';
import type { GlobeVisualMode } from '../../utils/globeGeo';

export interface GlobeUiStrings {
  autoRotate: string;
  autoRotatePause: string;
  clearSelection: string;
  visualSettings: string;
  visualModeLabel: string;
  layersLabel: string;
  coordinateGrid: string;
  equatorMeridian: string;
  cityMarkers: string;
  countryLabels: string;
  cloudsLayer: string;
  atmosphereLayer: string;
  terrainReliefLayer: string;
  universityMarkersLayer: string;
  fullscreen: string;
  exitFullscreen: string;
  resetView: string;
  zoomIn: string;
  zoomOut: string;
  selectCountryPrompt: string;
  selectCountryHint: string;
  showTopDestination: string;
  verifiedUnisSingular: string;
  verifiedUnisPlural: string;
  exploreCountryHint: string;
  dragHint: string;
  webglUnavailableTitle: string;
  webglUnavailableDesc: string;
  modeLabels: Record<GlobeVisualMode, string>;

  // Global Search & Discipline Filter
  globalSearchPlaceholder: string;
  allDisciplines: string;
  noSearchResults: string;
  searchGroupCountries: string;
  searchGroupUniversities: string;

  // Integrated Cinema & Campus Video Theater
  cinemaSectionTitle: string;
  aerialDrone: string;
  campusWalkthrough: string;
  officialIntro: string;
  studentLife: string;
  loadingVideos: string;
  noVerifiedVideosTitle: string;
  noVerifiedVideosDesc: string;
  openOfficialMedia: string;
  watchOnYoutube: string;
  officialChannel: string;
  campusPlaylist: string;
  nextVideo: string;
  prevVideo: string;
  sourcePublisher: string;

  // Structured University Profile & Actions
  tabOverview: string;
  tabAcademics: string;
  tabCampus: string;
  worldRankings: string;
  methodologyNote: string;
  saveFavorite: string;
  savedInFavorites: string;
  addToCompare: string;
  inCompare: string;
  locateOnGlobe: string;
  personalNotesLabel: string;
  personalNotesPlaceholder: string;
  saveNotes: string;
  notesSaved: string;
  priorityLabel: string;
  openFullDossier: string;
  exploreCampusMedia: string;

  // Dynamic Discovery & Metadata Labels
  otherLeadingUniversities: string;
  featuredLeader: string;
  liveRegistryLabel: string;
  loadingCountryUniversities: string;
  discoveryUnavailable: string;
  researchWorks: string;
  citations: string;
  researchAreas: string;
  degreePrograms: string;
  eligibleScholarships: string;
  admissionRequirements: string;
  tuitionLabel: string;
  foundedLabel: string;
  institutionTypeLabel: string;
  languageLabel: string;
  studentsLabel: string;
  internationalRatioLabel: string;
  facilitiesLabel: string;
  officialWebsite: string;
  officialAdmissions: string;
  dataNotPublished: string;

  // Watchlist, Recently Viewed & Inline Comparison
  watchlistAndCompare: string;
  favoritesTab: string;
  recentTab: string;
  compareTab: string;
  compareLimitHint: string;
  clearCompare: string;
  noFavoritesYet: string;
  noRecentYet: string;
  noCompareSelected: string;
  metricColumn: string;
  locationLabel: string;
  strengthsLabel: string;
}

const STRINGS: Record<LanguageCode, GlobeUiStrings> = {
  en: {
    autoRotate: 'Auto-Orbit',
    autoRotatePause: 'Orbit Paused',
    clearSelection: 'Clear',
    visualSettings: 'Globe View',
    visualModeLabel: 'Surface & Lighting',
    layersLabel: 'Data Layers',
    coordinateGrid: 'Coordinate Grid (15°)',
    equatorMeridian: 'Equator & Prime Meridian',
    cityMarkers: 'City Markers',
    countryLabels: 'Country Borders',
    cloudsLayer: 'Clouds',
    atmosphereLayer: 'Atmosphere',
    terrainReliefLayer: 'Terrain Elevation',
    universityMarkersLayer: 'University Markers',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',
    resetView: 'Reset map view',
    zoomIn: 'Zoom in map',
    zoomOut: 'Zoom out map',
    selectCountryPrompt: 'Select a destination on the 3D Digital Earth',
    selectCountryHint:
      'Drag to rotate, scroll to zoom, or click any country or university beacon to inspect rankings, campus drone tours, tuition, and admission guides.',
    showTopDestination: 'Inspect Featured Destination',
    verifiedUnisSingular: 'verified university',
    verifiedUnisPlural: 'verified universities',
    exploreCountryHint: 'Click to discover universities & campus videos',
    dragHint: 'Drag to rotate · Scroll to zoom · Click any country or campus beacon',
    webglUnavailableTitle: 'WebGL 3D rendering is unavailable in this browser context',
    webglUnavailableDesc:
      'Use the destination strip and search bar to explore countries, universities, and campus videos.',
    modeLabels: {
      digital: 'Digital Earth',
      'high-contrast': 'High Contrast',
      minimal: 'Minimal Dotted',
      scanline: 'Enhanced Scanline',
      atmosphere: 'Atmospheric Glow',
      realistic: 'Realistic Earth',
      satellite: 'Satellite Imagery',
      terrain: 'Geographic Terrain',
      night: 'Night-side Earth',
    },

    globalSearchPlaceholder: 'Search country, university, city, or field...',
    allDisciplines: 'All Fields',
    noSearchResults: 'No matching countries or universities found.',
    searchGroupCountries: 'Countries & Territories',
    searchGroupUniversities: 'Universities & Research Fields',

    cinemaSectionTitle: 'University Campus Cinema & Aerial Tours',
    aerialDrone: 'Aerial Drone Tour',
    campusWalkthrough: 'Campus Walkthrough',
    officialIntro: 'Official Presentation',
    studentLife: 'Student Life',
    loadingVideos: 'Verifying authentic campus & drone media...',
    noVerifiedVideosTitle: 'No verified embeddable campus videos found',
    noVerifiedVideosDesc:
      'Only authenticated, playable campus and aerial videos are shown here. Use the official university media channel below.',
    openOfficialMedia: 'Official Media Portal',
    watchOnYoutube: 'Watch on YouTube',
    officialChannel: 'Official Channel',
    campusPlaylist: 'Campus Media Playlist',
    nextVideo: 'Next',
    prevVideo: 'Prev',
    sourcePublisher: 'Publisher',

    tabOverview: 'Overview & Rankings',
    tabAcademics: 'Academics & Admissions',
    tabCampus: 'Campus & Notes',
    worldRankings: 'Published World Rankings',
    methodologyNote: 'Methodology Disclosure',
    saveFavorite: 'Save to Favorites',
    savedInFavorites: 'Saved',
    addToCompare: 'Compare',
    inCompare: 'In Compare',
    locateOnGlobe: 'Locate Campus on Globe',
    personalNotesLabel: 'Personal Research Notes',
    personalNotesPlaceholder: 'Add deadlines, faculty contacts, or scholarship notes...',
    saveNotes: 'Save Notes',
    notesSaved: 'Saved',
    priorityLabel: 'Priority',
    openFullDossier: 'Full Dossier',
    exploreCampusMedia: 'Explore Campus & Videos',

    otherLeadingUniversities: 'Other Leading Universities',
    featuredLeader: 'Featured Leader',
    liveRegistryLabel: 'OpenAlex Institutional Registry',
    loadingCountryUniversities: 'Loading accredited universities for this country...',
    discoveryUnavailable: 'Institutional directory is temporarily unavailable for this territory.',
    researchWorks: 'Research Works',
    citations: 'Total Citations',
    researchAreas: 'Key Research Areas',
    degreePrograms: 'Cataloged Degree Programs',
    eligibleScholarships: 'Eligible Scholarships',
    admissionRequirements: 'Admission Requirements',
    tuitionLabel: 'Annual Tuition',
    foundedLabel: 'Founded',
    institutionTypeLabel: 'Institution Type',
    languageLabel: 'Primary Language',
    studentsLabel: 'Student Body',
    internationalRatioLabel: 'International Ratio',
    facilitiesLabel: 'Campus Facilities',
    officialWebsite: 'Official Website',
    officialAdmissions: 'Admissions Portal',
    dataNotPublished: 'Not published in active catalog',

    watchlistAndCompare: 'Watchlist, History & Side-by-Side Comparison',
    favoritesTab: 'Favorites',
    recentTab: 'Recently Viewed',
    compareTab: 'Compare',
    compareLimitHint: 'Select up to 3 universities to compare side by side.',
    clearCompare: 'Clear Compare',
    noFavoritesYet: 'Save universities while exploring the globe to build your shortlist.',
    noRecentYet: 'Select any university on the globe or search bar to start exploring.',
    noCompareSelected: 'Add 2 or more universities using Compare to inspect rankings, tuition, and strengths side by side.',
    metricColumn: 'Comparison Metric',
    locationLabel: 'Location',
    strengthsLabel: 'Academic Strengths',
  },
  uz: {
    autoRotate: 'Avto-aylanish',
    autoRotatePause: 'Aylanish to‘xtatildi',
    clearSelection: 'Tozalash',
    visualSettings: 'Globus ko‘rinishi',
    visualModeLabel: 'Sirt va yoritish rejimi',
    layersLabel: 'Qatlamlar',
    coordinateGrid: 'Koordinata to‘ri (15°)',
    equatorMeridian: 'Ekvator va Bosh meridian',
    cityMarkers: 'Shahar belgilari',
    countryLabels: 'Mamlakat chegaralari',
    cloudsLayer: 'Bulutlar',
    atmosphereLayer: 'Atmosfera',
    terrainReliefLayer: 'Relyef balandligi',
    universityMarkersLayer: 'Universitet belgilari',
    fullscreen: 'To‘liq ekran',
    exitFullscreen: 'To‘liq ekrandan chiqish',
    resetView: 'Xaritani tiklash',
    zoomIn: 'Yaqinlashtirish',
    zoomOut: 'Uzoqlashtirish',
    selectCountryPrompt: '3D Raqamli Yer sharidan mamlakat tanlang',
    selectCountryHint:
      'Aylantirish uchun torting, kattalashtirish uchun aylantiring yoki reytinglar va kampus dron videolarini ko‘rish uchun istalgan mamlakatni bosing.',
    showTopDestination: 'Asosiy yo‘nalishni ko‘rish',
    verifiedUnisSingular: 'tasdiqlangan universitet',
    verifiedUnisPlural: 'tasdiqlangan universitet',
    exploreCountryHint: 'Universitetlar va kampus videolarini ko‘rish uchun bosing',
    dragHint: 'Aylantirish · Yaqinlashtirish · Mamlakat yoki kampus belgisini bosing',
    webglUnavailableTitle: 'Ushbu brauzerda WebGL 3D renderlash mavjud emas',
    webglUnavailableDesc:
      'Mamlakatlar, universitetlar va kampus videolarini ko‘rish uchun qidiruv va tezkor ro‘yxatdan foydalaning.',
    modeLabels: {
      digital: 'Raqamli Yer',
      'high-contrast': 'Yuqori kontrast',
      minimal: 'Minimal nuqtali',
      scanline: 'Kuchli skan chiziqlar',
      atmosphere: 'Atmosfera nuri',
      realistic: 'Realistik Yer',
      satellite: 'Sun\'iy yo\'ldosh',
      terrain: 'Relyefli Yer',
      night: 'Tungi Yer',
    },

    globalSearchPlaceholder: 'Mamlakat, universitet, shahar yoki soha...',
    allDisciplines: 'Barcha sohalar',
    noSearchResults: 'Mos mamlakat yoki universitet topilmadi.',
    searchGroupCountries: 'Mamlakatlar va hududlar',
    searchGroupUniversities: 'Universitetlar va tadqiqot sohalari',

    cinemaSectionTitle: 'Kampus Kinoteatri va Dron Sayohatlari',
    aerialDrone: 'Dron bilan havo sayohati',
    campusWalkthrough: 'Kampus bo‘ylab sayr',
    officialIntro: 'Rasmiy taqdimot',
    studentLife: 'Talabalar hayoti',
    loadingVideos: 'Haqiqiy kampus va dron videolari tekshirilmoqda...',
    noVerifiedVideosTitle: 'Tasdiqlangan kampus videolari topilmadi',
    noVerifiedVideosDesc:
      'Bu yerda faqat tekshirilgan, ijro etiladigan kampus videolari ko‘rsatiladi. Rasmiy media portaldan foydalaning.',
    openOfficialMedia: 'Rasmiy media sahifa',
    watchOnYoutube: 'YouTube-da ko‘rish',
    officialChannel: 'Rasmiy kanal',
    campusPlaylist: 'Kampus video ro‘yxati',
    nextVideo: 'Keyingi',
    prevVideo: 'Oldingi',
    sourcePublisher: 'Nashriyot',

    tabOverview: 'Umumiy va Reytinglar',
    tabAcademics: 'Ta’lim va Qabul',
    tabCampus: 'Kampus va Qaydlar',
    worldRankings: 'Rasmiy Jahon Reytinglari',
    methodologyNote: 'Metodologiya izohi',
    saveFavorite: 'Saralanganlarga saqlash',
    savedInFavorites: 'Saqlangan',
    addToCompare: 'Taqqoslash',
    inCompare: 'Taqqoslashda',
    locateOnGlobe: 'Globusda ko‘rsatish',
    personalNotesLabel: 'Shaxsiy tadqiqot qaydlari',
    personalNotesPlaceholder: 'Muddatlar, fakultet aloqalari yoki stipendiya qaydlarini kiriting...',
    saveNotes: 'Qaydlarni saqlash',
    notesSaved: 'Saqlandi',
    priorityLabel: 'Ustuvorlik',
    openFullDossier: 'To‘liq ma’lumotnoma',
    exploreCampusMedia: 'Kampus va videolarni ochish',

    otherLeadingUniversities: 'Boshqa yetakchi universitetlar',
    featuredLeader: 'Yetakchi universitet',
    liveRegistryLabel: 'OpenAlex Institutsional Reestri',
    loadingCountryUniversities: 'Ushbu mamlakat universitetlari yuklanmoqda...',
    discoveryUnavailable: 'Ushbu hudud uchun ma’lumotnoma vaqtincha mavjud emas.',
    researchWorks: 'Ilmiy ishlar',
    citations: 'Iqtiboslar',
    researchAreas: 'Asosiy tadqiqot yo‘nalishlari',
    degreePrograms: 'Katalogdagi dasturlar',
    eligibleScholarships: 'Mavjud stipendiyalar',
    admissionRequirements: 'Qabul talablari',
    tuitionLabel: 'Yillik kontrakt to‘lovi',
    foundedLabel: 'Tashkil topgan yil',
    institutionTypeLabel: 'Muassasa turi',
    languageLabel: 'Asosiy til',
    studentsLabel: 'Talabalar soni',
    internationalRatioLabel: 'Xalqaro ulush',
    facilitiesLabel: 'Kampus infratuzilmasi',
    officialWebsite: 'Rasmiy veb-sayt',
    officialAdmissions: 'Qabul portali',
    dataNotPublished: 'Faol katalogda keltirilmagan',

    watchlistAndCompare: 'Saralanganlar, Tarix va Yonma-yon Taqqoslash',
    favoritesTab: 'Saralanganlar',
    recentTab: 'Yaqinda ko‘rilganlar',
    compareTab: 'Taqqoslash',
    compareLimitHint: 'Yonma-yon taqqoslash uchun 3 tagacha universitet tanlang.',
    clearCompare: 'Tozalash',
    noFavoritesYet: 'Ro‘yxat tuzish uchun globusdan universitetlarni saqlang.',
    noRecentYet: 'Ko‘rishni boshlash uchun istalgan universitetni tanlang.',
    noCompareSelected: 'Reyting va kontraktlarni taqqoslash uchun 2 yoki undan ko‘p universitet qo‘shing.',
    metricColumn: 'Mezon',
    locationLabel: 'Joylashuv',
    strengthsLabel: 'Kuchli yo‘nalishlar',
  },
  ru: {
    autoRotate: 'Авто-орбита',
    autoRotatePause: 'Пауза орбиты',
    clearSelection: 'Сбросить',
    visualSettings: 'Вид глобуса',
    visualModeLabel: 'Поверхность и освещение',
    layersLabel: 'Слои данных',
    coordinateGrid: 'Координатная сетка (15°)',
    equatorMeridian: 'Экватор и нулевой меридиан',
    cityMarkers: 'Маркеры городов',
    countryLabels: 'Границы стран',
    cloudsLayer: 'Облака',
    atmosphereLayer: 'Атмосфера',
    terrainReliefLayer: 'Высота рельефа',
    universityMarkersLayer: 'Метки университетов',
    fullscreen: 'Полный экран',
    exitFullscreen: 'Выйти из полного экрана',
    resetView: 'Сбросить вид',
    zoomIn: 'Приблизить',
    zoomOut: 'Отдалить',
    selectCountryPrompt: 'Выберите страну на 3D Цифровой Земле',
    selectCountryHint:
      'Перетаскивайте для вращения, прокручивайте для масштаба или нажмите на любую страну или маяк кампуса для просмотра рейтингов и видео.',
    showTopDestination: 'Открыть популярное направление',
    verifiedUnisSingular: 'проверенный университет',
    verifiedUnisPlural: 'проверенных университетов',
    exploreCountryHint: 'Нажмите, чтобы открыть вузы и видео кампусов',
    dragHint: 'Вращение · Масштаб · Клик по стране или маяку кампуса',
    webglUnavailableTitle: '3D-рендеринг WebGL недоступен в текущем браузере',
    webglUnavailableDesc:
      'Используйте панель поиска и список направлений ниже для изучения вузов и кампусных видео.',
    modeLabels: {
      digital: 'Цифровая Земля',
      'high-contrast': 'Высокий контраст',
      minimal: 'Минимальные точки',
      scanline: 'Усиленные скан-линии',
      atmosphere: 'Свечение атмосферы',
      realistic: 'Реалистичная Земля',
      satellite: 'Спутниковые снимки',
      terrain: 'Географический рельеф',
      night: 'Ночная сторона',
    },

    globalSearchPlaceholder: 'Поиск страны, вуза, города или направления...',
    allDisciplines: 'Все направления',
    noSearchResults: 'Подходящие страны или университеты не найдены.',
    searchGroupCountries: 'Страны и территории',
    searchGroupUniversities: 'Университеты и сферы исследований',

    cinemaSectionTitle: 'Видеотур по кампусу и аэросъёмка с дрона',
    aerialDrone: 'Аэросъёмка с дрона',
    campusWalkthrough: 'Прогулка по кампусу',
    officialIntro: 'Официальная презентация',
    studentLife: 'Студенческая жизнь',
    loadingVideos: 'Проверка подлинных видео кампуса и аэросъёмки...',
    noVerifiedVideosTitle: 'Проверенные видео кампуса не найдены',
    noVerifiedVideosDesc:
      'Здесь отображаются только проверенные воспроизводимые видеозаписи. Воспользуйтесь официальным медиапорталом вуза.',
    openOfficialMedia: 'Официальный медиапортал',
    watchOnYoutube: 'Смотреть на YouTube',
    officialChannel: 'Официальный канал',
    campusPlaylist: 'Плейлист кампуса',
    nextVideo: 'Далее',
    prevVideo: 'Назад',
    sourcePublisher: 'Издатель',

    tabOverview: 'Обзор и рейтинги',
    tabAcademics: 'Программы и поступление',
    tabCampus: 'Кампус и заметки',
    worldRankings: 'Опубликованные мировые рейтинги',
    methodologyNote: 'Методология',
    saveFavorite: 'В избранное',
    savedInFavorites: 'В избранном',
    addToCompare: 'Сравнить',
    inCompare: 'В сравнении',
    locateOnGlobe: 'Показать на глобусе',
    personalNotesLabel: 'Личные заметки',
    personalNotesPlaceholder: 'Добавьте дедлайны, факультеты или стипендиальные заметки...',
    saveNotes: 'Сохранить заметки',
    notesSaved: 'Сохранено',
    priorityLabel: 'Приоритет',
    openFullDossier: 'Полное досье',
    exploreCampusMedia: 'Кампус и видео',

    otherLeadingUniversities: 'Другие ведущие университеты',
    featuredLeader: 'Ведущий вуз',
    liveRegistryLabel: 'Институциональный реестр OpenAlex',
    loadingCountryUniversities: 'Загрузка аккредитованных университетов страны...',
    discoveryUnavailable: 'Каталог институтов для этой территории временно недоступен.',
    researchWorks: 'Научных публикаций',
    citations: 'Цитирования',
    researchAreas: 'Ключевые научные направления',
    degreePrograms: 'Программы обучения',
    eligibleScholarships: 'Доступные стипендии',
    admissionRequirements: 'Требования к поступлению',
    tuitionLabel: 'Годовая стоимость обучения',
    foundedLabel: 'Год основания',
    institutionTypeLabel: 'Тип учреждения',
    languageLabel: 'Основной язык',
    studentsLabel: 'Студентов',
    internationalRatioLabel: 'Иностранные студенты',
    facilitiesLabel: 'Инфраструктура кампуса',
    officialWebsite: 'Официальный сайт',
    officialAdmissions: 'Портал приёмной комиссии',
    dataNotPublished: 'Не опубликовано в каталоге',

    watchlistAndCompare: 'Избранное, история и сравнение вузов',
    favoritesTab: 'Избранное',
    recentTab: 'Недавние',
    compareTab: 'Сравнение',
    compareLimitHint: 'Выберите до 3 университетов для сравнения.',
    clearCompare: 'Очистить',
    noFavoritesYet: 'Сохраняйте университеты при изучении глобуса.',
    noRecentYet: 'Выберите любой университет на глобусе или в поиске.',
    noCompareSelected: 'Добавьте от 2 университетов для сравнения рейтингов и условий обучения.',
    metricColumn: 'Показатель',
    locationLabel: 'Расположение',
    strengthsLabel: 'Сильные стороны',
  },
  ja: {
    autoRotate: '自動回転',
    autoRotatePause: '回転停止',
    clearSelection: '選択解除',
    visualSettings: '地球儀表示',
    visualModeLabel: 'サーフェス・照明',
    layersLabel: 'データレイヤー',
    coordinateGrid: '経緯線グリッド (15°)',
    equatorMeridian: '赤道・本初子午線',
    cityMarkers: '都市マーカー',
    countryLabels: '国境線・国名ラベル',
    cloudsLayer: '雲レイヤー',
    atmosphereLayer: '大気圏',
    terrainReliefLayer: '地形の起伏',
    universityMarkersLayer: '大学マーカー',
    fullscreen: '全画面',
    exitFullscreen: '全画面を終了',
    resetView: '視点をリセット',
    zoomIn: '拡大',
    zoomOut: '縮小',
    selectCountryPrompt: '3Dデジタル地球儀から留学先を選択',
    selectCountryHint:
      'ドラッグで回転、スクロールで拡大縮小し、国や大学ビーコンをクリックしてランキングやドローン映像を確認できます。',
    showTopDestination: '注目の留学先を表示',
    verifiedUnisSingular: '件の認定大学',
    verifiedUnisPlural: '件の認定大学',
    exploreCountryHint: 'クリックして大学・キャンパス映像を探索',
    dragHint: 'ドラッグで回転 · スクロールで拡大 · 国や大学ビーコンをクリック',
    webglUnavailableTitle: 'このブラウザ環境ではWebGL 3D表示を利用できません',
    webglUnavailableDesc: '検索バーや留学先リストから大学データとキャンパス映像をご覧ください。',
    modeLabels: {
      digital: 'デジタルアース',
      'high-contrast': 'ハイコントラスト',
      minimal: 'ミニマルドット',
      scanline: 'スキャンライン強調',
      atmosphere: '大気光グロー',
      realistic: 'リアルな地球',
      satellite: '衛星画像',
      terrain: '地理的地形',
      night: '夜側地球',
    },

    globalSearchPlaceholder: '国・大学・都市・専攻分野を検索...',
    allDisciplines: '全分野',
    noSearchResults: '一致する国または大学が見つかりませんでした。',
    searchGroupCountries: '国・地域',
    searchGroupUniversities: '大学・研究分野',

    cinemaSectionTitle: 'キャンパスシネマ・空撮ドローン映像',
    aerialDrone: 'ドローン空撮ツアー',
    campusWalkthrough: 'キャンパス散策',
    officialIntro: '公式紹介映像',
    studentLife: '学生生活',
    loadingVideos: '公式キャンパス・空撮映像を確認中...',
    noVerifiedVideosTitle: '検証済みの埋め込み動画が見つかりませんでした',
    noVerifiedVideosDesc: '実在し再生確認済みの映像のみを表示しています。下の公式メディアページをご確認ください。',
    openOfficialMedia: '公式メディアへ',
    watchOnYoutube: 'YouTubeで見る',
    officialChannel: '公式チャンネル',
    campusPlaylist: 'キャンパスプレイリスト',
    nextVideo: '次へ',
    prevVideo: '前へ',
    sourcePublisher: '配信元',

    tabOverview: '概要・ランキング',
    tabAcademics: '専攻・入試情報',
    tabCampus: 'キャンパス・メモ',
    worldRankings: '公式世界ランキング',
    methodologyNote: '評価基準について',
    saveFavorite: 'お気に入りに保存',
    savedInFavorites: '保存済み',
    addToCompare: '比較に追加',
    inCompare: '比較中',
    locateOnGlobe: '地球儀で位置を表示',
    personalNotesLabel: '研究メモ',
    personalNotesPlaceholder: '出願締切、研究室、奨学金メモを記録...',
    saveNotes: 'メモを保存',
    notesSaved: '保存完了',
    priorityLabel: '志望度',
    openFullDossier: '詳細ページへ',
    exploreCampusMedia: 'キャンパス映像を見る',

    otherLeadingUniversities: 'その他の主要大学',
    featuredLeader: '代表校',
    liveRegistryLabel: 'OpenAlex 大学研究レジストリ',
    loadingCountryUniversities: '対象国の主要大学を取得中...',
    discoveryUnavailable: 'この地域の大学リストは現在利用できません。',
    researchWorks: '研究論文数',
    citations: '被引用数',
    researchAreas: '主要研究分野',
    degreePrograms: '収録学位プログラム',
    eligibleScholarships: '対象奨学金',
    admissionRequirements: '出願要件',
    tuitionLabel: '年間学費',
    foundedLabel: '創立年',
    institutionTypeLabel: '設置形態',
    languageLabel: '使用言語',
    studentsLabel: '学生数',
    internationalRatioLabel: '留学生比率',
    facilitiesLabel: 'キャンパス施設',
    officialWebsite: '公式サイト',
    officialAdmissions: '入試案内ページ',
    dataNotPublished: '現行カタログ未掲載',

    watchlistAndCompare: 'お気に入り・履歴・並列比較',
    favoritesTab: 'お気に入り',
    recentTab: '最近閲覧',
    compareTab: '比較表',
    compareLimitHint: '最大3校まで並べて比較できます。',
    clearCompare: '比較をクリア',
    noFavoritesYet: '地球儀から大学を保存して志望校リストを作成しましょう。',
    noRecentYet: '大学を選択すると閲覧履歴がここに表示されます。',
    noCompareSelected: '2校以上を比較に追加するとランキングや学費を並べて比較できます。',
    metricColumn: '比較項目',
    locationLabel: '所在地',
    strengthsLabel: '強み分野',
  },
  zh: {
    autoRotate: '自动旋转',
    autoRotatePause: '暂停旋转',
    clearSelection: '清除选择',
    visualSettings: '地球视图',
    visualModeLabel: '表面与光照模式',
    layersLabel: '数据图层',
    coordinateGrid: '经纬网格 (15°)',
    equatorMeridian: '赤道与本初子午线',
    cityMarkers: '城市标记',
    countryLabels: '国家边界与标签',
    cloudsLayer: '云层',
    atmosphereLayer: '大气层',
    terrainReliefLayer: '地形高程',
    universityMarkersLayer: '大学标记',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    resetView: '重置视图',
    zoomIn: '放大',
    zoomOut: '缩小',
    selectCountryPrompt: '在 3D 数字地球上选择留学目的地',
    selectCountryHint:
      '拖拽旋转地球，滚轮缩放，点击任意国家或校区信标即可浏览大学排名、航拍视频与申请详情。',
    showTopDestination: '查看热门目的地',
    verifiedUnisSingular: '所认证大学',
    verifiedUnisPlural: '所认证大学',
    exploreCountryHint: '点击发现当地大学与校园航拍视频',
    dragHint: '拖拽旋转 · 滚轮缩放 · 点击任意国家或校区信标',
    webglUnavailableTitle: '当前浏览器环境不支持 WebGL 3D 渲染',
    webglUnavailableDesc: '请使用搜索栏和底部目的地快捷栏浏览国家、院校与校园视频。',
    modeLabels: {
      digital: '数字地球',
      'high-contrast': '高对比度',
      minimal: '极简点阵',
      scanline: '增强扫描线',
      atmosphere: '大气辉光',
      realistic: '真实地球',
      satellite: '卫星影像',
      terrain: '地理地形',
      night: '夜间地球',
    },

    globalSearchPlaceholder: '搜索国家、大学、城市或研究方向...',
    allDisciplines: '全部学科',
    noSearchResults: '未找到匹配的国家或大学。',
    searchGroupCountries: '国家与地区',
    searchGroupUniversities: '大学与研究领域',

    cinemaSectionTitle: '校园影院与无人机航拍导览',
    aerialDrone: '无人机航拍导览',
    campusWalkthrough: '校园漫步导览',
    officialIntro: '官方宣传片',
    studentLife: '校园与学生生活',
    loadingVideos: '正在核验真实的校园及航拍视频...',
    noVerifiedVideosTitle: '暂未检索到可播放的已验证校园视频',
    noVerifiedVideosDesc: '本板块仅展示经核验可播放的校园视频。请访问下方大学官方媒体门户。',
    openOfficialMedia: '官方媒体页面',
    watchOnYoutube: '在 YouTube 观看',
    officialChannel: '官方频道',
    campusPlaylist: '校园播放列表',
    nextVideo: '下一个',
    prevVideo: '上一个',
    sourcePublisher: '发布方',

    tabOverview: '院校概览与排名',
    tabAcademics: '学术与招生信息',
    tabCampus: '校园设施与笔记',
    worldRankings: '已发布世界大学排名',
    methodologyNote: '排名口径说明',
    saveFavorite: '收藏院校',
    savedInFavorites: '已收藏',
    addToCompare: '加入对比',
    inCompare: '对比中',
    locateOnGlobe: '在地球上定位',
    personalNotesLabel: '个人申请笔记',
    personalNotesPlaceholder: '记录申请截止日期、导师方向或奖学金信息...',
    saveNotes: '保存笔记',
    notesSaved: '已保存',
    priorityLabel: '志愿梯度',
    openFullDossier: '完整档案',
    exploreCampusMedia: '浏览校园与视频',

    otherLeadingUniversities: '该国其他领先大学',
    featuredLeader: '旗舰代表院校',
    liveRegistryLabel: 'OpenAlex 学术机构名录',
    loadingCountryUniversities: '正在加载该国家的主要高校...',
    discoveryUnavailable: '该地区的高校目录暂时不可用。',
    researchWorks: '科研论文数',
    citations: '总被引次数',
    researchAreas: '核心研究方向',
    degreePrograms: '已收录学位项目',
    eligibleScholarships: '可申请奖学金',
    admissionRequirements: '录取要求',
    tuitionLabel: '年度学费',
    foundedLabel: '建校年份',
    institutionTypeLabel: '院校性质',
    languageLabel: '授课语言',
    studentsLabel: '在校生规模',
    internationalRatioLabel: '国际生比例',
    facilitiesLabel: '校园设施',
    officialWebsite: '官方网站',
    officialAdmissions: '招生官网',
    dataNotPublished: '当前目录暂未收录该项',

    watchlistAndCompare: '收藏清单、浏览历史与并排对比',
    favoritesTab: '已收藏',
    recentTab: '最近浏览',
    compareTab: '并排对比',
    compareLimitHint: '最多可选择 3 所大学进行并排对比。',
    clearCompare: '清空对比',
    noFavoritesYet: '在探索地球时收藏心仪院校以建立申请清单。',
    noRecentYet: '在地球或搜索栏中选择任意大学即可在此查看记录。',
    noCompareSelected: '至少添加 2 所大学即可并排对比排名、学费与优势学科。',
    metricColumn: '对比指标',
    locationLabel: '所在城市',
    strengthsLabel: '优势学科',
  },
  de: {
    autoRotate: 'Auto-Rotation',
    autoRotatePause: 'Rotation pausiert',
    clearSelection: 'Zurücksetzen',
    visualSettings: 'Globus-Ansicht',
    visualModeLabel: 'Oberfläche & Beleuchtung',
    layersLabel: 'Datenebenen',
    coordinateGrid: 'Koordinatennetz (15°)',
    equatorMeridian: 'Äquator & Nullmeridian',
    cityMarkers: 'Städtemarker',
    countryLabels: 'Ländergrenzen',
    cloudsLayer: 'Wolken',
    atmosphereLayer: 'Atmosphäre',
    terrainReliefLayer: 'Geländerelief',
    universityMarkersLayer: 'Universitätsmarker',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    resetView: 'Ansicht zurücksetzen',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    selectCountryPrompt: 'Zielland auf der 3D-Digital-Earth auswählen',
    selectCountryHint:
      'Ziehen zum Drehen, scrollen zum Zoomen oder auf ein Land bzw. einen Campus-Marker klicken, um Rankings und Drohnenvideos anzusehen.',
    showTopDestination: 'Empfohlenes Zielland öffnen',
    verifiedUnisSingular: 'verifizierte Universität',
    verifiedUnisPlural: 'verifizierte Universitäten',
    exploreCountryHint: 'Klicken für Universitäten & Campus-Videos',
    dragHint: 'Ziehen zum Drehen · Scrollen zum Zoomen · Land oder Campus anklicken',
    webglUnavailableTitle: 'WebGL-3D-Rendering ist in diesem Browser nicht verfügbar',
    webglUnavailableDesc:
      'Nutzen Sie die Suchleiste und Schnellauswahl, um Länder, Universitäten und Campus-Videos zu erkunden.',
    modeLabels: {
      digital: 'Digital Earth',
      'high-contrast': 'Hoher Kontrast',
      minimal: 'Minimal-Punkte',
      scanline: 'Verstärkte Scanlines',
      atmosphere: 'Atmosphären-Glow',
      realistic: 'Realistische Erde',
      satellite: 'Satellitenbilder',
      terrain: 'Geografisches Terrain',
      night: 'Nachtseite der Erde',
    },

    globalSearchPlaceholder: 'Land, Universität, Stadt oder Fachrichtung...',
    allDisciplines: 'Alle Fachbereiche',
    noSearchResults: 'Keine passenden Länder oder Universitäten gefunden.',
    searchGroupCountries: 'Länder & Regionen',
    searchGroupUniversities: 'Universitäten & Forschungsfelder',

    cinemaSectionTitle: 'Campus-Kino & Drohnenaufnahmen',
    aerialDrone: 'Drohnen-Rundflug',
    campusWalkthrough: 'Campus-Rundgang',
    officialIntro: 'Offizielle Vorstellung',
    studentLife: 'Studentenleben',
    loadingVideos: 'Authentische Campus- und Drohnenvideos werden geprüft...',
    noVerifiedVideosTitle: 'Keine verifizierten einbettbaren Campus-Videos gefunden',
    noVerifiedVideosDesc:
      'Hier werden ausschließlich geprüfte, abspielbare Campus-Videos angezeigt. Nutzen Sie das offizielle Medienportal unten.',
    openOfficialMedia: 'Offizielles Medienportal',
    watchOnYoutube: 'Auf YouTube ansehen',
    officialChannel: 'Offizieller Kanal',
    campusPlaylist: 'Campus-Wiedergabeliste',
    nextVideo: 'Weiter',
    prevVideo: 'Zurück',
    sourcePublisher: 'Herausgeber',

    tabOverview: 'Überblick & Rankings',
    tabAcademics: 'Studium & Zulassung',
    tabCampus: 'Campus & Notizen',
    worldRankings: 'Veröffentlichte Weltranglisten',
    methodologyNote: 'Methodik-Hinweis',
    saveFavorite: 'Merken',
    savedInFavorites: 'Gemerkt',
    addToCompare: 'Vergleichen',
    inCompare: 'Im Vergleich',
    locateOnGlobe: 'Auf dem Globus zeigen',
    personalNotesLabel: 'Persönliche Forschungsnotizen',
    personalNotesPlaceholder: 'Fristen, Fakultätskontakte oder Stipendien-Notizen eingeben...',
    saveNotes: 'Notizen speichern',
    notesSaved: 'Gespeichert',
    priorityLabel: 'Priorität',
    openFullDossier: 'Vollständiges Dossier',
    exploreCampusMedia: 'Campus & Videos ansehen',

    otherLeadingUniversities: 'Weitere führende Universitäten',
    featuredLeader: 'Spitzenuniversität',
    liveRegistryLabel: 'OpenAlex Hochschulverzeichnis',
    loadingCountryUniversities: 'Akkreditierte Universitäten werden geladen...',
    discoveryUnavailable: 'Hochschulverzeichnis für dieses Gebiet vorübergehend nicht verfügbar.',
    researchWorks: 'Publikationen',
    citations: 'Zitationen',
    researchAreas: 'Forschungsschwerpunkte',
    degreePrograms: 'Katalogisierte Studiengänge',
    eligibleScholarships: 'Mögliche Stipendien',
    admissionRequirements: 'Zulassungsvoraussetzungen',
    tuitionLabel: 'Studiengebühren / Jahr',
    foundedLabel: 'Gründungsjahr',
    institutionTypeLabel: 'Hochschultyp',
    languageLabel: 'Unterrichtssprache',
    studentsLabel: 'Studierende',
    internationalRatioLabel: 'Internationaler Anteil',
    facilitiesLabel: 'Campus-Einrichtungen',
    officialWebsite: 'Offizielle Website',
    officialAdmissions: 'Bewerbungsportal',
    dataNotPublished: 'Im aktiven Katalog nicht veröffentlicht',

    watchlistAndCompare: 'Merkliste, Verlauf & Direktvergleich',
    favoritesTab: 'Merkliste',
    recentTab: 'Zuletzt angesehen',
    compareTab: 'Vergleich',
    compareLimitHint: 'Bis zu 3 Universitäten direkt miteinander vergleichen.',
    clearCompare: 'Auswahl leeren',
    noFavoritesYet: 'Speichern Sie Universitäten beim Erkunden für Ihre Auswahlliste.',
    noRecentYet: 'Wählen Sie eine Universität auf dem Globus oder in der Suche.',
    noCompareSelected: 'Fügen Sie mindestens 2 Universitäten zum Vergleichen hinzu.',
    metricColumn: 'Vergleichskriterium',
    locationLabel: 'Standort',
    strengthsLabel: 'Schwerpunkte',
  },
};

export function getGlobeStrings(lang: LanguageCode): GlobeUiStrings {
  return STRINGS[lang] || STRINGS.en;
}
