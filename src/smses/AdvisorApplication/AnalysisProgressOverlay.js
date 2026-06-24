"use client"

import { Loader2, Check } from "lucide-react"

/**
 * AnalysisProgressOverlay — full-screen overlay showing timed AI analysis progress.
 * Prevents user navigation while analysis is in-flight.
 *
 * progress shape:
 *   { stage: "gettingReady" | "searching" | "wrappingUp", advisorsCount?: number }
 *
 * isComplete — when true, shows success checkmark and "Analysis Complete!"
 *
 * Stage → Display mapping:
 *   gettingReady → title="Getting Things Ready"    subtitle="Found {n} advisors"
 *   searching    → title="Searching For Matches"    subtitle="Analyzing {n} advisors"
 *   wrappingUp  → title="Almost There"             subtitle="Wrapping things up"
 */
const AnalysisProgressOverlay = ({ progress, isComplete = false }) => {
  if (!progress && !isComplete) return null

  const { stage = "gettingReady", advisorsCount = 0 } = progress || {}

  const stageConfig = {
    gettingReady: {
      title: "Getting Things Ready",
      subtitle: advisorsCount ? `Found ${advisorsCount} advisors` : "Preparing data",
    },
    searching: {
      title: "Searching For Matches",
      subtitle: advisorsCount ? `Analyzing ${advisorsCount} advisors` : "Analyzing advisors",
    },
    wrappingUp: {
      title: "Almost There",
      subtitle: "Wrapping things up",
    },
  }

  const { title, subtitle } = isComplete
    ? { title: "Analysis Complete!", subtitle: "Your advisory matches are ready." }
    : stageConfig[stage] || stageConfig.gettingReady

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.65)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        backdropFilter: "blur(2px)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "3rem 2.5rem",
          maxWidth: 420,
          width: "90%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          animation: isComplete ? "none" : "pulse 2s ease-in-out infinite",
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.5rem",
          }}
        >
          {isComplete ? (
            <div
              style={{
                width: 64,
                height: 64,
                background: "linear-gradient(135deg, #388E3C, #2E7D32)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <Check size={36} color="white" />
            </div>
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                background: "linear-gradient(135deg, #a67c52, #7d5a50)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "spin 1.5s linear infinite",
              }}
            >
              <Loader2 size={36} color="white" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "0.95rem",
            color: "#666",
            lineHeight: 1.5,
            minHeight: "1.5em",
          }}
        >
          {subtitle}
        </p>

        {/* Status message */}
        {!isComplete && (
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: "#999",
              fontStyle: "italic",
            }}
          >
            Please don't leave this page
          </p>
        )}
      </div>

      {/* Bottom hint */}
      <p
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "0.8rem",
          margin: 0,
        }}
      >
        {isComplete ? "Redirecting..." : `${subtitle}...`}
      </p>
    </div>
  )
}

export default AnalysisProgressOverlay