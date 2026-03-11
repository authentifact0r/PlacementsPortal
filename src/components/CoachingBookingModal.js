import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Video, Calendar, Clock, CheckCircle2, AlertCircle,
  Mail, Phone, User, ChevronLeft, ChevronRight, FileText,
  Mic, Compass, Linkedin, Sparkles
} from 'lucide-react';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import coachingService from '../services/coaching.service';

/* ── Step labels ── */
const STEPS = [
  { label: 'Select Time', short: 'Time' },
  { label: 'Your Details', short: 'Details' },
  { label: 'Confirm', short: 'Confirm' },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

const SESSION_ICONS = {
  'CV Review': FileText,
  'Interview Prep': Mic,
  'Career Planning': Compass,
  'LinkedIn Optimisation': Linkedin,
  'Personal Branding Bundle': FileText,
  'Complete Package': Sparkles,
};

/* ── Validation (Step 2 only — step 1 validated manually) ── */
const detailsSchema = Yup.object({
  name: Yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().matches(/^[\d\s\-+()]+$/, 'Invalid phone number').min(10, 'At least 10 digits').required('Phone number is required'),
  goals: Yup.string().required('Please describe your goals').min(20, 'At least 20 characters').max(500, 'Maximum 500 characters'),
});

const CoachingBookingModal = ({ isOpen, onClose, session, onSuccess }) => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const modalRef = useRef(null);

  /* ── Local state ── */
  const [step, setStep] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 data
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [step1Error, setStep1Error] = useState('');

  // Step 2 data
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', goals: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  /* Reset when modal opens */
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setBookingSuccess(false);
      setSelectedDate('');
      setSelectedTime('');
      setStep1Error('');
      setSubmitError('');
      setFieldErrors({});
      setFormData({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        phone: '',
        goals: '',
      });
    }
  }, [isOpen, currentUser]);

  /* Keyboard: Escape to close */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  /* Focus trap — auto-focus modal on open */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen, step]);

  if (!session) return null;

  const SessionIcon = SESSION_ICONS[session.type] || Video;
  const today = new Date().toISOString().split('T')[0];

  /* ── Navigation ── */
  const goNext = () => {
    if (step === 0) {
      if (!selectedDate || !selectedTime) {
        setStep1Error('Please select both a date and time slot.');
        return;
      }
      setStep1Error('');
    }
    if (step === 1) {
      try {
        detailsSchema.validateSync(formData, { abortEarly: false });
        setFieldErrors({});
      } catch (err) {
        const errs = {};
        err.inner.forEach((e) => { errs[e.path] = e.message; });
        setFieldErrors(errs);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /* ── Submit ── */
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await coachingService.createSession({
        studentId: currentUser?.uid,
        studentName: formData.name,
        studentEmail: formData.email,
        studentPhone: formData.phone,
        sessionType: session.type || session.name,
        sessionPrice: session.price,
        date: selectedDate,
        time: selectedTime,
        duration: session.duration || '60 minutes',
        goals: formData.goals,
        additionalInfo: '',
        status: 'pending',
        coachId: session.coachId || null,
      });
      setBookingSuccess(true);
      showSuccess('Coaching session booked successfully!');
      setTimeout(() => {
        setBookingSuccess(false);
        onSuccess?.();
        onClose();
      }, 2500);
    } catch (error) {
      console.error('Booking error:', error);
      showError('Failed to book session. Please try again.');
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Field change handler ── */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ── Render helpers ── */
  const renderInput = (name, label, type, icon, placeholder, required = true) => {
    const Icon = icon;
    const errId = `${name}-error`;
    return (
      <div>
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            id={name}
            type={type}
            value={formData[name]}
            onChange={(e) => updateField(name, e.target.value)}
            aria-describedby={fieldErrors[name] ? errId : undefined}
            aria-invalid={!!fieldErrors[name]}
            className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[44px] ${
              fieldErrors[name] ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder={placeholder}
          />
        </div>
        {fieldErrors[name] && (
          <p id={errId} className="mt-1 text-sm text-red-600" role="alert">{fieldErrors[name]}</p>
        )}
      </div>
    );
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Book ${session.name} coaching session`}>
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                ref={modalRef}
                tabIndex={-1}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto sm:max-h-none outline-none"
              >
                {/* ─── Success State ─── */}
                {bookingSuccess ? (
                  <div className="p-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Session Booked!</h3>
                    <p className="text-gray-600" aria-live="polite">
                      Your <span className="font-semibold">{session.name}</span> coaching session has been requested.
                      <br />We'll contact you within 24 hours to confirm your time slot.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Close */}
                    <button
                      onClick={onClose}
                      aria-label="Close booking modal"
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="relative h-36 bg-gradient-to-br from-purple-600 to-indigo-700 overflow-hidden">
                      <div className="absolute inset-0 bg-black/5" />
                      <div className="relative h-full flex flex-col justify-end p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <SessionIcon className="w-5 h-5 text-white" aria-hidden="true" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{session.name}</h2>
                            <div className="flex items-center gap-3 text-sm text-white/80">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{session.duration}</span>
                              <span className="font-bold text-white">{session.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Step Indicator ─── */}
                    <div className="px-6 pt-5 pb-2">
                      <div className="flex items-center justify-between" role="navigation" aria-label="Booking steps">
                        {STEPS.map((s, i) => (
                          <div key={s.label} className="flex items-center flex-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                  i < step ? 'bg-green-500 text-white'
                                  : i === step ? 'bg-purple-600 text-white'
                                  : 'bg-gray-200 text-gray-500'
                                }`}
                                aria-current={i === step ? 'step' : undefined}
                              >
                                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                              </div>
                              <span className={`text-sm font-medium hidden sm:inline ${i === step ? 'text-purple-700' : 'text-gray-500'}`}>
                                {s.label}
                              </span>
                              <span className={`text-xs font-medium sm:hidden ${i === step ? 'text-purple-700' : 'text-gray-500'}`}>
                                {s.short}
                              </span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-3 rounded ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ─── Step Content ─── */}
                    <div className="p-6">
                      <AnimatePresence mode="wait">
                        {/* STEP 1: Date & Time */}
                        {step === 0 && (
                          <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            {/* Date picker */}
                            <div>
                              <label htmlFor="booking-date" className="block text-sm font-semibold text-gray-700 mb-2">
                                Preferred Date <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                                <input
                                  id="booking-date"
                                  type="date"
                                  min={today}
                                  value={selectedDate}
                                  onChange={(e) => { setSelectedDate(e.target.value); setStep1Error(''); }}
                                  className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-h-[44px]"
                                />
                              </div>
                            </div>

                            {/* Time slot chips */}
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-2">
                                Preferred Time <span className="text-red-500">*</span>
                              </p>
                              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" role="radiogroup" aria-label="Select time slot">
                                {TIME_SLOTS.map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    role="radio"
                                    aria-checked={selectedTime === time}
                                    onClick={() => { setSelectedTime(time); setStep1Error(''); }}
                                    className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-purple-500 ${
                                      selectedTime === time
                                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {step1Error && (
                              <p className="text-sm text-red-600 flex items-center gap-1.5" role="alert">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {step1Error}
                              </p>
                            )}
                          </motion.div>
                        )}

                        {/* STEP 2: Details */}
                        {step === 1 && (
                          <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            {renderInput('name', 'Full Name', 'text', User, 'Enter your full name')}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {renderInput('email', 'Email', 'email', Mail, 'your@email.com')}
                              {renderInput('phone', 'Phone', 'tel', Phone, '+44 20 1234 5678')}
                            </div>

                            <div>
                              <label htmlFor="goals" className="block text-sm font-semibold text-gray-700 mb-1.5">
                                What Are Your Coaching Goals? <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                id="goals"
                                rows="4"
                                value={formData.goals}
                                onChange={(e) => updateField('goals', e.target.value)}
                                aria-describedby={fieldErrors.goals ? 'goals-error' : 'goals-counter'}
                                aria-invalid={!!fieldErrors.goals}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none ${
                                  fieldErrors.goals ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="E.g., I want to improve my interview skills, get feedback on my CV..."
                              />
                              <div className="mt-1 flex justify-between text-xs text-gray-500">
                                {fieldErrors.goals ? (
                                  <p id="goals-error" className="text-red-600" role="alert">{fieldErrors.goals}</p>
                                ) : <span />}
                                <span id="goals-counter">{formData.goals.length}/500</span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* STEP 3: Confirm */}
                        {step === 2 && (
                          <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            {/* Summary card */}
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                              <h4 className="font-bold text-gray-900 mb-3">Booking Summary</h4>
                              <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Session</span>
                                  <span className="font-semibold text-gray-900">{session.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Date</span>
                                  <span className="font-semibold text-gray-900">
                                    {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Time</span>
                                  <span className="font-semibold text-gray-900">{selectedTime || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Duration</span>
                                  <span className="font-semibold text-gray-900">{session.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Name</span>
                                  <span className="font-semibold text-gray-900">{formData.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Email</span>
                                  <span className="font-semibold text-gray-900">{formData.email}</span>
                                </div>
                                <hr className="border-purple-200" />
                                <div className="flex justify-between text-base">
                                  <span className="font-semibold text-gray-900">Total</span>
                                  <span className="font-bold text-purple-700 text-lg">{session.price}</span>
                                </div>
                              </div>
                            </div>

                            {/* Info banner */}
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <p className="text-sm text-green-800">
                                  After booking, our team will confirm your session within 24 hours and send a calendar invite with a video call link.
                                </p>
                              </div>
                            </div>

                            {submitError && (
                              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl" role="alert" aria-live="polite">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{submitError}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ─── Navigation Buttons ─── */}
                      <div className="flex gap-3 pt-5 mt-5 border-t border-gray-200">
                        {step > 0 ? (
                          <button
                            type="button"
                            onClick={goBack}
                            className="flex items-center justify-center gap-1.5 flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                          >
                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                            Back
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                          >
                            Cancel
                          </button>
                        )}

                        {step < 2 ? (
                          <button
                            type="button"
                            onClick={goNext}
                            className="flex items-center justify-center gap-1.5 flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20 min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                          >
                            Continue
                            <ChevronRight className="w-4 h-4" aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Booking...
                              </>
                            ) : (
                              `Confirm Booking — ${session.price}`
                            )}
                          </button>
                        )}
                      </div>
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
