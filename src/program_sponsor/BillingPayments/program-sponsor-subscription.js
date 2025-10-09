"use client"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore"
// Remove the actions import since you've fixed it separately
import { validate, saveToFirebase, updateCurrentPlan } from "./actions"
import { useNavigate } from "react-router-dom"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

// UPDATED: New function to create subscription checkout with PeachPayments
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

// UPDATED: Function to create one-time payment (for growth tools)
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
  // CHANGED: Trial colors from green to brown
  trialBrown: "#8D6E63", // Changed from trialGreen to trialBrown
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

  // Helper function to check if user is new (for trial eligibility)
  const isNewUser = () => {
    return !isExistingUser || !currentSubscription || currentSubscription.plan === "Discover"
  }

  // Helper function to safely get plan name
  const getCurrentPlanKey = () => {
    if (!currentSubscription || !currentSubscription.plan) {
      return "discover"
    }
    return currentSubscription.plan.toLowerCase()
  }

  // Enhanced load user subscription data
  const loadUserSubscription = async (userId) => {
    console.log("🔍 Loading subscription for user:", userId)
    setIsLoading(true)
    
    try {
      // First, check user document for current subscription
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        console.log("👤 User data:", userData)
        
        if (userData.currentSubscription && userData.currentSubscription.plan) {
          console.log("✅ Found current subscription in user doc:", userData.currentSubscription)
          
          // Create subscription object from user data
          const subscriptionFromUser = {
            id: `user_${userId}`,
            plan: userData.currentSubscription.plan,
            status: userData.currentSubscription.status || "Success",
            amount: userData.currentSubscription.amount || 0,
            cycle: userData.currentSubscription.cycle || "monthly",
            createdAt: userData.currentSubscription.lastUpdated || userData.subscriptionUpdatedAt,
            userId: userId,
            transactionRef: userData.currentSubscription.transactionRef,
            autoRenew: userData.currentSubscription.status === "active" || userData.currentSubscription.status === "Success",
            isTrialPeriod: userData.currentSubscription.isTrialPeriod || false,
            originalAmount: userData.currentSubscription.originalAmount,
            trialStartDate: userData.currentSubscription.trialStartDate,
            trialEndDate: userData.currentSubscription.trialEndDate
          }
          
          setCurrentSubscription(subscriptionFromUser)
          setIsExistingUser(true)
          setSelectedPlan(userData.currentSubscription.plan.toLowerCase())
          console.log("✅ Set subscription from user document")
        }
      }
      
      // Also check subscriptions collection as backup
      const subscriptionsRef = collection(db, "subscriptions")
      const queries = [
        query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "Success")),
        query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "Active")),
        query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "active"))
      ]

      const queryResults = await Promise.all(queries.map(q => getDocs(q)))
      const allSubscriptions = []
      
      queryResults.forEach(querySnapshot => {
        querySnapshot.forEach(doc => {
          const data = doc.data()
          // Filter out add-on purchases from subscription data
          if (!data.type || data.type !== "addon") {
            allSubscriptions.push({ id: doc.id, ...data })
          }
        })
      })
      
      console.log("📄 Found subscription records in collection:", allSubscriptions.length)
      
      if (allSubscriptions.length > 0) {
        // Get the most recent subscription
        const latestSubscription = allSubscriptions
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        
        console.log("📄 Latest subscription from collection:", latestSubscription)
        
        // Use collection data if user doc doesn't have subscription or if collection is more recent
        if (!currentSubscription || new Date(latestSubscription.createdAt) > new Date(currentSubscription.createdAt || 0)) {
          setCurrentSubscription(latestSubscription)
          setIsExistingUser(true)
          setSelectedPlan(latestSubscription.plan?.toLowerCase() || "discover")
          console.log("✅ Set subscription from collection")
        }
      }
      
      // Set history (filter out add-ons from main history)
      const subscriptionHistory = allSubscriptions
        .filter(record => !record.type || record.type !== "addon")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      
      setHistory(subscriptionHistory)
      
    } catch (error) {
      console.error("❌ Error loading user subscription:", error)
      // Don't throw - just log and continue with default state
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
                      background: colors.accentGold,
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
                      background: colors.mediumBrown,
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
                      background: colors.darkBrown,
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
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setEmail(userData.email || user.email || "")
            setFullName(userData.displayName || userData.fullName || "")
            setCompanyName(userData.companyName || "")
          } else {
            setEmail(user.email || "")
            setFullName(user.displayName || "")
          }

          await loadUserSubscription(user.uid)
          // Fetch transaction history from Firestore
          await fetchUserTransactions(user.uid)
        } catch (error) {
          console.error("Error loading user data:", error)
          setEmail(user.email || "")
          setFullName(user.displayName || "")
          await loadUserSubscription(user.uid)
        }
      }
    }

    loadUserData()
  }, [user])

  const handlePlanSelect = (planKey) => {
    console.log("Plan selected:", planKey)
    setSelectedPlan(planKey)
    setErrors({})

    if (isExistingUser && currentSubscription) {
      const currentPlanKey = getCurrentPlanKey()
      if (planKey !== currentPlanKey) {
        const planOrder = { discover: 0, engage: 1, partner: 2 }
        const action = planOrder[planKey] > planOrder[currentPlanKey] ? "upgrade" : "downgrade"
        setUpgradeDowngradeAction(action)
        setShowPlanChangeConfirm(true)
        setShowDowngradeOptions(false)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const handleDowngradeClick = () => {
    setShowDowngradeOptions(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDowngradeSelect = (targetPlan) => {
    setSelectedPlan(targetPlan)
    setUpgradeDowngradeAction("downgrade")
    setShowDowngradeOptions(false)
    setShowPlanChangeConfirm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
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
    } else {
      console.log("Calling handlePay for upgrade/downgrade...")
      setShowPlanChangeConfirm(false)
      handlePay()
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDowngradeToFree = async () => {
    console.log("Starting downgrade to free...")
    try {
      const newRecord = {
        id: uuidv4(),
        email,
        plan: plans[selectedPlan].name,
        cycle: billingCycle,
        amount: 0,
        fullName,
        companyName,
        createdAt: new Date().toISOString(),
        status: "Success",
        autoRenew: true,
        userId: user.uid,
        action: "downgrade",
        transactionRef: `downgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      await saveToFirebase(newRecord)
      await updateCurrentPlan(plans[selectedPlan].name, billingCycle)
      setHistory([newRecord, ...history])
      setCurrentSubscription(newRecord)
      setIsExistingUser(true)
      alert(`Successfully downgraded to ${plans[selectedPlan].name} plan!`)
      setShowPlanChangeConfirm(false)
      setUpgradeDowngradeAction(null)

      setTimeout(() => {
        loadUserSubscription(user.uid)
      }, 1000)
    } catch (error) {
      console.error("Error in handleDowngradeToFree:", error)
      alert("An error occurred during downgrade. Please try again.")
    }
  }

  const cancelPlanChange = () => {
    setSelectedPlan(getCurrentPlanKey())
    setShowPlanChangeConfirm(false)
    setShowDowngradeOptions(false)
    setUpgradeDowngradeAction(null)
  }

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!currentSubscription || !user) {
      alert("No active subscription found.")
      return
    }

    const confirmMessage = `Are you sure you want to cancel your ${currentSubscription.plan} subscription?\n\nThis will:\n• Stop automatic renewals\n• Downgrade you to Discover plan\n• Remove premium features\n\nThis action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      // Create cancellation record
      const cancellationRecord = {
        id: uuidv4(),
        email: email,
        plan: "Discover",
        cycle: "monthly",
        amount: 0,
        fullName: fullName,
        companyName: companyName,
        createdAt: new Date().toISOString(),
        status: "Success",
        autoRenew: false,
        userId: user.uid,
        action: "cancellation",
        previousPlan: currentSubscription.plan,
        transactionRef: `cancellation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      // Save cancellation record
      await saveToFirebase(cancellationRecord)
      
      // Update current plan to Discover
      await updateCurrentPlan("Discover", "monthly")
      
      // Update local state
      setHistory([cancellationRecord, ...history])
      setCurrentSubscription(cancellationRecord)
      setSelectedPlan("discover")
      
      alert(`Subscription cancelled successfully!\n\nYou've been downgraded to the Discover plan.\nYour premium features will remain active until the end of your current billing period.`)
      
      // Reload subscription data
      setTimeout(() => {
        loadUserSubscription(user.uid)
      }, 1000)
      
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      alert("Failed to cancel subscription. Please try again or contact support.")
    }
  }

  // UPDATED: Handle payment with proper subscription vs one-time logic
  const handlePay = async () => {
    console.log("Starting payment process for plan:", selectedPlan)

    if (!user) {
      alert("Please log in to subscribe")
      return
    }

    const planPrice = plans[selectedPlan].price[billingCycle]

    // Handle free discover plan
    if (selectedPlan === "discover") {
      try {
        const newRecord = {
          id: uuidv4(),
          email: email,
          plan: plans[selectedPlan].name,
          cycle: billingCycle,
          amount: 0,
          fullName: fullName,
          companyName: companyName,
          createdAt: new Date().toISOString(),
          status: "Success",
          autoRenew: true,
          userId: user.uid,
          action: isExistingUser ? (upgradeDowngradeAction || "downgrade") : "new_subscription",
        }

        setHistory([newRecord, ...history])
        await saveToFirebase(newRecord)
        await updateCurrentPlan(plans[selectedPlan].name, billingCycle)
        setCurrentSubscription(newRecord)
        setIsExistingUser(true)
        alert("Discover plan activated successfully!")
        
        // Clear any upgrade/downgrade state
        setUpgradeDowngradeAction(null)
        setShowPlanChangeConfirm(false)
        
        return
      } catch (error) {
        console.error("Error activating discover plan:", error)
        alert("Failed to activate discover plan. Please try again.")
        return
      }
    }

    // Validate for paid plans
    const validationResult = validate(email, fullName)
    if (!validationResult.isValid) {
      setErrors(validationResult.errors)
      return
    }

    console.log("Creating subscription checkout...")
    setPaymentProcessing(true)

    try {
      const checkoutData = await createSubscriptionCheckout(
        planPrice,
        "ZAR",
        user.uid,
        plans[selectedPlan].name,
        billingCycle,
        isExistingUser ? (upgradeDowngradeAction || "upgrade") : "subscription"
      )

      console.log("Subscription checkout created:", checkoutData)

      if (checkoutData.success && checkoutData.checkoutId) {
        setCheckoutId(checkoutData.checkoutId)
        setShowCheckout(true)
      } else {
        throw new Error(checkoutData.error || "Failed to create subscription checkout")
      }
    } catch (error) {
      console.error("Subscription checkout creation error:", error)
      alert(`Failed to initialize subscription payment: ${error.message}. Please try again.`)
    } finally {
      setPaymentProcessing(false)
    }
  }

  // UPDATED: Handle checkout completion with enhanced Firebase saving
  const handleCheckoutCompleted = async (event) => {
    console.log("🎉 Payment completed:", event)
    setPaymentProcessing(true) // Show processing state

    try {
      // Handle subscription/plan payment with trial period
      const isTrialEligible = isNewUser()
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setMonth(trialEndDate.getMonth() + 3)

      const newRecord = {
        id: uuidv4(),
        email: email,
        plan: plans[selectedPlan].name,
        cycle: billingCycle,
        amount: 0, // First 3 months are free
        originalAmount: plans[selectedPlan].price[billingCycle], // Store original price
        fullName: fullName,
        companyName,
        createdAt: new Date().toISOString(),
        status: "Success",
        autoRenew: true,
        transactionRef: event.id || event.transactionId || `trial_${Date.now()}`,
        userId: user.uid,
        subscriptionType: "recurring",
        isTrialPeriod: isTrialEligible,
        trialStartDate: isTrialEligible ? trialStartDate.toISOString() : null,
        trialEndDate: isTrialEligible ? trialEndDate.toISOString() : null,
        // Handle potentially undefined registrationId
        ...(event.registrationId && { registrationId: event.registrationId }),
        ...(event.cardBrand && { cardBrand: event.cardBrand }),
        ...(event.cardLast4 && { cardLast4: event.cardLast4 }),
        action: isExistingUser ? (upgradeDowngradeAction || "upgrade") : "new_subscription",
        paymentCompleted: true,
        paymentDate: new Date().toISOString()
      }

      console.log("💾 Saving subscription record:", newRecord)

      // Save to Firebase with enhanced error handling
      try {
        const saveResult = await saveToFirebase(newRecord)
        console.log("✅ Firebase save result:", saveResult)
      } catch (saveError) {
        console.error("❌ Firebase save failed:", saveError)
        throw new Error(`Failed to save subscription: ${saveError.message}`)
      }

      // Update current plan
      try {
        const updateResult = await updateCurrentPlan(plans[selectedPlan].name, billingCycle)
        console.log("✅ Plan update result:", updateResult)
      } catch (updateError) {
        console.error("❌ Plan update failed:", updateError)
        // Don't throw here - subscription was saved, plan update is secondary
      }
      
      // Update local state
      setHistory([newRecord, ...history])
      setCurrentSubscription(newRecord)
      setIsExistingUser(true)
      setShowCheckout(false)
      setPaymentProcessing(false)
      
      // Clear upgrade/downgrade state
      setUpgradeDowngradeAction(null)
      setShowPlanChangeConfirm(false)
      
      // Show success message with trial information
      const successMessage = isTrialEligible 
        ? `🎉 Welcome to your ${plans[selectedPlan].name} plan!\n\n✨ You're getting 3 MONTHS FREE!\n• Trial period: ${trialStartDate.toLocaleDateString()} - ${trialEndDate.toLocaleDateString()}\n• Regular billing starts: ${trialEndDate.toLocaleDateString()}\n• Monthly rate after trial: R${plans[selectedPlan].price[billingCycle]}\n\nEnjoy all premium features at no cost for the first 3 months!`
        : `🎉 Subscription activated successfully!\n\nYour ${plans[selectedPlan].name} plan is now active with automatic renewals.\n\nYou can now access all premium features!`
      
      alert(successMessage)
      
      // Reload subscription data to ensure sync
      setTimeout(async () => {
        console.log("🔄 Reloading subscription data...")
        await loadUserSubscription(user.uid)
      }, 2000)
      
    } catch (error) {
      console.error("❌ Error processing completed payment:", error)
      setPaymentProcessing(false)
      alert(`❌ Payment Error\n\nYour payment was processed but there was an error saving your subscription:\n\n${error.message}\n\nPlease contact support with your transaction ID: ${event.id || event.transactionId}`)
    }
  }

  const handleCheckoutCancelled = () => {
    console.log("Payment cancelled")
    setShowCheckout(false)
    alert("Payment cancelled")
  }

  const handleCheckoutExpired = () => {
    console.log("Payment expired")
    setShowCheckout(false)
    alert("Payment session expired. Please try again.")
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

  // Dynamic styles based on sidebar state
  const styles = {
    container: {
      width: "100%",
      minHeight: "100vh",
      padding: "1rem",
      background: colors.offWhite,
      fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
      boxSizing: "border-box",
      marginLeft: currentSidebarOpen ? `${currentSidebarWidth}px` : "0px",
      width: currentSidebarOpen ? `calc(100% - ${currentSidebarWidth}px)` : "100%",
      transition: "all 0.3s ease",
    },
    mainCard: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      borderRadius: "24px",
      padding: "clamp(1rem, 3vw, 2rem)",
      boxShadow: `0 20px 60px ${colors.darkBrown}15, 0 8px 24px ${colors.darkBrown}0A`,
      border: `1px solid ${colors.lightTan}`,
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
      background: `radial-gradient(circle, ${colors.accentGold}14 0%, transparent 70%)`,
      borderRadius: "50%",
      pointerEvents: "none",
    },
    pageTitle: {
      fontSize: "clamp(2rem, 4vw, 2.75rem)",
      fontWeight: 800,
      background: `linear-gradient(135deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
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
      color: colors.mediumBrown,
      textAlign: "center",
      marginBottom: "3rem",
      fontWeight: 400,
      opacity: 0.9,
    },
    betaNotice: {
      background: `linear-gradient(135deg, ${colors.trialBrown}20 0%, ${colors.accentGold}20 100%)`,
      color: colors.darkBrown,
      border: `2px solid ${colors.trialBrown}`,
      borderRadius: "16px",
      padding: "1.5rem 2rem",
      margin: "0 auto 3rem auto",
      maxWidth: "800px",
      fontWeight: 600,
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      textAlign: "center",
      boxShadow: `0 8px 24px ${colors.trialBrown}1F`,
      position: "relative",
    },
    betaIcon: {
      display: "inline-block",
      marginRight: "0.5rem",
      fontSize: "1.25rem",
    },
    billingToggleContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "2rem auto",
      gap: "1rem",
    },
    billingToggle: {
      display: "flex",
      background: colors.cream,
      borderRadius: "12px",
      padding: "4px",
      border: `1px solid ${colors.lightTan}`,
      boxShadow: `0 4px 12px ${colors.darkBrown}0A`,
    },
    billingToggleOption: {
      padding: "0.75rem 1.5rem",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: "0.95rem",
      transition: "all 0.3s ease",
      color: colors.mediumBrown,
      position: "relative",
    },
    billingToggleActive: {
      background: colors.accentGold,
      color: colors.lightText,
      boxShadow: `0 2px 8px ${colors.accentGold}33`,
    },
    savingsBadge: {
      background: colors.mediumBrown,
      color: colors.lightText,
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
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      borderRadius: "20px",
      padding: "1.5rem",
      boxShadow: `0 12px 40px ${colors.darkBrown}0A`,
      border: `1px solid ${colors.lightTan}`,
      overflow: "auto",
    },
    featureComparisonTitle: {
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
      fontWeight: 700,
      color: colors.darkBrown,
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
      background: colors.offWhite,
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: `0 4px 12px ${colors.darkBrown}0A`,
      border: `1px solid ${colors.lightTan}`,
      fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
    },
    featureTh: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      fontWeight: 700,
      padding: "1rem",
      color: colors.darkBrown,
      fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)",
      borderBottom: `2px solid ${colors.lightTan}`,
      position: "relative",
    },
    featureTd: {
      padding: "0.75rem",
      textAlign: "center",
      fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
      color: colors.mediumBrown,
      borderBottom: `1px solid ${colors.lightTan}26`,
      transition: "background-color 0.2s ease",
    },
    featureTdLeft: {
      textAlign: "left",
      fontWeight: 600,
      color: colors.darkBrown,
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
      borderRadius: "16px",
      padding: "2rem",
      textAlign: "center",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      boxShadow: `0 8px 24px ${colors.darkBrown}14`,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      minHeight: "450px",
    },
    planCardPopular: {
      background: colors.engageCardBg,
      color: colors.lightText,
      transform: "scale(1.03)",
      zIndex: 2,
      boxShadow: `0 20px 60px ${colors.darkBrown}33`,
      border: `1px solid ${colors.accentGold}`,
    },
    planCardHover: {
      transform: "translateY(-8px)",
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
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      boxShadow: `0 2px 8px ${colors.accentGold}4D`,
    },
    planName: {
      fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
      fontWeight: 800,
      marginBottom: "0.75rem",
      letterSpacing: "-1px",
      color: colors.darkBrown,
    },
    planPrice: {
      fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
      fontWeight: 900,
      marginBottom: "0.5rem",
      lineHeight: "1",
      color: colors.darkBrown,
    },
    planPriceFree: {
      color: colors.trialBrown, // CHANGED: From trialGreen to trialBrown
      fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
      fontWeight: 900,
    },
    planPricePeriod: {
      fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
      fontWeight: 500,
      opacity: 0.8,
      color: colors.mediumBrown,
    },
    planDescriptionText: {
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      color: colors.mediumBrown,
      marginBottom: "2rem",
      lineHeight: "1.6",
    },
    freeMonthsBadge: {
      background: `linear-gradient(90deg, ${colors.trialBrown} 0%, ${colors.accentGold} 100%)`, // CHANGED: From trialGreen to trialBrown
      color: colors.lightText,
      padding: "0.8rem 1.2rem",
      borderRadius: "12px",
      fontSize: "1rem",
      fontWeight: 700,
      marginBottom: "1rem",
      textAlign: "center",
      boxShadow: `0 4px 12px ${colors.trialBrown}4D`, // CHANGED: From trialGreen to trialBrown
      display: "inline-block",
      border: `2px solid ${colors.trialBrown}`, // CHANGED: From trialGreen to trialBrown
    },
    afterTrialPrice: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      border: `1px solid ${colors.lightTan}`,
      borderRadius: "8px",
      padding: "0.8rem",
      marginBottom: "1.5rem",
      fontSize: "0.9rem",
      color: colors.mediumBrown,
      fontWeight: 600,
    },
    planFeaturesList: {
      listStyle: "none",
      padding: "0",
      margin: "0 0 2.5rem 0",
      flex: 1,
      textAlign: "left",
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
      flexShrink: 0,
    },
    featureCheckIcon: {
      color: colors.featureCheck,
    },
    featureCrossIcon: {
      color: colors.featureCross,
    },
    currentPlanBadge: {
      display: "inline-block",
      background: colors.accentGold,
      color: colors.lightText,
      fontWeight: 600,
      borderRadius: "8px",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      letterSpacing: "0.5px",
    },
    selectedBadge: {
      display: "inline-block",
      background: colors.mediumBrown,
      color: colors.lightText,
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
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "16px",
      border: `1px solid ${colors.lightTan}`,
      maxWidth: "800px",
    },
    button: {
      padding: "1rem 2.5rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      margin: "0 0.75rem",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    buttonSecondary: {
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
      color: colors.darkBrown,
      border: `2px solid ${colors.lightTan}`,
      fontWeight: 700,
      borderRadius: "12px",
      padding: "1rem 2.5rem",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      margin: "0 0.75rem",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.lightTan}33`,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    buttonDowngrade: {
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
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
      boxShadow: `0 4px 12px ${colors.accentGold}4D`,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    planChangeModal: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: `${colors.darkBrown}66`,
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
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      padding: "2rem",
      borderRadius: "24px",
      maxWidth: "500px",
      width: "100%",
      boxShadow: `0 24px 60px ${colors.darkBrown}33`,
      textAlign: "center",
      border: `1px solid ${colors.lightTan}`,
      position: "relative",
      maxHeight: "90vh",
      overflow: "auto",
    },
    modalTitle: {
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
      fontWeight: 800,
      color: colors.darkBrown,
      marginBottom: "1rem",
      letterSpacing: "-0.5px",
    },
    modalText: {
      fontSize: "clamp(1rem, 2vw, 1.125rem)",
      color: colors.mediumBrown,
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
    paymentButton: {
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.accentGold}4D`,
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      minWidth: "200px",
      minHeight: "50px",
    },
    paymentButtonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
      color: colors.mediumBrown,
      boxShadow: `0 2px 8px ${colors.lightTan}33`,
    },
    subscriptionInfo: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "16px",
      padding: "1.5rem",
      marginBottom: "2rem",
      border: `1px solid ${colors.lightTan}`,
    },
    subscriptionTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: colors.darkBrown,
      marginBottom: "1rem",
    },
    subscriptionDetail: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.5rem 0",
      fontSize: "1rem",
      color: colors.darkText,
      borderBottom: `1px solid ${colors.lightTan}33`,
    },
    formContainerBillCentered: {
      display: "flex",
      justifyContent: "center",
      margin: "3rem auto",
      padding: "0 1rem",
    },
    formCardEnhanced: {
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      padding: "2rem",
      borderRadius: "24px",
      boxShadow: `0 16px 40px ${colors.darkBrown}14`,
      width: "100%",
      maxWidth: "450px",
      textAlign: "center",
      border: `1px solid ${colors.lightTan}`,
    },
    payButtonEnhanced: {
      padding: "1.25rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
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
      boxShadow: `0 8px 20px ${colors.accentGold}4D`,
      transition: "all 0.3s ease",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    payButtonEnhancedLoading: {
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
      color: colors.mediumBrown,
      cursor: "not-allowed",
      boxShadow: `0 4px 12px ${colors.lightTan}33`,
    },
    sidebarToggleButton: {
      position: "fixed",
      top: "1rem",
      left: currentSidebarOpen ? `${currentSidebarWidth - 50}px` : "1rem",
      zIndex: 1001,
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "8px",
      padding: "0.5rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 2px 8px ${colors.accentGold}4D`,
      display: "none",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
      color: colors.darkBrown,
      border: `2px solid ${colors.lightTan}`,
      borderRadius: "12px",
      fontWeight: 600,
      fontSize: "clamp(0.85rem, 1.5vw, 0.95rem)",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.lightTan}33`,
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
          </div>
        ) : (
          <div style={{ ...styles.contentWrapper, ...styles.fadeIn }}>
            {/* Updated Beta Notice with Trial Information - CHANGED: Green to Brown */}
            <div style={styles.betaNotice}>
              <span style={styles.betaIcon}>🎉</span>
              <strong>Special Launch Offer:</strong> Get your first{" "}
              <span style={{ color: colors.trialBrown, fontWeight: 800 }}>3 MONTHS FREE</span> on any paid plan! 
              <br />
              <small style={{ opacity: 0.8, marginTop: "0.5rem", display: "block" }}>
                Start your trial today - billing begins after 3 months at regular rates
              </small>
            </div>

            {isExistingUser && currentSubscription ? (
              <>
                <h1 style={styles.pageTitle}>Manage Your Subscription</h1>
                <p style={styles.subtitle}>Upgrade, downgrade, or manage your current plan with ease</p>
                
                {/* Enhanced Current subscription info with trial details */}
                <div style={styles.subscriptionInfo}>
                  <h3 style={styles.subscriptionTitle}>Current Subscription</h3>
                  <div style={styles.subscriptionDetail}>
                    <span>Plan:</span>
                    <span style={{ fontWeight: 600 }}>{currentSubscription.plan}</span>
                  </div>
                  <div style={styles.subscriptionDetail}>
                    <span>Billing Cycle:</span>
                    <span style={{ fontWeight: 600 }}>{currentSubscription.cycle || 'Monthly'}</span>
                  </div>
                  <div style={styles.subscriptionDetail}>
                    <span>Current Amount:</span>
                    <span style={{ fontWeight: 600, color: currentSubscription.isTrialPeriod ? colors.trialBrown : colors.darkText }}>
                      {currentSubscription.amount === 0 && currentSubscription.isTrialPeriod ? 'FREE (Trial)' : 
                       currentSubscription.amount === 0 ? 'Free' : `R${currentSubscription.amount}`}
                    </span>
                  </div>
                  {currentSubscription.originalAmount && currentSubscription.originalAmount > 0 && (
                    <div style={styles.subscriptionDetail}>
                      <span>Regular Price:</span>
                      <span style={{ fontWeight: 600 }}>R{currentSubscription.originalAmount}/{currentSubscription.cycle?.slice(0, -2) || 'month'}</span>
                    </div>
                  )}
                  {currentSubscription.isTrialPeriod && currentSubscription.trialEndDate && (
                    <div style={styles.subscriptionDetail}>
                      <span>Trial Ends:</span>
                      <span style={{ fontWeight: 600, color: colors.trialBrown }}>
                        {new Date(currentSubscription.trialEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div style={styles.subscriptionDetail}>
                    <span>Status:</span>
                    <span style={{ 
                      fontWeight: 600, 
                      color: currentSubscription.status === 'Success' || currentSubscription.status === 'active' ? colors.featureCheck : colors.featureCross 
                    }}>
                      {currentSubscription.status === 'Success' ? 'Active' : currentSubscription.status}
                    </span>
                  </div>
                  {currentSubscription.autoRenew && (
                    <div style={styles.subscriptionDetail}>
                      <span>Auto Renewal:</span>
                      <span style={{ fontWeight: 600, color: colors.featureCheck }}>Enabled</span>
                    </div>
                  )}
                  {currentSubscription.cardLast4 && (
                    <div style={styles.subscriptionDetail}>
                      <span>Payment Method:</span>
                      <span style={{ fontWeight: 600 }}>
                        {currentSubscription.cardBrand || 'Card'} ending in {currentSubscription.cardLast4}
                      </span>
                    </div>
                  )}
                </div>

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
                <p style={styles.subtitle}>Select the perfect plan for your business needs - first 3 months free!</p>
              </>
            )}

            {/* Feature Comparison Table */}
            <FeatureComparisonTable />

            {/* UPDATED: Pricing Cards with Zero Prices and "After Trial" Information - CHANGED: Green to Brown */}
            <div style={styles.planGrid}>
              {Object.entries(plans).map(([planKey, plan]) => {
                const isCurrentPlan = isExistingUser && getCurrentPlanKey() === planKey
                const isSelected = selectedPlan === planKey
                const isHovered = hoveredPlan === planKey
                const isPopular = planKey === "engage"
                const showTrialOffer = planKey !== "discover" && isNewUser()

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
                    
                    {/* UPDATED: Show R0/FREE for paid plans during trial, regular price for discover - CHANGED: Green to Brown */}
                    {plan.price[billingCycle] === 0 ? (
                      <div style={{ ...styles.planPrice, color: priceColor }}>Free</div>
                    ) : (
                      <>
                        {/* Show FREE/R0 prominently for trial-eligible users */}
                        {showTrialOffer ? (
                          <div style={{ ...styles.planPriceFree, color: colors.trialBrown }}>
                            FREE
                          </div>
                        ) : (
                          <div style={{ ...styles.planPrice, color: priceColor }}>
                            R{plan.price[billingCycle]}
                          </div>
                        )}
                        
                        {/* Show period for non-trial or regular price display */}
                        {!showTrialOffer && (
                          <span style={{ ...styles.planPricePeriod, color: periodColor }}>
                            / {billingCycle === "monthly" ? "month" : "year"}
                          </span>
                        )}
                      </>
                    )}

                    <p style={{ ...styles.planDescriptionText, color: featureTextColor }}>{plan.description}</p>
                    
                    {/* Trial Badge for eligible plans */}
                    {showTrialOffer && (
                      <div style={styles.freeMonthsBadge}>
                        🎉 First 3 Months FREE!
                      </div>
                    )}

                    {/* UPDATED: "After Trial" pricing information */}
                    {showTrialOffer && (
                      <div style={styles.afterTrialPrice}>
                        <strong>After 3-month trial:</strong><br />
                        R{plan.price[billingCycle]} / {billingCycle === "monthly" ? "month" : "year"}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlanSelect(planKey)
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = colors.mediumBrown
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = buttonBg
                        }}
                      >
                        {isExistingUser ? (
                          planKey === "discover" ? "Downgrade" : showTrialOffer ? "Start Free Trial" : "Upgrade"
                        ) : (
                          showTrialOffer ? "Start Free Trial" : "Subscribe"
                        )}
                        <span>→</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Enhanced Payment Button */}
            {(!isExistingUser || (isExistingUser && selectedPlan !== getCurrentPlanKey())) && !showPlanChangeConfirm && (
              <div style={styles.formContainerBillCentered}>
                <div style={styles.formCardEnhanced}>
                  <div>
                    <button
                      style={{
                        ...styles.payButtonEnhanced,
                        ...(paymentProcessing ? styles.paymentButtonDisabled : {}),
                      }}
                      onClick={handlePay}
                      disabled={paymentProcessing}
                    >
                      {paymentProcessing ? (
                        <>
                          <div style={{
                            width: "20px",
                            height: "20px",
                            border: "2px solid transparent",
                            borderTop: "2px solid currentColor",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            marginRight: "0.5rem",
                          }}></div>
                          Processing...
                        </>
                      ) : (
                        (() => {
                          if (plans[selectedPlan].price[billingCycle] === 0) {
                            return (
                              <>
                                <span style={{ marginRight: 8, fontSize: "1.25rem" }}>✨</span>
                                Activate Discover Plan
                              </>
                            )
                          } else if (isExistingUser) {
                            if (upgradeDowngradeAction === 'upgrade') {
                              return isNewUser() ? `Start ${plans[selectedPlan].name} Trial (FREE)` : `Upgrade to ${plans[selectedPlan].name}`
                            } else {
                              return `Change to ${plans[selectedPlan].name}`
                            }
                          } else {
                            return isNewUser() ? (
                              <>
                                <span style={{ marginRight: 8, fontSize: "1.25rem" }}>🎉</span>
                                Start {plans[selectedPlan].name} Trial (FREE)
                              </>
                            ) : (
                              <>
                                <span style={{ marginRight: 8, fontSize: "1.25rem" }}>💳</span>
                                Pay {plans[selectedPlan].currency} {plans[selectedPlan].price[billingCycle].toLocaleString()}
                              </>
                            )
                          }
                        })()
                      )}
                    </button>

                    {/* Enhanced Payment info for subscriptions with trial details - CHANGED: Green to Brown */}
                    {plans[selectedPlan].price[billingCycle] > 0 && (
                      <div style={{
                        background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
                        borderRadius: "12px",
                        padding: "1.5rem",
                        marginTop: "1.5rem",
                        border: `1px solid ${colors.lightTan}`,
                        textAlign: "left",
                      }}>
                        <h4 style={{ 
                          color: colors.darkBrown, 
                          marginBottom: "1rem",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}>
                          🎉 {isNewUser() ? "Free Trial Setup" : "Secure Subscription Payment"}
                        </h4>
                        
                        {isNewUser() && (
                          <div style={{
                            background: `linear-gradient(135deg, ${colors.trialBrown}20 0%, ${colors.accentGold}20 100%)`,
                            borderRadius: "8px",
                            padding: "1rem",
                            marginBottom: "1rem",
                            border: `1px solid ${colors.trialBrown}`,
                          }}>
                            <p style={{ 
                              color: colors.darkBrown, 
                              margin: 0,
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              ✨ <strong>3-Month Free Trial:</strong> No charges for 3 months!
                            </p>
                            <p style={{ 
                              color: colors.mediumBrown, 
                              margin: "0.5rem 0 0 1.5rem",
                              fontSize: "0.85rem",
                              lineHeight: "1.4"
                            }}>
                              Your card will be saved for automatic billing after the trial period ends. Cancel anytime during the trial with no charges.
                            </p>
                          </div>
                        )}

                        <div style={{
                          background: `linear-gradient(135deg, ${colors.accentGold}20 0%, ${colors.lightTan}40 100%)`,
                          borderRadius: "8px",
                          padding: "1rem",
                          marginBottom: "1rem",
                          border: `1px solid ${colors.accentGold}`,
                        }}>
                          <p style={{ 
                            color: colors.darkBrown, 
                            margin: 0,
                            fontSize: "0.95rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            💳 <strong>Important:</strong> For automatic renewals, please pay with a <strong>Credit or Debit Card</strong>
                          </p>
                          <p style={{ 
                            color: colors.mediumBrown, 
                            margin: "0.5rem 0 0 1.5rem",
                            fontSize: "0.85rem",
                            lineHeight: "1.4"
                          }}>
                            Other payment methods (Scan to Pay, EFT) will complete this payment but won't enable automatic subscription renewals.
                          </p>
                        </div>

                        <ul style={{ 
                          listStyle: "none", 
                          padding: 0, 
                          margin: 0,
                          color: colors.darkText,
                          fontSize: "0.95rem",
                          lineHeight: "1.6"
                        }}>
                          <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ color: colors.featureCheck }}>✓</span>
                            {isNewUser() ? "Free for first 3 months" : "Immediate access to premium features"}
                          </li>
                          <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ color: colors.featureCheck }}>✓</span>
                            Cards are securely saved for automatic {billingCycle} renewals
                          </li>
                          <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ color: colors.featureCheck }}>✓</span>
                            {isNewUser() ? `Billing starts at R${plans[selectedPlan].price[billingCycle]} per ${billingCycle.slice(0, -2)} after trial` : `Automatic billing at R${plans[selectedPlan].price[billingCycle]} per ${billingCycle.slice(0, -2)}`}
                          </li>
                          <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ color: colors.featureCheck }}>✓</span>
                            Cancel anytime from your account settings
                          </li>
                          <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ color: colors.featureCheck }}>✓</span>
                            256-bit SSL encryption for all transactions
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Checkout Modal with Loading States */}
            {showCheckout && checkoutId && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  backgroundColor: `${colors.darkBrown}66`,
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                  padding: "1rem",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    background: colors.offWhite,
                    padding: "2rem",
                    borderRadius: "24px",
                    maxWidth: "600px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflow: "auto",
                    boxShadow: `0 24px 60px ${colors.darkBrown}33`,
                    border: `1px solid ${colors.lightTan}`,
                    position: "relative",
                  }}
                >
                  <h2
                    style={{
                      color: colors.darkBrown,
                      marginBottom: "0.5rem",
                      textAlign: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                    }}
                  >
                    {isNewUser() ? "Start Your Free Trial" : "Complete Your Subscription"}
                  </h2>
                  
                  <div style={{
                    background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                    borderRadius: "12px",
                    padding: "1rem",
                    marginBottom: "1.5rem",
                    border: `1px solid ${colors.lightTan}`,
                    textAlign: "center",
                  }}>
                    <p style={{ 
                      color: colors.darkBrown, 
                      margin: 0, 
                      fontSize: "1rem",
                      fontWeight: 600 
                    }}>
                      {isNewUser() ? (
                        <>🎉 Starting {plans[selectedPlan].name} Free Trial</>
                      ) : (
                        <>🔄 Setting up {plans[selectedPlan].name} Plan</>
                      )}
                    </p>
                    <p style={{ 
                      color: colors.mediumBrown, 
                      margin: "0.5rem 0 0 0", 
                      fontSize: "0.9rem" 
                    }}>
                      {isNewUser() ? (
                        "Free for 3 months, then automatic billing begins"
                      ) : (
                        `Your card will be saved for automatic ${billingCycle} renewals`
                      )}
                    </p>
                  </div>

                  <EmbeddedCheckout
                    checkoutId={checkoutId}
                    onCompleted={handleCheckoutCompleted}
                    onCancelled={handleCheckoutCancelled}
                    onExpired={handleCheckoutExpired}
                    paymentType="subscription"
                    amount={0} // Always 0 for trial
                    planName={plans[selectedPlan].name}
                    userEmail={email}
                    userName={fullName}
                  />

                  <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <button
                      style={{
                        padding: "1rem 2rem",
                        background: `linear-gradient(135deg, ${colors.lightTan} 0%, ${colors.cream} 100%)`,
                        color: colors.darkBrown,
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "1rem",
                        cursor: "pointer",
                        opacity: paymentProcessing ? 0.5 : 1,
                      }}
                      onClick={() => {
                        if (!paymentProcessing) {
                          setShowCheckout(false)
                          setPaymentProcessing(false)
                        }
                      }}
                      disabled={paymentProcessing}
                    >
                      {paymentProcessing ? "Processing..." : "Cancel"}
                    </button>
                  </div>

                  {/* Processing Overlay */}
                  {paymentProcessing && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `${colors.offWhite}F5`,
                      backdropFilter: "blur(6px)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1001,
                      borderRadius: "24px",
                      boxShadow: `inset 0 0 20px ${colors.darkBrown}20`,
                    }}>
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          border: `6px solid ${colors.lightTan}`,
                          borderTop: `6px solid ${colors.accentGold}`,
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                          marginBottom: "2rem",
                        }}
                      ></div>
                      <h3 style={{
                        color: colors.darkBrown,
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        marginBottom: "1rem",
                        textAlign: "center",
                        textShadow: `0 2px 4px ${colors.darkBrown}20`,
                      }}>
                        {isNewUser() ? "Setting up Your Free Trial..." : "Processing Subscription..."}
                      </h3>
                      <p style={{
                        color: colors.mediumBrown,
                        fontSize: "1.1rem",
                        textAlign: "center",
                        lineHeight: "1.6",
                        maxWidth: "350px",
                        fontWeight: 500,
                        textShadow: `0 1px 2px ${colors.darkBrown}10`,
                      }}>
                        🔒 {isNewUser() ? "Activating your 3-month free trial" : "Securing your subscription"}...
                        <br />
                        <strong>Please do not close this window.</strong>
                      </p>
                      
                      {/* Progress indicator */}
                      <div style={{
                        marginTop: "2rem",
                        width: "200px",
                        height: "4px",
                        background: colors.lightTan,
                        borderRadius: "2px",
                        overflow: "hidden",
                        position: "relative",
                      }}>
                        <div style={{
                          width: "50%",
                          height: "100%",
                          background: `linear-gradient(90deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
                          borderRadius: "2px",
                          animation: "progressSlide 2s linear infinite",
                        }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plan Change Confirmation Modal */}
            {showPlanChangeConfirm && (
              <div style={styles.planChangeModal}>
                <div style={styles.modalContent}>
                  <h3 style={styles.modalTitle}>Confirm Plan Change</h3>
                  <p style={styles.modalText}>
                    You are about to <strong style={{ color: colors.accentGold }}>{upgradeDowngradeAction}</strong> from{" "}
                    <strong style={{ color: colors.darkBrown }}>{currentSubscription?.plan || "Discover"}</strong> to{" "}
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
                      <strong>Current:</strong> R{currentSubscription?.amount || 0}/
                      {currentSubscription?.cycle || "monthly"}
                    </div>
                    <div style={{ color: colors.mediumBrown }}>
                      <strong>New:</strong>{" "}
                      {plans[selectedPlan].price[billingCycle] === 0
                        ? "Free"
                        : isNewUser() 
                          ? `FREE for 3 months, then R${plans[selectedPlan].price[billingCycle]}/${billingCycle === "monthly" ? "month" : "year"}`
                          : `R${plans[selectedPlan].price[billingCycle]}/${billingCycle === "monthly" ? "month" : "year"}`}
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
                      style={styles.button}
                      onMouseEnter={(e) => {
                        e.target.style.transform = "translateY(-2px)"
                        e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}66`
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "translateY(0)"
                        e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}4D`
                      }}
                      onClick={confirmPlanChange}
                    >
                      {upgradeDowngradeAction === "downgrade" && selectedPlan === "discover"
                        ? "Confirm Downgrade"
                        : isNewUser() 
                          ? `Start Free Trial`
                          : `Pay & ${upgradeDowngradeAction}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Downgrade Options Modal */}
            {showDowngradeOptions && (
              <div style={styles.planChangeModal}>
                <div style={styles.modalContent}>
                  <h3 style={styles.modalTitle}>Choose Downgrade Option</h3>
                  <p style={styles.modalText}>Select which plan you'd like to downgrade to:</p>
                  <div style={{ margin: "2rem 0" }}>
                    {currentSubscription?.plan.toLowerCase() === "partner" && (
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
                          R {plans.engage.price[billingCycle].toLocaleString()}/
                          {billingCycle === "monthly" ? "month" : "year"}
                        </div>
                        <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>
                          Keep most features, save R{" "}
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

            {/* Subscription management options for existing users */}
            {isExistingUser && currentSubscription && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                  borderRadius: "16px",
                  padding: "2rem",
                  marginTop: "3rem",
                  border: `1px solid ${colors.lightTan}`,
                }}
              >
                <h3
                  style={{
                    color: colors.darkBrown,
                    marginBottom: "1.5rem",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  Subscription Management
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginTop: "1.5rem",
                  }}
                >
                  <button
                    style={{
                      padding: "1rem 1.5rem",
                      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.lightBrown} 100%)`,
                      color: colors.lightText,
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      textAlign: "center",
                    }}
                    onClick={() => {
                      alert("Update payment method feature coming soon!")
                    }}
                  >
                    💳 Update Payment Method
                  </button>

                  <button
                    style={{
                      padding: "1rem 1.5rem",
                      background: `linear-gradient(135deg, ${colors.featureCross} 0%, #B71C1C 100%)`,
                      color: colors.lightText,
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      textAlign: "center",
                    }}
                    onClick={handleCancelSubscription}
                  >
                    ❌ Cancel Subscription
                  </button>
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes progressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
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