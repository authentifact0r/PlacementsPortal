/**
 * RevenueDashboard.js — Revenue & Billing Analytics
 * ──────────────────────────────────────────────────
 * Tracks all revenue from talent pipeline operations:
 * pay-per-hire, pay-per-lead, retainers, and subscriptions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRevenueSummary, getBillingEvents } from '../services/talentPipeline.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  DollarSign, TrendingUp, Users, Briefcase, Calendar,
  ArrowUp, ArrowDown, Target, Zap, Award, Clock,
  CheckCircle, AlertCircle, BarChart3
} from 'lucide-react';

// ── Stat card ──
const StatCard = ({ icon: Icon, label, value, subtext, trend, color = 'purple' }) => {
  const colorMap = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' }
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon size={20} className={c.text} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
};

// ── Revenue goal tracker ──
const GoalTracker = ({ current, target, label }) => {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Target size={16} className="text-purple-600" />
          {label}
        </h4>
        <span className="text-sm font-bold text-purple-600">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>£{current.toLocaleString()}</span>
        <span>£{target.toLocaleString()} target</span>
      </div>
    </div>
  );
};

// ── Billing event row ──
const BillingRow = ({ event }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    invoiced: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700'
  };
  const typeIcons = {
    hire: <CheckCircle size={14} className="text-green-600" />,
    lead: <Users size={14} className="text-blue-600" />,
    retainer: <Calendar size={14} className="text-purple-600" />
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-gray-50 rounded-lg">
          {typeIcons[event.type] || <DollarSign size={14} className="text-gray-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {event.type === 'hire' ? 'Placement Fee' : event.type === 'lead' ? 'Lead Fee' : 'Retainer'}
          </p>
          <p className="text-xs text-gray-500">
            {event.candidateName || ''} {event.jobTitle ? `— ${event.jobTitle}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status] || ''}`}>
          {event.status}
        </span>
        <span className="text-sm font-bold text-gray-900">£{(event.amount || 0).toLocaleString()}</span>
      </div>
    </div>
  );
};

// ── PIE CHART COLORS ──
const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b'];

// ── Main component ──
function RevenueDashboard() {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // all, month, quarter

  // For demo purposes, show projected data if no real data
  const demoSummary = {
    totalRevenue: 0,
    hireRevenue: 0,
    leadRevenue: 0,
    retainerRevenue: 0,
    totalHires: 0,
    totalLeads: 0,
    activeRetainers: 0,
    byMonth: {}
  };

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [rev, evts] = await Promise.all([
          getRevenueSummary(),
          getBillingEvents({ limit: 20 })
        ]);
        setSummary(rev);
        setEvents(evts);
      } catch (err) {
        console.error('Failed to load revenue data:', err);
        setSummary(demoSummary);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const data = summary || demoSummary;

  // Monthly chart data
  const monthlyData = Object.entries(data.byMonth || {}).map(([month, vals]) => ({
    month: month.slice(5), // MM
    revenue: vals.revenue,
    hires: vals.hires,
    leads: vals.leads
  }));

  // Revenue breakdown for pie
  const pieData = [
    { name: 'Placement Fees', value: data.hireRevenue },
    { name: 'Lead Fees', value: data.leadRevenue },
    { name: 'Retainers', value: data.retainerRevenue }
  ].filter(d => d.value > 0);

  // 6-month target (adjustable)
  const sixMonthTarget = 100000; // £100k

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={28} />
                Revenue Dashboard
              </h1>
              <p className="text-gray-500 mt-1">Track placement fees, lead revenue, and retainers</p>
            </div>
            <div className="flex items-center gap-2">
              {['all', 'month', 'quarter'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    period === p ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'Quarter'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Goal tracker */}
            <div className="mb-6">
              <GoalTracker
                current={data.totalRevenue}
                target={sixMonthTarget}
                label="6-Month Revenue Goal"
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={DollarSign} label="Total Revenue"
                value={`£${data.totalRevenue.toLocaleString()}`}
                color="green" trend={12}
              />
              <StatCard
                icon={Award} label="Placements Made"
                value={data.totalHires}
                subtext={`£${data.hireRevenue.toLocaleString()} earned`}
                color="purple"
              />
              <StatCard
                icon={Users} label="Leads Delivered"
                value={data.totalLeads}
                subtext={`£${data.leadRevenue.toLocaleString()} earned`}
                color="blue"
              />
              <StatCard
                icon={Calendar} label="Active Retainers"
                value={data.activeRetainers}
                subtext={`£${data.retainerRevenue.toLocaleString()} earned`}
                color="amber"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Monthly revenue chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Monthly Revenue</h3>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `£${v}`} />
                      <Tooltip formatter={v => `£${v.toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-60 text-gray-400">
                    <div className="text-center">
                      <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Revenue data will appear here as you close deals</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue breakdown pie */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Revenue Breakdown</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => `£${v.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-60 text-gray-400">
                    <div className="text-center">
                      <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No revenue recorded yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent billing events */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                Recent Billing Events
              </h3>
              {events.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {events.map(event => (
                    <BillingRow key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No billing events yet</p>
                  <p className="text-xs mt-1">Events are created automatically when candidates are hired or leads delivered</p>
                </div>
              )}
            </div>

            {/* Revenue projection */}
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Zap size={20} /> Revenue Projection
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-sm">Per-Hire (10/month × £750)</p>
                  <p className="text-2xl font-bold">£7,500/mo</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-sm">Per-Lead (30/month × £200)</p>
                  <p className="text-2xl font-bold">£6,000/mo</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-sm">Retainers (5 × £1,500)</p>
                  <p className="text-2xl font-bold">£7,500/mo</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-white/70 text-sm">Combined monthly potential</p>
                <p className="text-3xl font-bold">£21,000/month</p>
                <p className="text-white/60 text-sm mt-1">→ £126,000 over 6 months</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RevenueDashboard;
