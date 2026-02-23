// components/Subscriptions/ReusableSubscription.js
"use client"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
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

// FRONTEND-ONLY: Mock payment processing
const processMockPayment = async (paymentDetails) => {
  console.log("🔄 Processing mock payment:", paymentDetails)
  
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock successful payment response
  return {
    success: true,
    transactionId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    amount: paymentDetails.amount,
    status: "Success",
    message: "Payment processed successfully (mock)"
  }
}

// FRONTEND-ONLY: Save subscription to Firestore
const saveSubscriptionToFirebase = async (subscriptionData) => {
  try {
    const db = getFirestore()
    const subscriptionRef = doc(collection(db, "subscriptions"))
    await setDoc(subscriptionRef, {
      ...subscriptionData,
      id: subscriptionRef.id,
      createdAt: new Date().toISOString()
    })
    
    // Also update user document with current subscription
    const userRef = doc(db, "users", subscriptionData.userId)
    await setDoc(userRef, {
      currentSubscription: {
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        amount: subscriptionData.amount,
        cycle: subscriptionData.cycle,
        lastUpdated: new Date().toISOString(),
        transactionRef: subscriptionData.transactionRef,
        isTrialPeriod: subscriptionData.isTrialPeriod || false,
        originalAmount: subscriptionData.originalAmount,
        trialStartDate: subscriptionData.trialStartDate,
        trialEndDate: subscriptionData.trialEndDate
      }
    }, { merge: true })
    
    return subscriptionRef.id
  } catch (error) {
    console.error("Error saving to Firebase:", error)
    throw error
  }
}

// FRONTEND-ONLY: Update current plan in user document
const updateCurrentPlan = async (planName, billingCycle, additionalData = {}) => {
  try {
    const db = getFirestore()
    const auth = getAuth()
    const user = auth.currentUser
    
    if (!user) throw new Error("No user logged in")
    
    const userRef = doc(db, "users", user.uid)
    await setDoc(userRef, {
      currentSubscription: {
        plan: planName,
        cycle: billingCycle,
        lastUpdated: new Date().toISOString(),
        ...additionalData
      }
    }, { merge: true })
    
    return true
  } catch (error) {
    console.error("Error updating current plan:", error)
    throw error
  }
}

