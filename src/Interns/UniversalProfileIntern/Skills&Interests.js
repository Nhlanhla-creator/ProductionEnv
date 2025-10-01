"use client"
import { useState } from "react"
import { Award, X, Users, Code, Calendar, Clock, Lightbulb, Globe } from "lucide-react"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"
import FormField from "./FormField" // Assuming FormField is in the same directory

// Component for each skills input section (MOVED OUTSIDE for stability)
const SkillSection = ({ label, field, icon, inputs, setInputs, data, updateData, helpText }) => {
  const currentSkills = data[field] || []

  // Helper: add new skill if not empty and not duplicate
  const addSkill = (field, skill) => {
    skill = skill.trim()
    if (!skill) return
    const currentList = data[field] || []
    if (currentList.includes(skill)) return
    const updatedList = [...currentList, skill]
    updateData({ [field]: updatedList })
    setInputs((prev) => ({ ...prev, [field]: "" })) // Clear input after adding
  }

  // Helper: remove skill
  const removeSkill = (field, skill) => {
    const currentList = data[field] || []
    const updatedList = currentList.filter((s) => s !== skill)
    updateData({ [field]: updatedList })
  }

  // Handle input typing for skill textboxes
  const onInputChange = (field, value) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  // Handle Enter key to add skill
  const onInputKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSkill(field, inputs[field])
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h4
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {icon} {label}
      </h4>
      
      {/* Help text */}
      {helpText && (
        <p style={{
          fontSize: 13,
          color: "#6b7280",
          marginBottom: 12,
          lineHeight: 1.4
        }}>
          {helpText}
        </p>
      )}
      
      {/* Skill count indicator */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }}>
        <span style={{
          fontSize: 12,
          color: currentSkills.length >= 10 ? "#059669" : currentSkills.length >= 5 ? "#d97706" : "#6b7280"
        }}>
          {currentSkills.length}/15 skills added
        </span>
        {currentSkills.length >= 10 && (
          <span style={{
            fontSize: 12,
            color: "#059669",
            fontWeight: 500
          }}>
            Great profile! 👍
          </span>
        )}
      </div>
      
      {/* Input + Add button */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={inputs[field]}
          onChange={(e) => onInputChange(field, e.target.value)}
          onKeyDown={(e) => onInputKeyDown(e, field)}
          placeholder={`Type and press Enter to add ${label.toLowerCase()}...`}
          disabled={currentSkills.length >= 15}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: currentSkills.length >= 15 ? "#f9fafb" : "#ffffff",
            opacity: currentSkills.length >= 15 ? 0.6 : 1
          }}
        />
        <button
          type="button"
          onClick={() => addSkill(field, inputs[field])}
          disabled={currentSkills.length >= 15 || !inputs[field]?.trim()}
          style={{
            padding: "10px 16px",
            backgroundColor: currentSkills.length >= 15 || !inputs[field]?.trim() ? "#9ca3af" : "#8d6e63",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: currentSkills.length >= 15 || !inputs[field]?.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Add
        </button>
      </div>
      
      {/* Display selected skills with remove button */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 40 }}>
        {currentSkills.map((skill, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 20,
              backgroundColor: "#f3f4f6",
              fontSize: 14,
            }}
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={() => removeSkill(field, skill)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SkillsInterests({ data = {}, updateData }) {
  // Local input text for each skills input box
  const [inputs, setInputs] = useState({
    technicalSkills: "",
    softSkills: "",
    languagesSpoken: "",
    passionAreas: "",
  })

  // Predefined options for dropdowns
  const predefinedOptions = {
    availableHours: ["10–20 hours", "20–30 hours", "30+ hours"],
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <Award size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Skills & Interests</h2>
          <p className={styles.sectionDescription}>
          
            The more skills you add, the better we can connect you with relevant internships!
          </p>
        </div>
      </div>
      
      {/* Skills matching tip */}
      <div style={{
        backgroundColor: "#f5f1ed",
        border: "1px solid #a67c52",
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        display: "flex",
        alignItems: "start",
        gap: 12
      }}>
        <Lightbulb size={20} style={{ color: "#8d6e63", marginTop: 2, flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#5d4037", marginBottom: 4 }}>
            💡 Tip: Build a Strong Profile
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: "#5d4037", lineHeight: 1.4 }}>
            Add 10-15 skills to improve your matching potential. Include both your strengths and interests across all categories.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 20,
          width: "100%",
          marginTop: 24,
        }}
      >
        <SkillSection
          label="Skills & Abilities"
          field="technicalSkills"
          icon={<Award size={16} />}
          inputs={inputs}
          setInputs={setInputs}
          data={data}
          updateData={updateData}
          helpText="Include any relevant skills - computer programs, tools, certifications, or technical abilities (e.g., Microsoft Office, Social Media, Customer Service, etc.)"
        />
        
        <SkillSection
          label="Personal Strengths"
          field="softSkills"
          icon={<Users size={16} />}
          inputs={inputs}
          setInputs={setInputs}
          data={data}
          updateData={updateData}
          helpText="Your personal qualities and work style (e.g., Good Communication, Reliable, Creative, Problem-solving, Team Player, etc.)"
        />
        
        <SkillSection
          label="Languages Spoken"
          field="languagesSpoken"
          icon={<Globe size={16} />}
          inputs={inputs}
          setInputs={setInputs}
          data={data}
          updateData={updateData}
          helpText="List all languages you can communicate in, including proficiency level if desired (e.g., English (Native), Afrikaans (Fluent), Zulu (Conversational))"
        />
        
        <SkillSection
          label="Interests & Passions"
          field="passionAreas"
          icon={<Lightbulb size={16} />}
          inputs={inputs}
          setInputs={setInputs}
          data={data}
          updateData={updateData}
          helpText="What you're interested in or passionate about (e.g., Marketing, Healthcare, Environment, Business, Arts, Sports, etc.)"
        />

        {/* Availability Start Date */}
        <FormField
          label={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} /> Availability Start Date
            </span>
          }
          type="date"
          value={data.availabilityStart}
          onChange={(val) => updateData({ availabilityStart: val })}
          required
        />

        {/* Available Hours per Week */}
        <FormField
          label={
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} /> Available Hours per Week
            </span>
          }
          type="dropdown"
          options={["", ...predefinedOptions.availableHours]}
          value={data.availableHours}
          onChange={(val) => updateData({ availableHours: val })}
          required
        />
      </div>
    </div>
  )
}