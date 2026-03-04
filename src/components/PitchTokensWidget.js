/**
 * PitchTokensWidget — token balance + top-up for VideoPitchStudio
 * Shows the user's current pitch token balance with a progress indicator.
 * The "Top Up" button opens a CheckoutModal for purchasing more tokens.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Zap, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CheckoutModal from './CheckoutModal';
import { useNavigate } from 'react-router-dom';

// Token pack products (must match stripe.service PRODUCTS)
const TOKEN_PACKS = [
  {
    key: 'pitchTokens50',
    label: '50 Tokens',
    price: '£2.99',
    tokens: 50,
    priceId: process.env.REACT_APP_STRIPE_PRICE_PITCH_50,
    popular: false
  },
  {
    key: 'pitchTokens200',
    label: '200 Tokens',
    price: '£9.99',
    tokens: 200,
    priceId: process.env.REACT_APP_STRIPE_PRICE_PITCH_200,
    popular: true
  }
];

const PitchTokensWidget = ({ compact = false }) => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [checkoutPack, setCheckoutPack] = useState(null);

  // Read token balance from userProfile
  const tokenBalance = userProfile?.premium?.pitchTokens?.tokens ?? 0;
  const MAX_DISPLAY = 200;
  const pct = Math.min((tokenBalance / MAX_DISPLAY) * 100, 100);

  // Colour based on balance
  const barColor = tokenBalance === 0
    ? 'bg-gray-300'
    : tokenBalance < 10
      ? 'bg-red-500'
      : tokenBalance < 50
        ? 'bg-amber-500'
        : 'bg-violet-500';

  const handleTopUp = (pack) => {
    if (!currentUser) {
      navigate('/register');
      return;
    }
    setCheckoutPack(pack);
  };

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-xl">
          <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-800">Pitch Tokens</span>
              <span className="text-sm font-bold text-violet-700">{tokenBalance}</span>
            </div>
            <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${barColor}`}
              />
            </div>
          </div>
          <button
            onClick={() => handleTopUp(TOKEN_PACKS[0])}
            className="flex-shrink-0 w-8 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center justify-center transition-colors"
            title="Top up tokens"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {checkoutPack && (
          <CheckoutModal
            isOpen={!!checkoutPack}
            onClose={() => setCheckoutPack(null)}
            product={{
              name: `${checkoutPack.label} — Pitch Tokens`,
              description: `Add ${checkoutPack.tokens} pitch tokens to your balance.`,
              price: checkoutPack.price,
              gradient: 'from-violet-600 to-purple-700',
              priceId: checkoutPack.priceId,
              mode: 'payment'
            }}
            onSuccess={() => setCheckoutPack(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Pitch Tokens</h3>
                <p className="text-violet-200 text-sm">Power your Elevated Pitch pitches</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{tokenBalance}</div>
              <div className="text-violet-200 text-xs mt-0.5">tokens remaining</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-violet-200 mb-1.5">
              <span>Balance</span>
              <span>{tokenBalance} / {MAX_DISPLAY}+</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {tokenBalance === 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">You're out of tokens</p>
                <p className="text-xs text-amber-700 mt-0.5">Top up to generate AI pitch scripts and use the teleprompter recorder.</p>
              </div>
            </div>
          )}

          {tokenBalance > 0 && tokenBalance < 10 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
              <Zap className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Running low</p>
                <p className="text-xs text-red-600 mt-0.5">Top up now to keep creating pitches without interruption.</p>
              </div>
            </div>
          )}

          {/* How tokens are used */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Token Usage</p>
            <div className="space-y-2">
              {[
                { action: 'Generate AI pitch script', cost: 5 },
                { action: 'Use teleprompter recorder', cost: 2 },
                { action: 'Share public pitch page', cost: 1 }
              ].map(({ action, cost }) => (
                <div key={action} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{action}</span>
                  <span className="font-semibold text-violet-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />{cost}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Token packs */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Up</p>
          <div className="grid grid-cols-2 gap-3">
            {TOKEN_PACKS.map((pack) => (
              <motion.button
                key={pack.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTopUp(pack)}
                className={`relative p-4 rounded-xl border-2 text-left transition-colors ${
                  pack.popular
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-violet-300'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-violet-600 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    Best Value
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="font-bold text-gray-900">{pack.tokens}</span>
                  <span className="text-gray-500 text-xs">tokens</span>
                </div>
                <div className="text-xl font-bold text-violet-700">{pack.price}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {(parseFloat(pack.price.replace('£', '')) / pack.tokens * 100).toFixed(1)}p per token
                </div>
              </motion.button>
            ))}
          </div>

          {!currentUser && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              <Lock className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <span>Sign in to purchase tokens</span>
            </div>
          )}
        </div>
      </div>

      {checkoutPack && (
        <CheckoutModal
          isOpen={!!checkoutPack}
          onClose={() => setCheckoutPack(null)}
          product={{
            name: `${checkoutPack.label} — Pitch Tokens`,
            description: `Add ${checkoutPack.tokens} pitch tokens to your account balance.`,
            price: checkoutPack.price,
            gradient: 'from-violet-600 to-purple-700',
            priceId: checkoutPack.priceId,
            mode: 'payment'
          }}
          onSuccess={() => setCheckoutPack(null)}
        />
      )}
    </>
  );
};

export default PitchTokensWidget;
