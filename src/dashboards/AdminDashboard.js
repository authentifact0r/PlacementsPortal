import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

function AdminDashboard() {
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
        status: 'Pending Verification'
      },
      {
        id: 3,
        name: 'James Kumar',
        email: 'j.kumar@example.com',
        role: 'student',
        joinedDate: '2024-02-15',
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

  const getRoleBadge = (role) => {
    const roleMap = {
      'student': { class: 'role-student', label: 'Student' },
      'employer': { class: 'role-employer', label: 'Employer' },
      'admin': { class: 'role-admin', label: 'Admin' }
    };
    return roleMap[role] || { class: '', label: role };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Active': 'status-active',
      'Pending Verification': 'status-pending',
      'Suspended': 'status-suspended'
    };
    return statusMap[status] || 'status-default';
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p>Platform overview and management</p>
        </div>
      </div>

      {/* Stats Overview - Primary */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <div className="stat-number">{stats.activeStudents}</div>
            <div className="stat-label">Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <div className="stat-number">{stats.activeEmployers}</div>
            <div className="stat-label">Employers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalJobs}</div>
            <div className="stat-label">Active Jobs</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalApplications}</div>
            <div className="stat-label">Applications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-info">
            <div className="stat-number">{stats.placementsMade}</div>
            <div className="stat-label">Placements</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Pending Approvals */}
        <div className="dashboard-section priority-section">
          <div className="section-header">
            <h2>⚠️ Pending Approvals ({pendingApprovals.length})</h2>
          </div>
          
          {pendingApprovals.length === 0 ? (
            <div className="empty-state">
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="approvals-list">
              {pendingApprovals.map(item => (
                <div key={item.id} className="approval-item">
                  <div className="approval-info">
                    <span className={`approval-type type-${item.type}`}>
                      {item.type === 'employer' ? '🏢 Employer' : '💼 Job'}
                    </span>
                    <h4>{item.company || item.title}</h4>
                    {item.documents && (
                      <p className="approval-details">Documents: {item.documents}</p>
                    )}
                    <span className="approval-date">Submitted {item.submittedDate}</span>
                  </div>
                  <div className="approval-actions">
                    <button className="btn btn-success btn-small">Approve</button>
                    <button className="btn btn-danger btn-small">Reject</button>
                    <button className="btn btn-secondary btn-small">Review</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Users</h2>
            <a href="#" className="section-link">View All →</a>
          </div>
          
          <div className="users-list">
            {recentUsers.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h4>{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                    <span className="user-joined">Joined {user.joinedDate}</span>
                  </div>
                </div>
                <div className="user-meta">
                  <span className={`role-badge ${getRoleBadge(user.role).class}`}>
                    {getRoleBadge(user.role).label}
                  </span>
                  <span className={`status-badge ${getStatusBadge(user.status)}`}>
                    {user.status}
                  </span>
                </div>
                <div className="user-actions">
                  <button className="btn btn-secondary btn-small">View</button>
                  <button className="btn btn-text btn-small">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Metrics */}
        <div className="dashboard-section">
          <h2>This Month's Activity</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Job Posts</div>
              <div className="metric-value">{platformMetrics.jobPostsThisMonth}</div>
              <div className="metric-change positive">+12% from last month</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Applications</div>
              <div className="metric-value">{platformMetrics.applicationsThisMonth}</div>
              <div className="metric-change positive">+8% from last month</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Placements</div>
              <div className="metric-value">{platformMetrics.placementsThisMonth}</div>
              <div className="metric-change positive">+15% from last month</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Active Jobseekers</div>
              <div className="metric-value">{platformMetrics.activeJobseekers}</div>
              <div className="metric-change neutral">Steady</div>
            </div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="dashboard-section">
          <h2>Admin Actions</h2>
          <div className="admin-actions-grid">
            <button className="admin-action-btn">
              <span className="action-icon">👥</span>
              <span>Manage Users</span>
            </button>
            <button className="admin-action-btn">
              <span className="action-icon">💼</span>
              <span>Manage Jobs</span>
            </button>
            <button className="admin-action-btn">
              <span className="action-icon">📊</span>
              <span>Analytics</span>
            </button>
            <button className="admin-action-btn">
              <span className="action-icon">⚙️</span>
              <span>Settings</span>
            </button>
            <button className="admin-action-btn">
              <span className="action-icon">📧</span>
              <span>Send Announcement</span>
            </button>
            <button className="admin-action-btn">
              <span className="action-icon">🗑️</span>
              <span>Moderation Queue</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
