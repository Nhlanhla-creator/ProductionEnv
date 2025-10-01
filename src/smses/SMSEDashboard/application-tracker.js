"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight } from 'lucide-react'
import "./application-tracker.css"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig" // Adjust the path if needed

export function ApplicationTracker({ styles, userId }) {
  const [trackerSteps, setTrackerSteps] = useState([
    { label: "Funding &\nSupport", description: "", applied: false, showDetails: false },
    { label: "Products &\nServices", description: "", applied: false, showDetails: false },
    { label: "Advisory/Board\nMember", description: "", applied: false, showDetails: false },
    { label: "Intern", description: "", applied: false, showDetails: false },
  ])

  const expectedActions = {
    "Funding &\nSupport": "Apply for funding opportunities and business support programs.",
    "Products &\nServices": "Register your products and services for marketplace visibility.",
    "Advisory/Board\nMember": "Apply for advisory positions or board member opportunities.",
    "Intern": "Apply for internship programs and opportunities.",
  }

  const toggleStepDetails = (index) => {
    const newSteps = [...trackerSteps]
    newSteps.forEach((step, i) => {
      if (i !== index) step.showDetails = false
    })
    newSteps[index].showDetails = !newSteps[index].showDetails
    setTrackerSteps(newSteps)
  }

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (!userId) return;

      try {
        /** -------------------
         * FUNDING & SUPPORT
         * ------------------- */
        const universalRef = doc(db, "universalProfiles", userId);
        const universalSnap = await getDoc(universalRef);

        let fundingApplied = false;
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
            "useOfFunds"
          ];

          fundingApplied = requiredFundingSections.every(
            (section) => completedSections[section] === true
          );
        }

        /** -------------------
         * ADVISORY/BOARD MEMBER
         * ------------------- */
        const advisoryRef = doc(db, "advisoryApplications", userId);
        const advisorySnap = await getDoc(advisoryRef);

        let advisoryApplied = false;
        if (advisorySnap.exists()) {
          const data = advisorySnap.data();
          const completedSections = data.completedSections || {};

          const requiredAdvisorySections = [
            "advisoryNeedsAssessment",
            "documentUploads",
            "smeProfileSnapshot",
            "urgencyTimeline"
          ];

          advisoryApplied = requiredAdvisorySections.every(
            (section) => completedSections[section] === true
          );
        }

        /** -------------------
         * INTERN
         * ------------------- */
        const internRef = doc(db, "internApplications", userId);
        const internSnap = await getDoc(internRef);

        let internApplied = false;
        if (internSnap.exists()) {
          const data = internSnap.data();
          const completedSections = data.completedSections || {};

          const requiredInternSections = [
            "instructions",
            "internshipRequest",
            "jobOverview",
            "matchingAgreement"
          ];

          internApplied = requiredInternSections.every(
            (section) => completedSections[section] === true
          );
        }

        /** -------------------
         * PRODUCTS & SERVICES
         * ------------------- */
        const productsRef = doc(db, "productApplications", userId);
        const productsSnap = await getDoc(productsRef);

        let productsApplied = false;
        if (productsSnap.exists()) {
          const data = productsSnap.data();
          const completedSections = data.completedSections || {};

          const requiredProductSections = [
            "contactSubmission",
            "matchingPreferences",
            "productsServices",
            "requestOverview"
          ];

          productsApplied = requiredProductSections.every(
            (section) => completedSections[section] === true
          );
        }

        /** -------------------
         * UPDATE TRACKER STEPS
         * ------------------- */
        const updatedSteps = trackerSteps.map((step) => {
          if (step.label.includes("Funding")) {
            return { ...step, applied: fundingApplied };
          }
          if (step.label.includes("Products")) {
            return { ...step, applied: productsApplied };
          }
          if (step.label.includes("Advisory")) {
            return { ...step, applied: advisoryApplied };
          }
          if (step.label.includes("Intern")) {
            return { ...step, applied: internApplied };
          }
          return step;
        });

        setTrackerSteps(updatedSteps);
      } catch (err) {
        console.error("Application status fetch failed:", err);
      }
    };

    fetchApplicationStatus();
  }, [userId]);

  return (
    <div className="tracker-card mb-6 rounded-lg border border-[#8D6E63] bg-white p-4 shadow-sm">
      <div className="tracker-header mb-4">
        <h3 className="card-title text-lg font-medium text-[#5D4037]">Application Tracker</h3>
        <p className="text-sm text-[#6D4C41] mt-1">Track your application status across different opportunities</p>
      </div>

      <div className="tracker-content">
        <div className="tracker-steps flex flex-wrap items-center justify-between gap-4 md:flex-nowrap">
          {trackerSteps.map((step, index) => (
            <div
              key={index}
              className={`tracker-step flex items-center cursor-pointer transition-all duration-200 hover:bg-[#F5F2F0] p-2 rounded-lg ${step.applied ? "applied" : "not-applied"
                }`}
              onClick={() => toggleStepDetails(index)}
            >
              <div className="step-marker mr-3">
                <div
                  className="application-dot h-4 w-4 rounded-full border-2 border-white shadow-sm"
                  style={{
                    backgroundColor: step.applied ? "#4CAF50" : "#F44336",
                    boxShadow: step.applied
                      ? "0 2px 4px rgba(76, 175, 80, 0.3)"
                      : "0 2px 4px rgba(244, 67, 54, 0.3)"
                  }}
                ></div>
              </div>

              <div className="step-info flex-1">
                <span className="step-label text-sm font-medium text-[#5D4037] block">
                  {step.label.split("\n").map((line, i) => (
                    <span key={i} className="step-label-line">
                      {line}
                      {i === 0 && step.label.includes("\n") && <br />}
                    </span>
                  ))}
                </span>

                <div className="status-indicator mt-1">
                  <span
                    className={`text-xs font-medium ${step.applied ? "text-[#4CAF50]" : "text-[#F44336]"
                      }`}
                  >
                    {step.applied ? "Applied" : "Not Applied"}
                  </span>
                </div>
              </div>

              {index < trackerSteps.length - 1 && (
                <ChevronRight
                  size={16}
                  className="step-arrow mx-2 text-[#8D6E63]"
                />
              )}

              {/* Tooltip */}
              <div className="tooltip absolute z-10 invisible opacity-0 transition-all duration-200 bg-[#5D4037] text-white text-xs rounded-lg p-2 -mt-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                {expectedActions[step.label]}
                <div className="tooltip-arrow absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#5D4037]"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}

      </div>
    </div>
  )
}