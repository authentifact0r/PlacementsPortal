/**
 * Live Feed Job Card Component
 * Displays job with "🔥 JUST POSTED" badge and countdown timer.
 * Modal is lifted to the parent page to avoid framer-motion popLayout conflicts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  MapPin,
  DollarSign,
  Briefcase,
  Users,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import liveFeedService from '../services/liveFeed.service';

const formatTimeRemaining = (timeRemaining) => {
  const { minutes, seconds } = timeRemaining;
  if (minutes === 0) return `${seconds} secs left`;
  if (minutes < 5) return `${minutes} mins ${seconds} secs left`;
  return `${minutes} mins left`;
};

/**
 * @param {Object}   job        - Job data object
 * @param {Function} onSave     - Called when user saves the job
 * @param {Function} onJobClick - Called with `job` when card is clicked — parent renders modal
 */
const LiveFeedCard = ({ job, onSave, onJobClick }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [timeRemaining, setTimeRemaining] = useState(job.time_remaining);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev.totalSeconds <= 0) {
          clearInterval(interval);
          return { expired: true, minutes: 0, seconds: 0, totalSeconds: 0 };
        }
        const newTotal = prev.totalSeconds - 1;
        return {
          expired: false,
          minutes: Math.floor(newTotal / 60),
          seconds: newTotal % 60,
          totalSeconds: newTotal,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      showInfo('Please login to save jobs');
      navigate('/login');
      return;
    }
    try {
      setIsSaving(true);
      const result = await liveFeedService.saveJobForLater(currentUser.uid, job.id);
      if (result.success) {
        setIsSaved(true);
        showSuccess('Job saved! Check "Saved Jobs" to view it later.');
        if (onSave) onSave(job);
      } else if (result.alreadySaved) {
        showInfo('This job is already in your saved list');
        setIsSaved(true);
      }
    } catch (error) {
      showError(error.message || 'Failed to save job');
    } finally {
      setIsSaving(false);
    }
  }, [currentUser, job, showSuccess, showError, showInfo, navigate, onSave]);

  const handleClick = () => {
    if (onJobClick) onJobClick(job);
  };

  const getUrgencyLevel = () => {
    if (timeRemaining.totalSeconds <= 10 * 60) return 'critical';
    if (timeRemaining.totalSeconds <= 20 * 60) return 'high';
    return 'normal';
  };

  const urgency = getUrgencyLevel();

  const getBadgeColors = () => {
    switch (urgency) {
      case 'critical': return 'bg-red-600 text-white animate-pulse';
      case 'high':     return 'bg-orange-600 text-white';
      default:         return 'bg-green-600 text-white';
    }
  };

  if (timeRemaining.expired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      onClick={handleClick}
      className="group bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-green-500 hover:shadow-xl transition-all relative overflow-hidden"
    >
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {job.company_logo ? (
          <img src={job.company_logo} alt={job.company}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-200" />
        ) : (
          <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-7 h-7 text-green-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <button
              onClick={handleSave}
              disabled={isSaved || isSaving}
              className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                isSaved ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
              title={isSaved ? 'Saved' : 'Save for later'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>

          <p className="text-sm font-semibold text-gray-700 mb-1">{job.company}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
            {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary}</span>}
            {(job.job_type || job.type) && (
              <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.job_type || job.type}</span>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getBadgeColors()}`}>
          <Flame className="w-3 h-3" /> JUST POSTED
        </span>
        {(job.applications_count || 0) < 20 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
            <TrendingUp className="w-3 h-3" /> Early Applicant
          </span>
        )}
        {job.applications_count > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
            <Users className="w-3 h-3" />
            {job.applications_count} applicant{job.applications_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{job.description}</p>

      {/* Countdown */}
      <div className={`flex items-center justify-between p-3 rounded-xl ${
        urgency === 'critical' ? 'bg-red-50 border border-red-200'
        : urgency === 'high'   ? 'bg-orange-50 border border-orange-200'
                               : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${urgency === 'critical' ? 'text-red-600' : urgency === 'high' ? 'text-orange-600' : 'text-green-600'}`} />
          <span className={`text-xs font-bold ${urgency === 'critical' ? 'text-red-800' : urgency === 'high' ? 'text-orange-800' : 'text-green-800'}`}>
            {urgency === 'critical' && '⚠️ '}{formatTimeRemaining(timeRemaining)}
          </span>
        </div>
        <span className={`text-xs font-semibold ${urgency === 'critical' ? 'text-red-600' : urgency === 'high' ? 'text-orange-600' : 'text-green-600'}`}>
          {urgency === 'critical' ? 'Apply NOW!' : urgency === 'high' ? 'Low Competition' : 'Fresh Opportunity'}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-green-600/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-end justify-center pb-8 pointer-events-none">
        <span className="text-white font-bold text-lg">View Details →</span>
      </div>
    </motion.div>
  );
};

export default LiveFeedCard;
