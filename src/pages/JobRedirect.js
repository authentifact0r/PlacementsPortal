/**
 * Job Redirect Handler
 * Handles /apply/[jobId] route with link protection
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Loader2 
} from 'lucide-react';
import liveFeedService from '../services/liveFeed.service';
import { LoadingSpinner } from '../components/LoadingSpinner';

const JobRedirect = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading | redirecting | expired | error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const checkJobAndRedirect = async () => {
      try {
        const result = await liveFeedService.getJobForRedirect(jobId);

        if (result.status === 'active') {
          // Job is active, redirect to LinkedIn
          setStatus('redirecting');
          setMessage('Redirecting to job application...');

          // Countdown before redirect
          const countdownInterval = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                // Redirect to LinkedIn
                window.location.href = result.redirect_url;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

        } else if (result.status === 'expired') {
          // Job expired, redirect to alternatives
          setStatus('expired');
          setMessage(result.message);
          
          setTimeout(() => {
            navigate('/opportunities/alternatives', {
              state: {
                category: result.fallback_category,
                expiredJob: result.job
              }
            });
          }, 3000);

        } else if (result.status === 'inactive') {
          // Job inactive, redirect to alternatives
          setStatus('expired');
          setMessage(result.message);
          
          setTimeout(() => {
            navigate('/opportunities/alternatives', {
              state: {
                category: result.fallback_category,
                expiredJob: result.job
              }
            });
          }, 3000);

        } else {
          // Job not found
          setStatus('error');
          setMessage('Job not found. It may have been removed.');
          
          setTimeout(() => {
            navigate('/opportunities');
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking job:', error);
        setStatus('error');
        setMessage('Something went wrong. Redirecting to opportunities...');
        
        setTimeout(() => {
          navigate('/opportunities');
        }, 3000);
      }
    };

    if (jobId) {
      checkJobAndRedirect();
    } else {
      navigate('/opportunities');
    }
  }, [jobId, navigate]);

  // Render loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-semibold">
            Checking job availability...
          </p>
        </div>
      </div>
    );
  }

  // Render redirecting state
  if (status === 'redirecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Job is Available!
          </h2>
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            <span className="text-lg font-semibold text-gray-700">
              Redirecting in {countdown}...
            </span>
          </div>

          {/* External Link Icon */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <ExternalLink className="w-4 h-4" />
            <span>Opening on Reed.co.uk</span>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={() => window.location.href = '/opportunities'}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  // Render expired/error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center"
      >
        {/* Alert Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            status === 'expired' 
              ? 'bg-orange-100' 
              : 'bg-red-100'
          }`}
        >
          <AlertCircle className={`w-10 h-10 ${
            status === 'expired' 
              ? 'text-orange-600' 
              : 'text-red-600'
          }`} />
        </motion.div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'expired' ? 'Job No Longer Available' : 'Oops!'}
        </h2>
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Auto-redirect message */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <p className="text-sm text-blue-800 font-semibold">
            🔍 Finding similar opportunities for you...
          </p>
        </div>

        {/* Manual navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/opportunities/alternatives')}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            View Alternatives
          </button>
          <button
            onClick={() => navigate('/opportunities')}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
          >
            All Jobs
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default JobRedirect;
