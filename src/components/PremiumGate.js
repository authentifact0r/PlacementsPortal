/**
 * PremiumGate — Feature access gate
 * ────────────────────────────────────
 * Wraps any feature/component and shows an upgrade prompt
 * if the user doesn't have the required premium feature.
 *
 * Usage:
 *   <PremiumGate featureKey="cvReview" product={PRODUCTS.cvReview}>
 *     <CVReviewForm />
 *   </PremiumGate>
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature } from '../services/stripe.service';
import CheckoutModal from './CheckoutModal';

export default function PremiumGate({ featureKey, product, children, compact = false }) {
  const { userProfile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const unlocked = justUnlocked || hasFeature(userProfile, featureKey);

  if (unlocked) return children;

  if (compact) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${
            product?.gradient || 'from-violet-600 to-purple-700'
          } text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all`}
        >
          <Lock className="w-3.5 h-3.5" />
          Unlock {product?.name}
          <span className="font-bold">{product?.price}</span>
        </motion.button>
        {showModal && (
          <CheckoutModal
            product={product}
            onClose={() => setShowModal(false)}
            onSuccess={() => { setShowModal(false); setJustUnlocked(true); }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden">
        {/* Blurred preview */}
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>

        {/* Gate overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
              product?.gradient || 'from-violet-600 to-purple-700'
            } flex items-center justify-center mb-3 shadow-lg`}
          >
            <Lock className="w-6 h-6 text-white" />
          </motion.div>
          <h3 className="font-bold text-gray-900 text-base mb-1 text-center">
            {product?.name || 'Premium Feature'}
          </h3>
          <p className="text-gray-500 text-sm text-center mb-4 max-w-xs">
            {product?.description || 'Upgrade to unlock this feature.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r ${
              product?.gradient || 'from-violet-600 to-purple-700'
            } text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm`}
          >
            <Zap className="w-4 h-4" />
            Unlock for {product?.price}
          </motion.button>
        </div>
      </div>

      {showModal && (
        <CheckoutModal
          product={product}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); setJustUnlocked(true); }}
        />
      )}
    </>
  );
}
