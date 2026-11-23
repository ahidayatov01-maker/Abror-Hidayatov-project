import type { LanguageCode, MaterialStudyStatus, MaterialType } from '../../types/domain';

export interface LibraryLocaleStrings {
  badge: string;
  title: string;
  subtitle: string;
  overviewFolders: string;
  overviewMaterials: string;
  overviewAnalyzed: string;
  overviewCompleted: string;
  viewFolders: string;
  viewAllFiles: string;
  viewPlanner: string;
  newFolder: string;
  addMaterial: string;
  searchPlaceholder: string;
  favoritesOnly: string;
  sortBy: string;
  sortUpdated: string;
  sortName: string;
  sortProgress: string;
  sortCount: string;
  filterAllTypes: string;
  filterAllStatuses: string;
  backToFolders: string;
  renameFolder: string;
  deleteFolder: string;
  confirmDeleteFolder: string;
  confirmDeleteMaterial: string;
  cancel: string;
  confirmDelete: string;
  save: string;
  create: string;
  folderNameLabel: string;
  folderDescLabel: string;
  folderAccentLabel: string;
  emptyFolderTitle: string;
  emptyFolderSubtitle: string;
  itemsLabel: string;
  analyzedLabel: string;
  progressLabel: string;
  aiNone: string;
  aiPartial: string;
  aiComplete: string;
  analyzeWithAi: string;
  analyzing: string;
  reanalyze: string;
  addToToday: string;
  addToWeekly: string;
  openPreview: string;
  moveFolder: string;
  rename: string;
  delete: string;
  statusLabels: Record<MaterialStudyStatus, string>;
  typeLabels: Record<MaterialType, string>;
  modalUploadTab: string;
  modalLinkTab: string;
  modalNoteTab: string;
  modalStudyTab: string;
  dropzoneTitle: string;
  dropzoneSubtitle: string;
  selectFolder: string;
  inspectUrlBtn: string;
  inspectingUrl: string;
  noteContentLabel: string;
  plannerTitle: string;
  plannerSubtitle: string;
  dailyPlanTab: string;
  weeklyPlanTab: string;
  upcomingTab: string;
  crossAnalysisTab: string;
  generatePlanBtn: string;
  generatingPlan: string;
  runCrossAnalysisBtn: string;
  runningCrossAnalysis: string;
  dailyBudgetLabel: string;
  daysPerWeekLabel: string;
  maxHardLabel: string;
  openMaterialBtn: string;
  markCompleteBtn: string;
  completedBtn: string;
  unreadableNoticeTitle: string;
  noAnalysisYet: string;
}

