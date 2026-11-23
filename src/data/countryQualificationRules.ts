export type EvidenceStatusTag =
  | 'officially_verified'
  | 'institution_specific'
  | 'estimated'
  | 'user_provided'
  | 'requires_confirmation';

export type CareerCertificateRole = 'required' | 'preferred' | 'supplementary';

export interface CountryUniversityTrackRule {
  trackTitle: string;
  instructionLanguage: 'English' | 'Local' | 'Bilingual' | 'Foundation';
  acceptedExams: string[];
  typicalThresholds: string;
  universityTiers: string[];
  prerequisitesNote: string;
  evidenceStatus: EvidenceStatusTag;
  sourceOrg: string;
  sourceUrl: string;
  lastVerifiedAt: string;
}

export interface CountryCareerPathRule {
  sector: string;
  certificateRole: CareerCertificateRole;
  relevantCertificateIds: string[];
  languageExpectations: string;
  educationAndExperience: string;
  licensingNote?: string;
  realisticCaveat: string;
  evidenceStatus: EvidenceStatusTag;
}

export interface CountryScholarshipVisaRule {
  programName: string;
  type: 'Government Scholarship' | 'University Funding' | 'Residence / Visa Framework' | 'Student Work Rule';
  relevantCertificateIds: string[];
  eligibilitySummary: string;
  cautionNote: string;
  evidenceStatus: EvidenceStatusTag;
  sourceUrl: string;
  lastVerifiedAt: string;
}

export interface CountryQualificationProfile {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  systemOverview: string;
  studentWorkAuthorizationNote: string;
  universityTracks: CountryUniversityTrackRule[];
  careerPaths: CountryCareerPathRule[];
  scholarshipsAndVisas: CountryScholarshipVisaRule[];
  certificateMatrixNotes: Record<
    string,
    {
      applicability: string;
      status: EvidenceStatusTag;
      detail: string;
    }
  >;
  officialPortalUrl: string;
  lastVerifiedAt: string;
}

const VERIFIED_DATE = '2026-11-01';

