"use client"

import { useState, useEffect } from "react"
import { ChevronDown, RefreshCw, AlertCircle, DollarSign, CheckCircle, TrendingUp } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { collection, query, where, getDocs } from "firebase/firestore"
import { API_KEYS } from "../../API"
import { useApiKey } from "./callapi"
import { useFirebaseFunctions } from './hooks';



export function FundabilityScoreCard({ styles = {}, profileData, onScoreUpdate ,apiKey}) {
  const [showModal, setShowModal] = useState(false)
  const [fundabilityScore, setFundabilityScore] = useState(0)
  const [scoreBreakdown, setScoreBreakdown] = useState([])
  const [aiEvaluationResult, setAiEvaluationResult] = useState("")
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationError, setEvaluationError] = useState("")
  const [showAboutScore, setShowAboutScore] = useState(false)
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)


  const [triggeredByAuto, setTriggeredByAuto] = useState(false)
  const [name, setName] = useState('');
  const [result, setResult] = useState(null);
  const { callFunction, loading, error } = useFirebaseFunctions();

  const handleTestFunction = async () => {
    try {
      const response = await callFunction('helloWorld', { name });
      setResult(response);
    } catch (err) {
      console.error('Function error:', err);
    }
  };
  

  

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : ""
    return () => (document.body.style.overflow = "")
  }, [showModal])

  useEffect(() => {

    if (profileData && aiEvaluationResult) {
      const result = calculateFundabilityScore(profileData, aiEvaluationResult)
      setFundabilityScore(result.totalScore)
      setScoreBreakdown(result.breakdown)
      if (onScoreUpdate) onScoreUpdate(result.totalScore)
    }
  }, [profileData, aiEvaluationResult, onScoreUpdate])

  const parseAiEvaluationScores = (text) => {
    const categories = {
      financialReadiness: ["Financial Readiness", "Financial System", "Accounting System"],
      financialStrength: ["Revenue Growth", "Financial Strength", "Profitability", "audited financials", "Financials"],
      operations: ["Operational Strength", "Operations", "Operating Model", "Operational Score"],
      pitchBusinessPlan: ["Pitch", "Business Plan", "Market Analysis", "Solution Fit"],
      guarantees: [
        "Guarantees",
        "Forward Contracts",
        "Revenue Guarantees",
        "Signed customer contracts",
        "Purchase orders",
        "Offtake agreements",
        "Subscription revenue",
        "Letter of guarantee",
        "Third-party guarantees",
        "Factoring agreements",
        "Surety bonds",
        "Government contracts",
        "Approved supplier status",
        "Export credit guarantees",
        "Asset-backed Guarantees",
        "Liens",
        "Collateral",
        "Secured assets",
        "Retention guarantees",
        "Export credit insurance",
        "Receivables-backed financing",
        "Personal surety",
        "Corporate guarantees",
      ],
      impact: ["Impact", "Social Impact", "Job Creation", "HDG Impact"],
    }

    const scores = {}
    Object.entries(categories).forEach(([key, labels]) => {
      let foundScore = 0
      for (const label of labels) {
        const patterns = [
          new RegExp(`\\*\\*${label}\\s*:\\s*(\\d)\\*\\*`, "i"),
          new RegExp(`${label}\\s*:\\s*(\\d)`, "i"),
          new RegExp(`\\d+\\.\\s*\\*\\*${label}\\s*:\\s*(\\d)\\*\\*`, "i"),
          new RegExp(`${label}[^\\d]*(\\d)/5`, "i"),
          new RegExp(`${label}[^\\d]*(\\d)\\s*out\\s*of\\s*5`, "i"),
          new RegExp(`${label}.*?score[^\\d]*(\\d)`, "i"),
          new RegExp(`\\d+\\.\\s*${label}\\s*:\\s*(\\d)`, "i"),
        ]

        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match) {
            foundScore = Number.parseInt(match[1])
            console.log(`Found score for ${key} (${label}): ${foundScore}`)
            break
          }
        }
        if (foundScore > 0) break
      }
      scores[key] = Math.min(Math.max(foundScore, 0), 5)
    })

    console.log("Final parsed AI scores:", scores)
    return scores
  }

  // Updated progress bar color function with new color scheme
  const getProgressBarColor = (score) => {
    if (score > 90) return "#1B5E20" // Dark green
    if (score >= 81) return "#4CAF50" // Green
    if (score >= 61) return "#FF9800" // Orange
    if (score >= 41) return "#F44336" // Red
    return "#B71C1C" // Dark red
  }

  const mapStageToCategory = (stage) => {
    const s = (stage || "").toLowerCase()
    if (["pre-seed", "preseed"].includes(s)) return "pre-seed"
    if (["seed"].includes(s)) return "seed"
    if (["series a", "seriesa"].includes(s)) return "seriesa"
    if (["series b", "seriesb"].includes(s)) return "seriesb"
    if (["early-growth", "growth", "scale-up"].includes(s)) return "growth"
    return "maturity"
  }

  const weightingsByStage = {
    "pre-seed": {
      financialReadiness: 15, // Basic accounting systems important
      financialStrength: 5, // Limited revenue expected
      operations: 20, // Operational capability crucial
      pitchBusinessPlan: 30, // Vision and plan most important
      guarantees: 15, // Some security helpful
      impact: 15, // Social impact matters
    },
    seed: {
      financialReadiness: 20, // Systems becoming critical
      financialStrength: 10, // Some revenue expected
      operations: 20, // Proven operations needed
      pitchBusinessPlan: 20, // Strong business case required
      guarantees: 20, // Risk mitigation important
      impact: 10, // Impact nice to have
    },
    seriesa: {
      financialReadiness: 25, // Professional systems required
      financialStrength: 20, // Strong financials needed
      operations: 10, // Operations should be proven
      pitchBusinessPlan: 10, // Business model validated
      guarantees: 25, // Strong guarantees critical
      impact: 10, // Impact expected
    },
    seriesb: {
      financialReadiness: 20, // Mature financial systems
      financialStrength: 25, // Revenue growth critical
      operations: 15, // Scalable operations
      pitchBusinessPlan: 15, // Clear growth strategy
      guarantees: 15, // Some guarantees needed
      impact: 10, // Impact demonstrated
    },
    growth: {
      financialReadiness: 20, // Professional finance function
      financialStrength: 30, // Strong financial performance
      operations: 20, // Efficient operations
      pitchBusinessPlan: 10, // Proven business model
      guarantees: 15, // Risk management
      impact: 5, // Impact track record
    },
    maturity: {
      financialReadiness: 15, // Established systems
      financialStrength: 35, // Financial performance key
      operations: 20, // Optimized operations
      pitchBusinessPlan: 5, // Business model proven
      guarantees: 20, // Asset backing important
      impact: 5, // ESG compliance
    },
  }

  // Verification function to ensure all weightings sum to 100%
  const verifyWeightings = () => {
    Object.entries(weightingsByStage).forEach(([stage, weights]) => {
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
      console.log(`${stage}: ${total}% (${total === 100 ? "✓" : "✗"})`)
    })
  }

  // Call verification
  verifyWeightings()

  const categoryNames = {
    financialReadiness: "Financial readiness",
    financialStrength: "Financial strength",
    operations: "Operational strength",
    pitchBusinessPlan: "Pitch & business plan",
    guarantees: "Guarantees",
    impact: "Impact proof",
  }

  const calculateFundabilityScore = (data, aiEvaluationResult = "") => {
    console.log("Calculating fundability score with AI result:", !!aiEvaluationResult)
    const stage = mapStageToCategory(data?.entityOverview?.operationStage || "Not provided")
    const weightings = weightingsByStage[stage]
    const aiScores = aiEvaluationResult ? parseAiEvaluationScores(aiEvaluationResult) : {}
    console.log("AI scores extracted:", aiScores)

    const categoryMappings = {
      financialReadiness: "Financial readiness",
      financialStrength: "Financial strength",
      operations: "Operational strength",
      pitchBusinessPlan: "Pitch & business plan",
      guarantees: "Guarantees",
      impact: "Impact proof",
    }

    const colors = ["#8D6E63", "#6D4C41", "#A67C52", "#D7CCC8", "#4E342E", "#795548"]

    const breakdown = Object.entries(categoryMappings).map(([key, label], i) => {
      const aiRaw = aiScores?.[key] ?? 0
      const percent = aiRaw > 0 ? (aiRaw / 5) * 100 : 0
      const weight = weightings[key] || 0
      // Calculate weighted contribution: (score/5) * weight
      const weightedContribution = (aiRaw / 5) * weight

      return {
        name: label,
        score: Math.round(percent),
        weight: weight,
        weightedScore: Math.round(weightedContribution),
        color: colors[i] || "#8D6E63",
        rawScore: aiRaw,
        maxScore: 5,
      }
    })

    // Sum the weighted contributions for final score
    const totalScore = Math.round(breakdown.reduce((sum, item) => sum + (item.weightedScore || 0), 0))

    // Verification logging
    const totalWeight = Object.values(weightings).reduce((sum, weight) => sum + weight, 0)
    console.log(`Stage: ${stage}`)
    console.log("Weightings:", weightings)
    console.log("Total weights:", totalWeight, "should equal 100")
    console.log(
      "Breakdown:",
      breakdown.map((b) => `${b.name}: ${b.rawScore}/5 × ${b.weight}% = ${b.weightedScore}%`),
    )
    console.log("Final calculated score:", totalScore)

    return {
      totalScore: Math.min(Math.max(isNaN(totalScore) ? 0 : totalScore, 0), 100),
      breakdown,
    }
  }

  const sendMessageToChatGPT = async (message) => {
    const API_URL = "https://api.openai.com/v1/chat/completions"
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an expert business analyst specializing in fundability assessment. Provide detailed, professional evaluations based on the BIG Fundability Scorecard rubric.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (response.status === 401) {
          throw new Error("Invalid API key. Please check your OpenAI API key.")
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.")
        } else if (response.status === 403) {
          throw new Error("Access denied. Please check your API key permissions.")
        } else {
          throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`)
        }
      }

      const data = await response.json()
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenAI API")
      }

      return data.choices[0].message.content
    } catch (error) {
      console.error("ChatGPT API Error:", error)
      throw error
    }
  }

  const prepareDataForEvaluation = async (data) => {
    let evaluationData = ""

    // Financial Readiness
    evaluationData += `\n=== FINANCIAL READINESS ===\n`
    evaluationData += `Accounting/ERP System: ${data?.financialOverview?.hasAccountingSoftware || "Not specified"}\n`
    evaluationData += `Books Up-to-Date: ${data?.financialOverview?.booksUpToDate ? "Yes" : "Not confirmed"}\n`
    evaluationData += `Tax Number: ${data?.legalCompliance?.taxNumber ? "Compliant" : "Not confirmed"}\n`
    evaluationData += `VAT Number: ${data?.legalCompliance?.vatNumber ? "Compliant" : "Not confirmed"}\n`
    evaluationData += `Financial Statements: ${data?.fundingDocuments?.financialStatements?.length > 0 ? "Available" : "Not provided"}\n`

    // Financial Strength
    evaluationData += `\n=== FINANCIAL STRENGTH ===\n`
    evaluationData += `Annual Revenue: ${data?.financialOverview?.annualRevenue || "Not provided"}\n`

    try {
      const userId = auth.currentUser?.uid
      const finRef = doc(db, "aiFinancialEvaluations", userId)
      const finSnap = await getDoc(finRef)
      const revenueData = finSnap.exists() ? finSnap.data() : null

      if (revenueData?.evaluation?.score) {
        evaluationData += `\n--- REVENUE GROWTH ANALYSIS ---\n`
        evaluationData += `Score: ${revenueData.evaluation.score} out of 5\n`
        evaluationData += `Summary: ${revenueData.evaluation.summary || "No summary available"}\n`
      }
    } catch (err) {
      console.error("Error loading revenue growth evaluation:", err)
    }

    evaluationData += `Profitability: ${data?.financialOverview?.profitabilityStatus || "No"}\n`
    evaluationData += `Financials: ${data?.enterpriseReadiness?.hasFinancials || "No"}\n`
    evaluationData += `Audited financials: ${data?.enterpriseReadiness?.hasAuditedFinancials || "No"}\n`

    // Operations
    try {
      const userId = auth.currentUser?.uid
      const pdQuery = query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId))
      const pdSnapshot = await getDocs(pdQuery)
      const pitchDeckData = !pdSnapshot.empty ? pdSnapshot.docs[0].data() : null

      if (pitchDeckData?.evaluation?.operationalScore) {
        evaluationData += `\n--- PITCH DECK OPERATIONAL STRENGTH ---\n`
        evaluationData += `Score: ${pitchDeckData.evaluation.operationalScore || 0} out of five\n`
        evaluationData += `Summary: ${pitchDeckData.evaluation.operationalSummary || "No summary available"}\n`
      }
    } catch (err) {
      console.error("Error loading pitch deck operational evaluation:", err)
    }

    // Pitch & Business Plan
    evaluationData += `\n=== PITCH & BUSINESS PLAN ===\n`
    try {
      const userId = auth.currentUser?.uid
      // Fetch Business Plan Evaluation
      const bpQuery = query(collection(db, "aiEvaluations"), where("userId", "==", userId))
      const bpSnapshot = await getDocs(bpQuery)
      const businessPlanData = !bpSnapshot.empty ? bpSnapshot.docs[0].data() : null

      // Fetch Pitch Deck Evaluation
      const pdQuery = query(collection(db, "aiPitchEvaluations"), where("userId", "==", userId))
      const pdSnapshot = await getDocs(pdQuery)
      const pitchDeckData = !pdSnapshot.empty ? pdSnapshot.docs[0].data() : null

      if (pitchDeckData) {
        evaluationData += `\n--- PITCH DECK EVALUATION ---\n`
        evaluationData += `Score: ${pitchDeckData?.evaluation?.score ?? "N/A"}/100\n`
        evaluationData += `${pitchDeckData?.evaluation?.content ?? "No content"}\n`
      } else {
        evaluationData += `\n--- PITCH DECK EVALUATION ---\nNo evaluation found.\n`
      }

      if (businessPlanData) {
        evaluationData += `\n--- BUSINESS PLAN EVALUATION ---\n`
        evaluationData += `Score: ${businessPlanData?.evaluation?.score ?? "N/A"}/100\n`
        evaluationData += `${businessPlanData?.evaluation?.content ?? "No content"}\n`
      } else {
        evaluationData += `\n--- BUSINESS PLAN EVALUATION ---\nNo evaluation found.\n`
      }
    } catch (err) {
      console.error("Error loading evaluations:", err)
      evaluationData += "\nError retrieving evaluation data.\n"
    }

    // Guarantees
    evaluationData += `\n=== GUARANTEES ===\n`
    // Forward Contracts
    evaluationData += `--- Forward Contracts ---\n`
    evaluationData += `Signed customer contracts: ${data?.guarantees?.signedCustomerContracts || "No"}\n`
    evaluationData += `Purchase orders: ${data?.guarantees?.purchaseOrders || "No"}\n`
    evaluationData += `Offtake agreements: ${data?.guarantees?.offtakeAgreements || "No"}\n`
    evaluationData += `Subscription revenue: ${data?.guarantees?.subscriptionRevenue || "No"}\n`

    // Payment of Credit Guarantees
    evaluationData += `\n--- Credit Guarantees ---\n`
    evaluationData += `Letter of guarantee: ${data?.guarantees?.letterOfGuarantee || "No"}\n`
    evaluationData += `Third-party guarantees: ${data?.guarantees?.thirdPartyGuarantees || "No"}\n`
    evaluationData += `Factoring agreements: ${data?.guarantees?.factoringAgreements || "No"}\n`
    evaluationData += `Surety bonds: ${data?.guarantees?.suretyBonds || "No"}\n`

    // Government or Institutional Support
    evaluationData += `\n--- Government or Institutional Support ---\n`
    evaluationData += `Government contracts: ${data?.guarantees?.governmentContracts || "No"}\n`
    evaluationData += `Approved supplier status: ${data?.guarantees?.approvedSupplierStatus || "No"}\n`
    evaluationData += `Incubator guarantees: ${data?.guarantees?.incubatorGuarantees || "No"}\n`
    evaluationData += `Export credit guarantees: ${data?.guarantees?.exportCreditGuarantees || "No"}\n`

    // Asset-backed
    evaluationData += `\n--- Asset-backed Guarantees ---\n`
    evaluationData += `Liens/collateral: ${data?.guarantees?.liensCollateral || "No"}\n`
    evaluationData += `Secured assets: ${data?.guarantees?.securedAssets || "No"}\n`
    evaluationData += `Retention guarantees: ${data?.guarantees?.retentionGuarantees || "No"}\n`

    // Export Credit Insurance
    evaluationData += `\n--- Export Insurance ---\n`
    evaluationData += `Export credit insurance: ${data?.guarantees?.exportCreditInsurance || "No"}\n`

    // Receivables Finance
    evaluationData += `\n--- Receivables Financing ---\n`
    evaluationData += `Receivables-backed financing: ${data?.guarantees?.receivablesFinancing || "No"}\n`

    // Personal / Third-Party
    evaluationData += `\n--- Personal / Third-Party Guarantees ---\n`
    evaluationData += `Personal surety: ${data?.guarantees?.personalSurety || "No"}\n`
    evaluationData += `Corporate guarantees: ${data?.guarantees?.corporateGuarantees || "No"}\n`

    // Impact Proof
    evaluationData += `\n=== IMPACT PROOF ===\n`
    // 3.7.1 Job Creation
    evaluationData += `\n-- 3.7.1 Job Creation --\n`
    evaluationData += `Planned jobs to be created: ${data?.socialImpact?.jobsToCreate || 0}\n`
    evaluationData += `Local employees to be hired: ${data?.socialImpact?.localEmployeesHired || 0}\n`

    // 3.7.2 HDG Impact (Youth, Women, Disabled)
    evaluationData += `\n-- 3.7.2 HDG Impact (Youth, Women, Disability) --\n`
    evaluationData += `% Black ownership: ${data?.socialImpact?.blackOwnership || 0}%\n`
    evaluationData += `% Women ownership: ${data?.socialImpact?.womenOwnership || 0}%\n`
    evaluationData += `% Youth ownership: ${data?.socialImpact?.youthOwnership || 0}%\n`
    evaluationData += `% Disabled ownership: ${data?.socialImpact?.disabledOwnership || 0}%\n`

    // 3.7.3 Environmental Responsibility
    evaluationData += `\n-- 3.7.3 Environmental Responsibility --\n`
    evaluationData += `Environmental impact: ${data?.socialImpact?.environmentalImpact || "Not specified"}\n`
    evaluationData += `SDG/ESD alignment: ${data?.socialImpact?.sdgAlignment || "Not specified"}\n`

    // 3.7.4 CSR/CSI Investment
    evaluationData += `\n-- 3.7.4 CSR/CSI Investment --\n`
    evaluationData += `CSI/CSR Spend: ${data?.socialImpact?.csiCsrSpend || "R 0"}\n`
    evaluationData += `Community investment amount: ${data?.socialImpact?.communityInvestmentAmount || "R 0"}\n`
    evaluationData += `Number of beneficiaries: ${data?.socialImpact?.numberOfBeneficiaries || 0}\n`
    evaluationData += `Focus areas: ${data?.socialImpact?.csrFocusAreas || "Not specified"}\n`
    evaluationData += `Investment description: ${data?.socialImpact?.socialInvestmentCommunities || "Not specified"}\n`

    // 3.7.5 Local Value Creation
    evaluationData += `\n-- 3.7.5 Local Value Creation --\n`
    evaluationData += `Local procurement spend: ${data?.socialImpact?.localProcurementSpend || "R 0"}\n`
    evaluationData += `Strategy for local value: ${data?.socialImpact?.localValueStrategy || "Not specified"}\n`

    return evaluationData
  }

  const runAiEvaluation = async (userId) => {
    if (!apiKey?.trim()) {
      setEvaluationError("OpenAI API key not configured.")
      return
    }

    if (!profileData) {
      setEvaluationError("No profile data available for evaluation.")
      return
    }

    setIsEvaluating(true)
    setEvaluationError("")

    try {
      // Prepare data for AI evaluation
      const evaluationData = await prepareDataForEvaluation(profileData)

      const combinedMessage = `Evaluate the fundability of the following business using the BIG Fundability Scorecard rubric.

Instructions:
- Score each of the 6 categories below from 0 to 5 using the rubric where:
  • 0 = No evidence or very poor
  • 1 = Minimal/poor evidence  
  • 2 = Below average
  • 3 = Average/acceptable
  • 4 = Good/strong evidence
  • 5 = Excellent/outstanding

- Provide a short rationale for each score (2-3 sentences)
- If not giving 5/5 explain why if you cant give 5/5

Categories to evaluate:
1. Financial Readiness - Accounting systems, compliance, up-to-date records
2. Financial Strength - Revenue growth, profitability, growth metric, audited financials
3. Operational Strength - Processes, infrastructure, operational maturity
4. Pitch & Business Plan - Problem clarity, solution fit, market analysis, projections
5. Guarantees - Forward contracts, asset security, government support, credit guarantees
6. Impact Proof - Job creation, HDG inclusion, environmental responsibility, CSR

Input Data:
${evaluationData}`

      const result = await sendMessageToChatGPT(combinedMessage)
      setAiEvaluationResult(result)
      setShowDetailedAnalysis(true)
      return result // Return result to be used elsewhere
    } catch (error) {
      console.error("AI Evaluation error:", error)
      setEvaluationError(`Failed to get AI evaluation: ${error.message}`)
    } finally {
      setIsEvaluating(false)
    }
  }

  const refreshAiEvaluation = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    try {
      const aiEvalRef = doc(db, "aiFundabilityEvaluations", userId)
      const aiSnap = await getDoc(aiEvalRef)

      if (aiSnap.exists()) {
        const saved = aiSnap.data()
        if (saved.result) {
          console.log("Refreshing AI evaluation result")
          setAiEvaluationResult(saved.result)
          return
        }
      }

      // If no saved result, run new evaluation
      console.log("No saved result found, running new evaluation")
      await runAiEvaluation()
    } catch (error) {
      console.error("Error refreshing AI evaluation:", error)
      setEvaluationError(`Failed to refresh evaluation: ${error.message}`)
    }
  }

useEffect(() => {
  // Wait for both auth user and API key to be available
  if (!auth?.currentUser?.uid || !apiKey) return
  
  console.log("✅ Both user and API key are available, setting up Firebase listeners...")
  
  const docRef = doc(db, "universalProfiles", auth.currentUser.uid)
  const aiEvalRef = doc(db, "aiFundabilityEvaluations", auth.currentUser.uid)
  
  const unsubscribe = onSnapshot(docRef, async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data()
      // ✅ Trigger Fundability AI Evaluation
      if (data.triggerFundabilityEvaluation === true && !isEvaluating) {
        console.log("Trigger detected: Running fundability AI evaluation...")
        setTriggeredByAuto(true)
        const result = await runAiEvaluation() // Now safe to use - apiKey is available
        await updateDoc(docRef, { triggerFundabilityEvaluation: false })
        
        // Save result to Firestore
        await updateDoc(aiEvalRef, {
          result,
          timestamp: new Date(),
          profileSnapshot: profileData,
        }).catch(async () => {
          await setDoc(aiEvalRef, {
            result,
            timestamp: new Date(),
            profileSnapshot: profileData,
          })
        })
        
        setAiEvaluationResult(result)
        setShowDetailedAnalysis(true)
      }
    }
    
    // ✅ Always load saved AI result (whether trigger ran or not)
    try {
      const aiSnap = await getDoc(aiEvalRef)
      if (aiSnap.exists()) {
        const saved = aiSnap.data()
        if (saved.result) {
          console.log("Loading saved AI evaluation result")
          setAiEvaluationResult(saved.result)
        }
      }
    } catch (error) {
      console.error("Error loading saved AI evaluation:", error)
    }
  })
  
  return () => {
    // console.log("🧹 Cleaning up Firebase listener...")
    unsubscribe()
  }
}, [auth?.currentUser?.uid, apiKey, isEvaluating]) // Monitors apiKey changes
  // Updated score levels with new color scheme
  const getScoreLevel = (score) => {
    if (score > 90) return { level: "Highly fundable", color: "#1B5E20", icon: CheckCircle }
    if (score >= 81) return { level: "Strong investment case", color: "#4CAF50", icon: CheckCircle }
    if (score >= 61) return { level: "Moderate potential", color: "#FF9800", icon: TrendingUp }
    if (score >= 41) return { level: "Basic potential", color: "#F44336", icon: AlertCircle }
    return { level: "Needs development", color: "#B71C1C", icon: AlertCircle }
  }

  const scoreLevel = getScoreLevel(fundabilityScore)
  const ScoreIcon = scoreLevel.icon

  // Helper function to format AI result into sections
  const formatAiResult = (result) => {
    // First, clean up the markdown formatting
    const cleanedResult = result.replace(/\*\*(.*?)\*\*/g, "$1") // Remove ** formatting

    const sections = cleanedResult.split(/(?=\d+\.\s|\*\*[^*]+\*\*:|\n\n)/)

    return sections
      .map((section, index) => {
        const trimmed = section.trim()
        if (!trimmed) return null

        // Check if it's a category header
        const isHeader = /^\d+\.\s/.test(trimmed)

        return (
          <div key={index} style={{ marginBottom: "15px" }}>
            {isHeader ? (
              <div
                style={{
                  fontWeight: "bold",
                  color: "#5d4037",
                  fontSize: "16px",
                  marginBottom: "8px",
                  paddingBottom: "5px",
                  borderBottom: "1px solid #e8d8cf",
                }}
              >
                {trimmed.split("\n")[0]}
              </div>
            ) : null}
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#6d4c41",
                whiteSpace: "pre-wrap",
              }}
            >
              {isHeader ? trimmed.split("\n").slice(1).join("\n") : trimmed}
            </div>
          </div>
        )
      })
      .filter(Boolean)
  }

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
    maxWidth: "000px", // Add this to limit maximum width (optional)
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
              marginTop:"15px",
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
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 6px 20px rgba(93, 64, 55, 0.4)"
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "translateY(0px)"
              e.target.style.boxShadow = "0 4px 16px rgba(93, 64, 55, 0.3)"
            }}
          >
            <span>Score breakdown</span>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
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
              setShowModal(false)
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
                  background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8dc 100%)",
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
                  <p style={{ color: "#5d4037", fontSize: "14px", textAlign: "center", marginTop: "10px" }}>
                    <RefreshCw size={16} className="spin" style={{ marginRight: "6px" }} />
                    Running automatic AI analysis...
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
                        cursor: isEvaluating || !apiKey ? "not-allowed" : "pointer",
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
                      transform: showAboutScore ? "rotate(180deg)" : "rotate(0deg)",
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
                      The Capital Appeal Score assesses how attractive a business is to potential investors and lenders. It
                      evaluates key factors that influence funding decisions across six critical areas that determine
                      investment readiness and risk profile.
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
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        Six key assessment areas:
                      </p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Financial readiness:</strong> Accounting systems, compliance, and up-to-date financial
                          records
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Financial strength:</strong> Revenue growth, profitability, and audited financials
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Operational strength:</strong> Business processes, infrastructure, and operational
                          maturity
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Pitch & business plan:</strong> Problem clarity, solution fit, market analysis, and
                          projections
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Guarantees:</strong> Forward contracts, asset security, government support, and credit
                          guarantees
                        </li>
                        <li style={{ marginBottom: "6px" }}>
                          <strong>Impact proof:</strong> Job creation, HDG inclusion, environmental responsibility, and
                          CSR investment
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
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>Score interpretation:</p>
                      <ul style={{ margin: "0", paddingLeft: "20px", color: "#5d4037" }}>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>91-100%:</strong> Highly fundable - exceptional investment opportunity
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>81-90%:</strong> Strong investment case - very attractive to funders
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>61-80%:</strong> Moderate potential - some areas need strengthening
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>41-60%:</strong> Basic potential - significant improvements needed
                        </li>
                        <li style={{ marginBottom: "4px" }}>
                          <strong>0-40%:</strong> Needs development - fundamental changes required
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
                      <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#6d4c41" }}>
                        Stage-adjusted weighting:
                      </p>
                      <p style={{ margin: "0", color: "#5d4037" }}>
                        The weighting of each category varies by business stage. Early-stage companies are weighted more
                        heavily on pitch quality and operational strength, while mature companies are assessed primarily
                        on financial performance and guarantees. Financial readiness and strength typically carry the
                        highest weights across all stages.
                      </p>
                    </div>

                    <p style={{ marginBottom: "0", lineHeight: "1.6", fontStyle: "italic", color: "#6d4c41" }}>
                      A higher Capital Appeal Score indicates a business is well-positioned to attract investment and
                      secure financing based on these six critical assessment areas.
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
                      transform: showScoreBreakdown ? "rotate(180deg)" : "rotate(0deg)",
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
                          borderBottom: index < scoreBreakdown.length - 1 ? "1px solid #e8d8cf" : "none",
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
                              {item.rawScore}/{item.maxScore} × {item.weight}% weight = {item.weightedScore}%
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
                      transform: showDetailedAnalysis ? "rotate(180deg)" : "rotate(0deg)",
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
                      </div>
                    ) : (
                      <div style={{ color: "#5d4037", lineHeight: "1.6" }}>
                        {fundabilityScore > 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Exceptional investment opportunity.</strong> Your business demonstrates outstanding
                            fundability across all key criteria. You have strong leadership, robust financials, solid
                            operations, clear market position, good governance, and meaningful social impact. Investors
                            and lenders would view this as a premium opportunity.
                          </p>
                        )}

                        {fundabilityScore >= 81 && fundabilityScore <= 90 && (
                          <p style={{ margin: "0" }}>
                            <strong>Very attractive investment case.</strong> Your business shows strong fundamentals
                            across most areas with excellent potential for funding success. Minor enhancements in weaker
                            areas could elevate your profile to the highest tier of investment opportunities.
                          </p>
                        )}

                        {fundabilityScore >= 61 && fundabilityScore <= 80 && (
                          <p style={{ margin: "0" }}>
                            <strong>Moderate potential with development opportunities.</strong> Your business has solid
                            foundations but several areas need strengthening before approaching investors. Focus on
                            improving financial metrics, operational systems, and governance structures to enhance
                            fundability.
                          </p>
                        )}

                        {fundabilityScore >= 41 && fundabilityScore <= 60 && (
                          <p style={{ margin: "0" }}>
                            <strong>Basic potential requiring significant improvement.</strong> While some elements are
                            in place, substantial development is needed across leadership, financials, operations, and
                            governance before your business would be attractive to most funders.
                          </p>
                        )}

                        {fundabilityScore <= 40 && (
                          <p style={{ margin: "0" }}>
                            <strong>Fundamental improvements required.</strong> Your business needs significant
                            strengthening across multiple areas before pursuing funding. Focus on building strong
                            financial foundations, improving operational systems, and developing clear governance
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

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}