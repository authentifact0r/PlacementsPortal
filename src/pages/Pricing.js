/**
 * PlacementPortal — Pricing Page (Role-Aware)
 * ─────────────────────────────────────────────
 * Logged-in employers  → see ONLY the Employer upgrade section
 * Logged-in students/graduates → see ONLY the Student upgrade section
 * Guests / unauthenticated → see both with a toggle to explore
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, X, Zap, Star, Briefcase,
  Video, FileText, BookOpen, Bot, Coins,
  ArrowRight, Shield, CreditCard, RefreshCw,
  TrendingUp, MessageSquare, Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PRODUCTS, createCheckoutSession, hasFeature } from '../services/stripe.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CardMotion = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, type: 'spring', stiffness: 100 }}
    className={className}
  >
    {children}
  </motion.div>
);

const Feature = ({ text, included = true }) => (
  <li className="flex items-start gap-2.5 text-sm">
    {included
      ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
      : <X className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />}
    <span className={included ? 'text-gray-700' : 'text-gray-400'}>{text}</span>
  </li>
);

const BuyButton = ({ product, label, className, onBuy }) => {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try { await onBuy(product); } finally { setLoading(false); }
  };
  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      onClick={handleClick}
      disabled={loading}
      className={`w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-70 cursor-wait' : ''} ${className}`}
    >
      {loading
        ? <RefreshCw className="w-4 h-4 animate-spin" />
        : <><CreditCard className="w-4 h-4" />{label}</>}
    </motion.button>
  );
};

const TrustBadges = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12">
    {[
      { icon: Shield,    title: 'Secure payments',        desc: 'All transactions processed by Stripe. Your card details never touch our servers.' },
      { icon: RefreshCw, title: 'Cancel anytime',         desc: 'Subscriptions can be cancelled from your account settings at any time.' },
      { icon: Star,      title: 'Satisfaction guarantee', desc: 'Not happy? Contact us within 7 days of purchase for a full refund.' },
    ].map(({ icon: Icon, title, desc }, i) => (
      <div key={i} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm mb-1">{title}</div>
          <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
        </div>
      </div>
    ))}
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// EMPLOYER PRICING SECTION
// ═════════════════════════════════════════════════════════════════════════════
function EmployerPricingSection({ onBuy, billingCycle, isOwned }) {
  return (
    <motion.div
      key="employer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {/* Current plan banner */}
      <CardMotion delay={0} className="mb-8">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-lg">Your current plan — Free</div>
              <div className="text-white/60 text-sm mt-0.5">Unlimited job postings · Applicant management · Basic profiles</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4" /> Active
          </div>
        </div>
      </CardMotion>

      {/* Upgrade plans */}
      <h2 className="text-xl font-bold text-gray-900 mb-5">Upgrade your hiring</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        {/* Free recap */}
        <CardMotion delay={0.05}>
          <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Free Forever</div>
                <div className="text-gray-500 text-sm">Everything to get started</div>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-6">
              £0 <span className="text-lg text-gray-400 font-normal">/ month</span>
            </div>
            <ul className="space-y-3 flex-1">
              {[
                { text: 'Unlimited job postings',                 included: true  },
                { text: 'Standard applicant management',          included: true  },
                { text: 'Basic applicant profiles',               included: true  },
                { text: 'Standard listing placement',             included: true  },
                { text: 'Access to top-ranked student profiles',  included: false },
                { text: 'AI-matched candidate recommendations',   included: false },
                { text: 'Video pitches for all applicants',       included: false },
                { text: 'Priority listing placement',             included: false },
                { text: 'Advanced recruitment analytics',         included: false },
                { text: 'Direct messaging with candidates',       included: false },
              ].map((f, i) => <Feature key={i} {...f} />)}
            </ul>
            <div className="mt-6 py-3 rounded-xl bg-gray-100 text-gray-500 text-center font-semibold text-sm">
              Your current plan
            </div>
          </div>
        </CardMotion>

        {/* Premium */}
        <CardMotion delay={0.1}>
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-8 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -mr-24 -mt-24 pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-200 text-xs font-bold px-2.5 py-1 rounded-full mb-1">
                    <Star className="w-3 h-3" /> PREMIUM
                  </div>
                  <div className="font-bold text-white text-xl">Employer Premium</div>
                </div>
              </div>

              <div className="text-4xl font-bold text-white mb-1">
                {billingCycle === 'annual' ? '£40.83' : '£49'}
                <span className="text-lg text-white/60 font-normal ml-1">/month</span>
              </div>
              {billingCycle === 'annual'
                ? <p className="text-green-300 text-sm font-medium mb-6">Billed £490/year — 2 months free</p>
                : <p className="text-white/60 text-sm mb-6">or £490/year &nbsp;<span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded">SAVE £98</span></p>
              }

              <ul className="space-y-2.5 flex-1">
                {PRODUCTS.employerPremium.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-3">
                {isOwned('employerPremium') ? (
                  <div className="w-full py-3 rounded-xl bg-white/20 text-white text-center font-semibold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Premium Active
                  </div>
                ) : (
                  <>
                    <BuyButton
                      product={PRODUCTS.employerPremium}
                      label="Upgrade — £49/month"
                      className="bg-white text-blue-700 hover:bg-blue-50"
                      onBuy={onBuy}
                    />
                    <BuyButton
                      product={{ ...PRODUCTS.employerPremium, priceId: PRODUCTS.employerPremium.annualPriceId || '' }}
                      label="Annual plan — £490/year (save £98)"
                      className="bg-white/15 hover:bg-white/25 text-white border border-white/30"
                      onBuy={onBuy}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </CardMotion>
      </div>

      {/* Feature comparison table */}
      <CardMotion delay={0.15} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">What you unlock with Premium</h3>
          <p className="text-sm text-gray-500 mt-0.5">See exactly what changes when you upgrade</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { feature: 'Job postings',              free: 'Unlimited',     premium: 'Unlimited + Priority placement' },
            { feature: 'Student profiles',           free: 'Basic info only', premium: 'Full top-ranked profiles + AI match score' },
            { feature: 'Video pitches',              free: '—',             premium: 'Full access for all applicants' },
            { feature: 'Candidate messaging',        free: '—',             premium: 'Direct in-platform messaging' },
            { feature: 'Recruitment analytics',      free: 'Basic counts',  premium: 'Advanced funnel & conversion insights' },
            { feature: 'AI candidate matching',      free: '—',             premium: 'Ranked suggestions per role' },
            { feature: 'Support',                    free: 'Email',         premium: 'Priority support + dedicated CSM' },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-3 px-6 py-3 text-sm">
              <span className="font-medium text-gray-700">{row.feature}</span>
              <span className="text-gray-400">{row.free}</span>
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                {row.premium !== '—' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                {row.premium}
              </span>
            </div>
          ))}
          <div className="grid grid-cols-3 px-6 py-2 bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wide">
            <span>Feature</span><span>Free</span><span className="text-blue-600">Premium</span>
          </div>
        </div>
      </CardMotion>

      {/* ROI nudge */}
      <CardMotion delay={0.2}>
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-6 flex gap-5">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-gray-900 mb-1">Why employers upgrade</div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Premium employers fill roles <span className="font-semibold text-blue-700">3× faster</span> on average.
              Access to top-ranked profiles and AI matching means you spend less time sifting and more time hiring.
            </p>
          </div>
        </div>
      </CardMotion>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT PRICING SECTION
// ═════════════════════════════════════════════════════════════════════════════
function StudentPricingSection({ onBuy, billingCycle, isOwned }) {
  return (
    <motion.div
      key="student"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {/* Free tier banner */}
      <CardMotion delay={0} className="mb-8">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-lg">Free — always</div>
              <div className="text-white/60 text-sm mt-0.5">Browse jobs · Apply · Build profile · Record one pitch</div>
            </div>
          </div>
          <ul className="flex flex-wrap gap-2">
            {['Browse & apply', 'Student profile', '1 video pitch', 'Community access'].map(f => (
              <li key={f} className="flex items-center gap-1.5 text-xs bg-white/10 rounded-full px-3 py-1.5 text-white/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </CardMotion>

      {/* Premium bundle highlight */}
      <CardMotion delay={0.05} className="mb-8">
        <div className="relative bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-white text-xs font-bold mb-4">
                <Zap className="w-3.5 h-3.5 text-yellow-300" /> BEST VALUE — ALL FEATURES INCLUDED
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Student Premium Bundle</h2>
              <p className="text-white/70 text-sm mb-4">Everything you need to land your first role, in one plan</p>
              <div className="text-4xl font-bold text-white mb-1">
                {billingCycle === 'annual' ? '£8.32' : '£9.99'}
                <span className="text-lg text-white/60 font-normal ml-1">/month</span>
              </div>
              {billingCycle === 'annual'
                ? <div className="text-green-300 text-sm font-medium">Billed £99.99/year — save £20</div>
                : <div className="text-white/50 text-sm">or £99.99/year (save £20)</div>}
            </div>
            <div className="lg:w-64 flex-shrink-0">
              <ul className="space-y-2 mb-5">
                {PRODUCTS.studentPremium.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {isOwned('studentPremium') ? (
                <div className="w-full py-3 rounded-xl bg-white/20 text-white text-center font-semibold text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Premium Active
                </div>
              ) : (
                <BuyButton
                  product={PRODUCTS.studentPremium}
                  label="Get Student Premium"
                  className="bg-white text-purple-700 hover:bg-purple-50"
                  onBuy={onBuy}
                />
              )}
            </div>
          </div>
        </div>
      </CardMotion>

      {/* Individual products */}
      <h3 className="text-lg font-bold text-gray-800 mb-5">Or pay only for what you need</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { product: PRODUCTS.cvReview,      icon: FileText,  featureKey: 'cvReview',  desc: 'One-time AI analysis of your CV with rewrite suggestions' },
          { product: PRODUCTS.coaching,      icon: BookOpen,  featureKey: 'coaching',  desc: '60-min 1-to-1 session with a certified career coach'      },
          { product: PRODUCTS.aiApplier,     icon: Bot,       featureKey: 'aiApplier', desc: 'Auto-apply to 30 matched roles/month with custom cover letters' },
          { product: PRODUCTS.pitchTokens200,icon: Video,     featureKey: 'pitchTokens',desc: '200 extra tokens for your Elevated Video Pitch studio'   },
        ].map(({ product, icon: Icon, featureKey, desc }, i) => (
          <CardMotion key={featureKey} delay={0.05 * (i + 1)}>
            <div className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all h-full flex flex-col ${
              isOwned(featureKey) ? 'border-green-200' : 'border-gray-100 hover:border-gray-200'
            }`}>
              <div className={`bg-gradient-to-br ${product.gradient} p-5 rounded-t-2xl`}>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {product.badge && (
                  <span className="inline-block bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                    {product.badge}
                  </span>
                )}
                <div className="font-bold text-white text-base">{product.name}</div>
                <div className="text-white/70 text-xs mt-0.5">{desc}</div>
                <div className="text-2xl font-bold text-white mt-2">{product.price}</div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <ul className="space-y-2 flex-1 mb-4">
                  {product.features.map((f, fi) => <Feature key={fi} text={f} />)}
                </ul>
                {isOwned(featureKey) ? (
                  <div className="w-full py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-center font-semibold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Active
                  </div>
                ) : (
                  <BuyButton
                    product={product}
                    label={`Get ${product.name}`}
                    className={`bg-gradient-to-r ${product.gradient} text-white hover:opacity-95`}
                    onBuy={onBuy}
                  />
                )}
              </div>
            </div>
          </CardMotion>
        ))}
      </div>

      {/* Pitch token packs */}
      <CardMotion delay={0.25} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <Coins className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Extra Pitch Tokens</h3>
            <p className="text-sm text-gray-500">Top up your Elevated Video Pitch credits — they never expire</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[PRODUCTS.pitchTokens50, PRODUCTS.pitchTokens200].map((p, i) => (
            <div key={i} className={`border-2 rounded-xl p-4 ${i === 1 ? 'border-pink-200 bg-pink-50' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="font-bold text-gray-900">{p.name}</div>
                {i === 1 && <span className="text-xs bg-pink-200 text-pink-700 font-bold px-2 py-0.5 rounded-full">Best value</span>}
              </div>
              <div className="text-2xl font-bold text-pink-600 mb-3">{p.price}</div>
              <BuyButton
                product={p}
                label={`Buy ${p.tokens} tokens`}
                className="bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:opacity-95"
                onBuy={onBuy}
              />
            </div>
          ))}
        </div>
      </CardMotion>

      {/* Coaching callout */}
      <CardMotion delay={0.3}>
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex gap-5">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="font-bold text-gray-900 mb-1">Not sure which plan is right for you?</div>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Book a free 15-minute consultation with one of our career advisors and we'll help you choose the best path.
            </p>
            <button
              onClick={() => window.location.href = '/community'}
              className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-sm hover:underline"
            >
              Book free consultation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardMotion>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Pricing() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const role = userProfile?.role;

  // Determine which view to show
  // Logged-in employers always see employer view; students/grads see student view.
  // Guests get a toggle.
  const isEmployer  = role === 'employer';
  const isStudent   = role === 'student' || role === 'graduate';
  const isGuest     = !currentUser || (!isEmployer && !isStudent);

  const [guestAudience,  setGuestAudience]  = useState('student');
  const [billingCycle,   setBillingCycle]   = useState('monthly');

  // Which section is actually showing
  const showEmployer = isEmployer || (isGuest && guestAudience === 'employer');
  const showStudent  = isStudent  || (isGuest && guestAudience === 'student');

  const isOwned = (featureKey) => hasFeature(userProfile, featureKey);

  const handleBuy = async (product) => {
    if (!currentUser) { navigate('/register'); return; }
    const priceId = billingCycle === 'annual' && product.annualPriceId
      ? product.annualPriceId
      : product.priceId;
    if (!priceId) { alert('This product is not yet configured — please contact support.'); return; }
    await createCheckoutSession({ priceId, mode: product.mode });
  };

  // ── Hero copy changes based on who's looking ──────────────────────────────
  const heroConfig = isEmployer
    ? { tag: '🏢 Employer Plans', headline: 'Find the talent you need, faster', sub: 'Post jobs free. Upgrade to unlock top-ranked student profiles.' }
    : isStudent
    ? { tag: '🎓 Student & Graduate Plans', headline: 'Invest in your career', sub: 'Free to apply. Upgrade for CV review, AI Applier, coaching, and more.' }
    : { tag: '✨ Simple pricing', headline: 'Invest in your career', sub: 'Job posting is always free. Upgrade only when you need more.' };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className={`pt-12 pb-24 text-center relative overflow-hidden ${
        isEmployer
          ? 'bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900'
          : 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900'
      }`}>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 8, repeat: Infinity }}
          className={`absolute top-10 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none ${
            isEmployer ? 'bg-sky-500' : 'bg-purple-500'
          }`}
        />
        <div className="max-w-3xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            {heroConfig.tag}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
          >
            {heroConfig.headline.split(' ').slice(0, -1).join(' ')}{' '}
            <span className={`bg-clip-text text-transparent ${
              isEmployer
                ? 'bg-gradient-to-r from-sky-400 to-blue-400'
                : 'bg-gradient-to-r from-violet-400 to-pink-400'
            }`}>
              {heroConfig.headline.split(' ').slice(-1)}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-white/60 text-lg mb-10"
          >
            {heroConfig.sub}
          </motion.p>

          {/* Guest toggle */}
          {isGuest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1 mb-8"
            >
              {[
                { key: 'student',  label: '🎓 Students & Graduates' },
                { key: 'employer', label: '🏢 Employers'            },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setGuestAudience(key)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    guestAudience === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Billing toggle for subscriptions */}
          {(isStudent || (isGuest && guestAudience === 'student')) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-4 text-sm text-white/70"
            >
              <span className={`transition-colors ${billingCycle === 'monthly' ? 'text-white font-semibold' : 'text-white/50'}`}>
                Monthly
              </span>

              {/* Toggle — checkbox peer pattern, no overflow bleed */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={billingCycle === 'annual'}
                  onChange={() => setBillingCycle(c => c === 'monthly' ? 'annual' : 'monthly')}
                />
                <div className="
                  w-12 h-6 rounded-full transition-colors duration-200
                  bg-white/20 peer-checked:bg-violet-500
                  after:content-[''] after:absolute after:top-[3px] after:left-[3px]
                  after:w-[18px] after:h-[18px] after:bg-white after:rounded-full after:shadow
                  after:transition-transform after:duration-200
                  peer-checked:after:translate-x-6
                " />
              </label>

              <span className={`transition-colors ${billingCycle === 'annual' ? 'text-white font-semibold' : 'text-white/50'}`}>
                Annual{' '}
                <span className="text-green-400 font-bold">(2 months free)</span>
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {showEmployer && (
            <EmployerPricingSection
              key="employer"
              onBuy={handleBuy}
              billingCycle={billingCycle}
              isOwned={isOwned}
            />
          )}
          {showStudent && (
            <StudentPricingSection
              key="student"
              onBuy={handleBuy}
              billingCycle={billingCycle}
              isOwned={isOwned}
            />
          )}
        </AnimatePresence>

        <TrustBadges />

        <div className="mt-10 text-center">
          <p className="text-gray-500 text-sm">
            Questions about pricing?{' '}
            <button
              onClick={() => navigate('/contact')}
              className="text-purple-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Get in touch <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
