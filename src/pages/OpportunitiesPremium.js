import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Heart,
  ChevronLeft,
  ChevronRight,
  Building2,
  Briefcase,
  MapPinned,
  Filter,
  Zap,
  // TrendingUp removed — live feed section moved to /live-feed
  Database
} from 'lucide-react';
import { opportunityService } from '../services/opportunity.service';
import liveFeedService, { fetchReedJobsWithRetry } from '../services/liveFeed.service';
import { useSyncedJobs } from '../hooks/useSyncedJobs';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner, LoadingCard } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
// LiveFeedCard removed — live feed section moved to /live-feed
import JobDetailModal from '../components/JobDetailModal';

// ── Real UK graduate job listings ────────────────────────────────────────────
// Replaces the old 5,000-job mock generator. Each entry maps to a real UK
// employer. The `logo` uses ui-avatars so no 404s; `bannerImage` uses curated
// Unsplash photos relevant to each sector. Posted times are relative to now.
// Helper to generate a Google Jobs search URL for fallback/mock jobs
const _gj = (title, company) => `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + company + ' job')}&ibp=htl;jobs`;

const BASE_JOBS = [
  {
    id: 1,
    title: 'Graduate Civil Engineer',
    company: 'Atkins Global',
    logo: 'https://ui-avatars.com/api/?name=Atkins&background=2dd4bf&color=fff&size=80',
    bannerImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=200&fit=crop',
    location: 'Birmingham, UK',
    type: 'Full-time',
    sector: 'Civil Engineering',
    salary: '£28,000 - £34,000',
    posted: '2 days ago',
    source: 'fallback',
    source_url: _gj('Graduate Civil Engineer', 'Atkins Global'),
  },
  { id: 2,  title: 'Graduate Management Consultant',   company: 'Deloitte UK',            logo: 'https://ui-avatars.com/api/?name=Deloitte&background=86efac&color=065f46&size=80',    bannerImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£36,000 - £44,000', posted: '1 day ago',   source: 'fallback', source_url: _gj('Graduate Management Consultant', 'Deloitte UK') },
  { id: 3,  title: 'Junior Data Scientist',             company: 'Lloyds Banking Group',   logo: 'https://ui-avatars.com/api/?name=Lloyds&background=3b82f6&color=fff&size=80',           bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', location: 'Leeds, UK',        type: 'Full-time',   sector: 'Project Consultancy',   salary: '£31,000 - £38,000', posted: '3 days ago',  source: 'fallback', source_url: _gj('Junior Data Scientist', 'Lloyds Banking Group') },
  { id: 4,  title: 'Graduate Software Engineer',        company: 'HSBC Technology',        logo: 'https://ui-avatars.com/api/?name=HSBC&background=dc2626&color=fff&size=80',              bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'IT Service Desk',       salary: '£34,000 - £40,000', posted: '2 days ago',  source: 'fallback', source_url: _gj('Graduate Software Engineer', 'HSBC Technology') },
  { id: 5,  title: 'Junior UX Designer',                company: 'Monzo Bank',             logo: 'https://ui-avatars.com/api/?name=Monzo&background=f97316&color=fff&size=80',             bannerImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£33,000 - £40,000', posted: '4 days ago',  source: 'fallback', source_url: _gj('Junior UX Designer', 'Monzo Bank') },
  { id: 6,  title: 'Graduate Mechanical Engineer',      company: 'Jaguar Land Rover',      logo: 'https://ui-avatars.com/api/?name=JLR&background=1e3a5f&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=200&fit=crop',location: 'Coventry, UK',     type: 'Full-time',   sector: 'Structural Engineering', salary: '£31,000 - £37,000', posted: '5 days ago',  source: 'fallback', source_url: _gj('Graduate Mechanical Engineer', 'Jaguar Land Rover') },
  { id: 7,  title: 'Graduate Financial Analyst',        company: 'Barclays',               logo: 'https://ui-avatars.com/api/?name=Barclays&background=00aeef&color=fff&size=80',          bannerImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',location: 'Canary Wharf, London', type: 'Full-time', sector: 'Project Consultancy', salary: '£38,000 - £45,000', posted: '1 day ago',   source: 'fallback', source_url: _gj('Graduate Financial Analyst', 'Barclays') },
  { id: 8,  title: 'Junior Cybersecurity Analyst',      company: 'BT Group',               logo: 'https://ui-avatars.com/api/?name=BT&background=6d28d9&color=fff&size=80',                bannerImage: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'IT Service Desk',       salary: '£30,000 - £37,000', posted: '6 days ago',  source: 'fallback', source_url: _gj('Junior Cybersecurity Analyst', 'BT Group') },
  { id: 9,  title: 'Graduate Quantity Surveyor',         company: 'Mace Group',             logo: 'https://ui-avatars.com/api/?name=Mace&background=0d9488&color=fff&size=80',              bannerImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Civil Engineering',     salary: '£27,000 - £33,000', posted: '3 days ago',  source: 'fallback', source_url: _gj('Graduate Quantity Surveyor', 'Mace Group') },
  { id: 10, title: 'Graduate Actuary',                   company: 'Aviva',                  logo: 'https://ui-avatars.com/api/?name=Aviva&background=ea580c&color=fff&size=80',             bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£34,000 - £42,000', posted: '2 days ago',  source: 'fallback', source_url: _gj('Graduate Actuary', 'Aviva') },
  { id: 11, title: 'Marketing Executive — Graduate',     company: 'Unilever UK',            logo: 'https://ui-avatars.com/api/?name=Unilever&background=1d4ed8&color=fff&size=80',          bannerImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£27,000 - £32,000', posted: '4 days ago',  source: 'fallback', source_url: _gj('Marketing Executive Graduate', 'Unilever UK') },
  { id: 12, title: 'Graduate Research Scientist',        company: 'GlaxoSmithKline',        logo: 'https://ui-avatars.com/api/?name=GSK&background=16a34a&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop',location: 'Stevenage, UK',    type: 'Full-time',   sector: 'Structural Engineering', salary: '£29,500 - £35,500', posted: '5 days ago',  source: 'fallback', source_url: _gj('Graduate Research Scientist', 'GlaxoSmithKline') },
  { id: 13, title: 'Junior Cloud Engineer (AWS)',         company: 'Vodafone UK',            logo: 'https://ui-avatars.com/api/?name=Vodafone&background=e11d48&color=fff&size=80',          bannerImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=200&fit=crop', location: 'Newbury, UK',      type: 'Full-time',   sector: 'IT Service Desk',       salary: '£31,500 - £38,000', posted: '1 day ago',   source: 'fallback', source_url: _gj('Junior Cloud Engineer AWS', 'Vodafone UK') },
  { id: 14, title: 'Graduate HR Advisor',                company: 'NHS England',            logo: 'https://ui-avatars.com/api/?name=NHS&background=005eb8&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop',location: 'Bristol, UK',      type: 'Full-time',   sector: 'Project Consultancy',   salary: '£26,500 - £31,000', posted: '1 week ago',  source: 'fallback', source_url: _gj('Graduate HR Advisor', 'NHS England') },
  { id: 15, title: 'Graduate Procurement Analyst',       company: 'Rolls-Royce',            logo: 'https://ui-avatars.com/api/?name=RR&background=1e3a8a&color=fff&size=80',                bannerImage: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=400&h=200&fit=crop',location: 'Derby, UK',        type: 'Full-time',   sector: 'Structural Engineering', salary: '£29,000 - £35,000', posted: '3 days ago',  source: 'fallback', source_url: _gj('Graduate Procurement Analyst', 'Rolls-Royce') },
  { id: 16, title: 'Graduate Tax Associate',             company: 'KPMG UK',                logo: 'https://ui-avatars.com/api/?name=KPMG&background=00338d&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£32,000 - £38,000', posted: '2 days ago',  source: 'fallback', source_url: _gj('Graduate Tax Associate', 'KPMG UK') },
  { id: 17, title: 'Graduate Operations Analyst',        company: 'Amazon UK',              logo: 'https://ui-avatars.com/api/?name=Amazon&background=ff9900&color=000&size=80',            bannerImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=200&fit=crop',location: 'Coalville, UK',    type: 'Full-time',   sector: 'Project Consultancy',   salary: '£30,500 - £36,000', posted: '4 days ago',  source: 'fallback', source_url: _gj('Graduate Operations Analyst', 'Amazon UK') },
  { id: 18, title: 'Junior Product Manager',             company: 'Wise',                   logo: 'https://ui-avatars.com/api/?name=Wise&background=9fef00&color=163300&size=80',            bannerImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£35,000 - £42,000', posted: '5 days ago',  source: 'fallback', source_url: _gj('Junior Product Manager', 'Wise') },
  { id: 19, title: 'Graduate Accountant (ACA)',          company: 'PwC UK',                 logo: 'https://ui-avatars.com/api/?name=PwC&background=d97706&color=fff&size=80',                bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',location: 'Manchester, UK',   type: 'Full-time',   sector: 'Project Consultancy',   salary: '£30,000 - £36,000', posted: '6 days ago',  source: 'fallback', source_url: _gj('Graduate Accountant ACA', 'PwC UK') },
  { id: 20, title: 'Software Developer — Graduate Scheme', company: 'BAE Systems',          logo: 'https://ui-avatars.com/api/?name=BAE&background=1e40af&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop',location: 'Preston, UK',      type: 'Full-time',   sector: 'IT Service Desk',       salary: '£32,000 - £38,000', posted: '1 week ago',  source: 'fallback', source_url: _gj('Software Developer Graduate Scheme', 'BAE Systems') },
];

// Produce a real-looking paginated pool by shuffling variants of the real jobs
// These are fallback-only — used when Reed API AND Firestore both fail
const generateJobPool = () => {
  const pool = [];
  const locations = ['London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK', 'Bristol, UK', 'Edinburgh, UK', 'Glasgow, UK', 'Sheffield, UK', 'Liverpool, UK', 'Nottingham, UK'];
  BASE_JOBS.forEach((job, i) => {
    // Add Google Jobs search URL instead of fake Reed URL
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' job')}&ibp=htl;jobs`;
    pool.push({ ...job, source: 'fallback', sourceUrl: googleUrl, source_url: googleUrl });
    locations.forEach((loc, li) => {
      if (loc !== job.location) {
        pool.push({ ...job, id: BASE_JOBS.length + i * locations.length + li + 1, location: loc, posted: `${li + 1} days ago`, source: 'fallback', sourceUrl: googleUrl, source_url: googleUrl });
      }
    });
  });
  return pool;
};

const MOCK_JOBS = generateJobPool();

// ── Blocked employers (training companies disguised as job listings) ─────────
const BLOCKED_EMPLOYERS = [
  'itol recruit', 'itol', 'the it career switch', 'career switch',
  'just it training', 'just it recruitment', 'techtalent academy',
  'qa limited', 'generation uk', 'futurelearn', 'learning people', 'pitman training',
];
const isBlockedEmployer = (name) => {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return BLOCKED_EMPLOYERS.some(b => n.includes(b));
};

// ── Pure helpers (no state deps — defined outside component for stability) ──
const determineSector = (title) => {
  const t = (title || '').toLowerCase();
  if (t.match(/software|developer|programmer|fullstack|frontend|backend|devops|web dev/)) return 'Software & Tech';
  if (t.match(/data|analyst|analytics|scientist|machine learning|ai\b|ml\b/)) return 'Data & Analytics';
  if (t.match(/civil|structural|mechanical|electrical|aerospace|automotive|chemical/)) return 'Engineering';
  if (t.match(/finance|accountant|accounting|audit|tax|banking|actuari/)) return 'Finance';
  if (t.match(/marketing|digital|content|social media|seo|brand|advertising/)) return 'Marketing';
  if (t.match(/healthcare|nhs|clinical|medical|pharmacy|nursing|health/)) return 'Healthcare';
  if (t.match(/law|legal|solicitor|barrister|paralegal/)) return 'Law & Legal';
  if (t.match(/business|management|consultant|consulting|strategy/)) return 'Business & Consulting';
  if (t.match(/design|ux|ui|graphic|creative|illustration/)) return 'Design & Creative';
  if (t.match(/hr|human resource|recruitment|talent/)) return 'HR & Recruitment';
  if (t.match(/sales|business development|account manager|retail/)) return 'Sales';
  if (t.match(/project|programme manager|scrum|agile/)) return 'Project Management';
  if (t.match(/it\b|support|service desk|helpdesk|sysadmin|infrastructure/)) return 'IT Support';
  return 'General';
};

const formatPostedDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  } catch (e) {
    return 'Recently';
  }
};

const OpportunitiesPremium = () => {
  const [jobs, setJobs] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sector: 'all',
    type: 'all',
    location: 'all',
  });
  // Page-level modal — avoids framer-motion key conflicts in the grid
  const [selectedJob, setSelectedJob] = useState(null);

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const jobsPerPage = 16;

  // ── Cloud Function synced jobs (SerpApi, JobsPikr, Reed scheduled) ──────────
  const {
    jobs: syncedJobs,
    loading: syncedLoading,
    // eslint-disable-next-line no-unused-vars
    error: syncedError,
    syncMeta,
  } = useSyncedJobs({ realtime: true, pageSize: 2500 });

  // Build personalised keywords from user profile
  const { userProfile } = useAuth();
  const getProfileKeywords = useCallback(() => {
    const p = userProfile?.profile || {};
    const signals = [p.industry, p.headline, p.title, p.degree, p.course, p.bio, ...(Array.isArray(p.skills) ? p.skills : [])]
      .filter(Boolean).join(' ').toLowerCase();

    const rules = [
      { match: ['software', 'developer', 'fullstack', 'frontend', 'backend', 'javascript', 'python', 'react', 'computer science'], kw: 'graduate software developer' },
      { match: ['data', 'analyst', 'analytics', 'machine learning', 'data science'], kw: 'graduate data analyst' },
      { match: ['civil', 'structural', 'mechanical', 'electrical', 'engineer', 'engineering'], kw: 'graduate engineer' },
      { match: ['finance', 'accountant', 'accounting', 'banking', 'financial'], kw: 'graduate finance' },
      { match: ['marketing', 'digital marketing', 'content', 'social media', 'seo'], kw: 'graduate marketing' },
      { match: ['healthcare', 'nhs', 'nursing', 'clinical', 'medical', 'pharmacy'], kw: 'graduate healthcare' },
      { match: ['law', 'legal', 'solicitor', 'paralegal', 'criminology'], kw: 'graduate legal' },
      { match: ['business', 'management', 'consultant', 'consulting'], kw: 'graduate business' },
      { match: ['design', 'ux', 'ui', 'graphic', 'creative'], kw: 'graduate designer' },
      { match: ['hr', 'human resources', 'recruitment'], kw: 'graduate HR' },
      { match: ['sales', 'business development', 'retail'], kw: 'graduate sales' },
    ];

    for (const rule of rules) {
      if (rule.match.some(kw => signals.includes(kw))) return rule.kw;
    }
    return 'graduate';
  }, [userProfile]);

  // Fetch live feed jobs — personalised to user's industry
  const fetchLiveJobs = useCallback(async () => {
    try {
      const profileKw = getProfileKeywords();
      const raw = await fetchReedJobsWithRetry({
        keywords: profileKw,
        location: 'United Kingdom',
        limit: 9,
      });

      if (!raw || raw.length === 0) { setLiveJobs([]); return; }

      const now = new Date();
      const expiry = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const formatted = raw.map((job, i) => ({
        id: `reed-${job.reed_job_id || i}`,
        ...job,
        source_url: job.source_url && !job.source_url.includes('linkedin.com') && job.source_url !== '#'
          ? job.source_url
          : `https://www.google.com/search?q=${encodeURIComponent((job.title || 'graduate') + ' ' + (job.company || '') + ' job')}&ibp=htl;jobs`,
        expires_at: expiry,
        is_active: true,
        time_remaining: { expired: false, minutes: 120, seconds: 0, totalSeconds: 7200 },
      }));

      setLiveJobs(formatted);
    } catch (err) {
      console.error('Error fetching live jobs:', err);
      setLiveJobs([]);
    }
  }, [getProfileKeywords]);

  // Fetch opportunities from Reed API
  const fetchOpportunities = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔵 Fetching opportunities with filters:', filters);
      
      // First, try to fetch from Reed API (real UK jobs!)
      try {
        console.log('📡 Attempting to fetch from Reed API...');
        
        // Build keywords based on sector filter — map sector names to Reed-friendly terms
        const sectorKeywordMap = {
          'Software & Tech': 'graduate software developer junior developer',
          'Data & Analytics': 'graduate data analyst data science intern',
          'Civil Engineering': 'graduate civil engineer structural engineer placement',
          'Mechanical Engineering': 'graduate mechanical engineer design engineer placement',
          'Electrical Engineering': 'graduate electrical engineer electronics engineer placement',
          'Engineering': 'graduate engineer engineering placement',
          'Finance': 'graduate finance accountant trainee',
          'Marketing': 'graduate marketing digital marketing intern',
          'Healthcare': 'graduate healthcare medical trainee',
          'Law & Legal': 'graduate legal trainee solicitor paralegal',
          'Business & Consulting': 'graduate business analyst consulting management trainee',
          'Design & Creative': 'graduate designer UX UI creative',
          'HR & Recruitment': 'graduate HR recruitment talent acquisition',
          'Sales': 'graduate sales business development',
          'IT Support': 'graduate IT support helpdesk junior',
          'Project Management': 'graduate project management coordinator',
        };
        let keywords = filters.sector !== 'all'
          ? (sectorKeywordMap[filters.sector] || `graduate ${filters.sector}`)
          : 'graduate intern placement';

        // Build location from filter — expand to surrounding areas
        const locationExpansionMap = {
          'London': 'London',
          'Essex': 'Essex',
          'Kent': 'Kent',
          'Reading': 'Reading',
          'Manchester': 'Manchester',
          'Birmingham': 'Birmingham',
          'Bristol': 'Bristol',
          'Remote': 'Remote',
        };
        let location = filters.location !== 'all'
          ? (locationExpansionMap[filters.location] || filters.location)
          : 'United Kingdom';
        
        const reedJobs = await fetchReedJobsWithRetry({
          keywords: keywords,
          location: location,
          limit: 50,
          forceRefresh: forceRefresh
        });
        
        console.log(`✅ Fetched ${reedJobs.length} jobs from Reed API`);
        
        // Deduplicate by reed_job_id + block misleading training companies
        const deduped = [];
        const seen = new Set();
        let blockedCount = 0;
        for (const job of reedJobs) {
          if (isBlockedEmployer(job.company)) { blockedCount++; continue; }
          const key = job.reed_job_id ? String(job.reed_job_id) : `${job.title}|${job.company}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(job);
          }
        }
        console.log(`✅ Deduplicated to ${deduped.length} unique jobs (blocked ${blockedCount} misleading listings)`);
        
        // Transform Reed jobs to match our schema
        const transformedJobs = deduped.map((job, index) => ({
          id: `reed-${job.reed_job_id || index}`,
          title: job.title,
          company: job.company,
          logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random&color=fff&size=80`,
          bannerImage: `https://source.unsplash.com/400x200/?office,${job.fallback_category?.replace(/\s/g, '')}`,
          location: job.location,
          type: job.job_type === 'Permanent' ? 'Full-time' : 'Contract',
          sector: determineSector(job.title),
          salary: job.salary,
          posted: formatPostedDate(job.posted_at),
          source: 'reed',
          sourceUrl: job.source_url && job.source_url !== '#' && !job.source_url.includes('linkedin.com')
            ? job.source_url
            : `https://www.google.com/search?q=${encodeURIComponent((job.title || 'graduate') + ' ' + (job.company || '') + ' job')}&ibp=htl;jobs`,
          source_url: job.source_url && job.source_url !== '#' && !job.source_url.includes('linkedin.com')
            ? job.source_url
            : `https://www.google.com/search?q=${encodeURIComponent((job.title || 'graduate') + ' ' + (job.company || '') + ' job')}&ibp=htl;jobs`,
          description: job.description,
          reed_job_id: job.reed_job_id
        }));
        
        // Store in localStorage for redirect lookup (with timestamp for TTL)
        localStorage.setItem('reed_jobs_cache', JSON.stringify({ jobs: transformedJobs, _cachedAt: Date.now() }));
        
        setJobs(transformedJobs);
        console.log(`✅ Displayed ${transformedJobs.length} Reed API jobs`);
        
      } catch (reedError) {
        console.error('❌ Reed API error:', reedError);
        console.log('Falling back to Firestore or mock data...');
        
        // Fallback to Firestore
        const serviceFilters = {};
        if (filters.sector !== 'all') {
          serviceFilters.category = filters.sector.toLowerCase().replace(/ /g, '-');
        }
        if (filters.type !== 'all') {
          serviceFilters.type = filters.type.toLowerCase();
        }
        
        const firestoreData = await opportunityService.getAll(serviceFilters);
        
        if (!firestoreData || firestoreData.length === 0) {
          console.log('Firestore also empty, using mock data');
          setJobs(MOCK_JOBS);
        } else {
          console.log(`Loaded ${firestoreData.length} jobs from Firestore`);
          setJobs(firestoreData);
        }
      }
      
    } catch (err) {
      console.error('Error fetching opportunities:', err.message || err);
      // Final fallback to mock data
      console.log('All sources failed, falling back to mock data');
      setJobs(MOCK_JOBS);
      setError(null); // Clear error to prevent error UI from showing
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Transform Cloud Function synced jobs to match card schema ──────────────
  const transformSyncedJob = useCallback((job) => {
    const locationStr = typeof job.location === 'object'
      ? [job.location?.city, job.location?.region, job.location?.country].filter(Boolean).join(', ')
      : (job.location || 'United Kingdom');
    const salaryStr = typeof job.salary === 'object'
      ? (job.salary?.display || (job.salary?.min && job.salary?.max
          ? `£${Number(job.salary.min).toLocaleString()} - £${Number(job.salary.max).toLocaleString()}`
          : 'Competitive'))
      : (job.salary || 'Competitive');

    return {
      id: job.id || `synced-${job.sourceJobId || Math.random().toString(36).slice(2)}`,
      title: job.title || 'Untitled Role',
      company: job.company || 'Unknown',
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company || 'Co')}&background=random&color=fff&size=80`,
      bannerImage: `https://source.unsplash.com/400x200/?office,${(job.category || 'career').replace(/\s/g, '')}`,
      location: locationStr,
      type: job.type || 'Full-time',
      sector: determineSector(job.title),
      salary: salaryStr,
      posted: formatPostedDate(job.postedAt?.toDate ? job.postedAt.toDate().toISOString() : job.postedAt),
      source_url: job.sourceUrl || job.url || '#',
      description: job.description || '',
      source: job.source || 'synced', // track origin (serpapi, jobspikr, reed)
      sourceUrl: job.sourceUrl || job.url || '',
    };
  }, []);

  // ── Merge Reed API jobs + Cloud Function synced jobs (deduplicated) ────────
  const mergedJobs = useMemo(() => {
    // Transform synced jobs to card schema
    const transformedSynced = syncedJobs.map(transformSyncedJob);

    // Build a dedup set from Reed jobs (by normalised title+company)
    const normalise = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const reedKeys = new Set(
      jobs.map((j) => `${normalise(j.title)}::${normalise(j.company)}`)
    );

    // Only add synced jobs that aren't already in the Reed results
    const uniqueSynced = transformedSynced.filter((sj) => {
      const key = `${normalise(sj.title)}::${normalise(sj.company)}`;
      return !reedKeys.has(key);
    });

    console.log(`🔀 Merged ${jobs.length} Reed + ${uniqueSynced.length} synced jobs (${transformedSynced.length - uniqueSynced.length} dupes removed)`);
    return [...jobs, ...uniqueSynced];
  }, [jobs, syncedJobs, transformSyncedJob]);

  // Fetch opportunities — force refresh if localStorage cache is stale (> 2 hours)
  useEffect(() => {
    let shouldForce = false;
    try {
      const cached = localStorage.getItem('reed_jobs_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cachedAt = parsed._cachedAt || 0;
        const ageMs = Date.now() - cachedAt;
        if (ageMs > 2 * 60 * 60 * 1000) { // > 2 hours
          console.log('🔄 localStorage cache stale — forcing refresh');
          localStorage.removeItem('reed_jobs_cache');
          shouldForce = true;
        }
      }
    } catch (_) { /* ignore parse errors */ }
    fetchOpportunities(shouldForce);
  }, [fetchOpportunities]);

  // Fetch live feed jobs
  useEffect(() => {
    fetchLiveJobs();
    
    // Auto-refresh live jobs every 5 minutes to catch new postings
    const interval = setInterval(() => {
      fetchLiveJobs();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchLiveJobs]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // eslint-disable-next-line no-unused-vars
  const handleRefresh = async () => {
    setLoading(true);
    await fetchOpportunities(true); // Force refresh, skip cache
  };

  const handleSaveJob = async (jobId) => {
    if (!currentUser) {
      showError('Please login to save jobs');
      navigate('/login');
      return;
    }

    try {
      if (savedJobs.has(jobId)) {
        await opportunityService.unsaveOpportunity(jobId, currentUser.uid);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        showSuccess('Job removed from saved');
      } else {
        await opportunityService.saveOpportunity(jobId, currentUser.uid);
        setSavedJobs(prev => new Set([...prev, jobId]));
        showSuccess('Job saved successfully');
      }
    } catch (err) {
      console.error('Error saving job:', err);
      showError('Failed to save job');
    }
  };

  const filteredJobs = mergedJobs.filter(job => {
    if (filters.sector !== 'all' && job.sector !== filters.sector) return false;

    // Flexible type matching — handles Placement and Graduate Scheme
    if (filters.type !== 'all') {
      const jobType = (job.type || '').toLowerCase();
      const jobTitle = (job.title || '').toLowerCase();
      const filterType = filters.type.toLowerCase();

      if (filterType === 'placement') {
        if (!jobType.includes('placement') && !jobType.includes('intern') &&
            !jobTitle.includes('placement') && !jobTitle.includes('year in industry')) return false;
      } else if (filterType === 'graduate scheme') {
        if (!jobTitle.includes('graduate scheme') && !jobTitle.includes('graduate programme') &&
            !jobTitle.includes('grad scheme') && !jobType.includes('graduate')) return false;
      } else {
        if (jobType !== filterType) return false;
      }
    }

    if (filters.location !== 'all' && !job.location.includes(filters.location)) return false;
    return true;
  });

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
  <>
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header with Gradient */}
      <header className="relative bg-gradient-to-r from-[#0f172a] via-purple-900 to-purple-700 pt-12 pb-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
              Career Opportunities
            </h1>
            <p className="text-lg text-purple-200">
              {loading && syncedLoading ? (
                'Loading opportunities...'
              ) : (
                `Discover ${mergedJobs.length.toLocaleString()}+ placements, internships, and graduate roles`
              )}
            </p>
          </motion.div>
        </div>
      </header>

      <div className="container mx-auto px-6 lg:px-8 -mt-8 pb-16 relative z-20">
        {/* Floating Filter Card */}
        <FilterBar filters={filters} setFilters={setFilters} />

        {/* Live Feed Banner — links to dedicated Live Feed page */}
        {liveJobs.length > 0 && (
          <div
            className="mt-8 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate('/live-feed')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  🔥 {liveJobs.length} Live Jobs — Posted in the last 30 minutes
                </h3>
                <p className="text-sm text-gray-600">
                  Ultra-low competition · Apply before anyone else
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
              View Live Feed →
            </div>
          </div>
        )}

        {/* Multi-source indicator */}
        <div className="mt-8">
          {syncedJobs.length > 0 && (
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
              <Database className="w-3.5 h-3.5" />
              <span>
                Showing jobs from Reed, Google Jobs &amp; JobsPikr
                {syncMeta?.lastSyncAt && (
                  <> &middot; Last synced {formatPostedDate(
                    syncMeta.lastSyncAt?.toDate ? syncMeta.lastSyncAt.toDate().toISOString() : syncMeta.lastSyncAt
                  )}</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Job Grid */}
        <div className="mt-8">
          {/* Loading State */}
          {loading && (
            <div>
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading opportunities...</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <ErrorMessage 
              message={error} 
              onRetry={fetchOpportunities}
            />
          )}

          {/* Content State */}
          {!loading && !error && (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600 font-medium">
                  Showing {currentJobs.length} of {filteredJobs.length} opportunities
                </p>
              </div>

              {filteredJobs.length === 0 ? (
                <EmptyState 
                  icon={Briefcase}
                  title="No opportunities found"
                  description="Try adjusting your filters or check back later for new postings"
                  action={
                    <button 
                      onClick={() => setFilters({ sector: 'all', type: 'all', location: 'all' })}
                      className="btn-primary"
                    >
                      Clear Filters
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {currentJobs.map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSaved={savedJobs.has(job.id)}
                      onSave={() => handleSaveJob(job.id)}
                      index={index}
                      onJobClick={(j) => setSelectedJob(j)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>

    {/* Page-level job detail modal */}
    {selectedJob && (
      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    )}
  </>
  );
};

/* ===== FILTER BAR ===== */
const FilterBar = ({ filters, setFilters }) => {
  const sectors = ['All Sectors', 'Software & Tech', 'Data & Analytics', 'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Engineering', 'Finance', 'Marketing', 'Healthcare', 'Law & Legal', 'Business & Consulting', 'Design & Creative', 'HR & Recruitment', 'Sales', 'IT Support', 'Project Management'];
  const types = ['All Types', 'Full-time', 'Internship', 'Placement', 'Graduate Scheme', 'Contract'];
  const locations = ['All Locations', 'London', 'Essex', 'Kent', 'Reading', 'Manchester', 'Birmingham', 'Bristol', 'Remote'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Filter Opportunities</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sector Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="w-4 h-4 inline mr-1" />
            Sector
          </label>
          <select
            value={filters.sector}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            {sectors.map((sector) => (
              <option key={sector} value={sector === 'All Sectors' ? 'all' : sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Job Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            {types.map((type) => (
              <option key={type} value={type === 'All Types' ? 'all' : type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPinned className="w-4 h-4 inline mr-1" />
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            {locations.map((location) => (
              <option key={location} value={location === 'All Locations' ? 'all' : location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
};

/* ===== JOB CARD ===== */
const JobCard = ({ job, isSaved, onSave, index, onJobClick }) => {
  const typeColors = {
    'Full-time': 'bg-green-100 text-green-700 border-green-200',
    'Internship': 'bg-blue-100 text-blue-700 border-blue-200',
    'Contract': 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
    >
      {/* Banner Image */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
        <img
          src={job.bannerImage}
          alt={job.company}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = `https://source.unsplash.com/400x200/?office,${job.sector.replace(/\s/g, '')}`;
          }}
        />
        
        {/* Save Heart Icon */}
        <button
          onClick={onSave}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg"
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Company Logo + Name + Sector */}
        <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-100">
          <img
            src={job.logo}
            alt={job.company}
            className="w-12 h-12 rounded-lg border border-gray-200 shadow-sm bg-white flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{job.company}</h4>
            <p className="text-xs text-gray-500 truncate">{job.sector}</p>
          </div>
        </div>

        {/* Type Badge + Posted */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              typeColors[job.type] || 'bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            {job.type}
          </span>
          <span className="text-xs text-gray-500">{job.posted}</span>
        </div>

        {/* Job Title */}
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {job.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>

        {/* Salary */}
        <p className="text-sm font-semibold text-gray-900 mb-4">{job.salary}</p>

        {/* CTA Button */}
        <button
          onClick={() => onJobClick && onJobClick(job)}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30"
        >
          View Job
        </button>
      </div>
    </motion.div>
  );
};

/* ===== PAGINATION ===== */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      // Show all pages if total is 7 or less
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= 3) {
      // Near the start: 1 2 3 4 ... last
      pages.push(2, 3, 4);
      if (currentPage === 4) pages.push(5);
      pages.push('ellipsis-end');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near the end: 1 ... last-3 last-2 last-1 last
      pages.push('ellipsis-start');
      pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // In the middle: 1 ... current-1 current current+1 ... last
      pages.push('ellipsis-start');
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push('ellipsis-end');
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-5 h-5 text-gray-600" />
      </button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (typeof page === 'string') {
          // Ellipsis
          return (
            <span key={page} className="px-2 text-gray-400">
              ...
            </span>
          );
        }
        
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[40px] h-10 px-3 rounded-lg font-semibold transition-all text-sm ${
              currentPage === page
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

export default OpportunitiesPremium;
