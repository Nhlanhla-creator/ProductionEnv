"use client"
import FormField from "./FormField"
import FileUpload from "./FileUpload"
import { barrierOptions } from "./applicationOptions"
import "./FundingApplication.css"

import React, { useState } from 'react';
import mammoth from 'mammoth';
import { useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'
import { doc, setDoc, getDoc } from "firebase/firestore"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import PitchDeckGPT from './PitchdeckAi';
// ChatGPT API function - replace YOUR_API_KEY with your actual OpenAI API key
import GPT from "./AiBusinessPlan"
import FinancialsGPT from "./FinancialsAI"
import CreditGPT from './aiCreditReport';

// Component for Enterprise Readiness
const EnterpriseReadiness = ({ data = {}, updateData, apiKey}) => {
  const [filesToEvaluate, setFilesToEvaluate] = useState([]);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState(null);

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
    apiKey, // Pass apiKey as third parameter
    handleAiResponse // Pass the function as fourth parameter
  )
}

// Rendering function for Enterprise Readiness
export const renderEnterpriseReadiness = (data, updateFormData, apiKey, handleAiResponse) => {
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

  // Check if "other" is selected in barriers
  const isOtherBarrierSelected = (data.barriers || []).includes("other")

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
                <FileUpload
                  label="Upload Business Plan"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={(files) => handleFileChange("businessPlanFile", files)}
                  value={data.businessPlanFile || []}
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

        <div className="form-column">
         <div className="form-column">
  <FormField label="Do you have financials longer than 3 months?">
    <div className="radio-group">
      <label className="form-radio-label">
        <input
          type="radio"
          name="hasFinancials"
          value="yes"
          checked={data.hasFinancials === "yes"}
          onChange={handleChange}
          className="form-radio"
        />
        <span>Yes</span>
      </label>
      <label className="form-radio-label">
        <input
          type="radio"
          name="hasFinancials"
          value="no"
          checked={data.hasFinancials === "no"}
          onChange={handleChange}
          className="form-radio"
        />
        <span>No</span>
      </label>
    </div>
    {data.hasFinancials === "yes" && (
      <div className="conditional-field">
        <FormField label="Are these financials audited?">
          <div className="radio-group">
            <label className="form-radio-label">
              <input
                type="radio"
                name="hasAuditedFinancials"
                value="yes"
                checked={data.hasAuditedFinancials === "yes"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>Yes</span>
            </label>
            <label className="form-radio-label">
              <input
                type="radio"
                name="hasAuditedFinancials"
                value="no"
                checked={data.hasAuditedFinancials === "no"}
                onChange={handleChange}
                className="form-radio"
              />
              <span>No</span>
            </label>
          </div>
        </FormField>
        <input
          type="text"
          name="financialsPeriod"
          value={data.financialsPeriod || ""}
          onChange={handleChange}
          className="form-input"
          placeholder="Please specify the period of your financials"
        />
        
        <FileUpload
          label="Upload Financials"
          accept=".pdf,.xlsx,.xls,.doc,.docx"
          required
          onChange={(files) => handleFileChange("financialsFile", files)}
          value={data.financialsFile || []}
        />

        {Array.isArray(data.financialsFile) &&
          data.financialsFile.length > 0 &&
          !data.financialsFile.some(file =>
            typeof file === "string" ||
            (file?.url && file.url.startsWith("https://firebasestorage.googleapis.com"))
          ) && (
            <FinancialsGPT
              files={data.financialsFile}
              onEvaluationComplete={handleAiResponse}
              apiKey={apiKey}
            />
          )}
      </div>
    )}
  </FormField>
</div>
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
                <FileUpload
                  label="Upload Pitch Deck"
                  accept=".pdf,.ppt,.pptx"
                  required
                  onChange={(files) => handleFileChange("pitchDeckFile", files)}
                  value={data.pitchDeckFile || []}
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

      {/* Credit Report Section - MOVED FROM FINANCIAL OVERVIEW */}
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
                data.creditReportDocs.length > 0 &&
                !data.creditReportDocs.some(file =>
                  typeof file === "string" ||
                  (file?.url && file.url.startsWith("https://firebasestorage.googleapis.com"))
                ) && (
                  <CreditGPT
                    files={data.creditReportDocs}
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
                <FileUpload
                  label="Upload Guarantee/Contract"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={(files) => handleFileChange("guaranteeFile", files)}
                  value={data.guaranteeFile || []}
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