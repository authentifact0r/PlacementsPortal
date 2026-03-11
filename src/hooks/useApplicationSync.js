/**
 * useApplicationSync — Lightweight hook that bridges the ApplicationContext
 * with any component that needs real-time application data.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  PURPOSE                                                             │
 * │                                                                      │
 * │  The ApplicationContext already provides a single onSnapshot listener │
 * │  shared by JobTracker (Kanban) and DashboardWidget (sidebar).        │
 * │                                                                      │
 * │  This hook adds:                                                     │
 * │    1. Filtered views — filter by status, industry, date range        │
 * │    2. Stage conversion metrics — computed per-filter                  │
 * │    3. Role taxonomy integration — group by industry/function          │
 * │    4. Convenience selectors — reduce boilerplate in consumers        │
 * │                                                                      │
 * │  Usage:                                                              │
 * │    const { filtered, kanbanColumns, metrics } =                      │
 * │      useApplicationSync({ statusFilter: 'interview' });              │
 * └───────────────────────────────────────────────────────────────────────┘
 */

import { useMemo, useCallback } from 'react';
import { useApplications } from '../contexts/ApplicationContext';
import { matchJobTitle, resolveRolePath } from '../data/jobRoleTaxonomy';

// ── Pipeline stages in funnel order ───────────────────────────────────────────
const PIPELINE_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

const KANBAN_STAGES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

// ── Helper: parse Firestore timestamps ────────────────────────────────────────
const toDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === 'string' || typeof ts === 'number') return new Date(ts);
  return null;
};


/**
 * @param {Object} options
 * @param {string}   [options.statusFilter]   — single status to filter by (or null for all)
 * @param {string}   [options.industryFilter] — industry id from taxonomy
 * @param {string}   [options.searchQuery]    — free-text search across role/company
 * @param {Date}     [options.dateFrom]       — only apps created on or after this date
 * @param {Date}     [options.dateTo]         — only apps created on or before this date
 */
