import { useEffect, useState } from "react"
import { getOnboardingState, saveOnboardingState } from "../services/onboardingState"

const initial = { manual: true, excel: true, integration: false, provider: "VisionLink", externalOrganisationId: "", equipmentKey: "Asset ID", transferMode: "scheduled" }
export default function OperationalDataSources({ tenantId, onNavigate }) {
  const [config, setConfig] = useState(initial), [busy, setBusy] = useState(false), [message, setMessage] = useState("")
  useEffect(() => { let live = true; getOnboardingState(tenantId).then((state) => { if (live) setConfig({ ...initial, ...state.operationalDataSources }) }); return () => { live = false } }, [tenantId])
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("")
    try { await saveOnboardingState(tenantId, { operationalDataSources: config }); setMessage("Data source preferences saved.") }
    catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <section className="dt-panel"><h2>Operational Data Sources</h2>
    <p>Choose how operational data will reach the platform. Manual capture and Excel imports are available.</p>
    <form onSubmit={save}><fieldset disabled={busy}>
      <div className="dt-actions">{[["manual", "Manual Capture"], ["excel", "Excel"], ["integration", "Third-party integration"]].map(([key, label]) =>
        <label className="dt-check" key={key}><input type="checkbox" checked={config[key]} onChange={(event) => setConfig({ ...config, [key]: event.target.checked })} />{label}</label>)}</div>
      {config.integration && <><p className="dt-notice">Integration planning only. No provider is connected and automated transfers have not started.</p>
        <div className="dt-asset-toolbar">{[["provider", "Provider"], ["externalOrganisationId", "External company / account reference"], ["equipmentKey", "Equipment matching field"]].map(([key, label]) =>
          <label className="dt-field" key={key}><span>{label}</span><input required maxLength={120} value={config[key]} onChange={(event) => setConfig({ ...config, [key]: event.target.value })} /></label>)}
          <label className="dt-field"><span>Future transfer mode</span><select value={config.transferMode} onChange={(event) => setConfig({ ...config, transferMode: event.target.value })}><option value="scheduled">Scheduled API sync</option><option value="event">Event / webhook</option></select></label>
        </div><p className="dt-muted">Future adapters should match external equipment to registered Asset IDs and keep source record IDs to prevent duplicate transfers. Configure credentials on the server when the integration is implemented.</p></>}
      <button className="dt-button dt-button-primary" disabled={busy}>{busy ? "Saving…" : "Save data sources"}</button>
      {config.manual && onNavigate && <button type="button" className="dt-button" onClick={() => onNavigate("capture", { view: "record" })}>Open Manual Capture</button>}
    </fieldset></form>{message && <p role="status">{message}</p>}
  </section>
}
