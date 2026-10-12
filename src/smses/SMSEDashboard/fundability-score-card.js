"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ChevronDown, AlertCircle, DollarSign, RefreshCw } from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import { doc, onSnapshot, updateDoc, setDoc, getDoc, deleteField } from "firebase/firestore";
import { logAnalysisFailure } from "./analysis-failure-log";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirebaseFunctions } from "./hooks";
import { useSolvencyScore } from "../hooks/useSolvencyScore";
import { normalizeSolvencyScore } from "../MyGrowthTools/financial/data_utils/solvencyScoreUtils";
import {
  buildCapitalAppealAssessment, fmtPts, detectInstruments, applicationSnapshot, METHODOLOGY_VERSION,
  STAGE_LABELS, FS_FACTOR_WEIGHTS,
} from "./fundability-potential";
import { buildDocumentFindings } from "./document-findings";
import ScoreExplorer from "./ScoreExplorer";

// ─────────────────────────────────────────────────────────────────────────
// CAPITAL APPEAL — BIG Score Scoring Methodology v3.0
//
// Scoring is deterministic: buildCapitalAppealAssessment produces every
// number in code and the AI never writes one.
//
//   ORIGINAL Capital Appeal = Financial Strength alone (§8). This is the figure
//   on the card and the one passed to onScoreUpdate, so the BIG Score is built
//   from the universal profile and never moves because of a funding request.
//
//   APPLICATION CONTEXT (§8–§9). A complete funding request adds Fundability,
//   scored for the request's INSTRUMENT (not an amount or the retired A–D
//   tiers). It is combined with Financial Strength using the stage split and
//   shown beside the original, never over it. Several instruments on one
//   request are scored separately and not averaged. An unknown instrument is
//   "Not assessed", not zero.
//
// MULTIPLE FUNDING APPLICATIONS
//
//   One business can hold several funding requests, and Fundability belongs to
//   the REQUEST (§2), so every complete (or submitted) application in
//   fundingApplicationsV2 is assessed on its own: its own instrument, its own
//   useOfFunds / growthPotential / socialImpact / security instruments, overlaid
//   on the profile. They all share one Capital Appeal headline (Financial
//   Strength does not depend on the request).
//
//   - The explorer shows one application at a time; a switcher lists them all.
//   - Each result is stored on its application
//     (fundingApplicationsV2/{id}.fundabilityAssessment) so the applications
//     list can show it, and only rewritten when its signature changes.
//   - The AI narrative is written and stored per application
//     (…/{id}.fundabilityNarrative). The trigger honours
//     fundabilityEvaluationApplicationId on the profile, so saving application B
//     explains B, not whichever application happens to score highest.
//
// Category 5 of 5 in the taxonomy:
//   1. Compliance  2. Legitimacy  3. Leadership & Governance
//   4. Operational Strength  5. Capital Appeal (this file)
// ─────────────────────────────────────────────────────────────────────────

const INSTRUMENT_BADGE = { bg: "#fdf8f6", border: "#8d6e63", text: "#5d4037" };

const FUNDING_SECTION_LABELS = {
  applicationOverview: "Application Overview",
  useOfFunds: "Use of Funds",
  enterpriseReadiness: "Enterprise Readiness",
  guarantees: "Guarantees",
  growthPotential: "Growth Potential",
  socialImpact: "Social Impact",
  documentUpload: "Document Upload",
  declarationCommitment: "Declaration & Commitment",
};
const REQUIRED_FUNDING_SECTIONS = Object.keys(FUNDING_SECTION_LABELS);
const FUNDING_ROUTE = "/applications/funding";

// ─────────────────────────────────────────────────────────────────────────
// Funding applications (fundingApplicationsV2)
// ─────────────────────────────────────────────────────────────────────────

// An application counts once it is submitted or every required section is done.
const isAppComplete = (a) =>
  a?.status === "submitted" ||
  REQUIRED_FUNDING_SECTIONS.every((k) => a?.completedSections?.[k] === true);

// The application's own answers replace the profile's, so each application is
// scored on what it actually says.
const withApplication = (pd, app) => ({
  ...pd,
  applicationOverview: app.applicationOverview ?? pd?.applicationOverview,
  useOfFunds: app.useOfFunds ?? pd?.useOfFunds,
  growthPotential: app.growthPotential ?? pd?.growthPotential,
  socialImpact: app.socialImpact ?? pd?.socialImpact,
});

// Security instruments: an application that stores its own list is scored on it;
// otherwise the profile's list stands. Relevance and availability are decided in
// the engine (summariseSecurity), per instrument — not here.
const securityFor = (app, profileSecurity = []) =>
  Array.isArray(app?.guarantees?.securityInstruments) ? app.guarantees.securityInstruments : profileSecurity;

const shortId = (id) => (id ? String(id).slice(-8).toUpperCase() : "");

const millis = (v) => (v?.toMillis ? v.toMillis() : v?.toDate ? v.toDate().getTime() : v ? new Date(v).getTime() || 0 : 0);

// Every qualifying application, assessed separately. With none, one profile-only
// assessment is returned so the headline still exists.
const assessAll = (pd, apps, analyses, fallbackApplied) => {
  const { profileSecurity = [], ...engineAnalyses } = analyses;
  const qualifying = (apps || [])
    .filter(isAppComplete)
    .sort((x, y) => millis(y.lastUpdated) - millis(x.lastUpdated));

  return (qualifying.length ? qualifying : [null]).map((app) => {
    const merged = app ? withApplication(pd, app) : pd;
    const detected = detectInstruments(merged);
    const assessment = buildCapitalAppealAssessment({
      profileData: merged,
      hasAppliedForFunding: app ? true : fallbackApplied,
      instrumentGroups: detected.groups,
      unmappedInstruments: detected.unmapped,
      securityInstruments: securityFor(app, profileSecurity),
      ...engineAnalyses,
    });
    return {
      id: app?.id ?? null,
      app,
      shortId: shortId(app?.id),
      assessment,
      detected,
      instrument: assessment.application.instrument,
    };
  });
};

// The default selection: the strongest application view. Unscored ones rank last;
// ties keep the most recently updated (assessAll sorts newest first).
const bestOf = (results) =>
  results.reduce((b, c) => ((c.assessment.application.score ?? -1) > (b.assessment.application.score ?? -1) ? c : b));

const fmtTs = (v) => {
  try {
    const d = v?.toDate ? v.toDate() : new Date(v);
    return Number.isFinite(d.getTime()) ? d.toLocaleString() : null;
  } catch {
    return null;
  }
};

// What each element is for, in one line. Used by About → 1.2 Assessment
// areas, which is a map of the assessment rather than a second copy of it.
const ELEMENT_PURPOSE = {
  revenueProfitability: "Whether the business earns money and keeps some of it — the first thing every funder looks at.",
  records: "Whether the numbers are auditable. Unverified figures are treated as claims, not facts.",
  balanceSheet: "What the business owns against what it owes, and whether it can meet the next twelve months.",
  debt: "Existing obligations and how well they are being serviced. New debt sits behind old debt.",
  credit: "The external credit record — the one number a lender can check without asking you.",
  businessPlan: "Whether there is a costed, coherent investment case for the money.",
  pitchDeck: "Whether the case can be communicated to an investment committee.",
  impactMandate: "Outcomes evidence — ownership, jobs and environmental impact — assessed generically. Fit to one funder's mandate is matched separately.",
  creditworthiness: "Repayment capacity as evidenced by the credit report on file.",
  guarantees: "Security that can be enforced if the plan does not work: instruments that are current, whether signed, and what they are worth.",
  financialResilience: "Whether the business survives a bad year, read from the statements and the solvency position.",
  growthPotential: "Whether the capital compounds or is simply consumed.",
};

