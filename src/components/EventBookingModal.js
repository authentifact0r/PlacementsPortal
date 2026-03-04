import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage as FormikError } from 'formik';
import * as Yup from 'yup';
import { eventService } from '../services/event.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const EventBookingModal = ({ isOpen, onClose, event, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!event) return null;

  const initialValues = {
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    dietaryRequirements: '',
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
    dietaryRequirements: Yup.string()
      .max(500, 'Maximum 500 characters'),
    additionalInfo: Yup.string()
      .max(1000, 'Maximum 1000 characters')
  });

  const handleSubmit = async (values, { setSubmitting, setFieldError }) => {
    try {
      const registrationData = {
        ...values,
        userId: currentUser.uid,
        eventId: event.id,
        registeredAt: new Date().toISOString()
      };

      await eventService.registerForEvent(event.id, registrationData);
      
      setBookingSuccess(true);
      showSuccess('Successfully registered for event!');
      
      // Close modal and refresh after success animation
      setTimeout(() => {
        setBookingSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Booking error:', error);
      
      if (error.message?.includes('full') || error.message?.includes('capacity')) {
        showError('Sorry, this event is now full');
        setFieldError('submit', 'Event is at capacity. Please check other events.');
      } else if (error.message?.includes('already registered')) {
        showError('You are already registered for this event');
        setFieldError('submit', 'You have already registered for this event.');
      } else {
        showError('Failed to register. Please try again.');
        setFieldError('submit', 'An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="fixed inset-0 z-50 overflow-y-auto">
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
                      Registration Successful!
                    </h3>
                    <p className="text-gray-600">
                      You're all set for <span className="font-semibold">{event.title}</span>.
                      <br />
                      Check your email for confirmation details.
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

                    {/* Event Header */}
                    <div className="relative h-48 bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden">
                      {event.image && (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{event.date}</span>
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location || event.locationDetail || 'TBA'}</span>
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
                            {/* Capacity Warning */}
                            {event.capacity && event.registeredCount && (
                              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                                event.registeredCount / event.capacity > 0.8
                                  ? 'bg-orange-50 border border-orange-200'
                                  : 'bg-blue-50 border border-blue-200'
                              }`}>
                                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                                  event.registeredCount / event.capacity > 0.8
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                                }`} />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 mb-1">
                                    {event.capacity - event.registeredCount} spots remaining
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {event.registeredCount} of {event.capacity} attendees registered
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Full Name */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                              </label>
                              <Field
                                name="name"
                                type="text"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                  errors.name && touched.name
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                                placeholder="Enter your full name"
                              />
                              <FormikError
                                name="name"
                                component="div"
                                className="mt-1 text-sm text-red-600"
                              />
                            </div>

                            {/* Email */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address <span className="text-red-500">*</span>
                              </label>
                              <Field
                                name="email"
                                type="email"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                  errors.email && touched.email
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                                placeholder="your.email@example.com"
                              />
                              <FormikError
                                name="email"
                                component="div"
                                className="mt-1 text-sm text-red-600"
                              />
                            </div>

                            {/* Phone */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Phone Number <span className="text-red-500">*</span>
                              </label>
                              <Field
                                name="phone"
                                type="tel"
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                  errors.phone && touched.phone
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200'
                                }`}
                                placeholder="+44 20 1234 5678"
                              />
                              <FormikError
                                name="phone"
                                component="div"
                                className="mt-1 text-sm text-red-600"
                              />
                            </div>

                            {/* Dietary Requirements */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Dietary Requirements or Allergies
                              </label>
                              <Field
                                name="dietaryRequirements"
                                as="textarea"
                                rows="2"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                                placeholder="Any dietary restrictions we should know about?"
                              />
                              <div className="mt-1 flex justify-between text-xs text-gray-500">
                                <span>Optional</span>
                                <span>{values.dietaryRequirements?.length || 0}/500</span>
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
                                rows="3"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                                placeholder="Anything else we should know? (e.g., accessibility requirements)"
                              />
                              <div className="mt-1 flex justify-between text-xs text-gray-500">
                                <span>Optional</span>
                                <span>{values.additionalInfo?.length || 0}/1000</span>
                              </div>
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
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    Registering...
                                  </span>
                                ) : (
                                  'Confirm Registration'
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

export default EventBookingModal;
