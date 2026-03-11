import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Users,
  TrendingUp,
  Crown,
  Briefcase,
  Calendar,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  LineChart as LineIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import db from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    premiumConversionPct: 0,
    roleBreakdown: { student: 0, graduate: 0, employer: 0, coach: 0, admin: 0 },
    totalJobs: 0,
    totalApplications: 0,
    jobsPostedLast30Days: 0,
    averageSessionsPerCoach: 0,
    weekOnWeekDelta: 0,
  });
  const [chartData, setChartData] = useState({
    registrationTrend: [],
    weeklyRegistrations: [],
    roleBreakdownData: [],
    applicationTrend: [],
    topRegistrationDays: [],
  });

  // Guard: redirect if not admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch all jobs
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const allJobs = jobsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch all applications
      const applicationsSnapshot = await getDocs(collection(db, 'applications'));
      const allApplications = applicationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch all coaching sessions
      const sessionsSnapshot = await getDocs(collection(db, 'coachingSessions'));
      const allSessions = sessionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch all events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      // events count reserved for future use
      const _totalEvents = eventsSnapshot.size; // eslint-disable-line no-unused-vars

      // Compute basic stats
      const totalUsers = allUsers.length;
      const premiumUsers = allUsers.filter(
        (u) => u.isPremium === true || u.subscription?.status === 'active'
      ).length;
      const premiumConversionPct =
        totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

      // Role breakdown
      const roleBreakdown = {
        student: allUsers.filter((u) => u.role === 'student').length,
        graduate: allUsers.filter((u) => u.role === 'graduate').length,
        employer: allUsers.filter((u) => u.role === 'employer').length,
        coach: allUsers.filter((u) => u.role === 'coach').length,
        admin: allUsers.filter((u) => u.role === 'admin').length,
      };

      // Registration trend last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const registrationsByDay = {};
      allUsers.forEach((user) => {
        if (user.createdAt) {
          const createdDate = user.createdAt.toDate?.() || new Date(user.createdAt);
          if (createdDate >= thirtyDaysAgo) {
            const dateKey = createdDate.toISOString().split('T')[0];
            registrationsByDay[dateKey] = (registrationsByDay[dateKey] || 0) + 1;
          }
        }
      });

      const registrationTrend = Object.keys(registrationsByDay)
        .sort()
        .map((date) => ({
          date: new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          count: registrationsByDay[date],
        }));

      // Weekly active registrations (last 8 weeks)
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const registrationsByWeek = {};
      allUsers.forEach((user) => {
        if (user.createdAt) {
          const createdDate = user.createdAt.toDate?.() || new Date(user.createdAt);
          if (createdDate >= eightWeeksAgo) {
            const weekStart = new Date(createdDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];
            registrationsByWeek[weekKey] = (registrationsByWeek[weekKey] || 0) + 1;
          }
        }
      });

      const weeklyRegistrations = Object.keys(registrationsByWeek)
        .sort()
        .slice(-8)
        .map((week) => ({
          week: new Date(week).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          registrations: registrationsByWeek[week],
        }));

      // Top 5 busiest registration days
      const topRegistrationDays = registrationTrend
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Application trend last 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const applicationsByDay = {};
      allApplications.forEach((app) => {
        if (app.appliedAt) {
          const appliedDate = app.appliedAt.toDate?.() || new Date(app.appliedAt);
          if (appliedDate >= fourteenDaysAgo) {
            const dateKey = appliedDate.toISOString().split('T')[0];
            applicationsByDay[dateKey] = (applicationsByDay[dateKey] || 0) + 1;
          }
        }
      });

      const applicationTrend = Object.keys(applicationsByDay)
        .sort()
        .map((date) => ({
          date: new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          applications: applicationsByDay[date],
        }));

      // Jobs posted in last 30 days
      const jobsPostedLast30Days = allJobs.filter((job) => {
        if (job.createdAt) {
          const createdDate = job.createdAt.toDate?.() || new Date(job.createdAt);
          return createdDate >= thirtyDaysAgo;
        }
        return false;
      }).length;

      // Average sessions per coach
      const coachCount = roleBreakdown.coach || 1;
      const averageSessionsPerCoach = Math.round(allSessions.length / coachCount);

      // Week-on-week delta (compare last 7 days to previous 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgoDate = new Date(now);
      fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);

      const lastWeekUsers = allUsers.filter((u) => {
        if (u.createdAt) {
          const createdDate = u.createdAt.toDate?.() || new Date(u.createdAt);
          return createdDate >= sevenDaysAgo && createdDate <= now;
        }
        return false;
      }).length;

      const previousWeekUsers = allUsers.filter((u) => {
        if (u.createdAt) {
          const createdDate = u.createdAt.toDate?.() || new Date(u.createdAt);
          return createdDate >= fourteenDaysAgoDate && createdDate < sevenDaysAgo;
        }
        return false;
      }).length;

      const weekOnWeekDelta = previousWeekUsers > 0
        ? Math.round(((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100)
        : 0;

      // Role breakdown pie chart data
      const roleBreakdownData = [
        { name: 'Student', value: roleBreakdown.student, color: '#7c3aed' },
        { name: 'Graduate', value: roleBreakdown.graduate, color: '#a855f7' },
        { name: 'Employer', value: roleBreakdown.employer, color: '#0ea5e9' },
        { name: 'Coach', value: roleBreakdown.coach, color: '#10b981' },
        { name: 'Admin', value: roleBreakdown.admin, color: '#f59e0b' },
      ];

      setStats({
        totalUsers,
        premiumUsers,
        premiumConversionPct,
        roleBreakdown,
        totalJobs: allJobs.length,
        totalApplications: allApplications.length,
        jobsPostedLast30Days,
        averageSessionsPerCoach,
        weekOnWeekDelta,
      });

      setChartData({
        registrationTrend,
        weeklyRegistrations,
        roleBreakdownData,
        applicationTrend,
        topRegistrationDays,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = () => {
    loadAnalytics();
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center" style={{ minHeight: '100%' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-gray-50" style={{ minHeight: '100%' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart2 className="w-8 h-8" />
                Platform Analytics
              </h1>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
        {lastUpdated && (
          <p className="text-white/80 text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="px-8 pb-12">
        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <Users className="w-12 h-12 text-indigo-500 opacity-20" />
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${
                stats.weekOnWeekDelta >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stats.weekOnWeekDelta >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(stats.weekOnWeekDelta)}% WoW
            </div>
          </div>

          {/* Premium Users */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Premium Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.premiumUsers.toLocaleString()}
                </p>
                <p className="text-indigo-600 text-sm font-medium mt-2">
                  {stats.premiumConversionPct}% conversion
                </p>
              </div>
              <Crown className="w-12 h-12 text-amber-500 opacity-20" />
            </div>
          </div>

          {/* Total Jobs */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalJobs.toLocaleString()}
                </p>
              </div>
              <Briefcase className="w-12 h-12 text-sky-500 opacity-20" />
            </div>
          </div>

          {/* Total Applications */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalApplications.toLocaleString()}
                </p>
              </div>
              <Activity className="w-12 h-12 text-emerald-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Row 2: Registration Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Registration Trend (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.registrationTrend}>
              <defs>
                <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorReg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Row 3: Role Breakdown & Weekly Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Role Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              User Roles
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.roleBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.roleBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Registrations */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <LineIcon className="w-5 h-5 text-indigo-600" />
              Weekly Registrations (Last 8 Weeks)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.weeklyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="registrations" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 4: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Premium Conversion Rate */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Premium Conversion
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-4">
              {stats.premiumConversionPct}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.premiumConversionPct}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-3">
              {stats.premiumUsers} of {stats.totalUsers} users
            </p>
          </div>

          {/* Avg Sessions per Coach */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Avg Sessions/Coach
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {stats.averageSessionsPerCoach}
            </p>
            <p className="text-gray-500 text-xs mt-3">
              {stats.roleBreakdown.coach} coaches active
            </p>
          </div>

          {/* Jobs Posted (Last 30 Days) */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Jobs Posted
              </h3>
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {stats.jobsPostedLast30Days}
            </p>
            <p className="text-gray-500 text-xs mt-3">Last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
