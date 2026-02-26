"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  RefreshCw,
  AlertCircle,
  DollarSign,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { db, auth } from "../../firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { API_KEYS } from "../../API";
import { useApiKey } from "./callapi";
import { useFirebaseFunctions } from "./hooks";
import { getFunctions, httpsCallable } from "firebase/functions";

export function FundabilityScoreCard({
  styles = {},
  profileData,
  onScoreUpdate,
  apiKey,
}) {
  const [showModal, setShowModal] = useState(false);
  const [fundabilityScore, setFundabilityScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState([]);
  const [aiEvaluationResult, setAiEvaluationResult] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [showAboutScore, setShowAboutScore] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  // Additional states for funding application sections
  const [businessPlanAnalysis, setBusinessPlanAnalysis] = useState(null);
  const [pitchDeckAnalysis, setPitchDeckAnalysis] = useState(null);
  const [guaranteesAnalysis, setGuaranteesAnalysis] = useState(null);
  const [creditReportAnalysis, setCreditReportAnalysis] = useState(null);
  const [isFundingDataLoaded, setIsFundingDataLoaded] = useState(false);
  const [triggeredByAuto, setTriggeredByAuto] = useState(false);
  const [name, setName] = useState("");
  const [result, setResult] = useState(null);
  const { callFunction, loading, error } = useFirebaseFunctions();
  const [showFundingSections, setShowFundingSections] = useState(false);
  const [hasAppliedForFunding, setHasAppliedForFunding] = useState(false);
  const [fundingCheckComplete, setFundingCheckComplete] = useState(false);
  const [isReevaluating, setIsReevaluating] = useState(false);

  const handleTestFunction = async () => {
    try {
      const response = await callFunction("helloWorld", { name });
      setResult(response);
    } catch (err) {
      console.error("Function error:", err);
    }
  };

  const checkFundingApplicationStatus = useCallback(async () => {
    if (!auth?.currentUser?.uid || fundingCheckComplete) return;

    try {
      const userId = auth.currentUser.uid;
      const universalRef = doc(db, "universalProfiles", userId);
      const universalSnap = await getDoc(universalRef);

      if (universalSnap.exists()) {
        const data = universalSnap.data();
        const completedSections = data.completedSections || {};

        const requiredFundingSections = [
          "applicationOverview",
          "contactDetails",
          "declarationCommitment",
          "declarationConsent",
          "documentUpload",
          "documents",
          "enterpriseReadiness",
          "entityOverview",
          "financialOverview",
          "growthPotential",
          "guarantees",
          "howDidYouHear",
          "instructions",
          "legalCompliance",
          "ownershipManagement",
          "productsServices",
          "socialImpact",
          "useOfFunds",
        ];

        const fundingApplied = requiredFundingSections.every(
          (section) => completedSections[section] === true
        );

        console.log("✅ Funding application status:", fundingApplied);
        setHasAppliedForFunding(fundingApplied);

        // If user has applied, load funding data immediately
        if (fundingApplied) {
          await fetchFundingApplicationData();
        } else {
          setIsFundingDataLoaded(true);
        }

        setFundingCheckComplete(true);
      }
    } catch (err) {
      console.error("Error checking funding application status:", err);
      setFundingCheckComplete(true);
      setIsFundingDataLoaded(true);
    }
  }, [auth?.currentUser?.uid, fundingCheckComplete]);

  useEffect(() => {
    if (auth?.currentUser?.uid) {
      checkFundingApplicationStatus();
    }
  }, [auth?.currentUser?.uid, checkFundingApplicationStatus]);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [showModal]);
  // Add this function to debug the AI response
  const debugAiResponse = (text) => {
    console.log("🔍 DEBUG AI RESPONSE ANALYSIS");

    // Extract all sections
    const sectionPattern = /###\s+\d+\.\s*([^\n]+)/g;
    const sections = [];
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      sections.push(match[1].trim());
    }
    console.log("📋 All sections found:", sections);

    // Check for funding-related sections specifically
    const fundingKeywords = ["Business Plan", "Pitch Deck", "Credit"];
    fundingKeywords.forEach((keyword) => {
      const found = sections.some((section) => section.includes(keyword));
      console.log(`🔍 ${keyword} section found: ${found ? "YES" : "NO"}`);
    });

    // Check score patterns for each section
    sections.forEach((section, index) => {
      const scorePattern = new RegExp(
        `###\\s+${
          index + 1
        }\\.\\s*${section}[\\s\\S]*?\\*\\*Score:\\*\\*\\s*(\\d)`,
        "i"
      );
      const scoreMatch = text.match(scorePattern);
      console.log(
        `🎯 Section ${index + 1} (${section}): Score = ${
          scoreMatch ? scoreMatch[1] : "NOT FOUND"
        }`
      );
    });
  };

  // Update your fetchFundingApplicationData to be more reliable
  const fetchFundingApplicationData = useCallback(async () => {
    try {
      const userId = auth.currentUser.uid;
      console.log("🔄 Starting to fetch funding application data...");

      let fundingData = {
        businessPlan: null,
        pitchDeck: null,
        creditReport: null,
      };

      let loadedCount = 0;
      const totalSections = 3;

      // Fetch Business Plan Evaluation
      try {
        const bpQuery = query(
          collection(db, "aiEvaluations"),
          where("userId", "==", userId)
        );
        const bpSnapshot = await getDocs(bpQuery);
        if (!bpSnapshot.empty) {
          const bpData = bpSnapshot.docs[0].data();
          fundingData.businessPlan = {
            score: bpData?.evaluation?.score || 0,
            content: bpData?.evaluation?.content || "",
            timestamp: bpData.timestamp,
          };
          loadedCount++;
          console.log("✅ Business plan data loaded");
        } else {
          console.log("❌ No business plan data found");
        }
      } catch (error) {
        console.error("Error loading business plan:", error);
      }

      // Fetch Pitch Deck Evaluation
      try {
        const pdQuery = query(
          collection(db, "aiPitchEvaluations"),
          where("userId", "==", userId)
        );
        const pdSnapshot = await getDocs(pdQuery);
        if (!pdSnapshot.empty) {
          const pdData = pdSnapshot.docs[0].data();
          fundingData.pitchDeck = {
            score: pdData?.evaluation?.score || 0,
            content: pdData?.evaluation?.content || "",
            operationalScore: pdData?.evaluation?.operationalScore || 0,
            timestamp: pdData.timestamp,
          };
          loadedCount++;
          console.log("✅ Pitch deck data loaded");
        } else {
          console.log("❌ No pitch deck data found");
        }
      } catch (error) {
        console.error("Error loading pitch deck:", error);
      }

      // Fetch Credit Report Analysis
      try {
        const creditQuery = query(
          collection(db, "creditAnalyses"),
          where("userId", "==", userId)
        );
        const creditSnapshot = await getDocs(creditQuery);
        if (!creditSnapshot.empty) {
          const creditData = creditSnapshot.docs[0].data();
          fundingData.creditReport = {
            score: creditData?.evaluation?.score || 0,
            content: creditData?.evaluation?.content || "",
            isCreditReport: creditData?.evaluation?.isCreditReport || false,
            label: creditData?.evaluation?.label || "",
            timestamp: creditData.createdAt,
          };
          loadedCount++;
          console.log("✅ Credit report data loaded");
        } else {
          console.log("❌ No credit report data found");
        }
      } catch (error) {
        console.error("Error loading credit report:", error);
      }

      // Update state with all funding data
      setBusinessPlanAnalysis(fundingData.businessPlan);
      setPitchDeckAnalysis(fundingData.pitchDeck);
      setCreditReportAnalysis(fundingData.creditReport);

      // Consider it loaded if we found at least some data
      const isLoaded = loadedCount > 0;
      setIsFundingDataLoaded(isLoaded);

      console.log("🎯 Funding data load complete:", {
        loaded: `${loadedCount}/${totalSections} sections`,
        businessPlan: !!fundingData.businessPlan,
        pitchDeck: !!fundingData.pitchDeck,
        creditReport: !!fundingData.creditReport,
        isFundingDataLoaded: isLoaded,
      });
    } catch (error) {
      console.error("Error fetching funding application data:", error);
      setIsFundingDataLoaded(false);
    }
  }, [auth?.currentUser?.uid]);
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey || isEvaluating || isReevaluating)
      return;

    // Only run automatic re-evaluation when ALL these conditions are met:
    if (hasAppliedForFunding && isFundingDataLoaded && aiEvaluationResult) {
      console.log("💰 Checking if automatic re-evaluation is needed...");

      const checkAndRunReevaluation = async () => {
        try {
          const aiEvalRef = doc(
            db,
            "aiFundabilityEvaluations",
            auth.currentUser.uid
          );
          const aiSnap = await getDoc(aiEvalRef);

          if (aiSnap.exists()) {
            const saved = aiSnap.data();

            // Check if saved evaluation exists but doesn't include funding data
            if (saved.result && saved.includedFundingData === false) {
              console.log(
                "🔄 AUTOMATIC: Funding data now available but previous evaluation doesn't include it"
              );
              console.log(
                "🔄 AUTOMATIC: Running new evaluation with Business Plan, Pitch Deck, and Credit Report"
              );

              setIsReevaluating(true);
              setEvaluationError(
                "Updating analysis with funding application materials..."
              );

              // Run the new evaluation automatically
              await runAiEvaluation(auth.currentUser.uid);

              setIsReevaluating(false);
              setEvaluationError("");
            }
          }
        } catch (error) {
          console.error("Error during automatic re-evaluation:", error);
          setIsReevaluating(false);
          setEvaluationError("Failed to update analysis with funding data");
        }
      };

      checkAndRunReevaluation();
    }
  }, [
    hasAppliedForFunding,
    isFundingDataLoaded,
    aiEvaluationResult,
    auth?.currentUser?.uid,
    apiKey,
    isEvaluating,
    isReevaluating,
  ]);

  // Update the score calculation to include funding application sections
  useEffect(() => {
    if (profileData && aiEvaluationResult) {
      // Only calculate score if funding data is loaded (when applicable)
      if (hasAppliedForFunding && !isFundingDataLoaded) {
        console.log("⏳ Waiting for funding data before calculating score...");
        return;
      }

      console.log("🔄 Calculating fundability score with:", {
        hasAppliedForFunding,
        isFundingDataLoaded,
        businessPlan: !!businessPlanAnalysis,
        pitchDeck: !!pitchDeckAnalysis,
        creditReport: !!creditReportAnalysis,
      });

      const result = calculateFundabilityScore(profileData, aiEvaluationResult);
      setFundabilityScore(result.totalScore);
      setScoreBreakdown(result.breakdown);
      if (onScoreUpdate) onScoreUpdate(result.totalScore);
    }
  }, [
    profileData,
    aiEvaluationResult,
    onScoreUpdate,
    businessPlanAnalysis,
    pitchDeckAnalysis,
    creditReportAnalysis,
    hasAppliedForFunding,
    isFundingDataLoaded,
  ]);

  const parseAiEvaluationScores = (text) => {
    console.log("🔍 Parsing AI evaluation text for scores...");

    const baseCategories = {
      financialReadiness: ["Financial Readiness"],
      financialStrength: ["Financial Strength"],
      operations: ["Operational Strength"],
      impact: ["Impact Proof"],
    };

    // Conditionally add funding categories - use EXACT section names from AI response
    const fundingCategories = hasAppliedForFunding
      ? {
          businessPlanAnalysis: ["Business Plan Quality"],
          pitchDeckScore: ["Pitch Deck Effectiveness"],
          creditReport: ["Creditworthiness"],
        }
      : {};

    const allCategories = { ...baseCategories, ...fundingCategories };
    const scores = {};

    Object.entries(allCategories).forEach(([key, labels]) => {
      let foundScore = 0;

      console.log(`🔍 Looking for score for ${key} with labels:`, labels);

      for (const label of labels) {
        // Enhanced patterns that match the EXACT format from your AI response
        const patterns = [
          // Primary pattern: ### 1. Financial Readiness\n**Score:** 5
          new RegExp(
            `###\\s+\\d+\\.\\s*${label}[\\s\\S]*?\\*\\*Score:\\*\\*\\s*(\\d)`,
            "i"
          ),
          // Alternative pattern: **Score:** 5 (anywhere after the section header)
          new RegExp(`${label}[\\s\\S]*?\\*\\*Score:\\*\\*\\s*(\\d)`, "i"),
          // Fallback pattern: Score: 5 (without bold)
          new RegExp(`${label}[\\s\\S]*?Score:\\s*(\\d)`, "i"),
        ];

        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            foundScore = Number.parseInt(match[1]);
            console.log(
              `✅ Found score for ${key} (${label}): ${foundScore} using pattern`
            );
            break;
          }
        }
        if (foundScore > 0) break;
      }

      // If no score found for funding categories, they might not be in the response
      if (
        foundScore === 0 &&
        hasAppliedForFunding &&
        ["businessPlanAnalysis", "pitchDeckScore", "creditReport"].includes(key)
      ) {
        console.log(
          `⚠️ Funding category ${key} score not found - section may be missing from AI response`
        );
      }

      scores[key] = Math.min(Math.max(foundScore, 0), 5);
    });

    console.log("🎯 Final parsed AI scores:", scores);
    return scores;
  };

  // Add this comprehensive debug function
  const debugFullAiResponse = (text) => {
    console.log("🔍 COMPREHENSIVE AI RESPONSE DEBUG");
    console.log("Full AI Response:", text);

    // Extract all sections with their full content
    const sectionPattern =
      /###\s+\d+\.\s*([^\n]+)([\s\S]*?)(?=###\s+\d+\.|###\s+Overall Assessment|$)/g;
    const sections = [];
    let match;

    while ((match = sectionPattern.exec(text)) !== null) {
      const sectionTitle = match[1].trim();
      const sectionContent = match[2].trim();
      sections.push({
        title: sectionTitle,
        content: sectionContent,
      });
    }

    console.log("📋 All sections with content:", sections);

    // Check specifically for funding sections
    sections.forEach((section, index) => {
      const scoreMatch = section.content.match(/\*\*Score:\*\*\s*(\d)/);
      console.log(
        `🎯 Section ${index + 1}: "${section.title}" - Score: ${
          scoreMatch ? scoreMatch[1] : "NOT FOUND"
        }`
      );
    });

    // Look for any mention of funding-related terms
    const fundingTerms = ["Business Plan", "Pitch Deck", "Credit"];
    fundingTerms.forEach((term) => {
      const found = text.includes(term);
      console.log(
        `🔍 "${term}" mentioned in response: ${found ? "YES" : "NO"}`
      );
    });
  };
  // Updated progress bar color function with new color scheme
  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20"; // Dark green
    if (score >= 81) return "#4CAF50"; // Green
    if (score >= 61) return "#FF9800"; // Orange
    if (score >= 41) return "#F44336"; // Red
    return "#B71C1C"; // Dark red
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

  // Update the weightings to properly handle conditional sections
  const weightingsByStage = {
    "pre-seed": {
      financialReadiness: hasAppliedForFunding ? 20 : 25,
      financialStrength: hasAppliedForFunding ? 10 : 10,
      operations: hasAppliedForFunding ? 30 : 40,
      impact: hasAppliedForFunding ? 20 : 25,
      // Add funding application sections with their weights
      ...(hasAppliedForFunding && {
        businessPlanAnalysis: 10,
        pitchDeckScore: 10,
        creditReport: 10,
      }),
    },
    seed: {
      financialReadiness: hasAppliedForFunding ? 20 : 25,
      financialStrength: hasAppliedForFunding ? 15 : 20,
      operations: hasAppliedForFunding ? 25 : 35,
      impact: hasAppliedForFunding ? 15 : 20,
      ...(hasAppliedForFunding && {
        businessPlanAnalysis: 10,
        pitchDeckScore: 10,
        creditReport: 5,
      }),
    },
    seriesa: {
      financialReadiness: hasAppliedForFunding ? 20 : 25,
      financialStrength: hasAppliedForFunding ? 25 : 35,
      operations: hasAppliedForFunding ? 20 : 30,
      impact: hasAppliedForFunding ? 5 : 10,
      ...(hasAppliedForFunding && {
        businessPlanAnalysis: 10,
        pitchDeckScore: 10,
        creditReport: 10,
      }),
    },
    seriesb: {
      financialReadiness: hasAppliedForFunding ? 15 : 20,
      financialStrength: hasAppliedForFunding ? 30 : 40,
      operations: hasAppliedForFunding ? 20 : 30,
      impact: hasAppliedForFunding ? 5 : 10,
      ...(hasAppliedForFunding && {
        businessPlanAnalysis: 10,
        pitchDeckScore: 10,
        creditReport: 10,
      }),
    },
    growth: {
      financialReadiness: hasAppliedForFunding ? 15 : 20,
      financialStrength: hasAppliedForFunding ? 35 : 45,
      operations: hasAppliedForFunding ? 20 : 30,
      impact: hasAppliedForFunding ? 0 : 5,
      ...(hasAppliedForFunding && {
        businessPlanAnalysis: 10,
        pitchDeckScore: 10,
        creditReport: 10,
      }),
    },
    maturity: {
      financialReadiness: hasAppliedForFunding ? 10 : 15,
      financialStrength: hasAppliedForFunding ? 45 : 55,
      operations: hasAppliedForFunding ? 15 : 25,
      impact: hasAppliedForFunding ? 0 : 5,
      ...(hasAppliedForFunding && {
        businessPlanAnalysis: 10,
        pitchDeckScore: 10,
        creditReport: 10,
      }),
    },
  };

  // Verification function to ensure all weightings sum to 100%
  const verifyWeightings = () => {
    Object.entries(weightingsByStage).forEach(([stage, weights]) => {
      const total = Object.values(weights).reduce(
        (sum, weight) => sum + weight,
        0
      );
      console.log(`${stage}: ${total}% (${total === 100 ? "✓" : "✗"})`);
    });
  };

  // Call verification
  verifyWeightings();

  const categoryNames = {
    financialReadiness: "Financial readiness",
    financialStrength: "Financial strength",
    operations: "Operational strength",
    impact: "Impact proof",
    ...(hasAppliedForFunding && {
      businessPlanAnalysis: "Business Plan",
      pitchDeckScore: "Pitch Deck",
      creditReport: "Credit Report",
    }),
  };

  const calculateFundabilityScore = (data, aiEvaluationResult = "") => {
    console.log(
      "Calculating fundability score with AI result:",
      !!aiEvaluationResult
    );
    const stage = mapStageToCategory(
      data?.entityOverview?.operationStage || "Not provided"
    );
    const weightings = weightingsByStage[stage];
    const aiScores = aiEvaluationResult
      ? parseAiEvaluationScores(aiEvaluationResult)
      : {};
    console.log("AI scores extracted:", aiScores);

    // 🔥 ADD THIS: If funding scores are missing but should be there, set defaults
    if (hasAppliedForFunding) {
      if (aiScores.businessPlanAnalysis === undefined) {
        console.log("⚠️ Business Plan score missing, using default");
        aiScores.businessPlanAnalysis = 0;
      }
      if (aiScores.pitchDeckScore === undefined) {
        console.log("⚠️ Pitch Deck score missing, using default");
        aiScores.pitchDeckScore = 0;
      }
      if (aiScores.creditReport === undefined) {
        console.log("⚠️ Credit Report score missing, using default");
        aiScores.creditReport = 0;
      }
    }

    const categoryMappings = {
      financialReadiness: "Financial readiness",
      financialStrength: "Financial strength",
      operations: "Operational strength",
      impact: "Impact proof",
    };

    // Add funding application categories if user has applied
    if (hasAppliedForFunding) {
      categoryMappings.businessPlanAnalysis = "Business Plan";
      categoryMappings.pitchDeckScore = "Pitch Deck";
      categoryMappings.creditReport = "Credit Report";
    }

    const colors = [
      "#8D6E63",
      "#6D4C41",
      "#A67C52",
      "#D7CCC8",
      "#4E342E",
      "#795548",
      "#5D4037",
      "#3E2723",
    ];

    const breakdown = Object.entries(categoryMappings).map(
      ([key, label], i) => {
        let percent = 0;
        let weight = weightings[key] || 0;
        let rawScore = 0;
        let maxScore = 5;

        if (
          hasAppliedForFunding &&
          ["businessPlanAnalysis", "pitchDeckScore", "creditReport"].includes(
            key
          )
        ) {
          // Handle funding application specific scores
          switch (key) {
            case "businessPlanAnalysis":
              if (businessPlanAnalysis?.score) {
                rawScore = (businessPlanAnalysis.score / 100) * 5;
                percent = (rawScore / 5) * 100;
              }
              break;
            case "pitchDeckScore":
              if (pitchDeckAnalysis?.score) {
                rawScore = (pitchDeckAnalysis.score / 100) * 5;
                percent = (rawScore / 5) * 100;
              } else if (pitchDeckAnalysis?.operationalScore) {
                rawScore = pitchDeckAnalysis.operationalScore;
                percent = (rawScore / 5) * 100;
              }
              break;
            case "creditReport":
              if (creditReportAnalysis?.score) {
                const scoreOutOf850 = creditReportAnalysis.score;
                percent = (scoreOutOf850 / 850) * 100;
                rawScore = (percent / 100) * 5;
              }
              break;
          }
        } else {
          // Original scoring logic for non-funding categories
          const aiRaw = aiScores?.[key] ?? 0;
          percent = aiRaw > 0 ? (aiRaw / 5) * 100 : 0;
          rawScore = aiRaw;
        }

        // Calculate weighted contribution
        const weightedContribution = (percent / 100) * weight;

        return {
          name: label,
          score: Math.round(percent),
          weight: weight,
          weightedScore: Math.round(weightedContribution),
          color: colors[i] || "#8D6E63",
          rawScore: Math.round(rawScore * 10) / 10,
          maxScore: maxScore,
        };
      }
    );

    // Sum the weighted contributions for final score
    const totalScore = Math.round(
      breakdown.reduce((sum, item) => sum + (item.weightedScore || 0), 0)
    );

    console.log("Final calculated score:", totalScore);

    return {
      totalScore: Math.min(
        Math.max(isNaN(totalScore) ? 0 : totalScore, 0),
        100
      ),
      breakdown,
    };
  };

  const sendMessageToChatGPT = async (message) => {
    try {
      const result = await callFunction("generateFundabilityAnalysis", {
        prompt: message,
        // optional: model, max_tokens, temperature
      });
      return result?.content || "";
    } catch (error) {
      console.error("ChatGPT API Error (via functions):", error);
      throw error;
    }
  };

  // Debug useEffect to check data availability
  useEffect(() => {
    console.log("Data availability check:", {
      hasAppliedForFunding,
      businessPlanAnalysis: !!businessPlanAnalysis,
      pitchDeckAnalysis: !!pitchDeckAnalysis,
      creditReportAnalysis: !!creditReportAnalysis,
      aiEvaluationResult: !!aiEvaluationResult,
      profileData: !!profileData,
    });
  }, [
    hasAppliedForFunding,
    businessPlanAnalysis,
    pitchDeckAnalysis,
    creditReportAnalysis,
    aiEvaluationResult,
    profileData,
  ]);

  const prepareDataForEvaluation = async (data) => {
    console.log("🔍 Preparing evaluation data with funding status:", {
      hasAppliedForFunding,
      isFundingDataLoaded,
      businessPlan: !!businessPlanAnalysis,
      pitchDeck: !!pitchDeckAnalysis,
      creditReport: !!creditReportAnalysis,
    });

    let evaluationData = "";

    // Financial Readiness
    evaluationData += `\n=== FINANCIAL READINESS ===\n`;
    evaluationData += `Accounting/ERP System: ${
      data?.financialOverview?.hasAccountingSoftware || "Not specified"
    }\n`;
    evaluationData += `Books Up-to-Date: ${
      data?.financialOverview?.booksUpToDate ? "Yes" : "Not confirmed"
    }\n`;
    evaluationData += `Tax Number: ${
      data?.legalCompliance?.taxNumber ? "Compliant" : "Not confirmed"
    }\n`;
    evaluationData += `VAT Number: ${
      data?.legalCompliance?.vatNumber ? "Compliant" : "Not confirmed"
    }\n`;
    evaluationData += `Financial Statements: ${
      data?.fundingDocuments?.financialStatements?.length > 0
        ? "Available"
        : "Not provided"
    }\n`;

    // Financial Strength
    evaluationData += `\n=== FINANCIAL STRENGTH ===\n`;
    evaluationData += `Annual Revenue: ${
      data?.financialOverview?.annualRevenue || "Not provided"
    }\n`;
    try {
      const userId = auth.currentUser?.uid;
      const finRef = doc(db, "aiFinancialEvaluations", userId);
      const finSnap = await getDoc(finRef);
      const revenueData = finSnap.exists() ? finSnap.data() : null;
      if (revenueData?.evaluation?.score) {
        evaluationData += `\n--- REVENUE GROWTH ANALYSIS ---\n`;
        evaluationData += `Score: ${revenueData.evaluation.score} out of 5\n`;
        evaluationData += `Summary: ${
          revenueData.evaluation.summary || "No summary available"
        }\n`;
      }
    } catch (err) {
      console.error("Error loading revenue growth evaluation:", err);
    }
    evaluationData += `Profitability: ${
      data?.financialOverview?.profitabilityStatus || "No"
    }\n`;
    evaluationData += `Financials: ${
      data?.enterpriseReadiness?.hasFinancials || "No"
    }\n`;
    evaluationData += `Audited financials: ${
      data?.enterpriseReadiness?.hasAuditedFinancials || "No"
    }\n`;

    // Operations
    evaluationData += `\n=== OPERATIONAL STRENGTH ===\n`;
    evaluationData += `Processes documented: ${
      data?.operations?.processesDocumented || "Not specified"
    }\n`;
    evaluationData += `Team size: ${data?.operations?.teamSize ?? "Unknown"}\n`;
    evaluationData += `Infrastructure notes: ${
      data?.operations?.infrastructure || "Not specified"
    }\n`;
    evaluationData += `Supply/Delivery capacity: ${
      data?.operations?.capacity || "Not specified"
    }\n`;

    // Impact Proof
    evaluationData += `\n=== IMPACT PROOF ===\n`;
    evaluationData += `\n-- Job Creation --\n`;
    evaluationData += `Planned jobs to be created: ${
      data?.socialImpact?.jobsToCreate || 0
    }\n`;
    evaluationData += `Local employees to be hired: ${
      data?.socialImpact?.localEmployeesHired || 0
    }\n`;
    evaluationData += `\n-- HDG Impact (Youth, Women, Disability) --\n`;
    evaluationData += `% Black ownership: ${
      data?.socialImpact?.blackOwnership || 0
    }%\n`;
    evaluationData += `% Women ownership: ${
      data?.socialImpact?.womenOwnership || 0
    }%\n`;
    evaluationData += `% Youth ownership: ${
      data?.socialImpact?.youthOwnership || 0
    }%\n`;
    evaluationData += `% Disabled ownership: ${
      data?.socialImpact?.disabledOwnership || 0
    }%\n`;
    evaluationData += `\n-- Environmental Responsibility --\n`;
    evaluationData += `Environmental impact: ${
      data?.socialImpact?.environmentalImpact || "Not specified"
    }\n`;
    evaluationData += `SDG/ESD alignment: ${
      data?.socialImpact?.sdgAlignment || "Not specified"
    }\n`;
    evaluationData += `\n-- CSR/CSI Investment --\n`;
    evaluationData += `CSI/CSR Spend: ${
      data?.socialImpact?.csiCsrSpend || "R 0"
    }\n`;
    evaluationData += `Community investment amount: ${
      data?.socialImpact?.communityInvestmentAmount || "R 0"
    }\n`;
    evaluationData += `Number of beneficiaries: ${
      data?.socialImpact?.numberOfBeneficiaries || 0
    }\n`;
    evaluationData += `Focus areas: ${
      data?.socialImpact?.csrFocusAreas || "Not specified"
    }\n`;
    evaluationData += `Investment description: ${
      data?.socialImpact?.socialInvestmentCommunities || "Not specified"
    }\n`;
    evaluationData += `\n-- Local Value Creation --\n`;
    evaluationData += `Local procurement spend: ${
      data?.socialImpact?.localProcurementSpend || "R 0"
    }\n`;
    evaluationData += `Strategy for local value: ${
      data?.socialImpact?.localValueStrategy || "Not specified"
    }\n`;

    if (hasAppliedForFunding && isFundingDataLoaded) {
      console.log("✅ Adding funding application sections to evaluation");

      // Log exactly what's being sent to AI
      console.log(
        "📤 Sending to AI - Business Plan:",
        businessPlanAnalysis?.content?.substring(0, 100) + "..."
      );
      console.log(
        "📤 Sending to AI - Pitch Deck:",
        pitchDeckAnalysis?.content?.substring(0, 100) + "..."
      );
      console.log(
        "📤 Sending to AI - Credit Report:",
        creditReportAnalysis?.content?.substring(0, 100) + "..."
      );
    }
    if (hasAppliedForFunding && isFundingDataLoaded) {
      console.log("✅ Adding funding application sections to evaluation");
      evaluationData += `\n=== FUNDING APPLICATION MATERIALS ===\n`;

      // Business Plan Analysis
      if (businessPlanAnalysis?.content) {
        evaluationData += `\n--- BUSINESS PLAN ANALYSIS ---\n`;
        evaluationData += `Previous AI Score: ${businessPlanAnalysis.score}/100\n`;
        evaluationData += `Analysis Summary:\n${businessPlanAnalysis.content}\n`;
        evaluationData += `\nCONVERT TO 0-5 SCALE: Divide the score by 20 to get the rating out of 5.\n`;
      } else {
        console.log("⚠️ No business plan content found");
        evaluationData += `\n--- BUSINESS PLAN ANALYSIS ---\n`;
        evaluationData += `Status: Not submitted or not yet analyzed\n`;
        evaluationData += `Score: 0/5 (No business plan provided)\n`;
      }

      // Pitch Deck Analysis
      if (pitchDeckAnalysis?.content) {
        evaluationData += `\n--- PITCH DECK ANALYSIS ---\n`;
        evaluationData += `Previous AI Score: ${
          pitchDeckAnalysis.score || pitchDeckAnalysis.operationalScore
        }/100\n`;
        evaluationData += `Analysis Summary:\n${pitchDeckAnalysis.content}\n`;
        evaluationData += `\nCONVERT TO 0-5 SCALE: Divide the score by 20 to get the rating out of 5.\n`;
      } else {
        console.log("⚠️ No pitch deck content found");
        evaluationData += `\n--- PITCH DECK ANALYSIS ---\n`;
        evaluationData += `Status: Not submitted or not yet analyzed\n`;
        evaluationData += `Score: 0/5 (No pitch deck provided)\n`;
      }

      // Credit Report Analysis
      if (creditReportAnalysis?.content) {
        evaluationData += `\n--- CREDIT REPORT ANALYSIS ---\n`;
        evaluationData += `Credit Score: ${creditReportAnalysis.score}/850\n`;
        evaluationData += `Analysis Summary:\n${creditReportAnalysis.content}\n`;
        evaluationData += `\nCONVERT TO 0-5 SCALE using these ranges:\n`;
        evaluationData += `750-850 = 5/5 | 650-749 = 4/5 | 550-649 = 3/5 | 450-549 = 2/5 | Below 450 = 1/5\n`;
      } else {
        console.log("⚠️ No credit report content found");
        evaluationData += `\n--- CREDIT REPORT ANALYSIS ---\n`;
        evaluationData += `Status: Not submitted or not yet analyzed\n`;
        evaluationData += `Score: 0/5 (No credit report provided)\n`;
      }
    } else {
      console.log("❌ Funding sections not included:", {
        hasAppliedForFunding,
        isFundingDataLoaded,
      });
    }

    console.log(
      "📝 Final evaluation data preview:",
      evaluationData.substring(0, 500)
    );
    return evaluationData;
  };

  const runAiEvaluation = async (userId) => {
    if (!apiKey?.trim()) {
      setEvaluationError("OpenAI API key not configured.");
      return;
    }

    if (!profileData) {
      setEvaluationError("No profile data available for evaluation.");
      return;
    }

    // 🔥 CRITICAL FIX: Properly wait for funding data
    if (hasAppliedForFunding && !isFundingDataLoaded) {
      console.log(
        "⏳ User has applied for funding but data not loaded. Waiting..."
      );
      setEvaluationError("Loading funding application data... Please wait.");

      // Wait for funding data with timeout
      const maxWaitTime = 10000; // 10 seconds
      const startTime = Date.now();

      while (!isFundingDataLoaded && Date.now() - startTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("⏳ Still waiting for funding data...");
      }

      if (!isFundingDataLoaded) {
        setEvaluationError("Funding data loading timeout. Please try again.");
        return;
      }
    }

    console.log("🚀 Starting AI Evaluation with funding status:", {
      hasAppliedForFunding,
      isFundingDataLoaded,
      businessPlan: !!businessPlanAnalysis,
      pitchDeck: !!pitchDeckAnalysis,
      creditReport: !!creditReportAnalysis,
    });

    setIsEvaluating(true);
    setEvaluationError("");

    try {
      const evaluationData = await prepareDataForEvaluation(profileData);

      console.log(
        "📊 Evaluation data prepared, length:",
        evaluationData.length
      );

      // Build dynamic categories
      const baseCategories = `
1. Financial Readiness - Accounting systems, compliance, up-to-date records
2. Financial Strength - Revenue growth, profitability, growth metric, audited financials
3. Operational Strength - Processes, infrastructure, operational maturity
4. Impact Proof - Job creation, HDG inclusion, environmental responsibility, CSR`;

      const fundingCategories = hasAppliedForFunding
        ? `
5. Business Plan Quality - Comprehensive business strategy, market analysis, financial projections
6. Pitch Deck Effectiveness - Investor presentation quality, storytelling, value proposition clarity
7. Creditworthiness - Credit report analysis, financial reliability, payment history`
        : "";

      const totalCategories = hasAppliedForFunding ? 7 : 4;

      console.log(`📋 Evaluating ${totalCategories} categories`);

      const combinedMessage = `Evaluate the fundability of the following business using the BIG Fundability Scorecard rubric.

CRITICAL INSTRUCTION: You MUST evaluate ALL ${totalCategories} categories listed below. Do not skip any categories.

${
  hasAppliedForFunding
    ? `
⚠️ IMPORTANT: This business HAS APPLIED FOR FUNDING. 
You MUST include sections 5, 6, and 7 in your analysis:
- Section 5: Business Plan Quality
- Section 6: Pitch Deck Effectiveness  
- Section 7: Creditworthiness

These sections have pre-existing analysis data provided in the input. Use that data to inform your scores.
`
    : ""
}

FORMATTING REQUIREMENTS:
- Use clear section headers with ###
- Provide specific, actionable improvement recommendations for EACH category
- Keep rationale concise but insightful

Instructions:
- Score each of the ${totalCategories} categories from 0 to 5:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding

Categories to evaluate (YOU MUST INCLUDE ALL ${totalCategories}):
${baseCategories}${fundingCategories}

Input Data:
${evaluationData}

OUTPUT FORMAT - YOU MUST FOLLOW THIS EXACTLY:
### 1. Financial Readiness
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]

### 2. Financial Strength
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]

### 3. Operational Strength
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]

### 4. Impact Proof
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]
${
  hasAppliedForFunding
    ? `
### 5. Business Plan Quality
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]

### 6. Pitch Deck Effectiveness
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]

