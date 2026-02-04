import React from "react"

const colors = {
  lightBrown: "#f5f0e1",
  mediumBrown: "#e6d7c3",
  accentBrown: "#c8b6a6",
  primaryBrown: "#a67c52",
  darkBrown: "#7d5a50",
  textBrown: "#4a352f",
  backgroundBrown: "#faf7f2",
}

const archiveItems = ["Archived Records"]

const SIDEBAR_WIDTH = 280
const HEADER_HEIGHT = 72

const Archive = () => {
  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 h-screen"
        style={{
          width: SIDEBAR_WIDTH,
          background: "linear-gradient(180deg, #2c1810 0%, #372C27 100%)",
        }}
      />

      {/* Main */}
      <div
        style={{
          marginLeft: SIDEBAR_WIDTH,
          paddingTop: HEADER_HEIGHT,
          backgroundColor: colors.backgroundBrown,
          minHeight: "100vh",
        }}
        className="p-8"
      >
        {/* Column */}
        <div
          style={{
            width: 260,
            backgroundColor: colors.mediumBrown,
            border: `1px solid ${colors.accentBrown}`,
          }}
        >
          {archiveItems.map((item, index) => (
            <div
              key={index}
              style={{
                padding: "12px 14px",
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

export default Archive
