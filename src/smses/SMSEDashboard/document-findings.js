// ─────────────────────────────────────────────────────────────────────────
// DOCUMENT FINDINGS
//
// Four of the scored elements are backed by a document that was already read
// and scored by its own evaluator, and the result is sitting in Firestore:
//
//   aiEvaluations          business plan   → evaluation.content   (scorecard prose)
//   aiPitchEvaluations     pitch deck      → evaluation.content   (scorecard prose)
//   creditAnalyses         credit report   → analysisResult.negativeItems (array)
//   aiFinancialEvaluations statements      → evaluation.summary + breakdown (object)
//
// The card was using only the headline number off each of those — score 64,
// score 18, creditScore 625 — and throwing the reasoning away. So a business
// scoring 18/100 on its pitch deck was told "pitch deck: 18%, capture more"
// when the stored analysis already said, in detail, that the deck describes a
// different company than the profile does.
//
// These parsers recover that. They produce two things per document:
//
//   weakAreas   — the criteria that scored badly, with the evaluator's own
//                 justification. Shown under 2.1 Score breakdown.
//   improvements— the evaluator's Priority Improvements, verbatim.
//                 Shown under 2.3 Improvements.
//
// IMPORTANT: none of this carries a point value. Points come from the scoring
// function and only from there. These are qualitative findings and are labelled
// as such in the UI, so a business never confuses "rewrite your pitch deck"
// (which changes the underlying document score whenever it is re-evaluated)
// with "capture your VAT number" (which is worth exactly +1.8%).
// ─────────────────────────────────────────────────────────────────────────

const clean = (s) =>
  String(s || "")
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

const first = (text, re) => {
  const m = String(text || "").match(re);
  return m ? clean(m[1]) : null;
};

// ── The scorecard prose used by the business plan and pitch deck evaluators ──
//
// Two shapes are in the wild and both have to parse:
//
//   A   **1. Problem Clarity:** 5/5
//       The business plan clearly articulates…
//
//   B   **1. Problem Clarity:**
//       *   **Score:** 0/5
//       *   **Justification:** The deck fails to articulate…
//
// A is score-on-the-heading, B is score-in-a-bullet. Same evaluator, different
// runs, so the parser reads the heading first and falls back into the body.

const CRITERION_HEADING = /^[ \t]*\*\*\s*(\d+)\.\s*([^*]+?)\s*:?\s*\*\*[ \t]*(.*)$/gm;

export function parseScorecard(content) {
  const text = String(content || "");
  if (!text.trim()) return null;

  const criteria = [];
  const marks = [];
  let m;
  CRITERION_HEADING.lastIndex = 0;
  while ((m = CRITERION_HEADING.exec(text)) !== null) {
    marks.push({ index: m.index, end: m.index + m[0].length, n: Number(m[1]), label: clean(m[2]), tail: m[3] || "" });
  }

  marks.forEach((mk, i) => {
    const body = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].index : text.length);
    const inline = mk.tail.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
    const inBody = body.match(/\*\*\s*Score\s*:?\s*\*\*\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i) ||
      body.match(/^\s*[-*•]?\s*Score\s*:?\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/im);
    const hit = inline || inBody;
    if (!hit) return; // a numbered line that is not a scored criterion

    const justification =
      first(body, /\*\*\s*Justification\s*:?\s*\*\*\s*([\s\S]+?)(?=\n\s*\n|\n\s*\*\*|$)/i) ||
      clean(body.replace(/\*\*\s*Score\s*:?\s*\*\*[^\n]*\n?/i, "")).slice(0, 400) ||
      null;

    criteria.push({
      n: mk.n,
      label: mk.label,
      score: Number(hit[1]),
      max: Number(hit[2]),
      justification,
    });
  });

  // ── Priority Improvements ──
  const improvements = [];
  const piMatch = text.match(/\*\*\s*Priority Improvements\s*:?\s*\*\*/i);
  if (piMatch) {
    const rest = text.slice(piMatch.index + piMatch[0].length);
    rest
      .split(/^\s*\d+\.\s+/m)
      .slice(1)
      .forEach((chunk) => {
        const stop = chunk.search(/\n\s*(?:---|\*\*(?:BIG|Total|Investment|Categoriz))/i);
        const raw = (stop > -1 ? chunk.slice(0, stop) : chunk).trim();
        if (!raw) return;
        const titled = raw.match(/^\*\*(.+?)\s*:?\s*\*\*\s*([\s\S]*)$/);
        improvements.push({
          title: titled ? clean(titled[1]) : clean(raw).slice(0, 80),
          body: clean(titled ? titled[2] : raw),
        });
      });
  }

  const totalMatch = text.match(/BIG Fundability Score\s*:?\s*\*{0,2}\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);

  return {
    criteria,
    improvements,
    total: totalMatch ? { score: Number(totalMatch[1]), max: Number(totalMatch[2]) } : null,
    verdict:
      first(text, /\*\*\s*Investment-Ready Label\s*:?\s*\*\*\s*(.+)/i) ||
      first(text, /\*\*\s*Categorization\s*:?\s*\*\*\s*(.+)/i),
    operational: (() => {
      const o = text.match(/Operational Strength Score\s*:?\s*\*{0,2}\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
      return o ? { score: Number(o[1]), max: Number(o[2]) } : null;
    })(),
  };
}

