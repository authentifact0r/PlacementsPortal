import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaBriefcase, FaGraduationCap, FaUsers, FaGlobe } from 'react-icons/fa';
import HeroVideo from '../components/HeroVideo';
import HowItWorks from '../components/HowItWorks';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import PartnerLogos from '../components/PartnerLogos';
import AnimatedCounter from '../components/AnimatedCounter';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: <FaBriefcase />,
      title: 'Career Opportunities',
      description: 'Access work placements, internships, and graduate roles across multiple sectors',
      link: '/opportunities',
      linkText: 'Browse Jobs',
      color: '#667eea'
    },
    {
      icon: <FaUsers />,
      title: 'Employer Partnerships',
      description: 'Connect with leading employers actively seeking postgraduate talent',
      link: '/employers',
      linkText: 'View Employers',
      color: '#764ba2'
    },
    {
      icon: <FaGraduationCap />,
      title: 'Student Support',
      description: 'Get expert guidance, CV reviews, and career coaching from professionals',
      link: '/student-support',
      linkText: 'Get Support',
      color: '#f093fb'
    },
    {
      icon: <FaGlobe />,
      title: 'Global Opportunities',
      description: 'Explore international placements and sponsorship opportunities',
      link: '/global-students',
      linkText: 'Learn More',
      color: '#4facfe'
    }
  ];

  const sectors = [
    { icon: '🏗️', name: 'Civil Engineering' },
    { icon: '🏢', name: 'Structural Engineering' },
    { icon: '💻', name: 'IT Service Desk' },
    { icon: '📊', name: 'Project Consultancy' },
    { icon: '🔬', name: 'Research & Development' },
    { icon: '🌐', name: 'Infrastructure' }
  ];

  return (
    <div className="home-page">
      {/* Hero Video Section */}
      <HeroVideo />

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Empowering Your Career Journey</h2>
            <p className="section-subtitle">
              Everything you need to land your dream placement in one platform
            </p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div
                  className="feature-icon"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <Link to={feature.link} className="feature-link">
                  {feature.linkText}
                  <FaArrowRight className="link-arrow" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <AnimatedCounter end={500} suffix="+" label="Active Opportunities" />
            <AnimatedCounter end={200} suffix="+" label="Partner Employers" />
            <AnimatedCounter end={1000} suffix="+" label="Students Placed" />
            <AnimatedCounter end={95} suffix="%" label="Success Rate" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Sectors Section */}
      <section className="sectors-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Key Sectors We Serve</h2>
            <p className="section-subtitle">
              Connecting talent with opportunities across diverse industries
            </p>
          </motion.div>

          <div className="sectors-grid">
            {sectors.map((sector, index) => (
              <motion.div
                key={index}
                className="sector-badge"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <span className="sector-icon">{sector.icon}</span>
                <span className="sector-name">{sector.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsCarousel />

      {/* Partner Logos */}
      <PartnerLogos />

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="cta-title">Ready to Start Your Career Journey?</h2>
            <p className="cta-subtitle">
              Join thousands of students who found their dream placement through our platform
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Create Your Account
                <FaArrowRight />
              </Link>
              <Link to="/about" className="btn btn-secondary btn-large">
                Learn More About Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
