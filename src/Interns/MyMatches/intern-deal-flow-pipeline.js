"use client";

import { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from "../../firebaseConfig";
import { Info } from 'lucide-react';
import styles from "./pipeline.module.css";

// Copied verbatim from InternTable.jsx so status resolution is identical.
const checkApplicationStatus = async (userId, sponsorId) => {
  try {
    const docId = `${sponsorId}_${userId}`;
    const applicationDoc = await getDoc(doc(db, "internshipApplications", docId));

    if (applicationDoc.exists()) {
      const appData = applicationDoc.data();
      const status = appData.status || "Applied";

      // Normalize status - treat both "Applied" and "Requested" as applied
      const normalizedStatus =
        status === "Applied" ? "Applied" : status === "Requested" ? "Requested" : status;

      return { status: normalizedStatus, exists: true, data: appData };
    }
    return { status: "New Match", exists: false, data: null };
  } catch (error) {
    console.warn(`Could not fetch application status for ${sponsorId}_${userId}:`, error);
    return { status: "New Match", exists: false, data: null };
  }
};

// Each entry here corresponds 1:1 to a literal `status` string that can be
// written onto an internshipApplications doc (see `applicationStages` in
// InternTablePage.jsx), plus "New Match" for sponsors the intern hasn't
// applied to / been requested by yet. Keeping these exact strings is what
// makes the counts below match InternTable.jsx row-for-row.
const STAGE_DEFINITIONS = [
  { id: "new_match", name: "New Match", statusMapping: ["New Match"], colorClass: "stageApplication", iconColor: "#795548" },
  { id: "applied", name: "Applied", statusMapping: ["Applied"], colorClass: "stageApplication", iconColor: "#795548" },
  { id: "requested", name: "Requested", statusMapping: ["Requested"], colorClass: "stageApplication", iconColor: "#6d4c41" },
  { id: "matched", name: "Matched", statusMapping: ["Matched"], colorClass: "stageReview", iconColor: "#6d4c41" },
  { id: "shortlisted", name: "Shortlisted", statusMapping: ["Shortlisted"], colorClass: "stageReview", iconColor: "#5d4037" },
  { id: "interviewed", name: "Contacted/Interview", statusMapping: ["Contacted/Interview"], colorClass: "stageApproved", iconColor: "#5d4037" },
  { id: "confirmed", name: "Confirmed", statusMapping: ["Confirmed"], colorClass: "stageFeedback", iconColor: "#4e342e" },
  { id: "confirmed_ts", name: "Confirmed/Term Sheet Sign", statusMapping: ["Confirmed/Term Sheet Sign"], colorClass: "stageFeedback", iconColor: "#4e342e" },
  { id: "accepted", name: "Accepted", statusMapping: ["Accepted"], colorClass: "stageDeals", iconColor: "#3e2723" },
  { id: "contract_signed", name: "Contract Signed", statusMapping: ["Contract Signed"], colorClass: "stageDeals", iconColor: "#2e1b13" },
  { id: "active", name: "Active", statusMapping: ["Active"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
  { id: "completed", name: "Completed", statusMapping: ["Completed"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
  { id: "declined", name: "Declined", statusMapping: ["Declined"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
];

export function InternDealflow() {
  const [stages, setStages] = useState(
    STAGE_DEFINITIONS.map((s) => ({ ...s, count: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    const fetchDealflowData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const internId = user.uid;

        // Same source of truth as InternTable.jsx: iterate every
        // universalProfiles doc (a potential sponsor) and only keep the
        // ones that actually published an internApplications doc.
        const snapshot = await getDocs(collection(db, "universalProfiles"));

        const statusLists = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            try {
              const sponsorId = docSnap.id;
              if (sponsorId === internId) return [];

              const data = docSnap.data();
              if (!data) return [];

              try {
                const appDoc = await getDoc(doc(db, "internApplications", sponsorId));
                if (!appDoc.exists()) return []; // same gate as InternTable.jsx
              } catch {
                return [];
              }

              const formData = data || {};
              const overview = formData.entityOverview || {};
              const programs = formData?.programDetails?.programs || [];
              const matchPrefs = formData.generalMatchingPreference || {};

              const hasRelevantData =
                overview.registeredName ||
                overview.organizationName ||
                programs.length > 0 ||
                Object.keys(matchPrefs).length > 0;

              if (!hasRelevantData) return [];

              // One status lookup per sponsor - the application doc id is
              // `${sponsorId}_${internId}` regardless of which program a
              // row represents, exactly like InternTable.jsx.
              const { status } = await checkApplicationStatus(internId, sponsorId);

              // InternTable.jsx renders one row per program (or 1 row if
              // there are no programs) - mirror that so the counts match.
              const rowCount = programs.length > 0 ? programs.length : 1;
              return Array(rowCount).fill(status);
            } catch {
              return [];
            }
          })
        );

        const allStatuses = statusLists.flat();
        setTotalMatches(allStatuses.length);

        const counts = {};
        STAGE_DEFINITIONS.forEach((stage) => {
          counts[stage.id] = allStatuses.filter((status) =>
            stage.statusMapping.includes(status)
          ).length;
        });

        setStages((current) =>
          current.map((stage) => ({ ...stage, count: counts[stage.id] || 0 }))
        );
      } catch (error) {
        console.error("Error fetching pipeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealflowData();
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