"use client"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { validate, saveToFirebase, updateCurrentPlan } from "./actions"
import { useNavigate } from "react-router-dom"
import EmbeddedCheckout from "../../components/EmbeddedCheckout"

// UPDATED: New function to create subscription checkout
const createSubscriptionCheckout = async (amount, currency, userId, planName, billingCycle, actionType = 'subscription') => {
  try {
    console.log('🔄 Creating subscription checkout:', { amount, currency, userId, planName, billingCycle, actionType });
    
    // Use the NEW subscription endpoint
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planName,
        billingCycle,
        amount: 0, // Always 0 for first 3 months
        currency,
        customerEmail: getAuth().currentUser?.email,
        customerName: getAuth().currentUser?.displayName,
        actionType,
        isTrialPeriod: true,
        originalAmount: amount // Store original price for future billing
      }),
    });

    const data = await response.json();
    console.log('✅ Subscription checkout response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Failed to create subscription checkout');
    }

    return data;
  } catch (error) {
    console.error('❌ Subscription checkout error:', error);
    throw error;
  }
};

// UPDATED: Function to create one-time payment (for growth tools)
const createOneTimeCheckout = async (amount, currency, userId, planName, billingCycle, actionType = 'one_time') => {
  try {
    console.log('💳 Creating one-time checkout:', { amount, currency, userId, planName, billingCycle, actionType });
    
    // Use the existing checkout endpoint for one-time payments
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/payments/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planName,
        billingCycle,
        amount,
        currency,
        customerEmail: getAuth().currentUser?.email,
        customerName: getAuth().currentUser?.displayName,
        actionType
      }),
    });

    const data = await response.json();
    console.log('✅ One-time checkout response:', data);

    if (!data.success) {
      throw new Error(data.error || 'Failed to create one-time checkout');
    }

    return data;
  } catch (error) {
    console.error('❌ One-time checkout error:', error);
    throw error;
  }
};

// Define your color palette - UPDATED: Changed trial colors to brown tones
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
  basicCardBg: "linear-gradient(160deg, #8D6E63 0%, #6D4C41 100%)",
  standardCardBg: "linear-gradient(160deg, #5D4037 0%, #4A352F 100%)",
  premiumCardBg: "linear-gradient(160deg, #A67C52 0%, #8D6E63 100%)",
  featureCheck: "#A67C52",
  featureCross: "#D32F2F",
  trialBrown: "#8D6E63", // Changed from trialGreen to trialBrown
  trialAccent: "#A67C52", // Added for trial accent color
}

