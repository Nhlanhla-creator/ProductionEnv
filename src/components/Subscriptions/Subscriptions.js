// components/Subscriptions/ReusableSubscription.js
"use client"
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { getAuth } from "firebase/auth"
import { collection, getFirestore, query, where, getDocs, doc, getDoc, setDoc,addDoc, updateDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { 
  Check, 
  X, 
  Ticket, 
  Award, 
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ShieldOff,
  AlertTriangle
} from "lucide-react"
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
  getAddOns,
  getSmeScoreState,
  requiresVerifiedPlan,
  getSmeStaleState
} from "../../config/subscriptionsConfig"

// FRONTEND-ONLY: Mock payment processing
const processMockPayment = async (paymentDetails) => {
  console.log("🔄 Processing mock payment:", paymentDetails)
  await new Promise(resolve => setTimeout(resolve, 2000))
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
        trialEndDate: subscriptionData.trialEndDate,
        source: subscriptionData.source || "direct_payment",
        voucherId: subscriptionData.voucherId || null,
        voucherCode: subscriptionData.voucherCode || null,
        scoreState: subscriptionData.scoreState || null,
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
  if (!email || !email.includes("@")) errors.email = "Valid email is required"
  if (!fullName || fullName.trim().length < 2) errors.fullName = "Full name is required"
  return { isValid: Object.keys(errors).length === 0, errors }
}

