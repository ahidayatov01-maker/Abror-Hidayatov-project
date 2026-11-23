export interface NavigationStation {
  id: string;
  title: string;
  subtitle: string;
  category: 'START' | 'LEARNING' | 'EXAM' | 'DOCUMENT' | 'UNIVERSITY' | 'SCHOLARSHIP' | 'APPLICATION' | 'INTERVIEW' | 'ARRIVAL';
  status: 'completed' | 'current' | 'upcoming' | 'blocked';
  durationWeeks: number;
  costUsd: number;
  description: string;
  requirements: string[];
  tasks: string[];
  coordinates: { x: number; y: number };
  officialSourceUrl?: string;
  isCustom?: boolean;
}

export interface NavigationRouteOption {
  id: 'direct' | 'transfer' | 'scholarship';
  name: string;
  subtitle: string;
  badge: string;
  estimatedMonths: string;
  estimatedCostUsd: number;
  difficulty: 'Moderate' | 'High' | 'Very High' | 'Competitive';
  successProbability: number;
  scholarshipEligible: boolean;
  description: string;
  risks: string[];
  advantages: string[];
  stations: NavigationStation[];
}

export interface AcademicProfileInput {
  startingPoint: string;
  targetUniversity: string;
  targetCountry: string;
  targetDegree: string;
  major: string;
  scholarshipPreference: string;
  budgetConstraint: 'Low' | 'Moderate' | 'Flexible';
}