const INTERPRETATION = [
  { range: "91–100%", label: "Highly fundable", color: "#1B5E20", meaning: "Fundable as presented. Diligence confirms rather than discovers." },
  { range: "81–90%", label: "Strong investment case", color: "#4CAF50", meaning: "A funder engages. Expect questions on one or two areas, not a rebuild." },
  { range: "61–80%", label: "Moderate potential", color: "#FF9800", meaning: "Credible but incomplete. Most declines at this level are about evidence, not the business." },
  { range: "41–60%", label: "Basic potential", color: "#F44336", meaning: "The shape of a case exists. Non-bank and development routes are more realistic than commercial credit." },
  { range: "0–40%", label: "Needs development", color: "#B71C1C", meaning: "Not yet a fundable file. Build the record before approaching capital." },
];

// ═════════════════════════════════════════════════════════════════════════
// AI narrative → per-element findings
// ═════════════════════════════════════════════════════════════════════════

const normLabel = (s) =>
  String(s || "").toLowerCase().replace(/^\s*\d+[.)]\s*/, "").replace(/[^a-z0-9]/g, "");

const FIELD_PATTERNS = [
  ["evidence", /\*\*Evidence:\*\*/i],
  ["withheld", /\*\*Points withheld:\*\*/i],
  ["rationale", /\*\*Rationale:\*\*/i],
  ["available", /\*\*Points available:\*\*/i],
  ["why", /\*\*Why:\*\*/i],
  ["impact", /\*\*Impact on your score:\*\*/i],
];

function parseFields(body) {
  const out = { raw: body.trim() };
  const marks = [];
  FIELD_PATTERNS.forEach(([key, re]) => {
    const m = body.match(re);
    if (m) marks.push({ key, start: m.index, end: m.index + m[0].length });
  });
  marks.sort((a, b) => a.start - b.start);
  marks.forEach((mk, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : body.length;
    out[mk.key] = body.slice(mk.end, stop).replace(/\*\*/g, "").trim();
  });
  return out;
}

