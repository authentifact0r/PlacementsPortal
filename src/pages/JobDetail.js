import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Heart,
  Share2,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { opportunityService } from '../services/opportunity.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApplicationModal } from '../components/ApplicationModal';
import { LoadingScreen } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

// Mock job data (same as in OpportunitiesPremium)
const MOCK_JOBS = [
  {
    id: 1,
    title: 'Graduate Civil Engineer',
    company: 'BuildTech Solutions',
    logo: 'https://ui-avatars.com/api/?name=BuildTech&background=2dd4bf&color=fff&size=120',
    bannerImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=400&fit=crop',
    location: 'London, UK',
    type: 'Full-time',
    sector: 'Civil Engineering',
    salary: '£28,000 - £32,000',
    posted: '2 days ago',
    description: 'We are seeking a talented Graduate Civil Engineer to join our growing team. You will work on exciting infrastructure projects across the UK, gaining hands-on experience in all phases of civil engineering design and construction.',
    responsibilities: [
      'Assist in the design and planning of civil engineering projects',
      'Conduct site inspections and prepare technical reports',
      'Collaborate with senior engineers on project delivery',
      'Ensure compliance with health and safety regulations',
      'Participate in client meetings and presentations',
    ],
    requirements: [
      'Bachelor\'s degree in Civil Engineering or related field',
      'Strong analytical and problem-solving skills',
      'Proficiency in AutoCAD and civil engineering software',
      'Excellent communication and teamwork abilities',
      'UK driving license preferred',
    ],
    benefits: [
      'Competitive salary with annual reviews',
      'Professional development and training opportunities',
      'Pension scheme and health insurance',
      '25 days annual leave plus bank holidays',
      'Flexible working arrangements',
      'Employee assistance program',
    ],
    companyAbout: 'BuildTech Solutions is a leading civil engineering consultancy with over 20 years of experience. We specialize in infrastructure, transportation, and environmental projects across the UK.',
    deadline: '2026-03-15',
  },
  {
    id: 2,
    title: 'Structural Engineering Intern',
    company: 'DesignPro Ltd',
    logo: 'https://ui-avatars.com/api/?name=DesignPro&background=f59e0b&color=fff&size=120',
    bannerImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=400&fit=crop',
    location: 'Manchester, UK',
    type: 'Internship',
    sector: 'Structural Engineering',
    salary: '£22,000',
    posted: '5 days ago',
    description: '6-month internship working on residential and commercial building projects. Perfect opportunity for recent graduates to gain practical experience.',
    responsibilities: [
      'Support structural analysis and design work',
      'Create technical drawings using CAD software',
      'Assist with calculations and structural reports',
      'Participate in site visits and inspections',
    ],
    requirements: [
      'Pursuing or completed degree in Structural/Civil Engineering',
      'Basic knowledge of structural design principles',
      'Familiarity with CAD software',
      'Eager to learn and develop skills',
    ],
    benefits: [
      'Hands-on project experience',
      'Mentorship from senior engineers',
      'Potential for permanent role after internship',
      'Training and development support',
    ],
    companyAbout: 'DesignPro Ltd is an innovative structural engineering firm focused on sustainable design solutions.',
    deadline: '2026-03-10',
  },
  {
    id: 3,
    title: 'IT Service Desk Analyst',
    company: 'TechSupport Global',
    logo: 'https://ui-avatars.com/api/?name=TechSupport&background=3b82f6&color=fff&size=120',
    bannerImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=400&fit=crop',
    location: 'Remote',
    type: 'Full-time',
    sector: 'IT Service Desk',
    salary: '£25,000 - £28,000',
    posted: '1 week ago',
    description: 'Join our growing IT support team providing technical assistance to clients across multiple industries. Fully remote position with excellent career progression.',
    responsibilities: [
      'Provide first-line technical support via phone, email, and chat',
      'Troubleshoot hardware and software issues',
      'Document and escalate complex issues',
      'Maintain IT support knowledge base',
    ],
    requirements: [
      'Strong technical aptitude and problem-solving skills',
      'Excellent communication skills',
      'Basic networking knowledge',
      'Customer service experience preferred',
    ],
    benefits: [
      'Fully remote working',
      'Company laptop and equipment',
      'Career progression opportunities',
      'Training and certifications',
    ],
    companyAbout: 'TechSupport Global provides IT support services to businesses worldwide.',
    deadline: '2026-03-20',
  },
  // Add more mock jobs as needed
];

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [job, setJob] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const fetchJobDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔵 Fetching job details for ID:', id);
      
      // Check if this is a Reed API job (ID starts with "reed-")
      if (id && id.toString().startsWith('reed-')) {
        console.log('📡 Reed API job detected, checking localStorage cache...');
        
        // Try to get from localStorage cache
        try {
          const reedJobsCache = localStorage.getItem('reed_jobs_cache');
          if (reedJobsCache) {
            const reedJobs = JSON.parse(reedJobsCache);
            const foundJob = reedJobs.find(j => j.id === id);
            
            if (foundJob) {
              console.log('✅ Found Reed job in cache:', foundJob.title);
              
              // Ensure all required fields exist with defaults
              const enrichedJob = {
                ...foundJob,
                description: foundJob.description || 'No description available.',
                responsibilities: foundJob.responsibilities || ['Details available on application'],
                requirements: foundJob.requirements || ['See job description for details'],
                benefits: foundJob.benefits || ['Competitive benefits package'],
                companyAbout: foundJob.companyAbout || `${foundJob.company} is hiring for this position.`,
                deadline: foundJob.deadline || null,
              };
              
              setJob(enrichedJob);
              setLoading(false);
              return;
            }
          }
          console.warn('⚠️ Reed job not found in cache');
        } catch (cacheError) {
          console.error('Error reading Reed cache:', cacheError);
        }
      }
      
      // Try Firestore for regular jobs
      const data = await opportunityService.getById(id);
      
      if (!data) {
        // Fallback to mock data
        console.log('Job not in Firestore, using mock data');
        const foundJob = MOCK_JOBS.find((j) => j.id === parseInt(id));
        if (foundJob) {
          setJob(foundJob);
        } else {
          console.error('❌ Job not found in any source');
          setError('Job not found. It may have been removed or expired.');
        }
      } else {
        console.log('Loaded job from Firestore:', data.id);
        setJob(data);
      }
    } catch (err) {
      console.error('Error fetching job:', err.message || err);
      // Don't show error UI, just silently fall back to mock data
      console.log('Falling back to mock data due to error');
      const foundJob = MOCK_JOBS.find((j) => j.id === parseInt(id));
      if (foundJob) {
        setJob(foundJob);
        setError(null); // Clear error to prevent error UI
      } else {
        setError('Unable to load job details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkApplicationStatus = useCallback(async () => {
    if (!currentUser || !job) return;
    
    try {
      const applied = await opportunityService.hasApplied(job.id, currentUser.uid);
      setHasApplied(applied);
    } catch (err) {
      console.error('Error checking application status:', err);
    }
  }, [currentUser, job]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  // Check if user has already applied
  useEffect(() => {
    checkApplicationStatus();
  }, [checkApplicationStatus]);

  const handleApply = () => {
    // Check if this is a Reed API job (external job)
    if (job && job.source_url && id.toString().startsWith('reed-')) {
      console.log('🔗 Redirecting to external Reed job:', job.source_url);
      // Open the external job URL in a new tab
      window.open(job.source_url, '_blank', 'noopener,noreferrer');
      showInfo('Opening job application page...');
      return;
    }

    // For internal jobs (Firestore), require login
    if (!currentUser) {
      showInfo('Please login to apply for this position');
      navigate('/login', { state: { from: `/opportunities/${id}` } });
      return;
    }

    if (hasApplied) {
      showInfo('You have already applied to this position');
      return;
    }

    setShowApplicationModal(true);
  };

  const handleSave = async () => {
    if (!currentUser) {
      showInfo('Please login to save jobs');
      navigate('/login', { state: { from: `/opportunities/${id}` } });
      return;
    }

    try {
      if (isSaved) {
        await opportunityService.unsaveOpportunity(job.id, currentUser.uid);
        setIsSaved(false);
        showSuccess('Job removed from saved');
      } else {
        await opportunityService.saveOpportunity(job.id, currentUser.uid);
        setIsSaved(true);
        showSuccess('Job saved successfully');
      }
    } catch (err) {
      console.error('Error saving job:', err);
      showError('Failed to save job');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job: ${job.title} at ${job.company}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showSuccess('Link copied to clipboard!');
    }
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    fetchJobDetails(); // Refresh job data
  };

  if (loading) {
    return <LoadingScreen message="Loading job details..." />;
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <ErrorMessage 
            message={error} 
            onRetry={fetchJobDetails}
          />
          <div className="mt-6 text-center">
            <Link to="/opportunities" className="btn-secondary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist.</p>
          <Link to="/opportunities" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Opportunities
          </Link>
        </div>
      </div>
    );
  }

  const typeColors = {
    'Full-time': 'bg-green-100 text-green-700 border-green-200',
    'Internship': 'bg-blue-100 text-blue-700 border-blue-200',
    'Contract': 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-br from-purple-900 via-purple-700 to-purple-600 overflow-hidden">
        <img
          src={job.bannerImage}
          alt={job.company}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50"></div>

        {/* Back Button */}
        <div className="container mx-auto px-6 lg:px-8 pt-28 relative z-10">
          <button
            onClick={() => navigate('/opportunities')}
            className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Opportunities</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-8 -mt-20 pb-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8"
            >
              <div className="flex items-start gap-6">
                <img
                  src={job.logo}
                  alt={job.company}
                  className="w-20 h-20 rounded-xl border-4 border-white shadow-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {job.title}
                      </h1>
                      <p className="text-xl text-gray-600 font-medium">{job.company}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full border ${
                        typeColors[job.type]
                      }`}
                    >
                      {job.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{job.sector}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Posted {job.posted}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{job.description}</p>

              <h3 className="text-xl font-bold text-gray-900 mb-3">Key Responsibilities</h3>
              <ul className="space-y-2 mb-6">
                {job.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-3">Requirements</h3>
              <ul className="space-y-2 mb-6">
                {job.requirements.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-3">Benefits</h3>
              <ul className="space-y-2">
                {job.benefits.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Company About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                About {job.company}
              </h2>
              <p className="text-gray-700 leading-relaxed">{job.companyAbout}</p>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {hasApplied ? 'Application Status' : 'Apply for this job'}
              </h3>

              {hasApplied ? (
                <div className="w-full bg-green-50 border-2 border-green-200 text-green-700 font-semibold py-3 px-4 rounded-lg mb-3 flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Application Submitted
                </div>
              ) : (
                <button 
                  onClick={handleApply}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 mb-3"
                >
                  {id && id.toString().startsWith('reed-') ? 'Apply on Reed.co.uk' : 'Apply Now'}
                </button>
              )}

              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleSave}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all ${
                    isSaved
                      ? 'border-red-500 text-red-500 bg-red-50'
                      : 'border-gray-200 text-gray-700 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isSaved ? 'fill-red-500' : ''}`}
                  />
                  <span className="font-medium">{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-gray-200 text-gray-700 hover:border-purple-500 hover:text-purple-500 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Application Deadline</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(job.deadline).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Job Type</p>
                    <p className="font-semibold text-gray-900">{job.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold text-gray-900">{job.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Salary</p>
                    <p className="font-semibold text-gray-900">{job.salary}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <ApplicationModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        opportunity={job}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
};

export default JobDetail;
