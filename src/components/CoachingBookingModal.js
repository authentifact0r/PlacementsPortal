import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Calendar, Clock, CheckCircle2, AlertCircle, Mail, Phone, User } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage as FormikError } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import coachingService from '../services/coaching.service';

const CoachingBookingModal = ({ isOpen, onClose, session, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [bookingSuccess, setBookingSuccess] = useState(false);

  console.log('CoachingBookingModal render - isOpen:', isOpen, 'session:', session);

  if (!session) {
    console.log('CoachingBookingModal: session is null, returning null');
    return null;
  }

  const initialValues = {
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    goals: '',
    additionalInfo: ''
  };

  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Full name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    phone: Yup.string()
      .matches(/^[\d\s\-+()]+$/, 'Invalid phone number format')
      .min(10, 'Phone number must be at least 10 digits')
      .required('Phone number is required'),
    preferredDate: Yup.date()
      .required('Preferred date is required')
      .min(new Date(), 'Date must be in the future'),
    preferredTime: Yup.string()
      .required('Preferred time is required'),
    goals: Yup.string()
      .required('Please describe your coaching goals')
      .min(20, 'Please provide at least 20 characters about your goals')
      .max(500, 'Maximum 500 characters')
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const sessionData = {
        studentId: currentUser?.uid,
        studentName: values.name,
        studentEmail: values.email,
        studentPhone: values.phone,
        sessionType: session.type || session.name,
        sessionPrice: session.price,
        date: values.preferredDate,
        time: values.preferredTime,
        duration: session.duration || '60 minutes',
        goals: values.goals,
        additionalInfo: values.additionalInfo || '',
        status: 'pending',
        // coachId is assigned by admin — left empty until assigned
        coachId: session.coachId || null
      };

      await coachingService.createSession(sessionData);

      setBookingSuccess(true);
      showSuccess('Coaching session booked successfully!');

      // Close modal and refresh after success animation
      setTimeout(() => {
        setBookingSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      showError('Failed to book session. Please try again.');
      setFieldError('submit', 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                {/* Success State */}
                {bookingSuccess ? (
                  <div className="p-12 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.6 }}
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Session Booked!
                    </h3>
                    <p className="text-gray-600">
                      Your <span className="font-semibold">{session.name}</span> coaching session has been requested.
                      <br />
                      We'll contact you within 24 hours to confirm your preferred time slot.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-600 to-purple-700 overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-3 w-fit">
                          <Video className="w-4 h-4" />
                          <span className="text-sm font-semibold">Career Coaching</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{session.name}</h2>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{session.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{session.price}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form */}
                    <div className="p-6">
                      <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                      >
                        {({ isSubmitting, errors, touched, values }) => (
                          <Form className="space-y-5">
                            {/* Info Banner */}
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-purple-800">
                                  <p className="font-semibold mb-1">What Happens Next</p>
                                  <p className="text-purple-700">
                                    After booking, our career advisors will review your goals and contact you within 24 hours to schedule your session at your preferred time.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Full Name */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Field
                                  name="name"
                                  type="text"
                                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                                    errors.name && touched.name
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-gray-200'
                                  }`}
                                  placeholder="Enter your full name"
                                />
                              </div>
                              <FormikError
                                name="name"
                                component="div"
                                className="mt-1 text-sm text-red-600"
                              />
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <Field
                                    name="email"
                                    type="email"
                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                                      errors.email && touched.email
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200'
                                    }`}
                                    placeholder="your@email.com"
                                  />
                                </div>
                                <FormikError
                                  name="email"
                                  component="div"
                                  className="mt-1 text-sm text-red-600"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Phone <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <Field
                                    name="phone"
                                    type="tel"
                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                                      errors.phone && touched.phone
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200'
                                    }`}
                                    placeholder="+44 20 1234 5678"
                                  />
                                </div>
                                <FormikError
                                  name="phone"
                                  component="div"
                                  className="mt-1 text-sm text-red-600"
                                />
                              </div>
                            </div>

                            {/* Preferred Date & Time */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Preferred Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <Field
                                    name="preferredDate"
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                                      errors.preferredDate && touched.preferredDate
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200'
                                    }`}
                                  />
                                </div>
                                <FormikError
                                  name="preferredDate"
                                  component="div"
                                  className="mt-1 text-sm text-red-600"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Preferred Time <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                  <Field
                                    as="select"
                                    name="preferredTime"
                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                                      errors.preferredTime && touched.preferredTime
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <option value="">Select time</option>
                                    {timeSlots.map(time => (
                                      <option key={time} value={time}>{time}</option>
                                    ))}
                                  </Field>
                                </div>
                                <FormikError
                                  name="preferredTime"
                                  component="div"
                                  className="mt-1 text-sm text-red-600"
                                />
                              </div>
                            </div>

                            {/* Coaching Goals */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                What Are Your Coaching Goals? <span className="text-red-500">*</span>
                              </label>
                              <Field
                                name="goals"
                                as="textarea"
                                rows="4"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none ${
                                  errors.goals && touched.goals
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                                placeholder="E.g., I want to improve my interview skills, get feedback on my CV, and develop a career strategy for transitioning into the tech industry..."
                              />
                              <div className="mt-1 flex justify-between text-xs text-gray-500">
                                <FormikError name="goals" component="span" className="text-red-600" />
                                <span>{values.goals?.length || 0}/500</span>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Information
                              </label>
                              <Field
                                name="additionalInfo"
                                as="textarea"
                                rows="2"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                                placeholder="Any special requirements or topics you'd like to focus on?"
                              />
                              <p className="mt-1 text-xs text-gray-500">Optional</p>
                            </div>

                            {/* Submit Error */}
                            {errors.submit && (
                              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{errors.submit}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    Booking...
                                  </span>
                                ) : (
                                  `Book Session - ${session.price}`
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
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CoachingBookingModal;
