"use client"
import { useState, useEffect } from "react"
import { FileText, AlertCircle, RefreshCw } from "lucide-react"
import FormField from "./FormField"
import styles from "../../catalyst/CatalystUniversalProfile/catalyst-universal-profile.module.css"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { API_KEYS } from "../../API"
import {useApiKey} from '../../smses/SMSEDashboard/callapi'
import { getFunctions, httpsCallable } from "firebase/functions";

const ProfessionalPresentation = ({ data, updateData, profileData, }) => {
  const [formData, setFormData] = useState({
    professionalPresentation: {
      coverLetter: data?.professionalPresentation?.coverLetter || "",
      caseStudyResponse: data?.professionalPresentation?.caseStudyResponse || "",
    }
  })

  const apiKey=useApiKey()
  console.log(apiKey)
  const [wordCount, setWordCount] = useState({
    coverLetter: data?.professionalPresentation?.coverLetter 
      ? data.professionalPresentation.coverLetter.split(" ").filter((word) => word.length > 0).length 
      : 0,
    caseStudyResponse: data?.professionalPresentation?.caseStudyResponse
      ? data.professionalPresentation.caseStudyResponse.split(" ").filter((word) => word.length > 0).length
      : 0,
  })

  // AI Case Study Generation States
  const [aiCaseStudyPrompt, setAiCaseStudyPrompt] = useState("")
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)
  const [generationError, setGenerationError] = useState("")
  const [hasGeneratedPrompt, setHasGeneratedPrompt] = useState(false)

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

  // Save generated prompt to Firebase
  const savePromptToFirebase = async (prompt) => {
    const userId = auth?.currentUser?.uid;
    if (!userId) return;

    try {
      const caseStudyRef = doc(db, "aiCaseStudyPrompts", userId);
      await setDoc(caseStudyRef, {
        generatedPrompt: prompt,
        lastUpdated: new Date(),
        profileDataUsed: {
          academic: profileData?.formData?.academicOverview,
          experience: profileData?.formData?.experienceTrackRecord,
          skills: profileData?.formData?.skillsInterests
        }
      }, { merge: true });
    } catch (error) {
      console.error("Error saving prompt:", error);
    }
  };

  // Load saved prompt from Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const loadSavedPrompt = async () => {
          try {
            const caseStudyRef = doc(db, "aiCaseStudyPrompts", user.uid);
            const docSnap = await getDoc(caseStudyRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.generatedPrompt) {
                setAiCaseStudyPrompt(data.generatedPrompt);
                setHasGeneratedPrompt(true);
              }
            }
          } catch (error) {
            console.error("Error loading saved prompt:", error);
          }
        };

        loadSavedPrompt();
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-generate prompt when component mounts (when tab is opened)
  useEffect(() => {
    if (profileData && !hasGeneratedPrompt && !isGeneratingPrompt) {
      const hasRequiredData = 
        profileData.formData?.academicOverview || 
        profileData.formData?.experienceTrackRecord || 
        profileData.formData?.skillsInterests;
      
      if (hasRequiredData && !aiCaseStudyPrompt) {
        generateAiCaseStudyPrompt();
      }
    }
  }, [profileData, hasGeneratedPrompt, aiCaseStudyPrompt]);

 // REPLACE the entire sendMessageToChatGPT with this
