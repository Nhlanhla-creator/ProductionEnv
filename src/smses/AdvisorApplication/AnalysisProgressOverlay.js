"use client"

import { Brain, Check } from "lucide-react"

/**
 * AnalysisProgressOverlay — full-screen overlay showing real-time AI analysis progress.
 * Prevents user navigation while analysis is in-flight.
 */
const AnalysisProgressOverlay = ({ progress, isComplete = false }) => {
  if (!progress) return null

  const { current = 0, total = null } = progress
  const percentage = total ? Math.round((current / total) * 100) : 0
  const isLoading = !isComplete && total !== null

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
              <style>{`
                @keyframes scaleIn {
                  from { transform: scale(0); }
                  to { transform: scale(1); }
                }
              `}</style>
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
              <Brain size={36} color="white" />
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
          {isComplete ? "Analysis Complete!" : "Analyzing Advisors"}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            margin: "0 0 1.5rem 0",
            fontSize: "0.95rem",
            color: "#666",
            lineHeight: 1.5,
          }}
        >
          {isComplete
            ? "Your advisor matches are ready."
            : "Finding the best advisor matches for your request. This may take a moment."}
        </p>

        {/* Progress bar and counter */}
        {!isComplete && total !== null && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
                fontSize: "0.875rem",
              }}
            >
              <span style={{ color: "#666" }}>Analyzing advisors</span>
              <span
                style={{
                  fontWeight: 600,
                  color: "#a67c52",
                }}
              >
                {current} of {total}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 8,
                background: "#e0e0e0",
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  background: "linear-gradient(90deg, #a67c52, #7d5a50)",
                  borderRadius: 4,
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Percentage */}
            <p
              style={{
                margin: "0 0 1rem 0",
                fontSize: "0.875rem",
                color: "#999",
              }}
            >
              {percentage}% complete
            </p>
          </>
        )}

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
        {isComplete ? "Redirecting..." : "Analysis in progress"}
      </p>
    </div>
  )
}

export default AnalysisProgressOverlay