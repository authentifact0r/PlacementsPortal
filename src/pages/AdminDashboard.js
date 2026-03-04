/**
 * Admin Dashboard
 * ───────────────
 * Data-centric platform overview for admins.
 * Shows live Firestore counts, user breakdown, activity charts,
 * recent registrations, coaching sessions, and quick-action tools.
 *
 * Route: /admin/dashboard
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, Calendar, TrendingUp, Crown,
  UserCheck, Building2, GraduationCap, Shield,
  Activity, ChevronRight, RefreshCw,
  Clock, Zap, BarChart2,
  FileText, Video, Award, ArrowUpRight,
  ArrowDownRight, Loader2, Search
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  collection, getDocs, query, orderBy, limit
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// ─── Colour helpers ───────────────────────────────────────────────────────────
const ROLE_COLORS = {
  student:  '#7c3aed',
  graduate: '#a78bfa',
  employer: '#0ea5e9',
  coach:    '#10b981',
  admin:    '#f59e0b',
};

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#0ea5e9', '#10b981', '#f59e0b'];

// ─── Animated counter ─────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : 0;
    if (target === 0) return;
    const step = Math.max(1, Math.ceil(target / 60));
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + step, target);
      setDisplay(current);
      if (current >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subtext, color, gradient, change, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 110 }}
    onClick={onClick}
    className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {change !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <div className={`text-3xl font-bold text-${color}-600 mb-1`}>
      <AnimatedNumber value={value} />
    </div>
    <div className="text-sm font-semibold text-gray-700">{label}</div>
    {subtext && <div className="text-xs text-gray-400 mt-0.5">{subtext}</div>}
  </motion.div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, action, onAction }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-gray-400" />
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
    {action && (
      <button onClick={onAction} className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
        {action} <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats]         = useState({
    totalUsers: 0, students: 0, graduates: 0,
    employers: 0, coaches: 0, admins: 0,
    totalJobs: 0, totalApplications: 0,
    totalEvents: 0, totalSessions: 0,
    premiumUsers: 0,
  });
  const [recentUsers, setRecentUsers]         = useState([]);
  const [recentSessions, setRecentSessions]   = useState([]);
  const [roleBreakdown, setRoleBreakdown]     = useState([]);
  const [registrationTrend, setRegistrationTrend] = useState([]);
  const [recentJobs, setRecentJobs]           = useState([]);
  const [allUsers, setAllUsers]           = useState([]);   // in-memory cache for instant grep
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchFilter, setSearchFilter]   = useState('all');
  const [suggestions, setSuggestions]     = useState([]);   // live typeahead list
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const [hasSearched, setHasSearched]     = useState(false);
  const searchRef = useRef(null);          // for click-outside dismiss

  // ── Protect: only admins ──────────────────────────────────────────────
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  // ── Load all platform data ────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [
        usersSnap,
        jobsSnap,
        applicationsSnap,
        eventsSnap,
        sessionsSnap
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'opportunities')),
        getDocs(collection(db, 'jobApplications')),
        getDocs(collection(db, 'events')),
        getDocs(query(collection(db, 'coachingSessions'), orderBy('createdAt', 'desc'), limit(50)))
      ]);

      // ── User stats ──
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllUsers(users); // cache for instant grep-style suggestions
      const roleCounts = users.reduce((acc, u) => {
        const r = u.role || 'student';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      const premiumCount = users.filter(u => u.premium?.studentPremium?.active || u.premium?.employerPremium?.active).length;

      // ── Role breakdown for pie ──
      const breakdown = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      // ── Recent users (last 8) ──
      const sorted = [...users].sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bDate - aDate;
      });
      setRecentUsers(sorted.slice(0, 8));

      // ── Registration trend (last 7 days) ──
      const trend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
        const dayEnd   = new Date(d); dayEnd.setHours(23,59,59,999);
        return {
          day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
          registrations: users.filter(u => {
            const created = u.createdAt?.toDate?.() || new Date(u.createdAt || 0);
            return created >= dayStart && created <= dayEnd;
          }).length
        };
      });
      setRegistrationTrend(trend);

      // ── Recent sessions ──
      setRecentSessions(sessionsSnap.docs.slice(0, 6).map(d => ({ id: d.id, ...d.data() })));

      // ── Recent jobs ──
      const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedJobs = [...jobs].sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bDate - aDate;
      });
      setRecentJobs(sortedJobs.slice(0, 5));

      setStats({
        totalUsers:       users.length,
        students:         roleCounts.student   || 0,
        graduates:        roleCounts.graduate  || 0,
        employers:        roleCounts.employer  || 0,
        coaches:          roleCounts.coach     || 0,
        admins:           roleCounts.admin     || 0,
        totalJobs:        jobsSnap.size,
        totalApplications: applicationsSnap.size,
        totalEvents:      eventsSnap.size,
        totalSessions:    sessionsSnap.size,
        premiumUsers:     premiumCount,
      });
      setRoleBreakdown(breakdown);

    } catch (err) {
      console.error('AdminDashboard load error:', err);
      showError('Some data failed to load — check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, showError]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Click-outside: close suggestions ─────────────────────────────────
  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // ── Live grep filter — runs instantly on every keystroke ──────────────
  const computeSuggestions = useCallback((q, filter) => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return allUsers
      .filter(u => {
        const name  = (u.displayName || u.name || u.profile?.firstName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role  = (u.role || '').toLowerCase();
        const passFilter = filter === 'all' || role === filter;
        return passFilter && (name.includes(lower) || email.includes(lower) || role.includes(lower));
      })
      .slice(0, 8); // cap at 8 so the dropdown stays tidy
  }, [allUsers]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasSearched(false);
      setSearchResults([]);
      return;
    }
    const hits = computeSuggestions(val, searchFilter);
    setSuggestions(hits);
    setShowSuggestions(hits.length > 0);
  };

  // Selecting a suggestion fills the box and shows its result card immediately
  const handleSuggestionClick = (user) => {
    const displayName = user.displayName || user.name || user.email || '';
    setSearchQuery(displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchResults([user]);
    setHasSearched(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAdminSearch = async (e) => {
    e && e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const q = searchQuery.toLowerCase().trim();
      const results = [];
      snapshot.forEach(d => {
        const data = d.data();
        const name  = (data.displayName || data.name || data.profile?.firstName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        const role  = (data.role || '').toLowerCase();
        const matchesFilter = searchFilter === 'all' || role === searchFilter;
        if (matchesFilter && (name.includes(q) || email.includes(q) || role.includes(q))) {
          results.push({ id: d.id, ...data });
        }
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const firstName = userProfile?.profile?.firstName
    || userProfile?.displayName?.split(' ')[0]
    || currentUser?.displayName?.split(' ')[0]
    || 'Admin';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  // ── Quick action tiles ────────────────────────────────────────────────
  const quickActions = [
    { icon: Crown,      label: 'Grant Premium',    sub: 'Manage user access',        gradient: 'from-violet-600 to-purple-700', onClick: () => navigate('/admin/premium') },
    { icon: Users,      label: 'All Users',        sub: `${stats.totalUsers} total`, gradient: 'from-amber-500 to-orange-600',  onClick: () => navigate('/admin/users') },
    { icon: Briefcase,  label: 'Job Listings',     sub: `${stats.totalJobs} active`, gradient: 'from-sky-500 to-blue-600',      onClick: () => navigate('/opportunities') },
    { icon: Calendar,   label: 'Events',           sub: `${stats.totalEvents} total`,gradient: 'from-emerald-500 to-teal-600',  onClick: () => navigate('/community/events') },
    { icon: Video,      label: 'Pitch Studio',     sub: 'Review pitches',            gradient: 'from-rose-500 to-pink-600',     onClick: () => navigate('/studio') },
    { icon: BarChart2,  label: 'Analytics',        sub: 'Platform insights',         gradient: 'from-indigo-500 to-violet-600', onClick: () => navigate('/admin/analytics') },
  ];

  // ── Status badge helper ───────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const map = {
      pending:   { color: 'bg-amber-100 text-amber-700',  label: 'Pending'   },
      confirmed: { color: 'bg-blue-100 text-blue-700',    label: 'Confirmed' },
      completed: { color: 'bg-green-100 text-green-700',  label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-700',      label: 'Cancelled' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${s.color}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading platform data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 pt-24 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTIuMi0xLjgtNC00LTRzLTQgMS44LTQgNCAxLjggNCA0IDQgNC0xLjggNC00eiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/80 text-sm font-semibold uppercase tracking-widest">Admin Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold text-white mt-2">
                {greeting}, {firstName} 👋
              </h1>
              <p className="text-orange-100 mt-1 text-sm">
                Platform overview · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Refresh + logout */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors text-sm backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Top KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Users',    value: stats.totalUsers,        icon: Users    },
              { label: 'Premium Users',  value: stats.premiumUsers,      icon: Crown    },
              { label: 'Job Listings',   value: stats.totalJobs,         icon: Briefcase},
              { label: 'Applications',   value: stats.totalApplications, icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
                <Icon className="w-5 h-5 text-white/80 flex-shrink-0" />
                <div>
                  <div className="text-2xl font-bold text-white">{value.toLocaleString()}</div>
                  <div className="text-orange-100 text-xs">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Admin Search Panel ── */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <form onSubmit={handleAdminSearch} className="flex gap-3 items-center">
            {/* Filter pills */}
            <div className="hidden md:flex gap-1">
              {[
                { id: 'all',      label: 'All' },
                { id: 'student',  label: 'Students' },
                { id: 'graduate', label: 'Graduates' },
                { id: 'employer', label: 'Employers' },
                { id: 'coach',    label: 'Coaches' },
                { id: 'admin',    label: 'Admins' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSearchFilter(f.id);
                    if (searchQuery.trim()) {
                      const hits = computeSuggestions(searchQuery, f.id);
                      setSuggestions(hits);
                      setShowSuggestions(hits.length > 0);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    searchFilter === f.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search input + live suggestion dropdown */}
            <div className="flex-1 relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Type a name, email or role… (e.g. Gr → Grace [Student])"
                autoComplete="off"
                className="w-full pl-9 pr-4 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-200 focus:border-amber-400 focus:bg-white rounded-xl outline-none transition-all"
              />

              {/* ── Typeahead suggestion list ── */}
              {showSuggestions && (
                <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((user, idx) => {
                    const displayName = user.displayName || user.name || user.profile?.firstName || user.email || 'Unknown';
                    const role = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
                    const hasPremium = user.premium?.studentPremium?.active || user.premium?.employerPremium?.active;
                    const roleColor = {
                      student:  'bg-violet-100 text-violet-700',
                      graduate: 'bg-purple-100 text-purple-700',
                      employer: 'bg-sky-100 text-sky-700',
                      coach:    'bg-emerald-100 text-emerald-700',
                      admin:    'bg-amber-100 text-amber-700',
                    }[user.role] || 'bg-gray-100 text-gray-600';

                    // Highlight the matching portion of the name
                    const lower = searchQuery.toLowerCase();
                    const nameStr = displayName;
                    const matchIdx = nameStr.toLowerCase().indexOf(lower);

                    return (
                      <li
                        key={user.id || idx}
                        onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(user); }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                      >
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xs">{nameStr[0]?.toUpperCase() || '?'}</span>
                        </div>

                        {/* Name with highlighted match + [Role] label */}
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-800 font-medium truncate">
                            {matchIdx >= 0 ? (
                              <>
                                {nameStr.slice(0, matchIdx)}
                                <mark className="bg-amber-200 text-amber-900 rounded px-0.5">{nameStr.slice(matchIdx, matchIdx + lower.length)}</mark>
                                {nameStr.slice(matchIdx + lower.length)}
                              </>
                            ) : nameStr}
                          </span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${roleColor}`}>[{role}]</span>
                          {hasPremium && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-violet-600 text-white flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" />PRO
                            </span>
                          )}
                        </div>

                        {/* Email hint */}
                        <span className="text-xs text-gray-400 truncate max-w-[140px] hidden sm:block">{user.email}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>

          {/* Search results dropdown */}
          {hasSearched && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No users found for "{searchQuery}"</p>
              ) : (
                searchResults.map(user => {
                  const roleColor = {
                    student:  'bg-violet-100 text-violet-700',
                    graduate: 'bg-purple-100 text-purple-700',
                    employer: 'bg-sky-100 text-sky-700',
                    coach:    'bg-emerald-100 text-emerald-700',
                    admin:    'bg-amber-100 text-amber-700',
                  }[user.role] || 'bg-gray-100 text-gray-600';
                  const hasPremium = user.premium?.studentPremium?.active || user.premium?.employerPremium?.active;
                  return (
                    <div key={user.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {(user.displayName || user.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 truncate">
                            {user.displayName || user.name || user.email}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${roleColor}`}>{user.role}</span>
                          {hasPremium && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-violet-600 text-white flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" />PRO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                      <button
                        onClick={() => navigate('/admin/premium')}
                        className="flex-shrink-0 px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        Manage
                      </button>
                    </div>
                  );
                })
              )}
              {searchResults.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 text-center">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Row 1: Detailed stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: GraduationCap, label: 'Students',    value: stats.students,  subtext: 'Registered', color: 'violet', gradient: 'from-violet-500 to-purple-600', delay: 0.05 },
            { icon: Award,         label: 'Graduates',   value: stats.graduates, subtext: 'Registered', color: 'purple', gradient: 'from-purple-500 to-indigo-600', delay: 0.1  },
            { icon: Building2,     label: 'Employers',   value: stats.employers, subtext: 'Companies',  color: 'sky',    gradient: 'from-sky-500 to-blue-600',      delay: 0.15 },
            { icon: UserCheck,     label: 'Coaches',     value: stats.coaches,   subtext: 'Active',     color: 'emerald',gradient: 'from-emerald-500 to-teal-600',  delay: 0.2  },
            { icon: Calendar,      label: 'Events',      value: stats.totalEvents,subtext: 'Scheduled', color: 'rose',   gradient: 'from-rose-500 to-pink-600',     delay: 0.25 },
            { icon: Activity,      label: 'Sessions',    value: stats.totalSessions,subtext: 'Coaching',color: 'amber',  gradient: 'from-amber-500 to-orange-500',  delay: 0.3  },
          ].map(card => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* ── Row 2: Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Registration Trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={TrendingUp} title="New Registrations (Last 7 Days)" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={registrationTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="registrations" stroke="#f59e0b" strokeWidth={2.5} fill="url(#regGrad)" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Role Breakdown Pie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={Users} title="User Breakdown" />
            {roleBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={roleBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {roleBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n.charAt(0).toUpperCase() + n.slice(1)]}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} formatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
                    wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No user data yet</div>
            )}
          </div>
        </div>

        {/* ── Row 3: Quick Actions ── */}
        <div>
          <SectionHeader icon={Zap} title="Admin Quick Actions" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map(({ icon: Icon, label, sub, gradient, onClick }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClick}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-sm font-bold text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Row 4: Recent Users + Coaching Sessions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Registrations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={Users} title="Recent Registrations"
              action="Grant Premium" onAction={() => navigate('/admin/premium')} />
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No users registered yet</p>
              ) : recentUsers.map(user => {
                const roleColor = {
                  student: 'bg-violet-100 text-violet-700',
                  graduate:'bg-purple-100 text-purple-700',
                  employer:'bg-sky-100 text-sky-700',
                  coach:   'bg-emerald-100 text-emerald-700',
                  admin:   'bg-amber-100 text-amber-700',
                }[user.role] || 'bg-gray-100 text-gray-600';

                const hasPremium = user.premium?.studentPremium?.active || user.premium?.employerPremium?.active;
                const created = user.createdAt?.toDate?.() || new Date(user.createdAt || 0);
                const timeAgo = (() => {
                  const diff = Date.now() - created.getTime();
                  const mins = Math.floor(diff / 60000);
                  const hrs  = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);
                  if (mins < 60)  return `${mins}m ago`;
                  if (hrs < 24)   return `${hrs}h ago`;
                  return `${days}d ago`;
                })();

                return (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {(user.displayName || user.name || user.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 truncate">
                          {user.displayName || user.name || user.email}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${roleColor}`}>{user.role}</span>
                        {hasPremium && (
                          <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-violet-600 to-purple-700 text-white flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{timeAgo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coaching Sessions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon={UserCheck} title="Recent Coaching Sessions"
              action="View All" onAction={() => navigate('/community')} />
            <div className="space-y-3">
              {recentSessions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No coaching sessions yet</p>
              ) : recentSessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {session.studentName || 'Student'}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {session.sessionType || 'Coaching'} · {session.date || '—'}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 5: Recent Job Listings ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon={Briefcase} title="Recent Job Listings"
            action="Browse All" onAction={() => navigate('/opportunities')} />
          {recentJobs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No job listings yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 font-semibold border-b border-gray-100">
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Company</th>
                    <th className="pb-3 pr-4">Location</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3">Posted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentJobs.map(job => {
                    const posted = job.createdAt?.toDate?.() || new Date(job.createdAt || 0);
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-gray-800">{job.title || job.jobTitle || '—'}</td>
                        <td className="py-3 pr-4 text-gray-600">{job.company || job.employerName || '—'}</td>
                        <td className="py-3 pr-4 text-gray-500">{job.location || '—'}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
                            {job.type || job.jobType || 'Full-time'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 text-xs">
                          {posted.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Row 6: Platform Health ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'User Conversion',
              value: stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0,
              suffix: '%',
              desc: 'of users have premium',
              color: 'from-violet-600 to-purple-700',
              icon: Crown
            },
            {
              title: 'Employer Ratio',
              value: stats.totalUsers > 0 ? Math.round((stats.employers / stats.totalUsers) * 100) : 0,
              suffix: '%',
              desc: 'of users are employers',
              color: 'from-sky-500 to-blue-600',
              icon: Building2
            },
            {
              title: 'Coach Coverage',
              value: stats.coaches > 0 && (stats.students + stats.graduates) > 0
                ? Math.round(((stats.students + stats.graduates) / stats.coaches))
                : 0,
              suffix: ':1',
              desc: 'students per coach',
              color: 'from-emerald-500 to-teal-600',
              icon: UserCheck
            },
          ].map(({ title, value, suffix, desc, color, icon: Icon }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm font-semibold">{title}</span>
                <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">
                <AnimatedNumber value={value} suffix={suffix} />
              </div>
              <div className="text-white/70 text-xs">{desc}</div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
