/**
 * Enhanced Student Profile Dashboard
 * Based on Molty's screenshot - includes job tracking, tasks, events
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Video,
  Briefcase,
  Calendar,
  CheckCircle,
  Building2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import jobTrackingService from '../services/jobTracking.service';

const StudentProfileEnhanced = () => {
  const { currentUser, userProfile } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [clicks, setClicks] = useState([]); // TODO: render click analytics in UI
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({}); // TODO: render application stats in UI
  const [loading, setLoading] = useState(true);

  // Mock data for demo (replace with real data)
  const [tasks] = useState([
    { id: 1, title: 'Complete profile setup', status: 'pending', due: '2026-02-25' },
    { id: 2, title: 'Upload CV', status: 'completed', due: '2026-02-20' },
    { id: 3, title: 'Book career coaching session', status: 'pending', due: '2026-02-28' }
  ]);

  const [upcomingEvents] = useState([
    {
      id: 1,
      title: 'Lucky Dip - Fall in Love With Your Career 2026',
      date: '2026-02-10',
      time: '00:00 - 23:59',
      duration: 'Feb 10-26, 2026',
      type: 'workshop'
    }
  ]);

  const [newJobs] = useState([
    {
      id: 1,
      title: 'Graduate Conference Producer',
      company: 'Graduate Recruitment Bureau',
      posted: '20-Feb-2026',
      time: '12:38',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Graduate Tax Trainee - September 2026',
      company: 'Graduate Recruitment Bureau',
      posted: '20-Feb-2026',
      time: '12:13',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Accounting Graduate Scheme',
      company: 'Graduate Recruitment Bureau',
      posted: '20-Feb-2026',
      time: '11:45',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user's applications and clicks
      const [userApplications, userClicks, userStats] = await Promise.all([
        jobTrackingService.getUserApplications(currentUser.uid, null, 20),
        jobTrackingService.getUserClicks(currentUser.uid, 50),
        jobTrackingService.getApplicationStats(currentUser.uid)
      ]);

      setApplications(userApplications);
      setClicks(userClicks);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewJob = (job) => {
    navigate(`/opportunities/${job.jobId || job.id}`);
  };

  const handleClaimJob = async (job) => {
    try {
      // Track the click
      await jobTrackingService.trackJobClick(currentUser.uid, {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        source: 'platform'
      });

      showInfo('Job saved! Opening details...');
      navigate(`/opportunities/${job.id}`);
    } catch (error) {
      console.error('Error claiming job:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pt-12 pb-8">
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

            <button
              onClick={() => navigate('/studio')}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold"
            >
              <Video className="w-5 h-5" />
              Create Elevated Pitch
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Home', icon: User },
              { id: 'applications', label: 'Applications', icon: Briefcase },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-2 py-4 border-b-2 font-semibold text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview/Home Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Top Stats Cards (like screenshot) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending Tasks Card */}
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">Pending Tasks</h3>
                    <div className="text-5xl font-bold mb-2">
                      {tasks.filter(t => t.status === 'pending').length}
                    </div>
                  </div>
                </div>

                {/* Applications Card */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">Applications</h3>
                    <div className="text-5xl font-bold mb-2">{applications.length}</div>
                  </div>
                </div>

                {/* New Jobs Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">New Jobs</h3>
                    <div className="text-5xl font-bold mb-2">{newJobs.length}</div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Manage Jobs Board */}
                  <div className="bg-white border border-gray-200 rounded-xl">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Manage Jobs Board</h2>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                        Pending: {newJobs.length}
                      </span>
                    </div>

                    <div className="p-6 space-y-4">
                      {newJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{job.title}</h3>
                              <p className="text-sm text-gray-600">{job.company}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm text-gray-600 mr-2">
                              <div>{job.posted}</div>
                              <div className="text-xs">{job.time}</div>
                            </div>
                            <button
                              onClick={() => handleClaimJob(job)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                            >
                              Claim
                            </button>
                            <button
                              onClick={() => handleViewJob(job)}
                              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}

                      {newJobs.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          No new jobs available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* My Tasks */}
                  <div className="bg-white border border-gray-200 rounded-xl">
                    <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">My Tasks</h2>
                    </div>

                    <div className="p-6">
                      {tasks.length > 0 ? (
                        <div className="space-y-3">
                          {tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                  {task.status === 'completed' && (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <span className={`font-medium ${
                                  task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">Due: {task.due}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">No tasks found</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Sidebar (1/3 width) */}
                <div className="space-y-6">
                  {/* Quick Links */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
                    <div className="space-y-2">
                      <a
                        href="/opportunities"
                        className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">Browse Jobs</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                      </a>

                      <a
                        href="/studio"
                        className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-900">Create Elevated Pitch</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </a>

                      <a
                        href="/community/events"
                        className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">View Events</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Events</h3>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                        View all: 85 total
                      </button>
                    </div>

                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="border-l-4 border-purple-600 pl-4 py-3 bg-purple-50 rounded-r-lg">
                        <h4 className="font-bold text-gray-900 mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date} • {event.time}</span>
                        </div>
                        <p className="text-xs text-gray-500">From {event.duration}</p>
                      </div>
                    ))}
                  </div>

                  {/* Application Stats */}
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-bold mb-4">Your Progress</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Applications</span>
                          <span className="text-sm font-bold">{applications.length}</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full" style={{ width: `${Math.min((applications.length / 20) * 100, 100)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Profile Complete</span>
                          <span className="text-sm font-bold">75%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div className="bg-white h-2 rounded-full" style={{ width: '75%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentProfileEnhanced;
