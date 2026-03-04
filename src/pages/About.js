import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

function About() {
  return (
    <div className="about-page">
      {/* Hero */}
      <div className="page-header">
        <div className="container">
          <h1>About PlacementsPortal</h1>
          <p>Empowering postgraduate talent through meaningful career placements</p>
        </div>
      </div>

      {/* Mission */}
      <section className="mission">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p className="mission-statement">
              To bridge the gap between talented postgraduate students and employers seeking 
              skilled professionals, creating pathways to successful careers across civil 
              engineering, structural engineering, IT, and project consultancy sectors.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="story">
        <div className="container">
          <div className="story-grid">
            <div className="story-text">
              <h2>Our Story</h2>
              <p>
                PlacementsPortal was founded by career development professionals who witnessed 
                the challenges postgraduate students face when transitioning from academia to 
                industry. Despite having strong qualifications, many students struggled to 
                connect with employers offering suitable placements.
              </p>
              <p>
                We recognized that employers were equally frustrated—investing significant time 
                and resources in recruitment without finding the right candidates. The disconnect 
                was clear, and we set out to solve it.
              </p>
              <p>
                Today, PlacementsPortal serves as the central hub connecting postgraduate talent 
                with opportunities across key sectors. We've helped thousands of students launch 
                successful careers while enabling employers to efficiently find skilled professionals.
              </p>
            </div>
            <div className="story-image">
              <div className="placeholder-image">
                📚 → 💼
                <p>From Study to Career Success</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="values">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🎯</div>
              <h3>Quality First</h3>
              <p>We maintain high standards for both opportunities and candidates, ensuring the best match for all parties.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Integrity</h3>
              <p>Transparent processes, honest communication, and ethical practices guide everything we do.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">🌍</div>
              <h3>Inclusivity</h3>
              <p>We champion diversity and support students from all backgrounds, including international talent.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">💡</div>
              <h3>Innovation</h3>
              <p>Continuously improving our platform and services to better serve students and employers.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">🚀</div>
              <h3>Empowerment</h3>
              <p>Providing tools, resources, and support that enable students to take control of their careers.</p>
            </div>

            <div className="value-card">
              <div className="value-icon">🎓</div>
              <h3>Excellence</h3>
              <p>Commitment to delivering exceptional experiences and outcomes for everyone we serve.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="impact">
        <div className="container">
          <h2>Our Impact</h2>
          <div className="impact-stats">
            <div className="impact-stat">
              <div className="impact-number">1000+</div>
              <div className="impact-label">Students Placed</div>
              <p>Successfully matched with career opportunities</p>
            </div>

            <div className="impact-stat">
              <div className="impact-number">200+</div>
              <div className="impact-label">Partner Employers</div>
              <p>Leading organizations across multiple sectors</p>
            </div>

            <div className="impact-stat">
              <div className="impact-number">500+</div>
              <div className="impact-label">Active Opportunities</div>
              <p>Live placements, internships, and graduate roles</p>
            </div>

            <div className="impact-stat">
              <div className="impact-number">95%</div>
              <div className="impact-label">Satisfaction Rate</div>
              <p>Students and employers highly satisfied</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="team">
        <div className="container">
          <h2>Our Team</h2>
          <p className="team-intro">
            We're a dedicated team of career development professionals, recruiters, and 
            technologists committed to student success.
          </p>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">👨‍💼</div>
              <h4>Career Advisors</h4>
              <p>Experienced professionals providing personalized guidance and support</p>
            </div>

            <div className="team-member">
              <div className="member-avatar">👩‍💻</div>
              <h4>Technical Team</h4>
              <p>Developers and designers building seamless platform experiences</p>
            </div>

            <div className="team-member">
              <div className="member-avatar">🤝</div>
              <h4>Employer Relations</h4>
              <p>Building partnerships and ensuring employer satisfaction</p>
            </div>

            <div className="team-member">
              <div className="member-avatar">📊</div>
              <h4>Operations</h4>
              <p>Managing processes and ensuring smooth platform operations</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h2>Join Our Community</h2>
          <p>Whether you're a student seeking opportunities or an employer looking for talent</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/contact" className="btn btn-secondary btn-large">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
