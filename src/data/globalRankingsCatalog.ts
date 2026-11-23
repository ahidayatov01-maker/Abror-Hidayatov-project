import {
  correctQueryTokens,
  fuzzyTokenCoverageScore,
  normalizeSearchText,
  stringSimilarity,
} from '../utils/globalSearchEngine';

export type RankingProviderName =
  | 'QS World University Rankings'
  | 'Times Higher Education'
  | 'Academic Ranking of World Universities';

export interface VerifiedGlobalRankingEntry {
  universitySlug: string;
  universityName: string;
  shortName: string;
  aliases: string[];
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  cityName: string;
  provider: RankingProviderName;
  publicationYear: number;
  worldRank: number;
  worldRankDisplay: string;
  historicalRanksJson: Array<{ year: number; rank: number }>;
  sourceUrl: string;
  isTop15: boolean;
}

export const RANKING_PROVIDERS: RankingProviderName[] = [
  'QS World University Rankings',
  'Times Higher Education',
  'Academic Ranking of World Universities',
];

const QS_SOURCE = 'https://www.topuniversities.com/world-university-rankings';
const THE_SOURCE = 'https://www.timeshighereducation.com/world-university-rankings';
const ARWU_SOURCE = 'https://www.shanghairanking.com/rankings/arwu/2024';

function buildEntry(
  provider: RankingProviderName,
  publicationYear: number,
  worldRank: number,
  universitySlug: string,
  universityName: string,
  shortName: string,
  countryCode: string,
  countryName: string,
  flagEmoji: string,
  cityName: string,
  aliases: string[],
  histRanks: [number, number, number, number]
): VerifiedGlobalRankingEntry {
  const baseYear = publicationYear - 3;
  const sourceUrl =
    provider === 'QS World University Rankings'
      ? QS_SOURCE
      : provider === 'Times Higher Education'
      ? THE_SOURCE
      : ARWU_SOURCE;

  return {
    universitySlug,
    universityName,
    shortName,
    aliases,
    countryCode,
    countryName,
    flagEmoji,
    cityName,
    provider,
    publicationYear,
    worldRank,
    worldRankDisplay: `#${worldRank}`,
    historicalRanksJson: [
      { year: baseYear, rank: histRanks[0] },
      { year: baseYear + 1, rank: histRanks[1] },
      { year: baseYear + 2, rank: histRanks[2] },
      { year: publicationYear, rank: histRanks[3] },
    ],
    sourceUrl,
    isTop15: worldRank <= 15,
  };
}

/**
 * Verified global university ranking dataset across QS (2025), THE (2025), and ARWU (2024).
 * Includes full Top 15 (positions 1..15) plus extended verified positions (16..100) so
 * default presentation shows strictly Top 15 while targeted search by rank or name
 * can retrieve both Top 15 and outside-Top-15 institutions.
 */
