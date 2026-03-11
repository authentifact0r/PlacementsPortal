/**
 * Events Discovery Panel — Career Event Discovery Engine
 * Curated, high-value career event hub with discovery grid,
 * filters, one-click RSVP, calendar export & peer engagement.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Filter,
  Users,
  Star,
  CheckCircle,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  Building2,
  Sparkles,
  TrendingUp,
  X,
  Loader2,
  Share2,
  Video
} from 'lucide-react';
import { eventService } from '../services/event.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/* ──────────────── constants ──────────────── */

const EVENT_TYPES = [
  { id: 'all', label: 'All Events', icon: Calendar },
  { id: 'career-fair', label: 'Career Fairs', icon: Building2 },
  { id: 'workshop', label: 'Workshops', icon: Sparkles },
  { id: 'networking', label: 'Networking', icon: Users },
  { id: 'webinar', label: 'Webinars', icon: Video },
  { id: 'hackathon', label: 'Hackathons', icon: TrendingUp },
  { id: 'panel', label: 'Panel Talks', icon: Star },
];

const SORT_OPTIONS = [
  { id: 'date-asc', label: 'Soonest first' },
  { id: 'date-desc', label: 'Latest first' },
  { id: 'popular', label: 'Most popular' },
];

// Curated sample events (shown when Firestore is empty so the page never looks bare)
const SAMPLE_EVENTS = [
  {
    id: 'sample-1',
    title: 'London Tech Career Fair 2026',
    organiser: 'TechConnect UK',
    type: 'career-fair',
    location: 'ExCeL London',
    isVirtual: false,
    date: new Date('2026-04-15T10:00:00'),
    endDate: new Date('2026-04-15T17:00:00'),
    time: '10:00 – 17:00',
    description: 'Meet 50+ top tech employers including Google, Revolut, and Monzo. Free CV reviews, live coding challenges, and on-the-spot interviews.',
    tags: ['Technology', 'Graduate', 'Networking'],
    capacity: 500,
    registered: 312,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=340&fit=crop',
    isFeatured: true,
    price: 'Free',
  },
  {
    id: 'sample-2',
    title: 'Interview Masterclass: STAR Method',
    organiser: 'PlacementsPortal Academy',
    type: 'workshop',
    location: 'Online (Zoom)',
    isVirtual: true,
    date: new Date('2026-04-08T14:00:00'),
    endDate: new Date('2026-04-08T16:00:00'),
    time: '14:00 – 16:00',
    description: 'Master the STAR interview technique with a former Deloitte hiring manager. Includes mock interview practice and personalised feedback.',
    tags: ['Interview Prep', 'Skills', 'Free'],
    capacity: 100,
    registered: 78,
    image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=600&h=340&fit=crop',
    isFeatured: false,
    price: 'Free',
  },
  {
    id: 'sample-3',
    title: 'Women in Finance Networking Evening',
    organiser: 'Bright Network',
    type: 'networking',
    location: 'Canary Wharf, London',
    isVirtual: false,
    date: new Date('2026-04-22T18:00:00'),
    endDate: new Date('2026-04-22T21:00:00'),
    time: '18:00 – 21:00',
    description: 'Connect with senior leaders from Goldman Sachs, JP Morgan, and Barclays. Panel discussion followed by drinks and canapés.',
    tags: ['Finance', 'Networking', 'Diversity'],
    capacity: 150,
    registered: 134,
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=340&fit=crop',
    isFeatured: true,
    price: 'Free',
  },
  {
    id: 'sample-4',
    title: 'Build Your Personal Brand Online',
    organiser: 'LinkedIn Learning',
    type: 'webinar',
    location: 'Online',
    isVirtual: true,
    date: new Date('2026-04-10T12:00:00'),
    endDate: new Date('2026-04-10T13:30:00'),
    time: '12:00 – 13:30',
    description: 'Learn how to optimise your LinkedIn profile, create engaging content, and build a professional brand that attracts recruiters.',
    tags: ['Personal Branding', 'LinkedIn', 'Free'],
    capacity: 500,
    registered: 223,
    image: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=600&h=340&fit=crop',
    isFeatured: false,
    price: 'Free',
  },
  {
    id: 'sample-5',
    title: 'Spring Hackathon: AI for Good',
    organiser: 'Major League Hacking',
    type: 'hackathon',
    location: 'Imperial College London',
    isVirtual: false,
    date: new Date('2026-05-03T09:00:00'),
    endDate: new Date('2026-05-04T18:00:00'),
    time: '09:00 Sat – 18:00 Sun',
    description: '24-hour hackathon building AI solutions for social impact. £5,000 prize pool, mentors from DeepMind and Microsoft, free food and swag.',
    tags: ['AI', 'Hackathon', 'Competition'],
    capacity: 200,
    registered: 156,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=340&fit=crop',
    isFeatured: true,
    price: 'Free',
  },
  {
    id: 'sample-6',
    title: 'Graduate Consulting Panel',
    organiser: 'Consulting Society',
    type: 'panel',
    location: 'LSE, Houghton Street',
    isVirtual: false,
    date: new Date('2026-04-18T17:30:00'),
    endDate: new Date('2026-04-18T19:30:00'),
    time: '17:30 – 19:30',
    description: 'Hear from McKinsey, BCG, and Bain associates about breaking into consulting. Q&A and networking to follow.',
    tags: ['Consulting', 'Panel', 'Graduate'],
    capacity: 120,
    registered: 98,
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=340&fit=crop',
    isFeatured: false,
    price: 'Free',
  },
];

