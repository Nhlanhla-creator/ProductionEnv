import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebaseConfig"
import {
  computeRoleCoveragePure,
  CRITICAL_ROLE_BUCKETS,
  DIRECTOR_ROLE_OVERLOAD_THRESHOLD,
  BOARD_SKILL_DOMAINS,
} from "./governance-scoring"

// ─────────────────────────────────────────────────────────────────────────
// GOVERNANCE & LEADERSHIP PROMPTS
//
// Both of these were methods on the card component and read `profileData`
// and `cvProfiles` off its state. They are pure string builders otherwise,
// so the only change on the way out of the component is that the two now
// arrive as arguments. Every prompt body below is unchanged.
// ─────────────────────────────────────────────────────────────────────────

export async function prepareLeadershipData(userId, profileData, cvProfiles) {
  let cvText = ""
  try {
    let cvs = cvProfiles || []
    if (!cvs.length && userId) {
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

// ─────────────────────────────────────────────────────────────────────────
// Board Structure prompt addendum — forces the AI narrative to follow the
// same 5.1 → 5.2 → 5.3 order as the UI, and hands it the deterministic
// verdict so it cannot write a flattering paragraph that contradicts the
// score the user is looking at.
// ─────────────────────────────────────────────────────────────────────────
export function buildBoardPromptAddendum(board) {
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