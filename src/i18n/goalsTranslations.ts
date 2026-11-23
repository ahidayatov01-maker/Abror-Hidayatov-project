import type { LanguageCode } from '../types/domain';
import type { CertificateCategoryId } from '../data/certificatesCatalog';
import type { GoalCategoryId, GoalComputedStatus, GoalPriority, GoalType } from '../utils/goalsEngine';
import type { EvidenceStatusTag } from '../data/countryQualificationRules';

export interface GoalsTranslationBundle {
  navLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  tabs: {
    overview: string;
    certificates: string;
    simulator: string;
    myGoals: string;
    analytics: string;
  };
  kpis: {
    activeGoals: string;
    achievedGoals: string;
    nearestDeadline: string;
    averageProgress: string;
    daysLeft: string;
    noDeadline: string;
    quotaRemaining: string;
    unlimited: string;
  };
  overview: {
    dailyStepTitle: string;
    next7DaysTitle: string;
    upcomingDeadlines: string;
    upcomingMilestones: string;
    atRiskLabel: string;
    conflictsLabel: string;
    noUpcoming7Days: string;
    whichCertTitle: string;
    whichCertSubtitle: string;
    analyzeNeedBtn: string;
    analyzingBtn: string;
    requiredExams: string;
    recommendedExams: string;
    optionalExams: string;
    unnecessaryExams: string;
    prepOrder: string;
    activeGoalsPreview: string;
    createNewGoal: string;
    exploreCertificates: string;
    openSimulator: string;
  };
  certExplorer: {
    searchPlaceholder: string;
    allCategories: string;
    allSubcategories: string;
    allCountries: string;
    allScoreFormats: string;
    favoritesOnly: string;
    recentlyViewed: string;
    sortPopularity: string;
    sortFeeAsc: string;
    sortFeeDesc: string;
    sortValidity: string;
    addAsGoal: string;
    alreadyInGoals: string;
    details: string;
    compare: string;
    comparing: string;
    compareSelected: string;
    saveFavorite: string;
    officialSite: string;
    validityLabel: string;
    feeLabel: string;
    scoreFormatLabel: string;
    sourceLabel: string;
    verifiedLabel: string;
    unverifiedFee: string;
    noResults: string;
    compareModalTitle: string;
    compareSubtitle: string;
  };
  simulator: {
    title: string;
    subtitle: string;
    targetCountry: string;
    compareCountry: string;
    noneOption: string;
    addQualification: string;
    selectedQualifications: string;
    statusObtained: string;
    statusPlanned: string;
    currentScoreLabel: string;
    targetScoreLabel: string;
    cardUniversity: string;
    cardCareer: string;
    cardScholarshipVisa: string;
    studentWorkHeading: string;
    matrixTitle: string;
    matrixSubtitle: string;
    disclaimerTitle: string;
    upgradeMultiCert: string;
    upgradeMultiCountry: string;
  };
  goalsWorkspace: {
    viewCards: string;
    viewTimeline: string;
    viewClusters: string;
    createGoal: string;
    editGoal: string;
    goalTitle: string;
    category: string;
    goalType: string;
    startDate: string;
    targetDate: string;
    currentProgress: string;
    targetResult: string;
    priority: string;
    motivation: string;
    targetCountry: string;
    estimatedBudget: string;
    notes: string;
    milestonesTitle: string;
    addMilestone: string;
    dependsOn: string;
    linkedLibrary: string;
    aiStrategyBtn: string;
    markAchieved: string;
    achievedBadge: string;
    pause: string;
    resume: string;
    archive: string;
    deleteConfirm: string;
    timelineFilters: {
      all: string;
      week: string;
      month: string;
      year: string;
      upcoming: string;
      completed: string;
      overdue: string;
    };
    clustersTitle: string;
    clustersSubtitle: string;
    createCluster: string;
    weightedProgress: string;
    conflictWarning: string;
    emptyGoalsTitle: string;
    emptyGoalsBody: string;
    quotaReachedBanner: string;
  };
  strategist: {
    modalTitle: string;
    activeAgentsHeading: string;
    generateBtn: string;
    regenerateBtn: string;
    generating: string;
    studyHoursLabel: string;
    syncPanelTitle: string;
    syncRoutine: string;
    syncTodo: string;
    syncHabits: string;
    syncRoadmap: string;
    syncLibrary: string;
    applySelected: string;
    syncedSuccess: string;
    upgradeRequired: string;
    stagesTitle: string;
    weeklyTargetsTitle: string;
    monthlyMilestonesTitle: string;
    checkpointsTitle: string;
    fallbackTitle: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    categoryDistribution: string;
    deadlineRiskTitle: string;
    noRisksMessage: string;
    achievementsTitle: string;
    completedHistory: string;
    exportJson: string;
    exportMarkdown: string;
    exportUpgradeNote: string;
  };
  certCategories: Record<CertificateCategoryId, string>;
  goalCategories: Record<GoalCategoryId, string>;
  goalTypes: Record<GoalType, string>;
  priorities: Record<GoalPriority, string>;
  statuses: Record<GoalComputedStatus, string>;
  evidenceStatuses: Record<EvidenceStatusTag, string>;
}

const UZ_BUNDLE: GoalsTranslationBundle = {
  navLabel: 'Maqsadlar',
  pageTitle: 'Maqsadlar',
  pageSubtitle: 'Kelajagingizni rejalashtiring. Natijangizni kuzating. Maqsadlaringizga erishing.',
  tabs: {
    overview: "Umumiy ko'rinish",
    certificates: 'Sertifikatlar',
    simulator: "Davlatlar bo'yicha qiymati",
    myGoals: 'Mening maqsadlarim',
    analytics: 'Tahlil va statistika',
  },
  kpis: {
    activeGoals: 'Faol maqsadlar',
    achievedGoals: 'Erishilgan',
    nearestDeadline: 'Eng yaqin muddat',
    averageProgress: "O'rtacha progress",
    daysLeft: 'kun qoldi',
    noDeadline: 'Muddat belgilanmagan',
    quotaRemaining: 'Faol limit',
    unlimited: 'Cheksiz',
  },
  overview: {
    dailyStepTitle: 'Bugungi eng muhim qadam',
    next7DaysTitle: 'Keyingi 7 kun',
    upcomingDeadlines: 'Yaqinlashayotgan muddatlar',
    upcomingMilestones: 'Muhim bosqichlar',
    atRiskLabel: 'Diqqat talab',
    conflictsLabel: 'Muddat to‘qnashuvi',
    noUpcoming7Days: "Keyingi 7 kunda shoshilinch muddat yo'q. Asosiy maqsad bo'yicha rejalashtirilgan mashg'ulotni davom ettiring.",
    whichCertTitle: 'Qaysi sertifikat menga kerak?',
    whichCertSubtitle: "Maqsadli davlat, ta'lim tili va darajaga qarab zarur, tavsiya etilgan va ortiqcha imtihonlarni aniqlang.",
    analyzeNeedBtn: 'AI tahlilini boshlash',
    analyzingBtn: 'Tahlil qilinmoqda...',
    requiredExams: 'Majburiy imtihonlar',
    recommendedExams: 'Tavsiya etiladi',
    optionalExams: "Qo'shimcha foydali",
    unnecessaryExams: 'Hozircha shart emas',
    prepOrder: 'Tavsiya etilgan tayyorgarlik tartibi',
    activeGoalsPreview: 'Faol maqsadlaringiz',
    createNewGoal: 'Yangi maqsad yaratish',
    exploreCertificates: "Sertifikatlarni ko'rish",
    openSimulator: 'Simulyatorni ochish',
  },
  certExplorer: {
    searchPlaceholder: 'Sertifikat, imtihon, til yoki tashkilot qidirish (IELTS, JLPT, SAT, AWS, Milliy Sertifikat)...',
    allCategories: 'Barcha kategoriyalar',
    allSubcategories: "Barcha yo'nalishlar",
    allCountries: 'Barcha davlatlar',
    allScoreFormats: 'Barcha baholash turlari',
    favoritesOnly: 'Saralanganlar',
    recentlyViewed: "So'nggi ko'rilganlar",
    sortPopularity: 'Ommaboplik',
    sortFeeAsc: 'Narx (arzondan)',
    sortFeeDesc: 'Narx (qimmatdan)',
    sortValidity: 'Amal qilish muddati',
    addAsGoal: '+ Maqsad',
    alreadyInGoals: 'Qo‘shilgan',
    details: 'Ko‘rish',
    compare: 'Taqqoslash',
    comparing: 'Tanlangan',
    compareSelected: 'Taqqoslash',
    saveFavorite: 'Saqlash',
    officialSite: 'Portal',
    validityLabel: 'Amal qilish muddati',
    feeLabel: 'Taxminiy narx',
    scoreFormatLabel: 'Baholash tizimi',
    sourceLabel: 'Manba',
    verifiedLabel: 'Tekshirilgan sana',
    unverifiedFee: "Ma'lumot tasdiqlanmagan.",
    noResults: 'Tanlangan filtrlarga mos sertifikat topilmadi.',
    compareModalTitle: 'Sertifikatlarni yonma-yon taqqoslash',
    compareSubtitle: "Imtihonlar o'zaro to'liq almashmaydi — har birining maqsadi, baholash shkalasi va qabul qoidasi farq qiladi.",
  },
  simulator: {
    title: 'Sertifikat Qiymati va Imkoniyatlar Simulyatori',
    subtitle: 'Bir xil sertifikat turli mamlakatlarda qanday imkoniyatlar ochadi?',
    targetCountry: 'Maqsadli davlat',
    compareCountry: 'Taqqoslash davlati (ixtiyoriy)',
    noneOption: 'Tanlanmagan',
    addQualification: "Sertifikat qo'shish",
    selectedQualifications: 'Tanlangan malakalar to‘plami',
    statusObtained: 'Mavjud',
    statusPlanned: 'Rejalashtirilgan',
    currentScoreLabel: 'Hozirgi natija',
    targetScoreLabel: 'Maqsad natija',
    cardUniversity: 'Universitetlar',
    cardCareer: 'Kasblar',
    cardScholarshipVisa: 'Imtiyozlar',
    studentWorkHeading: 'Talabalarning ishlash huquqi (alohida tartib)',
    matrixTitle: 'Davlatlararo Imkoniyatlar Matritsasi',
    matrixSubtitle: "Haqiqiy manbalarga asoslangan taqqoslash — har bir universitet talabi alohida tekshirilishi zarur.",
    disclaimerTitle: "Ta'limiy rejalashtirish vositasi",
    upgradeMultiCert: "Bir nechta sertifikat kombinatsiyasi Scholar Plus va Global Elite Pro tariflarida ochiq.",
    upgradeMultiCountry: "Ikki davlatni yonma-yon taqqoslash Global Elite Pro tarifida ochiq.",
  },
  goalsWorkspace: {
    viewCards: 'Maqsadlar',
    viewTimeline: 'Vaqt chizig‘i',
    viewClusters: 'Maqsadlar strategiyasi',
    createGoal: 'Yangi maqsad',
    editGoal: 'Maqsadni tahrirlash',
    goalTitle: 'Maqsad nomi',
    category: 'Kategoriya',
    goalType: 'Maqsad turi',
    startDate: 'Boshlanish sanasi',
    targetDate: 'Erishish sanasi (ixtiyoriy)',
    currentProgress: 'Hozirgi natija / daraja',
    targetResult: 'Maqsadli natija / daraja',
    priority: 'Muhimlik darajasi',
    motivation: 'Motivatsiya (nima uchun muhim?)',
    targetCountry: 'Maqsadli davlat (ixtiyoriy)',
    estimatedBudget: 'Taxminiy byudjet (USD)',
    notes: 'Shaxsiy eslatmalar',
    milestonesTitle: 'Oraliq bosqichlar (Milestones)',
    addMilestone: "+ Bosqich qo'shish",
    dependsOn: "Bog'liq oldingi maqsadlar",
    linkedLibrary: "Research Library materiallari",
    aiStrategyBtn: 'AI Reja',
    markAchieved: 'Bajarildi',
    achievedBadge: 'Erishildi ✓',
    pause: "To'xtatish",
    resume: 'Davom ettirish',
    archive: 'Arxivlash',
    deleteConfirm: "Ushbu maqsadni o'chirishni tasdiqlaysizmi?",
    timelineFilters: {
      all: 'Barchasi',
      week: 'Bu hafta',
      month: 'Bu oy',
      year: 'Bu yil',
      upcoming: 'Yaqinlashmoqda',
      completed: 'Erishildi',
      overdue: "Muddat o'tgan",
    },
    clustersTitle: 'Maqsadlar Strategiyasi — Goal Clusters',
    clustersSubtitle: "Bir nechta bog'liq maqsadlarni bitta katta strategik maqsad ostida vaznli (%) hisoblash bilan boshqaring.",
    createCluster: 'Yangi strategiya yaratish',
    weightedProgress: 'Vaznli umumiy progress',
    conflictWarning: "Muddat to'qnashuvi aniqlandi",
    emptyGoalsTitle: "Hozircha maqsad qo'shilmagan",
    emptyGoalsBody: "Sertifikatlar katalogidan tanlang yoki o'zingizning shaxsiy akademik maqsadingizni yarating.",
    quotaReachedBanner: "Free Explorer tarifida bir vaqtning o'zida 3 ta faol maqsad mavjud. Erishilgan va arxivlangan maqsadlar limitga kirmaydi.",
  },
  strategist: {
    modalTitle: 'AI Maqsad Strategi (10-Agent Ekotizimi)',
    activeAgentsHeading: 'Jalb qilingan mavjud AI agentlar',
    generateBtn: 'Tayyorgarlik rejasini tuzish',
    regenerateBtn: 'Rejani yangilash',
    generating: 'Agentlar reja tuzmoqda...',
    studyHoursLabel: 'Kunlik ajratiladigan vaqt (soat)',
    syncPanelTitle: 'Bir klik bilan ekotizimga sinxronizatsiya (tasdiqlash bilan)',
    syncRoutine: "AI Routine'ga qo'shish (qulflangan bloklarni saqlab)",
    syncTodo: "To-Do List'ga qo'shish (takrorlanishsiz)",
    syncHabits: "Habits Tracker'ga qo'shish",
    syncRoadmap: "Akademik yo'limga bog'lash",
    syncLibrary: "Research Library'dan material topish",
    applySelected: "Tanlangan sinxronizatsiyani qo'llash",
    syncedSuccess: 'Sinxronizatsiya muvaffaqiyatli bajarildi',
    upgradeRequired: 'AI Maqsad Strategi va ekotizim sinxronizatsiyasi Scholar Plus yoki Global Elite Pro tarifida ishlaydi.',
    stagesTitle: 'Tayyorgarlik bosqichlari',
    weeklyTargetsTitle: 'Haftalik maqsadlar',
    monthlyMilestonesTitle: 'Oylik nazorat nuqtalari',
    checkpointsTitle: 'Progress tekshiruvlari va mashqlar',
    fallbackTitle: "Agar progress sekinlashsa (muqobil strategiya)",
  },
  analytics: {
    title: 'Maqsadlar Tahlili va Yutuqlar Intellekti',
    subtitle: "Haqiqiy ma'lumotlarga asoslangan progress, xavf tahlili va yutuqlar tarixi.",
    categoryDistribution: "Kategoriyalar bo'yicha taqsimot",
    deadlineRiskTitle: 'Muddat xavfi tahlili',
    noRisksMessage: "Hozircha xavf ostidagi muddatlar aniqlanmadi. Barqaror sur'atda davom eting.",
    achievementsTitle: 'Yutuq bosqichlari',
    completedHistory: 'Erishilgan maqsadlar tarixi',
    exportJson: 'JSON eksport',
    exportMarkdown: 'Rejani Markdown eksport qilish',
    exportUpgradeNote: 'Maqsad rejalarini eksport qilish Global Elite Pro tarifida ochiq.',
  },
  certCategories: {
    languages: 'Tillar',
    math_science: 'Matematika va fanlar',
    it_tech: 'IT & Technology',
    business_pro: 'Biznes va Professional',
    other_international: 'Boshqa xalqaro malakalar',
  },
  goalCategories: {
    language_certificates: 'Til sertifikatlari',
    math_sciences: 'Matematika va fanlar',
    national_certificates: 'Milliy sertifikatlar',
    it_professional: 'IT va professional sertifikatlar',
    universities_scholarships: 'Universitet va stipendiyalar',
    programming_tech: 'Dasturlash va texnologiya',
    personal_development: 'Shaxsiy rivojlanish',
    other: 'Boshqa maqsadlar',
  },
  goalTypes: {
    score: 'Ball asosida (IELTS / SAT / TOEFL)',
    level: 'Daraja asosida (JLPT / CEFR / TOPIK)',
    binary: 'Bajarildi / Bajarilmadi (Portfolio / Hujjat)',
    quantitative: 'Miqdoriy (N ta loyiha / kitob)',
    milestone: 'Bosqichli (MEXT / Qabul jarayoni)',
  },
  priorities: {
    low: 'Past',
    medium: "O'rta",
    high: 'Yuqori',
    critical: 'Juda muhim',
  },
  statuses: {
    planned: 'Rejalashtirilgan',
    in_progress: 'Jarayonda',
    approaching: 'Yaqinlashmoqda',
    overdue: "Muddat o'tgan",
    achieved: 'Erishildi',
    paused: "To'xtatilgan",
    archived: 'Arxivlangan',
  },
  evidenceStatuses: {
    officially_verified: 'Rasmiy tasdiqlangan',
    institution_specific: 'Universitetga bog‘liq',
    estimated: 'Taxminiy',
    user_provided: 'Foydalanuvchi kiritgan',
    requires_confirmation: 'Tasdiqlash talab etiladi',
  },
};

const EN_BUNDLE: GoalsTranslationBundle = {
  navLabel: 'Goals',
  pageTitle: 'Goals & Certifications',
  pageSubtitle: 'Plan your future. Track your measurable progress. Achieve your international targets.',
  tabs: {
    overview: 'Overview',
    certificates: 'Certificates',
    simulator: 'Country Value',
    myGoals: 'My Goals',
    analytics: 'Analytics',
  },
  kpis: {
    activeGoals: 'Active Goals',
    achievedGoals: 'Achieved',
    nearestDeadline: 'Nearest Deadline',
    averageProgress: 'Average Progress',
    daysLeft: 'days left',
    noDeadline: 'No deadline set',
    quotaRemaining: 'Active Limit',
    unlimited: 'Unlimited',
  },
  overview: {
    dailyStepTitle: 'Most Important Step Today',
    next7DaysTitle: 'Next 7 Days',
    upcomingDeadlines: 'Upcoming Deadlines',
    upcomingMilestones: 'Key Milestones',
    atRiskLabel: 'Needs Attention',
    conflictsLabel: 'Date Conflicts',
    noUpcoming7Days: 'No urgent deadlines within the next 7 days. Stay steady on your highest-priority preparation block.',
    whichCertTitle: 'Which Certificate Do I Need?',
    whichCertSubtitle: 'Identify required, recommended, optional, and unnecessary exams for your target country and study language.',
    analyzeNeedBtn: 'Analyze My Exam Strategy',
    analyzingBtn: 'Analyzing...',
    requiredExams: 'Required Examinations',
    recommendedExams: 'Recommended',
    optionalExams: 'Optional Boosters',
    unnecessaryExams: 'Not Needed Right Now',
    prepOrder: 'Recommended Preparation Order',
    activeGoalsPreview: 'Your Active Goals',
    createNewGoal: 'Create New Goal',
    exploreCertificates: 'Explore Certificates',
    openSimulator: 'Open Value Simulator',
  },
  certExplorer: {
    searchPlaceholder: 'Search certificates, exams, languages, or issuers (IELTS, JLPT, SAT, AWS, Milliy Sertifikat)...',
    allCategories: 'All Categories',
    allSubcategories: 'All Subjects / Languages',
    allCountries: 'All Countries',
    allScoreFormats: 'All Score Formats',
    favoritesOnly: 'Favorites',
    recentlyViewed: 'Recently Viewed',
    sortPopularity: 'Popularity',
    sortFeeAsc: 'Fee (Low to High)',
    sortFeeDesc: 'Fee (High to Low)',
    sortValidity: 'Validity Period',
    addAsGoal: '+ Goal',
    alreadyInGoals: 'Added',
    details: 'View',
    compare: 'Compare',
    comparing: 'Comparing',
    compareSelected: 'Compare',
    saveFavorite: 'Save',
    officialSite: 'Portal',
    validityLabel: 'Validity',
    feeLabel: 'Approx. Fee',
    scoreFormatLabel: 'Scoring Model',
    sourceLabel: 'Source',
    verifiedLabel: 'Last Verified',
    unverifiedFee: 'Information unverified.',
    noResults: 'No certificates match your current filters.',
    compareModalTitle: 'Side-by-Side Certificate Comparison',
    compareSubtitle: 'Examinations are rarely interchangeable — compare purpose, scoring architecture, and acceptance rules carefully.',
  },
  simulator: {
    title: 'Certificate Value & Opportunity Simulator',
    subtitle: 'What real academic, career, and funding opportunities does the same qualification unlock across different countries?',
    targetCountry: 'Target Country',
    compareCountry: 'Compare With Country (Optional)',
    noneOption: 'None',
    addQualification: 'Add Qualification',
    selectedQualifications: 'Selected Qualifications Bundle',
    statusObtained: 'Obtained',
    statusPlanned: 'Planned',
    currentScoreLabel: 'Current Result',
    targetScoreLabel: 'Target Result',
    cardUniversity: 'Universities',
    cardCareer: 'Careers',
    cardScholarshipVisa: 'Privileges',
    studentWorkHeading: 'Student Work Authorization (Separate Rules)',
    matrixTitle: 'Cross-Country Opportunity Matrix',
    matrixSubtitle: 'Evidence-based overview across major destinations — verify exact faculty rules on official portals.',
    disclaimerTitle: 'Educational Planning Tool',
    upgradeMultiCert: 'Multi-certificate combinations unlock on Scholar Plus and Global Elite Pro.',
    upgradeMultiCountry: 'Side-by-side multi-country comparison unlocks on Global Elite Pro.',
  },
  goalsWorkspace: {
    viewCards: 'Goals',
    viewTimeline: 'Timeline',
    viewClusters: 'Goal Strategy Clusters',
    createGoal: 'New Goal',
    editGoal: 'Edit Goal',
    goalTitle: 'Goal Title',
    category: 'Category',
    goalType: 'Goal Structure',
    startDate: 'Start Date',
    targetDate: 'Target Date (Optional)',
    currentProgress: 'Current Score / Level',
    targetResult: 'Target Score / Level',
    priority: 'Priority',
    motivation: 'Motivation Note (Why does this matter?)',
    targetCountry: 'Target Country (Optional)',
    estimatedBudget: 'Estimated Budget (USD)',
    notes: 'Personal Notes',
    milestonesTitle: 'Intermediate Milestones',
    addMilestone: '+ Add Milestone',
    dependsOn: 'Prerequisite Goal Dependencies',
    linkedLibrary: 'Linked Research Library Materials',
    aiStrategyBtn: 'AI Plan',
    markAchieved: 'Done',
    achievedBadge: 'Achieved ✓',
    pause: 'Pause',
    resume: 'Resume',
    archive: 'Archive',
    deleteConfirm: 'Delete this goal permanently?',
    timelineFilters: {
      all: 'All',
      week: 'This Week',
      month: 'This Month',
      year: 'This Year',
      upcoming: 'Upcoming',
      completed: 'Achieved',
      overdue: 'Overdue',
    },
    clustersTitle: 'Goal Strategy — Weighted Goal Clusters',
    clustersSubtitle: 'Group connected goals under one flagship objective with customizable importance weights and conflict warnings.',
    createCluster: 'Create Strategy Cluster',
    weightedProgress: 'Weighted Strategy Progress',
    conflictWarning: 'Scheduling Conflict Detected',
    emptyGoalsTitle: 'No personal goals created yet',
    emptyGoalsBody: 'Pick an examination from the Certificate Explorer or create your own measurable goal.',
    quotaReachedBanner: 'Free Explorer supports up to 3 active goals. Completed and archived goals do not consume your active quota.',
  },
  strategist: {
    modalTitle: 'AI Goal Strategist (10-Agent Ecosystem)',
    activeAgentsHeading: 'Coordinated Existing Platform Agents',
    generateBtn: 'Generate Preparation Plan',
    regenerateBtn: 'Regenerate Plan',
    generating: 'Agents collaborating on strategy...',
    studyHoursLabel: 'Available Daily Study Time (Hours)',
    syncPanelTitle: 'One-Click Ecosystem Synchronization (Preview & Approve)',
    syncRoutine: 'Add Study Blocks to AI Routine (Lock-Safe)',
    syncTodo: 'Add Tasks to To-Do List (Duplicate-Safe)',
    syncHabits: 'Add Daily Habit to Habits Tracker',
    syncRoadmap: "Link Milestone to Akademik yo'lim",
    syncLibrary: 'Search Matching Materials in Research Library',
    applySelected: 'Apply Approved Sync Items',
    syncedSuccess: 'Selected items synchronized cleanly',
    upgradeRequired: 'AI Goal Strategist and ecosystem synchronization require Scholar Plus or Global Elite Pro.',
    stagesTitle: 'Preparation Stages',
    weeklyTargetsTitle: 'Weekly Targets',
    monthlyMilestonesTitle: 'Monthly Milestones',
    checkpointsTitle: 'Practice & Progress Checkpoints',
    fallbackTitle: 'Alternative Strategy if Progress Slows',
  },
  analytics: {
    title: 'Goal Analytics & Achievement Intelligence',
    subtitle: 'Actual measurable progress, supportive deadline risk diagnostics, and completion history.',
    categoryDistribution: 'Distribution by Category',
    deadlineRiskTitle: 'Deadline Risk Analysis',
    noRisksMessage: 'No active goals are currently flagged at risk. Keep maintaining sustainable consistency.',
    achievementsTitle: 'Achievement Milestones',
    completedHistory: 'Completed Goals History',
    exportJson: 'Export JSON',
    exportMarkdown: 'Export Plan (Markdown)',
    exportUpgradeNote: 'Exportable goal plans unlock on Global Elite Pro.',
  },
  certCategories: {
    languages: 'Languages',
    math_science: 'Math & Sciences',
    it_tech: 'IT & Technology',
    business_pro: 'Business & Professional',
    other_international: 'Other International',
  },
  goalCategories: {
    language_certificates: 'Language Certificates',
    math_sciences: 'Math & Sciences',
    national_certificates: 'National Certificates',
    it_professional: 'IT & Professional Certifications',
    universities_scholarships: 'Universities & Scholarships',
    programming_tech: 'Programming & Technology',
    personal_development: 'Personal Development',
    other: 'Other Goals',
  },
  goalTypes: {
    score: 'Score-Based (IELTS / SAT / TOEFL)',
    level: 'Level-Based (JLPT / CEFR / TOPIK)',
    binary: 'Binary Milestone (Portfolio / Application)',
    quantitative: 'Quantitative Count (N Projects / Books)',
    milestone: 'Multi-Milestone Track (MEXT / Admission)',
  },
  priorities: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  },
  statuses: {
    planned: 'Planned',
    in_progress: 'In Progress',
    approaching: 'Approaching',
    overdue: 'Overdue',
    achieved: 'Achieved',
    paused: 'Paused',
    archived: 'Archived',
  },
  evidenceStatuses: {
    officially_verified: 'Officially Verified',
    institution_specific: 'Institution-Specific',
    estimated: 'Estimated',
    user_provided: 'User-Provided',
    requires_confirmation: 'Requires Confirmation',
  },
};

