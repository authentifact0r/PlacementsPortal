import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Eye, EyeOff, Linkedin, Apple, User, Briefcase, CheckCircle2, Zap, FileText, GraduationCap, Building2, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';
import LinkedInEmailModal from '../components/LinkedInEmailModal';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'graduate',
    agreeToTerms: false
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!formData.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms of Service';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await signup(formData.email, formData.password, {
        role: formData.role,
        profile: {
          fullName: formData.fullName,
          jobTitle: formData.jobTitle
        }
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Failed to sign up with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSignup = () => {
    setShowLinkedInModal(true);
    setError('');
  };

  const handleLinkedInSubmit = async (formData) => {
    try {
      const nameParts = formData.firstName && formData.lastName 
        ? [formData.firstName, formData.lastName]
        : ['', ''];
      
      await signup(formData.email, formData.password, {
        role: 'graduate',
        profile: {
          firstName: nameParts[0],
          lastName: nameParts[1]
        },
        linkedInEmail: true // Mark as LinkedIn signup
      });
      
      setShowLinkedInModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('LinkedIn signup error:', error);
      throw new Error(error.message || 'Failed to create account. Please try again.');
    }
  };

  const handleAppleSignup = () => {
    setError('Apple signup coming soon!');
  };

  const benefits = [
    { icon: Briefcase, text: 'Access 2,500+ Jobs' },
    { icon: FileText, text: 'Free CV Reviews' },
    { icon: Zap, text: 'Priority Applications' }
  ];

  return (
    <div className="min-h-screen bg-white flex pt-12">
      {/* Left Side - Benefits (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20 -z-10" />
        
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">
              Why Join<br />PlacementsPortal?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of graduates landing their dream careers
            </p>
          </motion.div>

          <div className="space-y-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-lg font-medium">{benefit.text}</span>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
          >
            <p className="text-white text-sm">
              <CheckCircle2 className="w-5 h-5 inline mr-2 text-green-400" />
              <span className="font-semibold">Free forever.</span> No credit card required.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo (Mobile) */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-block">
              <img 
                src="/images/logo.png" 
                alt="PlacementsPortal" 
                className="h-20 w-auto mx-auto hover:scale-105 transition-transform"
              />
              <h1 className="text-2xl font-bold text-gray-900 mt-3 tracking-tight">
                PlacementsPortal
              </h1>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Join PlacementsPortal and start your career journey</p>
          </div>

          {/* Preferred Badge */}
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 bg-brand-light text-brand-dark text-xs font-semibold rounded-full">
              Preferred by 70% of users ⚡
            </span>
          </div>

          {/* Social Signup Buttons */}
          <div className="space-y-3 mb-6">
            {/* LinkedIn */}
            <button
              onClick={handleLinkedInSignup}
              disabled={loading}
              type="button"
              className="w-full h-12 bg-[#0077b5] hover:bg-[#006399] text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <Linkedin className="w-5 h-5" />
              <span>Sign up with LinkedIn Email</span>
            </button>

            {/* Google */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              type="button"
              className="w-full h-12 bg-[#4285F4] hover:bg-[#357ae8] text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
              </svg>
              <span>Sign up with Google</span>
            </button>

            {/* Apple */}
            <button
              onClick={handleAppleSignup}
              disabled={loading}
              type="button"
              className="w-full h-12 bg-black hover:bg-gray-900 text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <Apple className="w-5 h-5" />
              <span>Sign up with Apple</span>
            </button>
          </div>

          {/* OR Separator */}
          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">or create account with email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cluster 1: Identity */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Identity</p>
              
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className={`w-full h-12 pl-11 pr-4 border ${
                      fieldErrors.fullName ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900`}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Smith"
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Preferred Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    className={`w-full h-12 pl-11 pr-4 border ${
                      fieldErrors.jobTitle ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900`}
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Graduate Engineer"
                  />
                </div>
                {fieldErrors.jobTitle && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.jobTitle}</p>
                )}
              </div>
            </div>

            {/* Cluster 1b: Role Selector */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">I am joining as a…</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student',  label: 'Student',   icon: GraduationCap, desc: 'Currently studying' },
                  { value: 'graduate', label: 'Graduate',  icon: GraduationCap, desc: 'Recently graduated' },
                  { value: 'employer', label: 'Employer',  icon: Building2,     desc: 'Hiring talent' },
                  { value: 'coach',    label: 'Coach',     icon: HeartHandshake,desc: 'Career coaching' }
                ].map(({ value, label, icon: Icon, desc }) => {
                  const selected = formData.role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: value }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-[#e28751] bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-[#e28751] text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${selected ? 'text-[#e28751]' : 'text-gray-800'}`}>{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-4 h-4 text-[#e28751] ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cluster 2: Security */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Security</p>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full h-12 pl-11 pr-4 border ${
                      fieldErrors.email ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`w-full h-12 px-4 pr-12 border ${
                      fieldErrors.password ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                )}
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength</span>
                      <span className="text-xs font-semibold text-gray-700">{getPasswordStrengthText()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`w-full h-12 px-4 pr-12 border ${
                      fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-brand-dark border-gray-300 rounded focus:ring-2 focus:ring-brand-primary"
                />
                <span className={`text-sm ${fieldErrors.agreeToTerms ? 'text-red-600' : 'text-gray-700'}`}>
                  I agree to the{' '}
                  <Link to="/terms" className="text-brand-dark hover:text-brand-dark font-semibold">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-brand-dark hover:text-brand-dark font-semibold">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {fieldErrors.agreeToTerms && (
                <p className="text-red-500 text-sm mt-1 ml-7">{fieldErrors.agreeToTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#e28751] hover:bg-[#d17742] text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? 'Creating account...' : 'Create My Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-dark hover:text-brand-dark font-semibold transition-colors"
              >
                Log in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* LinkedIn Email Modal */}
      <LinkedInEmailModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onSubmit={handleLinkedInSubmit}
        mode="register"
      />
    </div>
  );
};

export default Register;
