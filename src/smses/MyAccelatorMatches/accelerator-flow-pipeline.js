"use client"

import { useState, useEffect } from "react"
import { Info } from "lucide-react"
import { auth, db } from "../../firebaseConfig"
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore"
import styles from "./acceleratorPipeline.module.css"

export function AcceleratorFlowPipeline({ accelerators = [], applications = [] }) {
  const [stages, setStages] = useState([
    {
      id: "initial",
      name: "Matching",
      count: 0,
      colorClass: styles.stageInitial,
      iconColor: "#8d6e63",
      description: "Total catalysts matched to your SME"
    },
    {
      id: "application",
      name: "Application",
      count: 0,
      colorClass: styles.stageApplication,
      iconColor: "#795548",
      description: "Applications you have submitted"
    },
    {
      id: "review",
      name: "Evaluation",
      count: 0,
      colorClass: styles.stageReview,
      iconColor: "#6d4c41",
      description: "Applications currently under review"
    },
    {
      id: "approved",
      name: "Due Diligence",
      count: 0,
      colorClass: styles.stageApproved,
      iconColor: "#5d4037",
      description: "Applications progressed to due diligence"
    },
    {
      id: "feedback",
      name: "Decision",
      count: 0,
      colorClass: styles.stageFeedback,
      iconColor: "#4e342e",
      description: "Awaiting final decision"
    },
    {
      id: "termIssued",
      name: "Term Issued",
      count: 0,
      colorClass: styles.stageDeals,
      iconColor: "#3e2723",
      description: "Term sheet received"
    },
    {
      id: "dealClosed",
      name: "Deal Closed",
      count: 0,      
      colorClass: styles.stageDeals,
      iconColor: "#2e1b13",
      description: "Successfully completed deals"
    },
    {
      id: "withdrawn",
      name: "Withdrawn/Declined",
      count: 0,
      colorClass: styles.stageWithdrawn,
      iconColor: "#1e0e09",
      description: "Applications withdrawn or declined"
    }
  ])

  const [effectiveUserId, setEffectiveUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoveredStage, setHoveredStage] = useState(null)

  // Get effective user ID (handle company membership) - SAME LOGIC AS TABLE
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

  // Calculate counts based on current SME's applications - MATCHING TABLE LOGIC
  const calculateStageCounts = async (userId) => {
    if (!userId) return {}

    try {
      // IMPORTANT: Query the SAME collection as the table - smeCatalystApplications
      const q = query(
        collection(db, "smeCatalystApplications"),
        where("smeId", "==", userId)
      )
      
      const querySnapshot = await getDocs(q)
      const userApplications = querySnapshot.docs.map(doc => doc.data())
      
      console.log("📊 Found applications for user:", userId, userApplications.length)
      console.log("📊 Application details:", userApplications.map(app => ({ 
        name: app.acceleratorName, 
        status: app.status,
        pipelineStage: app.pipelineStage 
      })))

      // Count unmatched accelerators (same logic as table's hasApplication)
      const appliedCatalystIds = new Set(
        userApplications.map(app => `${app.catalystId}_${app.programIndex || 0}`)
      )
      
      const unmatchedAccelerators = accelerators.filter(acc => {
        const key = `${acc.originalCatalystId || acc.id}_${acc.programIndex || 0}`
        return !appliedCatalystIds.has(key)
      }).length

      // Count applications by status - USING SAME STATUS VALUES AS TABLE
      const applicationCount = userApplications.length
      
      // Match the status values from the table (pipelineStage or status field)
      const reviewCount = userApplications.filter(app => {
        const stage = (app.pipelineStage || app.status || "").toLowerCase()
        // Matches table's evaluation stage
        return stage === "evaluation" || stage === "under review" || stage === "in review"
      }).length
      
      const dueDiligenceCount = userApplications.filter(app => {
        const stage = (app.pipelineStage || app.status || "").toLowerCase()
        // Matches table's due diligence stage
        return stage === "due diligence"
      }).length
      
      const decisionCount = userApplications.filter(app => {
        const stage = (app.pipelineStage || app.status || "").toLowerCase()
        // Matches table's decision stage
        return stage === "decision"
      }).length
      
      const termIssuedCount = userApplications.filter(app => {
        const stage = (app.pipelineStage || app.status || "").toLowerCase()
        // Matches table's support approved stage
        return stage === "support approved" || stage === "term sheet" || stage === "term issued"
      }).length
      
      const dealClosedCount = userApplications.filter(app => {
        const stage = (app.pipelineStage || app.status || "").toLowerCase()
        // Matches table's successful deals / active support stages
        return stage === "successful deals" || stage === "active support" || stage === "completed"
      }).length
      
      const withdrawnCount = userApplications.filter(app => {
        const stage = (app.pipelineStage || app.status || "").toLowerCase()
        // Matches table's support declined stage
        return stage === "support declined" || stage === "declined" || stage === "withdrawn" || stage === "rejected"
      }).length

      const counts = {
        initial: unmatchedAccelerators,
        application: applicationCount,
        review: reviewCount,
        approved: dueDiligenceCount,
        feedback: decisionCount,
        termIssued: termIssuedCount,
        dealClosed: dealClosedCount,
        withdrawn: withdrawnCount,
      }
      
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
  }, [accelerators, effectiveUserId]) // Remove applications dependency since we query directly

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