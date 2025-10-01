"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";
import { Info } from 'lucide-react';
import styles from "./pipeline.module.css";

export function ProgramSponsorDealflow() {
  const [stageCounts, setStageCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const stages = [
    {
      id: "matched",
      name: "Matched",
   
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63"
    },
    {
      id: "shortlisted",
      name: "Shortlisted", 
    
      colorClass: styles.stageApplication,
      iconColor: "#795548"
    },
    {
      id: "engaged",
      name: "Engaged",
  
      colorClass: styles.stageReview,
      iconColor: "#6d4c41"
    },
    {
      id: "offered",
      name: "Offered",
    
      colorClass: styles.stageApproved,
      iconColor: "#5d4037"
    },
    {
      id: "active",
      name: "Active",
      
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e"
    },
    {
      id: "completed",
      name: "Completed",
     
      colorClass: styles.stageDeals,
      iconColor: "#3e2723"
    },
    {
      id: "rated",
      name: "Rated",
   
      colorClass: styles.stageWithdrawn,
      iconColor: "#2e1b13"
    }
  ];

  useEffect(() => {
    const fetchPipelineData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all internship applications for this sponsor
        const q = query(
          collection(db, "internshipApplications"),
          where("sponsorId", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        const applications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate counts for each stage based on status
        const counts = {
          matched: applications.filter(app => app.status === "New Match").length,
          shortlisted: applications.filter(app => app.status === "Shortlisted").length,
          engaged: applications.filter(app => app.status === "Contacted/Interview").length,
          offered: applications.filter(app => app.status === "Confirmed").length,
          active: applications.filter(app => app.status === "Active").length,
          completed: applications.filter(app => app.status === "Completed").length,
          rated: applications.filter(app => app.status === "Rated").length,
        };

        setStageCounts(counts);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching pipeline data:", error);
        setLoading(false);
      }
    };

    fetchPipelineData();
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
                  <p className={styles.stageCount}>{stageCounts[stage.id] || 0}</p>
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