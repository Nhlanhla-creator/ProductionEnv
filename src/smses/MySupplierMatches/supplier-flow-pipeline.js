"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Info } from 'lucide-react';
import styles from "./supplierPipeline.module.css";

export function SupplierFlowPipeline({ suppliers = [], contactedSuppliers = [] }) {
  const [stages, setStages] = useState([
    {
      id: "initial",
      name: "Potential Suppliers",
      count: 0,
      description: "",
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
    },
    {
      id: "engagements", 
      name: "Contact Initiated",
      count: 0,
      description: "",
      colorClass: styles.stageApplication,
      iconColor: "#795548",
    },
    {
      id: "discussions",
      name: "In Discussion", 
      count: 0,
      description: "",
      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
    },
    {
      id: "proposal",
      name: "Proposal Sent",
      count: 0,
      description: "",
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
    },
    {
      id: "deals",
      name: "Deals in Progress", 
      count: 0,
      description: "",
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
    },
    {
      id: "delivery",
      name: "Deals Completed",
      count: 0,
      description: "",
      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
    },
    {
      id: "declined",
      name: "Declined/No Response",
      count: 0,
      description: "",
      colorClass: styles.stageWithdrawn,
      iconColor: "#2e1b13",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Update initial count whenever suppliers prop changes
    setStages(current => current.map(stage => {
      if (stage.id === "initial") {
        return {
          ...stage,
          count: suppliers.length,
          description: `Total suppliers available (${suppliers.length} in directory)`
        };
      }
      if (stage.id === "engagements") {
        return {
          ...stage,
          count: contactedSuppliers.length,
          description: `Suppliers you've contacted (${contactedSuppliers.length} of ${suppliers.length})`
        };
      }
      return stage;
    }));
  }, [suppliers, contactedSuppliers]);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        setLoading(true);

        // Get all applications for this customer
        const applicationsQuery = query(
          collection(db, "supplierApplications"),
          where("customerId", "==", currentUser.uid)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const applications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate counts for each stage
        const engagementsCount = contactedSuppliers.length;

        // In Discussion: When status is Shortlisted OR currentStage is Shortlist
        const discussionsCount = applications.filter(app =>
          app.status === "Shortlisted" ||
          app.currentStage === "Shortlist" ||
          (app.meetingDetails && app.meetingDetails.purpose === "Discussion")
        ).length;

        // Proposal Sent: When nextStage is "Proposal Sent" or currentStage indicates proposal
        const proposalSentCount = applications.filter(app =>
          app.nextStage === "Proposal Sent" ||
          app.currentStage === "Proposal Sent" ||
          app.currentStage === "Proposal Submitted"
        ).length;

        // Deals in Progress: When in negotiation/contract stages
        const dealsInProgressCount = applications.filter(app =>
          app.currentStage === "Negotiation" ||
          app.currentStage === "Contract Sent" ||
          app.currentStage === "Contract Signed"
        ).length;

        // Deals Completed: When status is Completed
        const dealsCompletedCount = applications.filter(app =>
          app.status === "Completed"
        ).length;

        // Declined: When status is Rejected/Declined OR no response after proposal
        const declinedCount = applications.filter(app =>
          app.status === "Rejected" ||
          app.status === "Declined" ||
          (app.nextStage === "Proposal Sent" &&
            app.updatedAt &&
            (new Date() - app.updatedAt.toDate()) > (14 * 24 * 60 * 60 * 1000)) // No response after 14 days
        ).length;

        // Update stages with calculated data
        setStages(current => current.map(stage => {
          switch(stage.id) {
            case "initial":
              return {
                ...stage,
                count: suppliers.length,
                description: `Total suppliers available (${suppliers.length} in directory)`
              };
            case "engagements":
              return {
                ...stage,
                count: engagementsCount,
                description: `Suppliers you've contacted (${engagementsCount} of ${suppliers.length})`
              };
            case "discussions":
              return {
                ...stage,
                count: discussionsCount,
                description: `Suppliers in active communication (${discussionsCount})`
              };
            case "proposal":
              return {
                ...stage,
                count: proposalSentCount,
                description: `Proposals submitted to suppliers (${proposalSentCount})`
              };
            case "deals":
              return {
                ...stage,
                count: dealsInProgressCount,
                description: `Active negotiations/contracts (${dealsInProgressCount})`
              };
            case "delivery":
              return {
                ...stage,
                count: dealsCompletedCount,
                description: `Successful engagements (${dealsCompletedCount})`
              };
            case "declined":
              return {
                ...stage,
                count: declinedCount,
                description: `Suppliers who declined or didn't respond (${declinedCount})`
              };
            default:
              return stage;
          }
        }));

      } catch (err) {
        console.error("Error fetching pipeline data:", err);
        setError("Failed to load pipeline data");
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineData();
  }, [suppliers, contactedSuppliers]);

  if (loading) return <div style={{ padding: '1rem', textAlign: 'center', color: '#5D2A0A' }}>Loading pipeline data...</div>;
  if (error) return <div style={{ padding: '1rem', textAlign: 'center', color: '#D32F2F' }}>{error}</div>;

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