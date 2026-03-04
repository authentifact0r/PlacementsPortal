import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Video,
  BookOpen,
  Code,
  Sparkles,
  ArrowRight,
  Crown,
  Target,
  TrendingUp,
  Brain,
  CheckCircle2,
  X,
  Rocket,
  Settings
} from 'lucide-react';

const Resources = () => {
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0f172a] via-purple-900 to-purple-700 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 backdrop-blur-md rounded-full border border-purple-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300 tracking-wide">GROWTH CENTER</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Resources to Power<br />Your Career Growth
            </h1>
            
            <p className="text-xl text-purple-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              AI-powered tools, expert guidance, and proven resources to accelerate your professional journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* AI Job Applier - Hero Feature */}
      <section className="py-12 -mt-16 relative z-20">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 p-1 shadow-2xl"
          >
            <div className="bg-white rounded-[22px] overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left - Content */}
                <div className="p-8 lg:p-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-6">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-purple-900">AI-POWERED</span>
                  </div>

                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    AI Job Applier
                  </h2>
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    Let our intelligent AI match you with opportunities and automatically apply to jobs tailored to your aspirations.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Smart Job Matching</h4>
                        <p className="text-sm text-gray-600">AI analyzes your profile and matches you with aligned opportunities</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Rocket className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Auto-Apply Feature</h4>
                        <p className="text-sm text-gray-600">Submit applications automatically while you focus on preparation</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Tailored to Your Goals</h4>
                        <p className="text-sm text-gray-600">Applications align with your career aspirations and preferences</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAIModal(true)}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group"
                  >
                    Activate AI Applier
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Right - Image */}
                <div className="relative h-64 lg:h-auto">
                  <img
                    src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop"
                    alt="AI Technology"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/80 lg:to-white/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Tools */}
      <FeaturedTools />

      {/* Resource Categories */}
      <ResourceCategories />

      {/* AI Applier Modal */}
      <AIApplierModal show={showAIModal} onClose={() => setShowAIModal(false)} />
    </div>
  );
};

