import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Opportunities.css';

function Opportunities() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sector: 'all',
    type: 'all',
    location: 'all'
  });

  useEffect(() => {
    // TODO: Fetch jobs from Firebase
    // For now, using mock data
    const mockJobs = [
      {
        id: 1,
        title: 'Graduate Civil Engineer',
        company: 'BuildTech Solutions',
        location: 'London, UK',
        type: 'Full-time',
        sector: 'Civil Engineering',
        salary: '£28,000 - £32,000',
        posted: '2 days ago',
        description: 'Exciting opportunity for graduate civil engineers to work on major infrastructure projects.'
      },
      {
        id: 2,
        title: 'Structural Engineering Intern',
        company: 'DesignPro Ltd',
        location: 'Manchester, UK',
        type: 'Internship',
        sector: 'Structural Engineering',
        salary: '£22,000',
        posted: '5 days ago',
        description: '6-month internship working on residential and commercial building projects.'
      },
      {
        id: 3,
        title: 'IT Service Desk Analyst',
        company: 'TechSupport Global',
        location: 'Remote',
        type: 'Full-time',
        sector: 'IT Service Desk',
        salary: '£25,000 - £28,000',
        posted: '1 week ago',
        description: 'Join our growing IT support team providing technical assistance to clients.'
      },
      {
        id: 4,
        title: 'Project Consultant',
        company: 'ConsultCorp',
        location: 'Birmingham, UK',
        type: 'Contract',
        sector: 'Project Consultancy',
        salary: '£300/day',
        posted: '3 days ago',
        description: '6-month contract supporting infrastructure project delivery.'
      }
    ];

    setTimeout(() => {
      setJobs(mockJobs);
      setLoading(false);
    }, 500);
  }, []);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const filteredJobs = jobs.filter(job => {
    if (filters.sector !== 'all' && job.sector !== filters.sector) return false;
    if (filters.type !== 'all' && job.type !== filters.type) return false;
    // Add more filter logic as needed
    return true;
  });

  return (
    <div className="opportunities-page">
      <div className="page-header">
        <div className="container">
          <h1>Career Opportunities</h1>
          <p>Discover placements, internships, and graduate roles across multiple sectors</p>
        </div>
      </div>

      <div className="opportunities-content">
        <div className="container">
          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Sector</label>
              <select 
                value={filters.sector} 
                onChange={(e) => handleFilterChange('sector', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Sectors</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Structural Engineering">Structural Engineering</option>
                <option value="IT Service Desk">IT Service Desk</option>
                <option value="Project Consultancy">Project Consultancy</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Type</label>
              <select 
                value={filters.type} 
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Location</label>
              <select 
                value={filters.location} 
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Locations</option>
                <option value="London">London</option>
                <option value="Manchester">Manchester</option>
                <option value="Birmingham">Birmingham</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-header">
            <p>{filteredJobs.length} opportunities found</p>
          </div>

          {/* Job Listings */}
          <div className="jobs-list">
            {loading ? (
              <div className="loading">Loading opportunities...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="no-results">
                <p>No opportunities match your filters.</p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setFilters({ sector: 'all', type: 'all', location: 'all' })}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <div>
                      <h3>{job.title}</h3>
                      <p className="company">{job.company}</p>
                    </div>
                    <span className="job-type-badge">{job.type}</span>
                  </div>
                  
                  <div className="job-details">
                    <span className="detail-item">📍 {job.location}</span>
                    <span className="detail-item">💼 {job.sector}</span>
                    <span className="detail-item">💰 {job.salary}</span>
                    <span className="detail-item">🕒 {job.posted}</span>
                  </div>

                  <p className="job-description">{job.description}</p>

                  <div className="job-actions">
                    {currentUser ? (
                      <button className="btn btn-primary">Apply Now</button>
                    ) : (
                      <Link to="/register" className="btn btn-primary">
                        Sign Up to Apply
                      </Link>
                    )}
                    <button className="btn btn-secondary">View Details</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Opportunities;
