/**
 * Coaches Dashboard - Team/Career Coaches Management Panel
 * Designed for career coaches to manage sessions, students, and schedules
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  MessageSquare,
  Video,
  FileText,
  Star,
  Target,
  Phone,
  Mail,
  Edit,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import coachingService from '../services/coaching.service';

const CoachesDashboard = () => {
  const { userProfile, currentUser } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const { showSuccess } = useToast(); // TODO: wire up to session confirmation actions
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, sessions, students, schedule

  // Mock data - replace with Firebase (setters retained for upcoming Firebase integration)
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState({
    totalStudents: 42,
    activeSessions: 8,
    completedToday: 3,
    upcomingThisWeek: 12,
    avgRating: 4.8,
    totalHours: 156
  });

  // eslint-disable-next-line no-unused-vars
  const [upcomingSessions, setUpcomingSessions] = useState([
    {
      id: 1,
      student: 'Sarah Mitchell',
      email: 's.mitchell@uni.ac.uk',
      avatar: null,
      sessionType: 'CV Review',
      date: '2024-02-22',
      time: '14:00',
      duration: 60,
      status: 'confirmed',
      notes: 'First-time session, focus on civil engineering CV'
    },
    {
      id: 2,
      student: 'James Kumar',
      email: 'j.kumar@uni.ac.uk',
      avatar: null,
      sessionType: 'Interview Prep',
      date: '2024-02-23',
      time: '10:00',
      duration: 45,
      status: 'confirmed',
      notes: 'Follow-up session, mock interview for software role'
    },
    {
      id: 3,
      student: 'Emma Thompson',
      email: 'e.thompson@uni.ac.uk',
      avatar: null,
      sessionType: 'Career Planning',
      date: '2024-02-23',
      time: '15:30',
      duration: 60,
      status: 'pending',
      notes: 'Exploring project management opportunities'
    }
  ]);

  // eslint-disable-next-line no-unused-vars
  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'Sarah Mitchell',
      email: 's.mitchell@uni.ac.uk',
      major: 'Civil Engineering',
      year: 'Final Year',
      totalSessions: 5,
      lastSession: '2024-02-18',
      status: 'Active',
      progress: 75,
      goals: ['Land placement at BuildTech', 'Improve interview skills']
    },
    {
      id: 2,
      name: 'James Kumar',
      email: 'j.kumar@uni.ac.uk',
      major: 'Computer Science',
      year: 'Penultimate',
      totalSessions: 8,
      lastSession: '2024-02-20',
      status: 'Active',
      progress: 90,
      goals: ['Secure internship at tech company', 'Build portfolio']
    },
    {
      id: 3,
      name: 'Emma Thompson',
      email: 'e.thompson@uni.ac.uk',
      major: 'Business Management',
      year: 'Final Year',
      totalSessions: 3,
      lastSession: '2024-02-15',
      status: 'Inactive',
      progress: 40,
      goals: ['Explore project management roles', 'Networking']
    }
  ]);

  // eslint-disable-next-line no-unused-vars
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'completed', student: 'Sarah M.', action: 'Completed CV Review session', time: '2 hours ago' },
    { id: 2, type: 'scheduled', student: 'James K.', action: 'Scheduled Interview Prep session', time: '4 hours ago' },
    { id: 3, type: 'feedback', student: 'Emma T.', action: 'Left 5-star feedback', time: '1 day ago' },
    { id: 4, type: 'completed', student: 'Alex P.', action: 'Completed Career Planning session', time: '1 day ago' }
  ]);

  useEffect(() => {
    if (!currentUser) return;

    const loadCoachData = async () => {
      try {
        const [firestoreStats, sessions, students, activity] = await Promise.all([
          coachingService.getCoachStats(currentUser.uid),
          coachingService.getSessionsByCoach(currentUser.uid, 20),
          coachingService.getCoachStudents(currentUser.uid),
          coachingService.getRecentActivity(currentUser.uid, 10)
        ]);

        setStats(firestoreStats);

        // Map Firestore sessions → component shape
        const mappedSessions = sessions.map(s => ({
          id: s.id,
          student: s.studentName || 'Student',
          email: s.studentEmail || '',
          avatar: null,
          sessionType: s.sessionType || s.type || 'Session',
          date: s.date instanceof Date
            ? s.date.toISOString().split('T')[0]
            : s.date || '',
          time: s.time || (s.date instanceof Date
            ? s.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            : ''),
          duration: s.duration || 60,
          status: s.status || 'pending',
          notes: s.notes || s.coachNote || ''
        }));
        setUpcomingSessions(mappedSessions);

        // Map student profiles
        const mappedStudents = students.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          major: s.major || '',
          year: s.year || '',
          totalSessions: s.totalSessions || 0,
          lastSession: s.lastSession
            ? (s.lastSession instanceof Date
              ? s.lastSession.toISOString().split('T')[0]
              : s.lastSession)
            : null,
          status: s.status || 'Active',
          progress: s.progress || 0,
          goals: s.goals || []
        }));
        setStudents(mappedStudents);

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error loading coach dashboard:', error);
        // Mock data remains as fallback
      }
    };

    loadCoachData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Session type badge colors
  const getSessionTypeColor = (type) => {
    const colors = {
      'CV Review': 'bg-blue-100 text-blue-700 border-blue-200',
      'Interview Prep': 'bg-purple-100 text-purple-700 border-purple-200',
      'Career Planning': 'bg-orange-100 text-orange-700 border-orange-200',
      'Skills Assessment': 'bg-teal-100 text-teal-700 border-teal-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Status badge colors
  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white">
        <div className="container mx-auto px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  👋 Welcome back, {userProfile?.displayName || 'Coach'}!
                </h1>
                <p className="text-purple-100 text-lg">
                  You have {upcomingSessions.filter(s => s.status === 'confirmed').length} confirmed sessions this week
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-center">
                  <div className="text-3xl font-bold">{stats.avgRating}</div>
                  <div className="text-sm text-purple-200">Avg Rating</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-center">
                  <div className="text-3xl font-bold">{stats.totalStudents}</div>
                  <div className="text-sm text-purple-200">Students</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Upcoming This Week"
            value={stats.upcomingThisWeek}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed Today"
            value={stats.completedToday}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Total Hours"
            value={stats.totalHours}
            color="orange"
          />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={`${stats.avgRating}/5.0`}
            color="purple"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              { id: 'sessions', label: 'Sessions', icon: Calendar },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'schedule', label: 'Schedule', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                  selectedTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionButton
                      icon={Calendar}
                      label="Schedule Session"
                      description="Book a new coaching session"
                      color="blue"
                    />
                    <ActionButton
                      icon={FileText}
                      label="Session Notes"
                      description="Review past session notes"
                      color="purple"
                    />
                    <ActionButton
                      icon={Download}
                      label="Export Report"
                      description="Download monthly report"
                      color="teal"
                    />
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'completed' ? 'bg-green-100 text-green-600' :
                          activity.type === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'feedback' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.type === 'completed' && <CheckCircle className="w-5 h-5" />}
                          {activity.type === 'scheduled' && <Calendar className="w-5 h-5" />}
                          {activity.type === 'feedback' && <Star className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{activity.student}</div>
                          <div className="text-sm text-gray-600">{activity.action}</div>
                        </div>
                        <div className="text-sm text-gray-500">{activity.time}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sessions Tab */}
            {selectedTab === 'sessions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Upcoming Sessions</h3>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Add Session
                  </button>
                </div>

                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} session={session} getSessionTypeColor={getSessionTypeColor} getStatusColor={getStatusColor} />
                ))}
              </div>
            )}

            {/* Students Tab */}
            {selectedTab === 'students' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">My Students ({students.length})</h3>
                  <input
                    type="search"
                    placeholder="Search students..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {students.map((student) => (
                  <StudentCard key={student.id} student={student} />
                ))}
              </div>
            )}

            {/* Schedule Tab */}
            {selectedTab === 'schedule' && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Calendar Integration</h3>
                <p className="text-gray-600 mb-6">
                  Connect your calendar to manage availability and bookings
                </p>
                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                  Connect Calendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STAT CARD COMPONENT
// ============================================

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// ACTION BUTTON COMPONENT
// ============================================

const ActionButton = ({ icon: Icon, label, description, color }) => {
  const colorClasses = {
    blue: 'hover:bg-blue-50 text-blue-600 border-blue-200',
    purple: 'hover:bg-purple-50 text-purple-600 border-purple-200',
    teal: 'hover:bg-teal-50 text-teal-600 border-teal-200'
  };

  return (
    <button className={`p-4 bg-white border-2 rounded-xl text-left transition-all ${colorClasses[color]} hover:scale-105`}>
      <Icon className="w-8 h-8 mb-2" />
      <div className="font-bold text-gray-900 mb-1">{label}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  );
};

// ============================================
// SESSION CARD COMPONENT
// ============================================

const SessionCard = ({ session, getSessionTypeColor, getStatusColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">
            {session.student.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{session.student}</h4>
            <p className="text-sm text-gray-600">{session.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSessionTypeColor(session.sessionType)}`}>
            {session.sessionType}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">{session.time} ({session.duration} mins)</span>
        </div>
      </div>

      {session.notes && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-700">{session.notes}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2">
          <Video className="w-4 h-4" />
          Start Session
        </button>
        <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Message
        </button>
        <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ============================================
// STUDENT CARD COMPONENT
// ============================================

const StudentCard = ({ student }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{student.name}</h4>
            <p className="text-sm text-gray-600">{student.major} • {student.year}</p>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {student.status}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Progress</span>
          <span className="text-sm font-bold text-purple-600">{student.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>

      {/* Goals */}
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Current Goals</div>
        <div className="space-y-2">
          {student.goals.map((goal, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <span>{goal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{student.totalSessions}</div>
          <div className="text-xs text-gray-600">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{student.progress}%</div>
          <div className="text-xs text-gray-600">Complete</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-700">{new Date(student.lastSession).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
          <div className="text-xs text-gray-600">Last Seen</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Book Session
        </button>
        <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
          <Mail className="w-4 h-4" />
        </button>
        <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
          <Phone className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default CoachesDashboard;
