"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { getAuth } from "firebase/auth"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"
import { db } from "../../firebaseConfig"
import { Brain, AlertCircle, TrendingUp, Loader2 } from "lucide-react"

/**
 * Helper function to check advisor profile eligibility for AI analysis
 */
function getAdvisorAiEligibility(advisor, currentUserId = null) {
  const completedSections = advisor?.completedSections || {}
  const hasName = !!(
    advisor?.profile?.personalInfo?.fullName ||
    advisor?.profile?.fullName
  )
  const hasSpecializations = 
    Array.isArray(advisor?.profile?.specializations) && advisor.profile.specializations.length > 0

  const reasons = []

  if (currentUserId && advisor?.id === currentUserId) reasons.push("Current user's own profile")
  if (completedSections.profile !== true) reasons.push("Profile incomplete")
  if (!hasName) reasons.push("Advisor name missing")
  if (!hasSpecializations) reasons.push("No specializations listed")

  return {
    eligible: reasons.length === 0,
    reasons,
    label: reasons.length > 0 ? reasons.join("; ") : "AI eligible",
  }
}

function withAdvisorAiEligibility(advisor, currentUserId = null) {
  return {
    ...advisor,
    aiEligibility: getAdvisorAiEligibility(advisor, currentUserId),
  }
}

function selectAdvisorsForAiAnalysis(advisors, currentUserId = null) {
  return advisors
    .map((advisor) => withAdvisorAiEligibility(advisor, currentUserId))
    .filter((advisor) => advisor.aiEligibility.eligible)
    .sort((a, b) => {
      const aExp = a.profile?.yearsExperience || 0
      const bExp = b.profile?.yearsExperience || 0
      return bExp - aExp
    })
    .slice(0, 100)
}

/**
 * Main AI analysis function - mirrors runAiAnalysisForApplication from supplier-table
 */
export async function runAdvisoryAIAnalysisForApplication(application, advisors, { onProgress } = {}) {
  if (!application || !advisors?.length) {
    throw new Error("Application and advisors are required")
  }

  const applicationId = application.id
  if (!applicationId) throw new Error("Application must have an id")

  const advisoryNeeds =
    application.advisoryNeedsAssessment?.specificNeeds ||
    application.advisoryNeedsAssessment?.businessBackground ||
    "General advisory support needed"

  const advisoryTypes = application.advisoryNeedsAssessment?.advisors || []
  const timeCommitment = application.advisoryNeedsAssessment?.timeCommitment || ""
  const compensationType = application.advisoryNeedsAssessment?.compensationType || ""

  const advisorsForAnalysis = advisors.map((a) => ({
    id: a.id,
    profile: a.profile || {},
  }))

  const eligibleAdvisorsForAnalysis = selectAdvisorsForAiAnalysis(advisors)
  const selectedAdvisorIds = new Set(eligibleAdvisorsForAnalysis.map((a) => a.id))
  const selectedAdvisorsForAnalysis = advisorsForAnalysis.filter((a) => selectedAdvisorIds.has(a.id))

  if (selectedAdvisorsForAnalysis.length === 0) {
    throw new Error(
      "No AI-eligible advisors found. Advisor profiles need to be completed with name, specializations, and experience."
    )
  }

  if (onProgress) onProgress({ current: 0, total: selectedAdvisorsForAnalysis.length })

  // Call backend API
  const result = await fetch("http://localhost:8000/api/advisors/analyze-matches", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      advisors: selectedAdvisorsForAnalysis,
      advisoryNeeds,
      applicationId,
      advisoryTypes,
      timeCommitment,
      compensationType,
    }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    return res.json()
  })

  const { matches, missingAdvisorIds = [] } = result

  const processedMatches = {}
  matches.forEach((match) => {
    const normalizedScore = Math.round((match.score / 5) * 100)
    processedMatches[match.advisorId] = {
      score: normalizedScore,
      reasoning: match.reasoning || "No reasoning provided",
      capabilities: match.matchedCapabilities || [],
      breakdown: match.breakdown || null,
      analyzedAt: new Date().toISOString(),
    }
  })

  missingAdvisorIds.forEach((id) => {
    if (!processedMatches[id]) {
      processedMatches[id] = {
        score: 0,
        reasoning: "AI analysis did not return a result for this advisor.",
        capabilities: [],
        breakdown: null,
        analyzedAt: new Date().toISOString(),
      }
    }
  })

  if (onProgress) onProgress({ current: Object.keys(processedMatches).length, total: selectedAdvisorsForAnalysis.length })

  // Persist to Firestore
  const matchDocRef = doc(db, "aiAdvisoryMatches", applicationId)
  await setDoc(matchDocRef, {
    advisors: processedMatches,
    advisoryNeeds,
    analyzedAt: serverTimestamp(),
    advisorsAnalyzed: Object.keys(processedMatches).length,
    applicationId,
  })

  return processedMatches
}

/**
 * Export eligibility checker for use in components
 */
export function selectAdvisorsForAnalysis(advisors, currentUserId = null) {
  return selectAdvisorsForAiAnalysis(advisors, currentUserId)
}

export function getAdvisorEligibility(advisor, currentUserId = null) {
  return getAdvisorAiEligibility(advisor, currentUserId)
}
