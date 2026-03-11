/**
 * CompleteProfile — Full student profile editor with 3 sections:
 *   1. Skills & Expertise  (grouped by category, proficiency levels)
 *   2. Education            (degrees, grades, modules)
 *   3. Qualities & Strengths (self-rated competencies)
 *
 * Two-way sync: reads from and writes to userProfile.profileData in Firestore.
 * The ATS CV Builder also reads/writes from the same profileData, keeping both in sync.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  User,
  GraduationCap,
  Sparkles,
  Wrench,
  Star,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Award,
  BookOpen,
  Target,
  Zap,
  X,
} from 'lucide-react';

// ─── Skill Category Presets ──────────────────────────────────────────────────
const SKILL_CATEGORIES = [
  'Technical',
  'Software & Tools',
  'Languages',
  'Frameworks',
  'Data & Analytics',
  'Engineering',
  'Compliance & Standards',
  'Communication',
  'Other',
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'bg-gray-200 text-gray-700' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
  { value: 'advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-700' },
  { value: 'expert', label: 'Expert', color: 'bg-green-100 text-green-700' },
];

const QUALITY_PRESETS = [
  'Leadership', 'Teamwork', 'Problem Solving', 'Communication',
  'Time Management', 'Adaptability', 'Critical Thinking', 'Creativity',
  'Attention to Detail', 'Initiative', 'Resilience', 'Collaboration',
  'Analytical Thinking', 'Conflict Resolution', 'Emotional Intelligence',
  'Project Management', 'Decision Making', 'Public Speaking',
];

// ─── Empty data creators ────────────────────────────────────────────────────
const emptySkill = () => ({ name: '', category: 'Technical', proficiency: 'intermediate' });
const emptyEducation = () => ({
  degree: '',
  institution: '',
  location: '',
  startDate: '',
  endDate: '',
  grade: '',
  modules: '',
  dissertation: '',
});
const emptyQuality = () => ({ name: '', confidence: 3, description: '' });

// ─── Default profile data ───────────────────────────────────────────────────
const defaultProfileData = () => ({
  skills: [emptySkill()],
  education: [emptyEducation()],
  qualities: [emptyQuality()],
  completedSections: [],
});


// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function CompleteProfile() {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [profileData, setProfileData] = useState(defaultProfileData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('skills');
  const [hasChanges, setHasChanges] = useState(false);

  // ── Load existing profile data from Firestore ──────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) { setLoading(false); return; }
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const pd = data.profileData || {};
          setProfileData({
            skills: pd.skills?.length > 0 ? pd.skills : [emptySkill()],
            education: pd.education?.length > 0 ? pd.education : [emptyEducation()],
            qualities: pd.qualities?.length > 0 ? pd.qualities : [emptyQuality()],
            completedSections: pd.completedSections || [],
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
      setLoading(false);
    };
    loadProfile();
  }, [currentUser?.uid]);

  // ── Save to Firestore ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!currentUser?.uid) return;
    setSaving(true);
    try {
      // Clean empty entries
      const cleanSkills = profileData.skills.filter(s => s.name.trim());
      const cleanEducation = profileData.education.filter(e => e.degree.trim() || e.institution.trim());
      const cleanQualities = profileData.qualities.filter(q => q.name.trim());

      // Determine completed sections
      const completed = [];
      if (cleanSkills.length > 0) completed.push('skills');
      if (cleanEducation.length > 0) completed.push('education');
      if (cleanQualities.length > 0) completed.push('qualities');

      const dataToSave = {
        skills: cleanSkills,
        education: cleanEducation,
        qualities: cleanQualities,
        completedSections: completed,
      };

      // Save to Firestore under profileData
      await setDoc(doc(db, 'users', currentUser.uid), {
        profileData: dataToSave,
        updatedAt: new Date(),
      }, { merge: true });

      // Also generate flattened skills array for CV Builder sync
      // CV Builder expects: skills[] as ["Category: skill1, skill2, ..."]
      const skillsByCategory = {};
      cleanSkills.forEach(s => {
        if (!skillsByCategory[s.category]) skillsByCategory[s.category] = [];
        skillsByCategory[s.category].push(s.name);
      });
      const flatSkills = Object.entries(skillsByCategory).map(
        ([cat, items]) => `${cat}: ${items.join(', ')}`
      );

      // Flatten education for CV Builder sync
      const flatEducation = cleanEducation.map(e => ({
        degree: e.degree,
        institution: e.institution,
        dates: [e.startDate, e.endDate].filter(Boolean).join(' - '),
        grade: e.grade,
      }));

      // Save CV-compatible data
      await setDoc(doc(db, 'users', currentUser.uid), {
        cvSyncData: {
          skills: flatSkills,
          education: flatEducation,
          qualities: cleanQualities.map(q => q.name),
          lastSynced: new Date(),
        },
      }, { merge: true });

      setHasChanges(false);
      showSuccess('Profile saved successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      showError('Failed to save profile');
    }
    setSaving(false);
  }, [currentUser?.uid, profileData, showSuccess, showError]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateField = useCallback((section, index, field, value) => {
    setProfileData(prev => {
      const updated = { ...prev };
      updated[section] = [...prev[section]];
      updated[section][index] = { ...updated[section][index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  }, []);

  const addItem = useCallback((section, creator) => {
    setProfileData(prev => ({
      ...prev,
      [section]: [...prev[section], creator()],
    }));
    setHasChanges(true);
  }, []);

  const removeItem = useCallback((section, index) => {
    setProfileData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  }, []);

  // ── Completion calculation ─────────────────────────────────────────────────
  const completion = useMemo(() => {
    const filledSkills = profileData.skills.filter(s => s.name.trim()).length;
    const filledEdu = profileData.education.filter(e => e.degree.trim() || e.institution.trim()).length;
    const filledQual = profileData.qualities.filter(q => q.name.trim()).length;

    const sections = [
      { id: 'skills', label: 'Skills & Expertise', filled: filledSkills > 0, count: filledSkills },
      { id: 'education', label: 'Education', filled: filledEdu > 0, count: filledEdu },
      { id: 'qualities', label: 'Qualities & Strengths', filled: filledQual > 0, count: filledQual },
    ];

    const done = sections.filter(s => s.filled).length;
    const pct = Math.round((done / sections.length) * 100);
    return { sections, done, total: sections.length, pct };
  }, [profileData]);

  const userName = userProfile?.profile?.fullName || userProfile?.profile?.firstName || 'there';

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50" style={{ minHeight: '100%' }}>
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div className="bg-gray-50" style={{ paddingBottom: hasChanges ? '7rem' : '3rem', minHeight: '100%' }}>
      {/* ── Header — sticks below the fixed navbar (top-20 = 5rem) ──────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900" style={{ fontSize: '1.5rem', lineHeight: '1.3' }}>
                Complete Your Profile
              </h1>
              <p className="text-gray-500 mt-1" style={{ fontSize: '0.9rem' }}>
                Hi {userName} — fill in your details to unlock personalised job matches and power your CV.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Completion ring */}
              <div className="relative w-11 h-11">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="22" cy="22" r="18" fill="none"
                    stroke={completion.pct === 100 ? '#22c55e' : '#8b5cf6'}
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - completion.pct / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                  {completion.pct}%
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: hasChanges ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#e5e7eb',
                  color: hasChanges ? '#fff' : '#9ca3af',
                  cursor: hasChanges ? 'pointer' : 'default',
                }}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Section tabs */}
          <nav className="flex gap-1 mt-5 -mb-px">
            {[
              { id: 'skills', label: 'Skills & Expertise', icon: Wrench },
              { id: 'education', label: 'Education', icon: GraduationCap },
              { id: 'qualities', label: 'Qualities & Strengths', icon: Star },
            ].map(tab => {
              const sec = completion.sections.find(s => s.id === tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-semibold transition-colors ${
                    activeSection === tab.id
                      ? 'bg-gray-50 text-purple-700 border border-gray-200 border-b-gray-50 -mb-px'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  style={{ fontSize: '0.875rem' }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {sec?.filled && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8">

        {/* ════════════════ SKILLS & EXPERTISE ════════════════ */}
        {activeSection === 'skills' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900" style={{ fontSize: '1.2rem' }}>Skills & Expertise</h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.875rem' }}>Group your skills by category with proficiency levels.</p>
              </div>
              <button
                onClick={() => addItem('skills', emptySkill)}
                className="flex items-center gap-1.5 px-4 py-2.5 font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                style={{ fontSize: '0.875rem' }}
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>

            {profileData.skills.map((skill, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Skill name */}
                <input
                  type="text"
                  value={skill.name}
                  onChange={e => updateField('skills', i, 'name', e.target.value)}
                  placeholder="e.g. Python, AutoCAD, Project Management..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ fontSize: '0.9rem' }}
                />

                {/* Category dropdown */}
                <select
                  value={skill.category}
                  onChange={e => updateField('skills', i, 'category', e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                  style={{ minWidth: '11rem', fontSize: '0.875rem' }}
                >
                  {SKILL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Proficiency */}
                <div className="flex gap-1.5">
                  {PROFICIENCY_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => updateField('skills', i, 'proficiency', level.value)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                        skill.proficiency === level.value
                          ? level.color + ' ring-2 ring-offset-1 ring-purple-300'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                      style={{ fontSize: '0.8rem' }}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem('skills', i)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}

            {profileData.skills.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No skills added yet</p>
                <button
                  onClick={() => addItem('skills', emptySkill)}
                  className="text-sm text-purple-600 font-medium hover:text-purple-700"
                >
                  + Add your first skill
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ EDUCATION ════════════════ */}
        {activeSection === 'education' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900" style={{ fontSize: '1.2rem' }}>Education</h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.875rem' }}>Add your degrees, certifications, and relevant coursework.</p>
              </div>
              <button
                onClick={() => addItem('education', emptyEducation)}
                className="flex items-center gap-1.5 px-4 py-2.5 font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                style={{ fontSize: '0.875rem' }}
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>

            {profileData.education.map((edu, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 sm:p-7 space-y-5 relative">
                <button
                  onClick={() => removeItem('education', i)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>Degree / Qualification *</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={e => updateField('education', i, 'degree', e.target.value)}
                      placeholder="e.g. BSc Civil Engineering"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>Institution *</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={e => updateField('education', i, 'institution', e.target.value)}
                      placeholder="e.g. University of Manchester"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>Start Date</label>
                    <input
                      type="text"
                      value={edu.startDate}
                      onChange={e => updateField('education', i, 'startDate', e.target.value)}
                      placeholder="e.g. Sep 2021"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>End Date</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={e => updateField('education', i, 'endDate', e.target.value)}
                      placeholder="e.g. Jun 2024 or Present"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>Grade / Classification</label>
                    <input
                      type="text"
                      value={edu.grade}
                      onChange={e => updateField('education', i, 'grade', e.target.value)}
                      placeholder="e.g. First Class (1:1), 3.8 GPA"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>Relevant Modules / Coursework</label>
                  <input
                    type="text"
                    value={edu.modules}
                    onChange={e => updateField('education', i, 'modules', e.target.value)}
                    placeholder="e.g. Structural Mechanics, Fluid Dynamics, Project Management"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 mb-1.5" style={{ fontSize: '0.8rem' }}>Dissertation / Final Year Project</label>
                  <input
                    type="text"
                    value={edu.dissertation}
                    onChange={e => updateField('education', i, 'dissertation', e.target.value)}
                    placeholder="e.g. Optimising reinforced concrete beam design using FEA"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            ))}

            {profileData.education.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No education added yet</p>
                <button
                  onClick={() => addItem('education', emptyEducation)}
                  className="text-sm text-purple-600 font-medium hover:text-purple-700"
                >
                  + Add your first qualification
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ QUALITIES & STRENGTHS ════════════════ */}
        {activeSection === 'qualities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900" style={{ fontSize: '1.2rem' }}>Qualities & Strengths</h2>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: '0.875rem' }}>Rate your personal strengths — these help match you to the right roles.</p>
              </div>
              <button
                onClick={() => addItem('qualities', emptyQuality)}
                className="flex items-center gap-1.5 px-4 py-2.5 font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                style={{ fontSize: '0.875rem' }}
              >
                <Plus className="w-4 h-4" />
                Add Quality
              </button>
            </div>

            {/* Quick-add preset chips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="font-semibold text-gray-500 mb-3" style={{ fontSize: '0.8rem' }}>Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {QUALITY_PRESETS.filter(
                  q => !profileData.qualities.some(existing => existing.name.toLowerCase() === q.toLowerCase())
                ).map(preset => (
                  <button
                    key={preset}
                    onClick={() => {
                      setProfileData(prev => ({
                        ...prev,
                        qualities: [...prev.qualities.filter(q => q.name.trim()), { name: preset, confidence: 3, description: '' }],
                      }));
                      setHasChanges(true);
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-600 rounded-lg font-medium transition-colors border border-gray-100 hover:border-purple-200"
                    style={{ fontSize: '0.8rem' }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {profileData.qualities.filter(q => q.name.trim()).length > 0 && (
              <div className="space-y-3">
                {profileData.qualities.map((quality, i) => {
                  if (!quality.name.trim() && profileData.qualities.length > 1) return null;
                  return (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                      {/* Name */}
                      <input
                        type="text"
                        value={quality.name}
                        onChange={e => updateField('qualities', i, 'name', e.target.value)}
                        placeholder="Quality name..."
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                        style={{ minWidth: '10rem', fontSize: '0.9rem' }}
                      />

                      {/* Confidence 1-5 stars */}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 mr-1" style={{ fontSize: '0.8rem' }}>Confidence:</span>
                        {[1, 2, 3, 4, 5].map(level => (
                          <button
                            key={level}
                            onClick={() => updateField('qualities', i, 'confidence', level)}
                            className="transition-colors"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                level <= quality.confidence
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Short description */}
                      <input
                        type="text"
                        value={quality.description}
                        onChange={e => updateField('qualities', i, 'description', e.target.value)}
                        placeholder="Brief example (optional)..."
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        style={{ fontSize: '0.875rem' }}
                      />

                      {/* Remove */}
                      <button
                        onClick={() => removeItem('qualities', i)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {profileData.qualities.filter(q => q.name.trim()).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No qualities added yet</p>
                <p className="text-xs text-gray-400">Use the quick-add chips above or add custom ones.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Floating save bar (when changes detected) ─────────────────────── */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5 pointer-events-none">
            <div className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl shadow-2xl flex items-center gap-5 pointer-events-auto" style={{ maxWidth: '28rem' }}>
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span style={{ fontSize: '0.875rem' }}>You have unsaved changes</span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg font-semibold transition-colors flex-shrink-0"
                style={{ fontSize: '0.875rem' }}
              >
                {saving ? 'Saving...' : 'Save Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
