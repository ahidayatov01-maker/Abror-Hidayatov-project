import type { CosmicSectionConfig } from './cosmicTypes';

/**
 * Centralized 10-shard configuration for the Cosmic Diamond Portal.
 * Every single shard maps directly to a genuine, existing Global University Intelligence section.
 */
export const COSMIC_SECTIONS: CosmicSectionConfig[] = [
  {
    id: 'ai-ecosystem',
    order: '01',
    shardIndex: 0,
    title: '10-Agent AI Ekotizimi',
    subtitle: 'AI Maslahatchi · 3 Jamoa · 10 Ixtisoslashgan Agent',
    category: 'Sun’iy Intellekt',
    accentHex: '#a855f7',
    secondaryHex: '#38bdf8',
    shortDescription:
      'Qabul, akademiya, moliya va kundalik strategiya bo‘yicha 10 ta mustaqil AI agenti hamkorlikda ishlaydigan markaziy intellekt tizimi.',
    purpose:
      'Savolingizni bir nechta mutaxassis nuqtai nazaridan tahlil qilib, aniq harakatlar va shaxsiy tavsiyalar berish.',
    powerSummary:
      'Har bir agent o‘z yo‘nalishida (universitet topish, grant qidirish, qabul auditi, yo‘l xaritasi, routine va byudjet) chuqur ixtisoslashgan.',
    solvesProblem:
      'Umumiy va yuzaki javoblar o‘rniga, real universitet ma’lumotlari hamda shaxsiy profilingizga tayangan tizimli AI qarorlarini yaratadi.',
    capabilities: [
      'Qabul, Strategiya va Moliya jamoalaridagi 10 ta real AI agent',
      'Avtomatik agent tanlash va bajarilgan harakatlar jurnali',
      'Profil, saqlangan OTMlar va maqsadlaringizga mos kontekstual tahlil',
      'O‘zbek va xalqaro tillarda tezkor intellektual maslahat',
    ],
    targetSection: 'ai-advisor',
    actionMode: 'navigate',
    previewKind: 'ai-agents',
  },
  {
    id: 'world-explorer',
    order: '02',
    shardIndex: 1,
    title: 'Dunyo Xaritasi',
    subtitle: 'World Explorer · Global Ta’lim Geografiyasi',
    category: 'Global Tadqiqot',
    accentHex: '#818cf8',
    secondaryHex: '#22d3ee',
    shortDescription:
      'Dunyo bo‘ylab yetakchi mamlakatlar, talabalar shaharlari va top universitetlarni interaktiv xarita orqali kashf etish moduli.',
    purpose:
      'Ta’lim mamlakati va shahar muhitini geografik, iqtisodiy hamda akademik kesimda bir joyda solishtirish.',
    powerSummary:
      'Mamlakat profili, yashash xarajatlari, til talablari va rasmiy universitet manbalarini yagona vizual xaritada birlashtiradi.',
    solvesProblem:
      'Turli saytlarda tarqoq bo‘lgan davlat va universitet ma’lumotlarini qidirishga ketadigan soatlarni bir necha soniyaga qisqartiradi.',
    capabilities: [
      'Interaktiv global xarita va mamlakatlar kesimidagi filtrlash',
      'Shahar yashash xarajatlari va talabalar ekotizimi tahlili',
      'Universitet profillari va rasmiy manbalarga tezkor o‘tish',
      'Taqqoslash va saqlangan OTMlar ro‘yxatiga bir klikda qo‘shish',
    ],
    targetSection: 'world-explorer',
    actionMode: 'navigate',
    previewKind: 'world-map',
  },
  {
    id: 'academic-roadmap',
    order: '03',
    shardIndex: 2,
    title: 'Akademik Yo‘lim',
    subtitle: 'GPS Akademik Yo‘l Xaritasi · 3 Muqobil Marshrut',
    category: 'GPS Strategiya',
    accentHex: '#c084fc',
    secondaryHex: '#6366f1',
    shortDescription:
      'Hozirgi ta’lim bosqichingizdan maqsadli xorijiy universitetgacha bo‘lgan bosqichma-bosqich GPS akademik marshrutingiz.',
    purpose:
      'To‘g‘ridan-to‘g‘ri qabul, Transfer va Grant yo‘nalishlari bo‘yicha aniq bekatlar, muddatlar va talablarni rejalashtirish.',
    powerSummary:
      'Direct, Transfer va Scholarship marshrutlarini vaqt, xarajat va murakkablik bo‘yicha parallel taqqoslash imkonini beradi.',
    solvesProblem:
      '“Qayerdan boshlashim kerak va keyingi qadam nima?” degan noaniqlikni aniq bosqichli yo‘l xaritasi bilan bartaraf etadi.',
    capabilities: [
      'Direct, Transfer va Scholarship strategik marshrutlari',
      'Har bir bekat uchun muddat, taxminiy byudjet va bajarish mezonlari',
      'Real vaqtda progress hisobi va bajarilgan bosqichlarni belgilash',
      'Shaxsiy mamlakat, daraja va mutaxassislikka moslashuvchan reja',
    ],
    targetSection: 'my-academic-journey',
    actionMode: 'navigate',
    previewKind: 'academic-roadmap',
  },
  {
    id: 'goals-certificates',
    order: '04',
    shardIndex: 3,
    title: 'Maqsadlar va Sertifikatlar',
    subtitle: '60+ Xalqaro Sertifikat · Simulyator & Davlat Qoidalari',
    category: 'Kvalifikatsiya',
    accentHex: '#e879f9',
    secondaryHex: '#38bdf8',
    shortDescription:
      'IELTS, SAT, JLPT, TestDaF, AWS va 60 dan ortiq xalqaro sertifikatlar bo‘yicha maqsad qo‘yish, ball simulyatsiyasi va mamlakat talablari.',
    purpose:
      'Kerakli imtihonlarni to‘g‘ri tanlash, muddatlarni boshqarish va maqsadli mamlakat talablariga tayyorlikni o‘lchash.',
    powerSummary:
      'Har bir sertifikat uchun rasmiy ball shkalasi, amal qilish muddati, taxminiy to‘lov va qabuldagi ahamiyatini tizimli ko‘rsatadi.',
    solvesProblem:
      'Qaysi sertifikat qaysi davlatga majburiy yoki ixtiyoriy ekanligidagi chalkashliklarni aniq katalog orqali yechadi.',
    capabilities: [
      '60+ xalqaro sertifikatning batafsil tizimli katalogi',
      'Mamlakatlar bo‘yicha rasmiy kvalifikatsiya profillari',
      'Shaxsiy ball va muddat simulyatori hamda maqsadlar kuzatuvi',
      'Tayyorlik bo‘shliqlarini aniqlash va ustuvor imtihonlarni belgilash',
    ],
    targetSection: 'goals',
    actionMode: 'navigate',
    previewKind: 'goals-certificates',
  },
  {
    id: 'smart-routine',
    order: '05',
    shardIndex: 4,
    title: 'Smart Routine',
    subtitle: 'Aqlli Kun Tartibi · Fokus Bloklari & AI Reja',
    category: 'Kundalik Intizom',
    accentHex: '#a78bfa',
    secondaryHex: '#60a5fa',
    shortDescription:
      'Kunlik o‘qish quvvatingiz, imtihon muddatlaringiz va ustuvor vazifalaringizga moslashtirilgan aqlli vaqt bloklari tizimi.',
    purpose:
      'Charchoqsiz va barqaror akademik natija uchun har bir soatni mazmunli fokus bloklariga taqsimlash.',
    powerSummary:
      'Kundalik yuklama balansi, chuqur o‘qish bloklari va bajarilish foizini bir ekranda nazorat qiladi.',
    solvesProblem:
      'Tartibsiz tayyorgarlik va prokrastinatsiyani aniq, real bajariladigan kunlik o‘quv jadvaliga aylantiradi.',
    capabilities: [
      'Kunlik o‘quv sig‘imi va fokus bloklari boshqaruvi',
      'Imtihon, til va akademik vazifalarni avtomatik taqsimlash',
      'Bajarilgan bloklar bo‘yicha kunlik ritm monitoringi',
      'Akademik yo‘l xaritasi va maqsadlar bilan uyg‘un ishlash',
    ],
    targetSection: 'routine',
    actionMode: 'navigate',
    previewKind: 'smart-routine',
  },
  {
    id: 'admission-intelligence',
    order: '06',
    shardIndex: 5,
    title: 'Qabul Tahlili',
    subtitle: 'Admission Intelligence · Hujjatlar & Talablar Auditi',
    category: 'Qabul Strategiyasi',
    accentHex: '#9333ea',
    secondaryHex: '#38bdf8',
    shortDescription:
      'Universitetlar kesimida GPA, til sertifikatlari, esselar, tavsiyanomalar va qabul muddatlari bo‘yicha chuqur tahlil moduli.',
    purpose:
      'Har bir tanlangan universitet talablarini real hujjatlar chek-listi bilan solishtirib, xatosiz ariza topshirish.',
    powerSummary:
      'Qabul talablarini standartlashtirilgan mezonlarga ajratib, yetishmayotgan hujjatlarni oldindan ko‘rsatib beradi.',
    solvesProblem:
      'Oxirgi daqiqada muhim hujjat yoki dedlaynni o‘tkazib yuborish xavfini keskin kamaytiradi.',
    capabilities: [
      'Universitetlar bo‘yicha qabul talablari va minimal ballar bazasi',
      'Shaxsiy hujjatlar chek-listi va tayyorlik nazorati',
      'Dedlaynlar va ariza bosqichlari bo‘yicha aniq ko‘rinish',
      'Rasmiy qabul portallariga to‘g‘ridan-to‘g‘ri ishonchli havolalar',
    ],
    targetSection: 'admission-intelligence',
    actionMode: 'navigate',
    previewKind: 'admission-intel',
  },
  {
    id: 'scholarships',
    order: '07',
    shardIndex: 6,
    title: 'Stipendiyalar',
    subtitle: 'Global Grantlar · To‘liq va Qisman Moliyalashtirish',
    category: 'Grantlar Bazasi',
    accentHex: '#d946ef',
    secondaryHex: '#818cf8',
    shortDescription:
      'MEXT, DAAD, Chevening, Fulbright, Erasmus va yetakchi universitet stipendiyalarini filtrlab topish va kuzatish markazi.',
    purpose:
      'Moliyaviy imkoniyatlaringizga mos eng kuchli xalqaro grantlarni topish va ariza holatini nazorat qilish.',
    powerSummary:
      'Qoplash darajasi (to‘liq/qisman), mamlakat, ta’lim bosqichi va muvofiqlik shartlarini bir zumda saralaydi.',
    solvesProblem:
      'Minglab grantlar ichidan aynan o‘zingizga mos va real imkoniyatli stipendiyalarni tez ajratib olishga yordam beradi.',
    capabilities: [
      'Mamlakat va daraja bo‘yicha tasdiqlangan grantlar katalogi',
      'To‘liq moliyalashtirish, oylik stipendiya va aviabilet qoplamasi tahlili',
      'Tanlangan stipendiyalarni saqlash va ariza statusini kuzatish',
      'Moliyaviy reja moduli bilan byudjet ta’sirini hisoblash',
    ],
    targetSection: 'scholarships',
    actionMode: 'navigate',
    previewKind: 'scholarships',
  },
  {
    id: 'financial-planner',
    order: '08',
    shardIndex: 7,
    title: 'Moliyaviy Reja',
    subtitle: 'Financial Planner · Ta’lim va Yashash Byudjeti',
    category: 'Byudjet Tahlili',
    accentHex: '#6366f1',
    secondaryHex: '#22d3ee',
    shortDescription:
      'Kontrakt, turar joy, ovqatlanish, transport, sug‘urta va grant chegirmalarini real valyuta kurslarida hisoblovchi moliyaviy kalkulyator.',
    purpose:
      'Xorijda o‘qishning haqiqiy yillik va oylik xarajatlarini oldindan aniq modellashtirish.',
    powerSummary:
      'Mamlakat va shahar ko‘rsatkichlari asosida sof yillik byudjetni shaffof taqsimlab ko‘rsatadi.',
    solvesProblem:
      'Yashirin yashash xarajatlarini oldindan ko‘rib, oilaviy va shaxsiy byudjetni xavfsiz rejalashtirishga ko‘maklashadi.',
    capabilities: [
      'Kontrakt + turar joy + oziq-ovqat + transport + sug‘urta tahlili',
      'Stipendiya va chegirmalarni sof byudjetdan avtomatik ayirish',
      'Ko‘p valyutali real kurs konvertatsiyasi',
      'Davlatlar bo‘yicha o‘rtacha ta’lim xarajatlarini qiyoslash',
    ],
    targetSection: 'financial-planner',
    actionMode: 'navigate',
    previewKind: 'financial-planner',
  },
  {
    id: 'voice-ai-guide',
    order: '09',
    shardIndex: 8,
    title: 'Ovozli AI Gid',
    subtitle: 'Audio Guide & Voice Navigator · Semantik Boshqaruv',
    category: 'Ovozli Navigatsiya',
    accentHex: '#38bdf8',
    secondaryHex: '#a855f7',
    shortDescription:
      'Platforma bo‘ylab ovozli va matnli semantik buyruqlar yordamida harakatlanish, xaritani boshqarish va sahifa bo‘yicha audio tushuntirish olish.',
    purpose:
      'Murakkab menyularni qidirmasdan tabiiy tilda kerakli universitet, mamlakat yoki modulga darhol o‘tish.',
    powerSummary:
      'Ovozli nutqni tushunish, audio qo‘llanma (TTS) va Voice Navigator AI agentini yagona panelda birlashtiradi.',
    solvesProblem:
      'Platformaning boy funksiyalarini tez o‘zlashtirish va bir buyruq bilan istalgan tahlilga o‘tish imkonini beradi.',
    capabilities: [
      'Ovozli va tezkor matnli semantik buyruqlar ijrosi',
      'Har bir sahifa uchun kontekstual audio qo‘llanma (Page Guide)',
      'Xaritada mamlakat va universitetlarni buyruq bilan fokuslash',
      'Ko‘p tilli nutq sintezi va AI navigator integratsiyasi',
    ],
    targetSection: 'ai-advisor',
    actionMode: 'open-audio-guide',
    previewKind: 'voice-guide',
  },
  {
    id: 'habits-tracker',
    order: '10',
    shardIndex: 9,
    title: 'Habits Tracker',
    subtitle: 'Odatlar Tizimi · Streak & Barqaror Rivojlanish',
    category: 'Odatlar Tizimi',
    accentHex: '#c084fc',
    secondaryHex: '#f472b6',
    shortDescription:
      'Til o‘rganish, kitob mutolaasi, imtihon mashqlari va shaxsiy intizom odatlarini kundalik tizimli ravishda shakllantirish moduli.',
    purpose:
      'Katta akademik maqsadlarni har kungi kichik, uzluksiz va o‘lchanadigan odatlarga aylantirish.',
    powerSummary:
      'Kundalik belgilash, uzluksiz seriyalar (streak) va kategoriya bo‘yicha intizom dinamikasini vizual kuzatadi.',
    solvesProblem:
      'Motivatsiya pasayganda ham barqaror o‘qish tizimini saqlab qolish va real taraqqiyotni ko‘rish imkonini yaratadi.',
    capabilities: [
      'Akademik, til, salomatlik va fokus kategoriyalarida odatlar yaratish',
      'Kundalik progress, haftalik intizom va streak nazorati',
      'Maqsadlar va AI agent tavsiyalaridan odat qo‘shish integratsiyasi',
      'Toza va chalg‘itmaydigan kundalik nazorat interfeysi',
    ],
    targetSection: 'paper-journal',
    actionMode: 'navigate',
    previewKind: 'habits-tracker',
  },
  {
    id: 'global-rankings',
    order: '11',
    shardIndex: 10,
    title: 'Global Reytinglar',
    subtitle: 'QS · THE · ARWU · Tasdiqlangan Universitet Reytinglari',
    category: 'Akademik Reyting',
    accentHex: '#7c3aed',
    secondaryHex: '#38bdf8',
    shortDescription:
      'Dunyoning yetakchi universitetlarini QS, THE va ARWU reytinglari, mamlakat hamda akademik kuchli yo‘nalishlari bo‘yicha taqqoslash moduli.',
    purpose:
      'Nufuz, ilmiy salohiyat va xalqaro e’tirof bo‘yicha eng kuchli universitetlarni ishonchli rasmiy reytinglar asosida baholash.',
    powerSummary:
      'Bir nechta xalqaro reyting provayderlarini yagona jadvalda jamlab, tezkor saralash va profilga o‘tish imkonini beradi.',
    solvesProblem:
      'Turli reyting saytlaridagi tarqoq va qarama-qarshi raqamlarni bir joyda aniq hamda shaffof solishtirishni osonlashtiradi.',
    capabilities: [
      'QS, THE va ARWU ko‘rsatkichlari bo‘yicha tasdiqlangan universitetlar',
      'Mamlakat, yo‘nalish va o‘qish xarajati kesimida aqlli filtrlash',
      'Universitet profillari va qabul talablariga bir klikda o‘tish',
      'Saralangan OTMlarni taqqoslash va shaxsiy ro‘yxatga saqlash',
    ],
    targetSection: 'global-rankings',
    actionMode: 'navigate',
    previewKind: 'global-rankings',
  },
  {
    id: 'university-comparison',
    order: '12',
    shardIndex: 11,
    title: 'OTM Taqqoslash',
    subtitle: 'University Comparison · Yonma-yon Chuqur Tahlil',
    category: 'Qaror Matritsasi',
    accentHex: '#22d3ee',
    secondaryHex: '#a855f7',
    shortDescription:
      'Bir nechta tanlangan universitetlarni kontrakt, yashash xarajati, reyting, qabul talablari va grant imkoniyatlari bo‘yicha yonma-yon taqqoslash vositasi.',
    purpose:
      'Yakuniy ariza ro‘yxatini shakllantirishda hissiyotga emas, aniq fakt va raqamlarga tayangan holda to‘g‘ri qaror qabul qilish.',
    powerSummary:
      'Tanlangan universitetlarning barcha asosiy akademik va moliyaviy parametrlarini bitta taqqoslash jadvalida aks ettiradi.',
    solvesProblem:
      'Bir necha yaxshi universitet o‘rtasida ikkilanishni aniq yonma-yon ustunliklar tahlili orqali hal qiladi.',
    capabilities: [
      'Bir vaqtning o‘zida bir nechta OTMni yonma-yon solishtirish',
      'Yillik kontrakt, shahar byudjeti va grant imkoniyatlari kesimi',
      'Til talablari, dastur tili va xalqaro talabalar ulushi tahlili',
      'Saqlangan universitetlar ro‘yxati bilan to‘liq sinxronizatsiya',
    ],
    targetSection: 'university-comparison',
    actionMode: 'navigate',
    previewKind: 'university-comparison',
  },
];

export const COSMIC_SECTIONS_BY_ID: Record<string, CosmicSectionConfig> = Object.fromEntries(
  COSMIC_SECTIONS.map((section) => [section.id, section])
);
