/**
 * Enhanced Student Profile Dashboard V2
 * Integrates events widget, live job feed, and explorability features
 * Based on university portal screenshot
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Sun,
  Mic,
  Compass,
  Star,
  Shield,
  Award,
  Quote,
  Loader2,
  Sparkles,
  Linkedin,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
// Direct Firestore write to users/{uid}/applications bypasses ApplicationContext
import { unlockAllPremium } from '../utils/unlockPremium';
import jobTrackingService from '../services/jobTracking.service';
import liveFeedService, { fetchReedJobsWithRetry } from '../services/liveFeed.service';
import { collection, query, orderBy, limit as fbLimit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { eventService } from '../services/event.service';
import ATSCVBuilder from '../components/ATSCVBuilder';
import PremiumGate from '../components/PremiumGate';
import AIApplierPanel from '../components/AIApplierPanel';
import CoachingBookingModal from '../components/CoachingBookingModal';
import coachingService from '../services/coaching.service';
import { PRODUCTS } from '../services/stripe.service';
import JobTrackerWidget from '../components/JobTrackerWidget';
import JobTracker from './JobTracker';
import EventsDiscoveryPanel from '../components/EventsDiscoveryPanel';

const StudentProfileEnhancedV2 = () => {
  const { currentUser, userProfile } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive initial tab from URL path (e.g. /dashboard/student/cv-review → 'cv-review')
  const getTabFromPath = () => {
    const segments = location.pathname.split('/');
    const lastSeg = segments[segments.length - 1];
    const validTabs = ['overview', 'applications', 'events', 'tasks', 'cv-review', 'coaching', 'ai-applier'];
    return validTabs.includes(lastSeg) ? lastSeg : 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);

  // Keep activeTab in sync when URL changes (e.g. from Career Progress checklist clicks)
  useEffect(() => {
    const tabFromUrl = getTabFromPath();
    setActiveTab(tabFromUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
  const [mySessions, setMySessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showCoachingCrossSell, setShowCoachingCrossSell] = useState(false);

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

  // Refresh live feed every 5 minutes so users see fresh jobs
  useEffect(() => {
    if (!currentUser) return;
    const feedTimer = setInterval(() => {
      loadLiveJobs();
    }, 5 * 60 * 1000);
    return () => clearInterval(feedTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Fetch coaching sessions when coaching tab is active
  useEffect(() => {
    if (activeTab !== 'coaching' || !currentUser) return;
    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const sessions = await coachingService.getSessionsByStudent(currentUser.uid);
        setMySessions(sessions);
      } catch (err) {
        console.error('Error loading coaching sessions:', err);
      } finally {
        setSessionsLoading(false);
      }
    };
    loadSessions();
  }, [activeTab, currentUser]);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [userApplications, userStats] = await Promise.all([
        jobTrackingService.getUserApplications(currentUser.uid, null, 100),
        jobTrackingService.getApplicationStats(currentUser.uid)
      ]);

      setApplications(userApplications);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Detect profile-based keywords for personalised job feed
  const getProfileSearchKeywords = () => {
    const p = userProfile?.profile || {};
    const signals = [p.industry, p.headline, p.title, p.degree, p.course, p.bio, ...(Array.isArray(p.skills) ? p.skills : [])]
      .filter(Boolean).join(' ').toLowerCase();

    if (!signals.trim()) return 'graduate';

    const rules = [
      { match: ['software', 'developer', 'coding', 'fullstack', 'frontend', 'backend', 'javascript', 'python', 'react', 'programming', 'computer science'], kw: 'graduate software developer engineer' },
      { match: ['data', 'analyst', 'analytics', 'machine learning', 'statistics', 'data science'], kw: 'graduate data analyst scientist' },
      { match: ['civil', 'mechanical', 'electrical', 'structural', 'engineer', 'engineering', 'automotive', 'aerospace'], kw: 'graduate civil mechanical electrical engineer' },
      { match: ['finance', 'accountant', 'accounting', 'banking', 'actuarial', 'financial', 'audit', 'tax'], kw: 'graduate finance accountant analyst' },
      { match: ['marketing', 'digital marketing', 'content', 'social media', 'seo', 'advertising', 'brand'], kw: 'graduate marketing digital content' },
      { match: ['healthcare', 'nhs', 'nursing', 'clinical', 'medical', 'pharmacy', 'health', 'biomedical'], kw: 'graduate healthcare NHS clinical' },
      { match: ['law', 'legal', 'solicitor', 'barrister', 'paralegal', 'criminology'], kw: 'graduate solicitor legal paralegal law' },
      { match: ['business', 'management', 'consultant', 'consulting', 'strategy', 'mba'], kw: 'graduate business consultant management' },
      { match: ['design', 'ux', 'ui', 'graphic', 'creative', 'illustration', 'art', 'visual'], kw: 'graduate designer UX creative graphic' },
      { match: ['hr', 'human resources', 'recruitment', 'talent', 'people'], kw: 'graduate HR human resources recruitment' },
      { match: ['sales', 'business development', 'account manager', 'retail'], kw: 'graduate sales business development' },
    ];

    for (const rule of rules) {
      if (rule.match.some(m => signals.includes(m.toLowerCase()))) return rule.kw;
    }
    return 'graduate';
  };

  const loadLiveJobs = async () => {
    setJobsLoading(true);
    try {
      // Fetch from both Reed API and Firestore synced jobs in parallel
      const [reedJobs, firestoreSnap] = await Promise.allSettled([
        fetchReedJobsWithRetry({
          keywords: getProfileSearchKeywords(),
          location: 'London',
          limit: 5,
        }),
        getDocs(query(
          collection(db, 'jobs'),
          orderBy('createdAt', 'desc'),
          fbLimit(50)
        )),
      ]);

      // Normalise Reed jobs
      const reed = (reedJobs.status === 'fulfilled' ? reedJobs.value : [])
        .slice(0, 3)
        .map(j => ({
          title: j.jobTitle || j.title,
          company: j.employerName || j.company,
          source: 'reed',
          source_url: j.source_url || j.jobUrl || '',
          posted_at: j.date || j.posted_at || new Date().toISOString(),
        }));

      // Normalise Firestore jobs (SerpApi, JobsPikr, Reed synced)
      const synced = (firestoreSnap.status === 'fulfilled'
        ? firestoreSnap.value.docs.map(d => d.data())
        : []
      )
        .filter(j => j.status !== 'expired' && j.status !== 'inactive')
        .map(j => ({
          title: j.title || 'Graduate Role',
          company: j.company || 'Unknown',
          source: j.source || 'synced',
          source_url: j.sourceUrl || j.url || '',
          posted_at: j.postedAt?.toDate ? j.postedAt.toDate().toISOString() : (j.postedAt || new Date().toISOString()),
        }));

      // Deduplicate by title+company, then shuffle to mix providers
      const seen = new Set();
      const all = [...reed, ...synced].filter(j => {
        const key = `${(j.title || '').toLowerCase().trim()}::${(j.company || '').toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Shuffle for variety
      for (let i = all.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [all[i], all[r]] = [all[r], all[i]];
      }

      setLiveJobs(all.slice(0, 6)); // Show 6 diverse jobs
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
      const jobId = job.reed_job_id || job.jobId || `claimed-${Date.now()}`;
      const sourceUrl = job.source_url || '';

      // Write to job_applications — the SINGLE source of truth for both
      // the Home dashboard counter AND the Job Tracker page (via ApplicationContext).
      await jobTrackingService.trackJobApplication(currentUser.uid, {
        jobId,
        jobTitle: job.title || job.jobTitle,
        company: job.company || job.employerName,
        location: job.location || '',
        source: job.source || 'live_feed',
      }, {
        method: 'saved',
        status: 'saved',
        notes: 'Saved from Live Job Feed',
        sourceUrl,
      });

      // Track the click for analytics (non-critical)
      jobTrackingService.trackJobClick(currentUser.uid, {
        jobId,
        jobTitle: job.title || job.jobTitle,
        company: job.company || job.employerName,
        source: job.source || 'live_feed',
      }).catch(() => {});

      showInfo('Job saved! View it in your Applications tab.');

      // Remove the claimed job from the feed for immediate feedback
      setLiveJobs(prev => prev.filter(j =>
        (j.title) !== (job.title) || (j.company) !== (job.company)
      ));

      // Refresh applications count silently so Job Tracker card + progress updates
      loadDashboardData(true);
    } catch (error) {
      console.error('Error claiming job:', error?.code, error?.message, error);
      showInfo(`Could not save job — ${error?.code || error?.message || 'unknown error'}. Please try again.`);
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

  // ── Career Progress computation (dynamic from Firestore data) ─────────────
  const progressItems = useMemo(() => {
    const pd = userProfile?.profileData || {};
    const hasSkills = (pd.skills || []).filter(s => s.name?.trim()).length > 0;
    const hasEducation = (pd.education || []).filter(e => e.degree?.trim() || e.institution?.trim()).length > 0;
    const hasQualities = (pd.qualities || []).filter(q => q.name?.trim()).length > 0;
    const profileDone = hasSkills && hasEducation && hasQualities;

    const hasCv = !!(userProfile?.cvSyncData?.lastSynced);

    const savedCount = applications.filter(a => a.status === 'saved').length;
    const appliedCount = applications.filter(a =>
      ['applied', 'interview', 'offer'].includes(a.status)
    ).length;

    const hasVideoPitch = !!(userProfile?.video_pitch_url);

    const totalTracked = savedCount + appliedCount;

    return [
      { label: 'Complete your profile',         done: profileDone,         action: '/complete-profile',             icon: '👤' },
      { label: 'Upload or optimise your CV',    done: hasCv,               action: '/dashboard/student/cv-review',  icon: '📄' },
      { label: 'Browse & save 5 jobs',          done: totalTracked >= 5,   action: '/opportunities',                icon: '🔍' },
      { label: 'Book a coaching session',       done: false,               action: '/dashboard/student/coaching',   icon: '🎓' },
      { label: 'Record a video pitch',          done: hasVideoPitch,       action: '/studio',                       icon: '🎬' },
      { label: 'Build your Career Passport',    done: false,               action: '/career-passport',              icon: '🛂' },
    ];
  }, [userProfile, applications]);

  const doneCount = progressItems.filter(i => i.done).length;
  const progressPct = Math.round((doneCount / progressItems.length) * 100);

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="bg-gray-50" style={{ minHeight: '100%' }}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${getWeatherGradient(weather.condition)} text-white pt-6 pb-8 relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10" style={{ maxWidth: 'min(80rem, 100%)' }}>
          <div className="flex items-start justify-between">
            {/* Left: Welcome + Weather */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  Welcome, {userProfile?.profile?.firstName || currentUser?.displayName?.split(' ')[0] || 'Student'}!
                </h1>
                {/* DEV ONLY: Unlock PRO — remove before production */}
                {currentUser && (
                  <button
                    onClick={async () => {
                      try {
                        await unlockAllPremium(currentUser.uid);
                        showInfo('PRO unlocked! Refresh the page to see changes.');
                        setTimeout(() => window.location.reload(), 1500);
                      } catch (err) {
                        console.error('Unlock failed:', err);
                      }
                    }}
                    className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold hover:bg-yellow-300 transition-colors"
                  >
                    Unlock PRO
                  </button>
                )}
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

      {/* Navigation Tabs — sticky below fixed navbar (5rem = h-20) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: 'min(80rem, 100%)' }}>
          <nav className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { id: 'overview',      label: 'Home',           icon: User       },
              { id: 'applications',  label: 'Applications',   icon: Briefcase  },
              { id: 'events',        label: 'Events',         icon: Calendar   },
              { id: 'tasks',         label: 'Tasks',          icon: CheckCircle},
              { id: 'cv-review',     label: 'CV Review',      icon: FileText,  premium: true },
              { id: 'coaching',      label: 'Coaching',       icon: GraduationCap, premium: true },
              { id: 'ai-applier',    label: 'AI Concierge',   icon: Bot,       premium: true },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    navigate(tab.id === 'overview' ? '/dashboard/student' : `/dashboard/student/${tab.id}`, { replace: true });
                  }}
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

      {/* Content — full-width for CV Builder, constrained for other tabs */}
      <div className={activeTab === 'cv-review' ? 'w-full' : 'w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'} style={activeTab === 'cv-review' ? {} : { maxWidth: 'min(80rem, 100%)' }}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold mb-2">Pending Tasks</h3>
                    <div className="text-5xl font-bold mb-2">
                      {tasks.filter(t => t.status === 'pending').length}
                    </div>
                  </div>
                </div>

                <div
                  className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all"
                  onClick={() => { setActiveTab('applications'); navigate('/dashboard/student/applications', { replace: true }); }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">Job Tracker</h3>
                      <span className="text-xs bg-white/20 rounded-full px-2.5 py-0.5">View All →</span>
                    </div>
                    <div className="text-4xl font-bold mb-3">{applications.length}<span className="text-lg font-normal ml-1 text-white/70">applications tracked</span></div>

                    {/* Status breakdown */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Saved', count: applications.filter(a => a.status === 'saved').length, icon: '💾' },
                        { label: 'Applied', count: applications.filter(a => a.status === 'applied').length, icon: '📨' },
                        { label: 'Interview', count: applications.filter(a => a.status === 'interview').length, icon: '🎤' },
                        { label: 'Offer', count: applications.filter(a => a.status === 'offer').length, icon: '🎉' },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/15 rounded-lg py-2 px-1">
                          <div className="text-lg font-bold">{s.count}</div>
                          <div className="text-[10px] text-white/70">{s.label}</div>
                        </div>
                      ))}
                    </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={loadLiveJobs}
                          disabled={jobsLoading}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {jobsLoading ? 'Loading...' : 'Refresh'}
                        </button>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          LIVE
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      {jobsLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading latest jobs...</div>
                      ) : liveJobs.length > 0 ? (
                        <div className="space-y-3">
                          {liveJobs.map((job, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/50 transition-all group cursor-default"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  job.source === 'reed' ? 'bg-green-600' :
                                  job.source === 'serpapi' ? 'bg-blue-600' :
                                  job.source === 'jobspikr' ? 'bg-orange-600' :
                                  'bg-purple-600'
                                }`}>
                                  <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 truncate">{job.company}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                <div className="text-right text-xs text-gray-500 mr-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Posted today
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJobClaim(job);
                                  }}
                                  className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:scale-95 transition-all font-semibold text-sm cursor-pointer select-none"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = job.source_url;
                                    if (url && url !== '#' && !url.includes('undefined')) {
                                      window.open(url, '_blank');
                                    } else {
                                      // Fallback to Google Jobs search instead of Reed
                                      const q = encodeURIComponent((job.title || 'graduate') + ' ' + (job.company || '') + ' job');
                                      window.open(`https://www.google.com/search?q=${q}&ibp=htl;jobs`, '_blank');
                                    }
                                  }}
                                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm cursor-pointer select-none"
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
                          onClick={() => {
                            const kw = encodeURIComponent(getProfileSearchKeywords());
                            navigate(`/live-feed?keywords=${kw}`);
                          }}
                          className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-2 mx-auto"
                        >
                          View all live jobs
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* My Events */}
                  <div className="bg-white border border-gray-200 rounded-xl">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">My Events</h2>
                      </div>
                      <a
                        href="/community/events"
                        className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                      >
                        Browse all
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="p-6">
                      {events.length > 0 ? (
                        <div className="space-y-3">
                          {events.slice(0, 4).map((event, idx) => (
                            <div
                              key={idx}
                              onClick={() => navigate('/community/events')}
                              className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer group"
                            >
                              {/* Date badge */}
                              <div className="flex-shrink-0 w-12 h-14 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center group-hover:border-purple-300">
                                <span className="text-xs font-semibold text-purple-600 uppercase">
                                  {new Date(event.startDate).toLocaleDateString('en-GB', { month: 'short' })}
                                </span>
                                <span className="text-lg font-bold text-gray-900 leading-tight">
                                  {new Date(event.startDate).getDate()}
                                </span>
                              </div>

                              {/* Event info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 truncate group-hover:text-purple-700">
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{event.time || 'TBC'}</span>
                                  <span className="text-gray-300">|</span>
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{event.location || 'Online'}</span>
                                </div>
                                {event.registered && (
                                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    Registered
                                  </span>
                                )}
                              </div>

                              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 flex-shrink-0 mt-2" />
                            </div>
                          ))}
                          {events.length > 4 && (
                            <p className="text-center text-xs text-gray-400 pt-1">
                              + {events.length - 4} more event{events.length - 4 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm mb-3">No upcoming events yet</p>
                          <a
                            href="/community/events"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                          >
                            Discover events
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Sidebar (1/3 width) */}
                <div className="space-y-6">
                  {/* Notifications — top of sidebar */}
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center relative">
                        <Bell className="w-5 h-5" />
                        {(liveJobs.length > 0 || events.length > 0) && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                            {(liveJobs.length > 0 ? 1 : 0) + (events.length > 0 ? 1 : 0) + 1}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold">Notifications</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      {liveJobs.length > 0 && (
                        <div
                          onClick={() => {
                            const kw = encodeURIComponent(getProfileSearchKeywords());
                            navigate(`/live-feed?keywords=${kw}`);
                          }}
                          className="flex items-start gap-2 p-2.5 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors group"
                        >
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
                          <div className="flex-1">
                            <span className="group-hover:underline">{liveJobs.length} new job{liveJobs.length !== 1 ? 's' : ''} match your profile</span>
                            <p className="text-xs text-white/60 mt-0.5">Tap to view personalised jobs</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      {events.length > 0 && (
                        <div
                          onClick={() => navigate('/community/events')}
                          className="flex items-start gap-2 p-2.5 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors group"
                        >
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="group-hover:underline">{events.length} upcoming event{events.length !== 1 ? 's' : ''}</span>
                            <p className="text-xs text-white/60 mt-0.5">Tap to browse events</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div
                        onClick={() => { setActiveTab('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="flex items-start gap-2 p-2.5 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors group"
                      >
                        <div className="w-2 h-2 bg-blue-300 rounded-full mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="group-hover:underline">Complete your career checklist</span>
                          <p className="text-xs text-white/60 mt-0.5">Track your progress below</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>

                  {/* Career Progress — primary sidebar navigation */}
                  {(() => {
                    // SVG circular gauge values
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const gaugeOffset = circumference - (progressPct / 100) * circumference;

                    return (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            Career Progress
                          </h3>
                          <span className="text-xs text-gray-400">{doneCount}/{progressItems.length} complete</span>
                        </div>

                        {/* Circular progress gauge */}
                        <div className="flex items-center justify-center mb-5">
                          <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                              <circle cx="48" cy="48" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="7" />
                              <circle
                                cx="48" cy="48" r={radius} fill="none"
                                stroke="url(#progressGrad)" strokeWidth="7" strokeLinecap="round"
                                strokeDasharray={circumference} strokeDashoffset={gaugeOffset}
                                className="transition-all duration-1000 ease-out"
                              />
                              <defs>
                                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-gray-900">{progressPct}%</span>
                              <span className="text-[10px] text-gray-400 -mt-0.5">complete</span>
                            </div>
                          </div>
                        </div>

                        {/* Checklist items */}
                        <div className="space-y-2">
                          {progressItems.map((item, i) => (
                            <div
                              key={i}
                              onClick={() => navigate(item.action)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg text-xs transition-all cursor-pointer group ${
                                item.done
                                  ? 'bg-green-50 hover:bg-green-100'
                                  : 'bg-gray-50 hover:bg-purple-50 hover:border-purple-200 border border-transparent'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                item.done ? 'bg-green-500' : 'bg-gray-200 group-hover:bg-purple-200'
                              }`}>
                                {item.done ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <span className="text-xs">{item.icon}</span>}
                              </div>
                              <span className={`flex-1 ${item.done ? 'text-green-700 line-through' : 'text-gray-700 font-medium group-hover:text-purple-700'}`}>
                                {item.label}
                              </span>
                              <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-all opacity-0 group-hover:opacity-100 ${
                                item.done ? 'text-green-500' : 'text-purple-500 group-hover:translate-x-0.5'
                              }`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* (Job Tracker Widget removed — consolidated into top stats card) */}

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
            >
              <PremiumGate featureKey="cvReview" product={PRODUCTS.cvReview}>
                <ATSCVBuilder />
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
                <div className="max-w-5xl mx-auto space-y-6">

                  {/* ─── My Sessions (TOP) ─── */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" aria-hidden="true" />
                        My Sessions
                      </h3>
                      <button
                        onClick={() => setShowCoachingCrossSell(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-md hover:shadow-purple-500/20 transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                      >
                        <Zap className="w-4 h-4" aria-hidden="true" />
                        Book a Session
                      </button>
                    </div>

                    {sessionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" aria-label="Loading sessions" />
                      </div>
                    ) : mySessions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-purple-400" aria-hidden="true" />
                        </div>
                        <p className="font-semibold text-gray-700 mb-1">No sessions yet</p>
                        <p className="text-sm text-gray-500 mb-4">Book your first coaching session to get started on your career journey.</p>
                        <button
                          onClick={() => setShowCoachingCrossSell(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 min-h-[44px]"
                        >
                          Book Your First Session
                          <ArrowRight className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3" role="list" aria-label="Your coaching sessions">
                        {mySessions.map((s) => {
                          const statusStyles = {
                            pending: 'bg-amber-100 text-amber-800',
                            confirmed: 'bg-green-100 text-green-800',
                            completed: 'bg-blue-100 text-blue-800',
                            cancelled: 'bg-gray-100 text-gray-600',
                          };
                          const sessionDate = s.date instanceof Date ? s.date : (s.date ? new Date(s.date) : null);
                          return (
                            <div key={s.id} role="listitem" className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Video className="w-5 h-5 text-purple-600" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{s.sessionType || 'Coaching Session'}</p>
                                <p className="text-xs text-gray-500">
                                  {sessionDate ? sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBC'}
                                  {s.time && ` at ${s.time}`}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[s.status] || statusStyles.pending}`}
                                aria-label={`Status: ${s.status || 'pending'}`}
                              >
                                {(s.status || 'pending').charAt(0).toUpperCase() + (s.status || 'pending').slice(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ─── Testimonials ─── */}
                  <div role="region" aria-label="Student testimonials" className="bg-gray-50 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Quote className="w-5 h-5 text-purple-500" aria-hidden="true" />
                      What Students Say
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { quote: 'The CV review session completely transformed my applications. I got 3 interviews within a week!', name: 'Emily T.', role: 'Marketing Graduate', rating: 5 },
                        { quote: 'James helped me nail my Goldman Sachs interview. Best investment in my career so far.', name: 'David K.', role: 'Finance Graduate', rating: 5 },
                        { quote: 'Amara\'s career planning session gave me clarity on my next steps. Highly recommended for anyone feeling stuck.', name: 'Priya S.', role: 'Computer Science Graduate', rating: 5 },
                      ].map((t, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                          <div className="flex gap-0.5 mb-2">
                            {Array.from({ length: t.rating }).map((_, j) => (
                              <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                            ))}
                          </div>
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed italic">"{t.quote}"</p>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                            <p className="text-xs text-gray-500">{t.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── Meet Your Coaches ─── */}
                  <div aria-label="Coach profiles">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Meet Your Coaches</h3>
                    <div className="flex gap-4 overflow-x-auto snap-x pb-2 -mx-1 px-1">
                      {[
                        { initials: 'SK', name: 'Sarah K.', speciality: 'CV & Applications', rating: 4.9, bio: 'Former graduate recruiter at Deloitte with 8+ years in talent acquisition. Specialises in financial services and consulting CVs.', color: 'from-purple-500 to-indigo-600' },
                        { initials: 'JM', name: 'James M.', speciality: 'Interview Coaching', rating: 4.8, bio: 'Certified career coach and ex-HR director. Has prepared 200+ candidates for FAANG and Big 4 interviews.', color: 'from-blue-500 to-cyan-600' },
                        { initials: 'AP', name: 'Amara Patel', speciality: 'Career Strategy', rating: 4.9, bio: 'Career strategist and LinkedIn Top Voice. Helps graduates navigate career pivots and build personal brands.', color: 'from-emerald-500 to-teal-600' },
                      ].map((coach) => (
                        <motion.div
                          key={coach.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="min-w-[280px] snap-start bg-white border border-gray-200 rounded-2xl p-5 flex-shrink-0 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${coach.color} flex items-center justify-center text-white font-bold text-sm`}>
                              {coach.initials}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{coach.name}</p>
                              <p className="text-xs text-gray-500">{coach.speciality}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" aria-hidden="true" />
                            <span className="text-sm font-semibold text-gray-900">{coach.rating}</span>
                            <span className="text-xs text-gray-400 ml-1">rating</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{coach.bio}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                </div>

              {/* ─── Cross-Sell Popup: "Invest in Your Career" ─── */}
              <AnimatePresence>
                {showCoachingCrossSell && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowCoachingCrossSell(false)}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                      aria-hidden="true"
                    />
                    <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Book a coaching session">
                      <div className="flex min-h-full items-start justify-center p-4 pt-6 sm:pt-10">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 20 }}
                          className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setShowCoachingCrossSell(false);
                            /* Focus trap */
                            if (e.key === 'Tab') {
                              const modal = e.currentTarget;
                              const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                              if (focusable.length === 0) return;
                              const first = focusable[0];
                              const last = focusable[focusable.length - 1];
                              if (e.shiftKey) {
                                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
                              } else {
                                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
                              }
                            }
                          }}
                          tabIndex={-1}
                          ref={(el) => el?.focus()}
                        >
                          {/* Close button */}
                          <button
                            onClick={() => setShowCoachingCrossSell(false)}
                            aria-label="Close coaching services modal"
                            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-20 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
                          >
                            <span className="text-xl leading-none">&times;</span>
                          </button>

                          {/* ── Header ── */}
                          <div className="relative bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-t-2xl p-8 pb-10 text-center text-white overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
                            <div className="relative">
                              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Invest in Your Career</h2>
                              <p className="text-white/80 max-w-lg mx-auto text-sm sm:text-base">
                                Work 1-to-1 with certified career coaches who have helped 500+ graduates land their dream roles.
                              </p>
                              <div className="flex flex-wrap justify-center gap-3 mt-4">
                                {[
                                  { icon: Shield, label: 'Certified Coaches' },
                                  { icon: Clock, label: '24h Confirmation' },
                                  { icon: Award, label: 'Money-Back Guarantee' },
                                ].map(({ icon: Icon, label }) => (
                                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* ── Social Proof Stats Bar ── */}
                          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                              {[
                                { value: '500+', label: 'Graduates Coached', icon: Users },
                                { value: '4.9/5', label: 'Average Rating', icon: Star },
                                { value: '92%', label: 'Got Interviews', icon: TrendingUp },
                                { value: '48hr', label: 'Avg. Response Time', icon: Clock },
                              ].map(({ value, label, icon: SIcon }) => (
                                <div key={label} className="flex items-center gap-2.5 justify-center">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <SIcon className="w-4 h-4 text-purple-600" aria-hidden="true" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-extrabold text-gray-900 leading-tight">{value}</p>
                                    <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-6 sm:p-8 space-y-8">

                            {/* ═══════════════════════════════════════════
                                 SECTION 1 — BUNDLES
                                ═══════════════════════════════════════════ */}
                            <div>
                              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" aria-hidden="true" />
                                Bundles — Save More
                              </h3>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                {/* ── Complete Package ── */}
                                <div className="relative border-2 border-purple-400 rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                                  <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                                    Best Value
                                  </div>
                                  {/* Hero image */}
                                  <div className="relative h-40 overflow-hidden">
                                    <img
                                      src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop&crop=faces"
                                      alt="Team of graduates collaborating on career planning"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-purple-900/30 to-transparent" />
                                    <div className="absolute bottom-3 left-4 text-white">
                                      <h4 className="font-extrabold text-lg leading-tight">Complete Package</h4>
                                      <p className="text-white/80 text-xs">All 4 sessions bundled together</p>
                                    </div>
                                  </div>
                                  <div className="p-5 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                      {[
                                        { icon: FileText, label: 'CV Review', color: 'text-orange-500', bg: 'bg-white' },
                                        { icon: Mic, label: 'Interview Prep', color: 'text-blue-500', bg: 'bg-white' },
                                        { icon: Compass, label: 'Career Planning', color: 'text-emerald-500', bg: 'bg-white' },
                                        { icon: Linkedin, label: 'LinkedIn Optimisation', color: 'text-sky-600', bg: 'bg-white' },
                                      ].map((item) => {
                                        const BIcon = item.icon;
                                        return (
                                          <div key={item.label} className={`flex items-center gap-2 ${item.bg} rounded-lg p-2 shadow-sm`}>
                                            <BIcon className={`w-3.5 h-3.5 ${item.color} flex-shrink-0`} aria-hidden="true" />
                                            <p className="text-[11px] font-semibold text-gray-800">{item.label}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex items-end justify-between pt-3 border-t border-purple-200/60">
                                      <div>
                                        <span className="text-sm text-gray-400 line-through">£159.96</span>
                                        <span className="text-2xl font-extrabold text-gray-900 ml-1.5">£79.99</span>
                                        <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Save 50%</span>
                                        <p className="text-[10px] text-gray-400 mt-1">One-time payment · 3 hrs 45 min total</p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setShowCoachingCrossSell(false);
                                          setSelectedCoachSession({
                                            name: 'Complete Package', type: 'Complete Package',
                                            duration: '3 hrs 45 min (4 sessions)', price: '£79.99', originalPrice: '£159.96',
                                            description: 'CV Review + Interview Prep + Career Planning + LinkedIn Optimisation.',
                                            color: 'from-purple-600 to-indigo-600', icon: Sparkles,
                                            deliverables: [
                                              'Line-by-line CV feedback & cover letter template',
                                              'Mock interview with STAR method coaching',
                                              'Career roadmap & skills gap analysis',
                                              'LinkedIn profile audit & optimisation report',
                                              'Follow-up resources for all sessions'
                                            ]
                                          });
                                          setCoachingModalOpen(true);
                                        }}
                                        aria-label="Book Complete Package for £79.99 — save 50%"
                                        className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] transition-all text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 whitespace-nowrap"
                                      >
                                        Get the Bundle
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* ── Personal Branding Bundle ── */}
                                <div className="relative border-2 border-sky-300 rounded-2xl overflow-hidden hover:shadow-xl transition-all group">
                                  <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                                    <Linkedin className="w-3 h-3" aria-hidden="true" />
                                    New Bundle
                                  </div>
                                  {/* Hero image */}
                                  <div className="relative h-40 overflow-hidden">
                                    <img
                                      src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=400&fit=crop&crop=center"
                                      alt="Professional reviewing their personal brand materials"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-sky-900/80 via-sky-900/30 to-transparent" />
                                    <div className="absolute bottom-3 left-4 text-white">
                                      <h4 className="font-extrabold text-lg leading-tight">Personal Branding</h4>
                                      <p className="text-white/80 text-xs">CV Review + LinkedIn Optimisation</p>
                                    </div>
                                  </div>
                                  <div className="p-5 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                      {[
                                        { icon: FileText, label: 'CV & Application Review', detail: '45 min', color: 'text-orange-500', bg: 'bg-white' },
                                        { icon: Linkedin, label: 'LinkedIn Optimisation', detail: '45 min', color: 'text-sky-600', bg: 'bg-white' },
                                      ].map((item) => {
                                        const BIcon = item.icon;
                                        return (
                                          <div key={item.label} className={`${item.bg} rounded-lg p-2.5 shadow-sm`}>
                                            <div className="flex items-center gap-2 mb-1">
                                              <BIcon className={`w-3.5 h-3.5 ${item.color}`} aria-hidden="true" />
                                              <p className="text-[11px] font-semibold text-gray-800">{item.label}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-500 pl-5">{item.detail}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex items-end justify-between pt-3 border-t border-sky-200/60">
                                      <div>
                                        <span className="text-sm text-gray-400 line-through">£59.98</span>
                                        <span className="text-2xl font-extrabold text-gray-900 ml-1.5">£44.99</span>
                                        <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Save 25%</span>
                                        <p className="text-[10px] text-gray-400 mt-1">One-time payment · 1 hr 30 min total</p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setShowCoachingCrossSell(false);
                                          setSelectedCoachSession({
                                            name: 'Personal Branding Bundle', type: 'Personal Branding Bundle',
                                            duration: '1 hr 30 min (2 sessions)', price: '£44.99', originalPrice: '£59.98',
                                            description: 'CV & Application Review + LinkedIn Profile Optimisation.',
                                            color: 'from-sky-500 to-blue-600', icon: Linkedin,
                                            deliverables: [
                                              'Line-by-line CV feedback & ATS optimisation',
                                              'Cover letter template',
                                              'LinkedIn headline & summary rewrite',
                                              'Skills endorsement strategy',
                                              'Follow-up resources PDF'
                                            ]
                                          });
                                          setCoachingModalOpen(true);
                                        }}
                                        aria-label="Book Personal Branding Bundle for £44.99 — save 25%"
                                        className="px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-sky-500/30 hover:scale-[1.02] transition-all text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 whitespace-nowrap"
                                      >
                                        Get Bundle
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* ═══════════════════════════════════════════
                                 SECTION 2 — INDIVIDUAL SESSIONS
                                ═══════════════════════════════════════════ */}
                            <div>
                              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Individual Sessions</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Individual coaching sessions">
                                {[
                                  {
                                    name: 'CV & Application Review', type: 'CV Review', duration: '45 minutes',
                                    price: '£29.99', originalPrice: '£49.99',
                                    description: 'Expert feedback on your CV and cover letters.',
                                    color: 'from-amber-500 to-orange-600', icon: FileText, popular: false,
                                    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=250&fit=crop&crop=center',
                                    imageAlt: 'Professional reviewing CV documents at desk',
                                    deliverables: ['Line-by-line CV feedback', 'ATS optimisation tips', 'Cover letter template', 'Follow-up resources PDF']
                                  },
                                  {
                                    name: 'Interview Preparation', type: 'Interview Prep', duration: '60 minutes',
                                    price: '£29.99', originalPrice: '£49.99',
                                    description: 'Practice questions, feedback, and confidence.',
                                    color: 'from-blue-500 to-indigo-600', icon: Mic, popular: true,
                                    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop&crop=faces',
                                    imageAlt: 'Confident professional in interview setting',
                                    deliverables: ['Mock interview session', 'STAR method coaching', 'Personalised feedback report', 'Confidence-building exercises']
                                  },
                                  {
                                    name: 'Career Planning', type: 'Career Planning', duration: '60 minutes',
                                    price: '£29.99', originalPrice: '£49.99',
                                    description: 'Map your career goals and strategy.',
                                    color: 'from-emerald-500 to-teal-600', icon: Compass, popular: false,
                                    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop&crop=center',
                                    imageAlt: 'Team collaborating on career strategy whiteboard',
                                    deliverables: ['Career roadmap document', 'Skills gap analysis', 'Industry insights & contacts', 'Goal-setting action plan']
                                  },
                                  {
                                    name: 'LinkedIn Optimisation', type: 'LinkedIn Optimisation', duration: '45 minutes',
                                    price: '£29.99', originalPrice: '£49.99',
                                    description: 'Stand out to recruiters on LinkedIn.',
                                    color: 'from-sky-500 to-blue-600', icon: Linkedin, popular: false,
                                    image: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=400&h=250&fit=crop&crop=center',
                                    imageAlt: 'Professional networking on LinkedIn platform',
                                    deliverables: ['Profile headline & summary rewrite', 'Skills & endorsement strategy', 'Networking outreach templates', 'Recruiter visibility tips']
                                  },
                                ].map((session) => {
                                  const SIcon = session.icon;
                                  return (
                                    <div key={session.type} role="listitem" className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all flex flex-col group/card">
                                      {session.popular && (
                                        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-md">
                                          Most Popular
                                        </div>
                                      )}
                                      {/* Card image with gradient overlay */}
                                      <div className="relative h-32 overflow-hidden">
                                        <img
                                          src={session.image}
                                          alt={session.imageAlt}
                                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                          loading="lazy"
                                        />
                                        <div className={`absolute inset-0 bg-gradient-to-t ${session.color} opacity-40`} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute bottom-2.5 left-3">
                                          <div className="w-8 h-8 bg-white/25 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                            <SIcon className="w-4 h-4 text-white" aria-hidden="true" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="p-4 flex flex-col flex-1">
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{session.name}</h4>
                                        <p className="text-[11px] text-gray-500 mb-2.5">{session.description}</p>
                                        <ul className="space-y-1 mb-3 flex-1">
                                          {session.deliverables.map((d, i) => (
                                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                                              <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                              {d}
                                            </li>
                                          ))}
                                        </ul>
                                        <div className="flex items-center justify-between mb-2.5 pt-2 border-t border-gray-100">
                                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" aria-hidden="true" />{session.duration}
                                          </span>
                                          <div className="text-right">
                                            <span className="text-[11px] text-gray-400 line-through mr-1">{session.originalPrice}</span>
                                            <span className="font-bold text-gray-900 text-sm">{session.price}</span>
                                          </div>
                                        </div>
                                        <p className="text-[9px] text-gray-400 text-right mb-2">One-time payment</p>
                                        <button
                                          onClick={() => {
                                            setShowCoachingCrossSell(false);
                                            setSelectedCoachSession(session);
                                            setCoachingModalOpen(true);
                                          }}
                                          aria-label={`Book ${session.name} session for ${session.price}`}
                                          className={`w-full py-2.5 bg-gradient-to-r ${session.color} text-white font-semibold rounded-xl hover:shadow-md hover:scale-[1.01] transition-all text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500`}
                                        >
                                          Book Session
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* ═══════════════════════════════════════════
                                 SECTION 3 — SOCIAL PROOF TESTIMONIALS
                                ═══════════════════════════════════════════ */}
                            <div className="bg-gray-50 -mx-6 sm:-mx-8 px-6 sm:px-8 py-6 rounded-b-2xl">
                              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Quote className="w-4 h-4 text-purple-500" aria-hidden="true" />
                                Success Stories
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                  { quote: 'The CV review transformed my applications. I got 3 interviews within a week!', name: 'Emily T.', role: 'Marketing Graduate', sessions: 'CV Review + LinkedIn' },
                                  { quote: 'James helped me nail my Goldman Sachs interview. Best investment in my career so far.', name: 'David K.', role: 'Finance Graduate', sessions: 'Interview Prep' },
                                  { quote: 'The complete package gave me a total career makeover. Landed my dream role at Deloitte.', name: 'Priya S.', role: 'CS Graduate', sessions: 'Complete Package' },
                                ].map((t) => (
                                  <div key={t.name} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <div className="flex gap-0.5 mb-2">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                                      ))}
                                    </div>
                                    <p className="text-xs text-gray-700 mb-3 italic leading-relaxed">"{t.quote}"</p>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-bold text-gray-900">{t.name}</p>
                                        <p className="text-[10px] text-gray-500">{t.role}</p>
                                      </div>
                                      <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{t.sessions}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </>
                )}
              </AnimatePresence>

              {/* Coaching booking modal */}
              <CoachingBookingModal
                isOpen={coachingModalOpen}
                onClose={() => setCoachingModalOpen(false)}
                session={selectedCoachSession}
                onSuccess={() => {
                  setCoachingModalOpen(false);
                  // Refresh sessions list after booking
                  if (currentUser) {
                    coachingService.getSessionsByStudent(currentUser.uid)
                      .then(sessions => setMySessions(sessions))
                      .catch(() => {});
                  }
                }}
              />
            </motion.div>
          )}

          {/* ── Events Tab (Discovery Engine) ──────────────────────────── */}
          {activeTab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <EventsDiscoveryPanel />
            </motion.div>
          )}

          {/* ── Applications Tab (Job Tracker) ────────────────────────────── */}
          {activeTab === 'applications' && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <JobTracker />
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
