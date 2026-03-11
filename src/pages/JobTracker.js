import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApplications } from '../contexts/ApplicationContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { runPreFlightCheck, getCvFromFirestore } from '../services/preflightCheck.service';
import {
  Plus,
  Briefcase,
  TrendingUp,
  Target,
  Award,
  Trash2,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  List,
  Search,
  Filter,
  Calendar,
  Building2,
  MapPin,
  X,
  Edit3,
  MoreVertical,
  ArrowRight,
  Zap,
  Clock,
  BarChart3,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';

const STATUS_CONFIG = {
  saved: { label: 'Saved', color: 'gray-500', bgLight: 'bg-gray-50', border: 'border-gray-200' },
  applied: { label: 'Applied', color: 'blue-500', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  interview: { label: 'Interview', color: 'amber-500', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  offer: { label: 'Offer', color: 'green-500', bgLight: 'bg-green-50', border: 'border-green-200' },
  rejected: { label: 'Rejected', color: 'red-400', bgLight: 'bg-red-50', border: 'border-red-200' },
};

const SOURCE_OPTIONS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'direct', label: 'Direct' },
  { value: 'company-site', label: 'Company Site' },
  { value: 'other', label: 'Other' },
];

const KANBAN_STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'];

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subtitle, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-2 text-${color}`}>{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 text-${color}`} />
      </div>
    </div>
  </div>
);

