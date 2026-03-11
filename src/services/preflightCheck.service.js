/**
 * Pre-Flight Check Service — Production-grade JD vs CV matching engine.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE                                                        │
 * │                                                                      │
 * │  1. extractSkills(text)  — curated taxonomy + alias normalisation    │
 * │  2. calculateMatchScore  — weighted overlap with frequency boost     │
 * │  3. findMissingSkills    — top 5 sorted by JD frequency             │
 * │  4. generateOptimizedBullets — Google X-Y-Z formula                 │
 * │  5. runPreFlightCheck    — main orchestrator                        │
 * │  6. getCvFromFirestore   — pulls live CV data for current user      │
 * │                                                                      │
 * │  All processing runs client-side for instant feedback.              │
 * │  For GPT-powered bullet rewriting, call the Cloud Function.         │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// ── Curated Skill Taxonomy ──────────────────────────────────────────────────
// Each entry: [canonical, ...aliases]. Sorted longest-first during matching.
const SKILL_TAXONOMY = [
  // ── Software / Programming Languages ──
  ['python', 'py', 'python3'],
  ['javascript', 'js', 'ecmascript', 'es6', 'es2015'],
  ['typescript', 'ts'],
  ['java', 'jdk', 'jre'],
  ['c#', 'csharp', 'c sharp', '.net', 'dotnet'],
  ['c++', 'cpp', 'c plus plus'],
  ['go', 'golang'],
  ['rust', 'rustlang'],
  ['ruby', 'ruby on rails', 'rails', 'ror'],
  ['php', 'laravel', 'symfony'],
  ['swift', 'swiftui', 'ios development'],
  ['kotlin', 'android development'],
  ['scala'],
  ['r', 'r programming', 'rstudio'],
  ['dart', 'flutter'],
  ['perl'],
  ['lua'],
  ['haskell'],
  ['elixir', 'phoenix'],

  // ── Frontend Frameworks ──
  ['react', 'react.js', 'reactjs', 'react native'],
  ['angular', 'angularjs', 'angular.js'],
  ['vue', 'vue.js', 'vuejs', 'vue 3', 'nuxt', 'nuxt.js'],
  ['next.js', 'nextjs', 'next'],
  ['svelte', 'sveltekit'],
  ['tailwind css', 'tailwindcss', 'tailwind'],
  ['bootstrap', 'bootstrap 5'],
  ['html', 'html5'],
  ['css', 'css3', 'sass', 'scss', 'less'],
  ['webpack', 'vite', 'rollup', 'parcel'],

  // ── Backend / APIs ──
  ['node.js', 'nodejs', 'node'],
  ['express', 'express.js', 'expressjs'],
  ['django', 'django rest framework', 'drf'],
  ['flask'],
  ['fastapi', 'fast api'],
  ['spring boot', 'spring', 'spring framework'],
  ['rest api', 'rest apis', 'restful', 'restful api', 'restful apis'],
  ['graphql', 'apollo graphql', 'apollo'],
  ['grpc'],
  ['websockets', 'socket.io', 'websocket'],
  ['microservices', 'micro services', 'service oriented architecture'],

  // ── Databases ──
  ['sql', 'mysql', 'postgresql', 'postgres', 'mssql', 'sql server', 'mariadb'],
  ['mongodb', 'mongo', 'mongoose'],
  ['redis', 'memcached'],
  ['elasticsearch', 'elastic', 'opensearch'],
  ['dynamodb', 'dynamo db'],
  ['firebase', 'firestore', 'firebase realtime database'],
  ['cassandra', 'apache cassandra'],
  ['neo4j', 'graph database'],
  ['sqlite'],

  // ── Cloud / DevOps ──
  ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
  ['azure', 'microsoft azure', 'azure devops'],
  ['gcp', 'google cloud', 'google cloud platform'],
  ['docker', 'containerisation', 'containerization', 'containers'],
  ['kubernetes', 'k8s', 'eks', 'aks', 'gke'],
  ['terraform', 'iac', 'infrastructure as code', 'pulumi'],
  ['ansible', 'chef', 'puppet'],
  ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci'],
  ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
  ['linux', 'unix', 'bash', 'shell scripting'],
  ['nginx', 'apache', 'load balancing'],
  ['serverless', 'aws lambda', 'cloud functions'],
  ['monitoring', 'prometheus', 'grafana', 'datadog', 'new relic'],

  // ── Data / ML / AI ──
  ['machine learning', 'ml'],
  ['deep learning', 'dl', 'neural networks', 'neural network'],
  ['artificial intelligence', 'ai'],
  ['tensorflow', 'tf', 'keras'],
  ['pytorch', 'torch'],
  ['pandas', 'numpy', 'scipy'],
  ['scikit-learn', 'sklearn'],
  ['nlp', 'natural language processing', 'text mining'],
  ['computer vision', 'cv', 'opencv', 'image recognition'],
  ['data analysis', 'data analytics', 'data analyst'],
  ['data engineering', 'etl', 'data pipelines', 'data warehouse'],
  ['data science', 'data scientist'],
  ['statistics', 'statistical analysis', 'statistical modelling', 'statistical modeling'],
  ['a/b testing', 'ab testing', 'experimentation', 'hypothesis testing'],
  ['big data', 'hadoop', 'spark', 'apache spark'],
  ['tableau', 'power bi', 'powerbi', 'looker', 'data visualisation', 'data visualization'],
  ['excel', 'microsoft excel', 'spreadsheets', 'google sheets'],

  // ── Design / UX ──
  ['figma', 'sketch', 'adobe xd'],
  ['ui design', 'ux design', 'ui/ux', 'user experience', 'user interface'],
  ['adobe creative suite', 'photoshop', 'illustrator', 'indesign'],
  ['prototyping', 'wireframing'],
  ['design thinking'],
  ['accessibility', 'wcag', 'a11y'],

  // ── Project / Product Management ──
  ['agile', 'scrum', 'kanban', 'lean'],
  ['project management', 'pm', 'prince2'],
  ['product management', 'product owner'],
  ['jira', 'confluence', 'trello', 'asana'],
  ['stakeholder management', 'stakeholder engagement'],
  ['business analysis', 'business analyst', 'ba'],
  ['requirements gathering', 'user stories'],

  // ── Soft Skills ──
  ['communication', 'written communication', 'verbal communication'],
  ['leadership', 'team leadership', 'people management'],
  ['problem solving', 'problem-solving', 'analytical thinking'],
  ['teamwork', 'collaboration', 'cross-functional'],
  ['time management', 'prioritisation', 'prioritization'],
  ['presentation skills', 'public speaking'],
  ['negotiation'],
  ['critical thinking'],
  ['adaptability', 'flexibility'],
  ['mentoring', 'coaching'],

  // ── Engineering (Civil, Mechanical, etc.) ──
  ['autocad', 'revit', 'civil 3d', 'solidworks', 'catia'],
  ['matlab', 'simulink'],
  ['structural analysis', 'finite element analysis', 'fea', 'ansys'],
  ['geotechnical', 'ground engineering', 'soil mechanics'],
  ['hydraulic modelling', 'hydraulic modeling', 'hec-ras'],
  ['bim', 'building information modelling', 'building information modeling'],
  ['cdm regulations', 'health and safety', 'h&s'],
  ['quantity surveying', 'cost management', 'cost planning', 'qs'],
  ['procurement', 'contract administration', 'nec contracts'],
  ['cad', 'technical drawing', 'drafting'],
  ['mechanical design', 'thermodynamics', 'fluid mechanics'],
  ['electrical engineering', 'circuit design', 'pcb design'],

  // ── Finance / Accounting ──
  ['financial modelling', 'financial modeling', 'financial analysis'],
  ['accounting', 'bookkeeping', 'cpa'],
  ['sap', 'erp', 'oracle erp'],
  ['bloomberg terminal', 'bloomberg'],
  ['risk management', 'risk assessment', 'enterprise risk'],
  ['audit', 'internal audit', 'external audit'],
  ['budgeting', 'forecasting', 'variance analysis'],
  ['taxation', 'tax compliance', 'corporate tax'],
  ['ifrs', 'gaap', 'financial reporting'],

  // ── Compliance / Security / GRC ──
  ['iso 27001', 'iso27001'],
  ['gdpr', 'data protection', 'data privacy'],
  ['compliance', 'regulatory compliance'],
  ['cybersecurity', 'information security', 'infosec', 'security'],
  ['penetration testing', 'pen testing', 'ethical hacking'],
  ['soc 2', 'soc2'],
  ['pci dss', 'pci compliance'],

  // ── Marketing / Sales ──
  ['seo', 'search engine optimisation', 'search engine optimization'],
  ['sem', 'ppc', 'google ads', 'paid advertising'],
  ['content marketing', 'copywriting', 'content strategy'],
  ['social media marketing', 'social media management'],
  ['email marketing', 'mailchimp', 'hubspot'],
  ['crm', 'salesforce', 'customer relationship management'],
  ['google analytics', 'ga4', 'web analytics'],
  ['digital marketing'],
  ['market research', 'competitive analysis'],
  ['brand management', 'brand strategy'],
];

// Build reverse lookup: alias → canonical
const ALIAS_MAP = new Map();
SKILL_TAXONOMY.forEach(([canonical, ...aliases]) => {
  ALIAS_MAP.set(canonical.toLowerCase(), canonical);
  aliases.forEach((a) => ALIAS_MAP.set(a.toLowerCase(), canonical));
});

// ── Text Normalisation ──────────────────────────────────────────────────────
function normaliseText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^\w\s.#/+\-&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Skill Extraction ────────────────────────────────────────────────────────
function extractSkills(text) {
  const norm = normaliseText(text);
  const found = new Map(); // canonical → frequency count

  // Sort entries longest-first for greedy matching
  const entries = [...ALIAS_MAP.entries()].sort((a, b) => b[0].length - a[0].length);

  for (const [alias, canonical] of entries) {
    if (found.has(canonical)) continue; // Skip if already found via longer alias

    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|\\s|[,;/|.()])${escaped}(?:$|\\s|[,;/|.()])`, 'gi');
    const matches = norm.match(re);

    if (matches && matches.length > 0) {
      found.set(canonical, matches.length);
    }
  }

  return found; // Map<canonical, frequency>
}

// ── Match Score Calculation (frequency-weighted) ────────────────────────────
function calculateMatchScore(jdSkillMap, cvSkillMap) {
  if (jdSkillMap.size === 0) return 100;

  // Weight each JD skill by its frequency in the JD text
  let totalWeight = 0;
  let matchedWeight = 0;

  jdSkillMap.forEach((freq, skill) => {
    const weight = Math.min(freq, 5); // Cap frequency weight at 5
    totalWeight += weight;
    if (cvSkillMap.has(skill)) {
      matchedWeight += weight;
    }
  });

  // Primary: weighted overlap (75%) + bonus for extra relevant CV skills (25%)
  const overlapRatio = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const extraRelevant = [...cvSkillMap.keys()].filter((s) => !jdSkillMap.has(s)).length;
  const bonusRatio = Math.min(extraRelevant / Math.max(jdSkillMap.size, 1), 1);

  const score = Math.round(overlapRatio * 75 + bonusRatio * 25);
  return Math.min(score, 100);
}

// ── Missing Skills (sorted by JD frequency / importance) ────────────────────
function findMissingSkills(jdSkillMap, cvSkillMap) {
  const missing = [];

  jdSkillMap.forEach((freq, skill) => {
    if (!cvSkillMap.has(skill)) {
      missing.push({ skill, freq });
    }
  });

  // Sort by frequency (most-mentioned = most important)
  missing.sort((a, b) => b.freq - a.freq);
  return missing.slice(0, 5).map((s) => s.skill);
}

// ── Google X-Y-Z Bullet Generator ───────────────────────────────────────────
// Format: "Accomplished [X] as measured by [Y], by doing [Z]"
const BULLET_TEMPLATES = [
  (s1, s2) =>
    `Leveraged ${s1} and ${s2} expertise to deliver a critical project milestone, as measured by on-time completion and a 15% reduction in rework cycles, by implementing a structured review process and automating repetitive analysis tasks.`,
  (s1, s2) =>
    `Applied ${s1} proficiency to optimise team workflows involving ${s2}, as measured by a 20% improvement in throughput and positive stakeholder feedback, by redesigning the end-to-end process and introducing standardised documentation.`,
  (s1, s2) =>
    `Drove adoption of ${s1} best practices across the team while integrating ${s2} capabilities, as measured by a 30% reduction in delivery time and zero critical defects, by establishing coding standards and automated quality gates.`,
  (s1, s2) =>
    `Spearheaded a cross-functional initiative combining ${s1} and ${s2}, as measured by achieving all quarterly KPIs and securing stakeholder sign-off ahead of schedule, by proactively identifying risks and coordinating iterative reviews.`,
  (s1, s2) =>
    `Implemented ${s1} solutions to address a gap in ${s2} capabilities, as measured by a 40% improvement in process efficiency and reduced error rates, by conducting a thorough needs analysis and delivering an automated toolchain.`,
  (s1, s2) =>
    `Contributed ${s1} knowledge to a team initiative focused on ${s2}, as measured by successful delivery under budget and a 25% increase in client satisfaction scores, by facilitating workshops and creating reusable templates.`,
];

function generateOptimizedBullets(missingSkills) {
  if (missingSkills.length === 0) {
    return [
      'Accomplished all project deliverables ahead of deadline, as measured by 100% milestone completion, by proactively managing dependencies and applying structured planning.',
      'Improved process efficiency across the team, as measured by a 25% reduction in cycle time, by introducing automation and standardised documentation practices.',
    ];
  }

  const s1 = missingSkills[0];
  const s2 = missingSkills[1] || missingSkills[0];

  // Deterministic selection based on skill names (avoids random flicker on re-render)
  const hash = (s1 + s2).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const idx1 = hash % BULLET_TEMPLATES.length;
  const idx2 = (idx1 + 1) % BULLET_TEMPLATES.length;

  return [
    BULLET_TEMPLATES[idx1](s1, s2),
    BULLET_TEMPLATES[idx2](s2, s1),
  ];
}


// ─── Fetch CV Data from Firestore ───────────────────────────────────────────
/**
 * Pulls the user's latest CV data from Firestore.
 * Falls back to cvSyncData or profileData if ats_cv_data isn't available.
 *
 * @param {string} uid — The current user's UID
 * @returns {object|null} CV data object or null
 */
