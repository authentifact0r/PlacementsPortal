/**
 * AI Candidate Matching Service
 * ──────────────────────────────
 * Matches candidates to jobs using skills extraction, fit scoring,
 * and automated shortlisting. Powers the Talent Acquisition Engine.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// SKILLS TAXONOMY & EXTRACTION
// ============================================

const SKILLS_TAXONOMY = {
  tech: [
    'javascript', 'typescript', 'react', 'angular', 'vue', 'node.js', 'python',
    'java', 'c#', '.net', 'sql', 'nosql', 'mongodb', 'postgresql', 'aws',
    'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'rest api',
    'graphql', 'html', 'css', 'tailwind', 'nextjs', 'express', 'django',
    'flask', 'spring boot', 'microservices', 'agile', 'scrum', 'devops',
    'machine learning', 'ai', 'data science', 'pandas', 'tensorflow',
    'pytorch', 'natural language processing', 'computer vision'
  ],
  cybersecurity: [
    'penetration testing', 'vulnerability assessment', 'siem', 'soc',
    'incident response', 'network security', 'firewalls', 'ids/ips',
    'encryption', 'iso 27001', 'nist', 'gdpr', 'compliance', 'risk assessment',
    'security audit', 'ethical hacking', 'malware analysis', 'forensics',
    'cloud security', 'identity management', 'zero trust', 'owasp'
  ],
  engineering: [
    'autocad', 'solidworks', 'matlab', 'simulink', 'cad/cam', 'fea',
    'cfd', 'project management', 'lean manufacturing', 'six sigma',
    'quality assurance', 'bim', 'revit', 'structural analysis',
    'thermodynamics', 'fluid mechanics', 'control systems', 'plc',
    'scada', 'electrical design', 'pcb design', 'embedded systems'
  ],
  business: [
    'financial analysis', 'accounting', 'excel', 'power bi', 'tableau',
    'data analysis', 'business intelligence', 'strategy', 'consulting',
    'project management', 'stakeholder management', 'presentation',
    'communication', 'leadership', 'team management', 'budgeting',
    'forecasting', 'market research', 'crm', 'salesforce', 'sap',
    'supply chain', 'operations management', 'risk management'
  ],
  graduate: [
    'research', 'academic writing', 'critical thinking', 'problem solving',
    'teamwork', 'time management', 'presentation skills', 'data collection',
    'statistical analysis', 'report writing', 'laboratory skills',
    'literature review', 'project planning', 'independent learning'
  ]
};

/**
 * Extract skills from text (CV content, job description, or profile)
 * @param {string} text - Raw text to extract skills from
 * @param {string} industry - Optional industry filter
 * @returns {Object} { skills: string[], categories: Object, score: number }
 */
export const extractSkills = (text, industry = null) => {
  if (!text) return { skills: [], categories: {}, score: 0 };

  const normalised = text.toLowerCase();
  const foundSkills = {};
  const categories = {};

  const taxonomies = industry
    ? { [industry]: SKILLS_TAXONOMY[industry] || [] }
    : SKILLS_TAXONOMY;

  Object.entries(taxonomies).forEach(([category, skillList]) => {
    const matched = skillList.filter(skill => {
      // Check for whole-word match using word boundaries
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(normalised);
    });

    if (matched.length > 0) {
      categories[category] = matched;
      matched.forEach(s => { foundSkills[s] = (foundSkills[s] || 0) + 1; });
    }
  });

  const skills = Object.keys(foundSkills);
  const maxPossible = Object.values(taxonomies).flat().length;
  const score = maxPossible > 0 ? Math.round((skills.length / Math.min(maxPossible, 20)) * 100) : 0;

  return { skills, categories, score: Math.min(score, 100) };
};

// ============================================
// CANDIDATE-JOB MATCHING
// ============================================

/**
 * Calculate match score between a candidate profile and a job
 * @param {Object} candidate - Candidate profile with skills, experience, etc.
 * @param {Object} job - Job listing with requirements, skills, etc.
 * @returns {Object} { score, breakdown, matchedSkills, missingSkills, recommendation }
 */
