// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch user document from Firestore
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserData(userData);
            
            // Extract roles from user data
            let roles = [];
            
            // Check roleArray first (array)
            if (Array.isArray(userData.roleArray)) {
              roles = [...roles, ...userData.roleArray];
            }
            
            // Check role field (string)
            if (userData.role && typeof userData.role === 'string') {
              const roleString = userData.role.replace(/\s/g, ''); // Remove spaces
              const rolesFromString = roleString.split(',').filter(r => r);
              roles = [...roles, ...rolesFromString];
            }
            
            // Remove duplicates and set roles
            setUserRoles([...new Set(roles)]);
            
          } else {
            // User authenticated but no document in Firestore
            setUserData(null);
            setUserRoles([]);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setUserRoles([]);
        }
      } else {
        setUserData(null);
        setUserRoles([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, userData, userRoles, loading };
}