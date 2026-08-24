"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, Users, CheckCircle, TrendingUp, Target, Lock, Info } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, getDocs } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import {
  calculateGovernanceScore,
  buildGovernancePrompt,
} from "./governance-improvements"
import {
  computeLeadershipQuality,
  computeOwnershipStructure,
  buildOpportunities,
  fmtPts,
} from "./governance-potential"

// ─────────────────────────────────────────────────────────────────────────
// Governance & Leadership — combined card.
// Replaces the old separate PISScoreCard (governance) and LeadershipScoreCard.
// Category 3 of the 5-pillar taxonomy:
//   1. Compliance   2. Legitimacy   3. Leadership & Governance (this file)
//   4. Operational Strength   5. Financial Strength / Capital Appeal
//
// Internally this is organised into three sub-sections that mirror how the
// business actually thinks about this pillar:
//   A. Ownership & Structure   — directors, shareholders, succession,
//      exec/non-exec balance, advisor structure
//      (structural completeness heuristic)
//   B. Leadership Quality      — founder experience, qualifications,
//      industry expertise, execution capability, ambition, learning mindset,
//      critical role coverage
//      (sourced from the AI leadership evaluation)
//   C. Governance Maturity     — PIS stage, board structure, advisors,
//      policies, reporting, risk management, integrity & risk, sanctions,
//      conflicts, legal, reputation
//      (sourced from ALL calculateGovernanceScore() categories including board)
// ─────────────────────────────────────────────────────────────────────────

export const SECTION_WEIGHTS = {
  ownership: 25,
  leadership: 40,
  maturity: 35,
}

// ─────────────────────────────────────────────────────────────────────────
// TWO DOMAINS, NOT THREE PILLARS
//
// This card answers two separate questions and a funder treats them as
// separate findings, so the breakdown groups them rather than listing three
// pillars flat:
//
//   LEADERSHIP  — who is running this business, and are they any good at it?
//                 Founder credentials, the depth of the operating team, and
//                 how they behave. One pillar, 40%.
//
//   GOVERNANCE  — what structures hold them to account?
//                 Who owns and directs the company, and how mature the
//                 governance around that is. Two pillars, 60%.
//
// Ownership & Structure sits under GOVERNANCE deliberately. Directors,
// shareholders and the exec / non-exec split describe the accountability
// structure, not the calibre of the people in it — a strong founder with no
// board is a leadership pass and a governance fail, and the card should be
// able to say that.
// ─────────────────────────────────────────────────────────────────────────
export const DOMAINS = [
  {
    key: "leadership",
    label: "Leadership",
    question: "Who is running this business, and are they any good at it?",
    color: "#6D4C41",
    accent: "#efe5e0",
    pillarKeys: ["leadership"],
  },
  {
    key: "governance",
    label: "Governance",
    question: "What structures hold them to account?",
    color: "#A67C52",
    accent: "#f3e8dc",
    pillarKeys: ["ownership", "maturity"],
  },
]

// ─────────────────────────────────────────────────────────────────────────
// Critical role coverage — the operational roles a funder expects to see
// staffed for a business of this type, regardless of whether the person
// holding them sits on the board (director.roles) or in management
// (executive.position). Matching is against the exact option strings used
// in directorRoleOptions / executivePositions in OwnershipManagement.jsx.
// Used for two checks:
//   1. Coverage gaps — is anyone at all covering Finance / Tech / Sales /
//      Operations / top executive leadership?
//   2. Concentration risk — is one person covering 2+ of these buckets, or
//      holding an unusually high number of board roles? That's a signal
//      the business is spread thin on a single individual and may carry
//      succession and conflict-of-interest risk.
// ─────────────────────────────────────────────────────────────────────────
// Roles that describe WHICH SEAT a person occupies rather than WHAT THEY DO.
// Excluded from role-concentration counting (a chairman who also ticks
// "Board of Directors" and "Executive Director" is one seat described three
// ways, not three jobs), and used instead to infer exec / non-exec status
// when the Exec/Non-Exec dropdown is left blank.
export const SEAT_DESCRIPTOR_ROLES = [
  "Board of Directors", "Chairman", "Vice-President",
  "Executive Director", "Non-Executive Director", "Independent Director",
]

export const NON_EXEC_SIGNAL_ROLES = ["Non-Executive Director", "Independent Director"]
export const EXEC_SIGNAL_ROLES = [
  "Executive Director", "Chief Executive Officer", "Chief Financial Officer",
  "Chief Operating Officer", "Managing Director", "General Manager",
  "Regional Manager", "Supervisor", "Office Manager", "Team Leader",
]
export const INDEPENDENT_ROLE = "Independent Director"

// directorRoles and execRoles are kept SEPARATE and matched separately,
// because directorRoleOptions and executivePositions are different lists.
// CTO / CIO / IT Manager / CMO / Sales Manager / Marketing Manager /
// Financial Manager exist only in executivePositions — a director can never
// hold them — so matching both against one combined list silently scored
// those buckets as uncovered whenever the holder sat on the board.
export const CRITICAL_ROLE_BUCKETS = [
  {
    key: "executive", label: "CEO / Managing Director",
    directorRoles: ["Chief Executive Officer", "Managing Director"],
    execRoles: ["Chief Executive Officer", "Managing Director"],
  },
  {
    key: "finance", label: "Finance / CFO",
    directorRoles: ["Chief Financial Officer"],
    execRoles: ["Chief Financial Officer", "Financial Manager"],
  },
  {
    key: "tech", label: "Technology / Tech Lead",
    directorRoles: [],
    execRoles: ["Chief Technology Officer", "Chief Information Officer", "IT Manager"],
  },
  {
    key: "sales", label: "Sales & Marketing",
    directorRoles: [],
    execRoles: ["Chief Marketing Officer", "Sales Manager", "Marketing Manager"],
  },
  {
    key: "operations", label: "Operations",
    directorRoles: ["Chief Operating Officer", "General Manager", "Regional Manager"],
    execRoles: ["Chief Operating Officer", "Operations Manager", "General Manager"],
  },
  {
    key: "people", label: "People / HR",
    directorRoles: [],
    execRoles: ["Chief Human Resources Officer", "HR Manager"],
  },
]

// 3+ distinct FUNCTIONAL roles held by one person is a flag. Seat
// descriptors are excluded, so this no longer fires on a normal chairman.
export const DIRECTOR_ROLE_OVERLOAD_THRESHOLD = 3

// ─────────────────────────────────────────────────────────────────────────
// BOARD STRUCTURE ASSESSMENT (5.1 → 5.2 → 5.3)
//
// The Board Structure section answers three questions in order, and the
// score is built from the answers:
//
//   5.1  Does this business NEED a board?      — driven by PIS
//   5.2  Does it actually HAVE one?            — declared, or inferred from
//                                                director composition
//   5.3  Is that board STRUCTURED CORRECTLY?   — size, independence, mix,
//                                                cadence, concentration
//
// The critical rule: if 5.1 says a board is required and 5.2 says there
// isn't one, the business is PENALISED. It does not get to score well on
// governance maturity because everything else is tidy. The gap between what
// is required and what exists is the single biggest driver of this score.
// ─────────────────────────────────────────────────────────────────────────

export const PIS_EMERGING_THRESHOLD = 100
export const PIS_FULL_BOARD_THRESHOLD = 350

// Requirement ladder (5.1) — how much governance structure is expected
export const REQ_ADVISORS = 0
export const REQ_INFORMAL = 1
export const REQ_FORMAL = 2

// Provision ladder (5.2) — how much governance structure actually exists
export const PROV_NONE = -1
export const PROV_ADVISORS = 0
export const PROV_INFORMAL = 1
export const PROV_FORMAL = 2

