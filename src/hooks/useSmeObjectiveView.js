import { useCallback, useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../firebaseConfig"
import {
  getObjectiveViewStorageKey,
  SME_OBJECTIVE_VIEW_EVENT,
} from "../utils/smeObjectiveView"

export function useSmeObjectiveView() {
  const [userId, setUserId] = useState(null)
  const [primaryObjective, setPrimaryObjective] = useState("")
  const [showEverything, setShowEverythingState] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return
      const currentUserId = user?.uid || null
      setUserId(currentUserId)
      setPrimaryObjective("")
      setShowEverythingState(false)

      if (!currentUserId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUserId))
        if (!active || auth.currentUser?.uid !== currentUserId) return

        const userData = userSnapshot.exists() ? userSnapshot.data() : {}
        let objective = userData.primaryObjective || ""
        if (!objective) {
          const profileSnapshot = await getDoc(
            doc(db, "universalProfiles", currentUserId)
          )
          if (!active || auth.currentUser?.uid !== currentUserId) return
          objective = profileSnapshot.exists()
            ? profileSnapshot.data().primaryObjective || ""
            : ""
        }
        setPrimaryObjective(objective)
        const preferenceKey = getObjectiveViewStorageKey(currentUserId)
        setShowEverythingState(
          preferenceKey
            ? localStorage.getItem(preferenceKey) === "true"
            : false
        )
      } catch (error) {
        console.error("Could not load SME objective view:", error)
        if (active && auth.currentUser?.uid === currentUserId) {
          setPrimaryObjective("")
          setShowEverythingState(false)
        }
      } finally {
        if (active && auth.currentUser?.uid === currentUserId) {
          setLoading(false)
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const syncPreference = (event) => {
      const detail = event.detail
      if (detail?.userId === userId && typeof detail.showEverything === "boolean") {
        setShowEverythingState(detail.showEverything)
      }
    }
    const syncOtherTab = (event) => {
      const preferenceKey = getObjectiveViewStorageKey(userId)
      if (event.key === preferenceKey) {
        setShowEverythingState(event.newValue === "true")
      }
    }
    window.addEventListener(SME_OBJECTIVE_VIEW_EVENT, syncPreference)
    window.addEventListener("storage", syncOtherTab)
    return () => {
      window.removeEventListener(SME_OBJECTIVE_VIEW_EVENT, syncPreference)
      window.removeEventListener("storage", syncOtherTab)
    }
  }, [userId])

  const setShowEverything = useCallback(
    (value) => {
      const preferenceKey = getObjectiveViewStorageKey(userId)
      if (!preferenceKey) return
      localStorage.setItem(preferenceKey, String(value))
      setShowEverythingState(value)
      window.dispatchEvent(
        new CustomEvent(SME_OBJECTIVE_VIEW_EVENT, {
          detail: { userId, showEverything: value },
        })
      )
    },
    [userId]
  )

  return { primaryObjective, showEverything, setShowEverything, loading }
}
