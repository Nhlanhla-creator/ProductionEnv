"use client"

import React, { useState } from "react"
import { Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, Building, Layers } from "lucide-react"
import FormField from "./FormField"
import MultiSelectDropdown from "./MultiSelectDropdown"
import styles from "./catalyst-universal-profile.module.css"
import {
  LIFECYCLE_STAGES_CATALYST,
  MATCHING_RULES,
  LEGAL_ENTITIES_SA,
  INDUSTRY_SECTORS_CATALYST,
  FIVE_CS_SERVICE_CATALOGUE,
  SOUTH_AFRICAN_PROVINCES,
} from "./catalystTaxonomy"

const threeColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
}

const twoColGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "1.25rem",
}

const sectionHeadingStyle = {
  borderBottom: "2px solid #795548",
  marginBottom: "1.25rem",
  marginTop: "1.75rem",
  paddingBottom: "6px",
}

const sectionHeadingTextStyle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#5d4037",
  margin: 0,
  letterSpacing: "0.2px",
}

export default function CatalystMatchingPreferencesTab({
  programme = {},
  updateProgramme,
  isLocked = false,
}) {
  const prefs = programme.matchingPreferences || {}
  const progType = programme.programmeType || "incubator"
  const isSD = progType === "sd" || progType === "esd"
  const isIncubator = progType === "incubator"
  const isAccelerator = progType === "accelerator"

  const [newServiceArea, setNewServiceArea] = useState("credibility")
  const [newServiceSubtype, setNewServiceSubtype] = useState("")
  const [newServiceProvider, setNewServiceProvider] = useState("internal")
  const [newServiceAvailability, setNewServiceAvailability] = useState("all")

  const handlePrefChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === "checkbox" ? checked : value
    updateProgramme({
      matchingPreferences: {
        ...prefs,
        [name]: val,
      },
    })
  }

  const toggleArrayItem = (field, itemId) => {
    const current = Array.isArray(prefs[field]) ? prefs[field] : []
    const updated = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId]
    updateProgramme({
      matchingPreferences: {
        ...prefs,
        [field]: updated,
      },
    })
  }

  // 5Cs Service Offerings
  const supportOfferings = Array.isArray(prefs.supportOfferings) ? prefs.supportOfferings : []

  const handleAddServiceOffering = () => {
    const cObj = FIVE_CS_SERVICE_CATALOGUE[newServiceArea]
    const subObj = cObj.subtypes.find((s) => s.id === newServiceSubtype) || cObj.subtypes[0]
    const newService = {
      id: Date.now().toString(),
      cArea: newServiceArea,
      cLabel: cObj.label,
      subtypeId: subObj.id,
      subtypeLabel: subObj.label,
      provider: newServiceProvider,
      availability: newServiceAvailability,
      cost: "included",
      description: "",
    }
    updateProgramme({
      matchingPreferences: {
        ...prefs,
        supportOfferings: [...supportOfferings, newService],
      },
    })
  }

  const handleRemoveServiceOffering = (serviceId) => {
    updateProgramme({
      matchingPreferences: {
        ...prefs,
        supportOfferings: supportOfferings.filter((s) => s.id !== serviceId),
      },
    })
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <div
        style={{
          backgroundColor: "#f8f5f2",
          borderLeft: "4px solid #795548",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "1.5rem",
          color: "#5d4037",
          fontSize: "14px",
        }}
      >
        <strong>Matching Logic:</strong> Specify accepted starting conditions for applicant SMEs. &quot;Must meet at entry&quot; enforces strict eligibility; &quot;Preferred&quot; increases match fit; &quot;We help achieve this&quot; signifies a development outcome rather than a barrier.
      </div>

      {/* ─── Common Entry Criteria ─────────────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Lifecycle Stages & Accepted Business Conditions</h3>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <FormField
          label="Target Business Lifecycle Stages Accepted (Multi-Select)"
          required
          tooltip="Business maturity stages eligible for programme entry."
        >
          <MultiSelectDropdown
            options={LIFECYCLE_STAGES_CATALYST.map((s) => ({
              value: s.id,
              label: s.label,
              description: s.description,
            }))}
            selected={prefs.acceptedLifecycleStages || []}
            onChange={(selected) => updateProgramme({
              matchingPreferences: {
                ...prefs,
                acceptedLifecycleStages: selected,
              },
            })}
            placeholder="Select accepted lifecycle stages..."
          />
        </FormField>
      </div>

      <div className={styles.gridContainer} style={threeColGrid}>
        <FormField
          label="Stage Requirement Rule"
          required
          tooltip="Whether applicant must currently be at this stage or can enter earlier."
        >
          <select
            name="lifecycleStageRule"
            value={prefs.lifecycleStageRule || "must_meet"}
            onChange={handlePrefChange}
            className={styles.formSelect}
            required
          >
            {MATCHING_RULES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Accepted Legal Structures"
          tooltip="Which formal entity types are accepted."
        >
          <select
            name="legalStructureRule"
            value={prefs.legalStructureRule || "any"}
            onChange={handlePrefChange}
            className={styles.formSelect}
          >
            <option value="any">Any Legal Structure Accepted</option>
            <option value="formal_only">Registered Companies (Pty Ltd / Ltd / NPC) Only</option>
            <option value="all_including_unregistered">Informal & Sole Proprietors Accepted</option>
          </select>
        </FormField>

        <FormField
          label="Formalisation / Registration Status"
          tooltip="Whether registration can be completed as a development outcome."
        >
          <select
            name="registrationStatusRule"
            value={prefs.registrationStatusRule || "we_help_achieve"}
            onChange={handlePrefChange}
            className={styles.formSelect}
          >
            <option value="we_help_achieve">We help achieve formalisation (Unregistered welcome)</option>
            <option value="must_be_registered">Must be already CIPC registered</option>
            <option value="in_progress_accepted">In progress or fully registered accepted</option>
          </select>
        </FormField>

        <FormField
          label="Geographic Location Scope"
          required
          tooltip="Catchment area for applicant enterprises."
        >
          <select
            name="geographicScope"
            value={prefs.geographicScope || "national"}
            onChange={handlePrefChange}
            className={styles.formSelect}
            required
          >
            <option value="national">National (All South Africa)</option>
            <option value="provincial">Provincial Catchment Only</option>
            <option value="local">Local Municipal / Community Catchment Only</option>
            <option value="pan_african">Pan-African / Cross-Border</option>
          </select>
        </FormField>

        {prefs.geographicScope === "provincial" && (
          <FormField label="Target Province" required>
            <select
              name="targetProvince"
              value={prefs.targetProvince || "Gauteng"}
              onChange={handlePrefChange}
              className={styles.formSelect}
              required
            >
              {SOUTH_AFRICAN_PROVINCES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField
          label="Minimum Operating History"
          tooltip="Required trading history duration."
        >
          <select
            name="tradingHistoryReq"
            value={prefs.tradingHistoryReq || "none"}
            onChange={handlePrefChange}
            className={styles.formSelect}
          >
            <option value="none">No minimum history required (Startups welcome)</option>
            <option value="6_months">At least 6 months active trading</option>
            <option value="12_months">At least 12 months preferred</option>
            <option value="24_months">2+ years established trading</option>
          </select>
        </FormField>

        <FormField
          label="Turnaround or Distressed Support"
          tooltip="Whether this programme can accept distressed or turnaround businesses."
        >
          <select
            name="turnaroundSupport"
            value={prefs.turnaroundSupport || "outside_scope"}
            onChange={handlePrefChange}
            className={styles.formSelect}
          >
            <option value="outside_scope">Outside Scope (Growth / Stable focus)</option>
            <option value="case_by_case">Considered on a case-by-case basis</option>
            <option value="specialised_offering">Offered as a core programme track</option>
          </select>
        </FormField>
      </div>

      {/* Target Sectors Dropdown */}
      <div style={{ marginTop: "1rem" }}>
        <FormField
          label="Target Industry Sectors (Multi-Select)"
          tooltip="Specific industry categories eligible for cohort matching."
        >
          <MultiSelectDropdown
            options={INDUSTRY_SECTORS_CATALYST.map((s) => ({ value: s.value, label: s.label }))}
            selected={prefs.sectorFocus || []}
            onChange={(selected) => updateProgramme({
              matchingPreferences: {
                ...prefs,
                sectorFocus: selected,
              },
            })}
            placeholder="Select target industry sectors..."
          />
        </FormField>
      </div>

      {/* ─── Type-Specific Criteria ─────────────────────────────────────────── */}
      {(isIncubator || isAccelerator || isSD) && (
        <>
          <div style={sectionHeadingStyle}>
            <h3 style={sectionHeadingTextStyle}>
              {progType.toUpperCase()} Specific Matching Criteria
            </h3>
          </div>

          <div className={styles.gridContainer} style={threeColGrid}>
            {isIncubator && (
              <>
                <FormField
                  label="University / Institution Affiliation"
                  tooltip="Whether applicants must be students, alumni, or researchers."
                >
                  <select
                    name="universityAffiliation"
                    value={prefs.universityAffiliation || "not_required"}
                    onChange={handlePrefChange}
                    className={styles.formSelect}
                  >
                    <option value="not_required">Not required (Open to all founders)</option>
                    <option value="preferred">Students / Alumni preferred</option>
                    <option value="required">Strictly required: Campus affiliated</option>
                  </select>
                </FormField>

                <FormField
                  label="Research & IP Maturity Stage"
                  tooltip="Minimum tech readiness level for innovation incubator."
                >
                  <select
                    name="researchIpStage"
                    value={prefs.researchIpStage || "concept"}
                    onChange={handlePrefChange}
                    className={styles.formSelect}
                  >
                    <option value="concept">Concept / Hypothesis stage</option>
                    <option value="proof_of_concept">Proof of Concept demonstrated</option>
                    <option value="working_prototype">Working prototype built</option>
                    <option value="patented_ip">Licensed / Patented technology</option>
                  </select>
                </FormField>
              </>
            )}

            {isAccelerator && (
              <>
                <FormField
                  label="Primary Growth Destination"
                  tooltip="The commercial dimension this accelerator accelerates."
                >
                  <select
                    name="growthDestination"
                    value={prefs.growthDestination || "commercial_revenue"}
                    onChange={handlePrefChange}
                    className={styles.formSelect}
                  >
                    <option value="commercial_revenue">Rapid Sales & Revenue Growth</option>
                    <option value="equity_investment">VC / Institutional Equity Raising</option>
                    <option value="operational_scaling">Production & Operations Scaling</option>
                    <option value="geographic_expansion">Regional / Export Expansion</option>
                  </select>
                </FormField>

                <FormField
                  label="Founder Investment Intent"
                  tooltip="Accepted fundraising posture."
                >
                  <select
                    name="investmentIntent"
                    value={prefs.investmentIntent || "actively_raising"}
                    onChange={handlePrefChange}
                    className={styles.formSelect}
                  >
                    <option value="actively_raising">Actively raising institutional capital</option>
                    <option value="exploring">Exploring funding options</option>
                    <option value="bootstrapping">Bootstrapping / Revenue-funded only</option>
                  </select>
                </FormField>
              </>
            )}

            {isSD && (
              <>
                <FormField
                  label="Supplier Relationship to Target Buyer"
                  required
                  tooltip="Accepted supplier status with the corporate partner."
                >
                  <select
                    name="supplierRelationship"
                    value={prefs.supplierRelationship || "prospective"}
                    onChange={handlePrefChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value="prospective">Prospective supplier for upcoming opportunity</option>
                    <option value="existing">Existing approved supplier needing capacity boost</option>
                    <option value="inactive_approved">Approved on vendor list, currently inactive</option>
                    <option value="subcontractor">Subcontractor to tier-1 supplier</option>
                  </select>
                </FormField>

                <FormField
                  label="Target Buyer / Enterprise Client"
                  required
                  tooltip="Corporate or state entity hosting the procurement pathway."
                >
                  <input
                    type="text"
                    name="targetBuyer"
                    value={prefs.targetBuyer || ""}
                    onChange={handlePrefChange}
                    placeholder="e.g. Example Mining Corp / Site A"
                    className={styles.formInput}
                    required
                  />
                </FormField>

                <FormField
                  label="Opportunity Strength & Pathway"
                  required
                  tooltip="Certainty of the commercial contract or order."
                >
                  <select
                    name="opportunityDefinition"
                    value={prefs.opportunityDefinition || "upcoming_opportunity"}
                    onChange={handlePrefChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value="confirmed_contract">Existing contract with expansion potential</option>
                    <option value="upcoming_opportunity">Confirmed upcoming tender / RFP opportunity</option>
                    <option value="category_pipeline">Strategic category without confirmed order</option>
                  </select>
                </FormField>
              </>
            )}
          </div>
        </>
      )}

      {/* ─── Support Offerings (5Cs Service Catalogue) ────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Support Offerings (5Cs Service Provision)</h3>
      </div>

      <p style={{ fontSize: "14px", color: "#6d4c41", margin: "0 0 1rem 0" }}>
        Configure the specific developmental services provided under this programme. Service availability is matched against SME binding constraints diagnosed in the Growth Suite.
      </p>

      {/* Service Builder Box */}
      <div
        style={{
          padding: "1.25rem",
          backgroundColor: "#fcfaf8",
          border: "1.5px solid #d7ccc8",
          borderRadius: "8px",
          marginBottom: "1.5rem",
        }}
      >
        <h4 style={{ margin: "0 0 1rem 0", fontSize: "14px", fontWeight: "700", color: "#5d4037" }}>
          + Add Support Service to Programme
        </h4>

        <div className={styles.gridContainer} style={threeColGrid}>
          <FormField label="5C Dimension" required>
            <select
              value={newServiceArea}
              onChange={(e) => {
                setNewServiceArea(e.target.value)
                setNewServiceSubtype("")
              }}
              className={styles.formSelect}
            >
              {Object.keys(FIVE_CS_SERVICE_CATALOGUE).map((k) => (
                <option key={k} value={k}>
                  {FIVE_CS_SERVICE_CATALOGUE[k].label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Specific Service Subtype" required>
            <select
              value={newServiceSubtype}
              onChange={(e) => setNewServiceSubtype(e.target.value)}
              className={styles.formSelect}
            >
              <option value="">Select Service...</option>
              {FIVE_CS_SERVICE_CATALOGUE[newServiceArea].subtypes.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Delivery Provider">
            <select
              value={newServiceProvider}
              onChange={(e) => setNewServiceProvider(e.target.value)}
              className={styles.formSelect}
            >
              <option value="internal">Internal Catalyst Team</option>
              <option value="partner">Specialist External Partner / Mentor</option>
              <option value="combined">Combined Internal + Specialist</option>
            </select>
          </FormField>

          <FormField label="Participant Availability">
            <select
              value={newServiceAvailability}
              onChange={(e) => setNewServiceAvailability(e.target.value)}
              className={styles.formSelect}
            >
              <option value="all">Provided to all cohort participants</option>
              <option value="after_diagnosis">Disbursed conditionally after 5Cs diagnostic</option>
              <option value="limited_capacity">Limited capacity / Competitive allocation</option>
            </select>
          </FormField>
        </div>

        <button
          type="button"
          onClick={handleAddServiceOffering}
          disabled={!newServiceSubtype}
          style={{
            marginTop: "1rem",
            padding: "8px 16px",
            backgroundColor: newServiceSubtype ? "#795548" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "13px",
            cursor: newServiceSubtype ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} /> Add Service to Offering
        </button>
      </div>

      {/* Rendered Service Cards */}
      {supportOfferings.length === 0 ? (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px dashed #d7ccc8",
            borderRadius: "6px",
            textAlign: "center",
            color: "#8d6e63",
            fontSize: "14px",
          }}
        >
          No services added to this programme yet. Use the service builder above to configure support offerings across Credibility, Customers, Capability, Capacity, or Capital.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {supportOfferings.map((service, idx) => (
            <div
              key={service.id || idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                backgroundColor: "#ffffff",
                border: "1px solid #d7ccc8",
                borderLeft: "4px solid #795548",
                borderRadius: "6px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      backgroundColor: "#f3ebe0",
                      color: "#6b4c2a",
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {service.cLabel}
                  </span>
                  <strong style={{ fontSize: "14px", color: "#4e342e" }}>{service.subtypeLabel}</strong>
                </div>
                <div style={{ fontSize: "12px", color: "#6d4c41" }}>
                  Provider: <strong>{service.provider}</strong> • Availability: <strong>{service.availability.replace(/_/g, " ")}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveServiceOffering(service.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#c62828",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
