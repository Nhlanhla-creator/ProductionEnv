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
 */
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
            const resolvedName = getDisplayName(data, currentUser, nameField, fallback)
            setUserName(resolvedName)
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
