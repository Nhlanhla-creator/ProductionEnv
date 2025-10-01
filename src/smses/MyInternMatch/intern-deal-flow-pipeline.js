"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";
import { Info } from 'lucide-react';
import styles from "./pipeline.module.css";

export function InternDealflowPage({profiles}) {
  const [stages, setStages] = useState([
    {
      id: "requested",
      name: "Requested",
      count: 0,

      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
    },
    {
      id: "matched",
      name: "Matched",
      count: 0,
     
      colorClass: styles.stageApplication,
      iconColor: "#795548",
    },
    {
      id: "shortlisted",
      name: "Shortlisted",
      count: 0,

      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
    },
    {
      id: "interviewed",
      name: "Interviewed",
      count: 0,
    
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
    },
    {
      id: "confirmed",
      name: "Confirmed",
      count: 0,
   
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
    },
    {
      id: "accepted",
      name: "Accepted",
      count: 0,

      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
    },
    {
      id: "contract_signed",
      name: "Contract_signed",
      count: 0,
   
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13",
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
      id: "decline",
      name: "Decline",
      count: 0,
      
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
    },

    
  ]);

  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);
const [count,setCount] = useState(0)
  // Stage mappings for status calculation
  const stageMapping = {
    requested: { statusMapping: ["Requested"] },
    matched: { useProfilesCount: true }, // Use profiles count instead of status mapping
    shortlisted: { statusMapping: ["Shortlisted","Applied"] },
    interviewed: { statusMapping: ["Contacted/Interview",] },
    confirmed: { statusMapping: ["Confirmed"] },
    accepted: { statusMapping: ["Accepted"] },
    contract_signed: { statusMapping: ["Active","Confirmed/Term Sheet Sign"] },
    active: { statusMapping: ["Active"] },
    completed:{ statusMapping: ["Completed"] },
    decline:{ statusMapping: ["Declined"] },
  };

    //   useEffect(() => {
    //   setCount(count)
    // }, [profiles])
  
  console.log(profiles)
   const calculateStageCounts = (applications) => {
    const counts = {};
    
    stages.forEach(stage => {
      const mapping = stageMapping[stage.id];
      if (mapping?.countFromRequests) {
        counts[stage.id] = applications.length > 0 ? applications.length : 0;
      } else if (mapping?.useProfilesCount) {
        // Use profiles count for matched stage
        counts[stage.id] = profiles || 0;
      } else if (mapping?.statusMapping) {
        counts[stage.id] = applications.filter(app => 
          mapping.statusMapping.includes(app.status || "New Match")
        ).length;
      } else {
        counts[stage.id] = 0;
      }
    });

    return counts;
  };

  useEffect(() => {
    const fetchPipelineData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const sponsorId = user.uid;
        
        // Fetch all internship applications for this sponsor
        const q = query(collection(db, "internshipApplications"), where("sponsorId", "==", sponsorId));
        const snapshot = await getDocs(q);
        
        const applications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTotalApplications(applications.length);

        // Calculate counts for each stage
        const stageCounts = calculateStageCounts(applications);

        // Update stages with calculated counts
        setStages(current =>
          current.map(stage => ({
            ...stage,
            count: stageCounts[stage.id] || 0,
          }))
        );

        setLoading(false);

      } catch (error) {
        console.error("Error fetching pipeline data:", error);
        setLoading(false);
      }
    };

    fetchPipelineData();
  }, [profiles]); // Add profiles to dependency array

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