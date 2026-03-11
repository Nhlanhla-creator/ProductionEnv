"use client";
import { useState, useEffect, useCallback } from "react";
import { db } from "../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

// ── helpers ──────────────────────────────────────────────────────────────────
const norm   = (s) => (s || "").toLowerCase().trim();
const avg    = (arr) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
const parseAmt = (s) => { if (!s) return 0; const n = parseFloat(s.toString().replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; };

const groupCount = (arr, keyFn) =>
  arr.reduce((acc, item) => { const k = keyFn(item) || "Unknown"; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

const normalizeStage = (stage) => {
  const s = norm(stage);
  if (["evaluation", "under review", "in review"].includes(s)) return "review";
  if (["due diligence"].includes(s))                           return "approved";
  if (["support approved"].includes(s))                        return "supported";
  if (["active support"].includes(s))                          return "active";
  if (["decision", "funding approved"].includes(s))            return "funding";
  if (["term sheet"].includes(s))                              return "termsheet";
  if (["deal closed"].includes(s))                             return "closed";
  if (["rejected", "withdrawn", "declined", "support declined"].includes(s)) return "rejected";
  return "application";
};

const headcountBucket = (n) => {
  const v = parseInt(n) || 0;
  if (v <= 5)   return "1–5";
  if (v <= 20)  return "6–20";
  if (v <= 50)  return "21–50";
  if (v <= 100) return "51–100";
  return "100+";
};

const revenueBucket = (n) => {
  if (n < 500000)   return "<R500k";
  if (n < 1000000)  return "R500k–1M";
  if (n < 5000000)  return "R1M–5M";
  if (n < 10000000) return "R5M–10M";
  return "R10M+";
};

const daysBetween = (start, end) => {
  try {
    const s = new Date(start);
    const e = end?.seconds ? new Date(end.seconds * 1000) : end ? new Date(end) : new Date();
    const d = Math.round((e - s) / 86400000);
    return d >= 0 ? d : 0;
  } catch { return 0; }
};

// ── metric computation ────────────────────────────────────────────────────────
function computeMetrics(enriched) {
  const n = enriched.length;

  const pipeline = { initial: n, application: 0, review: 0, approved: 0, supported: 0, active: 0, funding: 0, termsheet: 0, closed: 0, rejected: 0 };
  enriched.forEach(a => { const s = normalizeStage(a.pipelineStage); if (s !== "initial" && pipeline[s] !== undefined) pipeline[s]++; });

  const bigScores = enriched.map(a => a.bigScore || 0).filter(s => s > 0);
  const bigDist   = { "0–49": 0, "50–60": 0, "60–70": 0, "70–80": 0, "80–100": 0 };
  bigScores.forEach(s => {
    if (s < 50)       bigDist["0–49"]++;
    else if (s < 60)  bigDist["50–60"]++;
    else if (s < 70)  bigDist["60–70"]++;
    else if (s < 80)  bigDist["70–80"]++;
    else              bigDist["80–100"]++;
  });

  const matchPcts  = enriched.map(a => a.matchPercentage || 0).filter(m => m > 0);
  const vettingDays = enriched.filter(a => a.applicationDate).map(a => daysBetween(a.applicationDate, a.updatedAt));
  const avgVetting  = avg(vettingDays.filter(d => d > 0 && d < 3650));

  const STAGE_LABELS = ["Application", "Evaluation", "Due Diligence", "Support Approved", "Decision", "Active Support", "Term Sheet", "Deal Closed"];
  const stageMap     = { application: "Application", review: "Evaluation", approved: "Due Diligence", supported: "Support Approved", funding: "Decision", active: "Active Support", termsheet: "Term Sheet", closed: "Deal Closed" };
  const stageDist    = Object.fromEntries(STAGE_LABELS.map(l => [l, 0]));
  enriched.forEach(a => { const k = stageMap[normalizeStage(a.pipelineStage)] || "Application"; stageDist[k]++; });

  const sector = {};
  enriched.forEach(a => {
    (a.sector || "Other").split(",").map(s => s.trim()).filter(Boolean).forEach(s => { sector[s] = (sector[s] || 0) + 1; });
  });

  const geography = groupCount(enriched, a => {
    const p = a.profile?.entityOverview?.province;
    return p ? p.charAt(0).toUpperCase() + p.slice(1) : a.location || "Unknown";
  });

  const lifecycle = groupCount(enriched, a => a.profile?.entityOverview?.operationStage || "Unknown");
  const headcount = groupCount(enriched, a => {
    const ec = a.profile?.entityOverview?.employeeCount;
    return ec ? headcountBucket(ec) : "Unknown";
  });

  const gender = { Male: 0, Female: 0, Other: 0 };
  enriched.forEach(a => {
    (a.profile?.ownershipManagement?.shareholders || []).forEach(s => {
      const g = (s.gender || "").trim();
      if (g === "Male") gender.Male++;
      else if (g === "Female") gender.Female++;
      else if (g) gender.Other++;
    });
  });

  const disability = { "No disability": 0, "Disability disclosed": 0 };
  enriched.forEach(a => {
    (a.profile?.ownershipManagement?.shareholders || []).forEach(s => {
      if (s.isDisabled) disability["Disability disclosed"]++;
      else disability["No disability"]++;
    });
  });

  const youth = { Youth: 0, "Non-youth": 0 };
  enriched.forEach(a => {
    (a.profile?.ownershipManagement?.shareholders || []).forEach(s => {
      if (s.isYouth) youth.Youth++;
      else youth["Non-youth"]++;
    });
  });

  const hdi = { "HDI Owned (>50%)": 0, "Non-HDI": 0 };
  enriched.forEach(a => {
    const bo = parseFloat(a.profile?.socialImpact?.blackOwnership || "0");
    if (bo > 50) hdi["HDI Owned (>50%)"]++;
    else hdi["Non-HDI"]++;
  });

  const revenueBuckets = {};
  const revenueValues  = [];
  enriched.forEach(a => {
    const r = parseAmt(a.profile?.financialOverview?.annualRevenue);
    if (r > 0) { revenueValues.push(r); revenueBuckets[revenueBucket(r)] = (revenueBuckets[revenueBucket(r)] || 0) + 1; }
  });

  const supportFocus  = groupCount(enriched, a => { const s = (a.supportRequired  || "").replace(/_/g, " "); return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Other"; });
  const servicesFocus = groupCount(enriched, a => { const s = (a.servicesRequired || "").replace(/_/g, " "); return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Other"; });

  const fundingType = {};
  enriched.forEach(a => {
    (a.profile?.useOfFunds?.fundingInstruments || []).forEach(i => { fundingType[i] = (fundingType[i] || 0) + 1; });
  });

  const fundingAmounts = enriched.map(a => parseAmt(a.fundingRequired || a.profile?.useOfFunds?.amountRequested)).filter(f => f > 0);
  const fundingBySector = {};
  enriched.forEach(a => {
    const amt = parseAmt(a.fundingRequired || a.profile?.useOfFunds?.amountRequested);
    const sec = (a.sector || "Other").split(",")[0].trim();
    if (amt > 0) fundingBySector[sec] = (fundingBySector[sec] || 0) + amt;
  });

  let jobsDirect = 0, jobsIndirect = 0;
  const jobsPerSME = enriched.map(a => {
    const gp = a.profile?.growthPotential || {};
    const d  = parseInt(gp.employmentIncreaseDirect   || "0") || 0;
    const i  = parseInt(gp.employmentIncreaseIndirect || "0") || 0;
    jobsDirect   += d;
    jobsIndirect += i;
    return { name: a.smeName || "Unknown", sector: (a.sector || "").split(",")[0].trim(), jobs: d + i };
  });

  const revenuePerSME = enriched.map(a => ({
    name: a.smeName || "Unknown",
    sector: (a.sector || "").split(",")[0].trim(),
    revenue: parseAmt(a.profile?.financialOverview?.annualRevenue),
    profitability: a.profile?.financialOverview?.profitabilityStatus || "Unknown",
    fundingRequired: parseAmt(a.fundingRequired || a.profile?.useOfFunds?.amountRequested),
    matchPct: a.matchPercentage || 0,
    bigScore: a.bigScore || 0,
  }));

  const closed   = enriched.filter(a => normalizeStage(a.pipelineStage) === "closed");
  const active   = enriched.filter(a => normalizeStage(a.pipelineStage) === "active");
  const progDays = enriched.filter(a => ["closed", "active"].includes(normalizeStage(a.pipelineStage))).map(a => daysBetween(a.applicationDate, a.updatedAt)).filter(d => d > 0 && d < 3650);
  const avgMonths = progDays.length ? Math.round(avg(progDays) / 30) : 0;

  const toRow = (a) => ({
    name: a.smeName || "Unknown",
    sector: (a.sector || "").split(",")[0].trim() || "General",
    stage: a.profile?.entityOverview?.operationStage || "Startup",
    bigScore: a.bigScore || 0,
    matchPct: a.matchPercentage || 0,
    compliance: a.compliance || 0,
    fundability: a.fundability || 0,
    legitimacy: a.legitimacy || 0,
    revenue: parseAmt(a.profile?.financialOverview?.annualRevenue),
  });

  const byBig         = [...enriched].sort((a, b) => (b.bigScore||0)        - (a.bigScore||0));
  const byMatch       = [...enriched].sort((a, b) => (b.matchPercentage||0) - (a.matchPercentage||0));
  const byCompliance  = [...enriched].sort((a, b) => (a.compliance||0)      - (b.compliance||0));
  const byFundability = [...enriched].sort((a, b) => (a.fundability||0)     - (b.fundability||0));

  const barriers = {};
  enriched.forEach(a => {
    (a.profile?.enterpriseReadiness?.barriers || []).forEach(b => { barriers[b] = (barriers[b] || 0) + 1; });
  });

  const fundingReadinessRate = bigScores.length ? Math.round((bigScores.filter(s => s >= 70).length / bigScores.length) * 100) : 0;

  return {
    totalSMEs: n,
    pipeline,
    bigScore: { avg: avg(bigScores), min: bigScores.length ? Math.min(...bigScores) : 0, max: bigScores.length ? Math.max(...bigScores) : 0, dist: bigDist },
    match:    { avg: avg(matchPcts), min: matchPcts.length ? Math.min(...matchPcts) : 0, max: matchPcts.length ? Math.max(...matchPcts) : 0 },
    fundingReadinessRate,
    vetting:  { avg: avgVetting, target: 10 },
    stageDist,
    sector, geography, lifecycle, headcount,
    gender, disability, youth, hdi,
    revenue:  { buckets: revenueBuckets, values: revenueValues, total: revenueValues.reduce((a, b) => a + b, 0), avg: avg(revenueValues), perSME: revenuePerSME },
    supportFocus, servicesFocus,
    fundingType,
    funding:  { amounts: fundingAmounts, avg: avg(fundingAmounts), total: fundingAmounts.reduce((a, b) => a + b, 0), bySector: fundingBySector },
    jobs:     { direct: jobsDirect, indirect: jobsIndirect, total: jobsDirect + jobsIndirect, perSME: jobsPerSME },
    exit:     { graduates: closed.length, active: active.length, avgMonths, graduationRate: n ? Math.round((closed.length / n) * 100) : 0 },
    performers: {
      topBig:         byBig.slice(0, 3).map(toRow),
      bottomBig:      byBig.slice(-3).reverse().map(toRow),
      topMatch:       byMatch.slice(0, 3).map(toRow),
      bottomMatch:    byMatch.slice(-3).reverse().map(toRow),
      lowCompliance:  byCompliance.slice(0, 3).map(toRow),
      lowFundability: byFundability.slice(0, 3).map(toRow),
    },
    learnings: { barriers, support: supportFocus, services: servicesFocus },
  };
}

// ── hook ──────────────────────────────────────────────────────────────────────
export const usePortfolioData = () => {
  const [enriched,         setEnriched]         = useState([]);
  const [metrics,          setMetrics]          = useState(null);
  const [catalystFormData, setCatalystFormData] = useState({});
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  const fetchAll = useCallback(async (uid) => {
    try {
      setLoading(true);

      // ── 1. Catalyst profile (programme preferences) ───────────────────────
      const catalystDoc = await getDoc(doc(db, "catalystProfiles", uid));
      const formData = catalystDoc.exists() ? (catalystDoc.data().formData || {}) : {};
      setCatalystFormData(formData);

      // ── 2. Fetch catalyst applications + bigEvaluations in parallel ───────
      const [appSnap, bigSnap] = await Promise.all([
        getDocs(query(collection(db, "catalystApplications"), where("catalystId", "==", uid))),
        getDocs(collection(db, "bigEvaluations")),
      ]);

      console.log(`[usePortfolioData] catalystApplications: ${appSnap.size} docs`);
      console.log(`[usePortfolioData] bigEvaluations: ${bigSnap.size} docs`);

      // ── 3. Build scores lookup: smeId → scores object ─────────────────────
      // bigEvaluations doc id == SME auth uid == smeId extracted from app doc id.
      const scoresById = {};
      bigSnap.forEach(d => {
        const { scores } = d.data();
        if (scores) scoresById[d.id] = scores;
      });

      // ── 4. Parse application docs ─────────────────────────────────────────
      const rawApps = appSnap.docs.map((d) => {
        const parts = d.id.split("_");
        return { docId: d.id, smeId: parts[1] || "", programIndex: parts[2] || "0", ...d.data() };
      });

      // ── 5. Batch-fetch unique universalProfiles ───────────────────────────
      const uniqueIds = [...new Set(rawApps.map(a => a.smeId).filter(Boolean))];
      const profiles  = {};
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const pd = await getDoc(doc(db, "universalProfiles", id));
          if (pd.exists()) profiles[id] = pd.data();
        } catch {}
      }));

      // ── 6. Enrich: profile + scores from bigEvaluations ──────────────────
      // Scores are spread at the top level so computeMetrics can read
      // a.bigScore, a.compliance, a.fundability, a.legitimacy etc. directly.
      const enrichedApps = rawApps.map(a => {
        const evalScores = scoresById[a.smeId] || {};
        return {
          ...a,
          profile: profiles[a.smeId] || {},
          // Scores from bigEvaluations take precedence over any stale values
          // already stored on the catalystApplication document itself.
          bigScore:    evalScores.bigScore    ?? a.bigScore    ?? 0,
          compliance:  evalScores.compliance  ?? a.compliance  ?? 0,
          fundability: evalScores.fundability ?? a.fundability ?? 0,
          legitimacy:  evalScores.legitimacy  ?? a.legitimacy  ?? 0,
          leadership:  evalScores.leadership  ?? a.leadership  ?? 0,
          pis:         evalScores.pis         ?? a.pis         ?? 0,
        };
      });

      console.log("[usePortfolioData] enriched applications:", enrichedApps);

      // ── 7. Write scores back to catalystApplications (fire-and-forget) ────
      // This keeps the application docs in sync so other parts of the app
      // that read catalystApplications directly also see fresh scores.
      const writebacks = enrichedApps
        .filter(a => a.docId && scoresById[a.smeId])
        .map(a =>
          setDoc(
            doc(db, "catalystApplications", a.docId),
            {
              bigScore:    a.bigScore,
              compliance:  a.compliance,
              fundability: a.fundability,
              legitimacy:  a.legitimacy,
              leadership:  a.leadership,
              pis:         a.pis,
              scoresLastSyncedAt: new Date().toISOString(),
            },
            { merge: true }   // never overwrite other fields
          ).catch(err => console.warn(`[usePortfolioData] writeback failed for ${a.docId}:`, err))
        );

      // Kick off writes in background — don't await, don't block the UI
      Promise.all(writebacks);

      const computed = computeMetrics(enrichedApps);
      console.log("[usePortfolioData] computed metrics:", computed);
      setEnriched(enrichedApps);
      setMetrics(computed);
    } catch (err) {
      console.error("usePortfolioData:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) fetchAll(user.uid);
      else setLoading(false);
    });
    return unsub;
  }, [fetchAll]);

  return {
    enriched,
    metrics,
    catalystFormData,
    loading,
    error,
    refetch: () => { const u = getAuth().currentUser; if (u) fetchAll(u.uid); },
  };
};