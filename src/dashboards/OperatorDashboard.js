import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Trash2,
  Edit,
  Ban,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Video,
  Brain,
  Clock,
  CheckCircle,
  Command
} from 'lucide-react';
import { ResponsiveContainer, Line, LineChart } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer
} from 'firebase/firestore';

const OperatorDashboard = () => {
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState([]);

  // Mock data - replace with Firebase (setters retained for upcoming Firebase integration)
  // eslint-disable-next-line no-unused-vars
  const [metrics, setMetrics] = useState({
    revenue: { value: 45280, change: 12.5, trend: [32, 35, 38, 36, 40, 43, 45] },
    students: { value: 1847, change: 8.3, trend: [1620, 1680, 1720, 1780, 1810, 1830, 1847] },
    employers: { value: 234, change: 15.2, trend: [190, 200, 210, 215, 225, 230, 234] },
    jobs: { value: 892, change: -2.1, trend: [920, 915, 910, 900, 895, 893, 892] }
  });

  // eslint-disable-next-line no-unused-vars
  const [users, setUsers] = useState([
    { id: 1, name: 'Sarah Mitchell', type: 'Student', email: 's.mitchell@uni.ac.uk', joined: '2024-02-18', status: 'Active' },
    { id: 2, name: 'BuildTech Solutions', type: 'Employer', email: 'hr@buildtech.com', joined: '2024-02-17', status: 'Pending' },
    { id: 3, name: 'James Kumar', type: 'Student', email: 'j.kumar@uni.ac.uk', joined: '2024-02-15', status: 'Active' },
    { id: 4, name: 'DesignPro Ltd', type: 'Employer', email: 'info@designpro.co.uk', joined: '2024-02-14', status: 'Flagged' },
    { id: 5, name: 'Emma Thompson', type: 'Student', email: 'e.thompson@uni.ac.uk', joined: '2024-02-12', status: 'Active' },
    { id: 6, name: 'TechFlow Systems', type: 'Employer', email: 'contact@techflow.com', joined: '2024-02-10', status: 'Active' }
  ]);

  // eslint-disable-next-line no-unused-vars
  const [services, setServices] = useState({
    cvUsage: { used: 3420, limit: 5000, percentage: 68.4 },
    coachingSessions: [
      { id: 1, student: 'Sarah M.', date: '2024-02-22', time: '14:00' },
      { id: 2, student: 'James K.', date: '2024-02-23', time: '10:00' },
      { id: 3, student: 'Emma T.', date: '2024-02-23', time: '15:30' },
      { id: 4, student: 'Alex P.', date: '2024-02-24', time: '11:00' },
      { id: 5, student: 'Lisa M.', date: '2024-02-25', time: '16:00' }
    ],
    videoPitches: [
      { id: 1, student: 'Sarah Mitchell', duration: '45s', status: 'pending' },
      { id: 2, student: 'James Kumar', duration: '58s', status: 'pending' },
      { id: 3, student: 'Emma Thompson', duration: '42s', status: 'pending' }
    ]
  });

  // eslint-disable-next-line no-unused-vars
  const [apiStatus, setApiStatus] = useState({
    linkedin: 'online',
    openai: 'online',
    stripe: 'online'
  });

  useEffect(() => {
    const loadOperatorData = async () => {
      try {
        // ── 1. Aggregated counts via getCountFromServer (efficient, no reads per doc) ──
        const [studentsSnap, employersSnap, jobsSnap, cvSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'users'), where('role', 'in', ['student', 'graduate']))),
          getCountFromServer(query(collection(db, 'users'), where('role', '==', 'employer'))),
          getCountFromServer(query(collection(db, 'opportunities'), where('status', '==', 'active'))),
          getCountFromServer(collection(db, 'cv_optimizations'))
        ]);

        const studentCount = studentsSnap.data().count;
        const employerCount = employersSnap.data().count;
        const jobCount = jobsSnap.data().count;
        const cvCount = cvSnap.data().count;

        setMetrics(prev => ({
          revenue:   { ...prev.revenue },                    // revenue stays mock until Stripe is live
          students:  { value: studentCount,  change: 0, trend: [...prev.students.trend.slice(1), studentCount] },
          employers: { value: employerCount, change: 0, trend: [...prev.employers.trend.slice(1), employerCount] },
          jobs:      { value: jobCount,      change: 0, trend: [...prev.jobs.trend.slice(1), jobCount] }
        }));

        setServices(prev => ({
          ...prev,
          cvUsage: {
            used: cvCount,
            limit: 5000,
            percentage: Math.min(Math.round((cvCount / 5000) * 100), 100)
          }
        }));

        // ── 2. Live user table (most recent 50 users) ──
        const usersSnap = await getDocs(
          query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50))
        );
        const userRows = usersSnap.docs.map(d => {
          const u = d.data();
          const joined = u.createdAt?.toDate?.()
            ? u.createdAt.toDate().toLocaleDateString('en-GB')
            : '—';
          return {
            id: d.id,
            name: u.displayName || u.name || u.email?.split('@')[0] || 'Unknown',
            type: u.role === 'employer' ? 'Employer' : 'Student',
            email: u.email || '',
            joined,
            status: u.status === 'suspended' ? 'Flagged'
              : u.status === 'pending' ? 'Pending'
              : 'Active'
          };
        });
        setUsers(userRows);

        // ── 3. Upcoming coaching sessions (next 5) ──
        const sessionsSnap = await getDocs(
          query(
            collection(db, 'coachingSessions'),
            where('status', '==', 'confirmed'),
            orderBy('date', 'asc'),
            limit(5)
          )
        );
        const sessions = sessionsSnap.docs.map(d => {
          const s = d.data();
          const dateObj = s.date?.toDate?.() ?? new Date(s.date);
          return {
            id: d.id,
            student: s.studentName || 'Student',
            date: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          };
        });

        // ── 4. Pending video pitches queue ──
        const pitchesSnap = await getDocs(
          query(
            collection(db, 'video_pitches'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(5)
          )
        );
        const pitches = pitchesSnap.docs.map(d => {
          const p = d.data();
          const durationSec = p.duration || 0;
          const durationLabel = durationSec > 0 ? `${durationSec}s` : '—';
          return {
            id: d.id,
            student: p.userName || p.userId || 'Student',
            duration: durationLabel,
            status: 'pending'
          };
        });

        setServices(prev => ({
          ...prev,
          coachingSessions: sessions.length > 0 ? sessions : prev.coachingSessions,
          videoPitches: pitches.length > 0 ? pitches : prev.videoPitches
        }));

      } catch (error) {
        console.error('Operator dashboard load error:', error);
        // Data stays at mock defaults on error
      }
    };

    loadOperatorData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const toggleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedRows.length === filteredUsers.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredUsers.map(u => u.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] pt-20">
      {/* Header */}
      <div className="border-b border-slate-800 bg-[#0a0f1e]">
        <div className="container mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Operator Dashboard</h1>
              <p className="text-sm text-slate-400">
                {userProfile?.displayName} • Real-time platform control
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-slate-300">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 py-6">
        {/* Metric Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Total Revenue"
            value={`£${(metrics.revenue.value / 1000).toFixed(1)}k`}
            change={metrics.revenue.change}
            trend={metrics.revenue.trend}
            icon={DollarSign}
          />
          <MetricCard
            label="Active Students"
            value={metrics.students.value.toLocaleString()}
            change={metrics.students.change}
            trend={metrics.students.trend}
            icon={Users}
          />
          <MetricCard
            label="Employer Partners"
            value={metrics.employers.value}
            change={metrics.employers.change}
            trend={metrics.employers.trend}
            icon={Building2}
          />
          <MetricCard
            label="Live Jobs"
            value={metrics.jobs.value}
            change={metrics.jobs.change}
            trend={metrics.jobs.trend}
            icon={Briefcase}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Activity Feed (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {/* Table Header */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Job & User Management</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{filteredUsers.length} records</span>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Command+K Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users, companies..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-20 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400">
                      <Command className="w-3 h-3" />
                      <span>K</span>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedRows.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                  >
                    <span className="text-sm text-purple-300 font-medium">
                      {selectedRows.length} selected
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approve All
                      </button>
                      <button className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === filteredUsers.length}
                          onChange={selectAll}
                          className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-purple-600 focus:ring-purple-500/50"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        User/Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Date Joined
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(user.id)}
                            onChange={() => toggleRowSelect(user.id)}
                            className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-purple-600 focus:ring-purple-500/50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.type === 'Student'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                          }`}>
                            {user.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{user.joined}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'Active'
                              ? 'bg-green-500/10 text-green-400'
                              : user.status === 'Pending'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4 text-slate-400 hover:text-white" />
                            </button>
                            <button className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors" title="Ban">
                              <Ban className="w-4 h-4 text-slate-400 hover:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Product Service Monitor (1/3) */}
          <div className="space-y-4">
            {/* AI CV Usage */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">AI CV Usage</h3>
                  <p className="text-xs text-slate-400">Today's consumption</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Tokens Used</span>
                  <span className="font-bold text-white">{services.cvUsage.used.toLocaleString()} / {services.cvUsage.limit.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                    style={{ width: `${services.cvUsage.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500">{services.cvUsage.percentage}% capacity</div>
              </div>
            </div>

            {/* Coaching Bookings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Coaching Sessions</h3>
                  <p className="text-xs text-slate-400">Next 5 bookings</p>
                </div>
              </div>

              <div className="space-y-2">
                {services.coachingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{session.student}</div>
                      <div className="text-xs text-slate-400">{session.date}</div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {session.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Elevated Pitches Queue */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Elevated Pitches</h3>
                  <p className="text-xs text-slate-400">Quality check queue</p>
                </div>
              </div>

              <div className="space-y-2">
                {services.videoPitches.map((pitch) => (
                  <div
                    key={pitch.id}
                    className="flex items-center justify-between p-2 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{pitch.student}</div>
                      <div className="text-xs text-slate-400">{pitch.duration}</div>
                    </div>
                    <button className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded transition-colors">
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Footer */}
      <div className="border-t border-slate-800 bg-[#0a0f1e] mt-8">
        <div className="container mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">System Health & Integrations</div>
            <div className="flex items-center gap-6">
              <SystemStatus label="LinkedIn Sync" status={apiStatus.linkedin} />
              <SystemStatus label="OpenAI" status={apiStatus.openai} />
              <SystemStatus label="Stripe" status={apiStatus.stripe} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== COMPONENTS ===== */

const MetricCard = ({ label, value, change, trend, icon: Icon }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          isPositive ? 'text-green-400' : 'text-red-400'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400 mb-3">{label}</div>
      
      {/* Sparkline */}
      <div className="h-12 -mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.map((val, i) => ({ value: val }))}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SystemStatus = ({ label, status }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${
      status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
    }`} />
    <span className="text-xs text-slate-300">{label}</span>
    <span className={`text-xs font-semibold uppercase ${
      status === 'online' ? 'text-green-400' : 'text-red-400'
    }`}>
      {status}
    </span>
  </div>
);

export default OperatorDashboard;
