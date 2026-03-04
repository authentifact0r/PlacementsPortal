/**
 * Elevated Pitch Studio Page
 * AI script generation + teleprompter recording + sharing
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Edit3, 
  Video, 
  Share2, 
  Copy, 
  CheckCircle2,
  Loader2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import TeleprompterRecorder from '../components/TeleprompterRecorder';
import videoPitchService from '../services/videoPitch.service';

const VideoPitchStudio = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();

  // Studio state
  const [step, setStep] = useState(1); // 1: Script, 2: Record, 3: Share
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPitchUrl, setVideoPitchUrl] = useState(null);
  const [publicLink, setPublicLink] = useState('');

  // User profile data
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    major: '',
    skills: [],
    targetRole: ''
  });

  // ============================================
  // LOAD USER PROFILE
  // ============================================

  useEffect(() => {
    if (!currentUser) {
      showInfo('Please login to access Elevated Pitch Studio');
      navigate('/login');
      return;
    }

    loadUserProfile();
    checkExistingPitch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      // In production, fetch from Firestore
      // For now, use mock data or localStorage
      const profile = {
        fullName: currentUser.displayName || 'Student',
        major: 'Computer Science',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        targetRole: 'Software Engineer'
      };

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkExistingPitch = async () => {
    try {
      const existingPitch = await videoPitchService.getUserVideoPitch(currentUser.uid);
      
      if (existingPitch) {
        setVideoPitchUrl(existingPitch.videoUrl);
        setPublicLink(videoPitchService.generatePublicPitchLink(currentUser.uid));
        
        if (existingPitch.script) {
          setScript(existingPitch.script);
        }
      }
    } catch (error) {
      console.error('Error checking existing pitch:', error);
    }
  };

  // ============================================
  // SCRIPT GENERATION
  // ============================================

  const handleGenerateScript = async () => {
    setIsGenerating(true);

    try {
      const generatedScript = await videoPitchService.generatePitchScript(userProfile);
      setScript(generatedScript);
      showSuccess('Script generated successfully!');
    } catch (error) {
      console.error('Script generation error:', error);
      showError('Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditScript = () => {
    setStep(1);
  };

  const handleProceedToRecord = () => {
    if (!script || script.trim().length < 50) {
      showError('Please generate or write a script (minimum 50 characters)');
      return;
    }
    setStep(2);
  };

  // ============================================
  // VIDEO RECORDING
  // ============================================

  const handleRecordingComplete = async (recordingData) => {
    setIsUploading(true);

    try {
      // Upload video to storage
      const videoUrl = await videoPitchService.uploadVideoPitch(
        recordingData.blob,
        currentUser.uid
      );

      // Save to database
      await videoPitchService.saveVideoPitch(currentUser.uid, {
        videoUrl: videoUrl,
        script: recordingData.script,
        duration: recordingData.duration
      });

      setVideoPitchUrl(videoUrl);
      setPublicLink(videoPitchService.generatePublicPitchLink(currentUser.uid));
      setStep(3);

      showSuccess('Video pitch saved successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to save video pitch. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================
  // SHARING
  // ============================================

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    showSuccess('Link copied to clipboard!');
  };

  const handleShareLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicLink)}`;
    window.open(linkedInUrl, '_blank');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-full mb-4"
          >
            <Video className="w-5 h-5 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Elevated Pitch Studio</span>
          </motion.div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Create Your 60-Second Elevated Pitch
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Stand out to recruiters with an AI-powered video pitch. Generate your script, record with a teleprompter, and share your story.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: 'Script', icon: Edit3 },
            { num: 2, label: 'Record', icon: Video },
            { num: 3, label: 'Share', icon: Share2 }
          ].map((item, index) => (
            <React.Fragment key={item.num}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold transition-all ${
                  step >= item.num 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {step > item.num ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <item.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm font-semibold ${
                  step >= item.num ? 'text-white' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </div>
              {index < 2 && (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="script"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Step 1: Script Generation */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      1. Generate Your Script
                    </h2>
                    <p className="text-gray-400">
                      AI will create a compelling 45-second pitch based on your profile
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateScript}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate My Pitch
                      </>
                    )}
                  </button>
                </div>

                {/* Script Editor */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-300">
                    Your Script (editable)
                  </label>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Click 'Generate My Pitch' or write your own script here... (Aim for ~110 words for a 45-second pitch)"
                    rows={12}
                    className="w-full px-4 py-3 bg-slate-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {script.split(/\s+/).filter(Boolean).length} words (target: ~110 words)
                    </span>
                    <span className="text-gray-400">
                      Est. duration: ~{Math.ceil(script.split(/\s+/).filter(Boolean).length / 2.5)} seconds
                    </span>
                  </div>
                </div>

                {/* Next Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleProceedToRecord}
                    disabled={!script || script.trim().length < 50}
                    className="flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Proceed to Recording
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="record"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-5xl mx-auto"
            >
              {/* Step 2: Recording */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      2. Record Your Pitch
                    </h2>
                    <p className="text-gray-400">
                      The script will scroll as you record. Adjust speed in settings.
                    </p>
                  </div>

                  <button
                    onClick={handleEditScript}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Script
                  </button>
                </div>

                {/* Teleprompter Recorder */}
                {isUploading ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-12 text-center">
                    <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Uploading Your Pitch...
                    </h3>
                    <p className="text-gray-400">
                      This may take a few moments
                    </p>
                  </div>
                ) : (
                  <TeleprompterRecorder
                    script={script}
                    onRecordingComplete={handleRecordingComplete}
                    maxDuration={60}
                  />
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="share"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Step 3: Share */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Pitch Created Successfully!
                  </h2>
                  <p className="text-gray-400">
                    Your video pitch is now live and ready to share with recruiters
                  </p>
                </div>

                {/* Video Preview */}
                {videoPitchUrl && (
                  <div className="aspect-video bg-black rounded-xl overflow-hidden mb-8">
                    <video
                      src={videoPitchUrl}
                      controls
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* Public Link */}
                <div className="space-y-4 mb-8">
                  <label className="block text-sm font-semibold text-gray-300">
                    Your Public Pitch Link
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={publicLink}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-900 border border-gray-700 rounded-xl text-white focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Add this link to your CV, LinkedIn profile, or email signature
                  </p>
                </div>

                {/* Share Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={handleShareLinkedIn}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Share on LinkedIn
                  </button>

                  <button
                    onClick={() => window.open(`mailto:?subject=Check out my pitch&body=${publicLink}`, '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Email Link
                  </button>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>

                {/* Re-record Option */}
                <div className="text-center">
                  <button
                    onClick={() => setStep(1)}
                    className="text-gray-400 hover:text-white transition-all text-sm font-semibold"
                  >
                    Want to re-record? Start over →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoPitchStudio;