const sendMessageToChatGPT = async (message /* apiKey not needed */) => {
  const functions = getFunctions(); // add region here if you deployed elsewhere
  const run = httpsCallable(functions, "generateCaseStudyPrompt");
  const resp = await run({ prompt: message });
  const content = resp?.data?.content;
  if (!content) throw new Error("Empty response from evaluateProfessionalSkills.");
  return content;
};



  const prepareDataForAiPromptGeneration = (data) => {
    const academicInfo = data?.formData?.academicOverview || {}
    const experience = data?.formData?.experienceTrackRecord || {}
    const skills = data?.formData?.skillsInterests || {}

    let promptData = "\n=== STUDENT PROFILE FOR CASE STUDY GENERATION ===\n"

    // Academic Information
    promptData += `\nACADEMIC BACKGROUND:\n`
    promptData += `Institution: ${academicInfo.institution || academicInfo.institutionOther || "Not specified"}\n`
    promptData += `Degree: ${academicInfo.degree || academicInfo.degreeOther || "Not specified"}\n`
    promptData += `Field of Study: ${academicInfo.fieldOfStudy || academicInfo.fieldOther || "Not specified"}\n`
    promptData += `Year of Study: ${academicInfo.yearOfStudy || academicInfo.yearOther || "Not specified"}\n`
    promptData += `Academic Performance: ${academicInfo.academicPerformance || "Not specified"}\n`
    promptData += `Certifications: ${academicInfo.certifications?.join(", ") || "None"}\n`

    // Experience Information
    promptData += `\nEXPERIENCE & PROJECTS:\n`
    promptData += `Internship Experience: ${experience.internshipExperience || "None"}\n`
    promptData += `Work Experience: ${experience.workExperiences?.map(exp => `${exp.type}: ${exp.description}`).join("; ") || "None"}\n`
    promptData += `Academic Projects: ${experience.academicProjects?.join("; ") || "None"}\n`
    promptData += `Volunteer Work: ${experience.volunteerWork?.join("; ") || "None"}\n`
    promptData += `Leadership Experience: ${experience.leadershipExperience?.join("; ") || "None"}\n`

    // Skills & Interests
    promptData += `\nSKILLS & INTERESTS:\n`
    promptData += `Technical Skills: ${skills.technicalSkills?.join(", ") || "None specified"}\n`
    promptData += `Soft Skills: ${skills.softSkills?.join(", ") || "None specified"}\n`
    promptData += `Languages: ${skills.languagesSpoken?.join(", ") || "None specified"}\n`
    promptData += `Passion Areas: ${skills.passionAreas?.join(", ") || "None specified"}\n`
    promptData += `Availability: ${skills.availableHours || "Not specified"}\n`

    return promptData
  }

  const generateAiCaseStudyPrompt = async () => {
    if (!apiKey?.trim()) {
      setGenerationError("OpenAI API key not configured.")
      return
    }
    if (!profileData) {
      setGenerationError("No profile data available for case study generation.")
      return
    }

    setIsGeneratingPrompt(true)
    setGenerationError("")

    try {
      const studentData = prepareDataForAiPromptGeneration(profileData)

      const generationMessage = `Based on the following student profile, create a personalized case study prompt in EXACTLY the same format as this example:

EXAMPLE FORMAT:
"Case Study: Digital Marketing Campaign Analysis

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
5. Risk mitigation strategies"

Now create a NEW case study that is personalized for this specific student. Make it relevant to their field of study, skills, and experience. Use realistic business scenarios, specific data points, clear objectives, and structured response requirements.

Student Profile:
${studentData}

Generate the personalized case study prompt:`

      const generatedPrompt = await sendMessageToChatGPT(generationMessage);
      setAiCaseStudyPrompt(generatedPrompt);
      setHasGeneratedPrompt(true);
      await savePromptToFirebase(generatedPrompt);

    } catch (error) {
      console.error("AI Case Study Generation error:", error);
      setGenerationError(`Failed to generate case study: ${error.message}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

  const refreshCaseStudyPrompt = async () => {
    const userId = auth?.currentUser?.uid
    if (!userId) return

    try {
      setIsGeneratingPrompt(true);
      setGenerationError("");
      await generateAiCaseStudyPrompt();
    } catch (error) {
      console.error("Error refreshing case study prompt:", error)
      setGenerationError(`Failed to refresh prompt: ${error.message}`)
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

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

        {/* AI-Generated Case Study Section */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3 className={styles.subSectionTitle}>
              Case Study Response
              {isGeneratingPrompt && (
                <span style={{ fontSize: "14px", color: "#8d6e63", marginLeft: "10px", fontWeight: "normal" }}>
                  <RefreshCw size={14} className="spin" style={{ marginRight: "6px" }} />
                  Generating your personalized case study...
                </span>
              )}
            </h3>
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

          {/* Case Study Generation Controls */}
          <div
            style={{
              background: "#fef7f0",
              border: "1px solid #fed7aa",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} style={{ color: "#ea580c" }} />
                <strong style={{ color: "#ea580c", fontSize: "14px" }}>AI-Personalized Case Study</strong>
              </div>
              <button
                onClick={refreshCaseStudyPrompt}
                disabled={isGeneratingPrompt}
                style={{
                  padding: "6px 12px",
                  backgroundColor: isGeneratingPrompt ? "#9ca3af" : "#8d6e63",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: isGeneratingPrompt ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </div>
            
            <div style={{ fontSize: "13px", color: "#7c2d12", lineHeight: "1.4" }}>
              Your case study has been personalized based on your academic background and skills. 
              {generationError && (
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
                  <AlertCircle size={12} />
                  {generationError}
                </div>
              )}
            </div>
          </div>

          {/* AI-Generated Case Study Prompt */}
          <div
            style={{
              background: "#f8f5f2",
              border: "1px solid #d7ccc8",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "16px",
              fontSize: "14px",
              lineHeight: "1.6",
              minHeight: "200px",
            }}
          >
            <h4 style={{ color: "#8d6e63", marginBottom: "16px", fontSize: "16px", borderBottom: "2px solid #8d6e63", paddingBottom: "8px" }}>
              Case Study Prompt:
            </h4>
            {aiCaseStudyPrompt ? (
              <div style={{ whiteSpace: "pre-line", color: "#5d4037" }}>
                {aiCaseStudyPrompt}
              </div>
            ) : (
              <div style={{ color: "#8d6e63", textAlign: "center", padding: "40px" }}>
                {isGeneratingPrompt ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <RefreshCw size={20} className="spin" />
                    Generating your personalized case study based on your profile...
                  </div>
                ) : (
                  "Your personalized case study will appear here once generated."
                )}
              </div>
            )}
          </div>

          <FormField
            label="Case Study Response"
            type="textarea"
            value={formData.professionalPresentation.caseStudyResponse}
            onChange={(val) => handleChange("caseStudyResponse", val)}
            placeholder={aiCaseStudyPrompt ? 
              "Start writing your response to the case study above..." :
              "Your case study response will appear here once the personalized prompt is generated..."
            }
            rows={16}
            disabled={!aiCaseStudyPrompt}
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ProfessionalPresentation