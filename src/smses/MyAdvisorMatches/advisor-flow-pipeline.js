"use client"

import { useState, useEffect } from "react"
import { Info } from 'lucide-react'
import styles from "./styles/advisorPipeline.module.css"

export function AdvisorFlowPipeline({ applicationsCount = 0, matchesCount = 0, stageCounts = {} }) {
  const [stages, setStages] = useState([
    {
      id: "applications",
      name: "Applications",
      count: 0,
      description: "Advisory applications you've submitted",
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
    },
    {
      id: "matches",
      name: "Matches",
      count: 0,
      description: "Advisors matched to your applications",
      colorClass: styles.stageApplication,
      iconColor: "#795548",
    },
    {
      id: "contacted",
      name: "Contacted",
      count: 0,
      description: "Advisors you've reached out to",
      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
    },
    {
      id: "evaluation",
      name: "Evaluation",
      count: 0,
      description: "Advisors reviewing your request",
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
    },
    {
      id: "negotiation",
      name: "Negotiation",
      count: 0,
      description: "Terms being discussed",
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
    },
    {
      id: "termIssued",
      name: "Term Issued",
      count: 0,
      description: "Formal agreement sent",
      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
    },
    {
      id: "dealClosed",
      name: "Deal Closed",
      count: 0,
      description: "Successful advisory agreement",
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13",
    },
    {
      id: "withdrawn",
      name: "Withdrawn/Declined",
      count: 0,
      description: "Declined or withdrawn",
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    }
  ])

  useEffect(() => {
    setStages((current) =>
      current.map((stage) => {
        if (stage.id === "applications") {
          return { ...stage, count: applicationsCount || 0 }
        }
        if (stage.id === "matches") {
          return { ...stage, count: matchesCount || 0 }
        }
        if (stageCounts[stage.id] !== undefined) {
          return { ...stage, count: stageCounts[stage.id] }
        }
        return stage
      })
    )
  }, [applicationsCount, matchesCount, stageCounts])

  return (
    <div className={styles.dealflowPipelineContainer}>
      <div className={styles.pipelineHeader}>
        {/* Optional header content */}
      </div>

      <div className={styles.pipelineStagesContainer}>
        <div className={styles.pipelineConnectionLine}></div>

        <div className={styles.pipelineStagesRow}>
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`${styles.pipelineStage} ${stage.colorClass}`}
            >
              <div className={styles.stageCard}>
                <div className={styles.stageContent}>
                  <div className={styles.stageHeader}>
                    <h3 className={styles.stageName}>{stage.name}</h3>
                    <div className={styles.stageIcon} style={{ color: stage.iconColor }}>
                      <Info size={14} />
                    </div>
                  </div>
                  <p className={styles.stageCount}>{stage.count}</p>
                </div>
              </div>

              {/* Tooltip for stage description */}
              <div className={styles.stageTooltip}>
                {stage.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}