/* ──────────────── helpers ──────────────── */

const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const getDateBadge = (date) => {
  if (!date) return { month: '', day: '' };
  const d = date instanceof Date ? date : new Date(date);
  return {
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  };
};

const spotsLeft = (ev) => {
  if (!ev.capacity) return null;
  const left = ev.capacity - (ev.registered || 0);
  return left;
};

const generateCalendarUrl = (ev) => {
  const start = ev.date instanceof Date ? ev.date : new Date(ev.date);
  const end = ev.endDate ? (ev.endDate instanceof Date ? ev.endDate : new Date(ev.endDate)) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(ev.location || 'Online')}&details=${encodeURIComponent(ev.description || '')}`;
};

/* ──────────────── sub-components ──────────────── */

const TypePill = ({ type, isActive, onClick }) => {
  const match = EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
  const Icon = match.icon;
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
        focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2
        ${isActive
          ? 'bg-purple-600 text-white shadow-md'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-600'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {match.label}
    </button>
  );
};

const StatBadge = ({ icon: Icon, value, label }) => (
  <div className="flex items-center gap-2 text-sm">
    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
      <Icon className="w-4 h-4 text-purple-600" />
    </div>
    <div>
      <p className="font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

/* ──────────────── EventCard ──────────────── */

const EventCard = ({ event, isRegistered, onRSVP, onSave, isSaved, rsvpLoading }) => {
  const badge = getDateBadge(event.date);
  const spots = spotsLeft(event);
  const isFull = spots !== null && spots <= 0;
  const isAlmostFull = spots !== null && spots > 0 && spots <= 20;
  const calUrl = generateCalendarUrl(event);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-300 flex flex-col"
      role="listitem"
      aria-label={`${event.title} on ${formatDate(event.date)}`}
    >
      {/* Hero image */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-purple-100 to-indigo-100">
        {event.image ? (
          <img
            src={event.image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-purple-300" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Featured badge */}
        {event.isFeatured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-bold shadow-sm">
            <Star className="w-3 h-3" /> Featured
          </span>
        )}

        {/* Type badge */}
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-gray-700 capitalize">
          {event.isVirtual ? '🌐 Virtual' : '📍 In-Person'}
        </span>

        {/* Date badge (bottom-left of image) */}
        <div className="absolute bottom-3 left-3 w-12 h-14 bg-white rounded-lg flex flex-col items-center justify-center shadow-md">
          <span className="text-[10px] font-bold text-purple-600 leading-tight">{badge.month}</span>
          <span className="text-lg font-black text-gray-900 leading-tight">{badge.day}</span>
        </div>

        {/* Save / Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); onSave(event); }}
          aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
          className="absolute bottom-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4 text-purple-600" />
            : <Bookmark className="w-4 h-4 text-gray-500" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {event.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[11px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2 group-hover:text-purple-700 transition-colors">
          {event.title}
        </h3>

        <p className="text-xs text-gray-500 mb-2">by {event.organiser || 'PlacementsPortal'}</p>

        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
          {event.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {event.time || 'TBC'}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {event.location || 'Online'}
          </span>
          {event.registered > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" /> {event.registered} going
            </span>
          )}
        </div>

        {/* Capacity bar */}
        {event.capacity && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] mb-1">
              <span className={`font-medium ${isAlmostFull ? 'text-amber-600' : isFull ? 'text-red-600' : 'text-gray-500'}`}>
                {isFull ? 'Fully booked' : isAlmostFull ? `Only ${spots} spots left!` : `${spots} spots remaining`}
              </span>
              <span className="text-gray-400">{event.registered}/{event.capacity}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isFull ? 'bg-red-400' : isAlmostFull ? 'bg-amber-400' : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, ((event.registered || 0) / event.capacity) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-auto">
          {isRegistered ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-semibold flex-1 justify-center">
              <CheckCircle className="w-4 h-4" /> Registered
            </span>
          ) : (
            <button
              onClick={() => onRSVP(event)}
              disabled={isFull || rsvpLoading}
              aria-label={`RSVP for ${event.title}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold
                hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              style={{ minHeight: '44px' }}
            >
              {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
              {isFull ? 'Full' : 'RSVP Now'}
            </button>
          )}

          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Add ${event.title} to Google Calendar`}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <CalendarPlus className="w-4 h-4" />
          </a>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: event.title, text: event.description, url: window.location.href });
              } else {
                navigator.clipboard.writeText(`${event.title} — ${formatDate(event.date)} @ ${event.location || 'Online'}`);
              }
            }}
            aria-label={`Share ${event.title}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