// Penalty applied to the Board Structure score per step of shortfall
export const BOARD_GAP_PENALTY = { 1: 25, 2: 45, 3: 60 }
// Additional penalty applied to the whole Governance Maturity score, so a
// missing board drags the pillar down rather than being diluted by weighting
export const MATURITY_GAP_PENALTY = { 1: 6, 2: 12, 3: 18 }

// ─────────────────────────────────────────────────────────────────────────
// BOARD SKILLS MATRIX
//
// The named directors ARE the board — a company's directors are its board by
// definition. So the question is never "is there a board?" when directors are
// on record; it is "does the board around this table carry the skills the
// business needs?"
//
// Each domain is matched from three sources, in descending order of strength:
//   1. The board role the director holds (directorRoleOptions)
//   2. The executive position they hold (executivePositions)
//   3. Their uploaded CV — qualifications, certifications, skills, current role
//
// Skills held by executives who are NOT directors are tracked separately as
// "bench" — the capability exists in the business, but not at the board table
// where oversight happens.
// ─────────────────────────────────────────────────────────────────────────
// formGap flags a domain the FORM ITSELF cannot express — directorRoleOptions
// has no legal, technical, commercial or HR option, so those competencies can
// only ever be evidenced from an uploaded CV. Surfaced to the user rather than
// silently scored as absent.
export const BOARD_SKILL_DOMAINS = [
  {
    key: "finance",
    label: "Financial & accounting",
    directorRoles: ["Chief Financial Officer"],
    execRoles: ["Chief Financial Officer", "Financial Manager"],
    keywords: [/financ/i, /account/i, /\bCA\s*\(?SA\)?/i, /CIMA/i, /ACCA/i, /audit/i, /\btax\b/i, /treasur/i, /\bB\.?Com/i, /bookkeep/i, /CFA/i, /SAIPA/i],
  },
  {
    key: "legal",
    label: "Legal, governance & compliance",
    directorRoles: [],
    execRoles: [],
    keywords: [/legal/i, /governance/i, /complian/i, /\bLL\.?B/i, /attorney/i, /advocate/i, /admitted/i, /regulat/i, /company secretar/i, /King\s*I{1,3}V?/i, /\bIoDSA\b/i],
    formGap: "Company Secretary, Legal Advisor and Compliance Officer",
  },
  {
    key: "industry",
    label: "Industry & technical expertise",
    directorRoles: [],
    execRoles: ["Chief Technology Officer", "Chief Information Officer", "IT Manager"],
    keywords: [/engineer/i, /technic/i, /technolog/i, /\bB\.?Eng/i, /\bB\.?Sc/i, /software/i, /product/i, /R&D/i, /quality assur/i, /\bSHEQ\b/i, /\bPr\.?\s?Eng\b/i],
    formGap: "Chief Technology Officer and Chief Information Officer",
  },
  {
    key: "commercial",
    label: "Commercial, sales & market",
    directorRoles: [],
    execRoles: ["Chief Marketing Officer", "Sales Manager", "Marketing Manager"],
    keywords: [/sales/i, /marketing/i, /commercial/i, /business development/i, /\bBD\b/i, /customer/i, /revenue/i, /\bMBA\b/i],
    formGap: "Chief Marketing Officer and Sales Director",
  },
  {
    key: "operations",
    label: "Operations & delivery",
    directorRoles: ["Chief Operating Officer", "General Manager", "Regional Manager", "Office Manager"],
    execRoles: ["Chief Operating Officer", "Operations Manager", "General Manager"],
    keywords: [/operation/i, /supply chain/i, /logistic/i, /production/i, /manufactur/i, /procure/i, /project manage/i, /\bPMP\b/i],
  },
  {
    key: "people",
    label: "People & organisational",
    directorRoles: [],
    execRoles: ["Chief Human Resources Officer", "HR Manager"],
    keywords: [/human resource/i, /\bHR\b/i, /people/i, /talent/i, /industrial relations/i, /organisational/i, /organizational/i, /\bB\.?A\.? Psych/i, /\bSHRM\b/i],
    formGap: "HR Director",
  },
]

