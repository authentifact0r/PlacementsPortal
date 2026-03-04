import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './StudentSupport.css';

function StudentSupport() {
  const { currentUser } = useAuth();

  return (
    <div className="student-support-page">
      {/* Hero */}
      <div className="page-header">
        <div className="container">
          <h1>Student Support Services</h1>
          <p>Expert guidance to help you succeed in your career journey</p>
        </div>
      </div>

      {/* Support Services */}
      <section className="support-services">
        <div className="container">
          <h2>How We Support You</h2>
          
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📝</div>
              <h3>CV Review & Optimization</h3>
              <p>Get professional feedback on your CV from industry experts. We'll help you highlight your strengths and tailor your application to your target roles.</p>
              <ul className="service-features">
                <li>Personalized feedback</li>
                <li>Industry-specific advice</li>
                <li>ATS optimization</li>
                <li>Multiple revisions</li>
              </ul>
              {currentUser ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Request CV Review
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Sign Up to Book
                </Link>
              )}
            </div>

            <div className="service-card">
              <div className="service-icon">💼</div>
              <h3>Career Coaching</h3>
              <p>One-on-one sessions with experienced career advisors to help you plan your career path and prepare for applications.</p>
              <ul className="service-features">
                <li>30-minute consultations</li>
                <li>Career planning guidance</li>
                <li>Application strategy</li>
                <li>Goal setting support</li>
              </ul>
              {currentUser ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Book Coaching Session
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Sign Up to Book
                </Link>
              )}
            </div>

            <div className="service-card">
              <div className="service-icon">🎯</div>
              <h3>Interview Preparation</h3>
              <p>Practice interviews with feedback, learn common questions, and develop confidence for your real interviews.</p>
              <ul className="service-features">
                <li>Mock interviews</li>
                <li>Question bank access</li>
                <li>Behavioral coaching</li>
                <li>Technical prep</li>
              </ul>
              {currentUser ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Start Preparation
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Sign Up to Start
                </Link>
              )}
            </div>

            <div className="service-card">
              <div className="service-icon">🌟</div>
              <h3>Skills Development</h3>
              <p>Access resources and workshops to develop in-demand skills for your target sector.</p>
              <ul className="service-features">
                <li>Online workshops</li>
                <li>Skill assessments</li>
                <li>Resource library</li>
                <li>Certification guidance</li>
              </ul>
              {currentUser ? (
                <Link to="/dashboard" className="btn btn-primary">
                  Browse Resources
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary">
                  Sign Up to Access
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="resources">
        <div className="container">
          <h2>Free Resources</h2>
          
          <div className="resources-grid">
            <div className="resource-card">
              <h4>📚 Application Guides</h4>
              <p>Step-by-step guides for writing effective applications</p>
              <a href="/resources#guides" className="resource-link">Read Guides →</a>
            </div>

            <div className="resource-card">
              <h4>📊 Salary Insights</h4>
              <p>Industry salary data and negotiation tips</p>
              <a href="/resources#salary" className="resource-link">View Data →</a>
            </div>

            <div className="resource-card">
              <h4>🎥 Video Tutorials</h4>
              <p>Expert advice on career topics and interview skills</p>
              <a href="/resources#videos" className="resource-link">Watch Now →</a>
            </div>

            <div className="resource-card">
              <h4>📝 Templates</h4>
              <p>CV, cover letter, and email templates</p>
              <a href="/resources#templates" className="resource-link">Download →</a>
            </div>

            <div className="resource-card">
              <h4>🗓️ Events Calendar</h4>
              <p>Career fairs, workshops, and networking events</p>
              <a href="/community/events" className="resource-link">View Events →</a>
            </div>

            <div className="resource-card">
              <h4>❓ FAQ</h4>
              <p>Answers to common questions about placements</p>
              <a href="/resources#faq" className="resource-link">Read FAQ →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2>Student Success Stories</h2>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">
                "The CV review service was incredibly helpful. Within two weeks of implementing the feedback, I got three interview invitations!"
              </p>
              <div className="testimonial-author">
                <strong>Sarah M.</strong>
                <span>Civil Engineering Graduate</span>
              </div>
            </div>

            <div className="testimonial-card">
              <p className="testimonial-text">
                "My career coach helped me identify my strengths and target the right opportunities. I landed my dream placement!"
              </p>
              <div className="testimonial-author">
                <strong>James K.</strong>
                <span>IT Service Desk Analyst</span>
              </div>
            </div>

            <div className="testimonial-card">
              <p className="testimonial-text">
                "The interview preparation gave me the confidence I needed. I felt prepared for every question they asked."
              </p>
              <div className="testimonial-author">
                <strong>Priya S.</strong>
                <span>Project Consultant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Get Support?</h2>
          <p>Join thousands of students getting expert career guidance</p>
          {currentUser ? (
            <Link to="/dashboard" className="btn btn-primary btn-large">
              Access Support Services
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

export default StudentSupport;
