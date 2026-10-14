"use client"

import React, { useState } from "react"
import { Users, Award, Briefcase, Plus, Trash2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react"

export default function CMFExperienceNetworks({ data = {}, updateData = () => {} }) {
  const handleChange = (field, value) => {
    updateData({ ...data, [field]: value })
  }

  // Repeatable helpers
  const teamMembers = Array.isArray(data.teamMembers) ? data.teamMembers : []
  const qualifications = Array.isArray(data.qualifications) ? data.qualifications : []
  const relationships = Array.isArray(data.relationships) ? data.relationships : []
  const caseStudies = Array.isArray(data.caseStudies) ? data.caseStudies : []
  const testimonials = Array.isArray(data.testimonials) ? data.testimonials : []

  // Add / Remove helpers
  const addTeamMember = () => {
    handleChange("teamMembers", [...teamMembers, { name: "", role: "", bio: "" }])
  }
  const updateTeamMember = (index, field, val) => {
    const updated = [...teamMembers]
    updated[index] = { ...updated[index], [field]: val }
    handleChange("teamMembers", updated)
  }
  const removeTeamMember = (index) => {
    handleChange("teamMembers", teamMembers.filter((_, i) => i !== index))
  }

  const addQualification = () => {
    handleChange("qualifications", [...qualifications, { title: "", body: "", year: "" }])
  }
  const updateQualification = (index, field, val) => {
    const updated = [...qualifications]
    updated[index] = { ...updated[index], [field]: val }
    handleChange("qualifications", updated)
  }
  const removeQualification = (index) => {
    handleChange("qualifications", qualifications.filter((_, i) => i !== index))
  }

  const addRelationship = () => {
    handleChange("relationships", [
      ...relationships,
      { entityName: "", relationshipType: "Network contact", description: "", verified: false }
    ])
  }
  const updateRelationship = (index, field, val) => {
    const updated = [...relationships]
    updated[index] = { ...updated[index], [field]: val }
    handleChange("relationships", updated)
  }
  const removeRelationship = (index) => {
    handleChange("relationships", relationships.filter((_, i) => i !== index))
  }

  const addCaseStudy = () => {
    handleChange("caseStudies", [
      ...caseStudies,
      { title: "", isConfidential: true, counterparty: "", summary: "", outcome: "" }
    ])
  }
  const updateCaseStudy = (index, field, val) => {
    const updated = [...caseStudies]
    updated[index] = { ...updated[index], [field]: val }
    handleChange("caseStudies", updated)
  }
  const removeCaseStudy = (index) => {
    handleChange("caseStudies", caseStudies.filter((_, i) => i !== index))
  }

  const addTestimonial = () => {
    handleChange("testimonials", [
      ...testimonials,
      { author: "", company: "", quote: "", hasPermissionToPublish: true }
    ])
  }
  const updateTestimonial = (index, field, val) => {
    const updated = [...testimonials]
    updated[index] = { ...updated[index], [field]: val }
    handleChange("testimonials", updated)
  }
  const removeTestimonial = (index) => {
    handleChange("testimonials", testimonials.filter((_, i) => i !== index))
  }

  return (
    <div style={{ width: "100%", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#4a352f", margin: "0 0 0.5rem 0" }}>
          Experience & Networks
        </h2>
        <p style={{ color: "#7d5a50", fontSize: "0.95rem", margin: 0 }}>
          Demonstrate your advisory track record, key personnel expertise, capital and market partnerships, and proven engagement outcomes.
        </p>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e6d7c3", borderRadius: "14px", padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Lead Facilitator Details */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#4a352f", margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={18} color="#8d6e63" /> Lead Facilitator
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Lead Facilitator's Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                value={data.leadFacilitatorName || ""}
                onChange={(e) => handleChange("leadFacilitatorName", e.target.value)}
                placeholder="e.g. John Doe / Maria Ndlovu"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  background: "#faf7f2",
                  color: "#4a352f"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Lead Facilitator's Role / Title <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                type="text"
                value={data.leadFacilitatorRole || ""}
                onChange={(e) => handleChange("leadFacilitatorRole", e.target.value)}
                placeholder="e.g. Managing Partner & Principal Advisor"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  background: "#faf7f2",
                  color: "#4a352f"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
                Years of Relevant Experience <span style={{ fontSize: "11px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={data.yearsExperience || ""}
                onChange={(e) => handleChange("yearsExperience", e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 10"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #d7ccc8",
                  borderRadius: "8px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                  background: "#faf7f2",
                  color: "#4a352f"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#4a352f", marginBottom: "0.4rem" }}>
              Relevant Experience and Expertise (Biography) <span style={{ color: "#e53e3e" }}>*</span>
            </label>
            <textarea
              rows={3}
              value={data.leadExperienceBio || ""}
              onChange={(e) => handleChange("leadExperienceBio", e.target.value)}
              placeholder="Highlight background in corporate finance, transaction advisory, supply chain management, or relevant sector leadership..."
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1px solid #d7ccc8",
                borderRadius: "8px",
                fontSize: "13px",
                boxSizing: "border-box",
                background: "#faf7f2",
                color: "#4a352f",
                lineHeight: "1.5"
              }}
            />
          </div>
        </div>

        {/* Additional Team Members */}
        <div style={{ marginBottom: "2rem", padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
              Additional Team Members <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </h4>
            <button
              type="button"
              onClick={addTeamMember}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                background: "#f3e5dc",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4a352f",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Team Member
            </button>
          </div>

          {teamMembers.length === 0 ? (
            <p style={{ margin: 0, fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
              No additional team members added. Click above to add deal leads, analysts or co-facilitators.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {teamMembers.map((member, idx) => (
                <div key={idx} style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e6d7c3" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={member.name || ""}
                      onChange={(e) => updateTeamMember(idx, "name", e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                    />
                    <input
                      type="text"
                      placeholder="Role / Title"
                      value={member.role || ""}
                      onChange={(e) => updateTeamMember(idx, "role", e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeTeamMember(idx)}
                      style={{ background: "transparent", border: "none", color: "#e53e3e", cursor: "pointer", padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Short biography / expertise..."
                    value={member.bio || ""}
                    onChange={(e) => updateTeamMember(idx, "bio", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Qualifications or Professional Memberships */}
        <div style={{ marginBottom: "2rem", padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
              Qualifications & Professional Memberships <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
            </h4>
            <button
              type="button"
              onClick={addQualification}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                background: "#f3e5dc",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4a352f",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Credential
            </button>
          </div>

          {qualifications.length === 0 ? (
            <p style={{ margin: 0, fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
              No qualifications added (e.g. CA(SA), CFA, SAVCA member, FSP Representative, Institute of Directors).
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {qualifications.map((q, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr auto", gap: "8px", background: "#ffffff", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e6d7c3" }}>
                  <input
                    type="text"
                    placeholder="Qualification / Accreditation Title"
                    value={q.title || ""}
                    onChange={(e) => updateQualification(idx, "title", e.target.value)}
                    style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                  />
                  <input
                    type="text"
                    placeholder="Issuing Body / Institution"
                    value={q.body || ""}
                    onChange={(e) => updateQualification(idx, "body", e.target.value)}
                    style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={q.year || ""}
                    onChange={(e) => updateQualification(idx, "year", e.target.value)}
                    style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeQualification(idx)}
                    style={{ background: "transparent", border: "none", color: "#e53e3e", cursor: "pointer" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funder, Buyer or Programme Relationships */}
        <div style={{ marginBottom: "2rem", padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
                Funder, Buyer or Programme Relationships
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#7d5a50" }}>
                Relationship type is required for each claimed counterparty relationship.
              </p>
            </div>
            <button
              type="button"
              onClick={addRelationship}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                background: "#f3e5dc",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4a352f",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Relationship
            </button>
          </div>

          {relationships.length === 0 ? (
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
              No relationships listed. Add any funder, commercial buyer, or corporate enterprise programme connections.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {relationships.map((rel, idx) => (
                <div key={idx} style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e6d7c3" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Funder / Buyer / Programme Name"
                      value={rel.entityName || ""}
                      onChange={(e) => updateRelationship(idx, "entityName", e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                    />
                    <div>
                      <select
                        value={rel.relationshipType || "Network contact"}
                        onChange={(e) => updateRelationship(idx, "relationshipType", e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px", background: "#ffffff" }}
                      >
                        <option value="Network contact">Network contact</option>
                        <option value="Formal partner">Formal partner</option>
                        <option value="Appointed representative">Appointed representative</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRelationship(idx)}
                      style={{ background: "transparent", border: "none", color: "#e53e3e", cursor: "pointer", padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Brief description of collaborative scope (e.g. Approved deal origination partner)..."
                    value={rel.description || ""}
                    onChange={(e) => updateRelationship(idx, "description", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Case Studies or Successful Engagements */}
        <div style={{ marginBottom: "2rem", padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
                Case Studies or Successful Engagements <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#7d5a50" }}>
                Confidential case studies are allowed without naming the SME or counterparty.
              </p>
            </div>
            <button
              type="button"
              onClick={addCaseStudy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                background: "#f3e5dc",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4a352f",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Case Study
            </button>
          </div>

          {caseStudies.length === 0 ? (
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
              No case studies added. Add transaction summaries, debt structuring outcomes, or supplier contract awards.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {caseStudies.map((cs, idx) => (
                <div key={idx} style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e6d7c3" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Engagement Title (e.g. R15M Debt Facility for Agri-processor)"
                      value={cs.title || ""}
                      onChange={(e) => updateCaseStudy(idx, "title", e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4a352f", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(cs.isConfidential)}
                        onChange={(e) => updateCaseStudy(idx, "isConfidential", e.target.checked)}
                        style={{ accentColor: "#8d6e63" }}
                      />
                      <Lock size={12} color="#8d6e63" /> Keep Counterparty Anonymous
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCaseStudy(idx)}
                      style={{ background: "transparent", border: "none", color: "#e53e3e", cursor: "pointer", padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {!cs.isConfidential && (
                    <div style={{ marginBottom: "8px" }}>
                      <input
                        type="text"
                        placeholder="Named SME or Counterparty (ensure you have written permission)"
                        value={cs.counterparty || ""}
                        onChange={(e) => updateCaseStudy(idx, "counterparty", e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px", boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                  <textarea
                    rows={2}
                    placeholder="Short summary of the engagement, challenge, and concrete outcomes / funding secured..."
                    value={cs.summary || ""}
                    onChange={(e) => updateCaseStudy(idx, "summary", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Testimonials or References */}
        <div style={{ padding: "1.25rem", borderRadius: "10px", background: "#faf7f2", border: "1px solid #e6d7c3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#4a352f", margin: 0 }}>
                Testimonials or References <span style={{ fontSize: "12px", color: "#8d6e63", fontWeight: "normal" }}>(Optional)</span>
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#7d5a50" }}>
                Publish testimonials only where you have explicit permission.
              </p>
            </div>
            <button
              type="button"
              onClick={addTestimonial}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                background: "#f3e5dc",
                border: "1px solid #d7ccc8",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#4a352f",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Testimonial
            </button>
          </div>

          {testimonials.length === 0 ? (
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#8d6e63", fontStyle: "italic" }}>
              No testimonials added.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {testimonials.map((test, idx) => (
                <div key={idx} style={{ background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #e6d7c3" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "10px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Referee Name & Role"
                      value={test.author || ""}
                      onChange={(e) => updateTestimonial(idx, "author", e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                    />
                    <input
                      type="text"
                      placeholder="Organisation / Company"
                      value={test.company || ""}
                      onChange={(e) => updateTestimonial(idx, "company", e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeTestimonial(idx)}
                      style={{ background: "transparent", border: "none", color: "#e53e3e", cursor: "pointer", padding: "4px 8px" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Testimonial quote..."
                    value={test.quote || ""}
                    onChange={(e) => updateTestimonial(idx, "quote", e.target.value)}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #d7ccc8", fontSize: "12px", boxSizing: "border-box", marginBottom: "6px" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#4a352f", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(test.hasPermissionToPublish)}
                      onChange={(e) => updateTestimonial(idx, "hasPermissionToPublish", e.target.checked)}
                      style={{ accentColor: "#8d6e63" }}
                    />
                    Verified permission to publish publicly on BIG Marketplace
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
