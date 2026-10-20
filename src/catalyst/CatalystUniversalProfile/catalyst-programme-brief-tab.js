"use client"

import React from "react"
import FormField from "./FormField"
import MultiSelectDropdown from "./MultiSelectDropdown"
import styles from "./catalyst-universal-profile.module.css"
import {
  PROGRAMME_TYPES,
  PRIMARY_MANDATES_BY_TYPE,
  ESD_TRACK_STRUCTURES,
  SPONSOR_SOURCES,
  SPONSOR_REPORTING_PRIORITIES,
  PROGRAMME_DURATIONS,
  PROGRAMME_FORMATS,
  DELIVERY_MODES,
  INTAKE_METHODS,
  INTAKE_STATUSES,
  PARTICIPATION_COST_MODELS,
  DIAGNOSTIC_APPROACHES,
  REVIEW_FREQUENCIES,
  ACTION_ACCOUNTABILITIES,
  INTENDED_BUSINESS_OUTCOMES,
  NEXT_STAGE_DESTINATIONS,
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

export default function CatalystProgrammeBriefTab({
  programme = {},
  updateProgramme,
  isLocked = false,
}) {
  const brief = programme.programmeBrief || {}

  const updateBrief = (patch) => {
    updateProgramme({
      programmeBrief: {
        ...brief,
        ...patch,
      },
    })
  }

  const handleBriefChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === "checkbox" ? checked : value
    updateProgramme({
      programmeBrief: {
        ...brief,
        [name]: val,
      },
    })
  }

  const handleMultiSelectToggle = (field, itemId) => {
    const current = Array.isArray(brief[field]) ? brief[field] : []
    const updated = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId]
    updateProgramme({
      programmeBrief: {
        ...brief,
        [field]: updated,
      },
    })
  }

  const progType = programme.programmeType || "incubator"
  const mandateOptions = PRIMARY_MANDATES_BY_TYPE[progType] || PRIMARY_MANDATES_BY_TYPE.incubator
  const isESD = progType === "esd"

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
        <strong>Setup Guidance:</strong> Define the core mandate and delivery model for this programme. Expectations for sponsor reporting, participant time commitments, and measured business milestones are configured here.
      </div>

      {/* ─── Programme Mandate & Details ─────────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Programme Mandate & Sponsor Alignment</h3>
      </div>

      <div className={styles.gridContainer} style={threeColGrid}>
        <FormField
          label="Programme Type"
          required
          tooltip="Template controlling dynamic matching rules and setup workflows."
        >
          <select
            value={progType}
            onChange={(e) => updateProgramme({ programmeType: e.target.value })}
            className={styles.formSelect}
            disabled={isLocked}
          >
            {PROGRAMME_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Programme Name"
          required
          tooltip="Public name of this specific programme or cohort."
        >
          <input
            type="text"
            name="programmeName"
            value={programme.programmeName || ""}
            onChange={(e) => updateProgramme({ programmeName: e.target.value })}
            placeholder="e.g. Supplier Growth Pathway 2027"
            className={styles.formInput}
            required
            disabled={isLocked}
          />
        </FormField>

        <FormField
          label="Programme Lead / Accountable Contact"
          required
          tooltip="Person responsible for operational delivery and cohort management."
        >
          <input
            type="text"
            name="programmeLead"
            value={brief.programmeLead || ""}
            onChange={handleBriefChange}
            placeholder="e.g. Nomsa Dlamini (Hub Director)"
            className={styles.formInput}
            required
          />
        </FormField>

        <FormField
          label="Primary Mandate"
          required
          tooltip="Core purpose and primary strategic focus of this programme."
        >
          <select
            name="primaryMandate"
            value={brief.primaryMandate || ""}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            <option value="">Select Primary Mandate</option>
            {mandateOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Programme Website URL"
          tooltip="Public programme information page (leave blank if same as organisation site)."
        >
          <input
            type="url"
            name="programmeWebsite"
            value={brief.programmeWebsite || ""}
            onChange={handleBriefChange}
            placeholder="https://hub.example.org/pathway"
            className={styles.formInput}
          />
        </FormField>

        {isESD && (
          <FormField
            label="ESD Track Structure"
            required
            tooltip="Relationship between the ED foundation track and SD buyer-linked track."
          >
            <select
              name="esdTrackStructure"
              value={brief.esdTrackStructure || "sequential"}
              onChange={handleBriefChange}
              className={styles.formSelect}
              required
            >
              {ESD_TRACK_STRUCTURES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FormField>
        )}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <FormField
          label="About the Programme (SME-Facing Summary)"
          required
          tooltip="Concise summary shown to applicant SMEs outlining the curriculum, support, and expected commitment."
        >
          <textarea
            name="aboutProgramme"
            value={brief.aboutProgramme || ""}
            onChange={handleBriefChange}
            rows={3}
            placeholder="Summarize what participants will experience and achieve during this programme..."
            className={styles.formTextarea}
            required
          />
        </FormField>
      </div>

      {/* Secondary Objectives Dropdown */}
      <div style={{ marginTop: "1rem" }}>
        <FormField
          label="Secondary Programme Objectives (Multi-Select)"
          tooltip="Additional developmental milestones targeted alongside the primary mandate."
        >
          <MultiSelectDropdown
            options={mandateOptions.filter((m) => m.value !== brief.primaryMandate)}
            selected={brief.secondaryObjectives || []}
            onChange={(selected) => updateBrief({ secondaryObjectives: selected })}
            placeholder="Select secondary objectives..."
          />
        </FormField>
      </div>

      {/* Funding & Sponsor Alignment */}
      <div style={{ marginTop: "1.25rem", padding: "1.25rem", backgroundColor: "#fcfaf8", border: "1px solid #e8d8cf", borderRadius: "6px" }}>
        <h4 style={{ margin: "0 0 1rem 0", fontSize: "14px", color: "#5d4037" }}>
          Funding & Sponsor Alignment
        </h4>
        <div style={{ marginBottom: "1rem" }}>
          <FormField
            label="Funding & Sponsor Sources (Multi-Select)"
            tooltip="Origin of capital or grants subsidising programme delivery."
          >
            <MultiSelectDropdown
              options={SPONSOR_SOURCES.map((s) => ({ value: s.id, label: s.label }))}
              selected={brief.fundingSources || []}
              onChange={(selected) => updateBrief({ fundingSources: selected })}
              placeholder="Select funding & sponsor sources..."
            />
          </FormField>
        </div>

        <div className={styles.gridContainer} style={twoColGrid}>
          <FormField
            label="Sponsor Organisation Name"
            tooltip="Legal or corporate sponsor funding the programme."
          >
            <input
              type="text"
              name="sponsorOrganisation"
              value={brief.sponsorOrganisation || ""}
              onChange={handleBriefChange}
              placeholder="e.g. Sanlam Enterprise Fund / DTIC"
              className={styles.formInput}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6d4c41", marginTop: "4px" }}>
              <input
                type="checkbox"
                name="isSponsorConfidential"
                checked={!!brief.isSponsorConfidential}
                onChange={handleBriefChange}
                style={{ accentColor: "#795548" }}
              />
              Keep sponsor identity private from public listing
            </label>
          </FormField>

          <FormField
            label="Sponsor Reporting Priorities"
            tooltip="Key reporting outcomes required by the funder."
          >
            <select
              onChange={(e) => {
                if (e.target.value) handleMultiSelectToggle("sponsorReportingPriorities", e.target.value)
              }}
              value=""
              className={styles.formSelect}
            >
              <option value="">+ Add Reporting Priority</option>
              {SPONSOR_REPORTING_PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
              {(brief.sponsorReportingPriorities || []).map((pId) => {
                const item = SPONSOR_REPORTING_PRIORITIES.find((x) => x.id === pId)
                return (
                  <span
                    key={pId}
                    style={{
                      fontSize: "12px",
                      backgroundColor: "#f3ebe0",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item?.label || pId}
                    <span
                      onClick={() => handleMultiSelectToggle("sponsorReportingPriorities", pId)}
                      style={{ cursor: "pointer", fontWeight: "bold" }}
                    >
                      ×
                    </span>
                  </span>
                )
              })}
            </div>
          </FormField>
        </div>
      </div>

      {/* ─── Delivery & Practical Commitment ─────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Delivery Mode, Schedule & Practical Commitment</h3>
      </div>

      <div className={styles.gridContainer} style={threeColGrid}>
        <FormField
          label="Programme Duration Model"
          required
          tooltip="Length or milestone completion basis for this programme."
        >
          <select
            name="durationModel"
            value={brief.durationModel || "fixed"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {PROGRAMME_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </FormField>

        {brief.durationModel === "fixed" && (
          <FormField
            label="Duration Length"
            required
            tooltip="Fixed period duration (e.g. 6 Months, 12 Weeks)."
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="number"
                name="durationNumber"
                value={brief.durationNumber || "6"}
                onChange={handleBriefChange}
                className={styles.formInput}
                min="1"
                style={{ width: "80px" }}
              />
              <select
                name="durationUnit"
                value={brief.durationUnit || "Months"}
                onChange={handleBriefChange}
                className={styles.formSelect}
              >
                <option value="Weeks">Weeks</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>
          </FormField>
        )}

        <FormField
          label="Programme Format"
          required
          tooltip="How support cohorts are structured and paced."
        >
          <select
            name="programmeFormat"
            value={brief.programmeFormat || "fixed_cohort"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {PROGRAMME_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Delivery Mode"
          required
          tooltip="Attendance mode (Hybrid, In person, or Online)."
        >
          <select
            name="deliveryMode"
            value={brief.deliveryMode || "hybrid"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {DELIVERY_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Intake Method"
          required
          tooltip="How applicants or participants are admitted into the programme."
        >
          <select
            name="intakeMethod"
            value={brief.intakeMethod || "open_applications"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {INTAKE_METHODS.map((im) => (
              <option key={im.value} value={im.value}>
                {im.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Current Recruitment / Intake Status"
          required
          tooltip="Current admission availability displayed on programme cards."
        >
          <select
            name="intakeStatus"
            value={programme.intakeStatus || "open"}
            onChange={(e) => updateProgramme({ intakeStatus: e.target.value })}
            className={styles.formSelect}
            required
          >
            {INTAKE_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Cohort / Support Start Timing"
          required
          tooltip="When admissions commence."
        >
          <input
            type="text"
            name="cohortStartTiming"
            value={brief.cohortStartTiming || ""}
            onChange={handleBriefChange}
            placeholder="e.g. 1 February 2027 or Rolling"
            className={styles.formInput}
            required
          />
        </FormField>

        <FormField
          label="Participant Capacity"
          required
          tooltip="Target number of SMEs accepted per intake."
        >
          <input
            type="number"
            name="participantCapacity"
            value={brief.participantCapacity || "20"}
            onChange={handleBriefChange}
            placeholder="e.g. 20"
            className={styles.formInput}
            min="1"
            required
          />
        </FormField>

        <FormField
          label="Participation Cost Model"
          required
          tooltip="Financial cost or ownership terms for the entrepreneur."
        >
          <select
            name="participationCost"
            value={brief.participationCost || "free_sponsored"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {PARTICIPATION_COST_MODELS.map((cm) => (
              <option key={cm.value} value={cm.value}>
                {cm.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Founder Time Commitment"
          required
          tooltip="Hours per week founders must allocate to programme sessions and actions."
        >
          <input
            type="text"
            name="founderTimeCommitment"
            value={brief.founderTimeCommitment || "4 hours / week"}
            onChange={handleBriefChange}
            placeholder="e.g. 4 hours / week"
            className={styles.formInput}
            required
          />
        </FormField>

        <FormField
          label="Delivery Province / Location"
          tooltip="Primary region for in-person workshops and site sessions."
        >
          <select
            name="deliveryProvince"
            value={brief.deliveryProvince || "Gauteng"}
            onChange={handleBriefChange}
            className={styles.formSelect}
          >
            {SOUTH_AFRICAN_PROVINCES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {/* ─── Actions, Outcomes & Elevation ───────────────────────────────────── */}
      <div style={sectionHeadingStyle}>
        <h3 style={sectionHeadingTextStyle}>Actions, Measurable Outcomes & Elevation</h3>
      </div>

      <div className={styles.gridContainer} style={threeColGrid}>
        <FormField
          label="Diagnostic Approach"
          required
          tooltip="How binding constraints are diagnosed following baseline score."
        >
          <select
            name="diagnosticApproach"
            value={brief.diagnosticApproach || "combined"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {DIAGNOSTIC_APPROACHES.map((da) => (
              <option key={da.value} value={da.value}>
                {da.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Implementation Review Frequency"
          required
          tooltip="Cadence for reviewing action roadmaps and milestone progress."
        >
          <select
            name="reviewFrequency"
            value={brief.reviewFrequency || "monthly"}
            onChange={handleBriefChange}
            className={styles.formSelect}
            required
          >
            {REVIEW_FREQUENCIES.map((rf) => (
              <option key={rf.value} value={rf.value}>
                {rf.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Graduation Milestone Criteria"
          required
          tooltip="Conditions that mark successful completion of the programme."
        >
          <input
            type="text"
            name="graduationCriteria"
            value={brief.graduationCriteria || ""}
            onChange={handleBriefChange}
            placeholder="e.g. Quality audit passed + 3 repeat buyer orders"
            className={styles.formInput}
            required
          />
        </FormField>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <FormField
          label="Intended Business Economic Outcomes (Multi-Select)"
          tooltip="Measurable economic growth indicators targeted for graduating businesses."
        >
          <MultiSelectDropdown
            options={INTENDED_BUSINESS_OUTCOMES.map((o) => ({ value: o.id, label: o.label }))}
            selected={brief.intendedOutcomes || []}
            onChange={(selected) => updateBrief({ intendedOutcomes: selected })}
            placeholder="Select intended business outcomes..."
          />
        </FormField>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <FormField
          label="Next Stage Elevation Destinations (Graduation Pathways)"
          tooltip="Commercial, institutional, or capital pathways prepared for graduating cohort members."
        >
          <MultiSelectDropdown
            options={NEXT_STAGE_DESTINATIONS.map((d) => ({ value: d.id, label: d.label }))}
            selected={brief.nextDestinations || []}
            onChange={(selected) => updateBrief({ nextDestinations: selected })}
            placeholder="Select progression destinations..."
          />
        </FormField>
      </div>
    </div>
  )
}
