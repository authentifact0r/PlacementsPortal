import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Zap,
  DollarSign,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Building2,
  Mail,
  User,
  MapPin,
  Phone,
  FileText,
  Sparkles,
  TrendingUp,
  Globe,
  Code,
  Settings,
  Megaphone,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';

// Mock company logos for marquee
const PARTNER_LOGOS = [
  'BuildTech', 'DesignPro', 'TechSupport', 'ConsultCorp', 
  'InfraPro', 'DigitalUK', 'EngineerWorks', 'DataInsights'
];

// Personal email domains to block
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'icloud.com', 'aol.com', 'live.com', 'mail.com'
];

const Employers = () => {
  const [phase, setPhase] = useState('landing'); // 'landing', 'intake', 'building', 'profile'
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Phase 2: Intake Form Data
  const [intakeData, setIntakeData] = useState({
    fullName: '',
    jobTitle: '',
    businessEmail: ''
  });
  const [intakeErrors, setIntakeErrors] = useState({});
  
  // Phase 3: Profile Builder Data
  const [profileData, setProfileData] = useState({
    organizationName: '',
    companyHouseNumber: '',
    operatingAddress: '',
    registeredAddress: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    website: '',
    employeeCount: '',
    sector: ''
  });
  
  const formRef = useRef(null);

  // Scroll to form
  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Validate business email
  const validateBusinessEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (PERSONAL_EMAIL_DOMAINS.includes(domain)) {
      return 'Please use your business email address';
    }
    return '';
  };

  // Handle intake form submission
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const errors = {};
    if (!intakeData.fullName.trim()) errors.fullName = 'Name is required';
    if (!intakeData.jobTitle.trim()) errors.jobTitle = 'Job title is required';
    if (!intakeData.businessEmail.trim()) {
      errors.businessEmail = 'Business email is required';
    } else {
      const emailError = validateBusinessEmail(intakeData.businessEmail);
      if (emailError) errors.businessEmail = emailError;
    }
    
    if (Object.keys(errors).length > 0) {
      setIntakeErrors(errors);
      return;
    }
    
    // Simulate loading
    setLoading(true);
    setLoadingProgress(0);
    
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          setPhase('profile');
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Handle profile form submission
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit to backend
    console.log('Profile Data:', { ...intakeData, ...profileData });
    alert('Organization profile created successfully!');
  };

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {phase === 'landing' && (
          <LandingPage 
            key="landing" 
            onCTAClick={() => {
              setPhase('intake');
              setTimeout(scrollToForm, 100);
            }}
          />
        )}
        
        {phase === 'intake' && (
          <IntakeForm
            key="intake"
            formRef={formRef}
            intakeData={intakeData}
            setIntakeData={setIntakeData}
            intakeErrors={intakeErrors}
            setIntakeErrors={setIntakeErrors}
            loading={loading}
            loadingProgress={loadingProgress}
            onSubmit={handleIntakeSubmit}
            validateBusinessEmail={validateBusinessEmail}
          />
        )}
        
        {phase === 'profile' && (
          <ProfileBuilder
            key="profile"
            intakeData={intakeData}
            profileData={profileData}
            setProfileData={setProfileData}
            onSubmit={handleProfileSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============================================
   PHASE ONE: LANDING PAGE
   ============================================ */
const LandingPage = ({ onCTAClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0f172a] via-purple-900 to-purple-700 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Hire Top Talent.<br />Build Your Team.
            </h1>
            
            <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
              Connect with pre-screened postgraduate students ready to contribute to your organization. Streamlined hiring, quality talent.
            </p>
            
            <button
              onClick={onCTAClick}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#e28751] hover:bg-[#d17742] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-orange-500/30"
            >
              <span>Partner with us</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Marquee */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm font-semibold text-gray-500 mb-6">TRUSTED BY</p>
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-12"
              animate={{ x: [0, -1000] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-32 h-16 flex items-center justify-center"
                >
                  <div className="text-2xl font-bold text-gray-300 filter grayscale">
                    {logo}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Why Recruit Through Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access top-tier talent with a streamlined hiring process designed for modern partners
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Briefcase,
                title: 'Quality Talent',
                description: 'Pre-screened postgraduates with relevant qualifications',
                gradient: 'from-blue-500 to-blue-600'
              },
              {
                icon: Zap,
                title: 'Fast Hiring',
                description: 'From posting to placement in weeks, not months',
                gradient: 'from-orange-500 to-orange-600'
              },
              {
                icon: DollarSign,
                title: 'Cost-Effective',
                description: 'Competitive pricing with no hidden fees',
                gradient: 'from-green-500 to-green-600'
              },
              {
                icon: UserCheck,
                title: 'Dedicated Support',
                description: 'Personal account manager for your hiring needs',
                gradient: 'from-purple-500 to-purple-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="h-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 backdrop-blur-sm bg-white/80 hover:shadow-lg">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.gradient} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ways to Partner Bento Grid */}
      <section className="py-20 bg-[#0f172a]">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Ways to Partner
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Strategic partnership solutions designed for scale and impact
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Megaphone,
                title: 'Brand Campaigns',
                description: 'Custom Brand Campaigns to elevate your presence in the grad market.',
                gradient: 'from-brand-primary to-brand-secondary'
              },
              {
                icon: TrendingUp,
                title: 'Promoted Opportunities',
                description: 'Boost job visibility by 4x with featured placement algorithms.',
                gradient: 'from-blue-500 to-blue-600'
              },
              {
                icon: Zap,
                title: 'Future-Proof Talent',
                description: 'Access "Work-Ready" postgraduates with verified technical certifications.',
                gradient: 'from-orange-500 to-orange-600'
              },
              {
                icon: RefreshCw,
                title: 'Business Continuity',
                description: 'Build consistent talent pipelines to ensure operational stability and market growth.',
                gradient: 'from-purple-500 to-purple-600'
              }
            ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="h-full p-8 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-brand-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-brand-primary/10">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${card.gradient} mb-6`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Impact Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Scale Your Operations
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Proven results that drive business growth and operational efficiency
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                stat: '45%',
                label: 'Reduction in Time-to-Hire',
                description: 'Streamlined hiring process cuts your recruitment timeline in half'
              },
              {
                stat: '90%',
                label: 'Candidate Retention Rate',
                description: 'Work-ready graduates who stay and grow with your organization'
              },
              {
                stat: 'Top 10%',
                label: 'Postgrad Talent Access',
                description: 'Exclusive access to the highest-performing graduate candidates'
              }
            ].map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className="p-8 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl hover:border-brand-primary/30 transition-all duration-300">
                  <div className="text-6xl font-bold text-brand-primary mb-4">
                    {impact.stat}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {impact.label}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {impact.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action-Oriented CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-gray-900 font-bold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-brand-primary/30 flex items-center gap-2 group">
              <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              <span>Download Partnership Deck</span>
            </button>
            <button className="px-8 py-4 bg-transparent hover:bg-slate-800 text-white font-semibold rounded-lg border-2 border-white hover:border-brand-primary transition-all duration-300 flex items-center gap-2 group">
              <Calendar className="w-5 h-5" />
              <span>Book a Strategy Call</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Consultancy Projects Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Consultancy Projects
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Partner with us on specialized consultancy projects across multiple domains
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Settings,
                title: 'ITIL & IT Service Management',
                description: 'IT Infrastructure Library consulting and service desk optimization',
                skills: ['ITIL Framework', 'Service Design', 'Change Management', 'Incident Management'],
                gradient: 'from-indigo-500 to-indigo-600'
              },
              {
                icon: Building2,
                title: 'Business Support Solutions',
                description: 'Strategic business analysis and operational improvement consulting',
                skills: ['Process Optimization', 'Business Analysis', 'Project Management', 'Stakeholder Engagement'],
                gradient: 'from-teal-500 to-teal-600'
              },
              {
                icon: Code,
                title: 'Web Development Framework',
                description: 'Modern web development and digital transformation projects',
                skills: ['React & Node.js', 'API Development', 'Cloud Architecture', 'DevOps'],
                gradient: 'from-purple-500 to-purple-600'
              }
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group"
              >
                <div className="h-full p-8 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${project.gradient} mb-6`}>
                    <project.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Skills List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Key Areas
                    </p>
                    {project.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-gray-700">{skill}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button className="mt-6 w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-3">
              Have a Consultancy Project in Mind?
            </h3>
            <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
              Connect with our pool of talented consultants ready to deliver results on your next project
            </p>
            <button className="px-8 py-3 bg-white hover:bg-gray-100 text-purple-600 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
              Discuss Your Project
            </button>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

/* ============================================
   PHASE TWO: INTAKE FORM
   ============================================ */
const IntakeForm = ({ 
  formRef, 
  intakeData, 
  setIntakeData, 
  intakeErrors, 
  setIntakeErrors,
  loading, 
  loadingProgress, 
  onSubmit,
  validateBusinessEmail 
}) => {
  const [currentStat, setCurrentStat] = useState(0);
  
  const stats = [
    { number: '500K+', label: 'Monthly Applications' },
    { number: '1M+', label: 'Active Users' },
    { number: '10K+', label: 'Partner Companies' },
    { number: '95%', label: 'Placement Success Rate' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stats.length]);

  const handleChange = (field, value) => {
    setIntakeData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (intakeErrors[field]) {
      setIntakeErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmailBlur = () => {
    if (intakeData.businessEmail) {
      const error = validateBusinessEmail(intakeData.businessEmail);
      if (error) {
        setIntakeErrors(prev => ({ ...prev, businessEmail: error }));
      }
    }
  };

  return (
    <motion.section
      ref={formRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 py-12 px-4"
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT SIDE: Stats & Carousel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col justify-center text-white space-y-8"
        >
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Elevate Your Brand
            </h2>
            <p className="text-xl text-purple-200">
              Join thousands of companies finding their next hire through PlacementsPortal
            </p>
          </div>

          {/* Animated Stats Carousel */}
          <div className="relative h-32 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStat}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-5xl font-bold mb-2">{stats[currentStat].number}</div>
                <div className="text-lg text-purple-200">{stats[currentStat].label}</div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Additional Benefits */}
          <div className="space-y-3">
            {[
              'Access to pre-screened talent',
              'Dedicated account manager',
              'Fast-track hiring process'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-purple-100">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT SIDE: Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10"
        >
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h3>
            <p className="text-gray-600">Tell us a bit about yourself to begin</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-2 animate-pulse" />
                <p className="text-lg font-semibold text-gray-900">Building your profile...</p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <p className="text-center text-gray-600 text-sm">{loadingProgress}% complete</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={intakeData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className={`w-full h-12 pl-11 pr-4 border ${
                      intakeErrors.fullName ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900`}
                    placeholder="John Smith"
                  />
                </div>
                {intakeErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{intakeErrors.fullName}</p>
                )}
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={intakeData.jobTitle}
                    onChange={(e) => handleChange('jobTitle', e.target.value)}
                    className={`w-full h-12 pl-11 pr-4 border ${
                      intakeErrors.jobTitle ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900`}
                    placeholder="HR Manager"
                  />
                </div>
                {intakeErrors.jobTitle && (
                  <p className="text-red-500 text-sm mt-1">{intakeErrors.jobTitle}</p>
                )}
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={intakeData.businessEmail}
                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`w-full h-12 pl-11 pr-4 border ${
                      intakeErrors.businessEmail ? 'border-red-500' : 'border-gray-200'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900`}
                    placeholder="john.smith@company.com"
                  />
                </div>
                {intakeErrors.businessEmail && (
                  <p className="text-red-500 text-sm mt-1">{intakeErrors.businessEmail}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">Please use your work email</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-12 bg-[#e28751] hover:bg-[#d17742] text-white font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

/* ============================================
   PHASE THREE: PROFILE BUILDER
   ============================================ */
const ProfileBuilder = ({ intakeData, profileData, setProfileData, onSubmit }) => {
  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 py-12 px-4"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Organization Setup</h2>
                <p className="text-gray-600">Complete your organization profile to get started</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.organizationName}
                      onChange={(e) => handleChange('organizationName', e.target.value)}
                      className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>
                </div>

                {/* Company House Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company House Registration Number *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.companyHouseNumber}
                      onChange={(e) => handleChange('companyHouseNumber', e.target.value)}
                      className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="12345678"
                      required
                    />
                  </div>
                </div>

                {/* Operating Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Operating Business Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={profileData.operatingAddress}
                      onChange={(e) => handleChange('operatingAddress', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      rows="3"
                      placeholder="123 Business St, London, UK"
                      required
                    />
                  </div>
                </div>

                {/* Registered Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Registered Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={profileData.registeredAddress}
                      onChange={(e) => handleChange('registeredAddress', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      rows="3"
                      placeholder="123 Business St, London, UK"
                      required
                    />
                  </div>
                </div>

                {/* Primary Contact Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Contact Person *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.primaryContactName}
                      onChange={(e) => handleChange('primaryContactName', e.target.value)}
                      className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                </div>

                {/* Contact Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profileData.primaryContactEmail}
                        onChange={(e) => handleChange('primaryContactEmail', e.target.value)}
                        className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="contact@company.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profileData.primaryContactPhone}
                        onChange={(e) => handleChange('primaryContactPhone', e.target.value)}
                        className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="+44 20 1234 5678"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Website & Sector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={profileData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sector *
                    </label>
                    <select
                      value={profileData.sector}
                      onChange={(e) => handleChange('sector', e.target.value)}
                      className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                      required
                    >
                      <option value="">Select sector</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Structural Engineering">Structural Engineering</option>
                      <option value="IT Services">IT Services</option>
                      <option value="Project Consultancy">Project Consultancy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-12 bg-[#e28751] hover:bg-[#d17742] text-white font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Profile</span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Draft Profile Preview
                </h3>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Organization</p>
                    <p className="font-semibold text-lg">
                      {profileData.organizationName || 'Your Company Name'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Location</p>
                    <p className="text-sm">
                      {profileData.operatingAddress || 'Your operating address'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Sector</p>
                    <p className="text-sm">
                      {profileData.sector || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-purple-200 mb-1">Contact Person</p>
                    <p className="text-sm">
                      {intakeData.fullName}
                    </p>
                    <p className="text-xs text-purple-200">
                      {intakeData.jobTitle}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className="text-xs text-purple-200">
                    Your profile will be reviewed and activated within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default Employers;
