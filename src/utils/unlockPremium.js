/**
 * Utility to unlock premium features for a user
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Unlock all premium features for a given user ID
 * Uses setDoc with merge so it works even if the doc or premium field doesn't exist yet
 */
export const unlockAllPremium = async (userId) => {
  if (!userId) throw new Error('userId is required');

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const featureGrant = {
    active: true,
    purchasedAt: new Date(),
    currentPeriodEnd: oneYearFromNow,
    plan: 'admin_grant',
  };

  const userRef = doc(db, 'users', userId);

  await setDoc(userRef, {
    premium: {
      cvReview: featureGrant,
      coaching: featureGrant,
      aiApplier: featureGrant,
    },
  }, { merge: true });

  console.log(`✅ All premium features unlocked for user: ${userId}`);
  return true;
};

export default unlockAllPremium;
