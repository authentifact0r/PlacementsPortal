/**
 * AIApplierPanel — AI Auto-Applier feature panel
 * ─────────────────────────────────────────────────
 * Lets the student configure job preferences and auto-apply quotas,
 * shows the queue of AI-generated applications, and tracks status.
 * Shown inside a PremiumGate so only paid users see the live UI.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Zap, Briefcase, CheckCircle2, Clock,
  Settings2, Play, Pause, BarChart2,
  Target, RefreshCw, AlertCircle, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../services/firebase';
import {
  doc, getDoc, setDoc, collection, query,
  where, orderBy, getDocs, serverTimestamp, limit
} from 'firebase/firestore';

// ── Status chip ────────────────────────────────────────────────────────────
const STATUS = {
  queued:    { label: 'Queued',    color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'   },
  applying:  { label: 'Applying…', color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'   },
  submitted: { label: 'Submitted', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  failed:    { label: 'Failed',    color: 'bg-red-50 text-red-600',       dot: 'bg-red-400'    },
  skipped:   { label: 'Skipped',   color: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500' },
};

const StatusChip = ({ status }) => {
  const s = STATUS[status] || STATUS.queued;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Preference row ─────────────────────────────────────────────────────────
const PrefRow = ({ label, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function AIApplierPanel() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [prefs, setPrefs] = useState({
    enabled: false,
    monthlyQuota: 30,
    appliedThisMonth: 0,
    jobTypes: ['graduate', 'entry-level'],
    minSalary: '',
    locations: ['Remote', 'London'],
    coverLetterTone: 'professional',
    notifyOnApply: true,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'settings' | 'stats'

  // Load prefs + application queue from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const prefDoc = await getDoc(doc(db, 'ai_applier_prefs', currentUser.uid));
        if (prefDoc.exists()) setPrefs(p => ({ ...p, ...prefDoc.data() }));

        const q = query(
          collection(db, 'ai_applications'),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('AIApplier load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser]);

  const savePrefs = async (updated) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'ai_applier_prefs', currentUser.uid), {
        ...updated,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setPrefs(updated);
      showSuccess(updated.enabled ? 'AI Applier is now active!' : 'AI Applier paused.');
    } catch {
      showError('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = () => savePrefs({ ...prefs, enabled: !prefs.enabled });

  const quotaUsed = prefs.appliedThisMonth || 0;
  const quotaTotal = prefs.monthlyQuota || 30;
  const quotaPct = Math.min(Math.round((quotaUsed / quotaTotal) * 100), 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Status banner ──────────────────────────────────────────────── */}
      <div className={`rounded-2xl p-5 flex items-center justify-between ${
        prefs.enabled
          ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white'
          : 'bg-gray-100 text-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            prefs.enabled ? 'bg-white/20' : 'bg-white'
          }`}>
            <Bot className={`w-6 h-6 ${prefs.enabled ? 'text-white' : 'text-violet-600'}`} />
          </div>
          <div>
            <div className="font-bold text-base">AI Auto-Applier</div>
            <div className={`text-sm ${prefs.enabled ? 'text-white/70' : 'text-gray-500'}`}>
              {prefs.enabled
                ? `${quotaUsed}/${quotaTotal} applications used this month`
                : 'Currently paused — toggle to activate'}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={toggleEnabled}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            prefs.enabled
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : prefs.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {prefs.enabled ? 'Pause' : 'Activate'}
        </motion.button>
      </div>

      {/* ── Quota bar ──────────────────────────────────────────────────── */}
      {prefs.enabled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold text-gray-800">Monthly quota</span>
            <span className="text-gray-500">{quotaUsed} / {quotaTotal} applied</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${quotaPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${quotaPct >= 90 ? 'bg-red-500' : 'bg-gradient-to-r from-violet-500 to-purple-600'}`}
            />
          </div>
          {quotaPct >= 90 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Almost at your monthly limit
            </div>
          )}
        </motion.div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {[
          { key: 'queue',    label: 'Application Queue', icon: Briefcase  },
          { key: 'settings', label: 'Preferences',       icon: Settings2  },
          { key: 'stats',    label: 'Stats',             icon: BarChart2  },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Application Queue ────────────────────────────────────────── */}
        {activeTab === 'queue' && (
          <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {applications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-7 h-7 text-violet-400" />
                </div>
                <div className="font-semibold text-gray-700 mb-1">No applications yet</div>
                <div className="text-sm text-gray-400">
                  {prefs.enabled
                    ? 'The AI is scanning matched jobs. Applications will appear here once submitted.'
                    : 'Activate the AI Applier to start auto-applying to matched jobs.'}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {applications.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(app.jobTitle || 'J').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{app.jobTitle || 'Role'}</div>
                        <div className="text-xs text-gray-500">{app.company || '—'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip status={app.status} />
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Preferences ──────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Applier Preferences</h3>

              <PrefRow label="Monthly application limit">
                <select
                  value={prefs.monthlyQuota}
                  onChange={e => setPrefs(p => ({ ...p, monthlyQuota: Number(e.target.value) }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {[10, 20, 30].map(n => <option key={n} value={n}>{n} per month</option>)}
                </select>
              </PrefRow>

              <PrefRow label="Cover letter tone">
                <select
                  value={prefs.coverLetterTone}
                  onChange={e => setPrefs(p => ({ ...p, coverLetterTone: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  {['professional', 'friendly', 'concise', 'enthusiastic'].map(t => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </PrefRow>

              <PrefRow label="Notify me on each apply">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={prefs.notifyOnApply}
                    onChange={e => setPrefs(p => ({ ...p, notifyOnApply: e.target.checked }))}
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
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        prefs.locations.includes(loc)
                          ? 'bg-violet-100 text-violet-700 border border-violet-200'
                          : 'bg-gray-100 text-gray-500 border border-transparent'
                      }`}
                    >
                      {loc} {prefs.locations.includes(loc) ? <X className="inline w-3 h-3 ml-0.5" /> : '+'}
                    </button>
                  ))}
                </div>
              </PrefRow>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => savePrefs(prefs)}
                disabled={saving}
                className="mt-5 w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Preferences
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Stats ────────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Applied',    value: applications.filter(a => a.status === 'submitted').length, icon: CheckCircle2, color: 'green'  },
                { label: 'Queued',           value: applications.filter(a => a.status === 'queued').length,    icon: Clock,        color: 'gray'   },
                { label: 'Interviews',       value: applications.filter(a => a.status === 'interview').length, icon: Target,       color: 'amber'  },
                { label: 'This Month',       value: quotaUsed,                                                 icon: Zap,          color: 'violet' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className={`w-9 h-9 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 text-${color}-600`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
