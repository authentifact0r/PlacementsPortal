import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe,
  GraduationCap,
  IdCard,
  Plane,
  Home,
  DollarSign,
  Award,
  ArrowRight,
  CheckCircle2,
  Users,
  MessageSquare,
  Book,
  Calendar,
  Shield
} from 'lucide-react';

const GlobalStudents = () => {
  const [activeService, setActiveService] = useState(null);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop"
            alt="International students"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0f172a]/95 to-[#0f172a]" />
        </div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-semibold mb-6">
              <Globe className="w-4 h-4" />
              Global Student Hub
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Your Journey to Study Abroad <span className="text-gradient">Starts Here</span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto">
              Comprehensive support for international students - from university applications 
              to accommodation, scholarships, immigration advice, and everything in between.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a 
                href="#services" 
                className="btn-primary inline-flex items-center gap-2"
              >
                Explore Services
                <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#contact" 
                className="btn-secondary inline-flex items-center gap-2"
              >
                Get Started
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 border-y border-slate-800/50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50+', label: 'Partner Universities' },
              { value: '2,000+', label: 'Students Placed' },
              { value: '30+', label: 'Countries Covered' },
              { value: '95%', label: 'Success Rate' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-teal-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 lg:py-32">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              Comprehensive Support Services
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Everything you need to make your study abroad journey seamless and successful
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard 
                key={index} 
                service={service} 
                index={index}
                isActive={activeService === index}
                onClick={() => setActiveService(activeService === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Study Guide Abroad - Detailed Section */}
      <StudyGuideSection />

      {/* Immigration Support */}
      <ImmigrationSection />

      {/* Accommodation & Living */}
      <AccommodationSection />

      {/* Financial Support */}
      <FinancialSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

/* Service Card Component */
const ServiceCard = ({ service, index, isActive, onClick }) => {
  const Icon = service.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-teal-500/50 transition-all h-full">
        {/* Service Image */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          
          {/* Icon Badge */}
          <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-teal-500/50">
            <Icon className="w-6 h-6 text-teal-400" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-teal-400 transition-colors">
            {service.title}
          </h3>
          
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">
            {service.description}
          </p>

          {/* Features List */}
          <ul className="space-y-2 mb-4">
            {service.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <button className="text-teal-400 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
            Learn More
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* Study Guide Section */
const StudyGuideSection = () => {
  return (
    <section className="py-24 bg-slate-800/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop"
                alt="Study guide"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Book className="w-6 h-6 text-teal-500" />
              </div>
              <h2 className="text-3xl font-bold">Study Abroad Guide</h2>
            </div>

            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Navigate the complex journey of studying abroad with our comprehensive guides 
              covering everything from choosing the right destination to cultural adaptation.
            </p>

            <div className="space-y-4">
              {[
                'Country comparison & university rankings',
                'Course selection & career pathways',
                'Application timeline & deadlines',
                'Visa requirements by country',
                'Cultural adaptation resources',
                'Pre-departure checklists'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  </div>
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>

            <button className="mt-8 btn-primary inline-flex items-center gap-2">
              Download Free Guide
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* Immigration Section */
const ImmigrationSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Immigration & Visa Support
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Expert guidance through every step of the visa application process
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: IdCard,
              title: 'Visa Applications',
              description: 'Step-by-step assistance with student visa applications for all major destinations',
              color: 'teal'
            },
            {
              icon: Shield,
              title: 'Legal Compliance',
              description: 'Stay compliant with immigration laws and maintain your student status',
              color: 'purple'
            },
            {
              icon: MessageSquare,
              title: 'Expert Consultations',
              description: 'One-on-one sessions with certified immigration advisors',
              color: 'orange'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-teal-500/50 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 text-${item.color}-500`} />
                </div>
                
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* Accommodation Section */
const AccommodationSection = () => {
  return (
    <section className="py-24 bg-slate-800/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Home className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-3xl font-bold">Accommodation & Housing</h2>
            </div>

            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Find safe, affordable, and convenient housing near your university with our 
              trusted accommodation partners worldwide.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Student Halls', icon: Users },
                { label: 'Private Apartments', icon: Home },
                { label: 'Homestays', icon: Users },
                { label: 'Short-term Rentals', icon: Calendar }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <button className="btn-primary inline-flex items-center gap-2">
              Browse Accommodation
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Right: Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative h-[500px] rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop"
                alt="Student accommodation"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* Financial Section */
const FinancialSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Financial Support & Scholarships
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Make your education affordable with scholarships, financial planning, and money management advice
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Scholarships */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden group hover:border-teal-500/50 transition-all"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop"
                alt="Scholarships"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              
              <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-teal-500/50">
                <Award className="w-6 h-6 text-teal-400" />
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold mb-4">Scholarship Database</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Access thousands of scholarships, grants, and funding opportunities 
                specifically for international students.
              </p>
              
              <ul className="space-y-3 mb-6">
                {[
                  'Merit-based scholarships',
                  'Need-based financial aid',
                  'Country-specific grants',
                  'University funding programs'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <button className="text-teal-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Search Scholarships
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Money Advice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-all"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop"
                alt="Financial advice"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              
              <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-purple-500/20 backdrop-blur-md flex items-center justify-center border border-purple-500/50">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold mb-4">Money Management</h3>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Expert financial advice to help you budget, save, and manage your money 
                effectively while studying abroad.
              </p>
              
              <ul className="space-y-3 mb-6">
                {[
                  'Budgeting & expense tracking',
                  'Banking for international students',
                  'Part-time work regulations',
                  'Tax & financial planning'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>

              <button className="text-purple-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                Get Financial Advice
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* CTA Section */
const CTASection = () => {
  return (
    <section id="contact" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 via-[#0f172a] to-purple-900/20" />
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Your Study Abroad Journey?
          </h2>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Book a free consultation with our international student advisors today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary inline-flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Book Free Consultation
            </button>
            <button className="btn-secondary inline-flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat with Advisor
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Free consultation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Expert advisors</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>24/7 support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

/* Services Data */
const services = [
  {
    icon: Book,
    title: 'Study Abroad Guide',
    description: 'Comprehensive guides and resources to help you choose the right destination and program',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop',
    features: [
      'Country comparison & rankings',
      'Program selection guidance',
      'Cultural adaptation resources'
    ]
  },
  {
    icon: GraduationCap,
    title: 'University Applications',
    description: 'End-to-end support for university applications, from document preparation to submission',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop',
    features: [
      'Application strategy & timeline',
      'Personal statement review',
      'Document verification'
    ]
  },
  {
    icon: IdCard,
    title: 'Immigration Advice',
    description: 'Expert visa guidance and immigration support from certified advisors',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&auto=format&fit=crop',
    features: [
      'Visa application assistance',
      'Legal compliance support',
      'One-on-one consultations'
    ]
  },
  {
    icon: Plane,
    title: 'Travel Consultancy',
    description: 'Travel planning, booking assistance, and pre-departure support',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&auto=format&fit=crop',
    features: [
      'Flight booking assistance',
      'Travel insurance guidance',
      'Pre-departure checklists'
    ]
  },
  {
    icon: Home,
    title: 'Accommodation Rental',
    description: 'Find safe and affordable housing near your university with verified partners',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop',
    features: [
      'Student halls & apartments',
      'Homestay arrangements',
      'Short-term housing'
    ]
  },
  {
    icon: DollarSign,
    title: 'Money Advice',
    description: 'Financial planning, budgeting tips, and banking guidance for international students',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
    features: [
      'Budget planning tools',
      'International banking setup',
      'Part-time work guidance'
    ]
  },
  {
    icon: Award,
    title: 'Scholarship Database',
    description: 'Access thousands of scholarships and funding opportunities for international students',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop',
    features: [
      'Merit-based scholarships',
      'Need-based financial aid',
      'Country-specific grants'
    ]
  },
  {
    icon: Users,
    title: 'Student Support Network',
    description: 'Connect with other international students and access peer support resources',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop',
    features: [
      'Student community forums',
      'Mentorship programs',
      'Cultural events & meetups'
    ]
  }
];

export default GlobalStudents;
