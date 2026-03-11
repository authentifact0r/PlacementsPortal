import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Crown,
  Shield,
  GraduationCap,
  Briefcase,
  UserCheck,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Mail,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, query, orderBy } from 'firebase/firestore';
import db from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const AdminUsers = () => {
  const navigate = useNavigate();
  useAuth(); // ensure auth context is loaded
  const { showToast } = useToast();

  // State
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Load users on mount
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setAllUsers(users);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  // Compute filtered users
  const filtered = useMemo(() => {
    let result = allUsers;

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((u) => {
        const name = (u.displayName || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      });
    }

    return result;
  }, [allUsers, roleFilter, searchQuery]);

  // Role color map
  const roleColors = {
    student: 'violet',
    graduate: 'purple',
    employer: 'sky',
    coach: 'emerald',
    admin: 'amber'
  };

  const getRoleColor = (role) => roleColors[role] || 'gray';

  // Count by role
  const countByRole = {
    all: allUsers.length,
    student: allUsers.filter((u) => u.role === 'student').length,
    graduate: allUsers.filter((u) => u.role === 'graduate').length,
    employer: allUsers.filter((u) => u.role === 'employer').length,
    coach: allUsers.filter((u) => u.role === 'coach').length,
    admin: allUsers.filter((u) => u.role === 'admin').length
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get avatar initial
  const getInitial = (name) => {
    return (name || 'U')[0].toUpperCase();
  };

  // Check if user has premium
  const hasPremium = (u) => {
    return (
      (u.premium?.studentPremium?.active || false) ||
      (u.premium?.employerPremium?.active || false)
    );
  };

  // Change role
  const handleChangeRole = async (newRole) => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await setDoc(userRef, { role: newRole }, { merge: true });
      showToast(`User role changed to ${newRole}`, 'success');
      // Update local state
      setAllUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
      );
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    } catch (error) {
      console.error('Error changing role:', error);
      showToast('Failed to change role', 'error');
    }
  };

  // Grant premium
  const handleGrantPremium = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 365 * 24 * 3600 * 1000);
      await setDoc(
        userRef,
        {
          premium: {
            studentPremium: {
              active: true,
              plan: 'FULL_PREMIUM',
              grantedAt: now.toISOString(),
              expiresAt: expiresAt.toISOString()
            },
            cvReview: { active: true },
            coaching: { active: true },
            aiApplier: { active: true },
            pitchTokens: 500
          }
        },
        { merge: true }
      );
      showToast('Premium access granted', 'success');
      // Update local state
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                premium: {
                  ...u.premium,
                  studentPremium: {
                    active: true,
                    plan: 'FULL_PREMIUM',
                    grantedAt: now.toISOString(),
                    expiresAt: expiresAt.toISOString()
                  },
                  cvReview: { active: true },
                  coaching: { active: true },
                  aiApplier: { active: true },
                  pitchTokens: 500
                }
              }
            : u
        )
      );
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              premium: {
                ...prev.premium,
                studentPremium: {
                  active: true,
                  plan: 'FULL_PREMIUM',
                  grantedAt: now.toISOString(),
                  expiresAt: expiresAt.toISOString()
                },
                cvReview: { active: true },
                coaching: { active: true },
                aiApplier: { active: true },
                pitchTokens: 500
              }
            }
          : null
      );
    } catch (error) {
      console.error('Error granting premium:', error);
      showToast('Failed to grant premium', 'error');
    }
  };

  // Revoke premium
  const handleRevokePremium = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await setDoc(
        userRef,
        {
          premium: {
            studentPremium: { active: false },
            employerPremium: { active: false }
          }
        },
        { merge: true }
      );
      showToast('Premium access revoked', 'success');
      // Update local state
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                premium: {
                  ...u.premium,
                  studentPremium: { active: false },
                  employerPremium: { active: false }
                }
              }
            : u
        )
      );
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              premium: {
                ...prev.premium,
                studentPremium: { active: false },
                employerPremium: { active: false }
              }
            }
          : null
      );
    } catch (error) {
      console.error('Error revoking premium:', error);
      showToast('Failed to revoke premium', 'error');
    }
  };

  // Navigate back
  const handleBack = () => {
    navigate('/admin/dashboard');
  };

  // Loading screen
  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-amber-500 rounded-lg transition"
              title="Back to dashboard"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="w-8 h-8" />
                User Management
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg font-semibold">
              Total: {allUsers.length}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-amber-500 rounded-lg transition disabled:opacity-50"
              title="Refresh users"
            >
              <RefreshCw
                className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'student', label: 'Students' },
              { key: 'graduate', label: 'Graduates' },
              { key: 'employer', label: 'Employers' },
              { key: 'coach', label: 'Coaches' },
              { key: 'admin', label: 'Admins' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  roleFilter === key
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({countByRole[key]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Panel - User List */}
          <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filtered.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition ${
                          selectedUser?.id === u.id ? 'bg-amber-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center flex-shrink-0 text-white font-semibold`}
                          >
                            {getInitial(u.displayName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 truncate">
                                {u.displayName || 'Unnamed'}
                              </p>
                              {hasPremium(u) && (
                                <Crown className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium text-white bg-${getRoleColor(
                                  u.role
                                )}-500`}
                              >
                                {u.role || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {u.email || 'No email'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(u.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - User Details */}
          <div className="flex-1">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* User Card */}
                <div className="text-center mb-8">
                  <div
                    className={`w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center mx-auto mb-4 text-white font-semibold text-2xl`}
                  >
                    {getInitial(selectedUser.displayName)}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedUser.displayName || 'Unnamed User'}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium text-white bg-${getRoleColor(
                        selectedUser.role
                      )}-500`}
                    >
                      {selectedUser.role || 'Unknown'}
                    </span>
                    {hasPremium(selectedUser) && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-amber-600 flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        PRO
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email || 'No email'}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(selectedUser.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Change Role Section */}
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Change Role
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        key: 'student',
                        label: 'Student',
                        icon: <GraduationCap className="w-4 h-4" />
                      },
                      {
                        key: 'graduate',
                        label: 'Graduate',
                        icon: <UserCheck className="w-4 h-4" />
                      },
                      {
                        key: 'employer',
                        label: 'Employer',
                        icon: <Briefcase className="w-4 h-4" />
                      },
                      {
                        key: 'coach',
                        label: 'Coach',
                        icon: <Shield className="w-4 h-4" />
                      },
                      {
                        key: 'admin',
                        label: 'Admin',
                        icon: <Crown className="w-4 h-4" />
                      }
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => handleChangeRole(key)}
                        className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          selectedUser.role === key
                            ? `bg-${getRoleColor(
                                key
                              )}-100 text-${getRoleColor(key)}-700 border-2 border-${getRoleColor(
                                key
                              )}-500`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Premium Access Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Premium Access
                  </h3>
                  <div className="space-y-3">
                    {hasPremium(selectedUser) && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-800">
                          Premium access is active
                        </span>
                      </div>
                    )}
                    {!hasPremium(selectedUser) && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <span className="text-sm text-red-800">
                          No premium access
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleGrantPremium}
                      disabled={hasPremium(selectedUser)}
                      className="w-full px-4 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Grant Full Premium
                    </button>
                    <button
                      onClick={handleRevokePremium}
                      disabled={!hasPremium(selectedUser)}
                      className="w-full px-4 py-3 border-2 border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Revoke Premium
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Select a user from the list to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
