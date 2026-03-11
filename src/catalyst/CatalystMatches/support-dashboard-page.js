"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebaseConfig"
import { X, ArrowRight } from "lucide-react"
import { SupportDealFlowPipeline } from "./support-deal-flow"
import { PortfolioProvider } from "../../context/PortfolioContext"

import SupportTabbedTables from "./support-tabbed-tables"
import styles from "./support-funding.module.css"

const onboardingSteps = [
  {
    title: "Welcome to Your Support Program Dashboard",
    content: "This dashboard provides you with tools to discover, analyze, and manage potential support program opportunities.",
    icon: "🏢",
  },
  {
    title: "Support Program Pipeline",
    content: "Track your support applications at each stage of the pipeline, from initial application to active support.",
    icon: "📊",
  },
  {
    title: "Support Insights",
    content: "Get valuable analytics and insights about program performance, funding metrics, and support opportunities.",
    icon: "📈",
  },
  {
    title: "Filter SMSEs",
    content: "Use powerful filters to find the perfect support match based on location, industry, funding requirements, and more.",
    icon: "🔍",
  },
  {
    title: "SMSE Applications",
    content: "Browse through potential support applications and take action on the ones that match your program criteria.",
    icon: "🤝",
  },
]

function SupportDashboardContent() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Initialize filters and stage filter state
  const [filters, setFilters] = useState({
    location: "",
    matchScore: 50,
    minValue: "",
    maxValue: "",
    instruments: [],
    stages: [],
    sectors: [],
    supportTypes: [],
    smeType: "",
    sortBy: "",
  })
  const [stageFilter, setStageFilter] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthChecked(true)
    })
    return () => unsubscribe()
  }, [])

  const getUserSpecificKey = (baseKey) => {
    const userId = user?.uid || "guest"
    return `${baseKey}_${userId}`
  }

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters })
  }

  // Check for popup display
  useEffect(() => {
    if (!authChecked) return

    const storageKey = getUserSpecificKey("hasSeenSupportPopup")
    const seenPopup = localStorage.getItem(storageKey) === "true"

    if (!seenPopup) {
      setShowWelcomePopup(true)
      localStorage.setItem(storageKey, "true")
    }
  }, [authChecked, user])

  const closePopup = () => {
    setShowWelcomePopup(false)
    setCurrentOnboardingStep(0)
  }

  const handleNextStep = () => {
    if (currentOnboardingStep < onboardingSteps.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1)
    } else {
      closePopup()
    }
  }

  if (!authChecked) {
    return (
      <div 
        className="w-full min-h-screen max-w-screen overflow-hidden m-0 relative bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ 
          backgroundImage: "url('../../assets/BiGBackround.png')",
          boxSizing: 'border-box'
        }}
      >
        <div className="flex justify-center items-center min-h-[200px] text-[clamp(1rem,2vw,1.2rem)] text-gray-600">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="w-full min-h-screen max-w-screen overflow-hidden relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: "url('../../assets/BiGBackround.png')",
        boxSizing: 'border-box'
      }}
    >
      {/* Global styles for animations (kept as style tag since they're keyframes) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes bounce {
          from { transform: translateY(0px); }
          to { transform: translateY(-5px); }
        }
      `}</style>

      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000] animate-[fadeIn_0.3s_ease-out] p-5 box-border">
          <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-[500px] relative overflow-hidden animate-[slideUp_0.4s_ease-out]">
            <button 
              className="absolute top-[15px] right-[15px] bg-none border-none cursor-pointer text-gray-600 z-10 transition-colors duration-200 p-1 hover:text-gray-800"
              onClick={closePopup}
            >
              <X size={24} />
            </button>
            <div className="p-[clamp(20px,5vw,40px)_clamp(15px,4vw,30px)] text-center bg-gradient-to-br from-cream to-lightTan">
              <div className="text-[clamp(32px,6vw,48px)] mb-5 animate-[bounce_1s_ease_infinite_alternate]">
                {onboardingSteps[currentOnboardingStep].icon}
              </div>
              <h2 className="text-[clamp(1.2rem,3vw,1.5rem)] text-[#3e2723] font-semibold mb-[15px] pb-2">
                {onboardingSteps[currentOnboardingStep].title}
              </h2>
              <p className="mb-[15px] text-[#3e2723] leading-relaxed text-[clamp(0.9rem,2vw,1rem)]">
                {onboardingSteps[currentOnboardingStep].content}
              </p>
              <div className="flex justify-center my-[30px] gap-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === currentOnboardingStep 
                        ? 'bg-lightBrown scale-130' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-5 gap-2 flex-wrap">
                <button 
                  className="flex-1 min-w-[120px] py-3 px-6 rounded-lg cursor-pointer text-[clamp(0.8rem,2vw,0.9rem)] font-medium transition-all duration-200 border-2 border-lightBrown bg-transparent text-lightBrown hover:bg-lightBrown hover:text-white"
                  onClick={closePopup}
                >
                  Skip
                </button>
                <button 
                  className="flex-1 min-w-[120px] py-3 px-6 rounded-lg cursor-pointer text-[clamp(0.8rem,2vw,0.9rem)] font-medium transition-all duration-200 border-none bg-lightBrown text-white hover:bg-mediumBrown hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  onClick={handleNextStep}
                >
                  {currentOnboardingStep < onboardingSteps.length - 1 ? "Next" : "Get Started"} 
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-full p-0 px-8 m-0 box-border">
        {/* Pipeline Section */}
        <div 
          className="w-full max-w-full mb-1 bg-white/95 rounded-lg shadow-md box-border backdrop-blur-md"
        >
            <SupportDealFlowPipeline onStageClick={setStageFilter} />
        </div>

        {/* Tables Section */}
        <div 
          className="w-full max-w-full p-5 mb-5 bg-white/95 rounded-lg shadow-md box-border backdrop-blur-md"
        >
          <SupportTabbedTables 
            filters={filters} 
            stageFilter={stageFilter}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

export default function SupportDashboardPage() {
  return (
    <PortfolioProvider>
      <SupportDashboardContent />
    </PortfolioProvider>
  )
}