export function parseAnalysisByElement(text) {
  const map = {};
  let overall = null;
  if (!text) return { map, overall };

  String(text)
    .split(/(?=^###\s)/m)
    .forEach((chunk) => {
      const t = chunk.trim();
      if (!t.startsWith("###")) return;
      const headingEnd = t.indexOf("\n");
      const heading = t.slice(3, headingEnd === -1 ? undefined : headingEnd).replace(/\*\*/g, "").trim();
      const body = headingEnd === -1 ? "" : t.slice(headingEnd + 1);
      const key = normLabel(heading);
      if (key.includes("overall")) {
        const f = parseFields(body);
        const grab = (re) => {
          const m = body.match(re);
          return m ? m[1].replace(/\*\*/g, "").trim() : null;
        };
        overall = {
          strongest: grab(/\*\*Strongest section:\*\*\s*(.+)/i),
          weakest: grab(/\*\*Weakest section:\*\*\s*(.+)/i),
          nextStep: grab(/\*\*Highest-value next step:\*\*\s*(.+)/i),
          final: grab(/\*\*Final analysis:\*\*\s*([\s\S]+)/i),
          raw: f.raw,
        };
        return;
      }
      map[key] = parseFields(body);
    });

  return { map, overall };
}

// ═════════════════════════════════════════════════════════════════════════

export function FundabilityScoreCard({ styles = {}, profileData, onScoreUpdate, apiKey, onNavigate, userId: propUserId }) {
  // The profile whose scores are shown: passed by the Dashboard (company owner's, or own), else the logged-in user
  const profileUid = propUserId || auth?.currentUser?.uid
  const [showModal, setShowModal] = useState(false);
  // Narratives are per application. `localNarratives` holds ones written this session,
  // `userNarrative` is the latest saved one on aiFundabilityEvaluations/{uid}.
  const [localNarratives, setLocalNarratives] = useState({});
  const [userNarrative, setUserNarrative] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");

  const [businessPlanAnalysis, setBusinessPlanAnalysis] = useState(null);
  const [pitchDeckAnalysis, setPitchDeckAnalysis] = useState(null);
  const [creditReportAnalysis, setCreditReportAnalysis] = useState(null);
  const [profileSecurity, setProfileSecurity] = useState([]);
  const [solvencyAnalysis, setSolvencyAnalysis] = useState(null);
  const [financialStatementsAnalysis, setFinancialStatementsAnalysis] = useState(null);
  const [isFundingDataLoaded, setIsFundingDataLoaded] = useState(false);

  const [applications, setApplications] = useState([]);
  const [hasAppliedForFunding, setHasAppliedForFunding] = useState(false);
  const [fundingCheckComplete, setFundingCheckComplete] = useState(false);
  const [missingFundingSections, setMissingFundingSections] = useState([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const dataLoadPromiseRef = useRef(null);
  const fundingCheckCompleteRef = useRef(false);
  const isEvaluatingRef = useRef(false);
  const isSavingEvaluation = useRef(false);
  const profileDataRef = useRef(profileData);
  const runAiEvaluationRef = useRef(null);
  const triggerTried = useRef(false);

  // Live copies for code that runs outside a render (the trigger listener and
  // the AI run), so they never score against stale state.
  const applicationsRef = useRef([]);
  const hasAppliedRef = useRef(false);
  const resultsRef = useRef([]); // every application's assessment, for code outside a render
  const selectedIdRef = useRef(null);
  const savedSigRef = useRef({}); // appId -> last snapshot signature written this session
  const saveNarrativeRef = useRef(null);
  const readyRef = useRef(null);
  if (!readyRef.current) {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    readyRef.current = { promise, resolve };
  }

  const { loadLatestSolvencyScore } = useSolvencyScore(auth?.currentUser);
  const { callFunction } = useFirebaseFunctions();

  useEffect(() => { isEvaluatingRef.current = isEvaluating; });
  useEffect(() => { profileDataRef.current = profileData; });
  useEffect(() => { selectedIdRef.current = selectedAppId; });

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);

  const goTo = (route) => {
    if (!route) return;
    if (onNavigate) onNavigate(route);
    else window.location.assign(route);
  };

  // ── Load the document-backed analyses ──
  const fetchFundingApplicationData = useCallback(async () => {
    if (dataLoadPromiseRef.current) return dataLoadPromiseRef.current;

    const loadPromise = (async () => {
      const userId = profileUid;
      const fresh = {
        businessPlanAnalysis: null, pitchDeckAnalysis: null, creditReportAnalysis: null,
        profileSecurity: [], solvencyAnalysis: null, financialStatementsAnalysis: null,
      };

      try {
        const snap = await getDoc(doc(db, "aiFinancialEvaluations", userId));
        if (snap.exists()) {
          const d = snap.data();
          const ev = d?.evaluation || {};
          fresh.financialStatementsAnalysis = {
            breakdown: ev.breakdown || {},
            overallScore: ev.overallScore ?? null,
            resilienceScore: ev.resilienceScore ?? null,
            summary: ev.summary || "",
            content: ev.content || "",
            files: d.files || ev.files || [],
            modelVersion: ev.modelVersion || d.modelVersion || "",
            evaluatedAt: ev.evaluatedAt || d.createdAt || "",
            operationStage: ev.operationStage || d.operationStage || "",
          };
          setFinancialStatementsAnalysis(fresh.financialStatementsAnalysis);
        }
      } catch (e) { console.error("Financial statements load error:", e); }

      try {
        const snap = await getDocs(query(collection(db, "aiEvaluations"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content = d?.evaluation?.content || "";
          const score = Math.round(d?.evaluation?.score || 0);
          fresh.businessPlanAnalysis = { score, content, isValid: score > 0 && content.trim().length > 0 };
          setBusinessPlanAnalysis(fresh.businessPlanAnalysis);
        }
      } catch (e) { console.error("BP load error:", e); }

      try {
        const snap = await getDocs(query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content = d?.evaluation?.content || "";
          const score = d?.evaluation?.score || 0;
          fresh.pitchDeckAnalysis = {
            score, operationalScore: d?.evaluation?.operationalScore || 0, content,
            isValid: score > 0 && content.trim().length > 0,
          };
          setPitchDeckAnalysis(fresh.pitchDeckAnalysis);
        }
      } catch (e) { console.error("PD load error:", e); }

      try {
        const snap = await getDocs(query(collection(db, "creditAnalyses"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const ar = d?.evaluation?.analysisResult || {};
          const content = d?.evaluation?.content || "";
          const score = ar.creditScore ?? d?.evaluation?.score ?? 0;
          const label = ar.creditRating ?? d?.evaluation?.label ?? "";
          const isCreditReport = ar.isCreditReport ?? d?.evaluation?.isCreditReport ?? d?.isCreditReport ?? false;
          fresh.creditReportAnalysis = {
            score, content, label, isCreditReport,
            negativeItems: ar.negativeItems ?? d?.evaluation?.negativeItems ?? d?.negativeItems ?? [],
            positiveItems: ar.positiveItems ?? d?.evaluation?.positiveItems ?? d?.positiveItems ?? [],
            overallAssessment: ar.overallAssessment ?? d?.evaluation?.overallAssessment ?? d?.overallAssessment ?? "",
            isValid: isCreditReport === true && score > 0 && content.trim().length > 0,
          };
          setCreditReportAnalysis(fresh.creditReportAnalysis);
        }
      } catch (e) { console.error("CR load error:", e); }

      try {
        const profSnap = await getDoc(doc(db, "universalProfiles", userId));
        if (profSnap.exists()) {
          fresh.profileSecurity = profSnap.data()?.guarantees?.securityInstruments || [];
          setProfileSecurity(fresh.profileSecurity);
        }
      } catch (e) { console.error("Guarantees load error:", e); }

      try {
        const solvencyData = await loadLatestSolvencyScore();
        if (solvencyData?.rawMetrics) {
          const m = solvencyData.rawMetrics;
          const nav = parseFloat(m.nav) || 0;
          const equityRatio = parseFloat(m.equityRatio) || 0;
          const debtToEquity = parseFloat(m.debtToEquity) || 0;

          let navScore = nav > 100 ? 100 : nav > 50 ? 90 : nav > 10 ? 80 : nav > 1 ? 60 : nav > 0 ? nav * 50 : 0;
          let equityScore =
            equityRatio >= 70 ? 95 : equityRatio >= 60 ? 85 : equityRatio >= 50 ? 75
            : equityRatio >= 40 ? 55 : equityRatio >= 30 ? 35 : Math.max(0, equityRatio);
          const dev = Math.abs(debtToEquity - 1.0);
          let dteScore = dev <= 0.3 ? 90 : dev <= 0.6 ? 75 : dev <= 1.0 ? 55 : dev <= 1.5 ? 35 : Math.max(0, 100 - dev * 10);

          const score = Math.round(navScore * 0.4 + equityScore * 0.35 + dteScore * 0.25);
          fresh.solvencyAnalysis = {
            score,
            normalizedScore: normalizeSolvencyScore(score),
            nav, equityRatio, debtToEquity,
            debtToAssets: parseFloat(m.debtToAssets) || 0,
            interestCoverage: parseFloat(m.interestCoverage) || 0,
            isValid: score > 0,
          };
          setSolvencyAnalysis(fresh.solvencyAnalysis);
        }
      } catch (e) { console.error("Solvency load error:", e); }

      setIsFundingDataLoaded(true);
      return { isLoaded: true, ...fresh };
    })();

    dataLoadPromiseRef.current = loadPromise;
    try { return await loadPromise; }
    finally { dataLoadPromiseRef.current = null; }
  }, [profileUid]);

  // ── Live funding applications ──
  // Fires on mount and again whenever an application is created, edited,
  // completed, submitted or deleted. This is what makes applications a
  // trigger for Fundability.
  useEffect(() => {
    const uid = profileUid;
    if (!uid) return;
    let first = true;

    const unsubscribe = onSnapshot(
      query(collection(db, "fundingApplicationsV2"), where("userId", "==", uid)),
      async (appSnap) => {
        const apps = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        applicationsRef.current = apps;
        setApplications(apps);

        try {
          const profSnap = await getDoc(doc(db, "universalProfiles", uid));
          const data = profSnap.exists() ? profSnap.data() : {};
          const missingFor = (c = {}) => REQUIRED_FUNDING_SECTIONS.filter((k) => c[k] !== true);

          // The closest-to-done application drives the "still to complete" message.
          const missing = apps.length
            ? apps.map((a) => missingFor(a.completedSections)).sort((a, b) => a.length - b.length)[0]
            : missingFor(data.completedSections);
          const submitted = data.applicationSubmitted === true || apps.some((a) => a.status === "submitted");
          const applied = apps.some(isAppComplete) || (!apps.length && missing.length === 0) || submitted;

          hasAppliedRef.current = applied;
          setMissingFundingSections(missing);
          setApplicationSubmitted(submitted);
          setHasAppliedForFunding(applied);

          if (first) await fetchFundingApplicationData();
        } catch (e) {
          console.error("Funding status check error:", e);
          setIsFundingDataLoaded(true);
        } finally {
          first = false;
          setFundingCheckComplete(true);
          fundingCheckCompleteRef.current = true;
          readyRef.current.resolve();
        }
      },
      (e) => {
        console.error("Funding applications listener error:", e);
        setIsFundingDataLoaded(true);
        setFundingCheckComplete(true);
        fundingCheckCompleteRef.current = true;
        readyRef.current.resolve();
      }
    );

    return () => unsubscribe();
  }, [profileUid, fetchFundingApplicationData]);

  // ── Score — a pure function of the profile, the applications and the stored analyses ──
  // One assessment per complete application; they share one Capital Appeal headline.
  const results = useMemo(() => {
    if (!profileData || !fundingCheckComplete) return [];
    try {
      return assessAll(
        profileData,
        applications,
        { businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis, profileSecurity, solvencyAnalysis, financialStatementsAnalysis },
        hasAppliedForFunding
      );
    } catch (e) {
      console.error("Capital appeal scoring error:", e);
      return [];
    }
  }, [
    profileData, applications, hasAppliedForFunding, fundingCheckComplete,
    businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis,
    profileSecurity, solvencyAnalysis, financialStatementsAnalysis, isFundingDataLoaded,
  ]);

  useEffect(() => { resultsRef.current = results; }, [results]);

  const selected = useMemo(
    () => (results.length ? results.find((r) => r.id && r.id === selectedAppId) || bestOf(results) : null),
    [results, selectedAppId]
  );
  const a = selected?.assessment || null;
  const fundabilityScore = a?.totalScore ?? 0;

  useEffect(() => {
    if (a && onScoreUpdate) onScoreUpdate(a.totalScore);
  }, [a?.totalScore]);

  // The narrative shown is the one written for THIS application. A narrative written
  // for another application would describe the wrong instrument, so none is shown.
  const narrative = useMemo(() => {
    const key = selected?.id || "profile";
    if (localNarratives[key]) return localNarratives[key];
    const fromApp = selected?.app?.fundabilityNarrative;
    if (fromApp?.result) return { result: fromApp.result, timestamp: fromApp.evaluatedAt };
    if (userNarrative?.result && (userNarrative.applicationId ?? "profile") === key) return userNarrative;
    return null;
  }, [selected, localNarratives, userNarrative]);
  const aiEvaluationResult = narrative?.result || "";
  const evaluationTimestamp = fmtTs(narrative?.timestamp);

  // Persist each application's own result so the applications list can show it.
  // Written only when the signature changes, and only once the document analyses
  // have loaded — otherwise a half-loaded run would store a falsely low score.
  useEffect(() => {
    if (!results.length || !fundingCheckComplete || !isFundingDataLoaded) return;
    results.forEach((r) => {
      if (!r.app) return;
      const snap = applicationSnapshot(r.assessment);
      if (r.app.fundabilityAssessment?.signature === snap.signature) return;
      if (savedSigRef.current[r.id] === snap.signature) return;
      savedSigRef.current[r.id] = snap.signature;
      const record = { ...snap, evaluatedAt: new Date().toISOString() };
      (async () => {
        try {
          await setDoc(doc(db, "fundingApplicationsV2", r.id), { fundabilityAssessment: record }, { merge: true });
        } catch (e) {
          delete savedSigRef.current[r.id];
          console.error(`Could not store the fundability result for ${r.id}:`, e);
          return;
        }
        // Immutable history (§2): one record per signature, never rewritten.
        try {
          await setDoc(doc(db, "fundingApplicationsV2", r.id, "fundabilityResults", snap.signature), record);
        } catch (e) {
          console.warn("Fundability history not stored:", e?.code || e);
        }
      })();
    });
  }, [results, fundingCheckComplete, isFundingDataLoaded]);

  // ═══════════════════════════════════════════════════════════════════════
  // PROMPT — one section per element
  //
  // `instrumentLabel` is a parameter on both builders on purpose: the AI run
  // computes its own best application, and state would still hold the previous
  // render's value.
  // ═══════════════════════════════════════════════════════════════════════
  const buildSections = (a, instrumentLabel) => {
    const sections = a.financialStrength.subCategories.map((sc) => ({
      title: sc.label,
      findingsKey: `financialStrength:${sc.key}`,
      block: "Financial Strength",
      weightLabel: `${sc.weight}% of Financial Strength at the ${a.stage.label} stage, and Financial Strength is the whole of the original Capital Appeal score`,
      percent: Math.round(sc.percent),
      items: sc.items,
      sourceNote: "Read from the fields on your Financial Overview, plus the credit report on file.",
    }));

    a.fundabilityComponents.forEach((c) => {
      sections.push({
        title: c.label,
        findingsKey: `fundability:${c.key}`,
        block: "Fundability",
        weightLabel: c.excluded
          ? `OUT OF SCOPE for ${instrumentLabel}`
          : `${c.weight}% of Fundability · ${c.effectiveWeight.toFixed(1)} points of the application-context score`,
        percent: c.excluded ? null : Math.round(c.percent),
        items: c.items,
        excluded: c.excluded,
        exclusionNote: c.exclusionNote,
        reductionNote: c.reductionNote,
      });
    });

    return sections;
  };

  const buildPrompt = (a, docFindings = {}, instrumentLabel = null, appRef = null) => {
    const line = (i) =>
      `  - ${i.label}: ${
        i.state === "missing" ? "NOT CAPTURED" : i.withheld === 0 ? "COUNTED IN FULL" : `${Math.round(i.earned * 10) / 10}/${i.points} item points — ${Math.round(i.withheld * 10) / 10} withheld`
      }${i.provisional ? " — PROVISIONAL RULE" : ""}${i.evidence ? ` — on file: ${i.evidence}` : ""}${i.reason ? ` — ${i.reason}` : ""}${
        i.withheld > 0
          ? i.claimable
            ? ` — recoverable ${fmtPts(i.pointValue)} via ${i.section}`
            : ` — ${fmtPts(i.pointValue)} NOT RECOVERABLE by editing the profile`
          : ""
      }`;

    const sections = buildSections(a, instrumentLabel);

    const sectionData = sections
      .map((sec, idx) => {
        if (sec.excluded) {
          return `\n### ${idx + 1}. ${sec.title}\nSTATUS: OUT OF SCOPE for ${instrumentLabel} — ${sec.exclusionNote || "not assessed for this instrument"}\nThis carries no weight and is NOT a gap. Say so plainly and move on.`;
        }
        const f = docFindings[sec.findingsKey];
        const findingBlock = f
          ? `\nALREADY ASSESSED — findings from the ${f.docLabel || f.source} on file${f.headline ? ` (${f.headline})` : ""}:${
              f.summary ? `\n  Summary: ${f.summary}` : ""
            }${
              f.weakAreas?.length
                ? `\n  Weak areas:\n${f.weakAreas
                    .map((w) => `    - ${w.label}${w.score ? ` (${w.score})` : ""}${w.note ? ` — ${w.note}` : ""}`)
                    .join("\n")}`
                : ""
            }${
              f.improvements?.length
                ? `\n  That evaluation's priority improvements:\n${f.improvements
                    .map((i) => `    - ${i.title}: ${i.body}`)
                    .join("\n")}`
                : ""
            }\n  These are qualitative and carry NO point value. Reference them in Evidence and Rationale. Never list them under "Points available".`
          : "";

        return `\n### ${idx + 1}. ${sec.title}  [${sec.block}]\nSCORE: ${sec.percent}% · ${sec.weightLabel}${sec.reductionNote ? `\nREDUCED WEIGHT: ${sec.reductionNote}` : ""}${sec.sourceNote ? `\n${sec.sourceNote}` : ""}\n${(sec.items || []).map(line).join("\n")}${findingBlock}`;
      })
      .join("\n");

    const outputFormat = sections
      .map((sec, idx) => {
        if (sec.excluded) {
          return `### ${idx + 1}. ${sec.title}
**Why:** [one sentence, from the exclusion note above]
**Impact on your score:** None — this is not a gap and costs you nothing.`;
        }
        return `### ${idx + 1}. ${sec.title}
**Evidence:** [what was actually counted here — cite the values on file. 1–2 sentences.]
**Points withheld:** [one bullet per item with points withheld, as: - Item — reason — **+X.X%** via Section. Mark any NOT RECOVERABLE item as a fixed deduction instead. If none: "None — everything captured was counted in full."]
**Rationale:** [2 sentences on what this element tells a funder]
**Points available:** [one bullet per recoverable item, as: - Section: action — **+X.X%**. If none: "None — this element is complete."]`;
      })
      .join("\n\n");

    return `You are writing the capital appeal findings for a funding-readiness report.

EVERY NUMBER BELOW IS FINAL. You do not calculate, adjust or re-derive anything. Your job is to explain what was counted, what was withheld and why, and what to do next. Stating a different number is an error.

ONLY the data below exists. Do not invent or infer any figure that is not here. Where an item says NOT CAPTURED, treat it as unproven, never as a positive.

An item marked PROVISIONAL RULE is scored on a threshold the methodology has not yet approved. Say the figure uses a provisional rule where you mention it; never present it as final.

An item marked NOT RECOVERABLE must never appear under "Points available". Explain it under "Points withheld" as a fixed deduction that follows the underlying financial reality rather than the form.

A section marked OUT OF SCOPE costs the business nothing for this instrument and must never be described as a gap or a weakness.

WRITE ONE SECTION PER HEADING BELOW, WITH THE HEADING TEXT COPIED EXACTLY. Do not merge sections, do not skip sections, do not reorder them and do not add sections. Each heading is read on its own screen, so each section must stand alone and must be SHORT — a reader sees one at a time, not the set.

CAPITAL APPEAL (original — Financial Strength alone, the figure the BIG Score uses): ${a.totalScore}%
Recoverable in total on the original score: ${a.availablePoints}%${a.lockedPoints > 0 ? `\nFixed deductions that cannot be recovered by editing the profile: ${a.lockedPoints}%` : ""}
Business stage: ${a.stage.label} (${a.stage.basis}).${appRef ? `\nThis analysis is for funding application ${appRef}. The business may hold other applications; do not refer to them.` : ""}
${
  a.fundingActive
    ? `Funding request instrument: ${instrumentLabel}. Application-context Capital Appeal (Financial Strength ${a.split.financialStrength}% + Fundability ${a.split.fundability}%): ${a.application.score}%, which is ${a.application.delta >= 0 ? "+" : ""}${a.application.delta.toFixed(1)} points against the original. Fundability scored ${Math.round(a.blocks.find((b) => b.key === "fundability")?.percent || 0)}%. Recoverable figures under Fundability sections are points of the application-context score, NOT of the original score; never add them to it.`
    : a.fundabilityStatus === "blended"
    ? `This request combines several financing components (${a.instrumentResults.map((r) => r.label).join(", ")}). Each is scored separately and no combined Fundability or application figure is published. Say so; never average them.`
    : a.fundabilityStatus === "no_application"
    ? "No funding application is complete, so only the original score exists. The application-context score is Not assessed — that is not a zero."
    : "A funding application is complete but its instrument is not identified, so the application-context score is Not assessed — that is not a zero. Do not state a figure for it."
}

═══ SCORED DATA ═══
${sectionData}

${a.statements?.present ? `
═══ FINANCIAL STATEMENTS ON FILE ═══
The business uploaded financial statements and they were read and scored${a.statements.overallScore !== null ? ` (${a.statements.overallScore}/5 overall)` : ""}${a.statements.evaluatedAt ? ` on ${a.statements.evaluatedAt}` : ""}.
Findings from that analysis:
${a.statements.summary || "No written summary was stored."}
${a.statements.hasDiscrepancy ? "\nIMPORTANT: that analysis found figures in the statements that do not match the self-reported Financial Overview. Raise this under Records. Say plainly which way it cuts: the profile is what gets scored, so where the statements are stronger the business is under-scoring itself, and where they are weaker a funder will find the difference in due diligence. Do not adjust any score for it — flag it." : ""}` : `
═══ FINANCIAL STATEMENTS ═══
No financial statements have been read. Several items above are unbacked as a result; say so under Records.`}

RULES
- Where points were withheld on something that WAS captured, lead with that — it is more useful than listing blanks.
- Every recommendation must be an item above, must be marked recoverable, and must carry its exact value.
- Never invent an improvement that is not on the list — it cannot earn anything.
- Never state or imply that a score guarantees readiness, creditworthiness or approval.
- Plain business English. Short sentences. No preamble, no closing summary inside a section.

OUTPUT FORMAT — follow exactly, including the bold labels and the section numbering:

${outputFormat}

### Overall Assessment
**Strongest section:** [name it and say in one line why it stands out to a funder]
**Weakest section:** [name it, excluding anything marked OUT OF SCOPE, and say what it costs]
**Highest-value next step:** [the single top recoverable item, its section and exact value]
**Final analysis:** [short paragraph: where this business stands, and what the original score becomes once the top three recoverable Financial Strength items are resolved. If an application-context score exists, give it one sentence and keep it separate.]`;
  };

  // `fresh` wins when the loader beat state to it; otherwise state.
  const pickAnalyses = (fresh) => {
    const pick = (key, stateValue) => (fresh && key in fresh ? fresh[key] : stateValue);
    return {
      businessPlanAnalysis: pick("businessPlanAnalysis", businessPlanAnalysis),
      pitchDeckAnalysis: pick("pitchDeckAnalysis", pitchDeckAnalysis),
      creditReportAnalysis: pick("creditReportAnalysis", creditReportAnalysis),
      profileSecurity: pick("profileSecurity", profileSecurity),
      solvencyAnalysis: pick("solvencyAnalysis", solvencyAnalysis),
      financialStatementsAnalysis: pick("financialStatementsAnalysis", financialStatementsAnalysis),
    };
  };

  // Reads applications and the applied flag from refs, so an AI run that starts
  // straight after mount scores the same way the card does. `targetId` picks the
  // application; otherwise the one on screen; otherwise the strongest.
  const computeAssessment = (fresh, targetId = null) => {
    const pd = profileDataRef.current || profileData;
    if (!pd) return null;
    const all = assessAll(pd, applicationsRef.current, pickAnalyses(fresh), hasAppliedRef.current);
    resultsRef.current = all;
    const target =
      all.find((r) => r.id && r.id === targetId) ||
      all.find((r) => r.id && r.id === selectedIdRef.current) ||
      bestOf(all);
    return { all, target };
  };

  const labelFor = (target) =>
    target?.app
      ? `#${target.shortId}${target.assessment.application.instrumentLabel ? ` (${target.assessment.application.instrumentLabel})` : ""}`
      : null;

  const runAiEvaluation = async (targetId = null) => {
    if (!apiKey?.trim()) { setEvaluationError("AI analysis is not configured yet."); return null; }
    if (!profileDataRef.current && !profileData) { setEvaluationError("No profile data available to analyse."); return null; }

    setIsEvaluating(true);
    setEvaluationError("");
    try {
      // Applications must be loaded before scoring, or Fundability reads as inactive.
      if (!fundingCheckCompleteRef.current) {
        await Promise.race([readyRef.current.promise, new Promise((r) => setTimeout(r, 10000))]);
      }

      let fresh = null;
      if (!isFundingDataLoaded) {
        try {
          fresh = await fetchFundingApplicationData();
        } catch (e) {
          console.error("Could not load document analyses before evaluation:", e);
        }
      }

      const ctx = computeAssessment(fresh, targetId);
      if (!ctx) { setEvaluationError("No profile data available to analyse."); return null; }
      const { target } = ctx;
      const ta = target.assessment;

      const result = await callFunction("generateFundabilityAnalysis", {
        prompt: buildPrompt(ta, buildDocumentFindings(pickAnalyses(fresh)), ta.application.instrumentLabel, labelFor(target)),
      });
      return { content: result?.content || "", target };
    } catch (error) {
      console.error("Capital appeal AI evaluation error:", error);
       await logAnalysisFailure(db, profileUid, "fundability", error);
      setEvaluationError(`Analysis failed: ${error.message}`);
      return null;
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => { runAiEvaluationRef.current = runAiEvaluation; });

  // What gets saved alongside a narrative: the scores, instrument, stage and application it was written for.
  const metaFor = (target) => ({
    score: target?.assessment?.totalScore ?? null,
    applicationScore: target?.assessment?.application?.score ?? null,
    instrumentGroup: target?.instrument ?? null,
    stage: target?.assessment?.stage?.key ?? null,
    methodologyVersion: METHODOLOGY_VERSION,
    applicationId: target?.id ?? null,
  });

  // The narrative is stored on the application it explains, and also on the
  // user-level document the dashboard report reads (latest run wins there).
  const saveNarrative = async (content, target, { auto = false } = {}) => {
    const userId = profileUid;
    if (!userId || !content) return;
    const iso = new Date().toISOString();
    const meta = metaFor(target);

    await setDoc(
      doc(db, "aiFundabilityEvaluations", userId),
      {
        result: content, ...meta, timestamp: new Date(),
        includedFundingData: auto ? true : isFundingDataLoaded,
        profileSnapshot: profileDataRef.current || profileData,
      },
      { merge: true }
    );
    if (target?.app) {
      await setDoc(
        doc(db, "fundingApplicationsV2", target.id),
        {
          fundabilityNarrative: {
            result: content, evaluatedAt: iso,
            snapshotSignature: applicationSnapshot(target.assessment).signature,
            ...meta,
          },
        },
        { merge: true }
      );
    }
    setLocalNarratives((prev) => ({ ...prev, [target?.id || "profile"]: { result: content, timestamp: iso } }));
    setUserNarrative({ result: content, applicationId: target?.id ?? null, timestamp: iso });
  };
  useEffect(() => { saveNarrativeRef.current = saveNarrative; });

  const refreshAiEvaluation = async () => {
    const userId = profileUid;
    if (!userId) return;
    try {
      const out = await runAiEvaluation(selectedIdRef.current || selected?.id || null);
      if (out?.content) await saveNarrative(out.content, out.target);
    } catch (error) {
      setEvaluationError(`Failed to refresh: ${error.message}`);
    }
  };

  // ── Auto-trigger (triggerFundabilityEvaluation on the profile) + load saved narrative ──
  // The funding application sets fundabilityEvaluationApplicationId when it asks for
  // an evaluation, so the narrative is written for the application that was saved.
  useEffect(() => {
    if (!profileUid || !apiKey) return;
    const userId = profileUid;
    const docRef = doc(db, "universalProfiles", userId);
    const aiEvalRef = doc(db, "aiFundabilityEvaluations", userId);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
           // One attempt per mount: the failure log writes to this same doc and
       // would re-fire this listener. A failed run leaves the trigger set, so
        // the next page open tries again.
        if (data.triggerFundabilityEvaluation === true && !isEvaluatingRef.current && !isSavingEvaluation.current && !triggerTried.current) {
          triggerTried.current = true;
          isSavingEvaluation.current = true;
          let ok = false;
          try {
            const out = await runAiEvaluationRef.current(data.fundabilityEvaluationApplicationId || null);
            if (out?.content) {
              await saveNarrativeRef.current(out.content, out.target, { auto: true });
              ok = true;
            } // else: runAiEvaluation already logged why
          } catch (error) {
           setEvaluationError(`Auto evaluation failed: ${error.message}`);
            await logAnalysisFailure(db, userId, "fundability", error, { stage: "save" });
          } finally {
            if (ok) await updateDoc(docRef, { triggerFundabilityEvaluation: false, "analysisFailures.fundability": deleteField() });
            isSavingEvaluation.current = false;
          }
          return;
        }
      }

      if (isSavingEvaluation.current) return;
      try {
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists() && aiSnap.data().result) {
          const d = aiSnap.data();
          setUserNarrative({
            result: d.result,
            applicationId: d.applicationId ?? null,
            timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : d.timestamp || null,
          });
        }
      } catch (e) { console.error("Load saved eval error:", e); }
    });

    return () => unsubscribe();
  }, [profileUid, apiKey]);

  // ─────────────────────────────────────────────────────────────────────
  // Presentation
  // ─────────────────────────────────────────────────────────────────────
  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Highly fundable", color: "#1B5E20" };
    if (score >= 81) return { level: "Strong investment case", color: "#4CAF50" };
    if (score >= 61) return { level: "Moderate potential", color: "#FF9800" };
    if (score >= 41) return { level: "Basic potential", color: "#F44336" };
    return { level: "Needs development", color: "#B71C1C" };
  };
  const scoreLevel = getScoreLevel(fundabilityScore);

  const fundingEvidence = [
    businessPlanAnalysis?.isValid && "a business plan analysis",
    pitchDeckAnalysis?.isValid && "a pitch deck analysis",
    creditReportAnalysis?.isValid && "a credit report",
    profileSecurity.length > 0 && "security instruments",
    (profileData?.useOfFunds?.fundingInstruments || []).length > 0 && "funding instruments",
    profileData?.useOfFunds?.amountRequested && "an amount requested",
  ].filter(Boolean);

  const fundabilityStatus = (() => {
    if (!a || a.fundingActive) return null;
    if (!fundingCheckComplete) return null;
    const share = a.split.fundability;

    if (a.fundabilityStatus === "blended") {
      return {
        key: "blended",
        headline: "Several financing components — scored separately",
        detail: `This request combines ${a.instrumentResults.map((r) => r.label).join(" and ")}. Each is scored on its own and no combined Fundability figure is published until an aggregation rule is approved. ${a.instrumentResults
          .map((r) => `${r.label}: Fundability ${Math.round(r.percent)}%`)
          .join(" · ")}. Your Capital Appeal score is unaffected.`,
        chips: [],
        cta: "Review use of funds",
        route: `${FUNDING_ROUTE}?section=useOfFunds`,
        note: null,
      };
    }

    if (!hasAppliedForFunding) {
      return {
        key: "fundability",
        headline: missingFundingSections.length
          ? `${missingFundingSections.length} funding application section${missingFundingSections.length === 1 ? "" : "s"} still to complete`
          : "No funding application on file",
        detail: `Your Capital Appeal score is Financial Strength alone and does not wait on this. A complete funding application adds an application view: Fundability for your instrument, weighted ${share}% against Financial Strength at the ${a.stage.label} stage. Until then that view is Not assessed — it is not a zero.`,
        chips: missingFundingSections.map((k) => FUNDING_SECTION_LABELS[k] || k),
        cta: "Go to the funding application",
        route: FUNDING_ROUTE,
        note: fundingEvidence.length
          ? `You already have ${fundingEvidence.join(", ")} on file, so most of the work is done — the sections above just need marking complete.`
          : null,
      };
    }

    const unmapped = a.unmappedInstruments || [];
    return {
      key: "instrument",
      headline: unmapped.length ? `${unmapped.join(", ")} is not in the Fundability matrix` : "Funding instrument not identified",
      detail: unmapped.length
        ? `Fundability applies by instrument, and ${unmapped.join(", ")} does not map to one of the scored instrument types, so this application's Fundability is Not assessed — it is not a zero. Your Capital Appeal score and your other applications are unaffected. Choosing a specific instrument in Use of Funds (for example Term Loan, Purchase Order Finance, Invoice Discounting, Asset Finance, an equity or grant instrument) lets it be scored.`
        : "The application is complete, but no funding instrument was selected — and the instrument decides which Fundability rows apply. A grant is read on investment case and impact; purchase-order finance on credit and security; equity on case, growth, pitch and resilience. Until one is selected the application view is Not assessed (not zero). Your Capital Appeal score is unaffected.",
      chips: [],
      cta: "Choose a funding instrument",
      route: `${FUNDING_ROUTE}?section=useOfFunds`,
      note: null,
    };
  })();

  // ── Assemble what the explorer needs ────────────────────────────────
  const parsed = useMemo(() => parseAnalysisByElement(aiEvaluationResult), [aiEvaluationResult]);

  const documentFindings = useMemo(
    () =>
      buildDocumentFindings({
        businessPlanAnalysis,
        pitchDeckAnalysis,
        creditReportAnalysis,
        financialStatementsAnalysis,
      }),
    [businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis, financialStatementsAnalysis]
  );

  const explorer = useMemo(() => {
    if (!a) return null;

    const app = a.application;
    const stageLabel = a.stage.label;
    const signed = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}`;

    const findingFor = (label) => parsed.map[normLabel(label)] || null;
    const toElement = (src, blockKey, extra = {}) => ({
      key: `${blockKey}:${src.key}`,
      findings: documentFindings[`${blockKey}:${src.key}`] || null,
      label: src.label,
      weight: src.weight,
      percent: src.percent,
      effectiveWeight: src.effectiveWeight,
      excluded: src.excluded,
      exclusionNote: src.exclusionNote,
      reductionNote: src.reductionNote,
      breakdown: src.items || [],
      improvements: (src.items || []).filter((i) => i.withheld > 0 && i.claimable),
      locked: (src.items || []).filter((i) => i.withheld > 0 && !i.claimable),
      analysis: findingFor(src.label),
      ...extra,
    });

    const blocks = [
      {
        key: "financialStrength",
        label: "Financial Strength",
        percent: a.financialStrength.percent,
        blockWeight: 100,
        note: `This is your Capital Appeal score. Factor weights are those for the ${stageLabel} stage (${a.stage.basis}). Scored in code against the fields on your Financial Overview and the credit report on file.`,
        elements: a.financialStrength.subCategories.map((sc) =>
          toElement(sc, "financialStrength", {
            sourceNote: "Read from the fields on your Financial Overview, plus the credit report on file.",
          })
        ),
      },
    ];

    if (a.fundingActive) {
      const fundabilityBlock = a.blocks.find((b) => b.key === "fundability");
      blocks.push({
        key: "fundability",
        label: selected?.app ? `Fundability — application #${selected.shortId}` : "Fundability — with your funding request",
        percent: fundabilityBlock?.percent ?? 0,
        blockWeight: a.split.fundability,
        note: `Scored for ${app.instrumentLabel}. Rows that do not apply to this instrument are out of scope and cost you nothing. This block does not change the Capital Appeal score above; it builds the application view, which stands at ${app.score}% (${signed(app.delta)} points against your Capital Appeal).${
          results.filter((r) => r.app).length > 1
            ? ` This is application #${selected.shortId} of ${results.filter((r) => r.app).length}. Each application is assessed on its own instrument and its own security — switch between them above.`
            : ""
        }`,
        elements: a.fundabilityComponents.map((c) => toElement(c, "fundability")),
      });
    } else if (fundabilityStatus) {
      blocks.push({
        key: "fundability",
        label: "Fundability — not scored",
        percent: 0,
        blockWeight: a.split.fundability,
        inactive: true,
        note: `${fundabilityStatus.headline}. The application view is Not assessed (not zero). Your Capital Appeal score is Financial Strength alone and is unaffected.`,
        elements: [],
      });
    }

    const assessmentAreas = blocks.flatMap((b) =>
      b.elements.map((e) => ({
        label: e.label,
        weightLabel: e.excluded ? `out of scope · ${app.instrumentLabel}` : `${e.weight}% of ${b.label}`,
        detail: ELEMENT_PURPOSE[e.key.split(":")[1]] || "",
      }))
    );

    const fsRows = Object.entries(FS_FACTOR_WEIGHTS).map(([key, w]) => ({
      label: STAGE_LABELS[key],
      weight: `${w.revenue} · ${w.records} · ${w.balanceSheet} · ${w.debt} · ${w.credit}`,
      now: key === a.stage.key ? "you" : "—",
      excluded: key !== a.stage.key,
    }));

    const weightingTables = [
      {
        title: "Your Capital Appeal score",
        firstColumn: "Block",
        rows: [
          { label: "Financial Strength", weight: "100%", now: `${Math.round(a.financialStrength.percent)}%` },
          { label: "Fundability", weight: "—", now: "—", excluded: true },
        ],
        note: "Capital Appeal is Financial Strength alone. Fundability belongs to a funding request and never changes this score.",
      },
      {
        title: `With a funding request — ${stageLabel} stage split`,
        firstColumn: "Block",
        rows: [
          { label: "Financial Strength", weight: `${a.split.financialStrength}%`, now: `${Math.round(a.financialStrength.percent)}%` },
          {
            label: "Fundability",
            weight: `${a.split.fundability}%`,
            now: a.fundingActive ? `${Math.round(a.blocks.find((b) => b.key === "fundability")?.percent || 0)}%` : "—",
            excluded: !a.fundingActive,
          },
        ],
        note: a.fundingActive
          ? `Application view: ${app.score}%. Shown beside your Capital Appeal, never over it.`
          : "Application view: Not assessed.",
      },
      {
        title: `Within Financial Strength — ${stageLabel} stage`,
        rows: a.financialStrength.subCategories.map((sc) => ({
          label: sc.label,
          weight: `${sc.weight}%`,
          now: `${Math.round(sc.percent)}%`,
        })),
        note: "Applied in code against the fields on your Financial Overview — this is the arithmetic, not a guide.",
      },
      {
        title: "How the Financial Strength weighting moves by stage",
        firstColumn: "Stage",
        rows: fsRows,
        note: "Weights read in order: Revenue & Profitability · Records & Governance · Balance Sheet · Debt & Liability · Credit History.",
      },
    ];

    if (a.fundingActive) {
      weightingTables.push({
        title: `Within Fundability — ${app.instrumentLabel}`,
        firstColumn: "Sub-component",
        rows: a.fundabilityComponents.map((c) => ({
          label: c.excluded ? c.label : `${c.label} (stage base ${c.baseWeight})`,
          weight: c.excluded ? "—" : `${c.weight}%`,
          now: c.excluded ? "—" : `${Math.round(c.percent)}%`,
          excluded: c.excluded,
        })),
        note: "The stage's base weights are shared out across only the rows that apply to this instrument, so the active rows total 100%. A row that does not apply is out of scope and costs you nothing.",
      });
    }

    const attention = [];
    if (fundabilityStatus) attention.push(fundabilityStatus);
    const incompleteApps = (applications || []).filter((x) => !isAppComplete(x)).length;
    if (incompleteApps > 0 && results.some((r) => r.app)) {
      attention.push({
        key: "incomplete",
        headline: `${incompleteApps} funding application${incompleteApps === 1 ? "" : "s"} not scored yet`,
        detail: "Fundability is assessed for each application once every required section is complete, or the application is submitted. Applications still in draft are not scored and do not affect the ones that are.",
        chips: [],
        note: null,
        cta: "Open funding applications",
        route: FUNDING_ROUTE,
      });
    }
    if (a.stage.derived && a.stage.recorded && a.stage.recorded !== a.stage.key) {
      attention.push({
        key: "stage",
        headline: `Scored as ${stageLabel}, not ${STAGE_LABELS[a.stage.recorded]}`,
        detail: `The methodology sets Startup (under 3 completed years) and Growth (3 to under 6) by years in operation, and you have ${a.stage.basis}. Your profile records "${profileData?.entityOverview?.operationStage}". Scaling and Mature need a recorded stage assessment instead.`,
        chips: [],
        note: null,
        cta: "Review business stage",
        route: "/profile?section=entityOverview",
      });
    }
    if (a.statements?.hasDiscrepancy) {
      attention.push({
        key: "discrepancy",
        headline: "Your statements and your profile disagree",
        detail:
          "The analysis of your uploaded financial statements found figures that do not match your Financial Overview. The profile is what gets scored, so where the statements are stronger you are being under-scored, and where they are weaker a funder will find the difference in due diligence.",
        chips: [],
        note: a.statements.summary || null,
        cta: "Reconcile on Financial Overview",
        route: "/profile?section=financialOverview",
      });
    }

    const footnotes = [];
    if (a.fundingActive) {
      footnotes.push({
        title: `With your ${app.instrumentLabel} request`,
        body: `The application view stands at ${app.score}% (${signed(app.delta)} points against your Capital Appeal). Fundability items are valued in points of that view, not of your Capital Appeal, so they are listed here and not added to the total above. ${fmtPts(app.availablePoints)} is recoverable across Financial Strength and Fundability.`,
        items: app.outstanding
          .filter((i) => i.block === "Fundability")
          .slice(0, 5)
          .map((i) => ({
            what: `${i.label} — ${fmtPts(i.pointValue)} of the application view`,
            why: i.fix || i.reason || i.importance || "",
          })),
      });
    }
    if (a.provisional) {
      footnotes.push({
        title: "Provisional rules",
        body: `Some thresholds used here are not yet approved in the scoring rule registry: ${a.provisionalRules.join("; ")}. Items that depend on them are scored and labelled provisional, and may change when the rules are approved.`,
        items: [],
      });
    }

    return {
      blocks,
      attention,
      about: {
        definition:
          "Capital Appeal measures the financial strength of the business — what your own numbers and records say. Where a funding request is complete, Fundability is scored for that request's instrument and shown beside it as an application view. It never changes the Capital Appeal score itself.",
        definitionNotes: [
          {
            title: "The score is calculated in code",
            body: "Every figure here comes from a scoring function reading literal fields on your profile and the documents on file. The AI reads the finished numbers and explains them. That is what lets a figure like +3.4% be a promise rather than an estimate.",
          },
          {
            title: "Two views, kept apart",
            body: "Your Capital Appeal is Financial Strength alone, so it is the same whichever funder you approach. A funding request adds an application view, which blends Financial Strength with Fundability for that instrument at your stage's split. A score describes the evidence on file; it does not predict approval.",
          },
          {
            title: "Points that cannot be claimed back",
            body: "A credit score band, a solvency position and a current ratio are what your records say, not what the form says. Capturing the numbers is an action and is listed under Potential points; the position itself is shown as a fixed deduction and kept out of the recoverable total, because listing it as an action would imply you could type your way to a better balance sheet.",
          },
        ],
        assessmentAreas,
        interpretation: INTERPRETATION,
        weighting: {
          formula: "value = (item points withheld ÷ container points) × factor weight for your stage",
          formulaNote:
            "Each figure shown against a Financial Strength improvement is the exact amount your Capital Appeal moves when that item is resolved — the same function promises it and awards it. Fundability items are valued in the same way, then scaled by their weight and the stage split, in points of the application view.",
          tables: weightingTables,
        },
      },
      potential: {
        available: a.availablePoints,
        locked: a.lockedPoints,
        current: Math.round(a.totalRaw * 10) / 10,
        projected: Math.round(a.totalRaw + a.availablePoints),
        items: a.outstanding,
        lockedItems: a.locked,
        footnotes,
      },
      summary: parsed.overall,
    };
  }, [a, selected, results, parsed, documentFindings, fundabilityStatus, applications, profileData]);

  const applicationPanel =
    results.filter((r) => r.app).length > 1 ? (
      <div style={{ marginTop: "10px", border: "1px solid #e8ddd6", borderRadius: "10px", background: "#faf8f6", overflow: "hidden", textAlign: "left" }}>
        <div style={{ padding: "8px 12px", fontSize: "10.5px", fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase", color: "#8d6e63", borderBottom: "1px solid #e8ddd6" }}>
          Your funding applications ({results.filter((r) => r.app).length}) — each assessed separately
        </div>
        {results.filter((r) => r.app).map((r) => {
          const ra = r.assessment;
          const fund = ra.blocks.find((b) => b.key === "fundability");
          const on = r.id === selected?.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedAppId(r.id)}
              aria-pressed={on}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px",
                padding: "9px 12px", border: "none", borderBottom: "1px solid #f0e9e4", cursor: "pointer",
                background: on ? "#efe6e1" : "white", textAlign: "left", fontFamily: "inherit",
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#5d4037" }}>
                  #{r.shortId}{ra.application.instrumentLabel ? ` · ${ra.application.instrumentLabel}` : ""}
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "#8d6e63", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ra.fundingActive
                    ? `Fundability ${Math.round(fund?.percent || 0)}% · with this request ${ra.application.score}%`
                    : ra.fundabilityStatus === "unmapped"
                    ? `Not assessed — ${(ra.unmappedInstruments || []).join(", ") || "instrument not recognised"}`
                    : "Not assessed — no instrument selected"}
                </span>
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: on ? "#5d4037" : "#a1887f", whiteSpace: "nowrap" }}>
                {on ? "Showing" : "View"}
              </span>
            </button>
          );
        })}
      </div>
    ) : null;

  const instrumentBadge =
    a?.fundingActive && a.application.instrumentLabel ? (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: INSTRUMENT_BADGE.bg,
          border: `1px solid ${INSTRUMENT_BADGE.border}`,
          borderRadius: "20px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          color: INSTRUMENT_BADGE.text,
          marginTop: "8px",
        }}
      >
        <span>🏷</span>
        <span>
          With your {a.application.instrumentLabel} request: {a.application.score}%
          {` (${a.application.delta >= 0 ? "+" : ""}${a.application.delta.toFixed(1)})`}
        </span>
      </div>
    ) : null;

  return (
    <>
      {/* ── Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141,110,99,0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Capital Appeal</h2>
            <DollarSign size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", opacity: 0.9 }}>Investment readiness assessment</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: 0.6 }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg,#fff 0%,#f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>{fundabilityScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          {fundabilityStatus && (
            <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "#fff8e1", border: "1px solid #e8d0a8", borderRadius: "20px", color: "#8a5a00", fontWeight: 700, fontSize: "10.5px", lineHeight: 1.4 }}>
              <AlertCircle size={12} /> {a?.fundabilityStatus === "blended" ? "Several instruments — scored separately" : "Application view not scored"}
            </div>
          )}

          <button
            onClick={() => setShowModal(true)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#5d4037 0%,#4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: 600, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(93,64,55,0.4)"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(93,64,55,0.3)"; }}
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
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", width: "100%", maxWidth: "620px", border: "1px solid #e8ddd6", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {explorer ? (
              <ScoreExplorer
                title="Capital Appeal"
                score={fundabilityScore}
                band={scoreLevel}
                contextLine={
                  <>
                    Business stage:{" "}
                    <strong style={{ color: "#5d4037" }}>{a.stage.label}</strong>
                    <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "4px" }}>
                      {a.stage.basis}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#8d6e63", marginTop: "4px" }}>
                      {a.fundingActive
                        ? `Capital Appeal is Financial Strength alone · with your request: Financial Strength ${a.split.financialStrength}% + Fundability ${a.split.fundability}%`
                        : "Capital Appeal is Financial Strength alone"}
                    </div>
                  </>
                }
                badge={<>{instrumentBadge}{applicationPanel}</>}
                about={explorer.about}
                blocks={explorer.blocks}
                potential={explorer.potential}
                attention={explorer.attention}
                summary={explorer.summary}
                onNavigate={goTo}
                onClose={() => setShowModal(false)}
                onRequestAnalysis={refreshAiEvaluation}
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
  );
}