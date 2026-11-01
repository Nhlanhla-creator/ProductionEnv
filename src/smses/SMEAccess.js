import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebaseConfig"
import {
  canAccessSmeSection,
  getSmeRouteForSection,
  getSmeSectionForPath,
  resolveSmeAccessPermissions,
  SME_PROFILE_SECTIONS,
} from "../utils/sme-access"

const fullAccess = resolveSmeAccessPermissions("owner")

export const useSmeAccess = () => {
  const [state, setState] = useState({ loading: true, error: null, isCompanyMember: false, permissions: null })

  useEffect(() => {
    let cancelled = false
    let requestVersion = 0
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const version = ++requestVersion
      setState((current) => ({ ...current, loading: true, error: null }))
      const isCurrentRequest = () => !cancelled && version === requestVersion
      if (!user) {
        if (isCurrentRequest()) setState({ loading: false, error: null, isCompanyMember: false, permissions: fullAccess })
        return
      }

      if (
        sessionStorage.getItem("viewingSMEId") &&
        (sessionStorage.getItem("investorViewMode") === "true" ||
          sessionStorage.getItem("viewOrigin") === "cmf")
      ) {
        if (isCurrentRequest()) setState({ loading: false, error: null, isCompanyMember: false, permissions: fullAccess })
        return
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid))
        const userData = userSnap.exists() ? userSnap.data() : {}
        if (!userData.companyId) {
          if (isCurrentRequest()) setState({ loading: false, error: null, isCompanyMember: false, permissions: fullAccess })
          return
        }

        const companySnap = await getDoc(doc(db, "companies", userData.companyId))
        const company = companySnap.exists() ? companySnap.data() : {}
        const ownerId = company.createdBy || company.ownerId
        if (ownerId === user.uid || userData.userRole === "owner") {
          if (isCurrentRequest()) setState({ loading: false, error: null, isCompanyMember: false, permissions: fullAccess })
          return
        }

        const role = userData.userRole || "viewer"
        if (isCurrentRequest()) {
          setState({
            loading: false,
            error: null,
            isCompanyMember: true,
            permissions: resolveSmeAccessPermissions(role, userData.accessPermissions),
          })
        }
      } catch (error) {
        console.error("Error loading SME section access:", error)
        if (isCurrentRequest()) setState({ loading: false, error, isCompanyMember: false, permissions: null })
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return state
}

export function SMEAccessGate({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, error, isCompanyMember, permissions } = useSmeAccess()

  if (loading) return <div role="status" style={{ padding: "2rem" }}>Loading section access...</div>
  if (error) return <div role="alert" style={{ padding: "2rem" }}>Unable to verify your section access. Please reload or contact your company owner.</div>
  if (!isCompanyMember) return children

  const sectionId = getSmeSectionForPath(location.pathname)
  const isFullProfileSummary = location.pathname === "/documents"
  const hasFullProfileAccess = permissions.profileSections.length === SME_PROFILE_SECTIONS.length
  if (
    sectionId &&
    canAccessSmeSection(permissions, sectionId) &&
    (!isFullProfileSummary || hasFullProfileAccess)
  ) return children

  const fallbackId = ["dashboard", "profile", "documents"].find((id) =>
    canAccessSmeSection(permissions, id)
  ) || permissions.sidebarSections.find((id) => getSmeRouteForSection(id))
  const fallbackRoute = fallbackId ? getSmeRouteForSection(fallbackId) : null

  return (
    <div role="alert" style={{ maxWidth: 640, margin: "3rem auto", padding: "2rem", textAlign: "center", background: "#faf7f2", border: "1px solid #e6d7c3", borderRadius: 12, color: "#4a352f" }}>
      <h2>Section access is restricted</h2>
      <p>Your company owner has not granted access to this section.</p>
      {fallbackRoute && (
        <button type="button" onClick={() => navigate(fallbackRoute)} style={{ padding: "0.7rem 1.1rem", border: 0, borderRadius: 6, background: "#a67c52", color: "white", cursor: "pointer" }}>
          Go to an available section
        </button>
      )}
    </div>
  )
}