const MySubscriptions = ({ sidebarOpen = true, sidebarWidth = 280, onSidebarToggle }) => {
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

  // Internal sidebar state
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true)
  const [internalSidebarWidth, setInternalSidebarWidth] = useState(280)

  // Use props if provided, otherwise use internal state
  const currentSidebarOpen = sidebarOpen !== undefined ? sidebarOpen : internalSidebarOpen
  const currentSidebarWidth = sidebarWidth !== undefined ? sidebarWidth : internalSidebarWidth

  const plans = {
    basic: {
      name: "Basic",
      price: { monthly: 0, annually: 0 },
      currency: "ZAR",
      description: "Essential features for getting started.",
      features: {
        "BIG Score (Initial Assessment)": "1 free score",
        "BIG Score Improvement Tools": "Paid separately",
        "SME Discovery (Visible to others)": true,
        "SME-to-SME Matching": "On success-fee basis (5-10%)",
        "Advisor Matching": false,
        "Intern Matching": false,
        "Marketplace Tools (Growth Suite)": "Buy individually (R50-R200/tool)",
        "Funders & Investors Access": false,
        "Funder Deal Room & Smart Application": false,
        "Data Room & Investor Reports": false,
        "Success Fee (on closed deals)": "5-10%",
        Support: "Community forum only",
      },
      highlights: ["1 free BIG Score", "Basic SME discovery", "Community support", "Success-fee matching"],
    },
    standard: {
      name: "Standard",
      price: { monthly: 450, annually: 4500 },
      currency: "ZAR",
      description: "Everything in Free Plan + Standard",
      features: {
        "BIG Score (Initial Assessment)": "Auto-updates quarterly",
        "BIG Score Improvement Tools": "Included basic tools",
        "SME Discovery (Visible to others)": "Enhanced profile & tagging",
        "SME-to-SME Matching": "Priority access",
        "Advisor Matching": "Free for pre-seed SMEs",
        "Intern Matching": "For early-stage projects",
        "Marketplace Tools (Growth Suite)": "Selected tools included",
        "Funders & Investors Access": false,
        "Funder Deal Room & Smart Application": false,
        "Data Room & Investor Reports": false,
        "Success Fee (on closed deals)": "3-5%",
        Support: "Email support",
      },
      highlights: [
        "Quarterly BIG Score updates",
        "Basic improvement tools",
        "Enhanced profile",
        "Priority matching access",
      ],
    },
    premium: {
      name: "Premium",
      price: { monthly: 1200, annually: 12000 },
      currency: "ZAR",
      description: "Everything in Standard Plan + Premium Plan",
      features: {
        "BIG Score (Initial Assessment)": "Auto-updates + funder-ready PDF report",
        "BIG Score Improvement Tools": "Full toolkit + custom benchmarking",
        "SME Discovery (Visible to others)": "Premium placement (top of directory)",
        "SME-to-SME Matching": "Dedicated deal facilitation support",
        "Advisor Matching": "Priority access + flat fee per placement",
        "Intern Matching": "Fast-track & curated intern teams",
        "Marketplace Tools (Growth Suite)": "Full access (all toolkits & templates)",
        "Funders & Investors Access": "Direct match + warm intros",
        "Funder Deal Room & Smart Application": "Application routing + real-time tracking",
        "Data Room & Investor Reports": "Auto-generated updates & compliance tools",
        "Success Fee (on closed deals)": "1-2% or capped flat fee",
        Support: "Dedicated support + quarterly check-in",
      },
      highlights: ["Full BIG Score toolkit", "Premium placement", "Funder access", "Dedicated support"],
    },
  }

  // Add-ons from the Paystack version
  const addOns = [
    {
      id: "api-access",
      name: "API Access to BIG Score engine",
      price: "From R1,500/month",
      amount: 1500,
      description: "Integrate BIG Score directly into your systems with our comprehensive API access.",
    },
    {
      id: "branded-portfolio",
      name: "Branded SME Portfolio Pages",
      price: "R2,000 setup + R500/month",
      amount: 2500,
      description: "Custom branded pages for your SME portfolio with your company's branding and styling.",
    },
    {
      id: "cobranded-calls",
      name: "Co-branded Calls for Applications",
      price: "R5,000 per campaign",
      amount: 5000,
      description: "Joint marketing campaigns for funding opportunities with co-branded materials and outreach.",
    },
    {
      id: "funder-benchmarks",
      name: "Funder-specific BIG Score benchmarks",
      price: "R3,500 per report",
      amount: 3500,
      description: "Customized scoring benchmarks tailored to specific funder requirements and criteria.",
    },
  ]

  // Feature order for the comparison table
  const featureOrder = [
    "BIG Score (Initial Assessment)",
    "BIG Score Improvement Tools",
    "SME Discovery (Visible to others)",
    "SME-to-SME Matching",
    "Advisor Matching",
    "Intern Matching",
    "Marketplace Tools (Growth Suite)",
    "Funders & Investors Access",
    "Funder Deal Room & Smart Application",
    "Data Room & Investor Reports",
    "Success Fee (on closed deals)",
    "Support",
  ]

  const [selectedPlan, setSelectedPlan] = useState("basic")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [email, setEmail] = useState("nhlanhlamsomi2024@gmail.com")
  const [fullName, setFullName] = useState("Nhlanhla Msomi")
  const [companyName, setCompanyName] = useState("")
  const [history, setHistory] = useState([])
  const [errors, setErrors] = useState({})

  // Helper function to check if user is new (for trial eligibility)
  const isNewUser = () => {
    return !isExistingUser || !currentSubscription || currentSubscription.plan === "Basic"
  }

  // Helper function to safely get plan name
  const getCurrentPlanKey = () => {
    if (!currentSubscription || !currentSubscription.plan) {
      return "basic"
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
          // FIXED: Filter out add-on purchases from subscription data
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
          setSelectedPlan(latestSubscription.plan?.toLowerCase() || "basic")
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

  // Handle plan selection
  const handlePlanSelect = (planKey) => {
    console.log("Plan selected:", planKey)
    setSelectedPlan(planKey)
    setErrors({})

    if (isExistingUser && currentSubscription) {
      const currentPlanKey = getCurrentPlanKey()
      if (planKey !== currentPlanKey) {
        const planOrder = { basic: 0, standard: 1, premium: 2 }
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

    if (upgradeDowngradeAction === "downgrade" && selectedPlan === "basic") {
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

  // Handle add-on selection
  const handleAddOnClick = (addOn) => {
    setSelectedAddOn(addOn)
    setShowAddOnModal(true)
  }

  // Handle add-on payment
  const handleAddOnPayment = async (addOn) => {
    if (!user) {
      alert("Please log in to purchase add-ons")
      return
    }

    console.log("Creating add-on checkout...")
    setPaymentProcessing(true)

    try {
      const checkoutData = await createOneTimeCheckout(
        addOn.amount,
        "ZAR",
        user.uid,
        addOn.name,
        "one_time",
        "addon"
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

  // Handle add-on success
  const handleAddOnSuccess = async (event) => {
    console.log("Add-on payment completed:", event)

    try {
      const newRecord = {
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
      }

      setHistory([newRecord, ...history])
      await saveToFirebase(newRecord)
      alert(`Payment successful! ${selectedAddOn.name} has been added to your account.`)
      setShowCheckout(false)
      setSelectedAddOn(null)
    } catch (error) {
      console.error("Error processing add-on payment:", error)
      alert("Payment completed but there was an error updating your account. Please contact support.")
    }
  }

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!currentSubscription || !user) {
      alert("No active subscription found.")
      return
    }

    const confirmMessage = `Are you sure you want to cancel your ${currentSubscription.plan} subscription?\n\nThis will:\n• Stop automatic renewals\n• Downgrade you to Basic plan\n• Remove premium features\n\nThis action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      // Create cancellation record
      const cancellationRecord = {
        id: uuidv4(),
        email: email,
        plan: "Basic",
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
      
      // Update current plan to Basic
      await updateCurrentPlan("Basic", "monthly")
      
      // Update local state
      setHistory([cancellationRecord, ...history])
      setCurrentSubscription(cancellationRecord)
      setSelectedPlan("basic")
      
      alert(`Subscription cancelled successfully!\n\nYou've been downgraded to the Basic plan.\nYour premium features will remain active until the end of your current billing period.`)
      
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

    // Handle free basic plan
    if (selectedPlan === "basic") {
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
        alert("Basic plan activated successfully!")
        
        // Clear any upgrade/downgrade state
        setUpgradeDowngradeAction(null)
        setShowPlanChangeConfirm(false)
        
        return
      } catch (error) {
        console.error("Error activating basic plan:", error)
        alert("Failed to activate basic plan. Please try again.")
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
      // For new users or users upgrading from basic, start trial
      const isTrialEligible = isNewUser()
      const trialStartDate = new Date()
      const trialEndDate = new Date()
      trialEndDate.setMonth(trialEndDate.getMonth() + 3)

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
      // Check if this is an add-on purchase
      if (selectedAddOn) {
        await handleAddOnSuccess(event)
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
        // FIXED: Handle potentially undefined registrationId
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

  // UPDATED: Enhanced user data loading
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setEmail(userData.email || user.email || "nhlanhlamsomi2024@gmail.com")
            setFullName(userData.displayName || userData.fullName || "Nhlanhla Msomi")
            setCompanyName(userData.companyName || "")
          } else {
            setEmail(user.email || "nhlanhlamsomi2024@gmail.com")
            setFullName(user.displayName || "Nhlanhla Msomi")
          }

          await loadUserSubscription(user.uid)
        } catch (error) {
          console.error("Error loading user data:", error)
          setEmail(user.email || "nhlanhlamsomi2024@gmail.com")
          setFullName(user.displayName || "Nhlanhla Msomi")
          await loadUserSubscription(user.uid)
        }
      }
    }

    loadUserData()
  }, [user])

  // Handle billing cycle change
  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle)
    console.log("Billing cycle changed to:", cycle)
  }

  // Feature comparison table component
  const FeatureComparisonTable = () => (
    <div style={styles.featureComparisonContainer}>
      <div style={styles.featureComparisonTitle}>
        <span>Plan Features Comparison</span>
        <div style={styles.billingToggle}>
          <button
            style={{
              ...styles.billingToggleButton,
              ...(billingCycle === "monthly" ? styles.billingToggleActive : styles.billingToggleInactive),
            }}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            style={{
              ...styles.billingToggleButton,
              ...(billingCycle === "annually" ? styles.billingToggleActive : styles.billingToggleInactive),
            }}
            onClick={() => setBillingCycle("annually")}
          >
            Annual
          </button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.featureComparisonTable}>
          <thead>
            <tr>
              <th style={styles.featureTh}>Feature</th>
              <th style={styles.featureTh}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", background: colors.accentGold, borderRadius: "50%" }}></div>
                  Basic (Free)
                </div>
              </th>
              <th style={styles.featureTh}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", background: colors.mediumBrown, borderRadius: "50%" }}></div>
                  Standard (R{billingCycle === "monthly" ? "450/month" : "4,500/year"})
                </div>
              </th>
              <th style={styles.featureTh}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", background: colors.darkBrown, borderRadius: "50%" }}></div>
                  Premium (R{billingCycle === "monthly" ? "1,200/month" : "12,000/year"})
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {featureOrder.map((feature, index) => (
              <tr key={feature} style={{ backgroundColor: index % 2 === 0 ? `${colors.cream}4D` : "transparent" }}>
                <td style={{ ...styles.featureTd, ...styles.featureTdLeft }}>{feature}</td>
                <td style={styles.featureTd}>
                  {typeof plans.basic.features[feature] === "boolean" ? (
                    plans.basic.features[feature] ? (
                      <span style={{ color: colors.darkBrown, fontWeight: "bold" }}>✓</span>
                    ) : (
                      <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                    )
                  ) : (
                    plans.basic.features[feature]
                  )}
                </td>
                <td style={styles.featureTd}>
                  {typeof plans.standard.features[feature] === "boolean" ? (
                    plans.standard.features[feature] ? (
                      <span style={{ color: colors.darkBrown, fontWeight: "bold" }}>✓</span>
                    ) : (
                      <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                    )
                  ) : (
                    plans.standard.features[feature]
                  )}
                </td>
                <td style={styles.featureTd}>
                  {typeof plans.premium.features[feature] === "boolean" ? (
                    plans.premium.features[feature] ? (
                      <span style={{ color: colors.darkBrown, fontWeight: "bold" }}>✓</span>
                    ) : (
                      <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                    )
                  ) : (
                    plans.premium.features[feature]
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {billingCycle === "annually" && (
        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: colors.cream,
          border: `1px solid ${colors.lightTan}`,
          borderRadius: "8px",
          fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
          color: colors.darkBrown,
        }}>
          <strong>Annual Discount Options:</strong>
          <div style={{ marginTop: "0.5rem" }}>
            Basic: N/A | Standard: R4,500/year (save R900) | Premium: R12,000/year (save R2,400)
          </div>
        </div>
      )}
    </div>
  )

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
    billingToggle: {
      display: "flex",
      background: colors.cream,
      borderRadius: "12px",
      padding: "4px",
      border: `1px solid ${colors.lightTan}`,
    },
    billingToggleButton: {
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "0.9rem",
    },
    billingToggleActive: {
      background: colors.accentGold,
      color: colors.lightText,
      boxShadow: `0 2px 4px ${colors.accentGold}4D`,
    },
    billingToggleInactive: {
      background: "transparent",
      color: colors.mediumBrown,
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
      background: `linear-gradient(160deg, ${colors.darkBrown} 0%, ${colors.mediumBrown} 100%)`,
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
      position: "relative",
    },
    planPriceFree: {
      color: colors.trialBrown, // Changed from trialGreen to trialBrown
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
      background: `linear-gradient(90deg, ${colors.trialBrown} 0%, ${colors.accentGold} 100%)`, // Changed from trialGreen to trialBrown
      color: colors.lightText,
      padding: "0.8rem 1.2rem",
      borderRadius: "12px",
      fontSize: "1rem",
      fontWeight: 700,
      marginBottom: "1rem",
      textAlign: "center",
      boxShadow: `0 4px 12px ${colors.trialBrown}4D`, // Changed from trialGreen to trialBrown
      display: "inline-block",
      border: `2px solid ${colors.trialBrown}`, // Changed from trialGreen to trialBrown
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
    addOnsSection: {
      margin: "3rem auto",
      maxWidth: "100%",
      background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`,
      borderRadius: "20px",
      padding: "2rem",
      boxShadow: `0 12px 40px ${colors.darkBrown}0A`,
      border: `1px solid ${colors.lightTan}`,
    },
    addOnsTitle: {
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
      fontWeight: 700,
      color: colors.darkBrown,
      marginBottom: "2rem",
      textAlign: "left",
    },
    addOnsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "1.5rem",
    },
    addOnItem: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "1.5rem",
      background: colors.offWhite,
      border: `1px solid ${colors.lightTan}`,
      borderRadius: "12px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      minHeight: "150px",
    },
    addOnName: {
      fontWeight: 600,
      color: colors.darkBrown,
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      marginBottom: "0.5rem",
    },
    addOnDescription: {
      fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
      color: colors.mediumBrown,
      marginBottom: "1rem",
      lineHeight: "1.4",
      flex: 1,
    },
    addOnPrice: {
      fontWeight: 700,
      color: colors.accentGold,
      fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
      textAlign: "center",
      padding: "0.5rem",
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "8px",
      border: `1px solid ${colors.lightTan}`,
    },
    downgradeSection: {
      textAlign: "center",
      margin: "2.5rem 0",
      padding: "2rem",
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "16px",
      border: `1px solid ${colors.lightTan}`,
    },
    button: {
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "12px",
      fontWeight: 700,
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      margin: "0.5rem",
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
      padding: "1rem 2rem",
      fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
      cursor: "pointer",
      margin: "0.5rem",
      transition: "all 0.3s ease",
      boxShadow: `0 4px 12px ${colors.lightTan}33`,
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
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
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
    <div style={styles.container}>
      <div style={styles.mainCard}>
        <div style={styles.decorativeElement}></div>
        
        {/* Updated Beta Notice with Trial Information - Now using brown colors */}
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
          </>
        ) : (
          <>
            <h1 style={styles.pageTitle}>Choose Your Plan</h1>
            <p style={styles.subtitle}>Select the perfect plan for your business needs - first 3 months free!</p>
          </>
        )}

        {/* Feature Comparison Table */}
        <FeatureComparisonTable />

        {/* UPDATED: Pricing Cards with Zero Prices and "After Trial" Information - Now using brown colors */}
        <div style={styles.planGrid}>
          {Object.entries(plans).map(([planKey, plan]) => {
            const isCurrentPlan = isExistingUser && getCurrentPlanKey() === planKey
            const isSelected = selectedPlan === planKey
            const isHovered = hoveredPlan === planKey
            const isPopular = planKey === "standard"
            const showTrialOffer = planKey !== "basic" && isNewUser()

            let cardBackground = colors.offWhite
            let nameColor = colors.darkBrown
            let priceColor = colors.darkBrown
            let periodColor = colors.mediumBrown
            let featureTextColor = colors.darkText
            let buttonBg = `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`
            const buttonColor = colors.lightText

            if (isPopular) {
              cardBackground = colors.standardCardBg
              nameColor = colors.lightText
              priceColor = colors.lightText
              periodColor = colors.lightText
              featureTextColor = colors.lightText
              buttonBg = `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.lightBrown} 100%)`
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
                
                {/* UPDATED: Show R0/FREE for paid plans during trial, regular price for basic - Now using brown colors */}
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
                      planKey === "basic" ? "Downgrade" : showTrialOffer ? "Start Free Trial" : "Upgrade"
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
                    return "Activate Basic Plan"
                  } else if (isExistingUser) {
                    if (upgradeDowngradeAction === 'upgrade') {
                      return isNewUser() ? `Start ${plans[selectedPlan].name} Trial (FREE)` : `Upgrade to ${plans[selectedPlan].name}`
                    } else {
                      return `Change to ${plans[selectedPlan].name}`
                    }
                  } else {
                    return isNewUser() ? `Start ${plans[selectedPlan].name} Trial (FREE)` : `Subscribe to ${plans[selectedPlan].name}`
                  }
                })()
              )}
            </button>

            {/* Enhanced Payment info for subscriptions with trial details - Updated with brown colors */}
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
        )}

        {/* Add-ons Section */}
        <div style={styles.addOnsSection}>
          <h2 style={styles.addOnsTitle}>Add-ons</h2>
          <div style={styles.addOnsGrid}>
            {addOns.map((addOn) => (
              <div
                key={addOn.id}
                style={styles.addOnItem}
                onClick={() => handleAddOnClick(addOn)}
                onMouseEnter={(e) => {
                  e.target.style.background = colors.cream
                  e.target.style.transform = "translateY(-2px)"
                  e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}26`
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = colors.offWhite
                  e.target.style.transform = "translateY(0)"
                  e.target.style.boxShadow = "none"
                }}
              >
                <div style={styles.addOnName}>{addOn.name}</div>
                <div style={styles.addOnDescription}>{addOn.description}</div>
                <div style={styles.addOnPrice}>{addOn.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Downgrade Section */}
        {isExistingUser && currentSubscription && getCurrentPlanKey() !== "basic" && (
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
                {selectedAddOn ? "Complete Your Purchase" : isNewUser() ? "Start Your Free Trial" : "Complete Your Subscription"}
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
                  {selectedAddOn ? (
                    <>🛒 Purchasing {selectedAddOn.name}</>
                  ) : isNewUser() ? (
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
                amount={selectedAddOn ? selectedAddOn.amount : 0} // Always 0 for trial
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

              {/* FIXED: Processing Overlay - Now positioned to cover entire modal */}
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
                  zIndex: 1001, // Higher than modal content
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
                    {selectedAddOn ? "Processing Add-on Purchase..." : isNewUser() ? "Setting up Your Free Trial..." : "Processing Subscription..."}
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
                    🔒 {selectedAddOn ? "Securing your add-on purchase" : isNewUser() ? "Activating your 3-month free trial" : "Securing your subscription"}...
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
                <strong style={{ color: colors.darkBrown }}>{currentSubscription?.plan || "Basic"}</strong> to{" "}
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
                  {upgradeDowngradeAction === "downgrade" && selectedPlan === "basic"
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
                {getCurrentPlanKey() === "premium" && (
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
                    onClick={() => handleDowngradeSelect("standard")}
                  >
                    <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>Standard Plan</div>
                    <div style={{ color: colors.mediumBrown, marginTop: "0.5rem" }}>
                      R {plans.standard.price.monthly}/month
                    </div>
                    <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>
                      Keep most features, save R{plans.premium.price.monthly - plans.standard.price.monthly}/month
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
                  onClick={() => handleDowngradeSelect("basic")}
                >
                  <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>Basic Plan</div>
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
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: colors.darkBrown, marginBottom: "0.5rem" }}>
                  {selectedAddOn.price}
                </div>
                <div style={{ color: colors.mediumBrown, fontSize: "0.95rem" }}>
                  One-time payment to add this feature to your account.
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
                  onClick={() => setShowAddOnModal(false)}
                >
                  Close
                </button>
                <button
                  style={{
                    ...styles.button,
                    ...(paymentProcessing ? styles.paymentButtonDisabled : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!paymentProcessing) {
                      e.target.style.transform = "translateY(-2px)"
                      e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}66`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!paymentProcessing) {
                      e.target.style.transform = "translateY(0)"
                      e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}4D`
                    }
                  }}
                  onClick={() => handleAddOnPayment(selectedAddOn)}
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
          <div style={{
            background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
            borderRadius: "16px",
            padding: "2rem",
            marginTop: "3rem",
            border: `1px solid ${colors.lightTan}`,
          }}>
            <h3 style={{
              color: colors.darkBrown,
              marginBottom: "1.5rem",
              fontSize: "1.5rem",
              fontWeight: 700,
              textAlign: "center",
            }}>
              Subscription Management
            </h3>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginTop: "1.5rem",
            }}>
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
                  alert("Update payment method feature coming soon!");
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

export default MySubscriptions