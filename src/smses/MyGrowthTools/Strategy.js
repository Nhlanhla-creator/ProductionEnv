"use client"

import { useState, useEffect } from "react"
import { Bar, Scatter } from "react-chartjs-2"
import Sidebar from "smses/Sidebar/Sidebar"
import Header from "../DashboardHeader/DashboardHeader"
import { db, auth, storage } from "../../firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { FaChevronDown, FaChevronUp, FaRobot, FaSpinner, FaDownload } from "react-icons/fa"
import { 
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, 
  onSnapshot, setDoc, getDoc 
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { getFunctions, httpsCallable } from "firebase/functions"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
)

const SECTION_DATA = {
  "strategic-clarity": {
    name: "Strategic Clarity",
    keyQuestion: "Is there a clear, articulated strategy that guides decision-making across the business?",
    keySignals: "Strategic priorities are explicit, Operating intent is consistent",
    keyDecisions: "Is the business intentionally steered or founder-driven? Is strategic clarification required before scaling or funding? Can external stakeholders understand the business direction?",
    kpis: [
      "Vision",
      "Mission",
      "Values",
      "Operating Principles",
      "Strategic Priorities (Max 3-5)",
      "Strategic Horizon (timeframe selector 12-36 months)",
    ],
  },
  "operating-model": {
    name: "Operating Model",
    keyQuestion: "Is the operating model aligned with the current business strategy and stage?",
    keySignals: "Business model canvas is clearly defined, Resources and activities match strategic priorities",
    keyDecisions: "Does the operating model need to evolve for scaling? Are there gaps between strategy and execution? Is the cost structure sustainable?",
    kpis: [
      "Key Partners",
      "Key Activities",
      "Key Resources",
      "Value Propositions",
      "Customer Relationships",
      "Channels",
      "Customer Segments",
      "Cost Structure",
      "Revenue Streams",
    ],
  },
  "strategy-operationalisation": {
    name: "Strategy Operationalisation",
    keyQuestion: "Is strategy being translated into actionable goals and milestones?",
    keySignals: "Clear strategic goals exist, Progress is tracked against milestones",
    keyDecisions: "Are goals being met? Should resources be reallocated? Are timelines realistic?",
    kpis: [
      "Goal completion rates",
      "Milestone achievement",
      "Progress tracking",
    ],
  },
  "strategic-risk-control": {
    name: "Strategic Risk Control",
    keyQuestion: "Are strategic risks identified and actively managed?",
    keySignals: "Risk register is maintained, Mitigation plans are in place",
    keyDecisions: "What risks are acceptable? Where to invest in risk mitigation? Is the risk appetite appropriate?",
    kpis: [
      "Risk identification",
      "Risk assessment",
      "Mitigation status",
      "Review cadence",
    ],
  },
  "change-adaptability": {
    name: "Change and Adaptability",
    keyQuestion: "Does the organization effectively adapt its strategy based on feedback and changing conditions?",
    keySignals: "Strategy reviews occur regularly, Pivots are documented and reasoned",
    keyDecisions: "When to pivot vs persist? What adjustments are needed? How to communicate changes?",
    kpis: [
      "Review frequency",
      "Pivot documentation",
      "Strategy adjustments",
    ],
  },
}

// RISK COLORS for scatter plot - each category gets a distinct color
// RISK COLORS for scatter plot - each category gets a distinct color
const RISK_COLORS = {
  "financial-risk": "#4CAF50", // Green
  "market-risk": "#2196F3", // Blue
  "operational-risk": "#FF9800", // Orange
  "reputational-risk": "#9C27B0", // Purple
  "compliance-risk": "#F44336", // Red
  "technology-risk": "#FF69B4", // Hot Pink - distinct from market risk
  "business-risk": "#7d5a50", // Brown for "All" view
}

// Helper function to get months array based on year
const getMonths = (year) => {
  const currentYear = new Date().getFullYear()
  if (year === currentYear) {
    const currentMonth = new Date().getMonth()
    return Array.from({ length: currentMonth + 1 }, (_, i) => 
      new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' })
    )
  }
  return Array.from({ length: 12 }, (_, i) => 
    new Date(year, i, 1).toLocaleString('default', { month: 'short' })
  )
}

