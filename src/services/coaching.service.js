import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const coachingService = {
  /**
   * Get upcoming sessions for a coach (by coachId field)
   */
  async getSessionsByCoach(coachId, maxResults = 20) {
    try {
      const q = query(
        collection(db, 'coachingSessions'),
        where('coachId', '==', coachId),
        orderBy('date', 'asc'),
        limit(maxResults)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate?.() ?? d.data().date,
        createdAt: d.data().createdAt?.toDate?.() ?? d.data().createdAt
      }));
    } catch (error) {
      console.error('Error fetching coach sessions:', error);
      return [];
    }
  },

  /**
   * Get all sessions for a student
   */
  async getSessionsByStudent(studentId) {
    try {
      const q = query(
        collection(db, 'coachingSessions'),
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        date: d.data().date?.toDate?.() ?? d.data().date,
        createdAt: d.data().createdAt?.toDate?.() ?? d.data().createdAt
      }));
    } catch (error) {
      console.error('Error fetching student sessions:', error);
      return [];
    }
  },

  /**
   * Get unique students coached by this coach
   * Returns user docs for each unique studentId found in sessions
   */
  async getCoachStudents(coachId) {
    try {
      const sessions = await this.getSessionsByCoach(coachId, 100);
      const uniqueStudentIds = [...new Set(sessions.map(s => s.studentId).filter(Boolean))];

      const studentProfiles = await Promise.all(
        uniqueStudentIds.map(async (uid) => {
          try {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
              const data = userSnap.data();
              const studentSessions = sessions.filter(s => s.studentId === uid);
              const completedSessions = studentSessions.filter(s => s.status === 'completed');
              const lastSession = studentSessions
                .filter(s => s.status === 'completed')
                .sort((a, b) => (b.date || 0) - (a.date || 0))[0];

              return {
                id: uid,
                name: data.displayName || data.name || 'Unknown',
                email: data.email || '',
                major: data.course || data.major || '',
                year: data.year || '',
                status: data.status || 'Active',
                totalSessions: studentSessions.length,
                completedSessions: completedSessions.length,
                lastSession: lastSession?.date || null,
                goals: data.goals || [],
                progress: data.progress || 0
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      return studentProfiles.filter(Boolean);
    } catch (error) {
      console.error('Error fetching coach students:', error);
      return [];
    }
  },

  /**
   * Aggregate stats for a coach
   */
  async getCoachStats(coachId) {
    try {
      const sessions = await this.getSessionsByCoach(coachId, 200);
      const now = new Date();

      const weekFromNow = new Date(now);
      weekFromNow.setDate(now.getDate() + 7);

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const upcomingThisWeek = sessions.filter(s => {
        const d = s.date instanceof Date ? s.date : new Date(s.date);
        return d >= now && d <= weekFromNow && s.status !== 'cancelled';
      }).length;

      const completedToday = sessions.filter(s => {
        const d = s.date instanceof Date ? s.date : new Date(s.date);
        return d >= todayStart && d <= todayEnd && s.status === 'completed';
      }).length;

      const totalCompleted = sessions.filter(s => s.status === 'completed').length;
      const totalHours = sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.duration || 60), 0) / 60;

      const ratings = sessions.filter(s => s.rating).map(s => s.rating);
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;

      const uniqueStudents = [...new Set(sessions.map(s => s.studentId).filter(Boolean))];

      return {
        totalStudents: uniqueStudents.length,
        activeSessions: sessions.filter(s => s.status === 'confirmed').length,
        completedToday,
        upcomingThisWeek,
        avgRating: avgRating ?? '—',
        totalHours: Math.round(totalHours),
        totalCompleted
      };
    } catch (error) {
      console.error('Error computing coach stats:', error);
      return {
        totalStudents: 0,
        activeSessions: 0,
        completedToday: 0,
        upcomingThisWeek: 0,
        avgRating: '—',
        totalHours: 0,
        totalCompleted: 0
      };
    }
  },

  /**
   * Recent activity feed for coach
   */
  async getRecentActivity(coachId, maxItems = 10) {
    try {
      const q = query(
        collection(db, 'coachingSessions'),
        where('coachId', '==', coachId),
        orderBy('updatedAt', 'desc'),
        limit(maxItems)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => {
        const data = d.data();
        const updatedAt = data.updatedAt?.toDate?.() ?? new Date();
        const diffMs = Date.now() - updatedAt.getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const timeAgo = diffHrs < 1 ? 'Just now'
          : diffHrs < 24 ? `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`
          : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        const typeMap = {
          completed: 'completed',
          confirmed: 'scheduled',
          pending: 'scheduled',
          cancelled: 'cancelled'
        };

        const actionMap = {
          completed: `Completed ${data.sessionType || 'session'}`,
          confirmed: `Scheduled ${data.sessionType || 'session'}`,
          pending: `Pending ${data.sessionType || 'session'} request`,
          cancelled: `Cancelled ${data.sessionType || 'session'}`
        };

        return {
          id: d.id,
          type: typeMap[data.status] || 'scheduled',
          student: data.studentName || 'Student',
          action: actionMap[data.status] || 'Session update',
          time: timeAgo
        };
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  /**
   * Create a new coaching session
   */
  async createSession(sessionData) {
    try {
      const docRef = await addDoc(collection(db, 'coachingSessions'), {
        ...sessionData,
        status: sessionData.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating coaching session:', error);
      throw new Error('Failed to create session');
    }
  },

  /**
   * Update session status (confirm, complete, cancel) with optional note
   */
  async updateSessionStatus(sessionId, status, note = '') {
    try {
      const updates = {
        status,
        updatedAt: serverTimestamp()
      };
      if (note) updates.coachNote = note;
      if (status === 'completed') updates.completedAt = serverTimestamp();
      await updateDoc(doc(db, 'coachingSessions', sessionId), updates);
    } catch (error) {
      console.error('Error updating session status:', error);
      throw new Error('Failed to update session');
    }
  }
};

export default coachingService;