// FRONTEND-ONLY: Validate user input
const validate = (email, fullName) => {
  const errors = {}
  
  if (!email || !email.includes("@")) {
    errors.email = "Valid email is required"
  }
  
  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = "Full name is required"
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

const ReusableSubscription = ({ 
  userType = "investor",
  sidebarOpen = true, 
  sidebarWidth = 280, 
  onSidebarToggle,
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

  // Enhanced load user subscription data (FRONTEND-ONLY)
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

      await saveSubscriptionToFirebase(newRecord)
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
      await saveSubscriptionToFirebase(cancellationRecord)

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

  // FRONTEND-ONLY: Handle payment with mock processing
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
        await saveSubscriptionToFirebase(newRecord)
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

    console.log("Processing mock payment...")
    setPaymentProcessing(true)

    try {
      // FRONTEND-ONLY: Mock payment processing
      const mockPaymentResult = await processMockPayment({
        amount: planPrice,
        currency: "ZAR",
        userId: user.uid,
        planName: plans[selectedPlan].name,
        billingCycle: billingCycle
      })

      console.log("Mock payment processed:", mockPaymentResult)

      if (mockPaymentResult.success) {
        // Handle successful payment
        const isTrialEligible = isNewUser()
        const trialStartDate = new Date()
        const trialEndDate = new Date()
        trialEndDate.setMonth(trialEndDate.getMonth() + 3)

        const newRecord = {
          id: uuidv4(),
          email: email,
          plan: plans[selectedPlan].name,
          cycle: billingCycle,
          amount: 0, // During trial
          originalAmount: plans[selectedPlan].price[billingCycle],
          fullName: fullName,
          companyName,
          createdAt: new Date().toISOString(),
          status: "Success",
          autoRenew: true,
          transactionRef: mockPaymentResult.transactionId,
          userId: user.uid,
          userType: userType,
          subscriptionType: "recurring",
          isTrialPeriod: isTrialEligible,
          trialStartDate: isTrialEligible ? trialStartDate.toISOString() : null,
          trialEndDate: isTrialEligible ? trialEndDate.toISOString() : null,
          action: isExistingUser ? upgradeDowngradeAction || "upgrade" : "new_subscription",
          paymentCompleted: true,
          paymentDate: new Date().toISOString(),
        }

        console.log("💾 Saving subscription record:", newRecord)

        // Save to Firebase
        await saveSubscriptionToFirebase(newRecord)

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
      } else {
        throw new Error(mockPaymentResult.error || "Payment failed")
      }
    } catch (error) {
      console.error("Payment processing error:", error)
      alert(`Failed to process payment: ${error.message}. Please try again.`)
      setPaymentProcessing(false)
    }
  }

  // FRONTEND-ONLY: Handle add-on purchase with mock payment
  const handleAddOnClick = (addOn) => {
    setSelectedAddOn(addOn)
    setShowAddOnModal(true)
  }

  const handleAddOnPayment = async () => {
    if (!user || !selectedAddOn) {
      alert("Please log in to purchase add-ons")
      return
    }

    console.log("Processing add-on payment...")
    setPaymentProcessing(true)

    try {
      // FRONTEND-ONLY: Mock payment processing for add-on
      const mockPaymentResult = await processMockPayment({
        amount: selectedAddOn.amount,
        currency: "ZAR",
        userId: user.uid,
        itemName: selectedAddOn.name,
        itemId: selectedAddOn.id
      })

      if (mockPaymentResult.success) {
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
          transactionRef: mockPaymentResult.transactionId,
          userId: user.uid,
          userType: userType,
        }

        await saveSubscriptionToFirebase(addOnRecord)
        setHistory([addOnRecord, ...history])
        alert(`Payment successful! ${selectedAddOn.name} has been added to your account.`)
        setShowAddOnModal(false)
        setSelectedAddOn(null)
      } else {
        throw new Error(mockPaymentResult.error || "Add-on payment failed")
      }
    } catch (error) {
      console.error("Add-on payment error:", error)
      alert(`Failed to process add-on payment: ${error.message}. Please try again.`)
    } finally {
      setPaymentProcessing(false)
    }
  }

  // Handle checkout completion (simplified for frontend)
  const handleCheckoutCompleted = async (event) => {
    console.log("🎉 Payment completed:", event)
    // This is now handled in handlePay and handleAddOnPayment
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
                      Your subscription will be saved for automatic billing after the trial period ends. Cancel anytime during
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
                    💳 <strong>Demo Mode:</strong> No actual payment will be processed
                  </p>
                  <p
                    style={{
                      color: colors.mediumBrown,
                      margin: "0.5rem 0 0 1.5rem",
                      fontSize: "0.85rem",
                      lineHeight: "1.4",
                    }}
                  >
                    This is a demonstration version. Clicking "Subscribe" will simulate a successful payment and activate your plan.
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
                    Subscription saved for automatic {billingCycle} renewals
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

        {/* Processing Modal */}
        {paymentProcessing && (
          <div style={styles.planChangeModal}>
            <div
              style={{
                background: colors.offWhite,
                padding: "2rem",
                borderRadius: "24px",
                maxWidth: "400px",
                width: "100%",
                boxShadow: `0 24px 60px ${colors.darkBrown}33`,
                border: `1px solid ${colors.lightTan}`,
                position: "relative",
                textAlign: "center",
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
                  margin: "0 auto 2rem auto",
                }}
              ></div>
              <h3
                style={{
                  color: colors.darkBrown,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                {selectedAddOn ? "Processing Add-on..." : "Processing Subscription..."}
              </h3>
              <p
                style={{
                  color: colors.mediumBrown,
                  fontSize: "1rem",
                  lineHeight: "1.5",
                }}
              >
                🔒 Please wait while we process your request...
                <br />
                <strong>Do not close this window.</strong>
              </p>
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
                  {paymentProcessing ? "Processing..." : `Purchase for ${selectedAddOn.price}`}
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