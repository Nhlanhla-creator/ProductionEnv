"use client"

import { useState } from "react"
import { CheckCircle, ChevronRight } from "lucide-react"
import styles from "./application-tracker.module.css"

export function ApplicationTracker() {
  const [trackerSteps, setTrackerSteps] = useState([
    { label: "Universal Business\nProfile", description: "", completed: true, showDetails: false },
    { label: "Compliance &\nLegitimacy Check", description: "", completed: true, showDetails: false },
    { label: "Market Visibility\nand Matching", description: "", completed: true, showDetails: false },
    { label: "Funding &\nFundability Check", description: "", active: true, showDetails: false },
    { label: "Life-Cycle Adjusted\nScoring", description: "", completed: false, showDetails: false },
    { label: "Growth\nRecommendations", description: "", completed: false, showDetails: false },
  ])

  const expectedActions = {
    "Universal Business\nProfile": "Complete your business profile with all required information.",
    "Compliance &\nLegitimacy Check": "Ensure all compliance documents are up to date and submitted.",
    "Market Visibility\nand Matching": "Improve your market visibility and find potential matches.",
    "Funding &\nFundability Check": "Prepare your funding documents and improve fundability score.",
    "Life-Cycle Adjusted\nScoring": "Review your business lifecycle and adjust strategies accordingly.",
    "Growth\nRecommendations": "Implement growth strategies based on recommendations.",
  }

  const toggleStepDetails = (index) => {
    const newSteps = [...trackerSteps]
    newSteps.forEach((step, i) => {
      if (i !== index) step.showDetails = false
    })
    newSteps[index].showDetails = !newSteps[index].showDetails
    setTrackerSteps(newSteps)
  }

  return (
    <div className={styles.trackerCard}>
      <div className={styles.trackerHeader}>
        <h3 className={styles.cardTitle}>Application Tracker</h3>
      </div>
      <div className={styles.trackerContent}>
        <div className={styles.trackerSteps}>
          {trackerSteps.map((step, index) => (
            <div
              key={index}
              className={`${styles.trackerStep} ${
                step.completed ? styles.completed : step.active ? styles.active : ""
              }`}
              onClick={() => toggleStepDetails(index)}
            >
              <div className={styles.stepMarker}>
                {step.completed ? (
                  <CheckCircle size={16} color="var(--primary-brown)" />
                ) : step.active ? (
                  <div className={styles.activeDot}></div>
                ) : (
                  <div className={styles.inactiveDot}></div>
                )}
              </div>
              <div className={styles.stepInfo}>
                <span className={styles.stepLabel}>
                  {step.label.split("\n").map((line, i) => (
                    <span key={i} className={styles.stepLabelLine}>
                      {line}
                      {i === 0 && <br />}
                    </span>
                  ))}
                </span>
                {step.description && (
                  <span className={styles.stepDescription}>{step.description}</span>
                )}
              </div>
              {index < trackerSteps.length - 1 && (
                <ChevronRight size={16} className={styles.stepArrow} color="var(--light-brown)" />
              )}
              <div className={styles.tooltip}>{expectedActions[step.label]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