export function useApplicationSync(options = {}) {
  const {
    statusFilter = null,
    industryFilter = null,
    searchQuery = '',
    dateFrom = null,
    dateTo = null,
  } = options;

  // ── Pull live data from the shared context ──────────────────────────────────
  const {
    applications,
    loading,
    connectionState,
    analytics,
    addApplication,
    updateApplication,
    updateStatus,
    deleteApplication,
    batchUpdateStatus,
  } = useApplications();

  // ── Enrich applications with taxonomy data ──────────────────────────────────
  const enrichedApplications = useMemo(() => {
    return applications.map((app) => {
      // If the app has a rolePath (industry/function/level), resolve labels
      const resolved = app.rolePath ? resolveRolePath(app.rolePath) : null;

      // If no rolePath, try to infer industry/function from the role title
      const inferred = !resolved && app.role ? matchJobTitle(app.role) : null;

      return {
        ...app,
        taxonomy: resolved || (inferred ? {
          industry: inferred.industryLabel,
          function: inferred.functionLabel,
          level: null,
        } : null),
        _industryId: resolved ? app.rolePath.split('/')[0]
          : inferred ? inferred.industryId
          : null,
        _appliedDate: toDate(app.appliedDate || app.createdAt),
      };
    });
  }, [applications]);

  // ── Apply filters ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = enrichedApplications;

    if (statusFilter) {
      result = result.filter((app) => app.status === statusFilter);
    }

    if (industryFilter) {
      result = result.filter((app) => app._industryId === industryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((app) =>
        (app.role || '').toLowerCase().includes(q) ||
        (app.company || '').toLowerCase().includes(q) ||
        (app.taxonomy?.industry || '').toLowerCase().includes(q) ||
        (app.taxonomy?.function || '').toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      result = result.filter((app) => app._appliedDate && app._appliedDate >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((app) => app._appliedDate && app._appliedDate <= dateTo);
    }

    return result;
  }, [enrichedApplications, statusFilter, industryFilter, searchQuery, dateFrom, dateTo]);

  // ── Kanban columns — ready for drag-and-drop board ──────────────────────────
  const kanbanColumns = useMemo(() => {
    const columns = {};
    KANBAN_STAGES.forEach((stage) => {
      columns[stage] = {
        id: stage,
        label: stage.charAt(0).toUpperCase() + stage.slice(1),
        items: [],
      };
    });

    filtered.forEach((app) => {
      const stage = PIPELINE_STAGES.includes(app.status) ? app.status : 'saved';
      columns[stage].items.push(app);
    });

    return columns;
  }, [filtered]);

  // ── Stage conversion metrics (computed from filtered set) ───────────────────
  const stageMetrics = useMemo(() => {
    const total = filtered.length;
    if (total === 0) {
      return {
        total: 0,
        byStatus: {},
        conversionRates: {},
        pipelineVelocity: {},
      };
    }

    // Count by status
    const byStatus = {};
    PIPELINE_STAGES.forEach((s) => { byStatus[s] = 0; });
    filtered.forEach((app) => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    });

    // Conversion rates: what % moved from one stage to the next
    const reachedStage = {};
    PIPELINE_STAGES.forEach((s) => { reachedStage[s] = 0; });

    filtered.forEach((app) => {
      const historyStatuses = new Set(
        (app.statusHistory || []).map((h) => h.status)
      );
      historyStatuses.add(app.status);
      PIPELINE_STAGES.forEach((stage) => {
        if (historyStatuses.has(stage)) reachedStage[stage] += 1;
      });
    });

    const funnelStages = ['saved', 'applied', 'interview', 'offer'];
    const conversionRates = {};
    funnelStages.forEach((stage, i) => {
      const prevStage = i > 0 ? funnelStages[i - 1] : null;
      const count = reachedStage[stage];
      const prevCount = prevStage ? reachedStage[prevStage] : total;
      conversionRates[stage] = {
        count,
        rate: prevCount > 0 ? Math.round((count / prevCount) * 100) : 0,
        fromStage: prevStage || 'total',
      };
    });

    // Pipeline velocity (avg days between stages)
    const velocityBuckets = {
      savedToApplied: [],
      appliedToInterview: [],
      interviewToOffer: [],
    };

    filtered.forEach((app) => {
      const history = app.statusHistory || [];
      if (history.length < 2) return;

      const findDate = (status) => {
        const entry = history.find((h) => h.status === status);
        return entry ? toDate(entry.date) : null;
      };

      const daysBetween = (a, b) => {
        if (!a || !b) return null;
        const days = (b - a) / (1000 * 60 * 60 * 24);
        return days >= 0 && days < 365 ? days : null;
      };

      const saved = findDate('saved');
      const applied = findDate('applied');
      const interview = findDate('interview');
      const offer = findDate('offer');

      const s2a = daysBetween(saved, applied);
      const a2i = daysBetween(applied, interview);
      const i2o = daysBetween(interview, offer);

      if (s2a !== null) velocityBuckets.savedToApplied.push(s2a);
      if (a2i !== null) velocityBuckets.appliedToInterview.push(a2i);
      if (i2o !== null) velocityBuckets.interviewToOffer.push(i2o);
    });

    const pipelineVelocity = {};
    Object.entries(velocityBuckets).forEach(([key, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      pipelineVelocity[key] = {
        avgDays: values.length > 0 ? Math.round((sum / values.length) * 10) / 10 : null,
        samples: values.length,
      };
    });

    return { total, byStatus, conversionRates, pipelineVelocity };
  }, [filtered]);

  // ── Industry breakdown (for analytics charts) ───────────────────────────────
  const industryBreakdown = useMemo(() => {
    const map = {};
    enrichedApplications.forEach((app) => {
      const industry = app.taxonomy?.industry || 'Uncategorised';
      if (!map[industry]) {
        map[industry] = { industry, total: 0, interview: 0, offer: 0, rejected: 0 };
      }
      map[industry].total += 1;
      if (['interview', 'offer'].includes(app.status)) map[industry].interview += 1;
      if (app.status === 'offer') map[industry].offer += 1;
      if (app.status === 'rejected') map[industry].rejected += 1;
    });

    return Object.values(map)
      .map((entry) => ({
        ...entry,
        interviewRate: entry.total > 0 ? Math.round((entry.interview / entry.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [enrichedApplications]);

  // ── Convenience: add application with taxonomy auto-tagging ─────────────────
  const addApplicationWithTaxonomy = useCallback(async (formData) => {
    // Auto-tag with taxonomy if not already set
    if (!formData.rolePath && formData.role) {
      const match = matchJobTitle(formData.role);
      if (match) {
        formData.industryId = match.industryId;
        formData.functionId = match.functionId;
      }
    }
    return addApplication(formData);
  }, [addApplication]);

  return {
    // ── Live state ────────────────────────────────────────────────────────────
    applications: enrichedApplications,
    filtered,
    loading,
    connectionState,

    // ── Pre-computed views ────────────────────────────────────────────────────
    kanbanColumns,
    stageMetrics,
    industryBreakdown,

    // ── Global analytics (unfiltered, from ApplicationContext) ────────────────
    analytics,

    // ── CRUD (pass-through from context) ─────────────────────────────────────
    addApplication: addApplicationWithTaxonomy,
    updateApplication,
    updateStatus,
    deleteApplication,
    batchUpdateStatus,
  };
}

export default useApplicationSync;
