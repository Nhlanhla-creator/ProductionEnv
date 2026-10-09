"use client"

import { useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import useInvestorSetup from "../../hooks/useInvestorSetup"

import FirmList from "./FirmList"
import FirmEditor from "./FirmEditor"
import ProgrammeEditor from "./ProgrammeEditor"
import OpportunityEditor from "./OpportunityEditor"

const T = {
  ink: "#2d201c", body: "#3b2b26", muted: "#6b5b55",
  line: "#ded8d4", lineSoft: "#e9e3df",
  bg: "#ffffff", panel: "#faf8f7",
  accent: "#5D4037", accentSoft: "#8D6E63",
  red: "#991b1b", redBg: "#fef2f2",
}

export default function InvestorSetup() {
  const { firmId, programmeId, opportunityId } = useParams()
  const navigate = useNavigate()

  const s = useInvestorSetup({ firmId, programmeId, opportunityId })

  const openFirm = (id) => navigate(`/investor-setup/${id}`)
  const openProgramme = (pid) => navigate(`/investor-setup/${firmId}/${pid}`)
  const openOpportunity = (oid) => navigate(`/investor-setup/${firmId}/${programmeId}/${oid}`)

  if (s.loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: T.muted }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
        <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/investor-setup")}>
          Investor setup
        </span>
        {s.firm && <> / <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => openFirm(s.firm.firmId)}>{s.firm.name}</span></>}
        {s.programme && <> / <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => openProgramme(s.programme.programmeId)}>{s.programme.name}</span></>}
        {s.opportunity && <> / <span>{s.opportunity.name}</span></>}
      </div>

      {!firmId && (
        <FirmList
          firms={s.firms}
          onOpen={openFirm}
          onCreate={async () => { const f = await s.onCreateFirm(); openFirm(f.firmId) }}
          onDelete={s.onDeleteFirm}
        />
      )}

      {firmId && !programmeId && (
        <FirmEditor
          firm={s.firm}
          programmes={s.programmes}
          onSave={s.onSaveFirm}
          onOpenProgramme={openProgramme}
          onCreateProgramme={async () => { const p = await s.onCreateProgramme(); openProgramme(p.programmeId) }}
          onDeleteProgramme={s.onDeleteProgramme}
        />
      )}

      {firmId && programmeId && !opportunityId && (
        <ProgrammeEditor
          firm={s.firm}
          programme={s.programme}
          opportunities={s.opportunities}
          onSave={s.onSaveProgramme}
          onOpenOpportunity={openOpportunity}
          onCreateOpportunity={async () => { const o = await s.onCreateOpportunity(); openOpportunity(o.opportunityId) }}
        />
      )}

      {firmId && programmeId && opportunityId && (
        <OpportunityEditor
          firm={s.firm}
          programme={s.programme}
          opportunity={s.opportunity}
          rules={s.rules}
          scoringProfile={s.scoringProfile}
          onSave={s.onSaveOpportunity}
          onPublish={s.onPublishOpportunity}
          onUpsertRule={s.onUpsertRule}
          onDeleteRule={s.onDeleteRule}
          onCreateScoringProfile={s.onCreateScoringProfile}
          onSaveScoringProfile={s.onSaveScoringProfile}
          onApproveScoringProfile={s.onApproveScoringProfile}
        />
      )}

      {s.error && (
        <div style={{ marginTop: 14, padding: "10px 12px", background: T.redBg, border: `1px solid ${T.red}33`, borderRadius: 8, color: T.red, fontSize: 12.5 }}>
          {s.error}
        </div>
      )}
    </div>
  )
}