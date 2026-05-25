"use client"

import { useState, useEffect } from "react"
import { CheckCircle, ChevronRight, AlertCircle } from 'lucide-react'
import "./application-tracker.css"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebaseConfig"

export function ApplicationTracker({ styles, userId }) {
  const [trackerSteps, setTrackerSteps] = useState([
    { label: "Funding &\nSupport", description: "", applied: false, showDetails: false, applicationType: "funding" },
    { label: "Products &\nServices", description: "", applied: false, showDetails: false, applicationType: "products" },
    { label: "Advisory/Board\nMember", description: "", applied: false, showDetails: false, applicationType: "advisory" },
    { label: "Intern", description: "", applied: false, showDetails: false, applicationType: "intern" },
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
        let fundingApplied = false;
        let productsApplied = false;
        let advisoryApplied = false;
        let internApplied = false;

        /** -------------------
         * FUNDING & SUPPORT
         * ------------------- */
        try {
          const universalRef = doc(db, "universalProfiles", userId);
          const universalSnap = await getDoc(universalRef);

          if (universalSnap.exists()) {
            const data = universalSnap.data();
            const completedSections = data.completedSections || {};

            const requiredFundingSections = [
              "applicationOverview",
              "useOfFunds",
              "enterpriseReadiness",
              "guarantees",
              "growthPotential",
              "socialImpact",
              "documentUpload",
              "declarationCommitment",
            ];

            const sectionsComplete = requiredFundingSections.every(
              (section) => completedSections[section] === true
            );

            fundingApplied = sectionsComplete || data.applicationSubmitted === true;
          }
        } catch (err) {
          console.error("Error fetching funding application:", err);
        }

        /** -------------------
         * PRODUCTS & SERVICES
         * ------------------- */
        try {
          const productsRef = doc(db, "productApplications", userId);
          const productsSnap = await getDoc(productsRef);

          if (productsSnap.exists()) {
            const data = productsSnap.data();
            const completedSections = data.completedSections || {};
            const status = data.status || "draft";

            const requiredProductSections = [
              "matchingPreferences",
              "requestOverview",
              "productsServices"
            ];

            const sectionsComplete = requiredProductSections.every(
              (section) => completedSections[section] === true
            );

            productsApplied = status === "submitted" || sectionsComplete;
          }
        } catch (err) {
          console.error("Error fetching products application:", err);
        }

        /** -------------------
         * ADVISORY/BOARD MEMBER - UPDATED FOR NEW STRUCTURE
         * ------------------- */
        try {
          const advisoryRef = doc(db, "advisoryApplications", userId);
          const advisorySnap = await getDoc(advisoryRef);

          if (advisorySnap.exists()) {
            const data = advisorySnap.data();
            
            // Option 1: Check by status field (most reliable)
            if (data.status === "submitted") {
              advisoryApplied = true;
            } 
            // Option 2: Check by completed sections (new structure has 2 sections)
            else if (data.completedSections) {
              const completedSections = data.completedSections || {};
              
              // Only check the sections that actually exist in your new structure
              const requiredAdvisorySections = [
                "advisoryNeedsAssessment",
                "documentUploads"
              ];
              
              const sectionsComplete = requiredAdvisorySections.every(
                (section) => completedSections[section] === true
              );
              
              advisoryApplied = sectionsComplete;
            }
            // Option 3: Check if application was submitted via any method
            else if (data.submittedAt) {
              advisoryApplied = true;
            }
            
            console.log("📋 Advisory - status:", data.status);
            console.log("📋 Advisory - completedSections:", data.completedSections);
            console.log("📋 Advisory - submittedAt:", data.submittedAt);
            console.log("✅ Advisory - Applied:", advisoryApplied);
          } else {
            // Document doesn't exist - not applied
            console.log("📋 Advisory - No application found");
            advisoryApplied = false;
          }
        } catch (err) {
          console.error("Error fetching advisory application:", err);
        }

        /** -------------------
         * INTERN - UPDATED FOR CORRECT STRUCTURE
         * ------------------- */
        try {
          const internRef = doc(db, "internApplications", userId);
          const internSnap = await getDoc(internRef);

          if (internSnap.exists()) {
            const data = internSnap.data();
            
            // Option 1: Check by status field (most reliable)
            if (data.status === "submitted") {
              internApplied = true;
            }
            // Option 2: Check by completed sections (4 sections: instructions, jobOverview, internshipRequest, matchingAgreement)
            else if (data.completedSections) {
              const completedSections = data.completedSections || {};
              
              // These match the sections from InternApplication component
              const requiredInternSections = [
                "instructions",
                "jobOverview",
                "internshipRequest",
                "matchingAgreement"
              ];
              
              const sectionsComplete = requiredInternSections.every(
                (section) => completedSections[section] === true
              );
              
              internApplied = sectionsComplete;
            }
            // Option 3: Check if application was submitted via any method
            else if (data.submittedAt) {
              internApplied = true;
            }
            
            console.log("📋 Intern - status:", data.status);
            console.log("📋 Intern - completedSections:", data.completedSections);
            console.log("📋 Intern - submittedAt:", data.submittedAt);
            console.log("✅ Intern - Applied:", internApplied);
          } else {
            // Document doesn't exist - not applied
            console.log("📋 Intern - No application found");
            internApplied = false;
          }
        } catch (err) {
          console.error("Error fetching intern application:", err);
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
        console.log("🎯 Final tracker steps:", updatedSteps);

      } catch (err) {
        console.error("❌ Application status fetch failed:", err);
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
              style={{
                opacity: step.applied ? 1 : 0.7,
              }}
            >
              {/* Status Indicator */}
              <div className="step-marker mr-3 relative">
                <div
                  className="application-dot h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                  style={{
                    backgroundColor: step.applied ? "#4CAF50" : "#F44336",
                    boxShadow: step.applied
                      ? "0 2px 4px rgba(76, 175, 80, 0.3)"
                      : "0 2px 4px rgba(244, 67, 54, 0.3)",
                  }}
                >
                  {step.applied && (
                    <CheckCircle 
                      size={12} 
                      style={{ 
                        color: "white", 
                        position: "absolute",
                        strokeWidth: 3
                      }} 
                    />
                  )}
                  {!step.applied && (
                    <AlertCircle 
                      size={10} 
                      style={{ 
                        color: "white", 
                        position: "absolute",
                        strokeWidth: 3
                      }} 
                    />
                  )}
                </div>
              </div>

              {/* Step Info */}
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
                    {step.applied ? "✓ Applied" : "○ Not Applied"}
                  </span>
                </div>
              </div>

              {/* Arrow Separator */}
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
      </div>
    </div>
  )
}