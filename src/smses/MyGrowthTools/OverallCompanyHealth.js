"use client";

import { useState, useEffect, useCallback } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Brain, ClipboardList, Info, MessageSquare, Route } from "lucide-react";

// ==================== VIEWER ORIGINS ====================
// Every cohorts table that can open this page "as" an SME writes viewOrigin
// into sessionStorage. These two maps are the only place that value is
// interpreted, so adding a new viewer type is a two-line change rather than
// another `else if` chain to keep in sync.
//
// Investor is the fallback purely because /my-cohorts is the investor route.
// An origin missing from ROUTE_BY_ORIGIN doesn't error — it silently sends the
// viewer to the investor portfolio, which is exactly what advisors hit before
// "advisor" was listed here.
const ROUTE_BY_ORIGIN = {
  cmf: "/cmf-cohorts",
  catalyst: "/catalyst/cohorts",
  advisor: "/advisor-cohorts",
  investor: "/my-cohorts",
};

const VIEWER_COPY = {
  catalyst: { banner: (name) => `Catalyst View: Viewing ${name}'s Company Health`, back: "Back to Catalyst Cohorts" },
  cmf: { banner: (name) => `Facilitator View: Viewing ${name}'s Company Health`, back: "Back to CMF Cohorts" },
  advisor: { banner: (name) => `Advisor View: Viewing ${name}'s Company Health`, back: "Back to Advisory Cohorts" },
  investor: { banner: (name) => `Investor View: Viewing ${name}'s Company Health`, back: "Back to My Cohorts" },
};

// Cleared together on exit. Leaving any one behind changes how an unrelated
// page behaves later in the same session — a stale viewOnlyBigScore narrows the
// SME sidebar, a stale viewOrigin misroutes the next Back button.
const IMPERSONATION_KEYS = [
  "viewingSMEId",
  "viewingSMEName",
  "investorViewMode",
  "viewOrigin",
  "viewOnlyBigScore",
];

// ==================== CACHE SERVICE ====================
// The cache key includes a hash of the live inputs, so any change to the
// underlying data (vision, canvas, milestones, risks, ...) invalidates it.

class HealthCacheService {
  static simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  static getCacheId(userId, hash) {
    return `health_overview_${userId}_${hash}`;
  }

  static async save(userId, data, hash) {
    if (!userId) return false;
    try {
      const ref = doc(db, `users/${userId}/cachedAnalyses`, this.getCacheId(userId, hash));
      await setDoc(ref, {
        type: "companyHealth",
        data,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h TTL
      });
      return true;
    } catch (e) {
      console.error("HealthCache save error:", e);
      return false;
    }
  }

  static async load(userId, hash) {
    if (!userId) return null;
    try {
      const ref = doc(db, `users/${userId}/cachedAnalyses`, this.getCacheId(userId, hash));
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const d = snap.data();
      if (new Date(d.expiresAt) > new Date()) return d;
      return null;
    } catch (e) {
      console.error("HealthCache load error:", e);
      return null;
    }
  }
}

// ==================== CONSTANTS ====================
// "metrics" are the exact section headings used by each source page.
// Status / risk / score are computed from live data in loadHealthInputs().

const HEALTH_DATA = [
  {
    key: "strategy",
    category: "Strategy & Execution",
    metrics: ["Strategic Clarity", "Operating Model", "Strategy Operationalisation", "Strategic Risk Control"],
  },
  {
    key: "finance",
    category: "Finance",
    metrics: ["Profit & Costs", "Cash & Liquidity", "Financial Strength", "Balance Sheet", "Loan Repayments", "Equity Structure"],
  },
  {
    key: "operations",
    category: "Operations",
    metrics: ["Supply Chain", "Delivery", "Safety"],
  },
  {
    key: "people",
    category: "People Health",
    metrics: ["Execution Capacity", "Productivity & Efficiency", "Capability & Training", "Stability & Continuity"],
  },
  {
    key: "marketing",
    category: "Marketing & Sales",
    metrics: ["Pipeline Sufficiency", "Revenue Concentration", "Demand Sustainability", "Pipeline Visibility"],
  },
  {
    key: "esg",
    category: "ESG",
    metrics: ["Environment", "Social", "Governance"],
  },
];

// ==================== LIVE DATA + SCORING ====================

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const pct = (n, d) => (d ? n / d : 0);
const filled = (v) => typeof v === "string" && v.trim().length >= 10;
const statusFor = (s) => (s >= 75 ? "healthy" : s >= 50 ? "watch" : "risk");
const riskFor = (s) => (s >= 75 ? "low" : s >= 50 ? "medium" : "high");

/**
 * Strategy score — computed from the same collections the Strategy page writes:
 *   visionMission, businessModelCanvas, milestones, risks.
 * Weights: clarity 30 · operating model 20 · execution 30 · risk control 20.
 * Sub-scores are keyed by the Strategy page tab names.
 * An empty source scores 0 and is reported as a gap (no evidence ≠ healthy).
 */
const scoreStrategy = ({ vm, bmc, milestones, risks }) => {
  const today = new Date().toISOString().split("T")[0];
  const gaps = [];

  // ---- Strategic Clarity ----
  const prios = vm.strategicPriorities || [];
  const values = vm.values || [];
  const principles = vm.operatingPrinciples || [];
  const clarity = clamp(
    (filled(vm.vision) ? 20 : 0) +
      (filled(vm.mission) ? 20 : 0) +
      Math.min(values.length / 3, 1) * 15 +
      Math.min(principles.length / 3, 1) * 15 +
      Math.min(prios.length / 3, 1) * 20 +
      pct(prios.filter((p) => p.status === "Done").length, prios.length) * 10
  );
  if (!filled(vm.vision)) gaps.push("No vision statement");
  if (!filled(vm.mission)) gaps.push("No mission statement");
  if (values.length < 3) gaps.push(`Only ${values.length} core values defined`);
  if (principles.length < 3) gaps.push(`Only ${principles.length} operating principles defined`);
  if (prios.length === 0) gaps.push("No strategic priorities defined");

  // ---- Operating Model ----
  const blocks = [
    "keyPartners", "keyActivities", "keyResources", "valuePropositions",
    "customerRelationships", "channels", "customerSegments", "costStructure", "revenueStreams",
  ];
  const missingBlocks = blocks.filter((b) => !filled(bmc[b]));
  const model = clamp(pct(blocks.length - missingBlocks.length, blocks.length) * 100);
  if (missingBlocks.length) gaps.push(`Operating model blocks incomplete: ${missingBlocks.join(", ")}`);

  // ---- Strategy Operationalisation ----
  const n = milestones.length;
  const overdue = milestones.filter(
    (m) => m.targetDate && m.targetDate < today && m.status !== "Done" && (m.percentageCompletion || 0) < 100
  ).length;
  const atRisk = milestones.filter((m) => m.status === "At Risk").length;
  const avgCompletion = n ? milestones.reduce((s, m) => s + (m.percentageCompletion || 0), 0) / n : 0;
  const execution = n ? clamp(avgCompletion * 0.5 + (1 - atRisk / n) * 25 + (1 - overdue / n) * 25) : 0;
  if (!n) gaps.push("No milestones recorded");

  // ---- Strategic Risk Control ----
  const r = risks.length;
  const sc = (x) => (x.severity || 1) * (x.likelihood || 1);
  const controlled = risks.reduce(
    (s, x) =>
      s + (x.mitigationStatus === "🟢 Controlled" ? 1 : x.mitigationStatus === "🟡 Partially controlled" ? 0.5 : 0),
    0
  );
  const criticalOpen = risks.filter((x) => sc(x) >= 16 && x.mitigationStatus === "🔴 Uncontrolled").length;
  const riskControl = r
    ? clamp(
        pct(risks.filter((x) => x.owner).length, r) * 25 +
          pct(risks.filter((x) => filled(x.mitigation)).length, r) * 25 +
          pct(risks.filter((x) => x.reviewCadence).length, r) * 15 +
          pct(controlled, r) * 35 -
          Math.min(criticalOpen * 10, 30)
      )
    : 0;
  if (!r) gaps.push("No risks recorded in the risk register");
  if (criticalOpen) gaps.push(`${criticalOpen} high-severity risk(s) uncontrolled`);

  const score = clamp(clarity * 0.3 + model * 0.2 + execution * 0.3 + riskControl * 0.2);

  return {
    score,
    status: statusFor(score),
    riskLevel: riskFor(score),
    subScores: {
      "Strategic Clarity": clarity,
      "Operating Model": model,
      "Strategy Operationalisation": execution,
      "Strategic Risk Control": riskControl,
    },
    notMeasured: [],
    reportedOnly: [],
    gaps,
    facts: {
      strategicClarity: {
        vision: (vm.vision || "").slice(0, 300) || null,
        mission: (vm.mission || "").slice(0, 300) || null,
        valuesCount: values.length,
        principlesCount: principles.length,
        priorities: prios.map((p) => ({ description: p.description, due: p.dueDate, status: p.status })),
      },
      operatingModel: {
        canvasBlocksFilled: `${blocks.length - missingBlocks.length}/${blocks.length}`,
        missingBlocks,
      },
      strategyOperationalisation: {
        total: n, avgCompletionPct: Math.round(avgCompletion), atRisk, overdue,
        milestones: milestones.slice(0, 20).map((milestone) => ({
          title: milestone.title || milestone.name || milestone.description || "Untitled milestone",
          description: milestone.description || "",
          owner: milestone.owner || "",
          targetDate: milestone.targetDate || "",
          status: milestone.status || "Not started",
          percentageCompletion: Number(milestone.percentageCompletion) || 0,
          blockers: milestone.blockers || "",
        })),
      },
      strategicRiskControl: {
        total: r,
        highSeverity: risks.filter((x) => sc(x) >= 16).length,
        controlled: risks.filter((x) => x.mitigationStatus === "🟢 Controlled").length,
        uncontrolled: risks.filter((x) => x.mitigationStatus === "🔴 Uncontrolled").length,
        withOwner: risks.filter((x) => x.owner).length,
        risks: risks.slice(0, 20).map((risk) => ({
          title: risk.title || risk.name || risk.description || "Untitled risk",
          severity: risk.severity || null,
          likelihood: risk.likelihood || null,
          owner: risk.owner || "",
          mitigation: risk.mitigation || "",
          mitigationStatus: risk.mitigationStatus || "Unspecified",
          reviewCadence: risk.reviewCadence || "",
        })),
      },
    },
  };
};

// ---- Finance: mirrors the calculations in FinancialPerformance.jsx ----
const FIN_DOC = { pnl: "_pnlManual", bs: "_capitalStructure", cost: "_costAgility", liq: "_liquiditySurvival" };
const FIN_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const fnum = (arr, mi) => { const n = parseFloat(arr?.[mi]); return Number.isFinite(n) ? n : null; };
const fdiv = (a, b) => (Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : null);
const sumObj = (obj, mi) => Object.values(obj || {}).reduce((s, a) => s + (parseFloat(a?.[mi]) || 0), 0);
const avgOf = (arr) => { const v = arr.filter(Number.isFinite); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const wavg = (pairs) => {
  const p = pairs.filter(([s]) => Number.isFinite(s));
  const w = p.reduce((a, [, x]) => a + x, 0);
  return w ? p.reduce((a, [s, x]) => a + s * x, 0) / w : null;
};
const lin = (v, bad, good) => (Number.isFinite(v) ? clamp(((v - bad) / (good - bad)) * 100) : null);
const r2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

const monthHasBs = (bs, mi) => {
  if (!bs) return false;
  const scan = (o) => Object.values(o || {}).some((a) => Array.isArray(a) && a[mi] !== "" && a[mi] !== null && a[mi] !== undefined);
  const a = bs.assets || {};
  return scan(a.bank) || scan(a.currentAssets) || scan(a.fixedAssets) || scan(a.intangibleAssets) || scan(a.nonCurrentAssets)
    || scan(bs.liabilities?.currentLiabilities) || scan(bs.liabilities?.nonCurrentLiabilities) || scan(bs.equity)
    || (a.customCategories || bs.customCategories || []).some((c) => scan(c.items))
    || (bs.customLiabilitiesCategories || []).some((c) => scan(c.items))
    || (bs.customEquityCategories || []).some((c) => scan(c.items));
};

const bsTotals = (bsDoc, mi) => {
  const bs = bsDoc?.balanceSheetData;
  const empty = { assets: null, liabilities: null, equity: null, currentAssets: null, currentLiabilities: null, inventory: null, cash: null };
  if (!bs || !monthHasBs(bs, mi)) return empty;
  const a = bs.assets || {};
  const fixed = (() => {
    const fa = a.fixedAssets; if (!fa) return 0;
    const add = ["land","buildings","computerEquipment","vehicles","furniture","machinery","otherPropertyPlantEquipment","assetsUnderConstruction"];
    const sub = ["lessDepreciationBuildings","lessDepreciationComputer","lessDepreciationVehicles","lessDepreciationFurniture","lessDepreciationMachinery","lessDepreciationOther"];
    return add.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0) - sub.reduce((s, k) => s + (parseFloat(fa[k]?.[mi]) || 0), 0);
  })();
  const intangible = (() => {
    const ia = a.intangibleAssets; if (!ia) return 0;
    return ["goodwill","trademarks","patents","software","customerLists"].reduce((s, k) => s + (parseFloat(ia[k]?.[mi]) || 0), 0)
      - (parseFloat(ia.lessAmortization?.[mi]) || 0);
  })();
  const customAssets = (a.customCategories || bs.customCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);
  const currentAssets = sumObj(a.currentAssets, mi) + sumObj(a.bank, mi);
  const assets = currentAssets + fixed + intangible + sumObj(a.nonCurrentAssets, mi) + customAssets;
  const currentLiabilities = sumObj(bs.liabilities?.currentLiabilities, mi);
  const liabilities = currentLiabilities + sumObj(bs.liabilities?.nonCurrentLiabilities, mi)
    + (bs.customLiabilitiesCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);
  const equity = sumObj(bs.equity, mi) - 2 * (parseFloat(bs.equity?.treasuryShares?.[mi]) || 0)
    + (bs.customEquityCategories || []).reduce((s, c) => s + sumObj(c.items, mi), 0);
  return {
    assets, liabilities, equity, currentAssets, currentLiabilities,
    inventory: parseFloat(a.currentAssets?.inventory?.[mi]) || 0,
    cash: sumObj(a.bank, mi) + (parseFloat(a.currentAssets?.cash?.[mi]) || 0),
  };
};

const buildFinCtx = (docs, year, mi) => {
  const p = docs[`${FIN_DOC.pnl}_${year}`], b = docs[`${FIN_DOC.bs}_${year}`];
  const c = docs[`${FIN_DOC.cost}_${year}`], l = docs[`${FIN_DOC.liq}_${year}`];
  const t = bsTotals(b, mi);
  const sales = fnum(p?.sales, mi), cogs = fnum(p?.cogs, mi), opex = fnum(p?.opex, mi);
  const dep = fnum(p?.depreciation, mi), amort = fnum(p?.amortization, mi);
  const intExp = fnum(p?.interestExpense, mi), intInc = fnum(p?.interestIncome, mi), tax = fnum(p?.tax, mi);
  const salesB = fnum(p?.salesBudget, mi), cogsB = fnum(p?.cogsBudget, mi), opexB = fnum(p?.opexBudget, mi);
  const gp = Number.isFinite(sales) && Number.isFinite(cogs) ? sales - cogs : null;
  const gpB = Number.isFinite(salesB) && Number.isFinite(cogsB) ? salesB - cogsB : null;
  const ebitda = Number.isFinite(gp) && Number.isFinite(opex) ? gp - opex : null;
  const ebitdaB = Number.isFinite(gpB) && Number.isFinite(opexB) ? gpB - opexB : null;
  const ebit = Number.isFinite(ebitda) ? ebitda - (dep || 0) - (amort || 0) : null;
  const np = Number.isFinite(ebit) ? ebit - (intExp || 0) + (intInc || 0) - (tax || 0) : null;
  return {
    sales, gp, ebitda, ebitdaB, ebit, np, intExp, ...t,
    fixedCosts: fnum(c?.fixedCosts, mi), variableCosts: fnum(c?.variableCosts, mi),
    discretionary: fnum(c?.discretionaryCosts, mi), semiVariable: fnum(c?.semiVariableCosts, mi),
    lockIn: fnum(c?.lockInDuration, mi),
    currentRatio: fnum(l?.currentRatio, mi), quickRatio: fnum(l?.quickRatio, mi), cashRatio: fnum(l?.cashRatio, mi),
    burnRate: fnum(l?.burnRate, mi), cashCover: fnum(l?.cashCover, mi), cashflow: fnum(l?.cashflow, mi),
    cashBalance: fnum(l?.cashBalance, mi),
  };
};

/**
 * Finance score from the trailing 12 calendar months (oldest → newest).
 * Weights: solvency 20 · liquidity 20 · profitability 25 · cost agility 10 · cash survivability 25.
 * Investability is derived from three of them and is NOT weighted again.
 *
 * Those five weighted parts are regrouped under the Financial Performance page
 * headings for display:
 *   Profit & Costs     = profitability + cost agility
 *   Cash & Liquidity   = liquidity + cash survivability
 *   Financial Strength = solvency
 * Balance Sheet, Loan Repayments and Equity Structure are reported (facts for
 * the AI) but not scored.
 */
