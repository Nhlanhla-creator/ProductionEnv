"use client"; 

import { useState, useEffect } from "react";
import { MessageCircle, X, ChevronRight, Info, FileText } from "lucide-react";
import styles from "./DealFlowPipeline.module.css";
import { db } from "../../firebaseConfig";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default function InvestorDealFlowPipeline({ onStageClick }) {
  const [hoveredStage, setHoveredStage] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionDetails, setRejectionDetails] = useState({});
  const [stageCounts, setStageCounts] = useState({});
  const [loading, setLoading] = useState(true);

  // Add the calculateHybridScore function
  const calculateHybridScore = (investorProfile, smeProfile) => {
    if (!investorProfile || !smeProfile) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. Sector Match (30% weight)
    const investorSectors = Array.isArray(investorProfile.generalInvestmentPreference?.sectorFocus)
      ? investorProfile.generalInvestmentPreference.sectorFocus.map(s => s?.toLowerCase().trim())
      : [];
    
    const smeSectors = Array.isArray(smeProfile.entityOverview?.economicSectors)
      ? smeProfile.entityOverview.economicSectors.map(s => s?.toLowerCase().trim())
      : [];

    const sectorMatch = investorSectors.some(invSector => 
      smeSectors.some(smeSector => smeSector.includes(invSector) || invSector.includes(smeSector))
    ) ? 30 : 0;

    totalScore += sectorMatch;
    maxPossibleScore += 30;

    // 2. Stage Match (25% weight)
    const investorStages = Array.isArray(investorProfile.generalInvestmentPreference?.investmentStage)
      ? investorProfile.generalInvestmentPreference.investmentStage.map(s => s?.toLowerCase().trim())
      : [];
    
    const smeStage = smeProfile.applicationOverview?.fundingStage?.toLowerCase().trim() || '';

    const stageMatch = investorStages.some(invStage => 
      smeStage.includes(invStage) || invStage.includes(smeStage)
    ) ? 25 : 0;

    totalScore += stageMatch;
    maxPossibleScore += 25;

    // 3. Ticket Size Match (25% weight)
    const investorMinTicket = parseFloat(
      investorProfile.fundDetails?.funds?.[0]?.minimumTicket?.replace(/[^\d.]/g, '') || 0
    );
    const investorMaxTicket = parseFloat(
      investorProfile.fundDetails?.funds?.[0]?.maximumTicket?.replace(/[^\d.]/g, '') || Infinity
    );
    
    const smeAmount = parseFloat(
      smeProfile.useOfFunds?.amountRequested?.replace(/[^\d.]/g, '') || 0
    );

    let ticketScore = 0;
    if (smeAmount >= investorMinTicket && smeAmount <= investorMaxTicket) {
      ticketScore = 25;
    } else if (investorMinTicket > 0 && investorMaxTicket < Infinity) {
      // Partial score based on proximity to range
      const range = investorMaxTicket - investorMinTicket;
      const distance = smeAmount < investorMinTicket 
        ? investorMinTicket - smeAmount 
        : smeAmount - investorMaxTicket;
      const penalty = Math.min((distance / range) * 25, 25);
      ticketScore = Math.max(0, 25 - penalty);
    }

    totalScore += ticketScore;
    maxPossibleScore += 25;

    // 4. Instrument Match (20% weight)
    const investorInstruments = Array.isArray(investorProfile.generalInvestmentPreference?.investmentFocusSubtype)
      ? investorProfile.generalInvestmentPreference.investmentFocusSubtype.map(i => i?.toLowerCase().trim())
      : [];
    
    const smeInstruments = Array.isArray(smeProfile.useOfFunds?.fundingInstruments)
      ? smeProfile.useOfFunds.fundingInstruments.map(i => i?.toLowerCase().trim())
      : [];

    const instrumentMatch = investorInstruments.some(invInstrument => 
      smeInstruments.some(smeInstrument => smeInstrument.includes(invInstrument) || invInstrument.includes(smeInstrument))
    ) ? 20 : 0;

    totalScore += instrumentMatch;
    maxPossibleScore += 20;

    // Calculate final percentage
    const finalScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    return Math.round(finalScore);
  };

  const fetchStageCounts = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const counts = {
      initial: 0,        // High matches (>50%)
      application: 0,    // Applications received
      review: 0,         // Under Review
      approved: 0,  
      diligence: 0,     // Funding approved
      feedback: 0,       // Deals Initiated
      deals: 0,          // Deals Closed
      withdrawn: 0       // Declined / Deal Declined
    };

     try {
      // 1. Get investor profile first
      const investorProfileRef = doc(db, "MyuniversalProfiles", user.uid);
      const investorProfileSnap = await getDoc(investorProfileRef);
      const investorProfile = investorProfileSnap.exists() ? investorProfileSnap.data().formData : null;

      // 2. Count all SMEs in universalProfiles and calculate matches
      const smeSnapshot = await getDocs(collection(db, "universalProfiles"));
      
      if (investorProfile) {
        // Calculate matches for each SME
        let highMatchCount = 0;
        
        for (const smeDoc of smeSnapshot.docs) {
          const smeProfile = smeDoc.data();
          const matchScore = calculateHybridScore(investorProfile, smeProfile);
          
          if (matchScore > 50) {
            highMatchCount++;
          }
        }
        
        counts.initial = highMatchCount;
      } else {
        counts.initial = 0;
      }

      // 3. Get all investorApplications for the current investor
      const appQuery = query(collection(db, "investorApplications"), where("funderId", "==", user.uid));
      const appSnapshot = await getDocs(appQuery);

      counts.application = appSnapshot.size;

      appSnapshot.forEach((doc) => {
        const data = doc.data();
        const pipelineStage = data.pipelineStage?.toLowerCase();
        const status = data.status?.toLowerCase();

        console.log(`App ${doc.id}:`, { 
          pipelineStage, 
          status,
          stage: data.stage,
          nextStage: data.nextStage 
        });

        // Count based on pipelineStage first, then fall back to status/stage
        if (pipelineStage === "under review") counts.review++;
        else if (pipelineStage === "due diligence" || pipelineStage === "Due Diligence") counts.diligence++;
        else if (pipelineStage === "funding approved" || pipelineStage === "approved") counts.approved++;
        else if (pipelineStage === "termsheet" || pipelineStage === "term sheet" || pipelineStage === "terms issue") counts.feedback++;
        else if (pipelineStage === "deal complete" || pipelineStage === "deals closed" || pipelineStage === "Deal Complete") counts.deals++;
        else if (pipelineStage === "declined" || pipelineStage === "deal declined") counts.withdrawn++;
        
        // Fallback: check status and stage fields if pipelineStage is not set
        else if (status === "under review") counts.review++;
        else if (status === "due diligence") counts.diligence++;
        else if (status === "approved" || data.stage === "Funding Approved") counts.approved++;
        else if (data.stage === "Termsheet" || data.nextStage === "Termsheet") counts.feedback++;
        else if (status === "declined" || data.stage === "Deal Declined") counts.withdrawn++;
      });

      // Debug log to see what's being counted
      console.log("Stage counts:", counts);
      console.log("Total applications:", appSnapshot.size);

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
      name: "Matches",
      count: 0,
      description: "SMEs with >50% match score based on your investment criteria",
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63"
    },
    {
      id: "application",
      name: "Application",
      count: 0,
      description: "Applications received from SMEs",
      colorClass: styles.stageApplication,
      iconColor: "#795548"
    },
    {
      id: "review",
      name: "Evaluation",
      count: 0,
      description: "Applications under review",
      colorClass: styles.stageReview,
      iconColor: "#6d4c41"
    },
    {
      id: "diligence",
      name: "Due Diligence",
      count: 0,
      description: "Applications in due diligence phase",
      colorClass: styles.stageApproved,
      iconColor: "#5d4037"
    },
    {
      id: "approved",
      name: "Decision",
      count: 0,
      description: "Funding decisions made",
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e"
    },
    {
      id: "feedback",
      name: "Terms Issue",
      count: 0,
      description: "Termsheets issued to SMEs",
      colorClass: styles.stageDeals,
      iconColor: "#3e2723"
    },
    {
      id: "deals",
      name: "Deals Closed",
      count: 0,
      description: "Successfully closed deals",
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13"
    },
    {
      id: "withdrawn",
      name: "Withdrawn/Declined",
      count: 0,
      description: "Declined or withdrawn applications",
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09"
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
              {hoveredStage === stage.id && (
                <div className={styles.stageTooltip}>
                  {stage.description}
                </div>
              )}
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