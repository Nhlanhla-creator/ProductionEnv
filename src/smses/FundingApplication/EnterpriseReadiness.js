"use client"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
import { barrierOptions } from "./applicationOptions"
import "./FundingApplication.css"

import React, { useState } from 'react';
import { useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'
import { doc, getDoc } from "firebase/firestore"
import PitchDeckGPT from './PitchdeckAi';
import GPT from "./AiBusinessPlan"
import FinancialsGPT from "./FinancialsAI"
import CreditGPT from './aiCreditReport';
import { Eye } from "lucide-react"

// Component for Enterprise Readiness
const EnterpriseReadiness = ({ data = {}, updateData, apiKey }) => {
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [existingUniversalDocs, setExistingUniversalDocs] = useState({
    businessPlan: null,
    pitchDeck: null,
    financialStatements: [],
    loading: true
  });

  // Fetch existing documents from universal profile
  useEffect(() => {
    const fetchExistingDocs = async () => {
      const user = auth.currentUser;
      if (!user) {
        setExistingUniversalDocs(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const profileRef = doc(db, "universalProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const documents = profileSnap.data().documents || {};

          setExistingUniversalDocs({
            businessPlan: documents.businessPlan || null,
            pitchDeck: documents.pitchDeck || null,
            financialStatements: documents.financialStatements_multiple?.filter(doc => doc.url) || [],
            loading: false
          });
        } else {
          setExistingUniversalDocs(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Error fetching existing docs:", error);
        setExistingUniversalDocs(prev => ({ ...prev, loading: false }));
      }
    };

    fetchExistingDocs();
  }, []);

  const handleAiResponse = (response, score, label) => {
    const evaluationData = {
      response,
      score,
      label,
      timestamp: new Date().toISOString()
    };

    setAiEvaluation(evaluationData);
    updateData({
      ...data,
      aiEvaluation: evaluationData
    });
  };

  const updateFormData = (section, newData) => {
    updateData({ ...data, [section]: { ...(data[section] || {}), ...newData } })
  }

  return renderEnterpriseReadiness(
    data.enterpriseReadiness || {},
    (section, newData) => updateFormData(section, newData),
    apiKey,
    handleAiResponse,
    existingUniversalDocs
  )
}

// Rendering function for Enterprise Readiness
export const renderEnterpriseReadiness = (data, updateFormData, apiKey, handleAiResponse, existingUniversalDocs) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    updateFormData("enterpriseReadiness", { [name]: type === "checkbox" ? checked : value })
  }

  const handleMultiSelect = (e) => {
    const { value, checked } = e.target
    let barriers = [...(data.barriers || [])]

    if (checked) {
      barriers.push(value)
    } else {
      barriers = barriers.filter((item) => item !== value)
    }

    updateFormData("enterpriseReadiness", { barriers })
  }

  const handleFileChange = (name, files) => {
    updateFormData("enterpriseReadiness", { [name]: files })
  }

  const isOtherBarrierSelected = (data.barriers || []).includes("other")

  // Helper function to get document to display (priority: application > universal)
  const getDocumentToDisplay = (appFiles, universalUrl, docLabel) => {
    // Priority 1: Check if there's already a document saved in this application
    const appDocument = appFiles?.find(f => typeof f === 'string' || f?.url)
    if (appDocument) {
      const url = typeof appDocument === 'string' ? appDocument : appDocument.url
      return { type: 'application', url, label: `This application's ${docLabel}` }
    }

    // Priority 2: Check universal profile
    if (universalUrl) {
      return { type: 'universal', url: universalUrl, label: `${docLabel} from your profile` }
    }

    return null
  }

  // Helper function to get financial document to display
  const getFinancialDocumentToDisplay = (appFiles, universalUrls) => {
    // Priority 1: Application documents
    const appDocument = appFiles?.find(f => typeof f === 'string' || f?.url)
    if (appDocument) {
      const url = typeof appDocument === 'string' ? appDocument : appDocument.url
      return { type: 'application', url, label: "This application's Financial Statement" }
    }

    // Priority 2: Universal profile documents
    if (universalUrls && universalUrls.length > 0) {
      return { type: 'universal', urls: universalUrls, label: "Financial Statements from your profile" }
    }

    return null
  }

  const renderViewLink = (url, label, isUniversal = true) => {
    if (!url) return null;
    return (
      <div style={{
        marginBottom: "12px",
        padding: "8px 12px",
        backgroundColor: isUniversal ? "#f0f7ff" : "#e8f5e9",
        borderRadius: "6px",
        border: `1px solid ${isUniversal ? "#4a90e2" : "#4caf50"}`
      }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: isUniversal ? "#4a90e2" : "#2e7d32",
            textDecoration: "underline",
            fontSize: "13px",
            fontWeight: "500"
          }}
        >
          <Eye size={14} />
          {label}
        </a>
        <div style={{ fontSize: "11px", color: isUniversal ? "#4a90e2" : "#2e7d32", marginTop: "4px" }}>
          {isUniversal ? "✓ This document is from your profile hub. Upload new to replace it." : "✓ This document is attached to this application."}
        </div>
      </div>
    );
  };

  return (
    <div className="enterprise-readiness-container">
      <h2>Enterprise Readiness</h2>

      {/* First Row: Business Plan + Audited Financials */}
      <div className="form-row">
        <div className="form-column">
          <FormField label="Do you have a business plan?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasBusinessPlan"
                  value="yes"
                  checked={data.hasBusinessPlan === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasBusinessPlan"
                  value="no"
                  checked={data.hasBusinessPlan === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasBusinessPlan === "yes" && (
              <div className="conditional-field">
                {/* Show document based on priority */}
                {(() => {
                  const doc = getDocumentToDisplay(data.businessPlanFile, existingUniversalDocs?.businessPlan, "Business Plan")
                  if (doc) {
                    const isUniversal = doc.type === 'universal'
                    return renderViewLink(doc.url, doc.label, isUniversal)
                  }
                  return null
                })()}

                <div style={{ marginTop: "8px", marginBottom: "8px", fontSize: "12px", color: "#666", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
                  <strong>Need to update?</strong> Upload a new file below:
                </div>

                <FileUpload
                  label="Upload Business Plan"
                  accept=".pdf,.doc,.docx"
                  onChange={(files) => handleFileChange("businessPlanFile", files)}
                  value={data.businessPlanFile?.filter(f => f instanceof File) || []}
                />
                {Array.isArray(data.businessPlanFile) &&
                  data.businessPlanFile.length > 0 &&
                  !data.businessPlanFile.some(file =>
                    typeof file === "string" ||
                    (file?.url && file.url.startsWith("https://firebasestorage.googleapis.com"))
                  ) && (
                    <GPT
                      files={data.businessPlanFile}
                      onEvaluationComplete={handleAiResponse}
                      apiKey={apiKey}
                    />
                  )}
              </div>
            )}
          </FormField>
        </div>

        
      </div>

      {/* Second Row: Pitch Deck + MVP */}
      <div className="form-row">
        <div className="form-column">
          <FormField label="Do you have a pitch deck?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasPitchDeck"
                  value="yes"
                  checked={data.hasPitchDeck === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasPitchDeck"
                  value="no"
                  checked={data.hasPitchDeck === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasPitchDeck === "yes" && (
              <div className="conditional-field">
                {/* Show document based on priority */}
                {(() => {
                  const doc = getDocumentToDisplay(data.pitchDeckFile, existingUniversalDocs?.pitchDeck, "Pitch Deck")
                  if (doc) {
                    const isUniversal = doc.type === 'universal'
                    return renderViewLink(doc.url, doc.label, isUniversal)
                  }
                  return null
                })()}

                <div style={{ marginTop: "8px", marginBottom: "8px", fontSize: "12px", color: "#666", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
                  <strong>Need to update?</strong> Upload a new file below:
                </div>

                <FileUpload
                  label="Upload Pitch Deck"
                  accept=".pdf,.ppt,.pptx"
                  onChange={(files) => handleFileChange("pitchDeckFile", files)}
                  value={data.pitchDeckFile?.filter(f => f instanceof File) || []}
                />
                {Array.isArray(data.pitchDeckFile) &&
                  data.pitchDeckFile.length > 0 &&
                  !data.pitchDeckFile.some(file =>
                    typeof file === "string" ||
                    (file?.url && file.url.startsWith("https://firebasestorage.googleapis.com"))
                  ) && (
                    <PitchDeckGPT
                      files={data.pitchDeckFile}
                      onEvaluationComplete={handleAiResponse}
                      apiKey={apiKey}
                    />
                  )}
              </div>
            )}
          </FormField>
        </div>

        <div className="form-column">
          <FormField label="Do you have an MVP/prototype?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasMvp"
                  value="yes"
                  checked={data.hasMvp === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasMvp"
                  value="no"
                  checked={data.hasMvp === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasMvp === "yes" && (
              <div className="conditional-field">
                <input
                  type="text"
                  name="mvpDetails"
                  value={data.mvpDetails || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Please describe your MVP/prototype"
                />
              </div>
            )}
          </FormField>
        </div>
      </div>

      {/* Credit Report Section */}
      <div className="section-divider">
        <h3>Credit Information</h3>
      </div>

      <div className="form-row">
        <div className="form-column">
          <FormField label="Do you have a recent credit report?" required>
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasCreditReport"
                  value="yes"
                  checked={data.hasCreditReport === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasCreditReport"
                  value="no"
                  checked={data.hasCreditReport === "no"}
                  onChange={(e) => {
                    handleChange(e);
                    if (e.target.value === 'no') {
                      handleFileChange("creditReportDocs", []);
                    }
                  }}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
          </FormField>

          {data.hasCreditReport === "yes" && (
            <div className="conditional-field">
              <FileUpload
                label="Upload Credit Report"
                accept=".pdf,.xlsx,.xls,.doc,.docx"
                required
                onChange={(files) => handleFileChange("creditReportDocs", files)}
                value={data.creditReportDocs || []}
              />


              {Array.isArray(data.creditReportDocs) &&
                data.creditReportDocs.length > 0 && (
                  <CreditGPT
                    files={data.creditReportDocs.filter(file =>
                      file instanceof File &&
                      !(file?.url && file.url.startsWith("https://firebasestorage.googleapis.com"))
                    )}
                    onEvaluationComplete={handleAiResponse}
                    apiKey={apiKey}
                  />
                )}
            </div>
          )}
        </div>

        <div className="form-column">
          <FormField label="Credit Score (if known)">
            <input
              type="number"
              name="creditScore"
              value={data.creditScore || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your credit score"
              min="300"
              max="850"
            />
          </FormField>

          <FormField label="Any outstanding credit issues?">
            <textarea
              name="creditIssues"
              value={data.creditIssues || ""}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Please describe any outstanding credit issues, defaults, or concerns"
              rows={3}
            ></textarea>
          </FormField>
        </div>
      </div>

      {/* Third Row: Traction + Guarantees */}
      <div className="form-row">
        <div className="form-column">
          <FormField label="Do you have traction to date: Revenue to date, pilots/partnerships secured?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasTraction"
                  value="yes"
                  checked={data.hasTraction === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasTraction"
                  value="no"
                  checked={data.hasTraction === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasTraction === "yes" && (
              <div className="conditional-field">
                <textarea
                  name="tractionDetails"
                  value={data.tractionDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please provide details about your traction (revenue, partnerships, etc.)"
                  rows={3}
                ></textarea>
              </div>
            )}
          </FormField>
        </div>

        <div className="form-column">
          <FormField label="Do you have any guarantees? (e.g. a contract)" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasGuarantees"
                  value="yes"
                  checked={data.hasGuarantees === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasGuarantees"
                  value="no"
                  checked={data.hasGuarantees === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasGuarantees === "yes" && (
              <div className="conditional-field">
                {/* Show document based on priority */}
                {(() => {
                  // Priority 1: Check application document
                  const appDocument = data.guaranteeFile?.find(f => typeof f === 'string' || f?.url)
                  if (appDocument) {
                    const url = typeof appDocument === 'string' ? appDocument : appDocument.url
                    const label = "This application's Guarantee/Contract"
                    return (
                      <div style={{
                        marginBottom: "12px",
                        padding: "8px 12px",
                        backgroundColor: "#e8f5e9",
                        borderRadius: "6px",
                        border: "1px solid #4caf50"
                      }}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            color: "#2e7d32",
                            textDecoration: "underline",
                            fontSize: "13px",
                            fontWeight: "500"
                          }}
                        >
                          <Eye size={14} />
                          {label}
                        </a>
                        <div style={{ fontSize: "11px", color: "#2e7d32", marginTop: "4px" }}>
                          ✓ This document is attached to this application. Upload new to replace it.
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                <div style={{ marginTop: "8px", marginBottom: "8px", fontSize: "12px", color: "#666", borderTop: "1px dashed #ccc", paddingTop: "8px" }}>
                  <strong>Need to add or update?</strong> Upload a file below:
                </div>

                <FileUpload
                  label="Upload Guarantee/Contract"
                  accept=".pdf,.doc,.docx"
                  onChange={(files) => handleFileChange("guaranteeFile", files)}
                  value={data.guaranteeFile?.filter(f => f instanceof File) || []}
                />
              </div>
            )}
          </FormField>
        </div>
      </div>

      {/* Fourth Row: Mentor + Advisors */}
      <div className="form-row">
        <div className="form-column">
          <FormField label="Do you have a mentor?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasMentor"
                  value="yes"
                  checked={data.hasMentor === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasMentor"
                  value="no"
                  checked={data.hasMentor === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasMentor === "yes" && (
              <div className="conditional-field">
                <input
                  type="text"
                  name="mentorDetails"
                  value={data.mentorDetails || ""}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Please provide mentor's name and area of expertise"
                />
              </div>
            )}
          </FormField>
        </div>

        <div className="form-column">
          <FormField label="Do you have advisors/board?" >
            <div className="radio-group">
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasAdvisors"
                  value="yes"
                  checked={data.hasAdvisors === "yes"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>Yes</span>
              </label>
              <label className="form-radio-label">
                <input
                  type="radio"
                  name="hasAdvisors"
                  value="no"
                  checked={data.hasAdvisors === "no"}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span>No</span>
              </label>
            </div>
            {data.hasAdvisors === "yes" && (
              <div className="conditional-field">
                <textarea
                  name="advisorsDetails"
                  value={data.advisorsDetails || ""}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Please list your advisors/board members and their expertise"
                  rows={3}
                ></textarea>

                <FormField label="Do they meet regularly?" >
                  <div className="radio-group">
                    <label className="form-radio-label">
                      <input
                        type="radio"
                        name="advisorsMeetRegularly"
                        value="yes"
                        checked={data.advisorsMeetRegularly === "yes"}
                        onChange={handleChange}
                        className="form-radio"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="form-radio-label">
                      <input
                        type="radio"
                        name="advisorsMeetRegularly"
                        value="no"
                        checked={data.advisorsMeetRegularly === "no"}
                        onChange={handleChange}
                        className="form-radio"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {data.advisorsMeetRegularly === "yes" && (
                    <div className="conditional-field">
                      <input
                        type="text"
                        name="advisorsMeetingFrequency"
                        value={data.advisorsMeetingFrequency || ""}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="How often do they meet? (e.g., monthly, quarterly)"
                      />
                    </div>
                  )}
                </FormField>
              </div>
            )}
          </FormField>
        </div>
      </div>

      {/* Full Width Sections */}
      <div className="full-width-section">
        <FormField label="Main Barriers to Growth (select all that apply)">
          <div className="checkbox-grid">
            {barrierOptions.map((option) => (
              <label key={option.value} className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="barriers"
                  value={option.value}
                  checked={(data.barriers || []).includes(option.value)}
                  onChange={handleMultiSelect}
                  className="form-checkbox"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          {isOtherBarrierSelected && (
            <div className="conditional-field">
              <input
                type="text"
                name="otherBarrierDetails"
                value={data.otherBarrierDetails || ""}
                onChange={handleChange}
                className="form-input"
                placeholder="Please specify other barrier"
              />
            </div>
          )}
        </FormField>
      </div>

      <div className="full-width-section">
        <FormField label="Have you received support previously?">
          <div className="radio-group">
            <label className="form-radio-label">
              <input
                type="radio"
                name="previousSupport"
                value="yes"
                checked={data.previousSupport === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="form-radio-label">
              <input
                type="radio"
                name="previousSupport"
                value="no"
                checked={data.previousSupport === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>

          {data.previousSupport === "yes" && (
            <div className="form-row">
              <div className="form-column">
                <FormField label="What support?">
                  <textarea
                    name="previousSupportDetails"
                    value={data.previousSupportDetails || ""}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Describe the support received"
                    rows={3}
                  ></textarea>
                </FormField>
              </div>

              <div className="form-column">
                <FormField label="From who?">
                  <textarea
                    name="previousSupportSource"
                    value={data.previousSupportSource || ""}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Source/organization that provided the support"
                    rows={3}
                  ></textarea>
                </FormField>
              </div>

              <div className="form-column">
                <FormField label="How much?">
                  <input
                    type="text"
                    name="previousSupportAmount"
                    value={data.previousSupportAmount || ""}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Amount of previous support (e.g., R 50,000)"
                  />
                </FormField>
              </div>
            </div>
          )}
        </FormField>
      </div>

      <div className="full-width-section">
        <FormField label="Do you currently have paying customers?" >
          <div className="radio-group">
            <label className="form-radio-label">
              <input
                type="radio"
                name="hasPayingCustomers"
                value="yes"
                checked={data.hasPayingCustomers === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="form-radio-label">
              <input
                type="radio"
                name="hasPayingCustomers"
                value="no"
                checked={data.hasPayingCustomers === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>
          {data.hasPayingCustomers === "yes" && (
            <div className="conditional-field">
              <textarea
                name="payingCustomersDetails"
                value={data.payingCustomersDetails || ""}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Please provide details about your customers and revenue"
                rows={3}
              ></textarea>
            </div>
          )}
        </FormField>
      </div>
    </div>
  )
}

export default EnterpriseReadiness