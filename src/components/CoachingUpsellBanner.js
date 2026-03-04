/**
 * Coaching Upsell Banner Component
 * Promotes 1:1 coaching upgrade for CV specialists
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Sparkles } from 'lucide-react';
import CoachingBookingModal from './CoachingBookingModal';

const CoachingUpsellBanner = () => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const cvSpecialistSession = {
    id: 'cv-specialist',
    type: 'cv-specialist',
    name: 'CV Specialist Coaching',
    duration: '60 minutes',
    price: '£45',
    description: 'One-on-one CV review with expert career coaches. Get personalized feedback and strategic advice.',
    features: [
      'In-depth CV review and feedback',
      'Industry-specific optimization',
      'Interview preparation tips',
      'Personal branding guidance'
    ]
  };

  const handleBookCoaching = () => {
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    console.log('CV coaching session booked');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 overflow-hidden"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Icon & Badge */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  Level Up
                </span>
              </div>

              {/* Content */}
              <h4 className="text-xl font-bold text-white mb-2">
                Need More Help?
              </h4>
              <p className="text-teal-50 text-sm mb-4 leading-relaxed">
                Book a 1:1 session with our CV specialist coaches. Get personalized feedback 
                and industry-specific advice to maximize your job search success.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['Expert Review', 'Industry Insights', 'Interview Prep', 'Personal Branding'].map((feature, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Price & CTA */}
              <div className="flex items-center gap-3">
                <div className="text-white">
                  <span className="text-2xl font-bold">£45</span>
                  <span className="text-teal-100 text-sm ml-2">per session</span>
                </div>
                <button
                  onClick={handleBookCoaching}
                  className="px-6 py-2.5 bg-white text-teal-700 font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  Book CV Coach
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sparkle Icon (Desktop Only) */}
            <div className="hidden md:block">
              <Sparkles className="w-16 h-16 text-white/30" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Coaching Booking Modal */}
      <CoachingBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        session={cvSpecialistSession}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
};

export default CoachingUpsellBanner;
