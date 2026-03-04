import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { opportunityService } from '../services/opportunity.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from './LoadingSpinner';

// Validation Schema
const ApplicationSchema = Yup.object().shape({
  coverLetter: Yup.string()
    .min(100, 'Cover letter must be at least 100 characters')
    .max(2000, 'Cover letter must be less than 2000 characters')
    .required('Cover letter is required'),
  resumeUrl: Yup.string()
    .url('Must be a valid URL (e.g., Google Drive, Dropbox, or LinkedIn)')
    .required('Resume URL is required'),
  phone: Yup.string()
    .matches(/^[0-9+\s-()]+$/, 'Invalid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .required('Phone number is required'),
  availability: Yup.string()
    .required('Please specify your availability'),
  additionalInfo: Yup.string()
    .max(500, 'Additional information must be less than 500 characters')
});

export function ApplicationModal({ isOpen, onClose, opportunity, onSuccess }) {
  const { currentUser, userProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await opportunityService.apply(opportunity.id, {
        ...values,
        studentId: currentUser.uid,
        employerId: opportunity.employerId,
        studentName: `${userProfile?.profile?.firstName || ''} ${userProfile?.profile?.lastName || ''}`.trim(),
        studentEmail: currentUser.email,
        opportunityTitle: opportunity.title,
        company: opportunity.company
      });

      setSubmitted(true);
      showSuccess('Application submitted successfully!');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Application error:', error);
      showError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Success State */}
              {submitted ? (
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-gray-600">
                    Your application has been sent to {opportunity.company}.
                    <br />
                    You'll receive updates via email.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Apply for Position
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {opportunity.title} at {opportunity.company}
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="p-6">
                    <Formik
                      initialValues={{
                        coverLetter: '',
                        resumeUrl: '',
                        phone: userProfile?.profile?.phone || '',
                        availability: 'immediately',
                        additionalInfo: ''
                      }}
                      validationSchema={ApplicationSchema}
                      onSubmit={handleSubmit}
                    >
                      {({ errors, touched, isSubmitting, values }) => (
                        <Form className="space-y-6">
                          {/* Cover Letter */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Cover Letter *
                            </label>
                            <Field
                              as="textarea"
                              name="coverLetter"
                              rows="6"
                              placeholder="Explain why you're a great fit for this role..."
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                                errors.coverLetter && touched.coverLetter
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <div>
                                {errors.coverLetter && touched.coverLetter && (
                                  <p className="text-red-500 text-sm flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.coverLetter}
                                  </p>
                                )}
                              </div>
                              <p className={`text-xs ${
                                values.coverLetter.length < 100 ? 'text-gray-400' : 'text-green-600'
                              }`}>
                                {values.coverLetter.length} / 2000 characters
                                {values.coverLetter.length < 100 && ` (min 100)`}
                              </p>
                            </div>
                          </div>

                          {/* Resume URL */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Resume / CV Link *
                            </label>
                            <div className="relative">
                              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Field
                                name="resumeUrl"
                                type="url"
                                placeholder="https://drive.google.com/... or https://linkedin.com/in/..."
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                                  errors.resumeUrl && touched.resumeUrl
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300'
                                }`}
                              />
                            </div>
                            {errors.resumeUrl && touched.resumeUrl && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.resumeUrl}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Upload your resume to Google Drive, Dropbox, or share your LinkedIn profile
                            </p>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Phone Number *
                            </label>
                            <Field
                              name="phone"
                              type="tel"
                              placeholder="+44 7700 900000"
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                                errors.phone && touched.phone
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                            />
                            {errors.phone && touched.phone && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {errors.phone}
                              </p>
                            )}
                          </div>

                          {/* Availability */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Availability *
                            </label>
                            <Field
                              as="select"
                              name="availability"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            >
                              <option value="immediately">Immediately</option>
                              <option value="2-weeks">2 weeks notice</option>
                              <option value="1-month">1 month notice</option>
                              <option value="3-months">3 months notice</option>
                              <option value="after-graduation">After graduation</option>
                            </Field>
                          </div>

                          {/* Additional Info */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Additional Information
                              <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                            </label>
                            <Field
                              as="textarea"
                              name="additionalInfo"
                              rows="3"
                              placeholder="Any additional information you'd like to share..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              {values.additionalInfo.length} / 500 characters
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={onClose}
                              disabled={isSubmitting}
                              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isSubmitting ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  Submitting...
                                </>
                              ) : (
                                'Submit Application'
                              )}
                            </button>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ApplicationModal;
