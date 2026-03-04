import React from 'react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaSearch, FaFileAlt, FaRocket } from 'react-icons/fa';
import './HowItWorks.css';

const steps = [
  {
    icon: FaUserPlus,
    title: 'Create Your Profile',
    description: 'Sign up and build a comprehensive profile showcasing your skills, education, and career goals.',
    color: '#667eea'
  },
  {
    icon: FaSearch,
    title: 'Explore Opportunities',
    description: 'Browse through hundreds of placements, internships, and graduate roles tailored to your field.',
    color: '#764ba2'
  },
  {
    icon: FaFileAlt,
    title: 'Apply with Ease',
    description: 'Submit applications directly through our platform with your profile and documents.',
    color: '#f093fb'
  },
  {
    icon: FaRocket,
    title: 'Land Your Dream Role',
    description: 'Get matched with employers, attend interviews, and start your professional journey.',
    color: '#4facfe'
  }
];

const HowItWorks = () => {
  return (
    <section className="how-it-works">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Four simple steps to kickstart your career
          </p>
        </motion.div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="step-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <div className="step-number">{index + 1}</div>
              
              <div 
                className="step-icon"
                style={{ backgroundColor: `${step.color}15` }}
              >
                <step.icon style={{ color: step.color }} />
              </div>

              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="step-connector"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
