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
  X,
} from "lucide-react"

/* Scoring is imported, not copied. Duplicating calculateMatchScoreForSponsor
   is what made the two components disagree in the first place. */
import {
  calculateMatchScoreForSponsor,
  INTERN_STAGE_FILTER_EVENT,
  INTERN_ROWS_EVENT,
  INTERN_ROWS_REQUEST_EVENT,
} from "./intern-table"

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
   Stage definitions — array order is display order.

   The `level` field is gone. It grouped Requested with Applied, and Confirmed
   with Term Sheet Signed, into arrowless pairs that read as combined cards.
   Every live stage now gets its own card and its own arrow.

   Declined is `terminal`: it sits inside the red outline at the end with no
   arrow into it, because leaving the pipeline isn't a step it flows through.

   `statusMapping` carries every literal string that can reach the table,
   including the legacy aliases intern-table.jsx's STATUS_TO_PIPELINE_MAP
   already tolerates.
   ──────────────────────────────────────────────────────────────────────── */
const STAGE_DEFINITIONS = [
  { id: "matched", name: "Matched", statusMapping: ["Matched"], icon: Target, tooltip: "Candidates matched to your request that you haven't acted on yet." },
  { id: "shortlisted", name: "Shortlisted", statusMapping: ["Shortlisted"], icon: ListChecks, tooltip: "Candidates you've flagged as worth pursuing." },
  { id: "requested", name: "Requested", statusMapping: ["Requested"], icon: Send, tooltip: "You've invited the candidate to apply." },
  { id: "applied", name: "Applied", statusMapping: ["Applied"], icon: FileText, tooltip: "The candidate applied to you." },
  { id: "interviewed", name: "Contacted/Interview", statusMapping: ["Contacted/Interview", "Interviewed"], icon: Phone, tooltip: "Interview arranged or held." },
  { id: "confirmed", name: "Confirmed", statusMapping: ["Confirmed"], icon: CheckCircle, tooltip: "Placement agreed in principle." },
  { id: "confirmed_ts", name: "Term Sheet Signed", statusMapping: ["Confirmed/Term Sheet Sign"], icon: FileCheck, tooltip: "Terms issued and signed." },
  { id: "accepted", name: "Accepted", statusMapping: ["Accepted"], icon: Award, tooltip: "Offer accepted by the candidate." },
  { id: "contract_signed", name: "Contract Signed", statusMapping: ["Contract Signed", "Contract_signed"], icon: ClipboardCheck, tooltip: "Contract executed." },
  { id: "active", name: "Active", statusMapping: ["Active"], icon: TrendingUp, tooltip: "Placement is running." },
  { id: "completed", name: "Completed", statusMapping: ["Completed"], icon: Trophy, tooltip: "Placement finished." },
  { id: "declined", name: "Declined", statusMapping: ["Declined", "Decline"], icon: XCircle, terminal: true, tooltip: "Not taken forward, or the candidate withdrew." },
]

const LIVE_STAGES = STAGE_DEFINITIONS.filter((s) => !s.terminal)
const TERMINAL_STAGES = STAGE_DEFINITIONS.filter((s) => s.terminal)
const ENTRY_STAGE_ID = STAGE_DEFINITIONS[0].id

/* Cards are wider than they were and stage names wrap onto another line rather
   than being cut off with an ellipsis — a stage nobody can read isn't a stage.
   Every card in the row stretches to the height of the tallest one (see
   `items-stretch` on the row plus `h-full` on the card body), so a two-line
   name never leaves a card sitting short next to its neighbours. */
const CARD_WIDTH = 124

/* "Contacted/Interview" has no space around the slash, so the browser would
   otherwise break it mid-word. A zero-width space after each slash gives the
   line-breaker a clean place to split. Display only — the status strings
   themselves are untouched. */
