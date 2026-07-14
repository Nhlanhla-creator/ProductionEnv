"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CheckCircle,
  TrendingUp,
  XCircle,
  Info,
} from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFirebaseFunctions } from "./hooks";
import { useSolvencyScore } from '../hooks/useSolvencyScore';
import { normalizeSolvencyScore } from '../MyGrowthTools/financial/data_utils/solvencyScoreUtils';

const GRANT_KEYWORDS  = ["grant", "grants"];
const DEBT_KEYWORDS   = ["debt", "loan"];
const PO_KEYWORDS     = ["purchase_order", "purchaseorder", "po", "supply_chain", "supplychain"];
const EQUITY_KEYWORDS = [
  "equity", "convertible", "hybrid", "revenue-based", "revenue_based",
  "secondary", "special",
];
const ESD_FUNDER_KEYWORDS = [
  "grant / non-profit", "grant/non-profit", "development_finance",
  "development finance", "incubator",
];

function detectFundingTier(profileData) {
  console.log("🔍 detectFundingTier called with profileData:", profileData?.useOfFunds);
  
  const instruments = (profileData?.useOfFunds?.fundingInstruments || [])
    .map((s) => s.toLowerCase().replace(/[\s-]/g, "_"));
  console.log("📋 Instruments:", instruments);

  const funderTypes = (profileData?.useOfFunds?.funderTypes || [])
    .map((s) => s.toLowerCase());
  console.log("📋 Funder types:", funderTypes);

  const supportFocus = profileData?.useOfFunds?.additionalSupportFocus || "";
  const amountStr    = profileData?.useOfFunds?.amountRequested || "";
  const amountNum    = parseInt(amountStr.replace(/[^\d]/g, ""), 10) || 0;
  console.log("💰 Amount:", amountNum);

  const hasPO     = instruments.some((i) => PO_KEYWORDS.some((k) => i.includes(k)));
  const hasDebt   = instruments.some((i) => DEBT_KEYWORDS.some((k) => i.includes(k)));
  const hasGrant  = instruments.some((i) => GRANT_KEYWORDS.some((k) => i.includes(k)));
  const hasEquity = instruments.some((i) => EQUITY_KEYWORDS.some((k) => i.includes(k)));
  console.log("🏷️ Has PO:", hasPO, "Has Debt:", hasDebt, "Has Grant:", hasGrant, "Has Equity:", hasEquity);

  const hasESDFunder    = funderTypes.some((f) => ESD_FUNDER_KEYWORDS.some((k) => f.includes(k)));
  const hasSupportFocus = !!supportFocus;
  const isLargeAmount   = amountNum > 10_000_000;
  console.log("🎯 ESD Funder:", hasESDFunder, "Support Focus:", hasSupportFocus, "Large Amount:", isLargeAmount);

  if (!instruments.length && !hasSupportFocus) {
    console.log("❌ No instruments or support focus - returning null");
    return null;
  }

  let tier = null;
  if (hasEquity || isLargeAmount) {
    tier = "D";
  } else if (hasPO || hasDebt) {
    tier = "B";
  } else if (hasESDFunder || hasSupportFocus) {
    tier = "C";
  } else if (hasGrant || instruments.length > 0) {
    tier = "A";
  }
  console.log("✅ Detected tier:", tier);
  return tier;
}

const TIER_LABELS = {
  A: "Grant",
  B: "Purchase Order / Debt",
  C: "ESD / Support Programme / Accelerator",
  D: "Full Fundability (Serious Funding)",
};

const TIER_BADGE_COLORS = {
  A: { bg: "#e8f5e9", border: "#4CAF50", text: "#1B5E20" },
  B: { bg: "#e3f2fd", border: "#1976d2", text: "#0d47a1" },
  C: { bg: "#fff8e1", border: "#f9a825", text: "#e65100" },
  D: { bg: "#fce4ec", border: "#c62828", text: "#b71c1c" },
};
function computeGrowthPotentialScore(growthPotentialData) {
  if (!growthPotentialData) return { score: 0, yesCount: 0, totalFactors: 8, factors: [] };

  const factors = [
    { key: "marketShare", label: "Market share growth" },
    { key: "qualityImprovement", label: "Quality / price improvement" },
    { key: "greenTech", label: "Green technology / resource efficiency" },
    { key: "localisation", label: "Localisation of production" },
    { key: "regionalSpread", label: "Regional / rural spread" },
    { key: "personalRisk", label: "Personal financial contribution" },
    { key: "empowerment", label: "B-BBEE empowerment level 3+" },
    { key: "employment", label: "Job creation" },
  ];

  const yesFactors = factors.filter((f) => growthPotentialData[f.key] === "yes");
  const yesCount = yesFactors.length;
  const score = Math.round(((yesCount / factors.length) * 5) * 10) / 10;

  return { score, yesCount, totalFactors: factors.length, factors: yesFactors.map((f) => f.label) };
}

function getFundabilitySubWeights(tier) {
  if (!tier) return null;

  switch (tier) {
    case "A":
      return {
        businessPlan      : 21,
        pitchDeck         : 17,
        impactMandate     : 34,
        creditworthiness  : 13,
        guarantees        : 0,
        financialResilience: 0,
        growthPotential   : 15,
        _excluded: {
          guarantees        : "Non-repayable funding — collateral security is not required.",
          financialResilience: "Financial resilience metrics are not assessed at grant level.",
        },
        _reduced: {
          creditworthiness: "Reduced weight — credit discipline is noted but is not a primary grant criterion.",
        },
      };

    case "B":
      return {
        businessPlan      : 18,
        pitchDeck         : 9,
        impactMandate     : 9,
        creditworthiness  : 27,
        guarantees        : 27,
        financialResilience: 0,
        growthPotential   : 10,
        _excluded: {},
        _reduced: {
          pitchDeck    : "Reduced — pitch readiness is secondary to credit strength and collateral for PO/debt finance.",
          impactMandate: "Reduced — social impact is a secondary consideration for purchase-order or debt finance.",
        },
      };

    case "C":
      return {
        businessPlan      : 21,
        pitchDeck         : 17,
        impactMandate     : 34,
        creditworthiness  : 13,
        guarantees        : 0,
        financialResilience: 0,
        growthPotential   : 15,
        _excluded: {
          guarantees        : "ESD / support programmes do not require collateral from applicants.",
          financialResilience: "Financial resilience is not assessed for accelerator or ESD programmes.",
        },
        _reduced: {
          creditworthiness: "Reduced — some ESD programmes note credit history but it is not a primary requirement.",
        },
      };

    case "D":
      return {
        businessPlan      : 18,
        pitchDeck         : 9,
        impactMandate     : 9,
        creditworthiness  : 23,
        guarantees        : 13,
        financialResilience: 18,
        growthPotential   : 10,
        _excluded: {},
        _reduced: {
          pitchDeck    : "Reduced — investor communications matter but fundamentals dominate at serious ticket sizes.",
          impactMandate: "Reduced — ESG / impact is a qualifier, not the primary investment criterion.",
        },
      };

    default:
      return null;
  }
}

