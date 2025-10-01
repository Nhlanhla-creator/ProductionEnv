import { auth } from '../firebaseConfig';

// Helper function to get user-specific collection path
export const getUserCollection = (collectionName) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return `users/${user.uid}/${collectionName}`;
};

// Helper function to get current user ID
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user.uid;
};