const softBreak = (name = "") => name.replace(/\//g, "/\u200B")

const PopupPortal = ({ children }) => {
  if (typeof document === "undefined") return null
  return createPortal(children, document.body)
}

const PipelineSkeleton = () => (
  <div className="flex items-center gap-1 overflow-x-auto pb-4 px-1">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center flex-shrink-0">
        <div
          className="bg-gradient-to-br from-[#f5f0e1]/60 to-[#e6d7c3]/30 rounded-xl flex-shrink-0 animate-pulse"
          style={{ width: `${CARD_WIDTH}px`, height: "98px" }}
        >
          <div className="p-2.5 flex flex-col h-full justify-between">
            <div className="h-2.5 w-20 rounded-full bg-[#c8b6a6]/40" />
            <div className="h-5 w-10 rounded bg-[#c8b6a6]/30 mx-auto" />
            <div className="h-1.5 w-full rounded-full bg-[#c8b6a6]/30" />
          </div>
        </div>
        {i < 7 && <div className="w-8 h-[2px] mx-1 rounded-full bg-[#e6d7c3] animate-pulse" />}
      </div>
    ))}
  </div>
)

/* ════════════════════════════════════════════════════════════════════════════
   InternDealflowPage

   Props (all optional):
     interns        pre-fetched rows. Without either this or the table's
                    broadcast, the component self-fetches — a second full scan
                    of internProfiles on every page view.
     onStageSelect  called with the status name on press, null when cleared.

   Where the counts come from, in order of preference:
     1. InternTablePage's broadcast. Its rows carry the resolved status, so
        the cards and the table body can't disagree.
     2. The `interns` prop.
     3. Its own Firestore queries.

   Selection lives in this component. Pressing a card always highlights it and
   fires both the callback and the window event, so the table filters whether
   or not the page wires the props.
   ════════════════════════════════════════════════════════════════════════ */
