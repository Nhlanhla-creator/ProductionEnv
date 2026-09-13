import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../firebaseConfig"

/**
 * Custom hook to track unread messages
 * @param {Object} user - Firebase auth user object
 */
export function useMessages(user) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState([])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setRecentMessages([])
      return
    }

    const q = query(
      collection(db, "messages"),
      where("to", "==", user.uid),
      where("read", "==", false)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // `deleted` (trash) doesn't reset `read`, so an unread message the
      // user moved to trash still matches this query. Filter it out here
      // rather than in the query so this stays a single-field index and
      // matches the same rule the inbox tab uses (!read && !deleted).
      const active = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => !msg.deleted)

      setUnreadCount(active.length)
      setRecentMessages(active.slice(0, 5))
    }, (error) => {
      console.error("Error listening for unread messages:", error)
    })

    return () => unsubscribe()
  }, [user])

  return { unreadCount, recentMessages }
}