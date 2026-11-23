import {
  correctQueryTokens,
  fuzzyTokenCoverageScore,
  normalizeSearchText,
  stringSimilarity,
} from '../utils/globalSearchEngine';

export type CityContinentCategory =
  | 'All cities'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Oceania';

export const CITY_CONTINENT_CATEGORIES: CityContinentCategory[] = [
  'All cities',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Africa',
  'Oceania',
];

export interface GlobalCityLivingProfile {
  slug: string;
  cityName: string;
  alternativeNames: string[];
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  continent: Exclude<CityContinentCategory, 'All cities'>;
  localCurrency: string;
  accommodationMonthlyUsd: number;
  foodMonthlyUsd: number;
  transportMonthlyUsd: number;
  utilitiesMonthlyUsd: number;
  internetMonthlyUsd: number;
  otherMonthlyUsd: number;
  totalMonthlyUsd: number;
  safetyIndex: string;
  dataStatus: 'verified' | 'estimated';
  sourceOrg: string;
  verifiedAt: string;
  latitude: number;
  longitude: number;
  keyUniversities: string[];
  overview: string;
}

function makeCity(
  slug: string,
  cityName: string,
  alternativeNames: string[],
  countryCode: string,
  countryName: string,
  flagEmoji: string,
  continent: Exclude<CityContinentCategory, 'All cities'>,
  localCurrency: string,
  accommodationMonthlyUsd: number,
  foodMonthlyUsd: number,
  transportMonthlyUsd: number,
  utilitiesMonthlyUsd: number,
  internetMonthlyUsd: number,
  otherMonthlyUsd: number,
  safetyIndex: string,
  dataStatus: 'verified' | 'estimated',
  sourceOrg: string,
  latitude: number,
  longitude: number,
  keyUniversities: string[],
  overview: string
): GlobalCityLivingProfile {
  const totalMonthlyUsd =
    accommodationMonthlyUsd +
    foodMonthlyUsd +
    transportMonthlyUsd +
    utilitiesMonthlyUsd +
    internetMonthlyUsd +
    otherMonthlyUsd;

  return {
    slug,
    cityName,
    alternativeNames,
    countryCode,
    countryName,
    flagEmoji,
    continent,
    localCurrency,
    accommodationMonthlyUsd,
    foodMonthlyUsd,
    transportMonthlyUsd,
    utilitiesMonthlyUsd,
    internetMonthlyUsd,
    otherMonthlyUsd,
    totalMonthlyUsd,
    safetyIndex,
    dataStatus,
    sourceOrg,
    verifiedAt: '2026-11-15',
    latitude,
    longitude,
    keyUniversities,
    overview,
  };
}

export const GLOBAL_CITIES_LIVING_CATALOG: GlobalCityLivingProfile[] = [
  // ================= ASIA =================
  makeCity('tokyo-jp', 'Tokyo', ['Tokio', '東京', 'Tōkyō'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 620, 320, 75, 85, 38, 120, 'Very High (92/100)', 'verified', 'JASSO Student Living Survey', 35.6762, 139.6503, ['The University of Tokyo', 'Institute of Science Tokyo', 'Waseda University', 'Keio University'], 'Japan’s capital and largest academic research metropolis with dense rail connectivity and safe student neighborhoods.'),
  makeCity('kyoto-jp', 'Kyoto', ['Kioto', '京都', 'Kyōto'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 440, 280, 55, 75, 35, 95, 'Very High (94/100)', 'verified', 'JASSO & Kyoto Student Hub', 35.0116, 135.7681, ['Kyoto University', 'Doshisha University', 'Ritsumeikan University'], 'Historic cultural capital of Japan renowned for Nobel-laureate fundamental science and bicycle-friendly student life.'),
  makeCity('osaka-jp', 'Osaka', ['大阪', 'Ōsaka'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 470, 290, 65, 78, 35, 100, 'Very High (91/100)', 'verified', 'JASSO Kansai Benchmark', 34.6937, 135.5023, ['Osaka University', 'Osaka Metropolitan University'], 'Dynamic commercial and biomedical research hub in the Kansai region.'),
  makeCity('sendai-jp', 'Sendai', ['仙台'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 360, 250, 48, 72, 34, 85, 'Very High (93/100)', 'verified', 'Tohoku University International Support', 38.2682, 140.8694, ['Tohoku University'], 'Known as the City of Trees, hosting Tohoku University’s world-leading materials and spintronics institutes.'),
  makeCity('fukuoka-jp', 'Fukuoka', ['福岡', 'Fukoka'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 380, 260, 50, 70, 34, 85, 'Very High (93/100)', 'verified', 'JASSO Kyushu Benchmark', 33.5902, 130.4017, ['Kyushu University'], 'Gateway city to Asia on Kyushu Island with affordable student housing and startup energy.'),
  makeCity('kitakyushu-jp', 'Kitakyushu', ['北九州', 'Kitakyusu'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 310, 235, 45, 65, 32, 75, 'Very High (92/100)', 'verified', 'Kyutech International Office', 33.8835, 130.8752, ['Kyushu Institute of Technology (Kyutech)'], 'Advanced robotics and satellite engineering hub offering some of Japan’s most affordable student living costs.'),
  makeCity('nagoya-jp', 'Nagoya', ['名古屋'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 410, 270, 58, 74, 35, 90, 'Very High (92/100)', 'verified', 'Nagoya University Global Campus', 35.1815, 136.9066, ['Nagoya University', 'Nagoya Institute of Technology'], 'Heart of Japan’s aerospace, automotive, and advanced manufacturing research corridor.'),
  makeCity('sapporo-jp', 'Sapporo', ['札幌'], 'JP', 'Japan', '🇯🇵', 'Asia', 'JPY', 350, 255, 52, 88, 34, 80, 'Very High (93/100)', 'verified', 'Hokkaido University Student Guide', 43.0618, 141.3545, ['Hokkaido University'], 'Spacious northern academic capital famous for catalysis, agriculture, and earth sciences.'),
  makeCity('seoul-kr', 'Seoul', ['Seul', '서울'], 'KR', 'South Korea', '🇰🇷', 'Asia', 'KRW', 560, 340, 55, 80, 32, 110, 'Very High (89/100)', 'verified', 'NIIED Study in Korea', 37.5665, 126.978, ['Seoul National University', 'Yonsei University', 'Korea University'], 'High-tech East Asian megacity with world-class semiconductor, AI, and biomedical universities.'),
  makeCity('daejeon-kr', 'Daejeon', ['대전'], 'KR', 'South Korea', '🇰🇷', 'Asia', 'KRW', 380, 280, 45, 68, 28, 85, 'Very High (91/100)', 'verified', 'KAIST International Office', 36.3504, 127.3845, ['KAIST', 'Chungnam National University'], 'South Korea’s Silicon Valley (Daedeok Innopolis) and home to KAIST.'),
  makeCity('singapore-sg', 'Singapore', ['Singapur', '新加坡'], 'SG', 'Singapore', '🇸🇬', 'Asia', 'SGD', 1050, 420, 95, 110, 38, 150, 'Exceptional (96/100)', 'verified', 'Singapore MOE & NUS Cost Guide', 1.3521, 103.8198, ['National University of Singapore (NUS)', 'Nanyang Technological University (NTU)', 'SMU'], 'Global English-speaking research and FinTech hub in Southeast Asia.'),
  makeCity('beijing-cn', 'Beijing', ['Pekin', '北京'], 'CN', 'China', '🇨🇳', 'Asia', 'CNY', 520, 260, 35, 55, 22, 95, 'High (88/100)', 'verified', 'CSC Study in China Benchmark', 39.9042, 116.4074, ['Peking University', 'Tsinghua University'], 'China’s premier academic capital hosting Tsinghua and Peking University in Haidian District.'),
  makeCity('shanghai-cn', 'Shanghai', ['Shanxay', '上海'], 'CN', 'China', '🇨🇳', 'Asia', 'CNY', 580, 280, 40, 60, 24, 105, 'High (89/100)', 'verified', 'Study in Shanghai Municipal Guide', 31.2304, 121.4737, ['Fudan University', 'Shanghai Jiao Tong University', 'Tongji University'], 'International financial, biomedical, and engineering powerhouse on China’s east coast.'),
  makeCity('hangzhou-cn', 'Hangzhou', ['杭州'], 'CN', 'China', '🇨🇳', 'Asia', 'CNY', 420, 240, 32, 50, 20, 85, 'High (90/100)', 'verified', 'Zhejiang University Global Office', 30.2741, 120.1551, ['Zhejiang University', 'Westlake University'], 'Major Chinese digital economy and AI innovation hub.'),
  makeCity('tashkent-uz', 'Tashkent', ['Toshkent', 'Ташкент'], 'UZ', 'Uzbekistan', '🇺🇿', 'Asia', 'UZS', 340, 210, 28, 42, 18, 75, 'High (88/100)', 'verified', 'Ministry of Higher Education UZ', 41.2995, 69.2401, ['National University of Uzbekistan', 'TUIT', 'WIUT', 'TIIAME NRU', 'Inha University in Tashkent'], 'Central Asia’s rapidly growing university and technology capital uniting national and international branch campuses.'),
  makeCity('samarkand-uz', 'Samarkand', ['Samarqand', 'Самарканд'], 'UZ', 'Uzbekistan', '🇺🇿', 'Asia', 'UZS', 250, 180, 22, 35, 16, 60, 'High (90/100)', 'verified', 'SamSU Student Services', 39.6542, 66.9597, ['Samarkand State University', 'Silk Road International University'], 'Historic Silk Road center of astronomy and scholarship with expanding international academic programs.'),
  makeCity('bukhara-uz', 'Bukhara', ['Buxoro', 'Бухара'], 'UZ', 'Uzbekistan', '🇺🇿', 'Asia', 'UZS', 220, 170, 20, 32, 15, 55, 'High (90/100)', 'verified', 'BukhSU Academic Guide', 39.7747, 64.4286, ['Bukhara State University', 'Bukhara State Medical Institute'], 'Renowned heritage city in Uzbekistan with strong natural sciences, medicine, and tourism faculties.'),
  makeCity('astana-kz', 'Astana', ['Астана', 'Nur-Sultan'], 'KZ', 'Kazakhstan', '🇰🇿', 'Asia', 'KZT', 380, 230, 30, 55, 20, 80, 'High (86/100)', 'verified', 'Study in Kazakhstan MSHE', 51.1694, 71.4491, ['Nazarbayev University', 'L.N. Gumilyov Eurasian National University'], 'Modern capital of Kazakhstan hosting English-medium research labs at Nazarbayev University.'),
  makeCity('almaty-kz', 'Almaty', ['Алматы'], 'KZ', 'Kazakhstan', '🇰🇿', 'Asia', 'KZT', 410, 240, 32, 50, 20, 85, 'High (85/100)', 'verified', 'KazNU International Office', 43.222, 76.8512, ['Al-Farabi Kazakh National University', 'Satbayev University'], 'Cultural and scientific heart of Kazakhstan at the foot of the Tian Shan mountains.'),
  makeCity('kuala-lumpur-my', 'Kuala Lumpur', ['KL'], 'MY', 'Malaysia', '🇲🇾', 'Asia', 'MYR', 340, 220, 38, 48, 22, 75, 'High (83/100)', 'verified', 'Education Malaysia EMGS', 3.139, 101.6869, ['Universiti Malaya (UM)', 'UTM Kuala Lumpur'], 'Affordable, English-friendly Southeast Asian student hub with high-quality public and international universities.'),
  makeCity('abu-dhabi-ae', 'Abu Dhabi', ['أبو ظبي'], 'AE', 'United Arab Emirates', '🇦🇪', 'Asia', 'AED', 880, 380, 75, 115, 55, 145, 'Exceptional (95/100)', 'verified', 'Abu Dhabi Department of Education', 24.4539, 54.3773, ['Khalifa University', 'NYU Abu Dhabi', 'MBZUAI'], 'Global center for energy transition, AI research, and full-scholarship graduate fellowships.'),
  makeCity('ankara-tr', 'Ankara', ['Анкара'], 'TR', 'Turkey', '🇹🇷', 'Asia', 'TRY', 310, 210, 32, 52, 18, 70, 'High (84/100)', 'verified', 'Study in Türkiye YÖK', 39.9334, 32.8597, ['Middle East Technical University (METU)', 'Bilkent University', 'Ankara University'], 'Turkey’s academic and administrative capital featuring green campus towns like METU and Bilkent.'),
  makeCity('istanbul-tr', 'Istanbul', ['İstanbul', 'Стамбул'], 'TR', 'Turkey', '🇹🇷', 'Asia', 'TRY', 420, 250, 38, 60, 20, 85, 'High (82/100)', 'verified', 'Study in Türkiye Benchmark', 41.0082, 28.9784, ['Istanbul Technical University (ITU)', 'Boğaziçi University', 'Koç University'], 'Transcontinental metropolis uniting historic engineering universities and private research campuses.'),
  makeCity('mumbai-in', 'Mumbai', ['Bombay'], 'IN', 'India', '🇮🇳', 'Asia', 'INR', 290, 165, 25, 42, 14, 60, 'High (80/100)', 'verified', 'IIT Bombay International Relations', 19.076, 72.8777, ['IIT Bombay', 'University of Mumbai'], 'India’s financial and technological hub home to IIT Bombay’s Powai campus.'),
  makeCity('new-delhi-in', 'New Delhi', ['Delhi', 'Дели'], 'IN', 'India', '🇮🇳', 'Asia', 'INR', 260, 155, 24, 40, 14, 55, 'High (79/100)', 'verified', 'Study in India Portal', 28.6139, 77.209, ['IIT Delhi', 'University of Delhi', 'JNU'], 'National capital region hosting India’s premier engineering, policy, and science institutions.'),

  // ================= EUROPE =================
  makeCity('london-gb', 'London', ['Лондон'], 'GB', 'United Kingdom', '🇬🇧', 'Europe', 'GBP', 1240, 390, 155, 145, 42, 175, 'High (85/100)', 'verified', 'UKVI & Imperial/UCL Living Guide', 51.5072, -0.1276, ['Imperial College London', 'UCL', 'LSE', "King's College London"], 'One of the world’s highest concentrations of top-ranked research universities and global libraries.'),
  makeCity('oxford-gb', 'Oxford', ['Оксфорд'], 'GB', 'United Kingdom', '🇬🇧', 'Europe', 'GBP', 1020, 350, 85, 130, 38, 150, 'Very High (90/100)', 'verified', 'University of Oxford Living Costs', 51.752, -1.2577, ['University of Oxford'], 'Historic collegiate university city with world-leading tutorial education and biomedical research.'),
  makeCity('cambridge-gb', 'Cambridge (UK)', ['Кембридж'], 'GB', 'United Kingdom', '🇬🇧', 'Europe', 'GBP', 990, 345, 80, 125, 38, 145, 'Very High (91/100)', 'verified', 'University of Cambridge Admissions', 52.2053, 0.1218, ['University of Cambridge'], 'Renowned scientific and collegiate city at the heart of the Silicon Fen innovation cluster.'),
  makeCity('edinburgh-gb', 'Edinburgh', ['Эдинбург'], 'GB', 'United Kingdom', '🇬🇧', 'Europe', 'GBP', 890, 330, 78, 120, 36, 135, 'Very High (90/100)', 'verified', 'University of Edinburgh Cost Guide', 55.9533, -3.1883, ['The University of Edinburgh'], 'Scotland’s capital and a major European center for informatics, AI, and humanities.'),
  makeCity('munich-de', 'Munich', ['München', 'Myunxen', 'Мюнхен'], 'DE', 'Germany', '🇩🇪', 'Europe', 'EUR', 780, 310, 38, 115, 35, 120, 'Exceptional (94/100)', 'verified', 'DAAD & Studierendenwerk München', 48.1351, 11.582, ['Technical University of Munich (TUM)', 'LMU Munich'], 'Bavaria’s scientific and aerospace powerhouse with the €29–€49 Deutschlandticket student transit pass.'),
  makeCity('berlin-de', 'Berlin', ['Берлин'], 'DE', 'Germany', '🇩🇪', 'Europe', 'EUR', 660, 285, 38, 105, 34, 110, 'High (88/100)', 'verified', 'DAAD & studierendenWERK BERLIN', 52.52, 13.405, ['Freie Universität Berlin', 'Humboldt-Universität zu Berlin', 'TU Berlin'], 'Vibrant European research and startup capital uniting the Berlin University Alliance.'),
  makeCity('heidelberg-de', 'Heidelberg', ['Гейдельберг'], 'DE', 'Germany', '🇩🇪', 'Europe', 'EUR', 590, 275, 38, 100, 34, 100, 'Very High (93/100)', 'verified', 'DAAD & Uni Heidelberg Guide', 49.3988, 8.6724, ['Heidelberg University'], 'Germany’s oldest university town and a European flagship for oncology, molecular biology, and physics.'),
  makeCity('aachen-de', 'Aachen', ['Аахен'], 'DE', 'Germany', '🇩🇪', 'Europe', 'EUR', 510, 265, 38, 95, 32, 95, 'Very High (91/100)', 'verified', 'RWTH Aachen International Office', 50.7753, 6.0839, ['RWTH Aachen University'], 'Premier European engineering city at the border of Germany, Belgium, and the Netherlands.'),
  makeCity('zurich-ch', 'Zurich', ['Zürich', 'Syurix', 'Цюрих'], 'CH', 'Switzerland', '🇨🇭', 'Europe', 'CHF', 1100, 490, 95, 135, 52, 190, 'Exceptional (96/100)', 'verified', 'ETH Zurich International Student Office', 47.3769, 8.5417, ['ETH Zurich', 'University of Zurich'], 'Continental Europe’s top-ranked STEM hub with low public tuition offsetting high Alpine living costs.'),
  makeCity('lausanne-ch', 'Lausanne', ['Лозанна'], 'CH', 'Switzerland', '🇨🇭', 'Europe', 'CHF', 980, 450, 85, 125, 50, 175, 'Exceptional (95/100)', 'verified', 'EPFL Student Affairs Benchmark', 46.5197, 6.6323, ['EPFL', 'University of Lausanne'], 'Lake Geneva innovation hub home to EPFL’s world-renowned engineering and life sciences campus.'),
  makeCity('paris-fr', 'Paris', ['Parij', 'Париж'], 'FR', 'France', '🇫🇷', 'Europe', 'EUR', 820, 320, 45, 105, 32, 130, 'High (84/100)', 'verified', 'Campus France Student Budget Guide', 48.8566, 2.3522, ['Université PSL', 'Sorbonne University', 'Université Paris-Saclay', 'IP Paris'], 'Historic intellectual capital of Europe offering subsidized public tuition and CAF student housing aid.'),
  makeCity('amsterdam-nl', 'Amsterdam', ['Амстердам'], 'NL', 'Netherlands', '🇳🇱', 'Europe', 'EUR', 880, 320, 70, 120, 38, 125, 'Very High (91/100)', 'verified', 'Study in NL (Nuffic)', 52.3676, 4.9041, ['University of Amsterdam (UvA)', 'Vrije Universiteit Amsterdam'], 'International English-friendly European hub for AI, data science, economics, and law.'),
  makeCity('delft-nl', 'Delft', ['Делфт'], 'NL', 'Netherlands', '🇳🇱', 'Europe', 'EUR', 690, 290, 55, 110, 36, 110, 'Very High (93/100)', 'verified', 'TU Delft Financial Guide', 52.0116, 4.3571, ['Delft University of Technology (TU Delft)'], 'Picturesque Dutch engineering city hosting TU Delft’s aerospace, quantum, and civil labs.'),
  makeCity('stockholm-se', 'Stockholm', ['Стокгольм'], 'SE', 'Sweden', '🇸🇪', 'Europe', 'SEK', 680, 310, 65, 85, 32, 120, 'Very High (91/100)', 'verified', 'Study in Sweden (Swedish Institute)', 59.3293, 18.0686, ['KTH Royal Institute of Technology', 'Karolinska Institutet', 'Stockholm University'], 'Home of the Nobel Prize and Scandinavia’s leading engineering and medical research ecosystem.'),
  makeCity('milan-it', 'Milan', ['Milano', 'Милан'], 'IT', 'Italy', '🇮🇹', 'Europe', 'EUR', 680, 290, 26, 95, 28, 105, 'High (85/100)', 'verified', 'Politecnico di Milano International Guide', 45.4642, 9.19, ['Politecnico di Milano', 'University of Milan', 'Bocconi University'], 'Italy’s design, architecture, engineering, and finance capital with income-scaled public tuition.'),
  makeCity('bologna-it', 'Bologna', ['Болонья'], 'IT', 'Italy', '🇮🇹', 'Europe', 'EUR', 520, 265, 25, 85, 26, 95, 'High (88/100)', 'verified', 'University of Bologna Welcome Office', 44.4949, 11.3426, ['University of Bologna'], 'Home to the Western world’s oldest continuously operating university (founded 1088).'),
  makeCity('madrid-es', 'Madrid', ['Мадрид'], 'ES', 'Spain', '🇪🇸', 'Europe', 'EUR', 610, 270, 24, 85, 28, 100, 'Very High (90/100)', 'verified', 'SEPIE Study in Spain', 40.4168, -3.7038, ['Universidad Autónoma de Madrid', 'Universidad Complutense de Madrid', 'UPM'], 'Lively European capital with affordable student transport passes and strong science and business faculties.'),
  makeCity('barcelona-es', 'Barcelona', ['Барселона'], 'ES', 'Spain', '🇪🇸', 'Europe', 'EUR', 630, 275, 28, 88, 28, 105, 'High (87/100)', 'verified', 'Study in Catalonia Benchmark', 41.3874, 2.1686, ['Universitat de Barcelona', 'UAB', 'UPC BarcelonaTech', 'UPF'], 'Mediterranean center for biomedicine, supercomputing, architecture, and economics.'),
  makeCity('vienna-at', 'Vienna', ['Wien', 'Вена'], 'AT', 'Austria', '🇦🇹', 'Europe', 'EUR', 590, 290, 32, 95, 30, 105, 'Exceptional (94/100)', 'verified', 'OeAD Study in Austria', 48.2082, 16.3738, ['University of Vienna', 'TU Wien'], 'Consistently ranked the world’s most livable city with very low public university tuition.'),
  makeCity('warsaw-pl', 'Warsaw', ['Warszawa', 'Варшава'], 'PL', 'Poland', '🇵🇱', 'Europe', 'PLN', 460, 220, 18, 75, 18, 80, 'Very High (90/100)', 'verified', 'NAWA Study in Poland', 52.2297, 21.0122, ['University of Warsaw', 'Warsaw University of Technology'], 'Central Europe’s fast-growing computer science, mathematics, and engineering hub.'),
  makeCity('budapest-hu', 'Budapest', ['Будапешт'], 'HU', 'Hungary', '🇭🇺', 'Europe', 'HUF', 430, 215, 15, 70, 18, 75, 'High (89/100)', 'verified', 'Study in Hungary / Tempus Foundation', 47.4979, 19.0402, ['ELTE Budapest', 'BME', 'Semmelweis University'], 'Danube university capital famous for mathematics, medicine, and Stipendium Hungaricum scholars.'),
  makeCity('dublin-ie', 'Dublin', ['Дублин'], 'IE', 'Ireland', '🇮🇪', 'Europe', 'EUR', 1050, 360, 70, 130, 38, 145, 'High (87/100)', 'verified', 'Education in Ireland Benchmark', 53.3498, -6.2603, ['Trinity College Dublin', 'University College Dublin'], 'European headquarters for global tech and pharma firms with English-taught degrees and post-study work pathways.'),
  makeCity('moscow-ru', 'Moscow', ['Moskva', 'Москва'], 'RU', 'Russia', '🇷🇺', 'Europe', 'RUB', 450, 240, 22, 48, 14, 85, 'High (86/100)', 'verified', 'Study in Russia / MSU International', 55.7558, 37.6173, ['Lomonosov Moscow State University (MSU)', 'MIPT', 'Bauman MSTU', 'HSE University'], 'Largest scientific and higher-education center in Eastern Europe and Eurasia.'),
  makeCity('saint-petersburg-ru', 'Saint Petersburg', ['St. Petersburg', 'Санкт-Петербург', 'Петербург'], 'RU', 'Russia', '🇷🇺', 'Europe', 'RUB', 370, 215, 20, 44, 13, 75, 'High (87/100)', 'verified', 'SPbU & ITMO Student Guide', 59.9311, 30.3609, ['Saint Petersburg State University', 'ITMO University', 'Peter the Great St. Petersburg Polytechnic'], 'Historic cultural and scientific capital renowned for mathematics, photonics, and competitive programming.'),
  makeCity('novosibirsk-ru', 'Novosibirsk', ['Новосибирск', 'Akademgorodok'], 'RU', 'Russia', '🇷🇺', 'Asia', 'RUB', 290, 190, 16, 40, 12, 65, 'High (86/100)', 'verified', 'Novosibirsk State University Guide', 55.0084, 82.9357, ['Novosibirsk State University (NSU)'], 'Home to Siberia’s famed Akademgorodok scientific township and dozens of research institutes.'),
  makeCity('kazan-ru', 'Kazan', ['Казань'], 'RU', 'Russia', '🇷🇺', 'Europe', 'RUB', 300, 195, 17, 40, 12, 65, 'High (88/100)', 'verified', 'Kazan Federal University International', 55.7887, 49.1221, ['Kazan Federal University (KFU)', 'Kazan National Research Technical University'], 'Historic Volga university city with over two centuries of breakthroughs in chemistry and physics.'),

  // ================= NORTH AMERICA =================
  makeCity('boston-us', 'Boston / Cambridge', ['Boston', 'Cambridge MA', 'Бостон'], 'US', 'United States', '🇺🇸', 'North America', 'USD', 1550, 460, 90, 145, 55, 195, 'High (87/100)', 'verified', 'MIT & Harvard Student Financial Services', 42.3601, -71.0589, ['MIT', 'Harvard University', 'Boston University', 'Northeastern University'], 'World’s premier academic cluster for AI, biotechnology, engineering, and economics along the Charles River.'),
  makeCity('san-francisco-bay-us', 'San Francisco Bay Area (Stanford / Berkeley)', ['Stanford', 'Berkeley', 'Palo Alto'], 'US', 'United States', '🇺🇸', 'North America', 'USD', 1650, 480, 95, 140, 58, 210, 'High (84/100)', 'verified', 'Stanford & UC Berkeley Cost of Attendance', 37.4419, -122.143, ['Stanford University', 'UC Berkeley'], 'Epicenter of Silicon Valley deep tech, AI labs, and venture-backed scientific innovation.'),
  makeCity('new-york-us', 'New York City', ['New York', 'NYC', 'Нью-Йорк'], 'US', 'United States', '🇺🇸', 'North America', 'USD', 1720, 490, 132, 150, 58, 220, 'High (83/100)', 'verified', 'Columbia & NYU Financial Aid Benchmarks', 40.7128, -74.006, ['Columbia University', 'New York University (NYU)', 'Cornell Tech'], 'Global capital of finance, media, medicine, and international diplomacy.'),
  makeCity('los-angeles-us', 'Los Angeles / Pasadena', ['Los Angeles', 'Pasadena', 'LA'], 'US', 'United States', '🇺🇸', 'North America', 'USD', 1420, 440, 95, 135, 52, 185, 'High (83/100)', 'verified', 'UCLA & Caltech Cost of Attendance', 34.0522, -118.2437, ['Caltech', 'UCLA', 'USC'], 'Southern California aerospace, quantum physics, film, and engineering metropolis.'),
  makeCity('chicago-us', 'Chicago', ['Чикаго'], 'US', 'United States', '🇺🇸', 'North America', 'USD', 1180, 410, 85, 125, 50, 165, 'High (82/100)', 'verified', 'UChicago & Northwestern Student Budgets', 41.8781, -87.6298, ['University of Chicago', 'Northwestern University', 'UIUC (Champaign)'], 'Midwest powerhouse for economics, physics, law, and national laboratory research.'),
  makeCity('austin-us', 'Austin', ['Остин'], 'US', 'United States', '🇺🇸', 'North America', 'USD', 1050, 380, 65, 120, 48, 150, 'High (86/100)', 'verified', 'UT Austin International Office', 30.2672, -97.7431, ['The University of Texas at Austin'], 'Major U.S. semiconductor, AI, and clean energy hub with lower living costs than coastal cities.'),
  makeCity('toronto-ca', 'Toronto', ['Торонто'], 'CA', 'Canada', '🇨🇦', 'North America', 'CAD', 1120, 370, 95, 105, 48, 145, 'Very High (90/100)', 'verified', 'University of Toronto Student Life', 43.6532, -79.3832, ['University of Toronto', 'York University', 'Toronto Metropolitan University'], 'Canada’s largest academic and AI research center (Vector Institute) with diverse international communities.'),
  makeCity('vancouver-ca', 'Vancouver', ['Ванкувер'], 'CA', 'Canada', '🇨🇦', 'North America', 'CAD', 1150, 380, 90, 95, 48, 145, 'Very High (91/100)', 'verified', 'UBC Enrollment Services', 49.2827, -123.1207, ['University of British Columbia (UBC)', 'Simon Fraser University'], 'Pacific Rim research city renowned for sustainability, forestry, genomics, and computer science.'),
  makeCity('montreal-ca', 'Montreal', ['Montréal', 'Монреаль'], 'CA', 'Canada', '🇨🇦', 'North America', 'CAD', 780, 330, 52, 85, 42, 125, 'Very High (91/100)', 'verified', 'McGill International Student Services', 45.5017, -73.5673, ['McGill University', 'Université de Montréal (Mila AI)'], 'Bilingual North American student capital with affordable rent and world-famous deep learning labs.'),
  makeCity('mexico-city-mx', 'Mexico City', ['CDMX', 'Ciudad de México', 'Мехико'], 'MX', 'Mexico', '🇲🇽', 'North America', 'MXN', 460, 230, 25, 45, 22, 85, 'High (80/100)', 'verified', 'UNAM International Mobility Office', 19.4326, -99.1332, ['UNAM', 'IPN', 'Tecnológico de Monterrey (CDMX)'], 'Home to UNAM’s UNESCO World Heritage campus and Latin America’s largest research community.'),

  // ================= SOUTH AMERICA =================
  makeCity('sao-paulo-br', 'São Paulo', ['Sao Paulo', 'Сан-Паулу'], 'BR', 'Brazil', '🇧🇷', 'South America', 'BRL', 450, 220, 38, 52, 20, 85, 'High (80/100)', 'verified', 'USP International Cooperation Office', -23.5505, -46.6333, ['Universidade de São Paulo (USP)', 'UNIFESP'], 'South America’s scientific engine where public research universities charge zero tuition.'),
  makeCity('campinas-br', 'Campinas', ['Кампинас'], 'BR', 'Brazil', '🇧🇷', 'South America', 'BRL', 360, 195, 32, 48, 18, 75, 'High (84/100)', 'verified', 'UNICAMP Executive Directorate', -22.9099, -47.0626, ['Universidade Estadual de Campinas (UNICAMP)'], 'Brazil’s high-tech research valley hosting UNICAMP and the Sirius synchrotron light source.'),
  makeCity('santiago-cl', 'Santiago', ['Сантьяго'], 'CL', 'Chile', '🇨🇱', 'South America', 'CLP', 480, 240, 38, 65, 22, 90, 'High (86/100)', 'verified', 'Learn Chile & UC International', -33.4489, -70.6693, ['Pontificia Universidad Católica de Chile (UC)', 'Universidad de Chile'], 'Leading Andean academic capital for astronomy, mining engineering, and economics.'),

  // ================= AFRICA =================
  makeCity('cape-town-za', 'Cape Town', ['Кейптаун'], 'ZA', 'South Africa', '🇿🇦', 'Africa', 'ZAR', 460, 220, 42, 58, 28, 85, 'High (81/100)', 'verified', 'UCT International Academic Programmes Office', -33.9249, 18.4241, ['University of Cape Town (UCT)', 'Stellenbosch University (nearby)'], 'Africa’s highest-ranked university city for medicine, marine biology, and astrophysics.'),
  makeCity('johannesburg-za', 'Johannesburg', ['Йоханнесбург'], 'ZA', 'South Africa', '🇿🇦', 'Africa', 'ZAR', 410, 210, 40, 55, 26, 80, 'High (79/100)', 'verified', 'Wits International Office', -26.2041, 28.0473, ['University of the Witwatersrand (Wits)', 'University of Johannesburg'], 'Economic and geosciences heart of Southern Africa.'),
  makeCity('cairo-eg', 'Cairo', ['Qohira', 'Каир', 'القاهرة'], 'EG', 'Egypt', '🇪🇬', 'Africa', 'EGP', 280, 160, 20, 35, 15, 60, 'High (83/100)', 'verified', 'Study in Egypt & AUC Student Guide', 30.0444, 31.2357, ['Cairo University', 'The American University in Cairo (AUC)', 'Ain Shams University'], 'Historic Arab and North African center of medicine, engineering, and heritage studies.'),
  makeCity('rabat-ma', 'Rabat', ['Рабат'], 'MA', 'Morocco', '🇲🇦', 'Africa', 'MAD', 320, 185, 24, 42, 18, 65, 'High (86/100)', 'verified', 'AMCI & Mohammed V University', 34.0209, -6.8416, ['Mohammed V University in Rabat'], 'Morocco’s coastal capital with strong Francophone and English-expanding research faculties.'),

  // ================= OCEANIA =================
  makeCity('melbourne-au', 'Melbourne', ['Мельбурн'], 'AU', 'Australia', '🇦🇺', 'Oceania', 'AUD', 980, 360, 95, 115, 42, 145, 'Very High (92/100)', 'verified', 'Study Melbourne & UniMelb Cost Guide', -37.8136, 144.9631, ['The University of Melbourne', 'Monash University', 'RMIT'], 'Australia’s premier biomedical and research city consistently voted among the world’s top student cities.'),
  makeCity('sydney-au', 'Sydney', ['Сидней'], 'AU', 'Australia', '🇦🇺', 'Oceania', 'AUD', 1120, 380, 105, 120, 44, 155, 'Very High (92/100)', 'verified', 'USYD & UNSW Student Living Guide', -33.8688, 151.2093, ['The University of Sydney', 'UNSW Sydney', 'UTS'], 'Pacific Rim harbor metropolis home to two QS Top-20 global research universities.'),
  makeCity('canberra-au', 'Canberra', ['Канберра'], 'AU', 'Australia', '🇦🇺', 'Oceania', 'AUD', 860, 340, 75, 110, 42, 130, 'Very High (94/100)', 'verified', 'ANU Living Costs Benchmark', -35.2809, 149.13, ['The Australian National University (ANU)'], 'Purpose-built national capital with high campus housing availability and policy/science leadership.'),
  makeCity('brisbane-au', 'Brisbane', ['Брисбен'], 'AU', 'Australia', '🇦🇺', 'Oceania', 'AUD', 820, 330, 65, 105, 40, 125, 'Very High (92/100)', 'verified', 'Study Queensland & UQ Guide', -27.4705, 153.026, ['The University of Queensland (UQ)', 'QUT'], 'Subtropical research center for biotechnology, environmental science, and engineering.'),
  makeCity('auckland-nz', 'Auckland', ['Окленд'], 'NZ', 'New Zealand', '🇳🇿', 'Oceania', 'NZD', 840, 340, 80, 105, 42, 130, 'Very High (93/100)', 'verified', 'Study with New Zealand & UoA', -36.8509, 174.7645, ['The University of Auckland', 'AUT'], 'New Zealand’s largest university city where international PhD candidates pay domestic tuition rates.'),
];

export function filterAndRankGlobalCities(options: {
  query?: string;
  continent?: CityContinentCategory | string;
  countryCode?: string;
  cities?: GlobalCityLivingProfile[];
}): GlobalCityLivingProfile[] {
  const source = options.cities || GLOBAL_CITIES_LIVING_CATALOG;
  const continent = options.continent || 'All cities';
  const countryCode = (options.countryCode || 'all').toUpperCase();
  const rawQuery = (options.query || '').trim();

  const filtered = source.filter((city) => {
    if (continent && continent !== 'All cities' && continent !== 'all') {
      if (city.continent !== continent) return false;
    }
    if (countryCode && countryCode !== 'ALL') {
      if (city.countryCode.toUpperCase() !== countryCode) return false;
    }
    return true;
  });

  if (!rawQuery) {
    return filtered;
  }

  const { normalized, corrected, expandedCanonical } = correctQueryTokens(rawQuery);
  const variants = Array.from(
    new Set([normalized, corrected, expandedCanonical].filter((v): v is string => Boolean(v)))
  );

  const scored: Array<{ city: GlobalCityLivingProfile; score: number }> = [];

  for (const city of filtered) {
    const cityNorm = normalizeSearchText(city.cityName);
    const countryNorm = normalizeSearchText(city.countryName);
    const codeNorm = city.countryCode.toLowerCase();
    const combinedNorm = `${cityNorm} ${countryNorm}`;
    const altNorms = city.alternativeNames.map(normalizeSearchText).filter(Boolean);
    const uniNorms = city.keyUniversities.map(normalizeSearchText).filter(Boolean);

    let bestScore = 0;

    for (const qv of variants) {
      if (cityNorm === qv || altNorms.includes(qv)) {
        bestScore = Math.max(bestScore, 1000);
      } else if (cityNorm.startsWith(qv) || altNorms.some((a) => a.startsWith(qv))) {
        bestScore = Math.max(bestScore, 910);
      } else if (cityNorm.includes(qv) || altNorms.some((a) => a.includes(qv))) {
        bestScore = Math.max(bestScore, 830);
      } else if (countryNorm === qv || codeNorm === qv) {
        bestScore = Math.max(bestScore, 790);
      } else if (countryNorm.includes(qv) || combinedNorm.includes(qv)) {
        bestScore = Math.max(bestScore, 740);
      } else if (uniNorms.some((u) => u.includes(qv))) {
        bestScore = Math.max(bestScore, 680);
      } else {
        const sim = Math.max(
          stringSimilarity(qv, cityNorm),
          fuzzyTokenCoverageScore(qv, combinedNorm),
          ...altNorms.map((a) => stringSimilarity(qv, a))
        );
        if (sim >= 0.68) {
          bestScore = Math.max(bestScore, Math.round(500 + sim * 220));
        }
      }
    }

    if (bestScore > 0) {
      scored.push({ city, score: bestScore });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.city.cityName.localeCompare(b.city.cityName));
  return scored.map((s) => s.city);
}
