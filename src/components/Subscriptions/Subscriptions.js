// components/Subscriptions/ReusableSubscription.js
"use client"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import EmbeddedCheckout from "../EmbeddedCheckout"
import { colors } from "../../shared/theme"
import { getSubStyles } from "./Styles"
import { 
  getPlanData, 
  getFeatureOrder, 
  getPlanOrder, 
  getCardBackgrounds,
  getDefaultUserData,
  getFreePlanKey,
  getPopularPlanKey,
  isPopularPlan,
  getAddOns
} from "../../config/subscriptionsConfig"
import { validate, saveToFirebase, updateCurrentPlan } from "./Actions"

const createSubscriptionCheckout = async (
  amount,
  currency,
  userId,
  planName,
  billingCycle,
  actionType = "subscription",
  userType = "investor"
) => {
  try {
    console.log("🔄 Creating subscription checkout:", { 
      amount, currency, userId, planName, billingCycle, actionType, userType 
    })

    // ✅ NEW: Validate required fields before making the request
    if (!userId || !planName || !billingCycle) {
      throw new Error("Missing required fields: userId, planName, or billingCycle")
    }

    // ✅ NEW: Check for new user eligibility for trial period
    const isTrialEligible = actionType === "subscription" || actionType === "upgrade"

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ NEW: Added toString() conversions for safety and type consistency
        userId: userId.toString(),
        planName: planName.toString(),
        billingCycle: billingCycle.toString(),
        // ✅ NEW: Ensure amount is a number with proper handling
        amount: Number(amount) || 0,
        currency: currency || "ZAR",
        // ✅ NEW: Provide default values for optional fields
        customerEmail: getAuth().currentUser?.email || "",
        customerName: getAuth().currentUser?.displayName || "",
        actionType: actionType || "subscription",
        userType: userType || "investor",
        // ✅ NEW: Store original price for future billing
        originalAmount: Number(amount) || 0,
        // ✅ NEW: Enhanced trial period handling
        isTrialPeriod: isTrialEligible,
        // ✅ NEW: Trial duration configuration
        trialDuration: isTrialEligible ? 3 : 0, // 3 months trial for eligible users
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

// UPDATED: Enhanced createOneTimeCheckout function with better error handling
const createOneTimeCheckout = async (
  amount,
  currency,
  userId,
  itemName,
  itemId,
  actionType = "addon",
  userType = "investor"
) => {
  try {
    console.log("💳 Creating one-time checkout for add-on:", { 
      amount, currency, userId, itemName, itemId, actionType, userType 
    })

    // ✅ NEW: Validate required fields
    if (!userId || !itemName || !itemId) {
      throw new Error("Missing required fields for one-time checkout")
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // ✅ NEW: Type-safe data formatting
        userId: userId.toString(),
        itemName: itemName.toString(),
        itemId: itemId.toString(),
        amount: Number(amount) || 0,
        currency: currency || "ZAR",
        // ✅ NEW: Default values for optional fields
        customerEmail: getAuth().currentUser?.email || "",
        customerName: getAuth().currentUser?.displayName || "",
        actionType: actionType || "addon",
        userType: userType || "investor",
        // ✅ NEW: Add metadata for better tracking
        checkoutMetadata: {
          type: actionType,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        },
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

const ReusableSubscription = ({ 
  userType = "investor",
  sidebarOpen = true, 
  sidebarWidth = 280, 
  onSidebarToggle,
  // Additional props
  showAddOns = false,
  customTitle = null,
  customSubtitle = null
}) => {
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
  const [showAddOnModal, setShowAddOnModal] = useState(false)
  const [selectedAddOn, setSelectedAddOn] = useState(null)
  const [hoveredPlan, setHoveredPlan] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [checkoutId, setCheckoutId] = useState(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // Get configuration based on user type
  const plans = getPlanData(userType)
  const featureOrder = getFeatureOrder(userType)
  const planOrder = getPlanOrder(userType)
  const cardBackgrounds = getCardBackgrounds(userType)
  const defaultData = getDefaultUserData(userType)
  const freePlanKey = getFreePlanKey(userType)
  const popularPlanKey = getPopularPlanKey(userType)
  const addOns = showAddOns ? getAddOns(userType) : []

  const [selectedPlan, setSelectedPlan] = useState(freePlanKey)
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [email, setEmail] = useState(defaultData.email)
  const [fullName, setFullName] = useState(defaultData.fullName)
  const [companyName, setCompanyName] = useState("")
  const [history, setHistory] = useState([])
  const [errors, setErrors] = useState({})

  // Internal sidebar state
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true)
  const [internalSidebarWidth, setInternalSidebarWidth] = useState(280)

  // Detect whether the global sidebar is collapsed (body class)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  useEffect(() => {
    const checkSidebarState = () => {
      setIsSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"))
    }

    checkSidebarState()

    const observer = new MutationObserver(checkSidebarState)
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] })

    return () => observer.disconnect()
  }, [])

  // Use props if provided, otherwise use internal state
  const currentSidebarOpen = sidebarOpen !== undefined ? sidebarOpen : internalSidebarOpen
  const currentSidebarWidth = sidebarWidth !== undefined ? sidebarWidth : internalSidebarWidth

  const styles = getSubStyles(currentSidebarOpen, currentSidebarWidth)

  // Helper function to check if user is new (for trial eligibility)
  const isNewUser = () => {
    return !isExistingUser || !currentSubscription || 
           currentSubscription.plan === plans[freePlanKey].name
  }

  // Helper function to safely get plan name based on user type
  const getCurrentPlanKey = () => {
    if (!currentSubscription || !currentSubscription.plan) {
      return freePlanKey
    }

    const currentPlanName = currentSubscription.plan
    
    // Find matching plan key
    for (const [key, plan] of Object.entries(plans)) {
      if (plan.name === currentPlanName) {
        return key
      }
    }

    // Default to free plan for any invalid plan
    return freePlanKey
  }

  // Helper function to get the correct plan display name
  const getCurrentPlanDisplayName = () => {
    const planKey = getCurrentPlanKey()
    return plans[planKey]?.name || plans[freePlanKey].name
  }

  // Helper function to get the correct plan amount for display
  const getCurrentPlanAmount = () => {
    if (!currentSubscription) return 0

    const planKey = getCurrentPlanKey()
    const cycle = currentSubscription?.cycle || "monthly"

    if (!plans[planKey]) {
      console.warn(`Plan "${planKey}" not found, defaulting to ${freePlanKey}`)
      return 0
    }

    return plans[planKey]?.price?.[cycle] || 0
  }

  // Enhanced load user subscription data
  const loadUserSubscription = async (userId) => {
    console.log(`🔍 Loading ${userType} subscription for user:`, userId)
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
            autoRenew:
              userData.currentSubscription.status === "active" || userData.currentSubscription.status === "Success",
            isTrialPeriod: userData.currentSubscription.isTrialPeriod || false,
            originalAmount: userData.currentSubscription.originalAmount,
            trialStartDate: userData.currentSubscription.trialStartDate,
            trialEndDate: userData.currentSubscription.trialEndDate,
          }

          setCurrentSubscription(subscriptionFromUser)
          setIsExistingUser(true)

          // Safely set selected plan
          const planKey = getCurrentPlanKey()
          setSelectedPlan(planKey)
          console.log("✅ Set subscription from user document")
        }
      }

      // Also check subscriptions collection as backup
      const subscriptionsRef = collection(db, "subscriptions")
      const queries = [
        query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "Success")),
        query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "Active")),
        query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "active")),
      ]

      const queryResults = await Promise.all(queries.map((q) => getDocs(q)))
      const allSubscriptions = []

      queryResults.forEach((querySnapshot) => {
        querySnapshot.forEach((doc) => {
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
        const latestSubscription = allSubscriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

        console.log("📄 Latest subscription from collection:", latestSubscription)

        // Use collection data if user doc doesn't have subscription or if collection is more recent
        if (
          !currentSubscription ||
          new Date(latestSubscription.createdAt) > new Date(currentSubscription.createdAt || 0)
        ) {
          setCurrentSubscription(latestSubscription)
          setIsExistingUser(true)

          // Safely set selected plan
          const planKey = getCurrentPlanKey()
          setSelectedPlan(planKey)
          console.log("✅ Set subscription from collection")
        }
      }

      // Set history (filter out add-ons from main history)
      const subscriptionHistory = allSubscriptions
        .filter((record) => !record.type || record.type !== "addon")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      setHistory(subscriptionHistory)
    } catch (error) {
      console.error("❌ Error loading user subscription:", error)
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
          <span style={styles.savingsBadge}>
            Save up to R{(() => {
              // Calculate maximum savings
              let maxSavings = 0
              Object.values(plans).forEach(plan => {
                if (plan.price.annually > 0 && plan.price.monthly > 0) {
                  const savings = (plan.price.monthly * 12) - plan.price.annually
                  if (savings > maxSavings) maxSavings = savings
                }
              })
              return maxSavings.toLocaleString()
            })()}
          </span>
        </div>
      </div>
    </div>
  )

  // Feature comparison table component
  const FeatureComparisonTable = () => {
    const planKeys = Object.keys(plans)
    
    return (
      <div style={styles.featureComparisonContainer}>
        <div style={styles.featureComparisonTitle}>
          <span>Plan Features Comparison</span>
        </div>
        <BillingCycleToggle />
        <div style={{ overflowX: "auto" }}>
          <table style={styles.featureComparisonTable}>
            <thead>
              <tr>
                <th style={styles.featureTh}>Feature</th>
                {planKeys.map((planKey) => (
                  <th key={planKey} style={styles.featureTh}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <div
                        style={{ 
                          width: "12px", 
                          height: "12px", 
                          background: colors.accentGold, 
                          borderRadius: "50%" 
                        }}
                      ></div>
                      {plans[planKey].name} {plans[planKey].price[billingCycle] === 0 ? "(Free)" : ""}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureOrder.map((feature, index) => (
                <tr key={feature} style={{ backgroundColor: index % 2 === 0 ? `${colors.cream}4D` : "transparent" }}>
                  <td style={{ ...styles.featureTd, ...styles.featureTdLeft }}>{feature}</td>
                  {planKeys.map((planKey) => (
                    <td key={planKey} style={styles.featureTd}>
                      {(() => {
                        const value = plans[planKey].features[feature]
                        if (value === true) {
                          return <span style={{ color: colors.featureCheck, fontWeight: "bold" }}>✓</span>
                        } else if (value === false) {
                          return <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                        } else if (typeof value === "string") {
                          return <span style={{ color: colors.mediumBrown }}>{value}</span>
                        } else {
                          return value
                        }
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {billingCycle === "annually" && (
          <div style={styles.annualDiscount}>
            <strong>Annual Discount Options:</strong>
            <div>
              {planKeys.map((planKey, index) => {
                const plan = plans[planKey]
                const monthly = plan.price.monthly
                const annual = plan.price.annually
                const savings = (monthly * 12) - annual
                
                return (
                  <span key={planKey}>
                    {plan.name}: {annual === 0 ? "N/A" : `R${annual}/year${savings > 0 ? ` (save R${savings})` : ''}`}
                    {index < planKeys.length - 1 ? " | " : ""}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Handle plan selection
  const handlePlanSelect = (planKey) => {
    console.log("Plan selected:", planKey)
    setSelectedPlan(planKey)
    setErrors({})

    if (isExistingUser && currentSubscription) {
      const currentPlanKey = getCurrentPlanKey()
      if (planKey !== currentPlanKey) {
        const action = planOrder[planKey] > planOrder[currentPlanKey] ? "upgrade" : "downgrade"
        setUpgradeDowngradeAction(action)
        setShowPlanChangeConfirm(true)
        setShowDowngradeOptions(false)
      }
    }
  }

  // Handle downgrade options
  const handleDowngradeClick = () => {
    setShowDowngradeOptions(true)
  }

  const handleDowngradeSelect = (targetPlan) => {
    setSelectedPlan(targetPlan)
    setUpgradeDowngradeAction("downgrade")
    setShowDowngradeOptions(false)
    setShowPlanChangeConfirm(true)
  }

  const cancelDowngradeOptions = () => {
    setShowDowngradeOptions(false)
  }

  // Confirm plan change
  const confirmPlanChange = () => {
    console.log("=== CONFIRM PLAN CHANGE DEBUG ===")
    console.log("upgradeDowngradeAction:", upgradeDowngradeAction)
    console.log("selectedPlan:", selectedPlan)
    console.log("currentSubscription:", currentSubscription)

    if (upgradeDowngradeAction === "downgrade" && selectedPlan === freePlanKey) {
      console.log("Calling handleDowngradeToFree...")
      handleDowngradeToFree()
    } else {
      console.log("Calling handlePay for upgrade/downgrade...")
      setShowPlanChangeConfirm(false)
      handlePay()
    }
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
        userType: userType,
        action: "downgrade",
        transactionRef: `downgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      await saveToFirebase(newRecord)
      await updateCurrentPlan(plans[selectedPlan].name, billingCycle, { userType })
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

    const confirmMessage = `Are you sure you want to cancel your ${currentSubscription.plan} subscription?\n\nThis will:\n• Stop automatic renewals\n• Downgrade you to ${plans[freePlanKey].name} plan\n• Remove premium features\n\nThis action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      // Create cancellation record
      const cancellationRecord = {
        id: uuidv4(),
        email: email,
        plan: plans[freePlanKey].name,
        cycle: "monthly",
        amount: 0,
        fullName: fullName,
        companyName: companyName,
        createdAt: new Date().toISOString(),
        status: "Success",
        autoRenew: false,
        userId: user.uid,
        userType: userType,
        action: "cancellation",
        previousPlan: currentSubscription.plan,
        transactionRef: `cancellation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      // Save cancellation record
      await saveToFirebase(cancellationRecord)

      // Update current plan to free plan
      await updateCurrentPlan(plans[freePlanKey].name, "monthly", { userType })

      // Update local state
      setHistory([cancellationRecord, ...history])
      setCurrentSubscription(cancellationRecord)
      setSelectedPlan(freePlanKey)

      alert(
        `Subscription cancelled successfully!\n\nYou've been downgraded to the ${plans[freePlanKey].name} plan.\nYour premium features will remain active until the end of your current billing period.`,
      )

      // Reload subscription data
      setTimeout(() => {
        loadUserSubscription(user.uid)
      }, 1000)
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      alert("Failed to cancel subscription. Please try again or contact support.")
    }
  }

  // Handle payment with proper subscription vs one-time logic
  const handlePay = async () => {
    console.log("Starting payment process for plan:", selectedPlan)

    if (!user) {
      alert("Please log in to subscribe")
      return
    }

    const planPrice = plans[selectedPlan].price[billingCycle]

    // Handle free plan
    if (planPrice === 0) {
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
          userType: userType,
          action: isExistingUser ? upgradeDowngradeAction || "downgrade" : "new_subscription",
        }

        setHistory([newRecord, ...history])
        await saveToFirebase(newRecord)
        await updateCurrentPlan(plans[selectedPlan].name, billingCycle, { userType })
        setCurrentSubscription(newRecord)
        setIsExistingUser(true)
        alert(`${plans[selectedPlan].name} plan activated successfully!`)

        // Clear any upgrade/downgrade state
        setUpgradeDowngradeAction(null)
        setShowPlanChangeConfirm(false)

        return
      } catch (error) {
        console.error("Error activating free plan:", error)
        alert("Failed to activate plan. Please try again.")
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
        isExistingUser ? upgradeDowngradeAction || "upgrade" : "subscription",
        userType
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

  // Handle add-on purchase
  const handleAddOnClick = (addOn) => {
    setSelectedAddOn(addOn)
    setShowAddOnModal(true)
  }

  const handleAddOnPayment = async () => {
    if (!user || !selectedAddOn) {
      alert("Please log in to purchase add-ons")
      return
    }

    console.log("Creating add-on checkout...")
    setPaymentProcessing(true)

    try {
      const checkoutData = await createOneTimeCheckout(
        selectedAddOn.amount,
        "ZAR",
        user.uid,
        selectedAddOn.name,
        selectedAddOn.id,
        "addon",
        userType
      )

      if (checkoutData.success && checkoutData.checkoutId) {
        setCheckoutId(checkoutData.checkoutId)
        setShowCheckout(true)
        setShowAddOnModal(false)
      } else {
        throw new Error(checkoutData.error || "Failed to create add-on checkout")
      }
    } catch (error) {
      console.error("Add-on checkout creation error:", error)
      alert(`Failed to initialize add-on payment: ${error.message}. Please try again.`)
    } finally {
      setPaymentProcessing(false)
    }
  }

  // Handle checkout completion
  const handleCheckoutCompleted = async (event) => {
    console.log("🎉 Payment completed:", event)
    setPaymentProcessing(true)

    try {
      // Handle add-on payment
      if (selectedAddOn) {
        const addOnRecord = {
          id: uuidv4(),
          email: email,
          type: "addon",
          addonName: selectedAddOn.name,
          addonId: selectedAddOn.id,
          amount: selectedAddOn.amount,
          fullName: fullName,
          companyName: companyName,
          createdAt: new Date().toISOString(),
          status: "Success",
          transactionRef: event.id || event.transactionId,
          userId: user.uid,
          userType: userType,
        }

        await saveToFirebase(addOnRecord)
        setHistory([addOnRecord, ...history])
        alert(`Payment successful! ${selectedAddOn.name} has been added to your account.`)
        setShowCheckout(false)
        setSelectedAddOn(null)
        setPaymentProcessing(false)
        return
      }

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
        amount: 0,
        originalAmount: plans[selectedPlan].price[billingCycle],
        fullName: fullName,
        companyName,
        createdAt: new Date().toISOString(),
        status: "Success",
        autoRenew: true,
        transactionRef: event.id || event.transactionId || `trial_${Date.now()}`,
        userId: user.uid,
        userType: userType,
        subscriptionType: "recurring",
        isTrialPeriod: isTrialEligible,
        trialStartDate: isTrialEligible ? trialStartDate.toISOString() : null,
        trialEndDate: isTrialEligible ? trialEndDate.toISOString() : null,
        ...(event.registrationId && { registrationId: event.registrationId }),
        ...(event.cardBrand && { cardBrand: event.cardBrand }),
        ...(event.cardLast4 && { cardLast4: event.cardLast4 }),
        action: isExistingUser ? upgradeDowngradeAction || "upgrade" : "new_subscription",
        paymentCompleted: true,
        paymentDate: new Date().toISOString(),
      }

      console.log("💾 Saving subscription record:", newRecord)

      // Save to Firebase
      await saveToFirebase(newRecord)

      // Update current plan with additional data
      const additionalData = {
        amount: newRecord.amount,
        originalAmount: newRecord.originalAmount,
        isTrialPeriod: newRecord.isTrialPeriod,
        trialStartDate: newRecord.trialStartDate,
        trialEndDate: newRecord.trialEndDate,
        transactionRef: newRecord.transactionRef,
        userType: userType
      }

      await updateCurrentPlan(plans[selectedPlan].name, billingCycle, additionalData)

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
      alert(
        `❌ Payment Error\n\nYour payment was processed but there was an error saving your subscription:\n\n${error.message}\n\nPlease contact support with your transaction ID: ${event.id || event.transactionId}`,
      )
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

  // Enhanced user data loading
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setEmail(userData.email || user.email || defaultData.email)
            setFullName(userData.displayName || userData.fullName || defaultData.fullName)
            setCompanyName(userData.companyName || "")
          } else {
            setEmail(user.email || defaultData.email)
            setFullName(user.displayName || defaultData.fullName)
          }

          await loadUserSubscription(user.uid)
        } catch (error) {
          console.error("Error loading user data:", error)
          setEmail(user.email || defaultData.email)
          setFullName(user.displayName || defaultData.fullName)
          await loadUserSubscription(user.uid)
        }
      }
    }

    loadUserData()
  }, [user])

  // Dynamic container style to respect sidebar collapse and header spacer
  const containerStyle = {
    ...styles.container,
    marginLeft: isSidebarCollapsed ? "80px" : (currentSidebarOpen ? `${currentSidebarWidth}px` : "0px"),
    paddingTop: "72px",
  }

  if (isLoading) {
    return (
      <div style={containerStyle}>
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
    <div style={containerStyle}>
      <div style={styles.mainCard}>
        <div style={styles.decorativeElement}></div>

        {/* Beta Notice with Trial Information */}
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
            <h1 style={styles.pageTitle}>
              {customTitle || "Manage Your Subscription"}
            </h1>
            <p style={styles.subtitle}>
              {customSubtitle || "Upgrade, downgrade, or manage your current plan with ease"}
            </p>

            {/* Current subscription info with trial details */}
            <div style={styles.subscriptionInfo}>
              <h3 style={styles.subscriptionTitle}>Current Subscription</h3>
              <div style={styles.subscriptionDetail}>
                <span>Plan:</span>
                <span style={{ fontWeight: 600 }}>{getCurrentPlanDisplayName()}</span>
              </div>
              <div style={styles.subscriptionDetail}>
                <span>Billing Cycle:</span>
                <span style={{ fontWeight: 600 }}>{currentSubscription.cycle || "Monthly"}</span>
              </div>
              <div style={styles.subscriptionDetail}>
                <span>Current Amount:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: currentSubscription.isTrialPeriod ? colors.trialBrown : colors.darkText,
                  }}
                >
                  {currentSubscription.amount === 0 && currentSubscription.isTrialPeriod
                    ? "FREE (Trial)"
                    : currentSubscription.amount === 0
                      ? "Free"
                      : `R${getCurrentPlanAmount().toLocaleString()}`}
                </span>
              </div>
              {currentSubscription.originalAmount && currentSubscription.originalAmount > 0 && (
                <div style={styles.subscriptionDetail}>
                  <span>Regular Price:</span>
                  <span style={{ fontWeight: 600 }}>
                    R{currentSubscription.originalAmount}/
                    {currentSubscription.cycle?.slice(0, -2) || "month"}
                  </span>
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
                <span
                  style={{
                    fontWeight: 600,
                    color: currentSubscription.status === "Success" || currentSubscription.status === "active"
                      ? colors.featureCheck
                      : colors.featureCross,
                  }}
                >
                  {currentSubscription.status === "Success" ? "Active" : currentSubscription.status}
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
                    {currentSubscription.cardBrand || "Card"} ending in {currentSubscription.cardLast4}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 style={styles.pageTitle}>
              {customTitle || "Choose Your Plan"}
            </h1>
            <p style={styles.subtitle}>
              {customSubtitle || "Select the perfect plan for your business needs - first 3 months free!"}
            </p>
          </>
        )}

        {/* Feature Comparison Table */}
        <FeatureComparisonTable />

        {/* Pricing Cards */}
        <div style={styles.planGrid}>
          {Object.entries(plans).map(([planKey, plan]) => {
            const isCurrentPlan = isExistingUser && getCurrentPlanKey() === planKey
            const isSelected = selectedPlan === planKey
            const isHovered = hoveredPlan === planKey
            const isPopular = planKey === popularPlanKey
            const showTrialOffer = plan.price[billingCycle] > 0 && isNewUser()

            // Get card background from config
            const cardBackground = cardBackgrounds[planKey] || colors.offWhite

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
                <h3 style={styles.planName}>{plan.name}</h3>

                {plan.price[billingCycle] === 0 ? (
                  <div style={styles.planPrice}>Free</div>
                ) : (
                  <>
                    {showTrialOffer ? (
                      <div style={styles.planPriceFree}>FREE</div>
                    ) : (
                      <div style={styles.planPrice}>R{plan.price[billingCycle]}</div>
                    )}

                    {!showTrialOffer && (
                      <span style={styles.planPricePeriod}>
                        / {billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </>
                )}

                <p style={styles.planDescriptionText}>{plan.description}</p>

                {/* Trial Badge for eligible plans */}
                {showTrialOffer && <div style={styles.freeMonthsBadge}>🎉 First 3 Months FREE!</div>}

                {/* "After Trial" pricing information */}
                {showTrialOffer && (
                  <div style={styles.afterTrialPrice}>
                    <strong>After 3-month trial:</strong>
                    <br />
                    R{plan.price[billingCycle]} / {billingCycle === "monthly" ? "month" : "year"}
                  </div>
                )}

                <ul style={styles.planFeaturesList}>
                  {plan.highlights.map((feature, index) => (
                    <li key={index} style={styles.planFeatureItem}>
                      <span style={{ ...styles.featureIcon, ...styles.featureCheckIcon }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
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
                    style={styles.selectButton}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlanSelect(planKey)
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = colors.mediumBrown
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`
                    }}
                  >
                    {isExistingUser ? (
                      plan.price[billingCycle] === 0 ? (
                        "Downgrade"
                      ) : showTrialOffer ? (
                        "Start Free Trial"
                      ) : (
                        "Upgrade"
                      )
                    ) : showTrialOffer ? (
                      "Start Free Trial"
                    ) : (
                      "Subscribe"
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
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button
              style={{
                ...styles.paymentButton,
                ...(paymentProcessing ? styles.paymentButtonDisabled : {}),
              }}
              onClick={handlePay}
              disabled={paymentProcessing}
            >
              {paymentProcessing ? (
                <>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid transparent",
                      borderTop: "2px solid currentColor",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      marginRight: "0.5rem",
                    }}
                  ></div>
                  Processing...
                </>
              ) : (
                (() => {
                  if (plans[selectedPlan].price[billingCycle] === 0) {
                    return `Activate ${plans[selectedPlan].name} Plan`
                  } else if (isExistingUser) {
                    if (upgradeDowngradeAction === "upgrade") {
                      return isNewUser()
                        ? `Start ${plans[selectedPlan].name} Trial (FREE)`
                        : `Upgrade to ${plans[selectedPlan].name}`
                    } else {
                      return `Change to ${plans[selectedPlan].name}`
                    }
                  } else {
                    return isNewUser()
                      ? `Start ${plans[selectedPlan].name} Trial (FREE)`
                      : `Subscribe to ${plans[selectedPlan].name}`
                  }
                })()
              )}
            </button>

            {/* Enhanced Payment info for subscriptions with trial details */}
            {plans[selectedPlan].price[billingCycle] > 0 && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
                  borderRadius: "12px",
                  padding: "1.5rem",
                  marginTop: "1.5rem",
                  border: `1px solid ${colors.lightTan}`,
                  textAlign: "left",
                }}
              >
                <h4
                  style={{
                    color: colors.darkBrown,
                    marginBottom: "1rem",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  🎉 {isNewUser() ? "Free Trial Setup" : "Secure Subscription Payment"}
                </h4>

                {isNewUser() && (
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${colors.trialBrown}20 0%, ${colors.accentGold}20 100%)`,
                      borderRadius: "8px",
                      padding: "1rem",
                      marginBottom: "1rem",
                      border: `1px solid ${colors.trialBrown}`,
                    }}
                  >
                    <p
                      style={{
                        color: colors.darkBrown,
                        margin: 0,
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      ✨ <strong>3-Month Free Trial:</strong> No charges for 3 months!
                    </p>
                    <p
                      style={{
                        color: colors.mediumBrown,
                        margin: "0.5rem 0 0 1.5rem",
                        fontSize: "0.85rem",
                        lineHeight: "1.4",
                      }}
                    >
                      Your card will be saved for automatic billing after the trial period ends. Cancel anytime during
                      the trial with no charges.
                    </p>
                  </div>
                )}

                <div
                  style={{
                    background: `linear-gradient(135deg, ${colors.accentGold}20 0%, ${colors.lightTan}40 100%)`,
                    borderRadius: "8px",
                    padding: "1rem",
                    marginBottom: "1rem",
                    border: `1px solid ${colors.accentGold}`,
                  }}
                >
                  <p
                    style={{
                      color: colors.darkBrown,
                      margin: 0,
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    💳 <strong>Important:</strong> For automatic renewals, please pay with a{" "}
                    <strong>Credit or Debit Card</strong>
                  </p>
                  <p
                    style={{
                      color: colors.mediumBrown,
                      margin: "0.5rem 0 0 1.5rem",
                      fontSize: "0.85rem",
                      lineHeight: "1.4",
                    }}
                  >
                    Other payment methods (Scan to Pay, EFT) will complete this payment but won't enable automatic
                    subscription renewals.
                  </p>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    color: colors.darkText,
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                  }}
                >
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
                    {isNewUser()
                      ? `Billing starts at R${plans[selectedPlan].price[billingCycle]} per ${billingCycle.slice(0, -2)} after trial`
                      : `Automatic billing at R${plans[selectedPlan].price[billingCycle]} per ${billingCycle.slice(0, -2)}`}
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
        )}

        {/* Add-ons Section */}
        {showAddOns && addOns.length > 0 && (
          <div style={styles.addOnsSection}>
            <h3 style={styles.addOnsTitle}>Add-ons</h3>
            <div style={styles.addOnsGrid}>
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  style={styles.addOnItem}
                  onClick={() => handleAddOnClick(addOn)}
                  // onMouseEnter={(e) => {
                  //   e.target.style.transform = "translateY(-4px)"
                  //   e.target.style.boxShadow = `0 8px 20px ${colors.darkBrown}26`
                  // }}
                  // onMouseLeave={(e) => {
                  //   e.target.style.transform = "translateY(0)"
                  //   e.target.style.boxShadow = "none"
                  // }}
                >
                  <div style={styles.addOnName}>{addOn.name}</div>
                  <div style={styles.addOnDescription}>{addOn.description}</div>
                  <div style={styles.addOnPrice}>{addOn.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downgrade Section */}
        {isExistingUser && currentSubscription && getCurrentPlanKey() !== freePlanKey && (
          <div style={styles.downgradeSection}>
            <h3 style={{ color: colors.darkBrown, marginBottom: "1rem", fontSize: "1.25rem" }}>
              Need to change your plan?
            </h3>
            <p style={{ color: colors.mediumBrown, marginBottom: "1.5rem" }}>
              You can downgrade to a lower-tier plan anytime.
            </p>
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
              onClick={handleDowngradeClick}
            >
              Downgrade Plan
            </button>
          </div>
        )}

        {/* Enhanced Checkout Modal with Loading States */}
        {showCheckout && checkoutId && (
          <div style={styles.planChangeModal}>
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
                {selectedAddOn ? "Complete Your Purchase" : 
                 isNewUser() ? "Start Your Free Trial" : "Complete Your Subscription"}
              </h2>

              <div
                style={{
                  background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                  borderRadius: "12px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  border: `1px solid ${colors.lightTan}`,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: colors.darkBrown,
                    margin: 0,
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {selectedAddOn ? (
                    <>🛒 Purchasing {selectedAddOn.name}</>
                  ) : isNewUser() ? (
                    <>🎉 Starting {plans[selectedPlan].name} Free Trial</>
                  ) : (
                    <>🔄 Setting up {plans[selectedPlan].name} Plan</>
                  )}
                </p>
                <p
                  style={{
                    color: colors.mediumBrown,
                    margin: "0.5rem 0 0 0",
                    fontSize: "0.9rem",
                  }}
                >
                  {selectedAddOn ? (
                    "One-time purchase - no recurring charges"
                  ) : isNewUser() ? (
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
                paymentType={selectedAddOn ? "addon" : "subscription"}
                amount={selectedAddOn ? selectedAddOn.amount : 0}
                planName={selectedAddOn ? undefined : plans[selectedPlan].name}
                toolName={selectedAddOn ? selectedAddOn.name : undefined}
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
                <div
                  style={{
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
                  }}
                >
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
                  <h3
                    style={{
                      color: colors.darkBrown,
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      marginBottom: "1rem",
                      textAlign: "center",
                      textShadow: `0 2px 4px ${colors.darkBrown}20`,
                    }}
                  >
                    {selectedAddOn ? "Processing Add-on Purchase..." : 
                     isNewUser() ? "Setting up Your Free Trial..." : "Processing Subscription..."}
                  </h3>
                  <p
                    style={{
                      color: colors.mediumBrown,
                      fontSize: "1.1rem",
                      textAlign: "center",
                      lineHeight: "1.6",
                      maxWidth: "350px",
                      fontWeight: 500,
                      textShadow: `0 1px 2px ${colors.darkBrown}10`,
                    }}
                  >
                    🔒 {selectedAddOn ? "Securing your add-on purchase" : 
                     isNewUser() ? "Activating your 3-month free trial" : "Securing your subscription"}...
                    <br />
                    <strong>Please do not close this window.</strong>
                  </p>

                  {/* Progress indicator */}
                  <div
                    style={{
                      marginTop: "2rem",
                      width: "200px",
                      height: "4px",
                      background: colors.lightTan,
                      borderRadius: "2px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: "50%",
                        height: "100%",
                        background: `linear-gradient(90deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
                        borderRadius: "2px",
                        animation: "progressSlide 2s linear infinite",
                      }}
                    ></div>
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
                <strong style={{ color: colors.darkBrown }}>{currentSubscription?.plan || plans[freePlanKey].name}</strong> to{" "}
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
                  {upgradeDowngradeAction === "downgrade" && selectedPlan === freePlanKey
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
                {/* Show intermediate plans between current and free */}
                {Object.entries(plans)
                  .filter(([planKey]) => 
                    planOrder[planKey] < planOrder[getCurrentPlanKey()] && 
                    planOrder[planKey] > 0
                  )
                  .map(([planKey, plan]) => (
                    <div
                      key={planKey}
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
                      onClick={() => handleDowngradeSelect(planKey)}
                    >
                      <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>
                        {plan.name} Plan
                      </div>
                      <div style={{ color: colors.mediumBrown, marginTop: "0.5rem" }}>
                        {plan.price[billingCycle] === 0 
                          ? "Free" 
                          : `R ${plan.price[billingCycle]}/${billingCycle === "monthly" ? "month" : "year"}`}
                      </div>
                      <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>
                        Save R{getCurrentPlanAmount() - plan.price[billingCycle]}/month
                      </p>
                    </div>
                  ))}
                
                {/* Always show free plan option */}
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
                  onClick={() => handleDowngradeSelect(freePlanKey)}
                >
                  <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>
                    {plans[freePlanKey].name} Plan
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

        {/* Add-on Modal */}
        {showAddOnModal && selectedAddOn && (
          <div style={styles.planChangeModal}>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>{selectedAddOn.name}</h3>
              <p style={styles.modalText}>{selectedAddOn.description}</p>
              <div
                style={{
                  margin: "2rem 0",
                  padding: "1.5rem",
                  background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
                  borderRadius: "12px",
                  border: `1px solid ${colors.lightTan}`,
                }}
              >
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: colors.accentGold, marginBottom: "0.5rem" }}>
                  {selectedAddOn.price}
                </div>
                <div style={{ color: colors.mediumBrown }}>
                  One-time payment to add this feature to your account.
                </div>
              </div>
              <div style={styles.modalActions}>
                <button
                  style={styles.buttonSecondary}
                  onClick={() => setShowAddOnModal(false)}
                >
                  Close
                </button>
                <button
                  style={styles.button}
                  onClick={handleAddOnPayment}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? "Processing..." : `Purchase for R${selectedAddOn.amount}`}
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

      <style>{`
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

export default ReusableSubscription