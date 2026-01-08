import { useState, useEffect, useCallback } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"
import { getDisplayName, getLogoFromData } from "../utils/profileHelpers"

/**
 * Custom hook to fetch header-specific user profile data
 * @param {string} collection - Firestore collection name
 * @param {string} nameField - Path to name field in document
 * @param {string} logoField - Path to logo/image field in document
 * @param {string} fallbackName - Fallback name if not found
 */
export function useHeaderProfile(
  collection,
  nameField,
  logoField,
  fallbackName = "User"
) {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState(fallbackName)
  const [profileLogo, setProfileLogo] = useState(null)
  const [profileData, setProfileData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfileData = useCallback(async (currentUser) => {
    if (!currentUser) return
    try {
      const userDocRef = doc(db, collection, currentUser.uid)
      const userDocSnap = await getDoc(userDocRef)
      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        setProfileData(data)
        setUserName(getDisplayName(data, currentUser, nameField, fallbackName))
        setProfileLogo(getLogoFromData(data, logoField))
      } else {
        setProfileData({})
        setUserName(getDisplayName(null, currentUser, nameField, fallbackName))
        setProfileLogo(null)
      }
    } catch (err) {
      console.error("Error fetching header profile:", err)
      setError(err)
      setUserName(getDisplayName(null, currentUser, nameField, fallbackName))
    }
  }, [collection, nameField, logoField, fallbackName])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await fetchProfileData(currentUser)
      } else {
        setUser(null)
        setUserName(fallbackName)
        setProfileLogo(null)
        setProfileData({})
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchProfileData, fallbackName])

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    setLoading(true)
    await fetchProfileData(currentUser)
    setLoading(false)
  }, [fetchProfileData])

  return { user, userName, profileLogo, profileData, loading, error, refreshProfile }
}