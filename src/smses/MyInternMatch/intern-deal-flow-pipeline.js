"use client";

import { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { Info } from "lucide-react";
import styles from "./pipeline.module.css";

// Same "is this row basically empty" check InternTablePage.jsx uses to hide rows.
const hasTooManyMissingFields = (intern) => {
  const fieldsToCheck = [
    intern.internName,
    intern.location,
    intern.institution,
    intern.degree,
    intern.field,
    intern.locationFlexibility,
    intern.role,
    intern.sponsorName,
    intern.fundingProgramType,
    intern.startDate,
    intern.matchPercentage?.toString(),
    intern.bigScore?.toString(),
  ];

  const missingCount = fieldsToCheck.filter((field) => {
    if (field === null || field === undefined) return true;
    const stringField = field.toString().trim();
    return (
      stringField === "" ||
      stringField === "-" ||
      stringField === "Not specified" ||
      stringField === "Various" ||
      stringField === "unspecified" ||
      stringField === "Unknown" ||
      stringField === "N/A" ||
      stringField === "Not Provided" ||
      stringField === "0" ||
      stringField.toLowerCase() === "null" ||
      stringField.toLowerCase().includes("not specified") ||
      stringField.toLowerCase().includes("unspecified") ||
      stringField.toLowerCase().includes("tbd") ||
      stringField.toLowerCase().includes("anonymous")
    );
  }).length;

  return missingCount > 4;
};

// One bucket per literal `status` string InternTablePage.jsx can produce or
// store (see its `applicationStages` dropdown + the "Matched" default for
// unapplied profiles), so a count here maps 1:1 to a status badge in the table.
const STAGE_DEFINITIONS = [
  { id: "applied", name: "Applied", statusMapping: ["Applied"], colorClass: "stageInitial", iconColor: "#8d6e63" },
  { id: "requested", name: "Requested", statusMapping: ["Requested"], colorClass: "stageApplication", iconColor: "#795548" },
  { id: "matched", name: "Matched", statusMapping: ["Matched"], colorClass: "stageReview", iconColor: "#6d4c41" },
  { id: "shortlisted", name: "Shortlisted", statusMapping: ["Shortlisted"], colorClass: "stageApproved", iconColor: "#5d4037" },
  { id: "interviewed", name: "Contacted/Interview", statusMapping: ["Contacted/Interview"], colorClass: "stageFeedback", iconColor: "#4e342e" },
  { id: "confirmed", name: "Confirmed", statusMapping: ["Confirmed"], colorClass: "stageDeals", iconColor: "#3e2723" },
  { id: "confirmed_ts", name: "Confirmed/Term Sheet Sign", statusMapping: ["Confirmed/Term Sheet Sign"], colorClass: "stageDeals", iconColor: "#3e2723" },
  { id: "accepted", name: "Accepted", statusMapping: ["Accepted"], colorClass: "stageDeals", iconColor: "#2e1b13" },
  { id: "contract_signed", name: "Contract Signed", statusMapping: ["Contract Signed"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
  { id: "active", name: "Active", statusMapping: ["Active"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
  { id: "completed", name: "Completed", statusMapping: ["Completed"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
  { id: "declined", name: "Declined", statusMapping: ["Declined"], colorClass: "stageWithdrawn", iconColor: "#1e0e09" },
];

export function InternDealflowPage({ profiles }) {
  const [stages, setStages] = useState(STAGE_DEFINITIONS.map((s) => ({ ...s, count: 0 })));
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);
  const [effectiveUserId, setEffectiveUserId] = useState(null);

  // Same company-membership resolution as InternTablePage.jsx, so a company
  // member sees the same "effective sponsor" numbers the table shows them.
  useEffect(() => {
    const checkCompanyMembership = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userCompanyId = userData.companyId;

          if (userCompanyId) {
            const companyDocSnap = await getDoc(doc(db, "companies", userCompanyId));
            if (companyDocSnap.exists()) {
              const ownerId = companyDocSnap.data().createdBy;
              setEffectiveUserId(ownerId === user.uid ? user.uid : ownerId);
              return;
            }
          }
          setEffectiveUserId(user.uid);
        } else {
          setEffectiveUserId(user.uid);
        }
      } catch (error) {
        console.error("Error checking company membership:", error);
        setEffectiveUserId(user.uid);
      }
    };

    checkCompanyMembership();
  }, []);

  useEffect(() => {
    const fetchPipelineData = async () => {
      if (!effectiveUserId) return;
      setLoading(true);

      try {
        const smeUserId = effectiveUserId;

        // --- Bucket 1: real applications, identical query to InternTablePage.jsx ---
        const applicationsQuery = query(
          collection(db, "internshipApplications"),
          where("sponsorId", "==", smeUserId)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const appliedInternIds = new Set();

        const applicationInterns = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            try {
              const applicationData = applicationDoc.data();
              const internId = applicationData.applicantId;
              if (!internId) return null;
              appliedInternIds.add(internId);

              let profileData = { formData: {} };
              try {
                const internProfileSnap = await getDoc(doc(db, "internProfiles", internId));
                if (internProfileSnap.exists()) profileData = internProfileSnap.data();
              } catch (profileError) {
                console.error(`Failed to fetch profile for intern ${internId}:`, profileError);
              }

              const formData = profileData.formData || {};
              const personalOverview = formData.personalOverview || {};
              const educationalBackground = formData.educationalBackground || {};
              const skillsInterests = formData.skillsInterests || {};

              let bigScore = applicationData.bigScore || applicationData.bigInternScore || 0;
              try {
                const evalDoc = await getDoc(doc(db, "internEvaluations", internId));
                if (evalDoc.exists()) {
                  const evalScores = evalDoc.data().scores || {};
                  bigScore = evalScores.bigInternScore ?? bigScore;
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError);
              }

              const matchPercentage =
                applicationData.matchPercentage || applicationData.matchAnalysis?.overallScore || 0;

              return {
                internId,
                internName:
                  applicationData.applicantName ||
                  applicationData.internName ||
                  `${personalOverview.firstName || ""} ${personalOverview.lastName || ""}`.trim() ||
                  "Unnamed Intern",
                location:
                  applicationData.location || personalOverview.province || personalOverview.city || "Not specified",
                institution: applicationData.institution || educationalBackground.institution || "Not specified",
                degree:
                  applicationData.degree ||
                  educationalBackground.qualification ||
                  educationalBackground.degree ||
                  "Not specified",
                field:
                  applicationData.field ||
                  educationalBackground.fieldOfStudy ||
                  skillsInterests.industryInterests?.[0] ||
                  "Not specified",
                role: applicationData.role || skillsInterests.careerGoals || "Not specified",
                sponsorName: formData.programAffiliation?.sponsorName || "Not specified",
                fundingProgramType:
                  applicationData.funding || formData.programAffiliation?.fundingType || "Not specified",
                startDate: applicationData.startDate || skillsInterests.availabilityStart || "Not specified",
                bigScore,
                matchPercentage,
                status: applicationData.status || "Applied", // <-- same default as the table
                locationFlexibility:
                  applicationData.locationFlexibility &&
                  applicationData.locationFlexibility[0] &&
                  applicationData.locationFlexibility[0] !== "N"
                    ? applicationData.locationFlexibility[0]
                    : skillsInterests.locationPreference && skillsInterests.locationPreference !== "N"
                    ? skillsInterests.locationPreference
                    : "Not specified",
              };
            } catch {
              return null;
            }
          })
        );

        // --- Bucket 2: unapplied profiles, shown by the table as "Matched" ---
        const profilesSnapshot = await getDocs(collection(db, "internProfiles"));

        const profileInterns = await Promise.all(
          profilesSnapshot.docs.map(async (docSnap) => {
            try {
              const internId = docSnap.id;
              if (appliedInternIds.has(internId) || internId === smeUserId) return null;

              const data = docSnap.data();
              if (!data) return null;

              const fd = data.formData || {};
              const personalOverview = fd.personalOverview || {};
              const academicOverview = fd.academicOverview || {};
              const skillsInterests = fd.skillsInterests || {};
              const programAffiliation = fd.programAffiliation || {};

              const hasRelevantData =
                personalOverview.fullName ||
                personalOverview.firstName ||
                academicOverview.institution ||
                (skillsInterests && Object.keys(skillsInterests).length > 0);

              if (!hasRelevantData) return null;

              let bigScore = data.bigInternScore || 0;
              try {
                const evalDoc = await getDoc(doc(db, "internEvaluations", internId));
                if (evalDoc.exists()) {
                  const evalScores = evalDoc.data().scores || {};
                  bigScore = evalScores.bigInternScore ?? bigScore;
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError);
              }

              return {
                internId,
                internName:
                  personalOverview.fullName ||
                  `${personalOverview.firstName || ""} ${personalOverview.lastName || ""}`.trim() ||
                  "Unnamed Intern",
                location:
                  Array.isArray(personalOverview.provinces) && personalOverview.provinces.length
                    ? personalOverview.provinces.join(", ")
                    : Array.isArray(personalOverview.cities) && personalOverview.cities.length
                    ? personalOverview.cities.join(", ")
                    : "Not specified",
                institution: academicOverview.institution || "Not specified",
                degree: academicOverview.degree || academicOverview.qualificationLevel || "Not specified",
                field:
                  academicOverview.fieldOfStudy ||
                  (Array.isArray(skillsInterests.industryInterests) && skillsInterests.industryInterests[0]) ||
                  "Not specified",
                role:
                  Array.isArray(skillsInterests.technicalSkills) && skillsInterests.technicalSkills.length
                    ? skillsInterests.technicalSkills.join(", ")
                    : "Not specified",
                sponsorName: programAffiliation.sponsorName || "Not specified",
                fundingProgramType: programAffiliation.fundingStatus || "Not specified",
                startDate: skillsInterests.availabilityStart || "Not specified",
                bigScore,
                matchPercentage: data.matchPercentage ?? 0,
                status: "Matched", // <-- same hardcoded value the table uses
                locationFlexibility:
                  Array.isArray(academicOverview.locationFlexibility) &&
                  academicOverview.locationFlexibility.length > 0 &&
                  academicOverview.locationFlexibility[0] !== "N"
                    ? academicOverview.locationFlexibility.join(", ")
                    : "Not specified",
              };
            } catch {
              return null;
            }
          })
        );

        // --- Same self-exclusion + "too many missing fields" filter as the table ---
        const user = auth.currentUser;
        const allInterns = [...applicationInterns, ...profileInterns]
          .filter(Boolean)
          .filter((intern) => {
            if ((user && intern.internId === user.uid) || intern.internId === effectiveUserId) return false;
            if (hasTooManyMissingFields(intern)) return false;
            return true;
          });

        setTotalApplications(allInterns.length);

        const counts = {};
        STAGE_DEFINITIONS.forEach((stage) => {
          counts[stage.id] = allInterns.filter((intern) => stage.statusMapping.includes(intern.status)).length;
        });

        setStages((current) => current.map((stage) => ({ ...stage, count: counts[stage.id] || 0 })));
      } catch (error) {
        console.error("Error fetching pipeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineData();
  }, [effectiveUserId]);

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#5D2A0A" }}>
        Loading pipeline data...
      </div>
    );
  }

  return (
    <div className={styles.dealflowPipelineContainer}>
      <div className={styles.pipelineHeader}></div>
      <div className={styles.pipelineStagesContainer}>
        <div className={styles.pipelineConnectionLine}></div>
        <div className={styles.pipelineStagesRow}>
          {stages.map((stage) => (
            <div key={stage.id} className={`${styles.pipelineStage} ${styles[stage.colorClass]}`}>
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
    </div>
  );
}