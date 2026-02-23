/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        darkBrown: "#372C27",
        mediumBrown: "#5D4037",
        lightBrown: "#8D6E63",
        accentGold: "#A67C52",
        primaryBrown: "#A67C52",
        offWhite: "#F5F2F0",
        cream: "#EFEBE9",
        lightTan: "#D7CCC8",
        darkText: "#2C2927",
        lightText: "#F5F2F0",
        warmBrown: "#7d5a50",
        textBrown: "#4a352f",
        gradientStart: "#4A352F",
        gradientEnd: "#7D5A50",
        backgroundBrown: "#faf7f2",
        paleBrown: "#f0e6d9",
        trialBrown: "#8D6E63",
      },
      backgroundImage: {
        "sidebar-gradient": "linear-gradient(180deg, #4A352F 0%, #7D5A50 100%)",
        "discover-card":    "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
        "engage-card":      "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
        "partner-card":     "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
        "metric-accent":    "linear-gradient(135deg, #A67C52 0%, #8D6E63 100%)",
        // Shimmer sweep gradients — used via bg-shimmer-light / bg-shimmer-mid / bg-shimmer-dark
        "shimmer-light": "linear-gradient(90deg, #ddd0c8 25%, #ede3dc 50%, #ddd0c8 75%)",
        "shimmer-mid":   "linear-gradient(90deg, #c9b5ab 25%, #d9c5bb 50%, #c9b5ab 75%)",
        "shimmer-dark":  "linear-gradient(90deg, #5a3e36 25%, #6b4a40 50%, #5a3e36 75%)",
      },
      backgroundSize: {
        "shimmer": "200% 100%",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.5" },
        },
      },
      animation: {
        "shimmer":    "shimmer 1.8s infinite linear",
        "pulse-glow": "pulse-glow 1.8s ease-in-out infinite",
        // Delay variants for staggered skeletons
        "shimmer-d1": "shimmer 1.8s 0.12s infinite linear",
        "shimmer-d2": "shimmer 1.8s 0.24s infinite linear",
        "shimmer-d3": "shimmer 1.8s 0.36s infinite linear",
        "shimmer-d4": "shimmer 1.8s 0.48s infinite linear",
        "shimmer-d5": "shimmer 1.8s 0.60s infinite linear",
      },
    },
  },
  plugins: [],
};