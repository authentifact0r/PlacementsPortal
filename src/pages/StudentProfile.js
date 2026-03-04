/**
 * Student Profile Dashboard
 * Main dashboard for students with CV Optimizer integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  Calendar, 
  Award,
  FileText,
  Settings,
  Bell,
  Video
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import cvOptimizerService from '../services/cvOptimizer.service';
import CVOptimizerCard from '../components/CVOptimizerCard';
import CVOptimizationHistory from '../components/CVOptimizationHistory';
import { LoadingSpinner } from '../components/LoadingSpinner';

const StudentProfile = () => {
  const { currentUser, userProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [cvAccess, setCvAccess] = useState({
    hasAccess: false,
    tokensRemaining: 0,
    purchaseDate: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch CV Optimizer access status
  const fetchCVAccess = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const accessData = await cvOptimizerService.checkCVOptimizerAccess(currentUser.uid);
      setCvAccess(accessData);
    } catch (error) {
      console.error('Error fetching CV access:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCVAccess();
  }, [fetchCVAccess, refreshKey]);

  // Handle CV Optimizer purchase
  const handlePurchase = async () => {
    // TODO: Integrate with Stripe payment
    // For now, simulate purchase
    try {
      showInfo('Redirecting to payment...');
      
      // Simulate payment process
      setTimeout(async () => {
        try {
          await cvOptimizerService.purchaseCVOptimizer(currentUser.uid, 5, {
            method: 'stripe',
            paymentId: 'sim_' + Date.now()
          });
          
          showSuccess('CV Optimizer activated! You have 5 tokens.');
          setRefreshKey(prev => prev + 1); // Refresh access status
        } catch (error) {
          showError(error.message || 'Payment failed');
        }
      }, 1500);
    } catch (error) {
      showError('Failed to initiate payment');
    }
  };

  // Handle optimization complete
  const handleOptimizationComplete = useCallback(() => {
    showSuccess('CV optimized! Check your Application Log.');
    setRefreshKey(prev => prev + 1); // Refresh to update token count
  }, [showSuccess]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                {userProfile?.profile?.photoURL ? (
                  <img 
                    src={userProfile.profile.photoURL} 
                    alt={currentUser?.displayName || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold">
                  {userProfile?.profile?.firstName || currentUser?.displayName || 'Student'}
                  {' '}
                  {userProfile?.profile?.lastName || ''}
                </h1>
                <p className="text-purple-100">
                  {userProfile?.email || currentUser?.email}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => navigate('/dashboard/student/settings')}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'video-pitch', label: 'Elevated Pitch', icon: Video, badge: 'NEW' },
              { id: 'cv-optimizer', label: 'CV Optimizer', icon: FileText },
              { id: 'applications', label: 'Applications', icon: Briefcase },
              { id: 'events', label: 'My Events', icon: Calendar },
              { id: 'achievements', label: 'Achievements', icon: Award }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                    <div className="text-sm text-gray-600">Applications</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">5</div>
                    <div className="text-sm text-gray-600">Upcoming Events</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {cvAccess.tokensRemaining}
                    </div>
                    <div className="text-sm text-gray-600">CV Tokens</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CV Optimizer Preview */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI CV Optimizer</h3>
              <CVOptimizerCard
                hasAccess={cvAccess.hasAccess}
                tokensRemaining={cvAccess.tokensRemaining}
                onPurchase={handlePurchase}
                onOptimizationComplete={handleOptimizationComplete}
              />
            </div>
          </motion.div>
        )}

        {/* Elevated Pitch Tab */}
        {activeTab === 'video-pitch' && (
          <motion.div
            key="video-pitch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
                <Video className="w-5 h-5 text-red-500" />
                <span className="text-sm font-semibold text-red-600">Elevated Pitch Studio</span>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Stand Out with an Elevated Pitch
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                Create a professional 60-second video pitch that showcases your personality, skills, and passion. 
                Share it with recruiters on your CV or LinkedIn.
              </p>
            </div>

            {/* Elevated Pitch CTA Card */}
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left Side - Benefits */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Why Create an Elevated Pitch?</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-green-400 font-bold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Show Your Personality</h4>
                        <p className="text-sm text-gray-400">Let recruiters see the real you beyond your CV</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-400 font-bold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">AI-Generated Script</h4>
                        <p className="text-sm text-gray-400">Get a professional pitch script tailored to your profile</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-400 font-bold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Teleprompter Recording</h4>
                        <p className="text-sm text-gray-400">Record with an auto-scrolling script overlay</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-400 font-bold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Easy Sharing</h4>
                        <p className="text-sm text-gray-400">Get a public link to add to your CV or LinkedIn</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - CTA */}
                <div className="text-center">
                  <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video className="w-16 h-16 text-red-400" />
                  </div>
                  
                  <button
                    onClick={() => navigate('/studio')}
                    className="w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all mb-4"
                  >
                    Create Your Pitch Now
                  </button>

                  <p className="text-sm text-gray-400">
                    Takes only 5-10 minutes
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Generate Script</h4>
                  <p className="text-sm text-gray-600">
                    AI creates a personalized 45-second pitch based on your profile
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Record Video</h4>
                  <p className="text-sm text-gray-600">
                    Use the teleprompter to record your pitch with an auto-scrolling script
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Share Link</h4>
                  <p className="text-sm text-gray-600">
                    Get a public link to add to your CV, LinkedIn, or email signature
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CV Optimizer Tab */}
        {activeTab === 'cv-optimizer' && (
          <motion.div
            key="cv-optimizer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI CV Optimizer</h2>
              <p className="text-gray-600">
                Transform your CV with AI-powered optimization and track your application outcomes
              </p>
            </div>

            <CVOptimizerCard
              hasAccess={cvAccess.hasAccess}
              tokensRemaining={cvAccess.tokensRemaining}
              onPurchase={handlePurchase}
              onOptimizationComplete={handleOptimizationComplete}
            />

            {cvAccess.hasAccess && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Application Log</h3>
                <CVOptimizationHistory />
              </div>
            )}
          </motion.div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <motion.div
            key="applications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
            <CVOptimizationHistory />
          </motion.div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Events</h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-2">No events registered</p>
              <p className="text-sm text-gray-500 mb-4">
                Browse and register for upcoming events in the Community section
              </p>
              <button
                onClick={() => navigate('/community')}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
              >
                Browse Events
              </button>
            </div>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements</h2>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold mb-2">No achievements yet</p>
              <p className="text-sm text-gray-500">
                Complete actions to unlock badges and achievements
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