export async function getCvFromFirestore(uid) {
  if (!uid) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data();

    // Priority 1: Full ATS CV data (structured)
    if (data.atsCvData) {
      return data.atsCvData;
    }

    // Priority 2: Build from cvSyncData + profileData
    const sync = data.cvSyncData || {};
    const profile = data.profileData || {};

    return {
      personal: {
        fullName: data.profile?.fullName || data.profile?.firstName || '',
        title: data.profile?.headline || data.profile?.title || '',
      },
      summary: data.profile?.bio || '',
      experience: [],
      education: (profile.education || []).map((e) => ({
        degree: e.degree || '',
        institution: e.institution || '',
      })),
      skills: sync.skills || (profile.skills || []).map((s) => s.name),
      certifications: [],
    };
  } catch (error) {
    console.error('[preflightCheck] Error fetching CV from Firestore:', error);
    return null;
  }
}


// ─── Main Export: runPreFlightCheck ──────────────────────────────────────────
/**
 * @param {string} jobDescription — raw text of the job description
 * @param {object} cvData — the user's CV data object
 *   Expected: { personal, summary, experience[], education[], skills[], certifications[] }
 * @returns {{
 *   match_score: number,
 *   missing_skills: string[],
 *   optimized_bullets: string[],
 *   jd_skills: string[],
 *   cv_skills: string[],
 *   matched_skills: string[],
 *   skill_gap_count: number,
 *   recommendation: string
 * }}
 */
