"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, RefreshCw, AlertCircle, Users, CheckCircle } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, getDocs } from "firebase/firestore"
import { getFunctions, httpsCallable } from "firebase/functions"
import { buildGovernancePrompt } from "./governance-improvements"
import { buildOpportunities, fmtPts } from "./governance-potential"
import ScoreExplorer from "./ScoreExplorer"

// ── Moved out of this file unchanged. See the note at the bottom for the
//    exact list of symbols governance-scoring.js needs to export. ──
import {
  computeAll,
  buildPillars,
  buildDomains,
  buildBoardAssessment,
  computeBoardSkills,
  computeRoleCoveragePure,
  pisOf,
  BOARD_SKILL_DOMAINS,
  PIS_EMERGING_THRESHOLD,
  PIS_FULL_BOARD_THRESHOLD,
  REQ_ADVISORS,
  REQ_INFORMAL,
  REQ_FORMAL,
  BOARD_GAP_PENALTY,
} from "./governance-scoring"
// Unchanged from the old file — see the note at the bottom.
import { prepareLeadershipData, buildBoardPromptAddendum } from "./governance-prompts"

// ─────────────────────────────────────────────────────────────────────────
// LEADERSHIP & GOVERNANCE
//
// Same navigation shell as Capital Appeal. The scoring is untouched —
// computeAll is still the single path and the AI still never writes a number.
// What changed is that the modal stopped showing everything at once.
//
//   Home ─┬─ 1. About this score ─┬─ 1.1 Definition
//         │                       ├─ 1.2 Assessment areas
//         │                       ├─ 1.3 Score interpretation
//         │                       └─ 1.4 Score weighting
//         ├─ 2. Your score ── domain ── element ─┬─ 2.1 Score breakdown
//         │                                      ├─ 2.2 Analysis
//         │                                      └─ 2.3 Improvements
//         └─ 3. Potential points ── item detail
//
// THE ELEMENT LIST
//
//   Blocks are the two domains the card already argued for — Leadership and
//   Governance. Elements are the leaves underneath them, so each one gets its
//   own three buttons:
//
//     Leadership (40%)   Leadership Credentials · Structure · Behaviour
//     Governance (60%)   Ownership & Structure · Board Structure ·
//                        and every remaining governance-maturity category
//
//   Board Structure is deliberately its own element rather than a panel
//   buried inside Governance Maturity. It is the largest single driver of
//   this score, it carries a penalty that deducts twice, and it needs a
//   screen of its own — which it now has, with 5.1 → 5.2 → 5.3 as three
//   collapsed steps rather than 250 lines of unbroken panel.
//
//   Its "What is missing" list moves to that element's 2.3 Improvements tab,
//   where an evidence gap belongs.
// ─────────────────────────────────────────────────────────────────────────

const INTERPRETATION = [
  { range: "91–100%", label: "Scaler", color: "#1B5E20", meaning: "High ambition and high execution. Leadership is an asset in the file, not a risk to be managed." },
  { range: "81–90%", label: "Builder", color: "#4CAF50", meaning: "High commitment and strong execution. A funder is comfortable with who is running this." },
  { range: "61–80%", label: "Visionary", color: "#FF9800", meaning: "High ambition, weaker execution or oversight. Expect questions about who checks the founder." },
  { range: "41–60%", label: "Survivalist", color: "#F44336", meaning: "Moderate commitment, limited ambition. Capital would be preserving the business rather than growing it." },
  { range: "0–40%", label: "Passenger", color: "#B71C1C", meaning: "Low commitment or passive leadership. This is the finding that stops a deal rather than slows it." },
]

const ELEMENT_PURPOSE = {
  ownership: "Who owns and directs the company — directors, shareholders, the executive / non-executive split and succession.",
  boardStructure: "Whether the business needs a board, whether it has one, and whether that board carries the skills and independence to be worth having.",
  credentials: "What the people running this have actually done before, read from their uploaded CVs rather than their job titles.",
  structure: "Whether the operating roles a business of this type needs are staffed, and by how many different people.",
  behaviour: "How leadership behaves — openness to advice, declared conflicts, and whether one person is spread across too much.",
}

const GAP_SEVERITY = {
  high: { bg: "#fdecea", border: "#e6b8ac", text: "#B71C1C", label: "Blocking" },
  medium: { bg: "#fff6e8", border: "#e8d0a8", text: "#8a5a00", label: "Weakens the score" },
  low: { bg: "#f5f2f0", border: "#e6d3c4", text: "#6d4c41", label: "Sharpens the score" },
}

const QUAL_TIER_STYLE = {
  strong: { dot: "#1B5E20", label: "Evidenced" },
  adequate: { dot: "#4CAF50", label: "Adequate" },
  thin: { dot: "#FF9800", label: "Thin evidence" },
  unverified: { dot: "#9e9e9e", label: "Unverified" },
}

const barColor = (s) =>
  s > 90 ? "#1B5E20" : s >= 81 ? "#4CAF50" : s >= 61 ? "#FF9800" : s >= 41 ? "#F44336" : "#B71C1C"

