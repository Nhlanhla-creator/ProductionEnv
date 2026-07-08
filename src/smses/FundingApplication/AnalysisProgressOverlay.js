"use client"

import { Brain, Search, Loader2, CheckCircle, Clock } from "lucide-react"

export default function AnalysisProgressOverlay({ progress, isComplete }) {
  if (!progress && !isComplete) return null

  const { stage, fundersCount } = progress || {}

  const stages = {
    gettingReady: {
      icon: <Brain size={32} />,
      title: "Getting Things Ready",
      subtitle: `Analyzing your application against ${fundersCount || ""} potential funders`,
      color: "#a67c52",
    },
    searching: {
      icon: <Search size={32} />,
      title: "Searching For Matches",
      subtitle: "Scanning funder profiles to find best matches",
      color: "#7d5a50",
    },
    wrappingUp: {
      icon: <Clock size={32} />,
      title: "Almost There",
      subtitle: "Finalizing match results",
      color: "#4a352f",
    },
  }

  const current = stages[stage] || stages.gettingReady

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #faf7f2 0%, #f5f0e1 100%)",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "420px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(74, 53, 47, 0.3)",
          animation: "fundingAnalysisSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${current.color}, ${current.color}dd)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            color: "white",
            animation: "fundingAnalysisPulse 2s ease-in-out infinite",
          }}
        >
          {isComplete ? <CheckCircle size={36} /> : current.icon}
        </div>

        <div
          style={{
            color: "#4a352f",
            fontSize: "22px",
            fontWeight: "700",
            margin: "0 0 8px 0",
          }}
        >
          {isComplete ? "Analysis Complete!" : current.title}
        </div>

        <p
          style={{
            color: "#7d5a50",
            fontSize: "14px",
            margin: "0 0 24px 0",
            lineHeight: "1.5",
          }}
        >
          {isComplete
            ? "Your matches are ready. Redirecting you now..."
            : current.subtitle}
        </p>

        {!isComplete && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: current.color,
                  opacity: 0.3,
                  animation: `fundingAnalysisBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        {isComplete && (
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "#e8d5c4",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #4CAF50, #2E7D32)",
                borderRadius: "2px",
                animation: "fundingAnalysisShrink 1.5s ease-in-out forwards",
              }}
            />
          </div>
        )}

        <style>{`
          @keyframes fundingAnalysisSlideUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes fundingAnalysisPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes fundingAnalysisBounce {
            0%, 80%, 100% { transform: scale(1); opacity: 0.3; }
            40% { transform: scale(1.3); opacity: 1; }
          }
          @keyframes fundingAnalysisShrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  )
}