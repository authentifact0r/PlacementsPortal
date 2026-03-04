import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layout
import NavbarSaaS from './components/NavbarSaaS';
import Footer from './components/Footer';

// Public Pages - SaaS Version
import HomeSaaS from './pages/HomeSaaS';
import OpportunitiesPremium from './pages/OpportunitiesPremium';
import JobDetail from './pages/JobDetail';
import LiveFeed from './pages/LiveFeed';
import JobRedirect from './pages/JobRedirect';
import JobAlternatives from './pages/JobAlternatives';
import EmployersPremium from './pages/EmployersPremium';
import Resources from './pages/Resources';
import Community from './pages/Community';
import StudentSupport from './pages/StudentSupport';
import GlobalStudents from './pages/GlobalStudents';
import PublicPitchPage from './pages/PublicPitchPage';
import About from './pages/About';
import Contact from './pages/Contact';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import CheckoutSuccess from './pages/CheckoutSuccess';
import AdminPremiumGrant from './pages/AdminPremiumGrant';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';

// Hub + Dashboards
import DashboardHub from './pages/DashboardHub';
import StudentProfile from './pages/StudentProfile';
import StudentProfileEnhancedV2 from './pages/StudentProfileEnhancedV2';
import StudentProfileFinal from './pages/StudentProfileFinal';
import VideoPitchStudio from './pages/VideoPitchStudio';
import EmployerDashboard from './dashboards/EmployerDashboard';
import OperatorDashboard from './dashboards/OperatorDashboard';
import CoachesDashboard from './dashboards/CoachesDashboard';

// Talent Acquisition Engine (NEW)
import TalentPipeline from './pages/TalentPipeline';
import OutreachHub from './pages/OutreachHub';
import RevenueDashboard from './pages/RevenueDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show spinner while auth state is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If role-restricted route, wait for profile before checking
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirects if logged in)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


function AppContent() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarSaaS />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeSaaS />} />
          <Route path="/opportunities" element={<OpportunitiesPremium />} />
          <Route path="/opportunities/:id" element={<JobDetail />} />
          <Route path="/opportunities/alternatives" element={<JobAlternatives />} />
          <Route path="/live-feed" element={<LiveFeed />} />
          <Route path="/apply/:jobId" element={<JobRedirect />} />
          <Route path="/employers" element={<EmployersPremium />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/resources/*" element={<Resources />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/events" element={<Community />} />
          <Route path="/community/workshops" element={<Community />} />
          <Route path="/community/courses" element={<Community />} />
          <Route path="/community/industry-insight" element={<Community />} />
          <Route path="/student-support" element={<StudentSupport />} />
          <Route path="/global-students" element={<GlobalStudents />} />
          <Route path="/pitch/:pitchId" element={<PublicPitchPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Pricing — /pricing auto-detects role; sub-routes force a specific view */}
          <Route path="/pricing"          element={<Pricing />} />
          <Route path="/pricing/student"  element={<Pricing />} />
          <Route path="/pricing/employer" element={<Pricing />} />

          {/* Post-payment landing */}
          <Route path="/checkout/success" element={<CheckoutSuccess />} />

          {/* Admin tools */}
          <Route path="/admin/premium"   element={<AdminPremiumGrant />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users"     element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Dashboard Routes */}
          {/* /dashboard → Interactive Hub (role-aware, no redirect needed) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/*"
            element={
              <ProtectedRoute allowedRoles={['student', 'graduate']}>
                <StudentProfileEnhancedV2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/v2"
            element={
              <ProtectedRoute allowedRoles={['student', 'graduate']}>
                <StudentProfileEnhancedV2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/old"
            element={
              <ProtectedRoute allowedRoles={['student', 'graduate']}>
                <StudentProfileFinal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classic"
            element={
              <ProtectedRoute allowedRoles={['student', 'graduate']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/studio"
            element={
              <ProtectedRoute allowedRoles={['student', 'graduate', 'admin', 'coach']}>
                <VideoPitchStudio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employer/*"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach/*"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachesDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Talent Acquisition Engine Routes (NEW) */}
          <Route
            path="/talent-pipeline"
            element={
              <ProtectedRoute allowedRoles={['employer', 'admin']}>
                <TalentPipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/outreach"
            element={
              <ProtectedRoute allowedRoles={['employer', 'admin']}>
                <OutreachHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenue"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RevenueDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
