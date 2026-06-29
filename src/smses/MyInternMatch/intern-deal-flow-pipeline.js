"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";
import { Info } from 'lucide-react';
import styles from "./pipeline.module.css";

export function InternDealflowPage({ profiles }) {
  const [stages, setStages] = useState([
    {
      id: "applied",
      name: "Applied",
      count: 0,
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
    },
    {
      id: "requested",
      name: "Requested",
      count: 0,
      colorClass: styles.stageApplication,
      iconColor: "#795548",
    },
    {
      id: "matched",
      name: "Matched",
      count: 0,
      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
    },
    {
      id: "shortlisted",
      name: "Shortlisted",
      count: 0,
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
    },
    {
      id: "interviewed",
      name: "Interviewed",
      count: 0,
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
    },
    {
      id: "confirmed",
      name: "Confirmed",
      count: 0,
      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
    },
    {
      id: "accepted",
      name: "Accepted",
      count: 0,
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13",
    },
    {
      id: "contract_signed",
      name: "Contract Signed",
      count: 0,
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    },
    {
      id: "active",
      name: "Active",
      count: 0,
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    },
    {
      id: "completed",
      name: "Completed",
      count: 0,
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    },
    {
      id: "declined",
      name: "Declined",
      count: 0,
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);

  // Stage mappings that align with the table's actual status values
  const stageMapping = {
    applied: { statusMapping: ["Applied"] },
    requested: { statusMapping: ["Requested"] },
    matched: { statusMapping: ["Matched"] },
    shortlisted: { statusMapping: ["Shortlisted"] },
    interviewed: { statusMapping: ["Contacted/Interview", "Interviewed"] },
    confirmed: { statusMapping: ["Confirmed", "Confirmed/Term Sheet Sign"] },
    accepted: { statusMapping: ["Accepted"] },
    contract_signed: { statusMapping: ["Contract Signed", "Contract_signed"] },
    active: { statusMapping: ["Active"] },
    completed: { statusMapping: ["Completed"] },
    declined: { statusMapping: ["Declined", "Decline"] },
  };

  const calculateStageCounts = (applications) => {
    const counts = {};

    stages.forEach(stage => {
      const mapping = stageMapping[stage.id];
      
      if (mapping?.statusMapping) {
        // Count applications that match the status mapping
        counts[stage.id] = applications.filter(app => {
          // Check both status and pipelineStage fields
          const appStatus = app.status || app.pipelineStage || "";
          return mapping.statusMapping.includes(appStatus);
        }).length;
      } else {
        counts[stage.id] = 0;
      }
    });

    return counts;
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const sponsorId = user.uid;
    
    // Query applications where this user is the sponsor
    const applicationsQuery = query(
      collection(db, "internshipApplications"), 
      where("sponsorId", "==", sponsorId)
    );

    const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
      const applications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTotalApplications(applications.length);
      
      const stageCounts = calculateStageCounts(applications);
      
      setStages(current =>
        current.map(stage => ({
          ...stage,
          count: stageCounts[stage.id] || 0,
        }))
      );
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pipeline data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
  );
}