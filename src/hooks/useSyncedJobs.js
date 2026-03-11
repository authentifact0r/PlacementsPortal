/**
 * useSyncedJobs — Client-side hook for consuming jobs synced by the Cloud Function.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  DESIGN                                                              │
 * │                                                                      │
 * │  The Cloud Function writes to `jobs` collection every 24h.           │
 * │  This hook reads from Firestore with a real-time listener so the     │
 * │  UI always shows the latest data without manual refresh.             │
 * │                                                                      │
 * │  If the API sync fails, the portal serves the last-known data        │
 * │  because the `jobs` collection retains its previous state.           │
 * │                                                                      │
 * │  Cost Optimization:                                                  │
 * │    • NEVER calls the external API directly                           │
 * │    • Reads only from Firestore (included in free tier)               │
 * │    • Pagination via cursor-based queries                              │
 * │    • Memoized filters to prevent unnecessary re-renders               │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const JOBS_COLLECTION = 'jobs';
const PAGE_SIZE       = 2500;  // Load all jobs in one query (Firestore allows up to ~10k)

/**
 * @param {Object}  options
 * @param {string}  [options.category]    — filter by category (e.g., 'Technology')
 * @param {string}  [options.type]        — filter by type (e.g., 'graduate', 'internship')
 * @param {string}  [options.source]      — filter by source (e.g., 'reed', 'serpapi')
 * @param {string}  [options.searchQuery] — free-text search (client-side filter)
 * @param {boolean} [options.realtime]    — use onSnapshot for live updates (default: true)
 * @param {number}  [options.pageSize]    — results per page (default: 25)
 */
export function useSyncedJobs(options = {}) {
  const {
    category    = null,
    type        = null,
    source      = null,
    searchQuery = '',
    realtime    = true,
    pageSize    = PAGE_SIZE,
  } = options;

  const { currentUser } = useAuth();

  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [hasMore, setHasMore]       = useState(true);
  const [lastDoc, setLastDoc]       = useState(null);
  const [syncMeta, setSyncMeta]     = useState(null);

  // ── Build Firestore query ───────────────────────────────────────────────────
  // NOTE: We avoid compound where+orderBy that needs a composite index.
  // Instead we fetch broadly and filter client-side for maximum resilience.
  const buildQuery = useCallback((afterDoc = null) => {
    const constraints = [];

    // Only add simple equality filters (each alone doesn't need composite index)
    if (category) constraints.push(where('category', '==', category));
    if (type)     constraints.push(where('type', '==', type));
    if (source)   constraints.push(where('source', '==', source));

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize + 1)); // +1 to detect hasMore

    if (afterDoc) constraints.push(startAfter(afterDoc));

    return query(collection(db, JOBS_COLLECTION), ...constraints);
  }, [category, type, source, pageSize]);

  // ── Real-time listener for initial page ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = buildQuery();

    if (realtime) {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Filter out explicitly inactive jobs client-side (allows missing status field)
          const data = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((j) => j.status !== 'expired' && j.status !== 'inactive');
          console.log(`[useSyncedJobs] Got ${snapshot.docs.length} docs, ${data.length} active`);
          if (data.length > pageSize) {
            setHasMore(true);
            setLastDoc(snapshot.docs[pageSize - 1]);
            setJobs(data.slice(0, pageSize));
          } else {
            setHasMore(false);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setJobs(data);
          }
          setLoading(false);
        },
        (err) => {
          console.error('[useSyncedJobs] Snapshot error:', err);
          // If it's an index error, log a helpful message
          if (err.code === 'failed-precondition') {
            console.error('[useSyncedJobs] Missing Firestore index — check the link in the error above to create it.');
          }
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
    // Non-realtime path (one-time read) is handled by loadMore below
    return undefined;
  }, [currentUser, buildQuery, realtime, pageSize]);

  // ── Load next page (cursor-based pagination) ────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || !lastDoc) return;

    setLoading(true);
    try {
      const q = buildQuery(lastDoc);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (data.length > pageSize) {
            setHasMore(true);
            setLastDoc(snapshot.docs[pageSize - 1]);
            setJobs((prev) => [...prev, ...data.slice(0, pageSize)]);
          } else {
            setHasMore(false);
            setLastDoc(null);
            setJobs((prev) => [...prev, ...data]);
          }
          setLoading(false);
          unsubscribe(); // One-shot for pagination
        },
        (err) => {
          console.error('[useSyncedJobs] Pagination error:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [hasMore, lastDoc, buildQuery, pageSize]);

  // ── Client-side text search (applied on top of Firestore filters) ───────────
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter((job) =>
      (job.title || '').toLowerCase().includes(q) ||
      (job.company || '').toLowerCase().includes(q) ||
      (job.category || '').toLowerCase().includes(q) ||
      (job.location?.city || '').toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  // ── Load sync metadata (for admin dashboard / status indicator) ─────────────
  useEffect(() => {
    if (!currentUser) return;

    const fetchMeta = async () => {
      try {
        const metaSnap = await getDoc(doc(db, 'api_cache', 'job_sync_meta'));
        if (metaSnap.exists()) setSyncMeta(metaSnap.data());
      } catch (err) {
        console.warn('[useSyncedJobs] Could not load sync meta:', err.message);
      }
    };

    fetchMeta();
  }, [currentUser]);

  // ── Summary statistics ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byCategory = {};
    const byType     = {};
    const bySource   = {};

    jobs.forEach((job) => {
      byCategory[job.category || 'General'] = (byCategory[job.category || 'General'] || 0) + 1;
      byType[job.type || 'full-time']       = (byType[job.type || 'full-time'] || 0) + 1;
      bySource[job.source || 'unknown']     = (bySource[job.source || 'unknown'] || 0) + 1;
    });

    return { total: jobs.length, byCategory, byType, bySource };
  }, [jobs]);

  return {
    jobs: filteredJobs,
    allJobs: jobs,
    loading,
    error,
    hasMore,
    loadMore,
    stats,
    syncMeta,
  };
}

export default useSyncedJobs;
