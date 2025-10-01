import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import styles from "./DealFlowPipeline.module.css";

export default function DealFlowPipeline({ primaryMatchCount = 0 }) {
  const [stages, setStages] = useState([
    {
      id: "initial",
      name: "Matching",
      count: 0,

      colorClass: styles.stageInitial,
      iconColor: "#8d6e63"
    },
    {
      id: "application",
      name: "Application",
      count: 0,
    
      colorClass: styles.stageApplication,
      iconColor: "#795548"
    },
    {
      id: "review",
      name: "Evaluation",
      count: 0,
     
      colorClass: styles.stageReview,
      iconColor: "#6d4c41"
    },
    {
      id: "diligence",
      name: "Due Diligence",
      count: 0,
 
      colorClass: styles.stageApproved,
      iconColor: "#5d4037"
    },
    {
      id: "approved",
      name: "Decision",
      count: 0,
    
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e"
    },
    {
      id: "feedback",
      name: "Terms Issue",
      count: 0,

      colorClass: styles.stageDeals,
      iconColor: "#3e2723"
    },
    {
      id: "deals",
      name: "Deals Closed",
      count: 0,
     
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13"
    },
    {
      id: "withdrawn",
      name: "Withdrawn/Declined",
      count: 0,

      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09"
    },
  ]);

  const [totalApplications, setTotalApplications] = useState(0);

  const calculateStageCounts = (applications, primaryMatchCount) => {
    const stageCounts = {
      initial: primaryMatchCount,
      application: 0,
      review: 0,
      diligence: 0,
      approved: 0,
      feedback: 0,
      deals: 0,
      withdrawn: 0,
    };

    let totalApplicationsEver = 0;

    applications.forEach(data => {
      totalApplicationsEver += 1;

      const stage = (data.pipelineStage || "").toLowerCase();

      if (stage === "under review") {
        stageCounts.review += 1;
      } else if (stage === "due diligence") {
        stageCounts.diligence += 1;
      } else if (stage === "funding approved") {
        stageCounts.approved += 1;
      } else if (stage === "termsheet") {
        stageCounts.feedback += 1;
      } else if (stage === "deal closed" || stage === "deal successful") {
        stageCounts.deals += 1;
      } else if (stage === "declined" || stage === "withdrawn") {
        stageCounts.withdrawn += 1;
      }
    });

    stageCounts.application = totalApplicationsEver;
    return { stageCounts, totalApplicationsEver };
  };

  useEffect(() => {
    const fetchStageCounts = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const snapshot = await getDocs(collection(db, "smeApplications"));
      const userApplications = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.smeId === user.uid) {
          userApplications.push(data);
        }
      });

      const { stageCounts, totalApplicationsEver } = calculateStageCounts(userApplications, primaryMatchCount);
      setTotalApplications(totalApplicationsEver);

      setStages(current =>
        current.map(stage => ({
          ...stage,
          count: stage.id === "initial" ? primaryMatchCount : stageCounts[stage.id] || 0
        }))
      );
    };

    fetchStageCounts();
  }, [primaryMatchCount]);

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
                  <p className={styles.stageCount}>
                    {stage.id === "application" ? totalApplications : stage.count}
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
    </div>
  );
}