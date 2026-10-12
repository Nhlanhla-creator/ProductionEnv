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
export function useUserProfile(collection, nameField, fallback = "User", customDocId = null) {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          const userDocRef = doc(db, collection, customDocId || currentUser.uid)
          let userDocSnap = await getDoc(userDocRef)
          if (!userDocSnap.exists() && collection === "MyuniversalProfiles") {
            userDocSnap = await getDoc(doc(db, "universalProfiles", customDocId || currentUser.uid))
          }
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            
            // First try entityOverview or fundManageOverview trading / registered name
            const tradingName = getNestedValue(data, 'formData.entityOverview.tradingName') ||
              getNestedValue(data, 'formData.fundManageOverview.tradingName') ||
              getNestedValue(data, 'entityOverview.tradingName') ||
              getNestedValue(data, 'fundManageOverview.tradingName')
            const registeredName = getNestedValue(data, 'formData.entityOverview.registeredName') ||
              getNestedValue(data, 'formData.fundManageOverview.registeredName') ||
              getNestedValue(data, 'entityOverview.registeredName') ||
              getNestedValue(data, 'fundManageOverview.registeredName')
            
            if (tradingName) {
              setUserName(tradingName)
            } else if (registeredName) {
              setUserName(registeredName)
            } else {
              // Fall back to the generic display name helper
              setUserName(getDisplayName(data, customDocId ? null : currentUser, nameField, fallback))
            }
          } else {
            setUserName(fallback || getDisplayName(null, currentUser, nameField, fallback))
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUserName(fallback || getDisplayName(null, currentUser, nameField, fallback))
        }
      } else {
        setUserName(fallback)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [collection, nameField, fallback, customDocId])

  return { user, userName, loading }
}