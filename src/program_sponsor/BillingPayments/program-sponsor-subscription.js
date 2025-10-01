"use client"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore"
// Remove the actions import since you've fixed it separately
import { saveToFirebase, updateCurrentPlan } from "./actions"
import { useNavigate } from "react-router-dom"

const createSubscriptionCheckout = async (
  amount,
  currency,
  userId,
  planName,
  billingCycle,
  actionType = "subscription",
) => {
  try {
    console.log("🔄 Creating subscription checkout:", { amount, currency, userId, planName, billingCycle, actionType })

    // Use the NEW subscription endpoint for PeachPayments
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        planName,
        billingCycle,
        amount,
        currency,
        customerEmail: getAuth().currentUser?.email,
        customerName: getAuth().currentUser?.displayName,
        actionType,
      }),
    })

    const data = await response.json()
    console.log("✅ Subscription checkout response:", data)

    if (!data.success) {
      throw new Error(data.error || "Failed to create subscription checkout")
    }

    return data
  } catch (error) {
    console.error("❌ Subscription checkout error:", error)
    throw error
  }
}

const createOneTimeCheckout = async (amount, currency, userId, planName, billingCycle, actionType = "one_time") => {
  try {
    console.log("💳 Creating one-time checkout:", { amount, currency, userId, planName, billingCycle, actionType })

    // Use the existing checkout endpoint for one-time payments
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        planName,
        billingCycle,
        amount,
        currency,
        customerEmail: getAuth().currentUser?.email,
        customerName: getAuth().currentUser?.displayName,
        actionType,
      }),
    })

    const data = await response.json()
    console.log("✅ One-time checkout response:", data)

    if (!data.success) {
      throw new Error(data.error || "Failed to create one-time checkout")
    }

    return data
  } catch (error) {
    console.error("❌ One-time checkout error:", error)
    throw error
  }
}

// Define your color palette
const colors = {
  darkBrown: "#372C27",
  mediumBrown: "#5D4037",
  lightBrown: "#8D6E63",
  accentGold: "#A67C52",
  offWhite: "#F5F2F0",
  cream: "#EFEBE9",
  lightTan: "#D7CCC8",
  darkText: "#2C2927",
  lightText: "#F5F2F0",
  gradientStart: "#4A352F",
  gradientEnd: "#7D5A50",
  // Card specific gradients for Program Sponsors
  discoverCardBg: "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
  engageCardBg: "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
  partnerCardBg: "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
  featureCheck: "#A67C52",
  featureCross: "#D32F2F",
}

