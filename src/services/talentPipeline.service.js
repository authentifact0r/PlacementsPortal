/**
 * Talent Pipeline Service
 * ───────────────────────
 * Manages the end-to-end talent pipeline: employer onboarding,
 * pipeline tracking, hire reporting, and billing triggers.
 * This is the revenue engine behind the Talent Acquisition system.
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
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// PIPELINE STATUS FLOW
// ============================================

export const PIPELINE_STAGES = {
  SOURCED: 'sourced',
  SCREENED: 'screened',
  SHORTLISTED: 'shortlisted',
  SUBMITTED: 'submitted',      // Sent to employer
  INTERVIEWING: 'interviewing',
  OFFERED: 'offered',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

export const STAGE_ORDER = [
  'sourced', 'screened', 'shortlisted', 'submitted',
  'interviewing', 'offered', 'hired'
];

export const STAGE_LABELS = {
  sourced: 'Sourced',
  screened: 'AI Screened',
  shortlisted: 'Shortlisted',
  submitted: 'Submitted to Employer',
  interviewing: 'Interviewing',
  offered: 'Offer Extended',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

export const STAGE_COLORS = {
  sourced: '#6366f1',      // Indigo
  screened: '#8b5cf6',     // Violet
  shortlisted: '#a855f7',  // Purple
  submitted: '#3b82f6',    // Blue
  interviewing: '#f59e0b', // Amber
  offered: '#10b981',      // Emerald
  hired: '#22c55e',        // Green
  rejected: '#ef4444',     // Red
  withdrawn: '#6b7280'     // Gray
};

// ============================================
// EMPLOYER PIPELINE MANAGEMENT
// ============================================

/**
 * Create a new talent pipeline for an employer
 */