export const DEFAULT_ROUTE_OPTIONS: Record<string, NavigationRouteOption[]> = {
  default: [
    {
      id: 'scholarship',
      name: 'ROUTE C — Full Scholarship (MEXT / Global Excellence)',
      subtitle: 'Embassy or University Recommendation scholarship pathway',
      badge: 'Recommended',
      estimatedMonths: '18–24 months',
      estimatedCostUsd: 1200,
      difficulty: 'Competitive',
      successProbability: 82,
      scholarshipEligible: true,
      description: 'Fully funded government or institutional scholarship covering 100% tuition, monthly stipend, and flight tickets.',
      risks: ['Strict age/GPA cutoff', 'Rigorous written exams and interview rounds'],
      advantages: ['Zero tuition debt', 'Full living stipend', 'Prestige global credential'],
      stations: [
        {
          id: 'st-0',
          title: 'Current Educational Base',
          subtitle: 'Starting Point (Uzbekistan / High School or University)',
          category: 'START',
          status: 'completed',
          durationWeeks: 0,
          costUsd: 0,
          description: 'Establish baseline academic transcripts and GPA verification.',
          requirements: ['High school or bachelor transcripts', 'Current GPA record'],
          tasks: ['Verify institutional grading scale', 'Translate academic records'],
          coordinates: { x: 80, y: 150 },
        },
        {
          id: 'st-1',
          title: 'Academic Foundation & Math',
          subtitle: 'Core Skill Enhancement',
          category: 'LEARNING',
          status: 'completed',
          durationWeeks: 12,
          costUsd: 150,
          description: 'Advanced mathematics, calculus, and specialized domain knowledge.',
          requirements: ['Core math proficiency', 'Analytical problem-solving'],
          tasks: ['Complete calculus prep modules', 'Domain textbook study'],
          coordinates: { x: 260, y: 150 },
        },
        {
          id: 'st-2',
          title: 'Language Certification',
          subtitle: 'IELTS / TOEFL & Japanese (if applicable)',
          category: 'EXAM',
          status: 'current',
          durationWeeks: 10,
          costUsd: 320,
          description: 'Achieve required CEFR B2/C1 English score or JLPT N2/N1 for Japanese programs.',
          requirements: ['IELTS Academic overall 6.5+ or TOEFL iBT 90+', 'JLPT certificate (optional)'],
          tasks: ['Book official IELTS exam test date', 'Complete 20 timed mock tests', 'Vocabulary & essay drills'],
          coordinates: { x: 440, y: 150 },
          officialSourceUrl: 'https://www.ielts.org',
        },
        {
          id: 'st-3',
          title: 'Document Dossier & Apostille',
          subtitle: 'Certified Academic Translation',
          category: 'DOCUMENT',
          status: 'upcoming',
          durationWeeks: 6,
          costUsd: 250,
          description: 'Notarized translations, academic certificates, and recommendation letters.',
          requirements: ['Notarized English/Japanese translation', '2-3 academic recommendation letters'],
          tasks: ['Request professor recommendation letters', 'Draft Statement of Purpose (SOP)', 'Apostille transcripts'],
          coordinates: { x: 620, y: 150 },
        },
        {
          id: 'st-4',
          title: 'Scholarship Application (MEXT)',
          subtitle: 'Primary Embassy / University Screening',
          category: 'SCHOLARSHIP',
          status: 'upcoming',
          durationWeeks: 8,
          costUsd: 0,
          description: 'Submit formal scholarship application package to embassy or university.',
          requirements: ['Application form', 'Research plan / Field of Study', 'Medical certificate'],
          tasks: ['Complete MEXT application forms', 'Write detailed research proposal', 'Submit to Embassy of Japan in Tashkent'],
          coordinates: { x: 800, y: 150 },
          officialSourceUrl: 'https://www.uz.emb-japan.go.jp',
        },
        {
          id: 'st-5',
          title: 'Primary Examinations & Interview',
          subtitle: 'Embassy Screening / Screening Exams',
          category: 'INTERVIEW',
          status: 'upcoming',
          durationWeeks: 6,
          costUsd: 100,
          description: 'Written entrance examinations in Mathematics/English followed by formal interview.',
          requirements: ['Passing written exam score', 'Formal interview performance'],
          tasks: ['Review past MEXT examination papers', 'Mock interview practice'],
          coordinates: { x: 980, y: 150 },
        },
        {
          id: 'st-6',
          title: 'Final Destination Enrollment',
          subtitle: 'Kyushu Institute of Technology / Target University',
          category: 'ARRIVAL',
          status: 'upcoming',
          durationWeeks: 4,
          costUsd: 380,
          description: 'Visa issuance, flight booking, campus arrival, and matriculation.',
          requirements: ['Certificate of Eligibility (COE)', 'Student visa stamp', 'Flight ticket'],
          tasks: ['Apply for student visa at embassy', 'Book campus dormitory housing', 'Complete registration'],
          coordinates: { x: 1160, y: 150 },
        },
      ],
    },
    {
      id: 'direct',
      name: 'ROUTE A — Direct International Admission',
      subtitle: 'Self-funded or university-specific merit aid pathway',
      badge: 'Fastest',
      estimatedMonths: '12–15 months',
      estimatedCostUsd: 2500,
      difficulty: 'Moderate',
      successProbability: 88,
      scholarshipEligible: false,
      description: 'Direct application to university undergraduate or graduate admissions portals without government scholarship bottlenecks.',
      risks: ['Self-funded tuition required', 'Dependent on institutional fee waivers'],
      advantages: ['Faster application cycles', 'Broader university choices', 'Direct portal submission'],
      stations: [
        {
          id: 'dir-0',
          title: 'Current Educational Base',
          subtitle: 'Starting Point',
          category: 'START',
          status: 'completed',
          durationWeeks: 0,
          costUsd: 0,
          description: 'Academic background review.',
          requirements: ['Transcripts'],
          tasks: ['Gather transcripts'],
          coordinates: { x: 80, y: 320 },
        },
        {
          id: 'dir-1',
          title: 'Language & Standardized Tests',
          subtitle: 'IELTS / SAT / TOEFL',
          category: 'EXAM',
          status: 'completed',
          durationWeeks: 8,
          costUsd: 350,
          description: 'Achieve minimum test thresholds required by target university.',
          requirements: ['IELTS 6.5+', 'SAT optional or required depending on uni'],
          tasks: ['Take exam', 'Send official scores'],
          coordinates: { x: 380, y: 320 },
        },
        {
          id: 'dir-2',
          title: 'Application Package & Essay',
          subtitle: 'SOP & Transcripts',
          category: 'DOCUMENT',
          status: 'current',
          durationWeeks: 6,
          costUsd: 200,
          description: 'Drafting motivation letters and securing recommendation letters.',
          requirements: ['Statement of Purpose', '2 Recommendations'],
          tasks: ['Draft essays', 'Upload to portal'],
          coordinates: { x: 680, y: 320 },
        },
        {
          id: 'dir-3',
          title: 'University Portal Submission',
          subtitle: 'Direct Admissions Review',
          category: 'APPLICATION',
          status: 'upcoming',
          durationWeeks: 8,
          costUsd: 150,
          description: 'Pay application fee and submit credentials before deadline.',
          requirements: ['Application fee receipt', 'All documents uploaded'],
          tasks: ['Submit application', 'Monitor status portal'],
          coordinates: { x: 960, y: 320 },
        },
        {
          id: 'dir-4',
          title: 'Admission & Enrollment',
          subtitle: 'Visa & Departure',
          category: 'ARRIVAL',
          status: 'upcoming',
          durationWeeks: 4,
          costUsd: 500,
          description: 'Receive acceptance letter, pay tuition deposit, and secure student visa.',
          requirements: ['Letter of Acceptance', 'Tuition deposit'],
          tasks: ['Visa interview', 'Flight booking'],
          coordinates: { x: 1160, y: 320 },
        },
      ],
    },
    {
      id: 'transfer',
      name: 'ROUTE B — Transfer / 2+2 Articulation',
      subtitle: 'Start locally in Uzbekistan, transfer credits internationally',
      badge: 'Cost-Effective',
      estimatedMonths: '24–36 months',
      estimatedCostUsd: 4000,
      difficulty: 'High',
      successProbability: 65,
      scholarshipEligible: true,
      description: 'Complete 2 years at an accredited university in Uzbekistan, then transfer eligible credits to an international partner university.',
      risks: ['Credit transfer evaluation uncertainty', 'Strict GPA maintenance (3.5+)'],
      advantages: ['Lower initial living & tuition costs', 'Built-in local foundation', 'Gradual transition'],
      stations: [
        {
          id: 'tr-0',
          title: 'Local University Enrollment',
          subtitle: 'University in Uzbekistan',
          category: 'START',
          status: 'completed',
          durationWeeks: 0,
          costUsd: 0,
          description: 'Enroll in recognized foundation or bachelor program in Tashkent.',
          requirements: ['University admission', 'High school diploma'],
          tasks: ['Complete Year 1 & Year 2 coursework'],
          coordinates: { x: 80, y: 490 },
        },
        {
          id: 'tr-1',
          title: 'GPA & Credit Accumulation',
          subtitle: 'Maintain 3.5+ GPA & Syllabus Mapping',
          category: 'LEARNING',
          status: 'current',
          durationWeeks: 40,
          costUsd: 2000,
          description: 'Ensure coursework matches target international university syllabus standards.',
          requirements: ['Official course syllabi in English', 'High GPA transcript'],
          tasks: ['Map course credits', 'Request official English syllabus descriptions'],
          coordinates: { x: 440, y: 490 },
        },
        {
          id: 'tr-2',
          title: 'Language & Articulation Review',
          subtitle: 'IELTS + Credit Transfer Assessment',
          category: 'EXAM',
          status: 'upcoming',
          durationWeeks: 12,
          costUsd: 320,
          description: 'Submit transfer application and credit evaluation request to partner university.',
          requirements: ['IELTS 6.5+', 'Evaluated course descriptions'],
          tasks: ['Submit transfer application', 'Await credit equivalence report'],
          coordinates: { x: 800, y: 490 },
        },
        {
          id: 'tr-3',
          title: 'International Campus Transition',
          subtitle: 'Year 3 & 4 Abroad',
          category: 'ARRIVAL',
          status: 'upcoming',
          durationWeeks: 8,
          costUsd: 1200,
          description: 'Transfer approved credits, secure visa, and complete degree abroad.',
          requirements: ['Credit transfer approval letter', 'Student visa'],
          tasks: ['Finalize visa', 'Relocate for final 2 years'],
          coordinates: { x: 1160, y: 490 },
        },
      ],
    },
  ],
};

