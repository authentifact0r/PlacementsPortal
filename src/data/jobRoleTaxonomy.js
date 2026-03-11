/**
 * JobRoleTaxonomy — Scalable multi-level classification for job roles.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  HIERARCHY:  Industry  ►  Function  ►  Level                        │
 * │                                                                      │
 * │  Each node carries:                                                  │
 * │    • id        — kebab-case unique key                               │
 * │    • label     — human-readable display name                         │
 * │    • aliases   — alternative names / abbreviations for matching      │
 * │    • children  — next level in the taxonomy (optional)               │
 * │                                                                      │
 * │  Usage:                                                              │
 * │    • Job creation form  — cascading dropdowns                        │
 * │    • Autocomplete       — flattenTaxonomy() for search               │
 * │    • JD Matching        — extractIndustry() for CV tailoring         │
 * │    • Analytics          — group applications by industry/function    │
 * └───────────────────────────────────────────────────────────────────────┘
 */

// ── Shared Level Definitions ──────────────────────────────────────────────────
// Reusable across every function so we don't repeat them.
const LEVELS = [
  { id: 'intern',        label: 'Intern / Placement',     aliases: ['internship', 'placement', 'industrial placement', 'year in industry', 'sandwich year'] },
  { id: 'entry',         label: 'Entry Level / Graduate',  aliases: ['graduate', 'junior', 'entry-level', 'grad scheme', 'graduate scheme', 'trainee'] },
  { id: 'mid',           label: 'Mid Level',               aliases: ['mid-level', 'intermediate', 'associate'] },
  { id: 'senior',        label: 'Senior',                  aliases: ['senior', 'sr', 'lead', 'principal'] },
  { id: 'manager',       label: 'Manager / Head',          aliases: ['manager', 'head of', 'director', 'vp', 'vice president'] },
  { id: 'executive',     label: 'Executive / C-Suite',     aliases: ['executive', 'c-suite', 'cto', 'cfo', 'ceo', 'coo', 'chief'] },
];

