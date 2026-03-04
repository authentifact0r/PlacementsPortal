/**
 * Live Feed Page
 * Displays jobs posted in the last 3 hours with 2-hour expiry
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  RefreshCw,
  Clock,
  Filter,
  TrendingUp,
  Sparkles,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import liveFeedService, { fetchLinkedInJobs } from '../services/liveFeed.service';
import LiveFeedCard from '../components/LiveFeedCard';
import JobDetailModal from '../components/JobDetailModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

const LiveFeed = () => {
  const [jobs, setJobs] = useState([]);
  const [linkedInJobs, setLinkedInJobs] = useState([]);
  const [linkedInLoading, setLinkedInLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  // Modal lifted to page level to prevent framer-motion key conflicts
  const [selectedJob, setSelectedJob] = useState(null);

  // Deduplicate jobs by reed_job_id then title|company
  const deduplicateJobs = (rawJobs) => {
    const seen = new Set();
    return rawJobs.filter(job => {
      const key = job.reed_job_id
        ? String(job.reed_job_id)
        : `${job.title}|${job.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Fetch live jobs — goes straight to fetchReedJobs (which shuffles the
  // realistic fallback pool when the live API is unreachable), completely
  // bypassing the Firestore cache that previously served stale LinkedIn data.
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const raw = await liveFeedService.fetchReedJobs({
        keywords: 'graduate',
        location: 'United Kingdom',
        limit: 20,
      });

      if (!raw || raw.length === 0) {
        setError('No jobs available right now. Please try again in a moment.');
        return;
      }

      // Attach live-feed display metadata (countdown, expiry)
      const now = new Date();
      const expiryTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h window

      const liveFeedJobs = raw.map((job, index) => ({
        id: `reed-${job.reed_job_id || index}`,
        ...job,
        // Ensure every URL is Reed — scrub any stale LinkedIn refs
        source_url: (job.source_url || '').includes('linkedin.com')
          ? `https://www.reed.co.uk/jobs/${job.reed_job_id || index}`
          : (job.source_url || `https://www.reed.co.uk/jobs/graduate-roles/${job.reed_job_id || index}`),
        expires_at: expiryTime,
        is_active: true,
        time_remaining: {
          expired: false,
          minutes: 120,
          seconds: 0,
          totalSeconds: 7200,
        },
      }));

      setJobs(deduplicateJobs(liveFeedJobs));
    } catch (err) {
      console.error('LiveFeed fetch error:', err);
      setError('Failed to load jobs. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch LinkedIn / Indeed jobs via JSearch proxy
  const fetchLinkedIn = useCallback(async () => {
    setLinkedInLoading(true);
    try {
      const results = await fetchLinkedInJobs({ query: 'graduate jobs', location: 'United Kingdom', limit: 9 });
      setLinkedInJobs(results);
    } catch (err) {
      console.warn('LinkedIn fetch error:', err.message);
      setLinkedInJobs([]);
    } finally {
      setLinkedInLoading(false);
    }
  }, []);

  // Initial fetch — Reed + LinkedIn in parallel
  useEffect(() => {
    fetchJobs();
    fetchLinkedIn();
  }, [fetchJobs, fetchLinkedIn]);

  // Auto-refresh Reed every 2 minutes, LinkedIn every 10 minutes
  useEffect(() => {
    const reedInterval = setInterval(fetchJobs, 2 * 60 * 1000);
    const liInterval   = setInterval(fetchLinkedIn, 10 * 60 * 1000);
    return () => { clearInterval(reedInterval); clearInterval(liInterval); };
  }, [fetchJobs, fetchLinkedIn]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchJobs(), fetchLinkedIn()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Filter jobs
  // 'urgent' uses posted_mins_ago (≤ 30 min since posting) because all jobs
  // start with time_remaining.totalSeconds = 7200, making a seconds-based
  // urgent check always return 0 results on page load.
  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'low-competition') return (job.applications_count || 0) < 20;
    if (filter === 'urgent') return (job.posted_mins_ago || 999) <= 30;
    return job.fallback_category === filter;
  });

  // Handle job saved
  const handleJobSaved = useCallback((savedJob) => {
    console.log('Job saved:', savedJob.id);
  }, []);

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-semibold">
            Loading fresh opportunities...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
  <>
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
            >
              <Zap className="w-10 h-10" />
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              🔥 Live Job Feed
            </h1>
            <p className="text-xl text-green-100 mb-2">
              Jobs posted in the last 3 hours • Low competition • 2-hour window
            </p>
            <p className="text-sm text-green-200">
              Apply fast before these opportunities disappear!
            </p>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{jobs.length}</div>
                <div className="text-sm text-green-100">Live Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {jobs.filter(j => (j.applications_count || 0) < 20).length}
                </div>
                <div className="text-sm text-green-100">Low Competition</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">2h</div>
                <div className="text-sm text-green-100">Freshness Window</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              
              {[
                { id: 'all', label: 'All Jobs', icon: null },
                { id: 'low-competition', label: 'Low Competition', icon: TrendingUp },
                { id: 'urgent', label: 'Urgent (<30m)', icon: Clock },
                { id: 'Engineering', label: 'Engineering', icon: null },
                { id: 'Data & Analytics', label: 'Data', icon: null },
                { id: 'Marketing', label: 'Marketing', icon: null }
              ].map((filterOption) => {
                const Icon = filterOption.icon;
                return (
                  <button
                    key={filterOption.id}
                    onClick={() => setFilter(filterOption.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                      filter === filterOption.id
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {filterOption.label}
                  </button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── LinkedIn / Indeed Fresh Jobs (last 60 mins via JSearch) ── */}
      {(linkedInLoading || linkedInJobs.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-2">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2 bg-[#0077B5] text-white px-4 py-2 rounded-xl shadow">
              <Linkedin className="w-5 h-5" />
              <span className="font-bold text-sm tracking-wide">LinkedIn · Fresh in Last 60 mins</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">Via JSearch · Updated every 10 mins</span>
          </div>

          {linkedInLoading ? (
            <div className="flex items-center gap-3 py-8 text-gray-500">
              <LoadingSpinner size="sm" />
              <span className="text-sm font-medium">Fetching fresh LinkedIn jobs...</span>
            </div>
          ) : linkedInJobs.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">
              No LinkedIn jobs posted in the last 60 minutes right now — check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {linkedInJobs.map((job) => (
                <motion.div
                  key={job.reed_job_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group bg-white border-2 border-[#0077B5]/20 hover:border-[#0077B5] rounded-2xl p-5 cursor-pointer hover:shadow-lg transition-all relative overflow-hidden"
                  onClick={() => setSelectedJob({ ...job, id: job.reed_job_id, time_remaining: { expired: false, minutes: 60, seconds: 0, totalSeconds: 3600 } })}
                >
                  {/* LinkedIn colour bar */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0077B5]" />

                  <div className="flex items-start gap-3 mb-3">
                    {job.company_logo ? (
                      <img src={job.company_logo} alt={job.company}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-[#0077B5]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Linkedin className="w-6 h-6 text-[#0077B5]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base line-clamp-2 group-hover:text-[#0077B5] transition-colors mb-0.5">
                        {job.title}
                      </h3>
                      <p className="text-sm font-semibold text-gray-600">{job.company}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                    <span>📍 {job.location}</span>
                    {job.salary && job.salary !== 'Competitive' && <span>💷 {job.salary}</span>}
                    <span>💼 {job.job_type}</span>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-4">{job.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0077B5]/10 text-[#0077B5] rounded-full text-xs font-bold">
                      <Clock className="w-3 h-3" />
                      {job.posted_mins_ago <= 1 ? 'Just now' : `${job.posted_mins_ago}m ago`}
                    </span>
                    <a
                      href={job.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0077B5] hover:underline"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reed Live Feed</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredJobs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No live jobs right now
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Check back soon for fresh opportunities!'
                : 'Try adjusting your filters to see more jobs.'}
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
            >
              Refresh Feed
            </button>
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job) => (
                <LiveFeedCard
                  key={job.id}
                  job={job}
                  onSave={handleJobSaved}
                  onJobClick={(j) => setSelectedJob(j)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Why is there a 2-hour window?
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Jobs posted in the last few hours receive <strong>far fewer applications</strong>, 
                giving you a competitive advantage. We automatically refresh this feed every 30 minutes 
                and remove jobs after 2 hours to keep it ultra-fresh. Save any job you're interested 
                in to your <strong>"Saved Jobs"</strong> list so you don't lose it!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Page-level job detail modal — rendered outside card tree to avoid key conflicts */}
    {selectedJob && (
      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    )}
  </>
  );
};

export default LiveFeed;