export const createPipeline = async (employerId, pipelineData) => {
  try {
    const docRef = await addDoc(collection(db, 'talent_pipelines'), {
      employerId,
      name: pipelineData.name || 'Default Pipeline',
      industry: pipelineData.industry || '',
      roleType: pipelineData.roleType || '',
      targetRoles: pipelineData.targetRoles || [],
      settings: {
        autoMatch: true,
        autoScreen: true,
        autoOutreach: false,
        minMatchScore: pipelineData.minMatchScore || 60,
        maxCandidatesPerRole: pipelineData.maxCandidatesPerRole || 20
      },
      billing: {
        model: pipelineData.billingModel || 'per_hire', // per_hire, per_lead, retainer
        ratePerHire: pipelineData.ratePerHire || 750,
        ratePerLead: pipelineData.ratePerLead || 200,
        retainerMonthly: pipelineData.retainerMonthly || 1500,
        currency: 'GBP'
      },
      stats: {
        totalSourced: 0,
        totalScreened: 0,
        totalShortlisted: 0,
        totalSubmitted: 0,
        totalInterviewing: 0,
        totalOffered: 0,
        totalHired: 0,
        totalRejected: 0,
        conversionRate: 0,
        averageTimeToHire: 0
      },
      status: 'active', // active, paused, completed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating pipeline:', error);
    throw error;
  }
};

/**
 * Get all pipelines for an employer
 */
export const getEmployerPipelines = async (employerId) => {
  try {
    const q = query(
      collection(db, 'talent_pipelines'),
      where('employerId', '==', employerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting pipelines:', error);
    throw error;
  }
};

/**
 * Get a single pipeline by ID
 */
export const getPipeline = async (pipelineId) => {
  try {
    const snap = await getDoc(doc(db, 'talent_pipelines', pipelineId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error getting pipeline:', error);
    throw error;
  }
};

// ============================================
// PIPELINE CANDIDATES
// ============================================

/**
 * Add a candidate to a pipeline
 */
export const addCandidateToPipeline = async (pipelineId, candidateData) => {
  try {
    const docRef = await addDoc(
      collection(db, 'talent_pipelines', pipelineId, 'candidates'),
      {
        candidateId: candidateData.candidateId,
        name: candidateData.name,
        email: candidateData.email,
        matchScore: candidateData.matchScore || 0,
        skills: candidateData.skills || [],
        stage: PIPELINE_STAGES.SOURCED,
        stageHistory: [{
          stage: PIPELINE_STAGES.SOURCED,
          timestamp: new Date().toISOString(),
          notes: 'Auto-sourced by AI matching engine'
        }],
        notes: '',
        interviewDate: null,
        offerAmount: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

    // Update pipeline stats
    await updateDoc(doc(db, 'talent_pipelines', pipelineId), {
      'stats.totalSourced': increment(1),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error adding candidate to pipeline:', error);
    throw error;
  }
};

/**
 * Move candidate to a new stage
 */
export const moveCandidateStage = async (pipelineId, candidateDocId, newStage, notes = '') => {
  try {
    const candRef = doc(db, 'talent_pipelines', pipelineId, 'candidates', candidateDocId);
    const candSnap = await getDoc(candRef);

    if (!candSnap.exists()) throw new Error('Candidate not found in pipeline');

    const currentData = candSnap.data();
    const stageHistory = currentData.stageHistory || [];
    stageHistory.push({
      stage: newStage,
      previousStage: currentData.stage,
      timestamp: new Date().toISOString(),
      notes
    });

    await updateDoc(candRef, {
      stage: newStage,
      stageHistory,
      updatedAt: serverTimestamp()
    });

    // Update pipeline stats
    const statsKey = `stats.total${newStage.charAt(0).toUpperCase() + newStage.slice(1)}`;
    await updateDoc(doc(db, 'talent_pipelines', pipelineId), {
      [statsKey]: increment(1),
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error moving candidate stage:', error);
    throw error;
  }
};

/**
 * Get all candidates in a pipeline, optionally filtered by stage
 */
export const getPipelineCandidates = async (pipelineId, stage = null) => {
  try {
    let q = query(collection(db, 'talent_pipelines', pipelineId, 'candidates'));

    if (stage) {
      q = query(q, where('stage', '==', stage));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting pipeline candidates:', error);
    throw error;
  }
};

// ============================================
// BILLING & REVENUE TRACKING
// ============================================

/**
 * Record a billable event (hire, lead submission, etc.)
 */
export const recordBillableEvent = async (eventData) => {
  try {
    const docRef = await addDoc(collection(db, 'billing_events'), {
      pipelineId: eventData.pipelineId,
      employerId: eventData.employerId,
      candidateId: eventData.candidateId,
      type: eventData.type, // 'hire', 'lead', 'retainer'
      amount: eventData.amount,
      currency: 'GBP',
      status: 'pending', // pending → invoiced → paid
      jobTitle: eventData.jobTitle || '',
      candidateName: eventData.candidateName || '',
      metadata: eventData.metadata || {},
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error recording billable event:', error);
    throw error;
  }
};

/**
 * Get billing events for revenue reporting
 */
export const getBillingEvents = async (filters = {}) => {
  try {
    let q = query(collection(db, 'billing_events'), orderBy('createdAt', 'desc'));

    if (filters.employerId) {
      q = query(q, where('employerId', '==', filters.employerId));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.limit) {
      q = query(q, firestoreLimit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting billing events:', error);
    throw error;
  }
};

/**
 * Calculate revenue summary
 */
export const getRevenueSummary = async (employerId = null) => {
  try {
    const events = await getBillingEvents({
      employerId,
      status: 'paid'
    });

    const summary = {
      totalRevenue: 0,
      hireRevenue: 0,
      leadRevenue: 0,
      retainerRevenue: 0,
      totalHires: 0,
      totalLeads: 0,
      activeRetainers: 0,
      byMonth: {}
    };

    events.forEach(event => {
      summary.totalRevenue += event.amount || 0;

      switch (event.type) {
        case 'hire':
          summary.hireRevenue += event.amount || 0;
          summary.totalHires += 1;
          break;
        case 'lead':
          summary.leadRevenue += event.amount || 0;
          summary.totalLeads += 1;
          break;
        case 'retainer':
          summary.retainerRevenue += event.amount || 0;
          break;
        default:
          break;
      }

      // Group by month
      if (event.createdAt) {
        const date = event.createdAt.toDate ? event.createdAt.toDate() : new Date(event.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!summary.byMonth[monthKey]) {
          summary.byMonth[monthKey] = { revenue: 0, hires: 0, leads: 0 };
        }
        summary.byMonth[monthKey].revenue += event.amount || 0;
        if (event.type === 'hire') summary.byMonth[monthKey].hires += 1;
        if (event.type === 'lead') summary.byMonth[monthKey].leads += 1;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error calculating revenue:', error);
    throw error;
  }
};

// ============================================
// PIPELINE ANALYTICS
// ============================================

/**
 * Get pipeline conversion funnel data
 */
export const getPipelineFunnel = async (pipelineId) => {
  try {
    const candidates = await getPipelineCandidates(pipelineId);

    const funnel = STAGE_ORDER.map(stage => ({
      stage,
      label: STAGE_LABELS[stage],
      color: STAGE_COLORS[stage],
      count: candidates.filter(c => {
        const stageIndex = STAGE_ORDER.indexOf(c.stage);
        const targetIndex = STAGE_ORDER.indexOf(stage);
        return stageIndex >= targetIndex; // Count candidates who reached or passed this stage
      }).length
    }));

    return funnel;
  } catch (error) {
    console.error('Error getting pipeline funnel:', error);
    throw error;
  }
};

/**
 * Get pipeline performance metrics
 */
export const getPipelineMetrics = async (pipelineId) => {
  try {
    const pipeline = await getPipeline(pipelineId);
    if (!pipeline) return null;

    const candidates = await getPipelineCandidates(pipelineId);

    const hired = candidates.filter(c => c.stage === 'hired');
    const rejected = candidates.filter(c => c.stage === 'rejected');
    const active = candidates.filter(c =>
      !['hired', 'rejected', 'withdrawn'].includes(c.stage)
    );

    // Average time to hire (from sourced to hired)
    let avgTimeToHire = 0;
    if (hired.length > 0) {
      const times = hired.map(c => {
        const history = c.stageHistory || [];
        const sourcedTime = history.find(h => h.stage === 'sourced');
        const hiredTime = history.find(h => h.stage === 'hired');
        if (sourcedTime && hiredTime) {
          return (new Date(hiredTime.timestamp) - new Date(sourcedTime.timestamp)) / (1000 * 60 * 60 * 24);
        }
        return 0;
      }).filter(t => t > 0);
      avgTimeToHire = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    }

    return {
      totalCandidates: candidates.length,
      activeCandidates: active.length,
      hired: hired.length,
      rejected: rejected.length,
      conversionRate: candidates.length > 0
        ? Math.round((hired.length / candidates.length) * 100)
        : 0,
      avgTimeToHire,
      stageBreakdown: STAGE_ORDER.reduce((acc, stage) => {
        acc[stage] = candidates.filter(c => c.stage === stage).length;
        return acc;
      }, {}),
      pipeline: pipeline
    };
  } catch (error) {
    console.error('Error getting pipeline metrics:', error);
    throw error;
  }
};

export default {
  PIPELINE_STAGES,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  createPipeline,
  getEmployerPipelines,
  getPipeline,
  addCandidateToPipeline,
  moveCandidateStage,
  getPipelineCandidates,
  recordBillableEvent,
  getBillingEvents,
  getRevenueSummary,
  getPipelineFunnel,
  getPipelineMetrics
};