const getScoreLevel = (score) => {
  if (score >= 91) return { level: "Scaler", color: "#1B5E20", description: "High ambition + high execution" }
  if (score >= 81) return { level: "Builder", color: "#4CAF50", description: "High commitment + strong execution" }
  if (score >= 61) return { level: "Visionary", color: "#FF9800", description: "High ambition but weaker execution" }
  if (score >= 41) return { level: "Survivalist", color: "#F44336", description: "Moderate commitment, limited ambition" }
  return { level: "Passenger", color: "#B71C1C", description: "Low commitment / passive leadership" }
}

// ═════════════════════════════════════════════════════════════════════════
// AI narrative → per-element findings
//
// Two prompts run and both emit "### N. Heading" sections with bold labels
// inside — Assessment, Evidence, How to improve, Rationale. This splits them
// and files each section against the element it describes, so tab 2.2 shows
// one finding rather than the whole document.
// ═════════════════════════════════════════════════════════════════════════

const normLabel = (s) =>
  String(s || "").toLowerCase().replace(/^\s*\d+(\.\d+)*[.)]?\s*/, "").replace(/[^a-z0-9]/g, "")

const FIELD_ORDER = [
  { key: "assessment", label: "Assessment", re: /\*\*\s*Assessment\s*:?\s*\*\*/i },
  { key: "evidence", label: "Evidence", re: /\*\*\s*Evidence\s*:?\s*\*\*/i },
  { key: "rationale", label: "Rationale", re: /\*\*\s*Rationale\s*:?\s*\*\*/i },
  { key: "improve", label: "How to improve", re: /\*\*\s*How to improve\s*:?\s*\*\*/i, tone: "good" },
]

const parseSectionFields = (body) => {
  const marks = []
  FIELD_ORDER.forEach((f) => {
    const m = body.match(f.re)
    if (m) marks.push({ ...f, start: m.index, end: m.index + m[0].length })
  })
  marks.sort((a, b) => a.start - b.start)

  const fields = marks.map((mk, i) => ({
    label: mk.label,
    tone: mk.tone,
    key: mk.key,
    text: body.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : body.length).replace(/\*\*/g, "").trim(),
  }))

  const scoreMatch = body.match(/Score\s*:?\s*(\d+(?:\.\d+)?)\s*\/\s*5/i)
  const confMatch = body.match(/Confidence\s*:?\s*(High|Medium|Low)/i)

  return {
    fields: fields.filter((f) => f.text),
    // "How to improve" is an action, not a finding — it belongs in 2.3.
    improveText: (fields.find((f) => f.key === "improve") || {}).text || null,
    score: scoreMatch ? Number(scoreMatch[1]) : null,
    confidence: confMatch ? confMatch[1] : null,
    raw: body.trim(),
  }
}

