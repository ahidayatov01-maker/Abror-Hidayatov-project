export interface TopStudentCityRecord {
  rank: number;
  slug: string;
  name: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  continent: string;
  latitude: number;
  longitude: number;
  qsScore: number;
  rankingSource: string;
  rankingYear: number;
  sourceUrl: string;
  monthlyLivingMinUsd: number;
  monthlyLivingMaxUsd: number;
  shortDescription: string;
  flagshipUniversities: string[];
}

/**
 * Verified Top 10 Global Student Cities
 * Source: QS Best Student Cities 2025 (Quacquarelli Symonds, published June 2024)
 * URL: https://www.topuniversities.com/city-rankings
 */
export const TOP_10_STUDENT_CITIES: TopStudentCityRecord[] = [
  {
    rank: 1,
    slug: 'london',
    name: 'London',
    countryCode: 'GB',
    countryName: 'United Kingdom',
    countryFlag: '🇬🇧',
    continent: 'Europe',
    latitude: 51.5074,
    longitude: -0.1278,
    qsScore: 100.0,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1650,
    monthlyLivingMaxUsd: 2650,
    shortDescription:
      'World #1 student city with Imperial College London, UCL, LSE, and King’s College London plus unmatched international student diversity.',
    flagshipUniversities: ['Imperial College London', 'University College London', 'London School of Economics'],
  },
  {
    rank: 2,
    slug: 'tokyo',
    name: 'Tokyo',
    countryCode: 'JP',
    countryName: 'Japan',
    countryFlag: '🇯🇵',
    continent: 'Asia',
    latitude: 35.6762,
    longitude: 139.6503,
    qsScore: 99.2,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1050,
    monthlyLivingMaxUsd: 1750,
    shortDescription:
      'Asia’s premier research metropolis uniting The University of Tokyo, Institute of Science Tokyo, Waseda, and Keio with top safety and employer demand.',
    flagshipUniversities: ['The University of Tokyo', 'Waseda University', 'Keio University'],
  },
  {
    rank: 3,
    slug: 'seoul',
    name: 'Seoul',
    countryCode: 'KR',
    countryName: 'South Korea',
    countryFlag: '🇰🇷',
    continent: 'Asia',
    latitude: 37.5665,
    longitude: 126.978,
    qsScore: 97.8,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 900,
    monthlyLivingMaxUsd: 1550,
    shortDescription:
      'High-tech global innovation capital home to Seoul National University, Yonsei, Korea University, and Sungkyunkwan University.',
    flagshipUniversities: ['Seoul National University', 'Yonsei University', 'Korea University'],
  },
  {
    rank: 4,
    slug: 'munich',
    name: 'Munich',
    countryCode: 'DE',
    countryName: 'Germany',
    countryFlag: '🇩🇪',
    continent: 'Europe',
    latitude: 48.1351,
    longitude: 11.582,
    qsScore: 96.3,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1200,
    monthlyLivingMaxUsd: 1850,
    shortDescription:
      'Bavaria’s engineering and science hub featuring Technical University of Munich (TUM) and LMU Munich with strong industry ties.',
    flagshipUniversities: ['Technical University of Munich', 'LMU Munich'],
  },
  {
    rank: 5,
    slug: 'melbourne',
    name: 'Melbourne',
    countryCode: 'AU',
    countryName: 'Australia',
    countryFlag: '🇦🇺',
    continent: 'Oceania',
    latitude: -37.8136,
    longitude: 144.9631,
    qsScore: 96.0,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1450,
    monthlyLivingMaxUsd: 2250,
    shortDescription:
      'Australia’s highest-ranked student city celebrated for multicultural campus life, University of Melbourne, and Monash University.',
    flagshipUniversities: ['University of Melbourne', 'Monash University', 'RMIT University'],
  },
  {
    rank: 6,
    slug: 'sydney',
    name: 'Sydney',
    countryCode: 'AU',
    countryName: 'Australia',
    countryFlag: '🇦🇺',
    continent: 'Oceania',
    latitude: -33.8688,
    longitude: 151.2093,
    qsScore: 95.4,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1550,
    monthlyLivingMaxUsd: 2450,
    shortDescription:
      'Coastal Asia-Pacific financial and academic center anchored by University of Sydney, UNSW Sydney, and UTS.',
    flagshipUniversities: ['University of Sydney', 'UNSW Sydney', 'University of Technology Sydney'],
  },
  {
    rank: 7,
    slug: 'paris',
    name: 'Paris',
    countryCode: 'FR',
    countryName: 'France',
    countryFlag: '🇫🇷',
    continent: 'Europe',
    latitude: 48.8566,
    longitude: 2.3522,
    qsScore: 94.6,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1300,
    monthlyLivingMaxUsd: 2100,
    shortDescription:
      'Historic European intellectual capital home to PSL University, Institut Polytechnique de Paris, Sorbonne University, and Sciences Po.',
    flagshipUniversities: ['Université PSL', 'Sorbonne University', 'Institut Polytechnique de Paris'],
  },
  {
    rank: 8,
    slug: 'zurich',
    name: 'Zurich',
    countryCode: 'CH',
    countryName: 'Switzerland',
    countryFlag: '🇨🇭',
    continent: 'Europe',
    latitude: 47.3769,
    longitude: 8.5417,
    qsScore: 94.5,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1850,
    monthlyLivingMaxUsd: 2800,
    shortDescription:
      'Continental Europe’s premier STEM powerhouse anchored by ETH Zurich and University of Zurich with low public tuition.',
    flagshipUniversities: ['ETH Zurich', 'University of Zurich'],
  },
  {
    rank: 9,
    slug: 'berlin',
    name: 'Berlin',
    countryCode: 'DE',
    countryName: 'Germany',
    countryFlag: '🇩🇪',
    continent: 'Europe',
    latitude: 52.52,
    longitude: 13.405,
    qsScore: 94.4,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1050,
    monthlyLivingMaxUsd: 1650,
    shortDescription:
      'Vibrant tuition-free public university ecosystem uniting Humboldt University, Freie Universität Berlin, and TU Berlin.',
    flagshipUniversities: ['Humboldt University of Berlin', 'Freie Universität Berlin', 'Technical University of Berlin'],
  },
  {
    rank: 10,
    slug: 'montreal',
    name: 'Montreal',
    countryCode: 'CA',
    countryName: 'Canada',
    countryFlag: '🇨🇦',
    continent: 'North America',
    latitude: 45.5017,
    longitude: -73.5673,
    qsScore: 92.1,
    rankingSource: 'QS Best Student Cities 2025',
    rankingYear: 2025,
    sourceUrl: 'https://www.topuniversities.com/city-rankings',
    monthlyLivingMinUsd: 1150,
    monthlyLivingMaxUsd: 1800,
    shortDescription:
      'North America’s #1 student city blending bilingual culture, AI research leadership, McGill University, and Université de Montréal.',
    flagshipUniversities: ['McGill University', 'Université de Montréal', 'Concordia University'],
  },
];