export function generateCustomAiRoute(input: AcademicProfileInput): NavigationRouteOption {
  const targetName = input.targetUniversity || 'Target International University';
  return {
    id: 'scholarship',
    name: `AI Custom Route: ${input.startingPoint} → ${targetName}`,
    subtitle: `Tailored for ${input.targetDegree} in ${input.major || 'General Studies'} (${input.targetCountry || 'Global'})`,
    badge: 'AI Generated',
    estimatedMonths: '16–22 months',
    estimatedCostUsd: 1450,
    difficulty: 'Competitive',
    successProbability: 85,
    scholarshipEligible: true,
    description: `Personalized navigation roadmap generated by AI based on your background as a ${input.startingPoint} targeting ${targetName}.`,
    risks: ['Deadlines approach quickly', 'Strict document verification standards'],
    advantages: ['Customized milestones', 'Direct alignment with your profile', 'Optimized for success'],
    stations: [
      {
        id: 'cust-0',
        title: input.startingPoint,
        subtitle: 'Current Educational Base',
        category: 'START',
        status: 'completed',
        durationWeeks: 0,
        costUsd: 0,
        description: 'Verified starting point from user profile.',
        requirements: ['Current transcripts'],
        tasks: ['Review baseline records'],
        coordinates: { x: 80, y: 220 },
      },
      {
        id: 'cust-1',
        title: 'Academic & Skill Gap Analysis',
        subtitle: 'Target Prerequisite Alignment',
        category: 'LEARNING',
        status: 'current',
        durationWeeks: 8,
        costUsd: 100,
        description: `Bridge academic requirements for ${input.targetDegree} in ${input.major || 'target field'}.`,
        requirements: ['Prerequisite coursework', 'Portfolio or project work'],
        tasks: ['Complete targeted study modules', 'Build academic portfolio'],
        coordinates: { x: 380, y: 220 },
      },
      {
        id: 'cust-2',
        title: 'Language & Standardized Certification',
        subtitle: 'Required Exam Score (IELTS / TOEFL / GRE)',
        category: 'EXAM',
        status: 'upcoming',
        durationWeeks: 10,
        costUsd: 320,
        description: 'Achieve required admission test scores for the target institution.',
        requirements: ['Official test score report'],
        tasks: ['Take exam', 'Send scores electronically'],
        coordinates: { x: 680, y: 220 },
      },
      {
        id: 'cust-3',
        title: 'Application Dossier & SOP',
        subtitle: 'Statement of Purpose & Letters of Recommendation',
        category: 'DOCUMENT',
        status: 'upcoming',
        durationWeeks: 6,
        costUsd: 200,
        description: 'Prepare compelling essays and authenticated academic documents.',
        requirements: ['SOP', 'LORs', 'Transcripts'],
        tasks: ['Draft and review essays', 'Get professor recommendations'],
        coordinates: { x: 960, y: 220 },
      },
      {
        id: 'cust-4',
        title: targetName,
        subtitle: 'Final Destination & Enrollment',
        category: 'ARRIVAL',
        status: 'upcoming',
        durationWeeks: 4,
        costUsd: 400,
        description: `Submit application to ${targetName}, secure admission, and complete enrollment.`,
        requirements: ['Admission offer letter', 'Student visa'],
        tasks: ['Submit portal application', 'Secure student visa'],
        coordinates: { x: 1160, y: 220 },
      },
    ],
  };
}
