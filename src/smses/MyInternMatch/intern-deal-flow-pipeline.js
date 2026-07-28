"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../../firebaseConfig"
import {
  FileText,
  Send,
  Target,
  ListChecks,
  Phone,
  CheckCircle,
  FileCheck,
  Award,
  ClipboardCheck,
  TrendingUp,
  Trophy,
  XCircle,
  Briefcase,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react"

/* Requires one change in intern-table.jsx:
     -const calculateMatchScoreForSponsor = (smeData, internProfileData) => {
     +export const calculateMatchScoreForSponsor = (smeData, internProfileData) => {
   Duplicating that function is what made the two components disagree in the
   first place, so it gets imported rather than copied. */
import { calculateMatchScoreForSponsor } from "./intern-table"

/* ────────────────────────────────────────────────────────────────────────────
   Row-emptiness rule. Exported so intern-table.jsx can import it instead of
   keeping its own copy — two copies is how the counts drifted apart.
   ──────────────────────────────────────────────────────────────────────── */
export const hasTooManyMissingFields = (intern) => {
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
  ]

  const missingCount = fieldsToCheck.filter((field) => {
    if (field === null || field === undefined) return true
    const stringField = field.toString().trim()
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
    )
  }).length

  return missingCount > 4
}

/* ────────────────────────────────────────────────────────────────────────────
   Stage definitions.

   `level` is the funnel depth, not the array index. Stages sharing a level are
   parallel routes to the same place and render side by side with no arrow
   between them — Requested (SME asked the candidate) and Applied (candidate
   applied) are two ways into the same conversation, not sequential steps.

   `statusMapping` now carries every literal string that can reach the table,
   including the legacy aliases intern-table.jsx's STATUS_TO_PIPELINE_MAP
   already tolerates. Anything unmapped would vanish from every card while
   still counting toward the total, so the percentages would never reach 100.
   ──────────────────────────────────────────────────────────────────────── */
const STAGE_DEFINITIONS = [
  { id: "matched", name: "Matched", level: 0, statusMapping: ["Matched"], icon: Target },
  { id: "shortlisted", name: "Shortlisted", level: 1, statusMapping: ["Shortlisted"], icon: ListChecks },
  { id: "requested", name: "Requested", level: 2, statusMapping: ["Requested"], icon: Send },
  { id: "applied", name: "Applied", level: 2, statusMapping: ["Applied"], icon: FileText },
  {
    id: "interviewed",
    name: "Contacted/Interview",
    level: 3,
    statusMapping: ["Contacted/Interview", "Interviewed"],
    icon: Phone,
  },
  { id: "confirmed", name: "Confirmed", level: 4, statusMapping: ["Confirmed"], icon: CheckCircle },
  {
    id: "confirmed_ts",
    name: "Term Sheet Signed",
    level: 4,
    statusMapping: ["Confirmed/Term Sheet Sign"],
    icon: FileCheck,
  },
  { id: "accepted", name: "Accepted", level: 5, statusMapping: ["Accepted"], icon: Award },
  {
    id: "contract_signed",
    name: "Contract Signed",
    level: 6,
    statusMapping: ["Contract Signed", "Contract_signed"],
    icon: ClipboardCheck,
  },
  { id: "active", name: "Active", level: 7, statusMapping: ["Active"], icon: TrendingUp },
  { id: "completed", name: "Completed", level: 8, statusMapping: ["Completed"], icon: Trophy },
  {
    id: "declined",
    name: "Declined",
    level: null,
    statusMapping: ["Declined", "Decline"],
    icon: XCircle,
    terminal: true,
  },
]

const ALL_MAPPED_STATUSES = new Set(STAGE_DEFINITIONS.flatMap((s) => s.statusMapping))

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