export function parseNarrative(text) {
  const map = {}
  if (!text) return map
  String(text)
    .split(/(?=^###\s)/m)
    .forEach((chunk) => {
      const t = chunk.trim()
      if (!t.startsWith("###")) return
      const nl = t.indexOf("\n")
      const heading = t.slice(3, nl === -1 ? undefined : nl).replace(/\*\*/g, "").replace(/\s*Score\s*:.*$/i, "").trim()
      const body = nl === -1 ? "" : t.slice(nl + 1)
      const parsed = parseSectionFields(body)
      map[normLabel(heading)] = parsed
      // "### 5. Board Structure" and "5.3 …" sub-headings both need to reach
      // the Board Structure element, so index a few aliases too.
      if (/board/i.test(heading)) map.boardstructure = parsed
    })
  return map
}

// The analysis for a whole element list, keyed the way the elements are keyed.
const findAnalysis = (map, label, aliases = []) => {
  const keys = [label, ...aliases].map(normLabel)
  for (const k of keys) {
    if (map[k]) return map[k]
    const partial = Object.keys(map).find((mk) => mk.includes(k) || k.includes(mk))
    if (partial) return map[partial]
  }
  return null
}

// ═════════════════════════════════════════════════════════════════════════
// Board structure panel — three collapsed steps, not one slab
// ═════════════════════════════════════════════════════════════════════════

const T = {
  ink: "#4e342e", body: "#6d4c41", mute: "#8d6e63", faint: "#a1887f",
  line: "#e6d3c4", hair: "#f0e8e0", sand: "#f3e8dc",
}

function Step({ num, title, subtitle, tone, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: "9px", marginBottom: "9px", overflow: "hidden", background: "white" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 12px", cursor: "pointer", background: open ? T.sand : "white" }}
      >
        <span style={{ background: "#8d6e63", color: "white", borderRadius: "4px", padding: "1px 6px", fontSize: "11px", fontWeight: 800 }}>{num}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, color: T.ink, fontSize: "12.5px" }}>{title}</span>
          {subtitle && (
            <span style={{ display: "block", fontSize: "11.5px", color: tone === "bad" ? "#B71C1C" : tone === "good" ? "#2E7D32" : T.mute, marginTop: "1px" }}>
              {subtitle}
            </span>
          )}
        </span>
        <ChevronDown size={15} style={{ color: T.faint, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease" }} />
      </div>
      {open && <div style={{ padding: "12px", borderTop: `1px dashed ${T.line}`, fontSize: "12.5px", color: T.body, lineHeight: 1.7 }}>{children}</div>}
    </div>
  )
}

const Chip = ({ children }) => (
  <span style={{ fontWeight: 800, color: T.ink, background: T.sand, padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.6px", border: `1px solid ${T.line}`, marginRight: "8px", display: "inline-block" }}>
    {children}
  </span>
)

const Dot = ({ color }) => (
  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0, background: color }} />
)

function PersonRow({ p }) {
  const t = QUAL_TIER_STYLE[p.tier] || QUAL_TIER_STYLE.unverified
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
      <Dot color={t.dot} />
      <span>
        <strong style={{ color: T.ink }}>{p.name}</strong>
        <span style={{ color: T.faint, fontSize: "11px" }}>
          {" "}· {p.seat}
          {p.boardRoles.length ? ` · ${p.boardRoles.join(", ")}` : ""}
          {p.committees.length ? ` · ${p.committees.join(", ")}` : ""}
        </span>
        <br />
        {p.evidence === "parsed" ? (
          <span style={{ color: T.body }}>
            {p.highestQualification || "No formal qualification found on the CV"}
            {p.years ? ` · ${p.years} years' experience` : ""}
            {p.governanceTrained ? " · board/governance training" : ""}
            {p.domains.length ? ` · brings ${p.domains.join(", ")}` : " · does not map to a board competency"}
          </span>
        ) : p.evidence === "upload-failed" ? (
          <span style={{ color: "#B71C1C" }}>
            A CV{p.uploadedCvName ? ` (${p.uploadedCvName})` : ""} is attached but the file never reached storage — it looks uploaded and is not.
          </span>
        ) : p.evidence === "uploaded-unparsed" ? (
          <span style={{ color: "#8a5a00" }}>CV uploaded but not yet readable — the qualification behind this seat cannot be verified.</span>
        ) : (
          <span style={{ color: T.mute }}>No CV on file — this seat is read from job title alone, so the qualification is unverified rather than absent.</span>
        )}
      </span>
    </div>
  )
}

function BoardPanel({ b, pis }) {
  if (!b) return null

  return (
    <div style={{ fontSize: "12.5px", color: T.body, lineHeight: 1.7 }}>
      {/* PIS drives 5.1, so it is read first */}
      <div style={{ padding: "11px 13px", background: T.sand, borderRadius: "9px", border: `1px solid ${T.line}`, marginBottom: "12px" }}>
        <div style={{ fontWeight: 800, color: T.ink, marginBottom: "6px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          Public Interest Score
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "11.5px", background: "white", padding: "7px 9px", borderRadius: "6px", border: `1px solid ${T.line}` }}>
          {pis.employees} employees + {pis.turnoverComponent} turnover + {pis.liabilitiesComponent} liabilities + {pis.shareholders} shareholders = <strong>{pis.totalPIS}</strong>
        </div>
      </div>

      <Step
        num="5.1"
        title="Does this business need a board?"
        subtitle={`${b.requirement.label} · ${b.requirement.stage}`}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "9px" }}>
          {[
            { label: `Advisors — PIS < ${PIS_EMERGING_THRESHOLD}`, active: b.requirement.level === REQ_ADVISORS },
            { label: `Informal — ${PIS_EMERGING_THRESHOLD}–${PIS_FULL_BOARD_THRESHOLD - 1}`, active: b.requirement.level === REQ_INFORMAL },
            { label: `Formal — ≥ ${PIS_FULL_BOARD_THRESHOLD}`, active: b.requirement.level === REQ_FORMAL },
          ].map((band, i) => (
            <span key={i} style={{
              padding: "3px 9px", borderRadius: "20px", fontSize: "11px", fontWeight: band.active ? 700 : 500,
              background: band.active ? "#8d6e63" : "#f5f2f0", color: band.active ? "white" : T.faint,
              border: `1px solid ${band.active ? "#6d4c41" : T.line}`,
            }}>{band.label}</span>
          ))}
        </div>
        <Chip>Rationale</Chip>{b.requirement.rationale}
      </Step>

      <Step
        num="5.2"
        title="Does it have one, and who sits on it?"
        subtitle={b.provision.label}
        tone={b.gap > 0 ? "bad" : "good"}
        defaultOpen={b.gap > 0}
      >
        <div style={{ marginBottom: "7px" }}><Chip>Basis</Chip>{b.provision.source} — {b.provision.detail}</div>
        {b.gap > 0 ? (
          <div style={{ padding: "11px 13px", background: "#fdecea", borderRadius: "8px", border: "1px solid #e6b8ac" }}>
            <div style={{ fontWeight: 800, color: "#B71C1C", marginBottom: "5px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <AlertCircle size={13} /> Required but not in place — penalty applied
            </div>
            <div style={{ color: "#8d3a2e" }}>
              {b.verdict} A funder reads a missing board as unchecked founder risk: nobody has standing to challenge a bad decision before it is made.
              <div style={{ marginTop: "7px", fontFamily: "monospace", fontSize: "11.5px", background: "white", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e6b8ac" }}>
                {b.base} − {b.penalty} penalty = <strong>{b.score}%</strong> · Governance Maturity − {b.maturityPenalty}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "11px 13px", background: "#f1f8f1", borderRadius: "8px", border: "1px solid #c8e6c9", color: "#2E7D32" }}>
            <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              <CheckCircle size={13} /> No shortfall
            </div>
            {b.verdict}
          </div>
        )}
      </Step>

      <Step
        num="5.3"
        title="Is it structured and skilled correctly?"
        subtitle={b.boardExists ? `${b.composition.score}% across the weighted composition checks` : "Not assessable — no directors on record"}
        defaultOpen={b.gap === 0}
      >
        {!b.boardExists ? (
          <div style={{ padding: "11px 13px", background: "#f5f2f0", borderRadius: "8px", border: `1px dashed ${T.line}`, color: T.mute, fontStyle: "italic" }}>
            No directors are captured, so there is nobody to assess. Adding them under Ownership &amp; Management populates this — the directors are the board.
          </div>
        ) : (
          <>
            {b.skills && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ marginBottom: "7px" }}>
                  <Chip>Board skills</Chip>
                  <strong style={{ color: barColor(Math.round(b.skills.ratio * 100)) }}>{b.skills.coveredCount} of {b.skills.totalDomains}</strong>
                  <span style={{ color: T.mute }}> core competencies sit at the board table</span>
                </div>
                {BOARD_SKILL_DOMAINS.map((d) => {
                  const onBoard = b.skills.boardCoverage?.[d.key] || []
                  const bench = b.skills.benchCoverage?.[d.key] || []
                  const state = onBoard.length ? "board" : bench.length ? "bench" : "absent"
                  return (
                    <div key={d.key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                      <Dot color={state === "board" ? "#4CAF50" : state === "bench" ? "#FF9800" : "#F44336"} />
                      <span>
                        <strong style={{ color: T.ink }}>{d.label}:</strong>{" "}
                        {state === "board" && <span>{onBoard.map((h) => `${h.name} — ${h.basis}`).join("; ")}</span>}
                        {state === "bench" && (
                          <span style={{ color: T.mute }}>
                            {bench.map((h) => h.name).join(", ")} — in management, not on the board, so it isn't available for oversight
                          </span>
                        )}
                        {state === "absent" && <span style={{ color: "#B71C1C", fontWeight: 600 }}>Not covered anywhere — skills gap</span>}
                      </span>
                    </div>
                  )
                })}
                {!b.skills.hasCvEvidence && (
                  <div style={{ marginTop: "7px", fontStyle: "italic", color: T.mute, fontSize: "11.5px" }}>
                    Built from job titles only — no director CVs uploaded. Uploading them surfaces qualifications the titles don't show.
                  </div>
                )}
              </div>
            )}

            {b.qualificationRoster && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ marginBottom: "8px" }}>
                  <Chip>Who is at the table</Chip>
                  <strong style={{ color: T.ink }}>{b.qualificationRoster.directorCount} director{b.qualificationRoster.directorCount === 1 ? "" : "s"}</strong>
                  <span style={{ color: T.mute }}>
                    {" "}· {b.qualificationRoster.parsedCount} with a readable CV · {b.qualificationRoster.qualifiedCount} with a verified qualification
                  </span>
                </div>
                {b.qualificationRoster.directors.map((p, i) => <PersonRow key={`d${i}`} p={p} />)}
                {b.qualificationRoster.advisors.length > 0 && (
                  <>
                    <div style={{ marginTop: "9px", marginBottom: "5px", fontWeight: 700, color: T.ink, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Advisors</div>
                    {b.qualificationRoster.advisors.map((p, i) => <PersonRow key={`a${i}`} p={p} />)}
                  </>
                )}
              </div>
            )}

            {b.committees?.applicable && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ marginBottom: "7px" }}>
                  <Chip>Committees</Chip>
                  <strong style={{ color: barColor(Math.round(b.committees.ratio * 100)) }}>
                    {b.committees.presentCount} of {b.committees.expectedCount}
                  </strong>
                  <span style={{ color: T.mute }}> expected committees in place</span>
                </div>
                {b.committees.expected.map((e) => (
                  <div key={e.key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                    <Dot color={e.present ? "#4CAF50" : "#F44336"} />
                    <span>
                      <strong style={{ color: T.ink }}>{e.label}:</strong>{" "}
                      {e.present ? <span>{e.members.join(", ")}</span> : <span style={{ color: "#B71C1C" }}>Not in place — {e.why}.</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginBottom: "7px" }}><Chip>Composition</Chip><strong style={{ color: T.ink }}>{b.composition.score}%</strong></div>
            {b.composition.checks.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
                <Dot color={c.skip ? "#bdbdbd" : c.pass ? "#4CAF50" : c.credit > 0 ? "#FF9800" : "#F44336"} />
                <span>
                  <strong style={{ color: c.skip ? T.mute : T.ink }}>{c.label}</strong>
                  <span style={{ color: T.faint, fontSize: "11px" }}>
                    {c.skip ? " · not scored — the data cannot answer this yet" : ` · ${c.weight}% of 5.3${c.credit > 0 && c.credit < 1 ? ` · ${Math.round(c.credit * 100)}% credit` : ""}`}
                  </span>
                  <br />
                  <span style={{ color: c.skip ? T.mute : c.pass ? T.body : "#8d3a2e", fontStyle: c.skip ? "italic" : "normal" }}>{c.detail}</span>
                </span>
              </div>
            ))}
          </>
        )}
      </Step>
    </div>
  )
}