export function FundabilityScoreCard({
  styles = {},
  profileData,
  onScoreUpdate,
  apiKey,
}) {
  const [showModal, setShowModal]                   = useState(false);
  const [fundabilityScore, setFundabilityScore]     = useState(0);
  const [scoreBreakdown, setScoreBreakdown]         = useState([]);
  const [aiEvaluationResult, setAiEvaluationResult] = useState("");
  const [isEvaluating, setIsEvaluating]             = useState(false);
  const [evaluationError, setEvaluationError]       = useState("");
  const [showAboutScore, setShowAboutScore]         = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [confidenceScores, setConfidenceScores]     = useState({});
  const [evidenceMap, setEvidenceMap]               = useState({});
  const [confRationaleMap, setConfRationaleMap]     = useState({});

  const [businessPlanAnalysis, setBusinessPlanAnalysis]             = useState(null);
  const [pitchDeckAnalysis, setPitchDeckAnalysis]                   = useState(null);
  const [creditReportAnalysis, setCreditReportAnalysis]             = useState(null);
  const [guaranteesAnalysis, setGuaranteesAnalysis]                 = useState(null);
  const [financialResilienceAnalysis, setFinancialResilienceAnalysis] = useState(null);
  const [isFundingDataLoaded, setIsFundingDataLoaded]               = useState(false);

  const [hasAppliedForFunding, setHasAppliedForFunding] = useState(false);
  const [fundingTier, setFundingTier]                   = useState(null);
  const [fundingCheckComplete, setFundingCheckComplete] = useState(false);
  const [isReevaluating, setIsReevaluating]             = useState(false);
  const [triggeredByAuto, setTriggeredByAuto]           = useState(false);
  const [evaluationTimestamp, setEvaluationTimestamp]   = useState(null);

  const hasReevaluated          = useRef(false);
  const isReevaluatingRef       = useRef(false);
  const fundingCheckCompleteRef = useRef(false);
  const isFundingDataLoadedRef  = useRef(false);

  const dataLoadPromiseRef = useRef(null);

  const isEvaluatingRef        = useRef(false);
  const hasAppliedForFundingRef = useRef(false);
  const fundingTierRef         = useRef(null);
  const profileDataRef         = useRef(profileData);
  const runAiEvaluationRef     = useRef(null);
const [showAboutFinancialStrength, setShowAboutFinancialStrength] = useState(false);

const FINANCIAL_STRENGTH_ROWS = [
    { name: "Revenue & Profitability", weight: "30%", why: "Turnover, gross/operating/net margins, and revenue trend over the last 12 months" },
    { name: "Financial Records & Governance", weight: "25%", why: "Financial statements availability/years, audited vs internally prepared, management accounts, bookkeeping status" },
    { name: "Balance Sheet Strength", weight: "20%", why: "Assets, liabilities, and equity position (current vs. prior year)" },
    { name: "Debt & Liability Position", weight: "15%", why: "Existing debt, overdraft utilisation, director surety, factored debtors" },
    { name: "Credit History", weight: "10%", why: "Presence and quality of an on-file credit report" },
  ];
  const { 
    loadLatestSolvencyScore, 
    solvencyScore,
    solvencyScoreBreakdown 
  } = useSolvencyScore(auth?.currentUser);

  const [solvencyAnalysis, setSolvencyAnalysis] = useState(null);

  const isSavingEvaluation = useRef(false);
  const { callFunction } = useFirebaseFunctions();

  useEffect(() => {
    console.log("🔄 Setting funding tier from profileData");
    const tier = detectFundingTier(profileData);
    console.log("🔄 Detected tier:", tier);
    setFundingTier(tier);
  }, [profileData]);

  useEffect(() => { isEvaluatingRef.current = isEvaluating; });
  useEffect(() => { hasAppliedForFundingRef.current = hasAppliedForFunding; });
  useEffect(() => { fundingTierRef.current = fundingTier; });
  useEffect(() => { profileDataRef.current = profileData; });

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);

  const checkFundingApplicationStatus = useCallback(async () => {
    console.log("🔍 checkFundingApplicationStatus called");
    if (!auth?.currentUser?.uid || fundingCheckComplete) {
      console.log("⏭️ Skipping - no user or already complete");
      return;
    }
    try {
      const userId        = auth.currentUser.uid;
      console.log("👤 User ID:", userId);
      const universalSnap = await getDoc(doc(db, "universalProfiles", userId));

      if (universalSnap.exists()) {
        const data              = universalSnap.data();
        const completedSections = data.completedSections || {};

        const requiredFundingSections = [
          "applicationOverview", "useOfFunds", "enterpriseReadiness",
          "guarantees", "growthPotential", "socialImpact",
          "documentUpload", "declarationCommitment",
        ];

        const fundingApplied =
          requiredFundingSections.every((s) => completedSections[s] === true) ||
          data.applicationSubmitted === true;

        console.log("📋 Funding applied:", fundingApplied);
        console.log("📋 Completed sections:", completedSections);
        setHasAppliedForFunding(fundingApplied);

        if (fundingApplied) {
          console.log("✅ Funding applied - fetching application data");
          await fetchFundingApplicationData();
        } else {
          console.log("❌ No funding application - marking data loaded");
          setIsFundingDataLoaded(true);
          isFundingDataLoadedRef.current = true;
        }

        setFundingCheckComplete(true);
        fundingCheckCompleteRef.current = true;
      } else {
        console.log("❌ No universal profile found");
        setFundingCheckComplete(true);
        fundingCheckCompleteRef.current = true;
        setIsFundingDataLoaded(true);
        isFundingDataLoadedRef.current = true;
      }
    } catch (err) {
      console.error("❌ Error checking funding application status:", err);
      setFundingCheckComplete(true);
      fundingCheckCompleteRef.current = true;
      setIsFundingDataLoaded(true);
      isFundingDataLoadedRef.current = true;
    }
  }, [auth?.currentUser?.uid, fundingCheckComplete]);

  useEffect(() => {
    if (auth?.currentUser?.uid) {
      console.log("🔄 Running funding check on mount");
      checkFundingApplicationStatus();
    }
  }, [auth?.currentUser?.uid, checkFundingApplicationStatus]);

  const [dataLoadedAt, setDataLoadedAt] = useState(null);

  const fetchFundingApplicationData = useCallback(async () => {
    console.log("📥 fetchFundingApplicationData called");
    if (dataLoadPromiseRef.current) {
      console.log("⏳ Using existing data load promise");
      return dataLoadPromiseRef.current;
    }

    const loadPromise = (async () => {
      const userId = auth.currentUser.uid;
      console.log("👤 Fetching data for user:", userId);
      let loadedCount = 0;

      const fresh = {
        businessPlanAnalysis: null,
        pitchDeckAnalysis: null,
        creditReportAnalysis: null,
        guaranteesAnalysis: null,
        financialResilienceAnalysis: null,
        solvencyAnalysis: null,
      };

      try {
        console.log("📊 Fetching business plan analysis...");
        const snap = await getDocs(query(collection(db, "aiEvaluations"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content  = d?.evaluation?.content || "";
          const rawScore = d?.evaluation?.score || 0;
          const score = Math.round(rawScore);
          const isValid  = score > 0 && content.trim().length > 0;
          fresh.businessPlanAnalysis = { score, rawScore, content, isValid };
          setBusinessPlanAnalysis(fresh.businessPlanAnalysis);
          if (isValid) {
            loadedCount++;
            console.log("✅ Business plan loaded, score:", score);
          }
        } else {
          console.log("⚠️ No business plan evaluation found");
        }
      } catch (e) { console.error("❌ BP load error:", e); }

      try {
        console.log("📊 Fetching pitch deck analysis...");
        const snap = await getDocs(query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content          = d?.evaluation?.content          || "";
          const score            = d?.evaluation?.score            || 0;
          const operationalScore = d?.evaluation?.operationalScore || 0;
          const isValid = score > 0 && content.trim().length > 0;
          fresh.pitchDeckAnalysis = { score, operationalScore, content, isValid };
          setPitchDeckAnalysis(fresh.pitchDeckAnalysis);
          if (isValid) {
            loadedCount++;
            console.log("✅ Pitch deck loaded, score:", score);
          }
        } else {
          console.log("⚠️ No pitch deck evaluation found");
        }
      } catch (e) { console.error("❌ PD load error:", e); }

      try {
        console.log("📊 Fetching credit report analysis...");
        const snap = await getDocs(query(collection(db, "creditAnalyses"), where("userId", "==", userId)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          const content       = d?.evaluation?.content       || "";
          const score = d?.evaluation?.analysisResult?.creditScore 
            ?? d?.evaluation?.score 
            ?? 0;

          const label = d?.evaluation?.analysisResult?.creditRating 
            ?? d?.evaluation?.label 
            ?? "";
          const isCreditReport = d?.evaluation?.analysisResult?.isCreditReport 
            ?? d?.evaluation?.isCreditReport 
            ?? d?.isCreditReport 
            ?? false;

          const isValid = isCreditReport === true && score > 0 && content.trim().length > 0;
          fresh.creditReportAnalysis = { score, content, label, isCreditReport, isValid };
          setCreditReportAnalysis(fresh.creditReportAnalysis);
          if (isValid) {
            loadedCount++;
            console.log("✅ Credit report loaded, score:", score);
          }
        } else {
          console.log("⚠️ No credit report analysis found");
        }
      } catch (e) { console.error("❌ CR load error:", e); }

    try {
  console.log("📊 Fetching guarantees...");
  const profSnap = await getDoc(doc(db, "universalProfiles", userId));
  if (profSnap.exists()) {
    const profData = profSnap.data();
    // Handle new securityInstruments format
    const securityInstruments = profData?.guarantees?.securityInstruments || [];
    console.log("📋 Security instruments found:", securityInstruments.length);
    
    // Count active security instruments with documents
    const activeInstruments = securityInstruments.filter(item => 
      item.instrument || item.instrumentOther || (item.files && item.files.length > 0)
    );
    
    // Calculate score based on number and quality of instruments
    let score = 0;
    let signedCount = 0;
    let currentCount = 0;
    let withValue = 0;
    
    if (activeInstruments.length > 0) {
      // Base score: 1 point per instrument, max 5
      score = Math.min(activeInstruments.length, 5);
      
      // Bonus points for signed and current instruments
      signedCount = activeInstruments.filter(i => i.isSigned === "yes").length;
      currentCount = activeInstruments.filter(i => i.isCurrent === "yes").length;
      withValue = activeInstruments.filter(i => i.value && parseFloat(i.value.replace(/[^\d.]/g, '')) > 0).length;
      
      // Add up to 2 bonus points for quality
      let bonus = 0;
      if (signedCount >= 2) bonus += 1;
      if (currentCount >= 2) bonus += 0.5;
      if (withValue >= 2) bonus += 0.5;
      
      score = Math.min(score + Math.round(bonus), 5);
    }
    
    fresh.guaranteesAnalysis = {
      activeCount: activeInstruments.length,
      totalCount: securityInstruments.length,
      items: activeInstruments.map(i => i.instrument || i.instrumentOther || "Unnamed instrument"),
      signedCount,
      currentCount,
      withValue,
      score: score,
    };
    setGuaranteesAnalysis(fresh.guaranteesAnalysis);
    if (activeInstruments.length > 0) {
      loadedCount++;
      console.log("✅ Guarantees loaded:", activeInstruments.length, "score:", score);
    }
  } else {
    console.log("⚠️ No universal profile found for guarantees");
  }
} catch (e) { console.error("❌ Guarantees load error:", e); }


      try {
        console.log("📊 Fetching financial resilience...");
        const snap = await getDoc(doc(db, "aiFinancialEvaluations", userId));
        if (snap.exists()) {
          const d = snap.data();
          const resScore = d?.evaluation?.resilienceScore || d?.evaluation?.score || 0;
          fresh.financialResilienceAnalysis = { score: resScore, content: d?.evaluation?.summary || d?.evaluation?.content || "" };
          setFinancialResilienceAnalysis(fresh.financialResilienceAnalysis);
          if (resScore > 0) {
            loadedCount++;
            console.log("✅ Financial resilience loaded, score:", resScore);
          }
        } else {
          console.log("⚠️ No financial resilience evaluation found");
        }
      } catch (e) { console.error("❌ FR load error:", e); }

      try {
        console.log("📊 Fetching solvency score...");
        const solvencyData = await loadLatestSolvencyScore();
        if (solvencyData && solvencyData.rawMetrics) {
          const rawMetrics = solvencyData.rawMetrics;
          const nav = parseFloat(rawMetrics.nav) || 0;
          const equityRatio = parseFloat(rawMetrics.equityRatio) || 0;
          const debtToEquity = parseFloat(rawMetrics.debtToEquity) || 0;
          const debtToAssets = parseFloat(rawMetrics.debtToAssets) || 0;
          const interestCoverage = parseFloat(rawMetrics.interestCoverage) || 0;

          let navScore = 0;
          if (nav > 100) navScore = 100;
          else if (nav > 50) navScore = 90;
          else if (nav > 10) navScore = 80;
          else if (nav > 1) navScore = 60;
          else if (nav > 0) navScore = nav * 50;
          else navScore = 0;

          let equityScore = 0;
          if (equityRatio >= 70) equityScore = 95;
          else if (equityRatio >= 60) equityScore = 85;
          else if (equityRatio >= 50) equityScore = 75;
          else if (equityRatio >= 40) equityScore = 55;
          else if (equityRatio >= 30) equityScore = 35;
          else equityScore = Math.max(0, equityRatio);

          let dteScore = 0;
          const deviation = Math.abs(debtToEquity - 1.0);
          if (deviation <= 0.3) dteScore = 90;
          else if (deviation <= 0.6) dteScore = 75;
          else if (deviation <= 1.0) dteScore = 55;
          else if (deviation <= 1.5) dteScore = 35;
          else dteScore = Math.max(0, 100 - deviation * 10);

          const calculatedSolvencyScore = Math.round(
            (navScore * 0.4) + (equityScore * 0.35) + (dteScore * 0.25)
          );

          const normalizedScore = normalizeSolvencyScore(calculatedSolvencyScore);

          fresh.solvencyAnalysis = {
            score: calculatedSolvencyScore,
            normalizedScore,
            nav, equityRatio, debtToEquity, debtToAssets, interestCoverage,
            timestamp: solvencyData.timestamp,
            rawMetrics,
            isValid: calculatedSolvencyScore > 0,
          };
          setSolvencyAnalysis(fresh.solvencyAnalysis);
          if (calculatedSolvencyScore > 0) {
            loadedCount++;
            console.log("✅ Solvency loaded, score:", calculatedSolvencyScore);
          }
        } else {
          console.log("⚠️ No solvency data found");
          fresh.solvencyAnalysis = { score: 0, normalizedScore: 0, nav: 0, equityRatio: 0, debtToEquity: 0, debtToAssets: 0, interestCoverage: 0, isValid: false };
          setSolvencyAnalysis(fresh.solvencyAnalysis);
        }
      } catch (e) {
        console.error("❌ Solvency load error:", e);
        fresh.solvencyAnalysis = { score: 0, normalizedScore: 0, nav: 0, equityRatio: 0, debtToEquity: 0, debtToAssets: 0, interestCoverage: 0, isValid: false };
        setSolvencyAnalysis(fresh.solvencyAnalysis);
      }

      const isLoaded = loadedCount > 0;
      console.log(`📊 Total loaded items: ${loadedCount}, isLoaded: ${isLoaded}`);
      setIsFundingDataLoaded(isLoaded);
      isFundingDataLoadedRef.current = isLoaded;
      setDataLoadedAt(Date.now());

      return { isLoaded, ...fresh };
    })();

    dataLoadPromiseRef.current = loadPromise;

    try {
      return await loadPromise;
    } catch (error) {
      console.error("❌ Error fetching funding application data:", error);
      setIsFundingDataLoaded(false);
      isFundingDataLoadedRef.current = false;
      throw error;
    } finally {
      dataLoadPromiseRef.current = null;
    }
  }, [auth?.currentUser?.uid]);

  useEffect(() => {
    console.log("🔄 Auto re-evaluation effect triggered");
    console.log("📋 hasAppliedForFunding:", hasAppliedForFunding);
    console.log("📋 isFundingDataLoaded:", isFundingDataLoaded);
    console.log("📋 aiEvaluationResult:", !!aiEvaluationResult);
    console.log("📋 isEvaluating:", isEvaluating);
    console.log("📋 hasReevaluated:", hasReevaluated.current);
    
    if (!auth?.currentUser?.uid || !apiKey) {
      console.log("⏭️ Skipping - no user or API key");
      return;
    }
    if (isEvaluating || isReevaluatingRef.current || hasReevaluated.current) {
      console.log("⏭️ Skipping - already evaluating or done");
      return;
    }
    if (!hasAppliedForFunding || !isFundingDataLoaded || !aiEvaluationResult) {
      console.log("⏭️ Skipping - prerequisites not met");
      return;
    }

    const checkAndRun = async () => {
      console.log("🚀 Starting auto re-evaluation...");
      try {
        const aiEvalRef = doc(db, "aiFundabilityEvaluations", auth.currentUser.uid);
        const aiSnap    = await getDoc(aiEvalRef);
        if (aiSnap.exists() && aiSnap.data().result && aiSnap.data().includedFundingData === false) {
          console.log("🔄 Found existing evaluation without funding data - re-evaluating");
          hasReevaluated.current    = true;
          isReevaluatingRef.current = true;
          setIsReevaluating(true);
          setEvaluationError("Updating analysis with funding application materials...");
          const result = await runAiEvaluation(auth.currentUser.uid);
          console.log("✅ Re-evaluation complete, result:", !!result);
          if (result) {
            await setDoc(aiEvalRef, { result, timestamp: new Date(), includedFundingData: true, fundingTier }, { merge: true });
            console.log("✅ Saved re-evaluation to Firestore");
            setAiEvaluationResult(result);
            setShowDetailedAnalysis(true);
          }
          setIsReevaluating(false);
          isReevaluatingRef.current = false;
          setEvaluationError("");
        } else {
          console.log("✅ No re-evaluation needed");
          hasReevaluated.current = true;
        }
      } catch (error) {
        console.error("❌ Auto re-evaluation error:", error);
        setIsReevaluating(false);
        isReevaluatingRef.current = false;
        hasReevaluated.current    = true;
        setEvaluationError("");
      }
    };
    checkAndRun();
  }, [hasAppliedForFunding, isFundingDataLoaded, aiEvaluationResult,
      auth?.currentUser?.uid, apiKey, isEvaluating, fundingTier]);

  useEffect(() => {
    console.log("🔄 Score calculation effect triggered");
    console.log("📋 profileData:", !!profileData);
    console.log("📋 aiEvaluationResult:", !!aiEvaluationResult);
    console.log("📋 hasAppliedForFunding:", hasAppliedForFunding);
    console.log("📋 isFundingDataLoaded:", isFundingDataLoaded);
    
    if (profileData && aiEvaluationResult) {
      if (hasAppliedForFunding && !isFundingDataLoaded) {
        console.log("⏭️ Skipping - waiting for funding data");
        return;
      }
      
      console.log("🧮 Calculating fundability score...");
      const result = calculateFundabilityScore(profileData, aiEvaluationResult);
      console.log("📊 Calculated score:", result.totalScore);
      console.log("📊 Breakdown:", result.breakdown);
      
      const aiScores = parseAiEvaluationScores(aiEvaluationResult);
      if (aiScores._confidence)   setConfidenceScores(aiScores._confidence);
      if (aiScores._evidence)     setEvidenceMap(aiScores._evidence);
      if (aiScores._confRationale) setConfRationaleMap(aiScores._confRationale);

      setFundabilityScore(result.totalScore);
      setScoreBreakdown(result.breakdown);
      if (onScoreUpdate) onScoreUpdate(result.totalScore);
      console.log("✅ Score calculation complete");
    } else {
      console.log("⏭️ Skipping - missing profile or AI result");
    }
  }, [profileData, aiEvaluationResult, onScoreUpdate,
    businessPlanAnalysis, pitchDeckAnalysis, creditReportAnalysis,
    guaranteesAnalysis, financialResilienceAnalysis,
    hasAppliedForFunding, isFundingDataLoaded, fundingTier, dataLoadedAt]);


const parseAiEvaluationScores = (text) => {
  const scores = {};
  const confidenceMap = {};
  const evidenceMap = {};
  const confRationaleMap = {};

  if (!text) {
    scores._confidence = confidenceMap;
    scores._evidence = evidenceMap;
    scores._confRationale = confRationaleMap;
    return scores;
  }

  // Strip markdown bold so "**Score:**" and "Score:" match the same pattern
  const normalized = text.replace(/\*\*/g, "").replace(/\r\n/g, "\n");
  const sections = normalized.split(/(?=^#{0,3}\s*\d+\.\s)/m);

  sections.forEach((section) => {
    if (!section.trim()) return;
    const headerMatch = section.match(/^#{0,3}\s*(\d+)\.\s*(.+?)\s*(?:\n|$)/);
    if (!headerMatch) return;

    const sectionNum = parseInt(headerMatch[1], 10);
    const sectionName = headerMatch[2].trim();

    // Try several score formats, most specific first
    const scorePatterns = [
      /Score\s*:?\s*([\d.]+)\s*\/\s*5\b/i,
      /Score\s*:?\s*([\d.]+)\s*out of\s*5/i,
      /Rating\s*:?\s*([\d.]+)\s*\/\s*5\b/i,
      /Score\s*:?\s*([\d.]+)(?!\s*\/\s*\d)\b/i, // bare number, last resort
    ];
    let score = null;
    for (const pattern of scorePatterns) {
      const m = section.match(pattern);
      if (m) { score = parseFloat(m[1]); break; }
    }
    if (score === null || isNaN(score)) score = 0;
    score = Math.min(Math.max(score, 0), 5);

    const evidenceMatch = section.match(/Evidence\s*:?\s*([^\n]+)/i);
    if (evidenceMatch) evidenceMap[sectionName] = evidenceMatch[1].trim();

    const confidenceMatch = section.match(/Confidence\s*:?\s*(High|Medium|Low)\b/i);
    if (confidenceMatch) confidenceMap[sectionName] = confidenceMatch[1];

    const confRatMatch = section.match(/Confidence Rationale\s*:?\s*([^\n]+)/i);
    if (confRatMatch) confRationaleMap[sectionName] = confRatMatch[1].trim();

    // Match by section NUMBER first (robust to header rewording), name as fallback
    let key = null;
    if (sectionNum === 1 || /financial strength/i.test(sectionName)) key = "financialStrength";
    else if (sectionNum === 2 || /impact\s*&?\s*mandate/i.test(sectionName)) key = "impactMandate";
    else if (sectionNum === 3 || /business plan/i.test(sectionName)) key = "businessPlanAnalysis";
    else if (sectionNum === 4 || /pitch/i.test(sectionName)) key = "pitchDeckScore";
    else if (sectionNum === 5 || /creditworthiness/i.test(sectionName)) key = "creditReport";
    else if (sectionNum === 6 || /guarantees/i.test(sectionName)) key = "guarantees";
    else if (sectionNum === 7 || /financial resilience/i.test(sectionName)) key = "financialResilience";

    if (key) scores[key] = Math.round(score * 10) / 10;
  });

  scores._confidence = confidenceMap;
  scores._evidence = evidenceMap;
  scores._confRationale = confRationaleMap;
  return scores;
};

const creditScoreFromRaw = (raw) => {
  if (!raw || raw <= 0) return 0;
  if (raw >= 750) return 5;
  if (raw >= 650) return 4;
  if (raw >= 550) return 3;
  if (raw >= 450) return 2;
  return 1;
};

// Logs (doesn't block) any case where the AI's self-reported number
// drifts from the real Firestore-derived score — for QA/debugging only.
const auditScoreAccuracy = (aiScores) => {
  const mismatches = [];
  if (businessPlanAnalysis?.isValid) {
    const deterministic = Math.round((businessPlanAnalysis.score / 100) * 5 * 10) / 10;
    const aiReported = aiScores.businessPlanAnalysis;
    if (aiReported !== undefined && Math.abs(aiReported - deterministic) > 0.5) {
      mismatches.push({ field: "Business Plan", deterministic, aiReported });
    }
  }
  if (pitchDeckAnalysis?.isValid) {
    const deterministic = Math.round((pitchDeckAnalysis.score / 100) * 5 * 10) / 10;
    const aiReported = aiScores.pitchDeckScore;
    if (aiReported !== undefined && Math.abs(aiReported - deterministic) > 0.5) {
      mismatches.push({ field: "Pitch Deck", deterministic, aiReported });
    }
  }
  if (creditReportAnalysis?.isValid) {
    const deterministic = creditScoreFromRaw(creditReportAnalysis.score);
    const aiReported = aiScores.creditReport;
    if (aiReported !== undefined && Math.abs(aiReported - deterministic) > 0.5) {
      mismatches.push({ field: "Credit Report", deterministic, aiReported });
    }
  }
  if (mismatches.length) {
    console.warn("⚠️ AI self-reported score(s) diverged from Firestore data — deterministic values used instead:", mismatches);
  }
  return mismatches;
};

  const validateFundingScores = (aiScores) => {
    if (!hasAppliedForFunding) return true;
    const fundingKeys = ['businessPlanAnalysis', 'pitchDeckScore', 'creditReport'];
    const missingScores = [];
    fundingKeys.forEach(key => {
      const score = aiScores[key];
      if (score === undefined || score === null || score === 0) {
        missingScores.push(key);
      }
    });
    if (missingScores.length > 0) {
      console.warn(`⚠️ Missing AI scores for: ${missingScores.join(', ')}`);
      return false;
    }
    return true;
  };

  const calculateFundabilityScore = (data, aiEvaluationResult = "") => {
    console.log("🧮 calculateFundabilityScore called");
    const stage = mapStageToCategory(data?.entityOverview?.operationStage || "Not provided");
    const weightings = weightingsByStage[stage];
    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : {};
    const subW = getFundabilitySubWeights(fundingTier);
    console.log("📊 Stage:", stage, "Weightings:", weightings);
    console.log("📊 AI Scores:", aiScores);
    console.log("📊 Sub-weights:", subW);
    
    const overallWeights = {
      financialStrength: hasAppliedForFunding && fundingTier ? 40 : (weightings?.financialStrength || 0),
      fundability: hasAppliedForFunding && fundingTier ? 60 : 0,
    };
    console.log("📊 Overall weights:", overallWeights);
    
    const categoryMappings = [
      { key: "financialStrength", name: "Financial Strength", isCore: true },
    ];
    
   if (hasAppliedForFunding && fundingTier && subW) {
      categoryMappings.push(
        { key: "businessPlanAnalysis", name: "Business Plan / Investment Case", weight: subW.businessPlan, reductionNote: subW._reduced?.businessPlan, isFundability: true },
        { key: "pitchDeckScore", name: "Pitch Readiness / Pitch Deck", weight: subW.pitchDeck, reductionNote: subW._reduced?.pitchDeck, isFundability: true },
        { key: "impactMandate", name: "Impact & Mandate Alignment", weight: subW.impactMandate, reductionNote: subW._reduced?.impactMandate, isFundability: true },
        { key: "creditReport", name: "Creditworthiness", weight: subW.creditworthiness, reductionNote: subW._reduced?.creditworthiness, isFundability: true },
        { key: "guarantees", name: "Guarantees / Collateral", weight: subW.guarantees, isExcluded: subW.guarantees === 0, exclusionNote: subW._excluded?.guarantees, isFundability: true },
        { key: "financialResilience", name: "Financial Resilience & Efficiency", weight: subW.financialResilience, isExcluded: subW.financialResilience === 0, exclusionNote: subW._excluded?.financialResilience, isFundability: true },
        { key: "growthPotential", name: "Growth Potential", weight: subW.growthPotential, isExcluded: subW.growthPotential === 0, exclusionNote: subW._excluded?.growthPotential, isFundability: true }
      );
    } else {
      categoryMappings.push(
        { key: "impactMandate", name: "Impact & Mandate Alignment", isCore: true }
      );
    }
    
    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#D7CCC8", "#4E342E", "#795548", "#5D4037", "#3E2723"];
    const breakdown = [];
    
    // Financial Strength
    {
      const cat = categoryMappings[0];
      const aiScore = aiScores[cat.key] ?? 0;
      const percent = (aiScore / 5) * 100;
      const weight = overallWeights.financialStrength;
      const weightedContribution = (percent / 100) * weight;
      breakdown.push({
        name: cat.name, score: Math.round(percent), weight, weightedScore: Math.round(weightedContribution),
        color: colors[0], rawScore: Math.round(aiScore * 10) / 10, maxScore: 5,
        tier: null, active: true, excluded: false, exclusionNote: null, reductionNote: null,
      });
    }
    
    // Fundability sub-categories
    if (hasAppliedForFunding && fundingTier && subW) {
      const fundabilityWeight = overallWeights.fundability;
      for (let i = 1; i < categoryMappings.length; i++) {
        const cat = categoryMappings[i];
        let rawScore = 0, percent = 0, sourceType = "ai";
        
        if (cat.key === "financialResilience" && solvencyAnalysis?.isValid) {
          rawScore = solvencyAnalysis.normalizedScore || 0;
          percent = (rawScore / 5) * 100;
          sourceType = "solvency";
        } else if (cat.key === "guarantees" && guaranteesAnalysis) {
          rawScore = guaranteesAnalysis.score || 0;
          percent = (rawScore / 5) * 100;
          sourceType = "guarantees";
        } else if (cat.key === "businessPlanAnalysis" && businessPlanAnalysis?.isValid) {
          rawScore = Math.round((businessPlanAnalysis.score / 100) * 5 * 10) / 10;
          percent = (rawScore / 5) * 100;
          sourceType = "firestore-analysis";
        } else if (cat.key === "pitchDeckScore" && pitchDeckAnalysis?.isValid) {
          rawScore = Math.round((pitchDeckAnalysis.score / 100) * 5 * 10) / 10;
          percent = (rawScore / 5) * 100;
          sourceType = "firestore-analysis";
        } else if (cat.key === "creditReport" && creditReportAnalysis?.isValid) {
          rawScore = creditScoreFromRaw(creditReportAnalysis.score);
          percent = (rawScore / 5) * 100;
          sourceType = "firestore-analysis";
        } else if (["businessPlanAnalysis", "pitchDeckScore", "creditReport"].includes(cat.key)) {
          // No document on file in Firestore — force 0 rather than let the AI invent a score
          rawScore = 0;
          percent = 0;
          sourceType = "missing-document";
        } 
        else if (cat.key === "growthPotential") {
          const gp = computeGrowthPotentialScore(profileData?.growthPotential);
          rawScore = gp.score;
          percent = (rawScore / 5) * 100;
          sourceType = "profile";
        } else {
    
          // financialStrength / impactMandate have no deterministic source — AI-derived is expected here
          rawScore = aiScores[cat.key] ?? 0;
          percent = (rawScore / 5) * 100;
        }
        
        const weightWithinBlock = cat.weight || 0;
        const isExcluded = cat.isExcluded || weightWithinBlock === 0;
        const weightedContribution = isExcluded ? 0 : (percent / 100) * (weightWithinBlock / 100) * fundabilityWeight;
        
        breakdown.push({
          name: cat.name, score: isExcluded ? 0 : Math.round(percent),
          weight: weightWithinBlock, weightedScore: Math.round(weightedContribution),
          color: colors[i % colors.length], rawScore: Math.round(rawScore * 10) / 10,
          maxScore: 5, tier: fundingTier, active: !isExcluded && weightWithinBlock > 0,
          excluded: isExcluded, exclusionNote: cat.exclusionNote || null,
          reductionNote: cat.reductionNote || null, source: sourceType,
        });
      }
    } else {
      const cat = categoryMappings[1];
      if (cat) {
        const aiScore = aiScores[cat.key] ?? 0;
        const percent = (aiScore / 5) * 100;
        const weight = weightings[cat.key] || 0;
        const weightedContribution = (percent / 100) * weight;
        breakdown.push({
          name: cat.name, score: Math.round(percent), weight, weightedScore: Math.round(weightedContribution),
          color: colors[1], rawScore: Math.round(aiScore * 10) / 10, maxScore: 5,
          tier: null, active: true, excluded: false, exclusionNote: null, reductionNote: null,
        });
      }
    }
    
    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + (item.weightedScore || 0), 0));
    const finalScore = Math.min(Math.max(isNaN(totalScore) ? 0 : totalScore, 0), 100);
    console.log("📊 Final total score:", finalScore);
    return {
      totalScore: finalScore,
      breakdown,
    };
  };

  const prepareDataForEvaluation = async (data, freshData = null) => {
    console.log("📝 prepareDataForEvaluation called");
    const bpAnalysis = freshData?.businessPlanAnalysis ?? businessPlanAnalysis;
    const pdAnalysis = freshData?.pitchDeckAnalysis ?? pitchDeckAnalysis;
    const crAnalysis = freshData?.creditReportAnalysis ?? creditReportAnalysis;
    const grAnalysis = freshData && "guaranteesAnalysis" in freshData ? freshData.guaranteesAnalysis : guaranteesAnalysis;
    const frAnalysis = freshData?.financialResilienceAnalysis ?? financialResilienceAnalysis;
    const svAnalysis = freshData?.solvencyAnalysis ?? solvencyAnalysis;

    console.log("📊 BP Analysis:", bpAnalysis?.isValid);
    console.log("📊 PD Analysis:", pdAnalysis?.isValid);
    console.log("📊 CR Analysis:", crAnalysis?.isValid);
    console.log("📊 GR Analysis:", grAnalysis?.activeCount);
    console.log("📊 SV Analysis:", svAnalysis?.isValid);

    let out = "";

out += `\n=== FINANCIAL STRENGTH ===\n`;
    out += `Annual Revenue: ${data?.financialOverview?.annualRevenue || "Not provided"}\n`;
    out += `Profitability: ${data?.financialOverview?.profitabilityStatus || "Not provided"}\n`;
    out += `Revenue trend (12 months): ${data?.financialOverview?.revenueTrend || "Not provided"}\n`;
    out += `Generates revenue: ${data?.financialOverview?.generatesRevenue || "Not provided"}\n`;

    // Financial statements — corrected from enterpriseReadiness to financialOverview
    out += `Financial statements available: ${data?.financialOverview?.hasFinancialStatements || "No"}\n`;
    out += `Years of financial statements: ${(data?.financialOverview?.financialStatementsYears || []).join(", ") || "None"}\n`;
    out += `Audited/reviewed financials: ${data?.financialOverview?.financialsAudited || "No"}\n`;

    // Bookkeeping & systems
    out += `Books up to date: ${data?.financialOverview?.booksUpToDate || "Not confirmed"}\n`;
    if (data?.financialOverview?.booksUpToDate && data.financialOverview.booksUpToDate !== "fully_up_to_date") {
      out += `Books not up to date — reason: ${data?.financialOverview?.booksUpToDateDetails || "Not specified"}\n`;
    }
    out += `Accounting software: ${data?.financialOverview?.hasAccountingSoftware || "Not specified"}\n`;
    if (data?.financialOverview?.hasAccountingSoftware === "yes") {
      out += `Accounting software used: ${data?.financialOverview?.accountingSoftwareName || "Not specified"}\n`;
    }
    out += `Management accounts: ${data?.financialOverview?.hasManagementAccounts || "None"}\n`;
    out += `Latest management accounts: ${data?.financialOverview?.latestManagementAccounts || "N/A"}\n`;

    // Income statement (current vs previous year)
    out += `\n--- Income Statement (Current / Previous FY) ---\n`;
    out += `Turnover/Revenue: ${data?.financialOverview?.incomeTurnoverCurrent || "Not provided"} / ${data?.financialOverview?.incomeTurnoverPrevious || "Not provided"}\n`;
    out += `Cost of Goods Sold: ${data?.financialOverview?.incomeCOGSCurrent || "Not provided"} / ${data?.financialOverview?.incomeCOGSPrevious || "Not provided"}\n`;
    out += `Gross Profit: ${data?.financialOverview?.incomeGrossProfitCurrent || "Not provided"} / ${data?.financialOverview?.incomeGrossProfitPrevious || "Not provided"}\n`;
    out += `Operating Profit: ${data?.financialOverview?.incomeOperatingProfitCurrent || "Not provided"} / ${data?.financialOverview?.incomeOperatingProfitPrevious || "Not provided"}\n`;
    out += `Net Profit: ${data?.financialOverview?.incomeNetProfitCurrent || "Not provided"} / ${data?.financialOverview?.incomeNetProfitPrevious || "Not provided"}\n`;

    // Balance sheet (current vs previous year)
    out += `\n--- Balance Sheet (Current / Previous FY) ---\n`;
    out += `Current Assets: ${data?.financialOverview?.balanceCurrentAssetsCurrent || "Not provided"} / ${data?.financialOverview?.balanceCurrentAssetsPrevious || "Not provided"}\n`;
    out += `Total Assets: ${data?.financialOverview?.balanceTotalAssetsCurrent || "Not provided"} / ${data?.financialOverview?.balanceTotalAssetsPrevious || "Not provided"}\n`;
    out += `Current Liabilities: ${data?.financialOverview?.balanceCurrentLiabilitiesCurrent || "Not provided"} / ${data?.financialOverview?.balanceCurrentLiabilitiesPrevious || "Not provided"}\n`;
    out += `Long Term Liabilities: ${data?.financialOverview?.balanceLongTermLiabilitiesCurrent || "Not provided"} / ${data?.financialOverview?.balanceLongTermLiabilitiesPrevious || "Not provided"}\n`;
    out += `Equity: ${data?.financialOverview?.balanceEquityCurrent || "Not provided"} / ${data?.financialOverview?.balanceEquityPrevious || "Not provided"}\n`;
    out += `Total Liabilities: ${data?.financialOverview?.balanceTotalLiabilitiesCurrent || "Not provided"} / ${data?.financialOverview?.balanceTotalLiabilitiesPrevious || "Not provided"}\n`;

    // Debt & liabilities
    out += `\n--- Debt & Liability Position ---\n`;
    out += `Existing debt: ${data?.financialOverview?.existingDebt || "Not specified"}\n`;
    out += `Overdraft facility: ${data?.financialOverview?.hasOverdraft || "Not specified"}\n`;
    if (data?.financialOverview?.hasOverdraft === "yes") {
      out += `Overdraft value: ${data?.financialOverview?.overdraftValue || "Not specified"}\n`;
      out += `Overdraft utilisation: ${data?.financialOverview?.overdraftUtilised || "Not specified"}\n`;
    }
    out += `Directors' personal surety signed: ${data?.financialOverview?.directorsSurety || "Not specified"}\n`;
    out += `Debtors ceded/factored: ${data?.financialOverview?.debtorsCeded || "Not specified"}\n`;

    // Credit report — sourced from creditAnalyses collection, not a self-reported flag
    out += `Credit report on file: ${crAnalysis?.isValid ? "Yes" : "No"}\n`;

    // Financial challenges (qualitative context for the AI, not scored directly)
    if ((data?.financialOverview?.financialChallenges || []).length > 0) {
      out += `\n--- Reported Financial Challenges ---\n`;
      out += `Challenges: ${(data.financialOverview.financialChallenges || []).join(", ")}\n`;
      out += `Elaboration: ${data?.financialOverview?.financialChallengesElaboration || "Not provided"}\n`;
    }

    try {
      const finSnap = await getDoc(doc(db, "aiFinancialEvaluations", auth.currentUser.uid));
      if (finSnap.exists()) {
        const rev = finSnap.data();
        if (rev?.evaluation?.score) {
          out += `\nRevenue Growth AI Score: ${rev.evaluation.score}/5\n`;
          out += `Revenue Growth Summary: ${rev.evaluation.summary || "N/A"}\n`;
          if (rev.evaluation.resilienceScore) {
            out += `Financial Resilience Score (solvency/liquidity/leverage): ${rev.evaluation.resilienceScore}/5\n`;
          }
        }
      }
    } catch (_) {}

    out += `\n=== IMPACT & MANDATE ALIGNMENT ===\n`;
    out += `Black ownership: ${data?.socialImpact?.blackOwnership || 0}%\n`;
    out += `Women ownership: ${data?.socialImpact?.womenOwnership || 0}%\n`;
    out += `Youth ownership: ${data?.socialImpact?.youthOwnership || 0}%\n`;
    out += `Disabled ownership: ${data?.socialImpact?.disabledOwnership || 0}%\n`;
    out += `Jobs to create: ${data?.socialImpact?.jobsToCreate || 0}\n`;
    out += `Local employees hired: ${data?.socialImpact?.localEmployeesHired || 0}\n`;
    out += `Environmental impact: ${data?.socialImpact?.environmentalImpact || "Not specified"}\n`;
    out += `SDG alignment: ${data?.socialImpact?.sdgAlignment || "Not specified"}\n`;
    out += `CSR/CSI spend: ${data?.socialImpact?.csiCsrSpend || "R 0"}\n`;
    out += `Beneficiaries: ${data?.socialImpact?.numberOfBeneficiaries || 0}\n`;
    out += `CSR focus areas: ${data?.socialImpact?.csrFocusAreas || "Not specified"}\n`;


    if (hasAppliedForFunding && isFundingDataLoaded && fundingTier) {
      const gp = computeGrowthPotentialScore(data?.growthPotential);
      out += `\n=== GROWTH POTENTIAL (deterministic — do not re-score) ===\n`;
      out += `Factors met: ${gp.yesCount}/${gp.totalFactors} (${gp.factors.join(", ") || "None"})\n`;
      out += `Score: ${gp.score}/5\n`;
    }

    
    if (hasAppliedForFunding && isFundingDataLoaded && fundingTier) {
      const subW = getFundabilitySubWeights(fundingTier);
      out += `\n=== FUNDING APPLICATION MATERIALS (Tier ${fundingTier}: ${TIER_LABELS[fundingTier]}) ===\n`;
      out += `Funding instruments: ${(data?.useOfFunds?.fundingInstruments || []).join(", ")}\n`;
      out += `Amount requested: ${data?.useOfFunds?.amountRequested || "Not specified"}\n`;
      out += `Support focus: ${data?.useOfFunds?.additionalSupportFocus || "None"}\n`;

      if (bpAnalysis?.isValid) {
        const bpScore5 = Math.round((bpAnalysis.score / 100) * 5 * 10) / 10;
        out += `\n--- BUSINESS PLAN ---\n`;
        out += `Original AI Score: ${bpAnalysis.rawScore}/100 → Converted: ${bpScore5}/5\n`;
        out += `Full Analysis:\n${bpAnalysis.content}\n`;
        out += `INSTRUCTION: Use the converted score (${bpScore5}/5) as your base for section 3. You may adjust ±0.5 only if the analysis content clearly justifies it.\n`;
      } else {
        out += `\n--- BUSINESS PLAN ---\nStatus: NOT SUBMITTED or NOT YET ANALYSED. You MUST output Score: 0.\n`;
      }

      if (pdAnalysis?.isValid) {
        const pitchScore5 = Math.round((pdAnalysis.score / 100) * 5 * 10) / 10;
        out += `\n--- PITCH DECK ---\n`;
        out += `Original AI Score: ${pdAnalysis.score}/100 → Converted: ${pitchScore5}/5\n`;
        out += `Operational Score (already 0-5): ${pdAnalysis.operationalScore}/5\n`;
        out += `Full Analysis:\n${pdAnalysis.content}\n`;
        out += `INSTRUCTION: Use the converted score (${pitchScore5}/5) as your base for section 4.\n`;
      } else {
        out += `\n--- PITCH DECK ---\nStatus: NOT SUBMITTED or NOT YET ANALYSED. You MUST output Score: 0.\n`;
      }

      if (crAnalysis?.isValid) {
        out += `\n--- CREDIT REPORT ---\nCredit score: ${crAnalysis.score}/850\nAnalysis:\n${crAnalysis.content}\nCONVERT TO 0-5: 750-850=5, 650-749=4, 550-649=3, 450-549=2, below 450=1.\n`;
      } else {
        const reason = crAnalysis && !crAnalysis.isCreditReport
          ? "Document uploaded was NOT a credit report."
          : "NOT SUBMITTED or NOT YET ANALYSED.";
        out += `\n--- CREDIT REPORT ---\nStatus: ${reason} You MUST output Score: 0.\n`;
      }

      if (subW?.guarantees > 0) {
        if (grAnalysis) {
          out += `\n--- GUARANTEES / COLLATERAL ---\n`;
          out += `Total security instruments: ${grAnalysis.totalCount || 0}\n`;
          out += `Active instruments: ${grAnalysis.activeCount || 0}\n`;
          out += `Signed instruments: ${grAnalysis.signedCount || 0}\n`;
          out += `Current instruments: ${grAnalysis.currentCount || 0}\n`;
          out += `Instruments with value: ${grAnalysis.withValue || 0}\n`;
          out += `Score: ${grAnalysis.score || 0}/5\n`;
        } else {
          out += `\n--- GUARANTEES / COLLATERAL ---\nStatus: Not provided\nScore: 0/5\n`;
        }
      } else {
        out += `\n--- GUARANTEES / COLLATERAL ---\nStatus: EXCLUDED for Tier ${fundingTier} — ${subW?._excluded?.guarantees || "not applicable"}\nScore: 0/5\n`;
      }

      if (subW?.financialResilience > 0) {
        out += `\n--- FINANCIAL RESILIENCE & EFFICIENCY ---\n`;
        if (svAnalysis?.isValid) {
          out += `SOLVENCY METRICS (from capital structure):\n`;
          out += `- Net Asset Value (NAV): R${svAnalysis.nav}M\n`;
          out += `- Equity Ratio: ${svAnalysis.equityRatio}%\n`;
          out += `- Debt to Equity: ${svAnalysis.debtToEquity}\n`;
          out += `- Debt to Assets: ${svAnalysis.debtToAssets}\n`;
          out += `- Interest Coverage: ${svAnalysis.interestCoverage}\n`;
          out += `- Solvency Score: ${svAnalysis.score}/100 (${svAnalysis.normalizedScore}/5 normalized)\n`;
        }
        if (frAnalysis?.content) {
          out += `Resilience Score: ${frAnalysis.score}/5\nAnalysis:\n${frAnalysis.content}\n`;
        } else {
          out += `Status: Using solvency metrics from capital structure.\n`;
        }
        out += `Score: ${svAnalysis?.normalizedScore || 0}/5\n`;
      }
    }

    console.log("📝 Prepared evaluation data, length:", out.length);
    return out;
  };

  const sendMessageToChatGPT = async (message) => {
    console.log("📤 sendMessageToChatGPT called, message length:", message.length);
    try {
      const result = await callFunction("generateFundabilityAnalysis", { prompt: message });
      console.log("📥 Received response from function:", !!result);
      return result?.content || "";
    } catch (error) {
      console.error("❌ ChatGPT API Error:", error);
      throw error;
    }
  };

  const runAiEvaluation = async (userId, freshData = null) => {
    console.log("🚀 runAiEvaluation called for user:", userId);
    console.log("📋 apiKey:", !!apiKey);
    console.log("📋 profileData:", !!profileData);
    console.log("📋 hasAppliedForFunding:", hasAppliedForFunding);
    console.log("📋 freshData provided:", !!freshData);

    if (!apiKey?.trim()) {
      console.log("❌ No API key configured");
      setEvaluationError("API key not configured.");
      return null;
    }
    if (!profileData) {
      console.log("❌ No profile data");
      setEvaluationError("No profile data.");
      return null;
    }

    if (hasAppliedForFunding && !freshData) {
      console.log("⏳ Loading funding data before evaluation...");
      setEvaluationError("Loading funding application data...");
      try {
        freshData = await fetchFundingApplicationData();
        console.log("✅ Funding data loaded:", freshData?.isLoaded);
      } catch (error) {
        console.error("❌ Error loading funding data before evaluation:", error);
        setEvaluationError("Failed to load funding data. Please try again.");
        return null;
      }
    }

    setIsEvaluating(true);
    setEvaluationError("");

    try {
      console.log("📝 Preparing data for evaluation...");
      const evalData = await prepareDataForEvaluation(profileData, freshData);
      const tier = fundingTier;
      const subW = getFundabilitySubWeights(tier);

      const tierNote = tier ? `\n⚠️ FUNDING TIER: ${tier} — ${TIER_LABELS[tier]}\n` : "";

      const tierInstructions =
        tier === "A" ? "TIER A (Grant): Business Plan, Pitch Deck, Impact & Mandate are primary. Creditworthiness at REDUCED weight. Guarantees = 0. Financial Resilience = 0.\n"
        : tier === "B" ? "TIER B (PO/Debt): Creditworthiness and Guarantees are PRIMARY. Financial Resilience included. Impact & Mandate and Pitch Deck at REDUCED weight.\n"
        : tier === "C" ? "TIER C (ESD/Support): Grant-equivalent evaluation. Business Plan, Pitch Deck, Impact & Mandate are primary. Creditworthiness at REDUCED weight. Guarantees = 0. Financial Resilience = 0.\n"
        : tier === "D" ? "TIER D (Full/Serious Funding): ALL sub-components active. Financial Resilience & Efficiency is CRITICAL. Pitch Deck and Impact at REDUCED weight.\n"
        : "";

      let categoriesToEvaluate = "";
      
      if (hasAppliedForFunding && tier) {
        categoriesToEvaluate = `
### 1. Financial Strength
**Score:** [0-5]
**Evidence:** [cite exact fields used]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on provided data]
**How to Improve:** 
- → [Section]: [specific action]

### 2. Impact & Mandate Alignment
**Score:** [0-5]
**Evidence:** [cite exact fields used]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on provided data]
**How to Improve:** 
- → [Section]: [specific action]

### 3. Business Plan / Investment Case
**Score:** [0-5 - Base this on the business plan analysis content provided]
**Evidence:** [Cite specific elements from the business plan analysis]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based on the business plan analysis content]
**How to Improve:** 
- → [Document Uploads]: Upload an updated business plan

### 4. Pitch Readiness / Pitch Deck
**Score:** [0-5 - Base this on the pitch deck analysis content provided]
**Evidence:** [Cite specific elements from the pitch deck analysis]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based on the pitch deck analysis content]
**How to Improve:** 
- → [Document Uploads]: Upload an updated pitch deck

### 5. Creditworthiness
**Score:** [${tier === "A" || tier === "C" ? "0-5 — note this is at reduced weight for grant/ESD tier" : "0-5"}]
**Evidence:** [Cite specific elements from the credit report analysis]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based on the credit report analysis content]
**How to Improve:** 
- → [Document Uploads]: Upload an updated credit report

### 6. Guarantees / Collateral
**Score:** [${tier === "A" || tier === "C" ? "0 — excluded for grant/ESD funding" : "0-5"}]
**Evidence:** ${tier === "A" || tier === "C" ? "N/A — excluded for Tier " + tier : "[Cite guarantee types provided]"}
**Confidence:** ${tier === "A" || tier === "C" ? "N/A" : "[High | Medium | Low]"}
**Confidence Rationale:** ${tier === "A" || tier === "C" ? "Excluded: " + (subW?._excluded?.guarantees || "not required for this tier") : "[one sentence]"}
**Rationale:** ${tier === "A" || tier === "C" ? "Guarantees are not assessed for " + TIER_LABELS[tier] + " funding." : "[Explain based on provided guarantees]"}
**How to Improve:** ${tier === "A" || tier === "C" ? "N/A" : "- → [Guarantees Section]: Add purchase orders, personal guarantees, or collateral"}

### 7. Financial Resilience & Efficiency
**Score:** [${tier === "D" ? "0-5 — CRITICAL for Tier D" : "0 — excluded for Tier " + tier}]
**Evidence:** ${tier !== "D" ? "N/A — excluded for Tier " + tier : "[Cite solvency, liquidity, leverage metrics]"}
**Confidence:** ${tier !== "D" ? "N/A" : "[High | Medium | Low]"}
**Confidence Rationale:** ${tier !== "D" ? "Excluded: " + (subW?._excluded?.financialResilience || "not applicable for this tier") : "[one sentence]"}
**Rationale:** ${tier !== "D" ? "Financial resilience is not assessed for " + TIER_LABELS[tier] + " funding." : "[Cover solvency ratios, liquidity position, leverage, and efficiency metrics]"}
**How to Improve:** ${tier !== "D" ? "N/A" : "- → [Financial Overview]: Improve debt-to-equity ratio"}`;
      } else {
        categoriesToEvaluate = `
### 1. Financial Strength
**Score:** [0-5]
**Evidence:** [cite exact fields used]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on provided data]
**How to Improve:** 
- → [Section]: [specific action]

### 2. Impact & Mandate Alignment
**Score:** [0-5]
**Evidence:** [cite exact fields used]
**Confidence:** [High | Medium | Low]
**Confidence Rationale:** [one sentence]
**Rationale:** [explanation based only on provided data]
**How to Improve:** 
- → [Section]: [specific action]`;
      }

      const combinedMessage = `Evaluate the fundability...

ABSOLUTE SCORE RULES — NEVER VIOLATE:
1. Business Plan, Pitch Deck, and Creditworthiness scores MUST come ONLY from the analysis documents provided.
2. If a section is marked "NOT SUBMITTED", you MUST output Score: 0 for that section.
3. If a section is marked "EXCLUDED", you MUST output Score: 0 for that section.
4. A score of 0 is valid and expected when documents are missing.

${tierNote}
${tierInstructions}

STRICT DATA RULES:
- Only reference data explicitly provided in the input below
- If a section says "not yet completed" or "not provided", score it 0

${hasAppliedForFunding && tier ? `⚠️ IMPORTANT: This business HAS APPLIED FOR FUNDING. You MUST include sections 3-7 in your analysis.` : ''}

Categories to evaluate:
${categoriesToEvaluate}

### Overall Assessment
**Final Analysis:** [Brief summary referencing only the data provided.]

INPUT DATA:
${evalData}`;

      console.log("📤 Sending message to AI, length:", combinedMessage.length);
      const result = await sendMessageToChatGPT(combinedMessage);
      console.log("📥 Received AI response, length:", result?.length || 0);
      
      // Add timestamp
      const timestamp = new Date().toLocaleString();
      setEvaluationTimestamp(timestamp);
      console.log("📅 Evaluation completed at:", timestamp);
      
      const aiScores = parseAiEvaluationScores(result);
      console.log("📊 Parsed AI scores:", aiScores);
      
      if (hasAppliedForFunding && tier) {
        const isValid = validateFundingScores(aiScores);
        console.log("✅ Funding scores valid:", isValid);
        if (!isValid) {
          console.warn("⚠️ Funding scores missing - but continuing");
        }
      }
      
      console.log("✅ AI evaluation complete");
      return result;
    } catch (error) {
      console.error("❌ AI Evaluation error:", error);
      setEvaluationError(`Failed: ${error.message}`);
      return null;
    } finally {
      setIsEvaluating(false);
      console.log("✅ Evaluation finished, isEvaluating set to false");
    }
  };

  useEffect(() => { runAiEvaluationRef.current = runAiEvaluation; });

  const refreshAiEvaluation = async () => {
    console.log("🔄 refreshAiEvaluation called");
    const userId = auth?.currentUser?.uid;
    if (!userId) {
      console.log("❌ No user ID");
      return;
    }
    try {
      console.log("📖 Checking for saved evaluation...");
      const aiEvalRef = doc(db, "aiFundabilityEvaluations", userId);
      const aiSnap = await getDoc(aiEvalRef);
      if (aiSnap.exists() && aiSnap.data().result) {
        console.log("✅ Found saved evaluation, loading...");
        const data = aiSnap.data();
        setAiEvaluationResult(data.result);
        if (data.timestamp) {
          setEvaluationTimestamp(new Date(data.timestamp.toDate()).toLocaleString());
        }
        setShowDetailedAnalysis(true);
        console.log("✅ Loaded saved evaluation");
        return;
      }
      console.log("🔄 No saved evaluation, running new one...");
      const result = await runAiEvaluation(userId);
      if (result) {
        console.log("✅ Got result from AI, saving...");
        const timestamp = new Date();
        await setDoc(aiEvalRef, {
          result,
          timestamp: timestamp,
          profileSnapshot: profileData,
          includedFundingData: hasAppliedForFunding,
          fundingTier,
        }, { merge: true });
        console.log("✅ Saved to Firestore");
        setAiEvaluationResult(result);
        setEvaluationTimestamp(timestamp.toLocaleString());
        setShowDetailedAnalysis(true);
        console.log("✅ Evaluation complete and displayed");
      } else {
        console.log("❌ No result from AI");
      }
    } catch (error) {
      console.error("❌ Failed to refresh:", error);
      setEvaluationError(`Failed to refresh: ${error.message}`);
    }
  };

  const waitForFundingCheck = () =>
    new Promise((resolve, reject) => {
      console.log("⏳ Waiting for funding check...");
      const start = Date.now();
      const iv = setInterval(() => {
        if (fundingCheckCompleteRef.current) {
          console.log("✅ Funding check complete");
          clearInterval(iv);
          resolve();
        } else if (Date.now() - start > 15000) {
          console.log("❌ Funding check timeout");
          clearInterval(iv);
          reject(new Error("Timeout"));
        }
      }, 100);
    });

  useEffect(() => {
    console.log("🔄 Setting up onSnapshot listener");
    if (!auth?.currentUser?.uid || !apiKey) {
      console.log("⏭️ Skipping - no user or API key");
      return;
    }

    const docRef    = doc(db, "universalProfiles", auth.currentUser.uid);
    const aiEvalRef = doc(db, "aiFundabilityEvaluations", auth.currentUser.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      console.log("📡 onSnapshot triggered for universalProfiles");
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📋 Document data:", { 
          triggerFundabilityEvaluation: data.triggerFundabilityEvaluation,
          isEvaluatingRef: isEvaluatingRef.current,
          isSavingEvaluation: isSavingEvaluation.current
        });

        if (
          data.triggerFundabilityEvaluation === true &&
          !isEvaluatingRef.current &&
          !isSavingEvaluation.current
        ) {
          console.log("🚀 Trigger detected! Running evaluation...");
          if (!fundingCheckCompleteRef.current) {
            console.log("⏳ Funding check not complete, waiting...");
            try { await waitForFundingCheck(); }
            catch { 
              console.log("❌ Funding check failed, clearing trigger");
              await updateDoc(docRef, { triggerFundabilityEvaluation: false });
              return; 
            }
          }

          isSavingEvaluation.current = true;
          setTriggeredByAuto(true);

          try {
            console.log("🚀 Running AI evaluation from trigger...");
            const result = await runAiEvaluationRef.current(auth.currentUser.uid);
            console.log("📥 AI result:", !!result);

            if (result) {
              console.log("💾 Saving AI result to Firestore...");
              const timestamp = new Date();
              await setDoc(aiEvalRef, {
                result, 
                timestamp: timestamp,
                profileSnapshot: profileDataRef.current,
                includedFundingData: hasAppliedForFundingRef.current, 
                fundingTier: fundingTierRef.current,
              }, { merge: true });

              console.log("✅ Saved to Firestore, updating state...");
              setAiEvaluationResult(result);
              setEvaluationTimestamp(timestamp.toLocaleString());
              setShowDetailedAnalysis(true);
              console.log("✅ Evaluation complete and displayed");
            } else {
              console.log("❌ No result from AI, skipping save");
            }
          } catch (error) {
            console.error("❌ Auto evaluation error:", error);
            setEvaluationError(`Auto evaluation failed: ${error.message}`);
          } finally {
            console.log("🧹 Cleaning up: clearing trigger flag");
            await updateDoc(docRef, { triggerFundabilityEvaluation: false });
            isSavingEvaluation.current = false;
            console.log("✅ Cleanup complete");
          }
          return;
        }
      }

      if (isSavingEvaluation.current) {
        console.log("⏭️ Skipping - currently saving evaluation");
        return;
      }

      try {
        console.log("📖 Checking for saved AI evaluation...");
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists()) {
          const saved = aiSnap.data();
          if (saved.result) {
            console.log("✅ Found saved evaluation, loading...");
            setAiEvaluationResult(saved.result);
            if (saved.timestamp) {
              setEvaluationTimestamp(new Date(saved.timestamp.toDate()).toLocaleString());
            }
            if (saved.includedFundingData === true || !hasAppliedForFundingRef.current) {
              hasReevaluated.current = true;
            }
            console.log("✅ Loaded saved evaluation");
          } else {
            console.log("⚠️ Saved evaluation exists but no result");
          }
        } else {
          console.log("⚠️ No saved evaluation found");
        }
      } catch (e) { 
        console.error("❌ Load saved eval error:", e);
      }
    });

    return () => {
      console.log("🔄 Unsubscribing from onSnapshot");
      unsubscribe();
    };
  }, [auth?.currentUser?.uid, apiKey]);

  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20";
    if (score >= 81) return "#4CAF50";
    if (score >= 61) return "#FF9800";
    if (score >= 41) return "#F44336";
    return "#B71C1C";
  };

  const mapStageToCategory = (stage) => {
    const s = (stage || "").toLowerCase();
    if (["pre-seed", "preseed"].includes(s)) return "pre-seed";
    if (["seed"].includes(s)) return "seed";
    if (["series a", "seriesa"].includes(s)) return "seriesa";
    if (["series b", "seriesb"].includes(s)) return "seriesb";
    if (["early-growth", "growth", "scale-up"].includes(s)) return "growth";
    return "maturity";
  };

  const weightingsByStage = {
    "pre-seed": { financialStrength: 42, impactMandate: 58, businessPlan: 0, pitchDeck: 0, creditworthiness: 0, guarantees: 0, financialResilience: 0 },
    seed:       { financialStrength: 54, impactMandate: 46, businessPlan: 0, pitchDeck: 0, creditworthiness: 0, guarantees: 0, financialResilience: 0 },
    seriesa:    { financialStrength: 64, impactMandate: 36, businessPlan: 0, pitchDeck: 0, creditworthiness: 0, guarantees: 0, financialResilience: 0 },
    seriesb:    { financialStrength: 73, impactMandate: 27, businessPlan: 0, pitchDeck: 0, creditworthiness: 0, guarantees: 0, financialResilience: 0 },
    growth:     { financialStrength: 81, impactMandate: 19, businessPlan: 0, pitchDeck: 0, creditworthiness: 0, guarantees: 0, financialResilience: 0 },
    maturity:   { financialStrength: 88, impactMandate: 12, businessPlan: 0, pitchDeck: 0, creditworthiness: 0, guarantees: 0, financialResilience: 0 },
  };

  const getScoreLevel = (score) => {
    if (score > 90)  return { level: "Highly fundable",       color: "#1B5E20", icon: CheckCircle };
    if (score >= 81) return { level: "Strong investment case", color: "#4CAF50", icon: CheckCircle };
    if (score >= 61) return { level: "Moderate potential",    color: "#FF9800", icon: TrendingUp };
    if (score >= 41) return { level: "Basic potential",       color: "#F44336", icon: AlertCircle };
    return               { level: "Needs development",        color: "#B71C1C", icon: AlertCircle };
  };

  const scoreLevel = getScoreLevel(fundabilityScore);

  const formatAiResult = (text) => {
    if (!text) return null;
    const cleaned  = text.replace(/\*\*(.*?)\*\*/g, "$1");
    const sections = cleaned.split(/(?=###\s)/g);

    return sections.map((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return null;
      const isCategorySection = /^###\s+\d+\./.test(trimmed);

      if (isCategorySection) {
        const headingMatch = trimmed.match(/^###\s*(.+?)(?=\s+(?:\*\*)?Score\s*:|\n|$)/i);
        const header = headingMatch ? headingMatch[1].trim() : trimmed.replace(/^###\s*/, "").split("\n")[0];
        const content = header
          ? trimmed.slice(trimmed.indexOf(header) + header.length).replace(/^###\s*/, "").trim()
          : trimmed.split("\n").slice(1).join("\n");

        const evidenceMatch   = content.match(/Evidence\s*:\s*([^\n]+)/i);
        const confidenceMatch = content.match(/Confidence\s*:\s*(High|Medium|Low)/i);
        const confRatMatch    = content.match(/Confidence Rationale\s*:\s*([^\n]+)/i);
        const confidenceLevel = confidenceMatch?.[1] || null;

        const confidenceColor =
          confidenceLevel === "High"   ? { bg: "#e8f5e9", text: "#1B5E20" } :
          confidenceLevel === "Medium" ? { bg: "#fff3e0", text: "#E65100" } :
          confidenceLevel === "Low"    ? { bg: "#ffebee", text: "#B71C1C" } : null;

        const impIdx      = content.toLowerCase().indexOf("how to improve");
        const mainContent = impIdx !== -1 ? content.substring(0, impIdx) : content;
        const impContent  = impIdx !== -1 ? content.substring(impIdx)    : "";
        const mainCleaned = mainContent
          .replace(/Evidence\s*:\s*[^\n]+\n?/i, "")
          .replace(/Confidence\s*:\s*[^\n]+\n?/i, "")
          .replace(/Confidence Rationale\s*:\s*[^\n]+\n?/i, "")
          .trim();

        return (
          <div key={index} style={{ marginBottom: "20px", border: "1px solid #e8d8cf", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", fontWeight: "bold" }}>
              {header.replace("###", "").trim()}
            </div>
            {(evidenceMatch || confidenceLevel) && (
              <div style={{ display: "flex", gap: "10px", padding: "10px 16px", backgroundColor: "#f9f5f0", borderBottom: "1px solid #e8d8cf", flexWrap: "wrap", alignItems: "flex-start" }}>
                {evidenceMatch && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", backgroundColor: "#f3e8dc", padding: "5px 12px", borderRadius: "16px", fontSize: "12px", color: "#5d4037", maxWidth: "100%" }}>
                    <span style={{ marginTop: "1px", flexShrink: 0 }}>📄</span>
                    <span style={{ lineHeight: "1.4" }}>{evidenceMatch[1].trim()}</span>
                  </div>
                )}
                {confidenceLevel && confidenceColor && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: confidenceColor.bg, padding: "5px 12px", borderRadius: "16px", fontSize: "12px", color: confidenceColor.text, fontWeight: "600", flexShrink: 0 }}>
                    <span>🛡</span>
                    <span>Confidence: {confidenceLevel}</span>
                  </div>
                )}
                {confRatMatch && (
                  <div style={{ width: "100%", fontSize: "12px", color: "#8d6e63", fontStyle: "italic", paddingLeft: "4px", marginTop: "2px", lineHeight: "1.4" }}>
                    {confRatMatch[1].trim()}
                  </div>
                )}
              </div>
            )}
            <div style={{ padding: "16px", backgroundColor: "white" }}>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#5d4037", marginBottom: impContent ? "15px" : "0" }}>
                {mainCleaned}
              </div>
              {impContent && (
                <div style={{ backgroundColor: "#f8f4f0", padding: "15px", borderRadius: "6px", borderLeft: "4px solid #ff9800" }}>
                  <div style={{ fontWeight: "bold", color: "#5d4037", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={16} /> Improvement Actions
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#6d4c41", fontSize: "14px" }}>
                    {impContent.replace("How to Improve:", "").trim()}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div key={index} style={{ marginBottom: "15px" }}>
          <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#6d4c41", whiteSpace: "pre-wrap", backgroundColor: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e8d8cf" }}>
            {trimmed}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const renderTierBadge = () => {
    if (!hasAppliedForFunding || !fundingTier) return null;
    const c = TIER_BADGE_COLORS[fundingTier];
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: "600", color: c.text, marginTop: "8px" }}>
        <span>🏷</span>
        <span>Tier {fundingTier}: {TIER_LABELS[fundingTier]}</span>
      </div>
    );
  };
const FUNDABILITY_INTERNAL_ROWS = [
    { name: "Investment Case Strength", grantsW: "21%", poW: "18%", allOtherW: "18%", why: "Foundation of funding decision" },
    { name: "Pitch Readiness", grantsW: "17%", poW: "9%", allOtherW: "9%", why: "Communication matters" },
    { name: "Impact & Mandate Alignment", grantsW: "34%", poW: "9%", allOtherW: "9%", why: "Critical for SA/ESG funding" },
    { name: "Creditworthiness", grantsW: "13%", poW: "27%", allOtherW: "23%", why: "Risk filter" },
    { name: "Guarantees/Collateral", grantsW: "0%", poW: "27%", allOtherW: "13%", why: "Debt funding = collateral-driven. DFIs / banks = risk mitigation first" },
    {
      name: "Financial Resilience & Efficiency (solvency, liquidity, leverage ratios)",
      grantsW: "0%", poW: "0%", allOtherW: "18%",
      why: 'For serious funding (>R10m), we move from "basic fundability" → "underwriting-grade fundability"',
      note: "These come from growth suite. For all other funding instruments (not grant of PO<10M), they should also get a message to subscribe to growth suite first before they can be matched.",
    },
    {
      name: "Growth Potential (market share, quality, green tech, localisation, jobs, empowerment)",
      grantsW: "15%", poW: "10%", allOtherW: "10%",
      why: "Signals scalability and developmental impact of the funded activity",
    },
  ];

  const getActiveTierCol = () => {
    if (!fundingTier) return null;
    if (fundingTier === "A" || fundingTier === "C") return "grants";
    if (fundingTier === "B") return "po";
    if (fundingTier === "D") return "allOther";
    return null;
  };

  const renderFundabilityInternalTable = () => {
    const activeCol = getActiveTierCol();
    const colStyle = (col) => ({
      padding: "6px 10px",
      textAlign: "center",
      fontWeight: activeCol === col ? "700" : "400",
      backgroundColor: activeCol === col ? "#e8f5e9" : "transparent",
      color: activeCol === col ? "#1B5E20" : "#5d4037",
      borderLeft: "1px solid #d7ccc8",
      fontSize: "12px",
    });

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: "#d7ccc8" }}>
              <th style={{ padding: "7px 10px", textAlign: "left", color: "#5d4037", fontWeight: "600", minWidth: "160px" }}>Sub-component</th>
              <th style={{ padding: "7px 10px", textAlign: "center", color: "#5d4037", fontWeight: "600", borderLeft: "1px solid #c5b8b0", backgroundColor: activeCol === "grants" ? "#c8e6c9" : "#d7ccc8", minWidth: "90px" }}>
                Weightings: Grants / Catalyst
                {activeCol === "grants" && <div style={{ fontSize: "10px", color: "#1B5E20", marginTop: "2px" }}>✓ Your tier</div>}
              </th>
              <th style={{ padding: "7px 10px", textAlign: "center", color: "#5d4037", fontWeight: "600", borderLeft: "1px solid #c5b8b0", backgroundColor: activeCol === "po" ? "#c8e6c9" : "#d7ccc8", minWidth: "90px" }}>
                Weightings PO (&lt;10M)
                {activeCol === "po" && <div style={{ fontSize: "10px", color: "#1B5E20", marginTop: "2px" }}>✓ Your tier</div>}
              </th>
              <th style={{ padding: "7px 10px", textAlign: "center", color: "#5d4037", fontWeight: "600", borderLeft: "1px solid #c5b8b0", backgroundColor: activeCol === "allOther" ? "#c8e6c9" : "#d7ccc8", minWidth: "110px" }}>
                Weightings All other funding instruments + Pos&gt;10M
                {activeCol === "allOther" && <div style={{ fontSize: "10px", color: "#1B5E20", marginTop: "2px" }}>✓ Your tier</div>}
              </th>
              <th style={{ padding: "7px 10px", textAlign: "left", color: "#5d4037", fontWeight: "600", borderLeft: "1px solid #c5b8b0" }}>Why</th>
            </tr>
          </thead>
          <tbody>
            {FUNDABILITY_INTERNAL_ROWS.map((row, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#faf8f6" }}>
                <td style={{ padding: "7px 10px", color: "#5d4037", verticalAlign: "top" }}>
                  {row.name}
                  {row.note && (
                    <div style={{ fontSize: "11px", color: "#8d6e63", fontStyle: "italic", marginTop: "4px", lineHeight: "1.4" }}>
                      {row.note}
                    </div>
                  )}
                </td>
                <td style={colStyle("grants")}>{row.grantsW}</td>
                <td style={colStyle("po")}>{row.poW}</td>
                <td style={colStyle("allOther")}>{row.allOtherW}</td>
                <td style={{ padding: "7px 10px", color: "#6d4c41", fontStyle: "italic", fontSize: "11px", borderLeft: "1px solid #d7ccc8", verticalAlign: "top", lineHeight: "1.4" }}>
                  {row.why}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Score Card ── */}
      <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)", borderRadius: "20px", boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)", border: "1px solid #e8ddd6", overflow: "hidden", position: "relative", width: "100%", minWidth: "210px" }}>
        <div style={{ background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)", padding: "24px 30px 20px 30px", color: "white", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <h2 style={{ margin: "0", fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>Capital Appeal Score</h2>
            <DollarSign size={24} style={{ opacity: 0.8 }} />
          </div>
          <p style={{ margin: "0", fontSize: "13px", opacity: "0.9" }}>Investment readiness assessment</p>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", opacity: "0.6" }} />
          <div style={{ position: "absolute", bottom: "-10px", left: "-10px", width: "60px", height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        </div>

        <div style={{ padding: "24px", background: "white", textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "110px", height: "110px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)", boxShadow: `0 6px 20px ${scoreLevel.color}30`, fontWeight: "bold" }}>
              <span style={{ fontSize: "26px", fontWeight: "800", lineHeight: "1", marginBottom: "2px" }}>{fundabilityScore}%</span>
              <div style={{ position: "absolute", top: "-6px", left: "-6px", right: "-6px", bottom: "-6px", border: `2px solid ${scoreLevel.color}20`, borderRadius: "50%", animation: "pulse 2s infinite" }} />
            </div>
            <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: scoreLevel.color, color: "white", padding: "6px 16px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", textTransform: "capitalize", letterSpacing: "0.5px", boxShadow: `0 4px 12px ${scoreLevel.color}40`, border: "2px solid white", whiteSpace: "nowrap" }}>
              {scoreLevel.level}
            </div>
          </div>

          {evaluationTimestamp && (
            <div style={{ fontSize: "11px", color: "#8d6e63", marginBottom: "10px" }}>
              Last evaluated: {evaluationTimestamp}
            </div>
          )}

          <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)", color: "white", marginTop: "15px", border: "none", fontWeight: "600", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.3s ease", boxShadow: "0 4px 16px rgba(93,64,55,0.3)", whiteSpace: "nowrap" }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(93,64,55,0.4)"; }}
            onMouseOut={(e)  => { e.currentTarget.style.transform = "translateY(0px)";  e.currentTarget.style.boxShadow = "0 4px 16px rgba(93,64,55,0.3)"; }}>
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.05); opacity:0.7; } }`}</style>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 999999, maxHeight: "90vh", overflowY: "auto", width: "90%", maxWidth: "760px", border: "1px solid #ccc" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "15px", right: "15px", background: "#fff", border: "2px solid #ddd", fontSize: "20px", cursor: "pointer", color: "#666", zIndex: 999999, width: "35px", height: "35px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "bold" }}>×</button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "24px", fontWeight: "600", color: "#5d4037", textAlign: "center" }}>Capital Appeal Score breakdown</h3>

              {/* Score hero */}
              <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)", borderRadius: "12px", border: "1px solid #d6b88a" }}>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "120px", height: "120px", border: `4px solid ${scoreLevel.color}`, borderRadius: "50%", background: "white", boxShadow: "0 4px 12px rgba(139,69,19,0.2)", marginBottom: "15px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "700", color: "#5d4037", lineHeight: "1" }}>{fundabilityScore}%</span>
                  <span style={{ color: scoreLevel.color, fontSize: "12px", fontWeight: "600", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{scoreLevel.level}</span>
                </div>

                <div style={{ fontSize: "14px", color: "#6d4c41", marginBottom: "8px" }}>
                  <span>Business stage: </span>
                  <span style={{ fontWeight: "600", color: "#5d4037", textTransform: "capitalize" }}>{profileData?.entityOverview?.operationStage || "Ideation"}</span>
                </div>

                {renderTierBadge()}

                {evaluationTimestamp && (
                  <div style={{ fontSize: "12px", color: "#8d6e63", marginTop: "8px" }}>
                    Last evaluated: {evaluationTimestamp}
                  </div>
                )}

                {isEvaluating && (
                  <p style={{ color: "#5d4037", fontSize: "14px", marginTop: "10px" }}>
                    <RefreshCw size={16} style={{ marginRight: "6px" }} />
                    Running AI analysis...
                  </p>
                )}
                {isReevaluating && (
                  <p style={{ color: "#ff9800", fontSize: "14px", marginTop: "10px" }}>
                    <RefreshCw size={16} style={{ marginRight: "6px" }} />
                    Updating with funding application materials...
                  </p>
                )}

                {!aiEvaluationResult && (
                  <div style={{ marginTop: "15px" }}>
                    <button onClick={refreshAiEvaluation} disabled={isEvaluating || !apiKey}
                      style={{ padding: "10px 20px", backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px", opacity: isEvaluating || !apiKey ? 0.7 : 1 }}>
                      {isEvaluating
                        ? (<><div style={{ width: "16px", height: "16px", border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />Loading...</>)
                        : (<><RefreshCw size={16} />Load AI analysis</>)}
                    </button>
                    {evaluationError && !isEvaluating && (
                      <div style={{ marginTop: "10px", padding: "10px 12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", textAlign: "left" }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} /> {evaluationError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── About Score ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowAboutScore(!showAboutScore)}>
                  <span>About the Capital Appeal Score</span>
                  <ChevronDown size={20} style={{ transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>

                {showAboutScore && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px", color: "#5d4037" }}>
                    <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                      The Capital Appeal Score measures a business's ability to absorb, deploy, and return capital. It assesses financial strength and fundability. The fundability block's sub-component weights adapt automatically to your funding type (tier).
                    </p>

                    <div style={{ backgroundColor: "#efebe9", padding: "14px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Overall score weighting:</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#d7ccc8" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", color: "#5d4037" }}>Component</th>
                            <th style={{ padding: "6px 10px", textAlign: "center", color: "#5d4037", borderLeft: "1px solid #c5b8b0" }}>Weight without funding</th>
                            <th style={{ padding: "6px 10px", textAlign: "center", color: "#5d4037", borderLeft: "1px solid #c5b8b0" }}>Weight with funding</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", color: "#5d4037", borderLeft: "1px solid #c5b8b0" }}>Why</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: "6px 10px" }}>Financial Strength</td>
                            <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "600", borderLeft: "1px solid #e0d5cf" }}>Varies by stage</td>
                            <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "600", borderLeft: "1px solid #e0d5cf" }}>40%</td>
                            <td style={{ padding: "6px 10px", borderLeft: "1px solid #e0d5cf" }}>Core signal of viability</td>
                          </tr>
                          <tr>
                            <td style={{ padding: "6px 10px" }}>Fundability</td>
                            <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "600", color: "#9e9e9e", borderLeft: "1px solid #e0d5cf" }}>0%</td>
                            <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "600", color: "#2e7d32", borderLeft: "1px solid #e0d5cf" }}>60%</td>
                            <td style={{ padding: "6px 10px", fontSize: "12px", color: "#8d6e63", borderLeft: "1px solid #e0d5cf" }}>Trust + investor confidence (activated on funding application)</td>
                          </tr>
                        </tbody>
                      </table>
                     

                    <div style={{ backgroundColor: "#efebe9", padding: "14px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8d6e63" }}>
                       {/* ── About Financial Strength ── */}
            
                {true && (
                 
                    <div style={{ backgroundColor: "#efebe9", padding: "14px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Indicative weighting within Financial Strength:</p>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#d7ccc8" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", color: "#5d4037" }}>Factor</th>
                            <th style={{ padding: "6px 10px", textAlign: "center", color: "#5d4037", borderLeft: "1px solid #c5b8b0" }}>Weight</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", color: "#5d4037", borderLeft: "1px solid #c5b8b0" }}>Why</th>
                          </tr>
                        </thead>
                        <tbody>
                          {FINANCIAL_STRENGTH_ROWS.map((row, i) => (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "white" : "#faf8f6" }}>
                              <td style={{ padding: "6px 10px" }}>{row.name}</td>
                              <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: "600", borderLeft: "1px solid #e0d5cf" }}>{row.weight}</td>
                              <td style={{ padding: "6px 10px", fontSize: "12px", color: "#8d6e63", borderLeft: "1px solid #e0d5cf" }}>{row.why}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p style={{ marginTop: "8px", fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
                        Unlike Fundability, this weighting is not applied programmatically to sub-scores — it guides
                        the AI's single overall Financial Strength rating.
                      </p>
                    </div>
                 
                )}
        
                      <p style={{ marginTop: "8px", fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
                        Make Fundability conditional in weighting, not value, depending on whether SME needs funding.
                      </p>
                    </div>
                      <p style={{ fontWeight: "bold", marginBottom: "4px", color: "#6d4c41" }}>
                        Fundability (Internal Weighting)
                        {fundingTier && (
                          <span style={{ fontSize: "11px", fontWeight: "400", color: "#8d6e63", marginLeft: "8px" }}>
                            — your active tier column is highlighted
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: "11px", color: "#8d6e63", marginBottom: "10px", fontStyle: "italic" }}>
                        Tier A &amp; C → Grants/Catalyst column · Tier B → PO (&lt;10M) column · Tier D → All other + Pos&gt;10M column
                      </p>
                      {renderFundabilityInternalTable()}
                    </div>

                    <div style={{ backgroundColor: "#efebe9", padding: "14px", borderRadius: "8px", borderLeft: "4px solid #8d6e63" }}>
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Score interpretation:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px" }}>
                        {[["91–100%","Highly fundable"],["81–90%","Strong investment case"],["61–80%","Moderate potential"],["41–60%","Basic potential"],["0–40%","Needs development"]].map(([r,l]) => (
                          <li key={r} style={{ marginBottom: "4px" }}><strong>{r}:</strong> {l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Score Breakdown ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}>
                  <span>Score breakdown</span>
                  <ChevronDown size={20} style={{ transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>
                {showScoreBreakdown && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px" }}>
                    {["Financial Strength", "Fundability"].map((group) => {
                      const groupRows = scoreBreakdown.filter((r) =>
                        group === "Fundability" ? r.tier != null : r.name === group
                      );
                      if (!groupRows.length) return null;

                      return (
                        <div key={group} style={{ marginBottom: "16px" }}>
                          {group === "Fundability" && (
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#8d6e63", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", paddingLeft: "4px" }}>
                              Fundability · Tier {fundingTier} — {TIER_LABELS[fundingTier] || "N/A"}
                            </div>
                          )}
                          {groupRows.map((item, i) => (
                            <div key={i} style={{ padding: "12px 15px", background: !item.active ? "#faf5f0" : "white", marginBottom: "6px", borderRadius: "8px", opacity: !item.active ? 0.7 : 1, border: `1px solid ${!item.active ? "#e0d5cf" : "#f0e8e0"}`, position: "relative" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", flex: "1", minWidth: "180px" }}>
                                  <div style={{ backgroundColor: !item.active ? "#ccc" : item.color, width: "12px", height: "12px", borderRadius: "50%", marginRight: "12px", marginTop: "3px", flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontWeight: "600", color: !item.active ? "#aaa" : "#5d4037", fontSize: "14px", marginBottom: "2px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                                      {item.name}
                                      {item.excluded && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#e53935", fontWeight: "400", backgroundColor: "#ffebee", borderRadius: "12px", padding: "2px 8px" }}>
                                          <XCircle size={10} /> excluded
                                        </span>
                                      )}
                                      {!item.excluded && item.reductionNote && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#f57c00", fontWeight: "400", backgroundColor: "#fff3e0", borderRadius: "12px", padding: "2px 8px" }}>
                                          <Info size={10} /> reduced weight
                                        </span>
                                      )}
                                      {item.source && item.source !== "ai" && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "#2e7d32", fontWeight: "400", backgroundColor: "#e8f5e9", borderRadius: "12px", padding: "2px 8px" }}>
                                          📊 {item.source}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
                                      {item.rawScore}/{item.maxScore} × {item.weight}% weight = {!item.active ? "0" : item.weightedScore}%
                                    </div>
                                    {item.exclusionNote && (
                                      <div style={{ fontSize: "11px", color: "#e53935", marginTop: "6px", display: "flex", alignItems: "flex-start", gap: "4px", backgroundColor: "#ffebee", padding: "6px 8px", borderRadius: "6px" }}>
                                        <Info size={12} style={{ flexShrink: 0, marginTop: "1px" }} />
                                        <span>{item.exclusionNote}</span>
                                      </div>
                                    )}
                                    {item.reductionNote && !item.excluded && (
                                      <div style={{ fontSize: "11px", color: "#f57c00", marginTop: "6px", display: "flex", alignItems: "flex-start", gap: "4px", backgroundColor: "#fff3e0", padding: "6px 8px", borderRadius: "6px" }}>
                                        <Info size={12} style={{ flexShrink: 0, marginTop: "1px" }} />
                                        <span>{item.reductionNote}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "100px", justifyContent: "flex-end" }}>
                                  <div style={{ width: "80px", height: "8px", background: "#f3e8dc", borderRadius: "4px", overflow: "hidden", border: "1px solid #d6b88a" }}>
                                    <div style={{ width: `${!item.active ? 0 : item.score}%`, height: "100%", background: !item.active ? "#ccc" : getProgressBarColor(item.score), borderRadius: "4px", transition: "width 0.3s ease" }} />
                                  </div>
                                  <span style={{ fontWeight: "600", color: !item.active ? "#ccc" : "#5d4037", fontSize: "14px", minWidth: "35px", textAlign: "right" }}>
                                    {!item.active ? "—" : `${item.score}%`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Detailed Analysis ── */}
              <div style={{ marginTop: "20px", border: "1px solid #d7ccc8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ backgroundColor: "#8d6e63", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "bold" }}
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}>
                  <span>Detailed analysis</span>
                  <ChevronDown size={20} style={{ transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                </div>
                {showDetailedAnalysis && (
                  <div style={{ backgroundColor: "#f5f2f0", padding: "20px" }}>
                    {aiEvaluationResult ? (
                      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #e8d8cf", maxHeight: "400px", overflowY: "auto" }}>
                        {evaluationTimestamp && (
                          <div style={{ fontSize: "11px", color: "#8d6e63", marginBottom: "12px", textAlign: "right" }}>
                            Evaluated: {evaluationTimestamp}
                          </div>
                        )}
                        {formatAiResult(aiEvaluationResult)}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {fundabilityScore > 90  && <p><strong>Exceptional investment opportunity.</strong> Outstanding fundability across all key criteria.</p>}
                        {fundabilityScore >= 81 && fundabilityScore <= 90 && <p><strong>Very attractive investment case.</strong> Strong fundamentals with minor areas to enhance.</p>}
                        {fundabilityScore >= 61 && fundabilityScore <= 80 && <p><strong>Moderate potential.</strong> Solid foundations but several areas need strengthening.</p>}
                        {fundabilityScore >= 41 && fundabilityScore <= 60 && <p><strong>Basic potential.</strong> Substantial development needed across key areas.</p>}
                        {fundabilityScore <= 40  && <p><strong>Fundamental improvements required.</strong> Significant strengthening needed before pursuing funding.</p>}
                      </div>
                    )}
                    {evaluationError && (
                      <div style={{ marginTop: "15px", padding: "12px", backgroundColor: "#f8d7da", color: "#721c24", border: "1px solid #f5c6cb", borderRadius: "6px", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <AlertCircle size={16} /> {evaluationError}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </>
  );
}