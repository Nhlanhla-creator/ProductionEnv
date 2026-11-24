import AssetRegister from "./AssetRegister"
import DowntimeMasterSetup from "./DowntimeMasterSetup"

export default function AssetSetup({ tenantId, tab = "assets", onNavigate, assetId = "", masterId = "", groupId = "" }) {
  const codes = tab === "codes"
  return <section className="dt-asset-setup">
    <nav className="dt-actions dt-asset-setup-tabs" aria-label="Asset Setup" role="tablist">
      <button type="button" className={`dt-button ${!codes ? 'dt-button-primary' : ''}`} role="tab" aria-selected={!codes} onClick={() => onNavigate('assetSetup')}>Asset Register</button>
      <button type="button" className={`dt-button ${codes ? 'dt-button-primary' : ''}`} role="tab" aria-selected={codes} onClick={() => onNavigate('setup')}>Master Downtime Codes</button>
    </nav>
    {codes ? <DowntimeMasterSetup key={`${tenantId}:${masterId}:${groupId}`} tenantId={tenantId} initialMasterId={masterId} initialGroupId={groupId} onNavigate={onNavigate} />
      : <AssetRegister key={`${tenantId}:${assetId}`} tenantId={tenantId} initialAssetId={assetId} onWorkspaceNavigate={onNavigate} />}
  </section>
}