export const calculateMatchScore = (candidate, job) => {
  const weights = {
    skills: 0.40,
    experience: 0.20,
    education: 0.15,
    location: 0.10,
    salary: 0.10,
    availability: 0.05
  };

  const breakdown = {};

  // 1. Skills match (40%)
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const jobSkills = (job.requiredSkills || job.skills || []).map(s => s.toLowerCase());
  const matchedSkills = candidateSkills.filter(s => jobSkills.includes(s));
  const missingSkills = jobSkills.filter(s => !candidateSkills.includes(s));
  breakdown.skills = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 50; // Neutral if no skills specified

  // 2. Experience match (20%)
  const candExp = candidate.yearsExperience || 0;
  const minExp = job.minimumExperience || 0;
  const maxExp = job.maximumExperience || minExp + 5;
  if (candExp >= minExp && candExp <= maxExp) {
    breakdown.experience = 100;
  } else if (candExp >= minExp) {
    breakdown.experience = 80; // Overqualified slightly
  } else {
    breakdown.experience = Math.max(0, 100 - ((minExp - candExp) * 25));
  }

  // 3. Education match (15%)
  const eduLevels = { 'gcse': 1, 'a-level': 2, 'bachelor': 3, 'master': 4, 'phd': 5 };
  const candEdu = eduLevels[(candidate.educationLevel || '').toLowerCase()] || 0;
  const reqEdu = eduLevels[(job.requiredEducation || '').toLowerCase()] || 0;
  breakdown.education = candEdu >= reqEdu ? 100 : Math.max(0, 100 - ((reqEdu - candEdu) * 30));

  // 4. Location match (10%)
  if (job.remote || job.location?.remote) {
    breakdown.location = 100;
  } else {
    const sameCity = (candidate.location || '').toLowerCase().includes(
      (job.location?.city || job.locationName || '').toLowerCase()
    );
    breakdown.location = sameCity ? 100 : 50;
  }

  // 5. Salary match (10%)
  const candSalary = candidate.expectedSalary || 0;
  const jobMin = job.minimumSalary || 0;
  const jobMax = job.maximumSalary || jobMin * 1.3;
  if (!candSalary || !jobMin) {
    breakdown.salary = 70; // Neutral
  } else if (candSalary >= jobMin && candSalary <= jobMax) {
    breakdown.salary = 100;
  } else if (candSalary < jobMin) {
    breakdown.salary = 90; // Under-asking is fine for employer
  } else {
    breakdown.salary = Math.max(20, 100 - ((candSalary - jobMax) / jobMax) * 100);
  }

  // 6. Availability (5%)
  breakdown.availability = candidate.available ? 100 : 40;

  // Weighted total
  const totalScore = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (breakdown[key] || 0) * weight;
    }, 0)
  );

  // Generate recommendation
  let recommendation = 'Not Suitable';
  if (totalScore >= 85) recommendation = 'Strong Match — Shortlist';
  else if (totalScore >= 70) recommendation = 'Good Match — Review';
  else if (totalScore >= 55) recommendation = 'Possible Match — Consider';
  else if (totalScore >= 40) recommendation = 'Partial Match — Gaps Present';

  return {
    score: totalScore,
    breakdown,
    matchedSkills,
    missingSkills,
    recommendation,
    matchedAt: new Date().toISOString()
  };
};

// ============================================
// BATCH MATCHING (TALENT PIPELINE)
// ============================================

/**
 * Match all candidates against a specific job
 * @param {string} jobId - Job ID to match against
 * @param {Object} jobData - Job details
 * @param {number} maxResults - Maximum candidates to return
 * @returns {Promise<Array>} Sorted array of { candidate, matchResult }
 */
export const matchCandidatesToJob = async (jobId, jobData, maxResults = 50) => {
  try {
    // Fetch all active candidates
    const candidatesQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['student', 'graduate']),
      firestoreLimit(200)
    );
    const snapshot = await getDocs(candidatesQuery);

    const matches = [];
    snapshot.forEach(docSnap => {
      const candidate = { id: docSnap.id, ...docSnap.data() };
      const profile = candidate.profile || {};

      // Build candidate object for matching
      const candidateForMatch = {
        skills: profile.skills || extractSkills(
          `${profile.bio || ''} ${profile.experience || ''} ${profile.education || ''}`.trim()
        ).skills,
        yearsExperience: profile.yearsExperience || 0,
        educationLevel: profile.educationLevel || profile.degree || '',
        location: profile.location || profile.city || '',
        expectedSalary: profile.expectedSalary || 0,
        available: profile.available !== false
      };

      const matchResult = calculateMatchScore(candidateForMatch, jobData);

      if (matchResult.score >= 30) { // Minimum threshold
        matches.push({
          candidate: {
            id: candidate.id,
            name: profile.fullName || profile.name || candidate.email || 'Unknown',
            email: candidate.email,
            avatar: profile.avatar || null,
            headline: profile.headline || profile.title || '',
            location: candidateForMatch.location,
            skills: candidateForMatch.skills.slice(0, 10),
            educationLevel: candidateForMatch.educationLevel
          },
          matchResult
        });
      }
    });

    // Sort by score descending
    matches.sort((a, b) => b.matchResult.score - a.matchResult.score);

    return matches.slice(0, maxResults);
  } catch (error) {
    console.error('Error matching candidates to job:', error);
    throw error;
  }
};

