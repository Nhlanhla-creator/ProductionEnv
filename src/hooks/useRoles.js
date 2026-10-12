import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { normalizeRoles, normalizeRoleName } from "../utils/profileHelpers"
import { auth, db } from "../firebaseConfig"
import { hasRole, isSameRole } from "../config/headerConfig"

const LS_KEY = "selectedRole"
const readStored = () => {
  try { return localStorage.getItem(LS_KEY) } catch { return null }
}
const writeStored = (role) => {
  try {
    if (role) localStorage.setItem(LS_KEY, role)
    else localStorage.removeItem(LS_KEY)
  } catch (e) {
    console.warn("Could not persist selectedRole", e)
  }
}

export function useRoles() {
  const [availableRoles, setAvailableRoles] = useState([])
  const [selectedRole, setSelectedRole] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubDoc = null

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubDoc) { unsubDoc(); unsubDoc = null }

      if (!u) {
        setAvailableRoles([])
        setSelectedRole("")
        writeStored(null)
        setLoading(false)
        return
      }

      setLoading(true)
      unsubDoc = onSnapshot(
        doc(db, "users", u.uid),
        (snap) => {
          if (!snap.exists()) {
            setAvailableRoles([])
            setSelectedRole("")
            setLoading(false)
            return
          }
          const data = snap.data()
          const { availableRoles: roles, selectedRole: sel } = normalizeRoles(data)

          // Firestore currentRole is the source of truth; stored/normalized are fallbacks.
          // Every candidate must be one of the user's roles.
          const pick = [data.currentRole, readStored(), sel].find((r) => r && hasRole(roles, r))
          const resolved = pick ? roles.find((r) => isSameRole(r, pick)) : roles[0] || ""

          setAvailableRoles(roles)
          setSelectedRole(resolved)
          writeStored(resolved)
          setLoading(false)
        },
        (err) => {
          console.error("Error listening to roles:", err)
          setLoading(false)
        }
      )
    })

    return () => {
      if (unsubDoc) unsubDoc()
      unsubAuth()
    }
  }, [])

  const addRole = async (newRole) => {
    const user = auth.currentUser
    if (!user || !newRole) return null
    if (loading) throw new Error("Roles still loading")
    if (hasRole(availableRoles, newRole)) throw new Error("Role already exists")

    const normalized = normalizeRoleName(newRole)
    const updated = [...availableRoles, normalized]

    await updateDoc(doc(db, "users", user.uid), {
      role: updated.join(","),
      roleArray: updated,
      currentRole: normalized,
    })

    writeStored(normalized)
    setAvailableRoles(updated)
    setSelectedRole(normalized)
    return normalized
  }

  const switchRole = async (role) => {
    const user = auth.currentUser
    if (!user || !role) return false

    const target = availableRoles.find((r) => isSameRole(r, role))
    if (!target) throw new Error("Role not available for this user")
    if (isSameRole(target, selectedRole)) return false

    const prev = selectedRole
    setSelectedRole(target)
    writeStored(target)

    try {
      await updateDoc(doc(db, "users", user.uid), { currentRole: target })
      return true
    } catch (error) {
      console.error("Failed to switch role:", error)
      setSelectedRole(prev)
      writeStored(prev)
      throw error
    }
  }

  return { availableRoles, selectedRole, loading, addRole, switchRole }
}