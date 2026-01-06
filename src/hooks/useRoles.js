import { useState, useEffect } from "react"
import { normalizeRoles, normalizeRoleName } from "../utils/profileHelpers"
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"

/**
 * Custom hook to manage user roles
 */
export function useRoles() {
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false)
      return
    }

    const userDocRef = doc(db, "users", auth.currentUser.uid)
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (!snap.exists()) {
        setAvailableRoles([])
        setSelectedRole("")
        setLoading(false)
        return
      }

      const data = snap.data()
      const { availableRoles: roles, selectedRole: sel } = normalizeRoles(data)
      setAvailableRoles(roles)
      // prefer a locally persisted selection for snappier UI, fall back to
      // normalized selected role or the user's currentRole from Firestore
      const persisted = typeof window !== 'undefined' ? localStorage.getItem('selectedRole') : null
      setSelectedRole(persisted || sel || data.currentRole || roles[0] || "")
      setLoading(false)
    }, (err) => {
      console.error('Error listening to roles:', err)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Persist selected role to localStorage so UI remains snappy across reloads
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedRole) {
      try {
        localStorage.setItem('selectedRole', selectedRole)
      } catch (e) {
        console.warn('Could not persist selectedRole to localStorage', e)
      }
    }
  }, [selectedRole])

  const addRole = async (newRole) => {
    if (!auth.currentUser || !newRole) return false
    if (availableRoles.includes(newRole)) {
      throw new Error("Role already exists")
    }

    const normalizedNewRole = normalizeRoleName(newRole)
    const updatedRoles = [...availableRoles, normalizedNewRole]
    const userDocRef = doc(db, "users", auth.currentUser.uid)

    try {
      await updateDoc(userDocRef, {
        role: updatedRoles.join(","),
        roleArray: updatedRoles,
        currentRole: normalizedNewRole,
      })

      setAvailableRoles(updatedRoles)
      setSelectedRole(normalizedNewRole)
      // persist immediately for snappier UI
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('selectedRole', normalizedNewRole) } catch (e) {}
      }
      return true
    } catch (error) {
      console.error("Failed to add role:", error)
      throw error
    }
  }

  const switchRole = async (role) => {
    if (!auth.currentUser) return false

    // No-op if user clicks the already-selected role
    if (role === selectedRole) return false

    // Optimistic UI update + persist
    setSelectedRole(role)
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('selectedRole', role) } catch (e) {}
    }

    const userDocRef = doc(db, "users", auth.currentUser.uid)

    try {
      await updateDoc(userDocRef, { currentRole: role })
      return true
    } catch (error) {
      console.error("Failed to switch role:", error)
      // revert persisted change on failure
      try {
        const prev = localStorage.getItem('selectedRole')
        setSelectedRole(prev || "")
      } catch (e) {
        console.warn('Could not revert selectedRole after failed switch', e)
      }
      throw error
    }
  }

  return {
    availableRoles,
    selectedRole,
    loading,
    addRole,
    switchRole,
  }
}