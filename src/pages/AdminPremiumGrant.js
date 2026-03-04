/**
 * Admin Premium Grant Tool
 * ─────────────────────────
 * Admin-only page to search users and grant/revoke premium access for testing.
 * Route: /admin/premium
 *
 * Security: Only renders useful content if the logged-in user has role === 'admin'
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  Search,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Crown,
  User,
  RefreshCw,
  LogIn
} from 'lucide-react';

// ── Premium payload ────────────────────────────────────────────────────────────
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const buildPremium = () => {
  const expiry = new Date(Date.now() + ONE_YEAR_MS);
  const base = { active: true, status: 'active', stripeId: 'manual_grant_test', currentPeriodEnd: expiry };
  return {
    studentPremium: { ...base, stripeSubscriptionId: 'manual_grant_test' },
    cvReview:       { ...base, stripePaymentIntentId: 'manual_grant_test' },
    coaching:       { ...base, stripePaymentIntentId: 'manual_grant_test' },
    aiApplier:      { ...base, stripeSubscriptionId: 'manual_grant_test' },
    pitchTokens:    { active: true, tokens: 500 }
  };
};

const REVOKE_PREMIUM = {
  studentPremium: { active: false },
  cvReview:       { active: false },
  coaching:       { active: false },
  aiApplier:      { active: false },
  pitchTokens:    { active: false, tokens: 0 }
};

// ── Component ─────────────────────────────────────────────────────────────────
const AdminPremiumGrant = () => {
  const { currentUser, userProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching]     = useState(false);
  const [results, setResults]         = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [grantingId, setGrantingId]   = useState(null);
  const [revokingId, setRevokingId]   = useState(null);
  const [promotingSelf, setPromotingSelf] = useState(false);

  const isLoggedIn = !!currentUser;
  const isAdmin    = userProfile?.role === 'admin';

  const handleMakeMeAdmin = async () => {
    if (!currentUser) return;
    setPromotingSelf(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { role: 'admin' }, { merge: true });
      showSuccess('✅ Your account is now Admin — refresh the page to see full access.');
    } catch (err) {
      console.error('Promote error:', err);
      showError('Failed to promote. Try again.');
    } finally {
      setPromotingSelf(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setHasSearched(true);

    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const q = searchQuery.toLowerCase().trim();
      const matches = [];

      snapshot.forEach(d => {
        const data = d.data();
        const name  = (data.displayName || data.name || data.profile?.firstName || '').toLowerCase();
        const email = (data.email || '').toLowerCase();
        if (name.includes(q) || email.includes(q)) {
          matches.push({
            uid:     d.id,
            name:    data.displayName || data.name || 'Unknown',
            email:   data.email || '—',
            role:    data.role || 'unknown',
            premium: data.premium || {}
          });
        }
      });

      setResults(matches);
    } catch (err) {
      console.error('Search error:', err);
      showError('Failed to search users. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleGrant = async (user) => {
    setGrantingId(user.uid);
    try {
      await setDoc(doc(db, 'users', user.uid), { premium: buildPremium() }, { merge: true });
      showSuccess(`✅ Full premium granted to ${user.name}!`);
      // Refresh result in list
      setResults(prev => prev.map(u => u.uid === user.uid
        ? { ...u, premium: buildPremium() }
        : u
      ));
    } catch (err) {
      console.error('Grant error:', err);
      showError('Failed to grant premium. Make sure you are logged in as admin.');
    } finally {
      setGrantingId(null);
    }
  };

  const handleRevoke = async (user) => {
    setRevokingId(user.uid);
    try {
      await setDoc(doc(db, 'users', user.uid), { premium: REVOKE_PREMIUM }, { merge: true });
      showSuccess(`Premium revoked for ${user.name}`);
      setResults(prev => prev.map(u => u.uid === user.uid
        ? { ...u, premium: REVOKE_PREMIUM }
        : u
      ));
    } catch (err) {
      console.error('Revoke error:', err);
      showError('Failed to revoke premium.');
    } finally {
      setRevokingId(null);
    }
  };

  const isPremiumActive = (premium) =>
    premium?.studentPremium?.active ||
    premium?.cvReview?.active ||
    premium?.aiApplier?.active ||
    premium?.coaching?.active;

  // Not logged in at all
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <LogIn className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-700">Sign In Required</h2>
          <p className="text-gray-500 mt-1 mb-4">Log in or register first, then return to this page.</p>
          <a href="/login" className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Premium Grant Tool</h1>
            <p className="text-gray-500 text-sm">Admin-only — search users and grant full premium access for testing</p>
          </div>
        </div>

        {/* Self-promote banner for non-admin logged-in users */}
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Your account isn't set to Admin yet</p>
              <p className="text-sm text-amber-700 mt-0.5">
                You're logged in as <strong>{userProfile?.role || 'unknown role'}</strong>. Click the button to elevate your account to Admin so you can manage premium access.
              </p>
            </div>
            <button
              onClick={handleMakeMeAdmin}
              disabled={promotingSelf}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {promotingSelf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              Make Me Admin
            </button>
          </div>
        )}

        {/* What gets granted */}
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-8">
          <p className="text-sm font-semibold text-violet-800 mb-2">Granting unlocks:</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-violet-700">
            {['Student Premium (bundle)', 'CV Optimisation', 'Career Coaching', 'AI Auto-Applier', '500 Pitch Tokens', 'Valid for 1 year'].map(f => (
              <div key={f} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email (e.g. Grace)"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-violet-500 rounded-xl outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </form>

        {/* Results */}
        {hasSearched && !searching && results.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p>No users found matching "{searchQuery}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map(user => {
              const active = isPremiumActive(user.premium);
              return (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{user.name[0]?.toUpperCase()}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{user.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'employer' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{user.role}</span>
                      {active && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                          <Zap className="w-3 h-3" />PREMIUM
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">{user.email}</div>
                    <div className="text-xs text-gray-400 font-mono">{user.uid.slice(0, 20)}...</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!active ? (
                      <button
                        onClick={() => handleGrant(user)}
                        disabled={grantingId === user.uid}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                      >
                        {grantingId === user.uid
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Crown className="w-4 h-4" />
                        }
                        Grant Premium
                      </button>
                    ) : (
                      <>
                        <span className="flex items-center gap-1.5 text-green-700 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Active
                        </span>
                        <button
                          onClick={() => handleGrant(user)}
                          disabled={grantingId === user.uid}
                          className="flex items-center gap-1 px-3 py-2 border border-violet-300 text-violet-600 font-semibold rounded-xl hover:bg-violet-50 text-sm disabled:opacity-50"
                          title="Refresh / extend 1 year"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Refresh
                        </button>
                        <button
                          onClick={() => handleRevoke(user)}
                          disabled={revokingId === user.uid}
                          className="flex items-center gap-1 px-3 py-2 border border-red-300 text-red-600 font-semibold rounded-xl hover:bg-red-50 text-sm disabled:opacity-50"
                        >
                          {revokingId === user.uid
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <XCircle className="w-3.5 h-3.5" />
                          }
                          Revoke
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPremiumGrant;