/* ──────────────── Featured Hero Card ──────────────── */

const FeaturedHero = ({ event, isRegistered, onRSVP, rsvpLoading }) => {
  const calUrl = generateCalendarUrl(event);
  const spots = spotsLeft(event);
  const isFull = spots !== null && spots <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-700 to-indigo-800 text-white mb-6"
    >
      <div className="absolute inset-0">
        {event.image && (
          <img src={event.image} alt="" className="w-full h-full object-cover opacity-30" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-transparent" />
      </div>

      <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-bold">
              <Star className="w-3 h-3" /> Featured Event
            </span>
            {event.isVirtual ? (
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">🌐 Virtual</span>
            ) : (
              <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">📍 In-Person</span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-2 leading-tight">{event.title}</h2>
          <p className="text-purple-200 text-sm mb-1">by {event.organiser || 'PlacementsPortal'}</p>
          <p className="text-purple-100/80 text-sm mb-4 line-clamp-2 max-w-lg">{event.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-purple-200 mb-5">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formatDate(event.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {event.time || 'TBC'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {event.location || 'Online'}
            </span>
            {event.registered > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {event.registered} going
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isRegistered ? (
              <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-500/20 text-green-300 rounded-xl text-sm font-semibold border border-green-500/30">
                <CheckCircle className="w-4 h-4" /> You're registered
              </span>
            ) : (
              <button
                onClick={() => onRSVP(event)}
                disabled={isFull || rsvpLoading}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-bold
                  hover:bg-purple-50 transition-colors disabled:opacity-50
                  focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-700"
                style={{ minHeight: '44px' }}
              >
                {rsvpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                {isFull ? 'Fully Booked' : 'RSVP Now — Free'}
              </button>
            )}
            <a
              href={calUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Add to calendar"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white"
              style={{ minHeight: '44px' }}
            >
              <CalendarPlus className="w-4 h-4" /> Add to Calendar
            </a>
          </div>
        </div>

        {/* Right side date block (desktop) */}
        <div className="hidden sm:flex flex-col items-center justify-center w-24 h-24 bg-white/10 backdrop-blur rounded-2xl border border-white/20 flex-shrink-0">
          <span className="text-sm font-bold text-purple-200 uppercase">
            {event.date instanceof Date ? event.date.toLocaleDateString('en-GB', { month: 'short' }) : ''}
          </span>
          <span className="text-3xl font-black leading-tight">
            {event.date instanceof Date ? event.date.getDate() : ''}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ──────────────── RSVP Confirmation Modal ──────────────── */

const RSVPModal = ({ event, isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="rsvp-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`RSVP for ${event.title}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        >
          {/* Header image */}
          {event.image && (
            <div className="h-32 overflow-hidden relative">
              <img src={event.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          )}

          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{event.title}</h3>
            <p className="text-sm text-gray-500 mb-4">by {event.organiser || 'PlacementsPortal'}</p>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>{event.time || 'TBC'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span>{event.location || 'Online'}</span>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-purple-800 font-medium">
                {event.price === 'Free' || !event.price
                  ? '✨ This event is completely free!'
                  : `Ticket price: ${event.price}`}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                You'll receive a confirmation email with joining details.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(event)}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold
                  hover:bg-purple-700 transition-colors disabled:opacity-50
                  focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                style={{ minHeight: '44px' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm RSVP
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ──────────────── My Registrations Panel ──────────────── */

const MyRegistrations = ({ registrations, onViewEvent }) => {
  if (!registrations || registrations.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="font-bold text-gray-900">Your Upcoming Events</h3>
        <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
          {registrations.length}
        </span>
      </div>
      <div className="space-y-2">
        {registrations.map((reg) => {
          const ev = reg.event || reg;
          const badge = getDateBadge(ev.date);
          return (
            <div
              key={reg.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer group"
              onClick={() => onViewEvent && onViewEvent(ev)}
              role="button"
              tabIndex={0}
              aria-label={`View ${ev.title}`}
              onKeyDown={(e) => e.key === 'Enter' && onViewEvent && onViewEvent(ev)}
            >
              <div className="w-10 h-12 bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center flex-shrink-0 group-hover:border-purple-300">
                <span className="text-[9px] font-bold text-purple-600">{badge.month}</span>
                <span className="text-sm font-black text-gray-900 leading-tight">{badge.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-purple-700">{ev.title}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {ev.time || 'TBC'}
                  <span className="text-gray-300">•</span>
                  <MapPin className="w-3 h-3" /> {ev.location || 'Online'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-medium flex-shrink-0">
                <CheckCircle className="w-3 h-3" /> Going
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

const EventsDiscoveryPanel = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  // Data
  const [allEvents, setAllEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());
  const [eventsLoading, setEventsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [sortBy, setSortBy] = useState('date-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState('all'); // 'all', 'virtual', 'in-person'

  // RSVP modal
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpLoadingId, setRsvpLoadingId] = useState(null);

  /* ── Load events ── */
  useEffect(() => {
    const loadData = async () => {
      setEventsLoading(true);
      try {
        // Fetch events from Firestore
        const firestoreEvents = await eventService.getAll({ status: 'upcoming', limit: 50 });
        if (firestoreEvents && firestoreEvents.length > 0) {
          const normalised = firestoreEvents.map(ev => ({
            id: ev.id,
            title: ev.title || ev.name || 'Event',
            organiser: ev.organiser || ev.organizer || '',
            type: ev.type || 'event',
            location: ev.location || ev.venue || '',
            isVirtual: ev.isVirtual || ev.location?.toLowerCase().includes('online') || ev.location?.toLowerCase().includes('zoom') || false,
            date: ev.date instanceof Date ? ev.date : new Date(ev.startDate || ev.date || Date.now()),
            endDate: ev.endDate ? (ev.endDate instanceof Date ? ev.endDate : new Date(ev.endDate)) : null,
            time: ev.time || '',
            description: ev.description || '',
            tags: ev.tags || [],
            capacity: ev.capacity || null,
            registered: ev.registered || 0,
            image: ev.image || '',
            isFeatured: ev.isFeatured || false,
            price: ev.price || 'Free',
          }));
          setAllEvents(normalised);
        } else {
          // Use sample events as fallback
          setAllEvents(SAMPLE_EVENTS);
        }

        // Fetch user's registrations
        if (currentUser?.uid) {
          try {
            const regs = await eventService.getRegistrationsByUser(currentUser.uid);
            setMyRegistrations(regs.filter(r => r.status === 'registered'));
            setRegisteredIds(new Set(regs.filter(r => r.status === 'registered').map(r => r.eventId)));
          } catch (regErr) {
            console.warn('Could not load registrations:', regErr.message);
          }
        }
      } catch (err) {
        console.error('Error loading events:', err);
        setAllEvents(SAMPLE_EVENTS);
      } finally {
        setEventsLoading(false);
      }
    };
    loadData();
  }, [currentUser]);

  /* ── Filter & sort ── */
  const filteredEvents = useMemo(() => {
    let result = [...allEvents];

    // Type filter
    if (activeType !== 'all') {
      result = result.filter(ev => ev.type === activeType);
    }

    // Location filter
    if (locationFilter === 'virtual') {
      result = result.filter(ev => ev.isVirtual);
    } else if (locationFilter === 'in-person') {
      result = result.filter(ev => !ev.isVirtual);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(ev =>
        ev.title.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q) ||
        ev.organiser?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q) ||
        ev.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'popular':
        result.sort((a, b) => (b.registered || 0) - (a.registered || 0));
        break;
      case 'date-asc':
      default:
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return result;
  }, [allEvents, activeType, locationFilter, searchQuery, sortBy]);

  const featuredEvent = useMemo(
    () => filteredEvents.find(ev => ev.isFeatured),
    [filteredEvents]
  );

  const nonFeaturedEvents = useMemo(
    () => filteredEvents.filter(ev => ev !== featuredEvent),
    [filteredEvents, featuredEvent]
  );

  /* ── RSVP handler ── */
  const handleRSVP = useCallback((event) => {
    setRsvpEvent(event);
  }, []);

  const confirmRSVP = useCallback(async (event) => {
    if (!currentUser?.uid) {
      showError('Please sign in to RSVP');
      return;
    }
    setRsvpLoading(true);
    setRsvpLoadingId(event.id);
    try {
      // Optimistic update
      setRegisteredIds(prev => new Set([...prev, event.id]));
      setRsvpEvent(null);

      // Check if sample event (don't call Firestore for samples)
      if (!event.id.startsWith('sample-')) {
        await eventService.register(event.id, currentUser.uid);
      }

      showSuccess(`You're registered for ${event.title}!`);

      // Update registered count locally
      setAllEvents(prev => prev.map(ev =>
        ev.id === event.id ? { ...ev, registered: (ev.registered || 0) + 1 } : ev
      ));
    } catch (err) {
      // Revert optimistic update
      setRegisteredIds(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
      if (err.message?.includes('Already registered')) {
        showError("You're already registered for this event");
      } else if (err.message?.includes('full')) {
        showError('This event is fully booked');
      } else {
        showError('Could not register — please try again');
      }
    } finally {
      setRsvpLoading(false);
      setRsvpLoadingId(null);
    }
  }, [currentUser, showSuccess, showError]);

  /* ── Save/bookmark handler ── */
  const handleSave = useCallback((event) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(event.id)) {
        next.delete(event.id);
      } else {
        next.add(event.id);
      }
      return next;
    });
  }, []);

  /* ── Stats ── */
  const totalEvents = allEvents.length;
  const upcomingThisWeek = allEvents.filter(ev => {
    const d = ev.date instanceof Date ? ev.date : new Date(ev.date);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return d >= now && d <= weekFromNow;
  }).length;

  /* ──────────── RENDER ──────────── */

  if (eventsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
        <p className="text-gray-500 text-sm">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-medium">Career Events</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Discover Career Events</h1>
          <p className="text-purple-100 text-sm sm:text-base max-w-xl mb-5">
            Career fairs, workshops, networking nights, and hackathons — curated for ambitious graduates.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <StatBadge icon={Calendar} value={totalEvents} label="Upcoming events" />
            <StatBadge icon={TrendingUp} value={upcomingThisWeek} label="This week" />
            <StatBadge icon={CheckCircle} value={registeredIds.size} label="You're attending" />
            <StatBadge icon={Bookmark} value={savedIds.size} label="Saved" />
          </div>
        </div>
      </div>

      {/* My Registrations */}
      <MyRegistrations registrations={myRegistrations} />

      {/* Search + Filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search events, topics, or organisers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search events"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort events"
              className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            aria-label="Toggle filters"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors
              focus-visible:ring-2 focus-visible:ring-purple-500
              ${showFilters ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-3 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Format:</span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'virtual', label: '🌐 Virtual' },
                    { id: 'in-person', label: '📍 In-Person' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setLocationFilter(opt.id)}
                      aria-pressed={locationFilter === opt.id}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-purple-500
                        ${locationFilter === opt.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Type pills */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} role="tablist" aria-label="Event type filter">
        {EVENT_TYPES.map(type => (
          <TypePill
            key={type.id}
            type={type.id}
            isActive={activeType === type.id}
            onClick={() => setActiveType(type.id)}
          />
        ))}
      </div>

      {/* Featured Event Hero */}
      {featuredEvent && activeType === 'all' && !searchQuery && (
        <FeaturedHero
          event={featuredEvent}
          isRegistered={registeredIds.has(featuredEvent.id)}
          onRSVP={handleRSVP}
          rsvpLoading={rsvpLoadingId === featuredEvent.id}
        />
      )}

      {/* Events Grid */}
      {nonFeaturedEvents.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          role="list"
          aria-label="Career events"
        >
          <AnimatePresence>
            {nonFeaturedEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isRegistered={registeredIds.has(event.id)}
                onRSVP={handleRSVP}
                onSave={handleSave}
                isSaved={savedIds.has(event.id)}
                rsvpLoading={rsvpLoadingId === event.id}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery ? `No events match "${searchQuery}". Try a different search.` : 'No events in this category yet.'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveType('all'); setLocationFilter('all'); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Peer Engagement CTA */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-100 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">Attend with your peers</h3>
            <p className="text-sm text-gray-600">
              Share events with classmates and see who's going. Build your network together.
            </p>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Career Events on PlacementsPortal',
                  text: 'Check out these career events!',
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                showSuccess('Link copied to clipboard!');
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-purple-500"
            style={{ minHeight: '44px' }}
          >
            <Share2 className="w-4 h-4" /> Share Events
          </button>
        </div>
      </div>

      {/* RSVP Confirmation Modal */}
      <RSVPModal
        event={rsvpEvent}
        isOpen={!!rsvpEvent}
        onClose={() => setRsvpEvent(null)}
        onConfirm={confirmRSVP}
        loading={rsvpLoading}
      />
    </div>
  );
};

export default EventsDiscoveryPanel;
