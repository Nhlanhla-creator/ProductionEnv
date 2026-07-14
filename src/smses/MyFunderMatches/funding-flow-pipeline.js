import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import styles from "./DealFlowPipeline.module.css";

// These MUST mirror the labels your FundingTable.js actually writes to
// `pipelineStage` in Firestore (see PIPELINE_STAGES in FundingTable.js).
// Keeping this list in sync with that file is what keeps the counts correct.
const STAGE_DEFINITIONS = [
  {
    id: "initial",
    name: "Matched",
    colorClass: "stageInitial",
    iconColor: "#8d6e63",
    // Not a Firestore value — this is the base pool of matched funders
    // before any application has been sent, fed in via primaryMatchCount.
    matchValues: [],
  },
  {
    id: "applicationSent",
    // Display label only — the underlying Firestore value written by
    // FundingTable.js is still literally "Application Sent", so the
    // matchValues entry below must stay as-is even though the label reads
    // "Contacted".
    name: "Contacted",
    colorClass: "stageApplication",
    iconColor: "#795548",
    matchValues: ["application sent"],
  },
  {
    id: "applicationReceived",
    name: "Application Received",
    colorClass: "stageApplication",
    iconColor: "#6d8c61",
    matchValues: ["application received"],
  },
  {
    id: "review",
    name: "Evaluation",
    colorClass: "stageReview",
    iconColor: "#6d4c41",
    matchValues: ["under review"],
  },
  {
    id: "approved",
    name: "Funding Approved",
    colorClass: "stageApproved",
    iconColor: "#5d4037",
    matchValues: ["funding approved"],
  },
  {
    id: "termsheet",
    name: "Termsheet",
    colorClass: "stageFeedback",
    iconColor: "#4e342e",
    matchValues: ["termsheet"],
  },
  {
    id: "dealComplete",
    name: "Deal Complete",
    colorClass: "stageDeals",
    iconColor: "#3e2723",
    matchValues: ["deal complete"],
  },
  {
    id: "closed",
    name: "Deals Closed",
    colorClass: "stageDeals",
    iconColor: "#2e1b13",
    matchValues: ["closed"],
  },
  {
    id: "declined",
    name: "Declined",
    colorClass: "stageWithdrawn",
    iconColor: "#1e0e09",
    // Table writes both "Deal Declined" and "Declined" depending on the
    // path taken — both mean the same terminal state, so merge them here.
    matchValues: ["deal declined", "declined"],
  },
];

export default function DealFlowPipeline({ primaryMatchCount = 0 }) {
  const [stages, setStages] = useState(
    STAGE_DEFINITIONS.map((s) => ({ ...s, count: 0 }))
  );
  const [totalApplications, setTotalApplications] = useState(0);

  const calculateStageCounts = (applications, primaryMatchCount) => {
    const counts = {};
    STAGE_DEFINITIONS.forEach((s) => {
      counts[s.id] = 0;
    });
    counts.initial = primaryMatchCount;

    applications.forEach((data) => {
      const stage = (data.pipelineStage || "").toLowerCase().trim();
      const matchedDef = STAGE_DEFINITIONS.find((s) =>
        s.matchValues.includes(stage)
      );
      if (matchedDef) {
        counts[matchedDef.id] += 1;
      }
      // If it doesn't match any known value, it's logged below so you can
      // catch new/typo'd pipelineStage strings instead of them silently
      // disappearing from the pipeline.
      else if (stage) {
        console.warn(
          `[DealFlowPipeline] Unrecognized pipelineStage value: "${data.pipelineStage}" — not counted in any bucket.`
        );
      }
    });

    return { counts, totalApplicationsEver: applications.length };
  };

  useEffect(() => {
    const fetchStageCounts = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const snapshot = await getDocs(collection(db, "smeApplications"));
      const userApplications = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.smeId === user.uid) {
          userApplications.push(data);
        }
      });

      const { counts, totalApplicationsEver } = calculateStageCounts(
        userApplications,
        primaryMatchCount
      );
      setTotalApplications(totalApplicationsEver);

      setStages((current) =>
        current.map((stage) => ({
          ...stage,
          count: stage.id === "initial" ? primaryMatchCount : counts[stage.id] || 0,
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
              className={`${styles.pipelineStage} ${styles[stage.colorClass]}`}
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

              <div className={styles.stageTooltip}>{stage.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#8d6e63" }}>
        Total applications submitted: {totalApplications}
      </div>
    </div>
  );
}