// ── The Taxonomy ──────────────────────────────────────────────────────────────
const JOB_ROLE_TAXONOMY = [
  {
    id: 'technology',
    label: 'Technology & IT',
    aliases: ['tech', 'it', 'information technology', 'software', 'computing'],
    functions: [
      {
        id: 'software-engineering',
        label: 'Software Engineering',
        aliases: ['software development', 'software developer', 'swe', 'programmer', 'coder', 'full-stack', 'fullstack'],
        levels: LEVELS,
      },
      {
        id: 'frontend-development',
        label: 'Frontend Development',
        aliases: ['front-end', 'frontend', 'ui developer', 'web developer', 'react developer'],
        levels: LEVELS,
      },
      {
        id: 'backend-development',
        label: 'Backend Development',
        aliases: ['back-end', 'backend', 'server-side', 'api developer'],
        levels: LEVELS,
      },
      {
        id: 'mobile-development',
        label: 'Mobile Development',
        aliases: ['ios developer', 'android developer', 'mobile engineer', 'react native', 'flutter developer'],
        levels: LEVELS,
      },
      {
        id: 'devops-sre',
        label: 'DevOps / SRE',
        aliases: ['devops', 'site reliability', 'platform engineer', 'infrastructure', 'cloud engineer'],
        levels: LEVELS,
      },
      {
        id: 'data-engineering',
        label: 'Data Engineering',
        aliases: ['data engineer', 'etl', 'data pipelines', 'big data', 'data infrastructure'],
        levels: LEVELS,
      },
      {
        id: 'data-science',
        label: 'Data Science & ML',
        aliases: ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'deep learning'],
        levels: LEVELS,
      },
      {
        id: 'cybersecurity',
        label: 'Cybersecurity',
        aliases: ['security engineer', 'infosec', 'penetration tester', 'security analyst', 'soc analyst'],
        levels: LEVELS,
      },
      {
        id: 'qa-testing',
        label: 'QA & Testing',
        aliases: ['quality assurance', 'test engineer', 'sdet', 'qa engineer', 'automation tester'],
        levels: LEVELS,
      },
      {
        id: 'product-management',
        label: 'Product Management',
        aliases: ['product manager', 'pm', 'product owner', 'apm'],
        levels: LEVELS,
      },
      {
        id: 'ux-ui-design',
        label: 'UX / UI Design',
        aliases: ['ux designer', 'ui designer', 'product designer', 'ux researcher', 'interaction designer'],
        levels: LEVELS,
      },
      {
        id: 'it-support',
        label: 'IT Support & Admin',
        aliases: ['helpdesk', 'it support', 'system administrator', 'sysadmin', 'network admin', 'it technician'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'finance-banking',
    label: 'Finance & Banking',
    aliases: ['finance', 'banking', 'financial services', 'fintech', 'investment'],
    functions: [
      {
        id: 'investment-banking',
        label: 'Investment Banking',
        aliases: ['ib', 'ibd', 'm&a', 'mergers and acquisitions', 'capital markets'],
        levels: LEVELS,
      },
      {
        id: 'asset-management',
        label: 'Asset Management',
        aliases: ['portfolio management', 'fund management', 'wealth management', 'buy-side'],
        levels: LEVELS,
      },
      {
        id: 'accounting',
        label: 'Accounting & Audit',
        aliases: ['accountant', 'auditor', 'big 4', 'chartered accountant', 'aca', 'acca', 'cpa'],
        levels: LEVELS,
      },
      {
        id: 'financial-analysis',
        label: 'Financial Analysis',
        aliases: ['financial analyst', 'fp&a', 'financial planning', 'business finance'],
        levels: LEVELS,
      },
      {
        id: 'risk-compliance',
        label: 'Risk & Compliance',
        aliases: ['risk analyst', 'compliance officer', 'regulatory', 'grc', 'aml', 'kyc'],
        levels: LEVELS,
      },
      {
        id: 'quantitative-finance',
        label: 'Quantitative Finance',
        aliases: ['quant', 'quantitative analyst', 'quant developer', 'algorithmic trading'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'consulting',
    label: 'Consulting & Professional Services',
    aliases: ['consultancy', 'advisory', 'professional services', 'management consulting'],
    functions: [
      {
        id: 'management-consulting',
        label: 'Management Consulting',
        aliases: ['strategy consulting', 'mbb', 'business consulting', 'strategy analyst'],
        levels: LEVELS,
      },
      {
        id: 'technology-consulting',
        label: 'Technology Consulting',
        aliases: ['it consulting', 'digital consulting', 'transformation'],
        levels: LEVELS,
      },
      {
        id: 'hr-consulting',
        label: 'HR Consulting',
        aliases: ['people consulting', 'organisational consulting', 'talent advisory'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'engineering',
    label: 'Engineering & Manufacturing',
    aliases: ['engineering', 'manufacturing', 'construction', 'industrial'],
    functions: [
      {
        id: 'civil-engineering',
        label: 'Civil Engineering',
        aliases: ['civil engineer', 'structural engineer', 'infrastructure', 'transport engineering'],
        levels: LEVELS,
      },
      {
        id: 'mechanical-engineering',
        label: 'Mechanical Engineering',
        aliases: ['mechanical engineer', 'design engineer', 'cad', 'thermodynamics'],
        levels: LEVELS,
      },
      {
        id: 'electrical-engineering',
        label: 'Electrical & Electronic Engineering',
        aliases: ['electrical engineer', 'electronics engineer', 'embedded systems', 'pcb design'],
        levels: LEVELS,
      },
      {
        id: 'chemical-engineering',
        label: 'Chemical & Process Engineering',
        aliases: ['chemical engineer', 'process engineer', 'pharmaceutical engineering'],
        levels: LEVELS,
      },
      {
        id: 'construction-management',
        label: 'Construction Management',
        aliases: ['site manager', 'quantity surveyor', 'project engineer', 'qs'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare & Life Sciences',
    aliases: ['health', 'medical', 'pharma', 'pharmaceutical', 'biotech', 'life sciences'],
    functions: [
      {
        id: 'clinical-research',
        label: 'Clinical Research',
        aliases: ['clinical trials', 'cra', 'clinical research associate', 'medical researcher'],
        levels: LEVELS,
      },
      {
        id: 'pharmaceutical',
        label: 'Pharmaceutical',
        aliases: ['pharma', 'drug development', 'regulatory affairs', 'medical affairs'],
        levels: LEVELS,
      },
      {
        id: 'biomedical',
        label: 'Biomedical Engineering',
        aliases: ['biomedical', 'medical devices', 'biotech'],
        levels: LEVELS,
      },
      {
        id: 'healthcare-management',
        label: 'Healthcare Management',
        aliases: ['nhs management', 'hospital admin', 'health services'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'marketing-media',
    label: 'Marketing, Media & Creative',
    aliases: ['marketing', 'media', 'advertising', 'creative', 'digital marketing'],
    functions: [
      {
        id: 'digital-marketing',
        label: 'Digital Marketing',
        aliases: ['seo', 'sem', 'ppc', 'social media marketing', 'content marketing', 'growth'],
        levels: LEVELS,
      },
      {
        id: 'brand-marketing',
        label: 'Brand & Product Marketing',
        aliases: ['brand manager', 'product marketing', 'brand strategy'],
        levels: LEVELS,
      },
      {
        id: 'content-creation',
        label: 'Content & Copywriting',
        aliases: ['copywriter', 'content writer', 'content creator', 'technical writer'],
        levels: LEVELS,
      },
      {
        id: 'graphic-design',
        label: 'Graphic Design',
        aliases: ['graphic designer', 'visual designer', 'branding designer', 'creative designer'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'law',
    label: 'Law & Legal',
    aliases: ['legal', 'law firm', 'solicitor', 'barrister', 'attorney'],
    functions: [
      {
        id: 'corporate-law',
        label: 'Corporate / Commercial Law',
        aliases: ['corporate lawyer', 'commercial lawyer', 'transactional law', 'contract law'],
        levels: LEVELS,
      },
      {
        id: 'litigation',
        label: 'Litigation & Disputes',
        aliases: ['litigator', 'dispute resolution', 'civil litigation'],
        levels: LEVELS,
      },
      {
        id: 'legal-tech',
        label: 'Legal Technology',
        aliases: ['legaltech', 'legal ops', 'legal operations'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'sales-business-dev',
    label: 'Sales & Business Development',
    aliases: ['sales', 'bdr', 'sdr', 'business development', 'account management'],
    functions: [
      {
        id: 'sales',
        label: 'Sales',
        aliases: ['account executive', 'ae', 'sales representative', 'sales exec'],
        levels: LEVELS,
      },
      {
        id: 'business-development',
        label: 'Business Development',
        aliases: ['bdr', 'sdr', 'partnerships', 'new business'],
        levels: LEVELS,
      },
      {
        id: 'customer-success',
        label: 'Customer Success',
        aliases: ['csm', 'customer success manager', 'account manager', 'client services'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'hr-people',
    label: 'Human Resources & People',
    aliases: ['hr', 'human resources', 'people operations', 'talent', 'recruitment'],
    functions: [
      {
        id: 'recruitment',
        label: 'Recruitment & Talent Acquisition',
        aliases: ['recruiter', 'talent acquisition', 'hiring', 'sourcer'],
        levels: LEVELS,
      },
      {
        id: 'hr-generalist',
        label: 'HR Generalist / People Partner',
        aliases: ['hr business partner', 'hrbp', 'people partner', 'employee relations'],
        levels: LEVELS,
      },
      {
        id: 'learning-development',
        label: 'Learning & Development',
        aliases: ['l&d', 'training', 'organisational development', 'od'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'education',
    label: 'Education & Research',
    aliases: ['education', 'teaching', 'academia', 'research', 'university'],
    functions: [
      {
        id: 'teaching',
        label: 'Teaching',
        aliases: ['teacher', 'lecturer', 'tutor', 'instructor', 'professor'],
        levels: LEVELS,
      },
      {
        id: 'academic-research',
        label: 'Academic Research',
        aliases: ['researcher', 'phd', 'postdoc', 'research associate', 'research fellow'],
        levels: LEVELS,
      },
      {
        id: 'edtech',
        label: 'EdTech',
        aliases: ['education technology', 'instructional design', 'curriculum design'],
        levels: LEVELS,
      },
    ],
  },
  {
    id: 'supply-chain',
    label: 'Supply Chain & Operations',
    aliases: ['logistics', 'operations', 'supply chain', 'procurement', 'warehouse'],
    functions: [
      {
        id: 'operations-management',
        label: 'Operations Management',
        aliases: ['operations manager', 'ops', 'process improvement', 'lean', 'six sigma'],
        levels: LEVELS,
      },
      {
        id: 'logistics',
        label: 'Logistics & Distribution',
        aliases: ['logistics manager', 'supply chain analyst', 'warehouse manager', 'transport'],
        levels: LEVELS,
      },
      {
        id: 'procurement',
        label: 'Procurement',
        aliases: ['buyer', 'purchasing', 'vendor management', 'strategic sourcing'],
        levels: LEVELS,
      },
    ],
  },
];


// ═════════════════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Flatten the taxonomy into a simple array of { industry, function, level, path } objects.
 * Useful for autocomplete inputs, search indexing, and analytics grouping.
 */
export function flattenTaxonomy(taxonomy = JOB_ROLE_TAXONOMY) {
  const results = [];
  for (const industry of taxonomy) {
    for (const func of industry.functions) {
      for (const level of func.levels) {
        results.push({
          industryId: industry.id,
          industryLabel: industry.label,
          functionId: func.id,
          functionLabel: func.label,
          levelId: level.id,
          levelLabel: level.label,
          // Composite key for forms and Firestore: "technology/software-engineering/intern"
          path: `${industry.id}/${func.id}/${level.id}`,
          // Search-friendly string combining all aliases
          searchText: [
            industry.label, ...industry.aliases,
            func.label, ...func.aliases,
            level.label, ...level.aliases,
          ].join(' ').toLowerCase(),
        });
      }
    }
  }
  return results;
}

/**
 * Get industry options for a cascading dropdown (first level).
 */
export function getIndustries(taxonomy = JOB_ROLE_TAXONOMY) {
  return taxonomy.map(({ id, label, aliases }) => ({ id, label, aliases }));
}

/**
 * Get functions for a given industryId (second level).
 */
export function getFunctions(industryId, taxonomy = JOB_ROLE_TAXONOMY) {
  const industry = taxonomy.find((i) => i.id === industryId);
  if (!industry) return [];
  return industry.functions.map(({ id, label, aliases }) => ({ id, label, aliases }));
}

/**
 * Get levels (always the same shared set, but exposed for API consistency).
 */
export function getLevels() {
  return LEVELS.map(({ id, label, aliases }) => ({ id, label, aliases }));
}

/**
 * Resolve a path string "industry/function/level" to its full labels.
 */
export function resolveRolePath(path, taxonomy = JOB_ROLE_TAXONOMY) {
  if (!path) return null;
  const [industryId, functionId, levelId] = path.split('/');
  const industry = taxonomy.find((i) => i.id === industryId);
  if (!industry) return null;
  const func = industry.functions.find((f) => f.id === functionId);
  const level = LEVELS.find((l) => l.id === levelId);
  return {
    industry: industry?.label || industryId,
    function: func?.label || functionId,
    level: level?.label || levelId,
  };
}

/**
 * Match a free-text job title against the taxonomy using alias matching.
 * Returns the best-fit { industryId, functionId } or null.
 */
export function matchJobTitle(title, taxonomy = JOB_ROLE_TAXONOMY) {
  if (!title) return null;
  const lower = title.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const industry of taxonomy) {
    for (const func of industry.functions) {
      const allAliases = [func.label.toLowerCase(), ...func.aliases.map((a) => a.toLowerCase())];
      for (const alias of allAliases) {
        if (lower.includes(alias) && alias.length > bestScore) {
          bestScore = alias.length;
          bestMatch = {
            industryId: industry.id,
            industryLabel: industry.label,
            functionId: func.id,
            functionLabel: func.label,
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Infer experience level from a title string.
 */
export function inferLevel(title) {
  if (!title) return 'entry';
  const lower = title.toLowerCase();
  for (const level of [...LEVELS].reverse()) { // Check from highest to lowest
    for (const alias of [level.label.toLowerCase(), ...level.aliases.map((a) => a.toLowerCase())]) {
      if (lower.includes(alias)) return level.id;
    }
  }
  return 'entry'; // Default for unrecognised titles
}


export { LEVELS };
export default JOB_ROLE_TAXONOMY;
