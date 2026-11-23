import { useLocation } from "react-router-dom"
import { useSmeObjectiveView } from "../hooks/useSmeObjectiveView"
import { useSmeAccess } from "./SMEAccess"
import {
  getObjectiveViewConfig,
  isApplicationAllowedForObjective,
} from "../utils/smeObjectiveView"

export default function ObjectiveRouteGate({ children }) {
  const { pathname } = useLocation()
  const { primaryObjective, showEverything, setShowEverything, loading } =
    useSmeObjectiveView()
  const {
    isCompanyMember,
    loading: accessLoading,
    error: accessError,
  } = useSmeAccess()
  const isExternalView =
    sessionStorage.getItem("investorViewMode") === "true" ||
    (sessionStorage.getItem("viewOrigin") === "cmf" &&
      Boolean(sessionStorage.getItem("viewingSMEId")))
  const objectiveConfig = getObjectiveViewConfig(primaryObjective)
  const isOutOfObjectiveScope =
    !loading &&
    !accessLoading &&
    !accessError &&
    !isCompanyMember &&
    !isExternalView &&
    !showEverything &&
    objectiveConfig &&
    !isApplicationAllowedForObjective(primaryObjective, pathname)

  if (loading || accessLoading) {
    return <div role="status">Loading your objective view…</div>
  }

  if (isOutOfObjectiveScope) {
    return (
      <section
        role="status"
        style={{
          maxWidth: "680px",
          margin: "48px auto",
          padding: "24px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h1>This application is outside your {objectiveConfig.title} view</h1>
        <p>
          This application is for a different objective. Show everything to
          open it.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowEverything(true)}
        >
          Show everything
        </button>
      </section>
    )
  }

  return children
}