// ─────────────────────────────────────────────────────────────────────────
// QUALIFICATION EVIDENCE
//
// A job title says what a person does. Their CV says what they are qualified
// to do. These tiers rank the evidence found in a parsed CV so a board seat
// can be described as evidenced rather than merely occupied.
// ─────────────────────────────────────────────────────────────────────────
export const QUALIFICATION_TIERS = [
  {
    key: "designation", label: "Professional designation", weight: 4,
    patterns: [
      /\bCA\s*\(?SA\)?/i, /chartered account/i, /\bCFA\b/i, /\bCIMA\b/i, /\bACCA\b/i,
      /\bSAIPA\b/i, /\bSAICA\b/i, /\bPr\.?\s?Eng\b/i, /\bPr\.?\s?Tech\b/i, /\bPMP\b/i,
      /\bCFP\b/i, /\bCIA\b/i, /\bCISA\b/i, /\bSHRM\b/i, /admitted\s+(attorney|advocate)/i,
    ],
  },
  {
    key: "postgrad", label: "Postgraduate qualification", weight: 3,
    patterns: [/\bMBA\b/i, /\bMBL\b/i, /\bM\.?(Com|Sc|Eng|A|BA|Phil|Tech)\b/i, /\bPh\.?D\b/i, /\bLL\.?M\b/i, /master'?s/i, /honours/i, /postgraduate/i],
  },
  {
    key: "degree", label: "Undergraduate degree", weight: 2,
    patterns: [/\bB\.?\s?(Com|Sc|Eng|A|Tech|Bus|Admin)\b/i, /\bLL\.?B\b/i, /bachelor/i],
  },
  {
    key: "diploma", label: "Diploma or certificate", weight: 1,
    patterns: [/\bN\.?\s?Dip\b/i, /national diploma/i, /\bdiploma\b/i, /\bcertificate\b/i, /\bNQF\s*(level)?\s*\d/i],
  },
]

// Scored separately from the tiers above: a CA(SA) is a finance
// qualification, not evidence the person knows what a board is for.
export const GOVERNANCE_TRAINING_PATTERNS = [
  /King\s*I{1,3}V?\b/i, /\bIoDSA\b/i, /institute of directors/i,
  /director'?s?\s+(course|development|programme|program|training|certificate)/i,
  /board\s+(induction|training|effectiveness)/i, /company secretar/i, /corporate governance/i,
]

// Below this a director is carrying a seat on potential rather than track record
export const MIN_BOARD_EXPERIENCE_YEARS = 5

// ─────────────────────────────────────────────────────────────────────────
// COMMITTEES — read from director.committeeMembership, which the Directors
// table already captures. A Social & Ethics Committee is compulsory under
// the Companies Act at a Public Interest Score of 500 or more.
// ─────────────────────────────────────────────────────────────────────────
export const PIS_SOCIAL_ETHICS_THRESHOLD = 500

export const EXPECTED_COMMITTEES = [
  {
    key: "audit",
    label: "Audit / Risk",
    values: ["Audit Committee", "Risk Committee", "Audit & Risk Committee"],
    requiredWhen: (pis, reqLevel) => reqLevel === REQ_FORMAL,
    why: "nobody independent reviews the numbers or the risk register before they reach a funder",
  },
  {
    key: "socialEthics",
    label: "Social & Ethics",
    values: ["Social & Ethics Committee"],
    requiredWhen: (pis) => pis >= PIS_SOCIAL_ETHICS_THRESHOLD,
    why: "a Social & Ethics Committee is a statutory requirement at this Public Interest Score, not a nice-to-have",
  },
  {
    key: "remNom",
    label: "Remuneration / Nomination",
    values: ["Remuneration Committee", "Nomination Committee", "Remuneration & Nomination Committee"],
    requiredWhen: (pis, reqLevel) => reqLevel === REQ_FORMAL,
    why: "executive pay and board appointments are being set by the same people who receive them",
  },
]

// ─────────────────────────────────────────────────────────────────────────
// ADVISORS
//
// There is currently no advisor table in OwnershipManagement.jsx — only the
// enterpriseReadiness.hasAdvisors yes/no. This reader checks every plausible
// location so it starts working the moment advisor capture is added, and
// returns [] until then. The absence is raised as an evidence gap.
// ─────────────────────────────────────────────────────────────────────────
export const ADVISOR_SOURCES = [
  ["enterpriseReadiness", "advisors"],
  ["enterpriseReadiness", "advisorList"],
  ["enterpriseReadiness", "advisoryBoard"],
  ["ownershipManagement", "advisors"],
  ["ownershipManagement", "advisoryBoard"],
  ["governance", "advisors"],
]

const readAdvisors = (profileData) => {
  for (const [group, key] of ADVISOR_SOURCES) {
    const raw = profileData?.[group]?.[key]
    if (Array.isArray(raw) && raw.length) {
      return raw
        .map((x) =>
          typeof x === "string"
            ? { name: x.trim(), role: "", firm: "", cv: null }
            : {
                name: String(x?.name || x?.advisorName || x?.fullName || "").trim(),
                role: x?.role || x?.specialisation || x?.specialization || x?.discipline || x?.position || x?.type || "",
                firm: x?.firm || x?.company || x?.organisation || x?.organization || "",
                cv: x?.cv || null,
              }
        )
        .filter((a) => a.name)
    }
  }
  return []
}

const isYes = (v) =>
  v === true || (typeof v === "string" && ["yes", "true", "y"].includes(v.trim().toLowerCase()))
const isNo = (v) =>
  v === false || (typeof v === "string" && ["no", "false", "n", "none"].includes(v.trim().toLowerCase()))

const clamp100 = (n) => Math.min(Math.max(Math.round(n), 0), 100)

const sameName = (a, b) =>
  !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

// Flattens a CV record into one searchable string
const cvToText = (cv) => {
  if (!cv) return ""
  const bits = [cv.currentRole, cv.currentCompany, cv.summary, cv.professionalSummary]
  if (Array.isArray(cv.skills)) bits.push(cv.skills.join(" "))
  if (Array.isArray(cv.certifications)) bits.push(cv.certifications.join(" "))
  if (Array.isArray(cv.education)) cv.education.forEach((ed) => bits.push(ed?.degree, ed?.field, ed?.institution))
  if (Array.isArray(cv.experience)) cv.experience.forEach((ex) => bits.push(ex?.role, ex?.title, ex?.company, ex?.description))
  return bits.filter(Boolean).join(" | ")
}

// ── Which skills are actually sitting at the board table? ──
// ── Which skills are actually sitting at the board table? ──
// Director roles and executive positions are matched against SEPARATE lists
// (see CRITICAL_ROLE_BUCKETS above) because the two dropdowns share almost
// no options. A director who also holds an executive position brings that
// position's competency to the board table; an executive who is not a
// director counts as bench only.
export const computeBoardSkills = (validDirectors, validExecutives, cvProfiles) => {
  const cvs = cvProfiles || []
  const boardCoverage = {}
  const benchCoverage = {}
  BOARD_SKILL_DOMAINS.forEach((d) => { boardCoverage[d.key] = []; benchCoverage[d.key] = [] })

  const assess = ({ name, boardRoles, execRoles, target }) => {
    const cv = cvs.find((c) => sameName(c?.personName, name))
    const cvText = cvToText(cv)

    BOARD_SKILL_DOMAINS.forEach((domain) => {
      const boardHit = (boardRoles || []).find((r) => domain.directorRoles.includes(r))
      const execHit = (execRoles || []).find((r) => domain.execRoles.includes(r))
      const cvHit = cvText && domain.keywords.some((k) => k.test(cvText))
      if (boardHit) target[domain.key].push({ name, basis: `holds the ${boardHit} board role` })
      else if (execHit) target[domain.key].push({ name, basis: `serves as ${execHit}` })
      else if (cvHit) target[domain.key].push({ name, basis: "CV qualifications / experience" })
    })
  }

  ;(validDirectors || []).forEach((d) => {
    const boardRoles = (d.roles || []).map((r) => (r === "Other" ? d.customRole : r)).filter(Boolean)
    const execRow = (validExecutives || []).find((e) => sameName(e.name, d.name))
    const execPos = execRow ? (execRow.position === "Other" ? execRow.customPosition : execRow.position) : null
    assess({ name: d.name, boardRoles, execRoles: execPos ? [execPos] : [], target: boardCoverage })
  })

  ;(validExecutives || []).forEach((e) => {
    const position = e.position === "Other" ? e.customPosition : e.position
    const onBoard = (validDirectors || []).some((d) => sameName(d.name, e.name))
    if (onBoard) return // already assessed at board level above
    assess({ name: e.name, boardRoles: [], execRoles: position ? [position] : [], target: benchCoverage })
  })

  // De-duplicate people per domain
  Object.keys(boardCoverage).forEach((k) => {
    const seen = new Set()
    boardCoverage[k] = boardCoverage[k].filter((h) => (seen.has(h.name) ? false : seen.add(h.name)))
    const seenB = new Set()
    benchCoverage[k] = benchCoverage[k].filter((h) => (seenB.has(h.name) ? false : seenB.add(h.name)))
  })

  const covered = BOARD_SKILL_DOMAINS.filter((d) => boardCoverage[d.key].length > 0)
  const missing = BOARD_SKILL_DOMAINS.filter((d) => boardCoverage[d.key].length === 0)
  const onBenchOnly = missing.filter((d) => benchCoverage[d.key].length > 0)
  // Domains the form cannot capture as a director role at all
  const formGapDomains = missing.filter((d) => d.formGap)

  return {
    boardCoverage,
    benchCoverage,
    covered,
    missing,
    onBenchOnly,
    formGapDomains,
    coveredCount: covered.length,
    totalDomains: BOARD_SKILL_DOMAINS.length,
    ratio: covered.length / BOARD_SKILL_DOMAINS.length,
    hasCvEvidence: cvs.length > 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// EXEC / NON-EXEC AND TRUE INDEPENDENCE
//
// The Directors table has both a "Roles" multi-select and an "Exec/Non-Exec"
// dropdown, and people routinely fill in one and not the other. If execType
// is blank but the role says "Non-Executive Director", the answer is known.
//
// Independence is a separate question from executive status.
// linkedShareholderId tells us a director is a shareholder's nominee. They
// may well be non-executive, but they are not independent — they protect
// their own capital, not the company's governance.
// ─────────────────────────────────────────────────────────────────────────
export const resolveExecType = (director) => {
  if (director.execType === "Executive" || director.execType === "Non-Executive") {
    return { value: director.execType, inferred: false }
  }
  const roles = director.roles || []
  if (roles.some((r) => NON_EXEC_SIGNAL_ROLES.includes(r))) return { value: "Non-Executive", inferred: true }
  if (roles.some((r) => EXEC_SIGNAL_ROLES.includes(r))) return { value: "Executive", inferred: true }
  return { value: "", inferred: false }
}

export const classifyIndependence = (director) => {
  const { value: execType, inferred } = resolveExecType(director)
  const isShareholderLinked = director.linkedShareholderId !== null && director.linkedShareholderId !== undefined
  const claimsIndependent = (director.roles || []).includes(INDEPENDENT_ROLE)

  if (execType === "Executive") return { tier: "executive", label: "Executive", inferred, isShareholderLinked }
  if (execType === "Non-Executive") {
    if (isShareholderLinked) return { tier: "nonExecLinked", label: "Non-executive shareholder — not independent", inferred, isShareholderLinked }
    if (claimsIndependent) return { tier: "independent", label: "Independent non-executive", inferred, isShareholderLinked }
    return { tier: "nonExec", label: "Non-executive", inferred, isShareholderLinked }
  }
  return { tier: "unclassified", label: "Unclassified", inferred, isShareholderLinked }
}

export const splitBoard = (validDirectors) => {
  const acc = { executive: 0, nonExec: 0, nonExecLinked: 0, independent: 0, unclassified: 0, inferredCount: 0 }
  ;(validDirectors || []).forEach((d) => {
    const c = classifyIndependence(d)
    acc[c.tier]++
    if (c.inferred) acc.inferredCount++
  })
  // Legacy shape kept so existing display code keeps working
  acc.exec = acc.executive
  acc.trulyNonExec = acc.nonExec + acc.independent
  return acc
}

// ─────────────────────────────────────────────────────────────────────────
// CV LINKAGE AND QUALIFICATION
//
// There are TWO CV stores and they answer different questions:
//   a) director.cv = { name, url, path } — set on upload, always correct
//   b) userCVData/{uid}/cvs             — the PARSED CV, matched on
//                                          personName string comparison
//
// A CV can be uploaded (a) but unparsed or name-mismatched (b). That is a
// different problem from "no CV was ever uploaded" and needs a different
// message to the user, so both states are tracked separately.
// ─────────────────────────────────────────────────────────────────────────
export const findParsedCv = (cvs, name) => (cvs || []).find((c) => sameName(c?.personName, name)) || null

export const functionalRoles = (director) =>
  (director.roles || [])
    .map((r) => (r === "Other" ? director.customRole : r))
    .filter(Boolean)
    .filter((r) => !SEAT_DESCRIPTOR_ROLES.includes(r))

export const TIER_CREDIT = { strong: 1, adequate: 0.75, thin: 0.3, unverified: 0.5 }

export const assessPersonQualification = ({ name, boardRoles, execRoles, uploadedCv, parsedCv, seat, isShareholderLinked, committees }) => {
  const cvText = cvToText(parsedCv)
  const tiersHit = QUALIFICATION_TIERS.filter((t) => cvText && t.patterns.some((p) => p.test(cvText)))
  const highest = tiersHit.slice().sort((a, b) => b.weight - a.weight)[0] || null
  const governanceTrained = !!cvText && GOVERNANCE_TRAINING_PATTERNS.some((p) => p.test(cvText))

  const yearsRaw = Number(parsedCv?.yearsOfExperience)
  const years = Number.isFinite(yearsRaw) && yearsRaw > 0 ? yearsRaw : null

  const domains = BOARD_SKILL_DOMAINS.filter(
    (d) =>
      (boardRoles || []).some((r) => d.directorRoles.includes(r)) ||
      (execRoles || []).some((r) => d.execRoles.includes(r)) ||
      (cvText && d.keywords.some((k) => k.test(cvText)))
  )

  // Four distinct evidence states, deliberately kept apart.
  // "upload-failed" is a cv record on the director row whose url is missing —
  // the row was written but the file never reached storage, so the CV looks
  // present in the UI and is in fact unreadable and unrecoverable.
  const uploadLanded = !!(uploadedCv && uploadedCv.url)
  let evidence
  if (parsedCv) evidence = "parsed"
  else if (uploadLanded) evidence = "uploaded-unparsed"
  else if (uploadedCv) evidence = "upload-failed"
  else evidence = "none"

  let tier
  if (evidence !== "parsed") tier = "unverified"
  else if (highest && highest.weight >= 3 && (years === null || years >= MIN_BOARD_EXPERIENCE_YEARS)) tier = "strong"
  else if (highest) tier = "adequate"
  else tier = "thin"

  return {
    name, seat, evidence, tier,
    // "unverified" scores 0.5, deliberately neutral. A missing CV is a data
    // gap, not proof of an unqualified director, and is raised in the
    // evidence gaps panel rather than punished in the score.
    credit: TIER_CREDIT[tier],
    boardRoles: boardRoles || [],
    execRoles: execRoles || [],
    committees: committees || [],
    isShareholderLinked: !!isShareholderLinked,
    hasUploadedCv: uploadLanded,
    hasCvRecord: !!uploadedCv,
    hasParsedCv: !!parsedCv,
    uploadedCvName: uploadedCv?.name || null,
    highestQualification: highest ? highest.label : null,
    certifications: Array.isArray(parsedCv?.certifications) ? parsedCv.certifications : [],
    governanceTrained,
    years,
    domains: domains.map((d) => d.label),
    domainKeys: domains.map((d) => d.key),
  }
}

// ── Every person holding a governance seat, assessed ──
export const buildQualificationRoster = (validDirectors, validExecutives, advisors, cvProfiles) => {
  const cvs = cvProfiles || []

  const directors = (validDirectors || []).map((d) => {
    const boardRoles = functionalRoles(d)
    const execRow = (validExecutives || []).find((e) => sameName(e.name, d.name))
    const execPos = execRow ? (execRow.position === "Other" ? execRow.customPosition : execRow.position) : null
    const ind = classifyIndependence(d)
    const committees = (d.committeeMembership || []).map((c) => (c === "Other" ? d.customCommittee : c)).filter(Boolean)

    return {
      ...assessPersonQualification({
        name: d.name,
        boardRoles,
        execRoles: execPos ? [execPos] : [],
        uploadedCv: d.cv || execRow?.cv || null,
        parsedCv: findParsedCv(cvs, d.name),
        seat: ind.label,
        isShareholderLinked: ind.isShareholderLinked,
        committees,
      }),
      independenceTier: ind.tier,
      execTypeInferred: ind.inferred,
      doa: d.doa || null,
      functionalRoleCount: boardRoles.length,
    }
  })

  const advisorAssessments = (advisors || []).map((a) =>
    assessPersonQualification({
      name: a.name,
      boardRoles: [],
      execRoles: a.role ? [a.role] : [],
      uploadedCv: a.cv || null,
      parsedCv: findParsedCv(cvs, a.name),
      seat: `Advisor${a.firm ? ` — ${a.firm}` : ""}`,
      committees: [],
    })
  )

  const seatedNames = [...directors, ...advisorAssessments].map((p) => p.name)
  const execNames = (validExecutives || []).map((e) => e.name)
  const unmatchedCvs = cvs
    .filter((c) => c?.personName)
    .filter((c) => ![...seatedNames, ...execNames].some((n) => sameName(n, c.personName)))
    .map((c) => c.personName)

  return {
    directors,
    advisors: advisorAssessments,
    unmatchedCvs,
    cvCount: cvs.length,
    directorCount: directors.length,
    uploadedCount: directors.filter((d) => d.hasUploadedCv).length,
    parsedCount: directors.filter((d) => d.hasParsedCv).length,
    unparsedCount: directors.filter((d) => d.evidence === "uploaded-unparsed").length,
    brokenUploadCount: directors.filter((d) => d.evidence === "upload-failed").length,
    qualifiedCount: directors.filter((d) => d.tier === "strong" || d.tier === "adequate").length,
    governanceTrainedCount: directors.filter((d) => d.governanceTrained).length,
    credit: directors.length ? directors.reduce((s, d) => s + d.credit, 0) / directors.length : 0,
    assessable: directors.some((d) => d.hasParsedCv),
  }
}

// ── Committee coverage, from director.committeeMembership ──
export const assessCommittees = (roster, pis, requirementLevel) => {
  const all = new Set()
  roster.directors.forEach((d) => (d.committees || []).forEach((c) => all.add(c)))

  const expected = EXPECTED_COMMITTEES.filter((c) => c.requiredWhen(pis, requirementLevel))
  const results = expected.map((c) => ({
    key: c.key,
    label: c.label,
    why: c.why,
    present: c.values.some((v) => all.has(v)),
    members: roster.directors.filter((d) => (d.committees || []).some((x) => c.values.includes(x))).map((d) => d.name),
  }))

  return {
    applicable: expected.length > 0,
    anyCaptured: all.size > 0,
    expected: results,
    presentCount: results.filter((r) => r.present).length,
    expectedCount: results.length,
    ratio: results.length ? results.filter((r) => r.present).length / results.length : 1,
    allCommittees: Array.from(all),
  }
}

// ── What is missing, and what should the user send? ──
export const collectEvidenceGaps = (roster, ctx) => {
  const { boardSplit, advisorsDeclared, committees, boardSkills } = ctx
  const out = []
  const push = (severity, what, action) => out.push({ severity, what, action })

  if (roster.directorCount === 0) {
    push("high", "No directors captured",
      "Add every director in the Directors table under Ownership & Management. The directors are the board, so 5.2 and 5.3 cannot be assessed at all without them.")
    return out
  }

  const noCv = roster.directors.filter((d) => d.evidence === "none")
  if (noCv.length) {
    push(roster.uploadedCount === 0 ? "high" : "medium",
      `${noCv.length} of ${roster.directorCount} director${roster.directorCount === 1 ? "" : "s"} ${noCv.length === 1 ? "has" : "have"} no CV uploaded: ${noCv.map((d) => d.name).join(", ")}`,
      "Upload a CV against each director row. Until then the seat is read from job title alone, and the Directors table has no role option for legal, technical, commercial or HR expertise — so a well-qualified board can read as empty.")
  }

  const broken = roster.directors.filter((d) => d.evidence === "upload-failed")
  if (broken.length) {
    push("high",
      `${broken.length} CV${broken.length === 1 ? " shows" : "s show"} as attached but the file never reached storage: ${broken.map((d) => d.name).join(", ")}`,
      "The director row records a CV with no download URL, so the upload failed silently and the file cannot be recovered. Re-upload it once the upload handler is fixed — see uploadDocumentWithSync, which is being called with seven arguments against a three-argument signature.")
  }

  const unparsed = roster.directors.filter((d) => d.evidence === "uploaded-unparsed")
  if (unparsed.length) {
    push("high",
      `${unparsed.length} CV${unparsed.length === 1 ? " is" : "s are"} uploaded but not readable: ${unparsed.map((d) => d.name).join(", ")}`,
      "The file is in storage but no matching parsed record exists. Either extraction failed, or the parsed name does not match the Directors table exactly. Re-upload, or correct the spelling so the two match.")
  }

  if (roster.unmatchedCvs.length) {
    push("medium",
      `${roster.unmatchedCvs.length} parsed CV${roster.unmatchedCvs.length === 1 ? " matches" : "s match"} nobody on the profile: ${roster.unmatchedCvs.join(", ")}`,
      "Names are matched exactly. Correct the spelling on either the CV or the Directors table so the qualification is credited instead of scoring as absent.")
  }

  const thin = roster.directors.filter((d) => d.evidence === "parsed" && d.tier === "thin")
  if (thin.length) {
    push("medium",
      `Readable CV but no formal qualification found: ${thin.map((d) => d.name).join(", ")}`,
      "If the qualification exists, add it under education or certifications on the CV. If it genuinely does not, that is a real board skills finding rather than a data gap.")
  }

  const noYears = roster.directors.filter((d) => d.evidence === "parsed" && d.years === null)
  if (noYears.length) {
    push("low", `Years of experience not captured for: ${noYears.map((d) => d.name).join(", ")}`,
      "Seniority is what separates a qualified director from a qualified employee.")
  }

  if (roster.parsedCount > 0 && roster.governanceTrainedCount === 0) {
    push("low", "No director shows board or governance training",
      "Capture any King IV, IoDSA or directors' development training under certifications. Common to be missing, cheap to fix, and a funder will ask.")
  }

  if (boardSplit && boardSplit.unclassified > 0) {
    push("medium",
      `${boardSplit.unclassified} director${boardSplit.unclassified === 1 ? " is" : "s are"} not classified executive or non-executive`,
      "Set Exec/Non-Exec in the Directors table, or pick Executive Director / Non-Executive Director / Independent Director under Roles — either resolves it. Independence carries 18% of 5.3.")
  }

  if (boardSplit && boardSplit.nonExecLinked > 0 && boardSplit.independent === 0 && boardSplit.nonExec === 0) {
    push("medium",
      `Every non-executive director is also a shareholder (${boardSplit.nonExecLinked})`,
      "This is a finding rather than a data gap, but confirm it is right. If any of them hold no shares, uncheck 'Also Director' on the shareholder row so they read as independent.")
  }

  if (committees && committees.applicable && !committees.anyCaptured) {
    push("medium", "No committee membership captured for any director",
      "Fill in Committee Membership in the Directors table. At this Public Interest Score an audit or risk committee is expected and is currently invisible even if it exists.")
  }

  if (advisorsDeclared && roster.advisors.length === 0) {
    push("medium", "Advisors are declared but none are named",
      "Only the yes/no is captured — there is no advisor table. Until advisor names, disciplines and CVs are recorded, the advisory structure cannot be qualification-checked and carries no weight with a funder.")
  }

  const advisorsNoCv = roster.advisors.filter((a) => a.evidence === "none")
  if (advisorsNoCv.length) {
    push("low", `${advisorsNoCv.length} named advisor${advisorsNoCv.length === 1 ? "" : "s"} without a CV: ${advisorsNoCv.map((a) => a.name).join(", ")}`,
      "Upload advisor CVs so the competency they bring can be credited against the skills matrix.")
  }

  const formGaps = boardSkills?.formGapDomains || []
  if (formGaps.length && roster.parsedCount === 0) {
    push("low",
      `The Directors table has no role option for: ${formGaps.map((d) => d.label).join(", ")}`,
      `These competencies can only be evidenced from a CV in the current form. Adding role options for ${formGaps.map((d) => d.formGap).join("; ")} to the Directors table would let them be captured directly.`)
  }

  return out
}


// ── 5.1 — Does this business need a board? ──
export const deriveBoardRequirement = (pis) => {
  if (pis >= PIS_FULL_BOARD_THRESHOLD) {
    return {
      level: REQ_FORMAL,
      stage: "Full Board Stage",
      label: "Formal board required",
      required: true,
      rationale: `A Public Interest Score of ${pis} sits at or above ${PIS_FULL_BOARD_THRESHOLD}. At this size, headcount and balance-sheet exposure, a properly constituted board with independent non-executive representation is what funders, auditors and the Companies Act reporting thresholds expect. Operating without one is a material governance gap, not a matter of preference.`,
    }
  }
  if (pis >= PIS_EMERGING_THRESHOLD) {
    return {
      level: REQ_INFORMAL,
      stage: "Emerging Board Stage",
      label: "Informal board recommended",
      required: true,
      rationale: `A Public Interest Score of ${pis} falls between ${PIS_EMERGING_THRESHOLD} and ${PIS_FULL_BOARD_THRESHOLD}. The business has outgrown founder-only decision-making: an informal board — even two or three people meeting on a fixed cadence with minutes — is expected at this stage, with at least one voice from outside management.`,
    }
  }
  return {
    level: REQ_ADVISORS,
    stage: "Advisors Stage",
    label: "Advisors sufficient",
    required: false,
    rationale: `A Public Interest Score of ${pis} is below ${PIS_EMERGING_THRESHOLD}. A formal board is not expected yet. What is expected is a named advisory structure the founders actually consult on a regular basis — no structure at all is still a gap.`,
  }
}

// ── 5.2 — Does it actually have one? ──
// THE RULE: named directors ARE the board. A company's directors are its
// board by definition, so if there are directors on record the board exists
// and 5.2 is answered — full stop. There is no "de facto" inference and no
// assuming a board is absent because the governance questions weren't filled
// in. What varies is how well that board is composed and skilled, and that
// is 5.3's job, not this one's.
//
// The only case where the board is genuinely absent is a profile with no
// named directors at all.
export const deriveBoardProvision = (profileData, validDirectors, boardSplit) => {
  const gov = profileData?.governance || {}
  const er = profileData?.enterpriseReadiness || {}
  const om = profileData?.ownershipManagement || {}

  const declaredFlags = [
    gov.hasBoard, gov.boardInPlace, gov.hasFormalBoard, gov.boardEstablished,
    er.hasBoard, er.hasFormalBoard, om.hasBoard,
  ]
  const declaredYes = declaredFlags.some(isYes)
  const boardTypeRaw = String(gov.boardStructure || gov.boardType || gov.boardStage || "")
  const hasAdvisors = isYes(er.hasAdvisors)
  const n = validDirectors.length

  if (n > 0) {
    const bits = []
    if (boardSplit.executive) bits.push(`${boardSplit.executive} executive`)
    if (boardSplit.independent) bits.push(`${boardSplit.independent} independent non-executive`)
    if (boardSplit.nonExec) bits.push(`${boardSplit.nonExec} non-executive`)
    if (boardSplit.nonExecLinked) bits.push(`${boardSplit.nonExecLinked} non-executive but also shareholder${boardSplit.nonExecLinked === 1 ? "" : "s"}`)
    if (boardSplit.unclassified) bits.push(`${boardSplit.unclassified} unclassified`)
    const composition = `${n} named director${n === 1 ? "" : "s"} on record (${bits.join(", ") || "composition not classified"}).`
    const source = declaredYes || boardTypeRaw
      ? `Directors on record${boardTypeRaw ? ` — declared as ${boardTypeRaw}` : ", and a board is declared on the profile"}`
      : "Directors on record — the directors constitute the board"
    return {
      level: PROV_FORMAL,
      label: n === 1 ? "Board in place — sole director" : "Board in place",
      source,
      detail: n === 1
        ? `${composition} A sole director is still the board, but there is no second voice in the room — that is a composition weakness assessed in 5.3, not an absent board.`
        : composition,
    }
  }

  if (hasAdvisors) {
    return {
      level: PROV_ADVISORS,
      label: "Advisors only — no directors on record",
      source: "Declared",
      detail: "An advisory structure is in place, but no directors are named on the profile, so there is no board to assess.",
    }
  }

  return {
    level: PROV_NONE,
    label: "No directors on record",
    source: "Nothing captured on the profile",
    detail: "No directors, advisors or board recorded. Either the board exists and hasn't been captured — in which case complete the Ownership & Management section — or there is genuinely no oversight structure.",
  }
}

// ── 5.3 — Is the board structured correctly? ──
export const assessBoardComposition = (requirement, ctx) => {
  const {
    validDirectors, advisorsMeetRegularly, advisorsMeetingFrequency,
    overloadedPeople, boardSkills, qualificationRoster, committees, boardSplit,
  } = ctx

  const checks = []
  // credit is 0..1 — lets a check score partial marks instead of pass/fail.
  // skip removes a check from BOTH numerator and denominator, so a competency
  // the data cannot speak to reads as "not assessed" rather than as a fail.
  const push = (label, pass, weight, detail, credit, skip) =>
    checks.push({
      label, pass, weight, detail, skip: !!skip,
      credit: credit != null ? credit : (pass ? 1 : 0),
    })

  const n = validDirectors.length
  const minSize = requirement.level === REQ_FORMAL ? 3 : 2
  const skills = boardSkills || { covered: [], missing: [], onBenchOnly: [], formGapDomains: [], ratio: 0, coveredCount: 0, totalDomains: BOARD_SKILL_DOMAINS.length, hasCvEvidence: false }
  const s = boardSplit || { executive: 0, nonExec: 0, nonExecLinked: 0, independent: 0, unclassified: 0, inferredCount: 0 }
  const trulyIndependent = s.nonExec + s.independent

  // ── 1. Does the board carry the skills the business needs? (22%) ──
  // Skipped where there is no CV evidence AND job titles alone cannot reach
  // the competencies: directorRoleOptions has no legal, technical, commercial
  // or HR option, so scoring those as absent would penalise a form limitation.
  const skillsUnevidenced = !skills.hasCvEvidence && skills.coveredCount <= 1
  push(
    "Board skills coverage",
    skills.ratio >= 0.66,
    22,
    n === 0
      ? "Not assessable — no directors on record."
      : skillsUnevidenced
      ? `Not scored. ${skills.coveredCount} of ${skills.totalDomains} competencies match on job title and no director CV has been read. The Directors table has no role option for legal, technical, commercial or HR expertise, so titles alone cannot show what this board knows. Uploading director CVs makes this assessable.`
      : `${skills.coveredCount} of ${skills.totalDomains} core competencies sit on the board: ${skills.covered.map((d) => d.label).join(", ") || "none identified"}.` +
        (skills.missing.length
          ? ` Missing at board level: ${skills.missing.map((d) => d.label).join(", ")}.`
          : " The board covers every core competency.") +
        (skills.onBenchOnly.length
          ? ` ${skills.onBenchOnly.map((d) => d.label).join(", ")} sit${skills.onBenchOnly.length === 1 ? "s" : ""} in management but not at the board table, so ${skills.onBenchOnly.length === 1 ? "it is" : "they are"} not available for oversight.`
          : "") +
        (skills.hasCvEvidence ? "" : " Note: no CVs read, so this is based on job titles alone and understates the board's actual expertise."),
    skills.ratio,
    skillsUnevidenced
  )

  // ── 2. Is each seat held by someone qualified to hold it? (15%) ──
  const r = qualificationRoster
  const qualUnassessable = !r || !r.assessable
  push(
    "Director qualification evidence",
    r ? r.credit >= 0.7 : false,
    15,
    n === 0
      ? "Not assessable — no directors on record."
      : qualUnassessable
      ? `Not scored. ${r ? r.uploadedCount : 0} of ${n} director CV${n === 1 ? " is" : "s are"} uploaded and none have been read into qualification data, so no seat can be verified.`
      : `${r.parsedCount} of ${n} director${n === 1 ? "" : "s"} ${r.parsedCount === 1 ? "has" : "have"} a readable CV; ${r.qualifiedCount} carr${r.qualifiedCount === 1 ? "ies" : "y"} a formal qualification. ` +
        r.directors
          .map((d) => {
            if (d.evidence === "none") return `${d.name}: no CV`
            if (d.evidence === "upload-failed") return `${d.name}: CV attached but the file never uploaded`
            if (d.evidence === "uploaded-unparsed") return `${d.name}: CV uploaded but not readable`
            const bits = [d.highestQualification || "no formal qualification found"]
            if (d.years) bits.push(`${d.years} yrs`)
            if (d.governanceTrained) bits.push("governance training")
            return `${d.name}: ${bits.join(", ")}`
          })
          .join("; ") + ".",
    r ? r.credit : 0,
    qualUnassessable
  )

  // ── 3. Committees (8%) — only where a formal board or PIS >= 500 expects them ──
  const c = committees
  push(
    "Board committees",
    !!c && c.ratio >= 1,
    8,
    !c || !c.applicable
      ? "Not expected at this stage — a board this size can carry audit and remuneration matters in full session."
      : c.expected
          .map((e) => `${e.label}: ${e.present ? `in place (${e.members.join(", ")})` : `not in place — ${e.why}`}`)
          .join(" "),
    c ? c.ratio : 1,
    !c || !c.applicable
  )

  // ── 4. Size (10%) ──
  push(
    "Board size",
    n >= minSize && n <= 8,
    10,
    n === 0
      ? "No named directors."
      : n < minSize
      ? `${n} director${n === 1 ? "" : "s"} — below the ${minSize} expected at this stage. Too few people to spread the skills a board of this business needs to carry.`
      : n > 8
      ? `${n} directors — unusually large for an SME; decision-making slows and accountability blurs.`
      : `${n} directors — appropriate for this stage.`
  )

  // ── 5. Independence (18%) — a shareholder's nominee is not independent ──
  push(
    "Independent presence",
    trulyIndependent >= 1,
    18,
    trulyIndependent >= 1
      ? `${trulyIndependent} non-executive director${trulyIndependent === 1 ? "" : "s"} with no shareholding link${s.independent ? `, ${s.independent} flagged independent` : ""} — there is a voice at the table that does not report to the founder and does not own the company.`
      : s.nonExecLinked > 0
      ? `${s.nonExecLinked} non-executive director${s.nonExecLinked === 1 ? " is also a shareholder" : "s are also shareholders"}. Non-executive is not the same as independent: a shareholder's nominee protects their own capital, not the company's governance. Nobody at this table is independent.`
      : "Every director is executive. The board and the management team are the same people, so nobody at the table is positioned to challenge management decisions."
  )

  // ── 6. Ratio (8%) ──
  const ratio = n > 0 ? trulyIndependent / n : 0
  push(
    "Non-executive ratio",
    ratio >= 1 / 3,
    8,
    n === 0
      ? "Not assessable — no directors."
      : `${Math.round(ratio * 100)}% genuinely non-executive. At least a third is the working benchmark for the board to carry weight.`
  )

  // ── 7. Classification (4%) ──
  push(
    "Exec / non-exec classification complete",
    s.unclassified === 0,
    4,
    s.unclassified === 0
      ? `Every director is classified${s.inferredCount ? ` (${s.inferredCount} inferred from their board role rather than the Exec/Non-Exec field)` : ""}.`
      : `${s.unclassified} director${s.unclassified === 1 ? " is" : "s are"} unclassified — a funder cannot tell who is independent.`
  )

  // ── 8. Cadence (8%) ──
  const cadenceStated = !!advisorsMeetRegularly || /month|quarter|week|annual|bi-/i.test(String(advisorsMeetingFrequency || ""))
  push(
    "Meeting cadence",
    cadenceStated,
    8,
    cadenceStated
      ? `Meets on a stated cadence: ${advisorsMeetingFrequency || "regular"}.`
      : "No meeting cadence recorded. A board that does not meet on a fixed rhythm is a board on paper only."
  )

  // ── 9. Concentration (7%) ──
  const overloaded = overloadedPeople || []
  push(
    "No role concentration on the board",
    overloaded.length === 0,
    7,
    overloaded.length === 0
      ? "No single person holds an unusual concentration of functional or critical operating roles."
      : `${overloaded.map((p) => p.name).join(", ")} carr${overloaded.length === 1 ? "ies" : "y"} multiple critical roles — oversight and execution sit with the same person.`
  )

  const scored = checks.filter((chk) => !chk.skip)
  const total = scored.reduce((acc, chk) => acc + chk.weight, 0) || 1
  const score = Math.round((scored.reduce((acc, chk) => acc + chk.credit * chk.weight, 0) / total) * 100)
  return { checks, score, skippedCount: checks.length - scored.length }
}

// ── Assembles 5.1 + 5.2 + 5.3 into one assessment, with the penalty ──
// ── Assembles 5.1 + 5.2 + 5.3 into one assessment, with the penalty ──
// The roster, committee and independence work is done HERE rather than at the
// call sites, so both callers only have to hand over the raw arrays.
export const buildBoardAssessment = (pis, profileData, ctx) => {
  const { validDirectors, validExecutives, execSplit, cvProfiles } = ctx

  const advisors = ctx.advisors || readAdvisors(profileData)
  const advisorsDeclared = profileData?.enterpriseReadiness?.hasAdvisors === "yes" || isYes(profileData?.enterpriseReadiness?.hasAdvisors)

  const boardSplit = splitBoard(validDirectors)
  const qualificationRoster = buildQualificationRoster(validDirectors, validExecutives, advisors, cvProfiles)

  const requirement = deriveBoardRequirement(pis)
  const provision = deriveBoardProvision(profileData, validDirectors, boardSplit)

  const committees = assessCommittees(qualificationRoster, pis, requirement.level)

  const gap = Math.max(requirement.level - provision.level, 0)
  const penalty = gap > 0 ? BOARD_GAP_PENALTY[gap] || 60 : 0
  const maturityPenalty = gap > 0 ? MATURITY_GAP_PENALTY[gap] || 18 : 0

  const boardExists = provision.level >= PROV_INFORMAL
  const fullCtx = { ...ctx, advisors, boardSplit, qualificationRoster, committees }
  const composition = boardExists
    ? assessBoardComposition(requirement, fullCtx)
    : { checks: [], score: 0, notApplicable: true }

  // Base score before the shortfall penalty
  let base
  if (boardExists) base = composition.score
  else if (provision.level === PROV_ADVISORS) base = requirement.required ? 40 : 75
  else base = requirement.required ? 15 : 30

  const score = clamp100(base - penalty)

  const skills = ctx.boardSkills
  const evidenceGaps = collectEvidenceGaps(qualificationRoster, {
    boardSplit, advisorsDeclared, committees, boardSkills: skills,
  })

  const verdict = gap > 0
    ? `${requirement.label} at a PIS of ${pis}, but what is in place is: ${provision.label.toLowerCase()}. This is a ${gap >= 2 ? "severe" : "material"} governance shortfall and the score is penalised by ${penalty} points to reflect it.`
    : boardExists
    ? `The board exists — the directors on record constitute it. The question is no longer whether there is a board but whether it carries the right skills and enough independence, and that is what 5.3 scores. ${skills && skills.missing.length ? `Right now ${skills.missing.length} of ${skills.totalDomains} core competencies are missing from the table.` : "It currently covers every core competency."}`
    : `A board is not yet expected at a PIS of ${pis}. The advisory structure on record is proportionate for this stage.`

  return {
    pis, requirement, provision, gap, penalty, maturityPenalty,
    composition, boardExists, score, base, verdict, skills,
    boardSplit, qualificationRoster, committees, advisors, advisorsDeclared, evidenceGaps,
  }
}


// ─────────────────────────────────────────────────────────────────────────
// ONE SCORING PATH
//
// Everything below runs on a profile passed in as an argument rather than on
// component state, so the same function can score the real profile and a
// hypothetical one. That is what makes a "+4.2%" promise in Potential points
// measurable rather than estimated: the figure is produced by re-running
// this exact function with the action applied.
// ─────────────────────────────────────────────────────────────────────────

export const pisOf = (profileData) => {
  const employees = parseInt(profileData?.entityOverview?.employeeCount) || 0
  const turnover = parseFloat((profileData?.financialOverview?.annualRevenue || "0").toString().replace(/[R,\s]/g, "")) || 0
  const liabilities = parseFloat((profileData?.financialOverview?.existingDebt || "0").toString().replace(/[R,\s]/g, "")) || 0
  const shareholders = profileData?.ownershipManagement?.shareholders?.length || 1
  return {
    employees, turnover, liabilities, shareholders,
    turnoverComponent: parseFloat((turnover / 1e6).toFixed(2)),
    liabilitiesComponent: parseFloat((liabilities / 1e6).toFixed(2)),
    totalPIS: parseFloat((employees + turnover / 1e6 + liabilities / 1e6 + shareholders).toFixed(2)),
  }
}

// Which critical operating functions are covered, and by whom. A person
// covering two or more buckets, or holding three or more distinct FUNCTIONAL
// board roles, is flagged as spread thin. Seat descriptors ("Chairman",
// "Board of Directors") are excluded so a normal chairman does not trip it.
export const computeRoleCoveragePure = (validDirectors, validExecutives) => {
  const bucketCoverage = {}
  CRITICAL_ROLE_BUCKETS.forEach((b) => (bucketCoverage[b.key] = []))
  const bucketsByPerson = {}

  const registerRole = (name, roleLabel, source) => {
    if (!name || !roleLabel) return
    CRITICAL_ROLE_BUCKETS.forEach((b) => {
      const list = source === "Director" ? b.directorRoles : b.execRoles
      if (list.includes(roleLabel)) {
        bucketCoverage[b.key].push({ name, source })
        if (!bucketsByPerson[name]) bucketsByPerson[name] = new Set()
        bucketsByPerson[name].add(b.label)
      }
    })
  }

  const directorRoleCounts = {}
  ;(validDirectors || []).forEach((d) => {
    const allRoles = (d.roles || []).map((r) => (r === "Other" ? d.customRole : r)).filter(Boolean)
    const funcRoles = allRoles.filter((r) => !SEAT_DESCRIPTOR_ROLES.includes(r))
    directorRoleCounts[d.name] = (directorRoleCounts[d.name] || 0) + funcRoles.length
    allRoles.forEach((r) => registerRole(d.name, r, "Director"))
  })
  ;(validExecutives || []).forEach((e) => {
    const position = e.position === "Other" ? e.customPosition : e.position
    registerRole(e.name, position, "Executive")
  })

  const missingCriticalRoles = CRITICAL_ROLE_BUCKETS.filter((b) => bucketCoverage[b.key].length === 0)

  const overloadedPeople = Object.entries(bucketsByPerson)
    .filter(([, buckets]) => buckets.size >= 2)
    .map(([name, buckets]) => ({ name, buckets: Array.from(buckets), directorRoleCount: directorRoleCounts[name] || 0 }))

  Object.entries(directorRoleCounts).forEach(([name, count]) => {
    if (count >= DIRECTOR_ROLE_OVERLOAD_THRESHOLD && !overloadedPeople.find((p) => p.name === name)) {
      overloadedPeople.push({ name, buckets: [], directorRoleCount: count })
    }
  })

  return { bucketCoverage, missingCriticalRoles, overloadedPeople }
}

export const computeAll = (profileData, cvProfiles) => {
  const om = profileData?.ownershipManagement || {}
  const validDirectors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
  const validExecutives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
  const validShareholders = (om.shareholders || []).filter((s) => s?.name && s.name.trim() !== "")

  const execSplit = validDirectors.reduce((acc, d) => {
    if (d.execType === "Executive") acc.exec++
    else if (d.execType === "Non-Executive") acc.nonExec++
    else acc.unspecified++
    return acc
  }, { exec: 0, nonExec: 0, unspecified: 0 })

  const roleCoverage = computeRoleCoveragePure(validDirectors, validExecutives)
  const pis = pisOf(profileData)

  const board = buildBoardAssessment(pis.totalPIS, profileData, {
    validDirectors,
    execSplit,
    advisorsMeetRegularly: !!profileData?.enterpriseReadiness?.advisorsMeetRegularly,
    advisorsMeetingFrequency: profileData?.enterpriseReadiness?.advisorsMeetingFrequency,
    overloadedPeople: roleCoverage.overloadedPeople,
    boardSkills: computeBoardSkills(validDirectors, validExecutives, cvProfiles),
    validExecutives,
    cvProfiles,
  })

  const gov = calculateGovernanceScore({ ...profileData, ownershipManagement: { ...om, directors: validDirectors } })

  let maturityCategories = (gov.categories || []).map((c) =>
    /board/i.test(c.name) ? { ...c, score: board.score, boardOverride: true } : c
  )
  if (!maturityCategories.some((c) => /board/i.test(c.name))) {
    maturityCategories = [...maturityCategories, { name: "Board Structure", score: board.score, weight: 25, color: "#6D4C41", boardOverride: true }]
  }
  const weightTotal = maturityCategories.reduce((s, c) => s + c.weight, 0) || 1
  const maturityRaw = maturityCategories.reduce((s, c) => s + c.score * (c.weight / weightTotal), 0)
  const maturityScore = clamp100(maturityRaw - board.maturityPenalty)

  const ownership = computeOwnershipStructure(profileData)
  const leadership = computeLeadershipQuality(profileData, cvProfiles, roleCoverage)

  const overallRaw =
    ownership.score * (SECTION_WEIGHTS.ownership / 100) +
    leadership.totalScore * (SECTION_WEIGHTS.leadership / 100) +
    maturityScore * (SECTION_WEIGHTS.maturity / 100)

  const activeConflicts = (om.activeInterests || []).filter(
    (i) => i?.assignedTo && i.businessStatus && i.businessStatus !== "Closed"
  )

  return {
    overall: Math.round(overallRaw),
    overallRaw,
    ownership,
    leadership,
    maturityScore,
    maturityCategories,
    maturityPenalty: board.maturityPenalty,
    board,
    pis,
    roleCoverage,
    structureDetail: {
      shareholderCount: validShareholders.length,
      directorCount: validDirectors.length,
      execDirectors: execSplit.exec,
      nonExecDirectors: execSplit.nonExec,
      unspecifiedDirectors: execSplit.unspecified,
      executiveCount: validExecutives.length,
      hasAdvisors: profileData?.enterpriseReadiness?.hasAdvisors === "yes",
      advisorsMeetRegularly: !!profileData?.enterpriseReadiness?.advisorsMeetRegularly,
      advisorsMeetingFrequency: profileData?.enterpriseReadiness?.advisorsMeetingFrequency || "Not specified",
      activeConflictsCount: activeConflicts.length,
      conflictSummary: activeConflicts.length
        ? activeConflicts.map((i) => `${i.assignedTo} — active interest in ${i.companyName || "unnamed company"} (${i.businessStatus})`).join("; ")
        : "None declared",
      roleCoverage,
    },
  }
}

// The three pillars, in the same shape the Operational Strength card uses for
// its four categories — so the breakdown renders identically on both.
export const buildPillars = (a) => [
  {
    key: "ownership",
    domain: "governance",
    label: "Ownership & Structure",
    color: "#8D6E63",
    weight: SECTION_WEIGHTS.ownership,
    percent: a.ownership.score,
    items: a.ownership.items,
    source: "Ownership & Management",
  },
  {
    key: "leadership",
    domain: "leadership",
    label: "Leadership Quality",
    color: "#6D4C41",
    weight: SECTION_WEIGHTS.leadership,
    percent: a.leadership.totalScore,
    subCategories: a.leadership.categories,
    items: a.leadership.items,
    source: "Ownership & Management, CVs",
  },
  {
    key: "maturity",
    domain: "governance",
    label: "Governance Maturity",
    color: "#A67C52",
    weight: SECTION_WEIGHTS.maturity,
    percent: a.maturityScore,
    subCategories: a.maturityCategories,
    source: "Governance, Board Structure",
  },
].map((p) => ({
  ...p,
  rawScore: Math.round((p.percent / 20) * 10) / 10,
  weightedScore: Math.round(p.percent * (p.weight / 100) * 10) / 10,
  headroom: Math.round((100 - p.percent) * (p.weight / 100) * 10) / 10,
}))

// Domain score is its pillars re-weighted against each other, so Leadership
// reads 0-100 on its own terms rather than as a fraction of the whole card.
export const buildDomains = (pillars) =>
  DOMAINS.map((d) => {
    const members = pillars.filter((p) => d.pillarKeys.includes(p.key))
    const weight = members.reduce((s, p) => s + p.weight, 0)
    const percent = weight ? members.reduce((s, p) => s + p.percent * (p.weight / weight), 0) : 0
    return {
      ...d,
      pillars: members,
      weight,
      percent: Math.round(percent),
      contribution: Math.round(percent * (weight / 100) * 10) / 10,
      headroom: Math.round((100 - percent) * (weight / 100) * 10) / 10,
    }
  })


// ═════════════════════════════════════════════════════════════════════════
