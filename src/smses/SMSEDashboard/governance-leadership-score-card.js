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

const SECTION_WEIGHTS = {
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
const DOMAINS = [
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
const SEAT_DESCRIPTOR_ROLES = [
  "Board of Directors", "Chairman", "Vice-President",
  "Executive Director", "Non-Executive Director", "Independent Director",
]

const NON_EXEC_SIGNAL_ROLES = ["Non-Executive Director", "Independent Director"]
const EXEC_SIGNAL_ROLES = [
  "Executive Director", "Chief Executive Officer", "Chief Financial Officer",
  "Chief Operating Officer", "Managing Director", "General Manager",
  "Regional Manager", "Supervisor", "Office Manager", "Team Leader",
]
const INDEPENDENT_ROLE = "Independent Director"

// directorRoles and execRoles are kept SEPARATE and matched separately,
// because directorRoleOptions and executivePositions are different lists.
// CTO / CIO / IT Manager / CMO / Sales Manager / Marketing Manager /
// Financial Manager exist only in executivePositions — a director can never
// hold them — so matching both against one combined list silently scored
// those buckets as uncovered whenever the holder sat on the board.
const CRITICAL_ROLE_BUCKETS = [
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
const DIRECTOR_ROLE_OVERLOAD_THRESHOLD = 3

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

const PIS_EMERGING_THRESHOLD = 100
const PIS_FULL_BOARD_THRESHOLD = 350

// Requirement ladder (5.1) — how much governance structure is expected
const REQ_ADVISORS = 0
const REQ_INFORMAL = 1
const REQ_FORMAL = 2

// Provision ladder (5.2) — how much governance structure actually exists
const PROV_NONE = -1
const PROV_ADVISORS = 0
const PROV_INFORMAL = 1
const PROV_FORMAL = 2

// Penalty applied to the Board Structure score per step of shortfall
const BOARD_GAP_PENALTY = { 1: 25, 2: 45, 3: 60 }
// Additional penalty applied to the whole Governance Maturity score, so a
// missing board drags the pillar down rather than being diluted by weighting
const MATURITY_GAP_PENALTY = { 1: 6, 2: 12, 3: 18 }

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
const BOARD_SKILL_DOMAINS = [
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
const QUALIFICATION_TIERS = [
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
const GOVERNANCE_TRAINING_PATTERNS = [
  /King\s*I{1,3}V?\b/i, /\bIoDSA\b/i, /institute of directors/i,
  /director'?s?\s+(course|development|programme|program|training|certificate)/i,
  /board\s+(induction|training|effectiveness)/i, /company secretar/i, /corporate governance/i,
]

// Below this a director is carrying a seat on potential rather than track record
const MIN_BOARD_EXPERIENCE_YEARS = 5

// ─────────────────────────────────────────────────────────────────────────
// COMMITTEES — read from director.committeeMembership, which the Directors
// table already captures. A Social & Ethics Committee is compulsory under
// the Companies Act at a Public Interest Score of 500 or more.
// ─────────────────────────────────────────────────────────────────────────
const PIS_SOCIAL_ETHICS_THRESHOLD = 500

const EXPECTED_COMMITTEES = [
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
const ADVISOR_SOURCES = [
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
const computeBoardSkills = (validDirectors, validExecutives, cvProfiles) => {
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
const resolveExecType = (director) => {
  if (director.execType === "Executive" || director.execType === "Non-Executive") {
    return { value: director.execType, inferred: false }
  }
  const roles = director.roles || []
  if (roles.some((r) => NON_EXEC_SIGNAL_ROLES.includes(r))) return { value: "Non-Executive", inferred: true }
  if (roles.some((r) => EXEC_SIGNAL_ROLES.includes(r))) return { value: "Executive", inferred: true }
  return { value: "", inferred: false }
}

const classifyIndependence = (director) => {
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

const splitBoard = (validDirectors) => {
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
const findParsedCv = (cvs, name) => (cvs || []).find((c) => sameName(c?.personName, name)) || null

const functionalRoles = (director) =>
  (director.roles || [])
    .map((r) => (r === "Other" ? director.customRole : r))
    .filter(Boolean)
    .filter((r) => !SEAT_DESCRIPTOR_ROLES.includes(r))

const TIER_CREDIT = { strong: 1, adequate: 0.75, thin: 0.3, unverified: 0.5 }

const assessPersonQualification = ({ name, boardRoles, execRoles, uploadedCv, parsedCv, seat, isShareholderLinked, committees }) => {
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
const buildQualificationRoster = (validDirectors, validExecutives, advisors, cvProfiles) => {
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
const assessCommittees = (roster, pis, requirementLevel) => {
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
const collectEvidenceGaps = (roster, ctx) => {
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
const deriveBoardRequirement = (pis) => {
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
const deriveBoardProvision = (profileData, validDirectors, boardSplit) => {
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
const assessBoardComposition = (requirement, ctx) => {
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
const buildBoardAssessment = (pis, profileData, ctx) => {
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

const pisOf = (profileData) => {
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
const computeRoleCoveragePure = (validDirectors, validExecutives) => {
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

const computeAll = (profileData, cvProfiles) => {
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
const buildPillars = (a) => [
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
const buildDomains = (pillars) =>
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

export function GovernanceLeadershipScoreCard({ styles, profileData, onScoreUpdate, apiKey, onNavigate }) {
  const [showModal, setShowModal] = useState(false)

  // ── One assessment object drives everything, exactly as the Operational
  //    Strength card does. No score is parsed out of AI text. ──
  const [assessment, setAssessment] = useState(null)
  const [potential, setPotential] = useState(null)
  const [overallScore, setOverallScore] = useState(0)

  // Derived views kept in state only because the AI prompt builders and the
  // board panel read them directly.
  const [pisCalculation, setPisCalculation] = useState({
    employees: 0, turnover: 0, liabilities: 0, shareholders: 1,
    turnoverComponent: 0, liabilitiesComponent: 0, totalPIS: 1,
  })
  const [ownershipStructureDetail, setOwnershipStructureDetail] = useState({
    shareholderCount: 0, directorCount: 0, execDirectors: 0, nonExecDirectors: 0,
    unspecifiedDirectors: 0, executiveCount: 0, hasAdvisors: false,
    advisorsMeetRegularly: false, advisorsMeetingFrequency: "",
    activeConflictsCount: 0, conflictSummary: "None declared",
    roleCoverage: { bucketCoverage: {}, missingCriticalRoles: [], overloadedPeople: [] },
  })
  const [boardAssessment, setBoardAssessment] = useState(null)
  const [governanceStage, setGovernanceStage] = useState("")
  const [governanceRecommendation, setGovernanceRecommendation] = useState("")
  const [cvProfiles, setCvProfiles] = useState([])

  // ── AI narrative only. Never a score. ──
  const [leadershipAiResult, setLeadershipAiResult] = useState("")
  const [governanceAiResult, setGovernanceAiResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")

  // ── Panels — same set and same default states as Operational Strength ──
  const [showPotential, setShowPotential] = useState(true)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  const [openItem, setOpenItem] = useState(null)
  const [openPillar, setOpenPillar] = useState("maturity")

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  // CVs are the strongest evidence of what skills sit on the board — a
  // director's title says what they do, their CV says what they can do.
  useEffect(() => {
    const userId = auth?.currentUser?.uid
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, "userCVData", userId, "cvs"))
        if (!cancelled) setCvProfiles(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.error("Error loading CV data for board skills:", e)
      }
    })()
    return () => { cancelled = true }
  }, [auth?.currentUser?.uid])

  // ── Score — a pure function of (profile, CVs). The AI is not in this path. ──
  useEffect(() => {
    if (!profileData) return
    try {
      const a = computeAll(profileData, cvProfiles)
      setAssessment(a)
      setOverallScore(a.overall)
      setPisCalculation(a.pis)
      setBoardAssessment(a.board)
      setGovernanceStage(a.board.requirement.stage)
      setGovernanceRecommendation(a.board.requirement.label)
      setOwnershipStructureDetail(a.structureDetail)
      if (onScoreUpdate) onScoreUpdate(a.overall)
    } catch (e) {
      console.error("Governance scoring error:", e)
    }
  }, [profileData, cvProfiles])

  // ── Potential points — each figure measured by re-running computeAll with
  //    the action applied. Deferred until the modal opens, because it runs
  //    roughly fifteen full simulations. ──
  useEffect(() => {
    if (!showModal || !profileData || !assessment) return
    try {
      setPotential(
        buildOpportunities(profileData, cvProfiles, (p, c) => computeAll(p, c).overall, assessment.leadership)
      )
    } catch (e) {
      console.error("Potential points error:", e)
    }
  }, [showModal, profileData, cvProfiles, assessment])

  const goTo = (route) => {
    if (!route) return
    if (onNavigate) onNavigate(route)
    else window.location.assign(route)
  }

  const prepareLeadershipData = async (userId) => {
    let cvText = ""
    try {
      let cvs = cvProfiles
      if (!cvs.length) {
        const snap = await getDocs(collection(db, "userCVData", userId, "cvs"))
        cvs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      }
      cvText = cvs
        .map((cv) => {
          const lines = []
          if (cv.personName) lines.push(`Name: ${cv.personName}`)
          if (cv.currentRole || cv.currentCompany) lines.push(`Current Role: ${cv.currentRole || "Not specified"} at ${cv.currentCompany || "Not specified"}`)
          if (cv.yearsOfExperience != null) lines.push(`Years of Experience: ${cv.yearsOfExperience}`)
          if (Array.isArray(cv.education) && cv.education.length) {
            lines.push("Education:")
            cv.education.forEach((ed) => lines.push(`  - ${ed.degree || "Degree"} in ${ed.field || "Not specified"}, ${ed.institution || "Not specified"} (${ed.graduationYear || "N/A"})`))
          }
          if (Array.isArray(cv.certifications) && cv.certifications.length) lines.push(`Certifications: ${cv.certifications.join("; ")}`)
          if (Array.isArray(cv.skills) && cv.skills.length) lines.push(`Skills: ${cv.skills.join(", ")}`)
          return lines.join("\n")
        })
        .join("\n\n")
    } catch (e) {
      console.error("Error fetching CV data:", e)
    }

    // ── Ownership & Management structure — feeds Leadership Structure ──
    const om = profileData?.ownershipManagement || {}
    const bl = om.businessLeadership || {}
    const validShareholders = (om.shareholders || []).filter((s) => s?.name && s.name.trim() !== "")
    const validDirectors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
    const validExecutives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
    const shareholderCount = validShareholders.length

    const execSplit = validDirectors.reduce(
      (acc, d) => {
        if (d.execType === "Executive") acc.exec++
        else if (d.execType === "Non-Executive") acc.nonExec++
        else acc.unspecified++
        return acc
      },
      { exec: 0, nonExec: 0, unspecified: 0 }
    )

    // ── Conflict of interest signal — feeds Leadership Behaviour ──
    const activeInterests = om.activeInterests || []
    const previousInterests = om.previousInterests || []
    const activeConflicts = activeInterests.filter((i) => i?.assignedTo && i.businessStatus && i.businessStatus !== "Closed")
    const conflictSummary = activeConflicts.length > 0
      ? activeConflicts.map((i) => `${i.assignedTo} — active interest in ${i.companyName || "unnamed company"} (status: ${i.businessStatus})`).join("; ")
      : "None declared"

    const employeeSummary = `Permanent: ${om.permanentEmployees || 0}, Contract: ${om.contractEmployees || 0}, Internship: ${om.internshipEmployees || 0}, Temporary: ${om.temporaryEmployees || 0}`

    // ── Critical role coverage & role-concentration risk — feeds Leadership
    // Structure (coverage gaps) and Leadership Behaviour (one person spread
    // across multiple critical roles = succession/conflict-of-interest risk) ──
    const roleCoverage = computeRoleCoveragePure(validDirectors, validExecutives)
    const coverageLines = CRITICAL_ROLE_BUCKETS.map((b) => {
      const holders = roleCoverage.bucketCoverage[b.key] || []
      return holders.length > 0
        ? `${b.label}: covered by ${holders.map((h) => `${h.name} (${h.source})`).join(", ")}`
        : `${b.label}: NOT COVERED`
    }).join("\n")
    const overloadSummary = roleCoverage.overloadedPeople.length > 0
      ? roleCoverage.overloadedPeople
          .map((p) => `${p.name} — ${p.buckets.length > 0 ? `covers ${p.buckets.join(" + ")}` : ""}${p.buckets.length > 0 && p.directorRoleCount >= DIRECTOR_ROLE_OVERLOAD_THRESHOLD ? "; " : ""}${p.directorRoleCount >= DIRECTOR_ROLE_OVERLOAD_THRESHOLD ? `holds ${p.directorRoleCount} distinct board roles` : ""}`)
          .join("; ")
      : "None — no individual holds multiple critical roles or an unusually high number of board roles."

    return `
STARTUP LEADERSHIP EVALUATION

Founder/Director Profiles:
${cvText || "No CVs uploaded."}

Business Leadership Data (all 6 questions):
Owner-Led Structure: ${bl.ownerLed || "Not specified"}
Primary Motivation: ${bl.primaryMotivation || "Not specified"}
Growth Ambition (5yr): ${bl.growthAmbition || "Not specified"}
Founder Full-Time Involvement: ${bl.founderFullTime || "Not specified"}
Openness to Advice: ${bl.opennessToAdvice || "Not specified"}
Decision Governance: ${bl.decisionGovernance || "Not specified"}

Ownership & Management Structure:
Number of Shareholders: ${shareholderCount}${shareholderCount > 8 ? " — NOTE: a shareholder count this high for an SME can signal fragmented decision-making, slower governance, and dilution risk; treat this as a structure risk factor rather than automatically positive." : ""}
Number of Directors: ${validDirectors.length} (Executive: ${execSplit.exec}, Non-Executive: ${execSplit.nonExec}, Unspecified: ${execSplit.unspecified})
Number of Executives (management team beyond the board): ${validExecutives.length}
Employee Composition: ${employeeSummary}

Conflict of Interest Signal (from Interests Declaration):
Active outside business interests held by shareholders/directors/executives: ${conflictSummary}
Previous (closed) interests declared: ${previousInterests.length}
${activeConflicts.length > 0 ? "NOTE: Named individuals with active interests in other operating businesses represent a potential conflict of interest for this business. Factor this into Leadership Behaviour — note whether it appears to be transparently disclosed here (it is, since it's declared) versus whether the scale or nature of the interest raises concern (e.g. an active director also running a business in a similar sector)." : ""}

Critical Role Coverage (are the operational functions a business of this type needs actually staffed?):
${coverageLines}
${roleCoverage.missingCriticalRoles.length > 0 ? `NOTE: ${roleCoverage.missingCriticalRoles.map((b) => b.label).join(", ")} ${roleCoverage.missingCriticalRoles.length > 1 ? "are" : "is"} not covered by any named director or executive. Treat any uncovered role as a Leadership Structure gap — flag it explicitly rather than assuming it's handled informally.` : "All critical roles (CEO/MD, Finance, Technology, Sales & Marketing, Operations) have a named person against them."}

Role Concentration / "Spread Thin" Risk (one person covering multiple critical functions, or holding an unusually high number of board roles):
${overloadSummary}
${roleCoverage.overloadedPeople.length > 0 ? "NOTE: A single person covering multiple critical roles (e.g. also acting as CFO and Tech Lead) is a succession and conflict-of-interest risk — that person's attention is divided across functions that would normally be separated, and the business has a single point of failure if they leave or are unavailable. Factor this into Leadership Behaviour as a risk factor, not as evidence of a lean, capable team." : ""}

FORMATTING RULES (apply to every section):
Use bold markdown (**like this**) for every label inside a section — **Assessment:**, **Evidence:**, **How to improve:**, **Rationale:** — so they render as highlighted sub-headings.

RESPONSE FORMAT (follow exactly):

### 1. Leadership Credentials
Score: X/5
Confidence: High | Medium | Low
**Assessment:** (one short paragraph)
**Evidence:** (cite specific data)
**How to improve:** (concrete, specific actions)

### 2. Leadership Structure
Score: X/5
Confidence: High | Medium | Low
**Assessment:** (one short paragraph)
**Evidence:** (cite specific data — including shareholder count/concentration, director exec/non-exec balance, management team depth, and any critical role coverage gaps)
**How to improve:** (concrete, specific actions)

### 3. Leadership Behaviour
Score: X/5
Confidence: High | Medium | Low
**Assessment:** (one short paragraph)
**Evidence:** (cite specific data — including openness to advice, any conflict-of-interest signal from declared active business interests, and any role-concentration / "spread thin" risk from one person holding multiple critical roles)
**How to improve:** (concrete, specific actions)
`
  }

  // ─────────────────────────────────────────────────────────────────────
  // Board Structure prompt addendum — forces the AI narrative to follow the
  // same 5.1 → 5.2 → 5.3 order as the UI, and hands it the deterministic
  // verdict so it cannot write a flattering paragraph that contradicts the
  // score the user is looking at.
  // ─────────────────────────────────────────────────────────────────────
  const buildBoardPromptAddendum = (board) => {
    if (!board) return ""
    const gapLine = board.gap > 0
      ? `SHORTFALL: YES — ${board.gap} step${board.gap === 1 ? "" : "s"} below what is required. A ${board.penalty}-point penalty has already been applied to the Board Structure score.`
      : "SHORTFALL: NONE — what is in place meets what the PIS calls for."

    const compositionLines = board.composition?.checks?.length
      ? board.composition.checks.map((c) => `- ${c.label}: ${c.pass ? "PASS" : "FAIL"} — ${c.detail}`).join("\n")
      : "- Not assessable: there are no directors on record."

    const s = board.skills
    const skillLines = s
      ? BOARD_SKILL_DOMAINS.map((d) => {
          const onBoard = s.boardCoverage[d.key] || []
          const bench = s.benchCoverage[d.key] || []
          if (onBoard.length) return `- ${d.label}: ON THE BOARD — ${onBoard.map((h) => `${h.name} (${h.basis})`).join(", ")}`
          if (bench.length) return `- ${d.label}: NOT ON THE BOARD — sits in management only (${bench.map((h) => h.name).join(", ")}), so it is not available for oversight`
          return `- ${d.label}: ABSENT — nobody on the board or in management covers this`
        }).join("\n")
      : "- Skills matrix unavailable."

    // Per-person qualification lines — the CV evidence behind each seat
    const r = board.qualificationRoster
    const personLine = (p) =>
      `- ${p.name} (${p.seat}${p.boardRoles.length ? `, ${p.boardRoles.join(" / ")}` : ""}${p.committees.length ? `; committees: ${p.committees.join(", ")}` : ""}): ` +
      (p.evidence === "parsed"
        ? `${p.highestQualification || "no formal qualification found on the CV"}${p.years ? `, ${p.years} years' experience` : ", experience not stated"}${p.governanceTrained ? ", has governance training" : ", no governance training evident"}${p.domains.length ? `, brings ${p.domains.join(" + ")}` : ", maps to no board competency"}`
        : p.evidence === "upload-failed"
        ? "CV ATTACHED BUT THE FILE NEVER UPLOADED — qualification unverified through no fault of the director"
        : p.evidence === "uploaded-unparsed"
        ? "CV UPLOADED BUT NOT READABLE — qualification unverified"
        : "NO CV ON FILE — qualification unverified, assessed on job title only")

    const qualificationLines = r
      ? `Directors on record: ${r.directorCount}. CVs uploaded: ${r.uploadedCount}. CVs readable: ${r.parsedCount}. Carrying a verified formal qualification: ${r.qualifiedCount}. With governance training: ${r.governanceTrainedCount}.
${r.directors.map(personLine).join("\n") || "- None."}
${r.advisors.length ? `Named advisors:\n${r.advisors.map(personLine).join("\n")}` : "Named advisors: none captured on the profile."}`
      : "Qualification roster unavailable."

    const bs = board.boardSplit || {}
    const independenceLines = `Executive: ${bs.executive || 0}. Non-executive with no shareholding: ${bs.nonExec || 0}. Flagged independent: ${bs.independent || 0}. Non-executive but ALSO A SHAREHOLDER (therefore NOT independent): ${bs.nonExecLinked || 0}. Unclassified: ${bs.unclassified || 0}.`

    const cm = board.committees
    const committeeLines = cm && cm.applicable
      ? cm.expected.map((e) => `- ${e.label}: ${e.present ? `IN PLACE — ${e.members.join(", ")}` : `NOT IN PLACE — ${e.why}`}`).join("\n")
      : "- Not expected at this Public Interest Score / board stage."

    const gapLines = (board.evidenceGaps || []).length
      ? board.evidenceGaps.map((g) => `- [${g.severity.toUpperCase()}] ${g.what} -> ${g.action}`).join("\n")
      : "- None. Every seat is named, classified and CV-backed."

    const boardExistsRule = board.boardExists
      ? `THE BOARD EXISTS. ${board.provision.detail} The directors on record ARE the board — a company's directors constitute its board by definition. Do NOT write that the business "has no board", "has not yet established a board", "lacks a formal board", or that it "should form a board". Do not describe the board as informal, de facto, or notional. Where the board is weak, say precisely what it is missing — a competency, an independent voice, a meeting rhythm — never that it is missing.`
      : `There are no directors on record at all, so there is genuinely nothing to assess. Say so plainly, and note that if directors do exist the Ownership & Management section needs completing.`

    return `

BOARD STRUCTURE — MANDATORY STRUCTURE AND DETERMINISTIC FACTS

${boardExistsRule}

Write the "Board Structure" section using exactly these three numbered sub-headings, in this order, each in bold:

**5.1 Does this business need a board?**
**5.2 Does it have one, and who sits on it?**
**5.3 Is it structured and skilled correctly?**

Under each, use bold labels: **Assessment:**, **Rationale:**, **How to improve:**.

You must not contradict the deterministic facts below. Restate them in plain language and explain the consequence for the business.

5.1 REQUIREMENT
Public Interest Score: ${board.pis}
Stage: ${board.requirement.stage}
Requirement: ${board.requirement.label}
Rationale: ${board.requirement.rationale}

5.2 WHAT IS ACTUALLY IN PLACE
Finding: ${board.provision.label}
Basis: ${board.provision.source} — ${board.provision.detail}
${gapLine}

5.3 BOARD SKILLS MATRIX (the largest single component of 5.3, 22%)
${skillLines}
Coverage: ${s ? `${s.coveredCount} of ${s.totalDomains} core competencies sit on the board` : "unknown"}.${s && !s.hasCvEvidence ? " No CVs have been uploaded, so this matrix is built from job titles alone — say explicitly that uploading director CVs would sharpen the assessment, and do not treat an uncovered domain as proof the skill is absent." : ""}

5.3 DIRECTOR & ADVISOR QUALIFICATION EVIDENCE (15% of 5.3)
${qualificationLines}

5.3 INDEPENDENCE
${independenceLines}
A non-executive director who is also a shareholder is NOT independent. Do not describe them as independent, and do not count them towards independent representation.

5.3 COMMITTEES (8% of 5.3, where applicable)
${committeeLines}

EVIDENCE GAPS — this exact list is displayed to the user in the app, alongside a request to supply the missing items:
${gapLines}

5.3 COMPOSITION CHECKS
${compositionLines}

DETERMINISTIC BOARD STRUCTURE SCORE (after penalty): ${board.score}/100

SCORING INSTRUCTION: convert ${board.score}/100 to the nearest 0.5 on a 5-point scale and do not score Board Structure above it.
${board.gap > 0
  ? "Because the business needs a governance structure it does not have, state plainly in 5.2 that this is a material governance failing and name the funding consequence."
  : "Do not inflate the score for the mere existence of a board — the board existing is the baseline, not an achievement. The skills matrix and composition checks in 5.3 are what carry the marks."}

WHAT 5.3 MUST DO: assess the skills sitting around this board table, one competency at a time. For each gap, name the competency, say what decision the board is currently unequipped to interrogate because of it (e.g. no financial skill means nobody can challenge management's own numbers), and describe the specific person who would close it — their qualification, sector background and whether they should be executive or non-executive (e.g. "a non-executive with a CA(SA) and SME lending experience"). Where a competency sits in management but not on the board, say that the skill exists in the business but is not available for oversight, because management cannot hold itself to account. Recommendations must be about strengthening, skilling or diversifying the existing board — never about forming one.

HOW TO HANDLE MISSING EVIDENCE: where a director has NO CV on file, or a CV that could not be read, do NOT treat that as evidence they are unqualified and do NOT score them down for it. Say plainly that the seat is unverified, that the assessment is running on job title alone, and that supplying the CV would change the finding. Where a readable CV shows a qualification that does not match the seat — a marketing background in the finance seat, for instance — name that mismatch explicitly. Note also that the Directors table offers no role option for legal, technical, commercial or HR expertise, so a director qualified in those areas is invisible unless their CV is read: never conclude a competency is absent from the board on the strength of job titles alone.
`
  }

  const runAiEvaluation = async () => {
    if (!apiKey?.trim()) { setEvaluationError("API key not configured."); return }
    if (!profileData) { setEvaluationError("No profile data."); return }

    setIsEvaluating(true)
    setEvaluationError("")

    try {
      const userId = auth?.currentUser?.uid
      const functions = getFunctions()
      const generateLeadershipAnalysis = httpsCallable(functions, "generateLeadershipAnalysis")
      const generateGovernanceAnalysis = httpsCallable(functions, "generateGovernanceAnalysis")

      // Rebuild the board assessment at call time so the prompt is never
      // built from stale state.
      const om = profileData?.ownershipManagement || {}
      const validDirectors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
      const validExecutives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
      const execSplit = validDirectors.reduce(
        (acc, d) => {
          if (d.execType === "Executive") acc.exec++
          else if (d.execType === "Non-Executive") acc.nonExec++
          else acc.unspecified++
          return acc
        },
        { exec: 0, nonExec: 0, unspecified: 0 }
      )
      const roleCoverage = computeRoleCoveragePure(validDirectors, validExecutives)
      const pisCalc = pisOf(profileData)
      const board = buildBoardAssessment(pisCalc.totalPIS, profileData, {
        validDirectors,
        execSplit,
        advisorsMeetRegularly: !!profileData?.enterpriseReadiness?.advisorsMeetRegularly,
        advisorsMeetingFrequency: profileData?.enterpriseReadiness?.advisorsMeetingFrequency,
        overloadedPeople: roleCoverage.overloadedPeople,
        boardSkills: computeBoardSkills(validDirectors, validExecutives, cvProfiles),
        validExecutives,
        cvProfiles,
      })

      const stage = board.requirement.stage
      const recommendation = board.requirement.label

      const leadershipPrompt = await prepareLeadershipData(userId)
      const governancePrompt =
        // buildGovernancePrompt reads pisCalc.employees / .turnover / .liabilities
        // / .shareholders for the PIS block. Passing only totalPIS left every one
        // of those lines reading zero in the prompt.
        buildGovernancePrompt(profileData, pisCalc, stage, recommendation) +
        buildBoardPromptAddendum(board)

      const [leadershipResp, governanceResp] = await Promise.all([
        generateLeadershipAnalysis({ prompt: leadershipPrompt }),
        generateGovernanceAnalysis({ prompt: governancePrompt }),
      ])

      const leadershipText = leadershipResp?.data?.content
      const governanceText = governanceResp?.data?.content
      if (!leadershipText && !governanceText) throw new Error("Invalid response format from server")

      if (leadershipText) setLeadershipAiResult(leadershipText)
      if (governanceText) setGovernanceAiResult(governanceText)

      if (userId) {
        if (leadershipText) {
          await setDoc(doc(db, "aiLeadershipEvaluation", userId), {
            result: leadershipText, timestamp: new Date(), profileSnapshot: profileData,
          }, { merge: true })
        }
        if (governanceText) {
          await setDoc(doc(db, "aiGovernanceEvaluation", userId), {
            result: governanceText, timestamp: new Date(), profileSnapshot: profileData,
          }, { merge: true })
        }
      }
    } catch (error) {
      console.error("Governance & Leadership AI evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  // ── Load saved evaluations + auto-trigger listener ──
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) return
    const userId = auth.currentUser.uid
    const profileRef = doc(db, "universalProfiles", userId)
    const leadershipRef = doc(db, "aiLeadershipEvaluation", userId)
    const governanceRef = doc(db, "aiGovernanceEvaluation", userId)

    const unsubscribe = onSnapshot(profileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        const needsRun = data.triggerLeadershipEvaluation === true || data.triggerGovernanceEvaluation === true
        if (needsRun && !isEvaluating) {
          await runAiEvaluation()
          await updateDoc(profileRef, { triggerLeadershipEvaluation: false, triggerGovernanceEvaluation: false })
        }
      }
      try {
        const [leadershipSnap, governanceSnap] = await Promise.all([getDoc(leadershipRef), getDoc(governanceRef)])
        if (leadershipSnap.exists() && leadershipSnap.data().result) setLeadershipAiResult(leadershipSnap.data().result)
        if (governanceSnap.exists() && governanceSnap.data().result) setGovernanceAiResult(governanceSnap.data().result)
      } catch (e) {
        console.error("Error loading saved evaluations:", e)
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, apiKey])

  // ─────────────────────────────────────────────────────────────────────

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20"
    if (score >= 81) return "#4CAF50"
    if (score >= 61) return "#FF9800"
    if (score >= 41) return "#F44336"
    return "#B71C1C"
  }

  const getScoreLevel = (score) => {
    if (score >= 91) return { level: "Scaler", color: "#1B5E20", icon: CheckCircle, description: "High ambition + high execution" }
    if (score >= 81) return { level: "Builder", color: "#4CAF50", icon: CheckCircle, description: "High commitment + strong execution" }
    if (score >= 61) return { level: "Visionary", color: "#FF9800", icon: TrendingUp, description: "High ambition but weaker execution" }
    if (score >= 41) return { level: "Survivalist", color: "#F44336", icon: AlertCircle, description: "Moderate commitment, limited ambition" }
    return { level: "Passenger", color: "#B71C1C", icon: AlertCircle, description: "Low commitment / passive leadership" }
  }

  const scoreLevel = getScoreLevel(overallScore)
  const ScoreIcon = scoreLevel.icon

  // ─────────────────────────────────────────────────────────────────────
  // Rich text rendering for AI output.
  // Labels the model writes inside a section — "Assessment:", "How to
  // improve:", "Rationale:", "Evidence:" and friends — are pulled out and
  // rendered as bold, highlighted sub-headings instead of being lost in a
  // wall of pre-wrapped text. Numbered sub-headings (5.1, 5.2, 5.3) get
  // their own heavier treatment with a rule underneath.
  // ─────────────────────────────────────────────────────────────────────
  const HIGHLIGHT_LABELS = [
    "assessment", "how to improve", "improvement", "improve", "rationale", "reasoning",
    "evidence", "confidence", "score", "recommendation", "recommendations", "requirement",
    "finding", "findings", "verdict", "gap", "risk", "risks", "impact", "current state",
    "why this matters", "next steps", "action", "actions", "strengths", "weaknesses",
    "what good looks like", "funder view", "consequence",
  ]

  const SUBHEADING_LINE = /^\s*(\d+\.\d+[\s.):-]+\S.{0,90})$/
  const LABEL_LINE = /^\s*(?:[-•*]\s*)?((?:\d+(?:\.\d+)*\s+)?[A-Za-z][A-Za-z0-9 /&'()–-]{1,44}):\s*(.*)$/

  const stripMd = (s) => String(s || "").replace(/\*\*/g, "").trim()

  // Inline **bold** support
  const renderInline = (text, keyPrefix) => {
    const src = String(text)
    const re = /\*\*(.+?)\*\*/g
    const parts = []
    let last = 0
    let m
    let i = 0
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) parts.push(src.slice(last, m.index))
      parts.push(
        <strong key={`${keyPrefix}-b${i++}`} style={{ color: "#4e342e", fontWeight: 700 }}>{m[1]}</strong>
      )
      last = m.index + m[0].length
    }
    if (last < src.length) parts.push(src.slice(last))
    return parts.length ? parts : src
  }

  const renderRichText = (text) =>
    String(text).split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: "7px" }} />

      const bare = stripMd(line)

      // 5.1 / 5.2 / 5.3 style sub-headings
      const sub = bare.match(SUBHEADING_LINE)
      if (sub && !/:/.test(bare.slice(0, 6))) {
        return (
          <div key={i} style={{
            fontWeight: 800, color: "#4e342e", fontSize: "13.5px",
            margin: i === 0 ? "0 0 6px 0" : "16px 0 6px 0",
            paddingBottom: "5px", borderBottom: "2px solid #e6d3c4",
            letterSpacing: "0.2px",
          }}>
            {sub[1]}
          </div>
        )
      }

      // "Assessment:", "How to improve:", "Rationale:" etc.
      const m = bare.match(LABEL_LINE)
      if (m) {
        const labelKey = m[1].toLowerCase().replace(/^\d+(\.\d+)*\s+/, "").trim()
        if (HIGHLIGHT_LABELS.some((l) => labelKey === l || labelKey.startsWith(l))) {
          return (
            <div key={i} style={{ margin: "10px 0 3px 0" }}>
              <span style={{
                fontWeight: 800, color: "#4e342e", backgroundColor: "#f3e8dc",
                padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                textTransform: "uppercase", letterSpacing: "0.6px",
                border: "1px solid #e6d3c4", display: "inline-block",
              }}>
                {m[1]}
              </span>
              {m[2] ? <span style={{ marginLeft: "8px" }}>{renderInline(m[2], i)}</span> : null}
            </div>
          )
        }
      }

      // Bullets
      if (/^\s*[-•*]\s+/.test(line)) {
        return (
          <div key={i} style={{ display: "flex", gap: "8px", margin: "3px 0 3px 4px" }}>
            <span style={{ color: "#a1887f" }}>•</span>
            <span>{renderInline(line.replace(/^\s*[-•*]\s+/, ""), i)}</span>
          </div>
        )
      }

      return <div key={i} style={{ margin: "3px 0" }}>{renderInline(line, i)}</div>
    })

  // injections: { "keyword": <JSX> } or { "keyword": { position: "top"|"bottom", content: <JSX> } }
  // The keyword is matched case-insensitively against the ### section heading. A "top"
  // injection renders directly under the section heading and above the AI text — used for
  // the Board Structure panel, where PIS has to be read before the narrative makes sense.
  const formatAiResult = (text, injections = {}) => {
    if (!text) return null
    const sections = String(text).split(/(?=###\s)/g)
    return sections.map((section, index) => {
      const trimmed = section.trim()
      if (!trimmed) return null

      const headingMatch = trimmed.match(/^###\s*(.+?)(?=\s+Score\s*:|\n|$)/i)
      const rawHeading = headingMatch ? headingMatch[1].trim() : null
      const heading = rawHeading ? stripMd(rawHeading) : null
      const rest = rawHeading
        ? trimmed.slice(trimmed.indexOf(rawHeading) + rawHeading.length).replace(/^###\s*/, "").trim()
        : trimmed.replace(/^###\s*/, "")

      // Find a matching injection for this heading (case-insensitive substring)
      const found = heading
        ? (Object.entries(injections).find(([key]) => heading.toLowerCase().includes(key.toLowerCase())) || [])[1]
        : undefined
      const injectedContent = found && found.content !== undefined ? found.content : found
      const injectPosition = found && found.position ? found.position : "bottom"
      const hasTop = !!injectedContent && injectPosition === "top"
      const hasBottom = !!injectedContent && injectPosition === "bottom"

      const panelStyle = {
        backgroundColor: "#efebe9",
        border: "1px solid #e8d8cf",
        padding: "14px 16px",
      }

      return (
        <div key={index} style={{ marginBottom: "15px" }}>
          {heading && (
            <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: "700", fontSize: "13px" }}>
              {heading}
            </div>
          )}

          {/* Injected data panel above the narrative (PIS-first for Board Structure) */}
          {hasTop && (
            <div style={{ ...panelStyle, borderTop: heading ? "none" : panelStyle.border, borderBottom: "1px dashed #d7ccc8", borderRadius: heading ? "0" : "8px 8px 0 0" }}>
              <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                Supporting data
              </div>
              {injectedContent}
            </div>
          )}

          {/* AI text */}
          <div style={{
            fontSize: "14px", lineHeight: "1.6", color: "#6d4c41",
            backgroundColor: "white", padding: "16px",
            borderRadius: heading ? (hasBottom ? "0" : "0 0 8px 8px") : "8px",
            border: "1px solid #e8d8cf",
            borderTop: heading || hasTop ? "none" : "1px solid #e8d8cf",
            borderBottom: hasBottom ? "none" : "1px solid #e8d8cf",
          }}>
            {renderRichText(rest || trimmed)}
          </div>

          {/* Injected data panel below the narrative (default) */}
          {hasBottom && (
            <div style={{ ...panelStyle, borderTop: "1px dashed #d7ccc8", borderRadius: "0 0 8px 8px" }}>
              <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                Supporting data
              </div>
              {injectedContent}
            </div>
          )}
        </div>
      )
    }).filter(Boolean)
  }

  const o = ownershipStructureDetail
  const b = boardAssessment

  // ─────────────────────────────────────────────────────────────────────
  // Board Structure panel — PIS first, then 5.1 → 5.2 → 5.3.
  // Rendered both as the "top" injection inside the AI's Board Structure
  // section and as the fallback before AI loads, so the assessment is
  // always visible.
  // ─────────────────────────────────────────────────────────────────────
  const stepHeading = (num, text) => (
    <div style={{
      fontWeight: 800, color: "#4e342e", fontSize: "12.5px",
      marginBottom: "6px", paddingBottom: "4px", borderBottom: "2px solid #e6d3c4",
      display: "flex", alignItems: "center", gap: "8px",
    }}>
      <span style={{
        backgroundColor: "#8d6e63", color: "white", borderRadius: "4px",
        padding: "1px 6px", fontSize: "11px", fontWeight: 800, letterSpacing: "0.4px",
      }}>{num}</span>
      <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{text}</span>
    </div>
  )

  const labelChip = (text) => (
    <span style={{
      fontWeight: 800, color: "#4e342e", backgroundColor: "#f3e8dc",
      padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px",
      textTransform: "uppercase", letterSpacing: "0.6px",
      border: "1px solid #e6d3c4", display: "inline-block", marginRight: "8px",
    }}>{text}</span>
  )

  // ── Qualification tiers → dot colour and wording ──
  const QUAL_TIER_STYLE = {
    strong: { dot: "#1B5E20", label: "Evidenced" },
    adequate: { dot: "#4CAF50", label: "Adequate" },
    thin: { dot: "#FF9800", label: "Thin evidence" },
    unverified: { dot: "#9e9e9e", label: "Unverified" },
  }

  const PersonQualificationRow = ({ p }) => {
    const t = QUAL_TIER_STYLE[p.tier] || QUAL_TIER_STYLE.unverified
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, backgroundColor: t.dot }} />
        <span>
          <strong style={{ color: "#4e342e" }}>{p.name}</strong>
          <span style={{ color: "#a1887f", fontSize: "11px" }}>
            {" "}· {p.seat}
            {p.boardRoles.length ? ` · ${p.boardRoles.join(", ")}` : ""}
            {p.committees.length ? ` · ${p.committees.join(", ")}` : ""}
          </span>
          <br />
          {p.evidence === "parsed" ? (
            <span style={{ color: "#6d4c41" }}>
              {p.highestQualification || "No formal qualification found on the CV"}
              {p.years ? ` · ${p.years} years' experience` : ""}
              {p.governanceTrained ? " · board/governance training" : ""}
              {p.domains.length ? ` · brings ${p.domains.join(", ")}` : " · does not map to a board competency"}
            </span>
          ) : p.evidence === "upload-failed" ? (
            <span style={{ color: "#B71C1C" }}>
              A CV{p.uploadedCvName ? ` (${p.uploadedCvName})` : ""} is attached to this director but the file never reached storage — it looks uploaded and is not. Re-upload it.
            </span>
          ) : p.evidence === "uploaded-unparsed" ? (
            <span style={{ color: "#8a5a00" }}>
              CV uploaded{p.uploadedCvName ? ` (${p.uploadedCvName})` : ""} but not yet readable — the qualification behind this seat cannot be verified.
            </span>
          ) : (
            <span style={{ color: "#8d6e63" }}>
              No CV on file — this seat is read from job title alone, so the qualification behind it is unverified rather than absent.
            </span>
          )}
        </span>
      </div>
    )
  }

  const GAP_SEVERITY_STYLE = {
    high: { bg: "#fdecea", border: "#e6b8ac", text: "#B71C1C", label: "Blocking" },
    medium: { bg: "#fff6e8", border: "#e8d0a8", text: "#8a5a00", label: "Weakens the score" },
    low: { bg: "#f5f2f0", border: "#e6d3c4", text: "#6d4c41", label: "Sharpens the score" },
  }

  const boardStructurePanel = !b ? null : (
    <div style={{ fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7 }}>

      {/* PIS — read this first; it drives 5.1 */}
      <div style={{ padding: "12px 14px", background: "white", borderRadius: "8px", border: "1px solid #e6d3c4", marginBottom: "14px" }}>
        <div style={{ fontWeight: 800, color: "#4e342e", marginBottom: "8px", fontSize: "12.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Public Interest Score (PIS)
        </div>
        <div>Employees: <strong>{pisCalculation.employees}</strong></div>
        <div>Annual turnover: <strong>R {pisCalculation.turnover.toLocaleString()}</strong> → {pisCalculation.turnoverComponent}</div>
        <div>Liabilities: <strong>R {pisCalculation.liabilities.toLocaleString()}</strong> → {pisCalculation.liabilitiesComponent}</div>
        <div>Shareholders: <strong>{pisCalculation.shareholders}</strong></div>
        <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "12px", backgroundColor: "#f9f5f0", padding: "7px 9px", borderRadius: "6px", border: "1px solid #e6d3c4" }}>
          PIS = {pisCalculation.employees} + {pisCalculation.turnoverComponent} + {pisCalculation.liabilitiesComponent} + {pisCalculation.shareholders} = <strong>{pisCalculation.totalPIS}</strong>
        </div>
      </div>

      {/* 5.1 — Does this business need a board? */}
      <div style={{ marginBottom: "14px" }}>
        {stepHeading("5.1", "Does this business need a board?")}
        <div style={{ marginBottom: "5px" }}>
          {labelChip("Requirement")}
          <strong style={{ color: "#4e342e" }}>{b.requirement.label}</strong>
          <span style={{ marginLeft: "6px", color: "#8d6e63" }}>({b.requirement.stage}, PIS {b.pis})</span>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "8px 0" }}>
          {[
            { label: `Advisors sufficient — PIS < ${PIS_EMERGING_THRESHOLD}`, active: b.requirement.level === REQ_ADVISORS },
            { label: `Informal board — PIS ${PIS_EMERGING_THRESHOLD}–${PIS_FULL_BOARD_THRESHOLD - 1}`, active: b.requirement.level === REQ_INFORMAL },
            { label: `Formal board — PIS ≥ ${PIS_FULL_BOARD_THRESHOLD}`, active: b.requirement.level === REQ_FORMAL },
          ].map((band, i) => (
            <span key={i} style={{
              padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: band.active ? 700 : 500,
              backgroundColor: band.active ? "#8d6e63" : "#f5f2f0",
              color: band.active ? "white" : "#a1887f",
              border: `1px solid ${band.active ? "#6d4c41" : "#e6d3c4"}`,
            }}>{band.label}</span>
          ))}
        </div>
        <div>{labelChip("Rationale")}<span>{b.requirement.rationale}</span></div>
      </div>

      {/* 5.2 — Does it have one, and who sits on it? */}
      <div style={{ marginBottom: "14px" }}>
        {stepHeading("5.2", "Does it have one, and who sits on it?")}
        <div style={{ marginBottom: "5px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{
            display: "inline-block", width: "9px", height: "9px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
            backgroundColor: b.gap > 0 ? "#B71C1C" : "#4CAF50",
          }} />
          <span>
            {labelChip("Finding")}
            <strong style={{ color: b.gap > 0 ? "#B71C1C" : "#2E7D32" }}>{b.provision.label}</strong>
          </span>
        </div>
        <div style={{ marginBottom: "5px" }}>{labelChip("Basis")}<span>{b.provision.source} — {b.provision.detail}</span></div>

        {b.gap > 0 ? (
          <div style={{ marginTop: "9px", padding: "11px 13px", background: "#fdecea", borderRadius: "8px", border: "1px solid #e6b8ac" }}>
            <div style={{ fontWeight: 800, color: "#B71C1C", marginBottom: "5px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <AlertCircle size={14} /> Required but not in place — penalty applied
            </div>
            <div style={{ color: "#8d3a2e", lineHeight: 1.7 }}>
              {b.verdict} A funder reads a missing board as unchecked founder risk: there is no one with standing to challenge a bad decision before it is made.
              <div style={{ marginTop: "7px", fontFamily: "monospace", fontSize: "11.5px", background: "white", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e6b8ac", color: "#8d3a2e" }}>
                Board Structure = {b.base} − {b.penalty} penalty = <strong>{b.score}%</strong> · Governance Maturity − {b.maturityPenalty} points
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: "9px", padding: "11px 13px", background: "#f1f8f1", borderRadius: "8px", border: "1px solid #c8e6c9", color: "#2E7D32", lineHeight: 1.7 }}>
            <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <CheckCircle size={14} /> No shortfall
            </div>
            {b.verdict}
          </div>
        )}
      </div>

      {/* 5.3 — Is it structured and skilled correctly? */}
      <div>
        {stepHeading("5.3", "Is it structured and skilled correctly?")}
        {b.boardExists ? (
          <>
            {/* Board skills matrix — the largest single component of 5.3 */}
            {b.skills && (
              <div style={{ marginBottom: "12px", padding: "11px 13px", background: "white", borderRadius: "8px", border: "1px solid #e6d3c4" }}>
                <div style={{ marginBottom: "8px" }}>
                  {labelChip("Board skills")}
                  <strong style={{ color: getProgressBarColor(Math.round(b.skills.ratio * 100)) }}>
                    {b.skills.coveredCount} of {b.skills.totalDomains}
                  </strong>
                  <span style={{ color: "#8d6e63" }}> core competencies sit at the board table</span>
                </div>
                {BOARD_SKILL_DOMAINS.map((d) => {
                  const onBoard = b.skills.boardCoverage?.[d.key] || []
                  const bench = b.skills.benchCoverage?.[d.key] || []
                  const state = onBoard.length ? "board" : bench.length ? "bench" : "absent"
                  const dot = state === "board" ? "#4CAF50" : state === "bench" ? "#FF9800" : "#F44336"
                  return (
                    <div key={d.key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, backgroundColor: dot }} />
                      <span>
                        <strong style={{ color: "#4e342e" }}>{d.label}:</strong>{" "}
                        {state === "board" && (
                          <span>{onBoard.map((h) => `${h.name} — ${h.basis}`).join("; ")}</span>
                        )}
                        {state === "bench" && (
                          <span style={{ color: "#8d6e63" }}>
                            {bench.map((h) => h.name).join(", ")} — in management, not on the board, so it isn't available for oversight
                          </span>
                        )}
                        {state === "absent" && (
                          <span style={{ color: "#B71C1C", fontWeight: 600 }}>Not covered anywhere — skills gap</span>
                        )}
                      </span>
                    </div>
                  )
                })}
                {!b.skills.hasCvEvidence && (
                  <div style={{ marginTop: "8px", fontStyle: "italic", color: "#8d6e63", fontSize: "11.5px" }}>
                    Built from job titles only — no director CVs uploaded. Uploading them will surface qualifications the titles don't show.
                  </div>
                )}
              </div>
            )}

            {/* Who is at the table, and are they qualified to be? */}
            {b.qualificationRoster && (
              <div style={{ marginBottom: "12px", padding: "11px 13px", background: "white", borderRadius: "8px", border: "1px solid #e6d3c4" }}>
                <div style={{ marginBottom: "9px" }}>
                  {labelChip("Who is at the table")}
                  <strong style={{ color: "#4e342e" }}>
                    {b.qualificationRoster.directorCount} director{b.qualificationRoster.directorCount === 1 ? "" : "s"}
                  </strong>
                  <span style={{ color: "#8d6e63" }}>
                    {" "}· {b.qualificationRoster.parsedCount} with a readable CV
                    {b.qualificationRoster.unparsedCount > 0 ? ` · ${b.qualificationRoster.unparsedCount} uploaded but unreadable` : ""}
                    {b.qualificationRoster.brokenUploadCount > 0 ? ` · ${b.qualificationRoster.brokenUploadCount} failed to upload` : ""}
                    {" "}· {b.qualificationRoster.qualifiedCount} with a verified qualification
                    {b.qualificationRoster.advisors.length ? ` · ${b.qualificationRoster.advisors.length} named advisor${b.qualificationRoster.advisors.length === 1 ? "" : "s"}` : ""}
                  </span>
                </div>

                {b.qualificationRoster.directors.map((p, i) => <PersonQualificationRow key={`d${i}`} p={p} />)}

                {b.qualificationRoster.advisors.length > 0 && (
                  <>
                    <div style={{ marginTop: "10px", marginBottom: "6px", fontWeight: 700, color: "#4e342e", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Advisors
                    </div>
                    {b.qualificationRoster.advisors.map((p, i) => <PersonQualificationRow key={`a${i}`} p={p} />)}
                  </>
                )}

                {b.advisorsDeclared && b.qualificationRoster.advisors.length === 0 && (
                  <div style={{ marginTop: "9px", fontStyle: "italic", color: "#8d6e63", fontSize: "11.5px" }}>
                    Advisors are declared on the profile but none are named, so their qualifications cannot be checked.
                  </div>
                )}
              </div>
            )}

            {/* Committees — only shown where they are expected */}
            {b.committees?.applicable && (
              <div style={{ marginBottom: "12px", padding: "11px 13px", background: "white", borderRadius: "8px", border: "1px solid #e6d3c4" }}>
                <div style={{ marginBottom: "8px" }}>
                  {labelChip("Committees")}
                  <strong style={{ color: getProgressBarColor(Math.round(b.committees.ratio * 100)) }}>
                    {b.committees.presentCount} of {b.committees.expectedCount}
                  </strong>
                  <span style={{ color: "#8d6e63" }}> expected committees in place</span>
                </div>
                {b.committees.expected.map((e) => (
                  <div key={e.key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, backgroundColor: e.present ? "#4CAF50" : "#F44336" }} />
                    <span>
                      <strong style={{ color: "#4e342e" }}>{e.label}:</strong>{" "}
                      {e.present
                        ? <span>{e.members.join(", ")}</span>
                        : <span style={{ color: "#B71C1C" }}>Not in place — {e.why}.</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: "7px" }}>
              {labelChip("Composition")}
              <strong style={{ color: "#4e342e" }}>{b.composition.score}%</strong>
              <span style={{ color: "#8d6e63" }}> across the weighted composition checks</span>
            </div>
            <div>
              {b.composition.checks.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
                  <span style={{
                    display: "inline-block", width: "9px", height: "9px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
                    backgroundColor: c.skip ? "#bdbdbd" : c.pass ? "#4CAF50" : c.credit > 0 ? "#FF9800" : "#F44336",
                  }} />
                  <span>
                    <strong style={{ color: c.skip ? "#8d6e63" : "#4e342e" }}>{c.label}</strong>
                    <span style={{ color: "#a1887f", fontSize: "11px" }}>
                      {c.skip
                        ? " · not scored — the data cannot answer this yet"
                        : `${" "}· ${c.weight}% of 5.3${c.credit > 0 && c.credit < 1 ? ` · ${Math.round(c.credit * 100)}% credit` : ""}`}
                    </span>
                    <br />
                    <span style={{ color: c.skip ? "#8d6e63" : c.pass ? "#6d4c41" : "#8d3a2e", fontStyle: c.skip ? "italic" : "normal" }}>{c.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: "11px 13px", background: "#f5f2f0", borderRadius: "8px", border: "1px dashed #d7ccc8", color: "#8d6e63", fontStyle: "italic" }}>
            Not assessable — no directors are captured, so there is nobody to assess. If the company has directors, adding them under Ownership &amp; Management will populate this section, since the directors are the board.
          </div>
        )}

        <div style={{ marginTop: "10px", paddingTop: "9px", borderTop: "1px dashed #d7ccc8" }}>
          {labelChip("Board structure score")}
          <strong style={{ color: getProgressBarColor(b.score), fontSize: "13px" }}>{b.score}%</strong>
          {b.penalty > 0 && (
            <span style={{ color: "#B71C1C", marginLeft: "8px", fontSize: "11.5px", fontWeight: 600 }}>
              (after a {b.penalty}-point shortfall penalty)
            </span>
          )}
          {b.composition?.skippedCount > 0 && (
            <span style={{ color: "#8d6e63", marginLeft: "8px", fontSize: "11.5px" }}>
              — {b.composition.skippedCount} check{b.composition.skippedCount === 1 ? "" : "s"} not scored for want of evidence
            </span>
          )}
        </div>

        {/* What is missing, and what to send */}
        {b.evidenceGaps && (
          b.evidenceGaps.length === 0 ? (
            <div style={{ marginTop: "12px", padding: "11px 13px", background: "#f1f8f1", borderRadius: "8px", border: "1px solid #c8e6c9", color: "#2E7D32", lineHeight: 1.7 }}>
              <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <CheckCircle size={14} /> Evidence complete
              </div>
              Every director and advisor is named, classified and backed by a readable CV. This assessment rests on evidence rather than inference.
            </div>
          ) : (
            <div style={{ marginTop: "14px" }}>
              <div style={{ fontWeight: 800, color: "#4e342e", fontSize: "12.5px", marginBottom: "8px", paddingBottom: "4px", borderBottom: "2px solid #e6d3c4", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                What is missing
              </div>
              {b.evidenceGaps.map((g, i) => {
                const st = GAP_SEVERITY_STYLE[g.severity] || GAP_SEVERITY_STYLE.low
                return (
                  <div key={i} style={{ padding: "10px 12px", background: st.bg, border: `1px solid ${st.border}`, borderRadius: "8px", marginBottom: "6px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: st.text, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>
                      {st.label}
                    </div>
                    <div style={{ color: "#4e342e", fontWeight: 600, marginBottom: "3px" }}>{g.what}</div>
                    <div style={{ color: st.text, lineHeight: 1.7 }}>{g.action}</div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )


  // ─────────────────────────────────────────────────────────────────────
  // Presentation — same components, same styling and same panel order as
  // the Operational Strength card.
  // ─────────────────────────────────────────────────────────────────────
  const barColor = getProgressBarColor

  const a = assessment
  const pillars = a ? buildPillars(a) : []
  const domains = a ? buildDomains(pillars) : []

  const STATE_STYLE = {
    counted: { dot: "#4CAF50", label: "Counted in full", text: "#2E7D32" },
    partial: { dot: "#FF9800", label: "Partly counted", text: "#EF6C00" },
    missing: { dot: "#F44336", label: "Not answered", text: "#C62828" },
  }

  const Section = ({ title, right, open, onToggle, children }) => (
    <div style={{ marginTop: "16px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
      <div
        style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
        onClick={onToggle}
      >
        <span>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {right && <span style={{ fontSize: "13px", fontWeight: 700 }}>{right}</span>}
          <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>
      </div>
      {open && <div style={{ backgroundColor: "#f5f2f0", padding: "18px" }}>{children}</div>}
    </div>
  )

  // ── One claimable action, expandable to a Now → With this done comparison ──
  const PotentialItem = ({ item, index }) => {
    const open = openItem === item.key
    const chip = item.note || item.section

    return (
      <div style={{ border: `1px solid ${open ? "#c8e6c9" : "#f0e8e0"}`, background: "white", borderRadius: "10px", marginBottom: "8px", overflow: "hidden", transition: "border-color 0.2s ease" }}>
        <div
          onClick={() => setOpenItem(open ? null : item.key)}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", cursor: "pointer", background: open ? "#f7fbf7" : "white" }}
        >
          <span style={{ color: "#a1887f", fontWeight: 800, fontSize: "12px", minWidth: "18px" }}>{index + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "13px" }}>{item.label}</div>
            <div style={{ fontSize: "11px", color: "#8d6e63" }}>{chip}</div>
          </div>
          <span style={{ backgroundColor: "#e8f5e9", color: "#1B5E20", border: "1px solid #c8e6c9", borderRadius: "4px", padding: "3px 8px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap" }}>
            {fmtPts(item.pointValue)}
          </span>
          <ChevronDown size={16} style={{ color: "#a1887f", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
        </div>

        {open && (
          <div style={{ padding: "14px", borderTop: "1px dashed #e8d8cf", background: "#fcfbfa" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", padding: "14px", background: "linear-gradient(135deg,#f1f8f1 0%,#e8f5e9 100%)", border: "1px solid #c8e6c9", borderRadius: "10px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#6d4c41", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Now</div>
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#8d6e63", lineHeight: 1.1 }}>{overallScore}%</div>
              </div>
              <div style={{ fontSize: "22px", color: "#1B5E20", fontWeight: 800 }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "9.5px", color: "#1B5E20", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>With this done</div>
                <div style={{ fontSize: "30px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.1 }}>{item.projected}%</div>
                <div style={{ fontSize: "11px", color: "#2E7D32", fontWeight: 700 }}>{fmtPts(item.pointValue)}</div>
              </div>
            </div>

            {item.importance && (
              <>
                <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
                  Why funders ask for it
                </div>
                <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "10px", lineHeight: 1.6 }}>{item.importance}</div>
              </>
            )}

            <div style={{ fontSize: "10px", color: "#8d6e63", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
              What to do
            </div>
            <div style={{ fontSize: "12.5px", color: "#5d4037", marginBottom: "12px", lineHeight: 1.6 }}>{item.action}</div>

            <button
              onClick={() => goTo(item.route)}
              disabled={!item.route}
              style={{ padding: "9px 16px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "12px", cursor: item.route ? "pointer" : "not-allowed", opacity: item.route ? 1 : 0.55, display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Go to {item.section} <span style={{ fontSize: "13px" }}>→</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── One scored item inside the breakdown ──
  const ItemRow = ({ item }) => {
    const st = STATE_STYLE[item.state] || STATE_STYLE.missing
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "9px" }}>
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, backgroundColor: st.dot }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ color: "#4e342e" }}>{item.label}</strong>
          <span style={{ color: "#a1887f", fontSize: "11px" }}>
            {" "}· {item.earned}/{item.points} item points · <span style={{ color: st.text, fontWeight: 700 }}>{st.label}</span>
            {item.selfDeclared ? " · self-assessed" : ""}
          </span>
          <br />
          {item.evidence && <span style={{ color: "#6d4c41" }}>{item.evidence}</span>}
          {item.reason && <span style={{ display: "block", color: "#8d3a2e" }}>{item.reason}</span>}
          {item.fix && <span style={{ display: "block", color: "#8d3a2e" }}>{item.fix}</span>}
          {!item.reason && !item.fix && item.guidance && item.withheld > 0 && (
            <span style={{ display: "block", color: "#8d6e63", fontStyle: "italic", fontSize: "11.5px" }}>{item.guidance}</span>
          )}
          {item.withheld > 0 && item.route && (
            <button
              onClick={() => goTo(item.route)}
              style={{ marginTop: "6px", background: "none", border: "1px solid #d6b88a", color: "#5d4037", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              Go to {item.section} →
            </button>
          )}
        </span>
        {item.withheld > 0 && (
          <span style={{ backgroundColor: "#f5f2f0", color: "#8d6e63", border: "1px solid #d7ccc8", borderRadius: "4px", padding: "2px 7px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap", marginTop: "2px" }}>
            {item.withheld} pts
          </span>
        )}
      </div>
    )
  }

  // ── One pillar in the breakdown, same shape as an Operational Strength
  //    category row. Governance Maturity carries the board panel. ──
  const PillarBlock = ({ p }) => {
    const open = openPillar === p.key
    return (
      <div style={{ background: "white", borderRadius: "8px", border: "1px solid #f0e8e0", padding: "14px", marginBottom: "8px" }}>
        <div
          onClick={() => setOpenPillar(open ? "" : p.key)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
            <div style={{ backgroundColor: p.color, width: "12px", height: "12px", borderRadius: "50%", marginRight: "12px", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px" }}>{p.label}</div>
              <div style={{ fontSize: "11.5px", color: "#8d6e63", fontStyle: "italic" }}>
                {p.rawScore}/5 → {p.percent}% × {p.weight}% weight = {p.weightedScore} points
                {p.headroom > 0 ? ` · ${fmtPts(p.headroom)} unclaimed here` : " · fully claimed"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "80px", height: "8px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
              <div style={{ width: `${p.percent}%`, height: "100%", background: barColor(p.percent), borderRadius: "4px", transition: "width 0.3s ease" }} />
            </div>
            <span style={{ fontWeight: 600, color: "#5d4037", fontSize: "14px", minWidth: "35px", textAlign: "right" }}>{p.percent}%</span>
            <ChevronDown size={16} style={{ color: "#a1887f", flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
          </div>
        </div>

        {open && (
          <div style={{ borderTop: "1px dashed #e8d8cf", paddingTop: "10px", marginTop: "10px", fontSize: "12.5px", color: "#6d4c41", lineHeight: 1.7 }}>
            {/* Sub-categories, where the pillar has them */}
            {p.subCategories && p.subCategories.map((c, i) => (
              <div key={c.key || c.name || i} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, color: "#4e342e", fontSize: "12.5px" }}>{c.name}</span>
                  <span style={{ fontSize: "11.5px", color: "#8d6e63" }}>
                    {c.score}% × {c.weight}% weight
                    {c.boardOverride ? " · from the board assessment below" : ""}
                  </span>
                </div>
                {c.items && c.items.map((it) => <ItemRow key={it.key} item={it} />)}
              </div>
            ))}

            {/* Flat item list, where it has no sub-categories */}
            {!p.subCategories && p.items && p.items.map((it) => <ItemRow key={it.key} item={it} />)}

            {/* Governance Maturity carries the 5.1 → 5.2 → 5.3 board panel */}
            {p.key === "maturity" && boardStructurePanel && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #e8d8cf" }}>
                <div style={{ fontWeight: 800, color: "#4e342e", marginBottom: "10px", fontSize: "12.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Board structure
                </div>
                {boardStructurePanel}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── A domain band: heading, its own 0-100 score, then its pillars ──
  const DomainGroup = ({ domain }) => (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${domain.color} 0%, #4e342e 100%)`,
          color: "white",
          borderRadius: "10px 10px 0 0",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase" }}>
            {domain.label}
          </div>
          <div style={{ fontSize: "11.5px", opacity: 0.9, fontStyle: "italic", marginTop: "2px" }}>
            {domain.question}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9.5px", opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>
              {domain.weight}% of the score
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1.1 }}>{domain.percent}%</div>
          </div>
          <div style={{ width: "60px", height: "8px", background: "rgba(255,255,255,0.25)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${domain.percent}%`, height: "100%", background: "white", borderRadius: "4px", transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ background: domain.accent, border: `1px solid ${domain.color}33`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "12px" }}>
        {domain.pillars.map((p) => <PillarBlock key={p.key} p={p} />)}
        <div style={{ fontSize: "11px", color: "#6d4c41", padding: "2px 4px", lineHeight: 1.6 }}>
          Contributes <strong>{domain.contribution}</strong> of the {overallScore}% overall
          {domain.headroom > 0 ? ` · ${fmtPts(domain.headroom)} unclaimed in this domain` : " · fully claimed"}
        </div>
      </div>
    </div>
  )

  const aiInjections = {
    "board structure": { position: "top", content: boardStructurePanel },
  }


  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Leadership &amp; Governance</h2>
            <Users size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Who's in charge, and can we trust them</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{overallScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>


        
          <button
            onClick={() => setShowModal(true)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(93,64,55,0.4)" }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(93,64,55,0.3)" }}
          >
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto", width: "90%", maxWidth: "780px", border: "1px solid #ccc" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "2px solid #ddd", fontSize: "20px", cursor: "pointer", color: "#666", zIndex: 2, width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}
            >
              {"×"}
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: 600, color: "#5d4037", textAlign: "center" }}>
                Leadership &amp; governance breakdown
              </h3>

              {/* ── Header block ── */}
              <div style={{ textAlign: "center", padding: "20px", background: "linear-gradient(135deg,#fdf8f6 0%,#f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "12px" }}>
                  <span style={{ fontSize: "28px", fontWeight: 700, color: "#5d4037", lineHeight: 1 }}>{overallScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: 600, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scoreLevel.level}</span>
                </div>

                {governanceStage && (
                  <div style={{ fontSize: "14px", color: "#6d4c41" }}>
                    Governance stage:{" "}
                    <strong style={{ color: "#5d4037" }}>
                      {governanceStage}{governanceRecommendation ? ` — ${governanceRecommendation}` : ""}
                    </strong>
                  </div>
                )}

                {domains.length > 0 && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "14px", flexWrap: "wrap" }}>
                    {domains.map((d) => (
                      <div
                        key={d.key}
                        style={{
                          flex: "1 1 180px",
                          maxWidth: "260px",
                          background: "white",
                          border: `2px solid ${d.color}`,
                          borderRadius: "10px",
                          padding: "10px 12px",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: "10px", fontWeight: 800, color: d.color, textTransform: "uppercase", letterSpacing: "1px" }}>
                          {d.label}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
                          <span style={{ fontSize: "22px", fontWeight: 800, color: "#4e342e", lineHeight: 1 }}>{d.percent}%</span>
                          <span style={{ fontSize: "10.5px", color: "#8d6e63" }}>{d.weight}% of the score</span>
                        </div>
                        <div style={{ height: "6px", background: "#f3e8dc", borderRadius: "3px", overflow: "hidden", marginTop: "6px", border: "1px solid #e6d3c4" }}>
                          <div style={{ width: `${d.percent}%`, height: "100%", background: d.color, borderRadius: "3px", transition: "width 0.3s ease" }} />
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#8d6e63", marginTop: "5px", lineHeight: 1.5 }}>
                          {d.pillars.map((x) => x.label).join(" · ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "8px", fontStyle: "italic" }}>
                  Two separate findings. A business can pass one and fail the other.
                </div>

                {potential && potential.availablePoints > 0 && (
                  <div style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "#e8f5e9", border: "1px solid #c8e6c9", borderRadius: "20px", color: "#1B5E20", fontWeight: 700, fontSize: "12px" }}>
                    <Target size={13} /> {fmtPts(potential.combinedPoints)} available · potential score {potential.ceiling}%
                  </div>
                )}

                {b && b.gap > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", background: "#B71C1C", borderRadius: "20px", color: "white", fontWeight: 700, fontSize: "11.5px" }}>
                      <AlertCircle size={13} /> Board required but not in place — {b.penalty}-point penalty
                    </span>
                  </div>
                )}

                {potential && potential.earnByDoingPoints > 0 && (
                  <div style={{ marginTop: "8px", fontSize: "11.5px", color: "#8d6e63", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Lock size={11} /> A further {fmtPts(potential.earnByDoingPoints)} sits behind work rather than data entry.
                  </div>
                )}

                {!leadershipAiResult && !governanceAiResult && (
                  <div style={{ marginTop: "14px" }}>
                    <button
                      onClick={runAiEvaluation}
                      disabled={isEvaluating || !apiKey}
                      style={{ padding: "10px 20px", backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", opacity: isEvaluating || !apiKey ? 0.7 : 1 }}
                    >
                      <RefreshCw size={16} className={isEvaluating ? "spin" : ""} />
                      {isEvaluating ? "Loading analysis..." : "Load AI analysis"}
                    </button>
                    {!apiKey && (
                      <p style={{ fontSize: "12px", color: "#f44336", marginTop: "8px" }}>
                        <AlertCircle size={14} style={{ verticalAlign: "-2px" }} /> AI analysis requires API key configuration
                      </p>
                    )}
                  </div>
                )}
              </div>
  {/* ── About ── */}
              <Section title="About this score" open={showAboutScore} onToggle={() => setShowAboutScore(!showAboutScore)}>
                <div style={{ color: "#5d4037", fontSize: "13px", lineHeight: 1.6 }}>
                  <p style={{ marginBottom: "14px" }}>
                    This card covers <strong>two separate questions</strong>, and a funder treats them as two separate findings. A capable founder with no board passes one and fails the other, so the breakdown keeps them apart rather than averaging them into a single verdict.
                  </p>

                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                    {DOMAINS.map((d) => (
                      <div key={d.key} style={{ flex: "1 1 220px", background: "white", border: `2px solid ${d.color}`, borderRadius: "8px", padding: "12px" }}>
                        <div style={{ fontWeight: 800, fontSize: "11px", color: d.color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                          {d.label} — {d.pillarKeys.reduce((s2, k) => s2 + SECTION_WEIGHTS[k === "maturity" ? "maturity" : k], 0)}%
                        </div>
                        <div style={{ fontSize: "12px", color: "#5d4037", fontStyle: "italic", marginBottom: "6px" }}>{d.question}</div>
                        <div style={{ fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>
                          {d.key === "leadership"
                            ? `Leadership Quality (${SECTION_WEIGHTS.leadership}%) — founder credentials read from uploaded CVs, the depth of the operating team, and the six Business Leadership answers.`
                            : `Ownership & Structure (${SECTION_WEIGHTS.ownership}%) and Governance Maturity (${SECTION_WEIGHTS.maturity}%) — who owns and directs the company, and how mature the governance around that is, including the board assessment.`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ marginBottom: "16px", fontSize: "12.5px", color: "#6d4c41" }}>
                    Ownership &amp; Structure sits under Governance deliberately: directors, shareholders and the exec / non-executive split describe the accountability structure, not the calibre of the people in it.
                  </p>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>How a point value is worked out</p>
                    <p style={{ margin: "0 0 8px 0" }}>
                      Unlike the other cards, a point value here cannot be divided out of a table. The board shortfall penalty deducts twice, composition checks drop out of their own denominator when evidence is missing, and the Public Interest Score moves the requirement band — so adding one director can move the score by an amount no fixed table would predict.
                    </p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", backgroundColor: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e0d5c8" }}>
                      value = score(profile + action) − score(profile)
                    </p>
                    <p style={{ margin: "8px 0 0 0" }}>
                      Every figure is measured by applying the action to a copy of your profile and re-running the same scoring function the card uses. The score is calculated in code, never by the AI — the AI reads the finished numbers and explains them.
                    </p>
                  </div>

                  {a && (
                    <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Pillar weighting</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ color: "#6d4c41" }}>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Pillar</th>
                            <th style={{ textAlign: "left", padding: "4px 6px" }}>Source</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Weight</th>
                            <th style={{ textAlign: "right", padding: "4px 6px" }}>Now</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pillars.map((p) => (
                            <tr key={p.key} style={{ color: "#5d4037" }}>
                              <td style={{ padding: "4px 6px" }}>{p.label}</td>
                              <td style={{ padding: "4px 6px" }}>{p.source}</td>
                              <td style={{ padding: "4px 6px", textAlign: "right" }}>{p.weight}%</td>
                              <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{p.percent}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "10px", color: "#6d4c41" }}>How Board Structure is scored</p>
                    <ul style={{ margin: "0 0 10px 0", paddingLeft: "18px", color: "#6d4c41" }}>
                      <li style={{ marginBottom: "4px" }}><strong>5.1 Does the business need a board?</strong> PIS below {PIS_EMERGING_THRESHOLD}: advisors are sufficient. PIS {PIS_EMERGING_THRESHOLD}–{PIS_FULL_BOARD_THRESHOLD - 1}: an informal board is expected. PIS {PIS_FULL_BOARD_THRESHOLD} or above: a formal board is required.</li>
                      <li style={{ marginBottom: "4px" }}><strong>5.2 Does it have one, and who sits on it?</strong> The named directors <em>are</em> the board. Only a profile with no directors captured at all counts as having none.</li>
                      <li style={{ marginBottom: "4px" }}><strong>5.3 Is it structured and skilled correctly?</strong> Board skills matrix (22%), qualification evidence (15%), independent presence (18%), size (10%), non-executive ratio (8%), cadence (8%), committees (8%), role concentration (7%), classification (4%).</li>
                      <li style={{ marginBottom: "4px" }}><strong>Evidence, not inference.</strong> A missing CV means the seat is unverified, not that the person is unqualified — it scores neutral and is listed under "What is missing" instead. Where the data cannot answer a check, that check is dropped from the calculation rather than scored zero.</li>
                      <li style={{ marginBottom: "4px" }}><strong>Non-executive is not independent.</strong> A director linked to a shareholder row protects their own capital, so they are not counted towards independent representation.</li>
                    </ul>
                    <p style={{ margin: "0 0 10px 0" }}>
                      If 5.1 says a board is needed and 5.2 says there is not one, the score is penalised by <strong>{BOARD_GAP_PENALTY[1]}–{BOARD_GAP_PENALTY[3]} points</strong> and Governance Maturity takes a further deduction.
                    </p>
                    <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12.5px", backgroundColor: "white", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e0d5c8" }}>
                      PIS = Employees + (Turnover ÷ R1m) + (Liabilities ÷ R1m) + Shareholders
                    </p>
                  </div>

                  <div style={{ backgroundColor: "#efebe9", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                    <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Declared versus evidenced</p>
                    <p style={{ margin: 0 }}>
                      Most governance questions are self-assessed dropdowns. An unanswered one scores zero and appears in Potential points, valued at the honest middle option — answering it truthfully is worth real marks. An answer already given but below the top option is not listed there, because paying you to reselect a dropdown would be paying for a claim rather than a change. It sits under "Earn by doing" with the artefact named.
                    </p>
                  </div>
                </div>
              </Section>

              
              {/* ── Potential points ── */}
              <Section
                title="Potential points"
                right={potential ? (potential.combinedPoints > 0 ? `${fmtPts(potential.combinedPoints)} to claim` : "All claimed") : "…"}
                open={showPotential}
                onToggle={() => setShowPotential(!showPotential)}
              >
                {!potential ? (
                  <div style={{ fontSize: "12.5px", color: "#8d6e63", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                    <RefreshCw size={14} className="spin" /> Measuring what each action is worth…
                  </div>
                ) : potential.opportunities.length === 0 ? (
                  <div style={{ padding: "14px", background: "#f1f8f1", border: "1px solid #c8e6c9", borderRadius: "8px", color: "#2E7D32", lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      <CheckCircle size={14} /> Nothing left to claim by capturing data
                    </div>
                    Everything the profile can record is recorded. What remains is under "Earn by doing" below.
                  </div>
                ) : (
                  <>
                    <div style={{ padding: "16px", background: "linear-gradient(135deg,#fdf8f6 0%,#e8f5e9 100%)", border: "1px solid #c8e6c9", borderRadius: "10px", marginBottom: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#1B5E20", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                        Your score could reach
                      </div>
                      <div style={{ fontSize: "34px", fontWeight: 800, color: "#1B5E20", lineHeight: 1.2 }}>
                        {potential.ceiling}%
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#5d4037", lineHeight: 1.6 }}>
                        {overallScore}% today · <strong style={{ color: "#1B5E20" }}>{fmtPts(potential.combinedPoints)}</strong> across {potential.opportunities.length} action{potential.opportunities.length === 1 ? "" : "s"} below
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "6px", fontStyle: "italic" }}>
                        Tap any item to see what it is worth and go straight to the form.
                      </div>
                      {Math.abs(potential.availablePoints - potential.combinedPoints) > 0.5 && (
                        <div style={{ fontSize: "11px", color: "#8d6e63", marginTop: "6px", lineHeight: 1.6 }}>
                          The individual figures below add up to {fmtPts(potential.availablePoints)}, but several actions move the same checks — appointing an independent director also fixes the non-executive ratio, for instance. {potential.ceiling}% is what you would actually score having done all of them, measured by applying every one of them at once.
                        </div>
                      )}
                    </div>

                    {potential.opportunities.map((item, i) => (
                      <PotentialItem key={item.key} item={item} index={i} />
                    ))}

                    {potential.earnByDoing.length > 0 && (
                      <div style={{ marginTop: "14px", padding: "12px", background: "#f5f2f0", border: "1px solid #d7ccc8", borderRadius: "8px" }}>
                        <div style={{ fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10.5px", color: "#6d4c41" }}>
                          <Lock size={12} /> Earn by doing — {fmtPts(potential.earnByDoingPoints)}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6, marginBottom: "8px" }}>
                          These are self-assessed answers you have already given. The points are real, but they belong to the work rather than the dropdown — changing the answer without doing the thing is something a funder finds in five minutes of due diligence. Left out of the total above rather than dressed up as an action.
                        </div>
                        {potential.earnByDoing.map((f) => (
                          <div key={f.key} style={{ padding: "9px 11px", background: "white", border: "1px solid #f0e8e0", borderRadius: "8px", marginBottom: "6px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "12.5px" }}>{f.label}</div>
                              <div style={{ fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>{f.action}</div>
                            </div>
                            <span style={{ backgroundColor: "#f5f2f0", color: "#8d6e63", border: "1px solid #d7ccc8", borderRadius: "4px", padding: "2px 7px", fontWeight: 800, fontSize: "11.5px", whiteSpace: "nowrap" }}>
                              {fmtPts(f.pointValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {potential.unreachable.length > 0 && (
                      <div style={{ marginTop: "14px", padding: "12px", background: "#f5f2f0", border: "1px solid #d7ccc8", borderRadius: "8px" }}>
                        <div style={{ fontWeight: 800, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10.5px", color: "#6d4c41" }}>
                          <Info size={12} /> Why {potential.ceiling}% and not 100%
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6, marginBottom: "8px" }}>
                          The remaining {fmtPts(100 - potential.ceiling)} is not reachable by filling in this profile. Each reason below is a real one rather than a rounding artefact.
                        </div>
                        {potential.unreachable.map((u, i) => (
                          <div key={i} style={{ padding: "9px 11px", background: "white", border: "1px solid #f0e8e0", borderRadius: "8px", marginBottom: "6px" }}>
                            <div style={{ fontWeight: 700, color: "#4e342e", fontSize: "12px", marginBottom: "2px" }}>{u.what}</div>
                            <div style={{ fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>{u.why}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: "10px", padding: "10px 12px", background: "#f9f5f0", border: "1px solid #e6d3c4", borderRadius: "8px", fontSize: "11.5px", color: "#6d4c41", lineHeight: 1.6 }}>
                      Each figure was measured by re-running the score with that action applied — the same function promises it and awards it.
                    </div>
                  </>
                )}
              </Section>

              {/* ── Score breakdown ── */}
              {a && (
                <Section
                  title="Score breakdown"
                  right={`${overallScore}%`}
                  open={showScoreBreakdown}
                  onToggle={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  {domains.map((d) => <DomainGroup key={d.key} domain={d} />)}

                  {a.maturityPenalty > 0 && (
                    <div style={{ marginTop: "4px", padding: "10px 12px", background: "#fdecea", border: "1px solid #e6b8ac", borderRadius: "8px", fontSize: "11.5px", color: "#8d3a2e", lineHeight: 1.6 }}>
                      Governance Maturity carries a further {a.maturityPenalty}-point deduction on top of the weighted categories, because a business that needs a board and has not got one should not be rescued by a tidy set of policies.
                    </div>
                  )}
                </Section>
              )}

            

              {/* ── Detailed analysis ── */}
              <Section title="Detailed analysis" open={showDetailedAnalysis} onToggle={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                {leadershipAiResult || governanceAiResult ? (
                  <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e8d8cf", maxHeight: "460px", overflowY: "auto" }}>
                    {leadershipAiResult && (
                      <>
                        <div style={{ background: "linear-gradient(135deg,#6D4C41 0%,#4e342e 100%)", color: "white", borderRadius: "8px", padding: "9px 14px", marginBottom: "12px" }}>
                          <div style={{ fontWeight: 800, fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>Leadership</div>
                          <div style={{ fontSize: "11px", opacity: 0.9, fontStyle: "italic" }}>Who is running this business, and are they any good at it?</div>
                        </div>
                        {formatAiResult(leadershipAiResult)}
                      </>
                    )}
                    {governanceAiResult && (
                      <>
                        <div style={{ background: "linear-gradient(135deg,#A67C52 0%,#4e342e 100%)", color: "white", borderRadius: "8px", padding: "9px 14px", margin: leadershipAiResult ? "22px 0 12px 0" : "0 0 12px 0" }}>
                          <div style={{ fontWeight: 800, fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>Governance</div>
                          <div style={{ fontSize: "11px", opacity: 0.9, fontStyle: "italic" }}>What structures hold them to account?</div>
                        </div>
                        {formatAiResult(governanceAiResult, aiInjections)}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "12.5px", color: "#8d6e63", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} /> No AI analysis yet — the score and point values above are already final and do not depend on it.
                  </div>
                )}
                {(leadershipAiResult || governanceAiResult) && (
                  <div style={{ marginTop: "12px", textAlign: "right" }}>
                    <button
                      onClick={runAiEvaluation}
                      disabled={isEvaluating || !apiKey}
                      style={{ padding: "8px 14px", backgroundColor: "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "12px", cursor: isEvaluating ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", opacity: isEvaluating ? 0.7 : 1 }}
                    >
                      <RefreshCw size={14} className={isEvaluating ? "spin" : ""} />
                      {isEvaluating ? "Refreshing..." : "Refresh analysis"}
                    </button>
                  </div>
                )}
                {evaluationError && (
                  <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} /> {evaluationError}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  )
}