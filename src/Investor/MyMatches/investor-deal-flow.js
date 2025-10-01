"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, ChevronRight, Info, FileText } from "lucide-react";
import styles from "./DealFlowPipeline.module.css";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function InvestorDealFlowPipeline({ onStageClick }) {
  const [hoveredStage, setHoveredStage] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionDetails, setRejectionDetails] = useState({});
  const [stageCounts, setStageCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStageCounts = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const counts = {
      initial: 0,        // Total SMEs
      application: 0,    // Applications received
      review: 0,         // Under Review
      approved: 0,       // Funding approved
      feedback: 0,       // Deals Initiated
      deals: 0,          // Deals Closed
      withdrawn: 0       // Declined / Deal Declined
    };

    try {
      // 1. Count all SMEs in universalProfiles
      const smeSnapshot = await getDocs(collection(db, "universalProfiles"));
      counts.initial = smeSnapshot.size;

      // 2. Get all investorApplications for the current investor
      const appQuery = query(collection(db, "investorApplications"), where("funderId", "==", user.uid));
      const appSnapshot = await getDocs(appQuery);

      counts.application = appSnapshot.size;

      appSnapshot.forEach((doc) => {
        const pipelineStage = doc.data().pipelineStage?.toLowerCase();

        if (pipelineStage === "under review") counts.review++;
        if (pipelineStage === "funding approved") counts.approved++;
        if (pipelineStage === "deals initiated") counts.feedback++;
        if (pipelineStage === "deals closed") counts.deals++;
        if (pipelineStage === "declined" || pipelineStage === "deal declined") counts.withdrawn++;
      });

      setStageCounts(counts);
    } catch (err) {
      console.error("Error fetching deal flow counts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStageCounts();
  }, []);

  const stages = [
    {
      id: "initial",
      name: "Matching",

      colorClass: styles.stageInitial,
      iconColor: "#8d6e63"
    },
    {
      id: "application",
      name: "Applications",
     
      colorClass: styles.stageApplication,
      iconColor: "#795548"
    },
    {
      id: "review",
      name: "Under Review",

      colorClass: styles.stageReview,
      iconColor: "#6d4c41"
    },
    {
      id: "approved",
      name: "Funding Approved",
    
      colorClass: styles.stageApproved,
      iconColor: "#5d4037"
    },
    {
      id: "feedback",
      name: "Deals Initiated",

      hasMessages: true,
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e"
    },
    {
      id: "deals",
      name: "Deals Closed",

      colorClass: styles.stageDeals,
      iconColor: "#3e2723"
    },
    {
      id: "withdrawn",
      name: "Withdrawn/Declined",
   
      showRejectionInfo: true,
      colorClass: styles.stageWithdrawn,
      iconColor: "#2e1b13"
    },
  ];

  const handleStageClick = async (stage) => {
    if (!stage || !stage.id) return;

    // Trigger the filtering
    if (onStageClick) {
      onStageClick(stage.id === "all" ? null : stage.id);
    }

    // Handle rejection modal
    if (stage.id === "withdrawn" && stage.showRejectionInfo) {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) return;

      const q = query(
        collection(db, "investorApplications"),
        where("funderId", "==", user.uid),
        where("status", "==", "Declined")
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const app = snapshot.docs[0].data();
        setRejectionDetails({
          funder: app.funderName || "Unknown Funder",
          date: new Date(app.updatedAt).toLocaleDateString(),
          reason: app.responseMessage || "No reason provided.",
          appId: snapshot.docs[0].id,
        });
        setShowRejectionModal(true);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#5D2A0A' }}>
        Loading pipeline data...
      </div>
    );
  }

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
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
              onClick={() => handleStageClick(stage)}
            >
              <div className={styles.stageCard}>
                <div className={styles.stageContent}>
                  <div className={styles.stageHeader}>
                    <h3 className={styles.stageName}>{stage.name}</h3>
                    <div
                      className={styles.stageIcon}
                      style={{ color: stage.iconColor }}
                    >
                      <Info size={14} />
                    </div>
                  </div>
                  <p className={styles.stageCount}>
                    {loading ? "..." : stageCounts[stage.id] || 0}
                  </p>
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

      {showRejectionModal && (
        <div
          className={styles.pipelineModalOverlay}
          onClick={() => setShowRejectionModal(false)}
        >
          <div
            className={styles.pipelineModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Application Status</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowRejectionModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.statusIndicator}>
                <div
                  className={styles.statusDot}
                  style={{ backgroundColor: "#5d4037" }}
                ></div>
                <span className={styles.statusText}>Declined</span>
              </div>

              <div className={styles.rejectionContent}>
                <h4 className={styles.rejectionTitle}>Reason for Decline:</h4>
                <p className={styles.rejectionReason}>{rejectionDetails.reason}</p>
              </div>

              <div className={styles.detailsSection}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Funder:</span>
                  <span className={styles.detailValue}>{rejectionDetails.funder}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>{rejectionDetails.date}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Application ID:</span>
                  <span className={styles.detailValue}>{rejectionDetails.appId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}