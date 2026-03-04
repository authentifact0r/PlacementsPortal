/**
 * PlacementPortal — Stripe Frontend Service
 * ──────────────────────────────────────────
 * Wraps calls to Firebase Cloud Functions for all payment operations.
 * The publishable key is the ONLY Stripe key that lives in the browser.
 */

import { loadStripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// ── Stripe publishable key (safe to expose in browser) ───────────────────────
let stripePromise = null;
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn('Stripe publishable key not set — add REACT_APP_STRIPE_PUBLISHABLE_KEY to .env');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// ── Product catalogue (mirrors functions/index.js) ───────────────────────────
// Set these Price IDs from your Stripe dashboard → Products
export const STRIPE_PRICES = {
  // ── Employer ──────────────────────────────────────────────────────────────
  employer_premium_monthly: process.env.REACT_APP_STRIPE_PRICE_EMPLOYER_MONTHLY  || '',
  employer_premium_annual:  process.env.REACT_APP_STRIPE_PRICE_EMPLOYER_ANNUAL   || '',

  // ── Talent Engine (B2B) ────────────────────────────────────────────────────
  talent_pipeline_retainer: process.env.REACT_APP_STRIPE_PRICE_PIPELINE_RETAINER || '',
  talent_per_hire:          process.env.REACT_APP_STRIPE_PRICE_PER_HIRE          || '',
  talent_per_lead:          process.env.REACT_APP_STRIPE_PRICE_PER_LEAD          || '',

  // ── Student ───────────────────────────────────────────────────────────────
  student_premium_monthly:  process.env.REACT_APP_STRIPE_PRICE_STUDENT_MONTHLY   || '',
  student_cv_review:        process.env.REACT_APP_STRIPE_PRICE_CV_REVIEW         || '',
  student_coaching_session: process.env.REACT_APP_STRIPE_PRICE_COACHING          || '',
  student_ai_applier:       process.env.REACT_APP_STRIPE_PRICE_AI_APPLIER        || '',
  student_pitch_tokens_50:  process.env.REACT_APP_STRIPE_PRICE_PITCH_50          || '',
  student_pitch_tokens_200: process.env.REACT_APP_STRIPE_PRICE_PITCH_200         || '',
};

// ── Human-readable product info ───────────────────────────────────────────────
export const PRODUCTS = {
  // Employer
  employerPremium: {
    key:         'employerPremium',
    name:        'Employer Premium',
    description: 'Access top-ranked student profiles & advanced analytics',
    price:       '£49/month',
    annualPrice: '£490/year (2 months free)',
    priceId:     STRIPE_PRICES.employer_premium_monthly,
    annualPriceId: STRIPE_PRICES.employer_premium_annual,
    mode:        'subscription',
    features:    [
      'Full access to top-ranked student profiles',
      'AI-matched candidates for your roles',
      'Priority job listing placement',
      'Recruitment analytics dashboard',
      'Direct messaging with candidates',
      'Video pitch access for all applicants',
    ],
    color:       'sky',
    gradient:    'from-sky-500 to-blue-600',
  },

  // Student — individual
  cvReview: {
    key:         'cvReview',
    name:        'CV Optimisation',
    description: 'One-time AI-powered CV review & rewrite suggestions',
    price:       '£4.99',
    priceId:     STRIPE_PRICES.student_cv_review,
    mode:        'payment',
    features:    [
      'Full AI analysis of your CV',
      'Industry-specific keyword suggestions',
      'Formatting & readability score',
      'ATS compatibility check',
      'Rewrite suggestions for each section',
    ],
    color:       'amber',
    gradient:    'from-amber-400 to-orange-500',
  },

  coaching: {
    key:         'coaching',
    name:        'Career Coaching Session',
    description: '1-to-1 session with a certified career coach',
    price:       '£29.99/session',
    priceId:     STRIPE_PRICES.student_coaching_session,
    mode:        'payment',
    features:    [
      '60-minute 1-to-1 video call',
      'CV & portfolio review',
      'Interview preparation',
      'Personalised career roadmap',
      'Follow-up notes & resources',
    ],
    color:       'green',
    gradient:    'from-emerald-500 to-teal-600',
  },

  aiApplier: {
    key:         'aiApplier',
    name:        'AI Auto-Applier',
    description: 'Let AI apply to matched jobs on your behalf',
    price:       '£7.99/month',
    priceId:     STRIPE_PRICES.student_ai_applier,
    mode:        'subscription',
    features:    [
      'Auto-apply to up to 30 matched jobs/month',
      'Personalised cover letters per role',
      'Smart job matching algorithm',
      'Application tracker & status updates',
      'Pause or cancel anytime',
    ],
    color:       'violet',
    gradient:    'from-violet-500 to-purple-600',
  },

  pitchTokens50: {
    key:         'pitchTokens',
    name:        '50 Pitch Tokens',
    description: 'Extra tokens for your Elevated Video Pitch',
    price:       '£2.99',
    tokens:      50,
    priceId:     STRIPE_PRICES.student_pitch_tokens_50,
    mode:        'payment',
    features:    [
      '50 extra pitch generation tokens',
      'AI-enhanced pitch scripts',
      'Teleprompter-ready formatting',
      'Never expire',
    ],
    color:       'pink',
    gradient:    'from-pink-500 to-rose-600',
  },

  pitchTokens200: {
    key:         'pitchTokens',
    name:        '200 Pitch Tokens',
    description: 'Best value — extra tokens for power users',
    price:       '£9.99',
    tokens:      200,
    priceId:     STRIPE_PRICES.student_pitch_tokens_200,
    mode:        'payment',
    badge:       'Best Value',
    features:    [
      '200 extra pitch generation tokens',
      'AI-enhanced pitch scripts',
      'Teleprompter-ready formatting',
      'Never expire',
      'Priority pitch rendering',
    ],
    color:       'pink',
    gradient:    'from-pink-500 to-rose-600',
  },

  // ── Talent Engine Products (B2B) ──
  talentPipelineRetainer: {
    key:         'talentPipelineRetainer',
    name:        'Talent Pipeline Retainer',
    description: 'Dedicated AI talent pipeline with ongoing candidate matching',
    price:       '£1,500/month',
    priceId:     STRIPE_PRICES.talent_pipeline_retainer,
    mode:        'subscription',
    badge:       'Enterprise',
    features:    [
      'Dedicated AI talent pipeline',
      'Unlimited candidate matching',
      'Automated outreach sequences',
      'Priority candidate screening',
      'Weekly pipeline reports',
      'Dedicated account manager',
    ],
    color:       'indigo',
    gradient:    'from-indigo-600 to-purple-700',
  },

  talentPerHire: {
    key:         'talentPerHire',
    name:        'Pay Per Hire',
    description: 'Pay only when we place a candidate — zero risk',
    price:       '£750/hire',
    priceId:     STRIPE_PRICES.talent_per_hire,
    mode:        'payment',
    features:    [
      'AI-screened candidates',
      'Skills-matched to your requirements',
      'No upfront cost',
      'Pay only on successful hire',
      'Replacement guarantee (60 days)',
    ],
    color:       'emerald',
    gradient:    'from-emerald-500 to-green-600',
  },

  talentPerLead: {
    key:         'talentPerLead',
    name:        'Pay Per Lead',
    description: 'Pre-qualified candidate profiles delivered to your inbox',
    price:       '£200/lead',
    priceId:     STRIPE_PRICES.talent_per_lead,
    mode:        'payment',
    features:    [
      'Pre-screened candidate profiles',
      'Skills & experience verified',
      'Match score & breakdown included',
      'Contact details provided',
      'Minimum 70% match score',
    ],
    color:       'cyan',
    gradient:    'from-cyan-500 to-blue-600',
  },

  // Student bundle
  studentPremium: {
    key:         'studentPremium',
    name:        'Student Premium',
    description: 'All student features in one bundle',
    price:       '£9.99/month',
    priceId:     STRIPE_PRICES.student_premium_monthly,
    mode:        'subscription',
    badge:       'Best Value',
    features:    [
      'Unlimited CV optimisations',
      'AI Auto-Applier (30 jobs/month)',
      '100 Pitch Tokens/month',
      '20% off coaching sessions',
      'Priority support',
      'Early access to new features',
    ],
    color:       'purple',
    gradient:    'from-violet-600 to-purple-700',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// createCheckoutSession — redirects to Stripe Checkout page
// ─────────────────────────────────────────────────────────────────────────────
export const createCheckoutSession = async ({ priceId, mode }) => {
  const fn = httpsCallable(functions, 'createCheckoutSession');
  const result = await fn({
    priceId,
    mode,
    origin: window.location.origin,
  });
  const stripe = await getStripe();
  if (stripe && result.data.sessionId) {
    await stripe.redirectToCheckout({ sessionId: result.data.sessionId });
  } else if (result.data.url) {
    window.location.href = result.data.url;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// createPaymentIntent — for embedded Stripe Elements
// ─────────────────────────────────────────────────────────────────────────────
export const createPaymentIntent = async ({ priceId }) => {
  const fn = httpsCallable(functions, 'createPaymentIntent');
  const result = await fn({ priceId });
  return result.data.clientSecret;
};

// ─────────────────────────────────────────────────────────────────────────────
// hasFeature — check if a user's Firestore profile has a premium feature active
// ─────────────────────────────────────────────────────────────────────────────
export const hasFeature = (userProfile, featureKey) => {
  if (!userProfile?.premium) return false;
  const feature = userProfile.premium[featureKey];
  if (!feature) return false;
  if (!feature.active) return false;
  // Check subscription hasn't expired
  if (feature.currentPeriodEnd) {
    const expiry = feature.currentPeriodEnd.toDate
      ? feature.currentPeriodEnd.toDate()
      : new Date(feature.currentPeriodEnd);
    if (expiry < new Date()) return false;
  }
  return true;
};

const stripeService = { getStripe, createCheckoutSession, createPaymentIntent, hasFeature, PRODUCTS, STRIPE_PRICES };
export default stripeService;
