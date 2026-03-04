/**
 * CheckoutModal — Embedded Stripe Elements Payment Sheet
 * ───────────────────────────────────────────────────────
 * Shows a modal with the Stripe Payment Element so users
 * never leave the site to pay.
 *
 * Usage:
 *   <CheckoutModal
 *     product={PRODUCTS.cvReview}
 *     onClose={() => setOpen(false)}
 *     onSuccess={() => { setOpen(false); showSuccessToast(); }}
 *   />
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CheckCircle2, Loader, CreditCard, Shield } from 'lucide-react';
import { getStripe, createPaymentIntent } from '../services/stripe.service';

// ── Inner form that lives inside <Elements> context ──────────────────────────
const PaymentForm = ({ product, onSuccess, onClose }) => {
  const stripe   = useStripe();
  const elements = useElements();
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => onSuccess?.(), 1500);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Payment successful!</h3>
        <p className="text-sm text-gray-500">{product.name} is now active on your account.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 border border-red-100">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
      >
        {loading
          ? <Loader className="w-4 h-4 animate-spin" />
          : <CreditCard className="w-4 h-4" />
        }
        {loading ? 'Processing…' : `Pay ${product.price}`}
      </button>
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        Payments secured by Stripe — your card details are never stored by us
      </div>
    </form>
  );
};

// ── Main modal wrapper ────────────────────────────────────────────────────────
export default function CheckoutModal({ product, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loadError,    setLoadError]    = useState(null);
  const stripePromise = getStripe();

  useEffect(() => {
    if (!product?.priceId) return;
    createPaymentIntent({ priceId: product.priceId })
      .then(setClientSecret)
      .catch(err => setLoadError(err.message || 'Could not initialise checkout'));
  }, [product]);

  const appearance = {
    theme:     'stripe',
    variables: { colorPrimary: '#7c3aed', borderRadius: '10px', fontFamily: 'inherit' }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${product?.gradient || 'from-violet-600 to-purple-700'} px-6 py-5 flex items-start justify-between`}>
            <div>
              <div className="text-xs text-white/70 font-medium mb-0.5">Complete purchase</div>
              <h2 className="text-lg font-bold text-white">{product?.name}</h2>
              <div className="text-2xl font-bold text-white mt-1">{product?.price}</div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {loadError ? (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 text-center">
                {loadError}
              </div>
            ) : !clientSecret ? (
              <div className="flex items-center justify-center py-10">
                <Loader className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance }}
              >
                <PaymentForm product={product} onSuccess={onSuccess} onClose={onClose} />
              </Elements>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