const ProgramSponsorSubscriptions = ({ sidebarOpen = true, sidebarWidth = 280, onSidebarToggle }) => {
  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser
  const navigate = useNavigate()

  // Enhanced state for subscription management
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [upgradeDowngradeAction, setUpgradeDowngradeAction] = useState(null)
  const [showPlanChangeConfirm, setShowPlanChangeConfirm] = useState(false)
  const [showDowngradeOptions, setShowDowngradeOptions] = useState(false)
  const [hoveredPlan, setHoveredPlan] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // Internal sidebar state
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true)
  const [internalSidebarWidth, setInternalSidebarWidth] = useState(280)

  // Use props if provided, otherwise use internal state
  const currentSidebarOpen = sidebarOpen !== undefined ? sidebarOpen : internalSidebarOpen
  const currentSidebarWidth = sidebarWidth !== undefined ? sidebarWidth : internalSidebarWidth

  const plans = {
    discover: {
      name: "Discover",
      price: { monthly: 0, annually: 0 },
      currency: "ZAR",
      description: "Essential features for getting started.",
      features: {
        "Access to BIG Score Profiles": "View public SME profiles",
        "Funder/Buyer Matching Tools": false,
        "Submit Funding/ESD Criteria": false,
        "Deal Room Participation": false,
        "Analytics Dashboard": false,
        "Custom Reporting": false,
        "Mentorship Participation": false,
        "Brand Visibility (on platform)": false,
        "Pilot Program Participation": false,
        "Priority Support": false,
        "Annual Event Access (BIG Pulse etc.)": false,
      },
      highlights: ["View public SME profiles", "Standard search functionality", "Email support"],
    },
    engage: {
      name: "Engage",
      price: { monthly: 2000, annually: 20000 },
      currency: "ZAR",
      description: "Everything in Discover Plan + Engage Plan",
      features: {
        "Access to BIG Score Profiles": "Full profile access + filters",
        "Funder/Buyer Matching Tools": "Smart filters (stage, sector, score)",
        "Submit Funding/ESD Criteria": "Via smart intake form",
        "Deal Room Participation": "Join SME deal rooms by invite",
        "Analytics Dashboard": "Basic insights (SME profiles viewed)",
        "Custom Reporting": false,
        "Mentorship Participation": "Invite to mentor SMEs (opt-in)",
        "Brand Visibility (on platform)": "Logo in partner list",
        "Pilot Program Participation": "Invite only",
        "Priority Support": "Email",
        "Annual Event Access (BIG Pulse etc.)": "1 free ticket",
      },
      highlights: [
        "Full profile access + filters",
        "Smart filters (stage, sector, score)",
        "Join SME deal rooms by invite",
        "Basic insights dashboard",
      ],
    },
    partner: {
      name: "Partner",
      price: { monthly: 6500, annually: 65000 },
      currency: "ZAR",
      description: "Everything in Discover Plan + Partner",
      features: {
        "Access to BIG Score Profiles": "Full access + private deal room",
        "Funder/Buyer Matching Tools": "Priority-matching dashboard + alerts",
        "Submit Funding/ESD Criteria": "API integration + automated screening",
        "Deal Room Participation": "Create private deal rooms & invite SMEs",
        "Analytics Dashboard": "Full engagement metrics + conversion data",
        "Custom Reporting": "Quarterly impact or portfolio reports",
        "Mentorship Participation": "Featured mentor + visibility boost",
        "Brand Visibility (on platform)": "Logo + featured spotlight, homepage links",
        "Pilot Program Participation": "Guaranteed inclusion in funded pilots",
        "Priority Support": "Dedicated account manager",
        "Annual Event Access (BIG Pulse etc.)": "3 VIP tickets + speaking opportunities",
      },
      highlights: [
        "Full access + private deal room",
        "Priority-matching dashboard + alerts",
        "Create private deal rooms & invite SMEs",
        "Full engagement metrics + conversion data",
        "Dedicated account manager",
      ],
    },
  }

  // UPDATED: Feature order matching your screenshot
  const featureOrder = [
    "Access to BIG Score Profiles",
    "Funder/Buyer Matching Tools",
    "Submit Funding/ESD Criteria",
    "Deal Room Participation",
    "Analytics Dashboard",
    "Custom Reporting",
    "Mentorship Participation",
    "Brand Visibility (on platform)",
    "Pilot Program Participation",
    "Priority Support",
    "Annual Event Access (BIG Pulse etc.)",
  ]

  const [selectedPlan, setSelectedPlan] = useState("discover")
  const [billingCycle, setBillingCycle] = useState("monthly") // UPDATED: Now stateful
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [history, setHistory] = useState([])
  const [errors, setErrors] = useState({})
  const [showBillingInfo, setShowBillingInfo] = useState(false)

  // Dynamic styles based on sidebar state
  const styles = {
    container: {
      width: "100%",
      minHeight: "100vh",
      padding: "1rem",
      background: colors.offWhite, // Use defined color
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      boxSizing: "border-box",
      marginLeft: currentSidebarOpen ? `${currentSidebarWidth}px` : "0px",
      width: currentSidebarOpen ? `calc(100% - ${currentSidebarWidth}px)` : "100%",
      transition: "all 0.3s ease",
    },
    mainCard: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, // Use defined colors
      borderRadius: "24px",
      padding: "clamp(1rem, 3vw, 2rem)",
      boxShadow: `0 20px 60px ${colors.darkBrown}15, 0 8px 24px ${colors.darkBrown}0A`, // Use defined colors
      border: `1px solid ${colors.lightTan}`, // Use defined color
      position: "relative",
      overflow: "hidden",
      maxWidth: "100%",
      margin: "0 auto",
    },
    decorativeElement: {
      position: "absolute",
      top: "-100px",
      right: "-100px",
      width: "300px",
      height: "300px",
      background: `radial-gradient(circle, ${colors.accentGold}14 0%, transparent 70%)`, // Use defined color
      borderRadius: "50%",
      pointerEvents: "none",
    },
    pageTitle: {
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      fontWeight: 800,
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      color: "transparent",
      textAlign: "center",
      marginBottom: "1rem",
      letterSpacing: "-1.5px",
      lineHeight: "1.2",
    },
    subtitle: {
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      color: colors.mediumBrown, // Use defined color
      textAlign: "center",
      marginBottom: "3rem",
      fontWeight: 400,
      opacity: 0.9,
    },
    betaNotice: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, // Use defined colors
      color: colors.darkBrown, // Use defined color
      border: `2px solid ${colors.lightBrown}`, // Use defined color
      borderRadius: "16px",
      padding: "1.5rem 2rem",
      margin: "0 auto 3rem auto",
      maxWidth: "800px",
      fontWeight: 600,
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      textAlign: "center",
      boxShadow: `0 8px 24px ${colors.accentGold}1F`, // Use defined color
      position: "relative",
    },
    betaIcon: {
      display: "inline-block",
      marginRight: "0.5rem",
      fontSize: "1.25rem",
    },
    // NEW: Billing cycle toggle styles
    billingToggleContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "2rem auto",
      gap: "1rem",
    },
    billingToggle: {
      display: "flex",
      background: colors.cream, // Use defined color
      borderRadius: "12px",
      padding: "4px",
      border: `1px solid ${colors.lightTan}`, // Use defined color
      boxShadow: `0 4px 12px ${colors.darkBrown}0A`, // Use defined color
    },
    billingToggleOption: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      color: colors.mediumBrown, // Use defined color
      position: "relative",
    },
    billingToggleActive: {
      background: colors.accentGold, // Use defined color
      color: colors.lightText, // Use defined color
      boxShadow: `0 2px 8px ${colors.accentGold}33`, // Use defined color
    },
    savingsBadge: {
      background: colors.mediumBrown, // Use defined color
      color: colors.lightText, // Use defined color
      fontSize: "0.75rem",
      padding: "0.25rem 0.5rem",
      borderRadius: "6px",
      fontWeight: 700,
      marginLeft: "0.5rem",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    featureComparisonContainer: {
      margin: "3rem auto",
      maxWidth: "100%",
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, // Use defined colors
      borderRadius: "20px",
      padding: "1.5rem",
      boxShadow: `0 12px 40px ${colors.darkBrown}0A`, // Use defined color
      border: `1px solid ${colors.lightTan}`, // Use defined color
      overflow: "auto",
    },
    featureComparisonTitle: {
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
      fontWeight: 700,
      color: colors.darkBrown, // Use defined color
      marginBottom: "2rem",
      textAlign: "center",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      alignItems: "center",
    },
    featureComparisonTable: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      background: colors.offWhite, // Use defined color
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: `0 4px 12px ${colors.darkBrown}0A`, // Use defined color
      border: `1px solid ${colors.lightTan}`, // Use defined color
      fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
    },
    featureTh: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, // Use defined colors
      fontWeight: 700,
      padding: "1rem",
      color: colors.darkBrown, // Use defined color
      fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
      borderBottom: `2px solid ${colors.lightTan}`, // Use defined color
      position: "relative",
    },
    featureTd: {
      padding: "0.75rem",
      textAlign: "center",
      fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
      color: colors.mediumBrown, // Use defined color
      borderBottom: `1px solid ${colors.lightTan}26`, // Use defined color
      transition: "background-color 0.2s ease",
    },
    featureTdLeft: {
      textAlign: "left",
      fontWeight: 600,
      color: colors.darkBrown, // Use defined color
    },
    planGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "1.5rem",
      margin: "3rem 0",
      justifyContent: "center",
      maxWidth: "100%",
    },
    planCard: {
      background: colors.offWhite,
      border: `1px solid ${colors.lightTan}`,
      borderRadius: "16px", // Slightly smaller radius for a cleaner look
      padding: "2rem", // Uniform padding
      textAlign: "center", // Center content for a cleaner look
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      boxShadow: `0 8px 24px ${colors.darkBrown}14`, // More pronounced shadow
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: "450px", // Ensure consistent height
    },
    planCardPopular: {
      background: colors.engageCardBg, // Darker, more impactful gradient for popular
      color: colors.lightText,
      transform: "scale(1.03)", // Slightly more prominent
      zIndex: 2,
      boxShadow: `0 20px 60px ${colors.darkBrown}33`,
      border: `1px solid ${colors.accentGold}`, // Accent border for popular
    },
    planCardHover: {
      transform: "translateY(-8px)", // More noticeable lift
      boxShadow: `0 16px 40px ${colors.darkBrown}26`,
    },
    planCardSelected: {
      border: `2px solid ${colors.accentGold}`,
      boxShadow: `0 12px 30px ${colors.accentGold}33`,
    },
    popularBadge: {
      position: "absolute",
      top: "1.5rem",
      right: "1.5rem",
      background: colors.accentGold,
      color: colors.lightText,
      padding: "0.4rem 1rem",
      borderRadius: "20px", // Pill shape
      fontSize: "0.8rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      boxShadow: `0 2px 8px ${colors.accentGold}4D`,
    },
    planName: {
      fontSize: "clamp(1.75rem, 3vw, 2.25rem)", // Larger name
      fontWeight: 800,
      marginBottom: "0.75rem",
      letterSpacing: "-1px",
      color: colors.darkBrown, // Default color
    },
    planPrice: {
      fontSize: "clamp(2.5rem, 4vw, 3.5rem)", // Very large price
      fontWeight: 900,
      marginBottom: "0.5rem",
      lineHeight: "1",
      color: colors.darkBrown, // Default color
    },
    planPricePeriod: {
      fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
      fontWeight: 500,
      opacity: 0.8,
      color: colors.mediumBrown, // Default color
    },
    planDescriptionText: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.mediumBrown,
      marginBottom: "2rem",
      lineHeight: "1.6",
    },
    freeMonthsBadge: {
      background: `linear-gradient(90deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      padding: "0.6rem 1.2rem",
      borderRadius: "10px",
      fontSize: "0.9rem",
      fontWeight: 600,
      marginBottom: "2rem",
      textAlign: "center",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`,
      display: "inline-block", // To center it with margin auto
    },
    planFeaturesList: {
      listStyle: "none",
      padding: "0",
      margin: "0 0 2.5rem 0", // More space before button
      flex: 1,
      textAlign: "left", // Align features to the left
    },
    planFeatureItem: {
      padding: "0.6rem 0",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      display: "flex",
      alignItems: "center",
      lineHeight: "1.5",
      color: colors.darkText,
    },
    featureIcon: {
      marginRight: "0.8rem",
      fontSize: "1.1rem",
      flexShrink: 0, // Prevent icon from shrinking
    },
    featureCheckIcon: {
      color: colors.featureCheck,
    },
    featureCrossIcon: {
      color: colors.featureCross,
    },
    currentPlanBadge: {
      display: "inline-block",
      background: colors.accentGold, // Use defined color
      color: colors.lightText, // Use defined color
      fontWeight: 600,
      borderRadius: "8px",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      letterSpacing: "0.5px",
    },
    selectedBadge: {
      display: "inline-block",
      background: colors.mediumBrown, // Use defined color
      color: colors.lightText, // Use defined color
      fontWeight: 600,
      borderRadius: "8px",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      letterSpacing: "0.5px",
    },
    selectButton: {
      width: "100%",
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "10px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: "clamp(1rem, 1.8vw, 1.1rem)",
      transition: "all 0.3s ease",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      marginTop: "auto",
      boxShadow: `0 6px 18px ${colors.accentGold}4D`,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    downgradeSection: {
      textAlign: "center",
      margin: "2.5rem auto",
      padding: "2rem",
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, // Use defined colors
      borderRadius: "16px",
      border: `1px solid ${colors.lightTan}`, // Use defined color
      maxWidth: "800px", // Constrain width
    },
    button: {
      padding: "1rem 2.5rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      margin: "0 0.75rem",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`, // Use defined color
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    buttonSecondary: {
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`, // Use defined colors
      color: colors.darkBrown, // Use defined color
      border: `2px solid ${colors.lightTan}`, // Use defined color
      fontWeight: 700,
      borderRadius: "12px",
      padding: "1rem 2.5rem",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      margin: "0 0.75rem",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.lightTan}33`, // Use defined color
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    buttonDowngrade: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      padding: "1rem 2.5rem",
      fontWeight: 700,
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      maxWidth: "250px",
      margin: "0 auto",
      display: "block",
      textAlign: "center",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`, // Use defined color
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    planChangeModal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: `${colors.darkBrown}66`, // Use defined color with transparency
      backdropFilter: "blur(8px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease",
      padding: "1rem",
      boxSizing: "border-box",
    },
    modalContent: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, // Use defined colors
      padding: "2rem",
      borderRadius: "24px",
      maxWidth: "500px",
      width: "100%",
      boxShadow: `0 24px 60px ${colors.darkBrown}33`, // Use defined color
      textAlign: "center",
      border: `1px solid ${colors.lightTan}`, // Use defined color
      position: "relative",
      maxHeight: "90vh",
      overflow: "auto",
    },
    modalTitle: {
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
      fontWeight: 800,
      color: colors.darkBrown, // Use defined color
      marginBottom: "1rem",
      letterSpacing: "-0.5px",
    },
    modalText: {
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      color: colors.mediumBrown, // Use defined color
      marginBottom: "2rem",
      lineHeight: "1.6",
    },
    modalActions: {
      display: "flex",
      justifyContent: "center",
      gap: "1rem",
      marginTop: "2rem",
      flexWrap: "wrap",
    },
    formContainerBillCentered: {
      display: "flex",
      justifyContent: "center",
      margin: "3rem auto",
      padding: "0 1rem",
    },
    formCardEnhanced: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, // Use defined colors
      padding: "2rem",
      borderRadius: "24px",
      boxShadow: `0 16px 40px ${colors.darkBrown}14`, // Use defined color
      width: "100%",
      maxWidth: "450px",
      textAlign: "center",
      border: `1px solid ${colors.lightTan}`, // Use defined color
    },
    payButtonEnhanced: {
      padding: "1.25rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      fontWeight: 700,
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      border: "none",
      borderRadius: "16px",
      cursor: "pointer",
      textAlign: "center",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.75rem",
      marginTop: "1.5rem",
      boxShadow: `0 8px 20px ${colors.accentGold}4D`, // Use defined color
      transition: "all 0.3s ease",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    payButtonEnhancedLoading: {
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`, // Use defined colors
      color: colors.mediumBrown, // Use defined color
      cursor: "not-allowed",
      boxShadow: `0 4px 12px ${colors.lightTan}33`, // Use defined color
    },
    navButtonContainer: {
      textAlign: "center",
      marginTop: "3rem",
      padding: "2rem",
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, // Use defined colors
      borderRadius: "16px",
      border: `1px solid ${colors.lightTan}`, // Use defined color
    },
    navButton: {
      display: "inline-block",
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`, // Use defined color
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`, // Use defined colors
      color: colors.darkBrown, // Use defined color
      border: `2px solid ${colors.lightTan}`, // Use defined color
      borderRadius: "12px",
      fontWeight: 600,
      fontSize: "clamp(0.85rem, 1.5vw, 0.95rem)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.lightTan}33`, // Use defined color
      marginBottom: "2rem",
    },
    contentWrapper: {
      transition: "opacity 0.3s ease, transform 0.3s ease",
    },
    fadeOut: {
      opacity: 0,
      transform: "translateY(-10px)",
    },
    fadeIn: {
      opacity: 1,
      transform: "translateY(0)",
    },
    sidebarToggleButton: {
      position: "fixed",
      top: "1rem",
      left: currentSidebarOpen ? `${currentSidebarWidth - 50}px` : "1rem",
      zIndex: 1001,
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`, // Use defined colors
      color: colors.lightText, // Use defined color
      border: "none",
      borderRadius: "8px",
      padding: "0.5rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 2px 8px ${colors.accentGold}4D`, // Use defined color
      display: "none", // Hidden by default, show only when needed
    },
  }

  // Load user subscription data
  const loadUserSubscription = async (userId) => {
    setIsLoading(true)
    try {
      // Query subscriptions collection for user's active subscription
      const subscriptionsRef = collection(db, "subscriptions")
      const q = query(
        subscriptionsRef,
        where("userId", "==", userId),
        where("status", "in", ["Success", "Paid", "Active"]),
      )
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        // Get the most recent subscription
        const subscriptions = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        const latestSubscription = subscriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        setCurrentSubscription(latestSubscription)
        setIsExistingUser(true)
        setSelectedPlan(latestSubscription.plan.toLowerCase())
      }
    } catch (error) {
      console.error("Error loading subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Billing cycle toggle component
  const BillingCycleToggle = () => (
    <div style={styles.billingToggleContainer}>
      <span style={{ color: colors.mediumBrown, fontWeight: 600, marginRight: "1rem" }}>Billing:</span>
      <div style={styles.billingToggle}>
        <div
          style={{
            ...styles.billingToggleOption,
            ...(billingCycle === "monthly" ? styles.billingToggleActive : {}),
          }}
          onClick={() => setBillingCycle("monthly")}
        >
          Monthly
        </div>
        <div
          style={{
            ...styles.billingToggleOption,
            ...(billingCycle === "annually" ? styles.billingToggleActive : {}),
          }}
          onClick={() => setBillingCycle("annually")}
        >
          Annual
          <span style={styles.savingsBadge}>Save up to R13k</span>
        </div>
      </div>
    </div>
  )

  // UPDATED: Feature comparison table component with correct plan keys and detailed descriptions
  const FeatureComparisonTable = () => (
    <div style={styles.featureComparisonContainer}>
      <div style={styles.featureComparisonTitle}>
        <span>Plan Features Comparison</span>
      </div>
      {/* Add billing cycle toggle */}
      <BillingCycleToggle />
      <div style={{ overflowX: "auto" }}>
        <table style={styles.featureComparisonTable}>
          <thead>
            <tr>
              <th style={styles.featureTh}>Feature</th>
              <th style={styles.featureTh}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: colors.discoverCardBg.split(" ")[2],
                      borderRadius: "50%",
                    }}
                  ></div>
                  Discover (Free)
                </div>
              </th>
              <th style={styles.featureTh}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: colors.engageCardBg.split(" ")[2],
                      borderRadius: "50%",
                    }}
                  ></div>
                  Engage (R{plans.engage.price[billingCycle].toLocaleString()}/
                  {billingCycle === "monthly" ? "month" : "year"})
                </div>
              </th>
              <th style={styles.featureTh}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      background: colors.partnerCardBg.split(" ")[2],
                      borderRadius: "50%",
                    }}
                  ></div>
                  Partner (R{plans.partner.price[billingCycle].toLocaleString()}/
                  {billingCycle === "monthly" ? "month" : "year"})
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {featureOrder.map((feature, index) => (
              <tr key={feature} style={{ backgroundColor: index % 2 === 0 ? `${colors.cream}4D` : "transparent" }}>
                <td style={{ ...styles.featureTd, ...styles.featureTdLeft }}>{feature}</td>
                <td style={styles.featureTd}>
                  {typeof plans.discover.features[feature] === "boolean" ? (
                    plans.discover.features[feature] ? (
                      <span style={{ color: colors.darkBrown, fontWeight: "bold" }}>✓</span>
                    ) : (
                      <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                    )
                  ) : (
                    <span style={{ fontSize: "0.9rem", color: colors.mediumBrown }}>
                      {plans.discover.features[feature]}
                    </span>
                  )}
                </td>
                <td style={styles.featureTd}>
                  {typeof plans.engage.features[feature] === "boolean" ? (
                    plans.engage.features[feature] ? (
                      <span style={{ color: colors.darkBrown, fontWeight: "bold" }}>✓</span>
                    ) : (
                      <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                    )
                  ) : (
                    <span style={{ fontSize: "0.9rem", color: colors.mediumBrown }}>
                      {plans.engage.features[feature]}
                    </span>
                  )}
                </td>
                <td style={styles.featureTd}>
                  {typeof plans.partner.features[feature] === "boolean" ? (
                    plans.partner.features[feature] ? (
                      <span style={{ color: colors.darkBrown, fontWeight: "bold" }}>✓</span>
                    ) : (
                      <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                    )
                  ) : (
                    <span style={{ fontSize: "0.9rem", color: colors.mediumBrown }}>
                      {plans.partner.features[feature]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pricing summary table */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: colors.cream,
          borderRadius: "12px",
          border: `1px solid ${colors.lightTan}`,
        }}
      >
        <h3 style={{ color: colors.darkBrown, marginBottom: "1rem", textAlign: "center" }}>Pricing Summary</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
          <div>
            <div style={{ fontWeight: 700, color: colors.darkBrown, marginBottom: "0.5rem" }}>Discover</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.darkBrown }}>R0</div>
            <div style={{ fontSize: "0.85rem", color: colors.mediumBrown }}>N/A</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: colors.darkBrown, marginBottom: "0.5rem" }}>Engage</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.darkBrown }}>
              R{plans.engage.price[billingCycle].toLocaleString()}
            </div>
            <div style={{ fontSize: "0.85rem", color: colors.mediumBrown }}>
              {billingCycle === "annually" ? "per year (save R4,000)" : "per month"}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: colors.darkBrown, marginBottom: "0.5rem" }}>Partner</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: colors.darkBrown }}>
              R{plans.partner.price[billingCycle].toLocaleString()}
            </div>
            <div style={{ fontSize: "0.85rem", color: colors.mediumBrown }}>
              {billingCycle === "annually" ? "per year (save R13,000)" : "per month"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  useEffect(() => {
    if (user) {
      setEmail(user.email)
      loadUserSubscription(user.uid)
      // Fetch transaction history from Firestore
      fetchUserTransactions(user.uid)
      // Load company name if available
      const userRef = doc(db, "users", user.uid)
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().company) {
          setCompanyName(docSnap.data().company)
        }
      })
    }
  }, [user])

  const validate = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) newErrors.email = "Email is required"
    else if (!emailRegex.test(email)) newErrors.email = "Enter a valid email"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlanSelect = (planKey) => {
    if (isExistingUser && currentSubscription) {
      const currentPlanKey = currentSubscription.plan.toLowerCase()
      if (planKey !== currentPlanKey) {
        setSelectedPlan(planKey)
        // Determine if it's upgrade or downgrade
        const planOrder = { discover: 0, engage: 1, partner: 2 }
        const action = planOrder[planKey] > planOrder[currentPlanKey] ? "upgrade" : "downgrade"
        setUpgradeDowngradeAction(action)
        setShowPlanChangeConfirm(true)
        setShowDowngradeOptions(false)
        window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top when modal opens
      }
    } else {
      setSelectedPlan(planKey)
      setErrors({})
    }
  }

  const handleDowngradeClick = () => {
    setShowDowngradeOptions(true)
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top when modal opens
  }

  const handleDowngradeSelect = (targetPlan) => {
    setSelectedPlan(targetPlan)
    setUpgradeDowngradeAction("downgrade")
    setShowDowngradeOptions(false)
    setShowPlanChangeConfirm(true)
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top when modal opens
  }

  const cancelDowngradeOptions = () => {
    setShowDowngradeOptions(false)
  }

  const confirmPlanChange = () => {
    console.log("=== CONFIRM PLAN CHANGE DEBUG ===")
    console.log("upgradeDowngradeAction:", upgradeDowngradeAction)
    console.log("selectedPlan:", selectedPlan)
    console.log("currentSubscription:", currentSubscription)

    if (upgradeDowngradeAction === "downgrade" && selectedPlan === "discover") {
      console.log("Calling handleDowngradeToFree...")
      handleDowngradeToFree()
    } else if (upgradeDowngradeAction === "downgrade") {
      console.log("Calling handleUpgradePayment for paid downgrade...")
      // Handle paid downgrade (like Partner to Engage)
      handleUpgradePayment()
    } else {
      console.log("Calling handleUpgradePayment for upgrade...")
      // Handle upgrade
      setShowPlanChangeConfirm(false)
      handleUpgradePayment()
    }
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top when modal opens
  }

  const handleDowngradeToFree = async () => {
    try {
      const transactionIndex = history.length
      const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex)
      const newRecord = {
        id: uuidv4(),
        email,
        plan: plans[selectedPlan].name,
        cycle: billingCycle,
        amount: 0,
        fullName,
        companyName,
        createdAt: new Date().toISOString(),
        status: "Active",
        autoRenew: true,
        userId: user.uid,
        action: "downgrade",
        invoiceNumber,
      }
      // Save the transaction record
      await saveToFirebase(newRecord)

      // Update subscription in database
      await updateSubscriptionInDatabase({
        plan: plans[selectedPlan].name,
        amount: 0,
        status: "Active",
        lastModified: new Date().toISOString(),
        userId: user.uid,
      })

      // Update user's current plan
      await updateCurrentPlan(plans[selectedPlan].name, billingCycle)

      // Update local state
      setHistory([newRecord, ...history])
      setCurrentSubscription({
        id: newRecord.id,
        ...newRecord,
      })
      alert(`Successfully downgraded to ${plans[selectedPlan].name} plan!`)
      setShowPlanChangeConfirm(false)
      setUpgradeDowngradeAction(null)
    } catch (error) {
      console.error("Error in handleDowngradeToFree:", error)
      alert("An error occurred during downgrade. Please try again.")
    }
  }

  const [paystackLoaded, setPaystackLoaded] = useState(false)
  const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.onload = () => {
      setPaystackLoaded(true)
    }
    script.onerror = () => {
      console.error("Failed to load Paystack inline script.")
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleUpgradePayment = async () => {
    if (!validate()) return
    if (!paystackLoaded || !window.PaystackPop) {
      alert("Payment system is still loading. Please wait a moment and try again.")
      return
    }

    console.log("Initializing Paystack payment for upgrade...")
    try {
      const planPrice = plans[selectedPlan].price[billingCycle]
      const paystackConfig = {
        key: publicKey,
        email: email,
        amount: planPrice * 100,
        currency: "ZAR",
        ref: `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          custom_fields: [
            { display_name: "Full Name", variable_name: "full_name", value: fullName },
            { display_name: "Company Name", variable_name: "company_name", value: companyName },
            { display_name: "Plan", variable_name: "subscription_plan", value: plans[selectedPlan].name },
            { display_name: "Cycle", variable_name: "billing_cycle", value: billingCycle },
            { display_name: "Action", variable_name: "action", value: upgradeDowngradeAction },
            { display_name: "Previous Plan", variable_name: "previous_plan", value: currentSubscription?.plan },
          ],
        },
        callback: (response) => {
          console.log("Payment successful:", response)
          handleUpgradeSuccess(response, planPrice)
        },
        onClose: () => {
          console.log("Payment modal closed")
          handleUpgradeClose()
        },
      }
      console.log("Paystack config:", paystackConfig)
      const handler = window.PaystackPop.setup(paystackConfig)
      if (handler && typeof handler.openIframe === "function") {
        handler.openIframe()
      } else {
        throw new Error("Paystack handler not properly initialized")
      }
    } catch (error) {
      console.error("Payment initialization error:", error)
      alert("Failed to initialize payment. Please try again or refresh the page.")
    }
  }

  const handleUpgradeSuccess = async (response, amountPaid) => {
    const transactionIndex = history.length
    const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex)
    const newRecord = {
      id: uuidv4(),
      email,
      plan: plans[selectedPlan].name,
      cycle: billingCycle,
      amount: amountPaid,
      fullName,
      companyName,
      createdAt: new Date().toISOString(),
      status: "Paid",
      autoRenew: true,
      transactionRef: response.reference,
      userId: user.uid,
      action: upgradeDowngradeAction,
      invoiceNumber,
    }
    setHistory([newRecord, ...history])
    await saveToFirebase(newRecord)
    await updateCurrentPlan(plans[selectedPlan].name, billingCycle)
    await updateSubscriptionInDatabase({
      plan: plans[selectedPlan].name,
      amount: amountPaid,
      status: "Paid",
      transactionRef: response.reference,
      lastModified: new Date().toISOString(),
    })

    // Update the current subscription state immediately
    setCurrentSubscription({
      ...currentSubscription,
      plan: plans[selectedPlan].name,
      amount: amountPaid,
      status: "Paid",
      transactionRef: response.reference,
    })
    alert(`Payment successful! Your plan has been ${upgradeDowngradeAction}d to ${plans[selectedPlan].name}.`)
    // Reload the user subscription to ensure sync
    setTimeout(() => {
      loadUserSubscription(user.uid)
    }, 1000)
  }

  const handleUpgradeClose = () => {
    alert("Payment cancelled")
  }

  const updateSubscriptionInDatabase = async (subscriptionData) => {
    try {
      if (currentSubscription && currentSubscription.id) {
        // Update existing subscription
        const subscriptionRef = doc(db, "subscriptions", currentSubscription.id)
        await updateDoc(subscriptionRef, subscriptionData)
        console.log("Updated existing subscription:", currentSubscription.id)
      } else {
        // Create new subscription document
        const subscriptionsRef = collection(db, "subscriptions")
        const newSubscriptionData = {
          ...subscriptionData,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        }
        const docRef = await addDoc(subscriptionsRef, newSubscriptionData)
        console.log("Created new subscription:", docRef.id)
        // Update currentSubscription state with new document ID
        setCurrentSubscription({
          id: docRef.id,
          ...newSubscriptionData,
        })
      }
      return true
    } catch (error) {
      console.error("Error updating/creating subscription:", error)
      console.error("Error details:", error.message)
      return false
    }
  }

  const cancelPlanChange = () => {
    setSelectedPlan(currentSubscription.plan.toLowerCase())
    setShowPlanChangeConfirm(false)
    setShowDowngradeOptions(false)
    setUpgradeDowngradeAction(null)
  }

  const handlePay = async () => {
    const planPrice = plans[selectedPlan].price[billingCycle]
    if (selectedPlan === "discover") {
      try {
        const transactionIndex = history.length
        const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex)
        const newRecord = {
          id: uuidv4(),
          email,
          plan: plans[selectedPlan].name,
          cycle: billingCycle,
          amount: 0,
          fullName,
          companyName,
          createdAt: new Date().toISOString(),
          status: "Active",
          autoRenew: true,
          userId: user.uid,
          invoiceNumber,
        }
        // Save to Firebase
        await saveToFirebase(newRecord)

        // Update current plan in user document
        await updateCurrentPlan(plans[selectedPlan].name, billingCycle)

        // Update subscription in subscriptions collection
        await updateSubscriptionInDatabase({
          plan: plans[selectedPlan].name,
          amount: 0,
          status: "Active",
          lastModified: new Date().toISOString(),
          userId: user.uid,
        })

        // Update local state
        setHistory([newRecord, ...history])
        setCurrentSubscription({
          id: newRecord.id,
          ...newRecord,
        })
        alert("Discover plan activated successfully!")
        return
      } catch (error) {
        console.error("Error activating Discover plan:", error)
        alert("Failed to activate Discover plan. Please try again.")
        return
      }
    }

    // Rest of the payment handling for paid plans...
    if (!validate()) return
    if (!paystackLoaded || !window.PaystackPop) {
      alert("Payment system is still loading. Please wait a moment and try again.")
      return
    }

    console.log("Initializing Paystack payment for new subscription...")
    try {
      const paystackConfig = {
        key: publicKey,
        email: email,
        amount: planPrice * 100,
        currency: "ZAR",
        ref: `new_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          custom_fields: [
            { display_name: "Full Name", variable_name: "full_name", value: fullName || "Not provided" },
            { display_name: "Company Name", variable_name: "company_name", value: companyName || "Not provided" },
            { display_name: "Plan", variable_name: "subscription_plan", value: plans[selectedPlan].name },
            { display_name: "Cycle", variable_name: "billing_cycle", value: billingCycle },
          ],
        },
        callback: (response) => {
          console.log("Payment successful:", response)
          handleSuccess(response, planPrice)
        },
        onClose: () => {
          console.log("Payment modal closed")
          handleClose()
        },
      }
      console.log("Paystack config:", paystackConfig)
      const handler = window.PaystackPop.setup(paystackConfig)
      if (handler && typeof handler.openIframe === "function") {
        handler.openIframe()
      } else {
        throw new Error("Paystack handler not properly initialized")
      }
    } catch (error) {
      console.error("Payment initialization error:", error)
      alert("Failed to initialize payment. Please try again or refresh the page.")
    }
  }

  const handleSuccess = async (response, amountPaid) => {
    const transactionIndex = history.length
    const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex)
    const newRecord = {
      id: uuidv4(),
      email,
      plan: plans[selectedPlan].name,
      cycle: billingCycle,
      amount: amountPaid,
      fullName,
      companyName,
      createdAt: new Date().toISOString(),
      status: "Paid",
      autoRenew: true,
      transactionRef: response.reference,
      userId: user.uid,
      invoiceNumber,
    }
    setHistory([newRecord, ...history])
    await saveToFirebase(newRecord)
    await updateCurrentPlan(plans[selectedPlan].name, billingCycle)
    alert("Payment successful! Your plan is now active.")
  }

  const handleClose = () => {
    const newRecord = {
      id: uuidv4(),
      email,
      plan: plans[selectedPlan].name,
      amount: plans[selectedPlan].price[billingCycle],
      fullName,
      companyName,
      createdAt: new Date().toISOString(),
      status: "Cancelled",
      reason: "Payment cancelled by user",
      userId: user.uid,
    }
    setHistory([newRecord, ...history])
    alert("Payment cancelled")
  }

  const saveToFirebase = async (record) => {
    if (!user) {
      console.error("No user found when saving to Firebase")
      return false
    }
    try {
      console.log("Saving record to Firebase:", record)
      // Save to subscriptions collection
      const subscriptionsRef = collection(db, "subscriptions")
      const docRef = await addDoc(subscriptionsRef, record)
      console.log("Saved to subscriptions collection:", docRef.id)

      // Also save to user's subscription history
      const userSubscriptionsRef = collection(db, "users", user.uid, "subscriptions")
      await addDoc(userSubscriptionsRef, record)
      console.log("Saved to user's subscription history")
      return true
    } catch (error) {
      console.error("Error saving to Firebase:", error)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      return false
    }
  }

  const updateCurrentPlan = async (planName, cycle) => {
    if (!user) return
    try {
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        currentPlan: {
          name: planName,
          cycle: cycle,
          activeSince: new Date().toISOString(),
          status: "active",
          lastPaymentDate: new Date().toISOString(),
        },
        planUpdatedAt: new Date().toISOString(),
      })
      console.log("User plan updated successfully")
    } catch (error) {
      console.error("Error updating current plan:", error)
    }
  }

  const generateInvoiceNumber = (userInfo, transactionIndex) => {
    const { companyName, fullName } = userInfo
    const base = companyName || fullName || "BD"
    const shortBase = base
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const index = (transactionIndex + 1).toString().padStart(4, "0")
    return `${shortBase}-${year}${month}-${index}`
  }

  const generateInvoicePDF = (transaction) => {
    console.log("Generating PDF for transaction:", transaction)
    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error("jsPDF not available")
      throw new Error("PDF library not loaded")
    }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    try {
      // Add company logo and info
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text("BIG DealFlow", 105, 20, { align: "center" })
      doc.setFontSize(12)
      doc.text("123 Business Street, Johannesburg, South Africa", 105, 28, { align: "center" })
      doc.text("VAT: 123456789 | Tel: +27 11 123 4567", 105, 34, { align: "center" })

      // Add invoice title
      doc.setFontSize(16)
      doc.text(`INVOICE #${transaction.invoiceNumber || transaction.id.slice(0, 8)}`, 105, 45, { align: "center" })

      // Add dates
      doc.setFontSize(10)
      const invoiceDate = new Date(transaction.createdAt)
      const dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      doc.text(`Date: ${invoiceDate.toLocaleDateString()}`, 15, 55)
      doc.text(`Due Date: ${dueDate.toLocaleDateString()}`, 15, 60)

      // Add billing info
      doc.setFontSize(12)
      doc.text("Bill To:", 15, 75)
      doc.text(transaction.email || "N/A", 15, 80)
      if (transaction.fullName) doc.text(transaction.fullName, 15, 85)
      if (transaction.companyName) doc.text(transaction.companyName, 15, 90)

      // Add line items
      doc.setFontSize(12)
      doc.text("Description", 15, 110)
      doc.text("Amount", 180, 110, { align: "right" })
      doc.setDrawColor(200, 200, 200)
      doc.line(15, 112, 195, 112)

      const description = transaction.action
        ? `${transaction.plan} Subscription (${transaction.action}) - ${transaction.cycle || "monthly"}`
        : `${transaction.plan} Subscription - ${transaction.cycle || "monthly"}`
      doc.text(description, 15, 120)
      doc.text(`ZAR ${transaction.amount || 0}.00`, 180, 120, { align: "right" })

      // Add total
      doc.setFontSize(14)
      doc.setDrawColor(100, 100, 100)
      doc.line(15, 130, 195, 130)
      doc.text("Total", 15, 138)
      doc.text(`ZAR ${transaction.amount || 0}.00`, 180, 138, { align: "right" })

      // Add payment status
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Payment Status: ${transaction.status}`, 15, 160)
      if (transaction.transactionRef) doc.text(`Transaction ID: ${transaction.transactionRef}`, 15, 165)

      // Add footer
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text("Thank you for your business!", 105, 280, { align: "center" })
      doc.text("Terms: Payment due within 7 days", 105, 285, { align: "center" })

      console.log("PDF generated successfully")
      return doc
    } catch (error) {
      console.error("Error generating PDF content:", error)
      throw error
    }
  }

  const downloadInvoice = (transaction) => {
    console.log("=== DOWNLOAD INVOICE DEBUG ===")
    console.log("Transaction:", transaction)
    console.log("Window.jspdf available:", !!window.jspdf)
    console.log("Window.jspdf.jsPDF available:", !!(window.jspdf && window.jspdf.jsPDF))

    // Check if jsPDF is loaded
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error("jsPDF not loaded properly")
      alert("PDF generation library is still loading. Please wait a moment and try again.")
      // Try to reload jsPDF
      const existingScript = document.querySelector('script[src*="jspdf"]')
      if (existingScript) {
        existingScript.remove()
      }
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
      script.onload = () => {
        console.log("jsPDF reloaded, try again")
        alert("PDF library reloaded. Please try downloading again.")
      }
      document.head.appendChild(script)
      return
    }

    try {
      console.log("Generating PDF...")
      const doc = generateInvoicePDF(transaction)
      const filename = `invoice_${transaction.invoiceNumber || transaction.id.slice(0, 8)}_${transaction.plan.toLowerCase().replace(/\s+/g, "_")}.pdf`
      console.log("Saving PDF as:", filename)
      doc.save(filename)
      console.log("PDF download initiated successfully")
    } catch (error) {
      console.error("Error in downloadInvoice:", error)
      alert(`Error generating PDF: ${error.message}. Please try again.`)
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    const dateOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
    return {
      date: date.toLocaleDateString("en-US", dateOptions),
      time: date.toLocaleTimeString("en-US", timeOptions),
    }
  }

  // Add this function inside your component
  const fetchUserTransactions = async (userId) => {
    try {
      const transactionsRef = collection(db, "subscriptions")
      const q = query(transactionsRef, where("userId", "==", userId))
      const querySnapshot = await getDocs(q)
      const transactions = []
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() })
      })
      // Sort by date descending
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setHistory(transactions)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setHistory([])
    }
  }

  // Enhanced navigation function
  const handleNavigateToBilling = () => {
    setShowBillingInfo(true)
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBackToSubscriptions = () => {
    setShowBillingInfo(false)
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Toggle sidebar function
  const toggleSidebar = () => {
    const newSidebarState = !currentSidebarOpen
    setInternalSidebarOpen(newSidebarState)
    // Call parent callback if provided
    if (onSidebarToggle) {
      onSidebarToggle(newSidebarState)
    }
    // Dispatch event for other components to listen
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", {
        detail: { isOpen: newSidebarState, width: currentSidebarWidth },
      }),
    )
  }

  const getCurrentPlanKey = () => {
    return currentSubscription?.plan.toLowerCase()
  }

  if (isLoading) {
    return (
      <div style={styles.container} className="subscription-container">
        <div style={styles.mainCard}>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: `4px solid ${colors.lightTan}`,
                borderTop: `4px solid ${colors.accentGold}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 2rem auto",
              }}
            ></div>
            <h2 style={{ color: colors.darkBrown, fontSize: "1.5rem", fontWeight: 600 }}>
              Loading your subscription details...
            </h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container} className="subscription-container">
      {/* Optional Sidebar Toggle Button */}
      {onSidebarToggle && (
        <button
          onClick={toggleSidebar}
          style={styles.sidebarToggleButton}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)"
            e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}66`
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)"
            e.target.style.boxShadow = `0 2px 8px ${colors.accentGold}4D`
          }}
          title={currentSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {currentSidebarOpen ? "◀" : "▶"}
        </button>
      )}
      <div style={styles.mainCard} className="subscription-main-card">
        <div style={styles.decorativeElement}></div>
        {/* Show billing info or subscription content */}
        {showBillingInfo ? (
          <div style={{ ...styles.contentWrapper, ...styles.fadeIn }}>
            {/* Back button */}
            <button
              onClick={handleBackToSubscriptions}
              style={styles.backButton}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)"
                e.target.style.boxShadow = `0 8px 20px ${colors.lightTan}4D`
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)"
                e.target.style.boxShadow = `0 4px 12px ${colors.lightTan}33`
              }}
            >
              ← Back to Subscriptions
            </button>
            {/* Billing Info Component */}
            {/* <BillingInfoProgramSponsor // Corrected component name
              email={email}
              fullName={fullName}
              companyName={companyName}
              history={history}
              setHistory={setHistory}
              setEmail={setEmail}
              setFullName={setFullName}
              setCompanyName={setCompanyName}
            /> */}
          </div>
        ) : (
          <div style={{ ...styles.contentWrapper, ...styles.fadeIn }}>
            {/* ======= BETA PRICING NOTICE ======= */}
            <div style={styles.betaNotice}>
              <span style={styles.betaIcon}>🚀</span>
              <strong>Beta Pricing:</strong> All plans are{" "}
              <span style={{ color: colors.accentGold, fontWeight: 800 }}>FREE</span> during our beta period! Enjoy full
              access at no cost.
            </div>
            {/* ======= END BETA PRICING NOTICE ======= */}
            {isExistingUser && currentSubscription ? (
              <>
                <h1 style={styles.pageTitle}>Manage Your Subscription</h1>
                <p style={styles.subtitle}>Upgrade, downgrade, or manage your current plan with ease</p>
                {/* <FeatureComparisonTable /> */}
                {isExistingUser && currentSubscription && currentSubscription.plan.toLowerCase() !== "discover" && (
                  <div style={styles.downgradeSection}>
                    <h3 style={{ color: colors.darkBrown, marginBottom: "1rem", fontSize: "1.25rem" }}>
                      Need to change your plan?
                    </h3>
                    <p style={{ color: colors.mediumBrown, marginBottom: "1.5rem" }}>
                      You can downgrade to a lower-tier plan anytime.
                    </p>
                    <button
                      style={styles.buttonDowngrade}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)"
                        e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}33`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)"
                        e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}26`
                      }}
                      onClick={handleDowngradeClick}
                    >
                      Downgrade Plan
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 style={styles.pageTitle}>Choose Your Plan</h1>
                <p style={styles.subtitle}>Select the perfect plan for your business needs</p>
                {/* <FeatureComparisonTable /> */}
              </>
            )}
            {showDowngradeOptions && (
              <div style={styles.planChangeModal}>
                <div style={styles.modalContent}>
                  <h3 style={styles.modalTitle}>Choose Downgrade Option</h3>
                  <p style={styles.modalText}>Select which plan you'd like to downgrade to:</p>
                  <div style={{ margin: "2rem 0" }}>
                    {currentSubscription.plan.toLowerCase() === "partner" && (
                      <div
                        style={{
                          cursor: "pointer",
                          padding: "1.5rem",
                          borderBottom: `1px solid ${colors.lightTan}`,
                          borderRadius: "12px 12px 0 0",
                          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                          marginBottom: "1rem",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.lightBrown} 100%)`
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`
                        }}
                        onClick={() => handleDowngradeSelect("engage")}
                      >
                        <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>
                          Engage Plan
                        </div>
                        <div style={{ color: colors.mediumBrown, marginTop: "0.5rem" }}>
                          ZAR {plans.engage.price[billingCycle].toLocaleString()}/
                          {billingCycle === "monthly" ? "month" : "year"}
                        </div>
                        <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>
                          Keep most features, save ZAR{" "}
                          {(plans.partner.price[billingCycle] - plans.engage.price[billingCycle]).toLocaleString()}/
                          {billingCycle === "monthly" ? "month" : "year"}
                        </p>
                      </div>
                    )}
                    <div
                      style={{
                        cursor: "pointer",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.lightBrown} 100%)`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`
                      }}
                      onClick={() => handleDowngradeSelect("discover")}
                    >
                      <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>
                        Discover Plan
                      </div>
                      <div style={{ color: colors.mediumBrown, marginTop: "0.5rem" }}>Free</div>
                      <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>
                        Basic features only, no monthly fee
                      </p>
                    </div>
                  </div>
                  <div style={styles.modalActions}>
                    <button
                      style={styles.buttonSecondary}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)"
                        e.target.style.boxShadow = `0 8px 20px ${colors.lightTan}4D`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)"
                        e.target.style.boxShadow = `0 4px 12px ${colors.lightTan}33`
                      }}
                      onClick={cancelDowngradeOptions}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showPlanChangeConfirm && (
              <div style={styles.planChangeModal}>
                <div style={styles.modalContent}>
                  <h3 style={styles.modalTitle}>Confirm Plan Change</h3>
                  <p style={styles.modalText}>
                    You are about to <strong style={{ color: colors.accentGold }}>{upgradeDowngradeAction}</strong> from{" "}
                    <strong style={{ color: colors.darkBrown }}>{currentSubscription.plan}</strong> to{" "}
                    <strong style={{ color: colors.darkBrown }}>{plans[selectedPlan].name}</strong>.
                  </p>
                  <div
                    style={{
                      margin: "2rem 0",
                      padding: "1.5rem",
                      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                      borderRadius: "12px",
                      border: `1px solid ${colors.lightTan}`,
                    }}
                  >
                    <div style={{ marginBottom: "0.5rem", color: colors.mediumBrown }}>
                      <strong>Current:</strong> ZAR {currentSubscription.amount.toLocaleString()}/
                      {currentSubscription.cycle || "monthly"}
                    </div>
                    <div style={{ color: colors.mediumBrown }}>
                      <strong>New:</strong>{" "}
                      {plans[selectedPlan].price[billingCycle] === 0
                        ? "Free"
                        : `ZAR ${plans[selectedPlan].price[billingCycle].toLocaleString()}/${billingCycle === "monthly" ? "month" : "year"}`}
                    </div>
                  </div>
                  <div style={styles.modalActions}>
                    <button
                      style={styles.buttonSecondary}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)"
                        e.target.style.boxShadow = `0 8px 20px ${colors.lightTan}4D`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)"
                        e.target.style.boxShadow = `0 4px 12px ${colors.lightTan}33`
                      }}
                      onClick={cancelPlanChange}
                    >
                      Cancel
                    </button>
                    <button
                      style={{
                        ...styles.button,
                        ...(selectedPlan !== "discover" && !paystackLoaded ? styles.payButtonEnhancedLoading : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (paystackLoaded || selectedPlan === "discover") {
                          e.target.style.transform = "translateY(-2px)"
                          e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}66`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (paystackLoaded || selectedPlan === "discover") {
                          e.target.style.transform = "translateY(0)"
                          e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}4D`
                        }
                      }}
                      onClick={confirmPlanChange}
                      disabled={!paystackLoaded && selectedPlan !== "discover"}
                    >
                      {!paystackLoaded && selectedPlan !== "discover"
                        ? "Loading Payment System..."
                        : upgradeDowngradeAction === "downgrade" && selectedPlan === "discover"
                          ? "Confirm Downgrade"
                          : `Pay & ${upgradeDowngradeAction}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Cards */}
            <div style={styles.planGrid}>
              {Object.entries(plans).map(([planKey, plan]) => {
                const isCurrentPlan = isExistingUser && getCurrentPlanKey() === planKey
                const isSelected = selectedPlan === planKey
                const isHovered = hoveredPlan === planKey
                const isPopular = planKey === "engage"

                let cardBackground = colors.offWhite
                let nameColor = colors.darkBrown
                let priceColor = colors.darkBrown
                let periodColor = colors.mediumBrown
                let featureTextColor = colors.darkText
                let buttonBg = `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`
                const buttonColor = colors.lightText

                if (planKey === "discover") {
                  cardBackground = colors.discoverCardBg
                  nameColor = colors.lightText
                  priceColor = colors.lightText
                  periodColor = colors.lightText
                  featureTextColor = colors.lightText
                } else if (planKey === "engage") {
                  cardBackground = colors.engageCardBg
                  nameColor = colors.lightText
                  priceColor = colors.lightText
                  periodColor = colors.lightText
                  featureTextColor = colors.lightText
                  buttonBg = `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.lightBrown} 100%)`
                } else if (planKey === "partner") {
                  cardBackground = colors.partnerCardBg
                  nameColor = colors.lightText
                  priceColor = colors.lightText
                  periodColor = colors.lightText
                  featureTextColor = colors.lightText
                }

                return (
                  <div
                    key={planKey}
                    style={{
                      ...styles.planCard,
                      background: cardBackground,
                      ...(isPopular ? styles.planCardPopular : {}),
                      ...(isSelected && !isPopular ? styles.planCardSelected : {}),
                      ...(isHovered && !isSelected && !isPopular ? styles.planCardHover : {}),
                    }}
                    onMouseEnter={() => setHoveredPlan(planKey)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    onClick={() => handlePlanSelect(planKey)}
                  >
                    {isPopular && <div style={styles.popularBadge}>POPULAR</div>}
                    <h3 style={{ ...styles.planName, color: nameColor }}>{plan.name}</h3>
                    <div style={{ ...styles.planPrice, color: priceColor }}>
                      {plan.price[billingCycle] === 0 ? "Free" : `R${plan.price[billingCycle]}`}
                    </div>
                    {plan.price[billingCycle] > 0 && (
                      <span style={{ ...styles.planPricePeriod, color: periodColor }}>
                        / {billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    )}
                    <p style={{ ...styles.planDescriptionText, color: featureTextColor }}>{plan.description}</p>
                    {plan.price[billingCycle] > 0 && billingCycle === "annually" && (
                      <div style={styles.freeMonthsBadge}>
                        🎉 Save R{(plan.price.monthly * 12 - plan.price.annually).toLocaleString()} annually
                      </div>
                    )}

                    <ul style={styles.planFeaturesList}>
                      {plan.highlights.map((feature, index) => {
                        const isIncluded = true
                        const iconStyle = isIncluded ? styles.featureCheckIcon : styles.featureCrossIcon
                        const icon = isIncluded ? "✓" : "✗"
                        return (
                          <li key={index} style={{ ...styles.planFeatureItem, color: featureTextColor }}>
                            <span style={{ ...styles.featureIcon, ...iconStyle }}>{icon}</span>
                            <span>{feature}</span>
                          </li>
                        )
                      })}
                    </ul>
                    {isCurrentPlan ? (
                      <div
                        style={{
                          ...styles.currentPlanBadge,
                          width: "100%",
                          textAlign: "center",
                          padding: "1rem 1.5rem",
                          borderRadius: "8px",
                        }}
                      >
                        Current Plan
                      </div>
                    ) : isSelected ? (
                      <div
                        style={{
                          ...styles.selectedBadge,
                          width: "100%",
                          textAlign: "center",
                          padding: "1rem 1.5rem",
                          borderRadius: "8px",
                        }}
                      >
                        Selected Plan
                      </div>
                    ) : (
                      <button
                        style={{
                          ...styles.selectButton,
                          background: buttonBg,
                          color: buttonColor,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = colors.mediumBrown // Darker on hover
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = buttonBg // Revert to original gradient
                        }}
                      >
                        Choose Plan
                        <span>→</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {!showPlanChangeConfirm && !isExistingUser && (
              <div style={styles.formContainerBillCentered}>
                <div style={styles.formCardEnhanced}>
                  <div>
                    <button
                      style={{
                        ...styles.payButtonEnhanced,
                        ...(selectedPlan !== "discover" && !paystackLoaded ? styles.payButtonEnhancedLoading : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (paystackLoaded || selectedPlan === "discover") {
                          e.target.style.transform = "translateY(-3px)"
                          e.target.style.boxShadow = `0 12px 24px ${colors.accentGold}66`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (paystackLoaded || selectedPlan === "discover") {
                          e.target.style.transform = "translateY(0)"
                          e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}4D`
                        }
                      }}
                      onClick={handlePay}
                      disabled={!paystackLoaded && selectedPlan !== "discover"}
                    >
                      {!paystackLoaded && selectedPlan !== "discover" ? (
                        "Loading Payment System..."
                      ) : plans[selectedPlan].price[billingCycle] === 0 ? (
                        <>
                          <span style={{ marginRight: 8, fontSize: "1.25rem" }}>✨</span>
                          Activate Discover Plan
                        </>
                      ) : (
                        <>
                          <span style={{ marginRight: 8, fontSize: "1.25rem" }}>💳</span>
                          Pay {plans[selectedPlan].currency} {plans[selectedPlan].price[billingCycle].toLocaleString()}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Sidebar responsive adjustments */
        @media (max-width: 1400px) {
          .subscription-container {
            margin-left: ${currentSidebarOpen ? "250px" : "0px"} !important;
            width: ${currentSidebarOpen ? "calc(100% - 250px)" : "100%"} !important;
          }
        }
        @media (max-width: 1200px) {
          .subscription-container {
            margin-left: ${currentSidebarOpen ? "220px" : "0px"} !important;
            width: ${currentSidebarOpen ? "calc(100% - 220px)" : "100%"} !important;
          }
        }
        @media (max-width: 1024px) {
          .subscription-container {
            margin-left: ${currentSidebarOpen ? "200px" : "0px"} !important;
            width: ${currentSidebarOpen ? "calc(100% - 200px)" : "100%"} !important;
          }
        }
        @media (max-width: 768px) {
          .subscription-container {
            margin-left: 0px !important;
            width: 100% !important;
            padding: 0.5rem !important;
          }
        }
        @media (max-width: 640px) {
          .subscription-container {
            padding: 0.25rem !important;
          }
          .subscription-main-card {
            padding: 1rem !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ProgramSponsorSubscriptions
