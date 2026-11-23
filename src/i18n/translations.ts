import type { LanguageCode } from '../types/domain';

export interface TranslationBundle {
  brandName: string;
  brandSubtitle: string;
  welcomeTagline: string;
  signInGoogle: string;
  continueGuest: string;
  nav: {
    dashboard: string;
    worldExplorer: string;
    exploreByCity: string;
    countries: string;
    universities: string;
    academicPrograms: string;
    scholarships: string;
    globalRankings: string;
    admissionIntelligence: string;
    universityComparison: string;
    myUniversities: string;
    goals: string;
    myAcademicJourney: string;
    financialPlanner: string;
    aiAdvisor: string;
    researchLibrary: string;
    accountSettings: string;
    subscriptions: string;
    paperJournal: string;
    routine: string;
    todoList: string;
    about: string;
    audioGuide: string;
  };
  groups: {
    discover: string;
    academics: string;
    workspace: string;
    aiIntelligence: string;
    account: string;
  };
  common: {
    searchPlaceholder: string;
    viewUniversity: string;
    saveUniversity: string;
    saved: string;
    compare: string;
    comparing: string;
    verified: string;
    estimated: string;
    officialWebsite: string;
    officialMedia: string;
    officialApply: string;
    loading: string;
    all: string;
    resetFilters: string;
    tuitionAnnual: string;
    livingMonthly: string;
    founded: string;
    language: string;
    appearance: string;
    lightMode: string;
    darkMode: string;
    bwMode: string;
    plan: string;
    upgradePlan: string;
    country: string;
    city: string;
    university: string;
    scholarship: string;
    program: string;
    deadline: string;
    notes: string;
    add: string;
    delete: string;
    cancel: string;
    save: string;
    details: string;
    hideDetails: string;
    back: string;
    close: string;
    allCountries: string;
    openCityExplorer: string;
    exploreAll: string;
    roadmap: string;
  };
  dashboard: {
    welcomePrefix: string;
    heroSummary: string;
    savedCount: string;
    recentlyViewed: string;
    favoriteDestinations: string;
    applicationProgress: string;
    upcomingDeadlines: string;
    recommendedTitle: string;
    quickTools: string;
  };
  worldExplorer: {
    title: string;
    subtitle: string;
    searchCountry: string;
    viewCities: string;
    countryDossier: string;
    unisCount: string;
    citiesCount: string;
  };
  cityExplorer: {
    title: string;
    subtitle: string;
    stepCountry: string;
    stepCity: string;
    stepUniversities: string;
    monthlyEstimate: string;
    studentPop: string;
  };
  countriesView: {
    title: string;
    subtitle: string;
    educationSystem: string;
    admissionSystem: string;
    languageReq: string;
    internationalInfo: string;
    academicOpportunities: string;
    tuitionRange: string;
    livingCost: string;
    officialPortal: string;
  };
  universitiesView: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    faculties: string;
    departments: string;
    researchAreas: string;
    facilities: string;
    strengths: string;
    studentCount: string;
    intlRatio: string;
  };
  programsView: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    duration: string;
    careerOutcomes: string;
    degreeLevel: string;
  };
  scholarshipsView: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    coverage: string;
    eligibility: string;
    requiredDocuments: string;
    trackScholarship: string;
  };
  rankingsView: {
    title: string;
    subtitle: string;
    worldRank: string;
    subjectArea: string;
    historicalTrend: string;
  };
  admissionView: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    academicQuals: string;
    languageTests: string;
    standardizedTests: string;
    entranceExam: string;
    applicationProcess: string;
  };
  comparisonView: {
    title: string;
    subtitle: string;
    emptyState: string;
    browseUnis: string;
    metrics: {
      location: string;
      founded: string;
      type: string;
      students: string;
      intlRatio: string;
      tuition: string;
      ranking: string;
    };
  };
  workspaceViews: {
    myUnisTitle: string;
    myUnisSubtitle: string;
    journeyTitle: string;
    journeySubtitle: string;
    addTask: string;
    libraryTitle: string;
    librarySubtitle: string;
    addResource: string;
  };
  financialView: {
    title: string;
    subtitle: string;
    currencyLabel: string;
    tuitionInput: string;
    monthsInput: string;
    housingInput: string;
    foodInput: string;
    transportInput: string;
    insuranceInput: string;
    materialsInput: string;
    otherInput: string;
    scholarshipInput: string;
    grossTotal: string;
    netAnnualCost: string;
    chartTitle: string;
  };
  advisorView: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    sendButton: string;
    verificationNotice: string;
  };
  accountView: {
    title: string;
    subtitle: string;
    profileTitle: string;
    displayName: string;
    educationLevel: string;
    targetDegree: string;
    disciplines: string;
    countries: string;
    notifications: string;
    exportData: string;
    deleteData: string;
  };
  subscriptionsView: {
    title: string;
    subtitle: string;
    monthly: string;
    annual: string;
    activePlan: string;
    upgradePlan: string;
    paymentGateways: string;
    billingHistory: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationBundle> = {
  en: {
    brandName: 'Global University Intelligence',
    brandSubtitle: 'Discover Universities. Explore Opportunities. Build Your Academic Future.',
    welcomeTagline: 'Editorial global discovery across verified institutions, cities, scholarships, and admission pathways.',
    signInGoogle: 'Continue with Google',
    continueGuest: 'Explore as Guest Scholar',
    nav: {
      dashboard: 'Dashboard',
      worldExplorer: 'World Map',
      exploreByCity: 'Cities',
      countries: 'Countries',
      universities: 'Universities',
      academicPrograms: 'Programs',
      scholarships: 'Scholarships',
      globalRankings: 'Rankings',
      admissionIntelligence: 'Admissions',
      universityComparison: 'Compare',
      myUniversities: 'Saved',
      goals: 'Goals',
      myAcademicJourney: 'My Pathway',
      financialPlanner: 'Finance',
      aiAdvisor: 'AI Advisor',
      researchLibrary: 'Library',
      accountSettings: 'Settings',
      subscriptions: 'Plans',
      paperJournal: 'Habits Tracker',
      routine: 'AI Routine',
      todoList: 'To-Do List',
      about: 'About',
      audioGuide: 'Audio Guide',
    },
    groups: {
      discover: 'DISCOVER',
      academics: 'ADMISSIONS',
      workspace: 'WORKSPACE',
      aiIntelligence: 'AI',
      account: 'SYSTEM',
    },
    common: {
      searchPlaceholder: 'Search universities, cities, grants...',
      viewUniversity: 'View',
      saveUniversity: 'Save',
      saved: 'Saved',
      compare: 'Compare',
      comparing: 'Comparing',
      verified: 'Verified',
      estimated: 'Estimated',
      officialWebsite: 'Website',
      officialMedia: 'Gallery',
      officialApply: 'Portal',
      loading: 'Loading...',
      all: 'All',
      resetFilters: 'Reset',
      tuitionAnnual: 'Tuition',
      livingMonthly: 'Living / mo',
      founded: 'Founded',
      language: 'Language',
      appearance: 'Theme',
      lightMode: 'Light',
      darkMode: 'Dark',
      bwMode: 'Mono',
      plan: 'Plan',
      upgradePlan: 'Plans',
      country: 'Country',
      city: 'City',
      university: 'University',
      scholarship: 'Scholarship',
      program: 'Program',
      deadline: 'Deadline',
      notes: 'Notes',
      add: 'Add',
      delete: 'Delete',
      cancel: 'Cancel',
      save: 'Save',
      details: 'View',
      hideDetails: 'Hide',
      back: 'Back',
      close: 'Close',
      allCountries: 'All Countries',
      openCityExplorer: 'Cities',
      exploreAll: 'View all',
      roadmap: 'Pathway',
    },
    dashboard: {
      welcomePrefix: 'Welcome back,',
      heroSummary: '',
      savedCount: 'Saved',
      recentlyViewed: 'Recently Viewed',
      favoriteDestinations: 'Destinations',
      applicationProgress: 'Documents',
      upcomingDeadlines: 'Deadlines',
      recommendedTitle: 'Recommended',
      quickTools: 'Quick Actions',
    },
    worldExplorer: {
      title: 'Interactive World Explorer',
      subtitle: 'Select a country directly on the geographical projection, filter by continent, or click city markers to inspect universities.',
      searchCountry: 'Search country...',
      viewCities: 'Explore Cities',
      countryDossier: 'Country Dossier',
      unisCount: 'unis',
      citiesCount: 'cities',
    },
    cityExplorer: {
      title: 'Explore Universities by City',
      subtitle: 'Select a country, inspect its historic and technical academic capitals, and examine verified institutions in their true cities.',
      stepCountry: '01. Select Country',
      stepCity: '02. Select Academic City',
      stepUniversities: '03. Universities in',
      monthlyEstimate: 'Est. monthly living',
      studentPop: 'Student community',
    },
    countriesView: {
      title: 'Global Country Dossiers',
      subtitle: 'Comprehensive analysis of education systems, admission frameworks, tuition benchmarks, and international student resources.',
      educationSystem: 'Education System',
      admissionSystem: 'Admission System',
      languageReq: 'Language Requirements',
      internationalInfo: 'International Student Information',
      academicOpportunities: 'Academic Opportunities',
      tuitionRange: 'Estimated Annual Tuition Range',
      livingCost: 'Estimated Monthly Living Cost',
      officialPortal: 'Official Education Portal',
    },
    universitiesView: {
      title: 'University Database',
      subtitle: 'Explore verified global higher education institutions with official websites, faculties, campus facilities, and admission portals.',
      searchPlaceholder: 'Search university name, city, or discipline...',
      faculties: 'Faculties & Schools',
      departments: 'Departments',
      researchAreas: 'Research Areas',
      facilities: 'Campus Facilities',
      strengths: 'Academic Strengths',
      studentCount: 'Enrolled Students',
      intlRatio: 'International Student Ratio',
    },
    programsView: {
      title: 'Academic Program Finder',
      subtitle: 'Discover Bachelor, Master, and PhD degree programs across verified global institutions.',
      searchPlaceholder: 'Search academic programs, disciplines, or universities...',
      duration: 'Program Duration',
      careerOutcomes: 'Career Outcomes',
      degreeLevel: 'Degree Level',
    },
    scholarshipsView: {
      title: 'Scholarship Database',
      subtitle: 'Explore fully-funded and partial scholarships for international students worldwide.',
      searchPlaceholder: 'Search scholarships, providers, or countries...',
      coverage: 'Coverage Summary',
      eligibility: 'Eligibility Criteria',
      requiredDocuments: 'Required Application Documents',
      trackScholarship: 'Track Scholarship',
    },
    rankingsView: {
      title: 'Global University Rankings',
      subtitle: 'Compare standings across independent global ranking bodies with distinct publication years and methodologies.',
      worldRank: 'World Rank',
      subjectArea: 'Subject Area',
      historicalTrend: 'Historical Ranking Trend',
    },
    admissionView: {
      title: 'Admission Intelligence',
      subtitle: 'Inspect standardized test thresholds, language proficiency criteria, application deadlines, and admission portals.',
      searchPlaceholder: 'Search admission requirements by university...',
      academicQuals: 'Academic Qualifications',
      languageTests: 'Language Proficiency (IELTS / TOEFL)',
      standardizedTests: 'Standardized Examinations',
      entranceExam: 'Entrance Examinations',
      applicationProcess: 'Application Process',
    },
    comparisonView: {
      title: 'Side-by-Side University Comparison',
      subtitle: 'Compare up to 4 institutions across rankings, tuition, student population, language of instruction, and verification status.',
      emptyState: 'No universities currently selected for comparison.',
      browseUnis: 'Browse Universities',
      metrics: {
        location: 'Location',
        founded: 'Founded Year',
        type: 'Institution Type',
        students: 'Student Population',
        intlRatio: 'International Ratio',
        tuition: 'Annual Tuition',
        ranking: 'Global Standing',
      },
    },
    workspaceViews: {
      myUnisTitle: 'My Saved Universities',
      myUnisSubtitle: 'Organize saved institutions by collection, priority, and application stage.',
      journeyTitle: 'My Academic Journey Roadmap',
      journeySubtitle: 'Track application milestones, exams, recommendations, and scholarship deadlines.',
      addTask: 'Add Application Milestone',
      libraryTitle: 'Research Library Archive',
      librarySubtitle: 'Save curriculum PDFs, embassy guides, and research notes.',
      addResource: 'Save Research Resource',
    },
    financialView: {
      title: 'Financial Planning & Cost Simulator',
      subtitle: 'Model annual international study expenses across tuition, living, insurance, and scholarship offsets.',
      currencyLabel: 'Display Currency',
      tuitionInput: 'Annual Tuition (USD)',
      monthsInput: 'Academic Stay (Months)',
      housingInput: 'Monthly Accommodation (USD)',
      foodInput: 'Monthly Food & Groceries (USD)',
      transportInput: 'Monthly Local Transit (USD)',
      insuranceInput: 'Annual Health Insurance (USD)',
      materialsInput: 'Study Materials & Books (USD/yr)',
      otherInput: 'Other Personal Expenses (USD/yr)',
      scholarshipInput: 'Expected Scholarship Grant (USD/yr)',
      grossTotal: 'Gross Annual Total',
      netAnnualCost: 'Estimated Net Annual Cost',
      chartTitle: 'Annual Living Cost Comparison Across Study Capitals',
    },
    advisorView: {
      title: 'AI Advisor',
      subtitle: '',
      inputPlaceholder: 'Ask about universities, grants, or study plans...',
      sendButton: 'Send',
      verificationNotice: '',
    },
    accountView: {
      title: 'Settings',
      subtitle: '',
      profileTitle: 'Academic Profile',
      displayName: 'Name',
      educationLevel: 'Education Level',
      targetDegree: 'Target Degree',
      disciplines: 'Disciplines',
      countries: 'Target Countries',
      notifications: 'Notifications',
      exportData: 'Export JSON',
      deleteData: 'Delete Data',
    },
    subscriptionsView: {
      title: 'Plans',
      subtitle: '',
      monthly: 'Monthly',
      annual: 'Annual',
      activePlan: 'Current Plan',
      upgradePlan: 'Select Plan',
      paymentGateways: 'Payment Methods',
      billingHistory: 'Billing History',
    },
  },
  uz: {
    brandName: 'Global University Intelligence',
    brandSubtitle: 'Universitetlarni kashf eting. Imkoniyatlarni o‘rganing. Akademik kelajagingizni quring.',
    welcomeTagline: 'Tasdiqlangan universitetlar, akademik shaharlar, stipendiyalar va qabul talablari bo‘yicha xalqaro tahlil platformasi.',
    signInGoogle: 'Google orqali kirish',
    continueGuest: 'Mehmon sifatida davom etish',
    nav: {
      dashboard: 'Boshqaruv paneli',
      worldExplorer: 'Dunyo xaritasi',
      exploreByCity: 'Shaharlar',
      countries: 'Mamlakatlar',
      universities: 'Universitetlar',
      academicPrograms: 'Dasturlar',
      scholarships: 'Stipendiyalar',
      globalRankings: 'Reytinglar',
      admissionIntelligence: 'Qabul tahlili',
      universityComparison: 'Taqqoslash',
      myUniversities: 'Saqlanganlar',
      goals: 'Maqsadlar',
      myAcademicJourney: 'Akademik yo‘lim',
      financialPlanner: 'Moliyaviy reja',
      aiAdvisor: 'AI maslahatchi',
      researchLibrary: 'Kutubxona',
      accountSettings: 'Sozlamalar',
      subscriptions: 'Tariflar',
      paperJournal: 'Habits Tracker',
      routine: 'AI Routine',
      todoList: 'To-Do List',
      about: 'Ilova haqida',
      audioGuide: 'Audio gid',
    },
    groups: {
      discover: 'KASHFIYOT',
      academics: 'QABUL',
      workspace: 'SHAXSIY',
      aiIntelligence: 'AI',
      account: 'TIZIM',
    },
    common: {
      searchPlaceholder: 'Universitet, shahar yoki grant qidiring...',
      viewUniversity: 'Ko‘rish',
      saveUniversity: 'Saqlash',
      saved: 'Saqlangan',
      compare: 'Taqqoslash',
      comparing: 'Tanlangan',
      verified: 'Tasdiqlangan',
      estimated: 'Taxminiy',
      officialWebsite: 'Sayt',
      officialMedia: 'Galereya',
      officialApply: 'Portal',
      loading: 'Yuklanmoqda...',
      all: 'Barchasi',
      resetFilters: 'Tozalash',
      tuitionAnnual: 'Kontrakt',
      livingMonthly: 'Oylik xarajat',
      founded: 'Tashkil etilgan',
      language: 'Til',
      appearance: 'Ko‘rinish',
      lightMode: 'Yorug‘',
      darkMode: 'Qorong‘i',
      bwMode: 'Oq-qora',
      plan: 'Tarif',
      upgradePlan: 'Tariflar',
      country: 'Mamlakat',
      city: 'Shahar',
      university: 'Universitet',
      scholarship: 'Stipendiya',
      program: 'Dastur',
      deadline: 'Muddat',
      notes: 'Eslatmalar',
      add: 'Qo‘shish',
      delete: 'O‘chirish',
      cancel: 'Bekor qilish',
      save: 'Saqlash',
      details: 'Ko‘rish',
      hideDetails: 'Yashirish',
      back: 'Orqaga',
      close: 'Yopish',
      allCountries: 'Barcha davlatlar',
      openCityExplorer: 'Shaharlar',
      exploreAll: 'Barchasi',
      roadmap: 'Yo‘l xaritasi',
    },
    dashboard: {
      welcomePrefix: 'Xush kelibsiz,',
      heroSummary: '',
      savedCount: 'Saqlangan',
      recentlyViewed: 'Yaqinda ko‘rilgan',
      favoriteDestinations: 'Yo‘nalishlar',
      applicationProgress: 'Hujjatlar',
      upcomingDeadlines: 'Muddatlar',
      recommendedTitle: 'Tavsiyalar',
      quickTools: 'Tezkor vositalar',
    },
    worldExplorer: {
      title: 'Interaktiv dunyo xaritasi',
      subtitle: 'Xaritadan bevosita mamlakatni tanlang, qit’a bo‘yicha filtrlang yoki universitetlarni ko‘rish uchun shahar nuqtalarini bosing.',
      searchCountry: 'Mamlakatni qidirish...',
      viewCities: 'Shaharlarni o‘rganish',
      countryDossier: 'Mamlakat dosyesi',
      unisCount: 'universitet',
      citiesCount: 'shahar',
    },
    cityExplorer: {
      title: 'Shaharlar bo‘yicha universitetlar',
      subtitle: 'Mamlakatni tanlang, akademik markazlarni o‘rganing va har bir shahardagi oliygohlarni toping.',
      stepCountry: '01. Mamlakatni tanlang',
      stepCity: '02. Shaharni tanlang',
      stepUniversities: '03. Shahardagi universitetlar:',
      monthlyEstimate: 'Taxminiy oylik yashash xarajati',
      studentPop: 'Talabalar jamoasi',
    },
    countriesView: {
      title: 'Global mamlakat dosyelari',
      subtitle: 'Ta’lim tizimlari, qabul mexanizmlari, kontrakt me’yohlari va xalqaro talaba resurslari bo‘yicha tahlil.',
      educationSystem: 'Ta’lim tizimi',
      admissionSystem: 'Qabul tizimi',
      languageReq: 'Til talablari',
      internationalInfo: 'Xalqaro talabalar uchun ma’lumot',
      academicOpportunities: 'Akademik imkoniyatlar',
      tuitionRange: 'Taxminiy yillik kontrakt diapazoni',
      livingCost: 'Taxminiy oylik yashash xarajati',
      officialPortal: 'Rasmiy ta’lim portali',
    },
    universitiesView: {
      title: 'Universitetlar ma’lumotlar bazasi',
      subtitle: 'Rasmiy veb-saytlar, fakultetlar, kampus imkoniyatlari va qabul portallari bilan ta’minlangan oliygohlar.',
      searchPlaceholder: 'Universitet nomi, shahar yoki mutaxassislikni qidiring...',
      faculties: 'Fakultetlar va maktablar',
      departments: 'Kafedralar',
      researchAreas: 'Tadqiqot yo‘nalishlari',
      facilities: 'Kampus imkoniyatlari',
      strengths: 'Akademik ustunliklar',
      studentCount: 'Talabalar soni',
      intlRatio: 'Xalqaro talabalar ulushi',
    },
    programsView: {
      title: 'Akademik dasturlar qidiruvi',
      subtitle: 'Bakalavr, magistratura va doktorantura dasturlarini kashf eting.',
      searchPlaceholder: 'Dastur, fan sohasi yoki universitetni qidiring...',
      duration: 'O‘qish davomiyligi',
      careerOutcomes: 'Karyera istiqbollari',
      degreeLevel: 'Daraja darajasi',
    },
    scholarshipsView: {
      title: 'Stipendiyalar bazasi',
      subtitle: 'Xalqaro talabalar uchun to‘liq va qisman grant dasturlari.',
      searchPlaceholder: 'Stipendiya, ta’minotchi yoki mamlakatni qidiring...',
      coverage: 'Qoplash xarajati',
      eligibility: 'Talabgorlik mezonlari',
      requiredDocuments: 'Talab qilinadigan hujjatlar',
      trackScholarship: 'Stipendiyani kuzatish',
    },
    rankingsView: {
      title: 'Jahon universitetlari reytinglari',
      subtitle: 'Mustaqil global reyting agentliklari ko‘rsatkichlarini taqqoslang.',
      worldRank: 'Jahon o‘rni',
      subjectArea: 'Fan sohasi',
      historicalTrend: 'Tarixiy reyting dinamikasi',
    },
    admissionView: {
      title: 'Qabul tahlili va talablar',
      subtitle: 'Standart test eshiklari, til bilish mezonlari va qabul muddatlarini tekshiring.',
      searchPlaceholder: 'Universitet qabul talablarini qidiring...',
      academicQuals: 'Akademik malakalar',
      languageTests: 'Til bilish darajasi (IELTS / TOEFL)',
      standardizedTests: 'Standartlashtirilgan imtihonlar',
      entranceExam: 'Kirish imtihonlari',
      applicationProcess: 'Hujjat topshirish jarayoni',
    },
    comparisonView: {
      title: 'Universitetlarni taqqoslash',
      subtitle: '4 tagacha oliygohni reyting, kontrakt, talabalar soni va til bo‘yicha yonma-yon solishtiring.',
      emptyState: 'Hozircha taqqoslash uchun universitet tanlanmagan.',
      browseUnis: 'Universitetlarni ko‘rish',
      metrics: {
        location: 'Manzil',
        founded: 'Tashkil etilgan yili',
        type: 'Muassasa turi',
        students: 'Talabalar soni',
        intlRatio: 'Xalqaro ulush',
        tuition: 'Kontrakt to‘lovi',
        ranking: 'Jahon o‘rni',
      },
    },
    workspaceViews: {
      myUnisTitle: 'Saqlangan universitetlarim',
      myUnisSubtitle: 'Saralangan oliygohlarni to‘plam, ustuvorlik va bosqich bo‘yicha boshqaring.',
      journeyTitle: 'Akademik yo‘l xaritasi',
      journeySubtitle: 'Hujjat topshirish bosqichlari, imtihonlar va stipendiya muddatlarini kuzatib boring.',
      addTask: 'Bosqich qo‘shish',
      libraryTitle: 'Tadqiqot kutubxonasi',
      librarySubtitle: 'O‘quv dasturlari PDF fayllari va eslatmalarni saqlang.',
      addResource: 'Tadqiqot manbasini saqlash',
    },
    financialView: {
      title: 'Moliyaviy reja va xarajat kalkulyatori',
      subtitle: 'Kontrakt, yashash, sug‘urta va stipendiya chegirmalarini hisoblang.',
      currencyLabel: 'Valyuta',
      tuitionInput: 'Yillik kontrakt (USD)',
      monthsInput: 'O‘qish oylari (Oylar)',
      housingInput: 'Oylik yotoqxona/ijara (USD)',
      foodInput: 'Oylik oziq-ovqat (USD)',
      transportInput: 'Oylik transport (USD)',
      insuranceInput: 'Yillik sug‘urta (USD)',
      materialsInput: 'O‘quv qurollari (USD/yil)',
      otherInput: 'Boshqa xarajatlar (USD/yil)',
      scholarshipInput: 'Kutilayotgan grant/stipendiya (USD/yil)',
      grossTotal: 'Umumiy yillik xarajat',
      netAnnualCost: 'Sof yillik xarajat',
      chartTitle: 'Shaharlar bo‘yicha oylik yashash xarajatlarini solishtirish',
    },
    advisorView: {
      title: 'AI maslahatchi',
      subtitle: '',
      inputPlaceholder: 'Universitet, grant yoki o‘qish rejasi haqida yozing...',
      sendButton: 'Yuborish',
      verificationNotice: '',
    },
    accountView: {
      title: 'Sozlamalar',
      subtitle: '',
      profileTitle: 'Akademik profil',
      displayName: 'Ism',
      educationLevel: 'Ta’lim darajasi',
      targetDegree: 'Maqsadli daraja',
      disciplines: 'Sohalar',
      countries: 'Davlatlar',
      notifications: 'Bildirishnomalar',
      exportData: 'Eksport (JSON)',
      deleteData: 'Ma’lumotlarni o‘chirish',
    },
    subscriptionsView: {
      title: 'Tariflar',
      subtitle: '',
      monthly: 'Oylik',
      annual: 'Yillik',
      activePlan: 'Faol tarif',
      upgradePlan: 'Tanlash',
      paymentGateways: 'To‘lov usullari',
      billingHistory: 'To‘lovlar tarixi',
    },
  },
  ru: {
    brandName: 'Global University Intelligence',
    brandSubtitle: 'Открывайте университеты. Исследуйте возможности. Стройте академическое будущее.',
    welcomeTagline: 'Международная платформа для анализа проверенных университетов, городов обучения, стипендий и требований к поступлению.',
    signInGoogle: 'Войти через Google',
    continueGuest: 'Продолжить как гость',
    nav: {
      dashboard: 'Главная',
      worldExplorer: 'Карта мира',
      exploreByCity: 'Города',
      countries: 'Страны',
      universities: 'Университеты',
      academicPrograms: 'Программы',
      scholarships: 'Стипендии',
      globalRankings: 'Рейтинги',
      admissionIntelligence: 'Поступление',
      universityComparison: 'Сравнение',
      myUniversities: 'Сохранённые',
      goals: 'Цели',
      myAcademicJourney: 'Учебный путь',
      financialPlanner: 'Финансы',
      aiAdvisor: 'AI-советник',
      researchLibrary: 'Библиотека',
      accountSettings: 'Настройки',
      subscriptions: 'Тарифы',
      paperJournal: 'Habits Tracker',
      routine: 'AI Routine',
      todoList: 'To-Do List',
      about: 'О платформе',
      audioGuide: 'Аудиогид',
    },
    groups: {
      discover: 'ПОИСК',
      academics: 'ПОСТУПЛЕНИЕ',
      workspace: 'ЛИЧНОЕ',
      aiIntelligence: 'AI',
      account: 'СИСТЕМА',
    },
    common: {
      searchPlaceholder: 'Поиск вузов, городов или грантов...',
      viewUniversity: 'Открыть',
      saveUniversity: 'Сохранить',
      saved: 'Сохранено',
      compare: 'Сравнить',
      comparing: 'В сравнении',
      verified: 'Проверено',
      estimated: 'Оценка',
      officialWebsite: 'Сайт',
      officialMedia: 'Галерея',
      officialApply: 'Портал',
      loading: 'Загрузка...',
      all: 'Все',
      resetFilters: 'Сбросить',
      tuitionAnnual: 'Контракт',
      livingMonthly: 'В месяц',
      founded: 'Основан',
      language: 'Язык',
      appearance: 'Тема',
      lightMode: 'Светлая',
      darkMode: 'Тёмная',
      bwMode: 'Моно',
      plan: 'Тариф',
      upgradePlan: 'Тарифы',
      country: 'Страна',
      city: 'Город',
      university: 'Университет',
      scholarship: 'Стипендия',
      program: 'Программа',
      deadline: 'Дедлайн',
      notes: 'Заметки',
      add: 'Добавить',
      delete: 'Удалить',
      cancel: 'Отмена',
      save: 'Сохранить',
      details: 'Открыть',
      hideDetails: 'Скрыть',
      back: 'Назад',
      close: 'Закрыть',
      allCountries: 'Все страны',
      openCityExplorer: 'Города',
      exploreAll: 'Все',
      roadmap: 'План',
    },
    dashboard: {
      welcomePrefix: 'С возвращением,',
      heroSummary: '',
      savedCount: 'Сохранённые',
      recentlyViewed: 'Недавние',
      favoriteDestinations: 'Направления',
      applicationProgress: 'Документы',
      upcomingDeadlines: 'Дедлайны',
      recommendedTitle: 'Рекомендации',
      quickTools: 'Инструменты',
    },
    worldExplorer: {
      title: 'Интерактивная карта мира',
      subtitle: 'Выбирайте страны на карте, фильтруйте по континентам или нажимайте на города для просмотра вузов.',
      searchCountry: 'Поиск страны...',
      viewCities: 'Изучить города',
      countryDossier: 'Досье страны',
      unisCount: 'вузов',
      citiesCount: 'городов',
    },
    cityExplorer: {
      title: 'Университеты по городам',
      subtitle: 'Выберите страну, изучите академические центры и откройте проверенные университеты каждого города.',
      stepCountry: '01. Выберите страну',
      stepCity: '02. Выберите город',
      stepUniversities: '03. Университеты города',
      monthlyEstimate: 'Расходы в месяц',
      studentPop: 'Студенческая среда',
    },
    countriesView: {
      title: 'Досье стран мира',
      subtitle: 'Подробный анализ систем образования, правил поступления, стоимости обучения и стипендий.',
      educationSystem: 'Система образования',
      admissionSystem: 'Система поступления',
      languageReq: 'Языковые требования',
      internationalInfo: 'Информация для иностранцев',
      academicOpportunities: 'Академические возможности',
      tuitionRange: 'Диапазон стоимости обучения',
      livingCost: 'Расходы на проживание',
      officialPortal: 'Официальный образовательный портал',
    },
    universitiesView: {
      title: 'База университетов',
      subtitle: 'Исследуйте ведущие мировые вузы, их факультеты, кампусы и официальные сайты.',
      searchPlaceholder: 'Поиск по названию вуза, городу или специальности...',
      faculties: 'Факультеты',
      departments: 'Кафедры',
      researchAreas: 'Научные направления',
      facilities: 'Инфраструктура',
      strengths: 'Академические сильные стороны',
      studentCount: 'Студентов',
      intlRatio: 'Доля иностранцев',
    },
    programsView: {
      title: 'Поиск академических программ',
      subtitle: 'Находите программы бакалавриата, магистратуры и докторантуры в ведущих вузах.',
      searchPlaceholder: 'Поиск программ или специальностей...',
      duration: 'Длительность',
      careerOutcomes: 'Карьерные перспективы',
      degreeLevel: 'Ученая степень',
    },
    scholarshipsView: {
      title: 'База стипендий',
      subtitle: 'Полные и частичные гранты для иностранных студентов по всему миру.',
      searchPlaceholder: 'Поиск стипендий или фондов...',
      coverage: 'Покрытие расходов',
      eligibility: 'Критерии отбора',
      requiredDocuments: 'Необходимые документы',
      trackScholarship: 'Отслеживать стипендию',
    },
    rankingsView: {
      title: 'Мировые рейтинги университетов',
      subtitle: 'Сравнение позиций в независимых глобальных рейтингах (QS, THE, ARWU).',
      worldRank: 'Мировая позиция',
      subjectArea: 'Предметная область',
      historicalTrend: 'Динамика позиций',
    },
    admissionView: {
      title: 'Требования к поступлению',
      subtitle: 'Пороги стандартизированных тестов, языковые требования и дедлайны подачи.',
      searchPlaceholder: 'Поиск требований по вузу...',
      academicQuals: 'Академические квалификации',
      languageTests: 'Языковые тесты (IELTS / TOEFL)',
      standardizedTests: 'Стандартизированные тесты',
      entranceExam: 'Вступительные экзамены',
      applicationProcess: 'Процесс подачи заявки',
    },
    comparisonView: {
      title: 'Сравнение университетов',
      subtitle: 'Сравните до 4 вузов по рейтингам, стоимости, количеству студентов и условиям.',
      emptyState: 'Для сравнения пока не выбрано ни одного университета.',
      browseUnis: 'Выбрать университеты',
      metrics: {
        location: 'Расположение',
        founded: 'Год основания',
        type: 'Тип учреждения',
        students: 'Количество студентов',
        intlRatio: 'Доля иностранцев',
        tuition: 'Стоимость обучения',
        ranking: 'Мировой рейтинг',
      },
    },
    workspaceViews: {
      myUnisTitle: 'Мои сохраненные университеты',
      myUnisSubtitle: 'Управляйте списком выбранных вузов, приоритетами и статусами подачи.',
      journeyTitle: 'Академический путеводитель',
      journeySubtitle: 'Следите за этапами поступления, экзаменами и дедлайнами стипендий.',
      addTask: 'Добавить задачу',
      libraryTitle: 'Исследовательская библиотека',
      librarySubtitle: 'Сохраняйте учебные материалы, руководства и заметки.',
      addResource: 'Добавить ресурс',
    },
    financialView: {
      title: 'Финансовый планер и симулятор затрат',
      subtitle: 'Рассчитайте расходы на обучение, проживание, страховку и учет грантов.',
      currencyLabel: 'Валюта отображения',
      tuitionInput: 'Обучение за год (USD)',
      monthsInput: 'Срок учебы (месяцев)',
      housingInput: 'Проживание в месяц (USD)',
      foodInput: 'Питание в месяц (USD)',
      transportInput: 'Транспорт в месяц (USD)',
      insuranceInput: 'Страховка за год (USD)',
      materialsInput: 'Учебные материалы (USD/год)',
      otherInput: 'Прочие расходы (USD/год)',
      scholarshipInput: 'Ожидаемый грант (USD/год)',
      grossTotal: 'Общие расходы за год',
      netAnnualCost: 'Чистая стоимость за год',
      chartTitle: 'Сравнение стоимости проживания по городам',
    },
    advisorView: {
      title: 'AI-советник',
      subtitle: '',
      inputPlaceholder: 'Спросите о вузах, грантах или учебном плане...',
      sendButton: 'Отправить',
      verificationNotice: '',
    },
    accountView: {
      title: 'Настройки',
      subtitle: '',
      profileTitle: 'Академический профиль',
      displayName: 'Имя',
      educationLevel: 'Уровень образования',
      targetDegree: 'Целевая степень',
      disciplines: 'Направления',
      countries: 'Страны',
      notifications: 'Уведомления',
      exportData: 'Экспорт (JSON)',
      deleteData: 'Удалить данные',
    },
    subscriptionsView: {
      title: 'Тарифы',
      subtitle: '',
      monthly: 'Ежемесячно',
      annual: 'Ежегодно',
      activePlan: 'Текущий тариф',
      upgradePlan: 'Выбрать',
      paymentGateways: 'Способы оплаты',
      billingHistory: 'История платежей',
    },
  },
  ja: {
    brandName: 'Global University Intelligence',
    brandSubtitle: '世界の大学を発見し、機会を探求し、学術的な未来を築く。',
    welcomeTagline: '検証済みの大学、学園都市、奨学金、出願要件を横断して探求する国際教育プラットフォーム。',
    signInGoogle: 'Googleで続行',
    continueGuest: 'ゲストとして探索',
    nav: {
      dashboard: 'ダッシュボード',
      worldExplorer: '世界マップ探索',
      exploreByCity: '都市から探す',
      countries: '国別ガイド',
      universities: '大学一覧',
      academicPrograms: '専攻・プログラム',
      scholarships: '奨学金検索',
      globalRankings: '世界大学ランキング',
      admissionIntelligence: '入試・出願分析',
      universityComparison: '大学比較',
      myUniversities: '保存した大学',
      goals: '目標',
      myAcademicJourney: '進学ロードマップ',
      financialPlanner: '留学資金プラン',
      aiAdvisor: 'AI進学アドバイザー',
      researchLibrary: 'リサーチライブラリ',
      accountSettings: 'アカウント設定',
      subscriptions: 'プランと請求',
      paperJournal: 'Habits Tracker',
      routine: 'ルーティン',
      todoList: 'To-Doリスト',
      about: 'アプリと開発者について',
      audioGuide: '音声ガイド',
    },
    groups: {
      discover: 'グローバル探索',
      academics: '入試・学術リサーチ',
      workspace: '学習ワークスペース',
      aiIntelligence: 'AIインテリジェンス',
      account: 'アカウント・アプリ',
    },
    common: {
      searchPlaceholder: '大学名、都市、専攻、奨学金を検索...',
      viewUniversity: '大学詳細を見る',
      saveUniversity: '保存',
      saved: '保存済み',
      compare: '比較に追加',
      comparing: '比較中',
      verified: '検証済み',
      estimated: '推定値',
      officialWebsite: '公式サイト',
      officialMedia: '公式キャンパス写真',
      officialApply: '公式出願ページ',
      loading: '学術データを読み込み中...',
      all: 'すべて',
      resetFilters: '条件をリセット',
      tuitionAnnual: '年間学費',
      livingMonthly: '月額生活費',
      founded: '創立年',
      language: '言語',
      appearance: '表示モード',
      lightMode: 'ライト',
      darkMode: 'ダーク',
      bwMode: 'モノクロ',
      plan: 'プラン',
      upgradePlan: 'プラン管理',
      country: '国',
      city: '都市',
      university: '大学',
      scholarship: '奨学金',
      program: 'プログラム',
      deadline: '締切日',
      notes: 'メモ',
      add: '追加',
      delete: '削除',
      cancel: 'キャンセル',
      save: '保存',
      details: '詳細',
      hideDetails: '閉じる',
      back: '戻る',
      close: '閉じる',
      allCountries: 'すべての国',
      openCityExplorer: '都市を探す',
      exploreAll: 'すべて見る',
      roadmap: 'ロードマップ',
    },
    dashboard: {
      welcomePrefix: 'おかえりなさい、',
      heroSummary: '保存した志望校、進捗状況、奨学金スケジュールを一元管理。',
      savedCount: '保存済み大学',
      recentlyViewed: '最近の閲覧',
      favoriteDestinations: '注目留学先',
      applicationProgress: '出願準備進捗',
      upcomingDeadlines: '直近の出願締切',
      recommendedTitle: 'おすすめの大学',
      quickTools: '主要ツール',
    },
    worldExplorer: {
      title: 'インタラクティブ世界マップ',
      subtitle: '地理的マップから国を選択するか、大陸フィルターや都市マーカーで大学を探索します。',
      searchCountry: '国を検索...',
      viewCities: '都市を探索',
      countryDossier: '国別ガイド',
      unisCount: '大学',
      citiesCount: '都市',
    },
    cityExplorer: {
      title: '都市から大学を探す',
      subtitle: '国を選択し、学園都市のプロフィールと所在大学を正確に探索できます。',
      stepCountry: '01. 国を選択',
      stepCity: '02. 都市を選択',
      stepUniversities: '03. 都市の大学:',
      monthlyEstimate: '推定月額生活費',
      studentPop: '学生人口',
    },
    countriesView: {
      title: '国別教育ガイド',
      subtitle: '教育システム、入試制度、学費水準、留学生向けリソースの包括的分析。',
      educationSystem: '教育システム',
      admissionSystem: '入試システム',
      languageReq: '言語要件',
      internationalInfo: '留学生向け情報',
      academicOpportunities: '学術的機会',
      tuitionRange: '想定年間学費範囲',
      livingCost: '想定月額生活費',
      officialPortal: '公式教育ポータル',
    },
    universitiesView: {
      title: '大学データベース',
      subtitle: '公式サイト、学部、キャンパス施設、出願ポータルを備えた検証済み世界最高峰の大学を探索。',
      searchPlaceholder: '大学名、都市、専攻を検索...',
      faculties: '学部・スクール',
      departments: '学科',
      researchAreas: '研究分野',
      facilities: 'キャンパス施設',
      strengths: '学術的強み',
      studentCount: '在籍学生数',
      intlRatio: '留学生比率',
    },
    programsView: {
      title: '学術プログラムファインダー',
      subtitle: '学士、修士、博士号プログラムを世界中の検証済み機関から発見。',
      searchPlaceholder: '専攻や大学を検索...',
      duration: '修業年限',
      careerOutcomes: 'キャリア実績',
      degreeLevel: '学位レベル',
    },
    scholarshipsView: {
      title: '奨学金データベース',
      subtitle: '世界中の留学生向けの全額・一部免除奨学金を探索。',
      searchPlaceholder: '奨学金や提供機関を検索...',
      coverage: '支給内容',
      eligibility: '受給資格要件',
      requiredDocuments: '必要出願書類',
      trackScholarship: '奨学金を追跡',
    },
    rankingsView: {
      title: '世界大学ランキング',
      subtitle: '独立した世界ランキング機関の評価を比較。',
      worldRank: '世界順位',
      subjectArea: '分野別',
      historicalTrend: '過去のランキング推移',
    },
    admissionView: {
      title: '入試・出願インテリジェンス',
      subtitle: '標準試験の基準、語学要件、出願締切、出願ポータルを確認。',
      searchPlaceholder: '大学の出願要件を検索...',
      academicQuals: '学力要件',
      languageTests: '語学力（IELTS / TOEFL）',
      standardizedTests: '標準試験',
      entranceExam: '入学試験',
      applicationProcess: '出願プロセス',
    },
    comparisonView: {
      title: '大学の並び替え比較',
      subtitle: '最大4つの大学をランキング、学費、学生数、言語要件などで比較。',
      emptyState: '比較対象の大学が選択されていません。',
      browseUnis: '大学を探す',
      metrics: {
        location: '所在地',
        founded: '創立年',
        type: '機関タイプ',
        students: '学生数',
        intlRatio: '留学生比率',
        tuition: '年間学費',
        ranking: '世界順位',
      },
    },
    workspaceViews: {
      myUnisTitle: '保存した大学',
      myUnisSubtitle: 'コレクション、優先順位、出願ステージごとに保存した大学を整理。',
      journeyTitle: '進学ロードマップ',
      journeySubtitle: '出願マイルストーン、試験、推薦状、奨学金締切を管理。',
      addTask: 'マイルストーンを追加',
      libraryTitle: 'リサーチライブラリ',
      librarySubtitle: 'シラバス、大使館ガイド、研究ノートを保存。',
      addResource: 'リソースを保存',
    },
    financialView: {
      title: '留学資金プラン・費用のシミュレーション',
      subtitle: '学費、生活費、保険、奨学金控除を考慮した年間留学費用を算出。',
      currencyLabel: '表示通貨',
      tuitionInput: '年間学費 (USD)',
      monthsInput: '滞在月数 (月)',
      housingInput: '月額住居費 (USD)',
      foodInput: '月額食費 (USD)',
      transportInput: '月額交通費 (USD)',
      insuranceInput: '年間医療保険 (USD)',
      materialsInput: '教材費 (USD/年)',
      otherInput: 'その他の生活費 (USD/年)',
      scholarshipInput: '想定奨学金給付額 (USD/年)',
      grossTotal: '総年間費用',
      netAnnualCost: '想定実質年間費用',
      chartTitle: '都市別年間生活費の比較',
    },
    advisorView: {
      title: 'AI進学アドバイザー',
      subtitle: '検証済みデータに基づくカタログ根拠の学術ガイダンス。',
      inputPlaceholder: '大学、専攻、奨学金、出願準備について質問する...',
      sendButton: 'アドバイザーに質問',
      verificationNotice: '正確な締切日は各大学の公式ポータルでご確認ください。',
    },
    accountView: {
      title: 'アカウント・設定',
      subtitle: 'プロフィール、学術的目標、言語、外観モードの管理。',
      profileTitle: '学術プロフィール',
      displayName: '表示名',
      educationLevel: '現在の学年・学歴',
      targetDegree: '目標とする学位',
      disciplines: '関心分野',
      countries: '希望留学先国',
      notifications: '通知設定',
      exportData: '学術データをエクスポート (JSON)',
      deleteData: 'ワークスペースデータを削除',
    },
    subscriptionsView: {
      title: 'プランと請求',
      subtitle: '奨学生サブスクリプションプランの比較と決済ゲートウェイの確認。',
      monthly: '月払い',
      annual: '年払い',
      activePlan: '現在のプラン',
      upgradePlan: 'プランをアップグレード',
      paymentGateways: '対応決済ゲートウェイ',
      billingHistory: '請求履歴',
    },
  },
  zh: {
    brandName: 'Global University Intelligence',
    brandSubtitle: '发现全球名校，探索学术机遇，规划国际未来。',
    welcomeTagline: '整合权威高校数据、大学城风貌、奖学金项目与申请要求的全球高等教育情报平台。',
    signInGoogle: '使用 Google 登录',
    continueGuest: '以访客身份探索',
    nav: {
      dashboard: '总览仪表盘',
      worldExplorer: '世界地图探索',
      exploreByCity: '按城市探索',
      countries: '国家留学指南',
      universities: '全球大学库',
      academicPrograms: '学术专业查找',
      scholarships: '奖学金数据库',
      globalRankings: '全球大学排名',
      admissionIntelligence: '录取要求情报',
      universityComparison: '院校对比',
      myUniversities: '我的收藏院校',
      goals: '目标',
      myAcademicJourney: '学业规划路径',
      financialPlanner: '留学财务规划',
      aiAdvisor: 'AI 升学顾问',
      researchLibrary: '研究资料库',
      accountSettings: '账户与设置',
      subscriptions: '会员方案',
      paperJournal: 'Habits Tracker',
      routine: '学习日程 (Routine)',
      todoList: '待办清单 (To-Do)',
      about: '关于应用与作者',
      audioGuide: '语音向导',
    },
    groups: {
      discover: '全球探索',
      academics: '申请与学术研究',
      workspace: '个人学习空间',
      aiIntelligence: 'AI 智能中心',
      account: '账户与应用',
    },
    common: {
      searchPlaceholder: '搜索大学、城市、专业或奖学金...',
      viewUniversity: '查看院校详情',
      saveUniversity: '收藏',
      saved: '已收藏',
      compare: '对比',
      comparing: '已加入对比',
      verified: '已核实',
      estimated: '估算值',
      officialWebsite: '官方网站',
      officialMedia: '官方校园图库',
      officialApply: '官方申请入口',
      loading: '正在加载权威学术数据...',
      all: '全部',
      resetFilters: '重置筛选',
      tuitionAnnual: '年学费',
      livingMonthly: '月生活费',
      founded: '建校年份',
      language: '界面语言',
      appearance: '外观模式',
      lightMode: '浅色',
      darkMode: '深色',
      bwMode: '黑白',
      plan: '方案',
      upgradePlan: '管理方案',
      country: '国家',
      city: '城市',
      university: '大学',
      scholarship: '奖学金',
      program: '项目',
      deadline: '截止日期',
      notes: '备注',
      add: '添加',
      delete: '删除',
      cancel: '取消',
      save: '保存',
      details: '详情',
      hideDetails: '收起',
      back: '返回',
      close: '关闭',
      allCountries: '所有国家',
      openCityExplorer: '探索城市',
      exploreAll: '查看全部',
      roadmap: '规划路线',
    },
    dashboard: {
      welcomePrefix: '欢迎回来，',
      heroSummary: '您的国际升学地图、收藏院校清单与权威奖学金时间表。',
      savedCount: '已收藏院校',
      recentlyViewed: '最近浏览',
      favoriteDestinations: '意向留学国家',
      applicationProgress: '申请准备度',
      upcomingDeadlines: '近期截止日期',
      recommendedTitle: '推荐探索院校',
      quickTools: '核心规划工具',
    },
    worldExplorer: {
      title: '互动世界地图探索',
      subtitle: '直接在地理投影上选择国家，按大洲筛选，或点击城市标记查看大学。',
      searchCountry: '搜索国家...',
      viewCities: '探索城市',
      countryDossier: '国家指南',
      unisCount: '所大学',
      citiesCount: '个城市',
    },
    cityExplorer: {
      title: '按城市探索大学',
      subtitle: '选择国家与大学城，精准查看该城市内的著名高等学府。',
      stepCountry: '01. 选择国家',
      stepCity: '02. 选择学术城市',
      stepUniversities: '03. 所在城市院校：',
      monthlyEstimate: '预估月生活费',
      studentPop: '学生规模',
    },
    countriesView: {
      title: '全球国家留学指南',
      subtitle: '深入解析教育体制、录取框架、学费基准与国际生资源。',
      educationSystem: '教育体制',
      admissionSystem: '录取体系',
      languageReq: '语言要求',
      internationalInfo: '国际生须知',
      academicOpportunities: '学术机遇',
      tuitionRange: '预估年学费范围',
      livingCost: '预估月生活费',
      officialPortal: '官方教育门户',
    },
    universitiesView: {
      title: '全球大学数据库',
      subtitle: '探索拥有官方网站、院系设置、校园设施与招生入口的核实高等学府。',
      searchPlaceholder: '搜索大学名称、城市或专业...',
      faculties: '院系设置',
      departments: '系所',
      researchAreas: '研究领域',
      facilities: '校园设施',
      strengths: '学术优势',
      studentCount: '在校学生',
      intlRatio: '国际生比例',
    },
    programsView: {
      title: '学术专业查找',
      subtitle: '发现全球顶尖院校的本科、硕士与博士学位项目。',
      searchPlaceholder: '搜索专业、学科或大学...',
      duration: '学制年限',
      careerOutcomes: '就业前景',
      degreeLevel: '学位层次',
    },
    scholarshipsView: {
      title: '奖学金数据库',
      subtitle: '探索面向全球留学生的免学费与部分资助奖学金项目。',
      searchPlaceholder: '搜索奖学金、机构或国家...',
      coverage: '资助内容',
      eligibility: '申请资格',
      requiredDocuments: '所需申请文件',
      trackScholarship: '追踪奖学金',
    },
    rankingsView: {
      title: '全球大学排名',
      subtitle: '对比 QS、THE 和 ARWU 等独立全球排名机构的榜单与评级。',
      worldRank: '世界排名',
      subjectArea: '学科领域',
      historicalTrend: '历史排名走势',
    },
    admissionView: {
      title: '录取要求情报',
      subtitle: '查阅标准化考试标准、语言成绩要求、申请截止日期与招生入口。',
      searchPlaceholder: '按大学搜索录取要求...',
      academicQuals: '学术资质',
      languageTests: '语言能力 (IELTS / TOEFL)',
      standardizedTests: '标准化考试',
      entranceExam: '入学考试',
      applicationProcess: '申请流程',
    },
    comparisonView: {
      title: '院校对比',
      subtitle: '横向对比多达 4 所院校的排名、学费、学生规模、教学语言与核实状态。',
      emptyState: '当前未选择任何进行对比的大学。',
      browseUnis: '浏览大学',
      metrics: {
        location: '地理位置',
        founded: '建校年份',
        type: '院校类型',
        students: '学生规模',
        intlRatio: '国际生比例',
        tuition: '年学费',
        ranking: '世界排名',
      },
    },
    workspaceViews: {
      myUnisTitle: '我的收藏院校',
      myUnisSubtitle: '按收藏夹、优先级和申请进展管理保存的大学。',
      journeyTitle: '学业规划路径',
      journeySubtitle: '追踪申请里程碑、标准化考试、推荐信与奖学金截止日期。',
      addTask: '添加申请里程碑',
      libraryTitle: '研究资料库',
      librarySubtitle: '保存课程大纲、使馆指南与研究笔记。',
      addResource: '保存研究资料',
    },
    financialView: {
      title: '留学财务规划与成本模拟器',
      subtitle: '测算包含学费、住宿、生活、保险及奖学金抵扣在内的年度留学总支出。',
      currencyLabel: '显示币种',
      tuitionInput: '年学费 (USD)',
      monthsInput: '学年月份 (个月)',
      housingInput: '每月住宿 (USD)',
      foodInput: '每月伙食 (USD)',
      transportInput: '每月交通 (USD)',
      insuranceInput: '年医疗保险 (USD)',
      materialsInput: '教材与书籍 (USD/年)',
      otherInput: '其他个人支出 (USD/年)',
      scholarshipInput: '预期奖学金资助 (USD/年)',
      grossTotal: '毛年度总支出',
      netAnnualCost: '预估净年度支出',
      chartTitle: '各大留学城市年度生活费对比',
    },
    advisorView: {
      title: 'AI 升学顾问',
      subtitle: '基于权威大学数据库，为您提供有据可依的升学指导。',
      inputPlaceholder: '向顾问咨询大学、专业、奖学金或申请规划...',
      sendButton: '向顾问提问',
      verificationNotice: '请在各高校官方招生网站最终确认申请周期。',
    },
    accountView: {
      title: '账户与设置',
      subtitle: '管理您的个人资料、升学目标、界面语言与外观模式。',
      profileTitle: '学术档案',
      displayName: '显示姓名',
      educationLevel: '当前教育阶段',
      targetDegree: '目标学位',
      disciplines: '意向学科',
      countries: '意向留学国家',
      notifications: '通知偏好',
      exportData: '导出学术数据 (JSON)',
      deleteData: '删除工作区数据',
    },
    subscriptionsView: {
      title: '会员方案与支付',
      subtitle: '对比学者会员方案并查看支付网关集成状态。',
      monthly: '按月付费',
      annual: '按年付费',
      activePlan: '当前方案',
      upgradePlan: '管理方案',
      paymentGateways: '支持的支付网关',
      billingHistory: '账单历史',
    },
  },
  de: {
    brandName: 'Global University Intelligence',
    brandSubtitle: 'Universitäten entdecken. Chancen erkunden. Akademische Zukunft gestalten.',
    welcomeTagline: 'Redaktionelle globale Plattform für verifizierte Hochschulen, Universitätsstädte, Stipendien und Zulassungswege.',
    signInGoogle: 'Mit Google fortfahren',
    continueGuest: 'Als Gast erkunden',
    nav: {
      dashboard: 'Übersicht',
      worldExplorer: 'Weltkarte',
      exploreByCity: 'Nach Stadt erkunden',
      countries: 'Länderprofile',
      universities: 'Universitäten',
      academicPrograms: 'Studiengänge',
      scholarships: 'Stipendien',
      globalRankings: 'Weltranglisten',
      admissionIntelligence: 'Zulassungsanalyse',
      universityComparison: 'Hochschulvergleich',
      myUniversities: 'Meine Hochschulen',
      goals: 'Ziele',
      myAcademicJourney: 'Akademischer Weg',
      financialPlanner: 'Finanzplaner',
      aiAdvisor: 'KI-Studienberater',
      researchLibrary: 'Forschungsbibliothek',
      accountSettings: 'Konto & Einstellungen',
      subscriptions: 'Tarife & Abrechnung',
      paperJournal: 'Habits Tracker',
      routine: 'Routine',
      todoList: 'To-Do-Liste',
      about: 'Über App & Autor',
      audioGuide: 'Audioguide',
    },
    groups: {
      discover: 'Weltweit entdecken',
      academics: 'Zulassung & Forschung',
      workspace: 'Persönlicher Arbeitsbereich',
      aiIntelligence: 'KI-Intelligenz',
      account: 'Konto & Anwendung',
    },
    common: {
      searchPlaceholder: 'Universitäten, Städte, Studiengänge oder Stipendien suchen...',
      viewUniversity: 'Profil ansehen',
      saveUniversity: 'Speichern',
      saved: 'Gespeichert',
      compare: 'Vergleichen',
      comparing: 'Im Vergleich',
      verified: 'Verifiziert',
      estimated: 'Geschätzt',
      officialWebsite: 'Offizielle Website',
      officialMedia: 'Offizielle Campus-Galerie',
      officialApply: 'Bewerbungsportal',
      loading: 'Verifizierte Hochschuldaten werden geladen...',
      all: 'Alle',
      resetFilters: 'Filter zurücksetzen',
      tuitionAnnual: 'Studiengebühr / Jahr',
      livingMonthly: 'Lebenshaltung / Monat',
      founded: 'Gegründet',
      language: 'Sprache',
      appearance: 'Erscheinungsbild',
      lightMode: 'Hell',
      darkMode: 'Dunkel',
      bwMode: 'Schwarzweiß',
      plan: 'Tarif',
      upgradePlan: 'Tarif verwalten',
      country: 'Land',
      city: 'Stadt',
      university: 'Universität',
      scholarship: 'Stipendium',
      program: 'Studiengang',
      deadline: 'Frist',
      notes: 'Notizen',
      add: 'Hinzufügen',
      delete: 'Löschen',
      cancel: 'Abbrechen',
      save: 'Speichern',
      details: 'Details',
      hideDetails: 'Ausblenden',
      back: 'Zurück',
      close: 'Schließen',
      allCountries: 'Alle Länder',
      openCityExplorer: 'Städte erkunden',
      exploreAll: 'Alle ansehen',
      roadmap: 'Fahrplan',
    },
    dashboard: {
      welcomePrefix: 'Willkommen zurück,',
      heroSummary: 'Ihr internationaler Hochschulatlas, gespeicherte Favoriten und Stipendienfristen.',
      savedCount: 'Gespeicherte Hochschulen',
      recentlyViewed: 'Zuletzt angesehen',
      favoriteDestinations: 'Bevorzugte Zielländer',
      applicationProgress: 'Bewerbungsfortschritt',
      upcomingDeadlines: 'Anstehende Fristen',
      recommendedTitle: 'Empfohlene Universitäten',
      quickTools: 'Planungswerkzeuge',
    },
    worldExplorer: {
      title: 'Interaktiver Weltatlas',
      subtitle: 'Wählen Sie Länder direkt auf der Weltkarte aus, filtern Sie nach Kontinenten oder klicken Sie auf Städte.',
      searchCountry: 'Land suchen...',
      viewCities: 'Städte erkunden',
      countryDossier: 'Länderprofil',
      unisCount: 'Unis',
      citiesCount: 'Städte',
    },
    cityExplorer: {
      title: 'Universitäten nach Stadt erkunden',
      subtitle: 'Wählen Sie ein Land, entdecken Sie seine Universitätsstädte und prüfen Sie verifizierte Hochschulen vor Ort.',
      stepCountry: '01. Land wählen',
      stepCity: '02. Stadt wählen',
      stepUniversities: '03. Hochschulen in',
      monthlyEstimate: 'Gesch. Monatskosten',
      studentPop: 'Studierendenanteil',
    },
    countriesView: {
      title: 'Länderprofile & Bildungssysteme',
      subtitle: 'Umfassende Analyse von Bildungssystemen, Zulassungsrahmen, Studiengebühren und Ressourcen.',
      educationSystem: 'Bildungssystem',
      admissionSystem: 'Zulassungssystem',
      languageReq: 'Sprachanforderungen',
      internationalInfo: 'Informationen für internationale Studierende',
      academicOpportunities: 'Akademische Möglichkeiten',
      tuitionRange: 'Geschätzte Studiengebühren',
      livingCost: 'Geschätzte Lebenshaltungskosten',
      officialPortal: 'Offizielles Bildungsportal',
    },
    universitiesView: {
      title: 'Hochschuldatenbank',
      subtitle: 'Entdecken Sie verifizierte Universitäten mit offiziellen Websites, Fakultäten und Portalen.',
      searchPlaceholder: 'Universität, Stadt oder Fachbereich suchen...',
      faculties: 'Fakultäten & Fachbereiche',
      departments: 'Abteilungen',
      researchAreas: 'Forschungsbereiche',
      facilities: 'Campus-Einrichtungen',
      strengths: 'Akademische Schwerpunkte',
      studentCount: 'Studierende',
      intlRatio: 'Anteil internationaler Studierender',
    },
    programsView: {
      title: 'Studiengangsfinder',
      subtitle: 'Entdecken Sie Bachelor-, Master- und Promotionsstudiengänge weltweit.',
      searchPlaceholder: 'Studiengänge oder Fachbereiche suchen...',
      duration: 'Regelstudienzeit',
      careerOutcomes: 'Karriereperspektiven',
      degreeLevel: 'Abschlussniveau',
    },
    scholarshipsView: {
      title: 'Stipendiendatenbank',
      subtitle: 'Voll- und Teilstipendien für internationale Studierende.',
      searchPlaceholder: 'Stipendien oder Anbieter suchen...',
      coverage: 'Förderungsdetails',
      eligibility: 'Voraussetzungen',
      requiredDocuments: 'Erforderliche Unterlagen',
      trackScholarship: 'Stipendium vormerken',
    },
    rankingsView: {
      title: 'Weltranglisten',
      subtitle: 'Vergleichen Sie Positionen in unabhängigen globalen Rankings.',
      worldRank: 'Weltplatzierung',
      subjectArea: 'Fachbereich',
      historicalTrend: 'Historischer Rangverlauf',
    },
    admissionView: {
      title: 'Zulassungsanalyse',
      subtitle: 'Prüfen Sie Sprachtests, Testergebnisse, Fristen und Bewerbungsportale.',
      searchPlaceholder: 'Zulassungsanforderungen suchen...',
      academicQuals: 'Akademische Qualifikationen',
      languageTests: 'Sprachnachweise (IELTS / TOEFL)',
      standardizedTests: 'Standardisierte Tests',
      entranceExam: 'Aufnahmeprüfungen',
      applicationProcess: 'Bewerbungsprozess',
    },
    comparisonView: {
      title: 'Hochschulvergleich',
      subtitle: 'Vergleichen Sie bis zu 4 Universitäten in Rankings, Gebühren und Studierendenzahlen.',
      emptyState: 'Aktuell sind keine Universitäten zum Vergleich ausgewählt.',
      browseUnis: 'Universitäten durchsuchen',
      metrics: {
        location: 'Standort',
        founded: 'Gründungsjahr',
        type: 'Hochschulart',
        students: 'Studierende',
        intlRatio: 'Ausländeranteil',
        tuition: 'Studiengebühren',
        ranking: 'Weltrangliste',
      },
    },
    workspaceViews: {
      myUnisTitle: 'Meine gespeicherten Hochschulen',
      myUnisSubtitle: 'Organisieren Sie Favoriten nach Sammlungen, Priorität und Bewerbungsstatus.',
      journeyTitle: 'Akademischer Weg & Roadmap',
      journeySubtitle: 'Verfolgen Sie Meilensteine, Prüfungen und Stipendienfristen.',
      addTask: 'Meilenstein hinzufügen',
      libraryTitle: 'Forschungsbibliothek',
      librarySubtitle: 'Speichern Sie Lehrpläne, Leitfäden und Notizen.',
      addResource: 'Ressource speichern',
    },
    financialView: {
      title: 'Finanzplaner & Kostenrechner',
      subtitle: 'Kalkulieren Sie Studiengebühren, Lebenshaltung, Versicherung und Stipendien.',
      currencyLabel: 'Währung',
      tuitionInput: 'Studiengebühr / Jahr (USD)',
      monthsInput: 'Aufenthaltsdauer (Monate)',
      housingInput: 'Wohnkosten / Monat (USD)',
      foodInput: 'Verpflegung / Monat (USD)',
      transportInput: 'ÖPNV / Monat (USD)',
      insuranceInput: 'Krankenversicherung / Jahr (USD)',
      materialsInput: 'Lehrmaterialien (USD/Jahr)',
      otherInput: 'Sonstige Ausgaben (USD/Jahr)',
      scholarshipInput: 'Erwartetes Stipendium (USD/Jahr)',
      grossTotal: 'Bruttogesamtkosten / Jahr',
      netAnnualCost: 'Geschätzte Nettokosten / Jahr',
      chartTitle: 'Vergleich der monatlichen Lebenshaltungskosten nach Städten',
    },
    advisorView: {
      title: 'KI-Studienberater',
      subtitle: 'Kataloggestützte akademische Beratung mit verifizierten Universitätsdaten.',
      inputPlaceholder: 'Fragen Sie nach Universitäten, Studiengängen oder Bewerbungen...',
      sendButton: 'Berater fragen',
      verificationNotice: 'Bitte prüfen Sie Fristen auf den offiziellen Portalen der Universitäten.',
    },
    accountView: {
      title: 'Konto & Einstellungen',
      subtitle: 'Verwalten Sie Ihr Profil, akademische Ziele, Sprache und Designmodus.',
      profileTitle: 'Akademisches Profil',
      displayName: 'Anzeigename',
      educationLevel: 'Aktuelles Bildungsniveau',
      targetDegree: 'Angestrebter Abschluss',
      disciplines: 'Fachbereiche',
      countries: 'Zielländer',
      notifications: 'Benachrichtigungen',
      exportData: 'Daten exportieren (JSON)',
      deleteData: 'Konto & Daten löschen',
    },
    subscriptionsView: {
      title: 'Tarife & Abrechnung',
      subtitle: 'Vergleichen Sie Mitgliedschaften und Zahlungsoptionen.',
      monthly: 'Monatlich',
      annual: 'Jährlich',
      activePlan: 'Aktiver Tarif',
      upgradePlan: 'Tarif verwalten',
      paymentGateways: 'Unterstützte Zahlungsanbieter',
      billingHistory: 'Abrechnungshistorie',
    },
  },
};
