import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Briefcase, 
  Users, 
  GraduationCap, 
  Globe, 
  CheckCircle2,
  Building2,
  Code,
  Hammer,
  BarChart,
  Beaker,
  Network,
  Quote,
  TrendingUp,
  Target,
  Zap,
  X,
  Sparkles,
  Bell,
  Calendar,
  Video
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomeSaaS = () => {
  const { currentUser, userProfile } = useAuth();
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  
  useEffect(() => {
    // Check if popup has been shown in this session
    const popupShown = sessionStorage.getItem('leadPopupShown');
    const whatsNewShown = sessionStorage.getItem('whatsNewShown');
    
    if (popupShown || whatsNewShown) {
      setHasShownPopup(true);
      return;
    }

    let idleTimer;
    let activityTimer;
    
    const resetTimer = () => {
      clearTimeout(idleTimer);
      clearTimeout(activityTimer);
      
      // Only set timer if popup hasn't been shown yet
      if (!hasShownPopup && !popupShown && !whatsNewShown) {
        activityTimer = setTimeout(() => {
          // Check if user is logged in
          if (currentUser && userProfile) {
            // Check if user is new (created within last 7 days)
            const createdAt = userProfile.createdAt?.toDate?.() || userProfile.createdAt;
            const isNewUser = createdAt && (Date.now() - createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
            
            if (isNewUser) {
              // Show lead funnel for new users
              setShowLeadPopup(true);
              sessionStorage.setItem('leadPopupShown', 'true');
            } else {
              // Show What's New for existing users
              setShowWhatsNew(true);
              sessionStorage.setItem('whatsNewShown', 'true');
            }
          } else {
            // Show lead funnel for non-logged in users
            setShowLeadPopup(true);
            sessionStorage.setItem('leadPopupShown', 'true');
          }
          setHasShownPopup(true);
        }, 45000); // 45 seconds
      }
    };

    const handleActivity = () => {
      resetTimer();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(idleTimer);
      clearTimeout(activityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [hasShownPopup, currentUser, userProfile]);

  const handleClosePopup = () => {
    setShowLeadPopup(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] overflow-x-hidden">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Stats Bar */}
      <StatsBar />
      
      {/* Bento Grid - Resource Hub */}
      <BentoGrid />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Testimonials */}
      <Testimonials />
      
      {/* Key Sectors */}
      <KeySectors />
      
      {/* Social Proof Marquee */}
      <SocialProofMarquee />
      
      {/* Final CTA */}
      <FinalCTA />

      {/* Lead Capture Popup */}
      <LeadCapturePopup show={showLeadPopup} onClose={handleClosePopup} />
      
      {/* What's New Popup (for existing users) */}
      <WhatsNewPopup show={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
    </div>
  );
};

/* ===== HERO SECTION ===== */
const HeroSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const heroImages = [
    {
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop',
      alt: 'Graduates celebrating success'
    },
    {
      url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop',
      alt: 'Students collaborating on projects'
    },
    {
      url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&auto=format&fit=crop',
      alt: 'Professional business meeting'
    },
    {
      url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop',
      alt: 'Team working in modern office'
    }
  ];

  // Auto-rotate images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [heroImages.length]);
  
  return (
    <section className="relative min-h-screen flex items-center py-32">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      
      {/* Hero Image - Right Side with Carousel */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-[600px] hidden lg:block">
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={heroImages[currentImageIndex].url}
              alt={heroImages[currentImageIndex].alt}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full object-cover rounded-l-3xl"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#0f172a]/30 to-[#0f172a]/80 rounded-l-3xl" />
          
          {/* Image Indicators */}
          <div className="absolute bottom-8 right-8 flex gap-2 z-10">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`transition-all ${
                  index === currentImageIndex
                    ? 'w-8 h-2 bg-teal-400'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                } rounded-full`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl">
          {/* Social Proof Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-8"
          >
            <div className="badge text-teal-400 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Trusted by 1,000+ Graduates
            </div>
          </motion.div>
          
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-bold tracking-tighter mb-6 leading-tight"
          >
            Your Gateway to{' '}
            <span className="text-gradient">Professional Success</span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl lg:text-2xl text-slate-400 mb-10 max-w-2xl leading-relaxed"
          >
            Connecting postgraduate talent with career opportunities worldwide. 
            Join our community of ambitious graduates building their future.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/opportunities" className="btn-primary inline-flex items-center justify-center gap-2 group">
              Explore Opportunities
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="btn-secondary inline-flex items-center justify-center gap-2">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <span className="text-xs uppercase tracking-wider">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-slate-700 rounded-full p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1 h-3 bg-teal-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

/* ===== STATS BAR ===== */
const StatsBar = () => {
  const stats = [
    { value: '500+', label: 'Active Opportunities' },
    { value: '200+', label: 'Partner Employers' },
    { value: '1,000+', label: 'Students Placed' },
    { value: '95%', label: 'Success Rate' },
  ];
  
  return (
    <section className="py-16 border-y border-slate-800/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-bold text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== BENTO GRID ===== */
const BentoGrid = () => {
  const resources = [
    {
      icon: Briefcase,
      title: 'Career Opportunities',
      description: 'Access work placements, internships, and graduate roles across multiple sectors',
      link: '/opportunities',
      span: 'md:col-span-2', // Power card
      color: 'teal',
    },
    {
      icon: Users,
      title: 'Employer Partnerships',
      description: 'Connect with leading employers actively seeking postgraduate talent',
      link: '/employers',
      color: 'purple',
    },
    {
      icon: GraduationCap,
      title: 'Student Support',
      description: 'Get expert guidance, CV reviews, and career coaching from professionals',
      link: '/student-support',
      color: 'blue',
    },
    {
      icon: Globe,
      title: 'Global Opportunities',
      description: 'Explore international placements and sponsorship opportunities',
      link: '/global-students',
      span: 'md:col-span-2',
      color: 'emerald',
    },
  ];
  
  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-4">
            Empowering Your Career Journey
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to land your dream placement in one platform
          </p>
        </motion.div>
        
        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bento-card ${resource.span || ''} card-hover group relative overflow-hidden`}
            >
              {/* Background image for first card */}
              {index === 0 && (
                <>
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity">
                    <img
                      src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-600/5 to-transparent" />
                </>
              )}

              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl bg-${resource.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <resource.icon className={`w-7 h-7 text-${resource.color}-500`} />
                </div>
                
                <h3 className="text-2xl font-bold mb-3">
                  {resource.title}
                </h3>
                
                <p className="text-slate-400 mb-6 leading-relaxed">
                  {resource.description}
                </p>
                
                <Link 
                  to={resource.link}
                  className="inline-flex items-center gap-2 text-teal-400 font-semibold hover:gap-3 transition-all"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== HOW IT WORKS ===== */
const HowItWorks = () => {
  const steps = [
    {
      icon: Target,
      title: 'Create Your Profile',
      description: 'Sign up and build a comprehensive profile showcasing your skills and career goals.',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop'
    },
    {
      icon: TrendingUp,
      title: 'Explore Opportunities',
      description: 'Browse hundreds of placements tailored to your field and aspirations.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&auto=format&fit=crop'
    },
    {
      icon: Zap,
      title: 'Apply with Ease',
      description: 'Submit applications directly through our streamlined platform.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&auto=format&fit=crop'
    },
    {
      icon: CheckCircle2,
      title: 'Land Your Dream Role',
      description: 'Get matched with employers and start your professional journey.',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&auto=format&fit=crop'
    },
  ];
  
  return (
    <section className="py-24 lg:py-32 bg-slate-800/20">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Four simple steps to kickstart your career
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/50 transition-all">
                {/* Step Number */}
                <div className="absolute top-4 left-4 w-10 h-10 bg-teal-500 text-slate-900 rounded-full flex items-center justify-center font-bold shadow-lg shadow-teal-500/50 z-10">
                  {index + 1}
                </div>

                {/* Step Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  
                  {/* Icon on image */}
                  <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-teal-500/50">
                    <step.icon className="w-6 h-6 text-teal-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">
                    {step.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== TESTIMONIALS ===== */
const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const testimonials = [
    {
      quote: "PlacementsPortal helped me land my dream role in civil engineering. The platform was intuitive, and the support team was incredibly helpful throughout the entire process. I couldn't have done it without them.",
      name: 'Sarah Johnson',
      role: 'Civil Engineering Graduate',
      company: 'BuildTech Solutions',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop',
    },
    {
      quote: "The opportunities available through PlacementsPortal were exactly what I was looking for. I secured a fantastic placement in project consultancy within weeks of joining. The process was seamless and professional.",
      name: 'Michael Chen',
      role: 'Project Management Graduate',
      company: 'ConsultPlus International',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop',
    },
    {
      quote: "As a structural engineering graduate, finding the right placement was crucial. PlacementsPortal connected me with top employers and provided excellent resources to prepare for interviews. Highly recommend!",
      name: 'Priya Patel',
      role: 'Structural Engineering Graduate',
      company: 'EngFirst Design',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop',
    },
    {
      quote: "The IT service desk placement I found through PlacementsPortal was the perfect start to my career. The platform made it easy to showcase my skills and connect with companies that valued my expertise.",
      name: 'James Williams',
      role: 'IT Service Desk Graduate',
      company: 'TechCore Solutions',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop',
    },
    {
      quote: "PlacementsPortal gave me access to opportunities I wouldn't have found elsewhere. The career coaching and resources were invaluable in helping me prepare for my role in infrastructure development.",
      name: 'Emily Thompson',
      role: 'Infrastructure Graduate',
      company: 'InfraUK Projects',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop',
    },
    {
      quote: "Finding a placement in R&D seemed daunting, but PlacementsPortal made it straightforward. The platform's focus on graduate talent really shows, and I felt supported every step of the way.",
      name: 'David Kumar',
      role: 'Research & Development Graduate',
      company: 'TechInnovate Labs',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop',
    },
    {
      quote: "The events and workshops offered through PlacementsPortal helped me build confidence and expand my network. Landing my consultancy role felt natural after all the preparation and support I received.",
      name: 'Aisha Mohammed',
      role: 'Business Consultancy Graduate',
      company: 'ProjMasters Consulting',
      image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&auto=format&fit=crop',
    },
    {
      quote: "PlacementsPortal stands out for its personalized approach. The platform understood my career goals and matched me with opportunities that aligned perfectly with my aspirations in digital innovation.",
      name: 'Oliver Martinez',
      role: 'Digital Innovation Graduate',
      company: 'DigiDynamics Ltd',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop',
    },
  ];

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  return (
    <section className="py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Hear from graduates who found their dream placements through our platform
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-5xl mx-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden card-hover"
            >
              <div className="grid md:grid-cols-5 gap-8 p-8 lg:p-12">
                {/* Left: Image */}
                <div className="md:col-span-2 flex flex-col items-center justify-center">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-purple-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                    <img
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      className="relative w-48 h-48 rounded-2xl object-cover ring-4 ring-teal-500/30 shadow-2xl"
                    />
                  </div>
                  
                  {/* Name & Role */}
                  <div className="mt-6 text-center">
                    <div className="font-bold text-xl mb-1">{testimonials[currentIndex].name}</div>
                    <div className="text-slate-400 text-sm mb-1">{testimonials[currentIndex].role}</div>
                    <div className="text-teal-400 font-semibold text-sm">{testimonials[currentIndex].company}</div>
                  </div>
                </div>

                {/* Right: Quote */}
                <div className="md:col-span-3 flex flex-col justify-center">
                  <Quote className="w-12 h-12 text-teal-500/30 mb-6" />
                  
                  <p className="text-xl lg:text-2xl text-slate-200 leading-relaxed">
                    "{testimonials[currentIndex].quote}"
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-all group"
            aria-label="Previous testimonial"
          >
            <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-teal-400 hover:border-teal-500/50 transition-all group"
            aria-label="Next testimonial"
          >
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all ${
                  index === currentIndex
                    ? 'w-8 h-2 bg-teal-500'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                } rounded-full`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ===== KEY SECTORS ===== */
const KeySectors = () => {
  const sectors = [
    { icon: Hammer, name: 'Civil Engineering' },
    { icon: Building2, name: 'Structural Engineering' },
    { icon: Code, name: 'IT Service Desk' },
    { icon: BarChart, name: 'Project Consultancy' },
    { icon: Beaker, name: 'Research & Development' },
    { icon: Network, name: 'Infrastructure' },
  ];
  
  return (
    <section className="py-24 lg:py-32 bg-slate-800/20">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter mb-4">
            Key Sectors We Serve
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Connecting talent with opportunities across diverse industries
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {sectors.map((sector, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-teal-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <sector.icon className="w-6 h-6 text-teal-500" />
                </div>
                <span className="font-semibold text-slate-200">{sector.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== SOCIAL PROOF MARQUEE ===== */
const SocialProofMarquee = () => {
  const partners = [
    'BuildTech', 'TechCore', 'InfraUK', 'ConsultPlus', 
    'EngFirst', 'DigiDynamics', 'ProjMasters', 'TechInnovate'
  ];
  
  return (
    <section className="py-24 border-y border-slate-800/50 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-2xl font-bold tracking-tighter">
            Trusted by Leading Employers
          </h2>
          <div className="badge text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Verified Success
          </div>
        </div>
        <p className="text-center text-slate-400">
          Partnering with industry leaders to bring you the best opportunities
        </p>
      </div>
      
      {/* Infinite Marquee */}
      <div className="relative">
        <div className="flex gap-8 animate-marquee">
          {[...partners, ...partners].map((partner, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-48 h-24 bg-slate-800/30 border border-slate-700/50 rounded-xl flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
            >
              <span className="text-xl font-bold text-slate-400">{partner}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ===== FINAL CTA ===== */
const FinalCTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-slate-900 to-purple-900/20" />
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tighter mb-6">
            Ready to Start Your{' '}
            <span className="text-gradient">Career Journey?</span>
          </h2>
          
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of students who found their dream placement through our platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 group text-lg px-8 py-4">
              Create Your Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/about" className="btn-secondary inline-flex items-center justify-center gap-2 text-lg px-8 py-4">
              Learn More
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* ===== LEAD CAPTURE POPUP ===== */
const LeadCapturePopup = ({ show, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interest: 'opportunities'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send to your backend/CRM
    console.log('Lead captured:', formData);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side - Image */}
              <div className="relative h-64 md:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop"
                  alt="Students celebrating success"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 to-purple-600/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                  <Sparkles className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold text-center mb-2">Join 1,000+ Graduates</h3>
                  <p className="text-center text-white/90 text-sm">
                    Get exclusive access to opportunities, resources, and career support
                  </p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="p-8">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>

                {!submitted ? (
                  <>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      Start Your Journey
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Get instant access to 2,500+ career opportunities
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="John Smith"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          I'm interested in
                        </label>
                        <select
                          name="interest"
                          value={formData.interest}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="opportunities">Job Opportunities</option>
                          <option value="coaching">Career Coaching</option>
                          <option value="workshops">Workshops & Events</option>
                          <option value="resources">Learning Resources</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        Get Started Free
                        <ArrowRight className="w-5 h-5" />
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        By signing up, you agree to our Terms & Privacy Policy
                      </p>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      Welcome Aboard!
                    </h4>
                    <p className="text-gray-600">
                      Check your email for exclusive resources
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// WHAT'S NEW POPUP (For Existing Users)
// ============================================

const WhatsNewPopup = ({ show, onClose }) => {
  const whatsNewItems = [
    {
      icon: Video,
      title: 'Elevated Pitch Studio',
      description: 'Create your 60-second video pitch with AI script generation',
      badge: 'NEW',
      color: 'red',
      link: '/studio'
    },
    {
      icon: Briefcase,
      title: 'Live Job Feed',
      description: '30-minute HOT window for freshly posted opportunities',
      badge: 'HOT',
      color: 'orange',
      link: '/live-feed'
    },
    {
      icon: Calendar,
      title: 'Upcoming Events',
      description: 'Join workshops, webinars, and networking sessions',
      badge: null,
      color: 'purple',
      link: '/community/events'
    }
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
              >
                <Bell className="w-8 h-8" />
              </motion.div>
              
              <h3 className="text-3xl font-bold mb-2">What's New!</h3>
              <p className="text-purple-100">
                Check out these new features and upcoming events
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-4">
                {whatsNewItems.map((item, index) => {
                  const Icon = item.icon;
                  const colorClasses = {
                    red: 'bg-red-100 text-red-600 border-red-200',
                    orange: 'bg-orange-100 text-orange-600 border-orange-200',
                    purple: 'bg-purple-100 text-purple-600 border-purple-200',
                    blue: 'bg-blue-100 text-blue-600 border-blue-200'
                  };

                  return (
                    <motion.a
                      key={index}
                      href={item.link}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[item.color]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                            {item.title}
                          </h4>
                          {item.badge && (
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                              item.badge === 'NEW' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      </div>

                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </motion.a>
                  );
                })}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Maybe Later
                </button>
                <a
                  href="/dashboard"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-center"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HomeSaaS;
