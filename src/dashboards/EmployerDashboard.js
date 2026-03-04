import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { opportunityService } from '../services/opportunity.service';
import './EmployerDashboard.css';

function EmployerDashboard() {
  const { userProfile, currentUser } = useAuth();
  const [activeJobs, setActiveJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    placementsMade: 0
  });

  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Load employer's active job listings
        const jobs = await opportunityService.getAll({
          employerId: currentUser.uid,
          status: 'active'
        });
        setActiveJobs(
          jobs.map(j => ({
            id: j.id,
            title: j.title || j.role || 'Untitled',
            postedDate: j.createdAt
              ? j.createdAt.toLocaleDateString('en-GB')
              : '—',
            applicants: j.applications || 0,
            views: j.views || 0,
            status: 'Active'
          }))
        );

        // Load applications for this employer
        const applications = await opportunityService.getApplicationsByEmployer(currentUser.uid);
        // Show most recent 5
        const recent = applications.slice(0, 5).map(app => ({
          id: app.id,
          candidateName: app.studentName || app.candidateName || 'Applicant',
          jobTitle: app.jobTitle || app.role || '—',
          appliedDate: app.submittedAt
            ? app.submittedAt.toLocaleDateString('en-GB')
            : '—',
          status: capitalize(app.status || 'submitted'),
          qualification: app.qualification || app.degree || ''
        }));
        setRecentApplications(recent);

        // Compute stats
        const totalApplications = applications.length;
        const interviews = applications.filter(
          a => a.status === 'interview' || a.status === 'shortlisted'
        ).length;
        const placements = applications.filter(a => a.status === 'placed' || a.status === 'hired').length;

        setStats({
          activeJobs: jobs.length,
          totalApplications,
          interviewsScheduled: interviews,
          placementsMade: placements
        });
      } catch (error) {
        console.error('Error loading employer dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const getStatusClass = (status) => {
    const statusMap = {
      'New': 'status-new',
      'Reviewing': 'status-reviewing',
      'Shortlisted': 'status-shortlisted',
      'Rejected': 'status-rejected'
    };
    return statusMap[status] || 'status-default';
  };

  if (loading) {
    return (
      <div className="employer-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="employer-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userProfile?.company || 'Employer'}!</h1>
          <p>Manage your job postings and review applications</p>
        </div>
        <button className="btn btn-primary">
          <span>+</span> Post New Job
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{stats.activeJobs}</div>
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
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.interviewsScheduled}</div>
            <div className="stat-label">Interviews</div>
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
        {/* Active Job Listings */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Job Listings</h2>
            <Link to="/jobs" className="section-link">Manage All →</Link>
          </div>
          
          {activeJobs.length === 0 ? (
            <div className="empty-state">
              <p>No active job postings</p>
              <button className="btn btn-primary">Post Your First Job</button>
            </div>
          ) : (
            <div className="jobs-list">
              {activeJobs.map(job => (
                <div key={job.id} className="job-item">
                  <div className="job-header">
                    <div>
                      <h4>{job.title}</h4>
                      <p className="job-date">Posted {job.postedDate}</p>
                    </div>
                    <span className="job-status-badge">{job.status}</span>
                  </div>
                  
                  <div className="job-metrics">
                    <div className="metric">
                      <span className="metric-icon">👤</span>
                      <span>{job.applicants} applicants</span>
                    </div>
                    <div className="metric">
                      <span className="metric-icon">👁️</span>
                      <span>{job.views} views</span>
                    </div>
                  </div>

                  <div className="job-actions">
                    <button className="btn btn-secondary btn-small">View Applications</button>
                    <button className="btn btn-text btn-small">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Applications</h2>
            <Link to="/applications" className="section-link">View All →</Link>
          </div>
          
          <div className="applications-list">
            {recentApplications.map(app => (
              <div key={app.id} className="application-item">
                <div className="applicant-info">
                  <div className="applicant-avatar">
                    {app.candidateName.charAt(0)}
                  </div>
                  <div>
                    <h4>{app.candidateName}</h4>
                    <p className="job-applied">{app.jobTitle}</p>
                    <p className="qualification">{app.qualification}</p>
                    <span className="applied-date">Applied {app.appliedDate}</span>
                  </div>
                </div>
                
                <div className="application-actions">
                  <span className={`application-status ${getStatusClass(app.status)}`}>
                    {app.status}
                  </span>
                  <div className="action-buttons-inline">
                    <button className="btn btn-primary btn-small">View Profile</button>
                    <button className="btn btn-secondary btn-small">Download CV</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn">
              <span className="action-icon">✏️</span>
              <div>
                <strong>Post New Job</strong>
                <p>Create job listing</p>
              </div>
            </button>

            <button className="action-btn">
              <span className="action-icon">🔍</span>
              <div>
                <strong>Search Candidates</strong>
                <p>Browse talent pool</p>
              </div>
            </button>

            <button className="action-btn">
              <span className="action-icon">📊</span>
              <div>
                <strong>View Analytics</strong>
                <p>Recruitment insights</p>
              </div>
            </button>

            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <div>
                <strong>Account Settings</strong>
                <p>Update profile</p>
              </div>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="dashboard-section">
          <h2>Account Information</h2>
          <div className="account-details">
            <div className="detail-row">
              <span className="detail-label">Company:</span>
              <span className="detail-value">{userProfile?.company || 'Not set'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Sector:</span>
              <span className="detail-value">{userProfile?.sector || 'Not set'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Contact Email:</span>
              <span className="detail-value">{userProfile?.email || 'Not set'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Account Status:</span>
              <span className="detail-value status-verified">✓ Verified</span>
            </div>
          </div>
          <button className="btn btn-secondary">Edit Company Profile</button>
        </div>
      </div>
    </div>
  );
}

export default EmployerDashboard;
