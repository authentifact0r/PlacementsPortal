import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Briefcase, 
  FileText, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Mail,
  Shield,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboardPremium = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    activeEmployers: 0,
    totalJobs: 0,
    totalApplications: 0,
    placementsMade: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [platformMetrics, setPlatformMetrics] = useState({
    jobPostsThisMonth: 0,
    applicationsThisMonth: 0,
    placementsThisMonth: 0,
    activeJobseekers: 0
  });

  useEffect(() => {
    // TODO: Fetch data from Firebase
    // Mock data for now
    setStats({
      totalUsers: 245,
      activeStudents: 180,
      activeEmployers: 65,
      totalJobs: 87,
      totalApplications: 432,
      placementsMade: 56
    });

    setRecentUsers([
      {
        id: 1,
        name: 'Sarah Mitchell',
        email: 's.mitchell@example.com',
        role: 'student',
        joinedDate: '2024-02-18',
        status: 'Active'
      },
      {
        id: 2,
        name: 'BuildTech Solutions',
        email: 'hr@buildtech.com',
        role: 'employer',
        joinedDate: '2024-02-17',
        status: 'Pending'
      },
      {
        id: 3,
        name: 'James Kumar',
        email: 'j.kumar@example.com',
        role: 'student',
        joinedDate: '2024-02-15',
        status: 'Active'
      },
      {
        id: 4,
        name: 'TechFlow Systems',
        email: 'info@techflow.com',
        role: 'employer',
        joinedDate: '2024-02-14',
        status: 'Active'
      }
    ]);

    setPendingApprovals([
      {
        id: 1,
        type: 'employer',
        company: 'DesignPro Ltd',
        submittedDate: '2024-02-17',
        documents: 'Company registration, License'
      },
      {
        id: 2,
        type: 'job',
        title: 'Senior Civil Engineer',
        company: 'Infrastructure Partners',
        submittedDate: '2024-02-16'
      }
    ]);

    setPlatformMetrics({
      jobPostsThisMonth: 23,
      applicationsThisMonth: 156,
      placementsThisMonth: 8,
      activeJobseekers: 142
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] via-purple-900 to-purple-700 pt-32 pb-16">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-purple-200 text-lg">
                Welcome back, {userProfile?.displayName || 'Admin'} • {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="text-xs text-purple-200">System Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-white">All Systems Operational</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 -mt-8 pb-16">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Total Users */}
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            change="+12%"
            positive={true}
            gradient="from-blue-500 to-blue-600"
          />

          {/* Active Students */}
          <StatCard
            icon={GraduationCap}
            label="Active Students"
            value={stats.activeStudents}
            change="+8%"
            positive={true}
            gradient="from-purple-500 to-purple-600"
          />

          {/* Active Employers */}
          <StatCard
            icon={Building2}
            label="Active Employers"
            value={stats.activeEmployers}
            change="+15%"
            positive={true}
            gradient="from-orange-500 to-orange-600"
          />

          {/* Total Jobs */}
          <StatCard
            icon={Briefcase}
            label="Active Jobs"
            value={stats.totalJobs}
            change="+5%"
            positive={true}
            gradient="from-teal-500 to-teal-600"
          />

          {/* Total Applications */}
          <StatCard
            icon={FileText}
            label="Applications"
            value={stats.totalApplications}
            change="-2%"
            positive={false}
            gradient="from-pink-500 to-pink-600"
          />

          {/* Placements Made */}
          <StatCard
            icon={TrendingUp}
            label="Placements"
            value={stats.placementsMade}
            change="+20%"
            positive={true}
            gradient="from-green-500 to-green-600"
          />
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
                    <p className="text-sm text-gray-600">{pendingApprovals.length} items require attention</p>
                  </div>
                </div>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            item.type === 'employer' ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                            {item.type === 'employer' ? (
                              <Building2 className={`w-5 h-5 ${item.type === 'employer' ? 'text-orange-600' : 'text-blue-600'}`} />
                            ) : (
                              <Briefcase className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                              {item.type === 'employer' ? 'Employer Verification' : 'Job Posting'}
                            </span>
                            <h4 className="font-bold text-gray-900 mt-1">{item.company || item.title}</h4>
                            {item.documents && (
                              <p className="text-sm text-gray-600 mt-1">
                                <FileText className="w-3 h-3 inline mr-1" />
                                {item.documents}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Submitted {item.submittedDate}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button className="px-4 py-2 border-2 border-gray-300 hover:border-purple-500 text-gray-700 font-semibold rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Month Activity Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">This Month</h2>
                  <p className="text-sm text-gray-600">Platform activity</p>
                </div>
              </div>

              <div className="space-y-4">
                <MetricRow label="Job Posts" value={platformMetrics.jobPostsThisMonth} change="+12%" positive={true} />
                <MetricRow label="Applications" value={platformMetrics.applicationsThisMonth} change="+8%" positive={true} />
                <MetricRow label="Placements" value={platformMetrics.placementsThisMonth} change="+15%" positive={true} />
                <MetricRow label="Active Jobseekers" value={platformMetrics.activeJobseekers} change="Steady" neutral={true} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickActionButton icon={Users} label="Users" />
                <QuickActionButton icon={Briefcase} label="Jobs" />
                <QuickActionButton icon={BarChart3} label="Analytics" />
                <QuickActionButton icon={Settings} label="Settings" />
                <QuickActionButton icon={Mail} label="Announce" />
                <QuickActionButton icon={Shield} label="Security" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Users</h2>
                  <p className="text-sm text-gray-600">Latest registrations</p>
                </div>
              </div>
              <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1">
                View All
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentUsers.map((user, index) => (
                <UserCard key={user.id} user={user} index={index} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* ===== COMPONENTS ===== */

const StatCard = ({ icon: Icon, label, value, change, positive, gradient }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full -mr-16 -mt-16`} />
    
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          positive ? 'text-green-600' : 'text-red-600'
        }`}>
          {positive ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  </motion.div>
);

const MetricRow = ({ label, value, change, positive, neutral }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-gray-900">{value}</span>
      {change && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          neutral ? 'bg-gray-100 text-gray-600' :
          positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {change}
        </span>
      )}
    </div>
  </div>
);

const QuickActionButton = ({ icon: Icon, label }) => (
  <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all group">
    <Icon className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
    <span className="text-xs font-semibold text-gray-700 group-hover:text-purple-700">{label}</span>
  </button>
);

const UserCard = ({ user, index }) => {
  const getRoleColor = (role) => {
    const colors = {
      student: 'bg-blue-100 text-blue-700 border-blue-200',
      employer: 'bg-orange-100 text-orange-700 border-orange-200',
      admin: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Suspended: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">{user.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 truncate">{user.name}</h4>
          <p className="text-sm text-gray-600 truncate">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {user.joinedDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getRoleColor(user.role)}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
          {user.status}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" />
          View
        </button>
        <button className="px-3 py-2 border-2 border-gray-300 hover:border-purple-500 text-gray-700 font-semibold rounded-lg transition-colors">
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default AdminDashboardPremium;
