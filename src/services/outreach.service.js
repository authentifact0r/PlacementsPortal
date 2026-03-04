/**
 * Outreach Automation Service
 * ───────────────────────────
 * Manages employer outreach, candidate communication sequences,
 * and follow-up automation for the Talent Acquisition Engine.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// OUTREACH TEMPLATES
// ============================================

/**
 * Pre-built outreach templates for different scenarios
 */
export const OUTREACH_TEMPLATES = {
  // ── Employer outreach (cold) ──
  employer_intro: {
    id: 'employer_intro',
    name: 'Employer Introduction',
    type: 'employer',
    subject: 'Qualified {industry} Candidates Ready for {company}',
    body: `Hi {contactName},

I noticed {company} is actively hiring for {roleType} roles and wanted to introduce our AI-powered talent pipeline.

We've pre-screened {candidateCount} candidates who match your requirements, each scored on skills, experience, and cultural fit.

Here's what we can offer:
• Pre-screened, qualified candidates delivered to your inbox
• AI-matched profiles with fit scores and skills breakdowns
• Zero upfront cost — you only pay when you hire

Would you be open to a quick 10-minute call this week to see how we can fill your {roleType} pipeline?

Best regards,
{senderName}
PlacementsPortal Talent Engine`,
    variables: ['contactName', 'company', 'roleType', 'industry', 'candidateCount', 'senderName']
  },

  employer_followup_1: {
    id: 'employer_followup_1',
    name: 'Employer Follow-up (Day 3)',
    type: 'employer',
    subject: 'Re: {industry} Candidates for {company}',
    body: `Hi {contactName},

Just following up on my previous message about our pre-screened {roleType} candidates.

Since I last wrote, we've added {newCandidateCount} more qualified profiles to our pipeline. One standout candidate has {highlightSkill} experience and is available immediately.

I'd love to share a shortlist — no commitment required. Would a brief call work for you?

Best,
{senderName}`,
    variables: ['contactName', 'company', 'roleType', 'industry', 'newCandidateCount', 'highlightSkill', 'senderName']
  },

  employer_followup_2: {
    id: 'employer_followup_2',
    name: 'Employer Follow-up (Day 7)',
    type: 'employer',
    subject: 'Last check-in: {roleType} Pipeline for {company}',
    body: `Hi {contactName},

I understand you're busy, so I'll keep this brief.

We've built a talent pipeline specifically for {industry} roles like the ones at {company}. Our AI matching ensures you only see candidates who genuinely fit.

If now isn't the right time, no worries at all. But if you'd like to explore this when you're next hiring, just reply and I'll set up a free pipeline for you.

All the best,
{senderName}`,
    variables: ['contactName', 'company', 'roleType', 'industry', 'senderName']
  },

  // ── Candidate outreach ──
  candidate_opportunity: {
    id: 'candidate_opportunity',
    name: 'Candidate - Job Opportunity',
    type: 'candidate',
    subject: '{roleTitle} at {company} — {matchScore}% Match',
    body: `Hi {candidateName},

Great news — we've found a {roleTitle} opportunity at {company} that's a {matchScore}% match with your profile.

Here's why we think it's a fit:
• Skills matched: {matchedSkills}
• Location: {location}
• Salary range: {salaryRange}

{company} is looking to move quickly on this. Would you like us to put your profile forward?

Just reply "Yes" and we'll handle the rest, or view the full details on your dashboard.

Best,
PlacementsPortal Talent Engine`,
    variables: ['candidateName', 'roleTitle', 'company', 'matchScore', 'matchedSkills', 'location', 'salaryRange']
  },

  candidate_interview: {
    id: 'candidate_interview',
    name: 'Candidate - Interview Invitation',
    type: 'candidate',
    subject: 'Interview Invitation: {roleTitle} at {company}',
    body: `Hi {candidateName},

Congratulations! {company} was impressed by your profile and would like to invite you for an interview for the {roleTitle} position.

Interview Details:
• Date: {interviewDate}
• Time: {interviewTime}
• Format: {interviewFormat}
• Duration: {duration}

Please confirm your availability by replying to this email or through your dashboard.

Preparation tips are available in your PlacementsPortal account.

Good luck!
PlacementsPortal Talent Engine`,
    variables: ['candidateName', 'roleTitle', 'company', 'interviewDate', 'interviewTime', 'interviewFormat', 'duration']
  }
};

// ============================================
// TEMPLATE RENDERING
// ============================================

/**
 * Render a template with variables
 * @param {string} template - Template string with {variable} placeholders
 * @param {Object} variables - Key-value pairs for replacement
 * @returns {string} Rendered string
 */
export const renderTemplate = (template, variables = {}) => {
  let rendered = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    rendered = rendered.replace(regex, value || `[${key}]`);
  });
  return rendered;
};

/**
 * Generate a complete outreach email from a template
 * @param {string} templateId - Template ID from OUTREACH_TEMPLATES
 * @param {Object} variables - Variables to fill in
 * @returns {Object} { subject, body, templateId }
 */
export const generateOutreachEmail = (templateId, variables = {}) => {
  const template = OUTREACH_TEMPLATES[templateId];
  if (!template) throw new Error(`Template "${templateId}" not found`);

  return {
    subject: renderTemplate(template.subject, variables),
    body: renderTemplate(template.body, variables),
    templateId,
    templateName: template.name,
    type: template.type,
    generatedAt: new Date().toISOString()
  };
};

// ============================================
// OUTREACH CAMPAIGNS (FIRESTORE)
// ============================================

/**
 * Create an outreach campaign
 */