const EN: LibraryLocaleStrings = {
  badge: 'Intelligent Research Vault',
  title: 'Research Library',
  subtitle:
    'Organize academic files in 3D glass folders, inspect real content with AI, and build a balanced study schedule.',
  overviewFolders: 'Folders',
  overviewMaterials: 'Materials',
  overviewAnalyzed: 'AI Analyzed',
  overviewCompleted: 'Mastery',
  viewFolders: '3D Folders',
  viewAllFiles: 'All Materials',
  viewPlanner: 'AI Study Planner',
  newFolder: 'New Folder',
  addMaterial: 'Add Material',
  searchPlaceholder: 'Search folders, files, topics, or notes...',
  favoritesOnly: 'Favorites',
  sortBy: 'Sort',
  sortUpdated: 'Recently Updated',
  sortName: 'Name (A–Z)',
  sortProgress: 'Study Progress',
  sortCount: 'Item Count',
  filterAllTypes: 'All Types',
  filterAllStatuses: 'All Statuses',
  backToFolders: 'All Folders',
  renameFolder: 'Rename Folder',
  deleteFolder: 'Delete Folder',
  confirmDeleteFolder: 'Delete this folder and all materials inside it? This cannot be undone.',
  confirmDeleteMaterial: 'Permanently remove this study material and its scheduled sessions?',
  cancel: 'Cancel',
  confirmDelete: 'Delete',
  save: 'Save Changes',
  create: 'Create Folder',
  folderNameLabel: 'Folder Name',
  folderDescLabel: 'Focus / Description',
  folderAccentLabel: 'Glass Illumination',
  emptyFolderTitle: 'This folder is ready for materials',
  emptyFolderSubtitle:
    'Upload PDFs, Word docs, PowerPoint decks, images, links, or study notes using the + button.',
  itemsLabel: 'items',
  analyzedLabel: 'analyzed',
  progressLabel: 'progress',
  aiNone: 'Not analyzed',
  aiPartial: 'Partially analyzed',
  aiComplete: 'AI ready',
  analyzeWithAi: 'Analyze with AI',
  analyzing: 'Analyzing...',
  reanalyze: 'Re-analyze',
  addToToday: 'Today’s Plan',
  addToWeekly: 'Weekly Plan',
  openPreview: 'Open Preview',
  moveFolder: 'Move Folder',
  rename: 'Rename',
  delete: 'Delete',
  statusLabels: {
    not_reviewed: 'Not Reviewed',
    analyzed: 'Analyzed',
    ready_to_study: 'Ready to Study',
    studying: 'Studying',
    completed: 'Completed',
  },
  typeLabels: {
    pdf: 'PDF Document',
    word: 'Word Document',
    presentation: 'Presentation',
    image: 'Image',
    note: 'Text Note',
    link: 'Web Link',
    study_doc: 'Study Resource',
    other: 'Other File',
  },
  modalUploadTab: 'Upload File(s)',
  modalLinkTab: 'Add Link',
  modalNoteTab: 'Text Note',
  modalStudyTab: 'Study Resource',
  dropzoneTitle: 'Drop PDF, DOCX, PPTX, images, or notes here',
  dropzoneSubtitle: 'Select one or multiple files to inspect content and store locally.',
  selectFolder: 'Target Folder',
  inspectUrlBtn: 'Fetch & Inspect Page',
  inspectingUrl: 'Inspecting...',
  noteContentLabel: 'Study Content / Markdown Notes',
  plannerTitle: 'AI Study Planner & Intelligence',
  plannerSubtitle:
    'Generate daily and weekly study plans grounded in actual material difficulty, prerequisites, and your time budget.',
  dailyPlanTab: 'Daily Plan',
  weeklyPlanTab: 'Weekly Plan',
  upcomingTab: 'Upcoming',
  crossAnalysisTab: 'Cross-Material AI',
  generatePlanBtn: 'Generate AI Schedule',
  generatingPlan: 'Scheduling...',
  runCrossAnalysisBtn: 'Run Cross-Analysis',
  runningCrossAnalysis: 'Mapping...',
  dailyBudgetLabel: 'Daily Budget (min)',
  daysPerWeekLabel: 'Study Days / Week',
  maxHardLabel: 'Max Hard / Day',
  openMaterialBtn: 'Open Material',
  markCompleteBtn: 'Mark Done',
  completedBtn: 'Completed',
  unreadableNoticeTitle: 'Content Cannot Be Read Automatically',
  noAnalysisYet: 'Click Analyze with AI to extract real topics, prerequisites, difficulty, and study duration.',
};

