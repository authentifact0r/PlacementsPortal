import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/opportunities', label: 'Opportunities' },
    { path: '/employers', label: 'Employers' },
    { path: '/student-support', label: 'Support' },
    { path: '/global-students', label: 'International' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Logo variant={scrolled ? 'default' : 'default'} size="medium" />

          {/* Desktop Navigation */}
          <div className="navbar-desktop">
            <div className="navbar-links">
              {publicLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${isActivePath(link.path) ? 'active' : ''}`}
                >
                  {link.label}
                  {isActivePath(link.path) && (
                    <motion.div
                      className="navbar-link-underline"
                      layoutId="underline"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Auth Section */}
            <div className="navbar-auth">
              {currentUser ? (
                <div className="navbar-user">
                  <button
                    className="navbar-user-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <span className="user-avatar">
                      {userProfile?.profile?.firstName?.[0] || 'U'}
                    </span>
                    <span className="user-name">
                      {userProfile?.profile?.firstName || 'User'}
                    </span>
                    <svg
                      className={`user-arrow ${showUserMenu ? 'rotate' : ''}`}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        className="user-menu"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link to="/dashboard" className="user-menu-item">
                          <span>📊</span> Dashboard
                        </Link>
                        <Link to="/dashboard/profile" className="user-menu-item">
                          <span>👤</span> Profile
                        </Link>
                        <Link to="/dashboard/applications" className="user-menu-item">
                          <span>📝</span> Applications
                        </Link>
                        <div className="user-menu-divider"></div>
                        <button className="user-menu-item" onClick={handleLogout}>
                          <span>🚪</span> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="navbar-auth-buttons">
                  <Link to="/login" className="btn btn-text">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <span className={`hamburger ${isOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="navbar-mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="navbar-mobile-content">
                {publicLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      className={`navbar-mobile-link ${isActivePath(link.path) ? 'active' : ''}`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="navbar-mobile-divider"></div>

                {currentUser ? (
                  <motion.div
                    className="navbar-mobile-user"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Link
                      to="/dashboard"
                      className="navbar-mobile-link"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      className="navbar-mobile-link"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className="navbar-mobile-link"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                    >
                      Logout
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    className="navbar-mobile-auth"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Link
                      to="/login"
                      className="btn btn-text"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="btn btn-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up Free
                    </Link>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
