/**
 * Pitch Modal Component
 * Glassmorphism modal for recruiters to view student video pitches
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Phone, 
  Linkedin, 
  Play, 
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import videoPitchService from '../services/videoPitch.service';

const PitchModal = ({ student, isOpen, onClose }) => {
  const [pitch, setPitch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && student) {
      loadPitch();
      // Track view
      if (pitch?.id) {
        videoPitchService.incrementPitchViews(pitch.id);
      }
    }
  }, [isOpen, student]);

  const loadPitch = async () => {
    setLoading(true);
    setError(null);

    try {
      const pitchData = await videoPitchService.getUserVideoPitch(student.id);
      
      if (!pitchData) {
        setError('No video pitch available');
      } else {
        setPitch(pitchData);
      }
    } catch (err) {
      console.error('Error loading pitch:', err);
      setError('Failed to load video pitch');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative z-10 p-8">
            {loading ? (
              /* Loading State */
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                  <Play className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <p className="text-white font-semibold">Loading pitch...</p>
              </div>
            ) : error ? (
              /* Error State */
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-white font-semibold mb-2">Video Unavailable</p>
                <p className="text-gray-400 text-sm">{error}</p>
              </div>
            ) : (
              /* Content */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Video Player - Left Side (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-green-400">30s Pitch</span>
                    </div>
                    
                    {pitch?.viewsCount > 0 && (
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Eye className="w-4 h-4" />
                        <span>{pitch.viewsCount} views</span>
                      </div>
                    )}
                  </div>

                  {/* Video Player */}
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                    <video
                      src={pitch?.videoUrl}
                      controls
                      autoPlay
                      className="w-full h-full"
                    />
                  </div>

                  {/* Video Actions */}
                  <div className="flex items-center gap-3">
                    <a
                      href={pitch?.videoUrl}
                      download
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                    
                    <button
                      onClick={() => window.open(pitch?.videoUrl, '_blank')}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in New Tab
                    </button>
                  </div>
                </div>

                {/* Student Info - Right Side (1/3) */}
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="text-center">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={student.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/10"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">
                          {student.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                    )}

                    <h3 className="text-2xl font-bold text-white mb-1">
                      {student.name || 'Student'}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {student.major || 'Graduate'} · {student.graduationYear || '2024'}
                    </p>
                    
                    {student.university && (
                      <p className="text-gray-500 text-xs">
                        {student.university}
                      </p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {student.skills && student.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Key Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {student.skills.slice(0, 6).map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Contact Information</h4>
                    
                    {student.email && (
                      <a
                        href={`mailto:${student.email}`}
                        className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400">Email</p>
                          <p className="text-sm text-white font-semibold truncate">{student.email}</p>
                        </div>
                      </a>
                    )}

                    {student.phone && (
                      <a
                        href={`tel:${student.phone}`}
                        className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
                          <Phone className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400">Phone</p>
                          <p className="text-sm text-white font-semibold">{student.phone}</p>
                        </div>
                      </a>
                    )}

                    {student.linkedin && (
                      <a
                        href={student.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-[#0A66C2]/20 rounded-lg group-hover:bg-[#0A66C2]/30 transition-all">
                          <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400">LinkedIn</p>
                          <p className="text-sm text-white font-semibold truncate">View Profile</p>
                        </div>
                      </a>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => window.location.href = `mailto:${student.email}?subject=Opportunity - ${student.name}`}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    Contact for Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PitchModal;
