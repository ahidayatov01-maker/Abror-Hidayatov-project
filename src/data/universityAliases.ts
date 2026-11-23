export interface CuratedUniversityAlias {
  universitySlug: string;
  alias: string;
  aliasType: 'official' | 'acronym' | 'local' | 'transliteration' | 'common';
  language: string;
}

export const CURATED_UNIVERSITY_ALIASES: CuratedUniversityAlias[] = [
  // Japan
  { universitySlug: 'university-of-tokyo', alias: 'Tokyo University', aliasType: 'common', language: 'en' },
  { universitySlug: 'university-of-tokyo', alias: 'UTokyo', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'university-of-tokyo', alias: 'Todai', aliasType: 'common', language: 'ja' },
  { universitySlug: 'university-of-tokyo', alias: 'Tokyo Daigaku', aliasType: 'transliteration', language: 'ja' },
  { universitySlug: 'university-of-tokyo', alias: '東京大学', aliasType: 'local', language: 'ja' },
  { universitySlug: 'university-of-tokyo', alias: 'Tokio universiteti', aliasType: 'local', language: 'uz' },
  { universitySlug: 'kyoto-university', alias: 'Kyodai', aliasType: 'common', language: 'ja' },
  { universitySlug: 'kyoto-university', alias: 'Kyoto Daigaku', aliasType: 'transliteration', language: 'ja' },
  { universitySlug: 'kyoto-university', alias: '京都大学', aliasType: 'local', language: 'ja' },
  { universitySlug: 'kyushu-institute-of-technology', alias: 'Kyutech', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'kyushu-institute-of-technology', alias: 'KIT', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'kyushu-institute-of-technology', alias: 'Kyushu Kogyo Daigaku', aliasType: 'transliteration', language: 'ja' },
  { universitySlug: 'kyushu-institute-of-technology', alias: '九州工業大学', aliasType: 'local', language: 'ja' },
  { universitySlug: 'waseda-university', alias: 'Waseda Daigaku', aliasType: 'transliteration', language: 'ja' },
  { universitySlug: 'waseda-university', alias: '早稲田大学', aliasType: 'local', language: 'ja' },
  // USA
  { universitySlug: 'mit', alias: 'MIT', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'mit', alias: 'Massachusetts Institute of Technology', aliasType: 'official', language: 'en' },
  { universitySlug: 'stanford-university', alias: 'Stanford', aliasType: 'common', language: 'en' },
  { universitySlug: 'harvard-university', alias: 'Harvard', aliasType: 'common', language: 'en' },
  { universitySlug: 'uc-berkeley', alias: 'UC Berkeley', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'uc-berkeley', alias: 'Cal', aliasType: 'common', language: 'en' },
  { universitySlug: 'uc-berkeley', alias: 'University of California, Berkeley', aliasType: 'official', language: 'en' },
  // UK
  { universitySlug: 'university-of-oxford', alias: 'Oxford', aliasType: 'common', language: 'en' },
  { universitySlug: 'university-of-oxford', alias: 'Oxford University', aliasType: 'common', language: 'en' },
  { universitySlug: 'university-of-cambridge', alias: 'Cambridge', aliasType: 'common', language: 'en' },
  { universitySlug: 'university-of-cambridge', alias: 'Cambridge University', aliasType: 'common', language: 'en' },
  { universitySlug: 'imperial-college-london', alias: 'Imperial', aliasType: 'common', language: 'en' },
  { universitySlug: 'imperial-college-london', alias: 'ICL', aliasType: 'acronym', language: 'en' },
  // Germany & Switzerland
  { universitySlug: 'tu-munich', alias: 'TUM', aliasType: 'acronym', language: 'de' },
  { universitySlug: 'tu-munich', alias: 'Technische Universität München', aliasType: 'local', language: 'de' },
  { universitySlug: 'tu-munich', alias: 'Technical University of Munich', aliasType: 'official', language: 'en' },
  { universitySlug: 'lmu-munich', alias: 'LMU', aliasType: 'acronym', language: 'de' },
  { universitySlug: 'lmu-munich', alias: 'Ludwig-Maximilians-Universität München', aliasType: 'local', language: 'de' },
  { universitySlug: 'eth-zurich', alias: 'ETH', aliasType: 'acronym', language: 'de' },
  { universitySlug: 'eth-zurich', alias: 'ETHZ', aliasType: 'acronym', language: 'de' },
  { universitySlug: 'eth-zurich', alias: 'Eidgenössische Technische Hochschule Zürich', aliasType: 'local', language: 'de' },
  { universitySlug: 'epfl', alias: 'EPFL', aliasType: 'acronym', language: 'fr' },
  { universitySlug: 'epfl', alias: 'École Polytechnique Fédérale de Lausanne', aliasType: 'official', language: 'fr' },
  // Canada, Australia, Singapore, Korea
  { universitySlug: 'university-of-toronto', alias: 'U of T', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'university-of-toronto', alias: 'UofT', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'mcgill-university', alias: 'McGill', aliasType: 'common', language: 'en' },
  { universitySlug: 'university-of-melbourne', alias: 'UniMelb', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'university-of-melbourne', alias: 'Melbourne University', aliasType: 'common', language: 'en' },
  { universitySlug: 'university-of-sydney', alias: 'USYD', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'nus-singapore', alias: 'NUS', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'nus-singapore', alias: 'National University of Singapore', aliasType: 'official', language: 'en' },
  { universitySlug: 'ntu-singapore', alias: 'NTU', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'ntu-singapore', alias: 'Nanyang Technological University', aliasType: 'official', language: 'en' },
  { universitySlug: 'seoul-national-university', alias: 'SNU', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'seoul-national-university', alias: '서울대학교', aliasType: 'local', language: 'ko' },
  { universitySlug: 'kaist', alias: 'KAIST', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'kaist', alias: 'Korea Advanced Institute of Science and Technology', aliasType: 'official', language: 'en' },
  // Uzbekistan
  { universitySlug: 'nuuz-tashkent', alias: 'NUUz', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'nuuz-tashkent', alias: 'O‘zMU', aliasType: 'acronym', language: 'uz' },
  { universitySlug: 'nuuz-tashkent', alias: 'UzMU', aliasType: 'transliteration', language: 'uz' },
  { universitySlug: 'nuuz-tashkent', alias: 'Mirzo Ulugbek National University', aliasType: 'common', language: 'en' },
  { universitySlug: 'tuit-tashkent', alias: 'TUIT', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'tuit-tashkent', alias: 'TATU', aliasType: 'acronym', language: 'uz' },
  { universitySlug: 'tuit-tashkent', alias: 'Toshkent axborot texnologiyalari universiteti', aliasType: 'local', language: 'uz' },
  { universitySlug: 'wiut-tashkent', alias: 'WIUT', aliasType: 'acronym', language: 'en' },
  { universitySlug: 'wiut-tashkent', alias: 'Westminster Tashkent', aliasType: 'common', language: 'en' },
];

export const ALIASES_BY_SLUG: Record<string, string[]> = {};
for (const entry of CURATED_UNIVERSITY_ALIASES) {
  if (!ALIASES_BY_SLUG[entry.universitySlug]) {
    ALIASES_BY_SLUG[entry.universitySlug] = [];
  }
  ALIASES_BY_SLUG[entry.universitySlug].push(entry.alias);
}
