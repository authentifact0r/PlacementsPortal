/**
 * CV Optimization History Component
 * Application log with outcome tracking and job linking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import cvOptimizerService from '../services/cvOptimizer.service';
import { opportunityService } from '../services/opportunity.service';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

const CVOptimizationHistory = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [optimizations, setOptimizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkingJobId, setLinkingJobId] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);

  // Fetch optimization history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [historyData, statsData] = await Promise.all([
        cvOptimizerService.getCVOptimizationHistory(currentUser.uid),
        cvOptimizerService.getCVOptimizationStats(currentUser.uid)
      ]);

      setOptimizations(historyData);
      setStats(statsData);

      // Fetch available jobs for linking
      const jobs = await opportunityService.getAll();
      setAvailableJobs(jobs.slice(0, 20)); // Limit to 20 most recent

    } catch (err) {
      console.error('Error fetching CV history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser, fetchHistory]);

  // Link optimization to job
  const handleLinkToJob = useCallback(async (optimizationId, jobId) => {
    try {
      await cvOptimizerService.linkToJobOpportunity(optimizationId, jobId);
      showSuccess('CV linked to job opportunity');
      fetchHistory(); // Refresh
      setLinkingJobId(null);
    } catch (err) {
      showError(err.message || 'Failed to link CV to job');
    }
  }, [showSuccess, showError, fetchHistory]);

  // Update outcome
  const handleUpdateOutcome = useCallback(async (optimizationId, outcome) => {
    try {
      await cvOptimizerService.updateApplicationOutcome(optimizationId, outcome);
      showSuccess(`Outcome updated to "${outcome}"`);
      fetchHistory(); // Refresh
    } catch (err) {
      showError(err.message || 'Failed to update outcome');
    }
  }, [showSuccess, showError, fetchHistory]);

  // Download CV
  const handleDownload = useCallback((url) => {
    window.open(url, '_blank');
    showInfo('Opening optimized CV...');
  }, [showInfo]);

  // Get outcome badge
  const getOutcomeBadge = (outcome) => {
    const badges = {
      offered: {
        label: 'Offered',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2,
        iconColor: 'text-green-600'
      },
      interviewed: {
        label: 'Interviewed',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: TrendingUp,
        iconColor: 'text-blue-600'
      },
      applied: {
        label: 'Applied',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        iconColor: 'text-yellow-600'
      },
      rejected: {
        label: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        iconColor: 'text-red-600'
      },
      pending: {
        label: 'Pending',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
        iconColor: 'text-gray-600'
      }
    };

    const badge = badges[outcome] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        <Icon className={`w-3 h-3 ${badge.iconColor}`} />
        {badge.label}
      </span>
    );
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-700">Total Optimizations</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.outcomes.offered}</div>
            <div className="text-sm text-gray-700">Job Offers</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.successRate}%</div>
            <div className="text-sm text-gray-700">Success Rate</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.linkedJobs}</div>
            <div className="text-sm text-gray-700">Linked Jobs</div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Application Log</h3>
          <p className="text-sm text-gray-600">Track your optimized CVs and application outcomes</p>
        </div>

        <div className="divide-y divide-gray-200">
          {optimizations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-2">No optimizations yet</p>
              <p className="text-sm text-gray-500">
                Upload and optimize your first CV to start tracking applications
              </p>
            </div>
          ) : (
            optimizations.map((optimization) => (
              <motion.div
                key={optimization.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-6 py-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Date & Status */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(optimization.created_at)}
                        </span>
                      </div>
                      {optimization.linked_job_outcome ? (
                        getOutcomeBadge(optimization.linked_job_outcome)
                      ) : (
                        getOutcomeBadge('pending')
                      )}
                    </div>
                  </div>

                  {/* Middle: Job Linking */}
                  <div className="flex-1">
                    {optimization.linked_job_id ? (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Link2 className="w-4 h-4 text-green-600" />
                        <span>Linked to job opportunity</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkingJobId === optimization.id ? (
                          <select
                            onChange={(e) => handleLinkToJob(optimization.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            defaultValue=""
                          >
                            <option value="" disabled>Select job opportunity...</option>
                            {availableJobs.map((job) => (
                              <option key={job.id} value={job.id}>
                                {job.title} - {job.company}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setLinkingJobId(optimization.id)}
                            className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                          >
                            <Link2 className="w-4 h-4" />
                            Link to Job Opportunity
                          </button>
                        )}
                      </div>
                    )}

                    {/* Outcome Dropdown (if linked) */}
                    {optimization.linked_job_id && (
                      <div className="mt-2">
                        <select
                          value={optimization.linked_job_outcome || 'applied'}
                          onChange={(e) => handleUpdateOutcome(optimization.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="applied">Applied</option>
                          <option value="interviewed">Interviewed</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Right: Download */}
                  <button
                    onClick={() => handleDownload(optimization.optimized_cv_url)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CVOptimizationHistory;
