"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import styles from "./customers.module.css";

// Slider Component
const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={`${styles.sliderRoot} ${className}`} {...props}>
    <SliderPrimitive.Track className={styles.sliderTrack}>
      <SliderPrimitive.Range className={styles.sliderRange} />
    </SliderPrimitive.Track>
    {props.value?.map((_, i) => (
      <SliderPrimitive.Thumb key={i} className={styles.sliderThumb} />
    ))}
  </SliderPrimitive.Root>
));

Slider.displayName = "Slider";

// DealFlowPipeline Component
export function DealFlowPipeline({ applications = [] }) {
  const [hoveredStage, setHoveredStage] = useState(null);

  const calculateStageCounts = () => {
    if (!applications || applications.length === 0) {
      return {
        applicationsSubmitted: 0,
        matched: 0,
        acceptedBySupplier: 0,
        shortlisted: 0,
        proposalQuote: 0,
        deals: 0,
        closed: 0,
        declined: 0,
      };
    }

    return {
      applicationsSubmitted: applications.length,
      matched: applications.filter(app => app.status && app.status !== "Pending").length,
      acceptedBySupplier: applications.filter(app => app.status && (app.status === "Accepted" || app.status === "Reviewed")).length,
      shortlisted: applications.filter(app => app.status && app.status === "Reviewed").length,
      proposalQuote: applications.filter(app => app.status && app.status === "Accepted").length,
      deals: applications.filter(app => app.status && app.status === "Accepted").length,
      closed: applications.filter(app => app.status && (app.status === "Accepted" || app.status === "Rejected")).length,
      declined: applications.filter(app => app.status && app.status === "Rejected").length,
    };
  };

  const stageCounts = calculateStageCounts();

  const stages = [
    { 
      id: "applications submitted", 
      name: "Applications Submitted", 
      count: stageCounts.applicationsSubmitted, 
      description: "Customer posted a request",
      iconColor: "#8d6e63"
    },
    { 
      id: "matched", 
      name: "Matches Found", 
      count: stageCounts.matched, 
      description: "Suppliers matched to request",
      iconColor: "#795548"
    },
    { 
      id: "accepted", 
      name: "Accepted by Supplier", 
      count: stageCounts.acceptedBySupplier, 
      description: "Suppliers accepted match",
      iconColor: "#6d4c41"
    },
    { 
      id: "shortlisted", 
      name: "Shortlisted by Customer", 
      count: stageCounts.shortlisted, 
      description: "Customer reviewed and shortlisted",
      iconColor: "#5d4037"
    },
    { 
      id: "proposal/qoute", 
      name: "Proposal/Quote Sent", 
      count: stageCounts.proposalQuote, 
      description: "Supplier sent formal proposal",
      iconColor: "#4e342e"
    },
    { 
      id: "deals", 
      name: "Deal in progress", 
      count: stageCounts.deals, 
      description: "Selected supplier engaged",
      iconColor: "#3e2723"
    },
    { 
      id: "closed", 
      name: "Deal closed", 
      count: stageCounts.closed, 
      description: "Successful completion (can be rated)",
      iconColor: "#2e1b13"
    },
    { 
      id: "declined", 
      name: "Declined / No Match", 
      count: stageCounts.declined, 
      description: "No action or rejected",
      iconColor: "#1e0e09"
    },
  ];

  return (
    <div className={styles.dealflowPipelineContainer}>
      <div className={styles.pipelineHeader}>
        <h2 className={styles.pipelineTitle}>Customer Deal Flow</h2>
      </div>

      <div className={styles.pipelineStagesContainer}>
        <div className={styles.pipelineStagesRow}>
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={styles.pipelineStage}
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
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

              {hoveredStage === stage.id && (
                <div className={styles.stageTooltipBottom}>
                  <div className={styles.tooltipArrowBottom}></div>
                  <h4 className={styles.tooltipTitle}>{stage.name}</h4>
                  <p className={styles.tooltipDescription}>{stage.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Slider };