const scoreFinance = (ms, extras = {}) => {
  const gaps = [];
  const hasData = (c) => [c.sales, c.assets, c.currentRatio, c.cashBalance, c.fixedCosts].some(Number.isFinite);
  let lastIdx = -1;
  ms.forEach((c, i) => { if (hasData(c)) lastIdx = i; });

  if (lastIdx === -1) {
    return {
      score: 0, status: "risk", riskLevel: "high", subScores: {}, notMeasured: [], reportedOnly: [],
      gaps: ["No financial data captured in the last 12 months"], facts: { monthsWithData: 0 },
    };
  }

  const latest = (fn) => {
    for (let i = ms.length - 1; i >= 0; i--) { const v = fn(ms[i]); if (Number.isFinite(v)) return v; }
    return null;
  };
  const sumOf = (list, fn) => { const v = list.map(fn).filter(Number.isFinite); return v.length ? v.reduce((a, b) => a + b, 0) : null; };

  // ---- Solvency ----
  const eqPct = latest((c) => { const r = fdiv(c.equity, c.assets); return r === null ? null : r * 100; });
  const d2a = latest((c) => fdiv(c.liabilities, c.assets));
  const nav = latest((c) => (Number.isFinite(c.assets) && Number.isFinite(c.liabilities) ? c.assets - c.liabilities : null));
  const ebitSum = sumOf(ms, (c) => c.ebit), intSum = sumOf(ms, (c) => c.intExp);
  const icov = intSum > 0 && ebitSum !== null ? ebitSum / intSum : null;
  let solvency = avgOf([lin(eqPct, 0, 40), lin(d2a, 1, 0.5), lin(icov, 1, 4)]);
  if (nav !== null && nav < 0 && solvency !== null) { solvency = Math.min(solvency, 25); gaps.push("Net asset value is negative"); }

  // ---- Liquidity ----
  const cr = latest((c) => (Number.isFinite(c.currentRatio) ? c.currentRatio : fdiv(c.currentAssets, c.currentLiabilities)));
  const qr = latest((c) => (Number.isFinite(c.quickRatio) ? c.quickRatio
    : fdiv(Number.isFinite(c.currentAssets) ? c.currentAssets - (c.inventory || 0) : null, c.currentLiabilities)));
  const cashR = latest((c) => (Number.isFinite(c.cashRatio) ? c.cashRatio : fdiv(c.cash, c.currentLiabilities)));
  const liquidity = avgOf([lin(cr, 0.8, 1.5), lin(qr, 0.5, 1), lin(cashR, 0.1, 0.5)]);

  // ---- Profitability trend ----
  const sales12 = sumOf(ms, (c) => c.sales), np12 = sumOf(ms, (c) => c.np), gp12 = sumOf(ms, (c) => c.gp);
  const npMargin = sales12 > 0 && np12 !== null ? (np12 / sales12) * 100 : null;
  const gpMargin = sales12 > 0 && gp12 !== null ? (gp12 / sales12) * 100 : null;
  const winMargin = (arr) => { const s = sumOf(arr, (c) => c.sales), n = sumOf(arr, (c) => c.np); return s > 0 && n !== null ? (n / s) * 100 : null; };
  const m3 = winMargin(ms.slice(-3)), mPrev = winMargin(ms.slice(-6, -3));
  const trend = m3 !== null && mPrev !== null ? lin(m3 - mPrev, -5, 2) : null;
  const both = ms.filter((c) => Number.isFinite(c.ebitda) && Number.isFinite(c.ebitdaB) && c.ebitdaB > 0);
  const bAct = both.reduce((s, c) => s + c.ebitda, 0), bBud = both.reduce((s, c) => s + c.ebitdaB, 0);
  const budgetScore = bBud > 0 ? lin(bAct / bBud, 0.7, 1) : null;
  const profitability = wavg([[lin(npMargin, 0, 10), 50], [trend, 25], [budgetScore, 25]]);

  // ---- Cost agility ----
  const fixedPct = latest((c) => { const r = fdiv(c.fixedCosts, (c.fixedCosts || 0) + (c.variableCosts || 0)); return r === null ? null : r * 100; });
  const discPct = latest((c) => {
    const tot = [c.fixedCosts, c.variableCosts, c.discretionary, c.semiVariable].filter(Number.isFinite).reduce((s, v) => s + v, 0);
    const r = fdiv(c.discretionary, tot); return r === null ? null : r * 100;
  });
  const lockIn = latest((c) => c.lockIn);
  const costAgility = avgOf([lin(fixedPct, 90, 50), lin(discPct, 0, 20), lin(lockIn, 24, 3)]);

  // ---- Cash survivability ----
  const cash = latest((c) => (Number.isFinite(c.cashBalance) ? c.cashBalance : c.cash));
  const burn = latest((c) => c.burnRate);
  const cover = latest((c) => (Number.isFinite(c.cashCover) ? c.cashCover : fdiv(c.cashBalance, c.burnRate)));
  const cfs = ms.slice(-6).map((c) => c.cashflow).filter(Number.isFinite);
  const posShare = cfs.length ? cfs.filter((v) => v > 0).length / cfs.length : null;
  const coverScore = burn !== null && burn <= 0 && cash > 0 ? 100 : lin(cover, 1, 6);
  const survival = wavg([[coverScore, 60], [lin(posShare, 0, 1), 40]]);

  const investability = wavg([[solvency, 40], [profitability, 40], [survival, 20]]);

  const parts = {
    Solvency: solvency, Liquidity: liquidity, "Profitability trend": profitability,
    "Cost agility": costAgility, "Cash survivability": survival,
  };
  const W = { Solvency: 20, Liquidity: 20, "Profitability trend": 25, "Cost agility": 10, "Cash survivability": 25 };
  Object.entries(parts).forEach(([k, v]) => { if (v === null) gaps.push(`${k}: no data captured`); });

  let score = Object.entries(W).reduce((s, [k, w]) => s + (parts[k] ?? 0) * (w / 100), 0);
  const stale = ms.length - 1 - lastIdx;
  if (stale > 3) {
    score *= Math.max(0.5, 1 - 0.1 * (stale - 3));
    gaps.push(`Latest financial data is ${stale} months old (${ms[lastIdx].label})`);
  }
  score = clamp(score);

  // ---- Group the weighted parts under the Financial Performance page headings ----
  const sec = (v) => (Number.isFinite(v) ? Math.round(v) : undefined);
  const subScores = Object.fromEntries(
    Object.entries({
      "Profit & Costs": wavg([[profitability, 25], [costAgility, 10]]),
      "Cash & Liquidity": wavg([[liquidity, 20], [survival, 25]]),
      "Financial Strength": solvency,
    })
      .map(([k, v]) => [k, sec(v)])
      .filter(([, v]) => v !== undefined)
  );

  // ---- Facts for the headings that are reported but not scored ----
  const assetsNow = latest((c) => c.assets), liabNow = latest((c) => c.liabilities), eqNow = latest((c) => c.equity);
  const bsGap = [assetsNow, liabNow, eqNow].every(Number.isFinite) ? assetsNow - liabNow - eqNow : null;

  const { loans = [], dividends = [], investors = [] } = extras;
  const sumArr = (a) => (Array.isArray(a) ? a.reduce((s, v) => s + (parseFloat(v) || 0), 0) : 0);
  const loanSched = loans.reduce((s, l) => s + sumArr(l.scheduled), 0);
  const loanPaid = loans.reduce((s, l) => s + sumArr(l.paid), 0);
  const lastDiv = [...dividends].sort((a, b) => (b.year || 0) - (a.year || 0))[0];

  return {
    score,
    status: statusFor(score),
    riskLevel: riskFor(score),
    subScores,
    notMeasured: [],
    reportedOnly: ["Balance Sheet", "Loan Repayments", "Equity Structure"],
    gaps,
    facts: {
      window: `${ms[0].label} to ${ms[ms.length - 1].label}`,
      latestDataMonth: ms[lastIdx].label,
      monthsWithData: ms.filter(hasData).length,

      // Profit & Costs
      revenue12m: r2(sales12), netProfit12m: r2(np12),
      netMarginPct: r2(npMargin), grossMarginPct: r2(gpMargin),
      marginLast3mPct: r2(m3), marginPrior3mPct: r2(mPrev),
      ebitdaVsBudget: bBud > 0 ? r2(bAct / bBud) : null,
      fixedCostSharePct: r2(fixedPct), discretionarySharePct: r2(discPct), costLockInMonths: r2(lockIn),

      // Cash & Liquidity
      currentRatio: r2(cr), quickRatio: r2(qr), cashRatio: r2(cashR),
      cashBalance: r2(cash), burnRate: r2(burn), cashCoverMonths: r2(cover),
      positiveCashflowMonthsOfLast6: cfs.length ? `${cfs.filter((v) => v > 0).length}/${cfs.length}` : null,

      // Financial Strength
      equityRatioPct: r2(eqPct), debtToAssets: r2(d2a), netAssetValue: r2(nav), interestCoverage: r2(icov),
      investability: r2(investability),
      investabilityNote: "Derived: 40% solvency, 40% profitability, 20% cash survivability",

      // Balance Sheet (reported only)
      balanceSheet: {
        totalAssets: r2(assetsNow), totalLiabilities: r2(liabNow), totalEquity: r2(eqNow),
        outOfBalanceBy: r2(bsGap),
        balances: bsGap === null ? null : Math.abs(bsGap) < 1,
      },

      // Loan Repayments (reported only)
      loanRepayments: {
        loansTracked: loans.length,
        scheduledTotal: r2(loanSched), paidTotal: r2(loanPaid),
        paidVsScheduledPct: loanSched > 0 ? r2((loanPaid / loanSched) * 100) : null,
      },

      // Equity Structure (reported only)
      equityStructure: {
        investorCount: investors.length,
        totalInvested: r2(investors.reduce((s, i) => s + (Number(i.investment) || 0), 0)),
        dividendRecords: dividends.length,
        latestDividend: lastDiv ? { year: lastDiv.year, amountPerShare: lastDiv.amountPerShare } : null,
      },
    },
  };
};

