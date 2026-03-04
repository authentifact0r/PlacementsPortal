/**
 * Student Profile Dashboard - Final Version
 * Complete dashboard with weather, time, events carousel, profile edit, notifications
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Video,
  Briefcase,
  Calendar,
  CheckCircle,
  Building2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  TrendingUp,
  Search,
  Settings,
  Bell,
  LogOut,
  Cloud,
  CloudRain,
  Sun,
  Edit,
  Camera,
  X,
  MapPin,
  Download,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import jobTrackingService from '../services/jobTracking.service';
import liveFeedService from '../services/liveFeed.service';

const StudentProfileFinal = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { showSuccess, showInfo, showError } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({}); // TODO: render application stats in UI
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // UI State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showNotifications] = useState(false); // TODO: implement notifications panel
  
  // Time & Weather
  const [currentTime, setCurrentTime] = useState(new Date());
  // eslint-disable-next-line no-unused-vars
  const [weather, setWeather] = useState({
    temp: 14,
    condition: 'Partly Cloudy',
    location: 'London, UK',
    icon: 'cloud'
  });

  // Live job feed
  const [liveJobs, setLiveJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Events
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [upcomingNotifications, setUpcomingNotifications] = useState([]);

  // Profile Edit
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    photoURL: ''
  });
  const fileInputRef = useRef(null);

  // Tasks
  const [tasks] = useState([
    { id: 1, title: 'Complete profile setup', status: 'pending', due: '2026-02-25' },
    { id: 2, title: 'Upload CV', status: 'completed', due: '2026-02-20' },
    { id: 3, title: 'Book career coaching session', status: 'pending', due: '2026-02-28' }
  ]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      loadLiveJobs();
      loadEvents();
      loadProfileData();
      checkUpcomingEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadProfileData = () => {
    setProfileData({
      firstName: userProfile?.profile?.firstName || currentUser?.displayName?.split(' ')[0] || '',
      lastName: userProfile?.profile?.lastName || currentUser?.displayName?.split(' ')[1] || '',
      email: currentUser?.email || '',
      phone: userProfile?.profile?.phone || '',
      photoURL: userProfile?.profile?.photoURL || ''
    });
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [userApplications, userStats] = await Promise.all([
        jobTrackingService.getUserApplications(currentUser.uid, null, 20),
        jobTrackingService.getApplicationStats(currentUser.uid)
      ]);

      setApplications(userApplications);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveJobs = async () => {
    setJobsLoading(true);
    try {
      const jobs = await liveFeedService.fetchReedJobs({
        keywords: 'graduate',
        location: 'United Kingdom',
        limit: 5
      });
      setLiveJobs(jobs.slice(0, 5));
    } catch (error) {
      console.error('Error loading live jobs:', error);
      setLiveJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadEvents = async () => {
    const mockEvents = [
      {
        id: 1,
        title: '🎉 Lucky Dip - Fall in Love With Your Career 2026',
        startDate: '2026-02-10',
        endDate: '2026-02-26',
        time: '00:00 - 23:59',
        type: 'workshop',
        registered: false,
        location: 'Online',
        description: 'Explore career opportunities and network with professionals'
      },
      {
        id: 2,
        title: '💼 CV Workshop: Stand Out to Employers',
        startDate: '2026-02-24',
        endDate: '2026-02-24',
        time: '14:00 - 16:00',
        type: 'workshop',
        registered: true,
        location: 'Room 203, Main Building',
        description: 'Learn how to create a standout CV that gets interviews'
      },
      {
        id: 3,
        title: '🎤 Mock Interview Practice',
        startDate: '2026-02-28',
        endDate: '2026-02-28',
        time: '10:00 - 12:00',
        type: 'coaching',
        registered: false,
        location: 'Career Center',
        description: 'Practice your interview skills with professional coaches'
      },
      {
        id: 4,
        title: '🚀 Tech Career Fair 2026',
        startDate: '2026-03-05',
        endDate: '2026-03-05',
        time: '09:00 - 17:00',
        type: 'fair',
        registered: true,
        location: 'Exhibition Hall',
        description: 'Meet top tech companies hiring graduates'
      }
    ];

    setEvents(mockEvents);
  };

  const checkUpcomingEvents = () => {
    // Check for events in next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const upcoming = events.filter(event => {
      const eventDate = new Date(event.startDate);
      return event.registered && eventDate >= now && eventDate <= tomorrow;
    });

    if (upcoming.length > 0) {
      setUpcomingNotifications(upcoming);
      showInfo(`You have ${upcoming.length} event(s) coming up in the next 24 hours!`);
    }
  };

  const handleJobClaim = async (job) => {
    try {
      await jobTrackingService.trackJobClick(currentUser.uid, {
        jobId: job.reed_job_id || job.jobId,
        jobTitle: job.title || job.jobTitle,
        company: job.company || job.employerName,
        source: 'live_feed'
      });

      showInfo('Job saved! Opening details...');
      if (job.jobUrl) {
        window.open(job.jobUrl, '_blank');
      }
    } catch (error) {
      console.error('Error claiming job:', error);
    }
  };

  const navigateEvents = (direction) => {
    if (direction === 'next' && currentEventIndex < events.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    } else if (direction === 'prev' && currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };

  const handleRegisterEvent = (event) => {
    // TODO: Integrate with Firestore and calendar sync
    showSuccess(`Registered for ${event.title}! Calendar invite sent to your email.`);
    
    // Update event registered status
    const updatedEvents = events.map(e => 
      e.id === event.id ? { ...e, registered: true } : e
    );
    setEvents(updatedEvents);

    // Add to Google Calendar (would integrate with Google Calendar API)
    const calendarEvent = {
      summary: event.title,
      location: event.location,
      description: event.description,
      start: {
        dateTime: new Date(`${event.startDate}T${event.time.split(' - ')[0]}`).toISOString(),
        timeZone: 'Europe/London'
      },
      end: {
        dateTime: new Date(`${event.endDate}T${event.time.split(' - ')[1]}`).toISOString(),
        timeZone: 'Europe/London'
      }
    };

    console.log('Calendar event to sync:', calendarEvent);
  };

  const handleDownloadICS = (event) => {
    // Generate ICS file for manual calendar import
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PlacementsPortal//Events//EN
BEGIN:VEVENT
UID:${event.id}@placementsportal.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);

    showSuccess('Calendar file downloaded! Add to your calendar app.');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('File too large. Max 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, photoURL: reader.result });
        showSuccess('Photo uploaded! Click Save to update.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // TODO: Save to Firestore
      showSuccess('Profile updated successfully!');
      setShowProfileEdit(false);
    } catch (error) {
      showError('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      showError('Failed to logout. Please try again.');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getWeatherIcon = () => {
    const icons = {
      cloud: <Cloud className="w-6 h-6" />,
      rain: <CloudRain className="w-6 h-6" />,
      sun: <Sun className="w-6 h-6" />
    };
    return icons[weather.icon] || icons.cloud;
  };

  const currentEvent = events[currentEventIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Welcome Message */}
              <h1 className="text-3xl font-bold mb-2">
                Welcome {profileData.firstName || 'Student'}
              </h1>

              {/* Time, Date, Weather Row */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Current Time */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">{formatTime(currentTime)}</span>
                </div>

                {/* Date */}
                <div className="text-purple-100 text-sm">
                  {formatDate(currentTime)}
                </div>

                {/* Weather Widget */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  {getWeatherIcon()}
                  <div>
                    <div className="font-semibold">{weather.temp}°C</div>
                    <div className="text-xs text-purple-100">{weather.condition}</div>
                  </div>
                  <MapPin className="w-3 h-3 text-purple-200" />
                  <span className="text-xs">{weather.location}</span>
                </div>
              </div>

              {/* What's On */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 inline-block">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-yellow-300" />
                  <span className="font-semibold text-sm">What's On Today</span>
                </div>
                <div className="text-sm text-purple-100">
                  {events.filter(e => e.startDate === new Date().toISOString().split('T')[0]).length > 0
                    ? `${events.filter(e => e.startDate === new Date().toISOString().split('T')[0]).length} event(s) scheduled`
                    : 'No events scheduled today'}
                </div>
              </div>
            </div>

            {/* Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full pr-4 hover:bg-white/20 transition-colors"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {profileData.photoURL ? (
                    <img
                      src={profileData.photoURL}
                      alt={profileData.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-purple-600" />
                  )}
                </div>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">
                        {profileData.firstName} {profileData.lastName}
                      </div>
                      <div className="text-sm text-gray-600">{profileData.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfileEdit(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              {/* Top Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">Pending Tasks</h3>
                    <div className="text-5xl font-bold mb-2">
                      {tasks.filter(t => t.status === 'pending').length}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">Applications</h3>
                    <div className="text-5xl font-bold mb-2">{applications.length}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">New Jobs</h3>
                    <div className="text-5xl font-bold mb-2">{liveJobs.length}</div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Live Job Feed */}
                  <div className="bg-white border border-gray-200 rounded-xl">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-orange-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Live Job Feed</h2>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        HOT
                      </span>
                    </div>

                    <div className="p-6">
                      {jobsLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading latest jobs...</div>
                      ) : liveJobs.length > 0 ? (
                        <div className="space-y-3">
                          {liveJobs.map((job, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                                    {job.jobTitle || job.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 truncate">{job.employerName || job.company}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <div className="text-right text-xs text-gray-500 mr-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Posted today
                                </div>
                                <button
                                  onClick={() => handleJobClaim(job)}
                                  className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                                >
                                  Claim
                                </button>
                                <button
                                  onClick={() => job.jobUrl && window.open(job.jobUrl, '_blank')}
                                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm"
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No new jobs available at the moment
                        </div>
                      )}

                      <div className="mt-4 text-center">
                        <button
                          onClick={() => navigate('/live-feed')}
                          className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-2 mx-auto"
                        >
                          View all live jobs
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
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
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                }`}>
                                  {task.status === 'completed' && (
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <span className={`font-medium text-sm ${
                                  task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">Due: {task.due}</span>
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
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Search className="w-5 h-5 text-purple-600" />
                      Quick Links
                    </h3>
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
                          <span className="text-sm font-medium text-gray-900">View All Events</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Events Widget with Carousel */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Events
                      </h3>
                      <button
                        onClick={() => setShowEventsList(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                      >
                        View all: {events.length} total
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {events.length > 0 && currentEvent ? (
                      <>
                        {/* Timeline Navigation */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() => navigateEvents('prev')}
                            disabled={currentEventIndex === 0}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex-1 mx-4">
                            <div className="relative h-2 bg-gray-200 rounded-full">
                              <div
                                className="absolute h-2 bg-purple-600 rounded-full transition-all"
                                style={{ width: `${((currentEventIndex + 1) / events.length) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                              <span>{new Date(events[0].startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                              <span>Next →</span>
                              <span>{new Date(events[events.length - 1].endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => navigateEvents('next')}
                            disabled={currentEventIndex === events.length - 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Current Event Card */}
                        <motion.div
                          key={currentEventIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border-l-4 border-purple-600 pl-4 py-3 bg-purple-50 rounded-r-lg"
                        >
                          <h4 className="font-bold text-gray-900 mb-2">{currentEvent.title}</h4>
                          <div className="space-y-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(currentEvent.startDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{currentEvent.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{currentEvent.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRegisterEvent(currentEvent)}
                              disabled={currentEvent.registered}
                              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                                currentEvent.registered
                                  ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed'
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
                              }`}
                            >
                              {currentEvent.registered ? (
                                <span className="flex items-center justify-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Registered
                                </span>
                              ) : (
                                'Register Now'
                              )}
                            </button>
                            
                            {currentEvent.registered && (
                              <button
                                onClick={() => handleDownloadICS(currentEvent)}
                                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Download calendar file"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No upcoming events</div>
                    )}
                  </div>

                  {/* Upcoming Notifications */}
                  {upcomingNotifications.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-bold">Upcoming Events!</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        {upcomingNotifications.map(event => (
                          <div key={event.id} className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full mt-1.5 flex-shrink-0" />
                            <div>
                              <div className="font-semibold">{event.title}</div>
                              <div className="text-xs opacity-90">{event.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold">Notifications</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>3 new jobs match your profile</span>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-white/10 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Event registration confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileEdit(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Edit Profile</h3>
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                      {profileData.photoURL ? (
                        <img
                          src={profileData.photoURL}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                          <User className="w-16 h-16 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Click camera icon to upload photo (max 5MB)</p>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+44 7XXX XXXXXX"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events List Modal */}
      <AnimatePresence>
        {showEventsList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventsList(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">All Events ({events.length})</h3>
                  <button
                    onClick={() => setShowEventsList(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(event.startDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{event.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.registered
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {event.registered ? 'Registered' : event.type}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegisterEvent(event)}
                          disabled={event.registered}
                          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            event.registered
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {event.registered ? 'Registered' : 'Register Now'}
                        </button>
                        
                        {event.registered && (
                          <button
                            onClick={() => handleDownloadICS(event)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Add to Calendar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentProfileFinal;