### 7. Creditworthiness
**Score:** [0-5]
**Rationale:** [explanation]
**How to Improve:** 
- [action 1]
- [action 2]
- [action 3]
`
    : ""
}

### Overall Assessment
**Final Analysis:** [Brief overall assessment]`;

      console.log("📤 Sending prompt to AI");
      const result = await sendMessageToChatGPT(combinedMessage);
      console.log("📥 Received AI result, length:", result.length);

      setAiEvaluationResult(result);
      setShowDetailedAnalysis(true);
      return result;
    } catch (error) {
      console.error("AI Evaluation error:", error);
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    try {
      // If user has applied for funding, ensure data is loaded first
      if (hasAppliedForFunding) {
        console.log(
          "Ensuring funding application data is loaded before evaluation..."
        );
        // You could add a check here to wait for the funding data to be loaded
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const aiEvalRef = doc(db, "aiFundabilityEvaluations", userId);
      const aiSnap = await getDoc(aiEvalRef);

      if (aiSnap.exists()) {
        const saved = aiSnap.data();
        if (saved.result) {
          console.log("Refreshing AI evaluation result");
          setAiEvaluationResult(saved.result);
          return;
        }
      }

      // If no saved result, run new evaluation
      console.log("No saved result found, running new evaluation");
      await runAiEvaluation();
    } catch (error) {
      console.error("Error refreshing AI evaluation:", error);
      setEvaluationError(`Failed to refresh evaluation: ${error.message}`);
    }
  };

  const renderFundingApplicationSections = () => {
    if (!hasAppliedForFunding) return null;

    return (
      <div
        style={{
          marginTop: "20px",
          border: "1px solid #d7ccc8",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: "#8d6e63",
            color: "white",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => setShowFundingSections(!showFundingSections)}
        >
          <span>Funding Application Analysis</span>
          <ChevronDown
            size={20}
            style={{
              transform: showFundingSections
                ? "rotate(180deg)"
                : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>

        {showFundingSections && (
          <div
            style={{
              backgroundColor: "#f5f2f0",
              padding: "20px",
              color: "#5d4037",
            }}
          >
            {/* Business Plan Analysis */}
            {businessPlanAnalysis?.content && (
              <div style={{ marginBottom: "15px" }}>
                <h5 style={{ color: "#5d4037", marginBottom: "8px" }}>
                  Business Plan Analysis
                </h5>
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e8d8cf",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {businessPlanAnalysis.content}
                </div>
              </div>
            )}

            {/* Pitch Deck Analysis */}
            {pitchDeckAnalysis?.content && (
              <div style={{ marginBottom: "15px" }}>
                <h5 style={{ color: "#5d4037", marginBottom: "8px" }}>
                  Pitch Deck Analysis
                </h5>
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e8d8cf",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {pitchDeckAnalysis.content}
                </div>
              </div>
            )}

            {/* Credit Report Analysis */}
            {creditReportAnalysis?.content && (
              <div style={{ marginBottom: "15px" }}>
                <h5 style={{ color: "#5d4037", marginBottom: "8px" }}>
                  Credit Report Analysis
                </h5>
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e8d8cf",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {creditReportAnalysis.content}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }; // 🔥 UPDATE your Firebase listener to handle initial evaluation properly
  useEffect(() => {
    if (!auth?.currentUser?.uid || !apiKey) {
      console.log("⏳ Waiting for auth or API key...");
      return;
    }

    console.log("✅ Setting up Firebase listeners with funding status:", {
      hasAppliedForFunding,
      isFundingDataLoaded,
      fundingCheckComplete,
    });

    const docRef = doc(db, "universalProfiles", auth.currentUser.uid);
    const aiEvalRef = doc(db, "aiFundabilityEvaluations", auth.currentUser.uid);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // ✅ Trigger Fundability AI Evaluation
        if (data.triggerFundabilityEvaluation === true && !isEvaluating) {
          console.log(
            "🎯 Trigger detected: Running fundability AI evaluation..."
          );

          // 🔥 CRITICAL: Wait for ALL prerequisites
          if (!fundingCheckComplete) {
            console.log("⏳ Waiting for funding check to complete...");
            setEvaluationError("Determining funding application status...");

            // Wait for funding check to complete
            const maxWaitTime = 15000;
            const startTime = Date.now();

            while (
              !fundingCheckComplete &&
              Date.now() - startTime < maxWaitTime
            ) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            if (!fundingCheckComplete) {
              console.log("❌ Funding check timeout");
              await updateDoc(docRef, { triggerFundabilityEvaluation: false });
              setEvaluationError(
                "Funding status check timeout. Please try again."
              );
              return;
            }
          }

          // 🔥 Wait for funding data if user has applied
          if (hasAppliedForFunding && !isFundingDataLoaded) {
            console.log(
              "⏳ User has applied for funding, waiting for funding data..."
            );
            setEvaluationError("Loading funding application data...");

            const maxWaitTime = 15000;
            const startTime = Date.now();

            while (
              hasAppliedForFunding &&
              !isFundingDataLoaded &&
              Date.now() - startTime < maxWaitTime
            ) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            if (hasAppliedForFunding && !isFundingDataLoaded) {
              console.log("❌ Funding data loading timeout");
              await updateDoc(docRef, { triggerFundabilityEvaluation: false });
              setEvaluationError(
                "Funding data loading timeout. Please try again."
              );
              return;
            }
          }

          console.log("✅ All prerequisites met. Running evaluation NOW!");
          console.log("Final state:", {
            hasAppliedForFunding,
            isFundingDataLoaded,
            businessPlan: !!businessPlanAnalysis,
            pitchDeck: !!pitchDeckAnalysis,
            creditReport: !!creditReportAnalysis,
          });

          setTriggeredByAuto(true);
          const result = await runAiEvaluation(auth.currentUser.uid);
          await updateDoc(docRef, { triggerFundabilityEvaluation: false });

          // Save result to Firestore
          await updateDoc(aiEvalRef, {
            result,
            timestamp: new Date(),
            profileSnapshot: profileData,
            includedFundingData: hasAppliedForFunding,
          }).catch(async () => {
            await setDoc(aiEvalRef, {
              result,
              timestamp: new Date(),
              profileSnapshot: profileData,
              includedFundingData: hasAppliedForFunding,
            });
          });

          setAiEvaluationResult(result);
          setShowDetailedAnalysis(true);
        }
      }

      // ✅ Load saved AI result - WITH IMPROVED LOGIC
      try {
        const aiSnap = await getDoc(aiEvalRef);
        if (aiSnap.exists()) {
          const saved = aiSnap.data();
          if (saved.result) {
            console.log("📄 Found saved AI evaluation result");
            console.log("Saved funding status:", saved.includedFundingData);
            console.log("Current funding status:", hasAppliedForFunding);

            // 🔥 IMPROVED LOGIC: Load the saved result but track if we need to re-evaluate
            const shouldLoadSavedResult = true; // Always load to show something

            if (shouldLoadSavedResult) {
              console.log("✅ Loading saved result");
              setAiEvaluationResult(saved.result);

              // 🔥 NEW: If funding status doesn't match, the automatic re-evaluation useEffect will handle it
              if (hasAppliedForFunding && saved.includedFundingData === false) {
                console.log(
                  "⚠️ Saved result doesn't include funding data, but automatic re-evaluation will handle this"
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading saved AI evaluation:", error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    auth?.currentUser?.uid,
    apiKey,
    isEvaluating,
    hasAppliedForFunding,
    isFundingDataLoaded,
    fundingCheckComplete,
    profileData,
  ]);
  // const forceRefreshWithFundingData = async () => {
  //   if (!auth?.currentUser?.uid) return;

  //   console.log("🔄 Running new evaluation with current funding data...");

  //   // Just run the evaluation - it will automatically save over the old one
  //   await runAiEvaluation(auth.currentUser.uid);
  // };

  // Updated score levels with new color scheme
  const getScoreLevel = (score) => {
    if (score > 90)
      return { level: "Highly fundable", color: "#1B5E20", icon: CheckCircle };
    if (score >= 81)
      return {
        level: "Strong investment case",
        color: "#4CAF50",
        icon: CheckCircle,
      };
    if (score >= 61)
      return {
        level: "Moderate potential",
        color: "#FF9800",
        icon: TrendingUp,
      };
    if (score >= 41)
      return { level: "Basic potential", color: "#F44336", icon: AlertCircle };
    return { level: "Needs development", color: "#B71C1C", icon: AlertCircle };
  };

  const scoreLevel = getScoreLevel(fundabilityScore);
  const ScoreIcon = scoreLevel.icon;

  // Helper function to format AI result into sections
  const formatAiResult = (text) => {
    if (!text) return null;

    const cleanedResult = text.replace(/\*\*(.*?)\*\*/g, "$1");

    // Split by major sections (### headers)
    const sections = cleanedResult.split(/(?=###\s)/g);

    return sections
      .map((section, index) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        // Check if this is a category section with "How to Improve"
        const isCategorySection = /^###\s+\d+\./.test(trimmed);

        if (isCategorySection) {
          // Split the category section into parts
          const lines = trimmed.split("\n").filter((line) => line.trim());
          const header = lines[0];
          const content = lines.slice(1).join("\n");

          // Extract improvement section with special styling
          const improvementIndex = content
            .toLowerCase()
            .indexOf("how to improve");
          let mainContent = content;
          let improvementContent = "";

          if (improvementIndex !== -1) {
            mainContent = content.substring(0, improvementIndex);
            improvementContent = content.substring(improvementIndex);
          }

          return (
            <div
              key={index}
              style={{
                marginBottom: "20px",
                border: "1px solid #e8d8cf",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  backgroundColor: "#8d6e63",
                  color: "white",
                  padding: "12px 16px",
                  fontWeight: "bold",
                }}
              >
                {header.replace("###", "").trim()}
              </div>

              {/* Main Content */}
              <div style={{ padding: "16px", backgroundColor: "white" }}>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.6",
                    color: "#5d4037",
                    marginBottom: improvementContent ? "15px" : "0",
                  }}
                >
                  {mainContent}
                </div>

                {/* Improvement Section with Special Styling */}
                {improvementContent && (
                  <div
                    style={{
                      backgroundColor: "#f8f4f0",
                      padding: "15px",
                      borderRadius: "6px",
                      borderLeft: "4px solid #ff9800",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#5d4037",
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <TrendingUp size={16} />
                      Improvement Actions
                    </div>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6",
                        color: "#6d4c41",
                        fontSize: "14px",
                      }}
                    >
                      {improvementContent.replace("How to Improve:", "").trim()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Regular section formatting (for overall assessment, etc.)
        return (
          <div key={index} style={{ marginBottom: "15px" }}>
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#6d4c41",
                whiteSpace: "pre-wrap",
                backgroundColor: "white",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e8d8cf",
              }}
            >
              {trimmed}
            </div>
          </div>
        );
      })
      .filter(Boolean);
  };

  return (
    <>
      {/* Enhanced Outside Card Design */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(141, 110, 99, 0.15)",
          border: "1px solid #e8ddd6",
          overflow: "hidden",
          position: "relative",
          width: "100%", // Add this line to make it full width
          minWidth: "210px", // Add this for minimum width
        }}
      >
        {/* Header with gradient */}
        <div
          style={{
            background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
            padding: "24px 30px 20px 30px",
            color: "white",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <h2
              style={{
                marginLeft: "-15px",
                margin: "0",
                fontSize: "16px",
                fontWeight: "700",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              Capital Appeal Score
            </h2>
            <DollarSign size={24} style={{ opacity: 0.8 }} />
          </div>
          <p
            style={{
              marginLeft: "-10px",
              margin: "0",
              fontSize: "13px",
              opacity: "0.9",
              fontWeight: "400",
            }}
          >
            Investment readiness assessment
          </p>

          {/* Decorative elements */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-20px",
              width: "80px",
              height: "80px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              opacity: "0.6",
            }}
          ></div>
          <div
            style={{
              position: "absolute",
              bottom: "-10px",
              left: "-10px",
              width: "60px",
              height: "60px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
            }}
          ></div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            padding: "24px",
            background: "white",
            textAlign: "center",
          }}
        >
          {/* Score Circle with Connected Badge */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: "24px",
            }}
          >
            {/* Main Score Circle */}
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "110px",
                height: "110px",
                border: `4px solid ${scoreLevel.color}`,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ffffff 0%, #f8fff8 100%)",
                boxShadow: `0 6px 20px ${scoreLevel.color}30`,
                color: "#2d2d2d",
                fontWeight: "bold",
              }}
            >
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  lineHeight: "1",
                  marginBottom: "2px",
                }}
              >
                {fundabilityScore}%
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: scoreLevel.color,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              ></span>

              {/* Animated ring */}
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "-6px",
                  right: "-6px",
                  bottom: "-6px",
                  border: `2px solid ${scoreLevel.color}20`,
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              ></div>
            </div>

            {/* Connected Status Badge */}
            <div
              style={{
                position: "absolute",
                bottom: "-12px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: scoreLevel.color,
                color: "white",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "capitalize",
                letterSpacing: "0.5px",
                boxShadow: `0 4px 12px ${scoreLevel.color}40`,
                border: "2px solid white",
                whiteSpace: "nowrap",
              }}
            >
              {scoreLevel.level}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #5d4037 0%, #4a2c20 100%)",
              color: "white",
              marginTop: "15px",
              border: "none",
              fontWeight: "600",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(93, 64, 55, 0.3)",
              whiteSpace: "nowrap",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0px)";
              e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)";
            }}
          >
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "999999",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              zIndex: "999999",
              maxHeight: "90vh",
              overflowY: "auto",
              width: "90%",
              maxWidth: "700px",
              border: "1px solid #ccc",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "#fff",
                border: "2px solid #ddd",
                fontSize: "20px",
                cursor: "pointer",
                color: "#666",
                zIndex: "999999",
                width: "35px",
                height: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontWeight: "bold",
              }}
            >
              ×
            </button>

            <div style={{ padding: "30px 20px 20px 20px" }}>
              <h3
                style={{
                  margin: "0 0 20px 0",
                  fontSize: "24px",
                  fontWeight: "600",
                  color: "#5d4037",
                  textAlign: "center",
                }}
              >
                Capital Appeal Score breakdown
              </h3>

              <div
                style={{
                  textAlign: "center",
                  marginBottom: "30px",
                  padding: "20px",
                  background:
                    "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
                  borderRadius: "12px",
                  border: "1px solid #d6b88a",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "120px",
                    height: "120px",
                    border: `4px solid ${scoreLevel.color}`,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 4px 12px rgba(139, 69, 19, 0.2)",
                    marginBottom: "15px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#5d4037",
                      lineHeight: "1",
                    }}
                  >
                    {fundabilityScore}%
                  </span>
                  <span
                    style={{
                      color: scoreLevel.color,
                      fontSize: "12px",
                      fontWeight: "600",
                      marginTop: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {scoreLevel.level}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    color: "#6d4c41",
                    marginBottom: "15px",
                  }}
                >
                  <span>Business stage: </span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#5d4037",
                      textTransform: "capitalize",
                    }}
                  >
                    {profileData?.entityOverview?.operationStage || "Ideation"}
                  </span>
                </div>

                {isEvaluating && (
                  <p
                    style={{
                      color: "#5d4037",
                      fontSize: "14px",
                      textAlign: "center",
                      marginTop: "10px",
                    }}
                  >
                    <RefreshCw
                      size={16}
                      className="spin"
                      style={{ marginRight: "6px" }}
                    />
                    Running automatic AI analysis...
                  </p>
                )}

                {isReevaluating && (
                  <p
                    style={{
                      color: "#ff9800",
                      fontSize: "14px",
                      textAlign: "center",
                      marginTop: "10px",
                    }}
                  >
                    <RefreshCw
                      size={16}
                      className="spin"
                      style={{ marginRight: "6px" }}
                    />
                    Updating analysis with funding application materials...
                  </p>
                )}

                {!aiEvaluationResult && (
                  <div style={{ marginTop: "15px" }}>
                    <button
                      onClick={refreshAiEvaluation}
                      disabled={isEvaluating || !apiKey}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: isEvaluating ? "#8d6e63" : "#5d4037",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        cursor:
                          isEvaluating || !apiKey ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        fontSize: "14px",
                        opacity: isEvaluating || !apiKey ? 0.7 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {isEvaluating ? (
                        <>
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              border: "2px solid #ffffff",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          ></div>
                          Loading analysis...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Load AI analysis
                        </>
                      )}
                    </button>
                    {!apiKey && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#f44336",
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        <AlertCircle size={14} />
                        AI analysis requires API key configuration
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* About the Fundability Score section */}
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => setShowAboutScore(!showAboutScore)}
                >
                  <span>About the Capital Appeal Score</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showAboutScore
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>

                {showAboutScore && (
                  <div
                    style={{
                      backgroundColor: "#f5f2f0",
                      padding: "20px",
                      color: "#5d4037",
                    }}
                  >
                    <p style={{ marginBottom: "16px", lineHeight: "1.6" }}>
                      The Capital Appeal Score assesses how attractive a
                      business is to potential investors and lenders. It
                      evaluates key factors that influence funding decisions
                      across critical areas that determine investment readiness
                      and risk profile.
                    </p>

                    <div
                      style={{
                        backgroundColor: "#efebe9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        borderLeft: "4px solid #8d6e63",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: "#6d4c41",
                        }}
                      >
                        {hasAppliedForFunding
                          ? "Seven key assessment areas:"
                          : "Four key assessment areas:"}
                      </p>
                      <ul
                        style={{
                          margin: "0",
                          paddingLeft: "20px",
                          color: "#5d4037",
                        }}
                      >
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Financial readiness:</strong> Accounting
                          systems, compliance, and up-to-date financial records
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Financial strength:</strong> Revenue growth,
                          profitability, and audited financials
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Operational strength:</strong> Business
                          processes, infrastructure, and operational maturity
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Impact proof:</strong> Job creation, HDG
                          inclusion, environmental responsibility, and CSR
                          investment
                        </li>
                        {hasAppliedForFunding && (
                          <>
                            <li style={{ marginBottom: "6px" }}>
                              <strong>Business Plan:</strong> Comprehensive
                              business strategy, market analysis, and financial
                              projections
                            </li>
                            <li style={{ marginBottom: "6px" }}>
                              <strong>Pitch Deck:</strong> Investor presentation
                              quality, storytelling, and value proposition
                              clarity
                            </li>
                            <li style={{ marginBottom: "6px" }}>
                              <strong>Credit Report:</strong> Creditworthiness
                              assessment and financial reliability
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#efebe9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        borderLeft: "4px solid #8d6e63",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: "#6d4c41",
                        }}
                      >
                        Score interpretation:
                      </p>
                      <ul
                        style={{
                          margin: "0",
                          paddingLeft: "20px",
                          color: "#5d4037",
                        }}
                      >
                        <li style={{ marginBottom: "4px" }}>
                          <strong>91-100%:</strong> Highly fundable -
                          exceptional investment opportunity
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>81-90%:</strong> Strong investment case - very
                          attractive to funders
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>61-80%:</strong> Moderate potential - some
                          areas need strengthening
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>41-60%:</strong> Basic potential - significant
                          improvements needed
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-40%:</strong> Needs development -
                          fundamental changes required
                        </li>
                      </ul>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#efebe9",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                        borderLeft: "4px solid #8d6e63",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "bold",
                          marginBottom: "8px",
                          color: "#6d4c41",
                        }}
                      >
                        Stage-adjusted weighting:
                      </p>
                      <p style={{ margin: "0", color: "#5d4037" }}>
                        The weighting of each category varies by business stage.
                        Early-stage companies are weighted more heavily on
                        operational strength and pitch quality, while mature
                        companies are assessed primarily on financial
                        performance.
                        {hasAppliedForFunding &&
                          " When you apply for funding, additional weight is given to your Business Plan, Pitch Deck, and Credit Report to provide a comprehensive assessment of your investment readiness."}
                        Financial readiness and strength typically carry the
                        highest weights across all stages.
                      </p>
                    </div>

                    <p
                      style={{
                        marginBottom: "0",
                        lineHeight: "1.6",
                        fontStyle: "italic",
                        color: "#6d4c41",
                      }}
                    >
                      A higher Capital Appeal Score indicates a business is
                      well-positioned to attract investment and secure financing
                      based on these critical assessment areas.
                    </p>
                  </div>
                )}
              </div>

              {/* Score Breakdown Section */}
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
                >
                  <span>Score breakdown</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showScoreBreakdown
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>

                {showScoreBreakdown && (
                  <div
                    style={{
                      backgroundColor: "#f5f2f0",
                      padding: "20px",
                      color: "#5d4037",
                    }}
                  >
                    {scoreBreakdown.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "15px",
                          borderBottom:
                            index < scoreBreakdown.length - 1
                              ? "1px solid #e8d8cf"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "white",
                          marginBottom: "5px",
                          borderRadius: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            flex: "1",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: item.color,
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              marginRight: "12px",
                              flexShrink: "0",
                            }}
                          ></div>
                          <div>
                            <div
                              style={{
                                fontWeight: "600",
                                color: "#5d4037",
                                fontSize: "14px",
                                marginBottom: "2px",
                              }}
                            >
                              {item.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#8d6e63",
                                fontStyle: "italic",
                              }}
                            >
                              {item.rawScore}/{item.maxScore} × {item.weight}%
                              weight = {item.weightedScore}%
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "80px",
                              height: "8px",
                              background: "#f3e8dc",
                              borderRadius: "4px",
                              overflow: "hidden",
                              border: "1px solid #d6b88a",
                            }}
                          >
                            <div
                              style={{
                                width: `${item.score}%`,
                                height: "100%",
                                background: getProgressBarColor(item.score),
                                borderRadius: "4px",
                                transition: "width 0.3s ease",
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              fontWeight: "600",
                              color: "#5d4037",
                              fontSize: "14px",
                              minWidth: "35px",
                              textAlign: "right",
                            }}
                          >
                            {item.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed Analysis Section */}
              <div
                style={{
                  marginTop: "20px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#8d6e63",
                    color: "white",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                >
                  <span>Detailed analysis</span>
                  <ChevronDown
                    size={20}
                    style={{
                      transform: showDetailedAnalysis
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>

                {showDetailedAnalysis && (
                  <div
                    style={{
                      backgroundColor: "#f5f2f0",
                      padding: "20px",
                      color: "#5d4037",
                    }}
                  >
                    {aiEvaluationResult ? (
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "20px",
                          borderRadius: "8px",
                          border: "1px solid #e8d8cf",
                          maxHeight: "400px",
                          overflowY: "auto",
                        }}
                      >
                        {formatAiResult(aiEvaluationResult)}

                        {/* Add funding application analyses here if they exist */}
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {fundabilityScore > 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Exceptional investment opportunity.</strong>{" "}
                            Your business demonstrates outstanding fundability
                            across all key criteria. You have strong leadership,
                            robust financials, solid operations, clear market
                            position, good governance, and meaningful social
                            impact. Investors and lenders would view this as a
                            premium opportunity.
                          </p>
                        )}

                        {fundabilityScore >= 81 && fundabilityScore <= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Very attractive investment case.</strong>{" "}
                            Your business shows strong fundamentals across most
                            areas with excellent potential for funding success.
                            Minor enhancements in weaker areas could elevate
                            your profile to the highest tier of investment
                            opportunities.
                          </p>
                        )}

                        {fundabilityScore >= 61 && fundabilityScore <= 80 && (
                          <p style={{ margin: "0" }}>
                            <strong>
                              Moderate potential with development opportunities.
                            </strong>{" "}
                            Your business has solid foundations but several
                            areas need strengthening before approaching
                            investors. Focus on improving financial metrics,
                            operational systems, and governance structures to
                            enhance fundability.
                          </p>
                        )}

                        {fundabilityScore >= 41 && fundabilityScore <= 60 && (
                          <p style={{ margin: "0" }}>
                            <strong>
                              Basic potential requiring significant improvement.
                            </strong>{" "}
                            While some elements are in place, substantial
                            development is needed across leadership, financials,
                            operations, and governance before your business
                            would be attractive to most funders.
                          </p>
                        )}

                        {fundabilityScore <= 40 && (
                          <p style={{ margin: "0" }}>
                            <strong>Fundamental improvements required.</strong>{" "}
                            Your business needs significant strengthening across
                            multiple areas before pursuing funding. Focus on
                            building strong financial foundations, improving
                            operational systems, and developing clear governance
                            structures.
                          </p>
                        )}
                      </div>
                    )}

                    {evaluationError && (
                      <div
                        style={{
                          marginTop: "15px",
                          padding: "12px",
                          backgroundColor: "#f8d7da",
                          color: "#721c24",
                          border: "1px solid #f5c6cb",
                          borderRadius: "6px",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <AlertCircle size={16} />
                        {evaluationError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
