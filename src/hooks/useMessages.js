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
    if (!user) return

    const q = query(
      collection(db, "messages"),
      where("to", "==", user.uid),
      where("read", "==", false)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size)
      
      // Get recent messages (limit to 5)
      const messages = snapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setRecentMessages(messages)
    })

    return () => unsubscribe()
  }, [user])

  return { unreadCount, recentMessages }
}