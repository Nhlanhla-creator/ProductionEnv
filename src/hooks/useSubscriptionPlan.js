import { useState, useEffect } from "react"
import { auth, db } from "../firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

/**
 * Hook to fetch and return the original subscription plan names.
 * Returns: 'basic', 'standard', or 'premium'
 * If no user or error -> 'basic'.
 *
 * @param {string} providedUid optional uid to fetch (defaults to auth.currentUser)
 * @returns {{ currentPlan: string|null, subscriptionLoading: boolean }}
 */
export default function useSubscriptionPlan(providedUid) {
  const [currentPlan, setCurrentPlan] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchPlan = async () => {
      try {
        setSubscriptionLoading(true)
        const uid = providedUid || auth.currentUser?.uid

        if (!uid) {
          if (!cancelled) {
            setCurrentPlan("basic")
            setSubscriptionLoading(false)
          }
          return
        }

        const userDocRef = doc(db, "users", uid)
        const userDocSnap = await getDoc(userDocRef)

        let originalPlan = "basic"

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          const planData = userData.currentPlan

          const planName = (userData.investorPlan || planData?.name || userData.plan || "discover").toLowerCase()

          // Direct mapping to original plan names
          if (planName.includes("basic") || planName.includes("discover")) {
            originalPlan = "basic"
          } else if (planName.includes("standard") || planName.includes("engage")) {
            originalPlan = "standard"
          } else if (planName.includes("premium") || planName.includes("partner")) {
            originalPlan = "premium"
          } else {
            originalPlan = "basic"
          }
        }

        if (!cancelled) setCurrentPlan(originalPlan)
      } catch (error) {
        console.error("Error fetching subscription:", error)
        if (!cancelled) setCurrentPlan("basic")
      } finally {
        if (!cancelled) setSubscriptionLoading(false)
      }
    }

    fetchPlan()

    return () => {
      cancelled = true
    }
  }, [providedUid])

  return { currentPlan, subscriptionLoading }
}