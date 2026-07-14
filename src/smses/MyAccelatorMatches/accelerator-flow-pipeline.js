"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { auth, db } from "../../firebaseConfig"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import styles from "./acceleratorPipeline.module.css"

// Pipeline stage definitions - MATCHING THE SUPPORT TABLE EXACTLY
const APPLICATION_STAGES = {
  "NEW APPLICATION": { label: "New Application", next: "Application Sent" },
  "APPLICATION SENT": { label: "Application Sent", next: "Evaluation" },
  "EVALUATION": { label: "Evaluation", next: "Due Diligence" },
  "DUE DILIGENCE": { label: "Due Diligence", next: "Decision" },
  "DECISION": { label: "Decision", next: "Term Sheet" },
  "TERM SHEET": { label: "Term Sheet", next: "Active" },
  "ACTIVE": { label: "Active", next: "N/A" },
  "EXIT": { label: "Exit", next: "N/A" },
  "DECLINE": { label: "Decline", next: "N/A" },
  // Legacy mappings from the accelerator table
  "SUPPORT APPROVED": { label: "Support Approved", next: "Active" },
  "ACTIVE SUPPORT": { label: "Active Support", next: "N/A" },
  "SUPPORT DECLINED": { label: "Support Declined", next: "N/A" },
  "SUCCESSFUL DEALS": { label: "Successful Deals", next: "N/A" },
}

