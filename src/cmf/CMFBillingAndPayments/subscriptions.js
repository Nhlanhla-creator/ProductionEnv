// src/cmf/CMFBillingAndPayments/subscriptions.js
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Check,
  X,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Loader2,
  Plus,
  Trash2,
  Ticket,
  Users,
  Gift,
  Info,
} from "lucide-react";
import {
  cmfPlans,
  cmfComparisonRows,
  cmfManagedGroupPricing,
  cmfSeatAndStorageAddOns,
  cmfWhiteLabelLevels,
  cmfProgrammeFees,
  cmfManagedRateDiscount,
  cmfReferralFeeRate,
  cmfSuccessFeeRate,
  cmfVatRate,
  smePremiumMonthly,
  smePremiumPilotMonthly,
} from "../../config/subscriptionsConfig";
import { getSubStyles } from "../../components/Subscriptions/Styles";
import { colors } from "../../shared/theme";
import EmbeddedCheckout from "../../components/EmbeddedCheckout";

const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://brown-ivory-website-h8srool38-big-league.vercel.app";

export default function CMFSubscriptions() {
  const auth = getAuth();
  const db = getFirestore();

  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cmfProfile, setCmfProfile] = useState(null);

  // CMF billing surface state
  const [managedSMEs, setManagedSMEs] = useState([]);
  const [managedGroups, setManagedGroups] = useState([]);
  const [useManagedRate, setUseManagedRate] = useState(true);
  const [activeTab, setActiveTab] = useState("plans"); // plans | billing | vouchers

  const baseStyles = getSubStyles();

  // ── Load user, profile, subscription, managed SMEs and groups ────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserData(user.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadUserData = async (uid) => {
    setLoading(true);
    try {
      // 1. CMF Profile
      let profile = null;
      const cmfSnap = await getDoc(doc(db, "cmfProfiles", `${uid}_cmf`));
      if (cmfSnap.exists()) {
        profile = cmfSnap.data().formData || cmfSnap.data() || {};
      } else {
        const altSnap = await getDoc(doc(db, "cmfProfiles", uid));
        if (altSnap.exists()) profile = altSnap.data().formData || altSnap.data() || {};
      }
      setCmfProfile(profile);

      // 2. Managed SMEs
      const smesSnap = await getDocs(
        query(collection(db, "managedSMEs"), where("cmfUserId", "==", uid))
      );
      const smes = [];
      smesSnap.forEach((d) => smes.push({ id: d.id, ...d.data() }));
      setManagedSMEs(smes);

      // 3. Managed Groups
      const groupsSnap = await getDocs(
        query(collection(db, "managedGroups"), where("cmfUserId", "==", uid))
      );
      const groups = [];
      groupsSnap.forEach((d) => groups.push({ id: d.id, ...d.data() }));
      setManagedGroups(groups);

      // 4. Subscription
      const userSnap = await getDoc(doc(db, "users", uid));
      let subData = null;
      if (userSnap.exists() && userSnap.data()?.currentSubscription) {
        subData = userSnap.data().currentSubscription;
      }

      const subsSnap = await getDocs(
        query(collection(db, "subscriptions"), where("userId", "==", uid))
      );
      const userSubs = [];
      subsSnap.forEach((d) => userSubs.push({ id: d.id, ...d.data() }));
      if (userSubs.length > 0) {
        userSubs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        const activeSub = userSubs.find(
          (s) => s.status === "active" || s.status === "Success" || s.status === "paid"
        );
        if (activeSub) subData = { ...subData, ...activeSub };
      }
      setCurrentSubscription(subData);
    } catch (err) {
      console.error("Error loading CMF subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── CMF Billing calculation ───────────────────────────────────────────────
  const cmfBilling = useMemo(() => {
    const planKey = currentSubscription?.planKey || "launch";
    const plan = cmfPlans[planKey] || cmfPlans.launch;

    const planMonthly = plan.price.monthly;
    const planAnnual = plan.price.annually;

    const smeCount = managedSMEs.length;
    const pilotCount = managedSMEs.filter((s) => s.isPilot).length;
    const standardCount = smeCount - pilotCount;
    const smeMonthly = standardCount * smePremiumMonthly + pilotCount * smePremiumPilotMonthly;

    let groupMonthly = 0;
    let groupMonthlyFullPrice = 0;
    let includedDashboardsUsed = 0;
    const includedDashboardsTotal = planKey === "pilot" || planKey === "launch" ? 1 : planKey === "growth" ? 3 : 10;

    managedGroups.forEach((g) => {
      const pricing = cmfManagedGroupPricing[g.type];
      const option = pricing?.options.find((o) => o.key === g.optionKey);
      if (!option) return;
      groupMonthlyFullPrice += option.price;
      if (option.countsAgainstPlan && includedDashboardsUsed < includedDashboardsTotal) {
        includedDashboardsUsed += 1;
      } else if (useManagedRate) {
        groupMonthly += option.price * (1 - cmfManagedRateDiscount);
      } else {
        groupMonthly += option.price;
      }
    });

    const referralIncome = useManagedRate ? 0 : groupMonthlyFullPrice * cmfReferralFeeRate;
    const monthlyExVat = planMonthly + smeMonthly + groupMonthly;
    const vatMonthly = monthlyExVat * cmfVatRate;
    const monthlyIncVat = monthlyExVat + vatMonthly;

    const annualPlanSavings = planAnnual ? planMonthly * 12 - planAnnual : 0;
    const annualExVat = planAnnual + (smeMonthly + groupMonthly) * 12;

    return {
      plan,
      planMonthly,
      planAnnual,
      smeCount,
      smeMonthly,
      groupMonthly,
      groupMonthlyFullPrice,
      includedDashboardsUsed,
      includedDashboardsTotal,
      referralIncome,
      monthlyExVat,
      vatMonthly,
      monthlyIncVat,
      annualPlanSavings,
      annualExVat,
    };
  }, [currentSubscription, managedSMEs, managedGroups, useManagedRate]);

  // ── Managed SME / Group persistence ───────────────────────────────────────
  const handleAddSME = async () => {
    if (!currentUser) return;
    const ref = await addDoc(collection(db, "managedSMEs"), {
      cmfUserId: currentUser.uid,
      name: "",
      isPilot: false,
      sponsored: false,
      voucherSponsor: "",
      createdAt: new Date().toISOString(),
    });
    setManagedSMEs((prev) => [...prev, { id: ref.id, name: "", isPilot: false, sponsored: false }]);
  };

  const handleSMEChange = async (id, field, value) => {
    setManagedSMEs((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    await setDoc(doc(db, "managedSMEs", id), { [field]: value }, { merge: true });
  };

  const handleRemoveSME = async (id) => {
    setManagedSMEs((prev) => prev.filter((s) => s.id !== id));
    await setDoc(doc(db, "managedSMEs", id), { deleted: true }, { merge: true });
  };

  const handleAddGroup = async () => {
    if (!currentUser) return;
    const ref = await addDoc(collection(db, "managedGroups"), {
      cmfUserId: currentUser.uid,
      name: "",
      type: "funder",
      optionKey: "discover",
      createdAt: new Date().toISOString(),
    });
    setManagedGroups((prev) => [
      ...prev,
      { id: ref.id, name: "", type: "funder", optionKey: "discover" },
    ]);
  };

  const handleGroupChange = async (id, field, value) => {
    setManagedGroups((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const updated = { ...g, [field]: value };
        if (field === "type") {
          const pricing = cmfManagedGroupPricing[value];
          updated.optionKey = pricing?.options[0]?.key || "";
        }
        return updated;
      })
    );
    const patch = { [field]: value };
    if (field === "type") {
      patch.optionKey = cmfManagedGroupPricing[value]?.options[0]?.key || "";
    }
    await setDoc(doc(db, "managedGroups", id), patch, { merge: true });
  };

  const handleRemoveGroup = async (id) => {
    setManagedGroups((prev) => prev.filter((g) => g.id !== id));
    await setDoc(doc(db, "managedGroups", id), { deleted: true }, { merge: true });
  };

  // ── Subscribe (existing Peach flow) ───────────────────────────────────────
  const handleSelectPlan = async (planKey) => {
    if (!currentUser) {
      setErrorMessage("Please sign in to choose a subscription plan.");
      return;
    }
    const plan = cmfPlans[planKey];
    if (!plan) return;

    setProcessingPlan(planKey);
    setErrorMessage(null);

    const amount = billingCycle === "monthly" ? plan.price.monthly : plan.price.annually;
    const customerEmail = currentUser.email || cmfProfile?.contactDetails?.email || "cmf@example.com";
    const customerName =
      currentUser.displayName || cmfProfile?.entityOverview?.registeredName || "Capital Facilitator";

    try {
      let checkoutSession = null;
      try {
        const response = await fetch(`${API_BASE_URL}/api/payments/create-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            planName: plan.name,
            billingCycle,
            amount,
            currency: "ZAR",
            customerEmail,
            customerName,
            actionType: "subscription",
          }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.checkoutId) checkoutSession = result;
        }
      } catch (backendErr) {
        console.warn("Backend Peach endpoint unavailable, falling back:", backendErr);
      }

      if (checkoutSession?.checkoutId) {
        setCheckoutData({
          checkoutId: checkoutSession.checkoutId,
          planKey,
          planName: plan.name,
          amount,
          cycle: billingCycle,
          customerEmail,
          customerName,
        });
        setShowCheckoutModal(true);
      } else {
        await completeSubscriptionActivation({
          planKey,
          planName: plan.name,
          cycle: billingCycle,
          amount,
          transactionId: `cmf_tx_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          paymentMethod: "Peach Payments Gateway",
        });
      }
    } catch (err) {
      console.error("Subscription initiation error:", err);
      setErrorMessage(err.message || "Failed to initiate payment. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const completeSubscriptionActivation = async (details) => {
    try {
      const { planKey, planName, cycle, amount, transactionId, paymentMethod } = details;
      const now = new Date().toISOString();
      const nextBillingDate = new Date();
      if (cycle === "monthly") nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      else nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);

      const subscriptionRecord = {
        userId: currentUser.uid,
        plan: planName,
        planKey,
        cycle,
        amount,
        currency: "ZAR",
        status: "active",
        createdAt: now,
        nextBillingDate: nextBillingDate.toISOString(),
        transactionRef: transactionId || `cmf_peach_${Date.now()}`,
        paymentMethod: paymentMethod || "Peach Payments",
        userType: "cmf",
        companyName:
          cmfProfile?.entityOverview?.registeredName || currentUser.displayName || "CMF Firm",
        customerEmail: currentUser.email,
      };

      const subsRef = collection(db, "subscriptions");
      const docRef = await addDoc(subsRef, subscriptionRecord);

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          currentSubscription: { ...subscriptionRecord, id: docRef.id, lastUpdated: now },
        },
        { merge: true }
      );

      await setDoc(
        doc(db, "cmfProfiles", `${currentUser.uid}_cmf`),
        {
          subscription: { plan: planName, planKey, status: "active", cycle, updatedAt: now },
        },
        { merge: true }
      );

      setCurrentSubscription({ ...subscriptionRecord, id: docRef.id });
      setShowCheckoutModal(false);
      setSuccessMessage(`Congratulations! You have successfully subscribed to the CMF ${planName} plan.`);
      setTimeout(() => setSuccessMessage(null), 7000);
    } catch (saveErr) {
      console.error("Error saving subscription:", saveErr);
      setErrorMessage("Payment recorded, but profile update failed. Please contact support.");
    }
  };

  const handlePeachCompleted = async (event) => {
    if (checkoutData) {
      await completeSubscriptionActivation({
        ...checkoutData,
        transactionId: event?.transactionId || checkoutData.checkoutId,
      });
    }
  };

  const handlePeachCancelled = () => {
    setShowCheckoutModal(false);
    setCheckoutData(null);
  };

  // ── Theme ─────────────────────────────────────────────────────────────────
  const cmfTheme = {
    pageBg: "#f8f4f1",
    panelBg: "#fffdfb",
    softBg: "#eee5e0",
    lineBorder: "#d8cbc4",
    inkDark: "#3e302b",
    mutedText: "#786962",
    brown: "#65473a",
    brownInk: "#fffaf7",
    copper: "#a97d55",
    copperInk: "#fffaf5",
    cream: "#f4ece6",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        backgroundColor: "transparent",
        color: cmfTheme.inkDark,
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          background: cmfTheme.pageBg,
          border: `1px solid ${cmfTheme.lineBorder}`,
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(62, 48, 43, 0.06)",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "2.5rem 2rem 2rem",
            textAlign: "center",
            background: `linear-gradient(180deg, ${cmfTheme.panelBg} 0%, ${cmfTheme.pageBg} 100%)`,
            borderBottom: `1px solid ${cmfTheme.lineBorder}`,
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              color: cmfTheme.copper,
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Capital & Market Facilitators
          </p>
          <h1
            style={{
              margin: "0 auto",
              fontSize: "clamp(28px, 4.5vw, 42px)",
              fontWeight: 800,
              lineHeight: 1.15,
              color: cmfTheme.inkDark,
              maxWidth: "780px",
              letterSpacing: "-0.02em",
            }}
          >
            Manage more opportunity.
            <br />
            Keep every SME funder-ready.
          </h1>
          <p
            style={{
              margin: "14px auto 0",
              maxWidth: "680px",
              fontSize: "15px",
              lineHeight: 1.6,
              color: cmfTheme.mutedText,
            }}
          >
            One workspace to prepare SMEs, track readiness, collaborate with funders and manage your
            opportunity portfolio.
          </p>

          {/* Billing Cycle Toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              margin: "24px auto 0",
              padding: "5px",
              borderRadius: "14px",
              border: `1px solid ${cmfTheme.lineBorder}`,
              background: cmfTheme.panelBg,
              boxShadow: "0 2px 8px rgba(62, 48, 43, 0.05)",
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              style={{
                border: 0,
                borderRadius: "9px",
                padding: "9px 18px",
                background: billingCycle === "monthly" ? cmfTheme.copper : "transparent",
                color: billingCycle === "monthly" ? cmfTheme.copperInk : cmfTheme.mutedText,
                fontWeight: billingCycle === "monthly" ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annually")}
              style={{
                border: 0,
                borderRadius: "9px",
                padding: "9px 18px",
                background: billingCycle === "annually" ? cmfTheme.copper : "transparent",
                color: billingCycle === "annually" ? cmfTheme.copperInk : cmfTheme.mutedText,
                fontWeight: billingCycle === "annually" ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Annual</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  background: billingCycle === "annually" ? "rgba(255,255,255,0.25)" : cmfTheme.softBg,
                  color: billingCycle === "annually" ? "#fff" : cmfTheme.brown,
                  padding: "2px 7px",
                  borderRadius: "999px",
                }}
              >
                2 months free
              </span>
            </button>
          </div>
        </header>

        {/* Alerts */}
        {successMessage && (
          <div
            style={{
              margin: "1.5rem 2rem 0",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "#edf7ed",
              color: "#1e4620",
              border: "1px solid #c8e6c9",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={20} color="#2e7d32" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div
            style={{
              margin: "1.5rem 2rem 0",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "#fdeded",
              color: "#5f2120",
              border: "1px solid #ef9a9a",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <AlertCircle size={20} color="#d32f2f" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Active Subscription Banner */}
        {currentSubscription && (
          <div
            style={{
              margin: "1.5rem 2rem 0",
              padding: "1.25rem 1.5rem",
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${cmfTheme.cream} 0%, ${cmfTheme.panelBg} 100%)`,
              border: `1px solid ${cmfTheme.lineBorder}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 9px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Active Subscription
              </span>
              <h3 style={{ margin: "2px 0 4px", fontSize: "17px", fontWeight: 700 }}>
                CMF {currentSubscription.plan} Plan
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: cmfTheme.mutedText }}>
                Billing cycle:{" "}
                <strong style={{ textTransform: "capitalize" }}>
                  {currentSubscription.cycle || "Monthly"}
                </strong>{" "}
                · Amount:{" "}
                <strong>R{Number(currentSubscription.amount || 0).toLocaleString()}</strong>
                {currentSubscription.nextBillingDate && (
                  <span>
                    {" "}
                    · Renews:{" "}
                    {new Date(currentSubscription.nextBillingDate).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: "8px",
                background: cmfTheme.softBg,
                color: cmfTheme.brown,
              }}
            >
              Current Plan
            </span>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "1rem 2rem 0",
            borderBottom: `1px solid ${cmfTheme.lineBorder}`,
            marginTop: "1.5rem",
          }}
        >
          {[
            { key: "plans", label: "Plans", icon: <Shield size={15} /> },
            { key: "billing", label: "Billing & Managed Groups", icon: <Users size={15} /> },
            { key: "vouchers", label: "Vouchers", icon: <Ticket size={15} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: 0,
                background: "transparent",
                padding: "10px 16px",
                borderBottom:
                  activeTab === tab.key
                    ? `2px solid ${cmfTheme.copper}`
                    : "2px solid transparent",
                color: activeTab === tab.key ? cmfTheme.copper : cmfTheme.mutedText,
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <main style={{ padding: "2rem" }}>
          {/* PLANS TAB */}
          {activeTab === "plans" && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "16px",
                  alignItems: "stretch",
                }}
              >
                {Object.entries(cmfPlans).map(([planKey, plan]) => {
                  const isCurrent =
                    currentSubscription?.planKey === planKey ||
                    currentSubscription?.plan?.toLowerCase() === plan.name.toLowerCase();
                  const isFeatured = plan.isFeatured;
                  const isPartner = plan.isPartner;
                  const displayAmount =
                    billingCycle === "monthly"
                      ? plan.displayPrice.monthly
                      : plan.displayPrice.annually;
                  const billedSubtext =
                    billingCycle === "monthly" ? plan.billedText.monthly : plan.billedText.annually;
                  const isBusy = processingPlan === planKey;

                  return (
                    <article
                      key={planKey}
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "430px",
                        padding: "24px",
                        borderRadius: "16px",
                        border: isFeatured || isPartner ? "none" : `1px solid ${cmfTheme.lineBorder}`,
                        background: isFeatured
                          ? cmfTheme.brown
                          : isPartner
                          ? cmfTheme.copper
                          : cmfTheme.panelBg,
                        color: isFeatured
                          ? cmfTheme.brownInk
                          : isPartner
                          ? cmfTheme.copperInk
                          : cmfTheme.inkDark,
                        boxShadow: isFeatured
                          ? "0 12px 28px rgba(101, 71, 58, 0.25)"
                          : "0 4px 12px rgba(62, 48, 43, 0.04)",
                        transform: isFeatured ? "translateY(-4px)" : "none",
                      }}
                    >
                      <span
                        style={{
                          alignSelf: "flex-start",
                          padding: "4px 9px",
                          borderRadius: "999px",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          background:
                            isFeatured || isPartner ? "rgba(255,255,255,0.18)" : cmfTheme.softBg,
                          color:
                            isFeatured || isPartner ? "inherit" : cmfTheme.mutedText,
                        }}
                      >
                        {plan.tag}
                      </span>
                      <h2 style={{ margin: "16px 0 0", fontSize: "24px", fontWeight: 800 }}>
                        {plan.name}
                      </h2>
                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          alignItems: "baseline",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{ fontSize: "36px", lineHeight: 1, fontWeight: 800, letterSpacing: "-0.03em" }}
                        >
                          {displayAmount}
                        </span>
                        <span style={{ fontSize: "13px", opacity: 0.8 }}>{plan.periodText}</span>
                      </div>
                      <div style={{ minHeight: "28px", marginTop: "6px", fontSize: "11px", opacity: 0.78 }}>
                        {billedSubtext}
                      </div>
                      <p style={{ margin: "8px 0 0", minHeight: "42px", fontSize: "13px", lineHeight: 1.45, opacity: 0.88 }}>
                        {plan.description}
                      </p>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: "18px 0 24px",
                          display: "grid",
                          gap: "10px",
                        }}
                      >
                        {plan.highlights.map((feat, idx) => (
                          <li
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              fontSize: "12.5px",
                              lineHeight: 1.35,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                color: isFeatured || isPartner ? "inherit" : cmfTheme.copper,
                                flexShrink: 0,
                              }}
                            >
                              ✓
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(planKey)}
                        disabled={isCurrent || isBusy}
                        style={{
                          width: "100%",
                          marginTop: "auto",
                          border:
                            isFeatured || isPartner
                              ? "1px solid rgba(255,255,255,0.4)"
                              : `1px solid ${cmfTheme.brown}`,
                          borderRadius: "9px",
                          padding: "12px 14px",
                          textAlign: "center",
                          background: isCurrent
                            ? "rgba(0,0,0,0.15)"
                            : isFeatured || isPartner
                            ? "rgba(255, 255, 255, 0.15)"
                            : cmfTheme.brown,
                          color: isFeatured || isPartner ? "#fff" : isCurrent ? cmfTheme.mutedText : cmfTheme.brownInk,
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: isCurrent || isBusy ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                        }}
                      >
                        {isBusy ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : isCurrent ? (
                          "Current Plan"
                        ) : (
                          plan.actionLabel
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>

              {/* SME Premium Note */}
              <aside
                style={{
                  marginTop: "26px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "14px",
                  alignItems: "start",
                  padding: "20px 22px",
                  borderRadius: "14px",
                  background: cmfTheme.cream,
                  border: `1px solid ${cmfTheme.lineBorder}`,
                }}
              >
                <span style={{ fontSize: "18px", color: cmfTheme.copper, fontWeight: 800, lineHeight: 1 }}>◎</span>
                <div>
                  <strong style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
                    SME Premium subscriptions remain separate
                  </strong>
                  <p style={{ margin: 0, color: cmfTheme.mutedText, fontSize: "13px", lineHeight: 1.55 }}>
                    Each managed SME requires an active Premium subscription, currently R1,200/month,
                    for its live BIG Score, unlimited updates, Compliance Vault and Growth Suite.
                    The SME may pay directly, or the subscription may be sponsored by the CMF, a
                    funder, a corporate or a programme sponsor.
                  </p>
                </div>
              </aside>

              {/* Comparison table */}
              <section style={{ marginTop: "40px" }}>
                <h2 style={{ margin: "0 0 16px", textAlign: "center", fontSize: "22px", fontWeight: 800 }}>
                  Full feature comparison
                </h2>
                <div
                  style={{
                    overflowX: "auto",
                    border: `1px solid ${cmfTheme.lineBorder}`,
                    borderRadius: "14px",
                    background: cmfTheme.panelBg,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      minWidth: "720px",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: cmfTheme.softBg }}>
                        <th style={{ padding: "14px 18px", textAlign: "left", fontWeight: 700, borderBottom: `1px solid ${cmfTheme.lineBorder}` }}>
                          Feature
                        </th>
                        {["pilot", "launch", "growth", "partner"].map((pk) => (
                          <th
                            key={pk}
                            style={{
                              padding: "14px 16px",
                              textAlign: "center",
                              fontWeight: 700,
                              borderBottom: `1px solid ${cmfTheme.lineBorder}`,
                              width: "18%",
                              background: pk === "launch" ? "rgba(101, 71, 58, 0.07)" : "transparent",
                            }}
                          >
                            {cmfPlans[pk].name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cmfComparisonRows.map((row, idx) => {
                        const isLast = idx === cmfComparisonRows.length - 1;
                        const borderBottom = isLast ? "none" : `1px solid ${cmfTheme.lineBorder}`;
                        if (row.fullSpanValue) {
                          return (
                            <tr key={row.key}>
                              <td style={{ padding: "13px 18px", borderBottom, fontWeight: 500 }}>{row.label}</td>
                              <td
                                colSpan={4}
                                style={{
                                  padding: "13px 16px",
                                  borderBottom,
                                  textAlign: "center",
                                  color: cmfTheme.mutedText,
                                  fontStyle: "italic",
                                }}
                              >
                                {row.fullSpanValue}
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={row.key}>
                            <td style={{ padding: "13px 18px", borderBottom, fontWeight: 500 }}>{row.label}</td>
                            {["pilot", "launch", "growth", "partner"].map((pk) => {
                              const val = cmfPlans[pk]?.comparison?.[row.key];
                              return (
                                <td
                                  key={pk}
                                  style={{
                                    padding: "13px 16px",
                                    borderBottom,
                                    textAlign: "center",
                                    background: pk === "launch" ? "rgba(101, 71, 58, 0.03)" : "transparent",
                                  }}
                                >
                                  {val === true ? (
                                    <span style={{ color: cmfTheme.brown, fontWeight: 800, fontSize: "15px" }}>✓</span>
                                  ) : val === false ? (
                                    <span style={{ color: cmfTheme.mutedText }}>–</span>
                                  ) : (
                                    <span style={{ fontWeight: 600 }}>{val}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ margin: "14px 4px 0", color: cmfTheme.mutedText, fontSize: "11px", lineHeight: 1.55 }}>
                  All prices exclude VAT where applicable. SME Premium subscriptions, independent
                  verification, verification levels, custom integrations, third-party costs and
                  transaction-related fees are not included in the CMF Workspace Fee.
                </p>
              </section>
            </>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <>
              <section
                style={{
                  padding: "1.5rem",
                  borderRadius: "14px",
                  background: cmfTheme.cream,
                  border: `1px solid ${cmfTheme.lineBorder}`,
                  marginBottom: "2rem",
                }}
              >
                <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800 }}>
                  Billing Summary
                </h2>
                <p style={{ margin: "0 0 1rem", fontSize: "12px", color: cmfTheme.mutedText }}>
                  All prices exclude VAT (15%). Annual prepayment includes two months free on the plan.
                </p>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>
                    Managed Group Pricing Model
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setUseManagedRate(true)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${cmfTheme.copper}`,
                        background: useManagedRate ? cmfTheme.copper : "transparent",
                        color: useManagedRate ? "#fff" : cmfTheme.brown,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Managed rate (20% off)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseManagedRate(false)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${cmfTheme.copper}`,
                        background: !useManagedRate ? cmfTheme.copper : "transparent",
                        color: !useManagedRate ? "#fff" : cmfTheme.brown,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      Full price + 20% referral fee
                    </button>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "11px", color: cmfTheme.mutedText }}>
                    Both options cost BIG the same. The CMF decides who benefits.
                  </p>
                </div>

                <div
                  style={{
                    background: cmfTheme.panelBg,
                    borderRadius: "10px",
                    padding: "1rem",
                  }}
                >
                  <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "6px 0" }}>{cmfBilling.plan.name} plan</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          R{cmfBilling.planMonthly.toLocaleString()}/mo
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0" }}>
                          {cmfBilling.smeCount} managed SME
                          {cmfBilling.smeCount !== 1 ? "s" : ""} on Premium
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          R{cmfBilling.smeMonthly.toLocaleString()}/mo
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "6px 0" }}>
                          {managedGroups.length} managed group dashboard
                          {managedGroups.length !== 1 ? "s" : ""}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          R{cmfBilling.groupMonthly.toLocaleString()}/mo
                        </td>
                      </tr>
                      <tr style={{ borderTop: `1px solid ${cmfTheme.lineBorder}` }}>
                        <td style={{ padding: "8px 0", fontWeight: 700 }}>Total excl. VAT</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          R{cmfBilling.monthlyExVat.toLocaleString()}/mo
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px 0" }}>VAT at 15%</td>
                        <td style={{ textAlign: "right" }}>
                          R{cmfBilling.vatMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                      <tr style={{ borderTop: `2px solid ${cmfTheme.copper}` }}>
                        <td style={{ padding: "8px 0", fontWeight: 700, fontSize: "15px" }}>
                          Total incl. VAT
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: "15px",
                            color: cmfTheme.copper,
                          }}
                        >
                          R{cmfBilling.monthlyIncVat.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          /mo
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {cmfBilling.planAnnual > 0 && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem",
                        background: "#f0f9f0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    >
                      <strong>Annual prepayment:</strong> R
                      {cmfBilling.planAnnual.toLocaleString()} for the plan (two months free) + R
                      {((cmfBilling.smeMonthly + cmfBilling.groupMonthly) * 12).toLocaleString()} for
                      SME Premiums and dashboards ={" "}
                      <strong>R{cmfBilling.annualExVat.toLocaleString()} excl. VAT</strong>. You save
                      R{cmfBilling.annualPlanSavings.toLocaleString()} on the plan.
                    </div>
                  )}

                  {!useManagedRate && cmfBilling.referralIncome > 0 && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.75rem",
                        background: "#FFF8E7",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    >
                      <strong>Referral fee income:</strong> You earn R
                      {cmfBilling.referralIncome.toLocaleString()}/mo (20% of managed group fees) for
                      the first 12 months per group.
                    </div>
                  )}

                  <div style={{ marginTop: "0.5rem", fontSize: "11px", color: cmfTheme.mutedText }}>
                    <strong>Success fee:</strong> {(cmfSuccessFeeRate * 100).toFixed(0)}% of fees you
                    receive from a managed group on a Registered Opportunity, after cleared funds. You
                    keep {((1 - cmfSuccessFeeRate) * 100).toFixed(0)}%.
                  </div>

                  <div style={{ marginTop: "0.5rem", fontSize: "11px", color: cmfTheme.mutedText }}>
                    <strong>Included dashboards:</strong> {cmfBilling.includedDashboardsUsed} /{" "}
                    {cmfBilling.includedDashboardsTotal} used. Each covers standard access (R2,000);
                    full access pays the R4,500 difference. Free Discover funders never count.
                  </div>
                </div>
              </section>

              <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>Managed SMEs</h2>
                <p style={{ margin: "0 0 1rem", fontSize: "12px", color: cmfTheme.mutedText }}>
                  Every SME a CMF manages must be on Premium (R1,200/mo, or R600 for named pilot SMEs
                  during the pilot). The SME can pay, or the CMF or a managed partner can sponsor it
                  with a voucher.
                </p>

                {managedSMEs.map((sme, index) => (
                  <div
                    key={sme.id}
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      placeholder={`SME ${index + 1} name`}
                      value={sme.name || ""}
                      onChange={(e) => handleSMEChange(sme.id, "name", e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: "150px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: `1px solid ${cmfTheme.lineBorder}`,
                        background: cmfTheme.panelBg,
                        fontSize: "13px",
                      }}
                    />
                    <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={!!sme.isPilot}
                        onChange={(e) => handleSMEChange(sme.id, "isPilot", e.target.checked)}
                      />
                      Pilot (R600)
                    </label>
                    <label style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={!!sme.sponsored}
                        onChange={(e) => handleSMEChange(sme.id, "sponsored", e.target.checked)}
                      />
                      Sponsored
                    </label>
                    {sme.sponsored && (
                      <input
                        placeholder="Sponsor name"
                        value={sme.voucherSponsor || ""}
                        onChange={(e) => handleSMEChange(sme.id, "voucherSponsor", e.target.value)}
                        style={{
                          width: "150px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${cmfTheme.lineBorder}`,
                          background: cmfTheme.panelBg,
                          fontSize: "13px",
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSME(sme.id)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${cmfTheme.lineBorder}`,
                        background: "transparent",
                        color: "#C0392B",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                      }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddSME}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: `1px dashed ${cmfTheme.copper}`,
                    background: "transparent",
                    color: cmfTheme.brown,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={14} /> Add managed SME
                </button>
              </section>

              <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>Managed Groups</h2>
                <p style={{ margin: "0 0 1rem", fontSize: "12px", color: cmfTheme.mutedText }}>
                  A CMF can onboard funders, catalysts, other CMFs, corporates, intern sponsors and
                  procurement teams. Each gets its own dashboard and sees only what the CMF releases.
                  Closed by default.
                </p>

                {managedGroups.map((group, index) => {
                  const pricing = cmfManagedGroupPricing[group.type];
                  return (
                    <div
                      key={group.id}
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <input
                        placeholder={`Group ${index + 1} name`}
                        value={group.name || ""}
                        onChange={(e) => handleGroupChange(group.id, "name", e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: "150px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${cmfTheme.lineBorder}`,
                          background: cmfTheme.panelBg,
                          fontSize: "13px",
                        }}
                      />
                      <select
                        value={group.type}
                        onChange={(e) => handleGroupChange(group.id, "type", e.target.value)}
                        style={{
                          width: "180px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${cmfTheme.lineBorder}`,
                          background: cmfTheme.panelBg,
                          fontSize: "13px",
                        }}
                      >
                        {Object.entries(cmfManagedGroupPricing).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={group.optionKey}
                        onChange={(e) => handleGroupChange(group.id, "optionKey", e.target.value)}
                        style={{
                          width: "200px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: `1px solid ${cmfTheme.lineBorder}`,
                          background: cmfTheme.panelBg,
                          fontSize: "13px",
                        }}
                      >
                        {pricing?.options.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(group.id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: `1px solid ${cmfTheme.lineBorder}`,
                          background: "transparent",
                          color: "#C0392B",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                        }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddGroup}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: `1px dashed ${cmfTheme.copper}`,
                    background: "transparent",
                    color: cmfTheme.brown,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={14} /> Add managed group
                </button>
              </section>

              <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 1rem", fontSize: "18px", fontWeight: 800 }}>Add-ons</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {Object.entries(cmfSeatAndStorageAddOns).map(([key, item]) => (
                    <div
                      key={key}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${cmfTheme.lineBorder}`,
                        background: cmfTheme.panelBg,
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ color: cmfTheme.copper, fontWeight: 700 }}>
                        R{item.price.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "11px", color: cmfTheme.mutedText }}>{item.unit}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ marginBottom: "2rem" }}>
                <h2 style={{ margin: "0 0 1rem", fontSize: "18px", fontWeight: 800 }}>
                  Programme Fees, White-label & Independence
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {Object.entries(cmfProgrammeFees).map(([key, p]) => (
                    <div
                      key={key}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${cmfTheme.lineBorder}`,
                        background: cmfTheme.panelBg,
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                        {p.label} programme
                      </div>
                      <div style={{ color: cmfTheme.copper, fontWeight: 700 }}>{p.priceRange}</div>
                      <div style={{ fontSize: "11px", color: cmfTheme.mutedText }}>{p.period}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1rem", fontSize: "12px", color: cmfTheme.mutedText }}>
                  <strong>White-label:</strong>{" "}
                  {Object.values(cmfWhiteLabelLevels)
                    .map((l) => `${l.label} (${l.availableOn.join(", ")})`)
                    .join(" · ")}
                  . BIG stays visible wherever the score, verification or data responsibility is.
                </div>

                <div style={{ marginTop: "0.5rem", fontSize: "12px", color: cmfTheme.mutedText }}>
                  <strong>Independence:</strong> A managed party can ask to go independent. The CMF
                  cannot block it, because the party controls its own data, but the CMF earns a
                  referral fee when it does.
                </div>
              </section>
            </>
          )}

          {/* VOUCHERS TAB */}
          {activeTab === "vouchers" && (
            <VouchersTab
              db={db}
              currentUser={currentUser}
              managedSMEs={managedSMEs}
              cmfTheme={cmfTheme}
            />
          )}
        </main>
      </div>

      {/* Peach Checkout Modal */}
      {showCheckoutModal && checkoutData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: cmfTheme.panelBg,
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              border: `1px solid ${cmfTheme.lineBorder}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                borderBottom: `1px solid ${cmfTheme.lineBorder}`,
                paddingBottom: "1rem",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
                  Subscribe to CMF {checkoutData.planName}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: cmfTheme.mutedText }}>
                  Secure payment via Peach Payments · R
                  {Number(checkoutData.amount).toLocaleString()} ({checkoutData.cycle})
                </p>
              </div>
              <button
                type="button"
                onClick={handlePeachCancelled}
                style={{ background: "transparent", border: 0, cursor: "pointer", color: cmfTheme.mutedText }}
              >
                <X size={20} />
              </button>
            </div>

            <EmbeddedCheckout
              checkoutId={checkoutData.checkoutId}
              onCompleted={handlePeachCompleted}
              onCancelled={handlePeachCancelled}
              onError={(err) => setErrorMessage(err?.message || "Peach payment failed")}
              paymentType="subscription"
              amount={checkoutData.amount}
              planName={checkoutData.planName}
              userEmail={checkoutData.customerEmail}
              userName={checkoutData.customerName}
            />

            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: `1px solid ${cmfTheme.lineBorder}`,
                textAlign: "center",
              }}
            >
              <button
                type="button"
                onClick={() => completeSubscriptionActivation(checkoutData)}
                style={{
                  background: "transparent",
                  border: 0,
                  color: cmfTheme.copper,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Complete Subscription Now (Test Mode)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Vouchers Tab
// ═══════════════════════════════════════════════════════════════════════════
function VouchersTab({ db, currentUser, managedSMEs, cmfTheme }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    sponsor: "",
    beneficiary: "",
    package: "Premium",
    term: 6,
    expiry: "",
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "vouchers"), where("cmfUserId", "==", currentUser.uid))
        );
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setVouchers(list);
      } catch (e) {
        console.error("Error loading vouchers:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [db, currentUser]);

  const generateCode = () =>
    "CMF" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const handleGenerate = async () => {
    if (!currentUser) return;
    setGenerating(true);
    try {
      const code = generateCode();
      const value = 1200 * Number(form.term || 1) * 0.8;
      const record = {
        cmfUserId: currentUser.uid,
        code,
        voucherCodes: [code],
        sponsor: form.sponsor,
        beneficiary: form.beneficiary,
        planName: form.package,
        term: Number(form.term),
        value,
        status: "active",
        remainingSeats: 1,
        redeemedSeats: [],
        expiresAt: form.expiry ? new Date(form.expiry).toISOString() : null,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, "vouchers"), record);
      setVouchers((prev) => [{ id: ref.id, ...record }, ...prev]);
      setForm({ sponsor: "", beneficiary: "", package: "Premium", term: 6, expiry: "" });
    } catch (e) {
      console.error("Error generating voucher:", e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <section
        style={{
          padding: "1.5rem",
          borderRadius: "14px",
          background: cmfTheme.cream,
          border: `1px solid ${cmfTheme.lineBorder}`,
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 800 }}>Generate a Voucher</h2>
        <p style={{ margin: "0 0 1rem", fontSize: "12px", color: cmfTheme.mutedText }}>
          A CMF can generate vouchers that pay for an SME's package. The sponsor is either the CMF
          or one of its managed partners, such as a funder or a corporate.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginBottom: "1rem",
          }}
        >
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Sponsor</label>
            <input
              value={form.sponsor}
              onChange={(e) => setForm((f) => ({ ...f, sponsor: e.target.value }))}
              placeholder="CMF or managed partner"
              style={inputStyle(cmfTheme)}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Beneficiary</label>
            <input
              value={form.beneficiary}
              onChange={(e) => setForm((f) => ({ ...f, beneficiary: e.target.value }))}
              placeholder="SME name or open code"
              style={inputStyle(cmfTheme)}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Package</label>
            <select
              value={form.package}
              onChange={(e) => setForm((f) => ({ ...f, package: e.target.value }))}
              style={inputStyle(cmfTheme)}
            >
              <option value="Premium">Premium (R1,200/mo)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Term (months)</label>
            <input
              type="number"
              min={1}
              value={form.term}
              onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))}
              style={inputStyle(cmfTheme)}
            />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Expiry</label>
            <input
              type="date"
              value={form.expiry}
              onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
              style={inputStyle(cmfTheme)}
            />
          </div>
        </div>

        <div style={{ fontSize: "12px", color: cmfTheme.mutedText, marginBottom: "1rem" }}>
          <strong>Value:</strong> R{(1200 * Number(form.term || 1) * 0.8).toLocaleString()} (managed
          rate, 20% off Premium)
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: "10px 18px",
            borderRadius: "9px",
            border: 0,
            background: cmfTheme.copper,
            color: "#fff",
            fontWeight: 700,
            fontSize: "13px",
            cursor: generating ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {generating ? <Loader2 size={14} /> : <Gift size={14} />}
          {generating ? "Generating..." : "Generate voucher"}
        </button>
      </section>

      <section>
        <h2 style={{ margin: "0 0 1rem", fontSize: "18px", fontWeight: 800 }}>Your Vouchers</h2>
        {loading ? (
          <div style={{ color: cmfTheme.mutedText, fontSize: "13px" }}>Loading vouchers...</div>
        ) : vouchers.length === 0 ? (
          <div style={{ color: cmfTheme.mutedText, fontSize: "13px", fontStyle: "italic" }}>
            No vouchers generated yet.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {vouchers.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  border: `1px solid ${cmfTheme.lineBorder}`,
                  background: cmfTheme.panelBg,
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 800,
                    fontSize: "15px",
                    color: cmfTheme.copper,
                    marginBottom: "6px",
                  }}
                >
                  {v.code}
                </div>
                <div>
                  <strong>Sponsor:</strong> {v.sponsor || "—"}
                </div>
                <div>
                  <strong>Beneficiary:</strong> {v.beneficiary || "Open code"}
                </div>
                <div>
                  <strong>Package:</strong> {v.planName} · {v.term} months
                </div>
                <div>
                  <strong>Value:</strong> R{Number(v.value || 0).toLocaleString()}
                </div>
                {v.expiresAt && (
                  <div style={{ color: "#C0392B" }}>
                    <strong>Expires:</strong> {new Date(v.expiresAt).toLocaleDateString()}
                  </div>
                )}
                <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Info size={12} color={cmfTheme.mutedText} />
                  <span style={{ color: cmfTheme.mutedText }}>
                    {v.remainingSeats} / {v.remainingSeats + (v.redeemedSeats?.length || 0)} seats remaining
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const inputStyle = (cmfTheme) => ({
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: `1px solid ${cmfTheme.lineBorder}`,
  background: cmfTheme.panelBg,
  fontSize: "13px",
  marginTop: "4px",
});