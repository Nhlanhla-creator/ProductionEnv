"use client"

import React, { useState } from "react"
import { Sliders, RotateCcw, CheckCircle2, AlertTriangle, TrendingUp, HelpCircle } from "lucide-react"
import FormField from "./FormField"
import styles from "./catalyst-universal-profile.module.css"
import {
  DEFAULT_STAGE_WEIGHTS_CATALYST,
  SCORE_COMPONENTS_INFO,
} from "./catalystTaxonomy"

export default function CatalystScoringCustomisationTab({
  programme = {},
  updateProgramme,
  isLocked = false,
}) {
  const [selectedStage, setSelectedStage] = useState("growth")
  const [selectedTrack, setSelectedTrack] = useState("ed")

  const scoringConfig = programme.scoringConfiguration || {
    mode: "default", // "default" or "custom"
    stageWeights: { ...DEFAULT_STAGE_WEIGHTS_CATALYST },
    configurationNote: "",
  }

  const isESD = programme.programmeType === "esd"
  const isCustomMode = scoringConfig.mode === "custom"

  const currentWeights =
    scoringConfig.stageWeights?.[selectedStage] ||
    DEFAULT_STAGE_WEIGHTS_CATALYST[selectedStage] || {
      compliance: 20,
      legitimacy: 20,
      governanceLeadership: 20,
      operational: 20,
      valueCreation: 20,
    }

  const defaultWeights = DEFAULT_STAGE_WEIGHTS_CATALYST[selectedStage]

  const totalPercentage = Object.values(currentWeights).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  )
  const isTotalValid = totalPercentage === 100

  const handleModeToggle = (mode) => {
    updateProgramme({
      scoringConfiguration: {
        ...scoringConfig,
        mode,
      },
    })
  }

  const handleWeightChange = (componentId, rawValue) => {
    const numeric = Math.min(100, Math.max(0, parseInt(rawValue, 10) || 0))
    const updatedStage = {
      ...currentWeights,
      [componentId]: numeric,
    }
    updateProgramme({
      scoringConfiguration: {
        ...scoringConfig,
        mode: "custom",
        stageWeights: {
          ...scoringConfig.stageWeights,
          [selectedStage]: updatedStage,
        },
      },
    })
  }

  const handleResetStage = () => {
    updateProgramme({
      scoringConfiguration: {
        ...scoringConfig,
        stageWeights: {
          ...scoringConfig.stageWeights,
          [selectedStage]: { ...DEFAULT_STAGE_WEIGHTS_CATALYST[selectedStage] },
        },
      },
    })
  }

  const handleResetAll = () => {
    updateProgramme({
      scoringConfiguration: {
        mode: "default",
        stageWeights: { ...DEFAULT_STAGE_WEIGHTS_CATALYST },
        configurationNote: "",
      },
    })
  }

  // Simulated Score Preview calculation based on realistic sample baseline
  const sampleBaseline = {
    compliance: 75,
    legitimacy: 60,
    governanceLeadership: 70,
    operational: 80,
    valueCreation: 55,
  }

  const defaultScore = Math.round(
    Object.keys(sampleBaseline).reduce((acc, k) => {
      return acc + (sampleBaseline[k] * (defaultWeights[k] || 20)) / 100
    }, 0)
  )

  const adjustedScore = Math.round(
    Object.keys(sampleBaseline).reduce((acc, k) => {
      return acc + (sampleBaseline[k] * (currentWeights[k] || 20)) / 100
    }, 0)
  )

  const scoreDelta = adjustedScore - defaultScore

  return (
    <div style={{ marginTop: "1rem" }}>
      <div
        style={{
          backgroundColor: "#f8f5f2",
          borderLeft: "4px solid #795548",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "#5d4037",
          fontSize: "14px",
        }}
      >
        <strong>BIG Score Weighting Editor:</strong> BIG calculates the standard score using defaults tailored to the business stage. Use the default methodology or customise the importance of the five components to generate a <em>Programme-adjusted BIG Score</em>. Both scores remain transparent to applicant SMEs with a clear explanation of weighting adjustments.
      </div>

      {/* Mode Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          backgroundColor: "#fff",
          border: "1px solid #d7ccc8",
          borderRadius: "8px",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <strong style={{ color: "#4e342e", fontSize: "15px", display: "block" }}>
            Scoring Configuration Mode
          </strong>
          <span style={{ fontSize: "13px", color: "#6d4c41" }}>
            {isCustomMode
              ? "Custom weightings active for this programme"
              : "Using standard BIG platform methodology stage defaults"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => handleModeToggle("default")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: `2px solid ${!isCustomMode ? "#795548" : "#ccc"}`,
              backgroundColor: !isCustomMode ? "#f3ebe0" : "#fff",
              color: !isCustomMode ? "#4e342e" : "#555",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Use BIG Defaults
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle("custom")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: `2px solid ${isCustomMode ? "#795548" : "#ccc"}`,
              backgroundColor: isCustomMode ? "#f3ebe0" : "#fff",
              color: isCustomMode ? "#4e342e" : "#555",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Customise Weights
          </button>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "#5d4037" }}>
            Select Business Stage to Inspect / Override:
          </label>
          {isESD && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#6d4c41", fontWeight: 600 }}>Track:</span>
              <button
                type="button"
                onClick={() => setSelectedTrack("ed")}
                style={{
                  padding: "2px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: `1px solid ${selectedTrack === "ed" ? "#795548" : "#ccc"}`,
                  backgroundColor: selectedTrack === "ed" ? "#795548" : "#fff",
                  color: selectedTrack === "ed" ? "#fff" : "#555",
                  cursor: "pointer",
                }}
              >
                ED Track
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrack("sd")}
                style={{
                  padding: "2px 8px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: `1px solid ${selectedTrack === "sd" ? "#795548" : "#ccc"}`,
                  backgroundColor: selectedTrack === "sd" ? "#795548" : "#fff",
                  color: selectedTrack === "sd" ? "#fff" : "#555",
                  cursor: "pointer",
                }}
              >
                SD Track
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["startup", "growth", "scaling", "turnaround", "mature"].map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => setSelectedStage(st)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: `1.5px solid ${selectedStage === st ? "#795548" : "#d7ccc8"}`,
                backgroundColor: selectedStage === st ? "#795548" : "#ffffff",
                color: selectedStage === st ? "#ffffff" : "#5d4037",
                fontSize: "13px",
                fontWeight: selectedStage === st ? 700 : 500,
                textTransform: "capitalize",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {st} Stage
            </button>
          ))}
        </div>
      </div>

      {/* Main Sliders Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Sliders Container */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#4e342e" }}>
              Five Component Weights ({selectedStage.toUpperCase()} Stage)
            </h3>
            <button
              type="button"
              onClick={handleResetStage}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "transparent",
                border: "none",
                color: "#795548",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <RotateCcw size={13} /> Reset this stage
            </button>
          </div>

          <div style={{ display: "grid", gap: "1.25rem" }}>
            {SCORE_COMPONENTS_INFO.map((comp) => {
              const currentVal = currentWeights[comp.id] || 0
              const defaultVal = defaultWeights[comp.id] || 0
              return (
                <div key={comp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: "14px", color: "#4e342e" }}>{comp.label}</strong>
                      <span
                        title={comp.tooltip}
                        style={{ cursor: "pointer", color: "#8d6e63", display: "inline-flex" }}
                      >
                        <HelpCircle size={14} />
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#8d6e63" }}>
                        Default: <strong>{defaultVal}%</strong>
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentVal}
                        onChange={(e) => handleWeightChange(comp.id, e.target.value)}
                        className={styles.formInput}
                        style={{ width: "65px", padding: "4px 8px", textAlign: "right", fontWeight: 700 }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#4e342e" }}>%</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={(e) => handleWeightChange(comp.id, e.target.value)}
                    style={{
                      width: "100%",
                      accentColor: "#795548",
                      cursor: "pointer",
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Real-time sum validator */}
          <div
            style={{
              marginTop: "1.5rem",
              padding: "12px 16px",
              borderRadius: "6px",
              backgroundColor: isTotalValid ? "#f0f7f0" : "#fff8e1",
              border: `1.5px solid ${isTotalValid ? "#4caf50" : "#ffb300"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isTotalValid ? (
                <CheckCircle2 size={18} color="#2e7d32" />
              ) : (
                <AlertTriangle size={18} color="#f57f17" />
              )}
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isTotalValid ? "#2e7d32" : "#b78103",
                }}
              >
                {isTotalValid
                  ? "Weights total exactly 100% (Valid configuration)"
                  : totalPercentage < 100
                  ? `Total is ${totalPercentage}% (${100 - totalPercentage}% remaining to allocate)`
                  : `Total is ${totalPercentage}% (${totalPercentage - 100}% over 100%)`}
              </span>
            </div>
            <strong style={{ fontSize: "16px", color: isTotalValid ? "#2e7d32" : "#c62828" }}>
              {totalPercentage}%
            </strong>
          </div>
        </div>

        {/* Live Delta Preview Comparison Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #d7ccc8",
            borderRadius: "8px",
            padding: "1.25rem",
            boxShadow: "0 2px 8px rgba(74, 53, 47, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
            <TrendingUp size={18} color="#795548" />
            <h4 style={{ margin: 0, fontSize: "15px", color: "#4e342e", fontWeight: 700 }}>
              Sample Score Comparison
            </h4>
          </div>

          <p style={{ margin: "0 0 1rem 0", fontSize: "12px", color: "#6d4c41", lineHeight: "1.4" }}>
            Visual preview of how this weighting configuration adjusts a sample SME applicant’s score.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              padding: "10px",
              backgroundColor: "#f8f5f2",
              borderRadius: "6px",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#8d6e63", display: "block" }}>
                Default BIG Score
              </span>
              <strong style={{ fontSize: "22px", color: "#5d4037" }}>{defaultScore}</strong>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#8d6e63", display: "block" }}>
                Adjusted Score
              </span>
              <strong style={{ fontSize: "22px", color: "#2e7d32" }}>{adjustedScore}</strong>
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              backgroundColor: scoreDelta >= 0 ? "#e8f5e9" : "#ffebee",
              color: scoreDelta >= 0 ? "#2e7d32" : "#c62828",
              fontSize: "13px",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            Delta: {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} points
          </div>

          <div style={{ fontSize: "12px", color: "#6d4c41", borderTop: "1px solid #e8d8cf", paddingTop: "0.75rem" }}>
            <span style={{ fontWeight: 600, display: "block", marginBottom: "4px" }}>
              Component Delta Contributions:
            </span>
            {SCORE_COMPONENTS_INFO.map((c) => {
              const diff = (currentWeights[c.id] || 0) - (defaultWeights[c.id] || 0)
              return (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
                  <span>{c.label.split("&")[0].trim()}:</span>
                  <span style={{ fontWeight: 600, color: diff > 0 ? "#2e7d32" : diff < 0 ? "#c62828" : "#8d6e63" }}>
                    {diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : "0%"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