// Application Card Component
const ApplicationCard = ({
  application,
  onStatusChange,
  onDelete,
  onViewDetails,
  isDraggable,
}) => {
  const config = STATUS_CONFIG[application.status];
  const sourceLabel = SOURCE_OPTIONS.find(s => s.value === application.source)?.label || application.source;

  return (
    <div
      className={`${config.bgLight} border-l-4 border-l-${config.color} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow bg-white border`}
      onClick={() => onViewDetails(application)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-sm">{application.company}</h3>
          <p className="text-gray-600 text-xs mt-1">{application.role}</p>
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(application.id);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center text-xs text-gray-600">
          <Calendar className="w-3 h-3 mr-2" />
          {new Date(application.appliedDate.toDate()).toLocaleDateString()}
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <Building2 className="w-3 h-3 mr-2" />
          {sourceLabel}
        </div>
      </div>

      <span className={`inline-block px-2 py-1 rounded text-xs font-medium bg-${config.color} bg-opacity-10 text-${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

// Empty State — "Quick Start" for new users
const EmptyBoardState = ({ onAddFirst }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6">
    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
      <Briefcase className="w-10 h-10 text-blue-500" />
    </div>
    <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontSize: '1.3rem' }}>
      Welcome to your Job Tracker
    </h2>
    <p className="text-gray-500 text-center max-w-md mb-8" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
      Track every application from saved to offer. Add your first job to get started — you'll see it move through the pipeline as you progress.
    </p>
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <button
        onClick={onAddFirst}
        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-lg shadow-blue-500/20"
        style={{ fontSize: '0.95rem' }}
      >
        <Plus className="w-5 h-5" />
        Add Your First Application
      </button>
    </div>
    <div className="mt-10 grid grid-cols-5 gap-3 w-full max-w-2xl opacity-40">
      {KANBAN_STATUSES.map(status => {
        const config = STATUS_CONFIG[status];
        return (
          <div key={status} className={`${config.bgLight} rounded-lg p-3 text-center`}>
            <p className="text-xs font-semibold text-gray-500">{config.label}</p>
            <div className="mt-2 h-16 border-2 border-dashed border-gray-200 rounded-md" />
          </div>
        );
      })}
    </div>
  </div>
);

// Kanban Board View Component
const KanbanView = ({ applications, onStatusChange, onDelete, onViewDetails }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {KANBAN_STATUSES.map(status => {
        const config = STATUS_CONFIG[status];
        const statusApps = applications.filter(app => app.status === status);

        return (
          <div key={status} className={`${config.bgLight} rounded-lg p-4 min-h-96`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {config.label}
                <span className={`bg-${config.color} bg-opacity-10 text-${config.color} px-2 py-0.5 rounded-full text-xs font-medium`}>
                  {statusApps.length}
                </span>
              </h3>
            </div>

            <div className="space-y-3">
              {statusApps.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No applications</p>
                </div>
              ) : (
                statusApps.map(app => (
                  <div key={app.id} className="relative group">
                    <ApplicationCard
                      application={app}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onViewDetails={onViewDetails}
                      isDraggable={false}
                    />
                    {status !== 'rejected' && status !== 'offer' && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          const statuses = KANBAN_STATUSES;
                          const nextIndex = statuses.indexOf(status) + 1;
                          if (nextIndex < statuses.length) {
                            onStatusChange(app.id, statuses[nextIndex]);
                          }
                        }}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Move to next status"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Table View Component
const TableView = ({ applications, onStatusChange, onDelete, onViewDetails, sortBy, setSortBy, sortOrder, setSortOrder }) => {
  const sortedApps = useMemo(() => {
    let sorted = [...applications];

    if (sortBy) {
      sorted.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortBy === 'appliedDate') {
          aVal = new Date(aVal.toDate());
          bVal = new Date(bVal.toDate());
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [applications, sortBy, sortOrder]);

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const TableHeader = ({ column, label }) => (
    <th
      className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortBy === column && (
          <span className="text-gray-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <TableHeader column="company" label="Company" />
            <TableHeader column="role" label="Role" />
            <TableHeader column="status" label="Status" />
            <TableHeader column="source" label="Source" />
            <TableHeader column="appliedDate" label="Date Applied" />
            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedApps.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No applications yet</p>
              </td>
            </tr>
          ) : (
            sortedApps.map(app => {
              const config = STATUS_CONFIG[app.status];
              const sourceLabel = SOURCE_OPTIONS.find(s => s.value === app.source)?.label || app.source;

              return (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onViewDetails(app)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {app.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {app.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${config.color} bg-opacity-10 text-${config.color}`}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {sourceLabel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(app.appliedDate.toDate()).toLocaleDateString()}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDelete(app.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// Add/Edit Application Modal
const ApplicationModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    jobUrl: '',
    source: 'linkedin',
    salaryRange: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        company: initialData.company || '',
        role: initialData.role || '',
        jobUrl: initialData.jobUrl || '',
        source: initialData.source || 'linkedin',
        salaryRange: initialData.salaryRange || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        company: '',
        role: '',
        jobUrl: '',
        source: 'linkedin',
        salaryRange: '',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.company.trim() || !formData.role.trim()) {
      alert('Company and Role are required');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Application' : 'Add Job Application'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g., Google"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Title *
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Senior Frontend Engineer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job URL
            </label>
            <input
              type="url"
              value={formData.jobUrl}
              onChange={e => setFormData({ ...formData, jobUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source
            </label>
            <select
              value={formData.source}
              onChange={e => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SOURCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Range
            </label>
            <input
              type="text"
              value={formData.salaryRange}
              onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
              placeholder="e.g., $120K - $150K"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this application..."
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              {initialData ? 'Update' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Details Modal Component
const DetailsModal = ({ isOpen, onClose, application, onStatusChange, onDelete }) => {
  if (!isOpen || !application) return null;

  const config = STATUS_CONFIG[application.status];
  const sourceLabel = SOURCE_OPTIONS.find(s => s.value === application.source)?.label || application.source;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{application.company}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="text-gray-900 font-medium">{application.role}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-${config.color} bg-opacity-10 text-${config.color}`}>
              {config.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Source</p>
              <p className="text-gray-900 font-medium">{sourceLabel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Applied</p>
              <p className="text-gray-900 font-medium">
                {new Date(application.appliedDate.toDate()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {application.salaryRange && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Salary Range</p>
              <p className="text-gray-900 font-medium">{application.salaryRange}</p>
            </div>
          )}

          {application.jobUrl && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Job URL</p>
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 flex items-center gap-2 font-medium text-sm"
              >
                View Job <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {application.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Notes</p>
              <p className="text-gray-900 text-sm">{application.notes}</p>
            </div>
          )}

          <div className="pt-4 space-y-2">
            {application.status !== 'offer' && application.status !== 'rejected' && (
              <button
                onClick={() => {
                  const statuses = KANBAN_STATUSES;
                  const nextIndex = statuses.indexOf(application.status) + 1;
                  if (nextIndex < statuses.length) {
                    onStatusChange(application.id, statuses[nextIndex]);
                    onClose();
                  }
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
              >
                Move to {STATUS_CONFIG[KANBAN_STATUSES[KANBAN_STATUSES.indexOf(application.status) + 1]].label}
              </button>
            )}
            <button
              onClick={() => {
                onDelete(application.id);
                onClose();
              }}
              className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              Delete Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Conversion Funnel Bar ────────────────────────────────────────────────────
const FunnelBar = ({ stage, count, rate, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-medium text-gray-600 w-20 capitalize">{stage}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.max(rate, 4)}%`, background: color }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold text-gray-700">
        {count} ({rate}%)
      </span>
    </div>
  </div>
);

// ── Source Attribution Row ───────────────────────────────────────────────────
const SourceRow = ({ source, total, interviewRate, offerRate }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <span className="text-sm font-medium text-gray-800 capitalize">{source}</span>
    <div className="flex items-center gap-4 text-xs">
      <span className="text-gray-500">{total} apps</span>
      <span className="text-amber-600 font-semibold">{interviewRate}% interview</span>
      <span className="text-green-600 font-semibold">{offerRate}% offer</span>
    </div>
  </div>
);

// ── Pre-Flight Check Panel ──────────────────────────────────────────────────
const PreFlightPanel = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvLoaded, setCvLoaded] = useState(false);

  // Pull real CV from Firestore on mount
  useEffect(() => {
    if (!currentUser?.uid || cvLoaded) return;
    setCvLoading(true);
    getCvFromFirestore(currentUser.uid)
      .then((data) => {
        if (data) setCvData(data);
        setCvLoaded(true);
      })
      .catch(() => setCvLoaded(true))
      .finally(() => setCvLoading(false));
  }, [currentUser?.uid, cvLoaded]);

  const handleRun = () => {
    if (!cvData) {
      // Fallback placeholder if Firestore CV isn't available
      const fallback = {
        personal: { fullName: 'User', title: 'Graduate' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        certifications: [],
      };
      setResult(runPreFlightCheck(jdText, fallback));
      return;
    }
    setResult(runPreFlightCheck(jdText, cvData));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-gray-900" style={{ fontSize: '0.95rem' }}>AI Pre-Flight Check</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* CV Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
          cvLoading ? 'bg-gray-50 text-gray-500' :
          cvData ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            cvLoading ? 'bg-gray-400 animate-pulse' :
            cvData ? 'bg-green-500' : 'bg-amber-500'
          }`} />
          {cvLoading ? 'Loading your CV...' :
           cvData ? `CV loaded — ${cvData.skills?.length || 0} skills detected` :
           'No CV found — build one in CV Review for better results'}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Paste Job Description
          </label>
          <textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here to get your match score, missing skills, and optimised bullet suggestions..."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            style={{ fontSize: '0.875rem', lineHeight: '1.5' }}
          />
        </div>

        <button
          onClick={handleRun}
          disabled={!jdText.trim() || cvLoading}
          className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          style={{
            background: jdText.trim() ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#e5e7eb',
            color: jdText.trim() ? '#fff' : '#9ca3af',
            cursor: jdText.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Run Pre-Flight Check
        </button>

        {result && (
          <div className="space-y-4 pt-2">
            {/* Match Score */}
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <div className="relative inline-flex items-center justify-center w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={result.match_score >= 70 ? '#22c55e' : result.match_score >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - result.match_score / 100)}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xl font-bold text-gray-900">{result.match_score}</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 mt-2">Match Score</p>
              <p className="text-xs text-gray-500">
                {result.match_score >= 70 ? 'Strong match' : result.match_score >= 40 ? 'Moderate match' : 'Needs improvement'}
              </p>
              {result.recommendation && (
                <p className="text-xs text-gray-600 mt-2 max-w-sm mx-auto leading-relaxed">
                  {result.recommendation}
                </p>
              )}
            </div>

            {/* Missing Skills */}
            {result.missing_skills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Missing Hard Skills</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.missing_skills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Skills */}
            {result.cv_skills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <h4 className="text-sm font-semibold text-gray-800">Your Matched Skills</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.cv_skills.filter(s => result.jd_skills.includes(s)).slice(0, 8).map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optimised Bullets */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-semibold text-gray-800">Suggested X-Y-Z Bullets</h4>
              </div>
              <div className="space-y-2">
                {result.optimized_bullets.map((bullet, i) => (
                  <div key={i} className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <p className="text-xs text-gray-700 leading-relaxed">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ─── Main JobTracker Component ──────────────────────────────────────────────
export default function JobTracker() {
  const { applications, loading, connectionState, analytics, addApplication, updateStatus, deleteApplication } = useApplications();
  const { showSuccess, showError } = useToast();

  const [viewMode, setViewMode] = useState('kanban');
  const [activePanel, setActivePanel] = useState('board'); // 'board' | 'analytics' | 'preflight'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('appliedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // ── CRUD wrappers with toast feedback ──────────────────────────────────────
  const handleAddApplication = useCallback(async (formData) => {
    try {
      await addApplication(formData);
      showSuccess('Application added successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding application:', error);
      showError('Failed to add application');
    }
  }, [addApplication, showSuccess, showError]);

  const handleStatusChange = useCallback(async (appId, newStatus) => {
    try {
      await updateStatus(appId, newStatus);
      showSuccess(`Application moved to ${STATUS_CONFIG[newStatus].label}`);
    } catch (error) {
      console.error('Error updating application:', error);
      showError('Failed to update application');
    }
  }, [updateStatus, showSuccess, showError]);

  const handleDeleteApplication = useCallback(async (appId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await deleteApplication(appId);
      showSuccess('Application deleted');
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error deleting application:', error);
      showError('Failed to delete application');
    }
  }, [deleteApplication, showSuccess, showError]);

  // ── Search filter ──────────────────────────────────────────────────────────
  const filteredApplications = useMemo(() => {
    if (!searchTerm) return applications;
    const term = searchTerm.toLowerCase();
    return applications.filter(app =>
      (app.company || '').toLowerCase().includes(term) ||
      (app.role || '').toLowerCase().includes(term)
    );
  }, [applications, searchTerm]);

  // ── Funnel colours ─────────────────────────────────────────────────────────
  const FUNNEL_COLORS = { saved: '#9ca3af', applied: '#3b82f6', interview: '#f59e0b', offer: '#22c55e' };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50" style={{ minHeight: '100%' }}>
      {/* Header — sticks below the fixed navbar (5rem = h-20) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full mx-auto px-4 sm:px-6 py-5" style={{ maxWidth: 'min(80rem, 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-7 h-7 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontSize: '1.5rem' }}>Job Tracker</h1>
              {/* Connection state badge */}
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                connectionState === 'live'       ? 'bg-green-50 text-green-700' :
                connectionState === 'connecting' ? 'bg-amber-50 text-amber-600' :
                                                   'bg-red-50 text-red-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  connectionState === 'live'       ? 'bg-green-500' :
                  connectionState === 'connecting' ? 'bg-amber-500 animate-pulse' :
                                                     'bg-red-500'
                }`} />
                {connectionState === 'live' ? 'Live' : connectionState === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePanel(activePanel === 'preflight' ? 'board' : 'preflight')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activePanel === 'preflight'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Zap className="w-4 h-4" />
                Pre-Flight
              </button>
              <button
                onClick={() => setActivePanel(activePanel === 'analytics' ? 'board' : 'analytics')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activePanel === 'analytics'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <button
                onClick={() => {
                  setSelectedApplication(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Application
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies or roles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'kanban' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Stat Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Briefcase} label="Total Applications" value={analytics.total} subtitle={`${analytics.thisWeek} this week · ${analytics.thisMonth || 0} this month`} color="blue-500" />
          <StatCard icon={TrendingUp} label="Interview Rate" value={`${analytics.interviewRate}%`} subtitle={analytics.interviewRate > 0 ? 'of applied' : 'No interviews yet'} color="amber-500" />
          <StatCard icon={Award} label="Offer Rate" value={`${analytics.offerRate}%`} subtitle={analytics.offerRate > 0 ? 'of applied' : 'No offers yet'} color="green-500" />
          <StatCard icon={Target} label="Active Pipeline" value={analytics.byStatus ? (analytics.byStatus.saved || 0) + (analytics.byStatus.applied || 0) + (analytics.byStatus.interview || 0) : 0} subtitle={`${analytics.rejectionRate || 0}% rejection rate`} color="purple-500" />
        </div>

        {/* Analytics Panel */}
        {activePanel === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Conversion Funnel
              </h3>
              <div className="space-y-3">
                {analytics.conversionFunnel.map(f => (
                  <FunnelBar key={f.stage} stage={f.stage} count={f.count} rate={f.rate} color={FUNNEL_COLORS[f.stage] || '#9ca3af'} />
                ))}
              </div>
            </div>

            {/* Pipeline Velocity */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pipeline Velocity
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Saved → Applied',     key: 'savedToApplied' },
                  { label: 'Applied → Interview',  key: 'appliedToInterview' },
                  { label: 'Interview → Offer',    key: 'interviewToOffer' },
                  { label: 'End-to-End',            key: 'endToEnd' },
                ].map(({ label, key }) => {
                  const v = analytics.pipelineVelocity?.[key];
                  return (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{label}</span>
                      <div className="text-right">
                        {v && v.avg !== null ? (
                          <>
                            <span className="text-sm font-bold text-gray-900">{v.avg}d</span>
                            <span className="text-[0.65rem] text-gray-400 ml-1">avg</span>
                            {v.median !== null && (
                              <>
                                <span className="text-gray-300 mx-1">·</span>
                                <span className="text-xs font-semibold text-gray-700">{v.median}d</span>
                                <span className="text-[0.65rem] text-gray-400 ml-0.5">med</span>
                              </>
                            )}
                            <span className="text-[0.6rem] text-gray-300 ml-1">({v.samples})</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {(!analytics.pipelineVelocity?.appliedToInterview?.avg) && (
                <p className="text-xs text-gray-400 mt-3">Track more applications to see velocity data.</p>
              )}
            </div>

            {/* Source Attribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Source Attribution
              </h3>
              {analytics.sourceAttribution?.length > 0 ? (
                <div>
                  {analytics.sourceAttribution.map(s => (
                    <SourceRow key={s.source} {...s} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No source data yet. Add applications with a source.</p>
              )}
            </div>
          </div>
        )}

        {/* Pre-Flight Check Panel */}
        {activePanel === 'preflight' && (
          <div className="mb-6 max-w-2xl">
            <PreFlightPanel onClose={() => setActivePanel('board')} />
          </div>
        )}

        {/* View Container */}
        {applications.length === 0 && !searchTerm ? (
          <EmptyBoardState onAddFirst={() => { setSelectedApplication(null); setIsModalOpen(true); }} />
        ) : viewMode === 'kanban' ? (
          <KanbanView
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteApplication}
            onViewDetails={(app) => { setSelectedApplication(app); setIsDetailsOpen(true); }}
          />
        ) : (
          <TableView
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteApplication}
            onViewDetails={(app) => { setSelectedApplication(app); setIsDetailsOpen(true); }}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />
        )}
      </div>

      {/* Modals */}
      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddApplication}
        initialData={selectedApplication}
      />

      <DetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        application={selectedApplication}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteApplication}
      />
    </div>
  );
}
