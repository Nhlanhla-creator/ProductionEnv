"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

/* ════════════════════════════════════════════════════════════════════════════
   Investment Requirements — the investor's own criteria.

   The investor rates how much each item matters to their investment decision
   (0–100). Those ratings are the criteria. Category ids are the same keys the
   BIG Score uses in bigEvaluations/{smeId}.scores, so what is saved lines up
   with the score it is applied to:

     compliance · legitimacy · fundability (Capital Appeal)
     · governanceLeadership · operational

   Saved under investmentRequirements:
     <categoryId>Scores   item ratings, e.g. complianceScores
     categoryScores       average rating per category (0–100)
     weights              share of 100 per category, from the ratings; null
                          until at least one item is rated, so matching falls
                          back to the plain BIG Score for an investor who has
                          not set criteria
   ════════════════════════════════════════════════════════════════════════ */

const businessStages = [
  { id: "ideation", label: "Ideation Stage" },
  { id: "prototype", label: "Prototype/MVP Stage" },
  { id: "startup", label: "Startup Stage" },
  { id: "early-growth", label: "Early Growth Stage" },
  { id: "growth", label: "Growth Stage" },
  { id: "scale-up", label: "Scale-up Stage" },
  { id: "mature", label: "Mature Business" },
]

const categories = [
  {
    id: "compliance",
    title: "Compliance",
    icon: "📋",
    items: [
      { id: "registrationCertificate", label: "Company registration certificate" },
      { id: "taxClearance", label: "Tax clearance certificate" },
      { id: "bbbeeCertificate", label: "B-BBEE certificate" },
      { id: "shareRegister", label: "Share register" },
      { id: "directorIDs", label: "IDs of directors & shareholders" },
      { id: "addressProof", label: "Proof of address" },
      { id: "bankLetter", label: "Bank confirmation letter" },
      { id: "coidaCertificate", label: "COIDA letter of good standing" },
      { id: "industryLicenses", label: "Industry accreditations" },
    ],
  },
  {
    id: "legitimacy",
    title: "Legitimacy",
    icon: "✅",
    items: [
      { id: "professionalWebsite", label: "Professional website" },
      { id: "businessEmail", label: "Business email domain" },
      { id: "companyLogo", label: "Company logo & branding" },
      { id: "linkedinPage", label: "LinkedIn company page" },
      { id: "clientTestimonials", label: "Client testimonials / references" },
      { id: "caseStudies", label: "Case studies / portfolio" },
      { id: "pressMentions", label: "News / press mentions" },
      { id: "googleBusiness", label: "Google business profile" },
    ],
  },
  {
    id: "governanceLeadership",
    title: "Governance & Leadership",
    icon: "👥",
    items: [
      { id: "directorCVs", label: "Director CVs / resumes" },
      { id: "executiveCVs", label: "Executive team CVs" },
      { id: "linkedinProfiles", label: "LinkedIn profiles" },
      { id: "certifications", label: "Professional certifications" },
      { id: "boardMinutes", label: "Board meeting minutes" },
      { id: "orgChart", label: "Organizational chart" },
      { id: "successionPlan", label: "Succession plan" },
      { id: "advisoryBoard", label: "Advisory board" },
      { id: "boardStructure", label: "Board structure" },
      { id: "strategicPlanning", label: "Strategic planning" },
      { id: "riskManagement", label: "Risk management" },
      { id: "transparency", label: "Transparency & reporting" },
      { id: "policies", label: "Policies & documentation" },
      { id: "complianceFramework", label: "Compliance framework" },
      { id: "internalControls", label: "Internal controls" },
      { id: "ethicsCode", label: "Code of ethics" },
    ],
  },
  {
    // Proposed items for the new Operational pillar. Edit labels freely;
    // ids are stored, so keep an id once investors have rated it.
    id: "operational",
    title: "Operational Strength",
    icon: "⚙️",
    items: [
      { id: "operatingProcesses", label: "Documented operating processes (SOPs)" },
      { id: "qualityManagement", label: "Quality management or certification" },
      { id: "supplyChain", label: "Supplier agreements and supply-chain resilience" },
      { id: "customerContracts", label: "Customer contracts and repeat business" },
      { id: "capacity", label: "Production or service capacity" },
      { id: "systemsTechnology", label: "Systems and technology (accounting, CRM, ERP)" },
      { id: "staffManagement", label: "Staff contracts and HR practices" },
      { id: "healthSafety", label: "Health, safety and environmental compliance" },
    ],
  },
  {
    id: "fundability",
    title: "Capital Appeal",
    icon: "💰",
    items: [
      { id: "auditedFinancials", label: "Audited financial statements" },
      { id: "businessPlan", label: "Business plan" },
      { id: "pitchDeck", label: "Pitch deck" },
      { id: "financialProjections", label: "Financial projections" },
      { id: "creditReport", label: "Credit report" },
      { id: "managementAccounts", label: "Management accounts" },
      { id: "capTable", label: "Cap table" },
      { id: "dueDiligence", label: "Due diligence reports" },
    ],
  },
]

const CATEGORY_IDS = categories.map((c) => c.id)

/* Item ratings saved by earlier versions are carried over: leadership and
   governance were separate cards, and Capital Appeal was saved under
   capitalAppealScores. Only ids that still exist in the category are kept, so
   old junk keys drop out. */
const pick = (obj, ids) => Object.fromEntries(ids.filter((id) => obj && obj[id] !== undefined && obj[id] !== null).map((id) => [id, obj[id]]))

const readSavedScores = (data, cat) => {
  const ids = cat.items.map((i) => i.id)
  switch (cat.id) {
    case "governanceLeadership":
      return pick(
        { ...(data.leadershipScores || {}), ...(data.governanceScores || {}), ...(data.governanceLeadershipScores || {}) },
        ids,
      )
    case "fundability":
      return pick({ ...(data.capitalAppealScores || {}), ...(data.fundabilityScores || {}) }, ids)
    default:
      return pick(data[`${cat.id}Scores`], ids)
  }
}

const LEGACY_KEYS_TO_CLEAR = {
  leadershipScores: null,
  governanceScores: null,
  capitalAppealScores: null,
  capitalScores: null,
  marketScores: null,
  productScores: null,
  bigScore: null,
}

const clampScore = (raw) => {
  if (raw === "") return 0
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

/* Shares that add up to exactly 100 (largest-remainder rounding). */
const toWeights = (averages) => {
  const total = CATEGORY_IDS.reduce((s, id) => s + (averages[id] || 0), 0)
  if (total <= 0) return null
  const raw = CATEGORY_IDS.map((id) => ({ id, exact: ((averages[id] || 0) / total) * 100 }))
  const floored = raw.map((r) => ({ ...r, whole: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }))
  let left = 100 - floored.reduce((s, r) => s + r.whole, 0)
  floored
    .slice()
    .sort((a, b) => b.rem - a.rem)
    .forEach((r) => {
      if (left > 0) {
        r.whole += 1
        left -= 1
      }
    })
  return Object.fromEntries(floored.map((r) => [r.id, r.whole]))
}

const getScoreColor = (score) => (score >= 75 ? "#2e7d32" : score >= 50 ? "#a67c52" : score > 0 ? "#c0392b" : "#a89482")

export default function InvestmentRequirements({ data = {}, updateData }) {
  const [businessStage, setBusinessStage] = useState(data.businessStage || "")
  const [expanded, setExpanded] = useState({})
  const [allScores, setAllScores] = useState(() =>
    Object.fromEntries(categories.map((cat) => [cat.id, readSavedScores(data, cat)])),
  )

  const averages = useMemo(
    () =>
      Object.fromEntries(
        categories.map((cat) => {
          const sum = cat.items.reduce((s, item) => s + (Number(allScores[cat.id]?.[item.id]) || 0), 0)
          return [cat.id, Math.round(sum / cat.items.length)]
        }),
      ),
    [allScores],
  )

  const weights = useMemo(() => toWeights(averages), [averages])
  const overall = Math.round(CATEGORY_IDS.reduce((s, id) => s + averages[id], 0) / CATEGORY_IDS.length)
  const ratedCount = categories.reduce(
    (n, cat) => n + cat.items.filter((item) => Number(allScores[cat.id]?.[item.id]) > 0).length,
    0,
  )
  const totalItems = categories.reduce((n, cat) => n + cat.items.length, 0)

  useEffect(() => {
    updateData({
      businessStage,
      weights,
      categoryScores: averages,
      ...Object.fromEntries(categories.map((cat) => [`${cat.id}Scores`, allScores[cat.id]])),
      ...LEGACY_KEYS_TO_CLEAR,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allScores, businessStage])

  const handleScoreChange = (categoryId, itemId, raw) => {
    setAllScores((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [itemId]: clampScore(raw) },
    }))
  }

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  const card = {
    background: "linear-gradient(135deg, rgba(250, 247, 242, 0.9), rgba(245, 240, 225, 0.9))",
    borderRadius: "16px",
    border: "1px solid rgba(200, 182, 166, 0.3)",
    overflow: "hidden",
    marginBottom: "16px",
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#4a352f", marginBottom: "8px" }}>
        Investment Requirements
      </h2>
      <p style={{ fontSize: "14px", color: "#7d5a50", marginBottom: "24px", maxWidth: "720px", lineHeight: 1.5 }}>
        Rate how much each item matters to your investment decision, from 0 (irrelevant) to 100 (essential). Your
        ratings are your criteria: they set the weight each BIG Score category carries when businesses are scored
        against your fund. Leave everything at 0 to use the standard BIG Score.
      </p>

      <div style={{ marginBottom: "24px", maxWidth: "420px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#4a352f", marginBottom: "6px" }}>
          Business stage you mainly invest in (optional)
        </label>
        <select
          value={businessStage}
          onChange={(e) => setBusinessStage(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #c8b6a6", borderRadius: "8px", fontSize: "14px" }}
        >
          <option value="">Select a stage</option>
          {businessStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* How the ratings turn into weights */}
      <div
        style={{
          ...card,
          padding: "20px",
          display: "flex",
          gap: "24px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ textAlign: "center", minWidth: "110px" }}>
          <div style={{ fontSize: "12px", color: "#7d5a50", fontWeight: 600, textTransform: "uppercase" }}>
            Overall priority
          </div>
          <div style={{ fontSize: "40px", fontWeight: 800, color: getScoreColor(overall) }}>{overall}</div>
          <div style={{ fontSize: "11px", color: "#a89482" }}>
            {ratedCount} of {totalItems} items rated
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "260px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#4a352f", marginBottom: "8px" }}>
            {weights ? "Weight each category carries in your matching" : "No criteria set yet: the standard BIG Score is used"}
          </div>
          {categories.map((cat) => (
            <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ width: "170px", fontSize: "12px", color: "#4a352f" }}>{cat.title}</span>
              <div style={{ flex: 1, height: "8px", background: "#e6d7c3", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${weights ? weights[cat.id] : 0}%`,
                    height: "100%",
                    background: "#a67c52",
                    transition: "width 0.2s",
                  }}
                />
              </div>
              <span style={{ width: "36px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#4a352f" }}>
                {weights ? `${weights[cat.id]}%` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {categories.map((cat) => {
        const open = !!expanded[cat.id]
        return (
          <div key={cat.id} style={card}>
            <div
              onClick={() => toggle(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                cursor: "pointer",
                background: open ? "linear-gradient(135deg, #4a352f, #7d5a50)" : "transparent",
                color: open ? "#faf7f2" : "#4a352f",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "22px" }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{cat.title}</div>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    Average rating {averages[cat.id]}
                    {weights ? ` · ${weights[cat.id]}% of matching` : ""}
                  </div>
                </div>
              </div>
              {open ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </div>

            {open && (
              <div style={{ padding: "16px 20px" }}>
                {cat.items.map((item) => {
                  const value = Number(allScores[cat.id]?.[item.id]) || 0
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "10px 0",
                        borderBottom: "1px solid rgba(200, 182, 166, 0.25)",
                      }}
                    >
                      <label htmlFor={`${cat.id}-${item.id}`} style={{ fontSize: "14px", color: "#4a352f", flex: 1 }}>
                        {item.label}
                      </label>
                      <input
                        id={`${cat.id}-${item.id}`}
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        inputMode="numeric"
                        value={value === 0 ? "" : value}
                        placeholder="0"
                        onChange={(e) => handleScoreChange(cat.id, item.id, e.target.value)}
                        style={{
                          width: "80px",
                          padding: "8px",
                          textAlign: "center",
                          border: "1px solid #c8b6a6",
                          borderRadius: "8px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: getScoreColor(value),
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}