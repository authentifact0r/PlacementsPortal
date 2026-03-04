/**
 * Job Alternatives Page
 * Shows similar jobs when original expires
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import liveFeedService from '../services/liveFeed.service';
import LiveFeedCard from '../components/LiveFeedCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

const JobAlternatives = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { category, expiredJob } = location.state || {};

  const [similarJobs, setSimilarJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarJobs = async () => {
      if (!category) {
        // No category provided, redirect to opportunities
        navigate('/opportunities');
        return;
      }

      try {
        setLoading(true);
        const jobs = await liveFeedService.getSimilarJobs(category, 20);
        setSimilarJobs(jobs);
      } catch (error) {
        console.error('Error fetching similar jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarJobs();
  }, [category, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-semibold">
            Finding similar opportunities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate('/opportunities')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Back to All Jobs</span>
          </button>

          <div className="text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
            >
              <TrendingUp className="w-10 h-10" />
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Similar Opportunities
            </h1>
            <p className="text-xl text-orange-100 mb-2">
              That role filled up fast! Here are {similarJobs.length} similar live opportunities.
            </p>
            
            {/* Expired Job Info */}
            {expiredJob && (
              <div className="mt-6 inline-block">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                  <p className="text-sm text-white/80 mb-1">You were viewing:</p>
                  <p className="font-bold text-lg">{expiredJob.title}</p>
                  <p className="text-sm text-white/80">{expiredJob.company}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Badge */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-semibold text-gray-700">
              Showing {category} roles • Still fresh & low competition
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {similarJobs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No similar jobs available right now
            </h3>
            <p className="text-gray-600 mb-6">
              Try browsing all opportunities or check back later!
            </p>
            <button
              onClick={() => navigate('/opportunities')}
              className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-all"
            >
              View All Opportunities
            </button>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    These jobs are still fresh!
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    All jobs below are from the <strong>Live Feed</strong> and were posted in the last 
                    few hours. They're low competition and have active application windows. 
                    <strong> Save any that interest you</strong> so you don't lose them!
                  </p>
                </div>
              </div>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarJobs.map((job) => (
                <LiveFeedCard
                  key={job.id}
                  job={job}
                />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Didn't find what you're looking for?
              </p>
              <button
                onClick={() => navigate('/opportunities')}
                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all"
              >
                Browse All Opportunities
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JobAlternatives;
