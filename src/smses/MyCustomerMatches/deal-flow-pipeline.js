"use client";

import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import styles from "./pipeline.module.css"; // Updated to match your naming convention

export function CustomerFlowPipeline({ applications = [] }) {
  const [stages, setStages] = useState([
    {
      id: "applicationsSubmitted",
      name: "Applications Submitted",
      count: 0,
     
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
    },
    {
      id: "matched",
      name: "Matches Found",
      count: 0,

      colorClass: styles.stageApplication,
      iconColor: "#795548",
    },
    {
      id: "acceptedBySupplier",
      name: "Accepted by Supplier",
      count: 0,
    
      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
    },
    {
      id: "shortlisted",
      name: "Shortlisted by Customer",
      count: 0,
     
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
    },
    {
      id: "proposalQuote",
      name: "Proposal/Quote Sent",
      count: 0,

      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
    },
    {
      id: "dealsInProgress",
      name: "Deal in Progress",
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
      id: "declined",
      name: "Declined/No Match",
      count: 0,
     
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    }
  ]);

  const calculateStageCounts = () => {
    if (!applications || applications.length === 0) {
      return {
        applicationsSubmitted: 0,
        matched: 0,
        acceptedBySupplier: 0,
        shortlisted: 0,
        proposalQuote: 0,
        dealsInProgress: 0,
        dealClosed: 0,
        declined: 0,
      };
    }

    return {
      applicationsSubmitted: applications.length,
      matched: applications.filter(app => app.status && app.status !== "Pending").length,
      acceptedBySupplier: applications.filter(app => 
        app.status && (app.status === "Accepted" || app.status === "Reviewed")
      ).length,
      shortlisted: applications.filter(app => app.status && app.status === "Reviewed").length,
      proposalQuote: applications.filter(app => app.status && app.status === "Proposal Sent").length,
      dealsInProgress: applications.filter(app => app.status && app.status === "In Progress").length,
      dealClosed: applications.filter(app => app.status && app.status === "Completed").length,
      declined: applications.filter(app => app.status && app.status === "Rejected").length,
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
  }, [applications]);

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
            
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}