import React from "react"

const colors = {
  mediumBrown: "#e6d7c3",
  accentBrown: "#c8b6a6",
  textBrown: "#4a352f",
  backgroundBrown: "#faf7f2",
}

const items = [
  "Pilot Design",
  "Pilot Participants",
  "Results Insights",
  "Testimonials",
  "Case Studies",
]

const HEADER_HEIGHT = 72
const SIDEBAR_WIDTH = 280

const PilotsCaseStudies = () => {
  return (
    <div className="min-h-screen">
      <div
        className="fixed left-0 top-0 h-screen"
        style={{
          width: SIDEBAR_WIDTH,
          background: "linear-gradient(180deg, #2c1810 0%, #372C27 100%)",
        }}
      />

      <div
        style={{
          marginLeft: SIDEBAR_WIDTH,
          paddingTop: HEADER_HEIGHT,
          backgroundColor: colors.backgroundBrown,
          minHeight: "100vh",
        }}
        className="p-8"
      >
        <div
          style={{
            width: 260,
            backgroundColor: colors.mediumBrown,
            border: `1px solid ${colors.accentBrown}`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "12px 14px",
                borderBottom:
                  index !== items.length - 1
                    ? `1px solid ${colors.accentBrown}`
                    : "none",
                color: colors.textBrown,
                fontWeight: 500,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PilotsCaseStudies
