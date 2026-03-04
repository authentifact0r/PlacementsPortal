import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if Firebase is configured
  const firebaseEnabled = isFirebaseConfigured();

  // Sign up with email and password
  const signup = async (email, password, userData) => {
    if (!firebaseEnabled) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.');
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        role: userData.role || 'student',
        profile: userData.profile || {},
        linkedInEmail: userData.linkedInEmail || false, // Track if signed up via LinkedIn email
        authProvider: userData.linkedInEmail ? 'linkedin-email' : 'email',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    if (!firebaseEnabled) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.');
    }
    
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    if (!firebaseEnabled) {
      throw new Error('Firebase is not configured. Please set up Firebase to use authentication.');
    }
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create one
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          role: 'graduate', // Default role
          profile: {
            firstName: result.user.displayName?.split(' ')[0] || '',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: result.user.photoURL || null,
          },
          authProvider: 'google',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      
      // Enhanced error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked. Please allow pop-ups for this site and try again.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. Please contact support.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else {
        throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  // Logout
  const logout = async () => {
    if (!firebaseEnabled) {
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }
    
    try {
      return await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    if (!firebaseEnabled) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error);
    }
  };

  // Update user profile
  const updateProfile = async (uid, updates) => {
    if (!firebaseEnabled) {
      throw new Error('Firebase is not configured.');
    }
    
    try {
      await setDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
      
      // Refresh profile
      await fetchUserProfile(uid);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!firebaseEnabled) {
      console.warn('⚠️ Firebase not configured - Authentication disabled');
      setLoading(false);
      return;
    }

    // Safety timeout to ensure loading state is always resolved
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timeout - continuing anyway');
      setLoading(false);
    }, 5000);

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timeout);
        setCurrentUser(user);
        
        if (user) {
          try {
            await fetchUserProfile(user.uid);
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            // Continue loading even if profile fetch fails
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }, (error) => {
        // Error callback for onAuthStateChanged
        clearTimeout(timeout);
        console.error('Auth state change error:', error);
        setError(error);
        setLoading(false);
      });

      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (error) {
      clearTimeout(timeout);
      console.error('Auth initialization error:', error);
      setError(error);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseEnabled]);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    loading,
    firebaseEnabled,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
