/**
 * JobDetailModal — In-app job detail overlay
 * Shows all available job data, with a manual Reed search link.
 * Avoids redirecting to Reed programmatically (which triggers session errors).
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building2,
  ExternalLink,
  Flame,
  Users,
  Calendar,
} from 'lucide-react';

const JobDetailModal = ({ job, onClose }) => {
  if (!job) return null;

  // Build a Reed search URL — user clicks this manually (avoids session issue)
  const reedSearchUrl = `https://www.reed.co.uk/jobs?keywords=${encodeURIComponent(job.title || 'graduate')}&location=${encodeURIComponent(job.location || 'United Kingdom')}`;

  const postedLabel = job.posted || job.posted_at
    ? (job.posted || new Date(job.posted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))
    : 'Recently posted';

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal panel */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header banner */}
          <div className="relative h-36 bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 rounded-t-3xl flex-shrink-0">
            {job.bannerImage && (
              <img
                src={job.bannerImage}
                alt={job.company}
                className="absolute inset-0 w-full h-full object-cover rounded-t-3xl opacity-30"
              />
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {/* Company logo */}
            <div className="absolute -bottom-7 left-6">
              {job.logo || job.company_logo ? (
                <img
                  src={job.logo || job.company_logo}
                  alt={job.company}
                  className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg bg-white object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pt-10 px-6 pb-6">
            {/* Title + company */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                {job.title}
              </h2>
              <p className="text-base font-semibold text-gray-600">{job.company}</p>
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {job.location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
              )}
              {(job.salary) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <DollarSign className="w-3.5 h-3.5" />
                  {job.salary}
                </span>
              )}
              {(job.type || job.job_type) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <Briefcase className="w-3.5 h-3.5" />
                  {job.type || job.job_type}
                </span>
              )}
              {job.sector && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  {job.sector}
                </span>
              )}
              {job.applications_count > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                  <Users className="w-3.5 h-3.5" />
                  {job.applications_count} applicants
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full text-sm font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {postedLabel}
              </span>
            </div>

            {/* Live badge */}
            {job.time_remaining && !job.time_remaining.expired && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-5">
                <Flame className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  Just posted — Early applicant opportunity · Low competition
                </span>
                <Clock className="w-4 h-4 text-green-500 ml-auto" />
                <span className="text-xs text-green-700 font-medium">
                  {job.time_remaining.minutes}m {job.time_remaining.seconds}s left
                </span>
              </div>
            )}

            {/* Description */}
            {job.description && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">About this role</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">Key Responsibilities</h3>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">Requirements</h3>
                <ul className="space-y-2">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <a
                href={reedSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-green-500/30 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Apply on Reed.co.uk
              </a>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none sm:w-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all text-sm"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Clicking "Apply on Reed.co.uk" opens a live job search for this role on Reed.
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JobDetailModal;
