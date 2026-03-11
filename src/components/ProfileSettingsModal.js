/**
 * Profile Settings Modal
 * Allows users to edit their profile information
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Briefcase, Upload, Save, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    bio: '',
    photoURL: '',
    company: ''
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Handle photo file upload to Firebase Storage
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image too large. Maximum size is 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      // Upload to Firebase Storage
      const fileName = `${currentUser.uid}_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `profile-photos/${currentUser.uid}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      showSuccess('Photo uploaded! Click Save Changes to apply.');
    } catch (err) {
      console.error('Photo upload error:', err);
      // Fallback: use Base64 data URL if Storage fails
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, photoURL: reader.result }));
          showSuccess('Photo ready! Click Save Changes to apply.');
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr) {
        showError('Failed to upload photo. Please try again.');
      }
    } finally {
      setUploadingPhoto(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.profile?.firstName || userProfile.firstName || '',
        lastName: userProfile.profile?.lastName || userProfile.lastName || '',
        email: userProfile.email || currentUser?.email || '',
        role: userProfile.role || 'student',
        bio: userProfile.profile?.bio || '',
        photoURL: userProfile.profile?.photoURL || '',
        company: userProfile.profile?.company || userProfile.company || ''
      });
    }
  }, [userProfile, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      showError('You must be logged in to update your profile');
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      showError('First name and last name are required');
      return;
    }

    setSaving(true);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        firstName: formData.firstName,
        company: formData.company,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          photoURL: formData.photoURL,
          company: formData.company
        },
        updatedAt: new Date()
      });

      showSuccess('Profile updated successfully!');
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to show updated data
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              Profile Settings
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                  {formData.photoURL ? (
                    <img
                      src={formData.photoURL}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                {/* Click-to-upload overlay on avatar */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Profile Photo
                </label>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="photoURL"
                    value={formData.photoURL}
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-4 py-2 bg-purple-600 border border-purple-500 rounded-lg hover:bg-purple-700 transition-colors text-white disabled:opacity-50"
                    title="Upload photo from your device"
                  >
                    {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Click the avatar or upload button to add a photo (max 5MB)</p>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Company/Organization (for employers and coaches) */}
            {(formData.role === 'employer' || formData.role === 'coach') && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {formData.role === 'employer' ? 'Company Name' : 'Organization'}
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={formData.role === 'employer' ? 'Your company name' : 'Your organization'}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Role (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Account Type
              </label>
              <input
                type="text"
                value={formData.role ? (formData.role.charAt(0).toUpperCase() + formData.role.slice(1)) : 'User'}
                disabled
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed capitalize"
              />
              {formData.role === 'coach' && (
                <p className="text-xs text-slate-500 mt-1">Career Coach Account</p>
              )}
              {formData.role === 'employer' && (
                <p className="text-xs text-slate-500 mt-1">Employer/Partner Account</p>
              )}
              {formData.role === 'admin' && (
                <p className="text-xs text-slate-500 mt-1">Administrator Account</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Bio (optional)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-900 border-t border-slate-700 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-300 hover:text-white transition-colors font-semibold"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileSettingsModal;