const RU_BUNDLE: GoalsTranslationBundle = {
  ...EN_BUNDLE,
  navLabel: 'Цели',
  pageTitle: 'Цели и Сертификаты',
  pageSubtitle: 'Планируйте будущее. Отслеживайте измеримый прогресс. Достигайте международных целей.',
  tabs: {
    overview: 'Обзор',
    certificates: 'Сертификаты',
    simulator: 'Ценность по странам',
    myGoals: 'Мои цели',
    analytics: 'Аналитика',
  },
  kpis: {
    activeGoals: 'Активные цели',
    achievedGoals: 'Достигнуто',
    nearestDeadline: 'Ближайший срок',
    averageProgress: 'Средний прогресс',
    daysLeft: 'дн. осталось',
    noDeadline: 'Срок не указан',
    quotaRemaining: 'Лимит активных',
    unlimited: 'Безлимит',
  },
  overview: {
    ...EN_BUNDLE.overview,
    dailyStepTitle: 'Главный шаг на сегодня',
    next7DaysTitle: 'Следующие 7 дней',
    whichCertTitle: 'Какой сертификат мне нужен?',
    analyzeNeedBtn: 'Запустить ИИ-анализ',
    analyzingBtn: 'Анализ...',
    createNewGoal: 'Создать цель',
    exploreCertificates: 'Каталог сертификатов',
    openSimulator: 'Открыть симулятор',
  },
  certExplorer: {
    ...EN_BUNDLE.certExplorer,
    searchPlaceholder: 'Поиск экзаменов (IELTS, JLPT, SAT, AWS)...',
    addAsGoal: '+ Цель',
    alreadyInGoals: 'Добавлено',
    details: 'Открыть',
    compare: 'Сравнить',
    comparing: 'В сравнении',
    officialSite: 'Портал',
  },
  simulator: {
    ...EN_BUNDLE.simulator,
    title: 'Симулятор ценности сертификатов',
    subtitle: '',
    cardUniversity: 'Университеты',
    cardCareer: 'Профессии',
    cardScholarshipVisa: 'Льготы',
  },
  goalsWorkspace: {
    ...EN_BUNDLE.goalsWorkspace,
    viewCards: 'Цели',
    viewTimeline: 'Хронология',
    viewClusters: 'Кластеры',
    createGoal: '+ Цель',
    aiStrategyBtn: 'ИИ-план',
    markAchieved: 'Готово',
    achievedBadge: 'Достигнуто ✓',
  },
  certCategories: {
    languages: 'Языки',
    math_science: 'Математика и науки',
    it_tech: 'IT и Технологии',
    business_pro: 'Бизнес и Профессия',
    other_international: 'Другие международные',
  },
  statuses: {
    planned: 'Запланировано',
    in_progress: 'В процессе',
    approaching: 'Скоро срок',
    overdue: 'Просрочено',
    achieved: 'Достигнуто',
    paused: 'Приостановлено',
    archived: 'В архиве',
  },
  priorities: {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    critical: 'Критичный',
  },
};

