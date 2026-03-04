import React, { useState } from 'react';
import './Contact.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Integrate with Firebase Cloud Function
    // For now, simulate submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', category: 'general', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  return (
    <div className="contact-page">
      {/* Hero */}
      <div className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We're here to help. Get in touch with our team.</p>
        </div>
      </div>

      {/* Contact Content */}
      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send Us a Message</h2>
              
              {submitted && (
                <div className="success-message">
                  ✓ Thank you! Your message has been sent. We'll respond within 24 hours.
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Enquiry Type *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="general">General Enquiry</option>
                    <option value="student">Student Support</option>
                    <option value="employer">Employer Partnerships</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief subject line"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-large"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="contact-info-section">
              <h2>Other Ways to Reach Us</h2>

              <div className="info-cards">
                <div className="info-card">
                  <div className="info-icon">📧</div>
                  <h4>Email</h4>
                  <p>For general enquiries:</p>
                  <a href="mailto:hello@placementsportal.com">hello@placementsportal.com</a>
                  <p className="info-note">We respond within 24 hours</p>
                </div>

                <div className="info-card">
                  <div className="info-icon">💼</div>
                  <h4>Employer Enquiries</h4>
                  <p>For partnership opportunities:</p>
                  <a href="mailto:employers@placementsportal.com">employers@placementsportal.com</a>
                  <p className="info-note">Dedicated account managers available</p>
                </div>

                <div className="info-card">
                  <div className="info-icon">🎓</div>
                  <h4>Student Support</h4>
                  <p>For application help:</p>
                  <a href="mailto:support@placementsportal.com">support@placementsportal.com</a>
                  <p className="info-note">Monday-Friday, 9am-5pm GMT</p>
                </div>

                <div className="info-card">
                  <div className="info-icon">🔧</div>
                  <h4>Technical Support</h4>
                  <p>For platform issues:</p>
                  <a href="mailto:tech@placementsportal.com">tech@placementsportal.com</a>
                  <p className="info-note">24-hour response time</p>
                </div>
              </div>

              {/* FAQ Link */}
              <div className="faq-prompt">
                <h4>Looking for Quick Answers?</h4>
                <p>Check our FAQ section for answers to common questions about applications, placements, and account management.</p>
                <a href="/resources#faq" className="btn btn-secondary">
                  View FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Hours */}
      <section className="office-hours">
        <div className="container">
          <h2>Office Hours</h2>
          <div className="hours-grid">
            <div className="hours-item">
              <strong>Monday - Friday</strong>
              <span>9:00 AM - 6:00 PM GMT</span>
            </div>
            <div className="hours-item">
              <strong>Saturday</strong>
              <span>10:00 AM - 2:00 PM GMT</span>
            </div>
            <div className="hours-item">
              <strong>Sunday</strong>
              <span>Closed</span>
            </div>
          </div>
          <p className="hours-note">
            Email enquiries received outside office hours will be responded to on the next business day.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Contact;
