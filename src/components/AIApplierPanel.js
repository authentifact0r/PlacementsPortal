/**
 * AIApplierPanel — Smart Career Concierge (Tailoring Dashboard)
 * ──────────────────────────────────────────────────────────────
 * AI-Assisted Application Tailoring replaces bulk "auto-apply".
 * For each matched job the user sees a Match Score, match-reason
 * summary, and can "Tailor for this Job" to generate a customised
 * CV + cover letter.  A "Request Coach Review" button lets them
 * loop in a human coach before final submission.
 *
 * Data lives in:
 *   - ai_applier_prefs/{uid}          (preferences / profile snapshot)
 *   - tailored_applications/{docId}   (tailored drafts, separate from master CV)
 *   - ai_applications/{docId}         (legacy queue — still readable)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Settings2, BarChart2, Target, RefreshCw,
  ChevronDown, ChevronUp,
  FileText, Sparkles, Send, GraduationCap,
  Star, Eye, Loader2, X,
  MapPin, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../services/firebase';
import {
  doc, getDoc, setDoc, collection, query,
  where, orderBy, getDocs, addDoc, serverTimestamp, limit
} from 'firebase/firestore';

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH SCORE VISUAL
   ═══════════════════════════════════════════════════════════════════════════ */
const MatchScoreRing = ({ score }) => {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const bg    = score >= 80 ? '#d1fae5' : score >= 60 ? '#fef3c7' : '#fee2e2';
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : 'Low';

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Match score: ${score}%`}>
      <svg width="58" height="58" className="transform -rotate-90">
        <circle cx="29" cy="29" r={r} fill="none" stroke={bg} strokeWidth="5" />
        <motion.circle
          cx="29" cy="29" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          initial={{ strokeDasharray: circ, strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <text x="29" y="29" textAnchor="middle" dominantBaseline="central"
          className="transform rotate-90 origin-center"
          style={{ fontSize: '13px', fontWeight: 800, fill: color }}
        >
          {score}%
        </text>
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS CHIP
   ═══════════════════════════════════════════════════════════════════════════ */
const STATUS = {
  matched:   { label: 'Matched',         color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'   },
  tailoring: { label: 'Tailoring…',      color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  tailored:  { label: 'Ready to Review', color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500'  },
  reviewing: { label: 'Coach Reviewing', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  submitted: { label: 'Submitted',       color: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  skipped:   { label: 'Skipped',         color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400'   },
};

const StatusChip = ({ status }) => {
  const s = STATUS[status] || STATUS.matched;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   PREFERENCE ROW
   ═══════════════════════════════════════════════════════════════════════════ */
const PrefRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   SAMPLE MATCHED JOBS  (replace with real Firestore data later)
   ═══════════════════════════════════════════════════════════════════════════ */
const SAMPLE_JOBS = [
  {
    id: 'j1', jobTitle: 'Junior Frontend Developer', company: 'Monzo',
    location: 'London (Hybrid)', salary: '£32k–£40k', posted: '2 days ago',
    logo: 'M', logoColor: 'from-rose-500 to-pink-600',
    matchScore: 92,
    matchReasons: ['React & TypeScript in your skills', 'Fintech interest on your CV', '1+ year experience matches requirement'],
    description: 'Build beautiful banking interfaces using React, TypeScript and GraphQL.',
    status: 'matched',
  },
  {
    id: 'j2', jobTitle: 'Graduate Software Engineer', company: 'Deloitte Digital',
    location: 'London', salary: '£35k–£42k', posted: '5 days ago',
    logo: 'D', logoColor: 'from-emerald-500 to-teal-600',
    matchScore: 85,
    matchReasons: ['Node.js & cloud experience', 'Computer Science degree match', 'Consulting sector fits your career goals'],
    description: 'Join the graduate programme building enterprise apps for top-tier clients.',
    status: 'matched',
  },
  {
    id: 'j3', jobTitle: 'UX Designer Intern', company: 'BBC',
    location: 'Manchester', salary: '£24k–£28k', posted: '1 week ago',
    logo: 'B', logoColor: 'from-blue-600 to-indigo-700',
    matchScore: 68,
    matchReasons: ['Figma skills listed on CV', 'Portfolio link detected', 'Location preference differs (Manchester vs London)'],
    description: 'Design user experiences for BBC iPlayer and Sounds across web and mobile.',
    status: 'matched',
  },
  {
    id: 'j4', jobTitle: 'Data Analyst Graduate', company: 'Barclays',
    location: 'Remote', salary: '£30k–£36k', posted: '3 days ago',
    logo: 'B', logoColor: 'from-sky-500 to-blue-600',
    matchScore: 74,
    matchReasons: ['Python & SQL skills match', 'Finance sector aligns with education', 'Remote matches your preference'],
    description: 'Analyse customer data patterns and build dashboards for the retail banking team.',
    status: 'matched',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AIApplierPanel() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [prefs, setPrefs] = useState({
    locations: ['Remote', 'London'],
    jobTypes: ['graduate', 'entry-level'],
    minSalary: '',
    coverLetterTone: 'professional',
    notifyOnTailor: true,
  });

  const [jobs, setJobs] = useState(SAMPLE_JOBS);
  const [tailoredApps, setTailoredApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tailored' | 'settings' | 'stats'
  const [expandedJob, setExpandedJob] = useState(null);
  const [tailoringJobId, setTailoringJobId] = useState(null);

  /* ── Load data ── */
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const prefDoc = await getDoc(doc(db, 'ai_applier_prefs', currentUser.uid));
        if (prefDoc.exists()) setPrefs(p => ({ ...p, ...prefDoc.data() }));

        // Load tailored applications
        const q = query(
          collection(db, 'tailored_applications'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setTailoredApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('AIApplier load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  /* ── Save prefs ── */
  const savePrefs = async (updated) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'ai_applier_prefs', currentUser.uid), {
        ...updated, updatedAt: serverTimestamp(),
      }, { merge: true });
      setPrefs(updated);
      showSuccess('Preferences saved.');
    } catch {
      showError('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Tailor for this Job ── */
  const handleTailor = useCallback(async (job) => {
    setTailoringJobId(job.id);
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'tailoring' } : j));

    try {
      // Simulate AI tailoring delay (replace with real Cloud Function call)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const tailoredData = {
        userId: currentUser.uid,
        jobId: job.id,
        jobTitle: job.jobTitle,
        company: job.company,
        matchScore: job.matchScore,
        matchReasons: job.matchReasons,
        status: 'tailored',
        tailoredSummary: `Results-driven graduate with hands-on experience in ${job.matchReasons[0]?.replace(' in your skills', '').replace(' on your CV', '') || 'key technologies'}. Eager to contribute to ${job.company}'s mission.`,
        highlightedSkills: job.matchReasons.map(r => r.split(' ')[0]),
      };

      // Update UI immediately (optimistic update)
      const localId = `local-${Date.now()}`;
      setTailoredApps(prev => [{ id: localId, ...tailoredData, createdAt: new Date() }, ...prev]);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'tailored' } : j));
      showSuccess(`Application tailored for ${job.company}!`);

      // Persist to Firestore in the background (non-blocking)
      try {
        const docRef = await addDoc(collection(db, 'tailored_applications'), {
          ...tailoredData,
          createdAt: serverTimestamp(),
        });
        // Replace local ID with Firestore ID
        setTailoredApps(prev => prev.map(a => a.id === localId ? { ...a, id: docRef.id } : a));
      } catch (firestoreErr) {
        console.warn('Firestore save deferred — working offline:', firestoreErr.message);
        // UI still works; data is in local state
      }
    } catch (err) {
      console.error('Tailoring error:', err);
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'matched' } : j));
      showError('Tailoring failed. Please try again.');
    } finally {
      setTailoringJobId(null);
    }
  }, [currentUser, showSuccess, showError]);

  /* ── Request Coach Review ── */
  const handleCoachReview = useCallback(async (app) => {
    // Update UI immediately
    setTailoredApps(prev => prev.map(a => a.id === app.id ? { ...a, status: 'reviewing' } : a));
    setJobs(prev => prev.map(j => j.id === app.jobId ? { ...j, status: 'reviewing' } : j));
    showSuccess('Coach review requested! You\'ll hear back within 24 hours.');

    // Persist to Firestore in background
    try {
      if (!app.id.startsWith('local-')) {
        await setDoc(doc(db, 'tailored_applications', app.id), {
          status: 'reviewing', coachRequestedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore coach review update deferred:', err.message);
    }
  }, [showSuccess, setTailoredApps, setJobs]);

  /* ── Stats ── */
  const stats = {
    matched: jobs.filter(j => j.status === 'matched').length,
    tailored: tailoredApps.filter(a => a.status === 'tailored').length,
    reviewing: tailoredApps.filter(a => a.status === 'reviewing').length,
    submitted: tailoredApps.filter(a => a.status === 'submitted').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-7 h-7 text-violet-500 animate-spin" aria-hidden="true" />
        <p className="text-sm text-gray-500">Loading your career dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" role="region" aria-label="AI Career Concierge Dashboard">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO BANNER
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <div className="text-white">
                <h2 className="text-xl sm:text-2xl font-extrabold">Smart Career Concierge</h2>
                <p className="text-white/70 text-sm mt-0.5">AI-assisted application tailoring — quality over quantity</p>
              </div>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Matched Jobs', value: jobs.length, icon: Target, accent: 'bg-blue-500/20' },
              { label: 'Tailored', value: stats.tailored + stats.reviewing + stats.submitted, icon: FileText, accent: 'bg-emerald-500/20' },
              { label: 'In Review', value: stats.reviewing, icon: Eye, accent: 'bg-amber-500/20' },
              { label: 'Submitted', value: stats.submitted, icon: Send, accent: 'bg-green-500/20' },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div key={label} className={`${accent} backdrop-blur-sm rounded-xl p-3 text-center`}>
                <Icon className="w-4 h-4 text-white/80 mx-auto mb-1" aria-hidden="true" />
                <div className="text-lg font-extrabold text-white">{value}</div>
                <div className="text-[10px] text-white/60 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TABS
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1" role="tablist" aria-label="Dashboard sections">
        {[
          { key: 'dashboard', label: 'Job Matches',         icon: Target     },
          { key: 'tailored',  label: 'Tailored Applications', icon: FileText  },
          { key: 'settings',  label: 'Preferences',          icon: Settings2 },
          { key: 'stats',     label: 'Stats',                icon: BarChart2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1 — JOB MATCHES (Tailoring Dashboard)
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" id="panel-dashboard" role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-7 h-7 text-violet-400" aria-hidden="true" />
                </div>
                <div className="font-semibold text-gray-700 mb-1">No matched jobs yet</div>
                <div className="text-sm text-gray-400">Update your preferences so we can find roles that fit your profile.</div>
              </div>
            ) : (
              jobs.map((job, idx) => {
                const isExpanded = expandedJob === job.id;
                const isTailoring = tailoringJobId === job.id;

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    {/* ── Job row ── */}
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`job-detail-${job.id}`}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 transition-colors hover:bg-gray-50"
                    >
                      {/* Company logo */}
                      <div className={`w-11 h-11 bg-gradient-to-br ${job.logoColor} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                        {job.logo}
                      </div>

                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{job.jobTitle}</h4>
                          <StatusChip status={job.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" aria-hidden="true" />{job.company}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" aria-hidden="true" />{job.location}
                          </span>
                          <span className="text-xs text-gray-400">{job.salary}</span>
                        </div>
                      </div>

                      {/* Match score */}
                      <MatchScoreRing score={job.matchScore} />

                      {/* Chevron */}
                      {isExpanded
                        ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                        : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      }
                    </button>

                    {/* ── Expanded detail ── */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          id={`job-detail-${job.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                            {/* Description */}
                            <p className="text-sm text-gray-600 mb-4">{job.description}</p>

                            {/* Match reasons */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-4">
                              <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5" aria-hidden="true" />
                                Why You Match
                              </h5>
                              <ul className="space-y-1.5">
                                {job.matchReasons.map((reason, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                              {job.status === 'matched' && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => { e.stopPropagation(); handleTailor(job); }}
                                  disabled={isTailoring}
                                  aria-label={`Tailor your CV for the ${job.jobTitle} role at ${job.company}`}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isTailoring ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                      Tailoring Your CV…
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                                      Tailor for this Job
                                    </>
                                  )}
                                </motion.button>
                              )}

                              {(job.status === 'tailored') && (
                                <>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => { e.stopPropagation(); setActiveTab('tailored'); }}
                                    aria-label="View your tailored application"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500"
                                  >
                                    <Eye className="w-4 h-4" aria-hidden="true" />
                                    View Tailored CV
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const app = tailoredApps.find(a => a.jobId === job.id);
                                      if (app) handleCoachReview(app);
                                    }}
                                    aria-label={`Request a coach to review your ${job.jobTitle} application`}
                                    className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-purple-200 text-purple-700 font-semibold rounded-xl text-sm hover:bg-purple-50 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                                  >
                                    <GraduationCap className="w-4 h-4" aria-hidden="true" />
                                    Request Coach Review
                                  </motion.button>
                                </>
                              )}

                              {job.status === 'tailoring' && (
                                <div className="flex-1 flex items-center justify-center gap-3 py-3 bg-violet-50 rounded-xl" role="status" aria-live="polite">
                                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin" aria-hidden="true" />
                                  <span className="text-sm font-semibold text-violet-700">AI is tailoring your CV & cover letter…</span>
                                </div>
                              )}

                              {job.status === 'reviewing' && (
                                <div className="flex-1 flex items-center justify-center gap-3 py-3 bg-purple-50 rounded-xl" role="status">
                                  <GraduationCap className="w-5 h-5 text-purple-600" aria-hidden="true" />
                                  <span className="text-sm font-semibold text-purple-700">Coach is reviewing — you'll hear back within 24h</span>
                                </div>
                              )}

                              {job.status !== 'matched' && job.status !== 'tailoring' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); }}
                                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                                >
                                  Skip
                                </button>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-400 mt-3 text-center">
                              Posted {job.posted} · Your master CV is never changed — tailored versions are stored separately
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2 — TAILORED APPLICATIONS
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'tailored' && (
          <motion.div key="tailored" id="panel-tailored" role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {tailoredApps.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-violet-400" aria-hidden="true" />
                </div>
                <div className="font-semibold text-gray-700 mb-1">No tailored applications yet</div>
                <div className="text-sm text-gray-400 max-w-sm mx-auto">
                  Go to <button onClick={() => setActiveTab('dashboard')} className="text-violet-600 font-semibold underline underline-offset-2 hover:text-violet-800">Job Matches</button> and click "Tailor for this Job" to get started.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {tailoredApps.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{app.jobTitle}</h4>
                        <p className="text-xs text-gray-500">{app.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MatchScoreRing score={app.matchScore || 0} />
                        <StatusChip status={app.status} />
                      </div>
                    </div>

                    {/* Tailored summary preview */}
                    {app.tailoredSummary && (
                      <div className="bg-gray-50 rounded-xl p-3 mb-3">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Tailored Summary Preview</p>
                        <p className="text-sm text-gray-700 italic">"{app.tailoredSummary}"</p>
                      </div>
                    )}

                    {/* Match reasons */}
                    {app.matchReasons && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {app.matchReasons.map((r, ri) => (
                          <span key={ri} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      {app.status === 'tailored' && (
                        <>
                          <button
                            onClick={() => handleCoachReview(app)}
                            aria-label={`Request coach review for ${app.jobTitle} application`}
                            className="flex items-center gap-1.5 px-4 py-2 border-2 border-purple-200 text-purple-700 font-semibold rounded-xl text-xs hover:bg-purple-50 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                          >
                            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                            Request Coach Review
                          </button>
                          <button
                            aria-label={`Submit tailored application for ${app.jobTitle}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl text-xs hover:shadow-lg transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
                          >
                            <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            Submit Application
                          </button>
                        </>
                      )}
                      {app.status === 'reviewing' && (
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          Coach reviewing — typically within 24 hours
                        </div>
                      )}
                      {app.status === 'submitted' && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          Application submitted successfully
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 3 — PREFERENCES
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <motion.div key="settings" id="panel-settings" role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Matching Preferences</h3>

              <PrefRow label="Cover letter tone">
                <select
                  value={prefs.coverLetterTone}
                  onChange={e => setPrefs(p => ({ ...p, coverLetterTone: e.target.value }))}
                  aria-label="Select cover letter tone"
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {['professional', 'friendly', 'concise', 'enthusiastic'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </PrefRow>

              <PrefRow label="Notify me on tailoring">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={prefs.notifyOnTailor}
                    onChange={e => setPrefs(p => ({ ...p, notifyOnTailor: e.target.checked }))}
                    aria-label="Toggle tailoring notifications"
                  />
                  <div className="w-10 h-5 rounded-full transition-colors bg-gray-200 peer-checked:bg-violet-500
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                    after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow
                    after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
                </label>
              </PrefRow>

              <PrefRow label="Target locations">
                <div className="flex flex-wrap gap-1.5">
                  {['Remote', 'London', 'Manchester', 'Birmingham'].map(loc => (
                    <button
                      key={loc}
                      onClick={() => setPrefs(p => ({
                        ...p,
                        locations: p.locations.includes(loc)
                          ? p.locations.filter(l => l !== loc)
                          : [...p.locations, loc]
                      }))}
                      aria-pressed={prefs.locations.includes(loc)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        prefs.locations.includes(loc)
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-gray-100 text-gray-500 border border-transparent'
                      }`}
                    >
                      {loc} {prefs.locations.includes(loc) ? <X className="inline w-3 h-3 ml-0.5" aria-hidden="true" /> : '+'}
                    </button>
                  ))}
                </div>
              </PrefRow>

              <PrefRow label="Job types">
                <div className="flex flex-wrap gap-1.5">
                  {['graduate', 'entry-level', 'internship', 'placement'].map(jt => (
                    <button
                      key={jt}
                      onClick={() => setPrefs(p => ({
                        ...p,
                        jobTypes: p.jobTypes.includes(jt)
                          ? p.jobTypes.filter(t => t !== jt)
                          : [...p.jobTypes, jt]
                      }))}
                      aria-pressed={prefs.jobTypes.includes(jt)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all capitalize ${
                        prefs.jobTypes.includes(jt)
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-gray-100 text-gray-500 border border-transparent'
                      }`}
                    >
                      {jt} {prefs.jobTypes.includes(jt) ? <X className="inline w-3 h-3 ml-0.5" aria-hidden="true" /> : '+'}
                    </button>
                  ))}
                </div>
              </PrefRow>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => savePrefs(prefs)}
                disabled={saving}
                aria-label="Save matching preferences"
                className="mt-5 w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                Save Preferences
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 4 — STATS
            ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <motion.div key="stats" id="panel-stats" role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Jobs Matched',       value: jobs.length,       icon: Target,       color: 'violet' },
                { label: 'CVs Tailored',        value: stats.tailored + stats.reviewing + stats.submitted, icon: FileText, color: 'blue' },
                { label: 'Coach Reviews',        value: stats.reviewing,   icon: GraduationCap, color: 'purple' },
                { label: 'Applications Sent',    value: stats.submitted,   icon: Send,         color: 'green'  },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className={`w-9 h-9 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 text-${color}-600`} aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Conversion funnel */}
            <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Your Application Funnel</h3>
              <div className="space-y-3">
                {[
                  { label: 'Matched', count: jobs.length, pct: 100, color: 'bg-blue-500' },
                  { label: 'Tailored', count: stats.tailored + stats.reviewing + stats.submitted, pct: jobs.length ? Math.round(((stats.tailored + stats.reviewing + stats.submitted) / jobs.length) * 100) : 0, color: 'bg-violet-500' },
                  { label: 'Coach Reviewed', count: stats.reviewing + stats.submitted, pct: jobs.length ? Math.round(((stats.reviewing + stats.submitted) / jobs.length) * 100) : 0, color: 'bg-purple-500' },
                  { label: 'Submitted', count: stats.submitted, pct: jobs.length ? Math.round((stats.submitted / jobs.length) * 100) : 0, color: 'bg-emerald-500' },
                ].map(({ label, count, pct, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="text-gray-400">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
