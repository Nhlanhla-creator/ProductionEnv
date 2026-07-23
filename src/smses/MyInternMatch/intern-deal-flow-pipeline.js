"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import {
  FileText, Send, Target, ListChecks, Phone, CheckCircle,
  FileCheck, Award, ClipboardCheck, TrendingUp, Trophy, XCircle, Briefcase, Sparkles, ArrowRight,
} from "lucide-react";

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
// (Unchanged from before — icon/terminal added purely for the new visual
// design; statusMapping/id/name are exactly what the counting logic reads.)
const STAGE_DEFINITIONS = [
  { id: "applied", name: "Applied", statusMapping: ["Applied"], icon: FileText },
  { id: "requested", name: "Requested", statusMapping: ["Requested"], icon: Send },
  { id: "matched", name: "Matched", statusMapping: ["Matched"], icon: Target },
  { id: "shortlisted", name: "Shortlisted", statusMapping: ["Shortlisted"], icon: ListChecks },
  { id: "interviewed", name: "Contacted/Interview", statusMapping: ["Contacted/Interview"], icon: Phone },
  { id: "confirmed", name: "Confirmed", statusMapping: ["Confirmed"], icon: CheckCircle },
  { id: "confirmed_ts", name: "Confirmed/Term Sheet Sign", statusMapping: ["Confirmed/Term Sheet Sign"], icon: FileCheck },
  { id: "accepted", name: "Accepted", statusMapping: ["Accepted"], icon: Award },
  { id: "contract_signed", name: "Contract Signed", statusMapping: ["Contract Signed"], icon: ClipboardCheck },
  { id: "active", name: "Active", statusMapping: ["Active"], icon: TrendingUp },
  { id: "completed", name: "Completed", statusMapping: ["Completed"], icon: Trophy },
  { id: "declined", name: "Declined", statusMapping: ["Declined"], icon: XCircle, terminal: true },
];

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

const PipelineSkeleton = () => (
  <div className="flex gap-3 overflow-x-auto pb-4 px-1">
    {[...Array(7)].map((_, i) => (
      <div key={i} className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-2xl flex-shrink-0 animate-pulse" style={{ width: "130px", height: "96px" }}>
        <div className="p-4 flex flex-col h-full justify-between">
          <div className="h-3 w-20 rounded-full bg-[#c8b6a6]/40" />
          <div className="h-7 w-16 rounded-lg bg-[#c8b6a6]/30 mx-auto" />
        </div>
      </div>
    ))}
  </div>
);

export function InternDealflowPage({ profiles }) {
  const [stages, setStages] = useState(STAGE_DEFINITIONS.map((s) => ({ ...s, count: 0 })));
  const [loading, setLoading] = useState(true);
  const [totalApplications, setTotalApplications] = useState(0);
  const [effectiveUserId, setEffectiveUserId] = useState(null);
  const [hoveredStage, setHoveredStage] = useState(null);

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

  const getStagePercentage = useCallback(
    (count) => (totalApplications === 0 ? 0 : ((count / totalApplications) * 100).toFixed(1)),
    [totalApplications]
  );

  const liveStages = useMemo(() => stages.filter((s) => !s.terminal), [stages]);
  const terminalStages = useMemo(() => stages.filter((s) => s.terminal), [stages]);

  // Conversion rate shown on each connector — same "running total from this
  // stage onward" calculation SupportDealFlowPipeline.jsx/
  // AcceleratorFlowPipeline.jsx use.
  const cumulativeCounts = useMemo(() => {
    const sorted = [...liveStages];
    let runningTotal = 0;
    const result = {};
    for (let i = sorted.length - 1; i >= 0; i--) {
      runningTotal += sorted[i].count || 0;
      result[sorted[i].id] = runningTotal;
    }
    return result;
  }, [liveStages]);

  // Same card renderer/visual language as SupportDealFlowPipeline.jsx and
  // AcceleratorFlowPipeline.jsx — dark brown gradient, icon + count +
  // percentage bar, dark grey reserved for the one terminal negative
  // outcome (Declined) as the "different kind of outcome" signal.
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id;
    const percentage = getStagePercentage(stage.count);
    const isNegativeOutcome = stage.terminal;
    const theme = isNegativeOutcome ? { from: "#4b4844", to: "#242220" } : { from: "#4a352f", to: "#241a14" };
    const Icon = stage.icon;

    return (
      <div
        className="relative flex-shrink-0 group transition-all duration-300 hover:scale-[1.02]"
        style={{ width: "104px" }}
        onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
        onMouseLeave={() => setHoveredStage(null)}
      >
        <div
          className={`rounded-xl p-2.5 transition-all duration-300 ${isHovered ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"}`}
          style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`, border: "1.5px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              <Icon size={11} className="text-white" />
            </div>
            <h3 className="font-semibold text-white text-[9px] uppercase tracking-wide leading-tight truncate flex-1">{stage.name}</h3>
          </div>
          <div className="flex items-baseline justify-center">
            <span className="text-lg font-extrabold leading-none text-white">{stage.count}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: "#c9986a" }} />
            </div>
            <span className="text-[8px] font-semibold flex-shrink-0" style={{ color: "#d9c4b0" }}>{percentage}%</span>
          </div>
        </div>

        {isHovered && (
          <PopupPortal>
            <div
              className="fixed z-[1200] pointer-events-none w-[230px] font-sans"
              style={{
                top: hoveredStage.rect.bottom + 10,
                left: Math.min(Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 115, 12), window.innerWidth - 242),
              }}
            >
              <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                <div className="pt-1 border-t border-white/10 flex items-center justify-between mt-1">
                  <span className="text-[#c8b6a6]">{percentage}% of applicants</span>
                  <span className="text-[#a67c52] font-semibold">{stage.count} intern{stage.count === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3]">
        <PipelineSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3]">
      <div className="flex items-center justify-between mb-7 flex-wrap gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
            <Briefcase size={20} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">Dealflow Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">Track intern applicants, stage by stage</p>
          </div>
        </div>
      </div>

      <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent gap-1">
        {liveStages.map((stage, idx) => (
          <div key={stage.id} className="flex items-center">
            {renderStageCard(stage)}
            {idx < liveStages.length - 1 && (() => {
              const nextStage = liveStages[idx + 1];
              const fromCount = cumulativeCounts[stage.id] || 0;
              const toCount = cumulativeCounts[nextStage.id] || 0;
              const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0";
              return (
                <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "30px" }}>
                  <span className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap" title="Share of this stage that reaches the next">{rate}%</span>
                  <div className="flex items-center">
                    <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
                    <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
                  </div>
                </div>
              );
            })()}
          </div>
        ))}

        {terminalStages.length > 0 && (
          <div className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
              <div className="w-px h-10 bg-[#e6d7c3]" />
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl" style={{ border: "2px solid #dc2626" }}>
              {terminalStages.map((stage) => (
                <div key={stage.id} className="flex-shrink-0">{renderStageCard(stage)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InternDealflowPage;