const JA_BUNDLE: GoalsTranslationBundle = {
  ...EN_BUNDLE,
  navLabel: '目標',
  pageTitle: '目標・国際資格インテリジェンス',
  pageSubtitle: '未来を設計し、進捗を可視化し、国際的な目標を達成する。',
  tabs: {
    overview: '概要',
    certificates: '資格・試験',
    simulator: '国別価値シミュレーター',
    myGoals: 'マイ目標',
    analytics: '分析と統計',
  },
  overview: {
    ...EN_BUNDLE.overview,
    dailyStepTitle: '今日の最重要ステップ',
    next7DaysTitle: '今後7日間',
    whichCertTitle: 'どの資格が必要ですか？',
    createNewGoal: '新しい目標を作成',
  },
  certExplorer: {
    ...EN_BUNDLE.certExplorer,
    addAsGoal: '+ 目標に追加',
    details: '詳細',
    compare: '比較',
    officialSite: '公式サイト',
  },
  goalsWorkspace: {
    ...EN_BUNDLE.goalsWorkspace,
    aiStrategyBtn: 'AIで達成計画を作成',
    achievedBadge: '達成 ✓',
  },
  statuses: {
    planned: '計画中',
    in_progress: '進行中',
    approaching: '期限間近',
    overdue: '期限超過',
    achieved: '達成',
    paused: '一時停止',
    archived: 'アーカイブ',
  },
};

