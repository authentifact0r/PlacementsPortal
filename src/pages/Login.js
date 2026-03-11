import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Eye, EyeOff, Linkedin, Apple } from 'lucide-react';
import { motion } from 'framer-motion';
import LinkedInEmailModal from '../components/LinkedInEmailModal';

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      setError('Failed to log in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = () => {
    setShowLinkedInModal(true);
    setError('');
  };

  const handleLinkedInSubmit = async (formData) => {
    try {
      await login(formData.email, formData.password);
      setShowLinkedInModal(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('LinkedIn login error:', error);
      throw new Error(error.message || 'Failed to log in. Please check your credentials.');
    }
  };

  const handleAppleLogin = () => {
    setError('Apple login coming soon!');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
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

        {/* Social Auth Buttons */}
        <div className="space-y-3 mb-6">
          {/* LinkedIn Button */}
          <button
            onClick={handleLinkedInLogin}
            disabled={loading}
            type="button"
            className="w-full h-12 bg-[#0077b5] hover:bg-[#006399] text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Linkedin className="w-5 h-5" />
            <span>Log in with LinkedIn Email</span>
          </button>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
            className="w-full h-12 bg-[#4285F4] hover:bg-[#357ae8] text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <GoogleIcon />
            <span>Log in with Google</span>
          </button>

          {/* Apple Button */}
          <button
            onClick={handleAppleLogin}
            disabled={loading}
            type="button"
            className="w-full h-12 bg-black hover:bg-gray-900 text-white font-semibold rounded-full flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Apple className="w-5 h-5" />
            <span>Log in with Apple</span>
          </button>
        </div>

        {/* OR Separator */}
        <div className="relative flex items-center my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">or</span>
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

        {/* Email Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          {/* Password Input with Toggle */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-gray-900"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-left">
            <Link
              to="/forgot-password"
              className="text-sm text-brand-dark hover:text-brand-dark font-medium transition-colors"
            >
              Forgot your password? Reset your password
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#e28751] hover:bg-[#d17742] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <Mail className="w-5 h-5" />
            <span>{loading ? 'Logging in...' : 'Log in with your email'}</span>
          </button>
        </form>

        {/* Registration Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Not a member yet?{' '}
            <Link
              to="/register"
              className="text-brand-dark hover:text-brand-dark font-semibold transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* LinkedIn Email Modal */}
      <LinkedInEmailModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        onSubmit={handleLinkedInSubmit}
        mode="login"
      />
    </div>
  );
};

export default Login;
