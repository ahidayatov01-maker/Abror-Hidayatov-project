import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSLATIONS } from '../../i18n/translations';
import { EXTENDED_UI_STRINGS, getExtendedUIStrings, translateContinentName } from '../../i18n/uiStrings';
import { getCuratedUniversitiesForCountry, WORLDWIDE_REGIONAL_UNIVERSITIES } from '../../data/worldwideUniversityRegistry';
import {
  getDefaultTop15Rankings,
  searchRankingsByPosition,
  searchRankingsByUniversityName,
  RANKING_PROVIDERS,
} from '../../data/globalRankingsCatalog';
import {
  GLOBAL_CITIES_LIVING_CATALOG,
  filterAndRankGlobalCities,
} from '../../data/globalCitiesLivingCatalog';

test('Pillar 1 — Complete 6-Language Localization & Brand Invariance', () => {
  const langs = ['en', 'uz', 'ru', 'ja', 'zh', 'de'] as const;
  for (const lang of langs) {
    const base = TRANSLATIONS[lang];
    assert.ok(base, `Missing TRANSLATIONS for ${lang}`);
    // Brand name must ALWAYS remain "Global University Intelligence" across all 6 languages
    assert.equal(
      base.brandName,
      'Global University Intelligence',
      `Brand name was modified in ${lang}: ${base.brandName}`
    );

    const ext = getExtendedUIStrings(lang);
    assert.ok(ext, `Missing EXTENDED_UI_STRINGS for ${lang}`);
    assert.ok(ext.rankingsPage.top15DefaultBadge.length > 0);
    assert.ok(ext.rankingsPage.modeByName.length > 0);
    assert.ok(ext.rankingsPage.modeByPosition.length > 0);
    assert.ok(ext.financialCityComparison.sectionTitle.length > 0);
    assert.ok(ext.financialCityComparison.accommodationCol.length > 0);
    assert.ok(ext.financialCityComparison.totalMonthlyCol.length > 0);

    // Continent translation helper
    assert.ok(translateContinentName('Asia', lang).length > 0);
    assert.ok(translateContinentName('Europe', lang).length > 0);
    assert.ok(translateContinentName('North America', lang).length > 0);
    assert.ok(translateContinentName('South America', lang).length > 0);
    assert.ok(translateContinentName('Africa', lang).length > 0);
    assert.ok(translateContinentName('Oceania', lang).length > 0);
  }
  assert.equal(Object.keys(EXTENDED_UI_STRINGS).length, 6);
});

test('Pillar 2 & 3 — Worldwide Regional University Discovery Across Multiple Cities', () => {
  assert.ok(WORLDWIDE_REGIONAL_UNIVERSITIES.length >= 110);

  // Check Japan: multiple distinct cities (Tokyo, Kyoto, Osaka, Sendai, Fukuoka, Kitakyushu, Nagoya, Sapporo, Tsukuba)
  const jpUnis = getCuratedUniversitiesForCountry('JP');
  assert.ok(jpUnis.length >= 10, `Expected >=10 universities for Japan, got ${jpUnis.length}`);
  const jpCities = new Set(jpUnis.map((u) => u.cityName));
  assert.ok(jpCities.size >= 7, `Expected >=7 distinct cities in Japan, got ${jpCities.size}`);
  assert.ok(jpCities.has('Kitakyushu'), 'Japan registry must include Kitakyushu (Kyutech)');
  assert.ok(jpCities.has('Kyoto'), 'Japan registry must include Kyoto');
  assert.ok(jpCities.has('Osaka'), 'Japan registry must include Osaka');

  // Check Uzbekistan: multiple distinct cities (Tashkent, Samarkand, Bukhara, Fergana, Nukus)
  const uzUnis = getCuratedUniversitiesForCountry('UZ');
  assert.ok(uzUnis.length >= 8, `Expected >=8 universities for Uzbekistan, got ${uzUnis.length}`);
  const uzCities = new Set(uzUnis.map((u) => u.cityName));
  assert.ok(uzCities.size >= 4, `Expected >=4 distinct cities in Uzbekistan, got ${uzCities.size}`);
  assert.ok(uzCities.has('Samarkand'), 'Uzbekistan registry must include Samarkand');
  assert.ok(uzCities.has('Bukhara'), 'Uzbekistan registry must include Bukhara');

  // Check Russia (non-seeded in original DB): multiple distinct cities (Moscow, Saint Petersburg, Novosibirsk, Tomsk, Kazan, etc.)
  const ruUnis = getCuratedUniversitiesForCountry('RU');
  assert.ok(ruUnis.length >= 8, `Expected >=8 universities for Russia, got ${ruUnis.length}`);
  const ruCities = new Set(ruUnis.map((u) => u.cityName));
  assert.ok(ruCities.size >= 5, `Expected >=5 distinct cities in Russia, got ${ruCities.size}`);

  // Check Germany: multiple distinct cities (Munich, Berlin, Heidelberg, Aachen, Karlsruhe, Freiburg, Tübingen)
  const deUnis = getCuratedUniversitiesForCountry('DE');
  assert.ok(deUnis.length >= 8);
  const deCities = new Set(deUnis.map((u) => u.cityName));
  assert.ok(deCities.size >= 6);
});