const PipelineSkeleton = () => (
  <div className="flex gap-2 overflow-x-auto pb-4 px-1">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-xl flex-shrink-0 animate-pulse"
        style={{ width: "104px", height: "84px" }}
      >
        <div className="p-2.5 flex flex-col h-full justify-between">
          <div className="h-2.5 w-16 rounded-full bg-[#c8b6a6]/40" />
          <div className="h-5 w-10 rounded bg-[#c8b6a6]/30 mx-auto" />
          <div className="h-1.5 w-full rounded-full bg-[#c8b6a6]/30" />
        </div>
      </div>
    ))}
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   InternDealflowPage

   Props:
     interns        optional. If the parent already fetched the rows (it does,
                    for the table), pass them and the component does zero
                    Firestore reads. Without it, it self-fetches — which means
                    a second full scan of internProfiles on every page view.
     onStageSelect  optional. Called with the status name when a card is
                    clicked, so it can drive InternTablePage's stageFilter.
                    Clicking the active card again clears it.
     activeStage    optional. The currently filtered status name.
   ════════════════════════════════════════════════════════════════════════════ */
export function InternDealflowPage({ interns: internsProp, onStageSelect, activeStage }) {
  const [stages, setStages] = useState(STAGE_DEFINITIONS.map((s) => ({ ...s, count: 0 })))
  const [loading, setLoading] = useState(true)
  const [totalApplications, setTotalApplications] = useState(0)
  const [unmappedCount, setUnmappedCount] = useState(0)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [hoveredStage, setHoveredStage] = useState(null)

  const usingProvidedRows = Array.isArray(internsProp)

  /* ─── Auth. Wrapped in onAuthStateChanged so a cold load doesn't read
     auth.currentUser before Firebase has restored the session — that left
     loading stuck at true and the skeleton on screen forever. ──────────── */
  useEffect(() => {
    if (usingProvidedRows) return undefined

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEffectiveUserId(null)
        setAuthResolved(true)
        setLoading(false)
        return
      }

      try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid))
        if (userDocSnap.exists()) {
          const userCompanyId = userDocSnap.data().companyId
          if (userCompanyId) {
            const companyDocSnap = await getDoc(doc(db, "companies", userCompanyId))
            if (companyDocSnap.exists()) {
              const ownerId = companyDocSnap.data().createdBy
              setEffectiveUserId(ownerId || user.uid)
              setAuthResolved(true)
              return
            }
          }
        }
        setEffectiveUserId(user.uid)
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
      } finally {
        setAuthResolved(true)
      }
    })

    return () => unsubscribe()
  }, [usingProvidedRows])

  /* ─── Counting. One function, whether the rows came from the prop or from
     our own fetch, so there is only one place the numbers are decided. ─── */
  const countRows = useCallback((rows) => {
    const counts = {}
    STAGE_DEFINITIONS.forEach((stage) => {
      counts[stage.id] = rows.filter((intern) => stage.statusMapping.includes(intern.status)).length
    })

    // Anything the table can show but no card claims. If this is ever above
    // zero the percentages won't reach 100 and a status needs adding above.
    const unmapped = rows.filter((intern) => !ALL_MAPPED_STATUSES.has(intern.status)).length
    if (unmapped > 0) {
      console.warn(
        "[InternDealflowPage] statuses with no pipeline card:",
        [...new Set(rows.filter((i) => !ALL_MAPPED_STATUSES.has(i.status)).map((i) => i.status))],
      )
    }

    setTotalApplications(rows.length)
    setUnmappedCount(unmapped)
    setStages((current) => current.map((stage) => ({ ...stage, count: counts[stage.id] || 0 })))
  }, [])

  /* ─── Path A: rows handed down. No reads. ─────────────────────────────── */
  useEffect(() => {
    if (!usingProvidedRows) return
    countRows(internsProp)
    setLoading(false)
  }, [usingProvidedRows, internsProp, countRows])

  /* ─── Path B: self-fetch. Row derivation matches intern-table.jsx field for
     field — the old version skipped the match-score calculation and the
     experienceTrackRecord role fallback, which pushed extra rows over the
     missing-field threshold and made Matched read lower than the table. ── */
  useEffect(() => {
    if (usingProvidedRows) return
    if (!authResolved) return
    if (!effectiveUserId) {
      setLoading(false)
      return
    }

    const fetchPipelineData = async () => {
      setLoading(true)

      try {
        const smeUserId = effectiveUserId
        const smeUserDoc = await getDoc(doc(db, "universalProfiles", smeUserId))
        const smeUserData = smeUserDoc.exists() ? smeUserDoc.data() : {}

        const applicationsSnapshot = await getDocs(
          query(collection(db, "internshipApplications"), where("sponsorId", "==", smeUserId)),
        )
        const appliedInternIds = new Set()

        const applicationInterns = await Promise.all(
          applicationsSnapshot.docs.map(async (applicationDoc) => {
            try {
              const applicationData = applicationDoc.data()
              const internId = applicationData.applicantId
              if (!internId) return null
              appliedInternIds.add(internId)

              let profileData = { formData: {} }
              try {
                const internProfileSnap = await getDoc(doc(db, "internProfiles", internId))
                if (internProfileSnap.exists()) profileData = internProfileSnap.data()
              } catch (profileError) {
                console.error(`Failed to fetch profile for intern ${internId}:`, profileError)
              }

              const formData = profileData.formData || {}
              const personalOverview = formData.personalOverview || {}
              const educationalBackground = formData.educationalBackground || {}
              const skillsInterests = formData.skillsInterests || {}
              const programAffiliation = formData.programAffiliation || {}

              let bigScore = applicationData.bigScore || applicationData.bigInternScore || 0
              try {
                const evalDoc = await getDoc(doc(db, "internEvaluations", internId))
                if (evalDoc.exists()) {
                  bigScore = evalDoc.data().scores?.bigInternScore ?? bigScore
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError)
              }

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
                sponsorName: programAffiliation.sponsorName || "Not specified",
                fundingProgramType:
                  applicationData.funding || programAffiliation.fundingType || "Not specified",
                startDate: applicationData.startDate || skillsInterests.availabilityStart || "Not specified",
                bigScore,
                matchPercentage:
                  applicationData.matchPercentage || applicationData.matchAnalysis?.overallScore || 0,
                status: applicationData.status || "Applied",
                locationFlexibility:
                  applicationData.locationFlexibility &&
                  applicationData.locationFlexibility[0] &&
                  applicationData.locationFlexibility[0] !== "N"
                    ? applicationData.locationFlexibility[0]
                    : skillsInterests.locationPreference && skillsInterests.locationPreference !== "N"
                      ? skillsInterests.locationPreference
                      : "Not specified",
              }
            } catch {
              return null
            }
          }),
        )

        const profilesSnapshot = await getDocs(collection(db, "internProfiles"))

        const profileInterns = await Promise.all(
          profilesSnapshot.docs.map(async (docSnap) => {
            try {
              const internId = docSnap.id
              if (appliedInternIds.has(internId) || internId === smeUserId) return null

              const data = docSnap.data()
              if (!data) return null

              const fd = data.formData || {}
              const personalOverview = fd.personalOverview || {}
              const academicOverview = fd.academicOverview || {}
              const skillsInterests = fd.skillsInterests || {}
              const programAffiliation = fd.programAffiliation || {}
              const experienceTrackRecord = fd.experienceTrackRecord || {}

              const hasRelevantData =
                personalOverview.fullName ||
                personalOverview.firstName ||
                academicOverview.institution ||
                (skillsInterests && Object.keys(skillsInterests).length > 0)

              if (!hasRelevantData) return null

              let bigScore = data.bigInternScore || 0
              try {
                const evalDoc = await getDoc(doc(db, "internEvaluations", internId))
                if (evalDoc.exists()) {
                  bigScore = evalDoc.data().scores?.bigInternScore ?? bigScore
                }
              } catch (evalError) {
                console.warn(`Could not fetch live evaluation for intern ${internId}:`, evalError)
              }

              // Was `data.matchPercentage ?? 0` — a stored 0 reads as a missing
              // field, so these rows were being dropped here but kept by the table.
              const matchResult = calculateMatchScoreForSponsor(smeUserData, data)
              const matchPercentage = matchResult.score || (data.matchPercentage ?? 0)

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
                // Same fallback chain the table uses.
                role:
                  Array.isArray(skillsInterests.technicalSkills) && skillsInterests.technicalSkills.length
                    ? skillsInterests.technicalSkills.join(", ")
                    : Array.isArray(experienceTrackRecord.type) && experienceTrackRecord.type.length
                      ? experienceTrackRecord.type.join(", ")
                      : "Not specified",
                sponsorName: programAffiliation.sponsorName || "Not specified",
                fundingProgramType: programAffiliation.fundingStatus || "Not specified",
                startDate: skillsInterests.availabilityStart || "Not specified",
                bigScore,
                matchPercentage,
                status: "Matched",
                locationFlexibility:
                  Array.isArray(academicOverview.locationFlexibility) &&
                  academicOverview.locationFlexibility.length > 0 &&
                  academicOverview.locationFlexibility[0] !== "N"
                    ? academicOverview.locationFlexibility.join(", ")
                    : "Not specified",
              }
            } catch {
              return null
            }
          }),
        )

        const user = auth.currentUser
        const allInterns = [...applicationInterns, ...profileInterns].filter(Boolean).filter((intern) => {
          if ((user && intern.internId === user.uid) || intern.internId === effectiveUserId) return false
          if (hasTooManyMissingFields(intern)) return false
          return true
        })

        countRows(allInterns)
      } catch (error) {
        console.error("Error fetching pipeline data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPipelineData()
  }, [usingProvidedRows, authResolved, effectiveUserId, countRows])

  const getStagePercentage = useCallback(
    (count) => (totalApplications === 0 ? 0 : ((count / totalApplications) * 100).toFixed(1)),
    [totalApplications],
  )

  const terminalStages = useMemo(() => stages.filter((s) => s.terminal), [stages])

  /* ─── Funnel levels. Stages sharing a level are parallel routes, so no
     arrow sits between them and the conversion is computed on the level
     total. Previously the rate was computed on array order, which put
     Applied and Requested upstream of Matched — the entry state — and made
     the first two arrows meaningless. ──────────────────────────────────── */
  const levels = useMemo(() => {
    const grouped = new Map()
    stages
      .filter((s) => !s.terminal)
      .forEach((stage) => {
        if (!grouped.has(stage.level)) grouped.set(stage.level, [])
        grouped.get(stage.level).push(stage)
      })
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([, group]) => group)
  }, [stages])

  const levelConversions = useMemo(() => {
    const totals = levels.map((group) => group.reduce((sum, s) => sum + (s.count || 0), 0))
    const cumulative = new Array(totals.length).fill(0)
    let running = 0
    for (let i = totals.length - 1; i >= 0; i--) {
      running += totals[i]
      cumulative[i] = running
    }
    return cumulative.map((value, i) =>
      i < cumulative.length - 1 && value > 0 ? ((cumulative[i + 1] / value) * 100).toFixed(1) : null,
    )
  }, [levels])

  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const percentage = getStagePercentage(stage.count)
    const theme = stage.terminal ? { from: "#4b4844", to: "#242220" } : { from: "#4a352f", to: "#241a14" }
    const Icon = stage.icon
    const isActive = activeStage && stage.statusMapping.includes(activeStage)
    const clickable = typeof onStageSelect === "function"

    const showTip = (el) => setHoveredStage({ id: stage.id, rect: el.getBoundingClientRect() })
    const hideTip = () => setHoveredStage(null)

    return (
      <div className="relative flex-shrink-0" style={{ width: "104px" }}>
        <button
          type="button"
          disabled={!clickable}
          onClick={() => clickable && onStageSelect(isActive ? null : stage.statusMapping[0])}
          onMouseEnter={(e) => showTip(e.currentTarget)}
          onMouseLeave={hideTip}
          onFocus={(e) => showTip(e.currentTarget)}
          onBlur={hideTip}
          aria-pressed={clickable ? !!isActive : undefined}
          aria-label={`${stage.name}: ${stage.count} candidate${stage.count === 1 ? "" : "s"}`}
          className={`w-full text-left rounded-xl p-2.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a67c52] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f2] ${
            clickable ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
          } ${isHovered ? "shadow-xl -translate-y-1" : "shadow-md"}`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: isActive ? "1.5px solid #c9986a" : "1.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              <Icon size={11} className="text-white" />
            </div>
            <h3 className="font-semibold text-white text-[9px] uppercase tracking-wide leading-tight truncate flex-1">
              {stage.name}
            </h3>
          </div>
          <div className="flex items-baseline justify-center">
            <span className="text-lg font-extrabold leading-none text-white">{stage.count}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: "#c9986a" }}
              />
            </div>
            <span className="text-[8px] font-semibold flex-shrink-0" style={{ color: "#d9c4b0" }}>
              {percentage}%
            </span>
          </div>
        </button>

        {isHovered && (
          <PopupPortal>
            <div
              className="fixed z-[1200] pointer-events-none w-[230px] font-sans"
              style={{
                top: hoveredStage.rect.bottom + 10,
                left: Math.min(
                  Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 115, 12),
                  window.innerWidth - 242,
                ),
              }}
            >
              <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                <div className="pt-1 border-t border-white/10 flex items-center justify-between mt-1">
                  <span className="text-[#c8b6a6]">{percentage}% of candidates</span>
                  <span className="text-[#a67c52] font-semibold">
                    {stage.count} intern{stage.count === 1 ? "" : "s"}
                  </span>
                </div>
                {typeof onStageSelect === "function" && (
                  <p className="text-[10px] text-[#c8b6a6] mt-1.5">
                    {activeStage && stage.statusMapping.includes(activeStage)
                      ? "Click to clear this filter"
                      : "Click to filter the table"}
                  </p>
                )}
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3]">
        <PipelineSkeleton />
      </div>
    )
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
            <p className="text-xs text-[#7d5a50] mt-0.5">
              {totalApplications} candidate{totalApplications === 1 ? "" : "s"}, stage by stage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {activeStage && typeof onStageSelect === "function" && (
            <button
              onClick={() => onStageSelect(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-[#4a352f] border border-[#c8b6a6] hover:bg-[#f5f0e1] transition-colors"
            >
              Filtering by {activeStage} — clear
            </button>
          )}
          <span
            className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
            title="Requested and Applied are two routes into the same conversation, so they share a step and no arrow sits between them."
          >
            <HelpCircle size={12} /> Percentages on arrows are step-to-step conversion
          </span>
        </div>
      </div>

      {unmappedCount > 0 && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[#fff3e0] border border-[#e65100]/30 text-xs text-[#e65100]">
          {unmappedCount} candidate{unmappedCount === 1 ? " has a status" : "s have statuses"} that no card covers, so
          the percentages below won't add up to 100. Check the console for the exact values and add them to
          STAGE_DEFINITIONS.
        </div>
      )}

      <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent gap-1">
        {levels.map((group, idx) => (
          <div key={group[0].id} className="flex items-center">
            {/* Stages on the same level sit together with no arrow between */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {group.map((stage) => (
                <div key={stage.id}>{renderStageCard(stage)}</div>
              ))}
            </div>

            {idx < levels.length - 1 && (
              <div className="flex flex-col items-center px-0.5 flex-shrink-0" style={{ minWidth: "34px" }}>
                <span
                  className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
                  title="Share of candidates at this step or beyond that reach the next step"
                >
                  {levelConversions[idx] ?? "—"}
                  {levelConversions[idx] != null && "%"}
                </span>
                <div className="flex items-center">
                  <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
                  <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>
        ))}

        {terminalStages.length > 0 && (
          <div className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
              <div className="w-px h-10 bg-[#e6d7c3]" />
            </div>
            <div
              className="flex items-center gap-1.5 flex-shrink-0 p-1.5 rounded-2xl"
              style={{ border: "2px solid #D32F2F" }}
            >
              {terminalStages.map((stage) => (
                <div key={stage.id} className="flex-shrink-0">
                  {renderStageCard(stage)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InternDealflowPage