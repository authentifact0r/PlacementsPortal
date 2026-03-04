/**
 * Job Tracking Service
 * Tracks job clicks, applications, and conversions for analytics
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const jobTrackingService = {
  /**
   * Track when a user clicks on a job
   */
  async trackJobClick(userId, jobData) {
    try {
      const clickId = `${userId}_${jobData.jobId}_${Date.now()}`;
      const clickRef = doc(db, 'job_clicks', clickId);
      
      await setDoc(clickRef, {
        userId,
        jobId: jobData.jobId,
        jobTitle: jobData.jobTitle || jobData.title,
        company: jobData.company || jobData.employerName,
        location: jobData.location || jobData.locationName,
        salary: jobData.salary || jobData.minimumSalary,
        source: jobData.source || 'reed',
        clickedAt: serverTimestamp(),
        applied: false,
        status: 'clicked',
        metadata: {
          jobType: jobData.jobType,
          expirationDate: jobData.expirationDate,
          jobUrl: jobData.jobUrl
        }
      });

      console.log('✅ Job click tracked:', clickId);
      return clickId;
    } catch (error) {
      console.error('❌ Error tracking job click:', error);
      throw error;
    }
  },

  /**
   * Track when a user submits an application
   */
  async trackJobApplication(userId, jobData, applicationData = {}) {
    try {
      const applicationId = `${userId}_${jobData.jobId}_${Date.now()}`;
      const applicationRef = doc(db, 'job_applications', applicationId);
      
      await setDoc(applicationRef, {
        userId,
        jobId: jobData.jobId,
        jobTitle: jobData.jobTitle || jobData.title,
        company: jobData.company || jobData.employerName,
        location: jobData.location || jobData.locationName,
        salary: jobData.salary || jobData.minimumSalary,
        source: jobData.source || 'reed',
        appliedAt: serverTimestamp(),
        status: 'pending',
        
        // Application details
        applicationMethod: applicationData.method || 'external', // external, platform, email
        cvVersion: applicationData.cvVersion,
        coverLetter: applicationData.coverLetter || false,
        notes: applicationData.notes || '',
        
        // Tracking data
        clickedBefore: applicationData.clickedBefore || false,
        timeToApply: applicationData.timeToApply || null,
        
        // Status tracking
        statusHistory: [{
          status: 'pending',
          timestamp: Timestamp.now(),
          note: 'Application submitted'
        }],
        
        metadata: {
          jobType: jobData.jobType,
          expirationDate: jobData.expirationDate,
          jobUrl: jobData.jobUrl,
          userAgent: navigator.userAgent
        }
      });

      // Update the click record if it exists
      try {
        const clicksQuery = query(
          collection(db, 'job_clicks'),
          where('userId', '==', userId),
          where('jobId', '==', jobData.jobId),
          orderBy('clickedAt', 'desc'),
          limit(1)
        );
        const clicksSnapshot = await getDocs(clicksQuery);
        
        if (!clicksSnapshot.empty) {
          const clickDoc = clicksSnapshot.docs[0];
          await updateDoc(clickDoc.ref, {
            applied: true,
            applicationId: applicationId,
            status: 'applied'
          });
        }
      } catch (error) {
        console.warn('Could not update click record:', error);
      }

      console.log('✅ Job application tracked:', applicationId);
      return applicationId;
    } catch (error) {
      console.error('❌ Error tracking job application:', error);
      throw error;
    }
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId, newStatus, note = '') {
    try {
      const applicationRef = doc(db, 'job_applications', applicationId);
      const applicationDoc = await getDoc(applicationRef);
      
      if (!applicationDoc.exists()) {
        throw new Error('Application not found');
      }

      const currentHistory = applicationDoc.data().statusHistory || [];
      
      await updateDoc(applicationRef, {
        status: newStatus,
        statusHistory: [
          ...currentHistory,
          {
            status: newStatus,
            timestamp: Timestamp.now(),
            note: note
          }
        ],
        updatedAt: serverTimestamp()
      });

      console.log('✅ Application status updated:', newStatus);
      return true;
    } catch (error) {
      console.error('❌ Error updating application status:', error);
      throw error;
    }
  },

  /**
   * Get user's job clicks
   */
  async getUserClicks(userId, limitCount = 50) {
    try {
      const clicksQuery = query(
        collection(db, 'job_clicks'),
        where('userId', '==', userId),
        orderBy('clickedAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(clicksQuery);
      const clicks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        clickedAt: doc.data().clickedAt?.toDate()
      }));

      return clicks;
    } catch (error) {
      console.error('❌ Error fetching user clicks:', error);
      return [];
    }
  },

  /**
   * Get user's applications
   */
  async getUserApplications(userId, statusFilter = null, limitCount = 50) {
    try {
      let applicationsQuery = query(
        collection(db, 'job_applications'),
        where('userId', '==', userId),
        orderBy('appliedAt', 'desc'),
        limit(limitCount)
      );

      if (statusFilter) {
        applicationsQuery = query(
          collection(db, 'job_applications'),
          where('userId', '==', userId),
          where('status', '==', statusFilter),
          orderBy('appliedAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const snapshot = await getDocs(applicationsQuery);
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate(),
        statusHistory: doc.data().statusHistory?.map(h => ({
          ...h,
          timestamp: h.timestamp?.toDate()
        }))
      }));

      return applications;
    } catch (error) {
      console.error('❌ Error fetching user applications:', error);
      return [];
    }
  },

  /**
   * Get application statistics for dashboard
   */
  async getApplicationStats(userId) {
    try {
      const applications = await this.getUserApplications(userId);
      const clicks = await this.getUserClicks(userId);

      const stats = {
        totalApplications: applications.length,
        totalClicks: clicks.length,
        conversionRate: clicks.length > 0 ? ((applications.length / clicks.length) * 100).toFixed(1) : 0,
        
        // Status breakdown
        pending: applications.filter(a => a.status === 'pending').length,
        interviewing: applications.filter(a => a.status === 'interviewing').length,
        offered: applications.filter(a => a.status === 'offered').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        
        // Recent activity
        clicksThisWeek: this._countThisWeek(clicks, 'clickedAt'),
        applicationsThisWeek: this._countThisWeek(applications, 'appliedAt'),
        
        // Top companies
        topCompanies: this._getTopCompanies(applications)
      };

      return stats;
    } catch (error) {
      console.error('❌ Error calculating application stats:', error);
      return {
        totalApplications: 0,
        totalClicks: 0,
        conversionRate: 0,
        pending: 0,
        interviewing: 0,
        offered: 0,
        rejected: 0,
        clicksThisWeek: 0,
        applicationsThisWeek: 0,
        topCompanies: []
      };
    }
  },

  /**
   * Helper: Count items from this week
   */
  _countThisWeek(items, dateField) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return items.filter(item => {
      const itemDate = item[dateField];
      return itemDate && itemDate >= oneWeekAgo;
    }).length;
  },

  /**
   * Helper: Get top companies by application count
   */
  _getTopCompanies(applications) {
    const companyCounts = {};
    
    applications.forEach(app => {
      const company = app.company;
      if (company) {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      }
    });

    return Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));
  }
};

export default jobTrackingService;
