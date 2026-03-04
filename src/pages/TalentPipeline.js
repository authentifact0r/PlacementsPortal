/**
 * TalentPipeline.js — Employer Talent Pipeline Dashboard
 * ───────────────────────────────────────────────────────
 * The core revenue-generating page. Employers manage their talent
 * pipeline here: view matched candidates, move stages, track hires,
 * and trigger billing events.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  getEmployerPipelines,
  createPipeline,
  getPipelineCandidates,
  moveCandidateStage,
  getPipelineMetrics,
  recordBillableEvent
} from '../services/talentPipeline.service';
import { matchCandidatesToJob, calculateMatchScore } from '../services/candidateMatching.service';
import { generateEmployerPitch } from '../services/outreach.service';
import {
  Users, Briefcase, TrendingUp, Search,
  CheckCircle, XCircle, Calendar,
  ArrowRight, Plus, Zap,
  UserCheck, Mail, Eye
} from 'lucide-react';

// ── Stage badge component ──
const StageBadge = ({ stage }) => (
  <span
    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    style={{ backgroundColor: `${STAGE_COLORS[stage]}20`, color: STAGE_COLORS[stage] }}
  >
    {STAGE_LABELS[stage] || stage}
  </span>
);

// ── Match score ring ──
const ScoreRing = ({ score, size = 48 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth="3" fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="3" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}%</span>
    </div>
  );
};

// ── Candidate card ──
const CandidateCard = ({ candidate, onStageChange, onViewProfile }) => {
  const [showActions, setShowActions] = useState(false);

  const nextStages = (() => {
    const currentIdx = STAGE_ORDER.indexOf(candidate.stage);
    if (currentIdx < 0) return [];
    return STAGE_ORDER.slice(currentIdx + 1).filter(s => s !== 'rejected');
  })();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {(candidate.name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{candidate.name || 'Unknown'}</h4>
            <p className="text-sm text-gray-500 truncate">{candidate.email || ''}</p>
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {candidate.skills.slice(0, 4).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    +{candidate.skills.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ScoreRing score={candidate.matchScore || 0} size={44} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StageBadge stage={candidate.stage} />
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewProfile(candidate)}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="View profile"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Move stage"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {showActions && nextStages.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Move to:</p>
          <div className="flex flex-wrap gap-1">
            {nextStages.map(stage => (
              <button
                key={stage}
                onClick={() => { onStageChange(candidate.id, stage); setShowActions(false); }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: `${STAGE_COLORS[stage]}15`, color: STAGE_COLORS[stage] }}
              >
                {STAGE_LABELS[stage]}
              </button>
            ))}
            <button
              onClick={() => { onStageChange(candidate.id, 'rejected'); setShowActions(false); }}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Pipeline stats cards ──
const StatsCard = ({ icon: Icon, label, value, change, color = 'purple' }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
      {change && (
        <span className={`text-xs font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

// ── Main component ──
function TalentPipeline() {
  const { currentUser, userProfile } = useAuth();

  // State
  const [pipelines, setPipelines] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStageFilter, setActiveStageFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // New pipeline form
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    industry: 'tech',
    roleType: '',
    billingModel: 'per_hire',
    ratePerHire: 750,
    minMatchScore: 60
  });

  // Load pipelines
  const loadPipelines = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await getEmployerPipelines(currentUser.uid);
      setPipelines(data);
      if (data.length > 0 && !activePipelineId) {
        setActivePipelineId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load pipelines:', err);
    }
  }, [currentUser, activePipelineId]);

  // Load pipeline candidates and metrics
  const loadPipelineData = useCallback(async () => {
    if (!activePipelineId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cands, mets] = await Promise.all([
        getPipelineCandidates(activePipelineId, activeStageFilter),
        getPipelineMetrics(activePipelineId)
      ]);
      setCandidates(cands);
      setMetrics(mets);
    } catch (err) {
      console.error('Failed to load pipeline data:', err);
    } finally {
      setLoading(false);
    }
  }, [activePipelineId, activeStageFilter]);

  useEffect(() => { loadPipelines(); }, [loadPipelines]);
  useEffect(() => { loadPipelineData(); }, [loadPipelineData]);

  // Create new pipeline
  const handleCreatePipeline = async () => {
    try {
      const id = await createPipeline(currentUser.uid, newPipeline);
      setActivePipelineId(id);
      setShowCreateModal(false);
      setNewPipeline({ name: '', industry: 'tech', roleType: '', billingModel: 'per_hire', ratePerHire: 750, minMatchScore: 60 });
      await loadPipelines();
    } catch (err) {
      console.error('Failed to create pipeline:', err);
    }
  };

  // Move candidate stage
  const handleStageChange = async (candidateDocId, newStage) => {
    try {
      await moveCandidateStage(activePipelineId, candidateDocId, newStage);

      // If hired, record billable event
      if (newStage === 'hired') {
        const cand = candidates.find(c => c.id === candidateDocId);
        const pipeline = pipelines.find(p => p.id === activePipelineId);
        if (cand && pipeline) {
          await recordBillableEvent({
            pipelineId: activePipelineId,
            employerId: currentUser.uid,
            candidateId: cand.candidateId,
            type: 'hire',
            amount: pipeline.billing?.ratePerHire || 750,
            jobTitle: pipeline.roleType || '',
            candidateName: cand.name || ''
          });
        }
      }

      await loadPipelineData();
    } catch (err) {
      console.error('Failed to move stage:', err);
    }
  };

  // Filtered candidates
  const filteredCandidates = candidates.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const skillMatch = (c.skills || []).some(s => s.toLowerCase().includes(q));
      if (!nameMatch && !skillMatch) return false;
    }
    return true;
  });

  // Group by stage for Kanban view
  const candidatesByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = filteredCandidates.filter(c => c.stage === stage);
    return acc;
  }, {});

  const activePipeline = pipelines.find(p => p.id === activePipelineId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="text-purple-600" size={28} />
                Talent Pipeline Engine
              </h1>
              <p className="text-gray-500 mt-1">AI-powered candidate matching, screening & placement tracking</p>
            </div>
            <div className="flex items-center gap-3">
              {pipelines.length > 1 && (
                <select
                  value={activePipelineId || ''}
                  onChange={e => setActivePipelineId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {pipelines.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} /> New Pipeline
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatsCard icon={Users} label="Total Candidates" value={metrics.totalCandidates || 0} color="purple" />
            <StatsCard icon={UserCheck} label="Active in Pipeline" value={metrics.activeCandidates || 0} color="blue" />
            <StatsCard icon={CheckCircle} label="Hired" value={metrics.hired || 0} color="green" />
            <StatsCard icon={TrendingUp} label="Conversion Rate" value={`${metrics.conversionRate || 0}%`} color="amber" />
          </div>
        )}

        {/* Pipeline empty state */}
        {pipelines.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Briefcase className="text-purple-600" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Create Your First Talent Pipeline</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Set up an AI-powered pipeline to automatically source, screen, and match candidates to your open roles.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors font-medium"
            >
              Create Pipeline
            </button>
          </div>
        )}

        {/* Stage filters + Search */}
        {pipelines.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveStageFilter(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  !activeStageFilter ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                All ({candidates.length})
              </button>
              {STAGE_ORDER.map(stage => {
                const count = (candidatesByStage[stage] || []).length;
                return (
                  <button
                    key={stage}
                    onClick={() => setActiveStageFilter(activeStageFilter === stage ? null : stage)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeStageFilter === stage
                        ? 'text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    style={activeStageFilter === stage ? { backgroundColor: STAGE_COLORS[stage] } : {}}
                  >
                    {STAGE_LABELS[stage]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search candidates by name or skill..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Candidates grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <Users className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">No candidates in this pipeline yet.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Candidates will appear here as the AI matching engine finds matches for your roles.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCandidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onStageChange={handleStageChange}
                    onViewProfile={setSelectedCandidate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Pipeline Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Pipeline</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Name</label>
                <input
                  type="text"
                  value={newPipeline.name}
                  onChange={e => setNewPipeline({ ...newPipeline, name: e.target.value })}
                  placeholder="e.g. Software Engineers Q1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={newPipeline.industry}
                    onChange={e => setNewPipeline({ ...newPipeline, industry: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="tech">Tech & Software</option>
                    <option value="cybersecurity">Cybersecurity & IT</option>
                    <option value="engineering">Engineering</option>
                    <option value="business">Business & Finance</option>
                    <option value="graduate">Graduate (All)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
                  <input
                    type="text"
                    value={newPipeline.roleType}
                    onChange={e => setNewPipeline({ ...newPipeline, roleType: e.target.value })}
                    placeholder="e.g. Frontend Developer"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Model</label>
                  <select
                    value={newPipeline.billingModel}
                    onChange={e => setNewPipeline({ ...newPipeline, billingModel: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="per_hire">Pay Per Hire</option>
                    <option value="per_lead">Pay Per Lead</option>
                    <option value="retainer">Monthly Retainer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (£)
                  </label>
                  <input
                    type="number"
                    value={newPipeline.ratePerHire}
                    onChange={e => setNewPipeline({ ...newPipeline, ratePerHire: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Match Score: {newPipeline.minMatchScore}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={newPipeline.minMatchScore}
                  onChange={e => setNewPipeline({ ...newPipeline, minMatchScore: parseInt(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePipeline}
                disabled={!newPipeline.name}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
              >
                Create Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Candidate Profile</h2>
                <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {(selectedCandidate.name || '?')[0].toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCandidate.name}</h3>
                <p className="text-gray-500">{selectedCandidate.email}</p>
                <div className="mt-3">
                  <ScoreRing score={selectedCandidate.matchScore || 0} size={64} />
                  <p className="text-xs text-gray-400 mt-1">Match Score</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Stage</h4>
                  <StageBadge stage={selectedCandidate.stage} />
                </div>

                {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCandidate.stageHistory && selectedCandidate.stageHistory.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Pipeline History</h4>
                    <div className="space-y-2">
                      {selectedCandidate.stageHistory.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[entry.stage] }} />
                          <span className="text-gray-700">{STAGE_LABELS[entry.stage]}</span>
                          <span className="text-gray-400 text-xs">
                            {new Date(entry.timestamp).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                      <Mail size={16} /> Send Message
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors">
                      <Calendar size={16} /> Schedule Interview
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors">
                      <Eye size={16} /> View Full CV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TalentPipeline;
