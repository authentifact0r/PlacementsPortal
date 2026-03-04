import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User, Calendar, Users, GraduationCap, Images, Video, LogOut, UserCircle, Zap, Briefcase, Mail, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ProfileSettingsModal from './ProfileSettingsModal';

const NavbarSaaS = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWhatsOnMenu, setShowWhatsOnMenu] = useState(false);
  const [showTalentMenu, setShowTalentMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to get user's first name
  const getUserFirstName = () => {
    // Priority order for getting first name
    const firstName = 
      userProfile?.profile?.firstName ||        // From Firestore profile
      userProfile?.firstName ||                 // Root level (fallback)
      (currentUser?.displayName?.split(' ')[0]) || // From Firebase Auth displayName
      (currentUser?.email?.split('@')[0]) ||    // From email username
      'User';                                   // Final fallback

    // Debug logging (remove in production)
    if (firstName === 'User') {
      console.log('NavbarSaaS - Using fallback name. Data:', {
        userProfile,
        currentUser: currentUser ? { 
          email: currentUser.email,
          displayName: currentUser.displayName 
        } : null
      });
    }

    return firstName;
  };

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
    setShowWhatsOnMenu(false);
    setShowTalentMenu(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu || showWhatsOnMenu || showTalentMenu) {
        // Check if click is outside the dropdown
        const target = event.target;
        if (!target.closest('.user-menu-container') && !target.closest('.whats-on-container') && !target.closest('.talent-menu-container')) {
          setShowUserMenu(false);
          setShowWhatsOnMenu(false);
          setShowTalentMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showWhatsOnMenu, showTalentMenu]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const whatsOnItems = [
    { label: 'Events', href: '/community/events', icon: Calendar },
    { label: 'Workshops', href: '/community/workshops', icon: Users },
    { label: 'Upskill Courses', href: '/community/courses', icon: GraduationCap },
    { label: 'Industry Insight', href: '/community/industry-insight', icon: Images }
  ];

  // Talent Engine menu items — visible to employers and admins
  const userRole = userProfile?.role;
  const showTalentNav = currentUser && (userRole === 'employer' || userRole === 'admin');

  const talentItems = [
    { label: 'Talent Pipeline', href: '/talent-pipeline', icon: Briefcase },
    { label: 'Outreach Hub', href: '/outreach', icon: Mail },
    ...(userRole === 'admin' ? [{ label: 'Revenue Dashboard', href: '/revenue', icon: TrendingUp }] : [])
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/images/logo.png" 
              alt="PlacementsPortal" 
              className="h-12 w-auto group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <div className="text-xl font-bold tracking-tight">PlacementsPortal</div>
              <div className="text-xs text-brand-primary tracking-wider">CAREER HUB</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Opportunities */}
            <Link
              to="/opportunities"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/opportunities')
                  ? 'text-brand-primary bg-brand-primary/10'
                  : 'text-slate-300 hover:text-brand-primary hover:bg-slate-800/50'
              }`}
            >
              Opportunities
            </Link>

            {/* What's On Dropdown */}
            <div 
              className="relative whats-on-container"
              onMouseEnter={() => setShowWhatsOnMenu(true)}
              onMouseLeave={() => setShowWhatsOnMenu(false)}
            >
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                  location.pathname.startsWith('/community')
                    ? 'text-brand-primary bg-brand-primary/10'
                    : 'text-slate-300 hover:text-brand-primary hover:bg-slate-800/50'
                }`}
              >
                What's On
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showWhatsOnMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {showWhatsOnMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-slate-900 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-2 z-50"
                  >
                    {whatsOnItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={idx}
                          to={item.href}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Resources Link */}
            <Link
              to="/resources"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname.startsWith('/resources')
                  ? 'text-brand-primary bg-brand-primary/10'
                  : 'text-slate-300 hover:text-brand-primary hover:bg-slate-800/50'
              }`}
            >
              Resources
            </Link>

            {/* Partners */}
            <Link
              to="/employers"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/employers')
                  ? 'text-brand-primary bg-brand-primary/10'
                  : 'text-slate-300 hover:text-brand-primary hover:bg-slate-800/50'
              }`}
            >
              Partners
            </Link>

            {/* Talent Engine Dropdown — employer & admin only */}
            {showTalentNav && (
              <div
                className="relative talent-menu-container"
                onMouseEnter={() => setShowTalentMenu(true)}
                onMouseLeave={() => setShowTalentMenu(false)}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    ['/talent-pipeline', '/outreach', '/revenue'].includes(location.pathname)
                      ? 'text-brand-primary bg-brand-primary/10'
                      : 'text-slate-300 hover:text-brand-primary hover:bg-slate-800/50'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  Talent Engine
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTalentMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showTalentMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-slate-900 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-2 z-50"
                    >
                      {talentItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={idx}
                            to={item.href}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser && (() => {
              const role = userProfile?.role;
              // Admins and coaches never see the Upgrade button
              if (role === 'admin' || role === 'coach') {
                return (
                  <Link
                    to="/admin/premium"
                    className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all shadow-sm hover:shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5 text-white" />
                    Admin Panel
                  </Link>
                );
              }
              // Only show Upgrade for users who haven't purchased premium
              if (!userProfile?.premium?.studentPremium?.active && !userProfile?.premium?.employerPremium?.active) {
                const pricingUrl = role === 'employer' ? '/pricing/employer' : '/pricing/student';
                const isEmployer = role === 'employer';
                return (
                  <Link
                    to={pricingUrl}
                    className={`flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md ${
                      isEmployer
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/25'
                        : 'bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 hover:shadow-purple-500/25'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    {isEmployer ? 'Upgrade Hiring' : 'Upgrade'}
                  </Link>
                );
              }
              return null;
            })()}
            {currentUser ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-brand-primary/50 transition-all"
                >
                  <LogOut className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">
                    {getUserFirstName()}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                      {showTalentNav && (
                        <Link
                          to="/talent-pipeline"
                          className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Briefcase className="w-4 h-4 text-purple-400" />
                          Talent Pipeline
                        </Link>
                      )}
                      {(userProfile?.role === 'graduate' || userProfile?.role === 'student') && (
                        <Link
                          to="/studio"
                          className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors group"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Video className="w-4 h-4 text-red-500 group-hover:text-red-400" />
                          <span>Elevated Pitch Studio</span>
                          <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">NEW</span>
                        </Link>
                      )}
                      <div className="border-t border-slate-700">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowProfileSettings(true);
                          }}
                          className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          Profile Settings
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-brand-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-brand-primary text-slate-900 font-semibold text-sm rounded-lg hover:bg-brand-secondary transition-all hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]"
                >
                  Sign Up Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-brand-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden bg-slate-900 backdrop-blur-xl border-t border-slate-700"
          >
            <div className="container mx-auto px-6 py-6 space-y-2">
              {/* Opportunities */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 * 0.05 }}
              >
                <Link
                  to="/opportunities"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive('/opportunities')
                      ? 'text-brand-primary bg-brand-primary/10'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Opportunities
                </Link>
              </motion.div>

              {/* What's On Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 * 0.05 }}
              >
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  What's On
                </div>
                <div className="space-y-1 ml-2">
                  {whatsOnItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={idx}
                        to={item.href}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-200 hover:text-white hover:bg-slate-800 transition-all"
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>

              {/* Resources */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 * 0.05 }}
              >
                <Link
                  to="/resources"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location.pathname.startsWith('/resources')
                      ? 'text-brand-primary bg-brand-primary/10'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Resources
                </Link>
              </motion.div>

              {/* Partners */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3 * 0.05 }}
              >
                <Link
                  to="/employers"
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive('/employers')
                      ? 'text-brand-primary bg-brand-primary/10'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Partners
                </Link>
              </motion.div>

              {/* Talent Engine Section — mobile, employer & admin only */}
              {showTalentNav && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 4 * 0.05 }}
                >
                  <div className="px-4 py-2 text-xs font-semibold text-yellow-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    Talent Engine
                  </div>
                  <div className="space-y-1 ml-2">
                    {talentItems.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={idx}
                          to={item.href}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-200 hover:text-white hover:bg-slate-800 transition-all"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="pt-4 border-t border-slate-700 space-y-2">
                {currentUser ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Dashboard
                    </Link>
                    {(userProfile?.role === 'graduate' || userProfile?.role === 'student') && (
                      <Link
                        to="/studio"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <Video className="w-4 h-4 text-red-500" />
                        <span>Elevated Pitch Studio</span>
                        <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded">NEW</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowProfileSettings(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left"
                    >
                      <UserCircle className="w-4 h-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-3 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-6 py-3 bg-brand-primary text-slate-900 font-semibold text-sm rounded-lg hover:bg-brand-secondary transition-all text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal 
        isOpen={showProfileSettings} 
        onClose={() => setShowProfileSettings(false)} 
      />
    </motion.nav>
  );
};

export default NavbarSaaS;
