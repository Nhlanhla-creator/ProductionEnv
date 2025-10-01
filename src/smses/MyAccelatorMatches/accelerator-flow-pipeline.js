"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import styles from "./acceleratorPipeline.module.css"

export function AcceleratorFlowPipeline({ accelerators = [], applications = [] }) {
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

  // Calculate counts based on actual data
  const calculateStageCounts = () => {
    // Count unmatched accelerators (potential matches)
    const unmatchedAccelerators = accelerators.filter(acc => 
      !applications.some(app => app.catalystId === acc.id)
    ).length;

    // Count applications by status
    const applicationCount = applications.length;
    const reviewCount = applications.filter(app => 
      app.pipelineStage === "Evaluation" || app.status === "Under Review"
    ).length;
    const dueDiligenceCount = applications.filter(app => 
      app.pipelineStage === "Due Diligence"
    ).length;
    const decisionCount = applications.filter(app => 
      app.pipelineStage === "Decision"
    ).length;
    const termIssuedCount = applications.filter(app => 
      app.pipelineStage === "Term Issued"
    ).length;
    const dealClosedCount = applications.filter(app => 
      app.pipelineStage === "Deal Closed" || app.status === "Completed"
    ).length;
    const withdrawnCount = applications.filter(app => 
      app.pipelineStage === "Withdrawn" || app.status === "Declined" || app.status === "Withdrawn"
    ).length;

    return {
      initial: unmatchedAccelerators,
      application: applicationCount,
      review: reviewCount,
      approved: dueDiligenceCount,
      feedback: decisionCount,
      termIssued: termIssuedCount,
      dealClosed: dealClosedCount,
      withdrawn: withdrawnCount,
    };
  };

  useEffect(() => {
    const stageCounts = calculateStageCounts();
    
    setStages((current) =>
      current.map((stage) => ({
        ...stage,
        count: stageCounts[stage.id] || 0,
      }))
    );
  }, [accelerators, applications]); // Update when data changes

  return (
    <div className={styles.dealflowPipelineContainer}>
      <div className={styles.pipelineHeader}>
      
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
               
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}