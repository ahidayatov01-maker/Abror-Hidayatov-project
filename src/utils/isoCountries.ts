export interface WorldTerritoryMeta {
  isoNumeric: string;
  iso2: string;
  name: string;
  continent: string;
  flagEmoji: string;
}

export function iso2ToFlagEmoji(iso2: string): string {
  const code = iso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(
    0x1f1e6 + (code.charCodeAt(0) - 65),
    0x1f1e6 + (code.charCodeAt(1) - 65)
  );
}

// Tuple format: [isoNumeric, iso2, name, continent]
const WORLD_COUNTRY_TUPLES: ReadonlyArray<readonly [string, string, string, string]> = [
  ['004', 'AF', 'Afghanistan', 'Asia'],
  ['008', 'AL', 'Albania', 'Europe'],
  ['010', 'AQ', 'Antarctica', 'Antarctica'],
  ['012', 'DZ', 'Algeria', 'Africa'],
  ['024', 'AO', 'Angola', 'Africa'],
  ['031', 'AZ', 'Azerbaijan', 'Asia'],
  ['032', 'AR', 'Argentina', 'South America'],
  ['036', 'AU', 'Australia', 'Oceania'],
  ['040', 'AT', 'Austria', 'Europe'],
  ['044', 'BS', 'Bahamas', 'North America'],
  ['050', 'BD', 'Bangladesh', 'Asia'],
  ['051', 'AM', 'Armenia', 'Asia'],
  ['056', 'BE', 'Belgium', 'Europe'],
  ['064', 'BT', 'Bhutan', 'Asia'],
  ['068', 'BO', 'Bolivia', 'South America'],
  ['070', 'BA', 'Bosnia and Herzegovina', 'Europe'],
  ['072', 'BW', 'Botswana', 'Africa'],
  ['076', 'BR', 'Brazil', 'South America'],
  ['084', 'BZ', 'Belize', 'North America'],
  ['090', 'SB', 'Solomon Islands', 'Oceania'],
  ['096', 'BN', 'Brunei', 'Asia'],
  ['100', 'BG', 'Bulgaria', 'Europe'],
  ['104', 'MM', 'Myanmar', 'Asia'],
  ['108', 'BI', 'Burundi', 'Africa'],
  ['112', 'BY', 'Belarus', 'Europe'],
  ['116', 'KH', 'Cambodia', 'Asia'],
  ['120', 'CM', 'Cameroon', 'Africa'],
  ['124', 'CA', 'Canada', 'North America'],
  ['140', 'CF', 'Central African Republic', 'Africa'],
  ['144', 'LK', 'Sri Lanka', 'Asia'],
  ['148', 'TD', 'Chad', 'Africa'],
  ['152', 'CL', 'Chile', 'South America'],
  ['156', 'CN', 'China', 'Asia'],
  ['158', 'TW', 'Taiwan', 'Asia'],
  ['170', 'CO', 'Colombia', 'South America'],
  ['178', 'CG', 'Republic of the Congo', 'Africa'],
  ['180', 'CD', 'DR Congo', 'Africa'],
  ['188', 'CR', 'Costa Rica', 'North America'],
  ['191', 'HR', 'Croatia', 'Europe'],
  ['192', 'CU', 'Cuba', 'North America'],
  ['196', 'CY', 'Cyprus', 'Europe'],
  ['203', 'CZ', 'Czechia', 'Europe'],
  ['204', 'BJ', 'Benin', 'Africa'],
  ['208', 'DK', 'Denmark', 'Europe'],
  ['214', 'DO', 'Dominican Republic', 'North America'],
  ['218', 'EC', 'Ecuador', 'South America'],
  ['222', 'SV', 'El Salvador', 'North America'],
  ['226', 'GQ', 'Equatorial Guinea', 'Africa'],
  ['231', 'ET', 'Ethiopia', 'Africa'],
  ['232', 'ER', 'Eritrea', 'Africa'],
  ['233', 'EE', 'Estonia', 'Europe'],
  ['238', 'FK', 'Falkland Islands', 'South America'],
  ['242', 'FJ', 'Fiji', 'Oceania'],
  ['246', 'FI', 'Finland', 'Europe'],
  ['250', 'FR', 'France', 'Europe'],
  ['260', 'TF', 'French Southern Lands', 'Antarctica'],
  ['262', 'DJ', 'Djibouti', 'Africa'],
  ['266', 'GA', 'Gabon', 'Africa'],
  ['268', 'GE', 'Georgia', 'Asia'],
  ['270', 'GM', 'Gambia', 'Africa'],
  ['275', 'PS', 'Palestine', 'Asia'],
  ['276', 'DE', 'Germany', 'Europe'],
  ['288', 'GH', 'Ghana', 'Africa'],
  ['300', 'GR', 'Greece', 'Europe'],
  ['304', 'GL', 'Greenland', 'North America'],
  ['320', 'GT', 'Guatemala', 'North America'],
  ['324', 'GN', 'Guinea', 'Africa'],
  ['328', 'GY', 'Guyana', 'South America'],
  ['332', 'HT', 'Haiti', 'North America'],
  ['340', 'HN', 'Honduras', 'North America'],
  ['348', 'HU', 'Hungary', 'Europe'],
  ['352', 'IS', 'Iceland', 'Europe'],
  ['356', 'IN', 'India', 'Asia'],
  ['360', 'ID', 'Indonesia', 'Asia'],
  ['364', 'IR', 'Iran', 'Asia'],
  ['368', 'IQ', 'Iraq', 'Asia'],
  ['372', 'IE', 'Ireland', 'Europe'],
  ['376', 'IL', 'Israel', 'Asia'],
  ['380', 'IT', 'Italy', 'Europe'],
  ['384', 'CI', "Côte d'Ivoire", 'Africa'],
  ['388', 'JM', 'Jamaica', 'North America'],
  ['392', 'JP', 'Japan', 'Asia'],
  ['398', 'KZ', 'Kazakhstan', 'Asia'],
  ['400', 'JO', 'Jordan', 'Asia'],
  ['404', 'KE', 'Kenya', 'Africa'],
  ['408', 'KP', 'North Korea', 'Asia'],
  ['410', 'KR', 'South Korea', 'Asia'],
  ['414', 'KW', 'Kuwait', 'Asia'],
  ['417', 'KG', 'Kyrgyzstan', 'Asia'],
  ['418', 'LA', 'Laos', 'Asia'],
  ['422', 'LB', 'Lebanon', 'Asia'],
  ['426', 'LS', 'Lesotho', 'Africa'],
  ['428', 'LV', 'Latvia', 'Europe'],
  ['430', 'LR', 'Liberia', 'Africa'],
  ['434', 'LY', 'Libya', 'Africa'],
  ['440', 'LT', 'Lithuania', 'Europe'],
  ['442', 'LU', 'Luxembourg', 'Europe'],
  ['450', 'MG', 'Madagascar', 'Africa'],
  ['454', 'MW', 'Malawi', 'Africa'],
  ['458', 'MY', 'Malaysia', 'Asia'],
  ['466', 'ML', 'Mali', 'Africa'],
  ['478', 'MR', 'Mauritania', 'Africa'],
  ['484', 'MX', 'Mexico', 'North America'],
  ['496', 'MN', 'Mongolia', 'Asia'],
  ['498', 'MD', 'Moldova', 'Europe'],
  ['499', 'ME', 'Montenegro', 'Europe'],
  ['504', 'MA', 'Morocco', 'Africa'],
  ['508', 'MZ', 'Mozambique', 'Africa'],
  ['512', 'OM', 'Oman', 'Asia'],
  ['516', 'NA', 'Namibia', 'Africa'],
  ['524', 'NP', 'Nepal', 'Asia'],
  ['528', 'NL', 'Netherlands', 'Europe'],
  ['540', 'NC', 'New Caledonia', 'Oceania'],
  ['548', 'VU', 'Vanuatu', 'Oceania'],
  ['554', 'NZ', 'New Zealand', 'Oceania'],
  ['558', 'NI', 'Nicaragua', 'North America'],
  ['562', 'NE', 'Niger', 'Africa'],
  ['566', 'NG', 'Nigeria', 'Africa'],
  ['578', 'NO', 'Norway', 'Europe'],
  ['586', 'PK', 'Pakistan', 'Asia'],
  ['591', 'PA', 'Panama', 'North America'],
  ['598', 'PG', 'Papua New Guinea', 'Oceania'],
  ['600', 'PY', 'Paraguay', 'South America'],
  ['604', 'PE', 'Peru', 'South America'],
  ['608', 'PH', 'Philippines', 'Asia'],
  ['616', 'PL', 'Poland', 'Europe'],
  ['620', 'PT', 'Portugal', 'Europe'],
  ['624', 'GW', 'Guinea-Bissau', 'Africa'],
  ['626', 'TL', 'Timor-Leste', 'Asia'],
  ['630', 'PR', 'Puerto Rico', 'North America'],
  ['634', 'QA', 'Qatar', 'Asia'],
  ['642', 'RO', 'Romania', 'Europe'],
  ['643', 'RU', 'Russia', 'Europe'],
  ['646', 'RW', 'Rwanda', 'Africa'],
  ['682', 'SA', 'Saudi Arabia', 'Asia'],
  ['686', 'SN', 'Senegal', 'Africa'],
  ['688', 'RS', 'Serbia', 'Europe'],
  ['694', 'SL', 'Sierra Leone', 'Africa'],
  ['702', 'SG', 'Singapore', 'Asia'],
  ['703', 'SK', 'Slovakia', 'Europe'],
  ['704', 'VN', 'Vietnam', 'Asia'],
  ['705', 'SI', 'Slovenia', 'Europe'],
  ['706', 'SO', 'Somalia', 'Africa'],
  ['710', 'ZA', 'South Africa', 'Africa'],
  ['716', 'ZW', 'Zimbabwe', 'Africa'],
  ['724', 'ES', 'Spain', 'Europe'],
  ['728', 'SS', 'South Sudan', 'Africa'],
  ['729', 'SD', 'Sudan', 'Africa'],
  ['732', 'EH', 'Western Sahara', 'Africa'],
  ['740', 'SR', 'Suriname', 'South America'],
  ['748', 'SZ', 'Eswatini', 'Africa'],
  ['752', 'SE', 'Sweden', 'Europe'],
  ['756', 'CH', 'Switzerland', 'Europe'],
  ['760', 'SY', 'Syria', 'Asia'],
  ['762', 'TJ', 'Tajikistan', 'Asia'],
  ['764', 'TH', 'Thailand', 'Asia'],
  ['768', 'TG', 'Togo', 'Africa'],
  ['780', 'TT', 'Trinidad and Tobago', 'North America'],
  ['784', 'AE', 'United Arab Emirates', 'Asia'],
  ['788', 'TN', 'Tunisia', 'Africa'],
  ['792', 'TR', 'Turkey', 'Asia'],
  ['795', 'TM', 'Turkmenistan', 'Asia'],
  ['800', 'UG', 'Uganda', 'Africa'],
  ['804', 'UA', 'Ukraine', 'Europe'],
  ['807', 'MK', 'North Macedonia', 'Europe'],
  ['818', 'EG', 'Egypt', 'Africa'],
  ['826', 'GB', 'United Kingdom', 'Europe'],
  ['834', 'TZ', 'Tanzania', 'Africa'],
  ['840', 'US', 'United States', 'North America'],
  ['854', 'BF', 'Burkina Faso', 'Africa'],
  ['858', 'UY', 'Uruguay', 'South America'],
  ['860', 'UZ', 'Uzbekistan', 'Asia'],
  ['862', 'VE', 'Venezuela', 'South America'],
  ['887', 'YE', 'Yemen', 'Asia'],
  ['894', 'ZM', 'Zambia', 'Africa'],
];