// Evidence gaps read as improvements, because that is what they are.
function EvidenceGaps({ gaps }) {
  if (!gaps?.length) {
    return (
      <div style={{ padding: "12px 14px", background: "#f1f8f1", border: "1px solid #c8e6c9", borderRadius: "9px", color: "#2E7D32", lineHeight: 1.7, fontSize: "12.5px" }}>
        <div style={{ fontWeight: 800, marginBottom: "4px", fontSize: "11.5px", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <CheckCircle size={13} /> Evidence complete
        </div>
        Every director and advisor is named, classified and backed by a readable CV. This assessment rests on evidence rather than inference.
      </div>
    )
  }
  return (
    <>
      <div style={{ fontSize: "12.5px", color: T.body, lineHeight: 1.7, marginBottom: "11px" }}>
        These carry no fixed point value — the board score moves by whatever the new evidence proves. They are listed worst-first.
      </div>
      {gaps.map((g, i) => {
        const st = GAP_SEVERITY[g.severity] || GAP_SEVERITY.low
        return (
          <div key={i} style={{ padding: "10px 12px", background: st.bg, border: `1px solid ${st.border}`, borderRadius: "9px", marginBottom: "7px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, color: st.text, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "4px" }}>{st.label}</div>
            <div style={{ color: T.ink, fontWeight: 600, marginBottom: "3px", fontSize: "12.5px" }}>{g.what}</div>
            <div style={{ color: st.text, lineHeight: 1.7, fontSize: "12.5px" }}>{g.action}</div>
          </div>
        )
      })}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════

export function GovernanceLeadershipScoreCard({ styles, profileData, onScoreUpdate, apiKey, onNavigate }) {
  const [showModal, setShowModal] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const [potential, setPotential] = useState(null)
  const [overallScore, setOverallScore] = useState(0)
  const [cvProfiles, setCvProfiles] = useState([])

  const [leadershipAiResult, setLeadershipAiResult] = useState("")
  const [governanceAiResult, setGovernanceAiResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [evaluationTimestamp, setEvaluationTimestamp] = useState(null)

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

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

  // ── Score — a pure function of (profile, CVs). The AI is not in this path ──
  useEffect(() => {
    if (!profileData) return
    try {
      const a = computeAll(profileData, cvProfiles)
      setAssessment(a)
      setOverallScore(a.overall)
      if (onScoreUpdate) onScoreUpdate(a.overall)
    } catch (e) {
      console.error("Governance scoring error:", e)
    }
  }, [profileData, cvProfiles])

  // ── Potential points — each figure measured by re-running computeAll with
  //    the action applied. Deferred until the modal opens. ──
  useEffect(() => {
    if (!showModal || !profileData || !assessment) return
    try {
      setPotential(buildOpportunities(profileData, cvProfiles, (p, c) => computeAll(p, c).overall, assessment.leadership))
    } catch (e) {
      console.error("Potential points error:", e)
    }
  }, [showModal, profileData, cvProfiles, assessment])

  const goTo = (route) => {
    if (!route) return
    if (onNavigate) onNavigate(route)
    else window.location.assign(route)
  }

  // ── AI (prompt building is unchanged; see prepareLeadershipData and
  //    buildBoardPromptAddendum, which move across with the rest) ──
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

      const om = profileData?.ownershipManagement || {}
      const validDirectors = (om.directors || []).filter((d) => d?.name && d.name.trim() !== "")
      const validExecutives = (om.executives || []).filter((e) => e?.name && e.name.trim() !== "")
      const execSplit = validDirectors.reduce((acc, d) => {
        if (d.execType === "Executive") acc.exec++
        else if (d.execType === "Non-Executive") acc.nonExec++
        else acc.unspecified++
        return acc
      }, { exec: 0, nonExec: 0, unspecified: 0 })

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

      const leadershipPrompt = await prepareLeadershipData(userId, profileData, cvProfiles)
      const governancePrompt =
        buildGovernancePrompt(profileData, pisCalc, board.requirement.stage, board.requirement.label) +
        buildBoardPromptAddendum(board)

      const [leadershipResp, governanceResp] = await Promise.all([
        generateLeadershipAnalysis({ prompt: leadershipPrompt }),
        generateGovernanceAnalysis({ prompt: governancePrompt }),
      ])

      const leadershipText = leadershipResp?.data?.content
      const governanceText = governanceResp?.data?.content
      if (!leadershipText && !governanceText) throw new Error("Invalid response format from server")

      const timestamp = new Date()
      if (leadershipText) setLeadershipAiResult(leadershipText)
      if (governanceText) setGovernanceAiResult(governanceText)
      setEvaluationTimestamp(timestamp.toLocaleString())

      if (userId) {
        if (leadershipText) {
          await setDoc(doc(db, "aiLeadershipEvaluation", userId), { result: leadershipText, timestamp, profileSnapshot: profileData }, { merge: true })
        }
        if (governanceText) {
          await setDoc(doc(db, "aiGovernanceEvaluation", userId), { result: governanceText, timestamp, profileSnapshot: profileData }, { merge: true })
        }
      }
    } catch (error) {
      console.error("Governance & Leadership AI evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

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
        const [ls, gs] = await Promise.all([getDoc(leadershipRef), getDoc(governanceRef)])
        if (ls.exists() && ls.data().result) setLeadershipAiResult(ls.data().result)
        if (gs.exists() && gs.data().result) setGovernanceAiResult(gs.data().result)
        const ts = gs.data()?.timestamp || ls.data()?.timestamp
        if (ts) setEvaluationTimestamp(new Date(ts.toDate()).toLocaleString())
      } catch (e) {
        console.error("Error loading saved evaluations:", e)
      }
    })
    return () => unsubscribe()
  }, [auth?.currentUser?.uid, apiKey])

  // ─────────────────────────────────────────────────────────────────────
  // Assemble what the explorer needs
  // ─────────────────────────────────────────────────────────────────────
  const scoreLevel = getScoreLevel(overallScore)
  const a = assessment
  const b = a?.board

  const narrative = useMemo(
    () => ({ ...parseNarrative(leadershipAiResult), ...parseNarrative(governanceAiResult) }),
    [leadershipAiResult, governanceAiResult]
  )

  const explorer = useMemo(() => {
    if (!a) return null

    const pillars = buildPillars(a)
    const domains = buildDomains(pillars)
    const pillarOf = (key) => pillars.find((p) => p.key === key)

    // An element's weight is expressed against its DOMAIN, so the numbers on
    // one screen add to 100. Its effective weight is what it contributes to
    // the card overall, which is the figure that actually matters.
    const mkElement = ({ key, label, percent, catWeight, catTotal, pillar, domainWeight, items, groups, extra, improvements, sourceNote, aliases }) => {
      const shareOfPillar = catTotal ? catWeight / catTotal : 1
      const weightOfDomain = Math.round((pillar.weight / domainWeight) * shareOfPillar * 100)
      return {
        key,
        label,
        percent,
        weight: weightOfDomain,
        effectiveWeight: Math.round(pillar.weight * shareOfPillar * 10) / 10,
        breakdown: items || [],
        groups: groups || [],
        extra,
        improvements: improvements || [],
        analysis: findAnalysis(narrative, label, aliases),
        sourceNote: sourceNote || `${label} · ${Math.round(shareOfPillar * 100)}% of ${pillar.label}, which is ${pillar.weight}% of the card.`,
      }
    }

    // ── Leadership domain ──
    const leadershipPillar = pillarOf("leadership")
    const leadershipDomain = domains.find((d) => d.key === "leadership")
    const leadCats = (a.leadership.categories || []).map((c) => ({
      key: c.key || normLabel(c.name || c.label),
      label: c.name || c.label,
      percent: c.percent != null ? c.percent : c.score,
      weight: c.weight || 0,
      items: c.items || [],
    }))
    const leadTotal = leadCats.reduce((s, c) => s + c.weight, 0) || leadCats.length

    const leadershipElements = leadCats.length
      ? leadCats.map((c) =>
          mkElement({
            key: `leadership:${c.key}`,
            label: c.label,
            percent: c.percent,
            catWeight: c.weight || 1,
            catTotal: leadTotal,
            pillar: leadershipPillar,
            domainWeight: leadershipDomain.weight,
            items: c.items,
          })
        )
      : [
          mkElement({
            key: "leadership:quality",
            label: "Leadership Quality",
            percent: leadershipPillar.percent,
            catWeight: 1,
            catTotal: 1,
            pillar: leadershipPillar,
            domainWeight: leadershipDomain.weight,
            items: a.leadership.items || [],
          }),
        ]

    // ── Governance domain ──
    const ownershipPillar = pillarOf("ownership")
    const maturityPillar = pillarOf("maturity")
    const govDomain = domains.find((d) => d.key === "governance")

    const govElements = [
      mkElement({
        key: "governance:ownership",
        label: "Ownership & Structure",
        percent: ownershipPillar.percent,
        catWeight: 1,
        catTotal: 1,
        pillar: ownershipPillar,
        domainWeight: govDomain.weight,
        items: a.ownership.items || [],
        aliases: ["Ownership", "Ownership and Structure"],
      }),
    ]

    const matCats = a.maturityCategories || []
    const matTotal = matCats.reduce((s, c) => s + c.weight, 0) || 1

    matCats.forEach((c) => {
      const isBoard = /board/i.test(c.name)
      govElements.push(
        mkElement({
          key: `governance:${normLabel(c.name)}`,
          label: c.name,
          percent: c.score,
          catWeight: c.weight,
          catTotal: matTotal,
          pillar: maturityPillar,
          domainWeight: govDomain.weight,
          items: c.items || [],
          extra: isBoard ? <BoardPanel b={b} pis={a.pis} /> : undefined,
          // Evidence gaps ARE the improvements for Board Structure — they are
          // what changes the score, and they were previously buried at the
          // bottom of a 250-line panel.
          improvements: [],
          aliases: isBoard ? ["Board", "Board Structure", "5.2", "5.3"] : [],
          sourceNote: isBoard
            ? `${c.weight} of ${matTotal} of Governance Maturity. The three questions below are answered in order, and 5.1 against 5.2 is what drives the penalty.`
            : undefined,
        })
      )
    })

    // Board Structure carries its evidence gaps in the improvements tab
    const boardEl = govElements.find((e) => /board/i.test(e.label))
    if (boardEl && b) {
      boardEl.extraImprovements = <EvidenceGaps gaps={b.evidenceGaps} />
    }

    const blocks = [
      {
        key: "leadership",
        label: "Leadership",
        percent: leadershipDomain.percent,
        blockWeight: leadershipDomain.weight,
        note: "Who is running this business, and are they any good at it? Read from uploaded CVs, the operating team, and the six Business Leadership answers.",
        elements: leadershipElements,
      },
      {
        key: "governance",
        label: "Governance",
        percent: govDomain.percent,
        blockWeight: govDomain.weight,
        note: "What structures hold them to account? Ownership and directorship, plus how mature the governance around them is. A strong founder with no board passes Leadership and fails here.",
        elements: govElements,
      },
    ]

    const attention = []
    if (b && b.gap > 0) {
      attention.push({
        key: "boardGap",
        headline: `Board required but not in place — ${b.penalty}-point penalty`,
        detail: b.verdict,
        chips: [],
        note: `Governance Maturity carries a further ${b.maturityPenalty}-point deduction on top, because a business that needs a board and has not got one should not be rescued by a tidy set of policies.`,
        cta: "Go to Ownership & Management",
        route: "/profile?section=ownershipManagement",
      })
    }
    const blocking = (b?.evidenceGaps || []).filter((g) => g.severity === "high")
    if (blocking.length) {
      attention.push({
        key: "evidence",
        headline: `${blocking.length} blocking evidence gap${blocking.length === 1 ? "" : "s"}`,
        detail:
          "Checks are being dropped from the calculation because the data cannot answer them. A missing CV is not scored against you — it is scored as unknown, which is why supplying it can move the score in either direction.",
        chips: blocking.map((g) => g.what),
        cta: "Go to Ownership & Management",
        route: "/profile?section=ownershipManagement",
      })
    }

    return {
      blocks,
      attention,
      about: {
        definition:
          "This card answers two separate questions, and a funder treats them as two separate findings. Leadership asks who is running the business and whether they are any good at it. Governance asks what structures hold them to account. A capable founder with no board passes the first and fails the second, so the two are kept apart rather than averaged into one verdict.",
        definitionNotes: [
          {
            title: "Why Ownership & Structure sits under Governance",
            body: "Directors, shareholders and the executive / non-executive split describe the accountability structure, not the calibre of the people in it. Where those people are strong and the structure is thin, the card should be able to say exactly that.",
          },
          {
            title: "Evidence, not inference",
            body: "A missing CV means a seat is unverified, not that the person is unqualified. It scores neutral and is listed under Board Structure's improvements instead. Where the data cannot answer a check at all, the check is dropped from its own denominator rather than scored zero.",
          },
          {
            title: "Non-executive is not independent",
            body: "A director linked to a shareholder row protects their own capital, not the company's governance, so they are not counted towards independent representation however the form describes them.",
          },
        ],
        assessmentAreas: blocks.flatMap((bl) =>
          bl.elements.map((e) => ({
            label: e.label,
            weightLabel: `${e.weight}% of ${bl.label}`,
            detail: ELEMENT_PURPOSE[e.key.split(":")[1]] || e.sourceNote,
          }))
        ),
        interpretation: INTERPRETATION,
        weighting: {
          formula: "value = score(profile + action) − score(profile)",
          formulaNote:
            "Unlike the other cards, a point value here cannot be divided out of a table: the board shortfall penalty deducts twice, composition checks drop out of their own denominator when evidence is missing, and the Public Interest Score moves the requirement band — so adding one director can move the score by an amount no fixed table would predict. Every figure is measured by applying the action to a copy of your profile and re-running the same scoring function the card uses.",
          tables: [
            {
              title: "Domain weighting",
              firstColumn: "Domain",
              rows: domains.map((d) => ({ label: d.label, weight: `${d.weight}%`, now: `${d.percent}%` })),
              note: "Each domain scores 0–100 on its own terms, then contributes at the weight shown.",
            },
            {
              title: "Pillar weighting",
              firstColumn: "Pillar",
              rows: pillars.map((p) => ({ label: `${p.label} — ${p.source}`, weight: `${p.weight}%`, now: `${p.percent}%` })),
            },
            {
              title: "Within Board Structure (5.3)",
              firstColumn: "Check",
              rows: [
                { label: "Board skills coverage", weight: "22%", now: b?.skills ? `${Math.round(b.skills.ratio * 100)}%` : "—" },
                { label: "Independent presence", weight: "18%", now: b ? `${b.boardSplit?.nonExec + b.boardSplit?.independent || 0} directors` : "—" },
                { label: "Director qualification evidence", weight: "15%", now: b?.qualificationRoster ? `${b.qualificationRoster.parsedCount}/${b.qualificationRoster.directorCount} CVs read` : "—" },
                { label: "Board size", weight: "10%", now: b?.qualificationRoster ? `${b.qualificationRoster.directorCount}` : "—" },
                { label: "Non-executive ratio", weight: "8%", now: "—" },
                { label: "Meeting cadence", weight: "8%", now: "—" },
                { label: "Committees", weight: "8%", now: b?.committees?.applicable ? `${b.committees.presentCount}/${b.committees.expectedCount}` : "not expected" },
                { label: "Role concentration", weight: "7%", now: "—" },
                { label: "Exec / non-exec classification", weight: "4%", now: b ? `${b.boardSplit?.unclassified || 0} unclassified` : "—" },
              ],
              note: `If 5.1 says a board is needed and 5.2 says there is not one, the score is penalised by ${BOARD_GAP_PENALTY[1]}–${BOARD_GAP_PENALTY[3]} points and Governance Maturity takes a further deduction. PIS = Employees + (Turnover ÷ R1m) + (Liabilities ÷ R1m) + Shareholders.`,
            },
          ],
        },
      },
      potential: potential
        ? {
            available: potential.combinedPoints,
            locked: potential.earnByDoingPoints,
            current: overallScore,
            projected: potential.ceiling,
            items: (potential.opportunities || []).map((o) => ({
              key: o.key,
              label: o.label,
              container: o.section,
              state: "missing",
              earned: 0,
              pointValue: o.pointValue,
              projected: o.projected,
              evidence: o.note || null,
              importance: o.importance,
              fix: o.action,
              section: o.section,
              route: o.route,
            })),
            lockedItems: potential.earnByDoing || [],
            lockedTitle: "Earn by doing",
            lockedNote:
              "These are self-assessed answers you have already given. The points are real, but they belong to the work rather than the dropdown — changing the answer without doing the thing is something a funder finds in five minutes of due diligence. Left out of the total above rather than dressed up as an action.",
            footnotes:
              potential.unreachable?.length
                ? [
                    {
                      title: `Why ${potential.ceiling}% and not 100%`,
                      body: `The remaining ${fmtPts(100 - potential.ceiling)} is not reachable by filling in this profile. Each reason below is a real one rather than a rounding artefact.`,
                      items: potential.unreachable,
                    },
                  ]
                : [],
          }
        : { available: 0, locked: 0, current: overallScore, projected: overallScore, items: [], lockedItems: [] },
      summary: null,
    }
  }, [a, b, narrative, potential, overallScore])

  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Leadership &amp; Governance</h2>
            <Users size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Who's in charge,are they trusted</p>
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

          {b && b.gap > 0 && (
            <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "#fdecea", border: "1px solid #e6b8ac", borderRadius: "20px", color: "#B71C1C", fontWeight: 700, fontSize: "10.5px", lineHeight: 1.4 }}>
              <AlertCircle size={12} /> Board required but not in place
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(93,64,55,0.4)" }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(93,64,55,0.3)" }}
          >
            <span>Explore your score</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal — one screen at a time ── */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", width: "100%", maxWidth: "620px", border: "1px solid #e8ddd6", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {explorer ? (
              <ScoreExplorer
                title="Leadership & Governance"
                score={overallScore}
                band={scoreLevel}
                contextLine={
                  <>
                    {b ? (
                      <>
                        Governance stage: <strong style={{ color: "#5d4037" }}>{b.requirement.stage} — {b.requirement.label}</strong>
                      </>
                    ) : null}
                    <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "4px" }}>{scoreLevel.description}</div>
                  </>
                }
                about={explorer.about}
                blocks={explorer.blocks}
                potential={explorer.potential}
                attention={explorer.attention}
                summary={explorer.summary}
                onNavigate={goTo}
                onClose={() => setShowModal(false)}
                onRequestAnalysis={runAiEvaluation}
                analysisPending={isEvaluating}
                analysisTimestamp={evaluationTimestamp}
                fmtPts={fmtPts}
              />
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "#8d6e63", fontSize: "13px" }}>
                <RefreshCw size={18} className="spin" style={{ marginBottom: "10px" }} />
                <div>Working out your score…</div>
              </div>
            )}

            {evaluationError && (
              <div style={{ padding: "12px 16px", backgroundColor: "#f8d7da", color: "#721c24", borderTop: "1px solid #f5c6cb", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={15} /> {evaluationError}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// prepareLeadershipData and buildBoardPromptAddendum move across from the
// old file UNCHANGED, except that they now take (userId, profileData,
// cvProfiles) and (board) as arguments rather than closing over component
// state. Both are long, both are pure string builders, and neither needed a
// single edit for this rewrite — keep them in governance-scoring.js next to
// the assessment they describe, or in a governance-prompts.js of their own.
// ─────────────────────────────────────────────────────────────────────────