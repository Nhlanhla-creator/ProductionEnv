"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { getAuth } from "firebase/auth";
import { doc, setDoc, collection, getFirestore, addDoc, updateDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import BillingInfoInvestors from "./billing-info-advisor";

const styles = {
  planChangeModal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    padding: "2rem",
    borderRadius: "0.75rem",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
  },
  modalActions: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "1.5rem",
    flexWrap: "wrap",
  },
  button: {
    padding: "0.6rem 1.5rem",
    border: "none",
    fontWeight: 600,
    borderRadius: "0.375rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    backgroundColor: "#764635",
    color: "white",
  },
  buttonHover: {
    backgroundColor: "#5c372b",
  },
  buttonSecondary: {
    padding: "0.6rem 1.5rem",
    border: "none",
    fontWeight: 600,
    borderRadius: "0.375rem",
    cursor: "pointer",
    backgroundColor: "#e5e5e5",
    color: "#333",
  },
  buttonSecondaryHover: {
    backgroundColor: "#ccc",
  },
  payButtonEnhanced: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#764635",
    color: "white",
    fontWeight: 600,
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    textAlign: "center",
    maxWidth: "300px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "0.5rem",
  },
  payButtonEnhancedHover: {
    backgroundColor: "#684d43",
  },
  payButtonEnhancedLoading: {
    backgroundColor: "#d1d5db",
    color: "#555",
    cursor: "not-allowed",
  },
  formContainerBillCentered: {
    display: "flex",
    justifyContent: "center",
    margin: "2rem auto",
  },
  formCardEnhanced: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "0.75rem",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  buttonDowngrade: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
    padding: "0.6rem 1.5rem",
    fontWeight: 600,
    fontSize: "1rem",
    borderRadius: "0.375rem",
    cursor: "pointer",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
    maxWidth: "250px",
    margin: "0 auto",
    display: "block",
    textAlign: "center",
  },
  buttonDowngradeHover: {
    backgroundColor: "#fde68a",
    borderColor: "#fbbf24",
    color: "#78350f",
  },
  container: {
    padding: "0 1rem",
    maxWidth: "1200px",
    marginTop: "5rem",
    marginLeft: "10%",
    marginRight: "5%",
    marginBottom: "9rem",
  },
  pageTitle: {
    textAlign: "center",
    fontSize: "1.875rem",
    margin: "2.5rem 0",
    fontWeight: 700,
    color: "#1f2937",
  },
  tableContainer: {
    maxWidth: "1000px",
    margin: "0 0 2.5rem 2rem",
    overflowX: "auto",
  },
  comparisonTable: {
    maxWidth: "1000px",
    margin: "6rem auto 4rem auto",
    padding: "2rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  formContainer: {
    maxWidth: "600px",
    margin: "2.5rem 0 2.5rem 2rem",
    padding: "1.75rem",
    backgroundColor: "white",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  formTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "1.75rem",
  },
  formGroup: {
    marginBottom: "1.25rem",
  },
  formLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#4b5563",
    marginBottom: "0.5rem",
  },
  formInput: {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "0.375rem",
    border: "1px solid #d1d5db",
    marginBottom: "0.25rem",
    transition: "border-color 0.3s, box-shadow 0.3s",
  },
  formInputFocus: {
    outline: "none",
    borderColor: "#846358",
    boxShadow: "0 0 0 1px #846358",
  },
  formError: {
    color: "#dc2626",
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
  },
  summaryBox: {
    marginTop: "1.75rem",
    padding: "1.25rem",
    backgroundColor: "#fdf8f6",
    borderRadius: "0.5rem",
    border: "1px solid #eaddd7",
  },
  buttonFull: {
    display: "block",
    width: "100%",
    padding: "0.75rem 1rem",
    backgroundColor: "#764635",
    color: "white",
    borderRadius: "0.375rem",
    marginTop: "1.75rem",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  buttonFullHover: {
    backgroundColor: "#684d43",
  },
  navButton: {
    display: "inline-block",
    padding: "0.5rem 1.5rem",
    backgroundColor: "#846358",
    color: "white",
    border: "1px solid #846358",
    borderRadius: "0.375rem",
    transition: "background-color 0.3s",
    cursor: "pointer",
  },
  navButtonHover: {
    backgroundColor: "#854d37",
  },
  planCard: {
    border: "2px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "1.5rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  planCardSelected: {
    borderColor: "#846358",
    backgroundColor: "#fdf8f6",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  selectedBadge: {
    display: "inline-block",
    padding: "0.5rem 1rem",
    backgroundColor: "#7a4533",
    color: "white",
    fontSize: "0.875rem",
    borderRadius: "9999px",
    fontWeight: 600,
  },
  selectButton: {
    display: "inline-block",
    padding: "0.5rem 1rem",
    border: "2px solid #846358",
    color: "white",
    fontSize: "0.875rem",
    borderRadius: "9999px",
    fontWeight: 600,
    transition: "background-color 0.3s, color 0.3s",
  },
  selectButtonHover: {
    backgroundColor: "#865e51",
    color: "white",
  },
};

const InvestorsSubscriptions = () => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  const publicKey = "pk_test_e99e9d341c8fa3182737cd26c5838dece90e3ed9";
  // Enhanced state for subscription management
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [upgradeDowngradeAction, setUpgradeDowngradeAction] = useState(null);
  const [showPlanChangeConfirm, setShowPlanChangeConfirm] = useState(false);
  const [showDowngradeOptions, setShowDowngradeOptions] = useState(false);

  const generateInvoiceNumber = (transaction, index) => {
    const baseName = (transaction.companyName || transaction.fullName || "User").substring(0, 3).toUpperCase();
    const count = (index + 1).toString().padStart(3, "0");
    return `${baseName}-sub-${count}`;
  };


  useEffect(() => {
    // Check if Paystack is already loaded
    if (window.PaystackPop) {
      setPaystackLoaded(true);
      return;
    }

    // Remove any existing Paystack scripts to avoid conflicts
    const existingScript = document.querySelector('script[src*="paystack"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Load Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;

    script.onload = () => {
      console.log("Paystack script loaded successfully");
      setPaystackLoaded(true);
    };

    script.onerror = (error) => {
      console.error("Failed to load Paystack script:", error);
      alert("Payment system failed to load. Please refresh the page and try again.");
    };

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const paystackScript = document.querySelector('script[src*="paystack"]');
      if (paystackScript && paystackScript.parentNode) {
        paystackScript.parentNode.removeChild(paystackScript);
      }
    };
  }, []);

  const plans = {
    basic: {
      name: "Basic",
      price: { monthly: 0, annually: 0 },
      currency: "ZAR",
      features: {
        "Subscription Fee": "ZAR 0",
        "Success Fee (% of transaction value)": "0%",
        "Filters (passive matches)": false,
        "Advanced Filters": false,
        "BIG Score": false,
        "Profile Matches and Match filters": false,
        "BIG Score Improvement Recommendations": false,
        "Dashboards and Analytics": false,
        "Featured Placement": false,
      },
    },
    standard: {
      name: "Standard",
      price: { monthly: 70, annually: 700 },
      currency: "ZAR",
      features: {
        "Subscription Fee": "ZAR 70",
        "Success Fee (% of transaction value)": "3%",
        "Filters (passive matches)": false,
        "Advanced Filters": true,
        "BIG Score": true,
        "Profile Matches and Match filters": true,
        "BIG Score Improvement Recommendations": false,
        "Dashboards and Analytics": false,
        "Featured Placement": false,
      },
    },
    premium: {
      name: "Premium",
      price: { monthly: 200, annually: 2000 },
      currency: "ZAR",
      features: {
        "Subscription Fee": "ZAR 200",
        "Success Fee (% of transaction value)": "1%",
        "Filters (passive matches)": false,
        "Advanced Filters": true,
        "BIG Score": true,
        "Profile Matches and Match filters": true,
        "BIG Score Improvement Recommendations": true,
        "Dashboards and Analytics": true,
        "Featured Placement": true,
      },
    },
  };

  const featureOrder = [
    "Subscription Fee",
    "Success Fee (% of transaction value)",
    "Filters (passive matches)",
    "Advanced Filters",
    "BIG Score",
    "Profile Matches and Match filters",
    "BIG Score Improvement Recommendations",
    "Dashboards and Analytics",
    "Featured Placement",
  ];

  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [billingCycle] = useState("monthly"); // Removed the state setter since we're only using monthly now
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [history, setHistory] = useState([]);
  const [errors, setErrors] = useState({});
  const [showBillingInfo, setShowBillingInfo] = useState(false);

  // Load user subscription data
  const loadUserSubscription = async (userId) => {
    setIsLoading(true);
    try {
      // Query subscriptions collection for user's active subscription
      const subscriptionsRef = collection(db, "subscriptions");
      // Replace the problematic query in loadUserSubscription()
      const q = query(
        subscriptionsRef,
        where("userId", "==", userId),
        where("status", "in", ["Success", "Paid", "Active"])
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Get the most recent subscription
        const subscriptions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const latestSubscription = subscriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        setCurrentSubscription(latestSubscription);
        setIsExistingUser(true);
        setSelectedPlan(latestSubscription.plan.toLowerCase());
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Feature comparison table component

  const FeatureComparisonTable = () => {
    return (
      <div style={{
        margin: "2rem auto",
        maxWidth: "900px",
        background: "#fff",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          marginBottom: "1.5rem",
          color: "#333",
          textAlign: "center"
        }}>Plan Features Comparison</h2>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "1rem"
        }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa" }}>
              <th style={{
                padding: "12px 15px",
                textAlign: "left",
                fontWeight: 600,
                color: "#333",
                position: "sticky",
                top: 0
              }}>Feature</th>
              <th style={{ padding: "12px 15px", textAlign: "center", fontWeight: 600 }}>Basic</th>
              <th style={{ padding: "12px 15px", textAlign: "center", fontWeight: 600 }}>Standard</th>
              <th style={{ padding: "12px 15px", textAlign: "center", fontWeight: 600 }}>Premium</th>
            </tr>
          </thead>
          <tbody>
            {featureOrder.map((feature) => (
              <tr key={feature} style={{ backgroundColor: "#fff", borderBottom: "1px solid #e0e0e0" }}>
                <td style={{
                  padding: "12px 15px",
                  fontWeight: 500,
                  width: "30%",
                  color: "#555"
                }}>{feature}</td>
                <td style={{ padding: "12px 15px", textAlign: "center", color: "#555" }}>
                  {typeof plans.basic.features[feature] === 'boolean' ?
                    (plans.basic.features[feature] ? '✓' : '✗') :
                    plans.basic.features[feature]}
                </td>
                <td style={{ padding: "12px 15px", textAlign: "center", color: "#555" }}>
                  {typeof plans.standard.features[feature] === 'boolean' ?
                    (plans.standard.features[feature] ? '✓' : '✗') :
                    plans.standard.features[feature]}
                </td>
                <td style={{ padding: "12px 15px", textAlign: "center", color: "#555" }}>
                  {typeof plans.premium.features[feature] === 'boolean' ?
                    (plans.premium.features[feature] ? '✓' : '✗') :
                    plans.premium.features[feature]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      loadUserSubscription(user.uid);

      // Fetch transaction history from Firestore
      fetchUserTransactions(user.uid);

      // Load company name if available
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().company) {
          setCompanyName(docSnap.data().company);
        }
      });
    }
  }, [user]);

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) newErrors.email = "Email is required";
    else if (!emailRegex.test(email)) newErrors.email = "Enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlanSelect = (planKey) => {
    if (isExistingUser && currentSubscription) {
      const currentPlanKey = currentSubscription.plan.toLowerCase();
      if (planKey !== currentPlanKey) {
        setSelectedPlan(planKey);

        // Determine if it's upgrade or downgrade
        const planOrder = { basic: 0, standard: 1, premium: 2 };
        const action = planOrder[planKey] > planOrder[currentPlanKey] ? 'upgrade' : 'downgrade';
        setUpgradeDowngradeAction(action);
        setShowPlanChangeConfirm(true);
        setShowDowngradeOptions(false);
      }
    } else {
      setSelectedPlan(planKey);
      setErrors({});
    }
  };

  const handleDowngradeClick = () => {
    setShowDowngradeOptions(true);
  };

  const handleDowngradeSelect = (targetPlan) => {
    setSelectedPlan(targetPlan);
    setUpgradeDowngradeAction('downgrade');
    setShowDowngradeOptions(false);
    setShowPlanChangeConfirm(true);
  };

  const cancelDowngradeOptions = () => {
    setShowDowngradeOptions(false);
  };

  const confirmPlanChange = () => {
    console.log("=== CONFIRM PLAN CHANGE DEBUG ===");
    console.log("upgradeDowngradeAction:", upgradeDowngradeAction);
    console.log("selectedPlan:", selectedPlan);
    console.log("currentSubscription:", currentSubscription);

    if (upgradeDowngradeAction === 'downgrade' && selectedPlan === 'basic') {
      console.log("Calling handleDowngradeToFree...");
      handleDowngradeToFree();
    } else if (upgradeDowngradeAction === 'downgrade') {
      console.log("Calling handleUpgradePayment for paid downgrade...");
      // Handle paid downgrade (like Premium to Standard)
      handleUpgradePayment();
    } else {
      console.log("Calling handleUpgradePayment for upgrade...");
      // Handle upgrade
      setShowPlanChangeConfirm(false);
      handleUpgradePayment();
    }
  };

const handleDowngradeToFree = async () => {
  try {
    const transactionIndex = history.length;
    const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex);

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
      action: 'downgrade',
      invoiceNumber
    };
    
    // Save the transaction record
    await saveToFirebase(newRecord);
    
    // Update subscription in database
    await updateSubscriptionInDatabase({
      plan: plans[selectedPlan].name,
      amount: 0,
      status: "Active",
      lastModified: new Date().toISOString(),
      userId: user.uid
    });
    
    // Update user's current plan
    await updateCurrentPlan(plans[selectedPlan].name, billingCycle);
    
    // Update local state
    setHistory([newRecord, ...history]);
    setCurrentSubscription({
      id: newRecord.id,
      ...newRecord
    });
    
    alert(`Successfully downgraded to ${plans[selectedPlan].name} plan!`);
    setShowPlanChangeConfirm(false);
    setUpgradeDowngradeAction(null);
    
  } catch (error) {
    console.error("Error in handleDowngradeToFree:", error);
    alert("An error occurred during downgrade. Please try again.");
  }
};
  const handleUpgradePayment = async () => {
    if (!validate()) return;

    if (!paystackLoaded || !window.PaystackPop) {
      alert("Payment system is still loading. Please wait a moment and try again.");
      return;
    }

    console.log("Initializing Paystack payment for upgrade...");

    try {
      const planPrice = plans[selectedPlan].price[billingCycle];

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
        callback: function (response) {
          console.log("Payment successful:", response);
          handleUpgradeSuccess(response, planPrice);
        },
        onClose: function () {
          console.log("Payment modal closed");
          handleUpgradeClose();
        },
      };

      console.log("Paystack config:", paystackConfig);

      const handler = window.PaystackPop.setup(paystackConfig);

      if (handler && typeof handler.openIframe === 'function') {
        handler.openIframe();
      } else {
        throw new Error("Paystack handler not properly initialized");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Failed to initialize payment. Please try again or refresh the page.");
    }
  };

  const handleUpgradeSuccess = async (response, amountPaid) => {
    const transactionIndex = history.length;
    const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex);

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
      invoiceNumber
    };

    setHistory([newRecord, ...history]);
    await saveToFirebase(newRecord);
    await updateCurrentPlan(plans[selectedPlan].name, billingCycle);
    await updateSubscriptionInDatabase({
      plan: plans[selectedPlan].name,
      amount: amountPaid,
      status: "Paid",
      transactionRef: response.reference,
      lastModified: new Date().toISOString()
    });

    // Update the current subscription state immediately
    setCurrentSubscription({
      ...currentSubscription,
      plan: plans[selectedPlan].name,
      amount: amountPaid,
      status: "Paid",
      transactionRef: response.reference
    });

    alert(`Payment successful! Your plan has been ${upgradeDowngradeAction}d to ${plans[selectedPlan].name}.`);

    // Reload the user subscription to ensure sync
    setTimeout(() => {
      loadUserSubscription(user.uid);
    }, 1000);
  };

  const handleUpgradeClose = () => {
    alert("Payment cancelled");
  };
  const updateSubscriptionInDatabase = async (subscriptionData) => {
    try {
      if (currentSubscription && currentSubscription.id) {
        // Update existing subscription
        const subscriptionRef = doc(db, "subscriptions", currentSubscription.id);
        await updateDoc(subscriptionRef, subscriptionData);
        console.log("Updated existing subscription:", currentSubscription.id);
      } else {
        // Create new subscription document
        const subscriptionsRef = collection(db, "subscriptions");
        const newSubscriptionData = {
          ...subscriptionData,
          userId: user.uid,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(subscriptionsRef, newSubscriptionData);
        console.log("Created new subscription:", docRef.id);

        // Update currentSubscription state with new document ID
        setCurrentSubscription({
          id: docRef.id,
          ...newSubscriptionData
        });
      }
      return true;
    } catch (error) {
      console.error("Error updating/creating subscription:", error);
      console.error("Error details:", error.message);
      return false;
    }
  };

  const cancelPlanChange = () => {
    setSelectedPlan(currentSubscription.plan.toLowerCase());
    setShowPlanChangeConfirm(false);
    setShowDowngradeOptions(false);
    setUpgradeDowngradeAction(null);
  };

  const handlePay = async () => {
    const planPrice = plans[selectedPlan].price[billingCycle];

    if (selectedPlan === "basic") {
      try {
        const transactionIndex = history.length;
        const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex);

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
          invoiceNumber
        };

        // Save to Firebase
        await saveToFirebase(newRecord);

        // Update current plan in user document
        await updateCurrentPlan(plans[selectedPlan].name, billingCycle);

        // Update subscription in subscriptions collection
        await updateSubscriptionInDatabase({
          plan: plans[selectedPlan].name,
          amount: 0,
          status: "Active",
          lastModified: new Date().toISOString(),
          userId: user.uid
        });

        // Update local state
        setHistory([newRecord, ...history]);
        setCurrentSubscription({
          id: newRecord.id,
          ...newRecord
        });

        alert("Basic plan activated successfully!");
        return;
      } catch (error) {
        console.error("Error activating Basic plan:", error);
        alert("Failed to activate Basic plan. Please try again.");
        return;
      }
    }

    // Rest of the payment handling for paid plans...
    if (!validate()) return;

    if (!paystackLoaded || !window.PaystackPop) {
      alert("Payment system is still loading. Please wait a moment and try again.");
      return;
    }

    console.log("Initializing Paystack payment for new subscription...");

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
        callback: function (response) {
          console.log("Payment successful:", response);
          handleSuccess(response, planPrice);
        },
        onClose: function () {
          console.log("Payment modal closed");
          handleClose();
        },
      };

      console.log("Paystack config:", paystackConfig);

      const handler = window.PaystackPop.setup(paystackConfig);

      if (handler && typeof handler.openIframe === 'function') {
        handler.openIframe();
      } else {
        throw new Error("Paystack handler not properly initialized");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Failed to initialize payment. Please try again or refresh the page.");
    }
  };

  const handleSuccess = async (response, amountPaid) => {
    const transactionIndex = history.length;
    const invoiceNumber = generateInvoiceNumber({ companyName, fullName }, transactionIndex);

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
      invoiceNumber
    };
    setHistory([newRecord, ...history]);
    await saveToFirebase(newRecord);
    await updateCurrentPlan(plans[selectedPlan].name, billingCycle);
    alert("Payment successful! Your plan is now active.");
  };

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
    };
    setHistory([newRecord, ...history]);
    alert("Payment cancelled");
  };

  const saveToFirebase = async (record) => {
    if (!user) {
      console.error("No user found when saving to Firebase");
      return false;
    }

    try {
      console.log("Saving record to Firebase:", record);

      // Save to subscriptions collection
      const subscriptionsRef = collection(db, "subscriptions");
      const docRef = await addDoc(subscriptionsRef, record);
      console.log("Saved to subscriptions collection:", docRef.id);

      // Also save to user's subscription history
      const userSubscriptionsRef = collection(db, "users", user.uid, "subscriptions");
      await addDoc(userSubscriptionsRef, record);
      console.log("Saved to user's subscription history");

      return true;
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return false;
    }
  };

  const updateCurrentPlan = async (planName, cycle) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        currentPlan: {
          name: planName,
          cycle: cycle,
          activeSince: new Date().toISOString(),
          status: "active",
          lastPaymentDate: new Date().toISOString(),
        },
        planUpdatedAt: new Date().toISOString(),
      });
      console.log("User plan updated successfully");
    } catch (error) {
      console.error("Error updating current plan:", error);
    }
  };

  const generateInvoicePDF = (transaction) => {
    console.log("Generating PDF for transaction:", transaction);

    // Check if jsPDF is available
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error("jsPDF not available");
      throw new Error("PDF library not loaded");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    try {
      // Add company logo and info
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("BIG DealFlow", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("123 Business Street, Johannesburg, South Africa", 105, 28, { align: "center" });
      doc.text("VAT: 123456789 | Tel: +27 11 123 4567", 105, 34, { align: "center" });

      // Add invoice title
      doc.setFontSize(16);
      doc.text(`INVOICE #${transaction.invoiceNumber || transaction.id.slice(0, 8)}`, 105, 45, { align: "center" });


      // Add dates
      doc.setFontSize(10);
      const invoiceDate = new Date(transaction.createdAt);
      const dueDate = new Date(invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      doc.text(`Date: ${invoiceDate.toLocaleDateString()}`, 15, 55);
      doc.text(`Due Date: ${dueDate.toLocaleDateString()}`, 15, 60);

      // Add billing info
      doc.setFontSize(12);
      doc.text("Bill To:", 15, 75);
      doc.text(transaction.email || "N/A", 15, 80);
      if (transaction.fullName) doc.text(transaction.fullName, 15, 85);
      if (transaction.companyName) doc.text(transaction.companyName, 15, 90);

      // Add line items
      doc.setFontSize(12);
      doc.text("Description", 15, 110);
      doc.text("Amount", 180, 110, { align: "right" });

      doc.setDrawColor(200, 200, 200);
      doc.line(15, 112, 195, 112);

      const description = transaction.action
        ? `${transaction.plan} Subscription (${transaction.action}) - ${transaction.cycle || 'monthly'}`
        : `${transaction.plan} Subscription - ${transaction.cycle || 'monthly'}`;

      doc.text(description, 15, 120);
      doc.text(`ZAR ${transaction.amount || 0}.00`, 180, 120, { align: "right" });

      // Add total
      doc.setFontSize(14);
      doc.setDrawColor(100, 100, 100);
      doc.line(15, 130, 195, 130);
      doc.text("Total", 15, 138);
      doc.text(`ZAR ${transaction.amount || 0}.00`, 180, 138, { align: "right" });

      // Add payment status
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Payment Status: ${transaction.status}`, 15, 160);
      if (transaction.transactionRef) doc.text(`Transaction ID: ${transaction.transactionRef}`, 15, 165);

      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for your business!", 105, 280, { align: "center" });
      doc.text("Terms: Payment due within 7 days", 105, 285, { align: "center" });

      console.log("PDF generated successfully");
      return doc;
    } catch (error) {
      console.error("Error generating PDF content:", error);
      throw error;
    }
  };

  const downloadInvoice = (transaction) => {
    console.log("=== DOWNLOAD INVOICE DEBUG ===");
    console.log("Transaction:", transaction);
    console.log("Window.jspdf available:", !!window.jspdf);
    console.log("Window.jspdf.jsPDF available:", !!(window.jspdf && window.jspdf.jsPDF));

    // Check if jsPDF is loaded
    if (!window.jspdf || !window.jspdf.jsPDF) {
      console.error("jsPDF not loaded properly");
      alert("PDF generation library is still loading. Please wait a moment and try again.");

      // Try to reload jsPDF
      const existingScript = document.querySelector('script[src*="jspdf"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        console.log("jsPDF reloaded, try again");
        alert("PDF library reloaded. Please try downloading again.");
      };
      document.head.appendChild(script);
      return;
    }

    try {
      console.log("Generating PDF...");
      const doc = generateInvoicePDF(transaction);

      const filename = `invoice_${transaction.invoiceNumber || transaction.id.slice(0, 8)}_${transaction.plan.toLowerCase().replace(/\s+/g, '_')}.pdf`;

      console.log("Saving PDF as:", filename);

      doc.save(filename);
      console.log("PDF download initiated successfully");

    } catch (error) {
      console.error("Error in downloadInvoice:", error);
      alert(`Error generating PDF: ${error.message}. Please try again.`);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    return {
      date: date.toLocaleDateString('en-US', dateOptions),
      time: date.toLocaleTimeString('en-US', timeOptions)
    };
  };

  // Add this function inside your component
  const fetchUserTransactions = async (userId) => {
    try {
      const transactionsRef = collection(db, "subscriptions"); // or "transactions" if that's your collection
      const q = query(transactionsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const transactions = [];
      querySnapshot.forEach((doc) => {
        transactions.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date descending
      transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setHistory([]);
    }
  };

  if (isLoading) {
    return (
      <div className="container-sub">
        <div className="loading-container">
          <h2>Loading your subscription details...</h2>
        </div>
      </div>
    );
  }

  /* JSX updated to use inline styling from styles object */

  return (
    <div style={styles.container}>
      {isExistingUser && currentSubscription ? (
        <>
          <FeatureComparisonTable />
          {currentSubscription.plan.toLowerCase() !== 'basic' && (
            <div style={{ textAlign: "center", margin: "2rem 0" }}>
              <button style={styles.buttonDowngrade} onClick={handleDowngradeClick}>
                Downgrade Plan
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <h1 style={styles.pageTitle}>Choose Your Subscription Plan</h1>
          <FeatureComparisonTable />
        </>
      )}

      {showDowngradeOptions && (
        <div style={styles.planChangeModal}>
          <div style={styles.modalContent}>
            <h3>Choose New Plan</h3>
            <p>Select which plan you'd like to switch to:</p>

            <div>
              {currentSubscription.plan.toLowerCase() === 'premium' && (
                <div style={{ cursor: 'pointer', padding: '1rem' }} onClick={() => handleDowngradeSelect('standard')}>
                  <h4>Standard Plan</h4>
                  <p>ZAR {plans.standard.price.monthly}/month - Keep most features</p>
                </div>
              )}
              <div style={{ cursor: 'pointer', padding: '1rem' }} onClick={() => handleDowngradeSelect('basic')}>
                <h4>Basic Plan</h4>
                <p>Free - Basic features only</p>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.buttonSecondary} onClick={cancelDowngradeOptions}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showPlanChangeConfirm && (
        <div style={styles.planChangeModal}>
          <div style={styles.modalContent}>
            <h3>Confirm Plan Change</h3>
            <p>
              You are about to <strong>{upgradeDowngradeAction}</strong> from{' '}
              <strong>{currentSubscription.plan}</strong> to <strong>{plans[selectedPlan].name}</strong>.
            </p>
            <div style={{ margin: "1rem 0" }}>
              <div>Current: ZAR {currentSubscription.amount}/{currentSubscription.cycle || 'monthly'}</div>
              <div>New: {plans[selectedPlan].price.monthly === 0 ? "Free" : `ZAR ${plans[selectedPlan].price.monthly}/month`}</div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.buttonSecondary} onClick={cancelPlanChange}>Cancel</button>
              <button
                style={{
                  ...styles.payButtonEnhanced,
                  ...(selectedPlan !== "basic" && !paystackLoaded ? styles.payButtonEnhancedLoading : {})
                }}
                onClick={handlePay}
              >
                {plans[selectedPlan].price.monthly === 0
                  ? "Activate Basic Plan"
                  : `Pay ${plans[selectedPlan].currency} ${plans[selectedPlan].price.monthly}.00`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', justifyContent: 'center', margin: '2rem auto', maxWidth: '800px' }}>
        {Object.entries(plans).map(([planKey, plan]) => {
          const isCurrentPlan = isExistingUser && currentSubscription?.plan.toLowerCase() === planKey;
          const selectedStyle = selectedPlan === planKey ? styles.planCardSelected : {};

          return (
            <div
              key={planKey}
              style={{ ...styles.planCard, ...selectedStyle }}
              onClick={() => handlePlanSelect(planKey)}
            >
              <h3 style={styles.planName}>{plan.name}</h3>
              <div style={styles.planPrice}>
                {plan.price.monthly === 0 ? "Free" : `${plan.currency} ${plan.price.monthly}`}
                {plan.price.monthly > 0 && <span style={styles.planPricePeriod}>/month</span>}
              </div>
              {isCurrentPlan ? (
                <div style={styles.selectedBadge}>Current Plan</div>
              ) : selectedPlan === planKey ? (
                <div style={styles.selectedBadge}>Selected Plan</div>
              ) : (
                <button style={styles.selectButton}>Select {plan.name}</button>
              )}
            </div>
          );
        })}
      </div>

      {!showBillingInfo && !showPlanChangeConfirm && !isExistingUser && (
        <div style={styles.formContainerBillCentered}>
          <div style={styles.formCardEnhanced}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                style={{
                  ...styles.payButtonEnhanced,
                  ...(selectedPlan !== "basic" && !paystackLoaded ? styles.payButtonEnhancedLoading : {})
                }}
                onClick={handlePay}
                disabled={!paystackLoaded && selectedPlan !== "basic"}
              >
                {!paystackLoaded && selectedPlan !== "basic"
                  ? "Loading Payment System..."
                  : plans[selectedPlan].price.monthly === 0
                    ? "Activate Basic Plan"
                    : `Pay ${plans[selectedPlan].currency} ${plans[selectedPlan].price.monthly}.00`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBillingInfo && (
        <BillingInfoInvestors
          email={email}
          fullName={fullName}
          companyName={companyName}
          history={history}
          setHistory={setHistory}
          setEmail={setEmail}
          setFullName={setFullName}
          setCompanyName={setCompanyName}
        />
      )}

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button onClick={() => setShowBillingInfo(!showBillingInfo)} style={styles.navButton}>
          {showBillingInfo ? "Back to Subscriptions" : "Manage Billing Information"}
        </button>
      </div>
    </div>
  );

};

export default InvestorsSubscriptions;