export const VERIFIED_GLOBAL_RANKINGS: VerifiedGlobalRankingEntry[] = [
  // ================= QS WORLD UNIVERSITY RANKINGS 2025 (Top 15 + Extended Positions) =================
  buildEntry('QS World University Rankings', 2025, 1, 'mit', 'Massachusetts Institute of Technology', 'MIT', 'US', 'United States', '🇺🇸', 'Cambridge', ['MIT', 'Massachusets Institute of Technology', 'Massachusetts Tech'], [1, 1, 1, 1]),
  buildEntry('QS World University Rankings', 2025, 2, 'imperial-college-london', 'Imperial College London', 'Imperial', 'GB', 'United Kingdom', '🇬🇧', 'London', ['Imperial', 'ICL', 'Imperial College'], [7, 6, 6, 2]),
  buildEntry('QS World University Rankings', 2025, 3, 'university-of-oxford', 'University of Oxford', 'Oxford', 'GB', 'United Kingdom', '🇬🇧', 'Oxford', ['Oxford', 'Oxford University', 'Oxon'], [2, 4, 3, 3]),
  buildEntry('QS World University Rankings', 2025, 4, 'harvard-university', 'Harvard University', 'Harvard', 'US', 'United States', '🇺🇸', 'Cambridge', ['Harvard', 'Harvard College'], [5, 5, 4, 4]),
  buildEntry('QS World University Rankings', 2025, 5, 'university-of-cambridge', 'University of Cambridge', 'Cambridge', 'GB', 'United Kingdom', '🇬🇧', 'Cambridge', ['Cambridge', 'Cambridge University', 'Cantab'], [3, 2, 2, 5]),
  buildEntry('QS World University Rankings', 2025, 6, 'stanford-university', 'Stanford University', 'Stanford', 'US', 'United States', '🇺🇸', 'Stanford', ['Stanford', 'Leland Stanford Junior University'], [3, 3, 5, 6]),
  buildEntry('QS World University Rankings', 2025, 7, 'eth-zurich', 'ETH Zurich', 'ETH Zurich', 'CH', 'Switzerland', '🇨🇭', 'Zurich', ['ETH', 'ETHZ', 'Swiss Federal Institute of Technology Zurich', 'Eidgenössische Technische Hochschule Zürich'], [8, 9, 7, 7]),
  buildEntry('QS World University Rankings', 2025, 8, 'nus-singapore', 'National University of Singapore', 'NUS', 'SG', 'Singapore', '🇸🇬', 'Singapore', ['NUS', 'Singapore National University'], [11, 11, 8, 8]),
  buildEntry('QS World University Rankings', 2025, 9, 'ucl', 'University College London', 'UCL', 'GB', 'United Kingdom', '🇬🇧', 'London', ['UCL', 'London Global University'], [8, 8, 9, 9]),
  buildEntry('QS World University Rankings', 2025, 10, 'caltech', 'California Institute of Technology', 'Caltech', 'US', 'United States', '🇺🇸', 'Pasadena', ['Caltech', 'CIT'], [6, 6, 15, 10]),
  buildEntry('QS World University Rankings', 2025, 11, 'university-of-pennsylvania', 'University of Pennsylvania', 'UPenn', 'US', 'United States', '🇺🇸', 'Philadelphia', ['UPenn', 'Penn', 'Wharton'], [13, 13, 12, 11]),
  buildEntry('QS World University Rankings', 2025, 12, 'uc-berkeley', 'University of California, Berkeley', 'UC Berkeley', 'US', 'United States', '🇺🇸', 'Berkeley', ['Berkeley', 'UCB', 'Cal'], [32, 27, 10, 12]),
  buildEntry('QS World University Rankings', 2025, 13, 'university-of-melbourne', 'The University of Melbourne', 'UniMelb', 'AU', 'Australia', '🇦🇺', 'Melbourne', ['UniMelb', 'Melbourne University', 'University of Melbourne'], [37, 33, 14, 13]),
  buildEntry('QS World University Rankings', 2025, 14, 'peking-university', 'Peking University', 'PKU', 'CN', 'China', '🇨🇳', 'Beijing', ['PKU', 'Beida', '北京大学'], [18, 12, 17, 14]),
  buildEntry('QS World University Rankings', 2025, 15, 'ntu-singapore', 'Nanyang Technological University, Singapore', 'NTU Singapore', 'SG', 'Singapore', '🇸🇬', 'Singapore', ['NTU', 'Nanyang Technological University'], [12, 19, 26, 15]),
  // Extended QS Positions (16..100)
  buildEntry('QS World University Rankings', 2025, 16, 'cornell-university', 'Cornell University', 'Cornell', 'US', 'United States', '🇺🇸', 'Ithaca', ['Cornell'], [21, 20, 13, 16]),
  buildEntry('QS World University Rankings', 2025, 17, 'university-of-hong-kong', 'The University of Hong Kong', 'HKU', 'CN', 'China (Hong Kong)', '🇭🇰', 'Hong Kong', ['HKU', 'University of Hong Kong'], [22, 21, 26, 17]),
  buildEntry('QS World University Rankings', 2025, 18, 'university-of-sydney', 'The University of Sydney', 'USYD', 'AU', 'Australia', '🇦🇺', 'Sydney', ['USYD', 'Sydney University'], [38, 41, 19, 18]),
  buildEntry('QS World University Rankings', 2025, 19, 'unsw-sydney', 'The University of New South Wales (UNSW Sydney)', 'UNSW', 'AU', 'Australia', '🇦🇺', 'Sydney', ['UNSW', 'University of New South Wales'], [43, 45, 19, 19]),
  buildEntry('QS World University Rankings', 2025, 20, 'tsinghua-university', 'Tsinghua University', 'Tsinghua', 'CN', 'China', '🇨🇳', 'Beijing', ['THU', 'Tsinghua', '清华大学'], [17, 14, 25, 20]),
  buildEntry('QS World University Rankings', 2025, 21, 'university-of-chicago', 'University of Chicago', 'UChicago', 'US', 'United States', '🇺🇸', 'Chicago', ['UChicago', 'Chicago University'], [10, 10, 11, 21]),
  buildEntry('QS World University Rankings', 2025, 22, 'princeton-university', 'Princeton University', 'Princeton', 'US', 'United States', '🇺🇸', 'Princeton', ['Princeton'], [20, 16, 17, 22]),
  buildEntry('QS World University Rankings', 2025, 23, 'yale-university', 'Yale University', 'Yale', 'US', 'United States', '🇺🇸', 'New Haven', ['Yale'], [14, 18, 16, 23]),
  buildEntry('QS World University Rankings', 2025, 24, 'psl-university', 'Université PSL (Paris Sciences & Lettres)', 'PSL', 'FR', 'France', '🇫🇷', 'Paris', ['PSL', 'Paris Sciences et Lettres', 'ENS Paris'], [44, 26, 24, 24]),
  buildEntry('QS World University Rankings', 2025, 25, 'university-of-toronto', 'University of Toronto', 'U of T', 'CA', 'Canada', '🇨🇦', 'Toronto', ['UofT', 'UToronto', 'Toronto University'], [26, 34, 21, 25]),
  buildEntry('QS World University Rankings', 2025, 26, 'epfl', 'EPFL – École Polytechnique Fédérale de Lausanne', 'EPFL', 'CH', 'Switzerland', '🇨🇭', 'Lausanne', ['EPFL', 'Swiss Federal Institute of Technology Lausanne'], [14, 16, 36, 26]),
  buildEntry('QS World University Rankings', 2025, 27, 'university-of-edinburgh', 'The University of Edinburgh', 'Edinburgh', 'GB', 'United Kingdom', '🇬🇧', 'Edinburgh', ['UoE', 'Edinburgh University'], [16, 15, 22, 27]),
  buildEntry('QS World University Rankings', 2025, 28, 'tu-munich', 'Technical University of Munich', 'TUM', 'DE', 'Germany', '🇩🇪', 'Munich', ['TUM', 'TU Munich', 'Technische Universität München'], [50, 49, 37, 28]),
  buildEntry('QS World University Rankings', 2025, 29, 'mcgill-university', 'McGill University', 'McGill', 'CA', 'Canada', '🇨🇦', 'Montreal', ['McGill'], [27, 31, 30, 29]),
  buildEntry('QS World University Rankings', 2025, 30, 'australian-national-university', 'The Australian National University', 'ANU', 'AU', 'Australia', '🇦🇺', 'Canberra', ['ANU'], [27, 30, 34, 30]),
  buildEntry('QS World University Rankings', 2025, 31, 'seoul-national-university', 'Seoul National University', 'SNU', 'KR', 'South Korea', '🇰🇷', 'Seoul', ['SNU', '서울대학교'], [36, 29, 41, 31]),
  buildEntry('QS World University Rankings', 2025, 32, 'university-of-tokyo', 'The University of Tokyo', 'UTokyo', 'JP', 'Japan', '🇯🇵', 'Tokyo', ['UTokyo', 'Todai', 'Tokyo University', 'Tokyo Daigaku'], [23, 23, 28, 32]),
  buildEntry('QS World University Rankings', 2025, 34, 'columbia-university', 'Columbia University', 'Columbia', 'US', 'United States', '🇺🇸', 'New York', ['Columbia'], [19, 22, 23, 34]),
  buildEntry('QS World University Rankings', 2025, 38, 'university-of-british-columbia', 'University of British Columbia', 'UBC', 'CA', 'Canada', '🇨🇦', 'Vancouver', ['UBC'], [46, 47, 34, 38]),
  buildEntry('QS World University Rankings', 2025, 39, 'fudan-university', 'Fudan University', 'Fudan', 'CN', 'China', '🇨🇳', 'Shanghai', ['Fudan'], [31, 34, 50, 39]),
  buildEntry('QS World University Rankings', 2025, 40, 'kings-college-london', "King's College London", 'KCL', 'GB', 'United Kingdom', '🇬🇧', 'London', ['KCL', 'Kings College London'], [35, 37, 40, 40]),
  buildEntry('QS World University Rankings', 2025, 42, 'ucla', 'University of California, Los Angeles', 'UCLA', 'US', 'United States', '🇺🇸', 'Los Angeles', ['UCLA'], [40, 44, 29, 42]),
  buildEntry('QS World University Rankings', 2025, 44, 'university-of-michigan', 'University of Michigan-Ann Arbor', 'UMich', 'US', 'United States', '🇺🇸', 'Ann Arbor', ['UMich', 'University of Michigan'], [23, 25, 33, 44]),
  buildEntry('QS World University Rankings', 2025, 45, 'shanghai-jiao-tong-university', 'Shanghai Jiao Tong University', 'SJTU', 'CN', 'China', '🇨🇳', 'Shanghai', ['SJTU'], [50, 46, 51, 45]),
  buildEntry('QS World University Rankings', 2025, 47, 'zhejiang-university', 'Zhejiang University', 'ZJU', 'CN', 'China', '🇨🇳', 'Hangzhou', ['ZJU', 'Zheda'], [45, 42, 44, 47]),
  buildEntry('QS World University Rankings', 2025, 49, 'tu-delft', 'Delft University of Technology', 'TU Delft', 'NL', 'Netherlands', '🇳🇱', 'Delft', ['TU Delft', 'TUD'], [57, 61, 47, 49]),
  buildEntry('QS World University Rankings', 2025, 50, 'kyoto-university', 'Kyoto University', 'KyotoU', 'JP', 'Japan', '🇯🇵', 'Kyoto', ['KyotoU', 'Kyodai', 'Kyoto Daigaku'], [33, 36, 46, 50]),
  buildEntry('QS World University Rankings', 2025, 53, 'kaist', 'KAIST - Korea Advanced Institute of Science & Technology', 'KAIST', 'KR', 'South Korea', '🇰🇷', 'Daejeon', ['KAIST', 'Korea Advanced Institute of Science and Technology'], [41, 42, 56, 53]),
  buildEntry('QS World University Rankings', 2025, 55, 'university-of-amsterdam', 'University of Amsterdam', 'UvA', 'NL', 'Netherlands', '🇳🇱', 'Amsterdam', ['UvA'], [55, 58, 53, 55]),
  buildEntry('QS World University Rankings', 2025, 58, 'carnegie-mellon-university', 'Carnegie Mellon University', 'CMU', 'US', 'United States', '🇺🇸', 'Pittsburgh', ['CMU'], [53, 52, 52, 58]),
  buildEntry('QS World University Rankings', 2025, 59, 'lmu-munich', 'Ludwig-Maximilians-Universität München', 'LMU Munich', 'DE', 'Germany', '🇩🇪', 'Munich', ['LMU', 'University of Munich'], [64, 59, 54, 59]),
  buildEntry('QS World University Rankings', 2025, 63, 'sorbonne-university', 'Sorbonne University', 'Sorbonne', 'FR', 'France', '🇫🇷', 'Paris', ['Sorbonne', 'UPMC'], [72, 60, 59, 63]),
  buildEntry('QS World University Rankings', 2025, 84, 'institute-of-science-tokyo', 'Institute of Science Tokyo (Tokyo Tech)', 'Science Tokyo', 'JP', 'Japan', '🇯🇵', 'Tokyo', ['Tokyo Tech', 'TiTech', 'ISCT'], [56, 55, 91, 84]),
  buildEntry('QS World University Rankings', 2025, 86, 'osaka-university', 'Osaka University', 'OsakaU', 'JP', 'Japan', '🇯🇵', 'Osaka', ['OsakaU', 'Handai'], [75, 68, 80, 86]),
  buildEntry('QS World University Rankings', 2025, 94, 'lomonosov-moscow-state-university', 'Lomonosov Moscow State University', 'MSU', 'RU', 'Russia', '🇷🇺', 'Moscow', ['MSU', 'MGU', 'Moscow State University', 'МГУ'], [78, 75, 87, 94]),

  // ================= TIMES HIGHER EDUCATION (THE) 2025 (Top 15 + Extended Positions) =================
  buildEntry('Times Higher Education', 2025, 1, 'university-of-oxford', 'University of Oxford', 'Oxford', 'GB', 'United Kingdom', '🇬🇧', 'Oxford', ['Oxford', 'Oxford University'], [1, 1, 1, 1]),
  buildEntry('Times Higher Education', 2025, 2, 'mit', 'Massachusetts Institute of Technology', 'MIT', 'US', 'United States', '🇺🇸', 'Cambridge', ['MIT', 'Massachusets Institute of Technology'], [5, 5, 3, 2]),
  buildEntry('Times Higher Education', 2025, 3, 'harvard-university', 'Harvard University', 'Harvard', 'US', 'United States', '🇺🇸', 'Cambridge', ['Harvard'], [2, 2, 4, 3]),
  buildEntry('Times Higher Education', 2025, 4, 'princeton-university', 'Princeton University', 'Princeton', 'US', 'United States', '🇺🇸', 'Princeton', ['Princeton'], [7, 7, 6, 4]),
  buildEntry('Times Higher Education', 2025, 5, 'university-of-cambridge', 'University of Cambridge', 'Cambridge', 'GB', 'United Kingdom', '🇬🇧', 'Cambridge', ['Cambridge', 'Cambridge University'], [5, 3, 5, 5]),
  buildEntry('Times Higher Education', 2025, 6, 'stanford-university', 'Stanford University', 'Stanford', 'US', 'United States', '🇺🇸', 'Stanford', ['Stanford'], [4, 3, 2, 6]),
  buildEntry('Times Higher Education', 2025, 7, 'caltech', 'California Institute of Technology', 'Caltech', 'US', 'United States', '🇺🇸', 'Pasadena', ['Caltech', 'CIT'], [2, 6, 7, 7]),
  buildEntry('Times Higher Education', 2025, 8, 'uc-berkeley', 'University of California, Berkeley', 'UC Berkeley', 'US', 'United States', '🇺🇸', 'Berkeley', ['Berkeley', 'UCB', 'Cal'], [8, 8, 9, 8]),
  buildEntry('Times Higher Education', 2025, 9, 'imperial-college-london', 'Imperial College London', 'Imperial', 'GB', 'United Kingdom', '🇬🇧', 'London', ['Imperial', 'ICL'], [12, 10, 8, 9]),
  buildEntry('Times Higher Education', 2025, 10, 'yale-university', 'Yale University', 'Yale', 'US', 'United States', '🇺🇸', 'New Haven', ['Yale'], [9, 9, 10, 10]),
  buildEntry('Times Higher Education', 2025, 11, 'eth-zurich', 'ETH Zurich', 'ETH Zurich', 'CH', 'Switzerland', '🇨🇭', 'Zurich', ['ETH', 'ETHZ', 'Swiss Federal Institute of Technology Zurich'], [15, 11, 11, 11]),
  buildEntry('Times Higher Education', 2025, 12, 'tsinghua-university', 'Tsinghua University', 'Tsinghua', 'CN', 'China', '🇨🇳', 'Beijing', ['THU', 'Tsinghua'], [16, 16, 12, 12]),
  buildEntry('Times Higher Education', 2025, 13, 'peking-university', 'Peking University', 'PKU', 'CN', 'China', '🇨🇳', 'Beijing', ['PKU', 'Beida'], [16, 17, 14, 13]),
  buildEntry('Times Higher Education', 2025, 14, 'university-of-chicago', 'University of Chicago', 'UChicago', 'US', 'United States', '🇺🇸', 'Chicago', ['UChicago'], [10, 13, 13, 14]),
  buildEntry('Times Higher Education', 2025, 15, 'university-of-pennsylvania', 'University of Pennsylvania', 'UPenn', 'US', 'United States', '🇺🇸', 'Philadelphia', ['UPenn', 'Penn'], [13, 14, 16, 15]),
  // Extended THE Positions (16..65)
  buildEntry('Times Higher Education', 2025, 16, 'johns-hopkins-university', 'Johns Hopkins University', 'JHU', 'US', 'United States', '🇺🇸', 'Baltimore', ['JHU', 'Johns Hopkins'], [13, 15, 15, 16]),
  buildEntry('Times Higher Education', 2025, 17, 'nus-singapore', 'National University of Singapore', 'NUS', 'SG', 'Singapore', '🇸🇬', 'Singapore', ['NUS'], [21, 19, 19, 17]),
  buildEntry('Times Higher Education', 2025, 18, 'columbia-university', 'Columbia University', 'Columbia', 'US', 'United States', '🇺🇸', 'New York', ['Columbia'], [11, 11, 17, 18]),
  buildEntry('Times Higher Education', 2025, 19, 'ucla', 'University of California, Los Angeles', 'UCLA', 'US', 'United States', '🇺🇸', 'Los Angeles', ['UCLA'], [20, 21, 18, 19]),
  buildEntry('Times Higher Education', 2025, 20, 'cornell-university', 'Cornell University', 'Cornell', 'US', 'United States', '🇺🇸', 'Ithaca', ['Cornell'], [22, 20, 20, 20]),
  buildEntry('Times Higher Education', 2025, 21, 'university-of-toronto', 'University of Toronto', 'U of T', 'CA', 'Canada', '🇨🇦', 'Toronto', ['UofT', 'UToronto'], [18, 18, 21, 21]),
  buildEntry('Times Higher Education', 2025, 22, 'ucl', 'University College London', 'UCL', 'GB', 'United Kingdom', '🇬🇧', 'London', ['UCL'], [18, 22, 22, 22]),
  buildEntry('Times Higher Education', 2025, 23, 'university-of-michigan', 'University of Michigan-Ann Arbor', 'UMich', 'US', 'United States', '🇺🇸', 'Ann Arbor', ['UMich'], [24, 23, 23, 23]),
  buildEntry('Times Higher Education', 2025, 24, 'carnegie-mellon-university', 'Carnegie Mellon University', 'CMU', 'US', 'United States', '🇺🇸', 'Pittsburgh', ['CMU'], [28, 28, 24, 24]),
  buildEntry('Times Higher Education', 2025, 26, 'tu-munich', 'Technical University of Munich', 'TUM', 'DE', 'Germany', '🇩🇪', 'Munich', ['TUM', 'TU Munich'], [38, 30, 30, 26]),
  buildEntry('Times Higher Education', 2025, 28, 'university-of-tokyo', 'The University of Tokyo', 'UTokyo', 'JP', 'Japan', '🇯🇵', 'Tokyo', ['UTokyo', 'Todai', 'Tokyo University'], [35, 39, 29, 28]),
  buildEntry('Times Higher Education', 2025, 29, 'university-of-edinburgh', 'The University of Edinburgh', 'Edinburgh', 'GB', 'United Kingdom', '🇬🇧', 'Edinburgh', ['UoE', 'Edinburgh'], [30, 29, 30, 29]),
  buildEntry('Times Higher Education', 2025, 30, 'ntu-singapore', 'Nanyang Technological University, Singapore', 'NTU Singapore', 'SG', 'Singapore', '🇸🇬', 'Singapore', ['NTU'], [46, 36, 32, 30]),
  buildEntry('Times Higher Education', 2025, 32, 'epfl', 'EPFL – École Polytechnique Fédérale de Lausanne', 'EPFL', 'CH', 'Switzerland', '🇨🇭', 'Lausanne', ['EPFL'], [40, 41, 33, 32]),
  buildEntry('Times Higher Education', 2025, 38, 'lmu-munich', 'Ludwig-Maximilians-Universität München', 'LMU Munich', 'DE', 'Germany', '🇩🇪', 'Munich', ['LMU'], [32, 33, 38, 38]),
  buildEntry('Times Higher Education', 2025, 39, 'university-of-melbourne', 'The University of Melbourne', 'UniMelb', 'AU', 'Australia', '🇦🇺', 'Melbourne', ['UniMelb'], [33, 34, 37, 39]),
  buildEntry('Times Higher Education', 2025, 55, 'kyoto-university', 'Kyoto University', 'KyotoU', 'JP', 'Japan', '🇯🇵', 'Kyoto', ['KyotoU', 'Kyodai'], [61, 68, 55, 55]),
  buildEntry('Times Higher Education', 2025, 62, 'seoul-national-university', 'Seoul National University', 'SNU', 'KR', 'South Korea', '🇰🇷', 'Seoul', ['SNU'], [54, 56, 62, 62]),

  // ================= ACADEMIC RANKING OF WORLD UNIVERSITIES (ARWU) 2024 (Top 15 + Extended Positions) =================
  buildEntry('Academic Ranking of World Universities', 2024, 1, 'harvard-university', 'Harvard University', 'Harvard', 'US', 'United States', '🇺🇸', 'Cambridge', ['Harvard'], [1, 1, 1, 1]),
  buildEntry('Academic Ranking of World Universities', 2024, 2, 'stanford-university', 'Stanford University', 'Stanford', 'US', 'United States', '🇺🇸', 'Stanford', ['Stanford'], [2, 2, 2, 2]),
  buildEntry('Academic Ranking of World Universities', 2024, 3, 'mit', 'Massachusetts Institute of Technology', 'MIT', 'US', 'United States', '🇺🇸', 'Cambridge', ['MIT', 'Massachusets Institute of Technology'], [4, 3, 3, 3]),
  buildEntry('Academic Ranking of World Universities', 2024, 4, 'university-of-cambridge', 'University of Cambridge', 'Cambridge', 'GB', 'United Kingdom', '🇬🇧', 'Cambridge', ['Cambridge', 'Cambridge University'], [3, 4, 4, 4]),
  buildEntry('Academic Ranking of World Universities', 2024, 5, 'uc-berkeley', 'University of California, Berkeley', 'UC Berkeley', 'US', 'United States', '🇺🇸', 'Berkeley', ['Berkeley', 'UCB', 'Cal'], [5, 5, 5, 5]),
  buildEntry('Academic Ranking of World Universities', 2024, 6, 'university-of-oxford', 'University of Oxford', 'Oxford', 'GB', 'United Kingdom', '🇬🇧', 'Oxford', ['Oxford', 'Oxford University'], [7, 7, 7, 6]),
  buildEntry('Academic Ranking of World Universities', 2024, 7, 'princeton-university', 'Princeton University', 'Princeton', 'US', 'United States', '🇺🇸', 'Princeton', ['Princeton'], [6, 6, 6, 7]),
  buildEntry('Academic Ranking of World Universities', 2024, 8, 'caltech', 'California Institute of Technology', 'Caltech', 'US', 'United States', '🇺🇸', 'Pasadena', ['Caltech', 'CIT'], [9, 9, 9, 8]),
  buildEntry('Academic Ranking of World Universities', 2024, 9, 'columbia-university', 'Columbia University', 'Columbia', 'US', 'United States', '🇺🇸', 'New York', ['Columbia'], [8, 8, 8, 9]),
  buildEntry('Academic Ranking of World Universities', 2024, 10, 'university-of-chicago', 'University of Chicago', 'UChicago', 'US', 'United States', '🇺🇸', 'Chicago', ['UChicago'], [10, 10, 10, 10]),
  buildEntry('Academic Ranking of World Universities', 2024, 11, 'yale-university', 'Yale University', 'Yale', 'US', 'United States', '🇺🇸', 'New Haven', ['Yale'], [11, 11, 11, 11]),
  buildEntry('Academic Ranking of World Universities', 2024, 12, 'universite-paris-saclay', 'Université Paris-Saclay', 'Paris-Saclay', 'FR', 'France', '🇫🇷', 'Gif-sur-Yvette', ['Paris-Saclay', 'UPSaclay'], [13, 16, 15, 12]),
  buildEntry('Academic Ranking of World Universities', 2024, 13, 'cornell-university', 'Cornell University', 'Cornell', 'US', 'United States', '🇺🇸', 'Ithaca', ['Cornell'], [12, 12, 12, 13]),
  buildEntry('Academic Ranking of World Universities', 2024, 14, 'university-of-pennsylvania', 'University of Pennsylvania', 'UPenn', 'US', 'United States', '🇺🇸', 'Philadelphia', ['UPenn', 'Penn'], [15, 15, 14, 14]),
  buildEntry('Academic Ranking of World Universities', 2024, 15, 'ucla', 'University of California, Los Angeles', 'UCLA', 'US', 'United States', '🇺🇸', 'Los Angeles', ['UCLA'], [14, 13, 13, 15]),
  // Extended ARWU Positions (16..50)
  buildEntry('Academic Ranking of World Universities', 2024, 16, 'ucl', 'University College London', 'UCL', 'GB', 'United Kingdom', '🇬🇧', 'London', ['UCL'], [17, 18, 17, 16]),
  buildEntry('Academic Ranking of World Universities', 2024, 17, 'johns-hopkins-university', 'Johns Hopkins University', 'JHU', 'US', 'United States', '🇺🇸', 'Baltimore', ['JHU', 'Johns Hopkins'], [16, 14, 16, 17]),
  buildEntry('Academic Ranking of World Universities', 2024, 21, 'eth-zurich', 'ETH Zurich', 'ETH Zurich', 'CH', 'Switzerland', '🇨🇭', 'Zurich', ['ETH', 'ETHZ'], [21, 20, 20, 21]),
  buildEntry('Academic Ranking of World Universities', 2024, 22, 'tsinghua-university', 'Tsinghua University', 'Tsinghua', 'CN', 'China', '🇨🇳', 'Beijing', ['THU', 'Tsinghua'], [28, 26, 22, 22]),
  buildEntry('Academic Ranking of World Universities', 2024, 24, 'peking-university', 'Peking University', 'PKU', 'CN', 'China', '🇨🇳', 'Beijing', ['PKU', 'Beida'], [45, 34, 29, 24]),
  buildEntry('Academic Ranking of World Universities', 2024, 25, 'imperial-college-london', 'Imperial College London', 'Imperial', 'GB', 'United Kingdom', '🇬🇧', 'London', ['Imperial', 'ICL'], [25, 23, 23, 25]),
  buildEntry('Academic Ranking of World Universities', 2024, 26, 'university-of-toronto', 'University of Toronto', 'U of T', 'CA', 'Canada', '🇨🇦', 'Toronto', ['UofT', 'UToronto'], [22, 22, 24, 26]),
  buildEntry('Academic Ranking of World Universities', 2024, 28, 'university-of-tokyo', 'The University of Tokyo', 'UTokyo', 'JP', 'Japan', '🇯🇵', 'Tokyo', ['UTokyo', 'Todai', 'Tokyo University'], [24, 24, 27, 28]),
  buildEntry('Academic Ranking of World Universities', 2024, 37, 'university-of-melbourne', 'The University of Melbourne', 'UniMelb', 'AU', 'Australia', '🇦🇺', 'Melbourne', ['UniMelb'], [33, 32, 35, 37]),
  buildEntry('Academic Ranking of World Universities', 2024, 41, 'sorbonne-university', 'Sorbonne University', 'Sorbonne', 'FR', 'France', '🇫🇷', 'Paris', ['Sorbonne'], [35, 43, 46, 41]),
  buildEntry('Academic Ranking of World Universities', 2024, 45, 'kyoto-university', 'Kyoto University', 'KyotoU', 'JP', 'Japan', '🇯🇵', 'Kyoto', ['KyotoU', 'Kyodai'], [37, 41, 39, 45]),
  buildEntry('Academic Ranking of World Universities', 2024, 47, 'tu-munich', 'Technical University of Munich', 'TUM', 'DE', 'Germany', '🇩🇪', 'Munich', ['TUM', 'TU Munich'], [52, 56, 59, 47]),
];

/**
 * Returns strictly the first 15 positions (Top 15) for the selected ranking provider.
 */
export function getDefaultTop15Rankings(
  provider: RankingProviderName
): VerifiedGlobalRankingEntry[] {
  return VERIFIED_GLOBAL_RANKINGS.filter((r) => r.provider === provider && r.worldRank <= 15)
    .sort((a, b) => a.worldRank - b.worldRank)
    .slice(0, 15);
}

/**
 * Mode A — Search by Position (#)
 * Finds the exact university ranked at the requested numeric position in the selected ranking provider.
 * Searches the full underlying ranking dataset (including positions > 15).
 * Never calculates rank from visible card index.
 */
export function searchRankingsByPosition(
  provider: RankingProviderName,
  rawPositionInput: string
): {
  results: VerifiedGlobalRankingEntry[];
  parsedPosition: number | null;
} {
  const cleaned = rawPositionInput.replace(/[^0-9]/g, '').trim();
  if (!cleaned) {
    return { results: getDefaultTop15Rankings(provider), parsedPosition: null };
  }
  const pos = Number(cleaned);
  if (!Number.isFinite(pos) || pos <= 0) {
    return { results: [], parsedPosition: null };
  }

  const matches = VERIFIED_GLOBAL_RANKINGS.filter(
    (r) => r.provider === provider && r.worldRank === pos
  ).sort((a, b) => a.worldRank - b.worldRank);

  return { results: matches, parsedPosition: pos };
}

/**
 * Mode B — Search by University Name
 * Searches the entire provider dataset (Top 15 + positions outside Top 15)
 * supporting full official names, partial names, common names, abbreviations (MIT, ETH, UCL, TUM, Todai, etc.),
 * and typo-tolerant fuzzy matching (e.g. "Massachusets" -> "Massachusetts Institute of Technology").
 */
export function searchRankingsByUniversityName(
  provider: RankingProviderName,
  rawQuery: string
): {
  results: VerifiedGlobalRankingEntry[];
  didYouMean: string | null;
} {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return { results: getDefaultTop15Rankings(provider), didYouMean: null };
  }

  const pool = VERIFIED_GLOBAL_RANKINGS.filter((r) => r.provider === provider);
  const { normalized, corrected, expandedCanonical, hadCorrection } = correctQueryTokens(trimmed);
  const variants = Array.from(
    new Set([normalized, corrected, expandedCanonical].filter((v): v is string => Boolean(v)))
  );

  const scored: Array<{
    entry: VerifiedGlobalRankingEntry;
    score: number;
    usedFuzzy: boolean;
  }> = [];

  for (const entry of pool) {
    const nameNorm = normalizeSearchText(entry.universityName);
    const nameNoThe = nameNorm.replace(/^the\s+/, '');
    const shortNorm = normalizeSearchText(entry.shortName);
    const aliasNorms = Array.from(
      new Set([entry.shortName, ...entry.aliases].map(normalizeSearchText).filter(Boolean))
    );
    const cityNorm = normalizeSearchText(entry.cityName);
    const countryNorm = normalizeSearchText(entry.countryName);

    let bestScore = 0;
    let usedFuzzy = false;

    const normNoThe = normalized.replace(/^the\s+/, '');
    const corrNoThe = corrected.replace(/^the\s+/, '');
    const expNoThe = expandedCanonical ? expandedCanonical.replace(/^the\s+/, '') : null;

    // 1. Exact official name or expanded canonical match
    if (nameNorm === normalized || nameNoThe === normNoThe) {
      bestScore = 1000;
    } else if (
      nameNorm === corrected ||
      nameNoThe === corrNoThe ||
      (expandedCanonical && (nameNorm === expandedCanonical || nameNoThe === expNoThe))
    ) {
      bestScore = 965;
      usedFuzzy = hadCorrection;
    }

    // 2. Exact abbreviation / alias match
    if (bestScore < 930) {
      if (shortNorm === normalized || aliasNorms.includes(normalized)) {
        bestScore = 940;
      } else if (
        aliasNorms.includes(corrected) ||
        (expandedCanonical && aliasNorms.includes(expandedCanonical))
      ) {
        bestScore = 915;
        usedFuzzy = hadCorrection;
      }
    }

    // 3. Prefix or substring match on official name or aliases
    if (bestScore < 860) {
      for (const qv of variants) {
        if (nameNorm.startsWith(qv) || nameNoThe.startsWith(qv)) {
          bestScore = Math.max(bestScore, qv !== normalized && hadCorrection ? 840 : 870);
          if (qv !== normalized && hadCorrection) usedFuzzy = true;
        } else if (qv.length >= 2 && (nameNorm.includes(qv) || aliasNorms.some((al) => al.includes(qv)))) {
          bestScore = Math.max(bestScore, qv !== normalized && hadCorrection ? 790 : 820);
          if (qv !== normalized && hadCorrection) usedFuzzy = true;
        }
      }
    }

    // 4. Typo-tolerant Damerau-Levenshtein & token coverage fuzzy matching
    if (bestScore < 760) {
      let bestSim = 0;
      for (const qv of variants) {
        const nameSim = Math.max(
          stringSimilarity(qv, nameNorm),
          fuzzyTokenCoverageScore(qv, nameNorm)
        );
        let aliasSim = 0;
        for (const al of aliasNorms) {
          aliasSim = Math.max(aliasSim, stringSimilarity(qv, al), fuzzyTokenCoverageScore(qv, al));
        }
        // Also compare query against individual significant tokens of the university name (e.g. "Massachusets" vs "massachusetts")
        const nameWords = nameNorm.split(' ').filter((w) => w.length >= 4);
        let wordSim = 0;
        for (const nw of nameWords) {
          wordSim = Math.max(wordSim, stringSimilarity(qv, nw));
        }

        bestSim = Math.max(bestSim, nameSim, aliasSim, wordSim);
      }

      if (bestSim >= 0.68) {
        bestScore = Math.round(540 + bestSim * 210);
        usedFuzzy = true;
      }
    }

    // 5. City or Country match
    if (bestScore < 480) {
      for (const qv of variants) {
        if (
          (qv.length >= 3 && (cityNorm === qv || cityNorm.includes(qv))) ||
          (qv.length >= 3 && (countryNorm === qv || countryNorm.includes(qv)))
        ) {
          bestScore = 460;
          break;
        }
      }
    }

    if (bestScore > 0) {
      // Small rank tie-breaker so higher-ranked universities surface first on equal match score
      const rankBoost = Math.max(0, 15 - Math.log2(entry.worldRank + 1) * 2);
      scored.push({
        entry,
        score: bestScore + rankBoost,
        usedFuzzy,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.entry.worldRank - b.entry.worldRank);

  let didYouMean: string | null = null;
  if (scored.length > 0) {
    const top = scored[0];
    const topNameNorm = normalizeSearchText(top.entry.universityName);
    const isDirectOfficialOrAcronym =
      topNameNorm.includes(normalized) ||
      top.entry.shortName.toLowerCase() === normalized ||
      (normalized.length <= 6 &&
        top.entry.aliases.some((a) => a.length <= 6 && normalizeSearchText(a) === normalized));
    const looksLikeTypoOfOfficial =
      topNameNorm
        .split(' ')
        .some((w) => w.length >= 4 && w !== normalized && stringSimilarity(normalized, w) >= 0.72);
    if (!isDirectOfficialOrAcronym && (top.usedFuzzy || hadCorrection || looksLikeTypoOfOfficial)) {
      didYouMean = top.entry.universityName;
    }
  }

  return {
    results: scored.map((s) => s.entry),
    didYouMean,
  };
}