export const COUNTRY_QUALIFICATION_PROFILES: CountryQualificationProfile[] = [
  {
    countryCode: 'JP',
    countryName: 'Japan',
    flagEmoji: '🇯🇵',
    systemOverview:
      'Japan separates Japanese-taught degree tracks (primarily requiring EJU and/or JLPT N2–N1) from English-taught international degree tracks (such as UTokyo PEAK, Kyoto iUP, Waseda, Tohoku, Kyutech, which evaluate IELTS/TOEFL + SAT/IB/A-Levels and do not mandate JLPT for entry).',
    studentWorkAuthorizationNote:
      'Student residence holders may work part-time only after receiving official Permission to Engage in Activity Other Than That Permitted (typically up to 28 hours/week during term and up to 8 hours/day during official long vacations; restricted industries excluded).',
    universityTracks: [
      {
        trackTitle: 'English-Taught International Degree Programs (PEAK, Kyutech, Waseda, Tohoku)',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.5–7.0+)', 'TOEFL iBT (80–100+)', 'SAT / ACT / IB / A-Levels (program-dependent)'],
        typicalThresholds: 'JLPT is NOT mandatory for admission to English-taught degrees. High SAT/IB/A-Level math & science scores strengthen STEM files, but never guarantee admission.',
        universityTiers: ['National Research Universities (UTokyo, Kyoto, Tohoku, Kyutech)', 'Selective Private Universities (Waseda, Keio, Sophia)'],
        prerequisitesNote: '12 years of formal schooling + faculty Math/Physics transcripts + essays/interviews.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'Study in Japan (JASSO)',
        sourceUrl: 'https://www.studyinjapan.go.jp/en/',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        trackTitle: 'Japanese-Taught Undergraduate & Graduate Programs',
        instructionLanguage: 'Local',
        acceptedExams: ['EJU (Japanese + Math/Science)', 'JLPT N2 or N1', 'University entrance exams & TOEIC/TOEFL for STEM English'],
        typicalThresholds: 'National universities commonly evaluate EJU Japanese (often 260–320+/400) or JLPT N2/N1 depending on faculty.',
        universityTiers: ['National Universities', 'Public Municipal Universities', 'Private Universities'],
        prerequisitesNote: 'Requires Japanese academic literacy; many students attend a Japanese language school for 1–2 years if starting below N3.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'JASSO EJU Official Guide',
        sourceUrl: 'https://www.jasso.go.jp/en/ryugaku/eju/',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Software Engineering, Cloud & IT Support',
        certificateRole: 'preferred',
        relevantCertificateIds: ['jlpt', 'ielts-academic', 'toeic', 'aws-saa', 'google-cloud-cert'],
        languageExpectations: 'Global tech teams in Tokyo/Fukuoka hire in English; Japanese enterprises strongly prefer JLPT N2+ alongside coding proficiency.',
        educationAndExperience: 'Bachelor’s degree in CS/Engineering (or qualifying IT experience) + coding portfolio & technical interviews.',
        realisticCaveat: 'JLPT N1/N2 alone does not grant a job or work visa; employers evaluate engineering ability and visa sponsorship eligibility.',
        evidenceStatus: 'institution_specific',
      },
      {
        sector: 'International Business, Global Trading & Technical Translation',
        certificateRole: 'preferred',
        relevantCertificateIds: ['jlpt', 'bjt', 'toeic', 'ielts-academic'],
        languageExpectations: 'JLPT N2–N1 or BJT J2/J1 plus strong English (TOEIC 800+ / IELTS 7.0+).',
        educationAndExperience: 'University degree + cross-cultural business or technical background.',
        realisticCaveat: 'Corporate recruitment evaluates interviews, cultural communication, and degree fit alongside certificates.',
        evidenceStatus: 'estimated',
      },
      {
        sector: 'Research Assistance & Engineering Labs',
        certificateRole: 'supplementary',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt', 'gre', 'ieee-peer-reviewed-research'],
        languageExpectations: 'English is widely used in STEM labs; Japanese assists daily life.',
        educationAndExperience: 'Strong academic record, research proposal, and professor acceptance.',
        realisticCaveat: 'Faculty supervision consent and research fit outweigh standalone test scores.',
        evidenceStatus: 'institution_specific',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'MEXT (Monbukagakusho) Government Scholarship',
        type: 'Government Scholarship',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt', 'jlpt', 'digital-sat'],
        eligibilitySummary: 'Covers tuition, monthly stipend, and airfare via Embassy Recommendation (Uzbekistan) or University Recommendation. Assessed via written exams, transcripts, research plan, and interviews.',
        cautionNote: 'Certificates strengthen candidacy but do not waive official MEXT screening exams unless explicitly stated by the Embassy.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        programName: 'Japan Highly Skilled Professional (HSP) Points Framework',
        type: 'Residence / Visa Framework',
        relevantCertificateIds: ['jlpt', 'bjt'],
        eligibilitySummary: 'ISA awards points across academic degree, career tenure, annual salary, age, research, and Japanese proficiency (JLPT N1 or BJT 480+ may contribute ONLY alongside qualifying salary, employer sponsorship, and degree).',
        cautionNote: 'Never assume automatic visa points without verified salary, age, degree, and employer inputs. Confirm current tables on moj.go.jp/isa.',
        evidenceStatus: 'requires_confirmation',
        sourceUrl: 'https://www.moj.go.jp/isa/publications/materials/newimmiact_3_point_index.html',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'English-taught programs', status: 'institution_specific', detail: 'Widely accepted for English tracks (typically 6.0–7.0).' },
      'toefl-ibt': { applicability: 'Broadly preferred', status: 'officially_verified', detail: 'Accepted by nearly all English-taught and STEM graduate tracks.' },
      jlpt: { applicability: 'Japanese tracks & careers', status: 'officially_verified', detail: 'N2/N1 key for Japanese-taught study and local corporate hiring; optional for English-taught degrees.' },
      'digital-sat': { applicability: 'Selective English undergrad', status: 'institution_specific', detail: 'Used by UTokyo PEAK, Waseda, Keio, and select English programs.' },
      'goethe-zertifikat': { applicability: 'Limited direct relevance', status: 'officially_verified', detail: 'Not used for Japanese admission unless pursuing German studies.' },
      'topik-2': { applicability: 'Limited direct relevance', status: 'officially_verified', detail: 'Not an admission requirement in Japan.' },
      'aws-saa': { applicability: 'Tech career boost', status: 'estimated', detail: 'Valued by Tokyo/Fukuoka cloud & IT employers alongside degree.' },
    },
    officialPortalUrl: 'https://www.studyinjapan.go.jp/en/',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
    flagEmoji: '🇩🇪',
    systemOverview:
      'German public universities generally charge no tuition (semester fee €150–€400; Baden-Württemberg charges €1,500/semester for non-EU students). Direct admission from an Uzbekistan 11-year diploma typically requires 1–2 years of recognized university study, qualifying IB/A-Levels, or Studienkolleg.',
    studentWorkAuthorizationNote:
      'Non-EU students on a German student residence permit (§16b AufenthG) may generally work up to 140 full days or 280 half days per calendar year (verify current §16b rules with Ausländerbehörde).',
    universityTracks: [
      {
        trackTitle: 'German-Taught Public Universities (TU9 & Research Universities)',
        instructionLanguage: 'Local',
        acceptedExams: ['TestDaF (4x4 TDN 4)', 'DSH-2', 'Goethe-Zertifikat C2 (or C1 at participating universities)', 'telc Deutsch C1 Hochschule'],
        typicalThresholds: 'B1–B2 for Studienkolleg entry; C1 (TestDaF 4x4 / DSH-2) for full degree matriculation.',
        universityTiers: ['TU9 Technical Universities (TUM, RWTH, KIT, TU Berlin)', 'Public Research Universities', 'Fachhochschulen'],
        prerequisitesNote: 'Verify exact Uzbekistan diploma equivalence on Anabin / DAAD Admission Database.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'DAAD / Anabin (KMK)',
        sourceUrl: 'https://www.daad.de/en/studying-in-germany/requirements/admission-database/',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        trackTitle: 'English-Taught Bachelor & Master Programs',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.5+)', 'TOEFL iBT (88–95+)', 'GRE (select TUM/RWTH Master tracks)'],
        typicalThresholds: 'Large Master’s catalog in English; fewer public English Bachelor’s tracks.',
        universityTiers: ['Public Research Universities (Master’s)', 'Universities of Applied Sciences'],
        prerequisitesNote: 'Strict undergraduate credit-matching applies to Master’s admissions.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'DAAD International Programmes',
        sourceUrl: 'https://www2.daad.de/deutschland/studienangebote/international-programmes/en/',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Software Development, Automotive & Engineering',
        certificateRole: 'preferred',
        relevantCertificateIds: ['goethe-zertifikat', 'testdaf', 'ielts-academic', 'aws-saa', 'microsoft-azure'],
        languageExpectations: 'English-only tech roles exist in Berlin/Munich; German B2–C1 opens the broader German engineering sector.',
        educationAndExperience: 'Recognized STEM degree (Anabin H+) + Werkstudent/internship track record.',
        realisticCaveat: 'Language certificates do not replace recognized academic credentials or technical interviews.',
        evidenceStatus: 'officially_verified',
      },
      {
        sector: 'Research & Technical Consulting',
        certificateRole: 'supplementary',
        relevantCertificateIds: ['ielts-academic', 'gre', 'goethe-zertifikat', 'ieee-peer-reviewed-research'],
        languageExpectations: 'English works in research institutes; German B2+ preferred in client consulting.',
        educationAndExperience: 'Master’s/PhD degree + project portfolio.',
        realisticCaveat: 'Research publications and project experience carry primary hiring weight.',
        evidenceStatus: 'institution_specific',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'DAAD Scholarships & Deutschlandstipendium',
        type: 'Government Scholarship',
        relevantCertificateIds: ['ielts-academic', 'testdaf', 'goethe-zertifikat'],
        eligibilitySummary: 'DAAD funds graduate and research tracks for eligible Uzbekistan applicants; Deutschlandstipendium provides €300/month merit support.',
        cautionNote: 'Blocked account (Sperrkonto) financial proof is normally required for student visas unless funded by an official scholarship.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.daad.de/en/studying-in-germany/scholarships/',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        programName: 'EU Blue Card & Chancenkarte (Opportunity Card)',
        type: 'Residence / Visa Framework',
        relevantCertificateIds: ['goethe-zertifikat', 'ielts-academic'],
        eligibilitySummary: 'EU Blue Card requires a recognized degree and qualifying job contract above statutory salary thresholds.',
        cautionNote: 'Verify active salary thresholds and criteria on make-it-in-germany.com.',
        evidenceStatus: 'requires_confirmation',
        sourceUrl: 'https://www.make-it-in-germany.com/en/',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'English-taught programs', status: 'officially_verified', detail: 'Standard proof for English Master/Bachelor programs (typically 6.5).' },
      'toefl-ibt': { applicability: 'English-taught programs', status: 'officially_verified', detail: 'Widely accepted alongside IELTS.' },
      jlpt: { applicability: 'Limited direct relevance', status: 'officially_verified', detail: 'Only relevant for Japanese Studies faculties.' },
      'digital-sat': { applicability: 'Limited / indirect', status: 'institution_specific', detail: 'Does not replace Studienkolleg alone; check Anabin/DAAD rules.' },
      'goethe-zertifikat': { applicability: 'High direct relevance', status: 'officially_verified', detail: 'B1/B2 for Studienkolleg; C1/C2 for direct German-taught admission.' },
      'topik-2': { applicability: 'Limited direct relevance', status: 'officially_verified', detail: 'Not required for German universities.' },
      'aws-saa': { applicability: 'Strong IT career signal', status: 'estimated', detail: 'Respected by German cloud & enterprise tech employers.' },
    },
    officialPortalUrl: 'https://www.daad.de/en/',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'KR',
    countryName: 'South Korea',
    flagEmoji: '🇰🇷',
    systemOverview:
      'South Korea combines leading STEM universities (KAIST, POSTECH, SNU, Yonsei, Korea Univ, SKKU) offering both Korean-taught tracks (TOPIK II Level 3–4+) and full English-taught tracks (IELTS/TOEFL). Higher TOPIK levels often unlock institutional tuition waivers.',
    studentWorkAuthorizationNote:
      'D-2 visa holders require international office and immigration approval before part-time work; allowed weekly hours depend on degree level, GPA, and language certification.',
    universityTracks: [
      {
        trackTitle: 'English-Taught STEM & Global Tracks (KAIST, UNIST, Yonsei UIC)',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.5+)', 'TOEFL iBT (80–90+)', 'SAT / ACT / AP / IB (recommended for KAIST/SKY)'],
        typicalThresholds: 'KAIST and several global colleges teach fully in English without mandatory TOPIK for admission.',
        universityTiers: ['National Science Institutes (KAIST, POSTECH, UNIST)', 'SKY Universities', 'Private Research Universities'],
        prerequisitesNote: 'Strong math/science grades and essays/recommendations.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'Study in Korea (NIIED)',
        sourceUrl: 'https://www.studyinkorea.go.kr',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        trackTitle: 'Korean-Taught Undergraduate & Graduate Programs',
        instructionLanguage: 'Local',
        acceptedExams: ['TOPIK II Level 3–4+ (Level 5–6 for top faculties & tuition discounts)'],
        typicalThresholds: 'TOPIK Level 3 is a frequent entry baseline; Level 4+ is commonly required before graduation.',
        universityTiers: ['National Universities', 'Major Private Universities'],
        prerequisitesNote: 'Language institute (D-4) bridge is available for beginners.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'NIIED / Study in Korea',
        sourceUrl: 'https://www.studyinkorea.go.kr',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Software Engineering, Semiconductors & Global Enterprises',
        certificateRole: 'preferred',
        relevantCertificateIds: ['topik-2', 'ielts-academic', 'toeic', 'aws-saa'],
        languageExpectations: 'English suffices in select R&D teams; TOPIK Level 4–6 widens hiring across Korean tech firms.',
        educationAndExperience: 'STEM degree + technical interviews + E-7 visa sponsorship eligibility.',
        realisticCaveat: 'Work visas require employer sponsorship and qualifying salary/degree criteria.',
        evidenceStatus: 'institution_specific',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'Global Korea Scholarship (GKS / KGSP)',
        type: 'Government Scholarship',
        relevantCertificateIds: ['topik-2', 'ielts-academic', 'toefl-ibt'],
        eligibilitySummary: 'Full tuition, Korean language year, monthly stipend, and airfare. TOPIK Level 5–6 or strong English tests add competitive strength (TOPIK 5–6 may exempt the language year).',
        cautionNote: 'Confirm annual GKS Embassy and University guidelines published by NIIED.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.studyinkorea.go.kr/ko/sub/gks/allnew_invite.do',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'English tracks & GKS bonus', status: 'officially_verified', detail: 'Accepted by English-taught programs and valued in GKS.' },
      'toefl-ibt': { applicability: 'English tracks & KAIST', status: 'officially_verified', detail: 'Widely accepted across Korean STEM universities.' },
      jlpt: { applicability: 'Limited direct relevance', status: 'officially_verified', detail: 'Not required for South Korean admissions.' },
      'digital-sat': { applicability: 'Selective English undergrad', status: 'institution_specific', detail: 'Helpful for KAIST, Yonsei UIC, and SNU review.' },
      'goethe-zertifikat': { applicability: 'Limited direct relevance', status: 'officially_verified', detail: 'Not used in Korean admissions.' },
      'topik-2': { applicability: 'Core Korean credential', status: 'officially_verified', detail: 'Level 3–4 for entry; Level 5–6 unlocks tuition discounts & GKS advantages.' },
      'aws-saa': { applicability: 'Tech career boost', status: 'estimated', detail: 'Valued in Seoul/Pangyo cloud engineering hiring.' },
    },
    officialPortalUrl: 'https://www.studyinkorea.go.kr',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    flagEmoji: '🇺🇸',
    systemOverview:
      'US admissions use holistic evaluation: GPA rigor, SAT/ACT (required at select schools like MIT, Caltech, Harvard, Yale, Brown; test-optional at others), English proficiency (TOEFL/IELTS/DET), essays, recommendations, and extracurricular impact.',
    studentWorkAuthorizationNote:
      'F-1 students may work on-campus up to 20 hours/week during term; off-campus employment requires formal CPT or OPT authorization related to the field of study.',
    universityTracks: [
      {
        trackTitle: 'Undergraduate Bachelor Admissions (Holistic)',
        instructionLanguage: 'English',
        acceptedExams: ['TOEFL iBT (90–105+)', 'IELTS Academic (6.5–7.5+)', 'DET (120–135+)', 'Digital SAT (1450–1560+ selective) or ACT (33–35+)'],
        typicalThresholds: 'No single score guarantees admission; SAT/ACT, AP/IB rigor, GPA, and essays are weighed holistically.',
        universityTiers: ['Highly Selective Research Universities', 'Public Flagship Universities', 'Liberal Arts Colleges'],
        prerequisitesNote: 'Strong multi-year high school GPA and financial documentation (I-20) or institutional aid.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'EducationUSA',
        sourceUrl: 'https://educationusa.state.gov',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        trackTitle: 'Graduate Master’s & PhD Programs',
        instructionLanguage: 'English',
        acceptedExams: ['TOEFL iBT / IELTS Academic', 'GRE (department-dependent)', 'GMAT (MBA/Business)'],
        typicalThresholds: 'Research track record, SOP, and faculty alignment carry primary weight.',
        universityTiers: ['R1 Research Universities', 'Business Schools'],
        prerequisitesNote: 'Recognized 4-year Bachelor’s equivalent.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'EducationUSA',
        sourceUrl: 'https://educationusa.state.gov',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Software Engineering, AI, Finance & Consulting',
        certificateRole: 'supplementary',
        relevantCertificateIds: ['aws-saa', 'google-cloud-cert', 'cfa', 'pmp', 'comptia-security-plus'],
        languageExpectations: 'Fluent professional English.',
        educationAndExperience: 'US or recognized international degree + internships + technical/case interviews.',
        licensingNote: 'Medicine (USMLE), CPA, and PE require statutory licensing.',
        realisticCaveat: 'Post-graduation employment depends on OPT/STEM OPT and H-1B or other work-visa sponsorship—never guaranteed by certificates.',
        evidenceStatus: 'officially_verified',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'Institutional Need/Merit Aid & Fulbright Foreign Student Program',
        type: 'University Funding',
        relevantCertificateIds: ['digital-sat', 'toefl-ibt', 'ielts-academic', 'gre'],
        eligibilitySummary: 'Select private universities offer need-based aid; public universities offer merit awards; Fulbright funds graduate study for Uzbekistan citizens.',
        cautionNote: 'Confirm need-blind vs need-aware international aid policies per institution.',
        evidenceStatus: 'institution_specific',
        sourceUrl: 'https://uz.usembassy.gov/education-culture/exchange-programs/',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'Broadly accepted', status: 'officially_verified', detail: 'Accepted by thousands of US universities (6.5–7.5).' },
      'toefl-ibt': { applicability: 'Universal US standard', status: 'officially_verified', detail: 'Accepted across virtually all US institutions.' },
      jlpt: { applicability: 'Minimal direct relevance', status: 'officially_verified', detail: 'Only relevant for Japanese Studies departments.' },
      'digital-sat': { applicability: 'High undergrad impact', status: 'institution_specific', detail: 'Required or strongly advantageous at selective universities and for merit scholarships.' },
      'goethe-zertifikat': { applicability: 'Minimal direct relevance', status: 'officially_verified', detail: 'Only relevant for German studies.' },
      'topik-2': { applicability: 'Minimal direct relevance', status: 'officially_verified', detail: 'Only relevant for Korean studies.' },
      'aws-saa': { applicability: 'Strong career signal', status: 'estimated', detail: 'High demand in US cloud & enterprise engineering.' },
    },
    officialPortalUrl: 'https://educationusa.state.gov',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flagEmoji: '🇬🇧',
    systemOverview:
      'UK universities admit via UCAS (undergrad) and direct portals (postgrad). Applicants with an 11-year Uzbekistan school diploma normally complete a Foundation Year unless holding A-Levels, IB Diploma, or qualifying AP/university credits.',
    studentWorkAuthorizationNote:
      'Student Route visa holders on degree-level courses at qualifying sponsors may typically work up to 20 hours/week during term and full-time during official vacations (verify on gov.uk).',
    universityTracks: [
      {
        trackTitle: 'Direct Undergraduate Entry & International Foundation',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic / IELTS for UKVI (6.0–7.5)', 'A-Levels / IB Diploma', 'AP Exams + SAT (select schools)'],
        typicalThresholds: 'Russell Group universities typically require IELTS 6.5–7.0 and A*AA–ABB A-Level equivalents.',
        universityTiers: ['Oxbridge & Russell Group', 'Modern UK Universities', 'International Foundation Colleges'],
        prerequisitesNote: 'Check whether IELTS for UKVI is required for foundation/pre-sessional visa routes.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'UCAS / Study UK',
        sourceUrl: 'https://study-uk.britishcouncil.org',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Finance, Accounting (ACCA), Software & Consulting',
        certificateRole: 'preferred',
        relevantCertificateIds: ['ielts-academic', 'acca-cpa', 'cfa', 'aws-saa', 'microsoft-azure'],
        languageExpectations: 'Strong professional English.',
        educationAndExperience: 'Degree + graduate scheme assessments.',
        licensingNote: 'Clinical medicine requires PLAB/UKMLA & GMC registration.',
        realisticCaveat: 'Skilled Worker sponsorship depends on licensed employer & statutory salary thresholds (gov.uk).',
        evidenceStatus: 'officially_verified',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'Chevening Scholarships (UK Government)',
        type: 'Government Scholarship',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt'],
        eligibilitySummary: 'Fully funded 1-year Master’s scholarship for graduates with at least 2 years (2,800 hours) of work experience.',
        cautionNote: 'Requires a 2-year home-country return commitment.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.chevening.org',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'Primary UK standard', status: 'officially_verified', detail: 'Universal acceptance; check UKVI requirement for foundation.' },
      'toefl-ibt': { applicability: 'University-dependent', status: 'institution_specific', detail: 'Accepted by most degree sponsors.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Only for East Asian studies.' },
      'digital-sat': { applicability: 'Paired with APs only', status: 'institution_specific', detail: 'Usually accepted only alongside 3–5 AP exams.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Only for German studies.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Only for Korean studies.' },
      'aws-saa': { applicability: 'Strong UK tech signal', status: 'estimated', detail: 'Valued in UK cloud engineering roles.' },
    },
    officialPortalUrl: 'https://study-uk.britishcouncil.org',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    flagEmoji: '🇨🇦',
    systemOverview:
      'Canadian universities assess secondary transcripts, prerequisite STEM courses, and English (IELTS/TOEFL/DET) or French (DELF/TCF for Quebec/bilingual campuses). Co-op programs integrate paid industry terms.',
    studentWorkAuthorizationNote:
      'Study permit holders meeting full-time enrollment criteria have capped off-campus work hours during regular terms (confirm active IRCC cap on canada.ca).',
    universityTracks: [
      {
        trackTitle: 'Canadian Research Universities & Co-op Programs',
        instructionLanguage: 'Bilingual',
        acceptedExams: ['IELTS Academic (6.5, min 6.0)', 'TOEFL iBT (86–100)', 'DET (select universities)', 'DELF B2 / TCF (French tracks)'],
        typicalThresholds: 'High school grades in math/science carry primary weight; SAT usually optional for non-US curricula.',
        universityTiers: ['U15 Research Universities (Toronto, UBC, Waterloo, McGill)', 'Comprehensive Universities'],
        prerequisitesNote: 'Provincial Attestation Letter (PAL) and financial proof required for study permits (IRCC).',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'EduCanada / IRCC',
        sourceUrl: 'https://www.educanada.ca',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Software, Data Engineering, Finance & Project Management',
        certificateRole: 'preferred',
        relevantCertificateIds: ['ielts-academic', 'tcf-tef', 'aws-saa', 'pmp', 'cfa'],
        languageExpectations: 'English fluency; French (TEF/TCF) adds strong bilingual career and immigration advantages.',
        educationAndExperience: 'Degree + co-op or industry experience.',
        realisticCaveat: 'PGWP and PR depend on IRCC eligible program/DLI criteria—always verify on canada.ca.',
        evidenceStatus: 'requires_confirmation',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'University Entrance Scholarships (Lester B. Pearson, UBC ILOT, Vanier)',
        type: 'University Funding',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt'],
        eligibilitySummary: 'Competitive institutional scholarships based on academic distinction, leadership, and school nomination.',
        cautionNote: 'Deadlines often close 9–11 months before enrollment.',
        evidenceStatus: 'institution_specific',
        sourceUrl: 'https://www.educanada.ca/scholarships-bourses/index.aspx?lang=eng',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'Primary academic proof', status: 'officially_verified', detail: 'Standard 6.5 overall across most universities.' },
      'toefl-ibt': { applicability: 'Broadly accepted', status: 'officially_verified', detail: 'Accepted across all major Canadian institutions.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not used for general Canadian admissions.' },
      'digital-sat': { applicability: 'Optional / helpful', status: 'institution_specific', detail: 'Mainly for US-curriculum applicants.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'French (DELF/TCF) is Canada’s second official language.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not used for Canadian admissions.' },
      'aws-saa': { applicability: 'Strong tech signal', status: 'estimated', detail: 'Valued in Toronto/Vancouver/Waterloo tech.' },
    },
    officialPortalUrl: 'https://www.educanada.ca',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    flagEmoji: '🇦🇺',
    systemOverview:
      'Australian universities (Group of Eight: Melbourne, Sydney, UNSW, ANU, UQ) widely accept IELTS Academic, PTE Academic, and TOEFL iBT alongside recognized secondary or foundation credentials.',
    studentWorkAuthorizationNote:
      'Subclass 500 Student visa holders are generally capped at 48 hours per fortnight during study terms and unlimited during scheduled breaks (verify on immi.homeaffairs.gov.au).',
    universityTracks: [
      {
        trackTitle: 'Group of Eight & Australian Public Universities',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.5, min 6.0)', 'PTE Academic (58–65+)', 'TOEFL iBT (79–90+)', 'IB / A-Levels / Foundation'],
        typicalThresholds: 'Foundation year often bridges 11-year secondary diplomas.',
        universityTiers: ['Group of Eight (Go8)', 'Australian Technology Network', 'Regional Public Universities'],
        prerequisitesNote: 'Genuine Student (GS) visa assessment applies.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'Study Australia',
        sourceUrl: 'https://www.studyaustralia.gov.au',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Cloud Engineering, Cybersecurity, Accounting & Healthcare',
        certificateRole: 'preferred',
        relevantCertificateIds: ['ielts-academic', 'pte-academic', 'aws-saa', 'microsoft-azure', 'acca-cpa'],
        languageExpectations: 'IELTS/PTE scores support both admission and skilled migration language bands.',
        educationAndExperience: 'Accredited degree + skills assessment (e.g., ACS for IT).',
        realisticCaveat: 'Skilled migration points depend on occupation lists, age, experience, and nomination—never guaranteed by English scores alone.',
        evidenceStatus: 'requires_confirmation',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'University Merit Waivers & Research Training Program (RTP)',
        type: 'University Funding',
        relevantCertificateIds: ['ielts-academic', 'pte-academic'],
        eligibilitySummary: '15–50% international merit tuition waivers at many universities; RTP funds PhD/Master by Research.',
        cautionNote: 'Confirm country eligibility for government Australia Awards annually.',
        evidenceStatus: 'institution_specific',
        sourceUrl: 'https://www.studyaustralia.gov.au/en/plan-your-studies/scholarships',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'Primary standard', status: 'officially_verified', detail: 'Accepted by all Australian universities and Home Affairs.' },
      'toefl-ibt': { applicability: 'Broadly accepted', status: 'officially_verified', detail: 'Accepted for admission; verify active visa policy.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'digital-sat': { applicability: 'Program-dependent', status: 'institution_specific', detail: 'Accepted for select US-curriculum equivalencies.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'aws-saa': { applicability: 'Strong IT career signal', status: 'estimated', detail: 'Valued in Sydney/Melbourne cloud tech.' },
    },
    officialPortalUrl: 'https://www.studyaustralia.gov.au',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'UZ',
    countryName: 'Uzbekistan',
    flagEmoji: '🇺🇿',
    systemOverview:
      'Uzbekistan recognizes national certificates (CEFR National Multi-Level & Milliy Sertifikat via BMBA/my.gov.uz) and select international exams (IELTS, TOEFL, SAT, Goethe, TOPIK, HSK, JLPT) for state university entrance advantages, international branch campuses (WIUT, INHA, NewUU, Webster), and youth exam-fee reimbursement programs.',
    studentWorkAuthorizationNote:
      'Citizens of Uzbekistan hold unrestricted domestic work rights alongside university study; IT Park residents actively recruit student engineers.',
    universityTracks: [
      {
        trackTitle: 'Uzbekistan State Universities (BMBA / DTM Admission)',
        instructionLanguage: 'Local',
        acceptedExams: ['Milliy Sertifikat (A/A+ = 100% subject score)', 'CEFR National B2+ / IELTS 5.5–6.0+ (foreign language max score; confirm current decree)'],
        typicalThresholds: 'A/A+ on Milliy Sertifikat awards maximum subject points; B2+ language certificates grant foreign-language exemption & satisfy Master’s entry.',
        universityTiers: ['State Universities (NUUz, TUIT, TSUE, UWED)', 'New Uzbekistan University'],
        prerequisitesNote: 'Always verify current annual BMBA decrees on uzbmb.uz.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'BMBA (uzbmb.uz) & my.gov.uz',
        sourceUrl: 'https://uzbmb.uz',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        trackTitle: 'International Branch Campuses in Uzbekistan (WIUT, INHA, NewUU, Webster)',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (5.5–6.5+)', 'Digital SAT (accepted by NewUU & select campuses)'],
        typicalThresholds: 'IELTS 6.0+ and strong math/SAT scores provide direct entry or scholarship consideration.',
        universityTiers: ['International Campuses in Tashkent'],
        prerequisitesNote: 'Check campus-specific entrance math/English exams.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'Institutional Admissions Portals',
        sourceUrl: 'https://my.gov.uz',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'IT Park Software & Cloud Engineering, Banking, & Education',
        certificateRole: 'preferred',
        relevantCertificateIds: ['ielts-academic', 'uz-cefr-multilevel', 'aws-saa', 'aws-cloud-practitioner', 'acca-cpa'],
        languageExpectations: 'English B2–C1 opens export-focused IT Park firms and Big Four/international offices in Tashkent.',
        educationAndExperience: 'Practical portfolio + degree; educators with C1/IELTS 7.0+ may qualify for statutory salary allowances.',
        realisticCaveat: 'Verify current Uzbekistan Youth Affairs Agency exam-fee compensation thresholds and age limits on my.gov.uz.',
        evidenceStatus: 'requires_confirmation',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'El-Yurt Umidi Foundation Scholarship & Youth Exam Reimbursement',
        type: 'Government Scholarship',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt', 'digital-sat', 'gre', 'aws-saa'],
        eligibilitySummary: 'El-Yurt Umidi funds top Uzbek citizens admitted to leading global universities; Youth Affairs Agency reimburses fees for qualifying high scores on approved international exams (verify active list on my.gov.uz).',
        cautionNote: 'Reimbursement rules are subject to active Cabinet decrees—always confirm on my.gov.uz before applying.',
        evidenceStatus: 'requires_confirmation',
        sourceUrl: 'https://eyuf.uz',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'High national & international value', status: 'officially_verified', detail: 'DTM max language score, Master’s entry, international campuses & youth incentives.' },
      'toefl-ibt': { applicability: 'Recognized equivalent', status: 'officially_verified', detail: 'Accepted for Master’s entry and international campuses.' },
      jlpt: { applicability: 'Language specialty & MEXT prep', status: 'institution_specific', detail: 'Recognized in Japanese philology & Japan prep.' },
      'digital-sat': { applicability: 'International campuses & abroad', status: 'institution_specific', detail: 'Accepted at NewUU and select youth programs.' },
      'goethe-zertifikat': { applicability: 'German tracks & state recognition', status: 'officially_verified', detail: 'Recognized for German Master’s/state exemptions.' },
      'topik-2': { applicability: 'Korean tracks & state recognition', status: 'officially_verified', detail: 'Recognized for Korean Master’s/state exemptions.' },
      'aws-saa': { applicability: 'IT Park & youth IT incentives', status: 'requires_confirmation', detail: 'High IT Park value; check active IT cert reimbursement list on my.gov.uz.' },
    },
    officialPortalUrl: 'https://uzbmb.uz',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flagEmoji: '🇦🇪',
    systemOverview:
      'UAE hosts major English-taught research and international branch campuses (NYU Abu Dhabi, Khalifa University, MBZUAI, University of Birmingham Dubai) with competitive AI/STEM fellowships.',
    studentWorkAuthorizationNote:
      'Students in the UAE require formal MOHRE student work authorization and university NOC for part-time work.',
    universityTracks: [
      {
        trackTitle: 'UAE Research Universities & International Branch Campuses',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.0–7.0+)', 'TOEFL iBT (80–100+)', 'SAT / AP / IB (NYUAD & Khalifa)'],
        typicalThresholds: 'MBZUAI and Khalifa University offer strong graduate STEM funding for high-GPA applicants with IELTS 6.5+.',
        universityTiers: ['NYU Abu Dhabi', 'Khalifa University & MBZUAI', 'Dubai International Campuses'],
        prerequisitesNote: 'Diploma attestation may be required for enrollment.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'UAE Ministry of Education',
        sourceUrl: 'https://www.moe.gov.ae/en',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Cloud, FinTech, Audit/Finance & Project Management (Dubai / Abu Dhabi)',
        certificateRole: 'preferred',
        relevantCertificateIds: ['ielts-academic', 'acca-cpa', 'cfa', 'pmp', 'aws-saa'],
        languageExpectations: 'English is the main corporate language; Arabic is a bonus in public/regional sectors.',
        educationAndExperience: 'Attested degree + relevant professional experience.',
        realisticCaveat: 'Work residency requires employer sponsorship or qualifying Golden Visa criteria.',
        evidenceStatus: 'estimated',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'MBZUAI Graduate Fellowships, Khalifa Scholarships & NYUAD Aid',
        type: 'University Funding',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt', 'gre', 'digital-sat'],
        eligibilitySummary: 'Full tuition, housing, and monthly stipend available for admitted graduate fellows at MBZUAI (AI) and Khalifa University.',
        cautionNote: 'Highly competitive; confirm intake requirements directly on university websites.',
        evidenceStatus: 'institution_specific',
        sourceUrl: 'https://mbzuai.ac.ae',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'Primary English proof', status: 'officially_verified', detail: 'Widely accepted (6.0–7.0).' },
      'toefl-ibt': { applicability: 'Broadly accepted', status: 'officially_verified', detail: 'Accepted at NYUAD, Khalifa, and MBZUAI.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Niche only.' },
      'digital-sat': { applicability: 'Selective undergrad', status: 'institution_specific', detail: 'Helpful for NYUAD & Khalifa.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'aws-saa': { applicability: 'High Dubai tech demand', status: 'estimated', detail: 'Strong cloud & enterprise demand in UAE.' },
    },
    officialPortalUrl: 'https://www.moe.gov.ae/en',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    flagEmoji: '🇫🇷',
    systemOverview:
      'France offers public universities (via Campus France), elite Grandes Écoles (Polytechnique, HEC, Sciences Po), and 1,600+ English-taught programs alongside French-taught degrees requiring DELF B2 / DALF C1.',
    studentWorkAuthorizationNote:
      'Long-stay student visa holders (VLS-TS) are generally authorized to work up to 964 hours/year.',
    universityTracks: [
      {
        trackTitle: 'French-Taught Public Universities & Grandes Écoles',
        instructionLanguage: 'Local',
        acceptedExams: ['DELF B2 / DALF C1', 'TCF-DAP'],
        typicalThresholds: 'DELF B2 standard for Licence; DALF C1 for selective Master’s.',
        universityTiers: ['Public Universities', 'Grandes Écoles'],
        prerequisitesNote: 'Apply via Campus France procedure where applicable.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'Campus France',
        sourceUrl: 'https://www.campusfrance.org/en',
        lastVerifiedAt: VERIFIED_DATE,
      },
      {
        trackTitle: 'English-Taught Programs (Engineering, AI, Business)',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.5+)', 'TOEFL iBT (90+)', 'GMAT (top business schools)'],
        typicalThresholds: 'DELF is not mandatory for English-taught admission.',
        universityTiers: ['Grandes Écoles', 'International Master’s Tracks'],
        prerequisitesNote: 'Check differentiated non-EU tuition rules per public institution.',
        evidenceStatus: 'institution_specific',
        sourceOrg: 'Campus France',
        sourceUrl: 'https://www.campusfrance.org/en',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Engineering, AI Research, Business & Finance',
        certificateRole: 'preferred',
        relevantCertificateIds: ['delf-dalf', 'ielts-academic', 'gmat', 'aws-saa'],
        languageExpectations: 'French B2+ unlocks wider French hiring; Paris AI/tech teams also hire in English.',
        educationAndExperience: 'Master’s/Grande École diploma + mandatory internship (stage).',
        realisticCaveat: 'Post-study work permit (RECE) requires completing an eligible Master’s or equivalent degree.',
        evidenceStatus: 'officially_verified',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'France Excellence Eiffel Scholarship & CAF Housing Aid',
        type: 'Government Scholarship',
        relevantCertificateIds: ['delf-dalf', 'ielts-academic'],
        eligibilitySummary: 'Eiffel funds top international Master’s and PhD students nominated by French host universities.',
        cautionNote: 'Host French university submits the Eiffel nomination on the student’s behalf.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.campusfrance.org/en/france-excellence-eiffel-scholarship-program',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'English-taught tracks', status: 'officially_verified', detail: 'Accepted for 1,600+ English programs.' },
      'toefl-ibt': { applicability: 'English-taught tracks', status: 'officially_verified', detail: 'Widely accepted.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'digital-sat': { applicability: 'Select tracks only', status: 'institution_specific', detail: 'Only select English undergrad programs.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Only Franco-German joint degrees.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'aws-saa': { applicability: 'Tech career boost', status: 'estimated', detail: 'Useful in Paris tech sector.' },
    },
    officialPortalUrl: 'https://www.campusfrance.org/en',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'IT',
    countryName: 'Italy',
    flagEmoji: '🇮🇹',
    systemOverview:
      'Italy combines affordable public tuition, regional DSU need-based scholarships, and respected engineering/economics universities (PoliMi, PoliTo, Sapienza, Bologna, Bocconi). Applicants with 11-year schooling need 1 year of university or a Foundation Year to satisfy the 12-year rule.',
    studentWorkAuthorizationNote:
      'Non-EU students with a valid Italian study residence permit may work up to 20 hours/week (max 1,040 hours/year).',
    universityTracks: [
      {
        trackTitle: 'English-Taught Engineering & Economics Programs',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.0+)', 'TOEFL iBT (78–88+)', 'SAT / TOLC-I / TIL-I (program-dependent)'],
        typicalThresholds: 'Politecnico di Torino and Bocconi accept competitive SAT scores in place of local entrance exams (verify annual cutoffs).',
        universityTiers: ['Polytechnics (PoliMi, PoliTo)', 'Historic Public Universities (Bologna, Sapienza)', 'Bocconi University'],
        prerequisitesNote: 'Strict 12-year prior schooling rule + Universitaly pre-enrollment.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'Study in Italy (MAECI)',
        sourceUrl: 'https://studyinitaly.esteri.it',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Industrial Design, Engineering, Architecture & Tech',
        certificateRole: 'preferred',
        relevantCertificateIds: ['cils-celi', 'ielts-academic', 'aws-saa'],
        languageExpectations: 'Italian B2+ greatly improves placement outside Milan multinationals.',
        educationAndExperience: 'Laurea / Laurea Magistrale + portfolio/internships.',
        realisticCaveat: 'Study-to-work permit conversion requires a qualifying job contract under Italian immigration rules.',
        evidenceStatus: 'requires_confirmation',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'Regional DSU Scholarships & MAECI Grants',
        type: 'Government Scholarship',
        relevantCertificateIds: ['ielts-academic', 'cils-celi'],
        eligibilitySummary: 'Regional DSU scholarships cover tuition, meals/housing, and stipends based on verified family income (ISEE Parificato) and credit progress.',
        cautionNote: 'Requires timely apostilled and translated family income documents.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://studyinitaly.esteri.it',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'English-taught programs', status: 'officially_verified', detail: 'B2 (5.5–6.5) standard for English degrees.' },
      'toefl-ibt': { applicability: 'English-taught programs', status: 'officially_verified', detail: 'Widely accepted.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'digital-sat': { applicability: 'High value at PoliTo/Bocconi', status: 'institution_specific', detail: 'Can satisfy entrance test requirements at select universities.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'South Tyrol tracks only.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'aws-saa': { applicability: 'Milan tech career boost', status: 'estimated', detail: 'Useful in northern Italy enterprise IT.' },
    },
    officialPortalUrl: 'https://studyinitaly.esteri.it',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'CN',
    countryName: 'China',
    flagEmoji: '🇨🇳',
    systemOverview:
      'China’s C9 League (Tsinghua, Peking, Fudan, SJTU, Zhejiang) and national universities offer Chinese-taught tracks (HSK 4–5+) and growing English-taught STEM/business tracks (IELTS/TOEFL), supported by CSC scholarships.',
    studentWorkAuthorizationNote:
      'Part-time work or internships require written host university approval and exit-entry bureau endorsement on the residence permit.',
    universityTracks: [
      {
        trackTitle: 'Chinese-Taught & English-Taught University Tracks',
        instructionLanguage: 'Bilingual',
        acceptedExams: ['HSK 4–5+ (Chinese-taught)', 'IELTS 6.0–6.5+ / TOEFL 80–90+ (English-taught)'],
        typicalThresholds: 'Tsinghua/Peking Chinese tracks typically expect HSK 5+; English tracks accept IELTS/TOEFL without HSK.',
        universityTiers: ['C9 League Universities', 'Double First-Class National Universities'],
        prerequisitesNote: 'Medical exam and clean criminal record required for X1 visa.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'Campus China (CSC)',
        sourceUrl: 'https://www.campuschina.org',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Sino-Central Asia Trade, Hardware/AI Engineering & Logistics',
        certificateRole: 'preferred',
        relevantCertificateIds: ['hsk', 'bct', 'ielts-academic'],
        languageExpectations: 'HSK 5–6 paired with English/Uzbek/Russian is prized in cross-border engineering and trade.',
        educationAndExperience: 'Degree + work experience (Z-visa rules generally expect 2 years post-grad experience, with exceptions for top Master’s graduates).',
        realisticCaveat: 'Work permit eligibility depends on municipal Foreign Expert Bureau rules.',
        evidenceStatus: 'requires_confirmation',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'Chinese Government Scholarship (CSC)',
        type: 'Government Scholarship',
        relevantCertificateIds: ['hsk', 'ielts-academic', 'toefl-ibt'],
        eligibilitySummary: 'Full tuition, dormitory, insurance, and monthly stipend via Embassy or University Type B tracks.',
        cautionNote: 'Deadlines usually run January–April; confirm active CSC catalog.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.campuschina.org',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'English-taught programs', status: 'officially_verified', detail: 'Standard proof for English tracks.' },
      'toefl-ibt': { applicability: 'English-taught programs', status: 'officially_verified', detail: 'Widely accepted.' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'digital-sat': { applicability: 'Supporting rigor', status: 'institution_specific', detail: 'Helpful at Tsinghua/NYU Shanghai.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'aws-saa': { applicability: 'Global tech signal', status: 'estimated', detail: 'Recognized at multinationals.' },
    },
    officialPortalUrl: 'https://www.campuschina.org',
    lastVerifiedAt: VERIFIED_DATE,
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    flagEmoji: '🇸🇬',
    systemOverview:
      'Singapore’s autonomous universities (NUS, NTU, SMU) are among Asia’s highest-ranked English-taught institutions, demanding top academic credentials (A-Levels, IB 40+, SAT + APs, olympiads) plus IELTS/TOEFL.',
    studentWorkAuthorizationNote:
      'Full-time international students at approved institutions (NUS, NTU, SMU) may generally work up to 16 hours/week during term and full-time during vacations under MOM rules.',
    universityTracks: [
      {
        trackTitle: 'Autonomous Research Universities (NUS, NTU, SMU)',
        instructionLanguage: 'English',
        acceptedExams: ['IELTS Academic (6.5–7.0+)', 'TOEFL iBT (92–100+)', 'IB Diploma / A-Levels / SAT + APs'],
        typicalThresholds: 'Highly competitive academic cutoffs; olympiad medals and top math/science scores stand out.',
        universityTiers: ['NUS', 'NTU', 'SMU'],
        prerequisitesNote: 'Optional MOE Tuition Grant reduces fees in exchange for a 3-year work bond in a Singapore entity.',
        evidenceStatus: 'officially_verified',
        sourceOrg: 'MOE Singapore / NUS Admissions',
        sourceUrl: 'https://www.moe.gov.sg/higher-education',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    careerPaths: [
      {
        sector: 'Software/AI, Quantitative Finance & APAC Tech Hubs',
        certificateRole: 'preferred',
        relevantCertificateIds: ['ielts-academic', 'aws-saa', 'google-cloud-cert', 'cfa'],
        languageExpectations: 'Fluent business English essential; Mandarin is an advantage.',
        educationAndExperience: 'Strong degree + internships; Employment Pass evaluated under MOM COMPASS.',
        realisticCaveat: 'Employment Pass requires employer sponsorship, qualifying salary floor, and COMPASS score.',
        evidenceStatus: 'requires_confirmation',
      },
    ],
    scholarshipsAndVisas: [
      {
        programName: 'SINGA (Singapore International Graduate Award) & MOE Tuition Grant',
        type: 'Government Scholarship',
        relevantCertificateIds: ['ielts-academic', 'toefl-ibt', 'gre'],
        eligibilitySummary: 'SINGA provides bond-free full PhD funding (tuition, monthly stipend, airfare) in STEM across NUS, NTU, and A*STAR.',
        cautionNote: 'Confirm active deadlines directly on a-star.edu.sg.',
        evidenceStatus: 'officially_verified',
        sourceUrl: 'https://www.a-star.edu.sg/Scholarships/for-graduate-studies/singapore-international-graduate-award-singa',
        lastVerifiedAt: VERIFIED_DATE,
      },
    ],
    certificateMatrixNotes: {
      'ielts-academic': { applicability: 'Primary English proof', status: 'officially_verified', detail: 'Required (typically 6.5+).' },
      'toefl-ibt': { applicability: 'Primary English proof', status: 'officially_verified', detail: 'Required (typically 90–93+).' },
      jlpt: { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'digital-sat': { applicability: 'With APs / strong academics', status: 'institution_specific', detail: 'Often paired with AP exams.' },
      'goethe-zertifikat': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'topik-2': { applicability: 'Limited relevance', status: 'officially_verified', detail: 'Not required.' },
      'aws-saa': { applicability: 'Strong APAC tech value', status: 'estimated', detail: 'High demand in Singapore cloud & fintech.' },
    },
    officialPortalUrl: 'https://www.moe.gov.sg/higher-education',
    lastVerifiedAt: VERIFIED_DATE,
  },
];

export function getCountryQualificationProfile(
  countryCode: string
): CountryQualificationProfile | null {
  const code = countryCode.trim().toUpperCase();
  return COUNTRY_QUALIFICATION_PROFILES.find((p) => p.countryCode === code) || null;
}