const UZ: LibraryLocaleStrings = {
  badge: 'Intellektual Tadqiqot Ombori',
  title: 'Tadqiqot Kutubxonasi',
  subtitle:
    'Akademik fayllarni 3D shisha jildlarda tartiblang, AI orqali haqiqiy mazmunni tahlil qiling va o‘quv rejasini tuzing.',
  overviewFolders: 'Jildlar',
  overviewMaterials: 'Materiallar',
  overviewAnalyzed: 'AI Tahlil',
  overviewCompleted: 'O‘zlashtirish',
  viewFolders: '3D Jildlar',
  viewAllFiles: 'Barcha Fayllar',
  viewPlanner: 'AI O‘quv Rejasi',
  newFolder: 'Yangi Jild',
  addMaterial: 'Material Qo‘shish',
  searchPlaceholder: 'Jildlar, fayllar, mavzular yoki qaydlarni qidirish...',
  favoritesOnly: 'Saralangan',
  sortBy: 'Saralash',
  sortUpdated: 'So‘nggi Yangilangan',
  sortName: 'Nomi (A–Z)',
  sortProgress: 'O‘qish Jarayoni',
  sortCount: 'Fayllar Soni',
  filterAllTypes: 'Barcha Turlar',
  filterAllStatuses: 'Barcha Holatlar',
  backToFolders: 'Barcha Jildlar',
  renameFolder: 'Jildni Tahrirlash',
  deleteFolder: 'Jildni O‘chirish',
  confirmDeleteFolder: 'Ushbu jild va uning ichidagi barcha materiallar o‘chirilsinmi?',
  confirmDeleteMaterial: 'Ushbu material va unga bog‘liq dars jadvali o‘chirilsinmi?',
  cancel: 'Bekor qilish',
  confirmDelete: 'O‘chirish',
  save: 'Saqlash',
  create: 'Jild Yaratish',
  folderNameLabel: 'Jild Nomi',
  folderDescLabel: 'Tavsif / Yo‘nalish',
  folderAccentLabel: 'Shisha Yoritilishi',
  emptyFolderTitle: 'Bu jild materiallar uchun tayyor',
  emptyFolderSubtitle: '+ tugmasi orqali PDF, Word, PowerPoint, rasm, havola yoki qayd qo‘shing.',
  itemsLabel: 'fayl',
  analyzedLabel: 'tahlil qilingan',
  progressLabel: 'jarayon',
  aiNone: 'Tahlil qilinmagan',
  aiPartial: 'Qisman tahlil',
  aiComplete: 'AI tayyor',
  analyzeWithAi: 'AI Tahlil',
  analyzing: 'Tahlil qilinmoqda...',
  reanalyze: 'Qayta Tahlil',
  addToToday: 'Bugungi Reja',
  addToWeekly: 'Haftalik Reja',
  openPreview: 'Ko‘rish',
  moveFolder: 'Jildni O‘zgartirish',
  rename: 'Qayta Nomlash',
  delete: 'O‘chirish',
  statusLabels: {
    not_reviewed: 'Ko‘rib chiqilmagan',
    analyzed: 'Tahlil qilingan',
    ready_to_study: 'O‘qishga tayyor',
    studying: 'O‘qilmoqda',
    completed: 'Tugatilgan',
  },
  typeLabels: {
    pdf: 'PDF Hujjat',
    word: 'Word Hujjat',
    presentation: 'Taqdimot',
    image: 'Rasm',
    note: 'Matn Qaydi',
    link: 'Veb Havola',
    study_doc: 'O‘quv Manba',
    other: 'Boshqa Fayl',
  },
  modalUploadTab: 'Fayl Yuklash',
  modalLinkTab: 'Havola Qo‘shish',
  modalNoteTab: 'Matn Qaydi',
  modalStudyTab: 'O‘quv Resurs',
  dropzoneTitle: 'PDF, DOCX, PPTX, rasm yoki qaydlarni shu yerga tashlang',
  dropzoneSubtitle: 'Mazmunni tekshirish uchun bitta yoki bir nechta fayl tanlang.',
  selectFolder: 'Maqsadli Jild',
  inspectUrlBtn: 'Sahifani Yuklab Tekshirish',
  inspectingUrl: 'Tekshirilmoqda...',
  noteContentLabel: 'O‘quv Matni / Qaydlar',
  plannerTitle: 'AI O‘quv Rejalashtiruvchi',
  plannerSubtitle:
    'Haqiqiy material qiyinligi, bog‘liqliklar va kunlik vaqtingizga asoslangan o‘quv rejasini tuzing.',
  dailyPlanTab: 'Kunlik Reja',
  weeklyPlanTab: 'Haftalik Reja',
  upcomingTab: 'Navbatdagilar',
  crossAnalysisTab: 'Materiallararo AI',
  generatePlanBtn: 'AI Reja Tuzish',
  generatingPlan: 'Rejalashtirilmoqda...',
  runCrossAnalysisBtn: 'Bog‘liqliklarni Tahlil Qilish',
  runningCrossAnalysis: 'Tahlil...',
  dailyBudgetLabel: 'Kunlik Vaqt (daq)',
  daysPerWeekLabel: 'Haftalik Kunlar',
  maxHardLabel: 'Kuniga Qiyin Dars',
  openMaterialBtn: 'Materialni Ochish',
  markCompleteBtn: 'Bajarildi',
  completedBtn: 'Tugatildi',
  unreadableNoticeTitle: 'Mazmunni Avtomatik O‘qib Bo‘lmadi',
  noAnalysisYet: 'Mavzular, qiyinlik va vaqtni aniqlash uchun AI Tahlil tugmasini bosing.',
};

