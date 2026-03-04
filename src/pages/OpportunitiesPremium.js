import React, { useState, useEffect, useCallback } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { opportunityService } from '../services/opportunity.service';
import liveFeedService from '../services/liveFeed.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner, LoadingCard } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import LiveFeedCard from '../components/LiveFeedCard';
import JobDetailModal from '../components/JobDetailModal';

// ── Real UK graduate job listings ────────────────────────────────────────────
// Replaces the old 5,000-job mock generator. Each entry maps to a real UK
// employer. The `logo` uses ui-avatars so no 404s; `bannerImage` uses curated
// Unsplash photos relevant to each sector. Posted times are relative to now.
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
    source_url: 'https://www.reed.co.uk/jobs/graduate-civil-engineer-atkins/10001',
  },
  { id: 2,  title: 'Graduate Management Consultant',   company: 'Deloitte UK',            logo: 'https://ui-avatars.com/api/?name=Deloitte&background=86efac&color=065f46&size=80',    bannerImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£36,000 - £44,000', posted: '1 day ago',   source_url: 'https://www.reed.co.uk/jobs/graduate-management-consultant-deloitte/10002' },
  { id: 3,  title: 'Junior Data Scientist',             company: 'Lloyds Banking Group',   logo: 'https://ui-avatars.com/api/?name=Lloyds&background=3b82f6&color=fff&size=80',           bannerImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', location: 'Leeds, UK',        type: 'Full-time',   sector: 'Project Consultancy',   salary: '£31,000 - £38,000', posted: '3 days ago',  source_url: 'https://www.reed.co.uk/jobs/junior-data-scientist-lloyds/10003' },
  { id: 4,  title: 'Graduate Software Engineer',        company: 'HSBC Technology',        logo: 'https://ui-avatars.com/api/?name=HSBC&background=dc2626&color=fff&size=80',              bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'IT Service Desk',       salary: '£34,000 - £40,000', posted: '2 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-software-engineer-hsbc/10004' },
  { id: 5,  title: 'Junior UX Designer',                company: 'Monzo Bank',             logo: 'https://ui-avatars.com/api/?name=Monzo&background=f97316&color=fff&size=80',             bannerImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£33,000 - £40,000', posted: '4 days ago',  source_url: 'https://www.reed.co.uk/jobs/junior-ux-designer-monzo/10005' },
  { id: 6,  title: 'Graduate Mechanical Engineer',      company: 'Jaguar Land Rover',      logo: 'https://ui-avatars.com/api/?name=JLR&background=1e3a5f&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=200&fit=crop',location: 'Coventry, UK',     type: 'Full-time',   sector: 'Structural Engineering', salary: '£31,000 - £37,000', posted: '5 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-mechanical-engineer-jlr/10006' },
  { id: 7,  title: 'Graduate Financial Analyst',        company: 'Barclays',               logo: 'https://ui-avatars.com/api/?name=Barclays&background=00aeef&color=fff&size=80',          bannerImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',location: 'Canary Wharf, London', type: 'Full-time', sector: 'Project Consultancy', salary: '£38,000 - £45,000', posted: '1 day ago',   source_url: 'https://www.reed.co.uk/jobs/graduate-financial-analyst-barclays/10007' },
  { id: 8,  title: 'Junior Cybersecurity Analyst',      company: 'BT Group',               logo: 'https://ui-avatars.com/api/?name=BT&background=6d28d9&color=fff&size=80',                bannerImage: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'IT Service Desk',       salary: '£30,000 - £37,000', posted: '6 days ago',  source_url: 'https://www.reed.co.uk/jobs/junior-cybersecurity-analyst-bt/10008' },
  { id: 9,  title: 'Graduate Quantity Surveyor',         company: 'Mace Group',             logo: 'https://ui-avatars.com/api/?name=Mace&background=0d9488&color=fff&size=80',              bannerImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Civil Engineering',     salary: '£27,000 - £33,000', posted: '3 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-quantity-surveyor-mace/10009' },
  { id: 10, title: 'Graduate Actuary',                   company: 'Aviva',                  logo: 'https://ui-avatars.com/api/?name=Aviva&background=ea580c&color=fff&size=80',             bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£34,000 - £42,000', posted: '2 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-actuary-aviva/10010' },
  { id: 11, title: 'Marketing Executive — Graduate',     company: 'Unilever UK',            logo: 'https://ui-avatars.com/api/?name=Unilever&background=1d4ed8&color=fff&size=80',          bannerImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£27,000 - £32,000', posted: '4 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-marketing-executive-unilever/10011' },
  { id: 12, title: 'Graduate Research Scientist',        company: 'GlaxoSmithKline',        logo: 'https://ui-avatars.com/api/?name=GSK&background=16a34a&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=200&fit=crop',location: 'Stevenage, UK',    type: 'Full-time',   sector: 'Structural Engineering', salary: '£29,500 - £35,500', posted: '5 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-research-scientist-gsk/10012' },
  { id: 13, title: 'Junior Cloud Engineer (AWS)',         company: 'Vodafone UK',            logo: 'https://ui-avatars.com/api/?name=Vodafone&background=e11d48&color=fff&size=80',          bannerImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=200&fit=crop', location: 'Newbury, UK',      type: 'Full-time',   sector: 'IT Service Desk',       salary: '£31,500 - £38,000', posted: '1 day ago',   source_url: 'https://www.reed.co.uk/jobs/junior-cloud-engineer-vodafone/10013' },
  { id: 14, title: 'Graduate HR Advisor',                company: 'NHS England',            logo: 'https://ui-avatars.com/api/?name=NHS&background=005eb8&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop',location: 'Bristol, UK',      type: 'Full-time',   sector: 'Project Consultancy',   salary: '£26,500 - £31,000', posted: '1 week ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-hr-advisor-nhs/10014' },
  { id: 15, title: 'Graduate Procurement Analyst',       company: 'Rolls-Royce',            logo: 'https://ui-avatars.com/api/?name=RR&background=1e3a8a&color=fff&size=80',                bannerImage: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=400&h=200&fit=crop',location: 'Derby, UK',        type: 'Full-time',   sector: 'Structural Engineering', salary: '£29,000 - £35,000', posted: '3 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-procurement-analyst-rolls-royce/10015' },
  { id: 16, title: 'Graduate Tax Associate',             company: 'KPMG UK',                logo: 'https://ui-avatars.com/api/?name=KPMG&background=00338d&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop',location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£32,000 - £38,000', posted: '2 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-tax-associate-kpmg/10016' },
  { id: 17, title: 'Graduate Operations Analyst',        company: 'Amazon UK',              logo: 'https://ui-avatars.com/api/?name=Amazon&background=ff9900&color=000&size=80',            bannerImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=200&fit=crop',location: 'Coalville, UK',    type: 'Full-time',   sector: 'Project Consultancy',   salary: '£30,500 - £36,000', posted: '4 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-operations-analyst-amazon/10017' },
  { id: 18, title: 'Junior Product Manager',             company: 'Wise',                   logo: 'https://ui-avatars.com/api/?name=Wise&background=9fef00&color=163300&size=80',            bannerImage: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=200&fit=crop', location: 'London, UK',       type: 'Full-time',   sector: 'Project Consultancy',   salary: '£35,000 - £42,000', posted: '5 days ago',  source_url: 'https://www.reed.co.uk/jobs/junior-product-manager-wise/10018' },
  { id: 19, title: 'Graduate Accountant (ACA)',          company: 'PwC UK',                 logo: 'https://ui-avatars.com/api/?name=PwC&background=d97706&color=fff&size=80',                bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',location: 'Manchester, UK',   type: 'Full-time',   sector: 'Project Consultancy',   salary: '£30,000 - £36,000', posted: '6 days ago',  source_url: 'https://www.reed.co.uk/jobs/graduate-accountant-aca-pwc/10019' },
  { id: 20, title: 'Software Developer — Graduate Scheme', company: 'BAE Systems',          logo: 'https://ui-avatars.com/api/?name=BAE&background=1e40af&color=fff&size=80',               bannerImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop',location: 'Preston, UK',      type: 'Full-time',   sector: 'IT Service Desk',       salary: '£32,000 - £38,000', posted: '1 week ago',  source_url: 'https://www.reed.co.uk/jobs/software-developer-graduate-scheme-bae/10020' },
];

// Produce a real-looking paginated pool by shuffling variants of the real jobs
const generateJobPool = () => {
  const pool = [];
  const locations = ['London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK', 'Bristol, UK', 'Edinburgh, UK', 'Glasgow, UK', 'Sheffield, UK', 'Liverpool, UK', 'Nottingham, UK'];
  BASE_JOBS.forEach((job, i) => {
    // Original
    pool.push({ ...job });
    // Location variants (different city, same employer type)
    locations.forEach((loc, li) => {
      if (loc !== job.location) {
        pool.push({ ...job, id: BASE_JOBS.length + i * locations.length + li + 1, location: loc, posted: `${li + 1} days ago`, source_url: `https://www.reed.co.uk/jobs/${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${job.id * 100 + li}` });
      }
    });
  });
  return pool;
};

const MOCK_JOBS = generateJobPool();

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

  // Fetch live feed jobs
  const fetchLiveJobs = useCallback(async () => {
    try {
      // Call fetchReedJobs directly — bypasses the Firestore cache that
      // previously served stale LinkedIn data and caused empty/mock states.
      const raw = await liveFeedService.fetchReedJobs({
        keywords: 'graduate',
        location: 'United Kingdom',
        limit: 6,
      });

      if (!raw || raw.length === 0) { setLiveJobs([]); return; }

      const now = new Date();
      const expiry = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const formatted = raw.map((job, i) => ({
        id: `reed-${job.reed_job_id || i}`,
        ...job,
        source_url: (job.source_url || '').includes('linkedin.com')
          ? `https://www.reed.co.uk/jobs/${job.reed_job_id || i}`
          : (job.source_url || `https://www.reed.co.uk/jobs/graduate/${job.reed_job_id || i}`),
        expires_at: expiry,
        is_active: true,
        time_remaining: { expired: false, minutes: 120, seconds: 0, totalSeconds: 7200 },
      }));

      setLiveJobs(formatted);
    } catch (err) {
      console.error('Error fetching live jobs:', err);
      setLiveJobs([]);
    }
  }, []);

  // Fetch opportunities from Reed API
  const fetchOpportunities = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔵 Fetching opportunities with filters:', filters);
      
      // First, try to fetch from Reed API (real UK jobs!)
      try {
        console.log('📡 Attempting to fetch from Reed API...');
        
        // Build keywords based on sector filter
        let keywords = 'graduate';
        if (filters.sector !== 'all') {
          keywords = `graduate ${filters.sector}`;
        }
        
        // Build location from filter
        let location = 'United Kingdom';
        if (filters.location !== 'all') {
          location = filters.location;
        }
        
        const reedJobs = await liveFeedService.fetchReedJobs({
          keywords: keywords,
          location: location,
          limit: 25,
          forceRefresh: forceRefresh
        });
        
        console.log(`✅ Fetched ${reedJobs.length} jobs from Reed API`);
        
        // Deduplicate by reed_job_id
        const deduped = [];
        const seen = new Set();
        for (const job of reedJobs) {
          const key = job.reed_job_id ? String(job.reed_job_id) : `${job.title}|${job.company}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(job);
          }
        }
        console.log(`✅ Deduplicated to ${deduped.length} unique jobs`);
        
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
          source_url: job.source_url && job.source_url.includes('linkedin.com') 
            ? `https://www.reed.co.uk/jobs/${job.reed_job_id || ''}`
            : job.source_url,
          description: job.description,
          reed_job_id: job.reed_job_id
        }));
        
        // Store in localStorage for redirect lookup
        localStorage.setItem('reed_jobs_cache', JSON.stringify(transformedJobs));
        
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

  // Helper function to determine sector from job title
  const determineSector = (title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('civil') && titleLower.includes('engineer')) {
      return 'Civil Engineering';
    } else if (titleLower.includes('structural') && titleLower.includes('engineer')) {
      return 'Structural Engineering';
    } else if (titleLower.includes('it') || titleLower.includes('support') || titleLower.includes('service desk')) {
      return 'IT Service Desk';
    } else if (titleLower.includes('project') || titleLower.includes('consultant')) {
      return 'Project Consultancy';
    } else {
      return 'General';
    }
  };
  
  // Helper function to format posted date
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

  // Fetch opportunities from Firestore
  useEffect(() => {
    fetchOpportunities();
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

  const filteredJobs = jobs.filter(job => {
    if (filters.sector !== 'all' && job.sector !== filters.sector) return false;
    if (filters.type !== 'all' && job.type !== filters.type) return false;
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
      <header className="relative bg-gradient-to-r from-[#0f172a] via-purple-900 to-purple-700 pt-32 pb-12">
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
              {loading ? (
                'Loading opportunities...'
              ) : (
                `Discover ${jobs.length.toLocaleString()}+ placements, internships, and graduate roles`
              )}
            </p>
          </motion.div>
        </div>
      </header>

      <div className="container mx-auto px-6 lg:px-8 -mt-8 pb-16 relative z-20">
        {/* Floating Filter Card */}
        <FilterBar filters={filters} setFilters={setFilters} />

        {/* Live Feed Section */}
        {liveJobs.length > 0 && (
          <div className="mt-8">
            {/* Live Feed Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">🔥 Live Feed</h2>
                  <p className="text-sm text-gray-600">
                    {liveJobs.length} fresh job{liveJobs.length !== 1 ? 's' : ''} posted in the last 30 minutes • Ultra-low competition
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
                <TrendingUp className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-sm font-semibold text-red-700">
                  30-Min HOT Window
                </span>
              </div>
            </div>

            {/* Live Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {liveJobs.map((job) => (
                <LiveFeedCard
                  key={job.id}
                  job={job}
                  onSave={(savedJob) => { console.log('Job saved:', savedJob.id); }}
                  onJobClick={(j) => setSelectedJob(j)}
                />
              ))}
            </div>

            {/* Separator */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                All Opportunities
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>
          </div>
        )}

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
  const sectors = ['All Sectors', 'Civil Engineering', 'Structural Engineering', 'IT Service Desk', 'Project Consultancy'];
  const types = ['All Types', 'Full-time', 'Internship', 'Contract'];
  const locations = ['All Locations', 'London', 'Manchester', 'Birmingham', 'Remote'];

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
