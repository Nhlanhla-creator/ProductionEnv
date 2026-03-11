import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"
import { getDisplayName } from "../utils/profileHelpers"

/**
 * Custom hook to fetch user profile data
 * @param {string} collection - Firestore collection name
 * @param {string} nameField - Path to name field in document
 * @param {string} fallback - Fallback name
 */// Add this helper function at the top of your file or import it
function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

// Then update the hook to use it
export function useUserProfile(collection, nameField, fallback = "User") {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDocRef = doc(db, collection, currentUser.uid)
          const userDocSnap = await getDoc(userDocRef)
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            
            // First try to get the registered name directly from formData.entityOverview
            const registeredName = getNestedValue(data, 'formData.entityOverview.registeredName')
            
            if (registeredName) {
              setUserName(registeredName)
            } else {
              // Fall back to the generic display name helper
              setUserName(getDisplayName(data, currentUser, nameField, fallback))
            }
          } else {
            setUserName(getDisplayName(null, currentUser, nameField, fallback))
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUserName(getDisplayName(null, currentUser, nameField, fallback))
        }
      } else {
        setUserName(fallback)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [collection, nameField, fallback])

  return { user, userName, loading }
}