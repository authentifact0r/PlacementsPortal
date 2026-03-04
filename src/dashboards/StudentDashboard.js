import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './StudentDashboard.css';

function StudentDashboard() {
  const { userProfile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({
    applicationsSubmitted: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    profileViews: 0
  });

  useEffect(() => {
    // TODO: Fetch data from Firebase
    // Mock data for now
    setApplications([
      {
        id: 1,
        jobTitle: 'Graduate Civil Engineer',
        company: 'BuildTech Solutions',
        appliedDate: '2024-02-15',
        status: 'Under Review'
      },
      {
        id: 2,
        jobTitle: 'Structural Engineering Intern',
        company: 'DesignPro Ltd',
        appliedDate: '2024-02-10',
        status: 'Interview Scheduled'
      }
    ]);

    setRecommendations([
      {
        id: 3,
        title: 'Project Consultant',
        company: 'ConsultCorp',
        location: 'Birmingham, UK',
        match: 92
      },
      {
        id: 4,
        title: 'IT Service Desk Analyst',
        company: 'TechSupport Global',
        location: 'Remote',
        match: 88
      }
    ]);

    setStats({
      applicationsSubmitted: 5,
      interviewsScheduled: 2,
      offersReceived: 1,
      profileViews: 23
    });
  }, []);

  const getStatusClass = (status) => {
    const statusMap = {
      'Under Review': 'status-review',
      'Interview Scheduled': 'status-interview',
      'Rejected': 'status-rejected',
      'Offer Extended': 'status-offer'
    };
    return statusMap[status] || 'status-default';
  };

  return (
    <div className="student-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userProfile?.firstName || 'Student'}!</h1>
          <p>Here's what's happening with your job search</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <div className="stat-number">{stats.applicationsSubmitted}</div>
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
            <div className="stat-number">{stats.offersReceived}</div>
            <div className="stat-label">Offers</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-info">
            <div className="stat-number">{stats.profileViews}</div>
            <div className="stat-label">Profile Views</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/opportunities" className="action-btn">
              <span className="action-icon">🔍</span>
              <div>
                <strong>Browse Jobs</strong>
                <p>Find new opportunities</p>
              </div>
            </Link>

            <button className="action-btn">
              <span className="action-icon">📝</span>
              <div>
                <strong>Update CV</strong>
                <p>Keep profile current</p>
              </div>
            </button>

            <Link to="/student-support" className="action-btn">
              <span className="action-icon">💼</span>
              <div>
                <strong>Book Coaching</strong>
                <p>Get expert guidance</p>
              </div>
            </Link>

            <button className="action-btn">
              <span className="action-icon">🎓</span>
              <div>
                <strong>Take Assessment</strong>
                <p>Test your skills</p>
              </div>
            </button>
          </div>
        </div>

        {/* My Applications */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Applications</h2>
            <Link to="/applications" className="section-link">View All →</Link>
          </div>
          
          {applications.length === 0 ? (
            <div className="empty-state">
              <p>No applications yet</p>
              <Link to="/opportunities" className="btn btn-primary">
                Start Applying
              </Link>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map(app => (
                <div key={app.id} className="application-item">
                  <div className="application-info">
                    <h4>{app.jobTitle}</h4>
                    <p>{app.company}</p>
                    <span className="applied-date">Applied {app.appliedDate}</span>
                  </div>
                  <div className={`application-status ${getStatusClass(app.status)}`}>
                    {app.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Jobs */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recommended for You</h2>
            <Link to="/opportunities" className="section-link">See More →</Link>
          </div>
          
          <div className="recommendations-list">
            {recommendations.map(job => (
              <div key={job.id} className="recommendation-item">
                <div className="recommendation-header">
                  <div>
                    <h4>{job.title}</h4>
                    <p>{job.company}</p>
                    <span className="job-location">📍 {job.location}</span>
                  </div>
                  <div className="match-score">
                    <div className="match-number">{job.match}%</div>
                    <div className="match-label">Match</div>
                  </div>
                </div>
                <div className="recommendation-actions">
                  <button className="btn btn-primary btn-small">Apply Now</button>
                  <button className="btn btn-secondary btn-small">Save</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Completion */}
        <div className="dashboard-section">
          <h2>Complete Your Profile</h2>
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '65%' }}></div>
            </div>
            <p className="progress-text">65% Complete</p>
          </div>
          
          <div className="profile-tasks">
            <div className="task-item completed">
              <span className="task-icon">✓</span>
              <span>Basic information</span>
            </div>
            <div className="task-item completed">
              <span className="task-icon">✓</span>
              <span>Education details</span>
            </div>
            <div className="task-item">
              <span className="task-icon">○</span>
              <span>Upload CV</span>
            </div>
            <div className="task-item">
              <span className="task-icon">○</span>
              <span>Add skills</span>
            </div>
          </div>
          
          <button className="btn btn-secondary">Complete Profile</button>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