const ReusableSubscription = ({ 
  userType = "investor",
  showAddOns = false,
  customTitle = null,
  customSubtitle = null
}) => {
  const auth = getAuth()
  const db = getFirestore()
  const user = auth.currentUser
  const navigate = useNavigate()

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

  // Voucher state
  const [showVoucherInput, setShowVoucherInput] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherMessage, setVoucherMessage] = useState("")
  const [voucherMessageType, setVoucherMessageType] = useState("")
  const [validatingVoucher, setValidatingVoucher] = useState(false)
  const [appliedVoucher, setAppliedVoucher] = useState(null)

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

  const baseStyles = getSubStyles()

  // ─── SME score state helpers ─────────────────────────────────────────────
  const isSme = userType === "smse"

  const getCurrentScoreState = () => {
    if (!isSme) return null
    const planKey = getCurrentPlanKey()
    return getSmeScoreState(planKey)
  }

  const isVerifiedActive = () => {
    if (!isSme) return true // non-SME don't need verification gate
    const scoreState = getCurrentScoreState()
    return scoreState?.is_verified === true
  }

  // Show stale warning when user had verified but cancelled
  const showStaleWarning = () => {
    if (!isSme || !isExistingUser) return false
    const planKey = getCurrentPlanKey()
    // On free plan but was previously on a higher plan? or score_status=stale
    if (planKey === freePlanKey && history.length > 1) return true
    return false
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Get number of plans to determine grid columns
  const planCount = Object.keys(plans).length
  
 const styles = {
  ...baseStyles,
  planGrid: {
    display: "grid",
    // Dynamic grid columns based on number of plans
    gridTemplateColumns: `repeat(${Object.keys(plans).length}, minmax(200px, 1fr))`,
    gap: "1.5rem",
    margin: "3rem 0",
    justifyContent: "center",
    maxWidth: "100%",
  },
   planCard: {
    ...(baseStyles.planCard || {}),
    minHeight: "450px",
    padding: "2rem",
  },
    // ── score-state badge ───────────────────────────────────────────────────
    scoreBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      padding: "0.4rem 0.9rem",
      borderRadius: "20px",
      fontSize: "0.78rem",
      fontWeight: 700,
      letterSpacing: "0.4px",
      marginBottom: "1rem",
    },
    scoreBadgeSnapshot: {
      background: `${colors.mediumBrown}22`,
      color: colors.mediumBrown,
      border: `1px solid ${colors.mediumBrown}55`,
    },
    scoreBadgeActive: {
      background: `${colors.featureCheck}18`,
      color: colors.featureCheck,
      border: `1px solid ${colors.featureCheck}55`,
    },
    scoreBadgeStale: {
      background: `${colors.featureCross}18`,
      color: colors.featureCross,
      border: `1px solid ${colors.featureCross}55`,
    },
    staleWarningBanner: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      background: `${colors.featureCross}12`,
      border: `2px solid ${colors.featureCross}`,
      borderRadius: "12px",
      padding: "1rem 1.25rem",
      marginBottom: "1.5rem",
      color: colors.featureCross,
      fontSize: "0.95rem",
      fontWeight: 600,
    },
    verifiedGateBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.3rem 0.75rem",
      background: `${colors.accentGold}22`,
      border: `1px solid ${colors.accentGold}66`,
      borderRadius: "20px",
      fontSize: "0.72rem",
      fontWeight: 700,
      color: colors.accentGold,
      marginBottom: "0.75rem",
    },
    voucherToggle: {
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`,
      borderRadius: "12px",
      padding: "1rem 1.5rem",
      marginBottom: "2rem",
      border: `2px solid ${colors.accentGold}`,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition: "all 0.3s ease",
    },
    voucherToggleLeft: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    },
    voucherIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      background: colors.accentGold,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.lightText,
    },
    voucherToggleText: {
      fontSize: "1rem",
      fontWeight: "600",
      color: colors.darkBrown,
    },
    voucherToggleArrow: {
      color: colors.accentGold,
      fontSize: "1.2rem",
      fontWeight: "600",
    },
    voucherContent: {
      marginTop: "1.5rem",
      padding: "1.5rem",
      background: colors.offWhite,
      borderRadius: "12px",
      border: `1px solid ${colors.lightTan}`,
    },
    voucherTitle: {
      fontSize: "1.2rem",
      fontWeight: "700",
      color: colors.darkBrown,
      marginBottom: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    voucherInputContainer: {
      display: "flex",
      gap: "1rem",
      marginBottom: "1rem",
    },
    voucherInput: {
      flex: 1,
      padding: "1rem",
      borderRadius: "8px",
      border: `2px solid ${colors.lightTan}`,
      fontSize: "1rem",
      fontFamily: "'Courier New', monospace",
      fontWeight: "600",
      letterSpacing: "1px",
      background: colors.cream,
      color: colors.darkBrown,
    },
    voucherButton: {
      padding: "1rem 2rem",
      background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)`,
      color: colors.lightText,
      border: "none",
      borderRadius: "8px",
      fontWeight: "600",
      fontSize: "1rem",
      cursor: "pointer",
      transition: "all 0.3s ease",
      whiteSpace: "nowrap",
    },
    voucherButtonDisabled: { opacity: 0.6, cursor: "not-allowed" },
    voucherMessage: { padding: "1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.95rem" },
    voucherMessageSuccess: { background: `${colors.successGreen}20`, border: `1px solid ${colors.successGreen}`, color: colors.successGreen },
    voucherMessageError: { background: `${colors.errorRed}20`, border: `1px solid ${colors.errorRed}`, color: colors.errorRed },
    voucherAppliedCard: { background: `${colors.successGreen}10`, border: `2px solid ${colors.successGreen}`, borderRadius: "12px", padding: "1.5rem", marginTop: "1rem" },
    voucherAppliedTitle: { fontSize: "1.1rem", fontWeight: "700", color: colors.successGreen, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" },
    voucherPlanBadge: { display: "inline-block", padding: "0.25rem 1rem", background: colors.accentGold, color: colors.lightText, borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600", marginLeft: "0.5rem" },
    voucherRedeemButton: { width: "100%", padding: "1rem", background: colors.successGreen, color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "1rem", cursor: "pointer", marginTop: "1rem", transition: "all 0.3s ease" },
    voucherInfoText: { fontSize: "0.9rem", color: colors.mediumBrown, marginTop: "1rem", padding: "1rem", background: `${colors.accentGold}10`, borderRadius: "8px", border: `1px solid ${colors.accentGold}30` },
    voucherInfoHighlight: { fontWeight: "700", color: colors.accentGold },
  }

  // ── Helper: is new user (for trial eligibility) ────────────────────────
  const isNewUser = () => {
    return !isExistingUser || !currentSubscription || 
           currentSubscription.plan === plans[freePlanKey].name
  }

  // ── Helper: get current plan key ──────────────────────────────────────
  const getCurrentPlanKey = () => {
    if (!currentSubscription || !currentSubscription.plan) return freePlanKey
    for (const [key, plan] of Object.entries(plans)) {
      if (plan.name === currentSubscription.plan) return key
    }
    return freePlanKey
  }

  const getCurrentPlanDisplayName = () => {
    const planKey = getCurrentPlanKey()
    return plans[planKey]?.name || plans[freePlanKey].name
  }

  const getCurrentPlanAmount = () => {
    if (!currentSubscription) return 0
    const planKey = getCurrentPlanKey()
    const cycle = currentSubscription?.cycle || "monthly"
    if (!plans[planKey]) return 0
    return plans[planKey]?.price?.[cycle] || 0
  }

  // ── Load subscription data ─────────────────────────────────────────────
  const loadUserSubscription = async (userId) => {
    console.log(`🔍 Loading ${userType} subscription for user:`, userId)
    setIsLoading(true)
    try {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.currentSubscription && userData.currentSubscription.plan) {
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
            trialEndDate: userData.currentSubscription.trialEndDate,
            source: userData.currentSubscription.source || "direct_payment",
            voucherId: userData.currentSubscription.voucherId || null,
            voucherCode: userData.currentSubscription.voucherCode || null,
            scoreState: userData.currentSubscription.scoreState || null,
          }
          setCurrentSubscription(subscriptionFromUser)
          setIsExistingUser(true)
          const planKey = getCurrentPlanKey()
          setSelectedPlan(planKey)
        }
      }

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
          if (!data.type || data.type !== "addon") {
            allSubscriptions.push({ id: doc.id, ...data })
          }
        })
      })

      if (allSubscriptions.length > 0) {
        const latestSubscription = allSubscriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        if (!currentSubscription || new Date(latestSubscription.createdAt) > new Date(currentSubscription.createdAt || 0)) {
          setCurrentSubscription(latestSubscription)
          setIsExistingUser(true)
          const planKey = getCurrentPlanKey()
          setSelectedPlan(planKey)
        }
      }

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

  // ── Voucher functions ──────────────────────────────────────────────────
  const validateVoucher = async () => {
    if (!voucherCode.trim()) { setVoucherMessage("Please enter a voucher code"); setVoucherMessageType("error"); return }
    const auth = getAuth(); const user = auth.currentUser
    if (!user) { setVoucherMessage("Please log in to redeem a voucher"); setVoucherMessageType("error"); return }
    setValidatingVoucher(true); setVoucherMessage(""); setVoucherMessageType("")
    try {
      const vouchersRef = collection(db, "vouchers")
      const q = query(vouchersRef, where("voucherCodes", "array-contains", voucherCode.toUpperCase()))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) { setVoucherMessage("Invalid voucher code"); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      const voucherDoc = querySnapshot.docs[0]
      const voucherData = { id: voucherDoc.id, ...voucherDoc.data() }
      if (voucherData.expiresAt && new Date(voucherData.expiresAt) < new Date()) { setVoucherMessage("This voucher has expired"); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      if (voucherData.status !== "active") { setVoucherMessage("This voucher is no longer active"); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      if (voucherData.remainingSeats <= 0) { setVoucherMessage("All seats for this voucher have been redeemed"); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      const alreadyRedeemed = voucherData.redeemedSeats?.some(seat => seat.userId === user.uid)
      if (alreadyRedeemed) { setVoucherMessage("You have already redeemed a seat from this voucher"); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      const codeRedeemed = voucherData.redeemedSeats?.some(seat => seat.code === voucherCode.toUpperCase())
      if (codeRedeemed) { setVoucherMessage("This voucher code has already been used"); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      const planName = voucherData.planName || "Premium"
      const planExists = Object.values(plans).some(p => p.name === planName)
      if (!planExists) { setVoucherMessage(`Invalid plan: ${planName}`); setVoucherMessageType("error"); setValidatingVoucher(false); return }
      setVoucherMessage(`✅ Voucher valid! ${voucherData.remainingSeats} seat(s) remaining.`); setVoucherMessageType("success")
      setAppliedVoucher({ id: voucherDoc.id, code: voucherCode.toUpperCase(), planName: planName, remainingSeats: voucherData.remainingSeats })
    } catch (error) {
      console.error('Voucher validation error:', error)
      setVoucherMessage("Error validating voucher. Please try again."); setVoucherMessageType("error")
    } finally { setValidatingVoucher(false) }
  }

  const redeemVoucher = async () => {
    if (!appliedVoucher) return
    const auth = getAuth(); const user = auth.currentUser
    if (!user) { setVoucherMessage("Please log in to redeem voucher"); setVoucherMessageType("error"); return }
    setValidatingVoucher(true)
    try {
      const voucherRef = doc(db, "vouchers", appliedVoucher.id)
      const voucherDoc = await getDoc(voucherRef)
      if (!voucherDoc.exists()) { setVoucherMessage("Voucher not found"); setVoucherMessageType("error"); setAppliedVoucher(null); setValidatingVoucher(false); return }
      const voucherData = voucherDoc.data()
      if (voucherData.remainingSeats <= 0) { setVoucherMessage("No seats remaining for this voucher"); setVoucherMessageType("error"); setAppliedVoucher(null); setValidatingVoucher(false); return }

      // Determine scoreState for the redeemed plan
      let scoreState = null
      if (isSme) {
        const planKey = Object.keys(plans).find(k => plans[k].name === appliedVoucher.planName)
        scoreState = planKey ? getSmeScoreState(planKey) : null
      }

      const redemptionData = { voucherId: appliedVoucher.id, voucherCode: appliedVoucher.code, userId: user.uid, userEmail: user.email, userName: user.displayName || 'Valued Customer', planName: appliedVoucher.planName, redeemedAt: new Date().toISOString() }
      await addDoc(collection(db, "voucherRedemptions"), redemptionData)
      const updatedRedeemedSeats = [...(voucherData.redeemedSeats || []), { userId: user.uid, userEmail: user.email, code: appliedVoucher.code, redeemedAt: new Date().toISOString() }]
      await updateDoc(voucherRef, { remainingSeats: voucherData.remainingSeats - 1, redeemedSeats: updatedRedeemedSeats, updatedAt: new Date().toISOString() })

      const userRef = doc(db, "users", user.uid)
      const userDocSnap = await getDoc(userRef)
      const subscriptionData = { currentSubscription: { plan: appliedVoucher.planName, status: "Success", amount: 0, cycle: "monthly", source: "voucher", voucherId: appliedVoucher.id, voucherCode: appliedVoucher.code, lastUpdated: new Date().toISOString(), isTrialPeriod: false, autoRenew: false, scoreState } }
      if (userDocSnap.exists()) { await updateDoc(userRef, subscriptionData) } else { await setDoc(userRef, subscriptionData) }

      const subscriptionRecord = { id: uuidv4(), userId: user.uid, userEmail: user.email, userName: user.displayName || 'Valued Customer', plan: appliedVoucher.planName, cycle: "monthly", amount: 0, status: "Success", source: "voucher", voucherId: appliedVoucher.id, voucherCode: appliedVoucher.code, createdAt: new Date().toISOString(), autoRenew: false, scoreState }
      await addDoc(collection(db, "subscriptions"), subscriptionRecord)

      const newSubscription = { id: `user_${user.uid}`, plan: appliedVoucher.planName, status: "Success", amount: 0, cycle: "monthly", createdAt: new Date().toISOString(), userId: user.uid, autoRenew: false, source: "voucher", voucherId: appliedVoucher.id, voucherCode: appliedVoucher.code, scoreState }
      setCurrentSubscription(newSubscription); setIsExistingUser(true)
      setVoucherMessage(`✅ Success! You are now subscribed to ${appliedVoucher.planName} plan via voucher.`); setVoucherMessageType("success")
      setAppliedVoucher(null); setVoucherCode("")
      setTimeout(() => { setShowVoucherInput(false); setVoucherMessage("") }, 3000)
      setTimeout(() => { loadUserSubscription(user.uid) }, 1000)
    } catch (error) {
      console.error('Voucher redemption error:', error)
      setVoucherMessage("Error redeeming voucher. Please try again."); setVoucherMessageType("error")
    } finally { setValidatingVoucher(false) }
  }

  const clearVoucher = () => { setAppliedVoucher(null); setVoucherCode(""); setVoucherMessage(""); setVoucherMessageType("") }

  // ── Billing cycle toggle ───────────────────────────────────────────────
  const BillingCycleToggle = () => (
    <div style={baseStyles.billingToggleContainer}>
      <span style={{ color: colors.mediumBrown, fontWeight: 600, marginRight: "1rem" }}>Billing:</span>
      <div style={baseStyles.billingToggle}>
        <div style={{ ...baseStyles.billingToggleOption, ...(billingCycle === "monthly" ? baseStyles.billingToggleActive : {}) }} onClick={() => setBillingCycle("monthly")}>Monthly</div>
        <div style={{ ...baseStyles.billingToggleOption, ...(billingCycle === "annually" ? baseStyles.billingToggleActive : {}) }} onClick={() => setBillingCycle("annually")}>
          Annual
          <span style={baseStyles.savingsBadge}>
            Save up to R{(() => {
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

  // ── Feature comparison table ───────────────────────────────────────────
  const FeatureComparisonTable = () => {
    const planKeys = Object.keys(plans)
    return (
      <div style={baseStyles.featureComparisonContainer}>
        <div style={baseStyles.featureComparisonTitle}><span>Plan Features Comparison</span></div>
        <BillingCycleToggle />
        <div style={{ overflowX: "auto" }}>
          <table style={baseStyles.featureComparisonTable}>
            <thead>
              <tr>
                <th style={baseStyles.featureTh}>Feature</th>
                {planKeys.map((planKey) => (
                  <th key={planKey} style={baseStyles.featureTh}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <div style={{ width: "12px", height: "12px", background: colors.accentGold, borderRadius: "50%" }}></div>
                      {plans[planKey].name} {plans[planKey].price[billingCycle] === 0 ? "(Free)" : ""}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureOrder.map((feature, index) => (
                <tr key={feature} style={{ backgroundColor: index % 2 === 0 ? `${colors.cream}4D` : "transparent" }}>
                  <td style={{ ...baseStyles.featureTd, ...baseStyles.featureTdLeft }}>{feature}</td>
                  {planKeys.map((planKey) => (
                    <td key={planKey} style={baseStyles.featureTd}>
                      {(() => {
                        const value = plans[planKey].features[feature]
                        if (value === true) return <span style={{ color: colors.featureCheck, fontWeight: "bold" }}>✓</span>
                        else if (value === false) return <span style={{ color: colors.featureCross, fontWeight: "bold" }}>✗</span>
                        else if (typeof value === "string") return <span style={{ color: colors.mediumBrown }}>{value}</span>
                        return value
                      })()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {billingCycle === "annually" && (
          <div style={baseStyles.annualDiscount}>
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

  // ── SME Score State Banner ────────────────────────────────────────────
  const SmeScoreBanner = () => {
    if (!isSme || !isExistingUser) return null
    const stale = showStaleWarning()
    if (stale) {
      return (
        <div style={styles.staleWarningBanner}>
          <ShieldOff size={22} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Verification expired — update required</strong>
            <div style={{ fontWeight: 400, fontSize: "0.88rem", marginTop: "0.25rem" }}>
              Your BIG Score is now <em>stale</em>. Upgrade to <strong>Verified</strong> to restore live scoring and ecosystem access.
            </div>
          </div>
        </div>
      )
    }
    const scoreState = getCurrentScoreState()
    if (!scoreState) return null
    if (scoreState.score_status === "active") {
      return (
        <div style={{ ...styles.scoreBadge, ...styles.scoreBadgeActive, marginBottom: "1.5rem", display: "inline-flex" }}>
          <ShieldCheck size={14} /> BIG Score: Live & Active
        </div>
      )
    }
    if (scoreState.score_status === "snapshot") {
      return (
        <div style={{ ...styles.scoreBadge, ...styles.scoreBadgeSnapshot, marginBottom: "1.5rem", display: "inline-flex" }}>
          <AlertTriangle size={14} /> BIG Score: Initial Snapshot (static)
        </div>
      )
    }
    return null
  }

  // ── Plan selection ────────────────────────────────────────────────────
  const handlePlanSelect = (planKey) => {
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

  const handleDowngradeClick = () => { setShowDowngradeOptions(true) }
  const handleDowngradeSelect = (targetPlan) => { setSelectedPlan(targetPlan); setUpgradeDowngradeAction("downgrade"); setShowDowngradeOptions(false); setShowPlanChangeConfirm(true) }
  const cancelDowngradeOptions = () => { setShowDowngradeOptions(false) }

  const confirmPlanChange = () => {
    if (upgradeDowngradeAction === "downgrade" && selectedPlan === freePlanKey) { handleDowngradeToFree() }
    else { setShowPlanChangeConfirm(false); handlePay() }
  }

  const handleDowngradeToFree = async () => {
    try {
      const scoreState = isSme ? getSmeScoreState(freePlanKey) : null
      const newRecord = { id: uuidv4(), email, plan: plans[selectedPlan].name, cycle: billingCycle, amount: 0, fullName, companyName, createdAt: new Date().toISOString(), status: "Success", autoRenew: true, userId: user.uid, userType, action: "downgrade", transactionRef: `downgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, scoreState }
      await saveSubscriptionToFirebase(newRecord)
      await updateCurrentPlan(plans[selectedPlan].name, billingCycle, { userType, scoreState })
      setHistory([newRecord, ...history]); setCurrentSubscription(newRecord); setIsExistingUser(true)
      alert(`Successfully downgraded to ${plans[selectedPlan].name} plan!`)
      setShowPlanChangeConfirm(false); setUpgradeDowngradeAction(null)
      setTimeout(() => { loadUserSubscription(user.uid) }, 1000)
    } catch (error) { console.error("Error in handleDowngradeToFree:", error); alert("An error occurred during downgrade. Please try again.") }
  }

  const cancelPlanChange = () => { setSelectedPlan(getCurrentPlanKey()); setShowPlanChangeConfirm(false); setShowDowngradeOptions(false); setUpgradeDowngradeAction(null) }

  const handleCancelSubscription = async () => {
    if (!currentSubscription || !user) { alert("No active subscription found."); return }
    const confirmMessage = `Are you sure you want to cancel your ${currentSubscription.plan} subscription?\n\nThis will:\n• Stop automatic renewals\n• Downgrade you to ${plans[freePlanKey].name} plan\n• Remove premium features\n\nThis action cannot be undone.`
    if (!window.confirm(confirmMessage)) return
    try {
      const scoreState = isSme ? getSmeScoreState(freePlanKey) : null
      const cancellationRecord = { id: uuidv4(), email, plan: plans[freePlanKey].name, cycle: "monthly", amount: 0, fullName, companyName, createdAt: new Date().toISOString(), status: "Success", autoRenew: false, userId: user.uid, userType, action: "cancellation", previousPlan: currentSubscription.plan, transactionRef: `cancellation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, scoreState }
      await saveSubscriptionToFirebase(cancellationRecord)
      await updateCurrentPlan(plans[freePlanKey].name, "monthly", { userType, scoreState })
      setHistory([cancellationRecord, ...history]); setCurrentSubscription(cancellationRecord); setSelectedPlan(freePlanKey)
      alert(`Subscription cancelled successfully!\n\nYou've been downgraded to the ${plans[freePlanKey].name} plan.\nYour premium features will remain active until the end of your current billing period.`)
      setTimeout(() => { loadUserSubscription(user.uid) }, 1000)
    } catch (error) { console.error("Error cancelling subscription:", error); alert("Failed to cancel subscription. Please try again or contact support.") }
  }

  // ── Payment handler ───────────────────────────────────────────────────
  const handlePay = async () => {
    if (!user) { alert("Please log in to subscribe"); return }
    const planPrice = plans[selectedPlan].price[billingCycle]
    const scoreState = isSme ? getSmeScoreState(selectedPlan) : null

    if (planPrice === 0) {
      try {
        const newRecord = { id: uuidv4(), email, plan: plans[selectedPlan].name, cycle: billingCycle, amount: 0, fullName, companyName, createdAt: new Date().toISOString(), status: "Success", autoRenew: true, userId: user.uid, userType, action: isExistingUser ? upgradeDowngradeAction || "downgrade" : "new_subscription", scoreState }
        setHistory([newRecord, ...history])
        await saveSubscriptionToFirebase(newRecord)
        await updateCurrentPlan(plans[selectedPlan].name, billingCycle, { userType, scoreState })
        setCurrentSubscription(newRecord); setIsExistingUser(true)
        alert(`${plans[selectedPlan].name} plan activated successfully!`)
        setUpgradeDowngradeAction(null); setShowPlanChangeConfirm(false)
        return
      } catch (error) { console.error("Error activating free plan:", error); alert("Failed to activate plan. Please try again."); return }
    }

    const validationResult = validate(email, fullName)
    if (!validationResult.isValid) { setErrors(validationResult.errors); return }

    setPaymentProcessing(true)
    try {
      const mockPaymentResult = await processMockPayment({ amount: planPrice, currency: "ZAR", userId: user.uid, planName: plans[selectedPlan].name, billingCycle })
      if (mockPaymentResult.success) {
        const isTrialEligible = isNewUser()
        const trialStartDate = new Date(); const trialEndDate = new Date(); trialEndDate.setMonth(trialEndDate.getMonth() + 3)
        const newRecord = { id: uuidv4(), email, plan: plans[selectedPlan].name, cycle: billingCycle, amount: 0, originalAmount: plans[selectedPlan].price[billingCycle], fullName, companyName, createdAt: new Date().toISOString(), status: "Success", autoRenew: true, transactionRef: mockPaymentResult.transactionId, userId: user.uid, userType, subscriptionType: "recurring", isTrialPeriod: isTrialEligible, trialStartDate: isTrialEligible ? trialStartDate.toISOString() : null, trialEndDate: isTrialEligible ? trialEndDate.toISOString() : null, action: isExistingUser ? upgradeDowngradeAction || "upgrade" : "new_subscription", paymentCompleted: true, paymentDate: new Date().toISOString(), scoreState }
        await saveSubscriptionToFirebase(newRecord)
        await updateCurrentPlan(plans[selectedPlan].name, billingCycle, { amount: newRecord.amount, originalAmount: newRecord.originalAmount, isTrialPeriod: newRecord.isTrialPeriod, trialStartDate: newRecord.trialStartDate, trialEndDate: newRecord.trialEndDate, transactionRef: newRecord.transactionRef, userType, scoreState })
        setHistory([newRecord, ...history]); setCurrentSubscription(newRecord); setIsExistingUser(true); setPaymentProcessing(false)
        setUpgradeDowngradeAction(null); setShowPlanChangeConfirm(false)
        const successMessage = isTrialEligible
          ? `🎉 Welcome to your ${plans[selectedPlan].name} plan!\n\n✨ You're getting 3 MONTHS FREE!\n• Trial period: ${trialStartDate.toLocaleDateString()} - ${trialEndDate.toLocaleDateString()}\n• Regular billing starts: ${trialEndDate.toLocaleDateString()}\n• Monthly rate after trial: R${plans[selectedPlan].price[billingCycle]}\n\nEnjoy all premium features at no cost for the first 3 months!`
          : `🎉 Subscription activated successfully!\n\nYour ${plans[selectedPlan].name} plan is now active.\n\nYou can now access all features!`
        alert(successMessage)
        setTimeout(async () => { await loadUserSubscription(user.uid) }, 2000)
      } else { throw new Error(mockPaymentResult.error || "Payment failed") }
    } catch (error) { console.error("Payment processing error:", error); alert(`Failed to process payment: ${error.message}. Please try again.`); setPaymentProcessing(false) }
  }

  // ── Add-on handlers ───────────────────────────────────────────────────
  const handleAddOnClick = (addOn) => { setSelectedAddOn(addOn); setShowAddOnModal(true) }
  const handleAddOnPayment = async () => {
    if (!user || !selectedAddOn) { alert("Please log in to purchase add-ons"); return }
    setPaymentProcessing(true)
    try {
      const mockPaymentResult = await processMockPayment({ amount: selectedAddOn.amount, currency: "ZAR", userId: user.uid, itemName: selectedAddOn.name, itemId: selectedAddOn.id })
      if (mockPaymentResult.success) {
        const addOnRecord = { id: uuidv4(), email, type: "addon", addonName: selectedAddOn.name, addonId: selectedAddOn.id, amount: selectedAddOn.amount, fullName, companyName, createdAt: new Date().toISOString(), status: "Success", transactionRef: mockPaymentResult.transactionId, userId: user.uid, userType }
        await saveSubscriptionToFirebase(addOnRecord)
        setHistory([addOnRecord, ...history]); alert(`Payment successful! ${selectedAddOn.name} has been added to your account.`); setShowAddOnModal(false); setSelectedAddOn(null)
      } else { throw new Error(mockPaymentResult.error || "Add-on payment failed") }
    } catch (error) { console.error("Add-on payment error:", error); alert(`Failed to process add-on payment: ${error.message}. Please try again.`) }
    finally { setPaymentProcessing(false) }
  }

  // ── Load user data on mount ───────────────────────────────────────────
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
          } else { setEmail(user.email || defaultData.email); setFullName(user.displayName || defaultData.fullName) }
          await loadUserSubscription(user.uid)
        } catch (error) {
          console.error("Error loading user data:", error)
          setEmail(user.email || defaultData.email); setFullName(user.displayName || defaultData.fullName)
          await loadUserSubscription(user.uid)
        }
      }
    }
    loadUserData()
  }, [user])

  // ── Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={baseStyles.container}>
        <div style={baseStyles.mainCard}>
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={{ width: "60px", height: "60px", border: `4px solid ${colors.lightTan}`, borderTop: `4px solid ${colors.accentGold}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 2rem auto" }}></div>
            <h2 style={{ color: colors.darkBrown, fontSize: "1.5rem", fontWeight: 600 }}>Loading your subscription details...</h2>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={baseStyles.container}>
      <div style={baseStyles.mainCard}>
        <div style={baseStyles.decorativeElement}></div>

        {/* Beta / Trial Notice */}
        <div style={baseStyles.betaNotice}>
          <span style={baseStyles.betaIcon}>🎉</span>
          <strong>Special Launch Offer:</strong> Get your first{" "}
          <span style={{ color: colors.trialBrown, fontWeight: 800 }}>3 MONTHS FREE</span> on any paid plan!
          <br />
          <small style={{ opacity: 0.8, marginTop: "0.5rem", display: "block" }}>
            Start your trial today - billing begins after 3 months at regular rates
          </small>
        </div>

        {/* SME Score State Banner */}
        <SmeScoreBanner />

        {/* Voucher Section */}
        <div style={styles.voucherToggle} onClick={() => setShowVoucherInput(!showVoucherInput)}>
          <div style={styles.voucherToggleLeft}>
            <div style={styles.voucherIcon}><Ticket size={20} /></div>
            <span style={styles.voucherToggleText}>Have a voucher code? Click here to redeem</span>
          </div>
          <span style={styles.voucherToggleArrow}>{showVoucherInput ? "▼" : "▶"}</span>
        </div>

        {showVoucherInput && (
          <div style={styles.voucherContent}>
            <h3 style={styles.voucherTitle}><Award size={20} color={colors.accentGold} />Redeem Your Voucher Code</h3>
            {!appliedVoucher ? (
              <>
                <div style={styles.voucherInputContainer}>
                  <input type="text" style={styles.voucherInput} placeholder="Enter voucher code (e.g., ST061ABCDE)" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} disabled={validatingVoucher} />
                  <button style={{ ...styles.voucherButton, ...(validatingVoucher || !voucherCode.trim() ? styles.voucherButtonDisabled : {}) }} onClick={validateVoucher} disabled={validatingVoucher || !voucherCode.trim()}>{validatingVoucher ? "Validating..." : "Apply"}</button>
                </div>
                {voucherMessage && (
                  <div style={{ ...styles.voucherMessage, ...(voucherMessageType === "success" ? styles.voucherMessageSuccess : {}), ...(voucherMessageType === "error" ? styles.voucherMessageError : {}) }}>
                    {voucherMessageType === "success" ? <CheckCircle size={16} style={{ marginRight: "0.5rem" }} /> : null}
                    {voucherMessageType === "error" ? <AlertCircle size={16} style={{ marginRight: "0.5rem" }} /> : null}
                    {voucherMessage}
                  </div>
                )}
              </>
            ) : (
              <div style={styles.voucherAppliedCard}>
                <div style={styles.voucherAppliedTitle}><CheckCircle size={20} />Valid Voucher Applied<span style={styles.voucherPlanBadge}>{appliedVoucher.planName}</span></div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: colors.mediumBrown }}>Voucher Code:</span><span style={{ fontFamily: "'Courier New', monospace", fontWeight: "600", color: colors.darkBrown }}>{appliedVoucher.code}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: colors.mediumBrown }}>Remaining Seats:</span><span style={{ fontWeight: "600", color: colors.darkBrown }}>{appliedVoucher.remainingSeats}</span></div>
                </div>
                <button style={styles.voucherRedeemButton} onClick={redeemVoucher} disabled={validatingVoucher} onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 8px 20px ${colors.successGreen}66` }} onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none" }}>{validatingVoucher ? "Redeeming..." : "Redeem Voucher Now"}</button>
                <button style={{ ...styles.voucherButton, background: "transparent", color: colors.mediumBrown, border: `2px solid ${colors.lightTan}`, marginTop: "0.5rem" }} onClick={clearVoucher}>Cancel</button>
              </div>
            )}
            <div style={styles.voucherInfoText}><span style={styles.voucherInfoHighlight}>📍 How to redeem:</span> Enter your voucher code above. Each code provides premium access for one user. After redemption, your account will be upgraded to the corresponding plan immediately.</div>
          </div>
        )}

        {/* Page title & current sub info */}
        {isExistingUser && currentSubscription ? (
          <>
            <h1 style={baseStyles.pageTitle}>{customTitle || "Manage Your Subscription"}</h1>
            <p style={baseStyles.subtitle}>{customSubtitle || "Upgrade, downgrade, or manage your current plan with ease"}</p>
            <div style={baseStyles.subscriptionInfo}>
              <h3 style={baseStyles.subscriptionTitle}>Current Subscription</h3>

              {/* SME score state inline badge */}
              {isSme && (() => {
                const ss = getCurrentScoreState()
                if (!ss) return null
                const isActive = ss.score_status === "active"
                return (
                  <div style={{ ...styles.scoreBadge, ...(isActive ? styles.scoreBadgeActive : styles.scoreBadgeSnapshot), marginBottom: "1rem" }}>
                    {isActive ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                    {isActive ? "BIG Score: Live & Active" : "BIG Score: Initial Snapshot (static)"}
                  </div>
                )
              })()}

              <div style={baseStyles.subscriptionDetail}><span>Plan:</span><span style={{ fontWeight: 600 }}>{getCurrentPlanDisplayName()}{currentSubscription.source === "voucher" && <span style={{ marginLeft: "0.5rem", padding: "0.2rem 0.5rem", background: colors.accentGold, color: colors.lightText, borderRadius: "4px", fontSize: "0.7rem", fontWeight: "600" }}>VOUCHER</span>}</span></div>
              <div style={baseStyles.subscriptionDetail}><span>Billing Cycle:</span><span style={{ fontWeight: 600 }}>{currentSubscription.cycle || "Monthly"}</span></div>
              <div style={baseStyles.subscriptionDetail}><span>Current Amount:</span><span style={{ fontWeight: 600, color: currentSubscription.isTrialPeriod ? colors.trialBrown : colors.darkText }}>{currentSubscription.amount === 0 && currentSubscription.isTrialPeriod ? "FREE (Trial)" : currentSubscription.amount === 0 ? currentSubscription.source === "voucher" ? "FREE (Voucher)" : "Free" : `R${getCurrentPlanAmount().toLocaleString()}`}</span></div>
              {currentSubscription.originalAmount && currentSubscription.originalAmount > 0 && <div style={baseStyles.subscriptionDetail}><span>Regular Price:</span><span style={{ fontWeight: 600 }}>R{currentSubscription.originalAmount}/{currentSubscription.cycle?.slice(0, -2) || "month"}</span></div>}
              {currentSubscription.isTrialPeriod && currentSubscription.trialEndDate && <div style={baseStyles.subscriptionDetail}><span>Trial Ends:</span><span style={{ fontWeight: 600, color: colors.trialBrown }}>{new Date(currentSubscription.trialEndDate).toLocaleDateString()}</span></div>}
              <div style={baseStyles.subscriptionDetail}><span>Status:</span><span style={{ fontWeight: 600, color: currentSubscription.status === "Success" || currentSubscription.status === "active" ? colors.featureCheck : colors.featureCross }}>{currentSubscription.status === "Success" ? "Active" : currentSubscription.status}</span></div>
              {currentSubscription.autoRenew && <div style={baseStyles.subscriptionDetail}><span>Auto Renewal:</span><span style={{ fontWeight: 600, color: colors.featureCheck }}>Enabled</span></div>}
            </div>
          </>
        ) : (
          <>
            <h1 style={baseStyles.pageTitle}>{customTitle || "Choose Your Plan"}</h1>
            <p style={baseStyles.subtitle}>{customSubtitle || "Select the perfect plan for your business needs — first 3 months free!"}</p>
          </>
        )}

        {/* Feature Comparison Table */}
        <FeatureComparisonTable />

        {/* ── Pricing Cards ────────────────────────────────────────────────── */}
        <div style={styles.planGrid}>
          {Object.entries(plans).map(([planKey, plan]) => {
            const isCurrentPlan = isExistingUser && getCurrentPlanKey() === planKey
            const isSelected = selectedPlan === planKey
            const isHovered = hoveredPlan === planKey
            const isPopular = planKey === popularPlanKey
            const showTrialOffer = plan.price[billingCycle] > 0 && isNewUser()
            const needsVerified = isSme && requiresVerifiedPlan(planKey)
            const cardBackground = cardBackgrounds[planKey] || colors.offWhite

            // SME score state for this card
            const cardScoreState = isSme ? getSmeScoreState(planKey) : null

            return (
              <div
                key={planKey}
                style={{
                  ...styles.planCard,
                  background: cardBackground,
                  ...(isPopular ? baseStyles.planCardPopular : {}),
                  ...(isSelected && !isPopular ? baseStyles.planCardSelected : {}),
                  ...(isHovered && !isSelected && !isPopular ? baseStyles.planCardHover : {}),
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={() => setHoveredPlan(planKey)}
                onMouseLeave={() => setHoveredPlan(null)}
                onClick={() => handlePlanSelect(planKey)}
              >
                {isPopular && <div style={baseStyles.popularBadge}>POPULAR</div>}

                {/* Verified gate badge for Standard & Premium */}
                {needsVerified && (
                  <div style={styles.verifiedGateBadge}>
                    <ShieldCheck size={11} /> Requires Verified
                  </div>
                )}

                {/* SME score state badge on card */}
                {cardScoreState && (
                  <div style={{
                    ...styles.scoreBadge,
                    ...(cardScoreState.score_status === "active" ? styles.scoreBadgeActive : styles.scoreBadgeSnapshot),
                    marginBottom: "0.5rem",
                    fontSize: "0.68rem",
                  }}>
                    {cardScoreState.score_status === "active"
                      ? <><ShieldCheck size={11} /> Live BIG Score</>
                      : <><AlertTriangle size={11} /> Snapshot Only</>
                    }
                  </div>
                )}

                <h3 style={{ ...baseStyles.planName, fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)", color: plan.price[billingCycle] === 0 ? colors.darkBrown : colors.lightText }}>{plan.name}</h3>

                {plan.price[billingCycle] === 0 ? (
                  <div style={{ ...baseStyles.planPrice, color: colors.darkBrown }}>Free</div>
                ) : (
                  <>
                    {showTrialOffer
                      ? <div style={{ ...baseStyles.planPriceFree, color: colors.lightText }}>FREE</div>
                      : <div style={{ ...baseStyles.planPrice, color: colors.lightText }}>R{plan.price[billingCycle]}</div>
                    }
                    {!showTrialOffer && (
                      <span style={{ ...baseStyles.planPricePeriod, color: colors.lightText }}>/ {billingCycle === "monthly" ? "month" : "year"}</span>
                    )}
                  </>
                )}

                <p style={{ ...baseStyles.planDescriptionText, fontSize: "0.85rem", color: plan.price[billingCycle] === 0 ? colors.mediumBrown : colors.lightText }}>{plan.description}</p>

                {showTrialOffer && <div style={baseStyles.freeMonthsBadge}>🎉 First 3 Months FREE!</div>}
                {showTrialOffer && (
                  <div style={{ ...baseStyles.afterTrialPrice, fontSize: "0.82rem" }}>
                    <strong>After 3-month trial:</strong><br />
                    R{plan.price[billingCycle]} / {billingCycle === "monthly" ? "month" : "year"}
                  </div>
                )}

                <ul style={baseStyles.planFeaturesList}>
                  {plan.highlights.map((feature, index) => (
                    <li key={index} style={{ ...baseStyles.planFeatureItem, fontSize: "0.88rem", color: plan.price[billingCycle] === 0 ? colors.mediumBrown : colors.lightText }}>
                      <span style={{ ...baseStyles.featureIcon, ...baseStyles.featureCheckIcon, color: plan.price[billingCycle] === 0 ? colors.featureCheck : colors.lightText }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div style={{ ...baseStyles.currentPlanBadge, width: "100%", textAlign: "center", padding: "0.9rem 1rem", borderRadius: "8px" }}>Current Plan</div>
                ) : isSelected ? (
                  <div style={{ ...baseStyles.selectedBadge, width: "100%", textAlign: "center", padding: "0.9rem 1rem", borderRadius: "8px" }}>Selected</div>
                ) : (
                  <button
                    style={{ ...baseStyles.selectButton, fontSize: "0.9rem", padding: "0.9rem 1rem" }}
                    onClick={(e) => { e.stopPropagation(); handlePlanSelect(planKey) }}
                    onMouseEnter={(e) => { e.target.style.background = colors.mediumBrown }}
                    onMouseLeave={(e) => { e.target.style.background = `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.mediumBrown} 100%)` }}
                  >
                    {isExistingUser
                      ? plan.price[billingCycle] === 0 ? "Downgrade" : showTrialOffer ? "Start Free Trial" : "Upgrade"
                      : showTrialOffer ? "Start Free Trial" : "Subscribe"
                    }
                    <span>→</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment Button */}
        {(!isExistingUser || (isExistingUser && selectedPlan !== getCurrentPlanKey())) && !showPlanChangeConfirm && (
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button
              style={{ ...baseStyles.paymentButton, ...(paymentProcessing ? baseStyles.paymentButtonDisabled : {}) }}
              onClick={handlePay}
              disabled={paymentProcessing}
            >
              {paymentProcessing ? (
                <><div style={{ width: "20px", height: "20px", border: "2px solid transparent", borderTop: "2px solid currentColor", borderRadius: "50%", animation: "spin 1s linear infinite", marginRight: "0.5rem" }}></div>Processing...</>
              ) : (() => {
                if (plans[selectedPlan].price[billingCycle] === 0) return `Activate ${plans[selectedPlan].name} Plan`
                else if (isExistingUser) { if (upgradeDowngradeAction === "upgrade") return isNewUser() ? `Start ${plans[selectedPlan].name} Trial (FREE)` : `Upgrade to ${plans[selectedPlan].name}`; else return `Change to ${plans[selectedPlan].name}` }
                else return isNewUser() ? `Start ${plans[selectedPlan].name} Trial (FREE)` : `Subscribe to ${plans[selectedPlan].name}`
              })()}
            </button>

            {plans[selectedPlan].price[billingCycle] > 0 && (
              <div style={{ background: `linear-gradient(135deg, ${colors.offWhite} 0%, ${colors.cream} 100%)`, borderRadius: "12px", padding: "1.5rem", marginTop: "1.5rem", border: `1px solid ${colors.lightTan}`, textAlign: "left" }}>
                <h4 style={{ color: colors.darkBrown, marginBottom: "1rem", fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>🎉 {isNewUser() ? "Free Trial Setup" : "Secure Subscription Payment"}</h4>
                {isNewUser() && (
                  <div style={{ background: `linear-gradient(135deg, ${colors.trialBrown}20 0%, ${colors.accentGold}20 100%)`, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", border: `1px solid ${colors.trialBrown}` }}>
                    <p style={{ color: colors.darkBrown, margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>✨ <strong>3-Month Free Trial:</strong> No charges for 3 months!</p>
                    <p style={{ color: colors.mediumBrown, margin: "0.5rem 0 0 1.5rem", fontSize: "0.85rem", lineHeight: "1.4" }}>Your subscription will be saved for automatic billing after the trial period ends. Cancel anytime.</p>
                  </div>
                )}
                <div style={{ background: `linear-gradient(135deg, ${colors.accentGold}20 0%, ${colors.lightTan}40 100%)`, borderRadius: "8px", padding: "1rem", marginBottom: "1rem", border: `1px solid ${colors.accentGold}` }}>
                  <p style={{ color: colors.darkBrown, margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>💳 <strong>Demo Mode:</strong> No actual payment will be processed</p>
                  <p style={{ color: colors.mediumBrown, margin: "0.5rem 0 0 1.5rem", fontSize: "0.85rem", lineHeight: "1.4" }}>This is a demonstration. Clicking "Subscribe" will simulate a successful payment.</p>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, color: colors.darkText, fontSize: "0.95rem", lineHeight: "1.6" }}>
                  <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ color: colors.featureCheck }}>✓</span>{isNewUser() ? "Free for first 3 months" : "Immediate access to features"}</li>
                  <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ color: colors.featureCheck }}>✓</span>Subscription saved for automatic {billingCycle} renewals</li>
                  <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ color: colors.featureCheck }}>✓</span>{isNewUser() ? `Billing starts at R${plans[selectedPlan].price[billingCycle]} per ${billingCycle.slice(0, -2)} after trial` : `Automatic billing at R${plans[selectedPlan].price[billingCycle]} per ${billingCycle.slice(0, -2)}`}</li>
                  <li style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><span style={{ color: colors.featureCheck }}>✓</span>Cancel anytime from your account settings</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Add-ons */}
        {showAddOns && addOns.length > 0 && (
          <div style={baseStyles.addOnsSection}>
            <h3 style={baseStyles.addOnsTitle}>Add-ons</h3>
            <div style={baseStyles.addOnsGrid}>
              {addOns.map((addOn) => (
                <div key={addOn.id} style={baseStyles.addOnItem} onClick={() => handleAddOnClick(addOn)}>
                  <div style={baseStyles.addOnName}>{addOn.name}</div>
                  <div style={baseStyles.addOnDescription}>{addOn.description}</div>
                  <div style={baseStyles.addOnPrice}>{addOn.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downgrade Section */}
        {isExistingUser && currentSubscription && getCurrentPlanKey() !== freePlanKey && (
          <div style={baseStyles.downgradeSection}>
            <h3 style={{ color: colors.darkBrown, marginBottom: "1rem", fontSize: "1.25rem" }}>Need to change your plan?</h3>
            <p style={{ color: colors.mediumBrown, marginBottom: "1.5rem" }}>You can downgrade to a lower-tier plan anytime.</p>
            <button style={baseStyles.button} onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 8px 20px ${colors.accentGold}66` }} onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = `0 4px 12px ${colors.accentGold}4D` }} onClick={handleDowngradeClick}>Downgrade Plan</button>
          </div>
        )}

        {/* Processing Modal */}
        {paymentProcessing && (
          <div style={baseStyles.planChangeModal}>
            <div style={{ background: colors.offWhite, padding: "2rem", borderRadius: "24px", maxWidth: "400px", width: "100%", boxShadow: `0 24px 60px ${colors.darkBrown}33`, border: `1px solid ${colors.lightTan}`, position: "relative", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", border: `6px solid ${colors.lightTan}`, borderTop: `6px solid ${colors.accentGold}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 2rem auto" }}></div>
              <h3 style={{ color: colors.darkBrown, fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>{selectedAddOn ? "Processing Add-on..." : "Processing Subscription..."}</h3>
              <p style={{ color: colors.mediumBrown, fontSize: "1rem", lineHeight: "1.5" }}>🔒 Please wait while we process your request...<br /><strong>Do not close this window.</strong></p>
            </div>
          </div>
        )}

        {/* Plan Change Confirmation Modal */}
        {showPlanChangeConfirm && (
          <div style={baseStyles.planChangeModal}>
            <div style={baseStyles.modalContent}>
              <h3 style={baseStyles.modalTitle}>Confirm Plan Change</h3>
              <p style={baseStyles.modalText}>You are about to <strong style={{ color: colors.accentGold }}>{upgradeDowngradeAction}</strong> from <strong style={{ color: colors.darkBrown }}>{currentSubscription?.plan || plans[freePlanKey].name}</strong> to <strong style={{ color: colors.darkBrown }}>{plans[selectedPlan].name}</strong>.</p>
              <div style={{ margin: "2rem 0", padding: "1.5rem", background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, borderRadius: "12px", border: `1px solid ${colors.lightTan}` }}>
                <div style={{ marginBottom: "0.5rem", color: colors.mediumBrown }}><strong>Current:</strong> R{currentSubscription?.amount || 0}/{currentSubscription?.cycle || "monthly"}</div>
                <div style={{ color: colors.mediumBrown }}><strong>New:</strong> {plans[selectedPlan].price[billingCycle] === 0 ? "Free" : isNewUser() ? `FREE for 3 months, then R${plans[selectedPlan].price[billingCycle]}/${billingCycle === "monthly" ? "month" : "year"}` : `R${plans[selectedPlan].price[billingCycle]}/${billingCycle === "monthly" ? "month" : "year"}`}</div>
              </div>
              <div style={baseStyles.modalActions}>
                <button style={baseStyles.buttonSecondary} onClick={cancelPlanChange}>Cancel</button>
                <button style={baseStyles.button} onClick={confirmPlanChange}>{upgradeDowngradeAction === "downgrade" && selectedPlan === freePlanKey ? "Confirm Downgrade" : isNewUser() ? "Start Free Trial" : `Pay & ${upgradeDowngradeAction}`}</button>
              </div>
            </div>
          </div>
        )}

        {/* Downgrade Options Modal */}
        {showDowngradeOptions && (
          <div style={baseStyles.planChangeModal}>
            <div style={baseStyles.modalContent}>
              <h3 style={baseStyles.modalTitle}>Choose Downgrade Option</h3>
              <p style={baseStyles.modalText}>Select which plan you'd like to downgrade to:</p>
              <div style={{ margin: "2rem 0" }}>
                {Object.entries(plans)
                  .filter(([planKey]) => planOrder[planKey] < planOrder[getCurrentPlanKey()] && planOrder[planKey] > 0)
                  .map(([planKey, plan]) => (
                    <div key={planKey} style={{ cursor: "pointer", padding: "1.5rem", borderBottom: `1px solid ${colors.lightTan}`, borderRadius: "12px 12px 0 0", background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, marginBottom: "1rem", transition: "all 0.3s ease" }} onClick={() => handleDowngradeSelect(planKey)}>
                      <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>{plan.name} Plan</div>
                      <div style={{ color: colors.mediumBrown, marginTop: "0.5rem" }}>{plan.price[billingCycle] === 0 ? "Free" : `R ${plan.price[billingCycle]}/${billingCycle === "monthly" ? "month" : "year"}`}</div>
                      <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>Save R{getCurrentPlanAmount() - plan.price[billingCycle]}/month</p>
                    </div>
                  ))}
                <div style={{ cursor: "pointer", padding: "1.5rem", borderRadius: "12px", background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, transition: "all 0.3s ease" }} onClick={() => handleDowngradeSelect(freePlanKey)}>
                  <div style={{ fontWeight: 700, color: colors.darkBrown, fontSize: "1.125rem" }}>{plans[freePlanKey].name} Plan</div>
                  <div style={{ color: colors.mediumBrown, marginTop: "0.5rem" }}>Free</div>
                  <p style={{ margin: "0.5rem 0 0 0", color: colors.accentGold, fontSize: "0.95rem" }}>Basic features only, no monthly fee</p>
                </div>
              </div>
              <div style={baseStyles.modalActions}><button style={baseStyles.buttonSecondary} onClick={cancelDowngradeOptions}>Cancel</button></div>
            </div>
          </div>
        )}

        {/* Add-on Modal */}
        {showAddOnModal && selectedAddOn && (
          <div style={baseStyles.planChangeModal}>
            <div style={baseStyles.modalContent}>
              <h3 style={baseStyles.modalTitle}>{selectedAddOn.name}</h3>
              <p style={baseStyles.modalText}>{selectedAddOn.description}</p>
              <div style={{ margin: "2rem 0", padding: "1.5rem", background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, borderRadius: "12px", border: `1px solid ${colors.lightTan}` }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: colors.accentGold, marginBottom: "0.5rem" }}>{selectedAddOn.price}</div>
                <div style={{ color: colors.mediumBrown }}>One-time payment to add this feature to your account.</div>
              </div>
              <div style={baseStyles.modalActions}>
                <button style={baseStyles.buttonSecondary} onClick={() => setShowAddOnModal(false)}>Close</button>
                <button style={baseStyles.button} onClick={handleAddOnPayment} disabled={paymentProcessing}>{paymentProcessing ? "Processing..." : `Purchase for ${selectedAddOn.price}`}</button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Management */}
        {isExistingUser && currentSubscription && (
          <div style={{ background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.lightTan} 100%)`, borderRadius: "16px", padding: "2rem", marginTop: "3rem", border: `1px solid ${colors.lightTan}` }}>
            <h3 style={{ color: colors.darkBrown, marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 700, textAlign: "center" }}>Subscription Management</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
              <button style={{ padding: "1rem 1.5rem", background: `linear-gradient(135deg, ${colors.accentGold} 0%, ${colors.lightBrown} 100%)`, color: colors.lightText, border: "none", borderRadius: "12px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.3s ease", textAlign: "center" }} onClick={() => { alert("Update payment method feature coming soon!") }}>💳 Update Payment Method</button>
              <button style={{ padding: "1rem 1.5rem", background: `linear-gradient(135deg, ${colors.featureCross} 0%, #B71C1C 100%)`, color: colors.lightText, border: "none", borderRadius: "12px", fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.3s ease", textAlign: "center" }} onClick={handleCancelSubscription}>❌ Cancel Subscription</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

export default ReusableSubscription