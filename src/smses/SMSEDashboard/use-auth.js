"use client"

import "./Dashboard.css"
import { useState, useEffect } from "react"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate auth loading
    const timer = setTimeout(() => {
      // Mock user data
      setUser({
        uid: "user123",
        email: "user@example.com",
        displayName: "Demo User",
      })
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return { user, loading }
}
