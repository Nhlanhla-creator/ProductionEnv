"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const businessStages = [
  { id: "ideation", name: "Ideation", description: "Concept stage, idea validation" },
  { id: "prototype", name: "Prototype", description: "MVP development, testing" },
  { id: "startup", name: "Startup", description: "Early revenue, product-market fit" },
  { id: "early-growth", name: "Early Growth", description: "Scaling operations" },
  { id: "growth", name: "Growth", description: "Expanding market share" },
  { id: "scale-up", name: "Scale-up", description: "Rapid expansion" },
  { id: "mature", name: "Mature", description: "Established business" },
]

const stageWeights = {
  ideation:      { compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
  prototype:     { compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
  startup:       { compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
  "early-growth":{ compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
  growth:        { compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
  "scale-up":    { compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
  mature:        { compliance: 32, legitimacy: 13, leadership: 10, governance: 13, capitalAppeal: 32 },
}

const categories = [
  {
    id: "compliance",
    label: "Compliance",
    color: "#533DB7",
    weight: "compliance",
    items: [
      { id: "registrationCertificate", name: "Company registration certificate" },
      { id: "taxClearance",            name: "Tax clearance certificate" },
      { id: "bbbeeCertificate",        name: "B-BBEE certificate" },
      { id: "shareRegister",           name: "Share register" },
      { id: "directorIDs",             name: "IDs of directors & shareholders" },
      { id: "addressProof",            name: "Proof of address" },
      { id: "bankLetter",              name: "Bank confirmation letter" },
      { id: "coidaCertificate",        name: "COIDA letter of good standing" },
      { id: "industryLicenses",        name: "Industry accreditations" },
    ],
  },
  {
    id: "legitimacy",
    label: "Legitimacy",
    color: "#0F6E56",
    weight: "legitimacy",
    items: [
      { id: "professionalWebsite", name: "Professional website" },
      { id: "businessEmail",       name: "Business email domain" },
      { id: "companyLogo",         name: "Company logo & branding" },
      { id: "linkedinPage",        name: "LinkedIn company page" },
      { id: "clientTestimonials",  name: "Client testimonials / references" },
      { id: "caseStudies",         name: "Case studies / portfolio" },
      { id: "pressMentions",       name: "News / press mentions" },
      { id: "googleBusiness",      name: "Google business profile" },
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    color: "#993C1D",
    weight: "leadership",
    items: [
      { id: "directorCVs",      name: "Director CVs / resumes" },
      { id: "executiveCVs",     name: "Executive team CVs" },
      { id: "linkedinProfiles", name: "LinkedIn profiles" },
      { id: "certifications",   name: "Professional certifications" },
      { id: "boardMinutes",     name: "Board meeting minutes" },
      { id: "orgChart",         name: "Organizational chart" },
      { id: "successionPlan",   name: "Succession plan" },
      { id: "advisoryBoard",    name: "Advisory board" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    color: "#854F0B",
    weight: "governance",
    items: [
      { id: "boardStructure",      name: "Board structure" },
      { id: "strategicPlanning",   name: "Strategic planning" },
      { id: "riskManagement",      name: "Risk management" },
      { id: "transparency",        name: "Transparency & reporting" },
      { id: "policies",            name: "Policies & documentation" },
      { id: "complianceFramework", name: "Compliance framework" },
      { id: "internalControls",    name: "Internal controls" },
      { id: "ethicsCode",          name: "Code of ethics" },
    ],
  },
  {
    id: "capitalAppeal",
    label: "Capital appeal",
    color: "#185FA5",
    weight: "capitalAppeal",
    items: [
      { id: "auditedFinancials",   name: "Audited financial statements" },
      { id: "businessPlan",        name: "Business plan" },
      { id: "pitchDeck",           name: "Pitch deck" },
      { id: "financialProjections",name: "Financial projections" },
      { id: "creditReport",        name: "Credit report" },
      { id: "managementAccounts",  name: "Management accounts" },
      { id: "capTable",            name: "Cap table" },
      { id: "dueDiligence",        name: "Due diligence reports" },
    ],
  },
]

// ── helpers ────────────────────────────────────────────────────────────────────

function calcAvg(scores, items) {
  if (!items.length) return 0
  const total = items.reduce((sum, item) => sum + (scores[item.id] || 0), 0)
  return Math.round(total / items.length)
}

function badgeStyle(score) {
  if (score >= 60) return { background: "#EAF3DE", color: "#3B6D11" }
  if (score >= 40) return { background: "#FAEEDA", color: "#854F0B" }
  return { background: "#FCEBEB", color: "#A32D2D" }
}

function levelText(score) {
  if (score >= 80) return "High priority"
  if (score >= 60) return "Moderate-high"
  if (score >= 40) return "Moderate"
  if (score >= 20) return "Low priority"
  return "Minimal"
}

// ── CategoryCard ───────────────────────────────────────────────────────────────

function CategoryCard({ category, scores, onScoreChange, weightPct, fullWidth }) {
  const [open, setOpen] = useState(true)
  const avg = calcAvg(scores, category.items)
  const bs = badgeStyle(avg)

  return (
    <div
      style={{
        background: "white",
        border: "0.5px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        gridColumn: fullWidth ? "1 / -1" : undefined,
      }}
    >
      {/* header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: open ? "0.5px solid #f0f0f0" : "none",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: 13, color: "#111" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: category.color,
              flexShrink: 0,
            }}
          />
          {category.label}
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              ...bs,
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {avg}
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{weightPct}%</span>
          {open ? (
            <ChevronUp size={14} color="#9ca3af" />
          ) : (
            <ChevronDown size={14} color="#9ca3af" />
          )}
        </span>
      </div>

      {/* table */}
      {open && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "0.5px solid #f0f0f0" }}>
              <th style={{ padding: "6px 14px", textAlign: "left", fontWeight: 400, fontSize: 11, color: "#6b7280" }}>
                Requirement
              </th>
              <th style={{ padding: "6px 14px", textAlign: "center", fontWeight: 400, fontSize: 11, color: "#6b7280", width: 90 }}>
                Weighting
              </th>
            </tr>
          </thead>
          <tbody>
            {category.items.map((item, idx) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: idx < category.items.length - 1 ? "0.5px solid #f0f0f0" : "none",
                  background: idx % 2 === 0 ? "white" : "#fafafa",
                }}
              >
                <td style={{ padding: "6px 14px", color: "#374151" }}>{item.name}</td>
                <td style={{ padding: "6px 14px", textAlign: "center" }}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    value={scores[item.id] ?? 0}
                    onChange={(e) => {
                      const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      onScoreChange(item.id, v)
                    }}
                    style={{
                      width: 56,
                      padding: "4px 6px",
                      border: "0.5px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 12,
                      textAlign: "center",
                      background: "white",
                      color: "#111",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function InvestmentRequirements({ data = {}, updateData }) {
  const [businessStage, setBusinessStage] = useState(data.businessStage || "")
  const [allScores, setAllScores] = useState(() => {
    const initial = {}
    categories.forEach((cat) => {
      initial[cat.id] = data[`${cat.id}Scores`] || {}
    })
    return initial
  })

  const currentWeights = businessStage ? stageWeights[businessStage] : stageWeights.ideation

  // compute per-category averages
  const catAvgs = {}
  categories.forEach((cat) => {
    catAvgs[cat.id] = calcAvg(allScores[cat.id], cat.items)
  })

  // compute BIG score
  const bigScore = Math.round(
    categories.reduce((sum, cat) => sum + catAvgs[cat.id] * currentWeights[cat.weight], 0) / 100
  )

  // propagate changes upward
  useEffect(() => {
    if (!updateData) return
    const payload = { businessStage, weights: currentWeights, bigScore, categoryScores: catAvgs }
    categories.forEach((cat) => {
      payload[`${cat.id}Scores`] = allScores[cat.id]
    })
    updateData(payload)
  }, [allScores, businessStage])

  const handleScoreChange = (catId, itemId, value) => {
    setAllScores((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [itemId]: value },
    }))
  }

  const bigBs = badgeStyle(bigScore)

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 0 40px" }}>

      {/* heading */}
      <h2 style={{ fontSize: 20, fontWeight: 500, color: "#111", margin: "0 0 4px" }}>
        Investment requirements
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px" }}>
        Rate each item (0–100) based on its weighting in your investment decision. The BIG Score
        aggregates across all categories.
      </p>

      {/* stage selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
          Business stage
        </span>
        <select
          value={businessStage}
          onChange={(e) => setBusinessStage(e.target.value)}
          style={{
            padding: "6px 10px",
            fontSize: 13,
            borderRadius: 8,
            border: "0.5px solid #d1d5db",
            background: "white",
            color: businessStage ? "#111" : "#9ca3af",
            maxWidth: 280,
          }}
        >
          <option value="">Select stage…</option>
          {businessStages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.description}
            </option>
          ))}
        </select>
      </div>

      {businessStage && (
        <>
          {/* 2-column grid of category cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {categories.map((cat, idx) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                scores={allScores[cat.id]}
                onScoreChange={(itemId, value) => handleScoreChange(cat.id, itemId, value)}
                weightPct={currentWeights[cat.weight]}
                fullWidth={idx === categories.length - 1}
              />
            ))}
          </div>

          {/* BIG Score panel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 24,
              alignItems: "center",
              background: "#f9fafb",
              border: "0.5px solid #e5e7eb",
              borderRadius: 12,
              padding: "20px 24px",
            }}
          >
            {/* breakdown bars */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", margin: "0 0 12px" }}>
                Score breakdown
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categories.map((cat) => (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: cat.color,
                        }}
                      />
                      {cat.label} ({currentWeights[cat.weight]}%)
                    </span>
                    <div
                      style={{
                        flex: 2,
                        height: 4,
                        borderRadius: 2,
                        background: "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${catAvgs[cat.id]}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: cat.color,
                          transition: "width 0.3s",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#111", minWidth: 24, textAlign: "right" }}>
                      {catAvgs[cat.id]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* BIG Score circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  border: "0.5px solid #e5e7eb",
                  background: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 32, fontWeight: 500, lineHeight: 1, color: "#111" }}>
                  {bigScore}
                </span>
                <span style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>BIG Score</span>
              </div>
              <span style={{ fontSize: 11, color: "#6b7280" }}>{levelText(bigScore)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}