const ZH_BUNDLE: GoalsTranslationBundle = {
  ...EN_BUNDLE,
  navLabel: '目标',
  pageTitle: '目标与国际认证中心',
  pageSubtitle: '规划未来，追踪真实进度，实现国际学术与职业目标。',
  tabs: {
    overview: '总览',
    certificates: '国际证书',
    simulator: '国家价值模拟',
    myGoals: '我的目标',
    analytics: '分析统计',
  },
  overview: {
    ...EN_BUNDLE.overview,
    dailyStepTitle: '今日最重要的一步',
    next7DaysTitle: '未来7天',
    whichCertTitle: '我需要哪个证书？',
    createNewGoal: '创建新目标',
  },
  certExplorer: {
    ...EN_BUNDLE.certExplorer,
    addAsGoal: '+ 添加为目标',
    details: '详情',
    compare: '对比',
    officialSite: '官方网站',
  },
  goalsWorkspace: {
    ...EN_BUNDLE.goalsWorkspace,
    aiStrategyBtn: '用 AI 制定达成计划',
    achievedBadge: '已达成 ✓',
  },
  statuses: {
    planned: '已规划',
    in_progress: '进行中',
    approaching: '即将到期',
    overdue: '已逾期',
    achieved: '已达成',
    paused: '已暂停',
    archived: '已归档',
  },
};