test('Pillar 4 — World University Rankings: Top 15 Default Display + Mode A Position & Mode B Name Search', () => {
  for (const provider of RANKING_PROVIDERS) {
    const top15 = getDefaultTop15Rankings(provider);
    assert.equal(
      top15.length,
      15,
      `Default display for ${provider} must have strictly 15 rows, got ${top15.length}`
    );
    // Verify positions are 1..15 in ascending order
    top15.forEach((entry, idx) => {
      assert.equal(entry.worldRank, idx + 1);
      assert.ok(entry.universityName.length > 0);
      assert.ok(entry.countryName.length > 0);
      assert.ok(entry.cityName.length > 0);
      assert.equal(entry.provider, provider);
    });
  }

  // Mode A: Search by Rank Position inside Top 15 (#8 in QS 2025 -> National University of Singapore)
  const pos8 = searchRankingsByPosition('QS World University Rankings', '8');
  assert.equal(pos8.parsedPosition, 8);
  assert.equal(pos8.results.length, 1);
  assert.equal(pos8.results[0].worldRank, 8);
  assert.match(pos8.results[0].universityName, /National University of Singapore/i);

  // Mode A: Search by Rank Position OUTSIDE Top 15 (#28 in QS 2025 -> Technical University of Munich)
  const pos28 = searchRankingsByPosition('QS World University Rankings', '#28');
  assert.equal(pos28.parsedPosition, 28);
  assert.equal(pos28.results.length, 1);
  assert.equal(pos28.results[0].worldRank, 28);
  assert.match(pos28.results[0].universityName, /Technical University of Munich/i);

  // Mode B: Search by University Name with Typo Tolerance ("Massachusets" -> "Massachusetts Institute of Technology" #1)
  const typoMit = searchRankingsByUniversityName('QS World University Rankings', 'Massachusets');
  assert.ok(typoMit.results.length >= 1, 'Typo search "Massachusets" must match MIT');
  assert.equal(typoMit.results[0].worldRank, 1);
  assert.equal(typoMit.results[0].universityName, 'Massachusetts Institute of Technology');
  assert.equal(typoMit.didYouMean, 'Massachusetts Institute of Technology');

  // Mode B: Search by Common Name ("Oxford" -> "University of Oxford" #3 in QS, #1 in THE)
  const oxfordQs = searchRankingsByUniversityName('QS World University Rankings', 'Oxford');
  assert.ok(oxfordQs.results.length >= 1);
  assert.equal(oxfordQs.results[0].universityName, 'University of Oxford');
  assert.equal(oxfordQs.results[0].worldRank, 3);

  const oxfordThe = searchRankingsByUniversityName('Times Higher Education', 'Oxford');
  assert.ok(oxfordThe.results.length >= 1);
  assert.equal(oxfordThe.results[0].universityName, 'University of Oxford');
  assert.equal(oxfordThe.results[0].worldRank, 1);

  // Mode B: Search by University Name OUTSIDE Top 15 ("UTokyo" -> #32 in QS 2025)
  const utokyoQs = searchRankingsByUniversityName('QS World University Rankings', 'UTokyo');
  assert.ok(utokyoQs.results.length >= 1);
  assert.equal(utokyoQs.results[0].universityName, 'The University of Tokyo');
  assert.equal(utokyoQs.results[0].worldRank, 32);
  assert.ok(utokyoQs.results[0].worldRank > 15);
});

test('Pillar 5 — Financial Planner: Global City Discovery & Itemized Monthly Living Cost Comparison', () => {
  assert.ok(
    GLOBAL_CITIES_LIVING_CATALOG.length >= 55,
    `Expected >=55 global cities in catalog, got ${GLOBAL_CITIES_LIVING_CATALOG.length}`
  );

  // Verify every city has accurate itemized monthly sum
  for (const city of GLOBAL_CITIES_LIVING_CATALOG) {
    const sum =
      city.accommodationMonthlyUsd +
      city.foodMonthlyUsd +
      city.transportMonthlyUsd +
      city.utilitiesMonthlyUsd +
      city.internetMonthlyUsd +
      city.otherMonthlyUsd;
    assert.equal(
      city.totalMonthlyUsd,
      sum,
      `Monthly total mismatch for ${city.cityName}: expected ${sum}, got ${city.totalMonthlyUsd}`
    );
  }

  // Verify all 6 inhabited continents are represented
  const continents = ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'] as const;
  for (const cont of continents) {
    const byCont = filterAndRankGlobalCities({ continent: cont });
    assert.ok(byCont.length >= 3, `Expected >=3 cities in ${cont}, got ${byCont.length}`);
  }

  // Verify search by alternative name / transliteration (e.g., "Toshkent" -> Tashkent, "Moskva" -> Moscow, "München" -> Munich)
  const tashkentSearch = filterAndRankGlobalCities({ query: 'Toshkent' });
  assert.ok(tashkentSearch.length >= 1);
  assert.equal(tashkentSearch[0].cityName, 'Tashkent');

  const munichSearch = filterAndRankGlobalCities({ query: 'München' });
  assert.ok(munichSearch.length >= 1);
  assert.equal(munichSearch[0].cityName, 'Munich');

  const kitakyushuSearch = filterAndRankGlobalCities({ query: 'Kitakyushu' });
  assert.ok(kitakyushuSearch.length >= 1);
  assert.equal(kitakyushuSearch[0].cityName, 'Kitakyushu');
});
