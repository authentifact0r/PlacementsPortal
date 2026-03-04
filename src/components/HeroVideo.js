import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './HeroVideo.css';

const HeroVideo = ({
  videoSrc = '/assets/videos/hero-background.mp4',
  title = 'Your Gateway to Professional Success',
  subtitle = 'Connecting postgraduate talent with career opportunities worldwide',
  primaryCTA = { text: 'Explore Opportunities', link: '/opportunities' },
  secondaryCTA = { text: 'Get Started Free', link: '/register' }
}) => {
  return (
    <section className="hero-video">
      {/* Background Video */}
      <div className="hero-video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-video-element"
          poster="/assets/images/hero-poster.jpg"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-video-overlay"></div>
      </div>

      {/* Content */}
      <div className="hero-video-content">
        <div className="container">
          <motion.div
            className="hero-video-text"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.h1
              className="hero-video-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {title}
            </motion.h1>
            
            <motion.p
              className="hero-video-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {subtitle}
            </motion.p>

            <motion.div
              className="hero-video-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to={primaryCTA.link} className="btn btn-primary btn-large">
                {primaryCTA.text}
              </Link>
              <Link to={secondaryCTA.link} className="btn btn-secondary btn-large">
                {secondaryCTA.text}
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="hero-scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <div className="scroll-icon">
              <div className="scroll-wheel"></div>
            </div>
            <span>Scroll to explore</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroVideo;
