import { useState, useEffect, useCallback } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"
import { getDisplayName, getLogoFromData } from "../utils/profileHelpers"

/**
 * Custom hook to fetch header-specific user profile data with real-time updates
 * @param {string} collection - Firestore collection name
 * @param {string} nameField - Path to name field in document
 * @param {string} logoField - Path to logo/image field in document
 * @param {string} fallbackName - Fallback name if not found
 */
export function useHeaderProfile(
  collection,
  nameField,
  logoField,
  fallbackName = "User",
  customDocId = null
) {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState(fallbackName)
  const [profileLogo, setProfileLogo] = useState(null)
  const [profileData, setProfileData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let docUnsub = null

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (docUnsub) {
        docUnsub()
        docUnsub = null
      }

      if (currentUser) {
        setUser(currentUser)
        setLoading(true)

        const targetId = customDocId || currentUser.uid
        const userDocRef = doc(db, collection, targetId)

        docUnsub = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data()
              setProfileData(data)
              setUserName(getDisplayName(data, customDocId ? null : currentUser, nameField, fallbackName))
              setProfileLogo(getLogoFromData(data, logoField))
            } else {
              setProfileData({})
              setUserName(fallbackName || getDisplayName(null, currentUser, nameField, fallbackName))
              setProfileLogo(null)
            }
            setLoading(false)
          },
          (err) => {
            console.error("Error listening to header profile:", err)
            setError(err)
            setUserName(fallbackName || getDisplayName(null, currentUser, nameField, fallbackName))
            setLoading(false)
          }
        )
      } else {
        setUser(null)
        setUserName(fallbackName)
        setProfileLogo(null)
        setProfileData({})
        setLoading(false)
      }
    })

    return () => {
      if (docUnsub) docUnsub()
      unsubscribe()
    }
  }, [collection, nameField, logoField, fallbackName, customDocId])

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return
    setLoading(true)
    try {
      const snap = await getDoc(doc(db, collection, customDocId || currentUser.uid))
      if (snap.exists()) {
        const data = snap.data()
        setProfileData(data)
        setUserName(getDisplayName(data, customDocId ? null : currentUser, nameField, fallbackName))
        setProfileLogo(getLogoFromData(data, logoField))
      }
    } catch (e) {
      console.warn("refreshProfile warning:", e)
    } finally {
      setLoading(false)
    }
  }, [collection, nameField, logoField, fallbackName, customDocId])

  return { user, userName, profileLogo, profileData, loading, error, refreshProfile }
}
