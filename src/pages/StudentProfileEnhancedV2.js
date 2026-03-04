/**
 * Enhanced Student Profile Dashboard V2
 * Integrates events widget, live job feed, and explorability features
 * Based on university portal screenshot
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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  TrendingUp,
  Search,
  Settings,
  Bell,
  FileText,
  Bot,
  GraduationCap,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  Sun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import jobTrackingService from '../services/jobTracking.service';
import liveFeedService from '../services/liveFeed.service';
import { eventService } from '../services/event.service';
import CVOptimizerCard from '../components/CVOptimizerCard';
import PremiumGate from '../components/PremiumGate';
import AIApplierPanel from '../components/AIApplierPanel';
import CoachingBookingModal from '../components/CoachingBookingModal';
import { PRODUCTS } from '../services/stripe.service';

const StudentProfileEnhancedV2 = () => {
  const { currentUser, userProfile } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({}); // TODO: render application stats in UI
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // Live job feed
  const [liveJobs, setLiveJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Events
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  // Weather & Time
  const [weather, setWeather] = useState({ condition: 'sunny', temp: 18 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Coaching booking modal state
  const [coachingModalOpen, setCoachingModalOpen] = useState(false);
  const [selectedCoachSession, setSelectedCoachSession] = useState(null);

  // Mock data
  const [tasks] = useState([
    { id: 1, title: 'Complete profile setup', status: 'pending', due: '2026-02-25' },
    { id: 2, title: 'Upload CV', status: 'completed', due: '2026-02-20' },
    { id: 3, title: 'Book career coaching session', status: 'pending', due: '2026-02-28' }
  ]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      loadLiveJobs();
      loadEvents();
      loadWeather();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      // Fetch latest 5 jobs from Reed API
      const jobs = await liveFeedService.fetchReedJobs({
        keywords: 'graduate',
        location: 'United Kingdom',
        limit: 5
      });

      setLiveJobs(jobs.slice(0, 5)); // Top 5 most recent
    } catch (error) {
      console.error('Error loading live jobs:', error);
      setLiveJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const firestoreEvents = await eventService.getAll({ status: 'upcoming', limit: 10 });
      if (firestoreEvents && firestoreEvents.length > 0) {
        // Normalise Firestore event shape to match the widget's expected fields
        const normalised = firestoreEvents.map(ev => ({
          id: ev.id,
          title: ev.title || ev.name || 'Event',
          location: ev.location || ev.venue || '',
          startDate: ev.date instanceof Date
            ? ev.date.toISOString().split('T')[0]
            : ev.startDate || ev.date || '',
          endDate: ev.endDate || ev.date || '',
          time: ev.time || '',
          type: ev.type || 'event',
          registered: false, // TODO: check eventRegistrations per user
          description: ev.description || ''
        }));
        setEvents(normalised);
      }
      // If Firestore is empty the widget just shows nothing (graceful degradation)
    } catch (error) {
      console.error('Error loading events from Firestore:', error);
      // Fail silently — events panel will be empty rather than crashing
    }
  };

  const loadWeather = async () => {
    try {
      // Try to get user's location via geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Using geolocation:', { latitude, longitude });
            await fetchWeatherByCoords(latitude, longitude);
          },
          async (error) => {
            console.log('Geolocation denied, trying IP-based location...');
            // Fallback to IP-based location
            await fetchWeatherByIP();
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000 // Cache for 5 minutes
          }
        );
      } else {
        // No geolocation support, use IP-based location
        await fetchWeatherByIP();
      }
    } catch (error) {
      console.error('Error loading weather:', error);
      // Final fallback to sunny weather
      setWeather({ condition: 'sunny', temp: 18, location: 'Unknown' });
    }
  };

  const fetchWeatherByIP = async () => {
    try {
      // Use ipapi.co for IP-based geolocation (free, no key required)
      const ipResponse = await fetch('https://ipapi.co/json/');
      if (!ipResponse.ok) throw new Error('IP API failed');
      
      const ipData = await ipResponse.json();
      console.log('Using IP-based location:', { 
        city: ipData.city, 
        lat: ipData.latitude, 
        lon: ipData.longitude 
      });
      
      await fetchWeatherByCoords(ipData.latitude, ipData.longitude);
    } catch (error) {
      console.error('IP-based location failed, using London as fallback');
      // Final fallback to London
      await fetchWeatherByCoords(51.5074, -0.1278);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const API_KEY = '9c53121b8bdf63051c7c85fe47c7eee1'; // Free OpenWeatherMap key
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      
      if (!response.ok) throw new Error('Weather API failed');
      
      const data = await response.json();
      
      // Map OpenWeatherMap conditions to our weather types
      const weatherMain = data.weather[0].main.toLowerCase();
      let condition = 'sunny';
      
      if (weatherMain.includes('cloud')) {
        condition = 'cloudy';
      } else if (weatherMain.includes('rain')) {
        condition = 'rainy';
      } else if (weatherMain.includes('drizzle')) {
        condition = 'drizzle';
      } else if (weatherMain.includes('snow')) {
        condition = 'snowy';
      } else if (weatherMain.includes('clear')) {
        condition = 'sunny';
      }
      
      setWeather({
        condition,
        temp: Math.round(data.main.temp),
        location: data.name
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeather({ condition: 'sunny', temp: 18 });
    }
  };

  const getWeatherGradient = (condition) => {
    const gradients = {
      sunny: 'from-blue-400 via-blue-500 to-blue-600',
      cloudy: 'from-gray-400 via-gray-500 to-gray-600',
      rainy: 'from-blue-600 via-gray-600 to-gray-700',
      snowy: 'from-blue-200 via-blue-300 to-blue-400',
      drizzle: 'from-blue-400 via-gray-400 to-gray-500'
    };
    return gradients[condition] || gradients.sunny;
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      sunny: Sun,
      cloudy: Cloud,
      rainy: CloudRain,
      snowy: CloudSnow,
      drizzle: CloudDrizzle
    };
    return icons[condition] || Sun;
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
      
      // Navigate to job details
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

  // eslint-disable-next-line no-unused-vars
  const formatEventDate = (startDate, endDate) => { // TODO: use in events carousel render
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (startDate === endDate) {
      return formatDate(start);
    } else {
      return `From ${formatDate(start)} to ${formatDate(end)}`;
    }
  };

  const currentEvent = events[currentEventIndex];

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getWeatherGradient(weather.condition)} text-white pt-24 pb-8 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-start justify-between">
            {/* Left: Welcome + Weather */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  Welcome, {userProfile?.profile?.firstName || currentUser?.displayName?.split(' ')[0] || 'Student'}!
                </h1>
              </div>

              {/* Weather & Time Row */}
              <div className="flex items-center gap-6 mt-3">
                {/* Weather Widget */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <WeatherIcon className="w-6 h-6" />
                    <div>
                      <div className="text-2xl font-bold">{weather.temp}°C</div>
                      <div className="text-xs capitalize opacity-90">
                        {weather.condition} {weather.location && `• ${weather.location}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Widget */}
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                  <Clock className="w-6 h-6" />
                  <div>
                    <div className="text-2xl font-bold">
                      {currentTime.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: userTimezone
                      })}
                    </div>
                    <div className="text-xs opacity-90">
                      {currentTime.toLocaleDateString('en-GB', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short',
                        timeZone: userTimezone
                      })}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/studio')}
                  className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold ml-auto"
                >
                  <Video className="w-5 h-5" />
                  Create Elevated Pitch
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview',      label: 'Home',           icon: User       },
              { id: 'applications',  label: 'Applications',   icon: Briefcase  },
              { id: 'events',        label: 'Events',         icon: Calendar   },
              { id: 'tasks',         label: 'Tasks',          icon: CheckCircle},
              { id: 'cv-review',     label: 'CV Review',      icon: FileText,  premium: true },
              { id: 'coaching',      label: 'Coaching',       icon: GraduationCap, premium: true },
              { id: 'ai-applier',    label: 'AI Applier',     icon: Bot,       premium: true },
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
                  {tab.premium && (
                    <span className="ml-0.5 px-1.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full leading-none">
                      PRO
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

                      <a
                        href="/dashboard"
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Profile Settings</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Events Widget */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        Events
                      </h3>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                        View all: {events.length} total
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

                        {/* Current Event */}
                        <motion.div
                          key={currentEventIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border-l-4 border-purple-600 pl-4 py-3 bg-purple-50 rounded-r-lg"
                        >
                          <h4 className="font-bold text-gray-900 mb-2">{currentEvent.title}</h4>
                          
                          {/* Location */}
                          <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                            <Building2 className="w-4 h-4" />
                            <span className="font-semibold">{currentEvent.location}</span>
                          </div>

                          {/* Date & Time */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(currentEvent.startDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{currentEvent.time}</span>
                          </div>

                          {/* Description */}
                          {currentEvent.description && (
                            <p className="text-xs text-gray-600 mb-3 italic">{currentEvent.description}</p>
                          )}
                          
                          <button
                            className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                              currentEvent.registered
                                ? 'bg-green-100 text-green-700 border border-green-200'
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
                        </motion.div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-500">No upcoming events</div>
                    )}
                  </div>

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
          {/* ── CV Review Tab ────────────────────────────────────────────── */}
          {activeTab === 'cv-review' && (
            <motion.div
              key="cv-review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              <PremiumGate featureKey="cvReview" product={PRODUCTS.cvReview}>
                <CVOptimizerCard
                  hasAccess={true}
                  tokensRemaining={5}
                  onPurchase={() => {}}
                  onOptimizationComplete={() => {}}
                />
              </PremiumGate>
            </motion.div>
          )}

          {/* ── Coaching Tab ─────────────────────────────────────────────── */}
          {activeTab === 'coaching' && (
            <motion.div
              key="coaching"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PremiumGate featureKey="coaching" product={PRODUCTS.coaching}>
                {/* Coaching session cards */}
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Book a Coaching Session</h2>
                    <p className="text-gray-600 mt-1">Work 1-to-1 with a certified career coach to accelerate your career.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                      { name: 'CV & Application Review', type: 'CV Review', duration: '45 minutes', price: '£29.99', description: 'Get expert feedback on your CV and cover letters with tailored suggestions.', color: 'from-amber-400 to-orange-500' },
                      { name: 'Interview Preparation', type: 'Interview Prep', duration: '60 minutes', price: '£29.99', description: 'Practice common questions, get feedback, and build interview confidence.', color: 'from-blue-500 to-indigo-600' },
                      { name: 'Career Planning', type: 'Career Planning', duration: '60 minutes', price: '£29.99', description: 'Map out your career goals and build a strategy to reach them faster.', color: 'from-emerald-500 to-teal-600' },
                    ].map((session) => (
                      <div key={session.type} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`h-24 bg-gradient-to-br ${session.color} flex items-center justify-center`}>
                          <GraduationCap className="w-10 h-10 text-white opacity-80" />
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-gray-900 mb-1">{session.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />{session.duration}
                            </span>
                            <span className="font-bold text-gray-900">{session.price}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCoachSession(session);
                              setCoachingModalOpen(true);
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                          >
                            Book Session
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* My sessions list */}
                  <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      My Upcoming Sessions
                    </h3>
                    <p className="text-sm text-gray-500 text-center py-6">No upcoming sessions. Book one above to get started!</p>
                  </div>
                </div>
              </PremiumGate>

              {/* Coaching booking modal */}
              <CoachingBookingModal
                isOpen={coachingModalOpen}
                onClose={() => setCoachingModalOpen(false)}
                session={selectedCoachSession}
                onSuccess={() => setCoachingModalOpen(false)}
              />
            </motion.div>
          )}

          {/* ── AI Applier Tab ───────────────────────────────────────────── */}
          {activeTab === 'ai-applier' && (
            <motion.div
              key="ai-applier"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PremiumGate featureKey="aiApplier" product={PRODUCTS.aiApplier}>
                <AIApplierPanel />
              </PremiumGate>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentProfileEnhancedV2;