/**
 * Match all jobs against a specific candidate
 * @param {Object} candidateProfile - Candidate profile data
 * @param {number} maxResults - Maximum jobs to return
 * @returns {Promise<Array>} Sorted array of { job, matchResult }
 */
export const matchJobsToCandidate = async (candidateProfile, maxResults = 20) => {
  try {
    const jobsQuery = query(
      collection(db, 'opportunities'),
      where('status', '==', 'active'),
      firestoreLimit(100)
    );
    const snapshot = await getDocs(jobsQuery);

    const matches = [];
    snapshot.forEach(docSnap => {
      const job = { id: docSnap.id, ...docSnap.data() };
      const matchResult = calculateMatchScore(candidateProfile, job);

      if (matchResult.score >= 40) {
        matches.push({ job, matchResult });
      }
    });

    matches.sort((a, b) => b.matchResult.score - a.matchResult.score);
    return matches.slice(0, maxResults);
  } catch (error) {
    console.error('Error matching jobs to candidate:', error);
    throw error;
  }
};

// ============================================
// FIRESTORE: SAVE & RETRIEVE MATCHES
// ============================================

/**
 * Save a match result to Firestore
 */
export const saveMatch = async (jobId, candidateId, matchResult, employerId) => {
  try {
    const matchRef = await addDoc(collection(db, 'talent_matches'), {
      jobId,
      candidateId,
      employerId,
      score: matchResult.score,
      breakdown: matchResult.breakdown,
      recommendation: matchResult.recommendation,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      status: 'new', // new → reviewed → shortlisted → contacted → interview → hired → rejected
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return matchRef.id;
  } catch (error) {
    console.error('Error saving match:', error);
    throw error;
  }
};

/**
 * Get matches for an employer's pipeline
 */
export const getEmployerMatches = async (employerId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'talent_matches'),
      where('employerId', '==', employerId),
      orderBy('score', 'desc')
    );

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.jobId) {
      q = query(q, where('jobId', '==', filters.jobId));
    }
    if (filters.limit) {
      q = query(q, firestoreLimit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting employer matches:', error);
    throw error;
  }
};

/**
 * Update match status (e.g., shortlisted, contacted, interview, hired)
 */
export const updateMatchStatus = async (matchId, status, notes = '') => {
  try {
    await updateDoc(doc(db, 'talent_matches', matchId), {
      status,
      statusNotes: notes,
      [`statusHistory.${status}`]: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating match status:', error);
    throw error;
  }
};

// ============================================
// CV PARSING (TEXT EXTRACTION)
// ============================================

/**
 * Parse CV text and extract structured data
 * @param {string} cvText - Raw CV text content
 * @returns {Object} Structured candidate data
 */
export const parseCVText = (cvText) => {
  if (!cvText) return null;

  const lines = cvText.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract email
  const emailMatch = cvText.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  const email = emailMatch ? emailMatch[0] : null;

  // Extract phone
  const phoneMatch = cvText.match(/(?:\+44|0)\s?\d[\d\s]{8,12}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  // Extract name (usually first non-empty line)
  const name = lines[0] || 'Unknown';

  // Extract LinkedIn
  const linkedinMatch = cvText.match(/linkedin\.com\/in\/[\w-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : null;

  // Extract skills
  const { skills, categories, score: skillScore } = extractSkills(cvText);

  // Detect education level
  let educationLevel = 'unknown';
  const eduText = cvText.toLowerCase();
  if (eduText.includes('phd') || eduText.includes('doctorate')) educationLevel = 'phd';
  else if (eduText.includes('master') || eduText.includes('msc') || eduText.includes('mba')) educationLevel = 'master';
  else if (eduText.includes('bachelor') || eduText.includes('bsc') || eduText.includes('ba ') || eduText.includes('beng')) educationLevel = 'bachelor';
  else if (eduText.includes('a-level') || eduText.includes('a level')) educationLevel = 'a-level';

  // Detect experience years
  const expMatch = cvText.match(/(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|professional)/i);
  const yearsExperience = expMatch ? parseInt(expMatch[1], 10) : 0;

  return {
    name,
    email,
    phone,
    linkedin,
    skills,
    skillCategories: categories,
    skillScore,
    educationLevel,
    yearsExperience,
    rawTextLength: cvText.length,
    parsedAt: new Date().toISOString()
  };
};

export default {
  extractSkills,
  calculateMatchScore,
  matchCandidatesToJob,
  matchJobsToCandidate,
  saveMatch,
  getEmployerMatches,
  updateMatchStatus,
  parseCVText
};
