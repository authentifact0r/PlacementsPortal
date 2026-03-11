import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Video,
  Target,
  GraduationCap,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Images,
  Building2,
  Briefcase,
  TrendingUp,
  X,
  Clock
} from 'lucide-react';
import { eventService } from '../services/event.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EventBookingModal from '../components/EventBookingModal';
import CoachingBookingModal from '../components/CoachingBookingModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

const Community = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('whats-on');

  // Update active section based on URL path
  useEffect(() => {
    if (location.pathname.includes('/events')) {
      setActiveSection('events');
    } else if (location.pathname.includes('/workshops')) {
      setActiveSection('coaching');
    } else if (location.pathname.includes('/courses')) {
      setActiveSection('skill-hub');
    } else if (location.pathname.includes('/industry-insight')) {
      setActiveSection('industry-insight');
    } else {
      setActiveSection('whats-on');
    }
  }, [location.pathname]);

  const sections = [
    { id: 'whats-on', label: "What's On", icon: Sparkles },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'coaching', label: 'Career Coaching', icon: Video },
    { id: 'intervention', label: '1:1 Intervention', icon: Target },
    { id: 'skill-hub', label: 'Skill HUB Academy', icon: GraduationCap },
    { id: 'industry-insight', label: 'Industry Insight', icon: Images }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0f172a] via-slate-900 to-slate-800 pt-12 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 backdrop-blur-md rounded-full border border-purple-500/30 mb-6"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300 tracking-wide">COMMUNITY HUB</span>
            </motion.div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Connect. Learn. Grow<br />Together.
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join our vibrant community of students, professionals, and career experts. Access exclusive events, coaching, and learning opportunities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section with Radio Navigation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Radio Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Explore</h3>
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${isActive ? '' : 'text-gray-500'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm">{section.label}</span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-3 scroll-mt-24">
              <AnimatePresence mode="wait">
                {activeSection === 'whats-on' && <WhatsOnContent key="whats-on" />}
                {activeSection === 'events' && <EventsContent key="events" />}
                {activeSection === 'coaching' && <CoachingContent key="coaching" />}
                {activeSection === 'intervention' && <InterventionContent key="intervention" />}
                {activeSection === 'skill-hub' && <SkillHubContent key="skill-hub" />}
                {activeSection === 'industry-insight' && <IndustryInsightContent key="industry-insight" />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ===== WHAT'S ON CONTENT ===== */
const WhatsOnContent = () => {
  const highlights = [
    {
      title: 'Graduate Recruitment Fair 2026',
      date: 'March 15, 2026',
      time: '10:00 AM - 4:00 PM',
      location: 'ExCeL London',
      type: 'Event',
      description: 'Meet 50+ top employers, attend panel discussions, and secure on-the-spot interviews.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
      color: 'from-blue-600 to-blue-700',
      badgeColor: 'bg-blue-100 text-blue-700',
      attendees: 250,
      featured: true
    },
    {
      title: 'CV Masterclass Workshop',
      date: 'March 12, 2026',
      time: '6:00 PM - 8:00 PM',
      location: 'Virtual (Zoom)',
      type: 'Workshop',
      description: 'Learn how to create an ATS-optimized CV that gets you noticed by recruiters.',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop',
      color: 'from-purple-600 to-purple-700',
      badgeColor: 'bg-purple-100 text-purple-700',
      attendees: 85,
      featured: false
    },
    {
      title: 'Industry Networking Night',
      date: 'March 18, 2026',
      time: '7:00 PM - 10:00 PM',
      location: 'Manchester, UK',
      type: 'Networking',
      description: 'Connect with professionals, alumni, and peers over drinks and canapés.',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop',
      color: 'from-green-600 to-green-700',
      badgeColor: 'bg-green-100 text-green-700',
      attendees: 120,
      featured: false
    },
    {
      title: 'Mock Interview Day',
      date: 'March 20, 2026',
      time: '9:00 AM - 5:00 PM',
      location: 'Birmingham, UK',
      type: 'Coaching',
      description: 'Practice interviews with industry professionals and receive detailed feedback.',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop',
      color: 'from-teal-600 to-teal-700',
      badgeColor: 'bg-teal-100 text-teal-700',
      attendees: 45,
      featured: false
    },
    {
      title: 'Engineering Sector Showcase',
      date: 'March 25, 2026',
      time: '2:00 PM - 6:00 PM',
      location: 'Leeds Tech Hub',
      type: 'Event',
      description: 'Discover career paths in civil, structural, and software engineering.',
      image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&auto=format&fit=crop',
      color: 'from-orange-600 to-orange-700',
      badgeColor: 'bg-orange-100 text-orange-700',
      attendees: 95,
      featured: false
    },
    {
      title: 'LinkedIn Profile Optimization',
      date: 'March 28, 2026',
      time: '5:00 PM - 7:00 PM',
      location: 'Virtual (Zoom)',
      type: 'Workshop',
      description: 'Transform your LinkedIn presence to attract recruiters and opportunities.',
      image: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800&auto=format&fit=crop',
      color: 'from-indigo-600 to-indigo-700',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      attendees: 110,
      featured: false
    },
    {
      title: 'London Business Leaders Summit',
      date: 'March 15, 2026',
      time: '9:00 AM - 5:00 PM',
      location: 'London Excel Centre',
      type: 'Business Event',
      description: 'Connect with C-suite executives and industry leaders. Featuring keynotes on innovation, leadership, and scaling businesses.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
      color: 'from-blue-600 to-blue-700',
      badgeColor: 'bg-blue-100 text-blue-700',
      attendees: 500,
      featured: false
    },
    {
      title: 'Graduate Business Networking Evening',
      date: 'March 22, 2026',
      time: '6:00 PM - 9:00 PM',
      location: 'The Shard, London',
      type: 'Networking',
      description: 'Premium networking event for graduates and young professionals in business sectors. Includes drinks, canapés, and speed networking sessions.',
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop',
      color: 'from-emerald-600 to-emerald-700',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      attendees: 180,
      featured: false
    },
    {
      title: 'London Career & Job Fair 2026',
      date: 'April 5, 2026',
      time: '10:00 AM - 6:00 PM',
      location: 'Olympia London',
      type: 'Job Fair',
      description: 'Meet 150+ employers hiring graduates across all sectors. On-the-spot interviews, CV clinics, and career advice available.',
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop',
      color: 'from-rose-600 to-rose-700',
      badgeColor: 'bg-rose-100 text-rose-700',
      attendees: 2500,
      featured: false
    },
    {
      title: 'Tech Startup Networking Mixer',
      date: 'March 30, 2026',
      time: '5:30 PM - 8:30 PM',
      location: 'Shoreditch, London',
      type: 'Networking',
      description: 'Connect with founders, investors, and tech professionals in London\'s startup hub. Pizza, drinks, and pitch sessions included.',
      image: 'https://images.unsplash.com/photo-1528605105345-5344ea20e269?w=800&auto=format&fit=crop',
      color: 'from-cyan-600 to-cyan-700',
      badgeColor: 'bg-cyan-100 text-cyan-700',
      attendees: 150,
      featured: false
    },
    {
      title: 'Women in Business Leadership Forum',
      date: 'April 10, 2026',
      time: '1:00 PM - 5:00 PM',
      location: 'Canary Wharf, London',
      type: 'Business Event',
      description: 'Empowering women in business with insights from female CEOs and senior leaders. Includes panel discussions and mentoring sessions.',
      image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop',
      color: 'from-pink-600 to-pink-700',
      badgeColor: 'bg-pink-100 text-pink-700',
      attendees: 300,
      featured: false
    },
    {
      title: 'Financial Services Recruitment Fair',
      date: 'April 12, 2026',
      time: '11:00 AM - 4:00 PM',
      location: 'Bank of England Conference Centre, London',
      type: 'Job Fair',
      description: 'Exclusive recruitment fair for finance graduates. Major banks and investment firms seeking talent. Bring 10 copies of your CV.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop',
      color: 'from-slate-600 to-slate-700',
      badgeColor: 'bg-slate-100 text-slate-700',
      attendees: 800,
      featured: false
    },
    {
      title: 'Professional Networking Breakfast Club',
      date: 'March 16, 2026',
      time: '7:30 AM - 9:30 AM',
      location: 'WeWork Tower Bridge, London',
      type: 'Networking',
      description: 'Early morning networking over coffee and pastries. Meet professionals from various industries before the workday starts.',
      image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&auto=format&fit=crop',
      color: 'from-amber-600 to-amber-700',
      badgeColor: 'bg-amber-100 text-amber-700',
      attendees: 60,
      featured: false
    },
    {
      title: 'Graduate Consulting Career Fair',
      date: 'April 18, 2026',
      time: '12:00 PM - 6:00 PM',
      location: 'Business Design Centre, London',
      type: 'Job Fair',
      description: 'Top consulting firms recruiting for graduate programs. Includes presentations, Q&A sessions, and networking with consultants.',
      image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop',
      color: 'from-violet-600 to-violet-700',
      badgeColor: 'bg-violet-100 text-violet-700',
      attendees: 1200,
      featured: false
    }
  ];

  const featuredEvent = highlights.find(h => h.featured);
  const otherHighlights = highlights.filter(h => !h.featured);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">What's On This Month</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Discover upcoming events, workshops, and networking opportunities. Join thousands of graduates building their careers.
      </p>

      {/* Featured Event Hero */}
      {featuredEvent && (
        <div className="relative h-[500px] rounded-2xl overflow-hidden mb-8 group">
          <img
            src={featuredEvent.image}
            alt={featuredEvent.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Featured Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-4 py-2 bg-yellow-400 text-gray-900 text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Featured Event
            </span>
          </div>

          {/* Type Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-4 py-2 ${featuredEvent.badgeColor} backdrop-blur-sm text-sm font-bold rounded-full shadow-lg`}>
              {featuredEvent.type}
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl">
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {featuredEvent.title}
              </h3>
              <p className="text-lg text-white/90 mb-6 max-w-2xl">
                {featuredEvent.description}
              </p>
              
              {/* Event Details */}
              <div className="flex flex-wrap gap-4 mb-6 text-white">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{featuredEvent.date}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">{featuredEvent.location}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{featuredEvent.attendees} attending</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className={`px-8 py-4 bg-gradient-to-r ${featuredEvent.color} text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center gap-2`}>
                  Register Now - Free
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold rounded-xl transition-all border border-white/30">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Highlights Grid */}
      <h3 className="text-2xl font-bold text-gray-900 mb-6">More Events & Workshops</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherHighlights.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${item.color} opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
              
              {/* Type Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 ${item.badgeColor} backdrop-blur-sm text-xs font-bold rounded-full`}>
                  {item.type}
                </span>
              </div>

              {/* Date Badge */}
              <div className="absolute top-4 right-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
                  <div className="text-xs font-bold text-gray-500 uppercase">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {new Date(item.date).getDate()}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {item.title}
              </h4>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {item.description}
              </p>

              {/* Details */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>{item.attendees} attending</span>
                </div>
              </div>

              {/* Button */}
              <button className={`w-full px-4 py-3 bg-gradient-to-r ${item.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                Register Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">12</div>
          <p className="text-sm text-gray-700 font-medium">Events This Month</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">8</div>
          <p className="text-sm text-gray-700 font-medium">Workshops Available</p>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-teal-600 mb-1">1,200+</div>
          <p className="text-sm text-gray-700 font-medium">Total Attendees</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-1">50+</div>
          <p className="text-sm text-gray-700 font-medium">Partner Companies</p>
        </div>
      </div>
    </motion.div>
  );
};

/* ===== EVENTS CONTENT ===== */
// Mock events for fallback
const MOCK_EVENTS = [
    {
      title: 'Tech Industry Mixer',
      date: 'March 15, 2026',
      dateShort: 'MAR 15',
      time: '6:00 PM - 9:00 PM',
      location: 'London, UK',
      locationDetail: 'London Tech Hub',
      attendees: 45,
      description: 'Connect with tech leaders and emerging talent. Network with industry professionals and discover opportunities.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop'
    },
    {
      title: 'Engineering Career Fair',
      date: 'March 22, 2026',
      dateShort: 'MAR 22',
      time: '10:00 AM - 4:00 PM',
      location: 'Manchester, UK',
      locationDetail: 'Manchester Arena',
      attendees: 120,
      description: 'Meet top engineering employers. Explore career opportunities with leading civil and structural engineering firms.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop'
    },
    {
      title: 'Resume Workshop',
      date: 'March 28, 2026',
      dateShort: 'MAR 28',
      time: '2:00 PM - 4:00 PM',
      location: 'Virtual via Zoom',
      locationDetail: 'Online Event',
      attendees: 30,
      description: 'Expert CV review and optimization. Learn how to create a standout resume that gets you noticed by employers.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop'
    },
    {
      title: 'AI in Construction Summit',
      date: 'April 5, 2026',
      dateShort: 'APR 5',
      time: '9:00 AM - 5:00 PM',
      location: 'Birmingham, UK',
      locationDetail: 'ICC Birmingham',
      attendees: 200,
      description: 'Discover how AI is transforming the construction industry. Learn from experts about automation and innovation.',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop'
    },
    {
      title: 'Graduate Recruitment Panel',
      date: 'April 12, 2026',
      dateShort: 'APR 12',
      time: '6:30 PM - 8:30 PM',
      location: 'Leeds, UK',
      locationDetail: 'Leeds Business School',
      attendees: 65,
      description: 'Insights from recruitment managers at top firms. Understand what employers look for in graduate candidates.',
      image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&auto=format&fit=crop'
    },
    {
      title: 'IT Service Desk Bootcamp',
      date: 'April 18, 2026',
      dateShort: 'APR 18',
      time: '10:00 AM - 3:00 PM',
      location: 'Virtual via Zoom',
      locationDetail: 'Online Event',
      attendees: 85,
      description: 'Hands-on technical training session. Build practical IT support skills and earn a certification of completion.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop'
    }
];

const EventsContent = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showInfo } = useToast();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState(new Set());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventService.getAll({ 
        status: 'upcoming',
        limit: 20 
      });
      
      if (data && data.length > 0) {
        console.log(`Loaded ${data.length} events from Firestore`);
        setEvents(data);
      } else {
        // Fallback to mock data
        console.log('Firestore empty, using mock events');
        setEvents(MOCK_EVENTS);
      }
    } catch (err) {
      console.error('Error fetching events:', err.message || err);
      // Don't show error UI, just silently fall back to mock data
      console.log('Falling back to mock events due to error');
      setEvents(MOCK_EVENTS);
      setError(null); // Clear error to prevent error UI
    } finally {
      setLoading(false);
    }
  }, []);

  const checkRegistrationStatus = useCallback(async () => {
    if (!currentUser || events.length === 0) return;
    
    try {
      const registered = new Set();
      for (const event of events) {
        if (event.id) {
          const isRegistered = await eventService.isUserRegistered(event.id, currentUser.uid);
          if (isRegistered) {
            registered.add(event.id);
          }
        }
      }
      setRegisteredEvents(registered);
    } catch (err) {
      console.error('Error checking registration status:', err);
    }
  }, [currentUser, events]);

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Check registration status for logged-in users
  useEffect(() => {
    checkRegistrationStatus();
  }, [checkRegistrationStatus]);

  const handleBookEvent = (event) => {
    if (!currentUser) {
      showInfo('Please login to register for events');
      navigate('/login', { state: { from: '/community/events' } });
      return;
    }

    if (registeredEvents.has(event.id)) {
      showInfo('You are already registered for this event');
      return;
    }

    setSelectedEvent(event);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    fetchEvents();
    if (selectedEvent?.id) {
      setRegisteredEvents(prev => new Set([...prev, selectedEvent.id]));
    }
  };

  if (loading) {
    return (
      <div className="pt-4">
        <LoadingSpinner message="Loading events..." />
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="pt-4">
        <ErrorMessage message={error} onRetry={fetchEvents} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Join industry professionals, alumni, and peers at our exclusive networking and learning events.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event, index) => {
          const isRegistered = event.id && registeredEvents.has(event.id);
          
          return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
          >
            {/* Image with Date Badge */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Date Badge Overlay */}
              <div className="absolute top-4 left-4 bg-[#e28751] text-white px-3 py-2 rounded-lg shadow-lg">
                <div className="text-xs font-bold tracking-wide">{event.dateShort}</div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#e28751] transition-colors line-clamp-2">
                {event.title}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{event.location}</span>
              </div>

              {/* Hidden Information Area - Revealed on Hover */}
              <div className="max-h-0 opacity-0 overflow-hidden group-hover:max-h-48 group-hover:opacity-100 transition-all duration-300">
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                  {event.description}
                </p>

                {/* Book Now / Registered Button */}
                {isRegistered ? (
                  <div className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 text-green-700 font-semibold rounded-lg flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Registered
                  </div>
                ) : (
                  <button 
                    onClick={() => handleBookEvent(event)}
                    className="w-full px-4 py-3 bg-[#e28751] hover:bg-[#d67742] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Attendees Badge - Always Visible */}
              <div className="flex items-center gap-2 text-gray-500 text-xs mt-3 pt-3 border-t border-slate-100">
                <Users className="w-3.5 h-3.5" />
                <span>{event.attendees || event.registeredCount || 0} attending</span>
              </div>
            </div>
          </motion.div>
        );
      })}
      </div>

      {/* Event Booking Modal */}
      <EventBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        event={selectedEvent}
        onSuccess={handleBookingSuccess}
      />
    </motion.div>
  );
};

/* ===== CAREER COACHING CONTENT ===== */
const CoachingContent = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showInfo } = useToast();
  const [selectedSession, setSelectedSession] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookSession = (session) => {
    console.log('handleBookSession called with session:', session);
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('No current user, redirecting to login');
      showInfo('Please login to book a coaching session');
      navigate('/login', { state: { from: '/community/coaching' } });
      return;
    }

    console.log('Setting selected session and opening modal');
    setSelectedSession(session);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    console.log('Coaching session booked successfully');
  };

  const coachingSessions = [
    {
      id: 1,
      type: 'deep-dive',
      name: '1-Hour Deep Dive',
      duration: '60 minutes',
      price: '£45',
      description: 'Comprehensive career planning session with expert coaches. Perfect for major decisions and strategy development.',
      features: [
        'Complete CV & cover letter review',
        'Interview preparation & techniques',
        'Career path mapping & goal setting',
        'Personalized action plan'
      ]
    },
    {
      id: 2,
      type: 'quick-win',
      name: '30-Min Quick Win',
      duration: '30 minutes',
      price: '£25',
      description: 'Focused coaching for specific challenges. Get targeted advice on your most pressing career questions.',
      features: [
        'Quick CV feedback',
        'Interview question practice',
        'Salary negotiation tips',
        'Immediate actionable advice'
      ]
    },
    {
      id: 3,
      type: 'group-workshop',
      name: 'Group Workshop',
      duration: '2 hours weekly',
      price: '£15/session',
      description: 'Interactive group sessions with peers. Learn together, share experiences, and build your professional network.',
      features: [
        'Weekly 2-hour group sessions',
        'Collaborative learning environment',
        'Peer feedback and support',
        'Network with other professionals'
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Career Coaching & Mentorship</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Work with experienced career coaches and industry mentors. Get personalized guidance to accelerate your professional growth.
      </p>

      {/* Hero Image Section */}
      <div className="relative h-96 rounded-2xl overflow-hidden mb-8 group">
        <img
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&auto=format&fit=crop"
          alt="Career coaching session"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-4">
              <Video className="w-4 h-4" />
              <span className="text-sm font-semibold">Expert Career Coaches</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-3">
              Transform Your Career with Expert Guidance
            </h3>
            <p className="text-lg text-white/90 mb-6">
              One-on-one coaching sessions with certified career advisors who understand your industry and goals.
            </p>
            <button 
              onClick={() => handleBookSession(coachingSessions[0])}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Book Free Consultation
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Coaching Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card 1 - 1-Hour Deep Dive */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop"
              alt="One-on-one video coaching"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <h4 className="text-xl font-bold text-white">1-Hour Deep Dive</h4>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-purple-900 text-sm font-bold rounded-full">
                Most Popular
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Comprehensive career planning session with expert coaches. Perfect for major decisions and strategy development.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Complete CV & cover letter review</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Interview preparation & techniques</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Career path mapping & goal setting</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Personalized action plan</span>
              </li>
            </ul>
            <button 
              onClick={() => handleBookSession(coachingSessions[0])}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Book Session - £45
            </button>
          </div>
        </div>

        {/* Card 2 - Group Workshop */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop"
              alt="Group workshop session"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <h4 className="text-xl font-bold text-white">Group Workshop</h4>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-teal-900 text-sm font-bold rounded-full">
                Great Value
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Interactive group sessions with peers. Learn together, share experiences, and build your professional network.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Weekly 2-hour group sessions</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Real-world industry insights</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Peer networking opportunities</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Group activities & exercises</span>
              </li>
            </ul>
            <button 
              onClick={() => handleBookSession(coachingSessions[2])}
              className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Join Workshop - £15/session
            </button>
          </div>
        </div>

        {/* Card 3 - Industry Mentor Match */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&auto=format&fit=crop"
              alt="Mentorship program"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h4 className="text-xl font-bold text-white">Industry Mentor Match</h4>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Connect with experienced professionals in your field. Get long-term guidance from someone who's been there.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>3-month mentorship program</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Matched to your career goals</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Monthly video check-ins</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Email support between sessions</span>
              </li>
            </ul>
            <button 
              onClick={() => handleBookSession({...coachingSessions[1], name: 'Industry Mentor Match', price: 'Contact Us'})}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Apply for Mentorship
            </button>
          </div>
        </div>

        {/* Card 4 - Quick Guidance */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop"
              alt="Quick consultation"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <h4 className="text-xl font-bold text-white">30-Min Quick Guidance</h4>
              <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-orange-900 text-sm font-bold rounded-full">
                £Free
              </span>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Need quick advice? Get answers to specific questions in a focused 30-minute session. Perfect for urgent queries.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Fast-track booking available</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Focused on specific questions</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>No long-term commitment</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>First session completely free</span>
              </li>
            </ul>
            <button 
              onClick={() => handleBookSession(coachingSessions[1])}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Book Session - £25
            </button>
          </div>
        </div>
      </div>

      {/* Success Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Coaching Success Stories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">94%</div>
            <p className="text-sm text-gray-600">Success rate in job placement within 3 months</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-teal-600 mb-2">2,500+</div>
            <p className="text-sm text-gray-600">Graduates coached to career success</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">4.9/5</div>
            <p className="text-sm text-gray-600">Average coaching satisfaction rating</p>
          </div>
        </div>
      </div>

      {/* Coaching Booking Modal */}
      <CoachingBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        session={selectedSession}
        onSuccess={handleBookingSuccess}
      />
    </motion.div>
  );
};

/* ===== 1:1 INTERVENTION CONTENT ===== */
const InterventionContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">1:1 Intervention & Virtual Support</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Get personalized, one-on-one support from expert career advisors. Virtual sessions tailored to your unique challenges and goals.
      </p>

      {/* Hero Image Section */}
      <div className="relative h-96 rounded-2xl overflow-hidden mb-8 group">
        <img
          src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=1200&auto=format&fit=crop"
          alt="Virtual mentoring session"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-4">
              <Video className="w-4 h-4" />
              <span className="text-sm font-semibold">Virtual Sessions Available</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-3">
              Personal Support, When You Need It Most
            </h3>
            <p className="text-lg text-white/90 mb-6">
              Connect with dedicated career specialists through secure video calls, scheduled at your convenience.
            </p>
            <button className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              Book Your Session
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Support Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Card 1 - Application Support */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop"
              alt="Online consultation"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h4 className="text-xl font-bold text-white">Application Support</h4>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Struggling with rejections? Get expert review of your applications, CVs, and cover letters with actionable feedback.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>CV & cover letter optimization</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Application strategy development</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Rejection analysis & improvement</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2 - Interview Confidence */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop"
              alt="Video interview practice"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h4 className="text-xl font-bold text-white">Interview Confidence</h4>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Build interview confidence through personalized mock interviews with detailed feedback and technique coaching.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Mock interview simulations</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Body language & communication tips</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Question preparation strategies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 3 - Career Direction */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&auto=format&fit=crop"
              alt="Career planning discussion"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h4 className="text-xl font-bold text-white">Career Direction</h4>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Clarify your career goals with structured guidance from advisors who understand your industry and aspirations.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Career path exploration</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Goal setting & action planning</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Industry insights & trends</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 4 - Skills Gap Analysis */}
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all">
          <div className="relative h-48 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop"
              alt="Skills assessment session"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h4 className="text-xl font-bold text-white">Skills Gap Analysis</h4>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Identify skills you need to develop and create a personalized learning roadmap to bridge the gap.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Comprehensive skills assessment</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Personalized development plan</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Resource recommendations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How Virtual Support Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              1
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Book Your Session</h4>
            <p className="text-sm text-gray-600">Choose a time that works for you and select your support area</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              2
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Connect Online</h4>
            <p className="text-sm text-gray-600">Join your secure video call with your dedicated advisor</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
              3
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Get Results</h4>
            <p className="text-sm text-gray-600">Receive personalized action plan and ongoing support</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ===== SKILL HUB ACADEMY CONTENT ===== */
const SkillHubContent = () => {
  const courses = [
    { 
      title: 'Data Analytics Bootcamp', 
      duration: '8 weeks', 
      level: 'Intermediate', 
      enrolled: 245,
      description: 'Master data visualization, statistical analysis, and business intelligence tools. Transform raw data into actionable insights.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
      color: 'from-blue-600 to-blue-700',
      topics: ['Python & R', 'SQL', 'Tableau', 'Excel Advanced'],
      certification: 'Professional Data Analyst Certificate'
    },
    { 
      title: 'Project Management Essentials', 
      duration: '6 weeks', 
      level: 'Beginner', 
      enrolled: 189,
      description: 'Learn proven frameworks and methodologies to lead successful projects from planning to delivery.',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop',
      color: 'from-purple-600 to-purple-700',
      topics: ['Agile & Scrum', 'Risk Management', 'Stakeholder Communication', 'Project Planning'],
      certification: 'Certified Project Coordinator'
    },
    { 
      title: 'Software Development Fundamentals', 
      duration: '10 weeks', 
      level: 'Beginner', 
      enrolled: 312,
      description: 'Build a strong foundation in programming, version control, and software engineering principles.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop',
      color: 'from-teal-600 to-teal-700',
      topics: ['HTML/CSS/JavaScript', 'Git & GitHub', 'React Basics', 'API Integration'],
      certification: 'Software Developer Foundation Certificate'
    },
    { 
      title: 'Leadership & Management', 
      duration: '4 weeks', 
      level: 'Advanced', 
      enrolled: 156,
      description: 'Develop essential leadership skills to motivate teams, drive performance, and create positive work cultures.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop',
      color: 'from-orange-600 to-orange-700',
      topics: ['Team Building', 'Conflict Resolution', 'Strategic Thinking', 'Performance Management'],
      certification: 'Leadership Excellence Certificate'
    },
    { 
      title: 'Digital Marketing Mastery', 
      duration: '7 weeks', 
      level: 'Intermediate', 
      enrolled: 203,
      description: 'Master SEO, social media marketing, content strategy, and analytics to drive digital growth.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop',
      color: 'from-pink-600 to-pink-700',
      topics: ['SEO & SEM', 'Social Media', 'Content Marketing', 'Google Analytics'],
      certification: 'Digital Marketing Professional'
    },
    { 
      title: 'Cloud Computing Essentials', 
      duration: '6 weeks', 
      level: 'Intermediate', 
      enrolled: 167,
      description: 'Understand cloud infrastructure, deployment strategies, and modern DevOps practices on AWS and Azure.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
      color: 'from-indigo-600 to-indigo-700',
      topics: ['AWS Fundamentals', 'Azure Basics', 'Docker', 'CI/CD Pipelines'],
      certification: 'Cloud Practitioner Certificate'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Skill HUB Academy</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Upskill with industry-relevant courses designed to make you job-ready. Learn from experts, build your portfolio, and earn recognized certifications.
      </p>

      {/* Hero Image Section */}
      <div className="relative h-96 rounded-2xl overflow-hidden mb-8 group">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop"
          alt="Students learning together"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-4">
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-semibold">Industry-Recognized Certifications</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold mb-3">
              Learn Skills That Employers Actually Want
            </h3>
            <p className="text-lg text-white/90 mb-6">
              Expert-led courses with hands-on projects, real-world assignments, and career-focused curriculum.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                Browse All Courses
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold rounded-xl transition-all border border-white/30">
                View Free Previews
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {courses.map((course, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all"
          >
            {/* Course Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${course.color} opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
              
              {/* Level Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-full">
                  {course.level}
                </span>
              </div>
            </div>

            {/* Course Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {course.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Course Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{course.duration}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{course.enrolled} enrolled</span>
                </div>
              </div>

              {/* Topics Pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {course.topics.slice(0, 3).map((topic, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                  >
                    {topic}
                  </span>
                ))}
                {course.topics.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                    +{course.topics.length - 3}
                  </span>
                )}
              </div>

              {/* Enroll Button */}
              <button className={`w-full px-4 py-3 bg-gradient-to-r ${course.color} text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                Enroll Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Why Choose Section */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-8 border border-teal-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Skill HUB Academy?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Certified Courses</h4>
            <p className="text-sm text-gray-600">Industry-recognized certificates upon completion</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Expert Instructors</h4>
            <p className="text-sm text-gray-600">Learn from industry professionals with real experience</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
              <Video className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Self-Paced Learning</h4>
            <p className="text-sm text-gray-600">Study at your own pace with lifetime access</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3">
              <Target className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Real Projects</h4>
            <p className="text-sm text-gray-600">Build portfolio-worthy projects and gain practical skills</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ===== INDUSTRY INSIGHT CONTENT ===== */
const IndustryInsightContent = () => {
  const [selectedInsight, setSelectedInsight] = useState(null);

  const insights = [
    {
      title: 'Civil Engineering: Future of Infrastructure',
      category: 'Civil Engineering',
      date: 'March 15, 2026',
      time: '2:00 PM - 4:30 PM GMT',
      location: 'Virtual Webinar',
      author: 'Dr. Sarah Mitchell',
      company: 'Arup Group',
      excerpt: 'Exploring sustainable design practices and emerging technologies reshaping the construction industry.',
      description: 'Join us for an in-depth exploration of how sustainable design practices and cutting-edge technologies are transforming modern infrastructure. Dr. Sarah Mitchell will share insights from major international projects and discuss the future of civil engineering.',
      topics: ['Sustainable Design', 'Smart Infrastructure', 'BIM Technology', 'Green Materials', 'Climate Resilience'],
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&auto=format&fit=crop',
      accentColor: 'text-blue-600',
      capacity: 500,
      registered: 342
    },
    {
      title: 'IT Service Desk: AI-Powered Support',
      category: 'IT Services',
      date: 'March 18, 2026',
      time: '10:00 AM - 12:00 PM GMT',
      location: 'London, UK - Accenture HQ',
      author: 'James Anderson',
      company: 'Accenture',
      excerpt: 'How artificial intelligence is transforming technical support and customer service workflows.',
      description: 'Discover how AI and machine learning are revolutionizing IT service desks. Learn practical implementation strategies and see real-world case studies from leading organizations.',
      topics: ['AI Automation', 'Chatbots', 'Predictive Analytics', 'Workflow Optimization', 'Customer Experience'],
      icon: Target,
      color: 'from-teal-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop',
      accentColor: 'text-teal-600',
      capacity: 150,
      registered: 128
    },
    {
      title: 'Project Management: Agile Methodologies',
      category: 'Consultancy',
      date: 'March 20, 2026',
      time: '1:00 PM - 5:00 PM GMT',
      location: 'Manchester, UK - Deloitte Office',
      author: 'Emma Thompson',
      company: 'Deloitte',
      excerpt: 'Best practices for implementing agile frameworks in complex project environments.',
      description: 'Master agile project management with hands-on workshops and real-world case studies. Learn how to successfully implement agile methodologies in enterprise environments.',
      topics: ['Scrum Framework', 'Kanban', 'Sprint Planning', 'Team Collaboration', 'Agile Tools'],
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop',
      accentColor: 'text-purple-600',
      capacity: 80,
      registered: 67
    },
    {
      title: 'Structural Engineering: BIM Revolution',
      category: 'Structural Engineering',
      date: 'March 25, 2026',
      time: '9:00 AM - 1:00 PM GMT',
      location: 'Birmingham, UK - AECOM Center',
      author: 'Michael Chen',
      company: 'AECOM',
      excerpt: 'Building Information Modeling is changing how we design and analyze structural systems.',
      description: 'Explore how BIM technology is transforming structural engineering workflows. Get hands-on experience with advanced modeling techniques and collaboration tools.',
      topics: ['BIM Software', '3D Modeling', 'Structural Analysis', 'Collaboration Tools', 'Digital Twins'],
      icon: Building2,
      color: 'from-orange-500 to-orange-600',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop',
      accentColor: 'text-orange-600',
      capacity: 100,
      registered: 89
    },
    {
      title: 'Sustainability in Construction',
      category: 'Green Engineering',
      date: 'March 28, 2026',
      time: '3:00 PM - 6:00 PM GMT',
      location: 'Virtual Webinar',
      author: 'Lisa Rodriguez',
      company: 'WSP Global',
      excerpt: 'Leading the charge towards net-zero buildings with innovative green construction methods.',
      description: 'Learn about the latest sustainable construction techniques and materials. Discover how to design and build net-zero carbon buildings and achieve green certifications.',
      topics: ['Net-Zero Design', 'Green Materials', 'Energy Efficiency', 'LEED Certification', 'Circular Economy'],
      icon: Building2,
      color: 'from-green-500 to-green-600',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
      accentColor: 'text-green-600',
      capacity: 300,
      registered: 245
    },
    {
      title: 'Digital Transformation in IT',
      category: 'Technology',
      date: 'April 2, 2026',
      time: '11:00 AM - 3:00 PM GMT',
      location: 'Leeds, UK - IBM Innovation Hub',
      author: 'David Kumar',
      company: 'IBM',
      excerpt: 'Cloud migration strategies and automation tools revolutionizing enterprise IT infrastructure.',
      description: 'Deep dive into digital transformation strategies for IT teams. Learn about cloud migration, DevOps, automation, and building modern IT infrastructure.',
      topics: ['Cloud Migration', 'DevOps', 'Automation', 'Infrastructure as Code', 'Containerization'],
      icon: Target,
      color: 'from-indigo-500 to-indigo-600',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
      accentColor: 'text-indigo-600',
      capacity: 200,
      registered: 176
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="pt-4"
    >
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Industry Insight</h2>
      <p className="text-gray-600 mb-8 text-lg">
        Stay informed with expert perspectives, emerging trends, and professional insights from industry leaders across civil engineering, IT, and consultancy sectors.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100"
            >
              {/* Image Section with Overlay */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={insight.image}
                  alt={insight.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${insight.color} opacity-40 group-hover:opacity-60 transition-opacity duration-300`} />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-full shadow-lg">
                    {insight.category}
                  </span>
                </div>

                {/* Icon Badge */}
                <div className={`absolute top-4 right-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className={`w-6 h-6 ${insight.accentColor}`} />
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <h3 className={`text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:${insight.accentColor} transition-colors`}>
                  {insight.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                  {insight.excerpt}
                </p>

                {/* Author & Date */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-medium text-gray-700">{insight.author}</span>
                  </div>
                  <span>•</span>
                  <span>{insight.company}</span>
                </div>

                {/* Book Button with Hover Text Change */}
                <button 
                  onClick={() => setSelectedInsight(insight)}
                  className={`w-full px-4 py-3 bg-gradient-to-r ${insight.color} text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg relative overflow-hidden`}
                >
                  <span className="flex items-center gap-2 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">
                    Register or Book
                    <ArrowRight className="w-4 h-4" />
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    Book Now
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedInsight(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header with Image */}
              <div className="relative h-64">
                <img
                  src={selectedInsight.image}
                  alt={selectedInsight.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${selectedInsight.color} opacity-60`} />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold rounded-full shadow-lg">
                    {selectedInsight.category}
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedInsight.title}
                </h2>

                {/* Event Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</p>
                      <p className="text-sm font-bold text-gray-900">{selectedInsight.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</p>
                      <p className="text-sm font-bold text-gray-900">{selectedInsight.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                      <p className="text-sm font-bold text-gray-900">{selectedInsight.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Capacity</p>
                      <p className="text-sm font-bold text-gray-900">{selectedInsight.registered} / {selectedInsight.capacity} registered</p>
                    </div>
                  </div>
                </div>

                {/* Presenter Info */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedInsight.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500">Presented by</p>
                    <p className="text-lg font-bold text-gray-900">{selectedInsight.author}</p>
                    <p className="text-sm text-gray-600">{selectedInsight.company}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">About This Event</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedInsight.description}
                  </p>
                </div>

                {/* Topics Covered */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Topics Covered</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInsight.topics.map((topic, idx) => (
                      <span 
                        key={idx}
                        className={`px-4 py-2 bg-gradient-to-r ${selectedInsight.color} text-white text-sm font-semibold rounded-lg`}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className={`flex-1 px-6 py-4 bg-gradient-to-r ${selectedInsight.color} text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 group`}>
                    Register Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors">
                    Add to Calendar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscribe Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 relative overflow-hidden rounded-2xl"
      >
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-6">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Stay Ahead of Industry Trends</h3>
            <p className="text-white/90 text-lg mb-8">
              Subscribe to receive weekly insights, expert interviews, and sector updates directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-4 bg-white/95 backdrop-blur-md border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-white shadow-lg text-gray-900 placeholder-gray-500"
              />
              <button className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-2 group">
                Subscribe
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="text-white/70 text-sm mt-4">Join 5,000+ professionals already subscribed</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Community;