export function runPreFlightCheck(jobDescription, cvData) {
  if (!jobDescription || !cvData) {
    return {
      match_score: 0,
      missing_skills: [],
      optimized_bullets: [],
      jd_skills: [],
      cv_skills: [],
      matched_skills: [],
      skill_gap_count: 0,
      recommendation: 'Paste a job description and ensure your CV is loaded.',
    };
  }

  // Flatten CV into a single text blob for skill extraction
  const cvTextParts = [
    cvData.personal?.fullName || '',
    cvData.personal?.title || '',
    cvData.summary || '',
    ...(cvData.experience || []).flatMap((exp) => [
      exp.role || exp.title || '',
      exp.company || '',
      ...(exp.bullets || exp.description ? [exp.description] : []),
      ...(exp.bullets || []),
    ]),
    ...(cvData.education || []).flatMap((edu) => [
      edu.degree || '',
      edu.institution || '',
      edu.modules || '',
    ]),
    ...(Array.isArray(cvData.skills) ? cvData.skills : []),
    ...(cvData.certifications || []),
  ];
  const cvText = cvTextParts.join(' ');

  // Extract skills (returns Map<canonical, frequency>)
  const jdSkillMap = extractSkills(jobDescription);
  const cvSkillMap = extractSkills(cvText);

  // Calculate
  const match_score = calculateMatchScore(jdSkillMap, cvSkillMap);
  const missing_skills = findMissingSkills(jdSkillMap, cvSkillMap);
  const optimized_bullets = generateOptimizedBullets(missing_skills);

  // Matched skills = intersection
  const matched_skills = [...jdSkillMap.keys()].filter((s) => cvSkillMap.has(s));

  // Recommendation text
  let recommendation;
  if (match_score >= 75) {
    recommendation = 'Strong match — your CV aligns well with this JD. Fine-tune the missing skills in your bullet points.';
  } else if (match_score >= 50) {
    recommendation = 'Moderate match — consider adding the missing skills to your experience section using the X-Y-Z format below.';
  } else if (match_score >= 25) {
    recommendation = 'Weak match — significant skill gaps exist. Use the suggested bullets to bridge key areas before applying.';
  } else {
    recommendation = 'Low match — this role may require substantial upskilling. Consider roles closer to your current skill set.';
  }

  return {
    match_score,
    missing_skills,
    optimized_bullets,
    jd_skills: [...jdSkillMap.keys()],
    cv_skills: [...cvSkillMap.keys()],
    matched_skills,
    skill_gap_count: missing_skills.length,
    recommendation,
  };
}

// Named exports for testing / advanced usage
export { extractSkills, calculateMatchScore, findMissingSkills, normaliseText };