const RU: LibraryLocaleStrings = {
  badge: 'Интеллектуальное Хранилище',
  title: 'Библиотека Исследований',
  subtitle:
    'Организуйте учебные материалы в 3D стеклянных папках, анализируйте реальное содержание с ИИ и планируйте обучение.',
  overviewFolders: 'Папки',
  overviewMaterials: 'Материалы',
  overviewAnalyzed: 'ИИ-анализ',
  overviewCompleted: 'Освоение',
  viewFolders: '3D Папки',
  viewAllFiles: 'Все Материалы',
  viewPlanner: 'ИИ-План Обучения',
  newFolder: 'Новая папка',
  addMaterial: 'Добавить материал',
  searchPlaceholder: 'Поиск по папкам, файлам, темам или заметкам...',
  favoritesOnly: 'Избранное',
  sortBy: 'Сортировка',
  sortUpdated: 'Недавно обновлено',
  sortName: 'По имени (А–Я)',
  sortProgress: 'Прогресс',
  sortCount: 'Кол-во файлов',
  filterAllTypes: 'Все типы',
  filterAllStatuses: 'Все статусы',
  backToFolders: 'Все папки',
  renameFolder: 'Переименовать папку',
  deleteFolder: 'Удалить папку',
  confirmDeleteFolder: 'Удалить эту папку и все материалы внутри нее? Это действие необратимо.',
  confirmDeleteMaterial: 'Удалить этот материал и связанные с ним учебные сессии?',
  cancel: 'Отмена',
  confirmDelete: 'Удалить',
  save: 'Сохранить',
  create: 'Создать папку',
  folderNameLabel: 'Название папки',
  folderDescLabel: 'Описание',
  folderAccentLabel: 'Подсветка стекла',
  emptyFolderTitle: 'Папка готова к наполнению',
  emptyFolderSubtitle: 'Добавьте PDF, Word, презентации, изображения, ссылки или заметки кнопкой +.',
  itemsLabel: 'файлов',
  analyzedLabel: 'проанализировано',
  progressLabel: 'прогресс',
  aiNone: 'Не проанализировано',
  aiPartial: 'Частично',
  aiComplete: 'ИИ готов',
  analyzeWithAi: 'Анализ ИИ',
  analyzing: 'Анализ...',
  reanalyze: 'Повторить анализ',
  addToToday: 'На сегодня',
  addToWeekly: 'На неделю',
  openPreview: 'Открыть',
  moveFolder: 'Переместить',
  rename: 'Переименовать',
  delete: 'Удалить',
  statusLabels: {
    not_reviewed: 'Не просмотрено',
    analyzed: 'Проанализировано',
    ready_to_study: 'Готово к изучению',
    studying: 'Изучается',
    completed: 'Завершено',
  },
  typeLabels: {
    pdf: 'PDF Документ',
    word: 'Документ Word',
    presentation: 'Презентация',
    image: 'Изображение',
    note: 'Текстовая заметка',
    link: 'Веб-ссылка',
    study_doc: 'Учебный ресурс',
    other: 'Другой файл',
  },
  modalUploadTab: 'Загрузить файлы',
  modalLinkTab: 'Добавить ссылку',
  modalNoteTab: 'Заметка',
  modalStudyTab: 'Учебный ресурс',
  dropzoneTitle: 'Перетащите PDF, DOCX, PPTX, фото или заметки сюда',
  dropzoneSubtitle: 'Выберите один или несколько файлов для проверки содержимого.',
  selectFolder: 'Целевая папка',
  inspectUrlBtn: 'Загрузить и проверить страницу',
  inspectingUrl: 'Проверка...',
  noteContentLabel: 'Учебный текст / Заметки',
  plannerTitle: 'ИИ-Планировщик Обучения',
  plannerSubtitle:
    'Составляйте дневной и недельный планы с учетом сложности материалов, зависимостей и лимита времени.',
  dailyPlanTab: 'План на день',
  weeklyPlanTab: 'План на неделю',
  upcomingTab: 'Предстоящие',
  crossAnalysisTab: 'Кросс-анализ ИИ',
  generatePlanBtn: 'Создать ИИ-план',
  generatingPlan: 'Планирование...',
  runCrossAnalysisBtn: 'Запустить кросс-анализ',
  runningCrossAnalysis: 'Анализ...',
  dailyBudgetLabel: 'Лимит в день (мин)',
  daysPerWeekLabel: 'Дней в неделю',
  maxHardLabel: 'Сложных в день',
  openMaterialBtn: 'Открыть материал',
  markCompleteBtn: 'Выполнено',
  completedBtn: 'Завершено',
  unreadableNoticeTitle: 'Содержимое недоступно для чтения',
  noAnalysisYet: 'Нажмите «Анализ ИИ», чтобы извлечь темы, сложность и время изучения.',
};