const DE_BUNDLE: GoalsTranslationBundle = {
  ...EN_BUNDLE,
  navLabel: 'Ziele',
  pageTitle: 'Ziele & Zertifikate',
  pageSubtitle: 'Planen Sie Ihre Zukunft. Messen Sie Ihren Fortschritt. Erreichen Sie Ihre internationalen Ziele.',
  tabs: {
    overview: 'Übersicht',
    certificates: 'Zertifikate',
    simulator: 'Länderwert-Simulator',
    myGoals: 'Meine Ziele',
    analytics: 'Analyse & Statistik',
  },
  overview: {
    ...EN_BUNDLE.overview,
    dailyStepTitle: 'Wichtigster Schritt heute',
    next7DaysTitle: 'Nächste 7 Tage',
    whichCertTitle: 'Welches Zertifikat brauche ich?',
    createNewGoal: 'Neues Ziel erstellen',
  },
  certExplorer: {
    ...EN_BUNDLE.certExplorer,
    addAsGoal: '+ Als Ziel hinzufügen',
    details: 'Details',
    compare: 'Vergleichen',
    officialSite: 'Offizielle Website',
  },
  goalsWorkspace: {
    ...EN_BUNDLE.goalsWorkspace,
    aiStrategyBtn: 'KI-Vorbereitungsplan erstellen',
    achievedBadge: 'Erreicht ✓',
  },
  statuses: {
    planned: 'Geplant',
    in_progress: 'In Bearbeitung',
    approaching: 'Frist naht',
    overdue: 'Überfällig',
    achieved: 'Erreicht',
    paused: 'Pausiert',
    archived: 'Archiviert',
  },
};

export const GOALS_TRANSLATIONS: Record<LanguageCode, GoalsTranslationBundle> = {
  uz: UZ_BUNDLE,
  en: EN_BUNDLE,
  ru: RU_BUNDLE,
  ja: JA_BUNDLE,
  zh: ZH_BUNDLE,
  de: DE_BUNDLE,
};

export function getGoalsTranslations(language: LanguageCode): GoalsTranslationBundle {
  return GOALS_TRANSLATIONS[language] || GOALS_TRANSLATIONS.en;
}
