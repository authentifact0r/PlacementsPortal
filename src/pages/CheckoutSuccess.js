/**
 * CheckoutSuccess — post-Stripe-payment landing page
 * ────────────────────────────────────────────────────
 * Stripe redirects here after a successful Checkout session.
 * Polls Firestore for up to 10 s waiting for the webhook to update
 * the user's premium flags, then shows a contextual confirmation.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader, ArrowRight, Sparkles } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

// Map premium feature keys → human copy
const FEATURE_COPY = {
  cvReview:        { title: 'CV Optimisation', desc: 'Head back to your dashboard to upload your CV and run your first AI review.', cta: 'Go to CV Review',  path: '/dashboard/student' },
  coaching:        { title: 'Career Coaching', desc: 'Browse available coaches and book your first 1-to-1 session.',               cta: 'Book a Session',   path: '/dashboard/student' },
  aiApplier:       { title: 'AI Auto-Applier', desc: 'Set your preferences and let the AI start applying to matched roles.',       cta: 'Set Up AI Applier',path: '/dashboard/student' },
  pitchTokens:     { title: 'Pitch Tokens',    desc: 'Your tokens have been added. Head to the Pitch Studio to use them.',         cta: 'Open Pitch Studio', path: '/studio'           },
  studentPremium:  { title: 'Student Premium', desc: 'All premium features are now active on your account.',                       cta: 'Go to Dashboard',  path: '/dashboard'        },
  employerPremium: { title: 'Employer Premium',desc: 'Top-ranked profiles and AI matching are now unlocked for your account.',     cta: 'Go to Dashboard',  path: '/dashboard'        },
};

export default function CheckoutSuccess() {
  // eslint-disable-next-line no-unused-vars
  const [searchParams]       = useSearchParams();
  const { currentUser } = useAuth();
  const navigate             = useNavigate();
  const [status, setStatus]  = useState('waiting'); // 'waiting' | 'confirmed' | 'timeout'
  const [feature, setFeature]= useState(null);

  // Watch Firestore for the premium flag to be set by the webhook
  useEffect(() => {
    if (!currentUser) return;

    let timer;
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      const premium = snap.data()?.premium || {};
      const activeKey = Object.entries(premium).find(([, v]) => v?.active)?.[0];
      if (activeKey) {
        setFeature(FEATURE_COPY[activeKey] || FEATURE_COPY.studentPremium);
        setStatus('confirmed');
        clearTimeout(timer);
        unsub();
      }
    });

    // Timeout after 12 s — webhook may be delayed
    timer = setTimeout(() => {
      setStatus('timeout');
      unsub();
    }, 12000);

    return () => { clearTimeout(timer); unsub(); };
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center"
      >
        {status === 'waiting' && (
          <>
            <Loader className="w-14 h-14 text-purple-500 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your payment…</h1>
            <p className="text-gray-500 text-sm">Hang tight — we're activating your features.</p>
          </>
        )}

        {status === 'confirmed' && feature && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Payment successful
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{feature.title} is active!</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">{feature.desc}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(feature.path)}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {feature.cta} <ArrowRight className="w-4 h-4" />
            </motion.button>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment received!</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Your payment was successful. It may take a moment for your features to activate — please refresh your dashboard in a few seconds.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl"
            >
              Go to Dashboard
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
