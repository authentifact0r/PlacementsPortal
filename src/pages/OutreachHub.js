/**
 * OutreachHub.js — Automated Outreach Management
 * ────────────────────────────────────────────────
 * Manage employer and candidate outreach campaigns,
 * generate personalised emails, and track engagement.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  OUTREACH_TEMPLATES,
  generateOutreachEmail,
  generateEmployerPitch,
  generateCandidateNotification,
  renderTemplate,
  createCampaign,
  getCampaigns,
  updateCampaignStatus,
  EMPLOYER_SEQUENCE
} from '../services/outreach.service';
import {
  Mail, Send, Users, Briefcase, Copy, Check,
  Edit3, Zap, Clock, BarChart3, Plus, Eye,
  ChevronDown, ChevronRight, Sparkles, Target,
  RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react';

// ── Template preview card ──
const TemplateCard = ({ template, onSelect, onPreview }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
    onClick={() => onSelect(template)}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${template.type === 'employer' ? 'bg-blue-50' : 'bg-green-50'}`}>
          {template.type === 'employer'
            ? <Briefcase size={16} className="text-blue-600" />
            : <Users size={16} className="text-green-600" />
          }
        </div>
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
          <p className="text-xs text-gray-500">{template.type === 'employer' ? 'Employer' : 'Candidate'} outreach</p>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onPreview(template); }}
        className="p-1 text-gray-400 hover:text-purple-600"
      >
        <Eye size={16} />
      </button>
    </div>
    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.subject}</p>
  </div>
);

// ── Email composer ──
const EmailComposer = ({ template, onSend, onClose }) => {
  const [variables, setVariables] = useState({});
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const email = generateOutreachEmail(template.id, variables);
    setPreview(email);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-purple-600" size={20} />
          {template.name}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">
          Close
        </button>
      </div>

      {/* Variable inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {template.variables.map(v => (
          <div key={v}>
            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
              {v.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="text"
              value={variables[v] || ''}
              onChange={e => setVariables({ ...variables, [v]: e.target.value })}
              placeholder={v}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2 mb-4"
      >
        <Zap size={16} /> Generate Email
      </button>

      {/* Preview */}
      {preview && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(`Subject: ${preview.subject}\n\n${preview.body}`)}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy all'}
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3">
              <span className="text-xs text-gray-500">Subject:</span>
              <p className="text-sm font-medium text-gray-900">{preview.subject}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Body:</span>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans mt-1 leading-relaxed">
                {preview.body}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Campaign card ──
const CampaignCard = ({ campaign }) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{campaign.name || 'Untitled Campaign'}</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
          {campaign.status}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{campaign.stats?.totalRecipients || 0}</p>
          <p className="text-xs text-gray-500">Recipients</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{campaign.stats?.sent || 0}</p>
          <p className="text-xs text-gray-500">Sent</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{campaign.stats?.replied || 0}</p>
          <p className="text-xs text-gray-500">Replied</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-600">{campaign.stats?.converted || 0}</p>
          <p className="text-xs text-gray-500">Converted</p>
        </div>
      </div>
    </div>
  );
};

// ── Sequence visualisation ──
const SequenceTimeline = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Clock size={18} className="text-purple-600" />
      Employer Outreach Sequence
    </h3>
    <div className="space-y-4">
      {EMPLOYER_SEQUENCE.map((step, i) => {
        const tmpl = OUTREACH_TEMPLATES[step.templateId];
        return (
          <div key={step.step} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-sm font-bold">
                {step.step}
              </div>
              {i < EMPLOYER_SEQUENCE.length - 1 && (
                <div className="w-0.5 h-8 bg-purple-200 mt-1" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <p className="font-medium text-gray-900 text-sm">{step.description}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {step.delayDays === 0 ? 'Sent immediately' : `Day ${step.delayDays}`}
                {tmpl && ` — "${tmpl.name}"`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ── Main component ──
function OutreachHub() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('templates'); // templates, campaigns, sequence
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const templates = Object.values(OUTREACH_TEMPLATES);
  const employerTemplates = templates.filter(t => t.type === 'employer');
  const candidateTemplates = templates.filter(t => t.type === 'candidate');

  useEffect(() => {
    if (currentUser && activeTab === 'campaigns') {
      setLoading(true);
      getCampaigns(currentUser.uid)
        .then(setCampaigns)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentUser, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="text-purple-600" size={28} />
            Outreach Hub
          </h1>
          <p className="text-gray-500 mt-1">Generate personalised outreach, manage campaigns, and automate follow-ups</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'templates', label: 'Templates', icon: Edit3 },
            { key: 'campaigns', label: 'Campaigns', icon: Target },
            { key: 'sequence', label: 'Sequences', icon: Clock }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Templates tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" />
                Employer Outreach
              </h3>
              <div className="space-y-3">
                {employerTemplates.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onSelect={setSelectedTemplate}
                    onPreview={setPreviewTemplate}
                  />
                ))}
              </div>

              <h3 className="font-bold text-gray-900 mb-3 mt-6 flex items-center gap-2">
                <Users size={16} className="text-green-600" />
                Candidate Notifications
              </h3>
              <div className="space-y-3">
                {candidateTemplates.map(t => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onSelect={setSelectedTemplate}
                    onPreview={setPreviewTemplate}
                  />
                ))}
              </div>
            </div>

            <div>
              {selectedTemplate ? (
                <EmailComposer
                  template={selectedTemplate}
                  onSend={() => {}}
                  onClose={() => setSelectedTemplate(null)}
                />
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                  <Sparkles className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium">Select a template to start composing</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click any template on the left to generate personalised outreach
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns tab */}
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Your Campaigns</h3>
              <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                <Plus size={16} /> New Campaign
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <Target className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500">No campaigns yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first outreach campaign to start generating leads</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
              </div>
            )}
          </div>
        )}

        {/* Sequence tab */}
        {activeTab === 'sequence' && (
          <div className="max-w-xl">
            <SequenceTimeline />
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-medium text-purple-900 mb-1">How sequences work</h4>
              <p className="text-sm text-purple-700">
                When you add employers to a campaign, the system will automatically send the initial email
                and schedule follow-ups at the intervals shown above. If the employer replies at any stage,
                the sequence pauses automatically and you'll be notified to continue the conversation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutreachHub;
