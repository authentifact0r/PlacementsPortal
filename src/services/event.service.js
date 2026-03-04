import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  getDoc,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export const eventService = {
  /**
   * Create new event
   */
  async create(data, creatorId) {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...data,
        registered: 0,
        status: 'upcoming',
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  },

  /**
   * Get all events with filters
   */
  async getAll(filters = {}) {
    try {
      let q = query(collection(db, 'events'));
      
      // Apply filters
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      } else {
        // Default to upcoming events
        q = query(q, where('status', '==', 'upcoming'));
      }
      
      // Sort by date
      q = query(q, orderBy('date', 'asc'));
      
      // Limit results
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  },

  /**
   * Get single event by ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, 'events', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { 
          id: docSnap.id, 
          ...docSnap.data(),
          date: docSnap.data().date?.toDate(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }
  },

  /**
   * Update event
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  },

  /**
   * Delete event
   */
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  },

  /**
   * Register for event
   */
  async register(eventId, userId, paymentStatus = 'free') {
    try {
      // Check capacity
      const event = await this.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.registered >= event.capacity) {
        throw new Error('Event is full');
      }

      // Check if already registered
      const isRegistered = await this.isRegistered(eventId, userId);
      if (isRegistered) {
        throw new Error('Already registered for this event');
      }

      // Create registration
      const regRef = await addDoc(collection(db, 'eventRegistrations'), {
        eventId,
        userId,
        status: 'registered',
        paymentStatus,
        registeredAt: serverTimestamp()
      });

      // Increment registered count
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        registered: increment(1)
      });

      return regRef.id;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  /**
   * Cancel registration
   */
  async cancelRegistration(eventId, userId) {
    try {
      const q = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('userId', '==', userId),
        where('status', '==', 'registered')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Registration not found');
      }

      const regDoc = snapshot.docs[0];
      
      // Update registration status
      await updateDoc(regDoc.ref, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });

      // Decrement registered count
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        registered: increment(-1)
      });

      return regDoc.id;
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  },

  /**
   * Check if user is registered
   */
  async isRegistered(eventId, userId) {
    try {
      const q = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('userId', '==', userId),
        where('status', '==', 'registered'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  },

  /**
   * Get registrations for event
   */
  async getRegistrationsByEvent(eventId) {
    try {
      const q = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        orderBy('registeredAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate(),
        cancelledAt: doc.data().cancelledAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching registrations:', error);
      throw new Error('Failed to fetch registrations');
    }
  },

  /**
   * Get registrations for user
   */
  async getRegistrationsByUser(userId) {
    try {
      const q = query(
        collection(db, 'eventRegistrations'),
        where('userId', '==', userId),
        orderBy('registeredAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const registrations = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        registeredAt: doc.data().registeredAt?.toDate(),
        cancelledAt: doc.data().cancelledAt?.toDate()
      }));

      // Fetch event details for each registration
      const registrationsWithEvents = await Promise.all(
        registrations.map(async (reg) => {
          const event = await this.getById(reg.eventId);
          return { ...reg, event };
        })
      );

      return registrationsWithEvents;
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      throw new Error('Failed to fetch registrations');
    }
  },

  /**
   * Get upcoming events for user
   */
  async getUpcomingEventsForUser(userId) {
    try {
      const registrations = await this.getRegistrationsByUser(userId);
      const now = new Date();
      
      return registrations
        .filter(reg => 
          reg.status === 'registered' && 
          reg.event && 
          reg.event.date > now
        )
        .sort((a, b) => a.event.date - b.event.date);
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  },

  /**
   * Mark attendance
   */
  async markAttendance(registrationId) {
    try {
      await updateDoc(doc(db, 'eventRegistrations', registrationId), {
        status: 'attended',
        attendedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw new Error('Failed to mark attendance');
    }
  }
};
