/**
 * Elevated Pitch Service
 * Handles AI script generation, video storage, and pitch sharing
 */

import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// 1. AI SCRIPT GENERATION
// ============================================

/**
 * Generate pitch script using OpenAI API
 * 
 * @param {Object} studentData - Student profile data
 * @returns {Promise<string>} Generated script
 */
export const generatePitchScript = async (studentData) => {
  const {
    fullName = 'Student',
    major = 'Computer Science',
    skills = ['JavaScript', 'React', 'Node.js'],
    targetRole = 'Software Engineer'
  } = studentData;

  try {
    const openaiKey = process.env.REACT_APP_OPENAI_API_KEY;

    if (!openaiKey) {
      console.warn('OpenAI API key not configured. Using template script.');
      return generateTemplateScript(studentData);
    }

    const prompt = `Generate a professional 45-second video pitch script for a graduate named ${fullName}.

Context:
- Major: ${major}
- Skills: ${skills.join(', ')}
- Target Role: ${targetRole}

Requirements:
- Exactly 45 seconds when spoken at normal pace (~110 words)
- Professional but personable tone
- Include: Introduction, key skills, what they're looking for
- End with a call-to-action
- Format as paragraphs (not bullet points)

Script:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional career coach helping graduates create compelling video pitches.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const script = data.choices[0].message.content.trim();

    console.log('✅ Generated script via OpenAI');
    return script;

  } catch (error) {
    console.error('Error generating script with OpenAI:', error);
    console.log('Falling back to template script');
    return generateTemplateScript(studentData);
  }
};

/**
 * Generate template script (fallback when OpenAI unavailable)
 */
const generateTemplateScript = (studentData) => {
  const {
    fullName = 'Student',
    major = 'Computer Science',
    skills = ['JavaScript', 'React', 'Node.js'],
    targetRole = 'Software Engineer'
  } = studentData;

  return `Hi, I'm ${fullName}, a recent ${major} graduate passionate about technology and innovation.

I specialize in ${skills.slice(0, 3).join(', ')}, and I've built several projects that demonstrate my ability to deliver real-world solutions. My experience includes working with modern development practices and collaborating in agile teams.

I'm actively seeking opportunities as a ${targetRole} where I can contribute my technical skills and continue growing as a professional. I'm excited about roles that challenge me to solve complex problems and make a meaningful impact.

If you're looking for a motivated, quick-learning graduate ready to add value to your team, I'd love to connect. Thank you for watching, and I look forward to hearing from you!`;
};

// ============================================
// 2. VIDEO STORAGE
// ============================================

/**
 * Upload video to Supabase Storage
 * 
 * @param {Blob} videoBlob - Recorded video blob
 * @param {string} userId - User ID
 * @returns {Promise<string>} Public video URL
 */
export const uploadVideoPitch = async (videoBlob, userId) => {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured. Using mock URL.');
      return getMockVideoUrl(userId);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `pitch_${userId}_${timestamp}.webm`;

    // Upload to Supabase Storage
    const formData = new FormData();
    formData.append('file', videoBlob, filename);

    const response = await fetch(`${supabaseUrl}/storage/v1/object/video-pitches/${filename}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Supabase upload failed: ${response.status}`);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/video-pitches/${filename}`;
    console.log('✅ Video uploaded to Supabase:', publicUrl);

    return publicUrl;

  } catch (error) {
    console.error('Error uploading video:', error);
    console.log('Using mock video URL');
    return getMockVideoUrl(userId);
  }
};

/**
 * Get mock video URL for demo/testing
 */
const getMockVideoUrl = (userId) => {
  return `https://storage.placementsportal.com/pitches/${userId}_${Date.now()}.webm`;
};

// ============================================
// 3. DATABASE OPERATIONS
// ============================================

/**
 * Save video pitch to user profile
 * 
 * @param {string} userId - User ID
 * @param {Object} pitchData - Pitch data
 * @returns {Promise<Object>} Saved pitch data
 */
export const saveVideoPitch = async (userId, pitchData) => {
  try {
    const {
      videoUrl,
      script,
      duration,
      thumbnail = null
    } = pitchData;

    // Update user profile with video_pitch_url
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      video_pitch_url: videoUrl,
      video_pitch_updated_at: serverTimestamp()
    });

    // Save to video_pitches collection for tracking
    const pitchRef = await addDoc(collection(db, 'video_pitches'), {
      user_id: userId,
      video_url: videoUrl,
      script_text: script,
      duration_seconds: duration,
      thumbnail_url: thumbnail,
      views_count: 0,
      created_at: serverTimestamp(),
      is_active: true
    });

    console.log('✅ Video pitch saved to database');

    return {
      success: true,
      pitchId: pitchRef.id,
      videoUrl
    };

  } catch (error) {
    console.error('Error saving video pitch:', error);
    throw error;
  }
};

/**
 * Get user's video pitch
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Pitch data or null
 */
export const getUserVideoPitch = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    
    if (!userData.video_pitch_url) {
      return null;
    }

    // Get full pitch details from video_pitches collection
    const pitchQuery = query(
      collection(db, 'video_pitches'),
      where('user_id', '==', userId),
      where('is_active', '==', true)
    );

    const pitchSnapshot = await getDocs(pitchQuery);
    
    if (pitchSnapshot.empty) {
      return {
        videoUrl: userData.video_pitch_url,
        updatedAt: userData.video_pitch_updated_at
      };
    }

    const pitchDoc = pitchSnapshot.docs[0];
    const pitchData = pitchDoc.data();

    return {
      id: pitchDoc.id,
      videoUrl: pitchData.video_url,
      script: pitchData.script_text,
      duration: pitchData.duration_seconds,
      thumbnail: pitchData.thumbnail_url,
      viewsCount: pitchData.views_count,
      createdAt: pitchData.created_at,
      updatedAt: userData.video_pitch_updated_at
    };

  } catch (error) {
    console.error('Error fetching user video pitch:', error);
    return null;
  }
};

/**
 * Increment pitch view count
 * 
 * @param {string} pitchId - Pitch document ID
 */
export const incrementPitchViews = async (pitchId) => {
  try {
    const pitchRef = doc(db, 'video_pitches', pitchId);
    const pitchDoc = await getDoc(pitchRef);

    if (pitchDoc.exists()) {
      const currentViews = pitchDoc.data().views_count || 0;
      await updateDoc(pitchRef, {
        views_count: currentViews + 1,
        last_viewed_at: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error incrementing pitch views:', error);
  }
};

// ============================================
// 4. PUBLIC LINK GENERATION
// ============================================

/**
 * Generate public pitch link
 * 
 * @param {string} userId - User ID
 * @returns {string} Public link
 */
export const generatePublicPitchLink = (userId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/pitch/${userId}`;
};

/**
 * Generate shortened pitch link (optional - for CV/LinkedIn)
 * 
 * @param {string} userId - User ID
 * @returns {string} Shortened link
 */
export const generateShortPitchLink = (userId) => {
  // In production, integrate with bit.ly or custom short link service
  const shortId = userId.substring(0, 8);
  return `https://pitch.placementsportal.com/${shortId}`;
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export const videoPitchService = {
  generatePitchScript,
  uploadVideoPitch,
  saveVideoPitch,
  getUserVideoPitch,
  incrementPitchViews,
  generatePublicPitchLink,
  generateShortPitchLink
};

export default videoPitchService;