export function InternDealflowPage({ interns: internsProp, onStageSelect, className = "" }) {
  const [fetchedRows, setFetchedRows] = useState([])
  const [tableRows, setTableRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [hoveredStage, setHoveredStage] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)

  /* The table's broadcast beats every other source. Asking for it on mount
     covers the case where the table rendered first. */
  useEffect(() => {
    if (typeof window === "undefined") return
    const onRows = (e) => {
      if (!Array.isArray(e.detail)) return
      setTableRows(e.detail)
      setLoading(false)
    }
    window.addEventListener(INTERN_ROWS_EVENT, onRows)
    window.dispatchEvent(new Event(INTERN_ROWS_REQUEST_EVENT))
    return () => window.removeEventListener(INTERN_ROWS_EVENT, onRows)
  }, [])

  const usingTable = Array.isArray(tableRows)
  const usingProvidedRows = !usingTable && Array.isArray(internsProp)
  const needsOwnFetch = !usingTable && !usingProvidedRows

  /* ─── Auth. Wrapped in onAuthStateChanged so a cold load doesn't read
     auth.currentUser before Firebase has restored the session — that left
     loading stuck at true and the skeleton on screen forever. ──────────── */
  useEffect(() => {
    if (!needsOwnFetch) return undefined

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
  }, [needsOwnFetch])

  /* ─── Path A: rows handed down. No reads. ─────────────────────────────── */
  useEffect(() => {
    if (!usingProvidedRows) return
    setFetchedRows(internsProp)
    setLoading(false)
  }, [usingProvidedRows, internsProp])

  /* ─── Path B: self-fetch. Row derivation matches intern-table.jsx field for
     field — the old version skipped the match-score calculation and the
     experienceTrackRecord role fallback, which pushed extra rows over the
     missing-field threshold and made Matched read lower than the table. ── */
  useEffect(() => {
    if (!needsOwnFetch) return
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
                fundingProgramType: applicationData.funding || programAffiliation.fundingType || "Not specified",
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
              // field, so these rows were dropped here but kept by the table.
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

        setFetchedRows(allInterns)
      } catch (error) {
        console.error("Error fetching pipeline data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPipelineData()
  }, [needsOwnFetch, authResolved, effectiveUserId])

  /* ─── Counting. One place, whichever source the rows came from. ──────── */
  const { counts, total } = useMemo(() => {
    const rows = usingTable ? tableRows : fetchedRows
    const result = Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.id, 0]))
    const unrecognised = []

    rows.forEach((row) => {
      const status = row.status
      const stage = STAGE_DEFINITIONS.find((s) => s.statusMapping.includes(status))
      if (stage) {
        result[stage.id] += 1
      } else {
        /* Counted under the entry stage rather than dropped, so the
           percentages still reach 100 and no candidate disappears from the
           funnel. The console is the right place for this — an SME shouldn't
           be reading about STAGE_DEFINITIONS. */
        result[ENTRY_STAGE_ID] += 1
        unrecognised.push(status)
      }
    })

    if (unrecognised.length > 0) {
      console.warn(
        "[InternDealflowPage] counted under Matched — no card covers these statuses:",
        [...new Set(unrecognised)],
      )
    }

    return { counts: result, total: rows.length }
  }, [usingTable, tableRows, fetchedRows])

  const getStagePercentage = useCallback(
    (count) => (total === 0 ? 0 : ((count / total) * 100).toFixed(1)),
    [total],
  )

  /* Running total from the end of the live funnel backwards, so each arrow can
     say "of everything that got this far, this share went further". */
  const cumulativeCounts = useMemo(() => {
    const result = {}
    let running = 0
    for (let i = LIVE_STAGES.length - 1; i >= 0; i--) {
      running += counts[LIVE_STAGES[i].id] || 0
      result[LIVE_STAGES[i].id] = running
    }
    return result
  }, [counts])

  const handleStageClick = useCallback(
    (status) => {
      const next = status === selectedStage ? null : status
      setSelectedStage(next)
      onStageSelect?.(next)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(INTERN_STAGE_FILTER_EVENT, { detail: next }))
      }
    },
    [selectedStage, onStageSelect],
  )

  /* One renderer for every card — live and terminal — so Declined keeps the
     same shape and size as the rest. Only the palette differs.

     The card body is a flex column at `h-full`: the name sits at the top and
     is free to run to a second or third line, while `mt-auto` pins the count
     and the progress bar to the bottom edge. That keeps the numbers on one
     baseline across the row no matter how many lines each name takes. */
  const renderStageCard = (stage) => {
    const isHovered = hoveredStage?.id === stage.id
    const status = stage.statusMapping[0]
    const isSelected = selectedStage === status
    const count = counts[stage.id] || 0
    const percentage = getStagePercentage(count)
    const theme = stage.terminal
      ? { from: "#4b4844", to: "#242220" } // dark grey — Declined
      : { from: "#4a352f", to: "#241a14" } // dark brown — every other stage
    const Icon = stage.icon

    return (
      <div
        className={`relative flex-shrink-0 cursor-pointer group transition-all duration-300 ${
          isSelected ? "scale-105" : "hover:scale-[1.02]"
        }`}
        style={{ width: `${CARD_WIDTH}px` }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${stage.name}: ${count} candidate${count === 1 ? "" : "s"}`}
        onMouseEnter={(e) => setHoveredStage({ id: stage.id, rect: e.currentTarget.getBoundingClientRect() })}
        onMouseLeave={() => setHoveredStage(null)}
        onClick={() => handleStageClick(status)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleStageClick(status)
          }
        }}
      >
        <div
          className={`rounded-xl p-2.5 h-full flex flex-col transition-all duration-300 ${
            isHovered || isSelected ? "shadow-xl -translate-y-1" : "shadow-md hover:shadow-lg"
          }`}
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
            border: `1.5px solid ${isSelected ? "#d9b98a" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <div className="flex items-start gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
              <Icon size={11} className="text-white" />
            </div>
            {/* Full stage name, wrapped rather than truncated. */}
            <h3 className="font-semibold text-white text-[9px] uppercase tracking-wide leading-[11px] break-words flex-1 min-w-0 pt-[3px]">
              {softBreak(stage.name)}
            </h3>
          </div>
          <div className="flex items-baseline justify-center mt-auto pt-1">
            <span className="text-lg font-extrabold leading-none text-white">{count}</span>
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
        </div>

        {isHovered && (
          <PopupPortal>
            <div
              className="fixed z-[1200] pointer-events-none w-[240px] font-sans"
              style={{
                top: hoveredStage.rect.bottom + 10,
                left: Math.min(
                  Math.max(hoveredStage.rect.left + hoveredStage.rect.width / 2 - 120, 12),
                  window.innerWidth - 252,
                ),
              }}
            >
              <div className="bg-[#4a352f] text-[#faf7f2] text-xs rounded-2xl px-4 py-3.5 shadow-2xl">
                <p className="font-semibold mb-1.5 text-sm">{stage.name}</p>
                <p className="text-[#e6d7c3] leading-relaxed">{stage.tooltip}</p>
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[#c8b6a6]">{percentage}% of candidates</span>
                  <span className="text-[#a67c52] font-semibold">
                    {count} intern{count === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-[10px] text-[#c8b6a6] mt-1.5">
                  {isSelected ? "Press to clear this filter" : "Press to filter the table"}
                </p>
              </div>
            </div>
          </PopupPortal>
        )}
      </div>
    )
  }

  const renderArrow = (idx) => {
    const stage = LIVE_STAGES[idx]
    const nextStage = LIVE_STAGES[idx + 1]
    const fromCount = cumulativeCounts[stage.id] || 0
    const toCount = cumulativeCounts[nextStage.id] || 0
    const rate = fromCount > 0 ? ((toCount / fromCount) * 100).toFixed(1) : "0.0"

    return (
      <div className="flex flex-col items-center justify-center px-0.5 flex-shrink-0" style={{ minWidth: "38px" }}>
        <span
          className="text-[10px] font-bold text-[#7d5a50] mb-0.5 whitespace-nowrap"
          title="Share of candidates at this step or beyond that reach the next step"
        >
          {rate}%
        </span>
        <div className="flex items-center">
          <div className="w-5 h-[2px] bg-gradient-to-r from-[#7d5a50] to-[#a67c52]" />
          <ArrowRight size={14} className="text-[#5a4038] -ml-1" strokeWidth={2.5} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-full font-sans bg-gradient-to-br from-[#faf7f2] to-[#f5f0e1] rounded-3xl p-7 shadow-xl border border-[#e6d7c3] ${className}`}
    >
      <div className="flex items-center justify-between mb-7 flex-wrap gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7d5a50] to-[#4a352f] flex items-center justify-center shadow-md">
            <Briefcase size={20} className="text-[#faf7f2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#4a352f] tracking-tight">Intern Pipeline</h2>
              <Sparkles size={14} className="text-[#a67c52]" />
            </div>
            <p className="text-xs text-[#7d5a50] mt-0.5">
              {total} candidate{total === 1 ? "" : "s"}, stage by stage
            </p>
          </div>
        </div>

        <span
          className="flex items-center gap-1.5 text-[11px] text-[#a89482]"
          title="On a card: share of all your candidates. On an arrow: share of that step which reaches the next, counting live stages only."
        >
          <HelpCircle size={12} /> Cards show share of all candidates; arrows show step-to-step conversion
        </span>
      </div>

      {loading ? (
        <PipelineSkeleton />
      ) : (
        <>
          {/* `items-stretch` here and `h-full` on each card body are what keep a
              multi-line name from making one card shorter than its neighbours. */}
          <div className="flex items-stretch overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#c8b6a6] scrollbar-track-transparent">
            {/* Live funnel — one card per stage, an arrow in every gap */}
            {LIVE_STAGES.map((stage, idx) => (
              <div key={stage.id} className="flex items-stretch flex-shrink-0">
                {renderStageCard(stage)}
                {idx < LIVE_STAGES.length - 1 && renderArrow(idx)}
              </div>
            ))}

            {/* Exit state — red border, no arrow */}
            {TERMINAL_STAGES.length > 0 && (
              <div className="flex items-stretch flex-shrink-0">
                <div className="flex flex-col items-center px-2 flex-shrink-0 self-stretch justify-center">
                  <div className="w-px h-10 bg-[#e6d7c3]" />
                </div>
                <div
                  className="flex items-stretch gap-1.5 flex-shrink-0 p-1.5 rounded-2xl"
                  style={{ border: "2px solid #D32F2F" }}
                >
                  {TERMINAL_STAGES.map((stage) => (
                    <div key={stage.id} className="flex flex-shrink-0">
                      {renderStageCard(stage)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center mt-4 flex-wrap gap-3">
            {selectedStage ? (
              <div className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-[#a67c52]/10 border border-[#a67c52]/40">
                <span className="text-xs font-semibold text-[#7d5a50]">Filtering</span>
                <span className="text-xs font-bold text-[#4a352f]">{selectedStage}</span>
                <button
                  onClick={() => handleStageClick(selectedStage)}
                  className="p-1 rounded-full hover:bg-white/70 text-[#7d5a50] hover:text-[#4a352f] transition-colors"
                  title="Clear filter"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#a89482] font-medium">Click a stage to filter the table below</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default InternDealflowPage