// Key Question Component with Show More functionality - UPDATED
const KeyQuestionBox = ({ question, signals, decisions, section }) => {
  const [showMore, setShowMore] = useState(false)
  
  const getFirstSentence = (text) => {
    const match = text.match(/^[^.!?]+[.!?]/)
    return match ? match[0] : text.split('.')[0] + '.'
  }
  
  return (
    <div
      style={{
        backgroundColor: "#DCDCDC",
        padding: "15px 20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #5d4037",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Question:</strong>
        <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>
          {showMore ? question : getFirstSentence(question)}
        </span>
        {!showMore && (question.length > getFirstSentence(question).length || signals || decisions) && (
          <button
            onClick={() => setShowMore(true)}
            style={{
              background: "none",
              border: "none",
              color: "#5d4037",
              fontWeight: "600",
              cursor: "pointer",
              marginLeft: "5px",
              textDecoration: "underline",
            }}
          >
            See more
          </button>
        )}
      </div>
      
      {showMore && (
        <>
          <div style={{ marginBottom: "8px" }}>
            <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Signals:</strong>
            <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>{signals}</span>
          </div>
          <div>
            <strong style={{ color: "#5d4037", fontSize: "14px" }}>Key Decisions:</strong>
            <span style={{ color: "#5d4037", fontSize: "14px", marginLeft: "8px" }}>{decisions}</span>
          </div>
          <button
            onClick={() => setShowMore(false)}
            style={{
              background: "none",
              border: "none",
              color: "#5d4037",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "10px",
              textDecoration: "underline",
            }}
          >
            See less
          </button>
        </>
      )}
    </div>
  )
}

const RISK_TYPE_DEFINITIONS = {
  "Financial Risk": "Risks related to funding, cash flow, pricing, revenue, and financial sustainability",
  "Market Risk": "Risks related to market dynamics, competition, demand shifts, and market positioning",
  "Operational Risk": "Risks related to processes, systems, resource availability, and operational execution",
  "Reputational Risk": "Risks related to brand perception, stakeholder trust, and public image",
  "Compliance Risk": "Risks related to legal requirements, regulations, licenses, and statutory obligations",
  "Technology Risk": "Risks related to technology infrastructure, cybersecurity, and digital capabilities",
}

// AI Analysis Component
const AIAnalysisButton = ({ 
  visionMissionData, 
  userId, 
  isInvestorView,
  triggerAnalysis 
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [savedAnalysis, setSavedAnalysis] = useState("")

  // Load saved analysis on component mount
  useEffect(() => {
    if (userId) {
      loadSavedAnalysis()
    }
  }, [userId])

  const loadSavedAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(db, "strategicClarityAnalysis", userId)
      const aiSnapshot = await getDoc(aiAnalysisRef)
      
      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data()
        if (data.analysis) {
          setSavedAnalysis(data.analysis)
          setAiAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error)
    }
  }

  // NEW: Function to clean up the AI response
  const cleanAIResponse = (text) => {
    if (!text) return text;
    
    // Remove all markdown hashtags (###, ##, #) and replace with bold styling or remove
    let cleaned = text
      // Remove hashtags at beginning of lines
      .replace(/^#+\s*/gm, '')
      // Remove any remaining hashtags
      .replace(/#/g, '')
      // Remove asterisk formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
    
    return cleaned;
  }

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.")
      return
    }

    if (!visionMissionData || !userId) {
      setAnalysisError("No data available for analysis.")
      return
    }

    setIsGenerating(true)
    setAnalysisError("")
    setShowAnalysis(true)

    try {
      // Prepare data for AI analysis
      const analysisData = prepareStrategicClarityData(visionMissionData)
      
      // Create prompt for AI analysis
      const prompt = createStrategicClarityPrompt(analysisData)

      // Call Firebase Function for AI analysis
      const functions = getFunctions()
      const generateStrategicClarityAnalysis = httpsCallable(functions, "generateStrategicClarityAnalysis")
      
      const response = await generateStrategicClarityAnalysis({
        prompt: prompt,
        userId: userId,
        timestamp: new Date().toISOString()
      })

      let analysis = response?.data?.content || response?.data?.analysis
      
      if (!analysis) {
        throw new Error("No analysis generated")
      }

      // Clean the analysis before saving
      analysis = cleanAIResponse(analysis);

      // Save analysis to Firestore
      const aiAnalysisRef = doc(db, "strategicClarityAnalysis", userId)
      await setDoc(aiAnalysisRef, {
        analysis: analysis,
        timestamp: new Date().toISOString(),
        dataSnapshot: visionMissionData,
        userId: userId
      }, { merge: true })

      setAiAnalysis(analysis)
      setSavedAnalysis(analysis)
      
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      setAnalysisError(`Failed to generate analysis: ${error.message}`)
      setAiAnalysis("AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric.")
    } finally {
      setIsGenerating(false)
    }
  }

  const prepareStrategicClarityData = (data) => {
    return {
      vision: data.vision || "Not provided",
      mission: data.mission || "Not provided",
      values: data.values || [],
      operatingPrinciples: data.operatingPrinciples || [],
      strategicPriorities: data.strategicPriorities || [],
      strategicHorizon: data.strategicHorizon || "12",
      completedPriorities: data.strategicPriorities?.filter(p => p.status === "Done").length || 0,
      totalPriorities: data.strategicPriorities?.length || 0,
      valuesCount: data.values?.length || 0,
      operatingPrinciplesCount: data.operatingPrinciples?.length || 0,
      hasVision: !!data.vision,
      hasMission: !!data.mission,
      hasValues: data.values?.length > 0,
      hasOperatingPrinciples: data.operatingPrinciples?.length > 0,
      hasPriorities: data.strategicPriorities?.length > 0
    }
  }

  const createStrategicClarityPrompt = (data) => {
    return `Analyze the strategic clarity of a business based on the following data and provide actionable insights:

STRATEGIC CLARITY ASSESSMENT DATA:
1. Vision Statement: ${data.vision}
2. Mission Statement: ${data.mission}
3. Core Values: ${data.valuesCount} values defined - ${data.values.join(", ")}
4. Operating Principles: ${data.operatingPrinciplesCount} principles defined - ${data.operatingPrinciples.join(", ")}
5. Strategic Horizon: ${data.strategicHorizon} months
6. Strategic Priorities: ${data.totalPriorities} total, ${data.completedPriorities} completed
   ${data.strategicPriorities.map((p, i) => `${i+1}. ${p.description} (Due: ${p.dueDate}, Status: ${p.status})`).join("\n   ")}

ANALYSIS REQUIREMENTS:
1. ASSESSMENT OVERVIEW:
   - Evaluate completeness of strategic elements (vision, mission, values, operating principles, priorities)
   - Rate strategic clarity on a scale of 1-10 (10 being highest)
   - Identify strengths and gaps

2. DATA TRENDS ANALYSIS:
   - Compare against industry benchmarks for strategic planning
   - Analyze completion rate of strategic priorities
   - Assess alignment between vision, mission, principles, and actual priorities

3. ACTIONABLE INSIGHTS:
   - Provide 3-5 specific, actionable recommendations
   - Suggest improvements for each strategic element
   - Include timelines and measurable goals

4. RISK ASSESSMENT:
   - Identify potential strategic risks based on gaps
   - Suggest mitigation strategies

5. IMPROVEMENT ROADMAP:
   - Priority areas for immediate attention
   - Timeline for strategic review and updates
   - Key performance indicators to track progress

OUTPUT FORMAT:
Executive Summary
[Brief overview of strategic clarity status]

Current Assessment
- Vision: [Analysis of vision statement clarity and effectiveness]
- Mission: [Analysis of mission statement alignment and focus]
- Values: [Analysis of core values implementation]
- Operating Principles: [Analysis of operating principles and their impact]
- Strategic Priorities: [Analysis of priority setting and execution]
- Strategic Horizon: [Analysis of timeframe appropriateness]

Strategic Clarity Score: [X]/10
Rating: [Poor/Fair/Good/Excellent]

Data Trends & Benchmark Comparison
[Comparison against industry standards and historical trends]

Actionable Recommendations
1. [Specific action with timeline]
2. [Specific action with measurable goal]
3. [Specific action with concrete steps]

Risk Assessment & Mitigation
[Identify risks and provide mitigation strategies]

Improvement Roadmap
[Timeline and steps for strategic clarity enhancement]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`
  }

  const handleAIAnalysis = () => {
    if (!showAnalysis) {
      // If we have saved analysis, show it
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis)
        setShowAnalysis(true)
      } else {
        // Otherwise generate new analysis
        generateAIAnalysis()
      }
    } else {
      setShowAnalysis(!showAnalysis)
    }
  }

  const refreshAnalysis = async () => {
    await generateAIAnalysis()
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
        <button
          onClick={handleAIAnalysis}
          disabled={isGenerating || isInvestorView}
          style={{
            padding: "12px 24px",
            backgroundColor: isInvestorView ? "#a1887f" : "#4a352f",
            color: "#fdfcfb",
            border: "none",
            borderRadius: "6px",
            cursor: isInvestorView ? "not-allowed" : "pointer",
            fontWeight: "600",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            opacity: isGenerating ? 0.7 : 1
          }}
        >
          {isGenerating ? (
            <>
              <FaSpinner className="spin" style={{ animation: "spin 1s linear infinite" }} />
              Generating Analysis...
            </>
          ) : (
            <>
              <FaRobot />
              AI Analysis
            </>
          )}
        </button>

        {savedAnalysis && !isGenerating && (
          <button
            onClick={refreshAnalysis}
            disabled={isInvestorView}
            style={{
              padding: "8px 16px",
              backgroundColor: "#7d5a50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isInvestorView ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
            title="Refresh AI Analysis"
          >
            Refresh
          </button>
        )}
      </div>
      
      {showAnalysis && (
        <div
          style={{
            backgroundColor: "#f8f4f0",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #d7ccc8",
            marginTop: "10px",
            position: "relative"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "15px"
          }}>
            <div>
              <label
                style={{
                  fontSize: "16px",
                  color: "#5d4037",
                  fontWeight: "600",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Strategic Clarity AI Analysis
              </label>
              <p style={{
                fontSize: "12px",
                color: "#8d6e63",
                margin: "0 0 10px 0",
                fontStyle: "italic"
              }}>
                Analysis generated from your strategic clarity data
              </p>
            </div>
            
            {savedAnalysis && (
              <span style={{
                fontSize: "10px",
                color: "#8d6e63",
                backgroundColor: "#efebe9",
                padding: "4px 8px",
                borderRadius: "4px",
                fontWeight: "500"
              }}>
                Saved Analysis
              </span>
            )}
          </div>

          {analysisError ? (
            <div style={{
              padding: "15px",
              backgroundColor: "#ffebee",
              borderRadius: "6px",
              border: "1px solid #ffcdd2",
              color: "#c62828",
              fontSize: "14px"
            }}>
              <strong>Error:</strong> {analysisError}
            </div>
          ) : isGenerating ? (
            <div style={{
              textAlign: "center",
              padding: "30px",
              color: "#5d4037"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                border: "3px solid #f3e5f5",
                borderTop: "3px solid #8d6e63",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 15px"
              }}></div>
              <p>Analyzing your strategic clarity data...</p>
              <p style={{ fontSize: "12px", color: "#8d6e63", marginTop: "5px" }}>
                Comparing against industry benchmarks and best practices
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "6px",
                border: "1px solid #e8d8cf",
                maxHeight: "400px",
                overflowY: "auto",
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#5d4037",
                whiteSpace: "pre-wrap"
              }}
            >
              {aiAnalysis || "AI analysis will be generated based on your data trends, comparing current performance against historical averages and industry benchmarks. This feature provides actionable insights for improving this metric."}
            </div>
          )}

          <div style={{
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px solid #e8d8cf",
            fontSize: "11px",
            color: "#8d6e63",
            fontStyle: "italic",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Analysis powered by AI • Updates when data changes</span>
            <button
              onClick={() => setShowAnalysis(false)}
              style={{
                background: "none",
                border: "none",
                color: "#8d6e63",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              Hide Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// Strategic Clarity Component with updated UI and Operating Principles
const StrategicClarity = ({ activeSection, currentUser, isInvestorView }) => {
  const [visionMissionData, setVisionMissionData] = useState({
    vision: "",
    mission: "",
    values: [],
    operatingPrinciples: [],
    strategicPriorities: [],
    strategicHorizon: "12",
  })
  const [showModal, setShowModal] = useState(false)
  const [showOperatingPrincipleModal, setShowOperatingPrincipleModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [newOperatingPrinciple, setNewOperatingPrinciple] = useState("")
  const [newPriority, setNewPriority] = useState({
    description: "",
    dueDate: "",
    status: "Not Done",
  })
  const [triggerAnalysis, setTriggerAnalysis] = useState(false)

  // Load data and set up real-time listener
  useEffect(() => {
    if (!currentUser || activeSection !== "strategic-clarity") return

    const loadVisionMissionData = async () => {
      try {
        const visionMissionSnapshot = await getDocs(
          query(collection(db, "visionMission"), where("userId", "==", currentUser.uid)),
        )

        if (!visionMissionSnapshot.empty) {
          const data = visionMissionSnapshot.docs[0].data()
          setVisionMissionData({
            vision: data.vision || "",
            mission: data.mission || "",
            values: data.values || [],
            operatingPrinciples: data.operatingPrinciples || [],
            strategicPriorities: data.strategicPriorities || [],
            strategicHorizon: data.strategicHorizon || "12",
          })
        }
      } catch (error) {
        console.error("Error loading vision/mission data:", error)
      }
    }

    loadVisionMissionData()

    // Set up real-time listener for changes
    const visionMissionQuery = query(
      collection(db, "visionMission"), 
      where("userId", "==", currentUser.uid)
    )
    
    const unsubscribe = onSnapshot(visionMissionQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data()
        setVisionMissionData({
          vision: data.vision || "",
          mission: data.mission || "",
          values: data.values || [],
          operatingPrinciples: data.operatingPrinciples || [],
          strategicPriorities: data.strategicPriorities || [],
          strategicHorizon: data.strategicHorizon || "12",
        })
        
        // Trigger AI analysis when data changes significantly
        if (snapshot.docs[0].metadata.hasPendingWrites) {
          setTriggerAnalysis(true)
        }
      }
    })

    return () => unsubscribe()
  }, [activeSection, currentUser])

  // Reset trigger after analysis
  useEffect(() => {
    if (triggerAnalysis) {
      // Trigger AI analysis update
      setTriggerAnalysis(false)
    }
  }, [triggerAnalysis])

  if (activeSection !== "strategic-clarity") return null

  const handleSaveVisionMission = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save data.")
      return
    }

    try {
      const dataWithUser = {
        ...visionMissionData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      }

      const existingSnapshot = await getDocs(
        query(collection(db, "visionMission"), where("userId", "==", currentUser.uid)),
      )

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "visionMission"), dataWithUser)
      } else {
        const docRef = doc(db, "visionMission", existingSnapshot.docs[0].id)
        await updateDoc(docRef, dataWithUser)
      }

      alert("Strategic Clarity data saved successfully!")
    } catch (error) {
      console.error("Error saving vision/mission data:", error)
      alert("Error saving data. Please try again.")
    }
  }

  const handleAddValue = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (newValue.trim()) {
      setVisionMissionData((prev) => ({
        ...prev,
        values: [...prev.values, newValue.trim()],
      }))
      setNewValue("")
      setShowModal(false)
    }
  }

  const handleRemoveValue = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setVisionMissionData((prev) => ({
      ...prev,
      values: prev.values.filter((_, i) => i !== index),
    }))
  }

  const handleAddOperatingPrinciple = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (newOperatingPrinciple.trim()) {
      setVisionMissionData((prev) => ({
        ...prev,
        operatingPrinciples: [...prev.operatingPrinciples, newOperatingPrinciple.trim()],
      }))
      setNewOperatingPrinciple("")
      setShowOperatingPrincipleModal(false)
    }
  }

  const handleRemoveOperatingPrinciple = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setVisionMissionData((prev) => ({
      ...prev,
      operatingPrinciples: prev.operatingPrinciples.filter((_, i) => i !== index),
    }))
  }

  const handleAddPriority = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (newPriority.description.trim() && visionMissionData.strategicPriorities.length < 5) {
      setVisionMissionData((prev) => ({
        ...prev,
        strategicPriorities: [...prev.strategicPriorities, { ...newPriority }],
      }))
      setNewPriority({
        description: "",
        dueDate: "",
        status: "Not Done",
      })
      setShowPriorityModal(false)
    } else if (visionMissionData.strategicPriorities.length >= 5) {
      alert("Maximum 5 strategic priorities allowed")
    }
  }

  const handleRemovePriority = (index) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setVisionMissionData((prev) => ({
      ...prev,
      strategicPriorities: prev.strategicPriorities.filter((_, i) => i !== index),
    }))
  }

  const handleUpdatePriority = (index, field, value) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setVisionMissionData((prev) => ({
      ...prev,
      strategicPriorities: prev.strategicPriorities.map((priority, i) =>
        i === index ? { ...priority, [field]: value } : priority
      ),
    }))
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Key Question Section */}
      <KeyQuestionBox
        question={SECTION_DATA["strategic-clarity"].keyQuestion}
        signals={SECTION_DATA["strategic-clarity"].keySignals}
        decisions={SECTION_DATA["strategic-clarity"].keyDecisions}
      />

      {!currentUser && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#856404", margin: 0 }}>Please log in to access and manage your Strategic Clarity data.</p>
        </div>
      )}

      {currentUser && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "30px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "#f7f3f0",
                padding: "20px",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Vision</h3>
              <textarea
                value={visionMissionData.vision}
                onChange={(e) => setVisionMissionData((prev) => ({ ...prev, vision: e.target.value }))}
                placeholder="Enter your organization's vision statement..."
                rows="6"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>

            <div
              style={{
                backgroundColor: "#f7f3f0",
                padding: "20px",
                borderRadius: "6px",
              }}
            >
              <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>Mission</h3>
              <textarea
                value={visionMissionData.mission}
                onChange={(e) => setVisionMissionData((prev) => ({ ...prev, mission: e.target.value }))}
                placeholder="Enter your organization's mission statement..."
                rows="6"
                disabled={isInvestorView}
                style={{
                  width: "100%",
                  padding: "15px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                  backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                  cursor: isInvestorView ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          {/* Core Values Section */}
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: "#5d4037", margin: 0 }}>Core Values</h3>
              {!isInvestorView && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Value
                </button>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              {visionMissionData.values.map((value, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#fdfcfb",
                    padding: "15px",
                    borderRadius: "4px",
                    border: "2px solid #e8ddd4",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#5d4037", fontWeight: "500" }}>{value}</span>
                  {!isInvestorView && (
                    <button
                      onClick={() => handleRemoveValue(index)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#d32f2f",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "0 5px",
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operating Principles Section - NEW */}
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: "#5d4037", margin: 0 }}>Operating Principles</h3>
              {!isInvestorView && (
                <button
                  onClick={() => setShowOperatingPrincipleModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Principle
                </button>
              )}
            </div>

            {visionMissionData.operatingPrinciples.length === 0 ? (
              <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>
                No operating principles added yet. Add principles that guide how you operate and make decisions.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "15px",
                }}
              >
                {visionMissionData.operatingPrinciples.map((principle, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "#fdfcfb",
                      padding: "15px",
                      borderRadius: "4px",
                      border: "2px solid #bcaaa4",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "#5d4037", fontWeight: "500" }}>{principle}</span>
                    {!isInvestorView && (
                      <button
                        onClick={() => handleRemoveOperatingPrinciple(index)}
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                          color: "#d32f2f",
                          cursor: "pointer",
                          fontSize: "18px",
                          padding: "0 5px",
                        }}
                        title="Delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Strategic Horizon */}
          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0, marginBottom: "15px" }}>
              Strategic Horizon
            </h3>
            <select
              value={visionMissionData.strategicHorizon}
              onChange={(e) => setVisionMissionData((prev) => ({ ...prev, strategicHorizon: e.target.value }))}
              disabled={isInvestorView}
              style={{
                width: "150px",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                cursor: isInvestorView ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              <option value="12">12 months</option>
              <option value="18">18 months</option>
              <option value="24">24 months</option>
              <option value="30">30 months</option>
              <option value="36">36 months</option>
            </select>
          </div>

          <div
            style={{
              backgroundColor: "#f7f3f0",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3 style={{ color: "#5d4037", margin: 0 }}>Strategic Priorities (Max 3-5)</h3>
              {!isInvestorView && visionMissionData.strategicPriorities.length < 5 && (
                <button
                  onClick={() => setShowPriorityModal(true)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "12px",
                  }}
                >
                  Add Priority
                </button>
              )}
            </div>

            {visionMissionData.strategicPriorities.length === 0 ? (
              <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>
                No strategic priorities added yet.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    color: "#4a352f",
                    minWidth: "800px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Description</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "120px" }}>Due Date</th>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "120px" }}>Status</th>
                      {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", width: "80px" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {visionMissionData.strategicPriorities.map((priority, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid #e6d7c3" }}>
                        <td style={{ padding: "12px" }}>
                          {isInvestorView ? (
                            priority.description
                          ) : (
                            <input
                              type="text"
                              value={priority.description}
                              onChange={(e) => handleUpdatePriority(index, "description", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            />
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {isInvestorView ? (
                            priority.dueDate
                          ) : (
                            <input
                              type="date"
                              value={priority.dueDate}
                              onChange={(e) => handleUpdatePriority(index, "dueDate", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            />
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {isInvestorView ? (
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "500",
                                backgroundColor: priority.status === "Done" ? "#c8e6c9" : "#ffcdd2",
                              }}
                            >
                              {priority.status}
                            </span>
                          ) : (
                            <select
                              value={priority.status}
                              onChange={(e) => handleUpdatePriority(index, "status", e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #e8ddd4",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                            >
                              <option value="Not Done">Not Done</option>
                              <option value="Done">Done</option>
                            </select>
                          )}
                        </td>
                        {!isInvestorView && (
                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() => handleRemovePriority(index)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#F44336",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11px",
                              }}
                              title="Delete"
                            >
                              ×
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <AIAnalysisButton 
            visionMissionData={visionMissionData}
            userId={currentUser?.uid}
            isInvestorView={isInvestorView}
            triggerAnalysis={triggerAnalysis}
          />

          {!isInvestorView && (
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={handleSaveVisionMission}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Save Changes
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Value Modal */}
      {showModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Core Value</h3>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter a core value..."
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddValue}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Value
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Operating Principle Modal - NEW */}
      {showOperatingPrincipleModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Operating Principle</h3>
            <input
              type="text"
              value={newOperatingPrinciple}
              onChange={(e) => setNewOperatingPrinciple(e.target.value)}
              placeholder="Enter an operating principle..."
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowOperatingPrincipleModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddOperatingPrinciple}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Principle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Priority Modal */}
      {showPriorityModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>Add Strategic Priority</h3>
            <input
              type="text"
              value={newPriority.description}
              onChange={(e) => setNewPriority(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter a strategic priority..."
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <input
              type="date"
              value={newPriority.dueDate}
              onChange={(e) => setNewPriority(prev => ({ ...prev, dueDate: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <select
              value={newPriority.status}
              onChange={(e) => setNewPriority(prev => ({ ...prev, status: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              <option value="Not Done">Not Done</option>
              <option value="Done">Done</option>
            </select>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowPriorityModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPriority}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Priority
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Business Model Canvas Component with sub-tabs
const BusinessModelCanvas = ({ activeSection, currentUser, isInvestorView }) => {
  const [activeSubTab, setActiveSubTab] = useState("all")
  const [viewMode, setViewMode] = useState("month")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const [canvasData, setCanvasData] = useState({
    keyPartners: "",
    keyActivities: "",
    keyResources: "",
    valuePropositions: "",
    customerRelationships: "",
    channels: "",
    customerSegments: "",
    costStructure: "",
    revenueStreams: "",
  })

  // AI Analysis States
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [savedAnalysis, setSavedAnalysis] = useState("")

  useEffect(() => {
    const loadCanvasData = async () => {
      if (!currentUser || activeSection !== "operating-model") return

      try {
        const canvasSnapshot = await getDocs(
          query(collection(db, "businessModelCanvas"), where("userId", "==", currentUser.uid)),
        )

        if (!canvasSnapshot.empty) {
          const data = canvasSnapshot.docs[0].data()
          setCanvasData(data)
        }
      } catch (error) {
        console.error("Error loading canvas data:", error)
      }
    }

    loadCanvasData()
  }, [activeSection, currentUser])

  // Load saved AI analysis
  useEffect(() => {
    if (currentUser && activeSection === "operating-model") {
      loadSavedAIAnalysis()
    }
  }, [currentUser, activeSection])

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(db, "businessModelCanvasAnalysis", currentUser.uid)
      const aiSnapshot = await getDoc(aiAnalysisRef)
      
      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data()
        if (data.analysis) {
          setSavedAnalysis(data.analysis)
          setAiAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error)
    }
  }

  // NEW: Function to clean up the AI response
  const cleanAIResponse = (text) => {
    if (!text) return text;
    
    // Remove all markdown hashtags (###, ##, #) and replace with bold styling or remove
    let cleaned = text
      // Remove hashtags at beginning of lines
      .replace(/^#+\s*/gm, '')
      // Remove any remaining hashtags
      .replace(/#/g, '')
      // Remove asterisk formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
    
    return cleaned;
  }

  if (activeSection !== "operating-model") return null

  const handleSaveCanvas = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save data.")
      return
    }

    try {
      const dataWithUser = {
        ...canvasData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      }

      const existingSnapshot = await getDocs(
        query(collection(db, "businessModelCanvas"), where("userId", "==", currentUser.uid)),
      )

      if (existingSnapshot.empty) {
        await addDoc(collection(db, "businessModelCanvas"), dataWithUser)
      } else {
        const docRef = doc(db, "businessModelCanvas", existingSnapshot.docs[0].id)
        await updateDoc(docRef, dataWithUser)
      }

      alert("Operating Model saved successfully!")
    } catch (error) {
      console.error("Error saving canvas data:", error)
      alert("Error saving data. Please try again.")
    }
  }

  // AI Analysis Functions
  const prepareBusinessModelData = (data) => {
    return {
      keyPartners: data.keyPartners || "Not provided",
      keyActivities: data.keyActivities || "Not provided",
      keyResources: data.keyResources || "Not provided",
      valuePropositions: data.valuePropositions || "Not provided",
      customerRelationships: data.customerRelationships || "Not provided",
      channels: data.channels || "Not provided",
      customerSegments: data.customerSegments || "Not provided",
      costStructure: data.costStructure || "Not provided",
      revenueStreams: data.revenueStreams || "Not provided",
      // Assessment metrics
      hasValueProposition: !!data.valuePropositions,
      hasCustomerSegments: !!data.customerSegments,
      hasRevenueStreams: !!data.revenueStreams,
      hasCostStructure: !!data.costStructure,
      hasKeyPartners: !!data.keyPartners,
      hasKeyActivities: !!data.keyActivities,
      hasKeyResources: !!data.keyResources,
      hasChannels: !!data.channels,
      hasCustomerRelationships: !!data.customerRelationships,
    }
  }

  const createBusinessModelPrompt = (data) => {
    return `Analyze the Business Model Canvas and Operating Model of a business based on the following data:

BUSINESS MODEL CANVAS DATA:
1. Key Partners: ${data.keyPartners}
2. Key Activities: ${data.keyActivities}
3. Key Resources: ${data.keyResources}
4. Value Propositions: ${data.valuePropositions}
5. Customer Relationships: ${data.customerRelationships}
6. Channels: ${data.channels}
7. Customer Segments: ${data.customerSegments}
8. Cost Structure: ${data.costStructure}
9. Revenue Streams: ${data.revenueStreams}

ANALYSIS REQUIREMENTS:

1. OPERATING MODEL ASSESSMENT:
   - Evaluate completeness of each Business Model Canvas block
   - Identify strengths and gaps in the current operating model
   - Rate overall operating model maturity (1-10)

2. COHERENCE ANALYSIS:
   - How well do the nine building blocks align with each other?
   - Is there logical flow from value proposition to customer segments to revenue?
   - Are key activities and resources appropriate for the value proposition?

3. SCALABILITY ASSESSMENT:
   - Can this operating model scale with business growth?
   - Identify bottlenecks or constraints
   - Suggest improvements for scalability

4. RISK IDENTIFICATION:
   - What are the critical dependencies or vulnerabilities?
   - Which building blocks are underdeveloped?
   - What external factors could impact this model?

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements
   - Prioritize recommendations by impact and effort
   - Include timelines and measurable outcomes

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with an Operating Model Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of operating model status]

Business Model Canvas Assessment
- Key Partners: [Analysis and recommendations]
- Key Activities: [Analysis and recommendations]
- Key Resources: [Analysis and recommendations]
- Value Propositions: [Analysis and recommendations]
- Customer Relationships: [Analysis and recommendations]
- Channels: [Analysis and recommendations]
- Customer Segments: [Analysis and recommendations]
- Cost Structure: [Analysis and recommendations]
- Revenue Streams: [Analysis and recommendations]

Operating Model Coherence Score: [X]/10
Rating: [Poor/Fair/Good/Excellent]

Scalability Assessment
[Analysis of scalability potential with recommendations]

Risk Analysis
[Key risks and mitigation strategies]

Top 5 Actionable Recommendations
1. [Specific action with timeline]
2. [Specific action with measurable goal]
3. [Specific action with concrete steps]
4. [Specific action with owner suggestion]
5. [Specific action with expected impact]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`
  }

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.")
      return
    }

    if (!canvasData || !currentUser) {
      setAnalysisError("No data available for analysis.")
      return
    }

    setIsGenerating(true)
    setAnalysisError("")
    setShowAIAnalysis(true)

    try {
      const analysisData = prepareBusinessModelData(canvasData)
      const prompt = createBusinessModelPrompt(analysisData)

      const functions = getFunctions()
      const generateOperatingModelAnalysis = httpsCallable(functions, "generateOperatingModelAnalysis")
      
      const response = await generateOperatingModelAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      })

      let analysis = response?.data?.content || response?.data?.analysis
      
      if (!analysis) {
        throw new Error("No analysis generated")
      }

      // Clean the analysis before saving
      analysis = cleanAIResponse(analysis);

      // Save analysis to Firestore
      const aiAnalysisRef = doc(db, "businessModelCanvasAnalysis", currentUser.uid)
      await setDoc(aiAnalysisRef, {
        analysis: analysis,
        timestamp: new Date().toISOString(),
        dataSnapshot: canvasData,
        userId: currentUser.uid
      }, { merge: true })

      setAiAnalysis(analysis)
      setSavedAnalysis(analysis)
      
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      setAnalysisError(`Failed to generate analysis: ${error.message}`)
      setAiAnalysis("AI analysis will be generated based on your Business Model Canvas data, comparing against best practices and industry benchmarks. This feature provides actionable insights for improving your operating model.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis)
        setShowAIAnalysis(true)
      } else {
        generateAIAnalysis()
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis)
    }
  }

  const refreshAnalysis = async () => {
    await generateAIAnalysis()
  }

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Key Question Section */}
      <KeyQuestionBox
        question={SECTION_DATA["operating-model"].keyQuestion}
        signals={SECTION_DATA["operating-model"].keySignals}
        decisions={SECTION_DATA["operating-model"].keyDecisions}
      />

      {!currentUser && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            padding: "15px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#856404", margin: 0 }}>Please log in to access and manage your Operating Model.</p>
        </div>
      )}

      {currentUser && (
        <>
          {/* Content based on active sub-tab */}
          {activeSubTab === "all" ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              {/* First Row - Value Proposition and Key Activities */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {/* Value Proposition */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                    Value Proposition
                  </h4>
                  <textarea
                    value={canvasData.valuePropositions}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, valuePropositions: e.target.value }))}
                    placeholder="What value do you deliver?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>

                {/* Key Activities */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Key Activities</h4>
                  <textarea
                    value={canvasData.keyActivities}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, keyActivities: e.target.value }))}
                    placeholder="What key activities do you perform?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>

              {/* Second Row - Key Partners and Key Resources */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {/* Key Partners */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Key Partners</h4>
                  <textarea
                    value={canvasData.keyPartners}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, keyPartners: e.target.value }))}
                    placeholder="Who are your key partners?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>

                {/* Key Resources */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Key Resources</h4>
                  <textarea
                    value={canvasData.keyResources}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, keyResources: e.target.value }))}
                    placeholder="What key resources do you need?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>

              {/* Third Row - Customer Segments, Channels, and Customer Relationships */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                {/* Customer Segments */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                    Customer Segments
                  </h4>
                  <textarea
                    value={canvasData.customerSegments}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, customerSegments: e.target.value }))}
                    placeholder="Who are your customers?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>

                {/* Channels */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Channels</h4>
                  <textarea
                    value={canvasData.channels}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, channels: e.target.value }))}
                    placeholder="How do you reach customers?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>

                {/* Customer Relationships */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                    Customer Relationships
                  </h4>
                  <textarea
                    value={canvasData.customerRelationships}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, customerRelationships: e.target.value }))}
                    placeholder="What relationships do you have with customers?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>

              {/* Fourth Row - Cost Structure and Revenue Streams */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                {/* Cost Structure */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>Cost Structure</h4>
                  <textarea
                    value={canvasData.costStructure}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, costStructure: e.target.value }))}
                    placeholder="What are your main costs?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>

                {/* Revenue Streams */}
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    borderRadius: "6px",
                    border: "2px solid #e8ddd4",
                  }}
                >
                  <h4 style={{ color: "#5d4037", marginTop: 0, marginBottom: "10px", fontSize: "14px" }}>
                    Revenue Streams
                  </h4>
                  <textarea
                    value={canvasData.revenueStreams}
                    onChange={(e) => setCanvasData((prev) => ({ ...prev, revenueStreams: e.target.value }))}
                    placeholder="How do you generate revenue?"
                    rows="4"
                    disabled={isInvestorView}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #e8ddd4",
                      borderRadius: "4px",
                      fontSize: "12px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "inherit",
                      backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                      cursor: isInvestorView ? "not-allowed" : "text",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "6px",
                  border: "2px solid #e8ddd4",
                  marginBottom: "20px",
                }}
              >
                <textarea
                  value={canvasData[activeSubTab] || ""}
                  onChange={(e) => setCanvasData((prev) => ({ ...prev, [activeSubTab]: e.target.value }))}
                  rows="6"
                  disabled={isInvestorView}
                  style={{
                    width: "100%",
                    padding: "15px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    resize: "vertical",
                    fontFamily: "inherit",
                    backgroundColor: isInvestorView ? "#f5f5f5" : "white",
                    cursor: isInvestorView ? "not-allowed" : "text",
                  }}
                />
              </div>
            </div>
          )}

          {/* AI Analysis Section */}
          <div style={{ marginTop: "30px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <button
                onClick={handleAIAnalysis}
                disabled={isGenerating || isInvestorView}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isInvestorView ? "#a1887f" : "#4a352f",
                  color: "#fdfcfb",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isInvestorView ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  opacity: isGenerating ? 0.7 : 1
                }}
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <FaRobot />
                    AI Operating Model Analysis
                  </>
                )}
              </button>

              {savedAnalysis && !isGenerating && !isInvestorView && (
                <button
                  onClick={refreshAnalysis}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#7d5a50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                  title="Refresh AI Analysis"
                >
                  Refresh
                </button>
              )}
            </div>
            
            {showAIAnalysis && (
              <div
                style={{
                  backgroundColor: "#f8f4f0",
                  padding: "20px",
                  borderRadius: "8px",
                  border: "1px solid #d7ccc8",
                  marginTop: "10px",
                  position: "relative"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "15px"
                }}>
                  <div>
                    <label
                      style={{
                        fontSize: "16px",
                        color: "#5d4037",
                        fontWeight: "600",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Operating Model AI Analysis
                    </label>
                    <p style={{
                      fontSize: "12px",
                      color: "#8d6e63",
                      margin: "0 0 10px 0",
                      fontStyle: "italic"
                    }}>
                      Analysis generated from your Business Model Canvas data
                    </p>
                  </div>
                  
                  {savedAnalysis && (
                    <span style={{
                      fontSize: "10px",
                      color: "#8d6e63",
                      backgroundColor: "#efebe9",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "500"
                    }}>
                      Saved Analysis
                    </span>
                  )}
                </div>

                {analysisError ? (
                  <div style={{
                    padding: "15px",
                    backgroundColor: "#ffebee",
                    borderRadius: "6px",
                    border: "1px solid #ffcdd2",
                    color: "#c62828",
                    fontSize: "14px"
                  }}>
                    <strong>Error:</strong> {analysisError}
                  </div>
                ) : isGenerating ? (
                  <div style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "#5d4037"
                  }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      border: "3px solid #f3e5f5",
                      borderTop: "3px solid #8d6e63",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 15px"
                    }}></div>
                    <p>Analyzing your Business Model Canvas...</p>
                    <p style={{ fontSize: "12px", color: "#8d6e63", marginTop: "5px" }}>
                      Evaluating coherence, scalability, and alignment
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      backgroundColor: "white",
                      padding: "20px",
                      borderRadius: "6px",
                      border: "1px solid #e8d8cf",
                      maxHeight: "400px",
                      overflowY: "auto",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#5d4037",
                      whiteSpace: "pre-wrap"
                    }}
                  >
                    {aiAnalysis || "AI analysis will be generated based on your Business Model Canvas data, comparing against best practices and industry benchmarks. This feature provides actionable insights for improving your operating model."}
                  </div>
                )}

                <div style={{
                  marginTop: "15px",
                  paddingTop: "15px",
                  borderTop: "1px solid #e8d8cf",
                  fontSize: "11px",
                  color: "#8d6e63",
                  fontStyle: "italic",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>Analysis powered by AI • Updates when data changes</span>
                  <button
                    onClick={() => setShowAIAnalysis(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8d6e63",
                      cursor: "pointer",
                      fontSize: "12px",
                      textDecoration: "underline"
                    }}
                  >
                    Hide Analysis
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isInvestorView && (
            <div style={{ textAlign: "right", marginTop: "20px" }}>
              <button
                onClick={handleSaveCanvas}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                Save Operating Model
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Strategy Operationalisation Component with sub-tabs
const StrategicGoals = ({ activeSection, milestoneData, setMilestoneData, currentUser, isInvestorView }) => {
  const [activeSubTab, setActiveSubTab] = useState("all")
  const [viewMode, setViewMode] = useState("month")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // AI Analysis States
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [savedAnalysis, setSavedAnalysis] = useState("")
  
  // Filter states
  const [filterGoal, setFilterGoal] = useState("")
  const [filterGoalDomain, setFilterGoalDomain] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterOwner, setFilterOwner] = useState("")
  const [filterDate, setFilterDate] = useState("")
  
  const categories = [
    { key: "Growth", name: "Growth", color: "#4A2E1F" },
    { key: "Marketing", name: "Marketing", color: "#6B3F2A" },
    { key: "Finance", name: "Finance", color: "#8B5A2B" },
    { key: "Operations", name: "Operations", color: "#A47148" },
    { key: "Systems & Technology", name: "Systems & Technology", color: "#7A5230" },
    { key: "People", name: "People", color: "#C6A27E" },
    { key: "Governance", name: "Governance", color: "#E0C4A8" },
    { key: "Milestones", name: "Milestones", color: "#9d8573" },
    { key: "R&D", name: "R&D", color: "#b8a491" },
    { key: "ESG", name: "ESG", color: "#8b7355" },
  ]

  const subTabs = [
    { id: "all", label: "All" },
    ...categories.map(cat => ({ id: cat.key, label: cat.name })),
  ]

  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [newMilestone, setNewMilestone] = useState({
    growthStage: "",
    customGrowthStage: "",
    goal: "",
    goalDescription: "",
    milestoneDescription: "",
    targetDate: "",
    status: "",
    owner: "",
    percentageCompletion: 0,
  })

  // NEW: Function to clean up the AI response
  const cleanAIResponse = (text) => {
    if (!text) return text;
    
    // Remove all markdown hashtags (###, ##, #) and replace with bold styling or remove
    let cleaned = text
      // Remove hashtags at beginning of lines
      .replace(/^#+\s*/gm, '')
      // Remove any remaining hashtags
      .replace(/#/g, '')
      // Remove asterisk formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
    
    return cleaned;
  }

  // Load saved AI analysis
  useEffect(() => {
    if (currentUser && activeSection === "strategy-operationalisation") {
      loadSavedAIAnalysis()
    }
  }, [currentUser, activeSection])

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(db, "strategyOperationalisationAnalysis", currentUser.uid)
      const aiSnapshot = await getDoc(aiAnalysisRef)
      
      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data()
        if (data.analysis) {
          setSavedAnalysis(data.analysis)
          setAiAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error)
    }
  }

  if (activeSection !== "strategy-operationalisation") return null

  // Get unique values for filters
  const getUniqueGoals = () => {
    const goals = [...new Set(milestoneData.map(m => m.goal))].sort()
    return goals
  }

  const getUniqueGoalDomains = () => {
    const domains = [...new Set(milestoneData.map(m => m.growthStage))].sort()
    return domains
  }

  const getUniqueStatuses = () => {
    const statuses = [...new Set(milestoneData.map(m => m.status))].sort()
    return statuses
  }

  const getUniqueOwners = () => {
    const owners = [...new Set(milestoneData.map(m => m.owner))].sort()
    return owners
  }

  const calculateGoalCompletion = (goalNumber, growthStage) => {
    const relevantMilestones = milestoneData.filter(
      (milestone) => milestone.goal === `Goal ${goalNumber}` && milestone.growthStage === growthStage,
    )

    if (relevantMilestones.length === 0) return 0

    const totalPercentage = relevantMilestones.reduce((sum, milestone) => {
      return sum + (milestone.percentageCompletion || 0)
    }, 0)

    return Math.round(totalPercentage / relevantMilestones.length)
  }

  // Store all goal descriptions by goal for tooltips
  const getAllGoalDescriptions = (growthStage) => {
    const descriptionsByGoal = {};
    
    milestoneData
      .filter(m => m.growthStage === growthStage && m.goalDescription)
      .forEach(milestone => {
        if (!descriptionsByGoal[milestone.goal]) {
          descriptionsByGoal[milestone.goal] = new Set(); // Use Set to avoid duplicates
        }
        if (milestone.goalDescription) {
          descriptionsByGoal[milestone.goal].add(milestone.goalDescription);
        }
      });
    
    // Convert Sets to arrays
    const result = {};
    Object.keys(descriptionsByGoal).forEach(goal => {
      result[goal] = Array.from(descriptionsByGoal[goal]);
    });
    
    return result;
  };

  const createChartData = (growthStage, color) => {
    // Get all unique goals for this growth stage
    const goalsInStage = [...new Set(
      milestoneData
        .filter(m => m.growthStage === growthStage)
        .map(m => m.goal)
    )].sort()
    
    const completionData = goalsInStage.map(goal => {
      const relevantMilestones = milestoneData.filter(
        (milestone) => milestone.goal === goal && milestone.growthStage === growthStage,
      )
      
      if (relevantMilestones.length === 0) return 0
      
      const totalPercentage = relevantMilestones.reduce((sum, milestone) => {
        return sum + (milestone.percentageCompletion || 0)
      }, 0)
      
      return Math.round(totalPercentage / relevantMilestones.length)
    })

    // Get ALL goal descriptions for this growth stage
    const allGoalDescriptions = getAllGoalDescriptions(growthStage);

    return {
      labels: goalsInStage,
      datasets: [
        {
          label: "% Completion",
          data: completionData,
          backgroundColor: color,
          borderColor: "#7d5a50",
          borderWidth: 1,
          // Store goal descriptions directly in the dataset for tooltip access
          goalDescriptions: allGoalDescriptions,
        },
      ],
    }
  }

  // UPDATED chartOptions to show goal descriptions on hover
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false
      },
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          // Show the goal name
          title: (context) => {
            return context[0].label;
          },
          // Show completion percentage
          label: (context) => {
            return `Completion: ${context.raw}%`;
          },
          // Show goal descriptions
          afterBody: (context) => {
            const dataPoint = context[0];
            const goalName = dataPoint.label;
            
            // Get the growth stage from the chart's data-growth-stage attribute
            const chartElement = dataPoint.chart.canvas;
            const growthStage = chartElement?.getAttribute('data-growth-stage');
            
            if (!growthStage) return [];
            
            // Get goal descriptions for this goal and growth stage
            const goalDescriptions = milestoneData
              .filter(m => m.growthStage === growthStage && 
                          m.goal === goalName && 
                          m.goalDescription)
              .map(m => m.goalDescription);
            
            // Remove duplicates
            const uniqueDescriptions = [...new Set(goalDescriptions)];
            
            if (uniqueDescriptions.length === 0) {
              return ['No goal description available'];
            }
            
            // Format each goal description
            const descriptionLines = ['Goal Description:'];
            uniqueDescriptions.forEach((desc, index) => {
              descriptionLines.push(`  ${desc}`);
            });
            
            return descriptionLines;
          },
        },
        // Make tooltip multiline
        bodySpacing: 5,
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
        },
        title: {
          display: true,
          text: "Completion %",
          color: "#4a352f",
          font: {
            weight: "bold",
            size: 12,
          },
        },
        grid: {
          color: "#f0e6d9",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#4a352f",
        },
      },
    },
  }

  const goalDomains = [
    "Growth",
    "Marketing",
    "Finance",
    "Operations",
    "Systems & Technology",
    "People",
    "Governance",
    "Milestones",
    "R&D",
    "ESG",
    "Other (Specify)",
  ]

  const milestoneCategoriesByDomain = {
    "Growth": [
      "Market Research",
      "Product Development",
      "Testing & Quality Assurance",
      "Launch Preparation",
      "Continuous Improvement & Scaling",
      "Other (Specify)",
    ],
    "Marketing": [
      "Branding & Positioning",
      "Marketing Campaigns",
      "Sales & Conversion",
      "Partnerships & Affiliations",
      "Customer Retention & Engagement",
      "Other (Specify)",
    ],
    "Finance": [
      "Financial Planning & Forecasting",
      "Fundraising & Capital Strategy",
      "Cost Management",
      "Revenue Optimization",
      "Compliance & Financial Governance",
      "Other (Specify)",
    ],
    "Operations": [
      "Process Design & Optimization",
      "Resource & Procurement Management",
      "Team & Workforce Planning",
      "Quality Management",
      "Documentation & Reporting",
      "Other (Specify)",
    ],
    "Systems & Technology": [
      "System Integration",
      "Platform Infrastructure",
      "Security & Compliance",
      "Automation & AI Enablement",
      "Tech Cost Auditing & Optimization",
      "Other (Specify)",
    ],
    "People": [
      "Onboarding & Training",
      "Performance & Development",
      "Culture & Engagement",
      "User & Partner Training",
      "Other (Specify)",
    ],
    "Governance": [
      "Governance Framework",
      "Impact Measurement",
      "Ecosystem & Catalyst Partnerships",
      "Policy & Risk Management",
      "Other (Specify)",
    ],
    "Milestones": ["Key Deliverables", "Project Completion", "Other (Specify)"],
    "R&D": ["Research", "Development", "Innovation", "Prototyping", "Other (Specify)"],
    "ESG": ["Environmental", "Social", "Governance", "Sustainability", "Other (Specify)"],
    "Other (Specify)": ["Other (Specify)"],
  }

  // Dynamically generate goals based on existing milestones
  const getAvailableGoals = () => {
    const existingGoals = milestoneData.map(m => m.goal)
    // Get all goals up to the maximum existing goal number, plus allow for new ones
    const maxGoalNumber = existingGoals.reduce((max, goal) => {
      const match = goal.match(/Goal (\d+)/)
      if (match) {
        const num = parseInt(match[1])
        return num > max ? num : max
      }
      return max
    }, 0)
    
    // Generate goals up to max + 2 to allow for future goals
    const goals = []
    for (let i = 1; i <= maxGoalNumber + 2; i++) {
      goals.push(`Goal ${i}`)
    }
    return goals
  }

  const statuses = ["Not Started", "In Progress", "On Track", "At Risk", "Done"]
  const owners = ["Product Team", "Business Dev", "Legal Team", "Engineering", "Marketing", "Operations"]

  // Enhanced filtering for the table
  const filteredMilestones = milestoneData.filter((milestone) => {
    // Apply tab filter
    if (activeSubTab !== "all" && milestone.growthStage !== activeSubTab) return false
    
    // Apply all filters
    if (filterGoal && milestone.goal !== filterGoal) return false
    if (filterGoalDomain && milestone.growthStage !== filterGoalDomain) return false
    if (filterStatus && milestone.status !== filterStatus) return false
    if (filterOwner && milestone.owner !== filterOwner) return false
    if (filterDate && milestone.targetDate !== filterDate) return false
    
    return true
  })

  const clearAllFilters = () => {
    setFilterGoal("")
    setFilterGoalDomain("")
    setFilterStatus("")
    setFilterOwner("")
    setFilterDate("")
  }

  // AI Analysis Functions
  const prepareStrategicOperationalisationData = (data) => {
    // Group milestones by goal domain
    const milestonesByDomain = {}
    const milestonesByGoal = {}
    const milestonesByStatus = {}
    const completionRates = {}
    
    data.forEach((milestone) => {
      // By domain
      if (!milestonesByDomain[milestone.growthStage]) {
        milestonesByDomain[milestone.growthStage] = []
      }
      milestonesByDomain[milestone.growthStage].push(milestone)
      
      // By goal
      const goalKey = `${milestone.growthStage}-${milestone.goal}`
      if (!milestonesByGoal[goalKey]) {
        milestonesByGoal[goalKey] = []
      }
      milestonesByGoal[goalKey].push(milestone)
      
      // By status
      if (!milestonesByStatus[milestone.status]) {
        milestonesByStatus[milestone.status] = 0
      }
      milestonesByStatus[milestone.status]++
      
      // Completion rates by domain
      if (!completionRates[milestone.growthStage]) {
        completionRates[milestone.growthStage] = { total: 0, sum: 0 }
      }
      completionRates[milestone.growthStage].total++
      completionRates[milestone.growthStage].sum += milestone.percentageCompletion || 0
    })
    
    // Calculate average completion by domain
    const avgCompletionByDomain = {}
    Object.keys(completionRates).forEach(domain => {
      avgCompletionByDomain[domain] = Math.round(completionRates[domain].sum / completionRates[domain].total)
    })
    
    return {
      totalMilestones: data.length,
      milestonesByDomain,
      milestonesByGoal,
      milestonesByStatus,
      avgCompletionByDomain,
      domainsWithMilestones: Object.keys(milestonesByDomain),
      completedMilestones: data.filter(m => m.status === "Done").length,
      inProgressMilestones: data.filter(m => m.status === "In Progress" || m.status === "On Track").length,
      atRiskMilestones: data.filter(m => m.status === "At Risk").length,
      notStartedMilestones: data.filter(m => m.status === "Not Started").length,
      overallCompletionRate: data.length > 0 
        ? Math.round(data.reduce((sum, m) => sum + (m.percentageCompletion || 0), 0) / data.length) 
        : 0,
    }
  }

  const createStrategicOperationalisationPrompt = (data) => {
    return `Analyze the Strategy Operationalisation of a business based on the following milestone tracking data:

STRATEGY OPERATIONALISATION DATA:
Total Milestones: ${data.totalMilestones}
Overall Completion Rate: ${data.overallCompletionRate}%

MILESTONES BY STATUS:
- Completed (Done): ${data.completedMilestones}
- In Progress/On Track: ${data.inProgressMilestones}
- At Risk: ${data.atRiskMilestones}
- Not Started: ${data.notStartedMilestones}

MILESTONES BY GOAL DOMAIN:
${Object.keys(data.milestonesByDomain).map(domain => {
  const milestones = data.milestonesByDomain[domain]
  const avgCompletion = data.avgCompletionByDomain[domain] || 0
  return `- ${domain}: ${milestones.length} milestones, ${avgCompletion}% avg completion`
}).join('\n')}

MILESTONE DETAILS BY DOMAIN:
${Object.keys(data.milestonesByDomain).map(domain => {
  const milestones = data.milestonesByDomain[domain]
  return `\n${domain}:
  ${milestones.map(m => `  • Goal: ${m.goal} - Goal Description: ${m.goalDescription || 'Not provided'} - Milestone: ${m.milestoneDescription} - Status: ${m.status}, ${m.percentageCompletion}% complete, Owner: ${m.owner}, Target: ${m.targetDate}`).join('\n')}`
}).join('')}

ANALYSIS REQUIREMENTS:

1. STRATEGY EXECUTION ASSESSMENT:
   - Evaluate how well strategy is being translated into actionable milestones
   - Assess goal alignment across different domains
   - Identify strengths and gaps in execution

2. PROGRESS ANALYSIS:
   - Analyze completion rates by domain and goal
   - Identify patterns in milestone delays or early completions
   - Assess overall execution velocity

3. RESOURCE & OWNERSHIP ANALYSIS:
   - Evaluate owner distribution and accountability
   - Identify potential resource constraints or bottlenecks
   - Assess team capacity and workload balance

4. RISK IDENTIFICATION:
   - Identify at-risk milestones and their impact on strategic goals
   - Highlight domains with low completion rates
   - Flag potential timeline issues

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements
   - Suggest priority areas for immediate focus
   - Recommend resource reallocation if needed
   - Include timelines and measurable outcomes

6. STRATEGIC ALIGNMENT:
   - Assess coherence between milestones and strategic objectives
   - Evaluate balance across different goal domains
   - Suggest strategic reprioritization if needed

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with a Strategy Execution Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of strategy operationalisation status]

Strategy Execution Score: [X]/10
Rating: [Poor/Fair/Good/Excellent]

Progress Analysis by Domain
[Detailed analysis of each domain's progress]

Status Distribution Analysis
[Analysis of milestone status distribution and implications]

Risk Assessment
[Key risks and mitigation strategies]

Resource & Ownership Insights
[Analysis of team allocation and accountability]

Top 5 Actionable Recommendations
1. [Specific action with timeline and owner suggestion]
2. [Specific action with measurable goal]
3. [Specific action with concrete steps]
4. [Specific action for at-risk milestones]
5. [Specific action for improving execution velocity]

Strategic Alignment Assessment
[How well execution aligns with strategic objectives]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`
  }

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.")
      return
    }

    if (!milestoneData || milestoneData.length === 0 || !currentUser) {
      setAnalysisError("No milestone data available for analysis. Please add some milestones first.")
      return
    }

    setIsGenerating(true)
    setAnalysisError("")
    setShowAIAnalysis(true)

    try {
      const analysisData = prepareStrategicOperationalisationData(milestoneData)
      const prompt = createStrategicOperationalisationPrompt(analysisData)

      const functions = getFunctions()
      const generateStrategyOperationalisationAnalysis = httpsCallable(functions, "generateStrategyOperationalisationAnalysis")
      
      const response = await generateStrategyOperationalisationAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      })

      let analysis = response?.data?.content || response?.data?.analysis
      
      if (!analysis) {
        throw new Error("No analysis generated")
      }

      // Clean the analysis before saving
      analysis = cleanAIResponse(analysis);

      // Save analysis to Firestore
      const aiAnalysisRef = doc(db, "strategyOperationalisationAnalysis", currentUser.uid)
      await setDoc(aiAnalysisRef, {
        analysis: analysis,
        timestamp: new Date().toISOString(),
        dataSnapshot: milestoneData,
        userId: currentUser.uid,
        milestoneCount: milestoneData.length
      }, { merge: true })

      setAiAnalysis(analysis)
      setSavedAnalysis(analysis)
      
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      setAnalysisError(`Failed to generate analysis: ${error.message}`)
      setAiAnalysis("AI analysis will be generated based on your strategic milestones data, tracking progress, identifying risks, and providing actionable insights to improve strategy execution.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis)
        setShowAIAnalysis(true)
      } else {
        generateAIAnalysis()
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis)
    }
  }

  const refreshAnalysis = async () => {
    await generateAIAnalysis()
  }

  const handleAddMilestone = () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setEditingMilestone(null)
    setNewMilestone({
      growthStage: "",
      customGrowthStage: "",
      goal: "",
      goalDescription: "",
      milestoneDescription: "",
      targetDate: "",
      status: "",
      owner: "",
      percentageCompletion: 0,
    })
    setShowMilestoneModal(true)
  }

  const handleEditMilestone = (milestone) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    setEditingMilestone(milestone)
    setNewMilestone({
      ...milestone,
      customGrowthStage: milestone.customGrowthStage || "",
      goalDescription: milestone.goalDescription || "",
      percentageCompletion: milestone.percentageCompletion || 0,
    })
    setShowMilestoneModal(true)
  }

  const handleSaveMilestone = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to save milestones.")
      return
    }

    try {
      const finalGrowthStage =
        newMilestone.growthStage === "Other (Specify)" ? newMilestone.customGrowthStage : newMilestone.growthStage

      const milestoneWithUser = {
        growthStage: finalGrowthStage,
        customGrowthStage: newMilestone.customGrowthStage,
        goal: newMilestone.goal,
        goalDescription: newMilestone.goalDescription,
        milestoneDescription: newMilestone.milestoneDescription,
        targetDate: newMilestone.targetDate,
        status: newMilestone.status,
        owner: newMilestone.owner,
        percentageCompletion: newMilestone.percentageCompletion,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (editingMilestone) {
        const milestoneRef = doc(db, "milestones", editingMilestone.id)
        await updateDoc(milestoneRef, milestoneWithUser)

        setMilestoneData((prev) =>
          prev.map((m) => (m.id === editingMilestone.id ? { ...milestoneWithUser, id: editingMilestone.id } : m)),
        )
      } else {
        const docRef = await addDoc(collection(db, "milestones"), milestoneWithUser)
        setMilestoneData((prev) => [...prev, { ...milestoneWithUser, id: docRef.id }])
      }

      setShowMilestoneModal(false)
      setNewMilestone({
        growthStage: "",
        customGrowthStage: "",
        goal: "",
        goalDescription: "",
        milestoneDescription: "",
        targetDate: "",
        status: "",
        owner: "",
        percentageCompletion: 0,
      })
      
      // Clear saved analysis when data changes significantly
      setSavedAnalysis("")
      
    } catch (error) {
      console.error("Error saving milestone:", error)
      alert("Error saving milestone. Please try again.")
    }
  }

  const handleDeleteMilestone = async (milestoneId) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (window.confirm("Are you sure you want to delete this milestone?")) {
      try {
        await deleteDoc(doc(db, "milestones", milestoneId))
        setMilestoneData((prev) => prev.filter((m) => m.id !== milestoneId))
        // Clear saved analysis when data changes
        setSavedAnalysis("")
      } catch (error) {
        console.error("Error deleting milestone:", error)
        alert("Error deleting milestone. Please try again.")
      }
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i)

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Key Question Section */}
      <KeyQuestionBox
        question={SECTION_DATA["strategy-operationalisation"].keyQuestion}
        signals={SECTION_DATA["strategy-operationalisation"].keySignals}
        decisions={SECTION_DATA["strategy-operationalisation"].keyDecisions}
      />

      <h3 style={{ color: "#4a352f", marginBottom: "10px" }}>Strategic Goals Progress</h3>

      {/* Sub Tabs Navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 20px",
              backgroundColor: activeSubTab === tab.id ? "#7d5a50" : "#e6d7c3",
              color: activeSubTab === tab.id ? "#fdfcfb" : "#4a352f",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts based on active sub-tab */}
      {activeSubTab === "all" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {categories
            .filter((category) => {
              const chartData = createChartData(category.key, category.color)
              return chartData.labels.length > 0
            })
            .map((category) => {
              const chartData = createChartData(category.key, category.color)
              return (
                <div
                  key={category.key}
                  style={{
                    backgroundColor: "#fdfcfb",
                    padding: "20px",
                    borderRadius: "8px",
                    border: `2px solid ${category.color}`,
                  }}
                >
                  <h4 style={{ color: "#4a352f", marginBottom: "15px", fontSize: "15px" }}>{category.name}</h4>
                  <div style={{ height: "250px" }}>
                    <Bar 
                      data={chartData} 
                      options={chartOptions} 
                      data-growth-stage={category.key} 
                    />
                  </div>
                </div>
              )
            })}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#fdfcfb",
            padding: "20px",
            borderRadius: "8px",
            border: `2px solid ${categories.find(c => c.key === activeSubTab)?.color || "#7d5a50"}`,
            marginBottom: "30px",
          }}
        >
          <h4 style={{ color: "#4a352f", marginBottom: "15px", fontSize: "15px" }}>
            {categories.find(c => c.key === activeSubTab)?.name || activeSubTab}
          </h4>
          <div style={{ height: "250px" }}>
            <Bar 
              data={createChartData(activeSubTab, categories.find(c => c.key === activeSubTab)?.color || "#7d5a50")} 
              options={chartOptions} 
              data-growth-stage={activeSubTab} 
            />
          </div>
        </div>
      )}

      {/* Filters Section - Placed right before the table */}
      <div style={{ 
        marginBottom: "20px", 
        padding: "20px", 
        backgroundColor: "#f8f4f0", 
        borderRadius: "6px",
        border: activeSubTab === "all" 
          ? "2px solid #7d5a50" 
          : `2px solid ${categories.find(c => c.key === activeSubTab)?.color || "#7d5a50"}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ color: "#4a352f", margin: 0, fontSize: "15px", fontWeight: "600" }}>
            Quick Filters
            {activeSubTab !== "all" && (
              <span style={{ fontSize: "12px", marginLeft: "10px", color: "#8d6e63", fontWeight: "normal" }}>
                {categories.find(c => c.key === activeSubTab)?.name}
              </span>
            )}
          </h4>
          <button
            onClick={clearAllFilters}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e6d7c3",
              color: "#4a352f",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            Clear All
          </button>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          {/* Filter by Goal */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
              Goal
            </label>
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#4a352f",
                fontSize: "13px",
              }}
            >
              <option value="">All Goals</option>
              {getUniqueGoals().map((goal) => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
          </div>

          {/* Filter by Goal Domain (only show in "all" tab) */}
          {activeSubTab === "all" && (
            <div>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                Goal Domain
              </label>
              <select
                value={filterGoalDomain}
                onChange={(e) => setFilterGoalDomain(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  color: "#4a352f",
                  fontSize: "13px",
                }}
              >
                <option value="">All Domains</option>
                {getUniqueGoalDomains().map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Status */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#4a352f",
                fontSize: "13px",
              }}
            >
              <option value="">All Statuses</option>
              {getUniqueStatuses().map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Filter by Owner */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
              Owner
            </label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#4a352f",
                fontSize: "13px",
              }}
            >
              <option value="">All Owners</option>
              {getUniqueOwners().map((owner) => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

          {/* Filter by Date */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
              Target Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "#4a352f",
                fontSize: "13px",
              }}
            />
          </div>
        </div>

        {/* Add Milestone button */}
        {!isInvestorView && (
          <div style={{ marginTop: "15px", textAlign: "right" }}>
            <button
              onClick={handleAddMilestone}
              style={{
                padding: "10px 20px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              + Add Milestone
            </button>
          </div>
        )}
      </div>

      {/* Milestone Table - Same size as Risk Management table */}
{/* Milestone Table - Same size as Risk Management table */}
<div style={{ 
  overflowX: "auto", 
  backgroundColor: "#fdfcfb", 
  borderRadius: "6px", 
  padding: "20px",
  border: activeSubTab === "all" 
    ? "2px solid #7d5a50" 
    : `2px solid ${categories.find(c => c.key === activeSubTab)?.color || "#7d5a50"}`,
}}>
  <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <h4 style={{ color: "#4a352f", margin: 0, fontSize: "15px", fontWeight: "600" }}>
      Milestones
      {activeSubTab !== "all" && (
        <span style={{ fontSize: "12px", marginLeft: "10px", color: "#8d6e63", fontWeight: "normal" }}>
          {categories.find(c => c.key === activeSubTab)?.name}
        </span>
      )}
    </h4>
    {(filterGoal || filterGoalDomain || filterStatus || filterOwner || filterDate) && (
      <span style={{ fontSize: "12px", color: "#8d6e63" }}>
        Showing {filteredMilestones.length} of {milestoneData.filter(m => activeSubTab === "all" ? true : m.growthStage === activeSubTab).length} items
      </span>
    )}
  </div>

  {filteredMilestones.length === 0 ? (
    <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
      {milestoneData.length === 0 
        ? `No milestones added yet. ${!isInvestorView ? 'Click "Add Milestone" to get started.' : ""}`
        : `No milestones found for the selected filters.`}
      {(filterGoal || filterGoalDomain || filterStatus || filterOwner || filterDate) && (
        <p style={{ marginTop: "10px", fontSize: "13px" }}>
          Try clearing some filters to see more milestones.
        </p>
      )}
    </div>
  ) : (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: "#4a352f",
          minWidth: "1400px",
          fontSize: "12px",
          tableLayout: "fixed", // This helps with column width control
        }}
      >
        <colgroup>
          {activeSubTab === "all" && (
            <col style={{ width: "120px" }} /> // Fixed width for Goal Domain
          )}
          <col style={{ width: "80px" }} /> // Goal
          <col style={{ width: "200px" }} /> // Goal Description
          <col style={{ width: "200px" }} /> // Milestone
          <col style={{ width: "100px" }} /> // Target Date
          <col style={{ width: "120px" }} /> // Status
          <col style={{ width: "120px" }} /> // Owner
          <col style={{ width: "80px" }} /> // % Complete
          {!isInvestorView && activeSubTab !== "all" && (
            <col style={{ width: "80px" }} /> // Actions
          )}
        </colgroup>
        <thead>
          <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
            {activeSubTab === "all" && (
              <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal Domain</th>
            )}
            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Goal Description</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Milestone</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Target Date</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
            <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Owner</th>
            <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>% Complete</th>
            {!isInvestorView && activeSubTab !== "all" && (
              <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredMilestones.map((milestone) => (
            <tr key={milestone.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
              {activeSubTab === "all" && (
                <td style={{ 
                  padding: "12px", 
                  fontSize: "12px",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  maxWidth: "120px",
                  lineHeight: "1.4",
                }}>
                  {milestone.growthStage}
                </td>
              )}
              <td style={{ 
                padding: "12px", 
                fontSize: "12px",
                wordWrap: "break-word",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}>
                {milestone.goal}
              </td>
              <td style={{ padding: "12px", fontSize: "12px" }}>
                <textarea
                  value={milestone.goalDescription || ""}
                  onChange={(e) => {
                    if (!isInvestorView && activeSubTab !== "all") {
                      const updatedMilestone = { ...milestone, goalDescription: e.target.value };
                      setMilestoneData(prev => 
                        prev.map(m => m.id === milestone.id ? updatedMilestone : m)
                      );
                      const milestoneRef = doc(db, "milestones", milestone.id);
                      updateDoc(milestoneRef, { goalDescription: e.target.value });
                    }
                  }}
                  disabled={isInvestorView || activeSubTab === "all"}
                  rows="2"
                  placeholder="Goal description"
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "12px",
                    resize: "vertical",
                    backgroundColor: isInvestorView || activeSubTab === "all" ? "#f5f5f5" : "white",
                    cursor: isInvestorView || activeSubTab === "all" ? "not-allowed" : "text",
                    fontFamily: "inherit",
                  }}
                />
              </td>
              <td style={{ padding: "12px", fontSize: "12px" }}>
                <textarea
                  value={milestone.milestoneDescription}
                  onChange={(e) => {
                    if (!isInvestorView && activeSubTab !== "all") {
                      const updatedMilestone = { ...milestone, milestoneDescription: e.target.value };
                      setMilestoneData(prev => 
                        prev.map(m => m.id === milestone.id ? updatedMilestone : m)
                      );
                      const milestoneRef = doc(db, "milestones", milestone.id);
                      updateDoc(milestoneRef, { milestoneDescription: e.target.value });
                    }
                  }}
                  disabled={isInvestorView || activeSubTab === "all"}
                  rows="2"
                  placeholder="How to reach this goal"
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "12px",
                    resize: "vertical",
                    backgroundColor: isInvestorView || activeSubTab === "all" ? "#f5f5f5" : "white",
                    cursor: isInvestorView || activeSubTab === "all" ? "not-allowed" : "text",
                    fontFamily: "inherit",
                  }}
                />
              </td>
              <td style={{ padding: "12px", fontSize: "12px" }}>
                <input
                  type="date"
                  value={milestone.targetDate}
                  onChange={(e) => {
                    if (!isInvestorView && activeSubTab !== "all") {
                      const updatedMilestone = { ...milestone, targetDate: e.target.value };
                      setMilestoneData(prev => 
                        prev.map(m => m.id === milestone.id ? updatedMilestone : m)
                      );
                      const milestoneRef = doc(db, "milestones", milestone.id);
                      updateDoc(milestoneRef, { targetDate: e.target.value });
                    }
                  }}
                  disabled={isInvestorView || activeSubTab === "all"}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: isInvestorView || activeSubTab === "all" ? "#f5f5f5" : "white",
                    cursor: isInvestorView || activeSubTab === "all" ? "not-allowed" : "text",
                  }}
                />
              </td>
              <td style={{ padding: "12px", fontSize: "12px" }}>
                <select
                  value={milestone.status}
                  onChange={(e) => {
                    if (!isInvestorView && activeSubTab !== "all") {
                      const updatedMilestone = { ...milestone, status: e.target.value };
                      setMilestoneData(prev => 
                        prev.map(m => m.id === milestone.id ? updatedMilestone : m)
                      );
                      const milestoneRef = doc(db, "milestones", milestone.id);
                      updateDoc(milestoneRef, { status: e.target.value });
                    }
                  }}
                  disabled={isInvestorView || activeSubTab === "all"}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: isInvestorView || activeSubTab === "all" ? "#f5f5f5" : "white",
                    cursor: isInvestorView || activeSubTab === "all" ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select Status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "12px", fontSize: "12px" }}>
                <select
                  value={milestone.owner}
                  onChange={(e) => {
                    if (!isInvestorView && activeSubTab !== "all") {
                      const updatedMilestone = { ...milestone, owner: e.target.value };
                      setMilestoneData(prev => 
                        prev.map(m => m.id === milestone.id ? updatedMilestone : m)
                      );
                      const milestoneRef = doc(db, "milestones", milestone.id);
                      updateDoc(milestoneRef, { owner: e.target.value });
                    }
                  }}
                  disabled={isInvestorView || activeSubTab === "all"}
                  style={{
                    width: "100%",
                    padding: "6px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: isInvestorView || activeSubTab === "all" ? "#f5f5f5" : "white",
                    cursor: isInvestorView || activeSubTab === "all" ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Select Owner</option>
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "12px", textAlign: "center", fontSize: "12px" }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={milestone.percentageCompletion || 0}
                  onChange={(e) => {
                    if (!isInvestorView && activeSubTab !== "all") {
                      const value = Number.parseInt(e.target.value);
                      const updatedMilestone = { ...milestone, percentageCompletion: value };
                      setMilestoneData(prev => 
                        prev.map(m => m.id === milestone.id ? updatedMilestone : m)
                      );
                      const milestoneRef = doc(db, "milestones", milestone.id);
                      updateDoc(milestoneRef, { percentageCompletion: value });
                    }
                  }}
                  disabled={isInvestorView || activeSubTab === "all"}
                  style={{
                    width: "60px",
                    padding: "6px",
                    border: "1px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "12px",
                    textAlign: "center",
                    backgroundColor: isInvestorView || activeSubTab === "all" ? "#f5f5f5" : "white",
                    cursor: isInvestorView || activeSubTab === "all" ? "not-allowed" : "text",
                  }}
                />
              </td>
              {!isInvestorView && activeSubTab !== "all" && (
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "transparent",
                      color: "#F44336",
                      border: "1px solid #F44336",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    title="Delete"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
      {/* AI Analysis Section */}
      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={handleAIAnalysis}
            disabled={isGenerating || isInvestorView || milestoneData.length === 0}
            style={{
              padding: "12px 24px",
              backgroundColor: isInvestorView || milestoneData.length === 0 ? "#a1887f" : "#4a352f",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "6px",
              cursor: isInvestorView || milestoneData.length === 0 ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="spin" style={{ animation: "spin 1s linear infinite" }} />
                Generating Analysis...
              </>
            ) : (
              <>
                <FaRobot />
                AI Strategy Execution Analysis
              </>
            )}
          </button>

          {savedAnalysis && !isGenerating && !isInvestorView && milestoneData.length > 0 && (
            <button
              onClick={refreshAnalysis}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Refresh AI Analysis"
            >
              Refresh
            </button>
          )}
        </div>
        
        {milestoneData.length === 0 && (
          <p style={{ color: "#8d6e63", fontSize: "13px", fontStyle: "italic", marginLeft: "10px" }}>
            Add milestones to generate AI analysis of your strategy execution.
          </p>
        )}
        
        {showAIAnalysis && (
          <div
            style={{
              backgroundColor: "#f8f4f0",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #d7ccc8",
              marginTop: "10px",
              position: "relative"
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px"
            }}>
              <div>
                <label
                  style={{
                    fontSize: "16px",
                    color: "#5d4037",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Strategy Execution AI Analysis
                </label>
                <p style={{
                  fontSize: "12px",
                  color: "#8d6e63",
                  margin: "0 0 10px 0",
                  fontStyle: "italic"
                }}>
                  Analysis generated from {milestoneData.length} strategic milestones
                </p>
              </div>
              
              {savedAnalysis && (
                <span style={{
                  fontSize: "10px",
                  color: "#8d6e63",
                  backgroundColor: "#efebe9",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: "500"
                }}>
                  Saved Analysis
                </span>
              )}
            </div>

            {analysisError ? (
              <div style={{
                padding: "15px",
                backgroundColor: "#ffebee",
                borderRadius: "6px",
                border: "1px solid #ffcdd2",
                color: "#c62828",
                fontSize: "14px"
              }}>
                <strong>Error:</strong> {analysisError}
              </div>
            ) : isGenerating ? (
              <div style={{
                textAlign: "center",
                padding: "30px",
                color: "#5d4037"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid #f3e5f5",
                  borderTop: "3px solid #8d6e63",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 15px"
                }}></div>
                <p>Analyzing your strategic milestones...</p>
                <p style={{ fontSize: "12px", color: "#8d6e63", marginTop: "5px" }}>
                  Evaluating progress, identifying risks, and generating recommendations
                </p>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "6px",
                  border: "1px solid #e8d8cf",
                  maxHeight: "400px",
                  overflowY: "auto",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#5d4037",
                  whiteSpace: "pre-wrap"
                }}
              >
                {aiAnalysis || "AI analysis will be generated based on your strategic milestones data, tracking progress, identifying risks, and providing actionable insights to improve strategy execution."}
              </div>
            )}

            <div style={{
              marginTop: "15px",
              paddingTop: "15px",
              borderTop: "1px solid #e8d8cf",
              fontSize: "11px",
              color: "#8d6e63",
              fontStyle: "italic",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>Analysis powered by AI • Updates when milestone data changes</span>
              <button
                onClick={() => setShowAIAnalysis(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8d6e63",
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline"
                }}
              >
                Hide Analysis
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            overflow: "auto",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>
              {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
            </h3>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Goal Domain
              </label>
              <select
                value={newMilestone.growthStage}
                onChange={(e) => {
                  setNewMilestone((prev) => ({
                    ...prev,
                    growthStage: e.target.value,
                  }))
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Goal Domain</option>
                {goalDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>

            {newMilestone.growthStage === "Other (Specify)" && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                  Custom Goal Domain
                </label>
                <input
                  type="text"
                  value={newMilestone.customGrowthStage}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, customGrowthStage: e.target.value }))}
                  placeholder="Enter custom goal domain"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e8ddd4",
                    borderRadius: "4px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>Goal</label>
              <select
                value={newMilestone.goal}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, goal: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Goal</option>
                {getAvailableGoals().map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Goal Description
              </label>
              <textarea
                value={newMilestone.goalDescription}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, goalDescription: e.target.value }))}
                placeholder="Describe the goal you want to achieve"
                rows="2"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Milestone <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(How you will reach this goal)</span>
              </label>
              <textarea
                value={newMilestone.milestoneDescription}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, milestoneDescription: e.target.value }))}
                placeholder="Describe the specific actions or steps to achieve this goal"
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Target Date
              </label>
              <input
                type="date"
                value={newMilestone.targetDate}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, targetDate: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Status
              </label>
              <select
                value={newMilestone.status}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, status: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Owner
              </label>
              <select
                value={newMilestone.owner}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, owner: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Select Owner</option>
                {owners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Percentage Completion: {newMilestone.percentageCompletion}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newMilestone.percentageCompletion}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, percentageCompletion: Number.parseInt(e.target.value) }))
                }
                style={{ width: "100%" }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowMilestoneModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {editingMilestone ? "Update Milestone" : "Add Milestone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const RiskManagement = ({ activeSection, currentUser, isInvestorView }) => {
  const [riskData, setRiskData] = useState({
    "financial-risk": [],
    "market-risk": [],
    "operational-risk": [],
    "reputational-risk": [],
    "compliance-risk": [],
    "technology-risk": [],
    "people-risk": [],
  })
  const [riskSection, setRiskSection] = useState("financial-risk") // Changed from "business-risk" to a specific category
  const [hoveredRiskType, setHoveredRiskType] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  
  // Table filter states - Reduced to essential ones
  const [filterRisk, setFilterRisk] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterOwner, setFilterOwner] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  
  // AI Analysis States
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [savedAnalysis, setSavedAnalysis] = useState("")

  const RISK_COLORS = {
    "financial-risk": "#4CAF50",
    "market-risk": "#2196F3",
    "operational-risk": "#FF9800",
    "reputational-risk": "#9C27B0",
    "compliance-risk": "#F44336",
    "technology-risk": "#FF69B4",
    "people-risk": "#619399",
    "business-risk": "#7d5a50",
  }

  const riskCategories = [
    { id: "business-risk", name: "Business Risk (All)", color: "#7d5a50" },
    { id: "financial-risk", name: "Financial Risk", color: RISK_COLORS["financial-risk"] },
    { id: "market-risk", name: "Market Risk", color: RISK_COLORS["market-risk"] },
    { id: "operational-risk", name: "Operational Risk", color: RISK_COLORS["operational-risk"] },
    { id: "reputational-risk", name: "Reputational Risk", color: RISK_COLORS["reputational-risk"] },
    { id: "compliance-risk", name: "Compliance Risk", color: RISK_COLORS["compliance-risk"] },
    { id: "technology-risk", name: "Technology Risk", color: RISK_COLORS["technology-risk"] },
    { id: "people-risk", name: "People Risk", color: RISK_COLORS["people-risk"] },
  ]

  const RISK_TYPE_DEFINITIONS = {
    "Financial Risk": "Risks related to funding, cash flow, pricing, revenue, and financial sustainability",
    "Market Risk": "Risks related to market dynamics, competition, demand shifts, and market positioning",
    "Operational Risk": "Risks related to processes, systems, resource availability, and operational execution",
    "Reputational Risk": "Risks related to brand perception, stakeholder trust, and public image",
    "Compliance Risk": "Risks related to legal requirements, regulations, licenses, and statutory obligations",
    "Technology Risk": "Risks related to technology infrastructure, cybersecurity, and digital capabilities",
    "People Risk": "Risks related to talent, culture, leadership, and human resources",
  }

  const cleanAIResponse = (text) => {
    if (!text) return text;
    let cleaned = text
      .replace(/^#+\s*/gm, '')
      .replace(/#/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
    return cleaned;
  }

  useEffect(() => {
    const loadRiskData = async () => {
      if (!currentUser || activeSection !== "strategic-risk-control") return

      try {
        const riskSnapshot = await getDocs(query(collection(db, "risks"), where("userId", "==", currentUser.uid)))

        const loadedRisks = {
          "financial-risk": [],
          "market-risk": [],
          "operational-risk": [],
          "reputational-risk": [],
          "compliance-risk": [],
          "technology-risk": [],
          "people-risk": [],
        }

        riskSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          const category = data.category || "financial-risk"
          if (loadedRisks[category]) {
            loadedRisks[category].push({ id: doc.id, ...data })
          }
        })

        setRiskData(loadedRisks)
      } catch (error) {
        console.error("Error loading risk data:", error)
      }
    }

    loadRiskData()
  }, [activeSection, currentUser])

  useEffect(() => {
    if (currentUser && activeSection === "strategic-risk-control") {
      loadSavedAIAnalysis()
    }
  }, [currentUser, activeSection])

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(db, "strategicRiskControlAnalysis", currentUser.uid)
      const aiSnapshot = await getDoc(aiAnalysisRef)
      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data()
        if (data.analysis) {
          setSavedAnalysis(data.analysis)
          setAiAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error)
    }
  }

  if (activeSection !== "strategic-risk-control") return null

  const addRiskItem = async (category) => {
    console.log("Add risk item clicked for category:", category);
    
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    if (!currentUser) {
      alert("You must be logged in to add risks.")
      return
    }

    // Generate risk number based on category and count
    const categoryRisks = riskData[category] || []
    const riskNumber = `${category.split('-')[0].toUpperCase()}-${String(categoryRisks.length + 1).padStart(3, '0')}`

    const newRisk = {
      riskNumber: riskNumber,
      riskSubCategory: "",
      riskCategory: riskCategories.find((c) => c.id === category)?.name || "Financial Risk",
      description: "",
      severity: 1,
      likelihood: 1,
      mitigation: "",
      mitigationStatus: "🔴 Uncontrolled",
      owner: "",
      reviewCadence: "",
      userId: currentUser.uid,
      category: category,
      createdAt: new Date().toISOString(),
      actionDate: "",
    }

    try {
      const docRef = await addDoc(collection(db, "risks"), newRisk)
      setRiskData((prev) => ({
        ...prev,
        [category]: [...prev[category], { id: docRef.id, ...newRisk }],
      }))
      setSavedAnalysis("")
      alert("Risk item added successfully!");
    } catch (error) {
      console.error("Error adding risk:", error)
      alert("Error adding risk. Please try again.")
    }
  }

  const updateRiskItem = async (category, id, field, value) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setRiskData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
    try {
      const riskRef = doc(db, "risks", id)
      await updateDoc(riskRef, { [field]: value })
    } catch (error) {
      console.error("Error updating risk:", error)
    }
  }

  const deleteRiskItem = async (category, id) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    if (window.confirm("Are you sure you want to delete this risk item?")) {
      try {
        await deleteDoc(doc(db, "risks", id))
        setRiskData((prev) => ({
          ...prev,
          [category]: prev[category].filter((item) => item.id !== id),
        }))
        setSavedAnalysis("")
      } catch (error) {
        console.error("Error deleting risk:", error)
        alert("Error deleting risk. Please try again.")
      }
    }
  }

  // Get unique values for filters
  const getUniqueRiskNames = (category) => {
    const data = category === "business-risk" 
      ? Object.values(riskData).flat() 
      : riskData[category] || []
    return [...new Set(data.map(item => item.riskSubCategory).filter(Boolean))].sort()
  }

  const getUniqueCategories = (category) => {
    const data = category === "business-risk" 
      ? Object.values(riskData).flat() 
      : riskData[category] || []
    return [...new Set(data.map(item => item.riskCategory).filter(Boolean))].sort()
  }

  const getUniqueOwners = (category) => {
    const data = category === "business-risk" 
      ? Object.values(riskData).flat() 
      : riskData[category] || []
    return [...new Set(data.map(item => item.owner).filter(Boolean))].sort()
  }

  const getUniqueStatuses = (category) => {
    const data = category === "business-risk" 
      ? Object.values(riskData).flat() 
      : riskData[category] || []
    return [...new Set(data.map(item => item.mitigationStatus).filter(Boolean))].sort()
  }

  const clearAllFilters = () => {
    setFilterRisk("")
    setFilterCategory("")
    setFilterOwner("")
    setFilterStatus("")
    setSelectedMonth("")
    setSelectedYear("")
  }

  // Enhanced filteredData function with essential filters
  const filteredData = (data) => {
    return data.filter((item) => {
      // Date filters
      if (selectedMonth || selectedYear) {
        if (!item.actionDate) return false
        const actionDate = new Date(item.actionDate)
        const monthMatch = !selectedMonth || (actionDate.getMonth() + 1) === parseInt(selectedMonth)
        const yearMatch = !selectedYear || actionDate.getFullYear() === parseInt(selectedYear)
        if (!monthMatch || !yearMatch) return false
      }
      
      // Essential table filters
      if (filterRisk && item.riskSubCategory !== filterRisk) return false
      if (filterCategory && item.riskCategory !== filterCategory) return false
      if (filterOwner && item.owner !== filterOwner) return false
      if (filterStatus && item.mitigationStatus !== filterStatus) return false
      
      return true
    })
  }

  const createScatterChartData = (category) => {
    if (category === "business-risk") {
      // For Business Risk (All), we want to show ALL risks from ALL categories
      const datasets = []
      
      Object.keys(riskData).forEach((catKey) => {
        const data = riskData[catKey] || []
        if (data.length > 0) {
          datasets.push({
            label: riskCategories.find(c => c.id === catKey)?.name || catKey,
            data: data.map((item) => ({
              x: item.likelihood,
              y: item.severity,
              label: item.riskSubCategory || "Unnamed Risk",
              riskNumber: item.riskNumber || "N/A",
              riskLevel: item.likelihood * item.severity,
              status: item.mitigationStatus,
              category: catKey,
              description: item.description || "",
            })),
            backgroundColor: RISK_COLORS[catKey] || "#7d5a50",
            borderColor: "#5d4037",
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 10,
          })
        }
      })
      
      // If no datasets were created (no risks at all), return empty structure
      if (datasets.length === 0) {
        return { datasets: [] }
      }
      
      return { datasets }
    } else {
      // For specific categories, use filtered data
      const data = filteredData(riskData[category] || [])
      return {
        datasets: [
          {
            label: riskCategories.find(c => c.id === category)?.name || "Risks",
            data: data.map((item) => ({
              x: item.likelihood,
              y: item.severity,
              label: item.riskSubCategory || "Unnamed Risk",
              riskNumber: item.riskNumber || "N/A",
              riskLevel: item.likelihood * item.severity,
              status: item.mitigationStatus,
              description: item.description || "",
            })),
            backgroundColor: RISK_COLORS[category] || "#7d5a50",
            borderColor: "#5d4037",
            borderWidth: 2,
            pointRadius: 8,
            pointHoverRadius: 10,
          },
        ],
      }
    }
  }

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      legend: {
        display: true,
        position: 'top',
        labels: { color: "#4a352f", font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label || "Risk"
            const pointLabel = context.raw.label || "Risk"
            const riskNumber = context.raw.riskNumber || "N/A"
            return `${datasetLabel}: ${pointLabel} (${riskNumber})`
          },
          afterLabel: (context) => {
            const riskLevel = context.raw.x * context.raw.y
            const description = context.raw.description
            const lines = [`Risk Score: ${riskLevel} (${context.raw.x} × ${context.raw.y})`]
            if (description) {
              lines.push(`Description: ${description}`)
            }
            return lines
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Likelihood (1-5)", color: "#4a352f", font: { weight: "bold", size: 12 } },
        min: 0.5, 
        max: 5.5,
        ticks: { stepSize: 1, color: "#4a352f" },
        grid: { color: "#f0e6d9" },
      },
      y: {
        title: { display: true, text: "Severity (1-5)", color: "#4a352f", font: { weight: "bold", size: 12 } },
        min: 0.5, 
        max: 5.5,
        ticks: { stepSize: 1, color: "#4a352f" },
        grid: { color: "#f0e6d9" },
      },
    },
  }

  const prepareRiskData = (data) => {
    const allRisks = Object.values(data).flat()
    const riskScores = allRisks.map(risk => ({
      ...risk,
      riskScore: (risk.severity || 1) * (risk.likelihood || 1)
    }))
    const risksByCategory = {}
    const risksByStatus = {}
    const risksByOwner = {}
    const risksByReviewCadence = {}
    const highRisks = []
    const mediumRisks = []
    const lowRisks = []

    riskScores.forEach(risk => {
      const category = risk.riskCategory || "Uncategorized"
      if (!risksByCategory[category]) risksByCategory[category] = []
      risksByCategory[category].push(risk)
      const status = risk.mitigationStatus || "Uncontrolled"
      if (!risksByStatus[status]) risksByStatus[status] = 0
      risksByStatus[status]++
      if (risk.owner) {
        if (!risksByOwner[risk.owner]) risksByOwner[risk.owner] = 0
        risksByOwner[risk.owner]++
      }
      if (risk.reviewCadence) {
        if (!risksByReviewCadence[risk.reviewCadence]) risksByReviewCadence[risk.reviewCadence] = 0
        risksByReviewCadence[risk.reviewCadence]++
      }
      if (risk.riskScore >= 16) highRisks.push(risk)
      else if (risk.riskScore >= 9) mediumRisks.push(risk)
      else lowRisks.push(risk)
    })

    const avgScoresByCategory = {}
    Object.keys(risksByCategory).forEach(category => {
      const risks = risksByCategory[category]
      const avgSeverity = risks.reduce((sum, r) => sum + (r.severity || 1), 0) / risks.length
      const avgLikelihood = risks.reduce((sum, r) => sum + (r.likelihood || 1), 0) / risks.length
      const avgRiskScore = risks.reduce((sum, r) => sum + (r.riskScore || 1), 0) / risks.length
      avgScoresByCategory[category] = {
        avgSeverity: Math.round(avgSeverity * 10) / 10,
        avgLikelihood: Math.round(avgLikelihood * 10) / 10,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        count: risks.length,
        controlledRisks: risks.filter(r => r.mitigationStatus === "🟢 Controlled").length,
        uncontrolledRisks: risks.filter(r => r.mitigationStatus === "🔴 Uncontrolled").length
      }
    })

    return {
      totalRisks: allRisks.length,
      risksByCategory,
      risksByStatus,
      risksByOwner,
      risksByReviewCadence,
      avgScoresByCategory,
      highRisks: highRisks.length,
      mediumRisks: mediumRisks.length,
      lowRisks: lowRisks.length,
      highRiskItems: highRisks.slice(0, 5),
      controlledRisks: allRisks.filter(r => r.mitigationStatus === "🟢 Controlled").length,
      partiallyControlledRisks: allRisks.filter(r => r.mitigationStatus === "🟡 Partially controlled").length,
      uncontrolledRisks: allRisks.filter(r => r.mitigationStatus === "🔴 Uncontrolled").length,
      risksWithOwners: allRisks.filter(r => r.owner).length,
      risksWithReviewCadence: allRisks.filter(r => r.reviewCadence).length,
      risksWithMitigation: allRisks.filter(r => r.mitigation).length,
    }
  }

  const createRiskPrompt = (data) => {
    return `Analyze the Strategic Risk Control and Risk Register of a business based on the following risk assessment data:

RISK REGISTER DATA:
Total Risks Identified: ${data.totalRisks}

RISK LEVEL DISTRIBUTION:
- High Risk (Score 16-25): ${data.highRisks}
- Medium Risk (Score 9-15): ${data.mediumRisks}
- Low Risk (Score 1-8): ${data.lowRisks}

MITIGATION STATUS:
- 🟢 Controlled: ${data.controlledRisks}
- 🟡 Partially controlled: ${data.partiallyControlledRisks}
- 🔴 Uncontrolled: ${data.uncontrolledRisks}

GOVERNANCE METRICS:
- Risks with assigned owners: ${data.risksWithOwners} (${Math.round(data.risksWithOwners / data.totalRisks * 100)}%)
- Risks with review cadence: ${data.risksWithReviewCadence} (${Math.round(data.risksWithReviewCadence / data.totalRisks * 100)}%)
- Risks with mitigation plans: ${data.risksWithMitigation} (${Math.round(data.risksWithMitigation / data.totalRisks * 100)}%)

RISK CATEGORY BREAKDOWN:
${Object.keys(data.avgScoresByCategory).map(category => {
  const cat = data.avgScoresByCategory[category]
  return `- ${category}: ${cat.count} risks, Avg Risk Score: ${cat.avgRiskScore}, Controlled: ${cat.controlledRisks}/${cat.count}`
}).join('\n')}

TOP 5 HIGHEST RISK ITEMS:
${data.highRiskItems.map((risk, i) =>
  `  ${i+1}. ${risk.riskSubCategory || 'Unnamed Risk'} (${risk.riskNumber || 'N/A'}) - Score: ${risk.riskScore} (Severity: ${risk.severity}, Likelihood: ${risk.likelihood}), Status: ${risk.mitigationStatus}, Owner: ${risk.owner || 'Unassigned'}`
).join('\n')}

RISK STATUS DISTRIBUTION:
${Object.keys(data.risksByStatus).map(status =>
  `- ${status}: ${data.risksByStatus[status]}`
).join('\n')}

ANALYSIS REQUIREMENTS:

1. RISK PROFILE ASSESSMENT:
   - Evaluate the overall risk exposure and maturity of risk management
   - Identify the most critical risk categories and their trends
   - Rate overall risk management effectiveness (1-10)

2. MITIGATION EFFECTIVENESS:
   - Analyze the current state of risk controls
   - Identify gaps in mitigation strategies
   - Assess the balance between controlled vs uncontrolled risks

3. GOVERNANCE & ACCOUNTABILITY:
   - Evaluate risk ownership assignment and coverage
   - Assess review cadence adequacy
   - Identify governance gaps

4. CRITICAL RISK ANALYSIS:
   - Deep dive into top 5 highest risk items
   - Recommend immediate actions for high-risk items
   - Prioritize risks requiring urgent attention

5. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements for risk management
   - Suggest mitigation strategies for uncontrolled risks
   - Recommend risk treatment plans with timelines
   - Identify opportunities for risk reduction

6. STRATEGIC IMPLICATIONS:
   - How identified risks impact strategic objectives
   - Risk appetite alignment assessment
   - Recommendations for risk-aware decision making

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with a Risk Management Maturity Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of strategic risk control status]

Risk Management Maturity Score: [X]/10
Rating: [Initial/Repeatable/Defined/Managed/Optimizing]

Risk Profile Analysis
[Analysis of overall risk exposure and distribution]

Category Risk Assessment
[Detailed analysis of each risk category with scores]

Critical Risk Watchlist
[Top 5 risks requiring immediate attention with recommended actions]

Mitigation Effectiveness
[Analysis of control effectiveness and gaps]

Governance Assessment
[Evaluation of risk ownership, review cadence, and accountability]

Top 5 Actionable Recommendations
1. [Specific action with timeline and owner suggestion]
2. [Specific action with measurable outcome]
3. [Specific action for high-risk items]
4. [Specific action for governance improvement]
5. [Specific action for risk culture/monitoring]

Strategic Risk Outlook
[How risk posture affects strategic objectives and recommendations]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`
  }

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.")
      return
    }
    const allRisks = Object.values(riskData).flat()
    if (allRisks.length === 0 || !currentUser) {
      setAnalysisError("No risk data available for analysis. Please add some risk items first.")
      return
    }
    setIsGenerating(true)
    setAnalysisError("")
    setShowAIAnalysis(true)

    try {
      const analysisData = prepareRiskData(riskData)
      const prompt = createRiskPrompt(analysisData)
      const functions = getFunctions()
      const generateStrategicRiskAnalysis = httpsCallable(functions, "generateStrategicRiskAnalysis")
      const response = await generateStrategicRiskAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      })

      let analysis = response?.data?.content || response?.data?.analysis
      if (!analysis) throw new Error("No analysis generated")
      analysis = cleanAIResponse(analysis)

      const aiAnalysisRef = doc(db, "strategicRiskControlAnalysis", currentUser.uid)
      await setDoc(aiAnalysisRef, {
        analysis: analysis,
        timestamp: new Date().toISOString(),
        dataSnapshot: {
          totalRisks: allRisks.length,
          riskCategories: Object.keys(riskData).filter(cat => riskData[cat].length > 0),
          riskCount: allRisks.length
        },
        userId: currentUser.uid,
        riskCount: allRisks.length
      }, { merge: true })

      setAiAnalysis(analysis)
      setSavedAnalysis(analysis)
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      setAnalysisError(`Failed to generate analysis: ${error.message}`)
      setAiAnalysis("AI analysis will be generated based on your risk register data, identifying critical risks, evaluating mitigation effectiveness, and providing actionable recommendations to strengthen strategic risk control.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis)
        setShowAIAnalysis(true)
      } else {
        generateAIAnalysis()
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis)
    }
  }

  const refreshAnalysis = async () => {
    await generateAIAnalysis()
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i)

  return (
    <div
      style={{
        backgroundColor: "#faf7f2",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <KeyQuestionBox
        question={SECTION_DATA["strategic-risk-control"].keyQuestion}
        signals={SECTION_DATA["strategic-risk-control"].keySignals}
        decisions={SECTION_DATA["strategic-risk-control"].keyDecisions}
      />

      <h3 style={{ color: "#4a352f", marginBottom: "20px" }}>Risk Register</h3>

      {/* Risk Category Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {riskCategories.map((category) => (
          <div key={category.id} style={{ position: "relative" }}>
            <button
              onClick={() => setRiskSection(category.id)}
              onMouseEnter={() => {
                if (category.id !== "business-risk") {
                  setHoveredRiskType(category.name)
                }
              }}
              onMouseLeave={() => setHoveredRiskType(null)}
              style={{
                padding: "10px 20px",
                backgroundColor: riskSection === category.id ? category.color : "#f5f0e1",
                color: riskSection === category.id ? "white" : "#4a352f",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              {category.name}
            </button>
            {hoveredRiskType === category.name && RISK_TYPE_DEFINITIONS[category.name] && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginTop: "8px",
                  padding: "10px 15px",
                  backgroundColor: "#4a352f",
                  color: "white",
                  borderRadius: "6px",
                  fontSize: "12px",
                  width: "250px",
                  zIndex: 1000,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                  lineHeight: "1.4",
                }}
              >
                {RISK_TYPE_DEFINITIONS[category.name]}
                <div
                  style={{
                    position: "absolute",
                    top: "-6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "0",
                    height: "0",
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "6px solid #4a352f",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Risk Category Content */}
      {riskCategories.map((category) => {
        if (riskSection !== category.id) return null

        const data = category.id === "business-risk" ? Object.values(riskData).flat() : riskData[category.id] || []
        const filtered = filteredData(data)

        return (
          <div key={category.id}>
            {/* Scatter Chart */}
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "6px",
                marginBottom: "20px",
                border: `2px solid ${category.color}`,
              }}
            >
              <h4 style={{ color: "#4a352f", marginBottom: "15px" }}>
                {category.name} Matrix
                {category.id === "business-risk" && " (All Risks)"}
                {(selectedMonth || selectedYear || filterRisk || filterCategory || filterOwner || filterStatus) && category.id !== "business-risk" && (
                  <span style={{ fontSize: "12px", marginLeft: "10px", color: "#8d6e63" }}>(Filtered)</span>
                )}
              </h4>
              <div style={{ height: "300px" }}>
                <Scatter data={createScatterChartData(category.id)} options={scatterOptions} />
              </div>
              
              {/* Debug section to show risk counts */}
              {category.id === "business-risk" && (
                <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f0f0f0", borderRadius: "4px", fontSize: "12px" }}>
                  <strong>Risk Count Summary:</strong>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "5px", marginTop: "5px" }}>
                    {Object.keys(riskData).map(catKey => (
                      <div key={catKey} style={{ color: RISK_COLORS[catKey] }}>
                        {riskCategories.find(c => c.id === catKey)?.name || catKey}: {riskData[catKey]?.length || 0} risks
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filters Section */}
            <div style={{ 
              marginBottom: "20px", 
              padding: "20px", 
              backgroundColor: "#f8f4f0", 
              borderRadius: "6px",
              border: `2px solid ${category.color}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <h4 style={{ color: "#4a352f", margin: 0, fontSize: "15px", fontWeight: "600" }}>Quick Filters</h4>
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#e6d7c3",
                    color: "#4a352f",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Clear All
                </button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                {/* Filter by Risk Sub-Category */}
                <div>
                  <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                    Risk Sub-Category
                  </label>
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      color: "#4a352f",
                      fontSize: "13px",
                    }}
                  >
                    <option value="">All Sub-Categories</option>
                    {getUniqueRiskNames(category.id).map((risk) => (
                      <option key={risk} value={risk}>{risk}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Risk Category (only in Business Risk view) */}
                {category.id === "business-risk" && (
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "2px solid #e8ddd4",
                        borderRadius: "4px",
                        backgroundColor: "white",
                        color: "#4a352f",
                        fontSize: "13px",
                      }}
                    >
                      <option value="">All Categories</option>
                      {getUniqueCategories(category.id).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filter by Owner */}
                <div>
                  <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                    Owner
                  </label>
                  <select
                    value={filterOwner}
                    onChange={(e) => setFilterOwner(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      color: "#4a352f",
                      fontSize: "13px",
                    }}
                  >
                    <option value="">All Owners</option>
                    {getUniqueOwners(category.id).map((owner) => (
                      <option key={owner} value={owner}>{owner}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Status */}
                <div>
                  <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      color: "#4a352f",
                      fontSize: "13px",
                    }}
                  >
                    <option value="">All Statuses</option>
                    {getUniqueStatuses(category.id).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Month/Year Filters in same row */}
                <div>
                  <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      color: "#4a352f",
                      fontSize: "13px",
                    }}
                  >
                    <option value="">All</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i, 1).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500", fontSize: "12px" }}>
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "2px solid #e8ddd4",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      color: "#4a352f",
                      fontSize: "13px",
                    }}
                    >
                    <option value="">All</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Risk Item button - NOW VISIBLE for specific categories */}
              {!isInvestorView && category.id !== "business-risk" && (
                <div style={{ marginTop: "15px", textAlign: "right" }}>
                  <button
                    onClick={() => {
                      console.log("Add button clicked for category:", category.id);
                      addRiskItem(category.id);
                    }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#7d5a50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    + Add Risk Item to {category.name}
                  </button>
                </div>
              )}
              
              {/* Message for Business Risk view */}
              {category.id === "business-risk" && (
                <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#e6d7c3", borderRadius: "4px", textAlign: "center" }}>
                  <p style={{ color: "#4a352f", margin: 0, fontSize: "13px" }}>
                    To add a new risk, select a specific risk category tab above.
                  </p>
                </div>
              )}
            </div>

            {/* Risk Assessment Table */}
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "6px",
                border: `2px solid ${category.color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h4 style={{ color: "#4a352f", margin: 0 }}>
                  Risk Assessment Table
                  {category.id === "business-risk" && " (All Risks)"}
                  {(selectedMonth || selectedYear || filterRisk || filterCategory || filterOwner || filterStatus) && (
                    <span style={{ fontSize: "12px", marginLeft: "10px", color: "#8d6e63" }}>
                      (Showing {filtered.length} of {data.length} items)
                    </span>
                  )}
                </h4>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#7d5a50" }}>
                  {category.id === "business-risk"
                    ? "No risk items added yet in any category."
                    : `No risk items added yet in ${category.name}. ${!isInvestorView ? 'Click "Add Risk Item" above to get started.' : ""}`}
                  {(selectedMonth || selectedYear || filterRisk || filterCategory || filterOwner || filterStatus) && (
                    <p style={{ marginTop: "10px", fontSize: "13px" }}>
                      Try clearing some filters to see more items.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      color: "#4a352f",
                      minWidth: "1600px",
                      fontSize: "12px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Risk Number</th>
                        {category.id === "business-risk" && (
                          <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Risk Category</th>
                        )}
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Risk Sub-Category</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Description</th>
                        <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Severity (1-5)</th>
                        <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Likelihood (1-5)</th>
                        <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Risk Score</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Owner</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Mitigation Plan</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Review Cadence</th>
                        <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Action Date</th>
                        {!isInvestorView && category.id !== "business-risk" && (
                          <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => {
                        const originalCategory =
                          category.id === "business-risk"
                            ? Object.keys(riskData).find((key) => riskData[key].some((r) => r.id === item.id))
                            : category.id
                        const riskScore = (item.severity || 1) * (item.likelihood || 1)
                        const scoreColor = 
                          riskScore >= 16 ? "#F44336" : 
                          riskScore >= 9 ? "#FF9800" : 
                          "#4CAF50"

                        return (
                          <tr key={item.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.riskNumber || ""}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "riskNumber", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                placeholder="Risk #"
                                style={{
                                  width: "80px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            {category.id === "business-risk" && (
                              <td style={{ padding: "12px", fontSize: "12px" }}>{item.riskCategory}</td>
                            )}
                            
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text"
                                value={item.riskSubCategory || ""}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "riskSubCategory", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                placeholder="Sub-category"
                                style={{
                                  width: "120px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px" }}>
                              <textarea
                                value={item.description}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "description", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                rows="2"
                                placeholder="Description"
                                style={{
                                  width: "150px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px", resize: "vertical",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <input
                                type="number" min="1" max="5" value={item.severity}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "severity", Number.parseInt(e.target.value))}
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "50px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px", textAlign: "center",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <input
                                type="number" min="1" max="5" value={item.likelihood}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "likelihood", Number.parseInt(e.target.value))}
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "50px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px", textAlign: "center",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{
                                padding: "4px 8px",
                                borderRadius: "4px",
                                backgroundColor: scoreColor,
                                color: "white",
                                fontWeight: "600",
                                fontSize: "12px",
                                display: "inline-block",
                                minWidth: "40px",
                                textAlign: "center"
                              }}>
                                {riskScore}
                              </span>
                            </td>
                            
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text" value={item.owner || ""}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "owner", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                placeholder="Owner"
                                style={{
                                  width: "100px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px" }}>
                              <select
                                value={item.mitigationStatus}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "mitigationStatus", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "140px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              >
                                <option value="🟢 Controlled">🟢 Controlled</option>
                                <option value="🟡 Partially controlled">🟡 Partially controlled</option>
                                <option value="🔴 Uncontrolled">🔴 Uncontrolled</option>
                              </select>
                            </td>
                            
                            <td style={{ padding: "12px" }}>
                              <textarea
                                value={item.mitigation}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "mitigation", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                rows="2"
                                placeholder="Mitigation plan"
                                style={{
                                  width: "150px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px", resize: "vertical",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px" }}>
                              <input
                                type="text" value={item.reviewCadence || ""}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "reviewCadence", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                placeholder="e.g., Monthly"
                                style={{
                                  width: "100px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            <td style={{ padding: "12px" }}>
                              <input
                                type="date" value={item.actionDate || ""}
                                onChange={(e) => updateRiskItem(originalCategory, item.id, "actionDate", e.target.value)}
                                disabled={isInvestorView || category.id === "business-risk"}
                                style={{
                                  width: "120px", padding: "6px", border: "1px solid #e8ddd4",
                                  borderRadius: "4px", fontSize: "12px",
                                  backgroundColor: isInvestorView || category.id === "business-risk" ? "#f5f5f5" : "white",
                                }}
                              />
                            </td>
                            
                            {!isInvestorView && category.id !== "business-risk" && (
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <button
                                  onClick={() => deleteRiskItem(originalCategory, item.id)}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "transparent",
                                    color: "#F44336",
                                    border: "1px solid #F44336",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                  }}
                                  title="Delete"
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* AI Analysis Section */}
      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={handleAIAnalysis}
            disabled={isGenerating || isInvestorView || Object.values(riskData).flat().length === 0}
            style={{
              padding: "12px 24px",
              backgroundColor: isInvestorView || Object.values(riskData).flat().length === 0 ? "#a1887f" : "#4a352f",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "6px",
              cursor: isInvestorView || Object.values(riskData).flat().length === 0 ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="spin" style={{ animation: "spin 1s linear infinite" }} />
                Generating Risk Analysis...
              </>
            ) : (
              <>
                <FaRobot />
                AI Strategic Risk Analysis
              </>
            )}
          </button>

          {savedAnalysis && !isGenerating && !isInvestorView && Object.values(riskData).flat().length > 0 && (
            <button
              onClick={refreshAnalysis}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Refresh AI Analysis"
            >
              Refresh
            </button>
          )}
        </div>

        {Object.values(riskData).flat().length === 0 && (
          <p style={{ color: "#8d6e63", fontSize: "13px", fontStyle: "italic", marginLeft: "10px" }}>
            Add risk items to generate AI analysis of your strategic risk posture.
          </p>
        )}

        {showAIAnalysis && (
          <div
            style={{
              backgroundColor: "#f8f4f0",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #d7ccc8",
              marginTop: "10px",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
              <div>
                <label style={{ fontSize: "16px", color: "#5d4037", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                  Strategic Risk Control AI Analysis
                </label>
                <p style={{ fontSize: "12px", color: "#8d6e63", margin: "0 0 10px 0", fontStyle: "italic" }}>
                  Analysis generated from {Object.values(riskData).flat().length} risk items in your register
                </p>
              </div>
              {savedAnalysis && (
                <span style={{ fontSize: "10px", color: "#8d6e63", backgroundColor: "#efebe9", padding: "4px 8px", borderRadius: "4px", fontWeight: "500" }}>
                  Saved Analysis
                </span>
              )}
            </div>

            {analysisError ? (
              <div style={{ padding: "15px", backgroundColor: "#ffebee", borderRadius: "6px", border: "1px solid #ffcdd2", color: "#c62828", fontSize: "14px" }}>
                <strong>Error:</strong> {analysisError}
              </div>
            ) : isGenerating ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#5d4037" }}>
                <div style={{
                  width: "40px", height: "40px", border: "3px solid #f3e5f5",
                  borderTop: "3px solid #8d6e63", borderRadius: "50%",
                  animation: "spin 1s linear infinite", margin: "0 auto 15px"
                }}></div>
                <p>Analyzing your risk register...</p>
                <p style={{ fontSize: "12px", color: "#8d6e63", marginTop: "5px" }}>
                  Evaluating risk scores, mitigation effectiveness, and governance maturity
                </p>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "white", padding: "20px", borderRadius: "6px",
                  border: "1px solid #e8d8cf", maxHeight: "400px", overflowY: "auto",
                  fontSize: "14px", lineHeight: "1.6", color: "#5d4037", whiteSpace: "pre-wrap"
                }}
              >
                {aiAnalysis || "AI analysis will be generated based on your risk register data, identifying critical risks, evaluating mitigation effectiveness, and providing actionable recommendations to strengthen strategic risk control."}
              </div>
            )}

            <div style={{
              marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #e8d8cf",
              fontSize: "11px", color: "#8d6e63", fontStyle: "italic",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span>Analysis powered by AI • Updates when risk data changes</span>
              <button
                onClick={() => setShowAIAnalysis(false)}
                style={{ background: "none", border: "none", color: "#8d6e63", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
              >
                Hide Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
const ChangeAdaptability = ({ activeSection, currentUser, isInvestorView }) => {
  const [reviewData, setReviewData] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [pivots, setPivots] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showPivotModal, setShowPivotModal] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [editingAdjustment, setEditingAdjustment] = useState(null)
  const [editingPivot, setEditingPivot] = useState(null)
  const [newReview, setNewReview] = useState({ date: "", topic: "", status: "Not Done", notes: "" })
  const [newAdjustment, setNewAdjustment] = useState({ 
    date: "", 
    description: "", 
    reason: "",
    file: null,
    fileName: ""
  })
  const [newPivot, setNewPivot] = useState({ 
    date: "", 
    from: "", 
    to: "", 
    reason: "",
    file: null,
    fileName: ""
  })
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [uploading, setUploading] = useState(false)
  
  // AI Analysis States
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [analysisError, setAnalysisError] = useState("")
  const [savedAnalysis, setSavedAnalysis] = useState("")

  // NEW: Function to clean up the AI response
  const cleanAIResponse = (text) => {
    if (!text) return text;
    
    // Remove all markdown hashtags (###, ##, #) and replace with bold styling or remove
    let cleaned = text
      // Remove hashtags at beginning of lines
      .replace(/^#+\s*/gm, '')
      // Remove any remaining hashtags
      .replace(/#/g, '')
      // Remove asterisk formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      .trim();
    
    return cleaned;
  }

  useEffect(() => {
    const loadChangeData = async () => {
      if (!currentUser || activeSection !== "change-adaptability") return

      try {
        const reviewsSnapshot = await getDocs(
          query(collection(db, "strategyReviews"), where("userId", "==", currentUser.uid)),
        )
        setReviewData(reviewsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

        const adjustmentsSnapshot = await getDocs(
          query(collection(db, "adjustments"), where("userId", "==", currentUser.uid)),
        )
        setAdjustments(adjustmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))

        const pivotsSnapshot = await getDocs(query(collection(db, "pivots"), where("userId", "==", currentUser.uid)))
        setPivots(pivotsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error loading change data:", error)
      }
    }

    loadChangeData()
  }, [activeSection, currentUser])

  // Load saved AI analysis
  useEffect(() => {
    if (currentUser && activeSection === "change-adaptability") {
      loadSavedAIAnalysis()
    }
  }, [currentUser, activeSection])

  const loadSavedAIAnalysis = async () => {
    try {
      const aiAnalysisRef = doc(db, "changeAdaptabilityAnalysis", currentUser.uid)
      const aiSnapshot = await getDoc(aiAnalysisRef)
      
      if (aiSnapshot.exists()) {
        const data = aiSnapshot.data()
        if (data.analysis) {
          setSavedAnalysis(data.analysis)
          setAiAnalysis(data.analysis)
        }
      }
    } catch (error) {
      console.error("Error loading saved analysis:", error)
    }
  }

  if (activeSection !== "change-adaptability") return null

  const handleAddReview = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add reviews.")
      return
    }

    try {
      const reviewWithUser = {
        ...newReview,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }
      const docRef = await addDoc(collection(db, "strategyReviews"), reviewWithUser)
      setReviewData((prev) => [...prev, { id: docRef.id, ...reviewWithUser }])
      setShowReviewModal(false)
      setNewReview({ date: "", topic: "", status: "Not Done", notes: "" })
      setSavedAnalysis("")
    } catch (error) {
      console.error("Error adding review:", error)
      alert("Error adding review. Please try again.")
    }
  }

  const handleEditReview = (review) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingReview(review)
    setNewReview({
      date: review.date || "",
      topic: review.topic || "",
      status: review.status || "Not Done",
      notes: review.notes || ""
    })
    setShowReviewModal(true)
  }

  const handleUpdateReview = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser || !editingReview) return

    try {
      const reviewRef = doc(db, "strategyReviews", editingReview.id)
      const updatedReview = {
        ...newReview,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(reviewRef, updatedReview)
      
      setReviewData((prev) =>
        prev.map((r) => (r.id === editingReview.id ? { ...r, ...updatedReview } : r))
      )
      
      setShowReviewModal(false)
      setEditingReview(null)
      setNewReview({ date: "", topic: "", status: "Not Done", notes: "" })
      setSavedAnalysis("")
    } catch (error) {
      console.error("Error updating review:", error)
      alert("Error updating review. Please try again.")
    }
  }

  const handleDeleteReview = async (id) => {
    if (isInvestorView) return
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await deleteDoc(doc(db, "strategyReviews", id))
        setReviewData((prev) => prev.filter((r) => r.id !== id))
        setSavedAnalysis("")
      } catch (error) {
        console.error("Error deleting review:", error)
      }
    }
  }

  const handleFileUpload = async (file, type) => {
    if (!file) return null
    
    setUploading(true)
    try {
      // Create a unique file name
      const timestamp = Date.now()
      const fileName = `${timestamp}_${file.name}`
      const storageRef = ref(storage, `change-documents/${currentUser.uid}/${type}/${fileName}`)
      
      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file)
      
      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef)
      
      setUploading(false)
      return {
        fileName: file.name,
        fileUrl: downloadUrl,
        storagePath: `change-documents/${currentUser.uid}/${type}/${fileName}`
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploading(false)
      alert("Error uploading file. Please try again.")
      return null
    }
  }

  const handleAddAdjustment = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add adjustments.")
      return
    }

    setUploading(true)

    try {
      let fileData = null
      if (newAdjustment.file) {
        fileData = await handleFileUpload(newAdjustment.file, 'adjustments')
      }

      const adjustmentWithUser = {
        date: newAdjustment.date,
        description: newAdjustment.description,
        reason: newAdjustment.reason,
        fileName: fileData?.fileName || newAdjustment.fileName,
        fileUrl: fileData?.fileUrl || "",
        storagePath: fileData?.storagePath || "",
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, "adjustments"), adjustmentWithUser)
      setAdjustments((prev) => [...prev, { id: docRef.id, ...adjustmentWithUser }])
      setShowAdjustmentModal(false)
      setNewAdjustment({ 
        date: "", 
        description: "", 
        reason: "",
        file: null,
        fileName: ""
      })
      setSavedAnalysis("")
      setUploading(false)
    } catch (error) {
      console.error("Error adding adjustment:", error)
      alert("Error adding adjustment. Please try again.")
      setUploading(false)
    }
  }

  const handleEditAdjustment = (adjustment) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingAdjustment(adjustment)
    setNewAdjustment({
      date: adjustment.date || "",
      description: adjustment.description || "",
      reason: adjustment.reason || "",
      file: null,
      fileName: adjustment.fileName || ""
    })
    setShowAdjustmentModal(true)
  }

  const handleUpdateAdjustment = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser || !editingAdjustment) return

    setUploading(true)

    try {
      let fileData = null
      if (newAdjustment.file) {
        fileData = await handleFileUpload(newAdjustment.file, 'adjustments')
      }

      const adjustmentRef = doc(db, "adjustments", editingAdjustment.id)
      const updatedAdjustment = {
        date: newAdjustment.date,
        description: newAdjustment.description,
        reason: newAdjustment.reason,
        fileName: fileData?.fileName || newAdjustment.fileName,
        fileUrl: fileData?.fileUrl || editingAdjustment.fileUrl || "",
        storagePath: fileData?.storagePath || editingAdjustment.storagePath || "",
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(adjustmentRef, updatedAdjustment)
      
      setAdjustments((prev) =>
        prev.map((a) => (a.id === editingAdjustment.id ? { ...a, ...updatedAdjustment } : a))
      )
      
      setShowAdjustmentModal(false)
      setEditingAdjustment(null)
      setNewAdjustment({ date: "", description: "", reason: "", file: null, fileName: "" })
      setSavedAnalysis("")
      setUploading(false)
    } catch (error) {
      console.error("Error updating adjustment:", error)
      alert("Error updating adjustment. Please try again.")
      setUploading(false)
    }
  }

  const handleDeleteAdjustment = async (id) => {
    if (isInvestorView) return
    if (window.confirm("Are you sure you want to delete this adjustment?")) {
      try {
        await deleteDoc(doc(db, "adjustments", id))
        setAdjustments((prev) => prev.filter((a) => a.id !== id))
        setSavedAnalysis("")
      } catch (error) {
        console.error("Error deleting adjustment:", error)
      }
    }
  }

  const handleAddPivot = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser) {
      alert("You must be logged in to add pivots.")
      return
    }

    setUploading(true)

    try {
      let fileData = null
      if (newPivot.file) {
        fileData = await handleFileUpload(newPivot.file, 'pivots')
      }

      const pivotWithUser = {
        date: newPivot.date,
        from: newPivot.from,
        to: newPivot.to,
        reason: newPivot.reason,
        fileName: fileData?.fileName || newPivot.fileName,
        fileUrl: fileData?.fileUrl || "",
        storagePath: fileData?.storagePath || "",
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, "pivots"), pivotWithUser)
      setPivots((prev) => [...prev, { id: docRef.id, ...pivotWithUser }])
      setShowPivotModal(false)
      setNewPivot({ 
        date: "", 
        from: "", 
        to: "", 
        reason: "",
        file: null,
        fileName: ""
      })
      setSavedAnalysis("")
      setUploading(false)
    } catch (error) {
      console.error("Error adding pivot:", error)
      alert("Error adding pivot. Please try again.")
      setUploading(false)
    }
  }

  const handleEditPivot = (pivot) => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }
    setEditingPivot(pivot)
    setNewPivot({
      date: pivot.date || "",
      from: pivot.from || "",
      to: pivot.to || "",
      reason: pivot.reason || "",
      file: null,
      fileName: pivot.fileName || ""
    })
    setShowPivotModal(true)
  }

  const handleUpdatePivot = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot make changes.")
      return
    }

    if (!currentUser || !editingPivot) return

    setUploading(true)

    try {
      let fileData = null
      if (newPivot.file) {
        fileData = await handleFileUpload(newPivot.file, 'pivots')
      }

      const pivotRef = doc(db, "pivots", editingPivot.id)
      const updatedPivot = {
        date: newPivot.date,
        from: newPivot.from,
        to: newPivot.to,
        reason: newPivot.reason,
        fileName: fileData?.fileName || newPivot.fileName,
        fileUrl: fileData?.fileUrl || editingPivot.fileUrl || "",
        storagePath: fileData?.storagePath || editingPivot.storagePath || "",
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(pivotRef, updatedPivot)
      
      setPivots((prev) =>
        prev.map((p) => (p.id === editingPivot.id ? { ...p, ...updatedPivot } : p))
      )
      
      setShowPivotModal(false)
      setEditingPivot(null)
      setNewPivot({ date: "", from: "", to: "", reason: "", file: null, fileName: "" })
      setSavedAnalysis("")
      setUploading(false)
    } catch (error) {
      console.error("Error updating pivot:", error)
      alert("Error updating pivot. Please try again.")
      setUploading(false)
    }
  }

  const handleDeletePivot = async (id) => {
    if (isInvestorView) return
    if (window.confirm("Are you sure you want to delete this pivot?")) {
      try {
        await deleteDoc(doc(db, "pivots", id))
        setPivots((prev) => prev.filter((p) => p.id !== id))
        setSavedAnalysis("")
      } catch (error) {
        console.error("Error deleting pivot:", error)
      }
    }
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      if (type === 'adjustment') {
        setNewAdjustment(prev => ({
          ...prev,
          file: file,
          fileName: file.name
        }))
      } else if (type === 'pivot') {
        setNewPivot(prev => ({
          ...prev,
          file: file,
          fileName: file.name
        }))
      }
    }
  }

  // AI Analysis Functions
  const prepareChangeAdaptabilityData = () => {
    // Calculate review metrics
    const totalReviews = reviewData.length
    const completedReviews = reviewData.filter(r => r.status === "Done").length
    const pendingReviews = reviewData.filter(r => r.status === "Not Done").length
    const reviewCompletionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0
    
    // Group reviews by month/year
    const reviewsByTimeframe = {}
    reviewData.forEach(review => {
      if (review.date) {
        const date = new Date(review.date)
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
        if (!reviewsByTimeframe[monthYear]) reviewsByTimeframe[monthYear] = 0
        reviewsByTimeframe[monthYear]++
      }
    })

    // Calculate adjustment metrics
    const totalAdjustments = adjustments.length
    const adjustmentsWithDocs = adjustments.filter(a => a.fileUrl).length
    const adjustmentsWithReason = adjustments.filter(a => a.reason && a.reason.trim() !== "").length
    
    // Calculate pivot metrics
    const totalPivots = pivots.length
    const pivotsWithDocs = pivots.filter(p => p.fileUrl).length
    const pivotsWithReason = pivots.filter(p => p.reason && p.reason.trim() !== "").length
    
    // Calculate adaptation velocity (adjustments + pivots per month)
    const allChanges = [...adjustments, ...pivots].filter(item => item.date)
    const changesByMonth = {}
    allChanges.forEach(item => {
      if (item.date) {
        const date = new Date(item.date)
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
        if (!changesByMonth[monthYear]) changesByMonth[monthYear] = 0
        changesByMonth[monthYear]++
      }
    })
    
    // Calculate average changes per month
    const monthsWithChanges = Object.keys(changesByMonth).length
    const avgChangesPerMonth = monthsWithChanges > 0 
      ? (totalAdjustments + totalPivots) / monthsWithChanges 
      : 0
    
    // Analyze pivot patterns
    const pivotThemes = {}
    pivots.forEach(pivot => {
      const fromWords = (pivot.from || "").toLowerCase().split(/\s+/)
      const toWords = (pivot.to || "").toLowerCase().split(/\s+/)
      
      ;[...fromWords, ...toWords].forEach(word => {
        if (word.length > 3) {
          if (!pivotThemes[word]) pivotThemes[word] = 0
          pivotThemes[word]++
        }
      })
    })
    
    // Sort themes by frequency
    const topPivotThemes = Object.entries(pivotThemes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }))
    
    // Analyze adjustment reasons
    const adjustmentReasons = {}
    adjustments.forEach(adj => {
      const reasonWords = (adj.reason || "").toLowerCase().split(/\s+/)
      reasonWords.forEach(word => {
        if (word.length > 3) {
          if (!adjustmentReasons[word]) adjustmentReasons[word] = 0
          adjustmentReasons[word]++
        }
      })
    })
    
    const topAdjustmentReasons = Object.entries(adjustmentReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }))

    return {
      // Review metrics
      totalReviews,
      completedReviews,
      pendingReviews,
      reviewCompletionRate,
      reviewsByTimeframe,
      
      // Adjustment metrics
      totalAdjustments,
      adjustmentsWithDocs,
      adjustmentsWithReason,
      adjustmentDocumentationRate: totalAdjustments > 0 ? Math.round((adjustmentsWithDocs / totalAdjustments) * 100) : 0,
      adjustmentReasonRate: totalAdjustments > 0 ? Math.round((adjustmentsWithReason / totalAdjustments) * 100) : 0,
      
      // Pivot metrics
      totalPivots,
      pivotsWithDocs,
      pivotsWithReason,
      pivotDocumentationRate: totalPivots > 0 ? Math.round((pivotsWithDocs / totalPivots) * 100) : 0,
      pivotReasonRate: totalPivots > 0 ? Math.round((pivotsWithReason / totalPivots) * 100) : 0,
      
      // Adaptation velocity
      totalChanges: totalAdjustments + totalPivots,
      avgChangesPerMonth: Math.round(avgChangesPerMonth * 10) / 10,
      changesByMonth,
      
      // Pattern analysis
      topPivotThemes,
      topAdjustmentReasons,
      
      // Documentation health
      overallDocumentationRate: (totalAdjustments + totalPivots) > 0
        ? Math.round(((adjustmentsWithDocs + pivotsWithDocs) / (totalAdjustments + totalPivots)) * 100)
        : 0,
      
      // Has data flags
      hasReviews: totalReviews > 0,
      hasAdjustments: totalAdjustments > 0,
      hasPivots: totalPivots > 0,
      hasAnyData: totalReviews > 0 || totalAdjustments > 0 || totalPivots > 0
    }
  }

  const createChangeAdaptabilityPrompt = (data) => {
    return `Analyze the Change and Adaptability capability of a business based on the following strategic adaptation data:

CHANGE MANAGEMENT DATA:

1. STRATEGY REVIEWS:
   Total Reviews Scheduled: ${data.totalReviews}
   Completed Reviews: ${data.completedReviews} (${data.reviewCompletionRate}% completion rate)
   Pending Reviews: ${data.pendingReviews}
   
   Reviews by Timeframe:
   ${Object.keys(data.reviewsByTimeframe).map(month => 
     `   - ${month}: ${data.reviewsByTimeframe[month]} reviews`
   ).join('\n')}

2. STRATEGIC ADJUSTMENTS:
   Total Adjustments Made: ${data.totalAdjustments}
   Adjustments with Documentation: ${data.adjustmentsWithDocs} (${data.adjustmentDocumentationRate}%)
   Adjustments with Clear Reason: ${data.adjustmentsWithReason} (${data.adjustmentReasonRate}%)
   
   Top Adjustment Reasons:
   ${data.topAdjustmentReasons.map((r, i) => 
     `   ${i+1}. "${r.reason}" (${r.count} occurrences)`
   ).join('\n')}

3. STRATEGIC PIVOTS:
   Total Pivots Executed: ${data.totalPivots}
   Pivots with Documentation: ${data.pivotsWithDocs} (${data.pivotDocumentationRate}%)
   Pivots with Clear Reason: ${data.pivotsWithReason} (${data.pivotReasonRate}%)
   
   Top Pivot Themes:
   ${data.topPivotThemes.map((t, i) => 
     `   ${i+1}. "${t.theme}" (${t.count} occurrences)`
   ).join('\n')}

4. ADAPTATION VELOCITY:
   Total Changes (Adjustments + Pivots): ${data.totalChanges}
   Average Changes per Month: ${data.avgChangesPerMonth}
   
   Changes by Month:
   ${Object.keys(data.changesByMonth).map(month => 
     `   - ${month}: ${data.changesByMonth[month]} changes`
   ).join('\n')}

5. DOCUMENTATION HEALTH:
   Overall Documentation Rate: ${data.overallDocumentationRate}%

ANALYSIS REQUIREMENTS:

1. ADAPTABILITY ASSESSMENT:
   - Evaluate the organization's ability to conduct regular strategy reviews
   - Assess the frequency and quality of strategic adjustments
   - Analyze pivot patterns and strategic direction changes
   - Rate overall change adaptability on a scale of 1-10

2. REVIEW DISCIPLINE:
   - Analyze strategy review cadence and completion rates
   - Identify gaps in review execution
   - Recommend optimal review frequency

3. ADJUSTMENT EFFECTIVENESS:
   - Evaluate the quality of strategic adjustments
   - Assess documentation and reasoning completeness
   - Identify patterns in what triggers adjustments

4. PIVOT INTELLIGENCE:
   - Analyze pivot themes and direction changes
   - Assess pivot documentation quality
   - Evaluate strategic learning from pivots

5. ADAPTATION VELOCITY:
   - Assess the speed of organizational response to change
   - Compare change frequency against industry benchmarks
   - Recommend optimal change velocity

6. ACTIONABLE RECOMMENDATIONS:
   - Provide 3-5 specific, actionable improvements
   - Suggest improvements for review discipline
   - Recommend better change documentation practices
   - Include timelines and measurable goals

7. ORGANIZATIONAL LEARNING:
   - Assess how change is institutionalized
   - Evaluate learning from past adjustments and pivots
   - Recommend knowledge management improvements

FORMAT REQUIREMENTS:
- Start with an executive summary
- Use plain text section headers without markdown symbols
- Include specific examples from the data
- End with a Change Adaptability Score and Rating

OUTPUT FORMAT:
Executive Summary
[Brief overview of change and adaptability capability]

Change Adaptability Score: [X]/10
Rating: [Rigid/Reactive/Responsive/Proactive/Agile]

Strategy Review Discipline
[Analysis of review cadence, completion rates, and recommendations]

Strategic Adjustment Analysis
[Evaluation of adjustment quality, triggers, and patterns]

Pivot Intelligence Assessment
[Analysis of pivot themes, strategic learning, and direction changes]

Adaptation Velocity
[Assessment of change frequency and organizational responsiveness]

Documentation & Governance
[Evaluation of change documentation practices and recommendations]

Organizational Learning Index
[How well the organization learns and institutionalizes change]

Top 5 Actionable Recommendations
1. [Specific action with timeline and owner suggestion]
2. [Specific action with measurable outcome]
3. [Specific action for improving review discipline]
4. [Specific action for enhancing change documentation]
5. [Specific action for building adaptive capacity]

Strategic Resilience Outlook
[How adaptability affects long-term strategic resilience]

IMPORTANT: Do NOT use any markdown formatting like ###, **, or # in your response. Use plain text only with section titles as shown above.`
  }

  const generateAIAnalysis = async () => {
    if (isInvestorView) {
      alert("You are in view-only mode and cannot generate AI analysis.")
      return
    }

    if (!currentUser) {
      setAnalysisError("You must be logged in to generate analysis.")
      return
    }

    const analysisData = prepareChangeAdaptabilityData()
    
    if (!analysisData.hasAnyData) {
      setAnalysisError("No change and adaptability data available for analysis. Please add strategy reviews, adjustments, or pivots first.")
      return
    }

    setIsGenerating(true)
    setAnalysisError("")
    setShowAIAnalysis(true)

    try {
      const prompt = createChangeAdaptabilityPrompt(analysisData)

      const functions = getFunctions()
      const generateChangeAdaptabilityAnalysis = httpsCallable(functions, "generateChangeAdaptabilityAnalysis")
      
      const response = await generateChangeAdaptabilityAnalysis({
        prompt: prompt,
        userId: currentUser.uid,
        timestamp: new Date().toISOString()
      })

      let analysis = response?.data?.content || response?.data?.analysis
      
      if (!analysis) {
        throw new Error("No analysis generated")
      }

      // Clean the analysis before saving
      analysis = cleanAIResponse(analysis);

      // Save analysis to Firestore
      const aiAnalysisRef = doc(db, "changeAdaptabilityAnalysis", currentUser.uid)
      await setDoc(aiAnalysisRef, {
        analysis: analysis,
        timestamp: new Date().toISOString(),
        dataSnapshot: {
          totalReviews: analysisData.totalReviews,
          totalAdjustments: analysisData.totalAdjustments,
          totalPivots: analysisData.totalPivots,
          reviewCompletionRate: analysisData.reviewCompletionRate,
          avgChangesPerMonth: analysisData.avgChangesPerMonth,
          overallDocumentationRate: analysisData.overallDocumentationRate
        },
        userId: currentUser.uid
      }, { merge: true })

      setAiAnalysis(analysis)
      setSavedAnalysis(analysis)
      
    } catch (error) {
      console.error("Error generating AI analysis:", error)
      setAnalysisError(`Failed to generate analysis: ${error.message}`)
      setAiAnalysis("AI analysis will be generated based on your strategy reviews, adjustments, and pivot data, evaluating your organization's ability to adapt to change and institutionalize learning.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAIAnalysis = () => {
    if (!showAIAnalysis) {
      if (savedAnalysis) {
        setAiAnalysis(savedAnalysis)
        setShowAIAnalysis(true)
      } else {
        generateAIAnalysis()
      }
    } else {
      setShowAIAnalysis(!showAIAnalysis)
    }
  }

  const refreshAnalysis = async () => {
    await generateAIAnalysis()
  }

  const filteredAdjustments = adjustments.filter((item) => {
    if (!selectedMonth && !selectedYear) return true
    
    const itemDate = new Date(item.date)
    const monthMatch = !selectedMonth || (itemDate.getMonth() + 1) === parseInt(selectedMonth)
    const yearMatch = !selectedYear || itemDate.getFullYear() === parseInt(selectedYear)
    
    return monthMatch && yearMatch
  })

  const filteredPivots = pivots.filter((item) => {
    if (!selectedMonth && !selectedYear) return true
    
    const itemDate = new Date(item.date)
    const monthMatch = !selectedMonth || (itemDate.getMonth() + 1) === parseInt(selectedMonth)
    const yearMatch = !selectedYear || itemDate.getFullYear() === parseInt(selectedYear)
    
    return monthMatch && yearMatch
  })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i)

  return (
    <div
      style={{
        backgroundColor: "#fdfcfb",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Key Question Section */}
      <KeyQuestionBox
        question={SECTION_DATA["change-adaptability"].keyQuestion}
        signals={SECTION_DATA["change-adaptability"].keySignals}
        decisions={SECTION_DATA["change-adaptability"].keyDecisions}
      />

      {/* Month/Year Filter */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ color: "#4a352f", fontWeight: "500" }}>Filter by:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "2px solid #e8ddd4",
            borderRadius: "4px",
            backgroundColor: "white",
            color: "#4a352f",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "2px solid #e8ddd4",
            borderRadius: "4px",
            backgroundColor: "white",
            color: "#4a352f",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        
        {(selectedMonth || selectedYear) && (
          <button
            onClick={() => {
              setSelectedMonth("")
              setSelectedYear("")
            }}
            style={{
              padding: "8px 12px",
              backgroundColor: "#e6d7c3",
              color: "#4a352f",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Strategy Review Calendar */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ color: "#5d4037", margin: 0 }}>Strategy Review Calendar</h3>
          {!isInvestorView && (
            <button
              onClick={() => {
                setEditingReview(null)
                setNewReview({ date: "", topic: "", status: "Not Done", notes: "" })
                setShowReviewModal(true)
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              Add Review
            </button>
          )}
        </div>

        {reviewData.length === 0 ? (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>No strategy reviews scheduled yet.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#4a352f",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Topic</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Notes</th>
                {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {reviewData
                .filter(review => {
                  if (!selectedMonth && !selectedYear) return true
                  const reviewDate = new Date(review.date)
                  const monthMatch = !selectedMonth || (reviewDate.getMonth() + 1) === parseInt(selectedMonth)
                  const yearMatch = !selectedYear || reviewDate.getFullYear() === parseInt(selectedYear)
                  return monthMatch && yearMatch
                })
                .map((review) => (
                <tr key={review.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                  <td style={{ padding: "12px" }}>{review.date}</td>
                  <td style={{ padding: "12px" }}>{review.topic}</td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: review.status === "Done" ? "#c8e6c9" : "#ffcdd2",
                      }}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", maxWidth: "300px" }}>{review.notes}</td>
                  {!isInvestorView && (
                    <td style={{ padding: "12px", display: "flex", gap: "5px" }}>
                      <button
                        onClick={() => handleEditReview(review)}
                        style={{
                          padding: "6px",
                          backgroundColor: "transparent",
                          color: "#7d5a50",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        style={{
                          padding: "6px",
                          backgroundColor: "transparent",
                          color: "#F44336",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                        title="Delete"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjustments Documented */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ color: "#5d4037", margin: 0 }}>Adjustments Documented</h3>
          {!isInvestorView && (
            <button
              onClick={() => {
                setEditingAdjustment(null)
                setNewAdjustment({ date: "", description: "", reason: "", file: null, fileName: "" })
                setShowAdjustmentModal(true)
              }}
              disabled={uploading}
              style={{
                padding: "8px 16px",
                backgroundColor: uploading ? "#a1887f" : "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              {uploading ? "Uploading..." : "Add Adjustment"}
            </button>
          )}
        </div>

        {filteredAdjustments.length === 0 ? (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>No adjustments documented yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#4a352f",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Description</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Reason</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Documents</th>
                  {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAdjustments.map((adjustment) => (
                  <tr key={adjustment.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "12px" }}>{adjustment.date}</td>
                    <td style={{ padding: "12px", maxWidth: "300px" }}>{adjustment.description}</td>
                    <td style={{ padding: "12px", maxWidth: "300px" }}>{adjustment.reason}</td>
                    <td style={{ padding: "12px" }}>
                      {adjustment.fileUrl ? (
                        <a
                          href={adjustment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#7d5a50",
                            textDecoration: "underline",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FaDownload size={12} />
                          {adjustment.fileName || "Download"}
                        </a>
                      ) : adjustment.fileName ? (
                        <span style={{ color: "#8d6e63" }}>📄 {adjustment.fileName}</span>
                      ) : null}
                    </td>
                    {!isInvestorView && (
                      <td style={{ padding: "12px", display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => handleEditAdjustment(adjustment)}
                          style={{
                            padding: "6px",
                            backgroundColor: "transparent",
                            color: "#7d5a50",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteAdjustment(adjustment.id)}
                          style={{
                            padding: "6px",
                            backgroundColor: "transparent",
                            color: "#F44336",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                          title="Delete"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pivot History Documented */}
      <div
        style={{
          backgroundColor: "#f7f3f0",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3 style={{ color: "#5d4037", margin: 0 }}>Pivot History Documented</h3>
          {!isInvestorView && (
            <button
              onClick={() => {
                setEditingPivot(null)
                setNewPivot({ date: "", from: "", to: "", reason: "", file: null, fileName: "" })
                setShowPivotModal(true)
              }}
              disabled={uploading}
              style={{
                padding: "8px 16px",
                backgroundColor: uploading ? "#a1887f" : "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: uploading ? "not-allowed" : "pointer",
                fontWeight: "500",
                fontSize: "12px",
              }}
            >
              {uploading ? "Uploading..." : "Add Pivot"}
            </button>
          )}
        </div>

        {filteredPivots.length === 0 ? (
          <p style={{ color: "#7d5a50", textAlign: "center", padding: "20px" }}>No pivots documented yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "#4a352f",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#e6d7c3", borderBottom: "2px solid #c8b6a6" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>From</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>To</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Reason</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Documents</th>
                  {!isInvestorView && <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPivots.map((pivot) => (
                  <tr key={pivot.id} style={{ borderBottom: "1px solid #e6d7c3" }}>
                    <td style={{ padding: "12px" }}>{pivot.date}</td>
                    <td style={{ padding: "12px", maxWidth: "200px" }}>{pivot.from}</td>
                    <td style={{ padding: "12px", maxWidth: "200px" }}>{pivot.to}</td>
                    <td style={{ padding: "12px", maxWidth: "300px" }}>{pivot.reason}</td>
                    <td style={{ padding: "12px" }}>
                      {pivot.fileUrl ? (
                        <a
                          href={pivot.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#7d5a50",
                            textDecoration: "underline",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <FaDownload size={12} />
                          {pivot.fileName || "Download"}
                        </a>
                      ) : pivot.fileName ? (
                        <span style={{ color: "#8d6e63" }}>📄 {pivot.fileName}</span>
                      ) : null}
                    </td>
                    {!isInvestorView && (
                      <td style={{ padding: "12px", display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => handleEditPivot(pivot)}
                          style={{
                            padding: "6px",
                            backgroundColor: "transparent",
                            color: "#7d5a50",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeletePivot(pivot.id)}
                          style={{
                            padding: "6px",
                            backgroundColor: "transparent",
                            color: "#F44336",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                          title="Delete"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={handleAIAnalysis}
            disabled={isGenerating || isInvestorView || !prepareChangeAdaptabilityData().hasAnyData}
            style={{
              padding: "12px 24px",
              backgroundColor: isInvestorView || !prepareChangeAdaptabilityData().hasAnyData ? "#a1887f" : "#4a352f",
              color: "#fdfcfb",
              border: "none",
              borderRadius: "6px",
              cursor: isInvestorView || !prepareChangeAdaptabilityData().hasAnyData ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="spin" style={{ animation: "spin 1s linear infinite" }} />
                Generating Adaptability Analysis...
              </>
            ) : (
              <>
                <FaRobot />
                AI Change Adaptability Analysis
              </>
            )}
          </button>

          {savedAnalysis && !isGenerating && !isInvestorView && prepareChangeAdaptabilityData().hasAnyData && (
            <button
              onClick={refreshAnalysis}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Refresh AI Analysis"
            >
              Refresh
            </button>
          )}
        </div>
        
        {!prepareChangeAdaptabilityData().hasAnyData && (
          <p style={{ color: "#8d6e63", fontSize: "13px", fontStyle: "italic", marginLeft: "10px" }}>
            Add strategy reviews, adjustments, or pivots to generate AI analysis of your change adaptability.
          </p>
        )}
        
        {showAIAnalysis && (
          <div
            style={{
              backgroundColor: "#f8f4f0",
              padding: "20px",
              borderRadius: "8px",
              border: "1px solid #d7ccc8",
              marginTop: "10px",
              position: "relative"
            }}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px"
            }}>
              <div>
                <label
                  style={{
                    fontSize: "16px",
                    color: "#5d4037",
                    fontWeight: "600",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Change & Adaptability AI Analysis
                </label>
                <p style={{
                  fontSize: "12px",
                  color: "#8d6e63",
                  margin: "0 0 10px 0",
                  fontStyle: "italic"
                }}>
                  Analysis generated from {reviewData.length} reviews, {adjustments.length} adjustments, and {pivots.length} pivots
                </p>
              </div>
              
              {savedAnalysis && (
                <span style={{
                  fontSize: "10px",
                  color: "#8d6e63",
                  backgroundColor: "#efebe9",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: "500"
                }}>
                  Saved Analysis
                </span>
              )}
            </div>

            {analysisError ? (
              <div style={{
                padding: "15px",
                backgroundColor: "#ffebee",
                borderRadius: "6px",
                border: "1px solid #ffcdd2",
                color: "#c62828",
                fontSize: "14px"
              }}>
                <strong>Error:</strong> {analysisError}
              </div>
            ) : isGenerating ? (
              <div style={{
                textAlign: "center",
                padding: "30px",
                color: "#5d4037"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid #f3e5f5",
                  borderTop: "3px solid #8d6e63",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 15px"
                }}></div>
                <p>Analyzing your change and adaptability data...</p>
                <p style={{ fontSize: "12px", color: "#8d6e63", marginTop: "5px" }}>
                  Evaluating review discipline, adjustment patterns, pivot intelligence, and adaptation velocity
                </p>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "white",
                  padding: "20px",
                  borderRadius: "6px",
                  border: "1px solid #e8d8cf",
                  maxHeight: "400px",
                  overflowY: "auto",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#5d4037",
                  whiteSpace: "pre-wrap"
                }}
              >
                {aiAnalysis || "AI analysis will be generated based on your strategy reviews, adjustments, and pivot data, evaluating your organization's ability to adapt to change and institutionalize learning."}
              </div>
            )}

            <div style={{
              marginTop: "15px",
              paddingTop: "15px",
              borderTop: "1px solid #e8d8cf",
              fontSize: "11px",
              color: "#8d6e63",
              fontStyle: "italic",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>Analysis powered by AI • Updates when change data changes</span>
              <button
                onClick={() => setShowAIAnalysis(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8d6e63",
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline"
                }}
              >
                Hide Analysis
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>
              {editingReview ? "Edit Strategy Review" : "Add Strategy Review"}
            </h3>
            <input
              type="date"
              value={newReview.date}
              onChange={(e) => setNewReview((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <input
              type="text"
              placeholder="Topic"
              value={newReview.topic}
              onChange={(e) => setNewReview((prev) => ({ ...prev, topic: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <select
              value={newReview.status}
              onChange={(e) => setNewReview((prev) => ({ ...prev, status: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                marginBottom: "15px",
              }}
            >
              <option value="Done">Done</option>
              <option value="Not Done">Not Done</option>
            </select>
            <textarea
              placeholder="Notes"
              value={newReview.notes}
              onChange={(e) => setNewReview((prev) => ({ ...prev, notes: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "20px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setEditingReview(null)
                  setNewReview({ date: "", topic: "", status: "Not Done", notes: "" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingReview ? handleUpdateReview : handleAddReview}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                {editingReview ? "Update Review" : "Add Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>
              {editingAdjustment ? "Edit Adjustment" : "Add Adjustment"}
            </h3>
            <input
              type="date"
              value={newAdjustment.date}
              onChange={(e) => setNewAdjustment((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <textarea
              placeholder="Description"
              value={newAdjustment.description}
              onChange={(e) => setNewAdjustment((prev) => ({ ...prev, description: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <textarea
              placeholder="Reason"
              value={newAdjustment.reason}
              onChange={(e) => setNewAdjustment((prev) => ({ ...prev, reason: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Attach Document
              </label>
              <input
                type="file"
                onChange={(e) => handleFileSelect(e, 'adjustment')}
                disabled={uploading}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              {newAdjustment.fileName && (
                <p style={{ color: "#7d5a50", fontSize: "12px", marginTop: "5px" }}>
                  Selected: {newAdjustment.fileName}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowAdjustmentModal(false)
                  setEditingAdjustment(null)
                  setNewAdjustment({ date: "", description: "", reason: "", file: null, fileName: "" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingAdjustment ? handleUpdateAdjustment : handleAddAdjustment}
                disabled={uploading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: uploading ? "#a1887f" : "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {uploading ? "Uploading..." : (editingAdjustment ? "Update Adjustment" : "Add Adjustment")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pivot Modal */}
      {showPivotModal && !isInvestorView && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
            }}
          >
            <h3 style={{ color: "#5d4037", marginTop: 0 }}>
              {editingPivot ? "Edit Pivot" : "Add Pivot"}
            </h3>
            <input
              type="date"
              value={newPivot.date}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, date: e.target.value }))}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
              }}
            />
            <textarea
              placeholder="From (previous direction)"
              value={newPivot.from}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, from: e.target.value }))}
              rows="2"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <textarea
              placeholder="To (new direction)"
              value={newPivot.to}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, to: e.target.value }))}
              rows="2"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <textarea
              placeholder="Reason"
              value={newPivot.reason}
              onChange={(e) => setNewPivot((prev) => ({ ...prev, reason: e.target.value }))}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e8ddd4",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
                marginBottom: "15px",
                fontFamily: "inherit",
              }}
            />
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", color: "#4a352f", fontWeight: "500" }}>
                Attach Document
              </label>
              <input
                type="file"
                onChange={(e) => handleFileSelect(e, 'pivot')}
                disabled={uploading}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e8ddd4",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              {newPivot.fileName && (
                <p style={{ color: "#7d5a50", fontSize: "12px", marginTop: "5px" }}>
                  Selected: {newPivot.fileName}
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowPivotModal(false)
                  setEditingPivot(null)
                  setNewPivot({ date: "", from: "", to: "", reason: "", file: null, fileName: "" })
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e6d7c3",
                  color: "#4a352f",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingPivot ? handleUpdatePivot : handleAddPivot}
                disabled={uploading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: uploading ? "#a1887f" : "#7d5a50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {uploading ? "Uploading..." : (editingPivot ? "Update Pivot" : "Add Pivot")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const Strategy = () => {
  const [activeSection, setActiveSection] = useState("strategic-clarity")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [milestoneData, setMilestoneData] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isInvestorView, setIsInvestorView] = useState(false)
  const [viewOrigin, setViewOrigin] = useState("investor") // ADD THIS LINE
  const [viewingSMEId, setViewingSMEId] = useState(null)
  const [viewingSMEName, setViewingSMEName] = useState("")
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [showFullDescription, setShowFullDescription] = useState(false)

 useEffect(() => {
  const investorViewMode = sessionStorage.getItem("investorViewMode")
  const smeId = sessionStorage.getItem("viewingSMEId")
  const smeName = sessionStorage.getItem("viewingSMEName")
  const origin = sessionStorage.getItem("viewOrigin") // Get the origin

  if (investorViewMode === "true" && smeId) {
    setIsInvestorView(true)
    setViewingSMEId(smeId)
    setViewingSMEName(smeName || "SME")
    setViewOrigin(origin || "investor") // Set origin
    console.log("Investor view mode activated for SME:", smeId, "Origin:", origin)
  }
}, [])

  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    checkSidebarState()

    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isInvestorView && viewingSMEId) {
        setCurrentUser({ uid: viewingSMEId })
      } else {
        setCurrentUser(user)
      }
    })

    return () => unsubscribe()
  }, [isInvestorView, viewingSMEId])

  useEffect(() => {
    const loadUserMilestoneData = async () => {
      if (!currentUser) {
        setMilestoneData([])
        return
      }

      try {
        const milestonesSnapshot = await getDocs(
          query(collection(db, "milestones"), where("userId", "==", currentUser.uid)),
        )
        setMilestoneData(milestonesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error loading user milestone data:", error)
      }
    }

    loadUserMilestoneData()
  }, [currentUser])

  const getContentStyles = () => ({
    flex: 1,
    paddingLeft: isSidebarCollapsed ? "80px" : "250px",
    transition: "padding 0.3s ease",
    boxSizing: "border-box",
    width: "100%",
    overflowX: "hidden",
  })

 const handleExitInvestorView = () => {
  // Clear all session storage items
  sessionStorage.removeItem("viewingSMEId")
  sessionStorage.removeItem("viewingSMEName")
  sessionStorage.removeItem("investorViewMode")
  sessionStorage.removeItem("viewOrigin")
  
  // Navigate based on origin
  if (viewOrigin === "catalyst") {
    window.location.href = "/catalyst/cohorts" // Go back to Catalyst cohorts
  } else {
    window.location.href = "/my-cohorts" // Go back to Investor cohorts
  }
}

  const sectionButtons = [
    { id: "strategic-clarity", label: "Strategic Clarity" },
    { id: "operating-model", label: "Operating Model" },
    { id: "strategy-operationalisation", label: "Strategy Operationalisation" },
    { id: "strategic-risk-control", label: "Strategic Risk Control" },
    { id: "change-adaptability", label: "Change and adaptability" },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", overflow: "hidden" }}>
      <Sidebar />

      <div style={getContentStyles()}>
        <Header />

{isInvestorView && (
  <div
    style={{
      backgroundColor: "#e8f5e9",
      padding: "16px 20px",
      margin: "80px 20px 20px 20px",
      borderRadius: "8px",
      border: "2px solid #4caf50",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ fontSize: "20px" }}>👁️</span>
      <span style={{ color: "#2e7d32", fontWeight: "600", fontSize: "15px" }}>
        {viewOrigin === "catalyst" 
          ? `Catalyst View: Viewing ${viewingSMEName}'s Strategy & Execution`
          : `Investor View: Viewing ${viewingSMEName}'s Strategy & Execution`
        }
      </span>
    </div>
    <button
      onClick={handleExitInvestorView}
      style={{
        padding: "8px 16px",
        backgroundColor: "#4caf50",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px",
        transition: "background-color 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#45a049";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#4caf50";
      }}
    >
      <span>←</span>
      {viewOrigin === "catalyst" 
        ? "Back to Catalyst Cohorts"
        : "Back to My Cohorts"
      }
    </button>
  </div>
)}
        <div style={{ padding: "50px", paddingTop: "100px" }}>
          {/* UPDATED: Moved the "See more about dashboard" button under the heading */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ color: "#5d4037", fontSize: "32px", fontWeight: "700", margin: 0 }}>
              Strategy & Execution
            </h1>
          </div>
          
          {/* Moved button here to be directly under the heading */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "20px" }}>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#7d5a50",
                color: "#fdfcfb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {showFullDescription ? "See less" : "See more about dashboard"}
            </button>
          </div>

          {/* Strategy Description */}
          {showFullDescription && (
            <div
              style={{
                backgroundColor: "#fdfcfb",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                marginBottom: "30px",
              }}
            >
              <p style={{ color: "#4a352f", fontSize: "16px", lineHeight: "1.6", margin: 0 }}>
                The Strategy & Execution dashboard helps you assess whether your business is deliberately steered, 
                not reactive. It evaluates how strategy is translated into structure, priorities, and action, and 
                surfaces strategic execution risks rather than operational performance. This dashboard tests whether 
                your operating model fits your business's current reality.
              </p>
              
              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #e8ddd4" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      What this dashboard DOES
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Assesses whether the business is deliberately steered, not reactive</li>
                      <li>Evaluates whether strategy is translated into structure, priorities, and action</li>
                      <li>Surfaces strategic execution risk, not operational performance</li>
                      <li>Tests whether the operating model fits the business's current reality</li>
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ color: "#7d5a50", marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>
                      What this dashboard does NOT do
                    </h3>
                    <ul style={{ color: "#4a352f", fontSize: "14px", lineHeight: "1.7", margin: 0, paddingLeft: "20px" }}>
                      <li>Evaluate strategy quality or competitiveness</li>
                      <li>Track operational KPIs (Ops dashboard does that)</li>
                      <li>Measure performance outcomes (Finance & Ops do that)</li>
                      <li>Manage projects or OKRs</li>
                      <li>Replace business planning or consulting work</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#fdfcfb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              overflowX: "auto",
              whiteSpace: "nowrap",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {sectionButtons.map((button) => (
              <button
                key={button.id}
                onClick={() => setActiveSection(button.id)}
                style={{
                  padding: "12px 18px",
                  backgroundColor: activeSection === button.id ? "#7d5a50" : "#ffffff",
                  color: activeSection === button.id ? "#fdfcfb" : "#5d4037",
                  border: "2px solid #7d5a50",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "all 0.3s ease",
                  minWidth: "140px",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {button.label}
              </button>
            ))}
          </div>

          <StrategicClarity activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <BusinessModelCanvas
            activeSection={activeSection}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <StrategicGoals
            activeSection={activeSection}
            milestoneData={milestoneData}
            setMilestoneData={setMilestoneData}
            currentUser={currentUser}
            isInvestorView={isInvestorView}
          />
          <RiskManagement activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
          <ChangeAdaptability activeSection={activeSection} currentUser={currentUser} isInvestorView={isInvestorView} />
        </div>
      </div>
    </div>
  )
}

export default Strategy