const BY_NUMERIC: Record<string, WorldTerritoryMeta> = {};
const BY_ISO2: Record<string, WorldTerritoryMeta> = {};

for (const [isoNumeric, iso2, name, continent] of WORLD_COUNTRY_TUPLES) {
  const meta: WorldTerritoryMeta = {
    isoNumeric,
    iso2,
    name,
    continent,
    flagEmoji: iso2ToFlagEmoji(iso2),
  };
  BY_NUMERIC[isoNumeric] = meta;
  BY_NUMERIC[String(Number(isoNumeric))] = meta;
  BY_ISO2[iso2] = meta;
}

export function resolveTerritoryMeta(
  numericId?: string | number,
  fallbackName?: string
): WorldTerritoryMeta | null {
  if (numericId !== undefined && numericId !== null) {
    const raw = String(numericId);
    const padded = raw.padStart(3, '0');
    if (BY_NUMERIC[padded]) return BY_NUMERIC[padded];
    if (BY_NUMERIC[raw]) return BY_NUMERIC[raw];
  }
  if (fallbackName) {
    const lower = fallbackName.toLowerCase();
    if (lower === 'kosovo') {
      return { isoNumeric: '983', iso2: 'XK', name: 'Kosovo', continent: 'Europe', flagEmoji: '🇽🇰' };
    }
    if (lower.includes('cyprus')) {
      return BY_ISO2.CY;
    }
  }
  return null;
}

export function getTerritoryMetaByIso2(iso2: string): WorldTerritoryMeta | null {
  return BY_ISO2[iso2.trim().toUpperCase()] || null;
}

const ALL_TERRITORIES: WorldTerritoryMeta[] = Object.values(BY_ISO2).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function getAllWorldTerritories(): WorldTerritoryMeta[] {
  return ALL_TERRITORIES;
}