const loadFinanceInputs = async (uid) => {
  const now = new Date();
  const years = [now.getFullYear() - 1, now.getFullYear()];
  const docs = {};
  await Promise.all(
    years.flatMap((y) => Object.values(FIN_DOC).map((d) => `${d}_${y}`)).map(async (k) => {
      try {
        const snap = await getDoc(doc(db, "users", uid, "financialData", k));
        if (snap.exists()) docs[k] = snap.data();
      } catch (e) { console.error(`Could not load ${k}:`, e); }
    })
  );

  // Loans, dividends and cap table (the three headings that aren't scored)
  const safeGet = (ref) => getDoc(ref).catch((e) => { console.error(e); return null; });
  const [metaSnap, divSnap, capSnap] = await Promise.all([
    safeGet(doc(db, "users", uid, "financialData", "financialKpiMeta")),
    safeGet(doc(db, "dividend-history", uid)),
    safeGet(doc(db, "cap-table", uid)),
  ]);
  const extras = {
    loans: metaSnap?.exists() ? metaSnap.data().loans || [] : [],
    dividends: divSnap?.exists() ? divSnap.data().dividends || [] : [],
    investors: capSnap?.exists() ? capSnap.data().investors || [] : [],
  };

  const ms = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    ms.push({
      ...buildFinCtx(docs, d.getFullYear(), d.getMonth()),
      label: `${FIN_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return scoreFinance(ms, extras);
};

const operationalNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const rollupOperationalValues = (values, aggregate) => {
  const numericValues = values.map(operationalNumber).filter((value) => value !== null);
  if (!numericValues.length) return null;
  const total = numericValues.reduce((sum, value) => sum + value, 0);
  return aggregate === "sum" ? total : total / numericValues.length;
};

const getCurrentMonthOperationalValue = (kpi, year, month, field) => {
  const entries = kpi.entries || {};
  const monthKey = `M:${year}-${String(month + 1).padStart(2, "0")}`;
  const direct = entries[monthKey];
  if (direct && (operationalNumber(direct.actual) !== null || operationalNumber(direct.budget) !== null)) {
    return operationalNumber(direct[field]);
  }

  const prefix = (kpi.frequency || "Monthly") === "Daily" ? "D:" : "W:";
  const values = Object.entries(entries)
    .filter(([key]) => key.startsWith(prefix))
    .filter(([key]) => {
      const date = new Date(key.slice(2));
      return date.getFullYear() === year && date.getMonth() === month;
    })
    .map(([, entry]) => Number(entry[field]));
  return rollupOperationalValues(values, kpi.aggregate);
};

const operationalKpiScore = (kpi, budget, actual) => {
  budget = operationalNumber(budget);
  actual = operationalNumber(actual);
  if (budget === null || actual === null) return null;

  let status;
  if (kpi.direction === "match") {
    if (budget === 0) {
      status = Math.abs(actual) < 0.001 ? "green" : Math.abs(actual) <= 1 ? "amber" : "red";
    } else {
      const drift = Math.abs(actual - budget) / Math.abs(budget);
      status = drift <= 0.02 ? "green" : drift <= 0.10 ? "amber" : "red";
    }
  } else if (budget === 0) {
    if (kpi.direction === "higher") return null;
    status = actual <= 0 ? "green" : actual <= 1 ? "amber" : "red";
  } else {
    const ratio = kpi.direction === "higher" ? actual / budget : budget / (actual || 0.0001);
    status = ratio >= 0.98 ? "green" : ratio >= 0.85 ? "amber" : "red";
  }

  return { status, score: status === "green" ? 100 : status === "amber" ? 60 : 20 };
};

const getNestedValue = (object, path) => path.reduce((value, key) => value?.[key], object);

const scoreKpiAgainstTarget = ({ actual, target, direction = "higher", matchTolerance = [0.05, 0.20] }) => {
  actual = operationalNumber(actual);
  target = operationalNumber(target);
  if (actual === null || target === null) return null;

  let status;
  if (direction === "match") {
    if (target === 0) {
      status = Math.abs(actual) < 0.001 ? "green" : Math.abs(actual) <= 1 ? "amber" : "red";
    } else {
      const drift = Math.abs(actual - target) / Math.abs(target);
      status = drift <= matchTolerance[0] ? "green" : drift <= matchTolerance[1] ? "amber" : "red";
    }
  } else if (target === 0) {
    if (direction === "higher") return null;
    status = actual <= 0 ? "green" : "amber";
  } else {
    const ratio = direction === "higher" ? actual / target : target / (actual || 0.0001);
    status = ratio >= 0.98 ? "green" : ratio >= 0.85 ? "amber" : "red";
  }

  return { status, score: status === "green" ? 100 : status === "amber" ? 60 : 20 };
};

const scoreMeasuredSections = ({ sections, facts, scoringMethod }) => {
  const subScores = {};
  const gaps = [];
  const measuredScores = [];

  sections.forEach((section) => {
    const score = facts[section]?.score;
    if (Number.isFinite(score)) {
      subScores[section] = score;
      measuredScores.push(score);
    } else {
      gaps.push(`${section}: no usable scored data is available`);
    }
  });

  if (!measuredScores.length) return null;
  const score = clamp(measuredScores.reduce((sum, value) => sum + value, 0) / measuredScores.length);
  return {
    score,
    status: statusFor(score),
    riskLevel: riskFor(score),
    subScores,
    facts: { scoringMethod, sections: facts },
    gaps,
    notMeasured: sections.filter((section) => subScores[section] === undefined),
    reportedOnly: [],
  };
};

const scorePeople = (docs) => {
  const month = new Date().getMonth();
  const metric = (name, source, actualPath, targetPath, direction, benchmark) => {
    const actualValue = getNestedValue(docs[source], actualPath);
    const actual = Array.isArray(actualValue) ? actualValue[month] : actualValue;
    const targetValue = targetPath ? getNestedValue(docs[source], targetPath) : null;
    const target = operationalNumber(Array.isArray(targetValue) ? targetValue[month] : targetValue) ?? benchmark;
    const result = scoreKpiAgainstTarget({ actual, target, direction });
    return {
      name,
      actual: operationalNumber(actual),
      target: operationalNumber(target),
      direction,
      ...(result || {}),
    };
  };

  const definitions = {
    "Execution Capacity": [
      metric("Head Count", "comp", ["employeeData", "headCount"], ["employeeData", "targetHeadCount"], "match"),
      metric("% Critical Functions Dependent on 1 Person", "exec", ["executionData", "criticalFunctionsSinglePoint"], null, "lower", 20),
      metric("% Critical Roles with 2IC", "exec", ["executionData", "criticalRolesWith2IC"], null, "higher", 80),
    ],
    "Productivity & Efficiency": [
      metric("Revenue per Employee", "prod", ["productivityData", "revenuePerEmployee", "actual"], ["productivityData", "revenuePerEmployee", "budget"], "higher"),
      metric("Labour Cost % of Revenue", "prod", ["productivityData", "laborCostPercentage", "actual"], ["productivityData", "laborCostPercentage", "budget"], "lower"),
      metric("Sales Volume per Employee", "prod", ["productivityData", "salesVolumePerEmployee", "actual"], ["productivityData", "salesVolumePerEmployee", "budget"], "higher"),
      metric("Overtime Hours", "prod", ["productivityData", "overtimeHours", "actual"], ["productivityData", "overtimeHours", "budget"], "lower"),
    ],
    "Capability & Training": [
      metric("Training Spend (R)", "cap", ["capabilityData", "trainingSpendAmount", "actual"], ["capabilityData", "trainingSpendAmount", "budget"], "higher", 50000),
      metric("Training Spend (% of payroll)", "cap", ["capabilityData", "trainingSpendPercentage", "actual"], ["capabilityData", "trainingSpendPercentage", "budget"], "higher", 3),
      metric("Training Focus", "cap", ["capabilityData", "trainingFocus", "actual"], ["capabilityData", "trainingFocus", "budget"], "match"),
    ],
    "Stability & Continuity": [
      metric("Overall Turnover (% Annually)", "stab", ["stabilityData", "overallTurnover"], null, "lower", 15),
      metric("Critical Role Turnover", "stab", ["stabilityData", "criticalRoleTurnover"], null, "lower", 10),
      metric("Workforce Movements", "stab", ["stabilityData", "workforceMovements"], null, "higher"),
      metric("Contractor Dependence", "stab", ["stabilityData", "contractorDependence"], null, "lower", 20),
    ],
  };

  const facts = Object.fromEntries(Object.entries(definitions).map(([section, kpis]) => {
    const scoredKpis = kpis.filter((kpi) => Number.isFinite(kpi.score));
    return [section, {
      scoredKpis: scoredKpis.length,
      kpis: kpis.map(({ status, score, ...kpi }) => ({
        ...kpi,
        ...(status ? { status, score } : {}),
      })),
      ...(scoredKpis.length
        ? { score: clamp(scoredKpis.reduce((sum, kpi) => sum + kpi.score, 0) / scoredKpis.length) }
        : {}),
    }];
  }));

  return scoreMeasuredSections({
    sections: HEALTH_DATA.find((row) => row.key === "people").metrics,
    facts,
    scoringMethod: "Current calendar-month People dashboard actuals are scored against the configured target or dashboard benchmark using direction-aware KPI status thresholds. KPI scores are averaged within each section; measured sections are equally averaged.",
  });
};

const scoreOperations = (structure) => {
  const now = new Date();
  const sections = ["Supply Chain", "Delivery", "Safety"];
  const subScores = {};
  const sectionFacts = {};
  const gaps = [];
  const sectionScores = [];

  sections.forEach((sectionName) => {
    const category = (structure || []).find((item) => item.name === sectionName && !item.hidden);
    const scoredKpis = [];

    (category?.subCategories || []).forEach((subCategory) => {
      (subCategory.kpis || []).forEach((kpi) => {
        const actual = getCurrentMonthOperationalValue(kpi, now.getFullYear(), now.getMonth(), "actual");
        const budget = getCurrentMonthOperationalValue(kpi, now.getFullYear(), now.getMonth(), "budget");
        const result = operationalKpiScore(kpi, budget, actual);
        if (!result) return;
        scoredKpis.push({
          name: kpi.name,
          subCategory: subCategory.name,
          actual,
          budget,
          units: kpi.units || "",
          status: result.status,
          score: result.score,
        });
      });
    });

    if (!scoredKpis.length) {
      gaps.push(`${sectionName}: no current-month KPI readings with a usable budget and actual`);
      sectionFacts[sectionName] = { scoredKpis: 0, kpis: [] };
      return;
    }

    const sectionScore = clamp(
      scoredKpis.reduce((total, kpi) => total + kpi.score, 0) / scoredKpis.length
    );
    subScores[sectionName] = sectionScore;
    sectionScores.push(sectionScore);
    sectionFacts[sectionName] = { scoredKpis: scoredKpis.length, kpis: scoredKpis };
  });

  if (!sectionScores.length) return null;

  const score = clamp(sectionScores.reduce((total, value) => total + value, 0) / sectionScores.length);
  return {
    score,
    status: statusFor(score),
    riskLevel: riskFor(score),
    subScores,
    facts: {
      reportingPeriod: `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`,
      scoringMethod: "Each KPI uses the same green/amber/red budget-attainment thresholds as Operational Performance; KPI scores are averaged within each section, then scored sections are equally averaged.",
      sections: sectionFacts,
    },
    gaps,
    notMeasured: sections.filter((section) => subScores[section] === undefined),
    reportedOnly: [],
  };
};

const scoreMarketing = ({ docs, pipelineRecords }) => {
  const month = new Date().getMonth();
  const definitions = {
    "Pipeline Sufficiency": [
      ["Total Pipeline Value", "pipeline", ["pipelineData", "pipelineValue"], "higher", 1000000],
      ["Risk Adjusted Value", "pipeline", ["pipelineData", "riskValue"], "higher", 500000],
      ["Pipeline Coverage", "pipeline", ["pipelineData", "coverage"], "higher", 200],
      ["New Leads", "pipeline", ["pipelineData", "newLeads"], "higher", 50],
      ["Conversion Rate", "pipeline", ["pipelineData", "conversionRate"], "higher", 30],
      ["Sales Velocity", "pipeline", ["pipelineData", "salesVelocity"], "lower", 30],
    ],
    "Revenue Concentration": [
      ["Total Marketing Spend", "concentration", ["concentrationData", "totalSpend"], "lower", 100000],
      ["Overall ROI", "concentration", ["concentrationData", "totalROI"], "higher", 200],
    ],
    "Demand Sustainability": [
      ["Repeat Customer Rate", "sustainability", ["sustainabilityData", "repeatRate"], "higher", 40],
      ["Net Retention", "sustainability", ["sustainabilityData", "netRetention"], "higher", 30],
      ["Campaign ROI", "sustainability", ["sustainabilityData", "campaignROI"], "higher", 150],
    ],
  };
  const facts = {};

  Object.entries(definitions).forEach(([section, metrics]) => {
    const kpis = metrics.map(([name, source, path, direction, benchmark]) => {
      const actual = getNestedValue(docs[source], [...path, "actual"]);
      const target = getNestedValue(docs[source], [...path, "budget"]);
      const actualValue = Array.isArray(actual) ? actual[month] : null;
      const targetValue = Array.isArray(target) ? target[month] : null;
      const effectiveTarget = operationalNumber(targetValue) ?? benchmark;
      const result = scoreKpiAgainstTarget({ actual: actualValue, target: effectiveTarget, direction });
      return {
        name,
        actual: operationalNumber(actualValue),
        target: operationalNumber(effectiveTarget),
        direction,
        ...(result || {}),
      };
    });
    const scored = kpis.filter((kpi) => Number.isFinite(kpi.score));
    facts[section] = {
      scoredKpis: scored.length,
      kpis: kpis.map(({ status, score, ...kpi }) => ({
        ...kpi,
        ...(status ? { status, score } : {}),
      })),
      ...(scored.length
        ? { score: clamp(scored.reduce((sum, kpi) => sum + kpi.score, 0) / scored.length) }
        : {}),
    };
  });

  const records = Array.isArray(pipelineRecords) ? pipelineRecords : [];
  facts["Pipeline Visibility"] = {
    opportunityRecords: records.length,
    activeOpportunities: records.filter((record) => !["closed", "won", "lost"].includes(String(record.status || "").toLowerCase())).length,
    scoredKpis: 0,
  };
  const result = scoreMeasuredSections({
    sections: HEALTH_DATA.find((row) => row.key === "marketing").metrics.filter((section) => section !== "Pipeline Visibility"),
    facts,
    scoringMethod: "Current calendar-month Marketing & Sales dashboard actuals are scored against the captured target or dashboard benchmark using direction-aware KPI thresholds. KPI scores are averaged within each scored section; scored sections are equally averaged. Pipeline Visibility reports pipeline-record counts only and is not scored.",
  });
  if (result) {
    result.reportedOnly = ["Pipeline Visibility"];
    return result;
  }

  return {
    score: null,
    status: "unscored",
    riskLevel: "unscored",
    subScores: {},
    facts: {
      reportingPeriod: `${new Date().toLocaleString("en-US", { month: "long" })} ${new Date().getFullYear()}`,
      scoringMethod: "No Marketing & Sales KPI section has a scoreable current-month actual. Pipeline Visibility reports opportunity-record counts only and does not contribute to a health score.",
      sections: facts,
    },
    gaps: ["No Marketing & Sales KPI section has a scoreable current-month actual and target or benchmark."],
    notMeasured: ["Pipeline Sufficiency", "Revenue Concentration", "Demand Sustainability"],
    reportedOnly: ["Pipeline Visibility"],
    analysisOnly: true,
  };
};

const mapEsgScore = (value, mapping) => {
  if (typeof value === "boolean") return value ? 100 : 20;
  if (typeof value !== "string" || !value.trim()) return null;
  return mapping[value.trim().toLowerCase()] ?? null;
};

const scoreEsg = (profileData) => {
  const governance = profileData?.governance;
  if (!governance || typeof governance !== "object") return null;

  const facts = {};
  const addMapped = (items, mappings) => items
    .map(([name, value, map]) => {
      const score = mapEsgScore(value, map);
      return score === null ? null : { name, value, score };
    })
    .filter(Boolean);
  const yesNo = { yes: 100, no: 20 };
  const partial = { yes: 100, partial: 60, no: 20 };

  const environment = addMapped([
    ["Environmental Exposure Type", governance.exposureType, { none: 100, indirect: 60, direct: 20 }],
    ["Environmental Compliance Required", governance.complianceRequired, yesNo],
    ["Environmental Permits in Place", governance.permitsInPlace, partial],
    ["Environmental Incidents", governance.incidents, { none: 100, minor: 60, major: 20 }],
    ["Environmental Controls", governance.controls, { formal: 100, basic: 60, none: 20 }],
  ]);
  facts.Environment = {
    indicators: environment,
    ...(environment.length ? { score: clamp(environment.reduce((sum, item) => sum + item.score, 0) / environment.length) } : {}),
  };

  const social = addMapped([
    ["Employment Practices", governance.employmentPractices, yesNo],
    ["Health & Safety", governance.healthSafety, yesNo],
    ["Fair Treatment & Grievances", governance.fairTreatment, yesNo],
    ["Skills & Development", governance.skillsDevelopment, yesNo],
    ["Supply Chain", governance.supplyChain, yesNo],
    ["Social Incidents", governance.socialIncidents, { no: 100, yes: 20 }],
  ]);
  facts.Social = {
    indicators: social,
    ...(social.length ? { score: clamp(social.reduce((sum, item) => sum + item.score, 0) / social.length) } : {}),
  };

  const governanceIndicators = addMapped([
    ...[
      ["Core Policies", governance.corePolicies, partial],
      ["Risk Register", governance.riskRegister, yesNo],
      ["Reporting Responsibility", governance.reportingResponsibility, yesNo],
      ["Internal Controls", governance.internalControls, yesNo],
      ["Audit Schedule", governance.auditSchedule, yesNo],
      ["Required Submissions On Time", governance.submissionsOnTime, yesNo],
      ["Management Reports Delivered", governance.managementReports, yesNo],
      ["Overdue Compliance Obligations", governance.overdueCompliance, { no: 100, yes: 20 }],
      ["Data Protection", governance.dataProtection, yesNo],
      ["Shareholder Register", governance.shareholderRegister, yesNo],
      ["Voting Rights", governance.votingRights, yesNo],
      ["Oversight Structure", governance.oversightStructure, { "formal-board": 100, "advisory-board": 80, "founder-only": 40, none: 20 }],
      ["Independent Oversight", governance.independentOversight, yesNo],
      ["Meeting Cadence", governance.meetingCadence, { monthly: 100, regular: 80, quarterly: 60, "ad-hoc": 20 }],
      ["Conflict Declarations", governance.conflictDeclarations, yesNo],
      ["Ethics Training", governance.ethicsTraining, yesNo],
      ["Code of Conduct Signed", governance.codeOfConductSigned, yesNo],
      ["Adverse Listings", governance.adverseListings, { no: 100, yes: 20 }],
      ["Court Notices", governance.courtNotices, { no: 100, yes: 20 }],
      ...[
        ["Strategic Direction", governance.strategicClarity?.strategicDirection, { documented_shared: 100, informal: 60, none: 20 }],
        ["Planning Depth", governance.strategicClarity?.planningDepth, { "3_4_selected": 100, "1_2_selected": 60, none: 20 }],
        ["Market Strategy", governance.strategicClarity?.marketStrategy, { clearly_defined: 100, partially_defined: 60, unclear: 20 }],
        ["Execution Roadmap", governance.strategicClarity?.executionRoadmap, { detailed_roadmap: 100, high_level_plan: 60, no_roadmap: 20 }],
        ["Decision-Making", governance.strategicClarity?.decisionMaking, { structured_data_driven: 100, semi_structured: 60, informal_reactive: 20 }],
        ["Adaptability", governance.strategicClarity?.adaptability, { structured_review: 100, some_adjustment: 60, reactive_none: 20 }],
        ["Risk Identification", governance.riskManagement?.riskIdentification, { documented_risk_register: 100, informal_awareness: 60, no_structured_identification: 20 }],
        ["Risk Assessment", governance.riskManagement?.riskAssessment, { structured_assessment: 100, basic_informal: 60, no_formal_assessment: 20 }],
        ["Risk Mitigation", governance.riskManagement?.riskMitigation, { defined_mitigation_plans: 100, some_mitigation_actions: 60, no_clear_approach: 20 }],
        ["Business Continuity", governance.riskManagement?.businessContinuity, { formal_documented_plan: 100, partial_informal_plan: 60, none: 20 }],
        ["Crisis Preparedness", governance.riskManagement?.crisisPreparedness, { clear_response_protocols: 100, some_readiness: 60, reactive_unprepared: 20 }],
        ["Risk Ownership", governance.riskManagement?.riskOwnership, { clear_ownership: 100, shared_unclear: 60, no_ownership_defined: 20 }],
        ["Reporting Frequency", governance.transparencyReporting?.reportingFrequency, { monthly: 100, quarterly: 60, ad_hoc_none: 20 }],
        ["Performance Review Cycle", governance.transparencyReporting?.performanceReviewCycle, { monthly: 100, quarterly_biannual: 60, ad_hoc_none: 20 }],
        ["KPI Monitoring", governance.transparencyReporting?.kpiMonitoring, { defined_kpis_tracked: 100, some_kpis_tracked: 60, no_structured_tracking: 20 }],
        ["Stakeholder Communication", governance.transparencyReporting?.stakeholderCommunication, { structured_reports: 100, informal_updates: 60, minimal: 20 }],
        ["Compliance & Risk", governance.transparencyReporting?.complianceAndRisk, { formal_risk_register_audits: 100, partial_some_controls: 60, none: 20 }],
        ["Data Governance", governance.transparencyReporting?.dataGovernance, { formal_popia_aligned: 100, basic_controls: 60, no_formal_approach: 20 }],
        ["Audit & Assurance", governance.transparencyReporting?.auditAndAssurance, { regular_internal_external: 100, occasional_audits: 60, none: 20 }],
      ].map(([name, value, map]) => [name, value, map]),
    ],
    ...Object.entries(governance.governanceChecklist || {}).map(([name, value]) => [
      `Governance checklist: ${name}`, value, yesNo,
    ]),
  ]);
  facts.Governance = {
    indicators: governanceIndicators,
    ...(governanceIndicators.length
      ? { score: clamp(governanceIndicators.reduce((sum, item) => sum + item.score, 0) / governanceIndicators.length) }
      : {}),
  };

  return scoreMeasuredSections({
    sections: HEALTH_DATA.find((row) => row.key === "esg").metrics,
    facts,
    scoringMethod: "Recorded ESG profile indicators are scored from their explicit values on a 0–100 scale (100 for the favorable documented response, 60 for partial responses, and 20 for unfavorable responses). Indicators are equally averaged within each section; sections with scored indicators are equally averaged.",
  });
};

/**
 * Loads every live source and returns { [categoryKey]: scoredResult }.
 * Categories without scored live data are absent — the table shows them as pending.
 */
const loadHealthInputs = async (uid) => {
  const byUser = (name) => getDocs(query(collection(db, name), where("userId", "==", uid)));

  const peopleDocIds = ["_productivity", "_capabilityTraining", "_executionCapacity", "_stabilityContinuity", "_employeeComposition"];
  const marketingDocIds = ["_pipelineData", "_concentrationData", "_sustainabilityData"];
  const [vmS, bmcS, msS, rkS, finance, operationsSnap, peopleSnaps, marketingSnaps, pipelineSnap, profileSnap, userSnap] = await Promise.all([
    byUser("visionMission"),
    byUser("businessModelCanvas"),
    byUser("milestones"),
    byUser("risks"),
    loadFinanceInputs(uid).catch((e) => { console.error("Finance load failed:", e); return null; }),
    getDoc(doc(db, "operationalKpis", uid)),
    Promise.all(peopleDocIds.map((suffix) => getDoc(doc(db, "peopleData", `${uid}${suffix}`)))),
    Promise.all(marketingDocIds.map((suffix) => getDoc(doc(db, "marketingData", `${uid}${suffix}`)))),
    getDocs(collection(db, "users", uid, "pipelineRecords")),
    getDoc(doc(db, "universalProfiles", uid)),
    getDoc(doc(db, "users", uid)),
  ]);
  const operations = operationsSnap.exists()
    ? scoreOperations(operationsSnap.data().structure)
    : null;
  const peopleDocs = Object.fromEntries(peopleDocIds.map((suffix, index) => [
    { _productivity: "prod", _capabilityTraining: "cap", _executionCapacity: "exec", _stabilityContinuity: "stab", _employeeComposition: "comp" }[suffix],
    peopleSnaps[index].exists() ? peopleSnaps[index].data() : {},
  ]));
  const marketingDocs = Object.fromEntries(marketingDocIds.map((suffix, index) => [
    { _pipelineData: "pipeline", _concentrationData: "concentration", _sustainabilityData: "sustainability" }[suffix],
    marketingSnaps[index].exists() ? marketingSnaps[index].data() : {},
  ]));
  const people = scorePeople(peopleDocs);
  const marketing = scoreMarketing({
    docs: marketingDocs,
    pipelineRecords: pipelineSnap.docs.map((record) => record.data()),
  });
  const esg = scoreEsg(profileSnap.exists() ? profileSnap.data() : null);

  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const userProfile = userSnap.exists() ? userSnap.data() : {};
  const profileIdentity = profile.entityOverview || profile.formData?.entityOverview || {};
  const visionMission = vmS.empty ? {} : vmS.docs[0].data();
  const strategyPriorities = Array.isArray(visionMission.strategicPriorities)
    ? visionMission.strategicPriorities
    : [];
  const companyGoal = [
    visionMission.mission ? `Mission: ${String(visionMission.mission).slice(0, 500)}` : "",
    strategyPriorities.length
      ? `Strategic priorities: ${strategyPriorities
      .slice(0, 5)
      .map((priority) => String(priority.description || priority.title || priority.name || "").slice(0, 180))
      .filter(Boolean).join("; ")}`
      : "",
  ].filter(Boolean).join("\n");

  return {
    companyName:
      profileIdentity.tradingName ||
      profileIdentity.registeredName ||
      profile.companyName ||
      profile.registeredName ||
      userProfile.companyName ||
      userProfile.registeredName ||
      userProfile.businessName ||
      "",
    companyGoal,
    strategy: scoreStrategy({
      vm: visionMission,
      bmc: bmcS.empty ? {} : bmcS.docs[0].data(),
      milestones: msS.docs.map((d) => d.data()),
      risks: rkS.docs.map((d) => d.data()),
    }),
    ...(finance ? { finance } : {}),
    ...(operations ? { operations } : {}),
    ...(people ? { people } : {}),
    ...(marketing ? { marketing } : {}),
    ...(esg ? { esg } : {}),
  };
};

// ==================== HELPERS ====================

const statusColors = { healthy: "#16a34a", watch: "#f59e0b", risk: "#dc2626" };
const riskBadgeStyles = {
  low:    { bg: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" },
  medium: { bg: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
  high:   { bg: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" },
};

const statusDotStyle = (status) => ({
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  backgroundColor: statusColors[status] || "#94a3b8",
  margin: "0 auto",
  border: "2px solid #fdfcfb",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
});

const insightColors = { positive: "#16a34a", warning: "#f59e0b", critical: "#dc2626" };

// ==================== PER-SECTION BREAKDOWN ====================

const SectionBreakdown = ({ metrics, live, aiSections }) => (
  <div style={{
    padding: "16px 20px 20px", backgroundColor: "#f7f3f0", borderTop: "1px dashed #e8ddd4",
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px",
  }}>
    {metrics.map((m) => {
      const score = live?.subScores?.[m];
      const reportedOnly = live?.reportedOnly?.includes(m);
      const ai = aiSections?.[m];
      const st = score !== undefined ? statusFor(score) : null;
      const strategyEvidenceKey = {
        "Strategic Clarity": "strategicClarity",
        "Operating Model": "operatingModel",
        "Strategy Operationalisation": "strategyOperationalisation",
        "Strategic Risk Control": "strategicRiskControl",
      }[m];
      const evidence = live?.facts?.sections?.[m] ||
        (strategyEvidenceKey ? live?.facts?.[strategyEvidenceKey] : null);

      return (
        <div key={m} style={{
          backgroundColor: "#fdfcfb", border: "1px solid #e8ddd4",
          borderRadius: "8px", padding: "14px 16px",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "8px", gap: "8px",
          }}>
            <span style={{ fontWeight: "700", fontSize: "13.5px", color: "#5d4037" }}>{m}</span>
            {st ? (
              <span style={{
                fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px",
                color: "#fff", backgroundColor: statusColors[st],
              }}>{score}/100</span>
            ) : (
              <span style={{ fontSize: "11px", color: "#8a7a74", fontStyle: "italic" }}>
                {reportedOnly ? "reported, not scored" : "no data"}
              </span>
            )}
          </div>

          {ai ? (
            <>
              <p style={{ fontSize: "12.5px", color: "#4a352f", lineHeight: "1.6", margin: "0 0 8px" }}>{ai.summary}</p>
              {ai.insights?.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px" }}>
                  <span style={{ color: insightColors[it.type] || "#7d5a50", fontSize: "13px" }}>
                    {it.type === "positive" ? "✓" : it.type === "critical" ? "!" : "·"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#5d4037", lineHeight: "1.5" }}>{it.message}</span>
                </div>
              ))}
              {ai.recommendation && (
                <div style={{
                  marginTop: "8px", padding: "6px 10px", backgroundColor: "#fef3c7",
                  borderRadius: "4px", fontSize: "12px", color: "#92400e",
                }}>
                  <strong>Action: </strong>{ai.recommendation}
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: "12px", color: "#8a7a74", fontStyle: "italic", margin: 0 }}>
              No explanation for this section yet. Regenerate the report.
            </p>
          )}
          {evidence && (
            <details style={{ marginTop: "10px", borderTop: "1px solid #eee5dc", paddingTop: "8px" }}>
              <summary style={{ color: "#7d5a50", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Evidence details</summary>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#5d4037", fontSize: "11px", lineHeight: 1.5 }}>{JSON.stringify(evidence, null, 2)}</pre>
            </details>
          )}
        </div>
      );
    })}
  </div>
);

// ==================== MAIN COMPONENT ====================

function OverallCompanyHealth() {
  const [user, setUser] = useState(null);
  const [aiResults, setAiResults] = useState(null);       // full parsed AI response
  const [inputs, setInputs] = useState(null);             // live computed scores per category
  const [categoryLoading, setCategoryLoading] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cachedAt, setCachedAt] = useState(null);
  const [companyContext, setCompanyContext] = useState({ companyName: "", companyGoal: "" });
  const [detailModal, setDetailModal] = useState(null);
  const [healthNotes, setHealthNotes] = useState({});
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [isInvestorView, setIsInvestorView] = useState(false);
  const [viewingSMEId, setViewingSMEId] = useState(null);
  const [viewingSMEName, setViewingSMEName] = useState("");
  const [viewOrigin, setViewOrigin] = useState("investor");

  // ---- Auth ----
  useEffect(() => {
    const investorViewMode = sessionStorage.getItem("investorViewMode");
    const smeId = sessionStorage.getItem("viewingSMEId");
    const smeName = sessionStorage.getItem("viewingSMEName");
    const origin = sessionStorage.getItem("viewOrigin");
    if (investorViewMode === "true" && smeId) {
      setIsInvestorView(true);
      setViewingSMEId(smeId);
      setViewingSMEName(smeName || "SME");
      setViewOrigin(origin || "investor");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(isInvestorView && viewingSMEId ? { uid: viewingSMEId } : currentUser);
    });
    return () => unsubscribe();
  }, [isInvestorView, viewingSMEId]);

  useEffect(() => {
    setHealthNotes({});
    if (!user?.uid) return;
    let active = true;
    getDoc(doc(db, "users", user.uid, "companyHealth", "notes"))
      .then((snapshot) => {
        if (active && snapshot.exists()) {
          setHealthNotes(snapshot.data().notes || {});
        }
      })
      .catch((loadError) => {
        console.error("Could not load company health notes:", loadError);
      });
    return () => { active = false; };
  }, [user]);

  // ---- Spin animation ----
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // ---- Load live data, then cached or fresh AI narrative ----
  const generateAnalysis = useCallback(async (forceRegenerate = false) => {
    if (!user) {
      setError("Please log in to generate AI analysis.");
      return;
    }

    setGlobalLoading(true);
    setError(null);

    try {
      // 1. Real data → computed scores (always runs; this is what the table shows)
      const inp = await loadHealthInputs(user.uid);
      setInputs(inp);
      const nextCompanyContext = {
        companyName: inp.companyName || "",
        companyGoal: inp.companyGoal || "",
      };
      setCompanyContext(nextCompanyContext);
      // v6 adds company context and the structured strategy plan to the narrative.
      const hash = HealthCacheService.simpleHash("v6:" + JSON.stringify(inp));

      // 2. Cached narrative for exactly this data?
      if (!forceRegenerate) {
        const cached = await HealthCacheService.load(user.uid, hash);
        if (cached) {
          setAiResults(cached.data);
          setCachedAt(cached.createdAt);
          return;
        }
      }

      // 3. Ask the AI to explain the computed results (live categories only)
      const liveRows = HEALTH_DATA.filter((row) => inp[row.key]);
      const loadingMap = {};
      liveRows.forEach((row) => { loadingMap[row.key] = true; });
      setCategoryLoading(loadingMap);

      const analyzeHealth = httpsCallable(getFunctions(), "analyzeCompanyHealth");
      const result = await analyzeHealth({
        companyName: nextCompanyContext.companyName || "Your Business",
        companyGoal: nextCompanyContext.companyGoal,
        categories: liveRows.map((row) => ({
          key: row.key,
          name: row.category,
          metrics: row.metrics, // the section headings the AI must explain one by one
          ...inp[row.key],      // score, status, riskLevel, subScores, facts, gaps, notMeasured, reportedOnly
        })),
      });
      const data = result.data;

      await HealthCacheService.save(user.uid, data, hash);
      setAiResults(data);
      setCachedAt(data.timestamp);
    } catch (err) {
      console.error("Error generating health analysis:", err);
      setError(err.message || "Failed to generate analysis. Please try again.");
    } finally {
      setCategoryLoading({});
      setGlobalLoading(false);
    }
  }, [user]);

  const openDetailModal = (row, mode) => {
    setNoteDraft(healthNotes[row.key] || "");
    setDetailModal({ key: row.key, mode });
  };

  const saveHealthNote = async () => {
    if (!user?.uid || !detailModal || isInvestorView) return;
    setSavingNote(true);
    try {
      const nextNotes = { ...healthNotes, [detailModal.key]: noteDraft };
      await setDoc(doc(db, "users", user.uid, "companyHealth", "notes"), {
        notes: nextNotes,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setHealthNotes(nextNotes);
    } catch (saveError) {
      console.error("Could not save company health note:", saveError);
      setError("Your note could not be saved. Please try again.");
    } finally {
      setSavingNote(false);
    }
  };

  // ---- Auto-run once the user is known ----
  useEffect(() => {
    if (user) generateAnalysis(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExitInvestorView = () => {
    const origin = sessionStorage.getItem("viewOrigin");
    IMPERSONATION_KEYS.forEach((key) => sessionStorage.removeItem(key));
    window.location.href = ROUTE_BY_ORIGIN[origin] || ROUTE_BY_ORIGIN.investor;
  };

  // ---- Render helpers ----
  const getFormattedCacheTime = () => {
    if (!cachedAt) return null;
    const date = new Date(cachedAt);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  // Overall score = average of the computed scores of categories that are live
  const liveScores = Object.values(inputs || {}).map((v) => v.score).filter(Number.isFinite);
  const overallScore = liveScores.length
    ? Math.round(liveScores.reduce((a, b) => a + b, 0) / liveScores.length)
    : undefined;
  const executiveSummary = aiResults?.executiveSummary;
  const criticalActions = aiResults?.criticalActions || [];
  const viewerCopy = VIEWER_COPY[viewOrigin] || VIEWER_COPY.investor;

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#f7f3f0",
      width: "100%", boxSizing: "border-box",
    }}>
      <div style={{ maxWidth: "100%", margin: "0 auto", width: "100%" }}>

        {/* ---- Viewer Banner ---- */}
        {isInvestorView && (
          <div style={{
            backgroundColor: "#e8f5e9", padding: "16px 20px",
            margin: "0 20px 20px", borderRadius: "8px",
            border: "2px solid #4caf50", display: "flex",
            justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "20px" }}>👁️</span>
              <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
                {viewerCopy.banner(viewingSMEName)}
              </span>
            </div>
            <button
              onClick={handleExitInvestorView}
              style={{
                padding: "8px 16px", backgroundColor: "#4caf50", color: "white",
                border: "none", borderRadius: "6px", cursor: "pointer",
                fontWeight: "600", fontSize: "14px",
              }}
            >
              ← {viewerCopy.back}
            </button>
          </div>
        )}

        {/* ---- Page Header ---- */}
        <div style={{ margin: "0 20px 20px", padding: "20px 24px", background: "#fdfcfb", border: "1px solid #e8ddd4", borderRadius: "10px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#5d4037", marginBottom: "10px", marginTop: 0 }}>
            Overall Company Health
          </h1>
          <p style={{ fontSize: "16px", color: "#7d5a50", fontWeight: "500", margin: 0 }}>
            {companyContext.companyName || viewingSMEName || "Company"} · Comprehensive health assessment
          </p>
          <div style={{ marginTop: "14px", padding: "12px 14px", borderLeft: "4px solid #7d5a50", background: "#f7f3f0", borderRadius: "4px" }}>
            <strong style={{ color: "#5d4037", fontSize: "12px", textTransform: "uppercase" }}>Mission / strategic goal</strong>
            <p style={{ margin: "5px 0 0", color: "#4a352f", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {companyContext.companyGoal || "No mission or strategic priorities are recorded yet."}
            </p>
          </div>
        </div>

        {/* ---- AI Executive Summary Banner ---- */}
        <div style={{
          backgroundColor: "#5d4037", margin: "0 20px 20px",
          padding: "16px 24px", borderRadius: "8px", color: "#fdfcfb",
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: "15px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <circle cx="12" cy="8" r="0.5" fill="currentColor" />
            </svg>
            <div>
              <span style={{ fontWeight: "600", fontSize: "14px" }}>AI Executive Summary</span>
              <p style={{ margin: "6px 0 0", fontSize: "13px", opacity: 0.9, lineHeight: "1.6" }}>
                {globalLoading
                  ? "Analysing your live business data..."
                  : executiveSummary || "Generate an AI analysis to see the executive summary for your business."}
              </p>
              {criticalActions.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {criticalActions.map((action, i) => (
                    <span key={i} style={{
                      backgroundColor: "rgba(255,255,255,0.15)", fontSize: "12px",
                      padding: "3px 10px", borderRadius: "12px",
                    }}>
                      {action}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
            {overallScore !== undefined && (
              <div style={{
                backgroundColor: overallScore >= 75 ? "#d1fae5" : overallScore >= 50 ? "#fef3c7" : "#fee2e2",
                color: overallScore >= 75 ? "#065f46" : overallScore >= 50 ? "#92400e" : "#991b1b",
                padding: "6px 14px", borderRadius: "20px",
                fontSize: "13px", fontWeight: "700",
              }}>
                Health Score: {overallScore}/100 ({liveScores.length}/{HEALTH_DATA.length} categories scored)
              </div>
            )}
            {cachedAt && (
              <span style={{
                backgroundColor: "#f0f9ff", color: "#065f46",
                padding: "4px 12px", borderRadius: "20px",
                fontSize: "11px", fontWeight: "600",
              }}>
                Updated {getFormattedCacheTime()}
              </span>
            )}
          </div>
        </div>

        {/* ---- Error State ---- */}
        {error && (
          <div style={{
            margin: "0 20px 20px", padding: "14px 20px",
            backgroundColor: "#fee2e2", borderRadius: "8px",
            border: "1px solid #fca5a5", color: "#991b1b",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "14px" }}>⚠️ {error}</span>
            <button
              onClick={() => generateAnalysis(true)}
              style={{
                padding: "6px 14px", backgroundColor: "#dc2626", color: "white",
                border: "none", borderRadius: "6px", cursor: "pointer",
                fontSize: "13px", fontWeight: "600",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ---- Health Assessment Table ---- */}
        <div style={{
          backgroundColor: "#fdfcfb", borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(93,64,55,0.1)",
          overflowX: "auto", border: "1px solid #e8ddd4", margin: "0 20px",
        }}>
          <div style={{
            minWidth: "790px", display: "grid",
            gridTemplateColumns: "minmax(190px,1.2fr) minmax(140px,.8fr) minmax(100px,.65fr) minmax(360px,2fr)",
            backgroundColor: "#5d4037", color: "#fdfcfb",
            fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px",
          }}>
            {["Category", "Health Status", "Risk Level", "Actions"].map((label) => (
              <div key={label} style={{ padding: "15px 18px" }}>{label}</div>
            ))}
          </div>

          {HEALTH_DATA.map((row, index) => {
            const live = inputs?.[row.key];
            const displayStatus = live?.status || null;
            const displayRisk = live?.riskLevel || null;

            return (
              <div
                key={row.key}
                style={{
                  borderBottom: index < HEALTH_DATA.length - 1 ? "1px solid #e8ddd4" : "none",
                  backgroundColor: index % 2 === 0 ? "#fdfcfb" : "#f7f3f0",
                  minWidth: "790px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "minmax(190px,1.2fr) minmax(140px,.8fr) minmax(100px,.65fr) minmax(360px,2fr)" }}>
                  <div style={{
                    padding: "18px", borderRight: "1px solid #e8ddd4",
                    fontWeight: "700", color: "#5d4037", fontSize: "14px",
                    display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px",
                  }}>
                    {row.category}
                    <span style={{ fontWeight: 400, color: "#8a7a74", fontSize: "11px" }}>
                      {row.metrics.length} areas assessed
                    </span>
                  </div>

                  <div style={{
                    padding: "18px", borderRight: "1px solid #e8ddd4",
                    display: "flex", alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={statusDotStyle(displayStatus)} />
                      <div>
                        <strong style={{ color: "#4a352f", fontSize: "13px", textTransform: "capitalize" }}>
                          {displayStatus || "Pending"}
                        </strong>
                        <div style={{ fontSize: "11px", color: "#8a7a74" }}>
                          {Number.isFinite(live?.score) ? `${live.score}/100` : live?.analysisOnly ? "Narrative only" : "No score"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: "18px", borderRight: "1px solid #e8ddd4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      ...(riskBadgeStyles[displayRisk] || { color: "#8a7a74" }),
                      padding: "5px 10px", borderRadius: "12px",
                      fontSize: "11px", fontWeight: "700", textTransform: "capitalize",
                    }}>
                      {displayRisk || "—"}
                    </span>
                  </div>

                  <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                    {[
                      { mode: "sections", label: "Sections assessed", Icon: ClipboardList },
                      { mode: "analysis", label: "AI analysis", Icon: Brain },
                      { mode: "more", label: "More information", Icon: Info },
                      { mode: "notes", label: "Notes / comments", Icon: MessageSquare },
                      ...(row.key === "strategy"
                        ? [{ mode: "strategyPlan", label: "Detailed strategy & execution plan", Icon: Route }]
                        : []),
                    ].map(({ mode, label, Icon }) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => openDetailModal(row, mode)}
                        title={label}
                        aria-label={label}
                        style={{
                          position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: "36px", height: "36px", border: "1px solid #d8c8b9", borderRadius: "6px",
                          padding: "7px", background: mode === "analysis" ? "#7d5a50" : "#fff",
                          color: mode === "analysis" ? "#fff" : "#5d4037",
                          cursor: "pointer",
                        }}
                      >
                        <Icon size={17} aria-hidden="true" />
                        {mode === "notes" && healthNotes[row.key]?.trim() && (
                          <span aria-hidden="true" style={{
                            position: "absolute", top: "4px", right: "4px",
                            width: "6px", height: "6px", borderRadius: "50%", background: "#b91c1c",
                          }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {detailModal && (() => {
          const row = HEALTH_DATA.find((item) => item.key === detailModal.key);
          if (!row) return null;
          const live = inputs?.[row.key];
          const ai = aiResults?.categories?.[row.key];
          const titleByMode = {
            sections: "Sections assessed",
            analysis: "AI analysis",
            more: "More information",
            notes: "Notes / comments",
            strategyPlan: "Detailed strategy & execution plan",
          };
          return (
            <div
              role="presentation"
              onMouseDown={(event) => { if (event.target === event.currentTarget) setDetailModal(null); }}
              style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(35,25,20,.58)", display: "flex", justifyContent: "center", alignItems: "center", padding: "18px" }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="health-detail-title"
                style={{ width: "min(900px, 100%)", maxHeight: "90vh", overflowY: "auto", background: "#fdfcfb", borderRadius: "12px", boxShadow: "0 18px 60px rgba(0,0,0,.25)" }}
              >
                <header style={{ position: "sticky", top: 0, zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", padding: "18px 22px", background: "#5d4037", color: "#fff", borderRadius: "12px 12px 0 0" }}>
                  <div>
                    <h2 id="health-detail-title" style={{ margin: 0, fontSize: "19px" }}>{row.category} · {titleByMode[detailModal.mode]}</h2>
                    <p style={{ margin: "5px 0 0", color: "#e8ddd4", fontSize: "12px" }}>{companyContext.companyName || viewingSMEName || "Company"}</p>
                  </div>
                  <button type="button" onClick={() => setDetailModal(null)} aria-label="Close details" style={{ border: 0, color: "#fff", background: "transparent", fontSize: "25px", cursor: "pointer", lineHeight: 1 }}>×</button>
                </header>

                <div style={{ padding: "20px 22px" }}>
                  {detailModal.mode === "sections" && (
                    <SectionBreakdown metrics={row.metrics} live={live} aiSections={ai?.sections || {}} />
                  )}

                  {detailModal.mode === "strategyPlan" && (
                    Array.isArray(aiResults?.strategyExecutionPlan) && aiResults.strategyExecutionPlan.length > 0 ? (
                      <div>
                        <p style={{ marginTop: 0, color: "#7d5a50", fontSize: "13px", lineHeight: 1.5 }}>
                          Evidence-based actions aligned to {companyContext.companyName || "the company"}’s stated mission and recorded milestones.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                          {aiResults.strategyExecutionPlan.map((item, index) => (
                            <article key={`${item.objective}-${index}`} style={{ padding: "15px", background: "#f7f3f0", border: "1px solid #e8ddd4", borderRadius: "8px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
                                <strong style={{ color: "#4a352f" }}>{item.objective}</strong>
                                <span style={{ padding: "3px 8px", borderRadius: "10px", background: item.priority === "high" ? "#fee2e2" : item.priority === "medium" ? "#fef3c7" : "#d1fae5", color: "#5d4037", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>{item.priority}</span>
                              </div>
                              <ol style={{ paddingLeft: "20px", margin: "12px 0", color: "#4a352f", fontSize: "12px", lineHeight: 1.6 }}>
                                {item.actions.map((action, actionIndex) => <li key={actionIndex}>{action}</li>)}
                              </ol>
                              <p style={{ margin: "5px 0", color: "#5d4037", fontSize: "12px" }}><strong>Owner:</strong> {item.owner}</p>
                              <p style={{ margin: "5px 0", color: "#5d4037", fontSize: "12px" }}><strong>Due:</strong> {item.dueDate}</p>
                              <p style={{ margin: "5px 0 0", color: "#5d4037", fontSize: "12px" }}><strong>Success measure:</strong> {item.successMeasure}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: "#7d5a50" }}>No strategy and execution plan is available yet. Generate or regenerate the health report to create one.</p>
                    )
                  )}

                  {detailModal.mode === "analysis" && (
                    <div>
                      {categoryLoading[row.key] || globalLoading ? (
                        <p style={{ color: "#7d5a50" }}>AI analysis is being generated…</p>
                      ) : ai ? (
                        <>
                          <p style={{ color: "#4a352f", fontSize: "14px", lineHeight: 1.7 }}>{ai.summary}</p>
                          <h3 style={{ color: "#2e7d32", fontSize: "14px" }}>What is working</h3>
                          {ai.keyInsights?.filter((insight) => insight.type === "positive").map((insight, index) => <p key={index} style={{ color: "#276749", fontSize: "13px" }}>✓ {insight.message}</p>)}
                          <h3 style={{ color: "#9a3412", fontSize: "14px" }}>Risks, gaps and improvement areas</h3>
                          {ai.keyInsights?.filter((insight) => insight.type !== "positive").map((insight, index) => <p key={index} style={{ color: insight.type === "critical" ? "#b91c1c" : "#92400e", fontSize: "13px" }}>{insight.type === "critical" ? "!" : "•"} {insight.message}</p>)}
                          {!ai.keyInsights?.length && <p style={{ color: "#7d5a50", fontSize: "13px" }}>No separate strengths or risks were returned for this category.</p>}
                          <div style={{ padding: "12px", marginTop: "14px", background: "#fef3c7", borderRadius: "6px", color: "#78350f", fontSize: "13px" }}><strong>Recommended next step: </strong>{ai.topRecommendation}</div>
                        </>
                      ) : (
                        <p style={{ color: "#7d5a50" }}>No AI narrative is available yet. Generate or regenerate the health report to add an evidence-based explanation.</p>
                      )}
                    </div>
                  )}

                  {detailModal.mode === "more" && (
                    <div>
                      <p style={{ marginTop: 0, color: "#4a352f", lineHeight: 1.6 }}>
                        {live?.facts?.scoringMethod || "Scores are computed from the connected business records shown below. Missing data is not treated as a positive result."}
                      </p>
                      <h3 style={{ color: "#5d4037", fontSize: "14px" }}>Evidence and source data</h3>
                      {live?.facts ? (
                        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: "14px", background: "#f7f3f0", borderRadius: "6px", color: "#4a352f", fontSize: "12px", lineHeight: 1.6 }}>{JSON.stringify(live.facts, null, 2)}</pre>
                      ) : <p style={{ color: "#7d5a50" }}>No live source records are connected for this category.</p>}
                      {live?.gaps?.length > 0 && (
                        <>
                          <h3 style={{ color: "#9a3412", fontSize: "14px" }}>Data gaps / negatives to address</h3>
                          <ul style={{ color: "#7c2d12", fontSize: "13px", lineHeight: 1.7 }}>{live.gaps.map((gap, index) => <li key={index}>{gap}</li>)}</ul>
                        </>
                      )}
                    </div>
                  )}

                  {detailModal.mode === "notes" && (
                    <div>
                      <p style={{ marginTop: 0, color: "#7d5a50", fontSize: "13px" }}>Record follow-up context, decisions, or comments for this health area.</p>
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        readOnly={isInvestorView}
                        rows={8}
                        placeholder={isInvestorView ? "Notes are read-only in this view." : "Add a note or comment…"}
                        style={{ width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #d8c8b9", borderRadius: "6px", resize: "vertical", color: "#4a352f", background: isInvestorView ? "#f3efeb" : "#fff" }}
                      />
                      {!isInvestorView && (
                        <button type="button" onClick={saveHealthNote} disabled={savingNote} style={{ marginTop: "10px", padding: "9px 14px", background: "#7d5a50", color: "#fff", border: 0, borderRadius: "6px", fontWeight: 700, cursor: savingNote ? "wait" : "pointer" }}>
                          {savingNote ? "Saving…" : "Save note"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          );
        })()}

        {/* ---- Action Buttons ---- */}
        <div style={{
          marginTop: "30px", display: "flex",
          justifyContent: "center", gap: "15px",
          flexWrap: "wrap", padding: "0 20px",
        }}>
          <button
            onClick={() => generateAnalysis(true)}
            disabled={globalLoading}
            style={{
              padding: "12px 24px", backgroundColor: globalLoading ? "#a58a82" : "#7d5a50",
              color: "#fdfcfb", fontWeight: "600", fontSize: "14px",
              borderRadius: "6px", border: "none",
              cursor: globalLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {globalLoading ? "Generating..." : "Regenerate AI Health Report"}
          </button>

          <button
            style={{
              padding: "12px 24px", backgroundColor: "#e8ddd4", color: "#5d4037",
              fontWeight: "600", fontSize: "14px", borderRadius: "6px",
              border: "1px solid #d4c4b0", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Analysis
          </button>
        </div>

        {/* ---- Legend ---- */}
        <div style={{
          marginTop: "30px", padding: "20px", backgroundColor: "#fdfcfb",
          borderRadius: "8px", border: "1px solid #e8ddd4", margin: "30px 20px 0",
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>
            Status Legend
          </h3>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { color: "#16a34a", label: "Healthy — score 75+, good performance, minimal risk" },
              { color: "#f59e0b", label: "Watch — score 50–74, requires monitoring, some risk" },
              { color: "#dc2626", label: "Risk — score below 50, immediate attention required" },
              { color: "#94a3b8", label: "Pending — not connected to live data yet" },
            ].map(({ color, label }) => (
              <div key={color} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: color }} />
                <span style={{ fontSize: "13px", color: "#4a352f" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default OverallCompanyHealth;