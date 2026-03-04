/**
 * PlacementPortal — Unified Interactive Dashboard Hub
 * ─────────────────────────────────────────────────────
 * Role-aware hub that all users land on after login.
 * Shows live Firestore stats, animated cards, application pipeline,
 * events feed, and quick actions — adapting UI to the logged-in role.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Calendar, Users, Star,
  Bell, Search, ChevronRight, CheckCircle,
  Clock, Zap, Target, Award, BookOpen, Video,
  ArrowUpRight, ArrowDownRight, Activity, LogOut,
  FileText, Building2,
  BarChart2, PlusCircle, AlertCircle, Loader
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { opportunityService } from '../services/opportunity.service';
import { eventService } from '../services/event.service';
import jobTrackingService from '../services/jobTracking.service';

// ─── Colour palette per role ──────────────────────────────────────────────
const ROLE_THEME = {
  student:  { primary: '#7c3aed', light: '#f5f3ff', gradient: 'from-violet-600 to-purple-700', accent: 'violet' },
  graduate: { primary: '#7c3aed', light: '#f5f3ff', gradient: 'from-violet-600 to-purple-700', accent: 'violet' },
  employer: { primary: '#0ea5e9', light: '#f0f9ff', gradient: 'from-sky-500 to-blue-600',    accent: 'sky'    },
  coach:    { primary: '#10b981', light: '#f0fdf4', gradient: 'from-emerald-500 to-teal-600', accent: 'emerald'},
  admin:    { primary: '#f59e0b', light: '#fffbeb', gradient: 'from-amber-500 to-orange-600', accent: 'amber'  }
};

// ─── Animated counter ────────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplay(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
};

// ─── Stat card ───────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, color, prefix, suffix, delay = 0 }) => {
  const positive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 120 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${color}-100`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </motion.div>
  );
};

// ─── Application pipeline chip ──────────────────────────────────────────
const STATUS_META = {
  submitted:  { label: 'Applied',      color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  reviewing:  { label: 'In Review',    color: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500' },
  shortlisted:{ label: 'Shortlisted',  color: 'bg-purple-100 text-purple-700',dot: 'bg-purple-500' },
  interview:  { label: 'Interview',    color: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  placed:     { label: 'Placed 🎉',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  hired:      { label: 'Hired 🎉',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  rejected:   { label: 'Not Selected', color: 'bg-red-50 text-red-600',       dot: 'bg-red-400'    }
};

const StatusChip = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
      <Icon className="w-7 h-7 text-gray-400" />
    </div>
    <div className="text-sm font-semibold text-gray-700 mb-1">{title}</div>
    <div className="text-xs text-gray-500 mb-4">{subtitle}</div>
    {actionLabel && (
      <button onClick={onAction} className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors">
        {actionLabel}
      </button>
    )}
  </div>
);

// ─── Quick action button ──────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, label, sublabel, color, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-${color}-100 hover:border-${color}-300 shadow-sm hover:shadow-md transition-all text-left w-full`}
  >
    <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 text-${color}-600`} />
    </div>
    <div>
      <div className="text-sm font-bold text-gray-800">{label}</div>
      <div className="text-xs text-gray-500">{sublabel}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
  </motion.button>
);

// ─── Pie chart colours ────────────────────────────────────────────────────
const PIE_COLORS = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9'];

// ─── Main Component ──────────────────────────────────────────────────────
const DashboardHub = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const role = userProfile?.role || 'student';
  const theme = ROLE_THEME[role] || ROLE_THEME.student;

  // Redirect admins to dedicated admin dashboard
  useEffect(() => {
    if (role === 'admin') navigate('/admin/dashboard', { replace: true });
  }, [role, navigate]);

  const [stats, setStats]               = useState({ applications: 0, events: 0, jobs: 0, sessions: 0 });
  const [applications, setApplications] = useState([]);
  const [events, setEvents]             = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [activityData, setActivityData] = useState([]);

  // ── Generate sparkline activity data from applications ──
  const buildActivityData = useCallback((apps) => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        applications: apps.filter(a => {
          const sub = a.submittedAt instanceof Date ? a.submittedAt : new Date(a.submittedAt);
          return sub.toDateString() === d.toDateString();
        }).length
      };
    });
    setActivityData(last7);
  }, []);

  // ── Load data based on role ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    const load = async () => {
      setLoadingData(true);
      try {
        if (role === 'student' || role === 'graduate') {
          const [apps, appStats, upcomingEvents] = await Promise.all([
            jobTrackingService.getUserApplications(currentUser.uid, null, 10),
            jobTrackingService.getApplicationStats(currentUser.uid),
            eventService.getAll({ status: 'upcoming', limit: 4 })
          ]);
          setApplications(apps);
          setStats({
            applications: appStats?.total || apps.length,
            interviews:   appStats?.interviews || 0,
            events:       upcomingEvents.length,
            saved:        appStats?.saved || 0
          });
          setEvents(upcomingEvents.slice(0, 4));
          buildActivityData(apps);

          // Build simple notifications
          const notifs = [];
          const shortlisted = apps.filter(a => a.status === 'shortlisted' || a.status === 'interview');
          shortlisted.slice(0, 2).forEach(a => notifs.push({
            id: a.id,
            type: 'progress',
            message: `Your application to ${a.jobTitle || 'a role'} has been ${a.status}`,
            time: 'Recently'
          }));
          setNotifications(notifs);

        } else if (role === 'employer') {
          const [jobs, applications] = await Promise.all([
            opportunityService.getAll({ employerId: currentUser.uid, status: 'active' }),
            opportunityService.getApplicationsByEmployer(currentUser.uid)
          ]);
          setApplications(applications.slice(0, 6));
          setStats({
            applications: applications.length,
            activeJobs:   jobs.length,
            interviews:   applications.filter(a => a.status === 'interview' || a.status === 'shortlisted').length,
            placements:   applications.filter(a => a.status === 'placed' || a.status === 'hired').length
          });
          buildActivityData(applications);
        }
      } catch (err) {
        console.error('DashboardHub load error:', err);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, role]);

  // ── Application status breakdown for Pie chart ──────────────────────
  const statusCounts = applications.reduce((acc, a) => {
    const s = a.status || 'submitted';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: STATUS_META[name]?.label || name,
    value
  }));

  const firstName = userProfile?.profile?.firstName
    || userProfile?.displayName?.split(' ')[0]
    || currentUser?.displayName?.split(' ')[0]
    || 'there';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── Role-specific stat cards ─────────────────────────────────────────
  const statCards = role === 'employer'
    ? [
        { icon: Briefcase,   label: 'Active Jobs',     value: stats.activeJobs   || 0, color: 'sky',    delay: 0.1 },
        { icon: Users,       label: 'Applications',    value: stats.applications || 0, color: 'purple', delay: 0.2 },
        { icon: Star,        label: 'Interviews',      value: stats.interviews   || 0, color: 'amber',  delay: 0.3 },
        { icon: Award,       label: 'Placements',      value: stats.placements   || 0, color: 'green',  delay: 0.4 }
      ]
    : [
        { icon: Briefcase,   label: 'Applications',    value: stats.applications || 0, color: 'violet', delay: 0.1 },
        { icon: Star,        label: 'Interviews',      value: stats.interviews   || 0, color: 'amber',  delay: 0.2 },
        { icon: Calendar,    label: 'Upcoming Events', value: stats.events       || 0, color: 'sky',    delay: 0.3 },
        { icon: Zap,         label: 'Saved Jobs',      value: stats.saved        || 0, color: 'green',  delay: 0.4 }
      ];

  // ── Role-specific quick actions ──────────────────────────────────────
  const quickActions = role === 'employer'
    ? [
        { icon: PlusCircle, label: 'Post a Job',        sublabel: 'Create new listing',      color: 'sky',    onClick: () => navigate('/opportunities')       },
        { icon: Users,      label: 'Browse Talent',     sublabel: 'Find candidates',         color: 'purple', onClick: () => navigate('/opportunities')       },
        { icon: BarChart2,  label: 'View Analytics',    sublabel: 'Recruitment insights',    color: 'amber',  onClick: () => navigate('/dashboard/employer')  },
        { icon: Zap,        label: 'Upgrade Hiring',    sublabel: 'Unlock top profiles',     color: 'sky',    onClick: () => navigate('/pricing/employer')    }
      ]
    : [
        { icon: Search,      label: 'Browse Jobs',      sublabel: 'Find opportunities',      color: 'violet', onClick: () => navigate('/opportunities')       },
        { icon: Video,       label: 'Video Pitch',      sublabel: 'Record & upload',         color: 'sky',    onClick: () => navigate('/studio')              },
        { icon: FileText,    label: 'Optimise CV',      sublabel: 'AI-powered review',       color: 'amber',  onClick: () => navigate('/dashboard/student/cv-review')  },
        { icon: BookOpen,    label: 'Career Coaching',  sublabel: 'Book a session',          color: 'green',  onClick: () => navigate('/dashboard/student/coaching')   }
      ];

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${theme.gradient} pt-24 pb-16 relative overflow-hidden`}>
        {/* Animated orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-8 right-16 w-72 h-72 bg-white rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-12 -left-12 w-56 h-56 bg-white rounded-full"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between mb-8">
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <p className="text-white/70 text-sm font-medium mb-1">{greeting} 👋</p>
              <h1 className="text-3xl font-bold text-white">
                {firstName}
                <span className="ml-3 px-3 py-1 bg-white/20 backdrop-blur-sm text-white/90 text-sm font-semibold rounded-full capitalize">
                  {role}
                </span>
              </h1>
            </motion.div>

            {/* Top-right controls */}
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="relative p-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" />
                )}
              </motion.button>

              {/* Logout */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                onClick={async () => { await logout(); navigate('/login'); }}
                className="p-2.5 bg-white/15 hover:bg-red-500/50 backdrop-blur-sm rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-xl"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
            <input
              type="text"
              placeholder="Search jobs, events, companies…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate(`/opportunities?q=${searchQuery}`)}
              className="w-full bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/50 rounded-2xl pl-11 pr-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
            />
          </motion.div>
        </div>
      </div>

      {/* ── Stats Ribbon ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <StatCard key={i} {...card} />
          ))}
        </div>
      </div>

      {/* ── Section Tabs ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 w-fit mb-6">
          {['overview', 'applications', 'events'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                activeSection === tab
                  ? `bg-gradient-to-r ${theme.gradient} text-white shadow-sm`
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeSection === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Activity Chart (2/3) */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Application Activity</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-full">
                    <Activity className="w-3.5 h-3.5" />
                    Live
                  </div>
                </div>
                {activityData.some(d => d.applications > 0) ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={theme.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={theme.primary} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                        formatter={v => [`${v} applications`, '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="applications"
                        stroke={theme.primary}
                        strokeWidth={2.5}
                        fill="url(#areaGrad)"
                        dot={{ r: 4, fill: theme.primary, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={BarChart2}
                    title="No applications yet"
                    subtitle="Start applying to jobs and your activity will show here"
                    actionLabel="Browse jobs"
                    onAction={() => navigate('/opportunities')}
                  />
                )}
              </div>

              {/* Quick Actions (1/3) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {quickActions.map((action, i) => (
                    <QuickAction key={i} {...action} delay={i * 0.05} />
                  ))}
                </div>
              </div>

              {/* Application Pipeline */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-gray-900">Application Pipeline</h2>
                  <button
                    onClick={() => setActiveSection('applications')}
                    className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 4).map((app, i) => (
                      <motion.div
                        key={app.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        onClick={() => navigate('/opportunities')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                            {(app.jobTitle || app.title || 'J').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                              {app.jobTitle || app.title || 'Position'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {app.company || app.employerId || '—'}
                            </div>
                          </div>
                        </div>
                        <StatusChip status={app.status} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Briefcase}
                    title="No applications yet"
                    subtitle="Browse jobs and start applying"
                    actionLabel="Find jobs"
                    onAction={() => navigate('/opportunities')}
                  />
                )}
              </div>

              {/* Status Breakdown Pie */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-4">Status Breakdown</h2>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {pieData.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-600">{entry.name}</span>
                          </div>
                          <span className="font-semibold text-gray-800">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState icon={Target} title="No data yet" subtitle="Apply to jobs to see your breakdown" />
                )}
              </div>
            </motion.div>
          )}

          {activeSection === 'applications' && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">All Applications ({applications.length})</h2>
                <button
                  onClick={() => navigate('/opportunities')}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Apply to more
                </button>
              </div>

              {applications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {applications.map((app, i) => (
                    <motion.div
                      key={app.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {(app.jobTitle || 'J').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{app.jobTitle || 'Position'}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            {app.company || '—'}
                            {app.submittedAt && (
                              <>
                                <span>·</span>
                                <Clock className="w-3 h-3" />
                                {app.submittedAt instanceof Date
                                  ? app.submittedAt.toLocaleDateString('en-GB')
                                  : new Date(app.submittedAt).toLocaleDateString('en-GB')}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusChip status={app.status} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-10">
                  <EmptyState
                    icon={Briefcase}
                    title="No applications yet"
                    subtitle="Start browsing and apply to roles that match your skills"
                    actionLabel="Browse opportunities"
                    onAction={() => navigate('/opportunities')}
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              {events.length > 0 ? events.map((ev, i) => (
                <motion.div
                  key={ev.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate('/community/events')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700`}>
                      {ev.type || 'Event'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {ev.registered || 0} registered
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {ev.title || ev.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{ev.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ev.date instanceof Date
                        ? ev.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ev.startDate || '—'}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1">
                        📍 {ev.location}
                      </span>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-2 bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
                  <EmptyState
                    icon={Calendar}
                    title="No upcoming events"
                    subtitle="Check back soon — events will appear here when added"
                    actionLabel="Visit community"
                    onAction={() => navigate('/community/events')}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Notification Banner ──────────────────────────────────────── */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-white rounded-2xl p-5 shadow-sm border border-purple-100"
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
              <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            </div>
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-700">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Progress Tracker (students/grads only) ───────────────────── */}
        {(role === 'student' || role === 'graduate') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Career Progress Checklist</h2>
              <span className="text-xs text-gray-500">Your onboarding journey</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Complete your profile',         done: !!userProfile?.profile?.fullName,  action: '/dashboard/student'            },
                { label: 'Upload or optimise your CV',    done: false,                              action: '/dashboard/student/cv-review'  },
                { label: 'Browse & save 5 jobs',          done: (stats.saved || 0) >= 5,           action: '/opportunities'                },
                { label: 'Submit your first application', done: (stats.applications || 0) >= 1,    action: '/opportunities'                },
                { label: 'Book a coaching session',       done: false,                              action: '/dashboard/student/coaching'   },
                { label: 'Record a video pitch',          done: false,                              action: '/studio'                       }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                  onClick={() => !item.done && navigate(item.action)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    item.done ? 'bg-green-50 cursor-default' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? 'bg-green-500' : 'bg-gray-200'
                  }`}>
                    {item.done
                      ? <CheckCircle className="w-4 h-4 text-white" />
                      : <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    }
                  </div>
                  <span className={`text-sm flex-1 ${item.done ? 'text-green-700 line-through' : 'text-gray-700 font-medium'}`}>
                    {item.label}
                  </span>
                  {!item.done && <ChevronRight className="w-4 h-4 text-gray-400" />}
                </motion.div>
              ))}
            </div>

            {/* Overall progress bar */}
            {(() => {
              const checks = [
                !!userProfile?.profile?.fullName,
                false,
                (stats.saved || 0) >= 5,
                (stats.applications || 0) >= 1,
                false,
                false
              ];
              const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
              return (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Overall progress</span>
                    <span className="font-bold text-purple-600">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.8 }}
                      className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                    />
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* Spacer */}
        <div className="pb-10" />
      </div>
    </div>
  );
};

export default DashboardHub;