/* ===== FEATURED TOOLS ===== */
const FeaturedTools = () => {
  const featuredTools = [
    {
      id: 1,
      title: 'AI CV Optimizer',
      description: 'Get your CV analyzed by AI and optimized for ATS systems with real-time feedback',
      icon: FileText,
      isPro: true,
      gradient: 'from-blue-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop',
      features: ['ATS Optimization', 'Keyword Analysis', 'Format Checker']
    },
    {
      id: 2,
      title: 'Mock Interview Bot',
      description: 'Practice interviews with AI-powered realistic scenarios and get instant feedback',
      icon: Video,
      isPro: true,
      gradient: 'from-purple-500 to-purple-600',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop',
      features: ['Video Practice', 'AI Feedback', '500+ Questions']
    },
    {
      id: 3,
      title: 'Career Path Mapper',
      description: 'Visualize your career trajectory with personalized insights and roadmap',
      icon: Target,
      isPro: false,
      gradient: 'from-green-500 to-green-600',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop',
      features: ['Visual Roadmap', 'Skill Gaps', 'Timeline Planning']
    },
    {
      id: 4,
      title: 'Salary Calculator',
      description: 'Compare salaries across industries, locations, and experience levels',
      icon: TrendingUp,
      isPro: false,
      gradient: 'from-orange-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
      features: ['Industry Data', 'Location Compare', 'Negotiation Tips']
    },
    {
      id: 5,
      title: 'Technical Skills Tracker',
      description: 'Track and showcase your technical competencies with progress monitoring',
      icon: Code,
      isPro: false,
      gradient: 'from-teal-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop',
      features: ['Skill Matrix', 'Certifications', 'Portfolio Builder']
    },
    {
      id: 6,
      title: 'Interview Question Bank',
      description: '500+ curated interview questions with model answers and tips',
      icon: BookOpen,
      isPro: true,
      gradient: 'from-pink-500 to-pink-600',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop',
      features: ['Behavioral', 'Technical', 'STAR Method']
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Featured Tools & Resources
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional-grade tools to give you the competitive edge
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={tool.image}
                  alt={tool.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${tool.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                
                {/* Pro Badge */}
                {tool.isPro && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                    <Crown className="w-3 h-3" />
                    PRO
                  </div>
                )}

                {/* Icon */}
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <tool.icon className={`w-6 h-6 bg-gradient-to-br ${tool.gradient} bg-clip-text text-transparent`} />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {tool.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
                  {tool.features.map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Button */}
                <button className={`w-full px-4 py-3 bg-gradient-to-r ${tool.gradient} text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                  {tool.isPro ? 'Upgrade to Access' : 'Try Now'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== RESOURCE CATEGORIES ===== */
const ResourceCategories = () => {
  const categories = [
    {
      title: 'CV & Resume Templates',
      description: 'Professional templates optimized for ATS and industry standards',
      items: ['Engineering CV', 'IT CV', 'Graduate CV', 'Internship CV', 'Cover Letters', 'LinkedIn Profile'],
      icon: FileText,
      color: 'from-teal-600 to-teal-700',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop'
    },
    {
      title: 'Interview Preparation',
      description: 'Everything you need to ace your interviews with confidence',
      items: ['Common Questions', 'STAR Method', 'Body Language', 'Virtual Tips', 'Salary Negotiation', 'Follow-up'],
      icon: Video,
      color: 'from-purple-600 to-purple-700',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop'
    },
    {
      title: 'Career Development',
      description: 'Expert guidance and strategies for long-term career success',
      items: ['Career Planning', 'Job Search Strategy', 'Personal Branding', 'Networking Skills', 'Leadership', 'Work-Life Balance'],
      icon: Sparkles,
      color: 'from-orange-600 to-orange-700',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop'
    },
    {
      title: 'Technical Skills',
      description: 'Upskill with technical learning resources and challenges',
      items: ['Coding Practice', 'System Design', 'Data Structures', 'GitHub Portfolio', 'Certifications', 'Projects'],
      icon: Code,
      color: 'from-blue-600 to-blue-700',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Resource Library
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive guides, templates, and materials for every stage of your journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200"
            >
              {/* Image Header */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-80`} />
                
                <div className="absolute inset-0 flex items-center px-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                      <category.icon className="w-7 h-7 text-gray-900" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {category.title}
                      </h3>
                      <p className="text-white/90 text-sm">{category.items.length} resources</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {category.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full px-4 py-3 bg-gradient-to-r ${category.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                  Browse Resources
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== AI APPLIER MODAL ===== */
const AIApplierModal = ({ show, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    careerField: '',
    experienceLevel: '',
    location: '',
    workType: '',
    salaryMin: '',
    autoApply: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send to backend/AI service
    console.log('AI Applier activated:', formData);
    setStep(3);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl"
          >
            {/* Header */}
            <div className="relative h-48 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-t-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop"
                alt="AI"
                className="w-full h-full object-cover opacity-20"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                <Brain className="w-16 h-16 mb-4" />
                <h3 className="text-3xl font-bold text-center">AI Job Applier</h3>
                <p className="text-white/90 text-center mt-2">Let AI find and apply to your perfect opportunities</p>
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Tell us about your career goals</h4>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Career Field</label>
                    <select
                      value={formData.careerField}
                      onChange={(e) => setFormData({...formData, careerField: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select field...</option>
                      <option value="civil">Civil Engineering</option>
                      <option value="structural">Structural Engineering</option>
                      <option value="it">IT Services</option>
                      <option value="consultancy">Project Consultancy</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select level...</option>
                      <option value="graduate">Graduate</option>
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior (5+ years)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="e.g., London"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Min. Salary (£)</label>
                      <input
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => setFormData({...formData, salaryMin: e.target.value})}
                        placeholder="25000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-gray-900">AI Application Settings</h4>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 mb-2">Auto-Apply Enabled</h5>
                        <p className="text-sm text-gray-600 mb-4">
                          AI will automatically apply to matching opportunities on your behalf. You'll receive daily summaries of applications submitted.
                        </p>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.autoApply}
                              onChange={(e) => setFormData({...formData, autoApply: e.target.checked})}
                              className="w-5 h-5 text-purple-600 rounded"
                            />
                            <span className="text-sm font-semibold text-gray-700">Enable automatic applications</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-gray-900">What happens next:</h5>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700">AI analyzes your profile and preferences</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-700">Matches you with relevant opportunities</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-700">Applies to jobs that align with your goals</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm text-gray-700">Sends you daily application summaries</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      Activate AI Applier
                      <Rocket className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">AI Applier Activated!</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Your intelligent job assistant is now working. You'll receive your first batch of applications within 24 hours.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all"
                  >
                    Got it!
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Resources;
