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

export const opportunityService = {
  /**
   * Create new opportunity
   */
  async create(data, userId) {
    try {
      const docRef = await addDoc(collection(db, 'opportunities'), {
        ...data,
        employerId: userId,
        status: 'pending', // Requires admin approval
        applications: 0,
        views: 0,
        featured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw new Error('Failed to create opportunity');
    }
  },

  /**
   * Get all opportunities with filters
   */
  async getAll(filters = {}) {
    try {
      let q = query(collection(db, 'opportunities'));
      
      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.remote !== undefined) {
        q = query(q, where('location.remote', '==', filters.remote));
      }
      if (filters.employerId) {
        q = query(q, where('employerId', '==', filters.employerId));
      }
      
      // Only show active opportunities by default
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      } else {
        q = query(q, where('status', '==', 'active'));
      }
      
      // Sort by created date
      q = query(q, orderBy('createdAt', 'desc'));
      
      // Limit results
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Convert Firestore timestamps to Date objects
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      throw new Error('Failed to fetch opportunities');
    }
  },

  /**
   * Get single opportunity by ID
   */
  async getById(id) {
    try {
      const docRef = doc(db, 'opportunities', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Increment view count asynchronously (don't wait)
        updateDoc(docRef, {
          views: increment(1)
        }).catch(err => console.error('Error incrementing views:', err));
        
        return { 
          id: docSnap.id, 
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          expiresAt: docSnap.data().expiresAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      throw new Error('Failed to fetch opportunity');
    }
  },

  /**
   * Update opportunity
   */
  async update(id, data) {
    try {
      const docRef = doc(db, 'opportunities', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw new Error('Failed to update opportunity');
    }
  },

  /**
   * Delete opportunity
   */
  async delete(id) {
    try {
      await deleteDoc(doc(db, 'opportunities', id));
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      throw new Error('Failed to delete opportunity');
    }
  },

  /**
   * Apply to opportunity
   */
  async apply(opportunityId, applicationData) {
    try {
      // First, get the opportunity to get employer ID
      const opportunity = await this.getById(opportunityId);
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }

      // Create application document
      const appRef = await addDoc(collection(db, 'applications'), {
        ...applicationData,
        opportunityId,
        employerId: opportunity.employerId,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Increment application count
      const oppRef = doc(db, 'opportunities', opportunityId);
      await updateDoc(oppRef, {
        applications: increment(1)
      });

      return appRef.id;
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      throw new Error('Failed to submit application');
    }
  },

  /**
   * Get applications for a specific opportunity
   */
  async getApplicationsByOpportunity(opportunityId) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('opportunityId', '==', opportunityId),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Failed to fetch applications');
    }
  },

  /**
   * Get applications for employer
   */
  async getApplicationsByEmployer(employerId) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('employerId', '==', employerId),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Failed to fetch applications');
    }
  },

  /**
   * Get applications for student
   */
  async getApplicationsByStudent(studentId) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('studentId', '==', studentId),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Failed to fetch applications');
    }
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId, status, notes = '') {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status,
        notes,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      throw new Error('Failed to update application status');
    }
  },

  /**
   * Check if user has already applied
   */
  async hasApplied(opportunityId, studentId) {
    try {
      const q = query(
        collection(db, 'applications'),
        where('opportunityId', '==', opportunityId),
        where('studentId', '==', studentId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking application:', error);
      return false;
    }
  },

  /**
   * Save/bookmark opportunity
   */
  async saveOpportunity(opportunityId, userId) {
    try {
      await addDoc(collection(db, 'savedOpportunities'), {
        opportunityId,
        userId,
        savedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving opportunity:', error);
      throw new Error('Failed to save opportunity');
    }
  },

  /**
   * Unsave opportunity
   */
  async unsaveOpportunity(opportunityId, userId) {
    try {
      const q = query(
        collection(db, 'savedOpportunities'),
        where('opportunityId', '==', opportunityId),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error unsaving opportunity:', error);
      throw new Error('Failed to unsave opportunity');
    }
  },

  /**
   * Get saved opportunities for user
   */
  async getSavedOpportunities(userId) {
    try {
      const q = query(
        collection(db, 'savedOpportunities'),
        where('userId', '==', userId),
        orderBy('savedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const savedIds = snapshot.docs.map(doc => doc.data().opportunityId);
      
      if (savedIds.length === 0) return [];
      
      // Fetch actual opportunities
      const opportunities = await Promise.all(
        savedIds.map(id => this.getById(id))
      );
      
      return opportunities.filter(opp => opp !== null);
    } catch (error) {
      console.error('Error fetching saved opportunities:', error);
      throw new Error('Failed to fetch saved opportunities');
    }
  }
};