const JA: LibraryLocaleStrings = {
  ...EN,
  badge: 'インテリジェント研究ライブラリ',
  title: 'リサーチライブラリ',
  subtitle: '3Dガラスフォルダで学習資料を整理し、AIで内容を解析して最適な学習スケジュールを作成します。',
  overviewFolders: 'フォルダ',
  overviewMaterials: '資料数',
  overviewAnalyzed: 'AI解析済',
  overviewCompleted: '習得率',
  viewFolders: '3Dフォルダ',
  viewAllFiles: 'すべての資料',
  viewPlanner: 'AI学習プランナー',
  newFolder: '新規フォルダ',
  addMaterial: '資料を追加',
  searchPlaceholder: 'フォルダ、ファイル、トピックを検索...',
  favoritesOnly: 'お気に入り',
  backToFolders: 'フォルダ一覧へ',
  analyzeWithAi: 'AI解析',
  analyzing: '解析中...',
  addToToday: '今日の計画へ',
  addToWeekly: '週間計画へ',
  openPreview: 'プレビュー',
  dailyPlanTab: '今日の計画',
  weeklyPlanTab: '週間計画',
  upcomingTab: '今後の予定',
  crossAnalysisTab: '資料間AI分析',
  generatePlanBtn: 'AIスケジュール作成',
  runCrossAnalysisBtn: '資料間分析を実行',
};

const ZH: LibraryLocaleStrings = {
  ...EN,
  badge: '智能研究资料库',
  title: '研究资料库',
  subtitle: '使用 3D 玻璃文件夹整理学习资料，通过 AI 深度解析真实内容并生成科学学习计划。',
  overviewFolders: '文件夹',
  overviewMaterials: '资料总数',
  overviewAnalyzed: 'AI 已解析',
  overviewCompleted: '完成度',
  viewFolders: '3D 文件夹',
  viewAllFiles: '全部资料',
  viewPlanner: 'AI 学习计划',
  newFolder: '新建文件夹',
  addMaterial: '添加资料',
  searchPlaceholder: '搜索文件夹、文件、主题或笔记...',
  favoritesOnly: '收藏',
  backToFolders: '返回文件夹',
  analyzeWithAi: 'AI 解析',
  analyzing: '解析中...',
  addToToday: '加入今日计划',
  addToWeekly: '加入本周计划',
  openPreview: '打开预览',
  dailyPlanTab: '每日计划',
  weeklyPlanTab: '每周计划',
  upcomingTab: '待学资料',
  crossAnalysisTab: '跨资料 AI 分析',
  generatePlanBtn: '生成 AI 计划',
  runCrossAnalysisBtn: '运行跨资料分析',
};

const DE: LibraryLocaleStrings = {
  ...EN,
  badge: 'Intelligentes Forschungslabor',
  title: 'Forschungsbibliothek',
  subtitle:
    'Ordnen Sie Lernmaterialien in 3D-Glasordnern, analysieren Sie echte Inhalte mit KI und planen Sie Ihr Studium.',
  overviewFolders: 'Ordner',
  overviewMaterials: 'Materialien',
  overviewAnalyzed: 'KI-Analysiert',
  overviewCompleted: 'Fortschritt',
  viewFolders: '3D-Ordner',
  viewAllFiles: 'Alle Dateien',
  viewPlanner: 'KI-Lernplaner',
  newFolder: 'Neuer Ordner',
  addMaterial: 'Material hinzufügen',
  searchPlaceholder: 'Ordner, Dateien, Themen oder Notizen durchsuchen...',
  favoritesOnly: 'Favoriten',
  backToFolders: 'Alle Ordner',
  analyzeWithAi: 'Mit KI analysieren',
  analyzing: 'Analysiere...',
  addToToday: 'Heutiger Plan',
  addToWeekly: 'Wochenplan',
  openPreview: 'Vorschau öffnen',
  dailyPlanTab: 'Tagesplan',
  weeklyPlanTab: 'Wochenplan',
  upcomingTab: 'Anstehend',
  crossAnalysisTab: 'KI-Verknüpfung',
  generatePlanBtn: 'KI-Plan erstellen',
  runCrossAnalysisBtn: 'Quervergleich starten',
};

const DICT: Record<LanguageCode, LibraryLocaleStrings> = {
  en: EN,
  uz: UZ,
  ru: RU,
  ja: JA,
  zh: ZH,
  de: DE,
};

export function getLibraryStrings(lang: LanguageCode): LibraryLocaleStrings {
  return DICT[lang] || EN;
}