export function AcceleratorFlowPipeline({ accelerators = [], applications = [] }) {
  const [stages, setStages] = useState([
    {
      id: "newApplication",
      name: "New Application",
      count: 0,
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
      description: "New applications received",
      pipelineKeys: ["NEW APPLICATION", "MATCH", "MATCHED"]
    },
    {
      id: "applicationSent",
      name: "Application Sent",
      count: 0,
      colorClass: styles.stageApplication,
      iconColor: "#795548",
      description: "Applications you have submitted",
      pipelineKeys: ["APPLICATION SENT"]
    },
    {
      id: "evaluation",
      name: "Evaluation",
      count: 0,
      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
      description: "Applications currently under review",
      pipelineKeys: ["EVALUATION", "UNDER REVIEW", "IN REVIEW"]
    },
    {
      id: "dueDiligence",
      name: "Due Diligence",
      count: 0,
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
      description: "Applications in due diligence phase",
      pipelineKeys: ["DUE DILIGENCE", "SHORTLISTED"]
    },
    {
      id: "decision",
      name: "Decision",
      count: 0,
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
      description: "Awaiting final decision",
      pipelineKeys: ["DECISION"]
    },
    {
      id: "termSheet",
      name: "Term Sheet",
      count: 0,
      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
      description: "Term sheet issued",
      pipelineKeys: ["TERM SHEET", "SUPPORT APPROVED"]
    },
    {
      id: "active",
      name: "Active",
      count: 0,
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13",
      description: "Currently receiving active support",
      pipelineKeys: ["ACTIVE", "ACTIVE SUPPORT"]
    },
    {
      id: "exit",
      name: "Exit",
      count: 0,
      colorClass: styles.stageDeals,
      iconColor: "#1e0e09",
      description: "Successfully completed deals",
      pipelineKeys: ["EXIT", "SUCCESSFUL DEALS"]
    },
    {
      id: "decline",
      name: "Decline",
      count: 0,
      colorClass: styles.stageWithdrawn,
      iconColor: "#0e0705",
      description: "Applications declined or withdrawn",
      pipelineKeys: ["DECLINE", "SUPPORT DECLINED", "REJECTED", "WITHDRAWN"]
    }
  ])

  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)

  // Get effective user ID (handle company membership)
  useEffect(() => {
    const getEffectiveUser = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          const userCompanyId = userData.companyId
          const userCompanyRole = userData.userRole

          if (userCompanyId) {
            const companyDocRef = doc(db, "companies", userCompanyId)
            const companyDocSnap = await getDoc(companyDocRef)
            
            if (companyDocSnap.exists()) {
              const companyData = companyDocSnap.data()
              const ownerId = companyData.createdBy
              
              if (ownerId !== user.uid) {
                setEffectiveUserId(ownerId)
              } else {
                setEffectiveUserId(user.uid)
              }
            } else {
              setEffectiveUserId(user.uid)
            }
          } else {
            setEffectiveUserId(user.uid)
          }
        } else {
          setEffectiveUserId(user.uid)
        }
      } catch (error) {
        console.error("Error checking company membership:", error)
        setEffectiveUserId(user.uid)
      } finally {
        setLoading(false)
      }
    }

    getEffectiveUser()
  }, [])

  // Calculate counts based on current SME's applications
  const calculateStageCounts = async (userId) => {
    if (!userId) return {}

    try {
      // Query the smeCatalystApplications collection
      const q = query(
        collection(db, "smeCatalystApplications"),
        where("smeId", "==", userId)
      )
      
      const querySnapshot = await getDocs(q)
      const userApplications = querySnapshot.docs.map(doc => doc.data())
      
      console.log("📊 Found applications for user:", userId, userApplications.length)

      // Count unmatched accelerators (Match stage)
      const appliedCatalystIds = new Set(
        userApplications.map(app => `${app.catalystId}_${app.programIndex || 0}`)
      )
      
      const unmatchedAccelerators = accelerators.filter(acc => {
        const key = `${acc.originalCatalystId || acc.id}_${acc.programIndex || 0}`
        return !appliedCatalystIds.has(key)
      }).length

      // Initialize counts for all stages
      const counts = {
        newApplication: 0,
        applicationSent: 0,
        evaluation: 0,
        dueDiligence: 0,
        decision: 0,
        termSheet: 0,
        active: 0,
        exit: 0,
        decline: 0,
      }

      // Count applications by pipeline stage
      userApplications.forEach(app => {
        const stage = (app.status || app.status || "").toUpperCase()
        
        // Map to our stage IDs using the pipelineKeys
        switch(stage) {
          case "NEW APPLICATION":
          case "MATCH":
          case "MATCHED":
            counts.newApplication++
            break
          case "APPLICATION SENT":
            counts.applicationSent++
            break
          case "EVALUATION":
          case "UNDER REVIEW":
          case "IN REVIEW":
            counts.evaluation++
            break
          case "DUE DILIGENCE":
          case "SHORTLISTED":
            counts.dueDiligence++
            break
          case "DECISION":
            counts.decision++
            break
          case "TERM SHEET":
          case "SUPPORT APPROVED":
            counts.termSheet++
            break
          case "ACTIVE":
          case "ACTIVE SUPPORT":
            counts.active++
            break
          case "EXIT":
          case "SUCCESSFUL DEALS":
            counts.exit++
            break
          case "DECLINE":
          case "SUPPORT DECLINED":
          case "REJECTED":
          case "WITHDRAWN":
            counts.decline++
            break
          default:
            // If no specific stage, check if it's a known stage from the table
            if (stage && stage !== "MATCH") {
              counts.applicationSent++
            }
            break
        }
      })

      console.log("📊 Calculated counts:", counts)
      return counts
    } catch (error) {
      console.error("Error calculating stage counts:", error)
      return {}
    }
  }

  useEffect(() => {
    const updateCounts = async () => {
      if (effectiveUserId) {
        const stageCounts = await calculateStageCounts(effectiveUserId)
        
        setStages((current) =>
          current.map((stage) => ({
            ...stage,
            count: stageCounts[stage.id] || 0,
          }))
        )
      }
    }
    
    updateCounts()
  }, [accelerators, effectiveUserId])

  if (loading) {
    return (
      <div className={styles.dealflowPipelineContainer}>
        <div className={styles.pipelineHeader}></div>
        <div className={styles.pipelineStagesContainer}>
          <div className={styles.pipelineConnectionLine}></div>
          <div className={styles.pipelineStagesRow}>
            {stages.map((stage) => (
              <div key={stage.id} className={`${styles.pipelineStage} ${stage.colorClass}`}>
                <div className={styles.stageCard}>
                  <div className={styles.stageContent}>
                    <div className={styles.stageHeader}>
                      <h3 className={styles.stageName}>{stage.name}</h3>
                      <div className={styles.stageIcon} style={{ color: stage.iconColor }}>
                        <Info size={14} />
                      </div>
                    </div>
                    <p className={styles.stageCount}>...</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.dealflowPipelineContainer}>
      <div className={styles.pipelineHeader}></div>

      <div className={styles.pipelineStagesContainer}>
        <div className={styles.pipelineConnectionLine}></div>

        <div className={styles.pipelineStagesRow}>
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`${styles.pipelineStage} ${stage.colorClass}`}
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <div className={styles.stageCard}>
                <div className={styles.stageContent}>
                  <div className={styles.stageHeader}>
                    <h3 className={styles.stageName}>{stage.name}</h3>
                    <div className={styles.stageIcon} style={{ color: stage.iconColor }}>
                      <Info size={14} />
                    </div>
                  </div>
                  <p className={styles.stageCount}>{stage.count}</p>
                </div>
              </div>
              
              {/* Tooltip for stage description */}
              {hoveredStage === stage.id && (
                <div className={styles.stageTooltip}>
                  <div className={styles.tooltipContent}>
                    {stage.description}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}