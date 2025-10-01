"use client"
import { useState } from "react"
import { FileText, AlertCircle } from "lucide-react"
import FormField from "./FormField"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"

const ProfessionalPresentation = ({ data, updateData }) => {
  const [formData, setFormData] = useState({
    professionalPresentation: {
      coverLetter: data?.professionalPresentation?.coverLetter || "",
      caseStudyResponse: data?.professionalPresentation?.caseStudyResponse || "",
    }
  })

  const [wordCount, setWordCount] = useState({
    coverLetter: data?.professionalPresentation?.coverLetter 
      ? data.professionalPresentation.coverLetter.split(" ").filter((word) => word.length > 0).length 
      : 0,
    caseStudyResponse: data?.professionalPresentation?.caseStudyResponse
      ? data.professionalPresentation.caseStudyResponse.split(" ").filter((word) => word.length > 0).length
      : 0,
  })

  const handleChange = (field, value) => {
    const updatedData = {
      ...formData,
      professionalPresentation: {
        ...formData.professionalPresentation,
        [field]: value
      }
    }
    setFormData(updatedData)
    updateData(updatedData)

    // Update word count
    if (field === "coverLetter" || field === "caseStudyResponse") {
      const words = value.split(" ").filter((word) => word.length > 0).length
      setWordCount((prev) => ({ ...prev, [field]: words }))
    }
  }

  const caseStudyPrompt = `Case Study: Digital Marketing Campaign Analysis

BIG Marketplace, a platform connecting businesses with skilled interns, has noticed a 30% decline in intern applications over the past 3 months. The marketing team suspects this is due to increased competition from other internship platforms and changing student preferences post-COVID.

Current situation:
- Monthly intern applications dropped from 500 to 350
- Website traffic remains stable at 10,000 monthly visitors
- Social media engagement has decreased by 25%
- Competitor analysis shows 3 new platforms launched recently

Your task: Propose a comprehensive digital marketing strategy to increase intern applications by 40% within the next 6 months. Consider budget constraints of R50,000 and focus on cost-effective solutions.

Please provide:
1. Problem analysis and root causes
2. Proposed solution with specific tactics
3. Implementation timeline
4. Success metrics and KPIs
5. Risk mitigation strategies`

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerIcon}>
          <FileText size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.sectionTitle}>Professional Presentation</h2>
          <p className={styles.sectionDescription}>
            Demonstrate your communication skills and problem-solving abilities.
          </p>
        </div>
      </div>

      <div className={styles.formContent}>
        {/* Cover Letter Section */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 className={styles.subSectionTitle}>Cover Letter</h3>
            <div
              style={{
                fontSize: "14px",
                color: wordCount.coverLetter > 500 ? "#ef4444" : "#6b7280",
                fontWeight: "500",
              }}
            >
              {wordCount.coverLetter}/500 words
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <AlertCircle size={16} style={{ color: "#3b82f6", marginTop: "2px" }} />
              <div style={{ fontSize: "14px", color: "#475569" }}>
                <strong>Guidelines:</strong> Write a professional cover letter tailored to BIG Marketplace's mission of
                connecting businesses with skilled interns. Include your motivation, relevant skills, and how you align
                with our values of empowerment and growth.
              </div>
            </div>
          </div>

          <FormField
            label="Cover Letter"
            type="textarea"
            value={formData.professionalPresentation.coverLetter} 
            onChange={(val) => handleChange("coverLetter", val)}
            placeholder="Dear BIG Marketplace Team,

I am writing to express my strong interest in joining your internship program..."
            rows={12}
          />

          {wordCount.coverLetter > 500 && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "12px",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertCircle size={14} />
              Cover letter exceeds recommended 500 word limit
            </div>
          )}
        </div>

        {/* Case Study Section */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 className={styles.subSectionTitle}>Case Study Response</h3>
            <div
              style={{
                fontSize: "14px",
                color: wordCount.caseStudyResponse > 800 ? "#ef4444" : "#6b7280",
                fontWeight: "500",
              }}
            >
              {wordCount.caseStudyResponse}/800 words
            </div>
          </div>

          <div
            style={{
              background: "#fef7f0",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "16px",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <h4 style={{ color: "#ea580c", marginBottom: "12px", fontSize: "16px" }}>Case Study Prompt:</h4>
            <div style={{ whiteSpace: "pre-line", color: "#7c2d12" }}>{caseStudyPrompt}</div>
          </div>

          <FormField
            label="Case Study Response"
            type="textarea"
            value={formData.professionalPresentation.caseStudyResponse}
            onChange={(val) => handleChange("caseStudyResponse", val)}
            placeholder="Problem Analysis:

The 30% decline in intern applications can be attributed to several key factors...

Proposed Solution:

1. Enhanced Social Media Strategy
- Implement targeted LinkedIn and Instagram campaigns...

2. University Partnership Program
- Establish direct relationships with career centers...

Implementation Timeline:
Month 1-2: ...
Month 3-4: ...

Success Metrics:
- Application conversion rate improvement
- Cost per acquisition reduction...

Risk Mitigation:
- A/B testing for all campaigns
- Monthly performance reviews..."
            rows={16}
          />

          {wordCount.caseStudyResponse > 800 && (
            <div
              style={{
                color: "#ef4444",
                fontSize: "12px",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertCircle size={14} />
              Case study response exceeds recommended 800 word limit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfessionalPresentation