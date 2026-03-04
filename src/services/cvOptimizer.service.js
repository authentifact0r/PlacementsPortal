/**
 * CV Optimizer Service
 * Handles AI CV optimization, token tracking, and outcome management
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// ============================================
// ENTITLEMENT & TOKEN MANAGEMENT
// ============================================

/**
 * Check if user has CV Optimizer access
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { hasAccess, tokensRemaining, purchaseDate }
 */
export const checkCVOptimizerAccess = async (userId) => {
  try {
    const serviceDoc = await getDoc(doc(db, 'services', userId));
    
    if (!serviceDoc.exists()) {
      return {
        hasAccess: false,
        tokensRemaining: 0,
        purchaseDate: null,
        totalTokens: 0
      };
    }

    const data = serviceDoc.data();
    return {
      hasAccess: data.has_cv_optimizer || false,
      tokensRemaining: data.cv_tokens || 0,
      purchaseDate: data.cv_optimizer_purchased_at,
      totalTokens: data.cv_tokens_total || 0
    };
  } catch (error) {
    console.error('Error checking CV optimizer access:', error);
    throw error;
  }
};

/**
 * Purchase CV Optimizer service (£35)
 * Initializes access and tokens
 * @param {string} userId - User ID
 * @param {number} initialTokens - Starting token count (default 5)
 * @param {Object} paymentDetails - Payment metadata
 * @returns {Promise<Object>} Service activation details
 */
export const purchaseCVOptimizer = async (userId, initialTokens = 5, paymentDetails = {}) => {
  try {
    const serviceRef = doc(db, 'services', userId);
    const serviceData = {
      user_id: userId,
      has_cv_optimizer: true,
      cv_tokens: initialTokens,
      cv_tokens_total: initialTokens,
      cv_optimizer_purchased_at: serverTimestamp(),
      payment_amount: 35, // £35
      payment_currency: 'GBP',
      payment_method: paymentDetails.method || 'stripe',
      payment_id: paymentDetails.paymentId || null,
      updated_at: serverTimestamp()
    };

    await setDoc(serviceRef, serviceData, { merge: true });

    // Log purchase in history
    await addDoc(collection(db, 'purchase_history'), {
      user_id: userId,
      service_type: 'cv_optimizer',
      amount: 35,
      currency: 'GBP',
      tokens_granted: initialTokens,
      payment_details: paymentDetails,
      purchased_at: serverTimestamp()
    });

    return {
      success: true,
      tokensGranted: initialTokens,
      message: `CV Optimizer activated! You have ${initialTokens} tokens.`
    };
  } catch (error) {
    console.error('Error purchasing CV optimizer:', error);
    throw error;
  }
};

/**
 * Consume one CV optimization token
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated token count
 */
export const consumeToken = async (userId) => {
  try {
    const serviceRef = doc(db, 'services', userId);
    const serviceDoc = await getDoc(serviceRef);

    if (!serviceDoc.exists()) {
      throw new Error('No CV Optimizer access found');
    }

    const currentTokens = serviceDoc.data().cv_tokens || 0;
    
    if (currentTokens <= 0) {
      throw new Error('No tokens remaining. Please purchase more tokens.');
    }

    // Decrement token count
    await updateDoc(serviceRef, {
      cv_tokens: increment(-1),
      last_token_used_at: serverTimestamp()
    });

    return {
      success: true,
      tokensRemaining: currentTokens - 1,
      message: 'Token used successfully'
    };
  } catch (error) {
    console.error('Error using token:', error);
    throw error;
  }
};

/**
 * Add more tokens (top-up purchase)
 * @param {string} userId - User ID
 * @param {number} tokensToAdd - Number of tokens to add
 * @param {Object} paymentDetails - Payment metadata
 * @returns {Promise<Object>} Updated token count
 */
export const addTokens = async (userId, tokensToAdd, paymentDetails = {}) => {
  try {
    const serviceRef = doc(db, 'services', userId);
    
    await updateDoc(serviceRef, {
      cv_tokens: increment(tokensToAdd),
      cv_tokens_total: increment(tokensToAdd),
      last_topup_at: serverTimestamp()
    });

    // Log top-up in history
    await addDoc(collection(db, 'purchase_history'), {
      user_id: userId,
      service_type: 'cv_optimizer_topup',
      tokens_added: tokensToAdd,
      payment_details: paymentDetails,
      purchased_at: serverTimestamp()
    });

    return {
      success: true,
      tokensAdded: tokensToAdd,
      message: `${tokensToAdd} tokens added successfully!`
    };
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
};

// ============================================
// CV OPTIMIZATION & FILE HANDLING
// ============================================

/**
 * Upload CV to Firebase Storage
 * @param {File} file - CV file (PDF, DOCX)
 * @param {string} userId - User ID
 * @returns {Promise<string>} Download URL
 */
export const uploadCV = async (file, userId) => {
  try {
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `cvs/${userId}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading CV:', error);
    throw error;
  }
};

/**
 * Optimize CV using AI
 * This would call your AI service (OpenAI, Claude, etc.)
 * For now, returns mock response
 * 
 * @param {string} cvUrl - Original CV URL
 * @param {string} userId - User ID
 * @param {Object} options - Optimization preferences
 * @returns {Promise<Object>} Optimized CV data
 */
export const optimizeCV = async (cvUrl, userId, options = {}) => {
  try {
    // Consume token
    await consumeToken(userId);

    // TODO: Integrate with actual AI service (OpenAI, Claude, etc.)
    // For now, simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate 3s processing

    // Mock optimized CV URL (in production, this would be the AI-generated file)
    const optimizedUrl = cvUrl; // Replace with actual AI output URL

    // Create optimization record
    const optimizationRef = await addDoc(collection(db, 'cv_optimizations'), {
      user_id: userId,
      original_cv_url: cvUrl,
      optimized_cv_url: optimizedUrl,
      optimization_type: options.type || 'general',
      token_used_at: serverTimestamp(),
      status: 'completed',
      linked_job_id: null,
      linked_job_outcome: null,
      ai_suggestions: options.suggestions || [],
      created_at: serverTimestamp()
    });

    return {
      success: true,
      optimizationId: optimizationRef.id,
      originalUrl: cvUrl,
      optimizedUrl: optimizedUrl,
      suggestions: [
        'Added strong action verbs to work experience',
        'Optimized formatting for ATS compatibility',
        'Enhanced skills section with relevant keywords',
        'Improved summary to highlight key achievements'
      ]
    };
  } catch (error) {
    console.error('Error optimizing CV:', error);
    throw error;
  }
};

// ============================================
// APPLICATION OUTCOME TRACKING
// ============================================

/**
 * Link optimization to job opportunity
 * @param {string} optimizationId - CV optimization ID
 * @param {string} jobId - Job opportunity ID
 * @returns {Promise<Object>} Updated optimization
 */
export const linkToJobOpportunity = async (optimizationId, jobId) => {
  try {
    const optimizationRef = doc(db, 'cv_optimizations', optimizationId);
    
    await updateDoc(optimizationRef, {
      linked_job_id: jobId,
      linked_at: serverTimestamp()
    });

    return {
      success: true,
      message: 'CV linked to job opportunity'
    };
  } catch (error) {
    console.error('Error linking to job:', error);
    throw error;
  }
};

/**
 * Update application outcome
 * @param {string} optimizationId - CV optimization ID
 * @param {string} outcome - 'applied' | 'interviewed' | 'offered' | 'rejected'
 * @param {string} notes - Additional notes
 * @returns {Promise<Object>} Updated outcome
 */
export const updateApplicationOutcome = async (optimizationId, outcome, notes = '') => {
  try {
    const validOutcomes = ['applied', 'interviewed', 'offered', 'rejected'];
    
    if (!validOutcomes.includes(outcome)) {
      throw new Error(`Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`);
    }

    const optimizationRef = doc(db, 'cv_optimizations', optimizationId);
    
    await updateDoc(optimizationRef, {
      linked_job_outcome: outcome,
      outcome_notes: notes,
      outcome_updated_at: serverTimestamp()
    });

    return {
      success: true,
      outcome,
      message: 'Application outcome updated'
    };
  } catch (error) {
    console.error('Error updating outcome:', error);
    throw error;
  }
};

/**
 * Get CV optimization history for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of optimizations
 */
export const getCVOptimizationHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'cv_optimizations'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    const optimizations = [];

    snapshot.forEach(doc => {
      optimizations.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return optimizations;
  } catch (error) {
    console.error('Error getting CV history:', error);
    throw error;
  }
};

/**
 * Get optimization statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Stats (total optimizations, outcomes breakdown, success rate)
 */
export const getCVOptimizationStats = async (userId) => {
  try {
    const optimizations = await getCVOptimizationHistory(userId);
    
    const stats = {
      total: optimizations.length,
      outcomes: {
        applied: 0,
        interviewed: 0,
        offered: 0,
        rejected: 0,
        pending: 0
      },
      successRate: 0,
      linkedJobs: 0
    };

    optimizations.forEach(opt => {
      if (opt.linked_job_id) {
        stats.linkedJobs++;
      }

      const outcome = opt.linked_job_outcome;
      if (outcome) {
        stats.outcomes[outcome]++;
      } else {
        stats.outcomes.pending++;
      }
    });

    // Calculate success rate (offered / total with outcomes)
    const totalWithOutcomes = stats.outcomes.offered + stats.outcomes.rejected;
    if (totalWithOutcomes > 0) {
      stats.successRate = Math.round((stats.outcomes.offered / totalWithOutcomes) * 100);
    }

    return stats;
  } catch (error) {
    console.error('Error getting CV stats:', error);
    throw error;
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const cvOptimizerService = {
  // Entitlement
  checkCVOptimizerAccess,
  purchaseCVOptimizer,
  consumeToken,
  addTokens,
  
  // CV Processing
  uploadCV,
  optimizeCV,
  
  // Outcome Tracking
  linkToJobOpportunity,
  updateApplicationOutcome,
  getCVOptimizationHistory,
  getCVOptimizationStats
};

export default cvOptimizerService;