export const createCampaign = async (campaignData) => {
  try {
    const docRef = await addDoc(collection(db, 'outreach_campaigns'), {
      ...campaignData,
      status: 'draft', // draft → active → paused → completed
      stats: {
        totalRecipients: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        converted: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

/**
 * Add recipients to a campaign
 */
export const addCampaignRecipients = async (campaignId, recipients) => {
  try {
    const batch = [];
    for (const recipient of recipients) {
      const ref = await addDoc(collection(db, 'outreach_campaigns', campaignId, 'recipients'), {
        ...recipient,
        status: 'pending', // pending → sent → opened → replied → converted
        sequenceStep: 0,
        createdAt: serverTimestamp()
      });
      batch.push(ref.id);
    }

    // Update campaign total
    await updateDoc(doc(db, 'outreach_campaigns', campaignId), {
      'stats.totalRecipients': recipients.length,
      updatedAt: serverTimestamp()
    });

    return batch;
  } catch (error) {
    console.error('Error adding recipients:', error);
    throw error;
  }
};

/**
 * Get all campaigns for an employer/user
 */
export const getCampaigns = async (userId) => {
  try {
    const q = query(
      collection(db, 'outreach_campaigns'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting campaigns:', error);
    throw error;
  }
};

/**
 * Update campaign status
 */
export const updateCampaignStatus = async (campaignId, status) => {
  try {
    await updateDoc(doc(db, 'outreach_campaigns', campaignId), {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

// ============================================
// OUTREACH SEQUENCES (AUTOMATED FOLLOW-UPS)
// ============================================

/**
 * Define a multi-step outreach sequence
 */
export const EMPLOYER_SEQUENCE = [
  { step: 1, templateId: 'employer_intro', delayDays: 0, description: 'Initial introduction' },
  { step: 2, templateId: 'employer_followup_1', delayDays: 3, description: 'First follow-up' },
  { step: 3, templateId: 'employer_followup_2', delayDays: 7, description: 'Final follow-up' }
];

/**
 * Get the next step in a sequence for a recipient
 * @param {number} currentStep - Current sequence step (0 = not started)
 * @param {string} sequenceType - 'employer' or 'candidate'
 * @returns {Object|null} Next step details or null if sequence complete
 */
export const getNextSequenceStep = (currentStep, sequenceType = 'employer') => {
  const sequence = sequenceType === 'employer' ? EMPLOYER_SEQUENCE : [];
  const next = sequence.find(s => s.step === currentStep + 1);
  return next || null;
};

// ============================================
// OUTREACH LOG (TRACKING)
// ============================================

/**
 * Log an outreach event
 */
export const logOutreach = async (data) => {
  try {
    await addDoc(collection(db, 'outreach_log'), {
      campaignId: data.campaignId || null,
      recipientId: data.recipientId,
      recipientType: data.recipientType, // 'employer' or 'candidate'
      recipientEmail: data.recipientEmail,
      templateId: data.templateId,
      subject: data.subject,
      sequenceStep: data.sequenceStep || 1,
      status: 'sent',
      sentAt: serverTimestamp(),
      openedAt: null,
      repliedAt: null,
      metadata: data.metadata || {}
    });
  } catch (error) {
    console.error('Error logging outreach:', error);
    throw error;
  }
};

/**
 * Get outreach history for a recipient
 */
export const getOutreachHistory = async (recipientId) => {
  try {
    const q = query(
      collection(db, 'outreach_log'),
      where('recipientId', '==', recipientId),
      orderBy('sentAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting outreach history:', error);
    throw error;
  }
};

// ============================================
// EMPLOYER OUTREACH GENERATOR
// ============================================

/**
 * Generate personalised employer outreach from company data
 * @param {Object} employer - Employer/company details
 * @param {Object} pipeline - Pipeline stats
 * @returns {Object} Generated email content
 */
export const generateEmployerPitch = (employer, pipeline = {}) => {
  const variables = {
    contactName: employer.contactName || employer.name || 'Hiring Manager',
    company: employer.company || employer.name || 'your company',
    roleType: employer.roleType || employer.industry || 'graduate',
    industry: employer.industry || 'technology',
    candidateCount: String(pipeline.totalCandidates || 25),
    newCandidateCount: String(pipeline.newCandidates || 8),
    highlightSkill: pipeline.topSkill || 'relevant industry',
    senderName: pipeline.senderName || 'The PlacementsPortal Team'
  };

  return generateOutreachEmail('employer_intro', variables);
};

/**
 * Generate personalised candidate notification
 */
export const generateCandidateNotification = (candidate, job, matchResult) => {
  const variables = {
    candidateName: candidate.name || 'there',
    roleTitle: job.title || job.role || 'this role',
    company: job.company || job.employerName || 'a leading company',
    matchScore: String(matchResult?.score || 0),
    matchedSkills: (matchResult?.matchedSkills || []).slice(0, 5).join(', ') || 'your profile skills',
    location: job.locationName || job.location?.city || 'flexible',
    salaryRange: job.minimumSalary
      ? `£${(job.minimumSalary / 1000).toFixed(0)}k–£${((job.maximumSalary || job.minimumSalary * 1.3) / 1000).toFixed(0)}k`
      : 'Competitive'
  };

  return generateOutreachEmail('candidate_opportunity', variables);
};

export default {
  OUTREACH_TEMPLATES,
  renderTemplate,
  generateOutreachEmail,
  createCampaign,
  addCampaignRecipients,
  getCampaigns,
  updateCampaignStatus,
  EMPLOYER_SEQUENCE,
  getNextSequenceStep,
  logOutreach,
  getOutreachHistory,
  generateEmployerPitch,
  generateCandidateNotification
};
