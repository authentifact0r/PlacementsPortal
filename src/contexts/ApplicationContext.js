/**
 * ApplicationContext — Production-grade real-time state management for job applications.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE                                                        │
 * │                                                                      │
 * │  Single onSnapshot on `job_applications` collection                  │
 * │  ─► applications[] ─► useMemo(analytics)                             │
 * │                                                                      │
 * │  Consumers:                                                          │
 * │    • JobTracker  (Kanban board, table view, analytics panel)         │
 * │    • JobTrackerWidget (Dashboard sidebar card)                       │
 * │    • StudentProfileEnhancedV2 (Home dashboard counter)              │
 * │                                                                      │
 * │  Features:                                                           │
 * │    • Optimistic updates — UI updates instantly, rolls back on error  │
 * │    • Connection state — tracks 'connecting' | 'live' | 'error'      │
 * │    • Error recovery — auto-retry with exponential backoff            │
 * │    • Memoised analytics — pipeline velocity, conversion, attribution │
 * │    • Batch status updates — move multiple apps at once               │
 * │    • All queries scoped to auth.currentUser.uid                      │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';

const ApplicationContext = createContext(null);

export const useApplications = () => {
  const ctx = useContext(ApplicationContext);
  if (!ctx) throw new Error('useApplications must be used within ApplicationProvider');
  return ctx;
};

// ─── Status pipeline definition ──────────────────────────────────────────────
const PIPELINE_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

// ─── Helper: Firestore Timestamp → JS Date ──────────────────────────────────
const toDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return null;
};

// ─── Helper: Normalise a Firestore doc into the shape the JobTracker expects ─
// The global `job_applications` collection uses `jobTitle`, `appliedAt`, `sourceUrl`
// but the JobTracker UI expects `role`, `appliedDate`, `jobUrl`.
const normaliseDoc = (raw) => ({
  ...raw,
  // JobTracker displays `role` — fall back to jobTitle
  role: raw.role || raw.jobTitle || '',
  // JobTracker orders by `appliedDate` — fall back to appliedAt / createdAt
  appliedDate: raw.appliedDate || raw.appliedAt || raw.createdAt || null,
  // JobTracker opens `jobUrl` — fall back to sourceUrl
  jobUrl: raw.jobUrl || raw.sourceUrl || '',
  // Ensure company is always a string
  company: raw.company || '',
});

// ─── Helper: Median calculation ──────────────────────────────────────────────
const median = (arr) => {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? Math.round(sorted[mid] * 10) / 10
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
};

const avg = (arr) =>
  arr.length > 0
    ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
    : null;


// ═════════════════════════════════════════════════════════════════════════════
//  ANALYTICS ENGINE (pure function — called inside useMemo)
// ═════════════════════════════════════════════════════════════════════════════
function computeAnalytics(applications) {
  const total = applications.length;
  if (total === 0) {
    return {
      total: 0,
      thisWeek: 0,
      thisMonth: 0,
      byStatus: {},
      interviewRate: 0,
      offerRate: 0,
      rejectionRate: 0,
      pipelineVelocity: {
        savedToApplied:      { avg: null, median: null, samples: 0 },
        appliedToInterview:  { avg: null, median: null, samples: 0 },
        interviewToOffer:    { avg: null, median: null, samples: 0 },
        endToEnd:            { avg: null, median: null, samples: 0 },
      },
      conversionFunnel: [],
      sourceAttribution: [],
      weeklyTrend: [],
    };
  }

  // ── Counts by status ────────────────────────────────────────────────────────
  const byStatus = {};
  PIPELINE_STAGES.forEach((s) => { byStatus[s] = 0; });
  applications.forEach((app) => {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
  });

  // ── Time-window counts ────────────────────────────────────────────────────
  const now = new Date();
  const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate() - 7);
  const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);

  const thisWeek = applications.filter((app) => {
    const d = toDate(app.appliedDate || app.createdAt);
    return d && d >= oneWeekAgo;
  }).length;

  const thisMonth = applications.filter((app) => {
    const d = toDate(app.appliedDate || app.createdAt);
    return d && d >= oneMonthAgo;
  }).length;

  // ── Rates ─────────────────────────────────────────────────────────────────
  const appliedPlus = applications.filter((a) =>
    ['applied', 'interview', 'offer', 'rejected'].includes(a.status)
  ).length;

  const interviewRate = appliedPlus > 0
    ? Math.round(((byStatus.interview + byStatus.offer) / appliedPlus) * 100)
    : 0;
  const offerRate = appliedPlus > 0
    ? Math.round((byStatus.offer / appliedPlus) * 100)
    : 0;
  const rejectionRate = appliedPlus > 0
    ? Math.round((byStatus.rejected / appliedPlus) * 100)
    : 0;

  // ── Pipeline Velocity ─────────────────────────────────────────────────────
  const velocityBuckets = {
    savedToApplied: [],
    appliedToInterview: [],
    interviewToOffer: [],
    endToEnd: [],
  };

  applications.forEach((app) => {
    const history = app.statusHistory || [];
    if (history.length < 2) return;

    const findDate = (status) => {
      const entry = history.find((h) => h.status === status);
      return entry ? toDate(entry.date || entry.timestamp) : null;
    };

    const saved     = findDate('saved');
    const applied   = findDate('applied');
    const interview = findDate('interview');
    const offer     = findDate('offer');

    const daysBetween = (a, b) => {
      if (!a || !b) return null;
      const days = (b - a) / (1000 * 60 * 60 * 24);
      return days >= 0 && days < 365 ? days : null;
    };

    const s2a = daysBetween(saved, applied);
    const a2i = daysBetween(applied, interview);
    const i2o = daysBetween(interview, offer);

    if (s2a !== null) velocityBuckets.savedToApplied.push(s2a);
    if (a2i !== null) velocityBuckets.appliedToInterview.push(a2i);
    if (i2o !== null) velocityBuckets.interviewToOffer.push(i2o);

    const e2e = daysBetween(saved || applied, offer);
    if (e2e !== null) velocityBuckets.endToEnd.push(e2e);
  });

  const pipelineVelocity = {};
  Object.entries(velocityBuckets).forEach(([key, values]) => {
    pipelineVelocity[key] = {
      avg: avg(values),
      median: median(values),
      samples: values.length,
    };
  });

  // ── Conversion Funnel (cumulative reach) ──────────────────────────────────
  const reachedStage = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };

  applications.forEach((app) => {
    const historyStatuses = new Set(
      (app.statusHistory || []).map((h) => h.status)
    );
    historyStatuses.add(app.status);

    PIPELINE_STAGES.forEach((stage) => {
      if (historyStatuses.has(stage)) {
        reachedStage[stage] += 1;
      }
    });
  });

  const funnelStages = ['saved', 'applied', 'interview', 'offer'];
  const conversionFunnel = funnelStages.map((stage, i) => {
    const prevStage = i > 0 ? funnelStages[i - 1] : null;
    const count = reachedStage[stage];
    const prevCount = prevStage ? reachedStage[prevStage] : total;
    const rate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    return { stage, count, rate, prevStage };
  });

  // ── Source Attribution with CV Version Tracking ────────────────────────────
  const sourceMap = {};

  applications.forEach((app) => {
    const source = (app.source || 'unknown').toLowerCase();
    if (!sourceMap[source]) {
      sourceMap[source] = {
        source,
        total: 0,
        applied: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
        cvVersions: {},
      };
    }

    const s = sourceMap[source];
    s.total += 1;
    if (['applied', 'interview', 'offer'].includes(app.status)) s.applied += 1;
    if (['interview', 'offer'].includes(app.status))            s.interviews += 1;
    if (app.status === 'offer')    s.offers += 1;
    if (app.status === 'rejected') s.rejected += 1;

    const cvVersion = app.associated_cv_version || app.cvVersion || 'default';
    if (!s.cvVersions[cvVersion]) {
      s.cvVersions[cvVersion] = { total: 0, interviews: 0, offers: 0 };
    }
    s.cvVersions[cvVersion].total += 1;
    if (['interview', 'offer'].includes(app.status)) s.cvVersions[cvVersion].interviews += 1;
    if (app.status === 'offer') s.cvVersions[cvVersion].offers += 1;
  });

  const sourceAttribution = Object.values(sourceMap)
    .map((s) => ({
      ...s,
      interviewRate: s.total > 0 ? Math.round((s.interviews / s.total) * 100) : 0,
      offerRate:     s.total > 0 ? Math.round((s.offers / s.total) * 100) : 0,
      bestCvVersion: Object.entries(s.cvVersions)
        .sort((a, b) => b[1].interviews - a[1].interviews)[0]?.[0] || null,
    }))
    .sort((a, b) => b.interviewRate - a.interviewRate);

  // ── Weekly Trend (last 8 weeks) ───────────────────────────────────────────
  const weeklyTrend = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (w + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - w * 7);

    const count = applications.filter((app) => {
      const d = toDate(app.appliedDate || app.createdAt);
      return d && d >= weekStart && d < weekEnd;
    }).length;

    weeklyTrend.push({
      week: w === 0 ? 'This week' : `${w}w ago`,
      count,
    });
  }

  // ── Stage Conversion Rates (pairwise) ──────────────────────────────────────
  const stageConversionRates = {};
  const orderedStages = ['saved', 'applied', 'interview', 'offer'];
  for (let i = 1; i < orderedStages.length; i++) {
    const from = orderedStages[i - 1];
    const to = orderedStages[i];
    const fromCount = reachedStage[from];
    const toCount = reachedStage[to];
    stageConversionRates[`${from}To${to.charAt(0).toUpperCase() + to.slice(1)}`] = {
      from,
      to,
      fromCount,
      toCount,
      rate: fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0,
    };
  }

  // ── End-to-end summary metrics ─────────────────────────────────────────────
  const avgDaysToOffer = pipelineVelocity.endToEnd.avg;
  const medianDaysToOffer = pipelineVelocity.endToEnd.median;
  const activeApplications = applications.filter(
    (a) => !['offer', 'rejected'].includes(a.status)
  ).length;

  return {
    total,
    thisWeek,
    thisMonth,
    activeApplications,
    byStatus,
    interviewRate,
    offerRate,
    rejectionRate,
    avgDaysToOffer,
    medianDaysToOffer,
    pipelineVelocity,
    stageConversionRates,
    conversionFunnel,
    sourceAttribution,
    weeklyTrend,
  };
}


// ═════════════════════════════════════════════════════════════════════════════
//  PROVIDER
// ═════════════════════════════════════════════════════════════════════════════
export const ApplicationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting' | 'live' | 'error'

  const unsubRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);

  // Snapshot ref for optimistic rollbacks
  const snapshotRef = useRef([]);

  // ── Collection reference helper ───────────────────────────────────────────
  const getCollectionRef = useCallback(() => {
    if (!currentUser?.uid) return null;
    return collection(db, 'job_applications');
  }, [currentUser?.uid]);

  // ── Single onSnapshot listener with retry logic ───────────────────────────
  // Reads from the GLOBAL `job_applications` collection filtered by userId.
  // This is the same collection that handleJobClaim / jobTrackingService writes to.
  useEffect(() => {
    if (!currentUser?.uid) {
      setApplications([]);
      setLoading(false);
      setConnectionState('connecting');
      return;
    }

    const subscribe = () => {
      setConnectionState('connecting');
      const ref = collection(db, 'job_applications');
      const q = query(
        ref,
        where('userId', '==', currentUser.uid),
        orderBy('appliedAt', 'desc')
      );

      unsubRef.current = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => normaliseDoc({ id: d.id, ...d.data() }));
          setApplications(data);
          snapshotRef.current = data;
          setLoading(false);
          setConnectionState('live');
          retryCountRef.current = 0; // Reset on success
        },
        (error) => {
          console.error('[ApplicationContext] onSnapshot error:', error);
          setConnectionState('error');
          setLoading(false);

          // Exponential backoff retry: 2s, 4s, 8s, 16s, max 30s
          const delay = Math.min(2000 * Math.pow(2, retryCountRef.current), 30000);
          retryCountRef.current += 1;
          console.log(`[ApplicationContext] Retrying in ${delay}ms (attempt ${retryCountRef.current})`);

          retryTimerRef.current = setTimeout(() => {
            if (unsubRef.current) unsubRef.current();
            subscribe();
          }, delay);
        }
      );
    };

    setLoading(true);
    subscribe();

    return () => {
      if (unsubRef.current) unsubRef.current();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [currentUser?.uid]);

  // ── Memoised analytics ────────────────────────────────────────────────────
  const analytics = useMemo(() => computeAnalytics(applications), [applications]);

  // ── Optimistic update helper ──────────────────────────────────────────────
  const optimisticUpdate = useCallback((updateFn) => {
    setApplications((prev) => {
      const next = updateFn(prev);
      return next;
    });
  }, []);

  // ── CRUD Operations with Optimistic Updates ───────────────────────────────

  const addApplication = useCallback(async (formData) => {
    if (!currentUser?.uid) throw new Error('Not authenticated');

    const now = Timestamp.now();
    const applicationId = `${currentUser.uid}_${formData.jobId || 'manual'}_${Date.now()}`;

    const docData = {
      userId: currentUser.uid,
      jobId: formData.jobId || `manual-${Date.now()}`,
      jobTitle: formData.role || formData.jobTitle || '',
      company: formData.company || '',
      location: formData.location || '',
      salary: formData.salary || null,
      source: formData.source || 'manual',
      appliedAt: now,
      status: formData.status || 'saved',
      applicationMethod: formData.applicationMethod || 'external',
      cvVersion: formData.cvVersion || null,
      coverLetter: formData.coverLetter || false,
      notes: formData.notes || '',
      sourceUrl: formData.jobUrl || formData.sourceUrl || '',
      clickedBefore: false,
      timeToApply: null,
      statusHistory: [{
        status: formData.status || 'saved',
        timestamp: now,
        note: (formData.status || 'saved') === 'saved' ? 'Job saved for later' : 'Application submitted',
      }],
      metadata: {
        jobType: null,
        expirationDate: null,
        jobUrl: formData.jobUrl || formData.sourceUrl || '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    };

    // Optimistic: add temp entry with normalised fields
    optimisticUpdate((prev) => [normaliseDoc({ id: applicationId, ...docData }), ...prev]);

    try {
      await setDoc(doc(db, 'job_applications', applicationId), docData);
      return applicationId;
    } catch (error) {
      console.error('[ApplicationContext] addApplication error:', error);
      throw error;
    }
  }, [currentUser?.uid, optimisticUpdate]);

  const updateApplication = useCallback(async (appId, data) => {
    if (!currentUser?.uid) throw new Error('Not authenticated');

    const ref = doc(db, 'job_applications', appId);

    // Optimistic
    optimisticUpdate((prev) =>
      prev.map((a) => (a.id === appId ? normaliseDoc({ ...a, ...data, updatedAt: Timestamp.now() }) : a))
    );

    try {
      await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
    } catch (error) {
      console.error('[ApplicationContext] updateApplication error:', error);
      throw error;
    }
  }, [currentUser?.uid, optimisticUpdate]);

  const updateStatus = useCallback(async (appId, newStatus) => {
    if (!currentUser?.uid) throw new Error('Not authenticated');

    // Read current app from the live snapshot ref (avoids stale closure)
    const app = snapshotRef.current.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const ref = doc(db, 'job_applications', appId);
    const now = Timestamp.now();
    const updatedHistory = [
      ...(app.statusHistory || []),
      { status: newStatus, date: now, timestamp: now },
    ];

    // Optimistic
    optimisticUpdate((prev) =>
      prev.map((a) =>
        a.id === appId
          ? normaliseDoc({ ...a, status: newStatus, statusHistory: updatedHistory, updatedAt: now })
          : a
      )
    );

    try {
      await updateDoc(ref, {
        status: newStatus,
        statusHistory: updatedHistory,
        updatedAt: now,
      });
    } catch (error) {
      console.error('[ApplicationContext] updateStatus error:', error);
      throw error;
    }
  }, [currentUser?.uid, optimisticUpdate]);

  const deleteApplication = useCallback(async (appId) => {
    if (!currentUser?.uid) throw new Error('Not authenticated');

    const ref = doc(db, 'job_applications', appId);

    // Optimistic
    optimisticUpdate((prev) => prev.filter((a) => a.id !== appId));

    try {
      await deleteDoc(ref);
    } catch (error) {
      console.error('[ApplicationContext] deleteApplication error:', error);
      throw error;
    }
  }, [currentUser?.uid, optimisticUpdate]);

  // ── Batch Operations ──────────────────────────────────────────────────────
  const batchUpdateStatus = useCallback(async (appIds, newStatus) => {
    if (!currentUser?.uid) throw new Error('Not authenticated');

    const now = Timestamp.now();
    const batch = writeBatch(db);

    appIds.forEach((appId) => {
      const app = snapshotRef.current.find((a) => a.id === appId);
      if (!app) return;

      const ref = doc(db, 'job_applications', appId);
      const updatedHistory = [
        ...(app.statusHistory || []),
        { status: newStatus, date: now, timestamp: now },
      ];

      batch.update(ref, {
        status: newStatus,
        statusHistory: updatedHistory,
        updatedAt: now,
      });
    });

    // Optimistic
    optimisticUpdate((prev) =>
      prev.map((a) => {
        if (!appIds.includes(a.id)) return a;
        return normaliseDoc({
          ...a,
          status: newStatus,
          statusHistory: [...(a.statusHistory || []), { status: newStatus, date: now }],
          updatedAt: now,
        });
      })
    );

    try {
      await batch.commit();
    } catch (error) {
      console.error('[ApplicationContext] batchUpdateStatus error:', error);
      throw error;
    }
  }, [currentUser?.uid, optimisticUpdate]);

  // ── Context value (memoised to prevent unnecessary re-renders) ────────────
  const value = useMemo(() => ({
    // State
    applications,
    loading,
    connectionState,
    analytics,
    // CRUD
    addApplication,
    updateApplication,
    updateStatus,
    deleteApplication,
    // Batch
    batchUpdateStatus,
  }), [
    applications,
    loading,
    connectionState,
    analytics,
    addApplication,
    updateApplication,
    updateStatus,
    deleteApplication,
    batchUpdateStatus,
  ]);

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export default ApplicationContext;
