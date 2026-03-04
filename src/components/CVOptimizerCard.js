/**
 * CV Optimizer Card Component
 * Shows premium upgrade prompt OR active CV optimizer interface
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Sparkles, 
  FileText, 
  Download, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import cvOptimizerService from '../services/cvOptimizer.service';
import CoachingUpsellBanner from './CoachingUpsellBanner';

const CVOptimizerCard = ({ hasAccess, tokensRemaining, onPurchase, onOptimizationComplete }) => {
  const { currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // File upload handler
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      showError('Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must be less than 5MB');
      return;
    }

    setUploadedFile(file);
    showInfo('CV uploaded. Click "Optimize CV" to start.');
  }, [showError, showInfo]);

  // Optimize CV handler
  const handleOptimize = useCallback(async () => {
    if (!uploadedFile) {
      showError('Please upload a CV first');
      return;
    }

    if (tokensRemaining <= 0) {
      showError('No tokens remaining. Please purchase more tokens.');
      return;
    }

    try {
      setIsOptimizing(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload CV to Firebase Storage
      showInfo('Uploading CV...');
      const cvUrl = await cvOptimizerService.uploadCV(uploadedFile, currentUser.uid);
      
      setUploadProgress(100);
      clearInterval(progressInterval);

      // Optimize with AI
      showInfo('Optimizing with AI... This may take a moment.');
      const result = await cvOptimizerService.optimizeCV(cvUrl, currentUser.uid, {
        type: 'general',
        suggestions: []
      });

      setOptimizationResult(result);
      showSuccess('CV optimized successfully! 🎉');
      
      // Callback to parent to refresh token count
      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }

    } catch (error) {
      console.error('Optimization error:', error);
      showError(error.message || 'Failed to optimize CV. Please try again.');
    } finally {
      setIsOptimizing(false);
      setUploadProgress(0);
    }
  }, [uploadedFile, tokensRemaining, currentUser, showError, showInfo, showSuccess, onOptimizationComplete]);

  // Download optimized CV
  const handleDownload = useCallback(() => {
    if (optimizationResult?.optimizedUrl) {
      window.open(optimizationResult.optimizedUrl, '_blank');
      showInfo('Remember to link this to a job opportunity!');
    }
  }, [optimizationResult, showInfo]);

  // Reset to upload new CV
  const handleReset = useCallback(() => {
    setUploadedFile(null);
    setOptimizationResult(null);
    setUploadProgress(0);
  }, []);

  // ============================================
  // PREMIUM UPGRADE VIEW (No Access)
  // ============================================
  if (!hasAccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10" />

        <div className="relative z-10">
          {/* Icon & Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
              Premium Feature
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            AI CV Optimizer
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Transform your CV with AI-powered optimization. Get ATS-friendly formatting, 
            keyword suggestions, and personalized improvements that help you stand out.
          </p>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            {[
              'AI-powered content optimization',
              '5 optimization tokens included',
              'ATS compatibility checks',
              'Track application outcomes',
              'Download optimized versions'
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-200 mb-4">
            <div>
              <div className="text-3xl font-bold text-purple-600">£35</div>
              <div className="text-sm text-gray-600">One-time purchase • 5 tokens</div>
            </div>
            <button
              onClick={onPurchase}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>

          {/* Money-back guarantee */}
          <p className="text-xs text-gray-600 text-center">
            ✓ 30-day money-back guarantee • ✓ Trusted by 1,000+ students
          </p>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // ACTIVE CV OPTIMIZER VIEW (Has Access)
  // ============================================
  return (
    <div className="space-y-6">
      {/* Token Counter Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">AI CV Optimizer</h3>
            <p className="text-purple-100 text-sm">Transform your CV with AI</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{tokensRemaining}</div>
            <div className="text-purple-100 text-sm">Tokens Remaining</div>
          </div>
        </div>
      </div>

      {/* Main Optimizer Interface */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
        <AnimatePresence mode="wait">
          {!optimizationResult ? (
            /* Upload & Optimize View */
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                Upload Your CV
              </h4>

              {/* File Upload Area */}
              <label className="block">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isOptimizing}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                  {uploadedFile ? (
                    <div className="space-y-3">
                      <FileText className="w-16 h-16 text-purple-600 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{uploadedFile.name}</p>
                        <p className="text-xs text-gray-600">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadedFile(null);
                        }}
                        className="text-xs text-purple-600 hover:underline"
                      >
                        Upload different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-600">
                          PDF or DOCX (max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Processing Progress Bar (Glassmorphism) */}
              {isOptimizing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      {uploadProgress < 100 ? 'Uploading...' : 'Optimizing with AI...'}
                    </span>
                    <span className="text-purple-600 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                    />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    This usually takes 10-30 seconds...
                  </p>
                </motion.div>
              )}

              {/* Optimize Button */}
              <button
                onClick={handleOptimize}
                disabled={!uploadedFile || isOptimizing || tokensRemaining <= 0}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Optimize CV (1 Token)
                  </>
                )}
              </button>

              {tokensRemaining <= 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">No tokens remaining</p>
                    <p>Purchase more tokens to continue optimizing your CVs.</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Optimization Result View */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Success Message */}
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <h5 className="font-bold text-green-900">CV Optimized Successfully!</h5>
                  <p className="text-sm text-green-700">Your CV has been enhanced with AI.</p>
                </div>
              </div>

              {/* AI Suggestions */}
              <div>
                <h5 className="font-bold text-gray-900 mb-3">What We Improved:</h5>
                <ul className="space-y-2">
                  {optimizationResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Download & New Optimization Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Optimized CV
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                >
                  New Optimization
                </button>
              </div>

              {/* Info: Link to job */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  💡 <strong>Pro Tip:</strong> Go to your Application Log to link this optimized CV to a job opportunity and track your outcomes!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Coaching Upsell Banner */}
      <CoachingUpsellBanner />
    </div>
  );
};

export default CVOptimizerCard;
