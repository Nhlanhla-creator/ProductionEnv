"use client"

import { useState, useEffect } from "react"
import { Info } from 'lucide-react'
import styles from "./advisorPipeline.module.css"

export function AdvisorFlowPipeline({ primaryMatchCount, stageCounts }) {
  const [stages, setStages] = useState([
    {
      id: "initial",
      name: "Matching",
      count: 0,

      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
    },
    {
      id: "application",
      name: "Application",
      count: 0,

      colorClass: styles.stageApplication,
      iconColor: "#795548",
    },
    {
      id: "review",
      name: "Evaluation",
      count: 0,

      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
    },
    {
      id: "approved",
      name: "Due Diligence",
      count: 0,

      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
    },
    {
      id: "feedback",
      name: "Decision",
      count: 0,

      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
    },
    {
      id: "termIssued",
      name: "Term Issued",
      count: 0,

      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
    },
    {
      id: "dealClosed",
      name: "Deal Closed",
      count: 0,

      colorClass: styles.stageDeals,
      iconColor: "#2e1b13",
    },
    {
      id: "withdrawn",
      name: "Withdrawn/Declined",
      count: 0,

      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    }
  ])

  const [totalConnections, setTotalConnections] = useState(8)

  const calculateStageCounts = () => {
    // You can replace this with actual data fetching logic
    return {
      initial: primaryMatchCount || 45,
      application: 12,
      review: 8,
      approved: 5,
      feedback: 3,
      termIssued: 2,
      dealClosed: 2,
      withdrawn: 4,
    };
  };

  useEffect(() => {
    setStages((current) =>
      current.map((stage) => {
        if (stage.id === "initial") {
          return { ...stage, count: primaryMatchCount || 0 };
        }
        if (stageCounts[stage.id] !== undefined) {
          return { ...stage, count: stageCounts[stage.id] };
        }
        return stage;
      })
    );
  }, [primaryMatchCount, stageCounts]);

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