"use client"
import { useState, useEffect } from "react"
import { BigInternScore } from "./BigInternScore"
import { AcademicFoundation } from "./AcademicFoundation"
import { ProfessionalSkills } from "./ProfessionalSkills"
import { WorkExperience } from "./WorkExperience"
import { ProfessionalPresentation } from "./ProfessionalPresentation"
import { InternSummaryReportCard } from "./BigInternReportSummary"
import { GraduationCap, Users, RefreshCw } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot } from "firebase/firestore"
import { API_KEYS } from "../../API"

export default function InternDashboard() {
  const [academicScore, setAcademicScore] = useState(0)
  const [professionalSkillsScore, setProfessionalSkillsScore] = useState(0)
  const [workExperienceScore, setWorkExperienceScore] = useState(0)
  const [professionalPresentationScore, setProfessionalPresentationScore] = useState(0)
  const [bigInternScore, setBigInternScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [triggerRefresh, setTriggerRefresh] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const apiKey = API_KEYS.OPENAI
  // Add sidebar state detection
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    }

    // Check initial state
    checkSidebarState();

    // Watch for changes
    const observer = new MutationObserver(checkSidebarState);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Calculate BIG Intern Score whenever component scores change
  useEffect(() => {
    console.log("Current scores:", {
      academic: academicScore,
      professional: professionalSkillsScore,
      work: workExperienceScore,
      presentation: professionalPresentationScore
    })
  }, [academicScore, professionalSkillsScore, workExperienceScore, professionalPresentationScore])

  // Fetch profile data from Firestore
  useEffect(() => {
    if (!auth.currentUser?.uid) return

    const unsubscribe = onSnapshot(
      doc(db, "internProfiles", auth.currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setProfileData({ id: docSnap.id, formData: data })
          setLoading(false)
        } else {
          console.log("No profile data found")
          setLoading(false)
        }
      },
      (error) => {
        console.error("Error fetching profile:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [auth.currentUser?.uid, triggerRefresh])

  const handleRefresh = () => {
    setTriggerRefresh(prev => !prev)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <RefreshCw size={32} className="spin" />
          <p style={{ color: '#5D4037', fontSize: '18px' }}>Loading your dashboard...</p>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)`,
        padding: "40px 20px 20px 20px",
        marginLeft: isSidebarCollapsed ? "100px" : "260px",
        marginTop: "40px",
        transition: "margin-left 0.3s ease"
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          paddingRight: "20px",
        }}
      >
        {/* Main Heading with Refresh Button */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
            padding: "25px 30px",
            background: `linear-gradient(135deg, #7d5a50 0%, #4a352f 100%)`,
            borderRadius: "20px",
            color: "#faf7f2",
            boxShadow: "0 8px 32px rgba(74, 53, 47, 0.25), inset 0 1px 0 rgba(245, 240, 225, 0.1)",
            border: `1px solid #a67c52`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            cursor: "pointer",
          }}>
            <RefreshCw
              size={24}
              color="#f5f0e1"
              onClick={handleRefresh}
              style={{ transition: 'transform 0.3s ease' }}
              className="hover:rotate-180"
            />
          </div>

          <h1
            style={{
              fontSize: "36px",
              fontWeight: "800",
              margin: "0 0 10px 0",
              letterSpacing: "1.5px",
              textShadow: "1px 1px 6px rgba(0,0,0,0.3)",
              background: `linear-gradient(135deg, #f5f0e1 0%, #e6d7c3 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              position: "relative",
              zIndex: 1,
            }}
          >
            BIG INTERN SCORE
          </h1>
          <div
            style={{
              width: "100px",
              height: "3px",
              background: `linear-gradient(90deg, #a67c52 0%, #c8b6a6 100%)`,
              margin: "0 auto 12px auto",
              borderRadius: "2px",
              position: "relative",
              zIndex: 1,
            }}
          />
          <p
            style={{
              fontSize: "16px",
              margin: "0",
              opacity: "0.9",
              fontWeight: "400",
              color: "#e6d7c3",
              position: "relative",
              zIndex: 1,
            }}
          >
            Comprehensive Intern Assessment Dashboard
          </p>
        </div>

        {/* First Row - BIG Intern Score + BIG Score Summary Analysis */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "20px",
            marginBottom: "20px",
            alignItems: "stretch",
          }}
        >
          <div style={{ height: "100%" }}>
            <BigInternScore
              profileData={profileData}
              academicScore={academicScore}
              professionalSkillsScore={professionalSkillsScore}
              workExperienceScore={workExperienceScore}
              professionalPresentationScore={professionalPresentationScore}
              onScoreUpdate={setBigInternScore}

            />
          </div>
          <div style={{ height: "100%" }}>
       <div style={{ height: "100%" }}>
  <InternSummaryReportCard
    userId={auth.currentUser?.uid}
    apiKey={apiKey}
    styles={{
      minHeight: "400px",
      display: "flex",
      flexDirection: "column"
    }}
  />
</div>
          </div>
        </div>

        {/* Second Row - Score Components */}
           {apiKey && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "30px",
            alignItems: "stretch",
          }}
        >
          <AcademicFoundation
            profileData={profileData?.formData}
            onScoreUpdate={setAcademicScore}
            apiKey={apiKey}
          />
          <WorkExperience
            profileData={profileData?.formData}
            onScoreUpdate={setWorkExperienceScore}
            apiKey={apiKey}
          />
          <ProfessionalSkills
            profileData={profileData?.formData}
            onScoreUpdate={setProfessionalSkillsScore}
            apiKey={apiKey}
          />
          <ProfessionalPresentation
            profileData={profileData?.formData}
            onScoreUpdate={setProfessionalPresentationScore}
            apiKey={apiKey}
          />
        </div>
           )}

         {!apiKey && (
        <section className="individual-scores-row" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '20px',
          marginBottom: '20px'
        }}>
          {[...Array(4)].map((_, index) => (
            <div key={index} style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              border: '1px solid #e8ddd6'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: '#8d6e63'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid #d7ccc8',
                  borderTop: '3px solid #8d6e63',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>Loading...</span>
              </div>
            </div>
          ))}
        </section>
      )}

      </div>

     
      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1400px) {
          .dashboard-container {
            margin-left: ${isSidebarCollapsed ? '80px' : '200px'};
          }
        }

        @media (max-width: 1200px) {
          .dashboard-container {
            margin-left: 0;
            padding-left: 20px;
            padding-right: 20px;
          }

          .big-score-row {
            grid-template-columns: 1fr !important;
          }

          .components-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 20px 15px;
          }

          .components-row {
            grid-template-columns: 1fr !important;
          }

          .header h1 {
            font-size: 28px !important;
          }
        }

        @media (max-width: 480px) {
          .header {
            padding: 20px 15px !important;
          }

          .header h1 {
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  )
}