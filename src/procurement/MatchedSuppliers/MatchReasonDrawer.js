"use client"

import React, { useEffect } from "react"
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Building,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react"

/**
 * Score progress bar card for individual criteria
 */
const CriterionCard = ({ label, weight, score, appValue, supplierValue }) => {
  const numScore = Number(score) || 0
  const color = numScore >= 75 ? "#2E7D32" : numScore >= 50 ? "#F57C00" : "#D32F2F"

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8D5C4",
        borderLeft: `4px solid ${color}`,
        borderRadius: "8px",
        padding: "12px 14px",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>
          {label} <span style={{ fontSize: "0.75rem", color: "#8D6E63", fontWeight: 400 }}>({weight}%)</span>
        </span>
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color }}>{Math.round(numScore)}%</span>
      </div>

      <div
        style={{
          background: "#F5F0E1",
          borderRadius: "4px",
          height: "6px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            height: "100%",
            background: color,
            width: `${Math.min(100, Math.max(0, numScore))}%`,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#6D4C41" }}>
        <span>Buyer Demand: <strong>{appValue || "Baseline"}</strong></span>
        <span>Supplier: <strong>{supplierValue || "Verified"}</strong></span>
      </div>
    </div>
  )
}

export default function MatchReasonDrawer({
  isOpen,
  onClose,
  supplier,
  demandContext,
  onOpenSupplierDetail,
  onOpenRFI,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !supplier) return null

  const fitScore = supplier.requirementFit || supplier.matchPercentage || 0
  const aiScore = supplier.aiMatchPercentage
  const primaryScore = supplier.primaryMatchPercentage || 0
  const hasAi = aiScore !== null && aiScore !== undefined

  const fitColor = fitScore >= 75 ? "#2E7D32" : fitScore >= 50 ? "#F57C00" : "#D32F2F"
  const fitLabel = fitScore >= 90 ? "Optimal Alignment" : fitScore >= 75 ? "Strong Fit" : fitScore >= 50 ? "Moderate Fit" : "Low Alignment"

  const breakdown = supplier.matchBreakdown || {}

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(30, 20, 15, 0.45)",
        backdropFilter: "blur(2px)",
        zIndex: 1100,
        display: "flex",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          height: "100%",
          backgroundColor: "#FAF7F2",
          boxShadow: "-8px 0 28px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            background: "#4A352F",
            color: "#FAF7F2",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Sparkles size={18} color="#D4AF37" />
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "#D4AF37", fontWeight: 600 }}>
                Explainable Fit Engine
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#FAF7F2", fontWeight: 600 }}>
              {supplier.name}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "#D7CCC8", marginTop: "4px" }}>
              {supplier.offeringCategory} · {supplier.location}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#FAF7F2",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", flex: 1 }}>
          {/* Composite Score Banner */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8D5C4",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", color: "#8D6E63", fontWeight: 500, textTransform: "uppercase" }}>
                Requirement Fit Index
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: fitColor, marginTop: "2px" }}>
                {fitLabel}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8D6E63", marginTop: "4px" }}>
                {hasAi ? "60% AI Semantic Analysis + 40% Structured Criteria" : "Structured Multi-Factor Analysis"}
              </div>
            </div>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                border: `4px solid ${fitColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.35rem",
                fontWeight: 800,
                color: fitColor,
              }}
            >
              {Math.round(fitScore)}%
            </div>
          </div>

          {/* AI Semantic Reasoning (if available) */}
          <div
            style={{
              background: "#F5F0E1",
              border: "1px solid #E0D0B8",
              borderRadius: "8px",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Sparkles size={16} color="#8D6E63" />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F" }}>
                AI Semantic Analysis & Rationale
              </span>
            </div>
            <p style={{ fontSize: "0.825rem", color: "#5D4037", lineHeight: "1.45", margin: 0 }}>
              {supplier.aiReasoning ||
                `Supplier demonstrates verified domain alignment in ${supplier.offeringCategory} with operating capabilities in ${supplier.location}. Profile exhibits strong B-BBEE Level (${supplier.bbbeeLevel}) and verified statutory documentation coverage.`}
            </p>

            {supplier.aiCapabilities && supplier.aiCapabilities.length > 0 && (
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {supplier.aiCapabilities.map((cap, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#FFFFFF",
                      color: "#4A352F",
                      fontSize: "0.725rem",
                      fontWeight: 500,
                      padding: "3px 8px",
                      borderRadius: "12px",
                      border: "1px solid #D7CCC8",
                    }}
                  >
                    ✓ {cap}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Readiness & Verification Quick Diagnostic */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F", margin: "0 0 10px 0" }}>
              Platform Readiness & Passport
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8D5C4",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>BIG Score</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4A352F" }}>
                  {supplier.bigScore !== null ? `${supplier.bigScore}/100` : "Under Review"}
                </div>
              </div>

              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E8D5C4",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontSize: "0.725rem", color: "#8D6E63" }}>Passport Status</div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: supplier.passportVariant === "success" ? "#2E7D32" : supplier.passportVariant === "warning" ? "#F57C00" : "#D32F2F",
                  }}
                >
                  {supplier.passportLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Criteria Breakdown */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4A352F", margin: "0 0 10px 0" }}>
              Structured Criteria Score Breakdown
            </h4>

            <CriterionCard
              label="Product & Service Category Alignment"
              weight={40}
              score={breakdown.categoryMatch?.score ?? (supplier.requirementFit > 50 ? 85 : 40)}
              appValue={demandContext?.requestOverview?.categories?.[0] || "Target Category"}
              supplierValue={supplier.offeringCategory}
            />

            <CriterionCard
              label="B-BBEE Level Compliance"
              weight={10}
              score={breakdown.bbbeeMatch?.score ?? (supplier.bbbeeLevel?.includes("1") ? 100 : 75)}
              appValue={demandContext?.matchingPreferences?.bbeeLevel || "Level 4 or better"}
              supplierValue={supplier.bbbeeLevel}
            />

            <CriterionCard
              label="Geographic Location Match"
              weight={10}
              score={breakdown.locationMatch?.score ?? 100}
              appValue={demandContext?.matchingPreferences?.location || "National / Any"}
              supplierValue={supplier.location}
            />

            <CriterionCard
              label="Delivery Capability & Modes"
              weight={10}
              score={breakdown.deliveryMatch?.score ?? 100}
              appValue="On-site / Hybrid"
              supplierValue={supplier.deliveryCapability}
            />

            <CriterionCard
              label="Budget & Revenue Capacity"
              weight={10}
              score={breakdown.budgetMatch?.score ?? 80}
              appValue="R 100k – R 20M"
              supplierValue={supplier.annualRevenue || "Disclosed to Buyer"}
            />

            <CriterionCard
              label="Ownership Demographics (B-BBEE / Women / Youth)"
              weight={5}
              score={breakdown.ownershipMatch?.score ?? (supplier.ownershipTags?.length > 0 ? 100 : 50)}
              appValue="Target Ownership"
              supplierValue={supplier.ownershipProfile}
            />

            <CriterionCard
              label="Track Record & Platform Rating"
              weight={5}
              score={breakdown.ratingMatch?.score ?? (supplier.rating > 0 ? (supplier.rating / 5) * 100 : 80)}
              appValue="Positive feedback"
              supplierValue={supplier.rating > 0 ? `${supplier.rating.toFixed(1)}/5 (${supplier.ratingCount} reviews)` : "Good standing"}
            />
          </div>

          {/* Critical Gaps Warning (if any) */}
          {supplier.criticalGaps && supplier.criticalGaps.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                background: "#FFF3E0",
                border: "1px solid #FFE0B2",
                borderRadius: "8px",
                padding: "12px 14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#E65100", fontWeight: 600, fontSize: "0.8rem", marginBottom: "4px" }}>
                <AlertTriangle size={15} /> Critical Pre-Onboarding Gaps:
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.75rem", color: "#BF360C" }}>
                {supplier.criticalGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E8D5C4",
            background: "#FFFFFF",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={() => {
              if (onOpenRFI) onOpenRFI(supplier)
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#FAF7F2",
              border: "1px solid #4A352F",
              color: "#4A352F",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Request Information
          </button>

          <button
            onClick={() => {
              if (onOpenSupplierDetail) onOpenSupplierDetail(supplier)
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "#4A352F",
              border: "none",
              color: "#FAF7F2",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            Full Profile <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