// Anything at or below 60% of its maximum is a weak area worth surfacing.
// Sorted worst-first, because a 0/5 is the sentence a funder stops on.
export const weakAreasFrom = (parsed, threshold = 0.6) =>
  (parsed?.criteria || [])
    .filter((c) => c.max > 0 && c.score / c.max <= threshold)
    .sort((a, b) => a.score / a.max - b.score / b.max)
    .map((c) => ({
      label: c.label,
      score: `${c.score}/${c.max}`,
      severity: c.score === 0 ? "critical" : c.score / c.max <= 0.4 ? "high" : "moderate",
      note: c.justification,
    }));

export const strongAreasFrom = (parsed, threshold = 0.8) =>
  (parsed?.criteria || [])
    .filter((c) => c.max > 0 && c.score / c.max >= threshold)
    .map((c) => ({ label: c.label, score: `${c.score}/${c.max}` }));

// ── Credit report ──
// negativeItems is already a clean array of sentences on the Firestore doc.
// No parsing needed; it just has to stop being ignored.
export function creditFindings(creditReportAnalysis) {
  if (!creditReportAnalysis) return null;
  const negatives = creditReportAnalysis.negativeItems || [];
  const positives = creditReportAnalysis.positiveItems || [];
  if (!negatives.length && !positives.length && !creditReportAnalysis.overallAssessment) return null;

  return {
    source: "credit report",
    headline: creditReportAnalysis.label
      ? `${creditReportAnalysis.label}${creditReportAnalysis.score ? ` · score ${creditReportAnalysis.score}` : ""}`
      : null,
    summary: creditReportAnalysis.overallAssessment || null,
    weakAreas: negatives.map((t) => ({
      label: shortLabel(t),
      note: clean(t),
      severity: /judgment|default|arrear|listed|adverse/i.test(t) ? "critical" : "moderate",
    })),
    strongAreas: positives.slice(0, 4).map((t) => ({ label: shortLabel(t), note: clean(t) })),
    improvements: [],
    disclaimer:
      "These come from the credit bureau report you uploaded. They move as your credit record moves, not as the form changes.",
  };
}

// negativeItems are full sentences. The list needs a scannable left-hand label,
// so take the first clause and cap it rather than printing the sentence twice.
function shortLabel(sentence) {
  const s = clean(sentence);
  // Split on real clause breaks only — a naive `.` split cuts "11.6 days" in half.
  const cut = s.split(/[,;:]|\.(?=\s|$)|\s+due to\s+|\s+because\s+/i)[0];
  return cut.length > 58 ? `${cut.slice(0, 55)}…` : cut;
}

// ── Financial statements ──
// breakdown is { revenueGrowth: 4, profitability: 5, … } out of 5.
const prettify = (k) =>
  String(k)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

export function statementFindings(financialStatementsAnalysis) {
  const fs = financialStatementsAnalysis;
  if (!fs) return null;
  const entries = Object.entries(fs.breakdown || {}).filter(([, v]) => typeof v === "number");
  if (!entries.length && !fs.summary) return null;

  return {
    source: "financial statements",
    headline: fs.overallScore != null ? `${fs.overallScore}/5 overall` : null,
    summary: fs.summary || null,
    weakAreas: entries
      .filter(([, v]) => v <= 3)
      .sort((a, b) => a[1] - b[1])
      .map(([k, v]) => ({
        label: prettify(k),
        score: `${v}/5`,
        severity: v <= 1 ? "critical" : v <= 2 ? "high" : "moderate",
        note: null,
      })),
    strongAreas: entries.filter(([, v]) => v >= 4).map(([k, v]) => ({ label: prettify(k), score: `${v}/5` })),
    improvements: [],
    disclaimer:
      "Read from the statements you uploaded. Improving these means the underlying numbers changing, then a re-upload.",
  };
}

// ── One map, keyed the way the elements are keyed ──
export function buildDocumentFindings({
  businessPlanAnalysis,
  pitchDeckAnalysis,
  creditReportAnalysis,
  financialStatementsAnalysis,
}) {
  const out = {};

  const fromScorecard = (analysis, source, docLabel) => {
    if (!analysis?.content) return null;
    const parsed = parseScorecard(analysis.content);
    if (!parsed || (!parsed.criteria.length && !parsed.improvements.length)) return null;
    return {
      source,
      docLabel,
      headline: parsed.total
        ? `${parsed.total.score}/${parsed.total.max}${parsed.verdict ? ` · ${parsed.verdict}` : ""}`
        : parsed.verdict,
      summary: null,
      weakAreas: weakAreasFrom(parsed),
      strongAreas: strongAreasFrom(parsed),
      improvements: parsed.improvements,
      criteria: parsed.criteria,
      disclaimer: `From the ${docLabel} evaluation already on file. Resolving these changes the ${docLabel} score when it is re-evaluated — they are not point-valued profile fields.`,
    };
  };

  const bp = fromScorecard(businessPlanAnalysis, "business plan", "business plan");
  const pd = fromScorecard(pitchDeckAnalysis, "pitch deck", "pitch deck");
  const cr = creditFindings(creditReportAnalysis);
  const fs = statementFindings(financialStatementsAnalysis);

  if (bp) out["fundability:businessPlan"] = bp;
  if (pd) out["fundability:pitchDeck"] = pd;
  if (cr) {
    out["fundability:creditworthiness"] = cr;
    out["financialStrength:credit"] = cr;
  }
  if (fs) {
    out["financialStrength:records"] = fs;
    out["fundability:financialResilience"] = fs;
  }

  return out;
}