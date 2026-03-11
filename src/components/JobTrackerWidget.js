/**
 * JobTrackerWidget — Compact dashboard summary card for the Job Application Tracker.
 * Now uses shared ApplicationContext instead of its own onSnapshot listener.
 */
import React from 'react';
import { useApplications } from '../contexts/ApplicationContext';
import { Briefcase, ArrowRight, TrendingUp, Clock, CheckCircle, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  saved:     { label: 'Saved',     color: 'bg-gray-100 text-gray-700',   dot: 'bg-gray-400' },
  applied:   { label: 'Applied',   color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  interview: { label: 'Interview', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  offer:     { label: 'Offer',     color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected:  { label: 'Rejected',  color: 'bg-red-100 text-red-600',     dot: 'bg-red-400' },
};

const JobTrackerWidget = () => {
  const { applications, loading, analytics } = useApplications();
  const navigate = useNavigate();

  const counts = analytics?.byStatus || {};
  const recent = applications.slice(0, 4);
  const total = analytics?.total || 0;
  const interviewRate = analytics?.interviewRate || 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Job Tracker</h3>
            <p className="text-xs text-gray-500">{total} application{total !== 1 ? 's' : ''} tracked</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/job-tracker')}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
        {[
          { icon: Target, label: 'Saved', count: counts.saved || 0, color: 'text-gray-500' },
          { icon: Clock, label: 'Applied', count: counts.applied || 0, color: 'text-blue-500' },
          { icon: TrendingUp, label: 'Interview', count: counts.interview || 0, color: 'text-amber-500' },
          { icon: CheckCircle, label: 'Offer', count: counts.offer || 0, color: 'text-green-500' },
        ].map(({ icon: Icon, label, count, color }) => (
          <div key={label} className="text-center py-3 border-r border-gray-100 last:border-r-0">
            <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
            <p className="text-base font-bold text-gray-900">{count}</p>
            <p className="text-[10px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      {recent.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {recent.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;
            return (
              <div key={app.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{app.role || 'Untitled Role'}</p>
                  <p className="text-xs text-gray-500 truncate">{app.company || 'Unknown'}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-2">No applications yet</p>
          <button
            onClick={() => navigate('/job-tracker')}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            Start tracking →
          </button>
        </div>
      )}

      {/* Footer */}
      {total > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Interview rate: <strong className="text-gray-700">{interviewRate}%</strong>
          </span>
          <button
            onClick={() => navigate('/job-tracker')}
            className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium transition-colors"
          >
            Open Tracker
          </button>
        </div>
      )}
    </div>
  );
};

export default JobTrackerWidget;
