"use client"
import { useState } from "react"
import { Briefcase, Plus, X } from "lucide-react"
import FormField from "./FormField"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"
const ExperienceTrackRecord = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    internshipExperience: data?.internshipExperience || "",
    referenceContact: data?.referenceContact || "",
    linkedInProfile: data?.linkedInProfile || "",
    workExperiences: data?.workExperiences || [{ type: "", otherType: "", description: "" }],
    // NEW FIELDS FOR SCORING
    academicProjects: data?.academicProjects || [""],
    volunteerWork: data?.volunteerWork || [""],
    leadershipExperience: data?.leadershipExperience || [""],
  })

  const handleChange = (field, value) => {
    const updatedData = { ...formData, [field]: value }
    setFormData(updatedData)
    updateData(updatedData)
  }

  const handleWorkExperienceChange = (index, field, value) => {
    const updatedExperiences = [...formData.workExperiences]
    updatedExperiences[index][field] = value
    handleChange("workExperiences", updatedExperiences)
  }

  const addWorkExperience = () => {
    const updatedExperiences = [...formData.workExperiences, { type: "", otherType: "", description: "" }]
    handleChange("workExperiences", updatedExperiences)
  }

  // Academic Projects handlers
  const handleAcademicProjectChange = (index, value) => {
    const updated = [...formData.academicProjects]
    updated[index] = value
    handleChange("academicProjects", updated)
  }

  const addAcademicProject = () => {
    handleChange("academicProjects", [...formData.academicProjects, ""])
  }

  const removeAcademicProject = (index) => {
    if (formData.academicProjects.length > 1) {
      const updated = formData.academicProjects.filter((_, i) => i !== index)
      handleChange("academicProjects", updated)
    }
  }

  // Volunteer Work handlers
  const handleVolunteerWorkChange = (index, value) => {
    const updated = [...formData.volunteerWork]
    updated[index] = value
    handleChange("volunteerWork", updated)
  }

  const addVolunteerWork = () => {
    handleChange("volunteerWork", [...formData.volunteerWork, ""])
  }

  const removeVolunteerWork = (index) => {
    if (formData.volunteerWork.length > 1) {
      const updated = formData.volunteerWork.filter((_, i) => i !== index)
      handleChange("volunteerWork", updated)
    }
  }

  // Leadership Experience handlers
  const handleLeadershipChange = (index, value) => {
    const updated = [...formData.leadershipExperience]
    updated[index] = value
    handleChange("leadershipExperience", updated)
  }

  const addLeadership = () => {
    handleChange("leadershipExperience", [...formData.leadershipExperience, ""])
  }

  const removeLeadership = (index) => {
    if (formData.leadershipExperience.length > 1) {
      const updated = formData.leadershipExperience.filter((_, i) => i !== index)
      handleChange("leadershipExperience", updated)
    }
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <Briefcase size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Experience Overview</h2>
          <p className={styles.sectionDescription}>Provide your past internship and supporting info.</p>
        </div>
      </div>

      <div className={styles.formContent}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "20px",
            width: "100%",
          }}
        >
          <FormField
            label="Previous Internship Experience"
            type="dropdown"
            options={["", "None", "1–3 months", "3–6+ months"]}
            value={formData.internshipExperience}
            onChange={(val) => handleChange("internshipExperience", val)}
          />

          <FormField
            label="Reference Contact"
            type="text"
            value={formData.referenceContact}
            onChange={(val) => handleChange("referenceContact", val)}
            placeholder="Academic or work reference"
          />

          <FormField
            label="LinkedIn Profile"
            type="url"
            value={formData.linkedInProfile}
            onChange={(val) => handleChange("linkedInProfile", val)}
            placeholder="https://linkedin.com/in/yourname"
          />
        </div>

        <hr style={{ margin: "30px 0" }} />

        <h3 className={styles.subSectionTitle}>Work Experience</h3>
        {formData.workExperiences.map((exp, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <FormField
              label={`Type of Work Experience #${index + 1}`}
              type="dropdown"
              options={["", "None", "Part-time", "Full-time", "Freelance", "Other"]}
              value={exp.type}
              onChange={(val) => handleWorkExperienceChange(index, "type", val)}
            />
            {exp.type === "Other" && (
              <FormField
                label="Specify Other Work Type"
                type="text"
                value={exp.otherType}
                onChange={(val) => handleWorkExperienceChange(index, "otherType", val)}
              />
            )}
            <div style={{ gridColumn: "span 2" }}>
              <FormField
                label="Description / Role Summary"
                type="text"
                value={exp.description}
                onChange={(val) => handleWorkExperienceChange(index, "description", val)}
                placeholder="e.g. Assisted marketing team with campaign analysis..."
              />
            </div>
          </div>
        ))}

        <button type="button" className={styles.addButton} onClick={addWorkExperience}>
          + Add More Work Experience
        </button>

        <hr style={{ margin: "30px 0" }} />

        {/* NEW FIELDS FOR SCORING FRAMEWORK - All in one row */}
        <h3 className={styles.subSectionTitle}>Additional Experience for Scoring</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px" }}>
          {/* Academic Projects */}
          <div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Academic Projects</h4>
              <button
                type="button"
                onClick={addAcademicProject}
                style={{
                  background: "#a67c52",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {formData.academicProjects.map((project, index) => (
              <div key={index} style={{ display: "flex", gap: "5px", marginBottom: "8px", alignItems: "end" }}>
                <div style={{ flex: 1 }}>
                  <FormField
                    label={`Project ${index + 1}`}
                    type="textarea"
                    value={project}
                    onChange={(val) => handleAcademicProjectChange(index, val)}
                    placeholder="Describe project..."
                    rows={3}
                  />
                </div>
                {formData.academicProjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAcademicProject(index)}
                    style={{
                      background: "#8b4513",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px",
                      cursor: "pointer",
                      height: "24px",
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Volunteer Work */}
          <div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Volunteer Work</h4>
              <button
                type="button"
                onClick={addVolunteerWork}
                style={{
                  background: "#a67c52",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {formData.volunteerWork.map((work, index) => (
              <div key={index} style={{ display: "flex", gap: "5px", marginBottom: "8px", alignItems: "end" }}>
                <div style={{ flex: 1 }}>
                  <FormField
                    label={`Project ${index + 1}`}
                    type="textarea"
                    value={work}
                    onChange={(val) => handleVolunteerWorkChange(index, val)}
                    placeholder="Describe volunteer work..."
                    rows={3}
                  />
                </div>
                {formData.volunteerWork.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVolunteerWork(index)}
                    style={{
                      background: "#8b4513",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px",
                      cursor: "pointer",
                      height: "24px",
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Leadership Experience */}
          <div>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}
            >
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Leadership Experience</h4>
              <button
                type="button"
                onClick={addLeadership}
                style={{
                  background: "#a67c52",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {formData.leadershipExperience.map((leadership, index) => (
              <div key={index} style={{ display: "flex", gap: "5px", marginBottom: "8px", alignItems: "end" }}>
                <div style={{ flex: 1 }}>
                  <FormField
                    label={`Project ${index + 1}`}
                    type="textarea"
                    value={leadership}
                    onChange={(val) => handleLeadershipChange(index, val)}
                    placeholder="Describe leadership role..."
                    rows={3}
                  />
                </div>
                {formData.leadershipExperience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLeadership(index)}
                    style={{
                      background: "#8b4513",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px",
                      cursor: "pointer",
                      height: "24px",
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExperienceTrackRecord
