// components/Subscriptions/Actions.js
import { doc, collection, getFirestore, addDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Helper: Import getDoc, query, where, getDocs
import { getDoc, query, where, getDocs } from "firebase/firestore";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || "https://brown-ivory-website-h8srool38-big-league.vercel.app";

// Validation function
export const validate = (email, fullName) => {
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) errors.email = "Email is required";
  else if (!emailRegex.test(email)) errors.email = "Enter a valid email";

  if (!fullName) errors.fullName = "Full name is required";

  return { isValid: Object.keys(errors).length === 0, errors };
};

// Save to Firebase function
export const saveToFirebase = async (record) => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const subscriptionsRef = collection(db, "subscriptions");
    const result = await addDoc(subscriptionsRef, {
      ...record,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    console.log("✅ Saved to Firebase:", result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("❌ Error saving to Firebase:", error);
    throw error;
  }
};

// Update current plan function
export const updateCurrentPlan = async (planName, cycle, additionalData = {}) => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

  try {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      currentSubscription: {
        name: planName,
        plan: planName,
        cycle: cycle,
        status: "active",
        lastUpdated: new Date().toISOString(),
        ...additionalData
      },
      subscriptionUpdatedAt: new Date().toISOString(),
    });
    
    console.log("✅ Updated current plan in user document");
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating current plan:", error);
    
    // Try alternative field names
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        currentPlan: {
          name: planName,
          cycle: cycle,
          activeSince: new Date().toISOString(),
          status: "active",
          lastPaymentDate: new Date().toISOString(),
          ...additionalData
        },
        planUpdatedAt: new Date().toISOString(),
      });
      console.log("✅ Updated using alternative field names");
      return { success: true };
    } catch (fallbackError) {
      console.error("❌ Fallback update also failed:", fallbackError);
      throw error;
    }
  }
};

// Create subscription checkout (for recurring payments with trial)
// Possible duplicate function
export const createSubscriptionCheckout = async (
  amount,
  currency,
  userId,
  planName,
  billingCycle,
  actionType = "subscription",
  isTrialPeriod = false,
  originalAmount = null
) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("🔄 Creating subscription checkout:", { 
      amount, 
      currency, 
      userId, 
      planName, 
      billingCycle, 
      actionType,
      isTrialPeriod,
      originalAmount 
    });

    const requestBody = {
      userId,
      planName,
      billingCycle,
      amount: isTrialPeriod ? 0 : amount, // 0 for trial period
      originalAmount: isTrialPeriod ? originalAmount || amount : amount,
      currency: currency || "ZAR",
      customerEmail: user?.email,
      customerName: user?.displayName,
      actionType,
      isTrialPeriod,
    };

    console.log("Sending request to:", `${API_BASE_URL}/api/payments/create-subscription`);
    console.log("Request body:", requestBody);

    const response = await fetch(`${API_BASE_URL}/api/payments/create-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error("❌ API Error Response:", errorData);
      throw new Error(errorData.error || errorData.message || `Failed to create subscription: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Subscription checkout created:", result);

    if (!result.success || !result.checkoutId) {
      throw new Error(result.error || "Invalid response from subscription service");
    }

    return result;
  } catch (error) {
    console.error("❌ Subscription checkout error:", error);
    
    // Provide user-friendly error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Network error: Unable to connect to payment service. Please check your internet connection.");
    }
    
    if (error.message.includes('404')) {
      throw new Error("Subscription service endpoint not found. Please contact support.");
    }
    
    if (error.message.includes('500')) {
      throw new Error("Payment service is temporarily unavailable. Please try again later.");
    }
    
    throw error;
  }
};

// Create one-time checkout (for add-ons or one-time purchases)
// Possible duplicate function
export const createOneTimeCheckout = async (
  amount,
  currency,
  userId,
  planName,
  billingCycle,
  actionType = "one_time",
  addOnName = null,
  addOnId = null,
  toolName = null
) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Validate required parameters
    if (!amount || amount < 0) {
      throw new Error("Invalid amount");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log("💳 Creating one-time checkout:", { 
      amount, 
      currency, 
      userId, 
      planName, 
      billingCycle, 
      actionType,
      addOnName,
      addOnId,
      toolName 
    });

    const requestBody = {
      amount: amount.toString(),
      currency: currency || "ZAR",
      userId,
      customerEmail: user?.email,
      customerName: user?.displayName,
      planName,
      billingCycle,
      actionType,
      addOnName,
      addOnId,
      toolName,
      orderId: `order_${Date.now()}_${userId}`,
    };

    console.log("Sending request to:", `${API_BASE_URL}/api/payments/create-checkout`);
    console.log("Request body:", requestBody);

    const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error("❌ API Error Response:", errorData);
      throw new Error(errorData.error || errorData.message || `Failed to create checkout: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ One-time checkout created:", result);

    if (!result.success || !result.checkoutId) {
      throw new Error(result.error || "Invalid response from checkout service");
    }

    return result;
  } catch (error) {
    console.error("❌ One-time checkout error:", error);
    
    // Provide user-friendly error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Network error: Unable to connect to payment service. Please check your internet connection.");
    }
    
    if (error.message.includes('404')) {
      throw new Error("Payment service endpoint not found. Please contact support.");
    }
    
    if (error.message.includes('500')) {
      throw new Error("Payment service is temporarily unavailable. Please try again later.");
    }
    
    throw error;
  }
};

// Check payment status
export const checkPaymentStatus = async (checkoutId) => {
  try {
    if (!checkoutId) {
      throw new Error("Checkout ID is required");
    }

    console.log("🔍 Checking payment status for checkout:", checkoutId);

    const response = await fetch(
      `${API_BASE_URL}/api/payments/status/${checkoutId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
      }
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.error || errorData.message || `Status check failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Payment status result:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Status check error:", error);
    throw error;
  }
};

// Save card for future use
export const saveCardForFutureUse = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const response = await fetch(`${API_BASE_URL}/api/payments/save-card`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({
        userId,
        returnUrl: window.location.href,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.error || errorData.message || "Failed to initiate card saving");
    }

    const result = await response.json();
    console.log("✅ Card saving initiated:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Error saving card:", error);
    throw error;
  }
};

// Handle subscription cancellation
export const cancelSubscription = async (subscriptionData) => {
  try {
    const auth = getAuth();
    const db = getFirestore();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Update user document
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      currentSubscription: {
        plan: "Basic", // or "Discover" depending on user type
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        previousPlan: subscriptionData.plan,
        previousCycle: subscriptionData.cycle,
      },
      subscriptionUpdatedAt: new Date().toISOString(),
    });

    // Create cancellation record in subscriptions collection
    const cancellationRecord = {
      id: `cancellation_${Date.now()}_${user.uid}`,
      email: subscriptionData.email || user.email,
      plan: "Basic", // or "Discover"
      cycle: "monthly",
      amount: 0,
      fullName: subscriptionData.fullName || user.displayName,
      companyName: subscriptionData.companyName || "",
      createdAt: new Date().toISOString(),
      status: "Success",
      autoRenew: false,
      userId: user.uid,
      action: "cancellation",
      previousPlan: subscriptionData.plan,
      previousAmount: subscriptionData.amount,
      transactionRef: `cancellation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    await saveToFirebase(cancellationRecord);
    
    console.log("✅ Subscription cancelled successfully");
    return { success: true, message: "Subscription cancelled successfully" };
  } catch (error) {
    console.error("❌ Error cancelling subscription:", error);
    throw error;
  }
};

// Load user's current subscription
export const loadUserSubscription = async (userId) => {
  try {
    const db = getFirestore();
    
    // First, check user document for current subscription
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    let subscriptionData = null;

    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check for currentSubscription or currentPlan
      if (userData.currentSubscription) {
        subscriptionData = {
          id: `user_${userId}`,
          plan: userData.currentSubscription.plan || userData.currentSubscription.name,
          status: userData.currentSubscription.status || "Success",
          amount: userData.currentSubscription.amount || 0,
          cycle: userData.currentSubscription.cycle || "monthly",
          createdAt: userData.currentSubscription.lastUpdated || 
                    userData.currentSubscription.activeSince || 
                    userData.subscriptionUpdatedAt || 
                    userData.planUpdatedAt,
          userId: userId,
          transactionRef: userData.currentSubscription.transactionRef,
          autoRenew: userData.currentSubscription.status === "active" || 
                    userData.currentSubscription.status === "Success",
          isTrialPeriod: userData.currentSubscription.isTrialPeriod || false,
          originalAmount: userData.currentSubscription.originalAmount,
          trialStartDate: userData.currentSubscription.trialStartDate,
          trialEndDate: userData.currentSubscription.trialEndDate,
          cardBrand: userData.currentSubscription.cardBrand,
          cardLast4: userData.currentSubscription.cardLast4,
        };
      } else if (userData.currentPlan) {
        subscriptionData = {
          id: `user_${userId}`,
          plan: userData.currentPlan.name,
          status: userData.currentPlan.status || "Success",
          amount: userData.currentPlan.amount || 0,
          cycle: userData.currentPlan.cycle || "monthly",
          createdAt: userData.currentPlan.activeSince || userData.planUpdatedAt,
          userId: userId,
          autoRenew: userData.currentPlan.status === "active" || 
                    userData.currentPlan.status === "Success",
        };
      }
    }

    // Also check subscriptions collection
    const subscriptionsRef = collection(db, "subscriptions");
    const queries = [
      query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "Success")),
      query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "Active")),
      query(subscriptionsRef, where("userId", "==", userId), where("status", "==", "active")),
    ];

    const queryResults = await Promise.all(queries.map(q => getDocs(q)));
    const allSubscriptions = [];

    queryResults.forEach(querySnapshot => {
      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Filter out add-on purchases from subscription data
        if (!data.type || data.type !== "addon") {
          allSubscriptions.push({ id: doc.id, ...data });
        }
      });
    });

    if (allSubscriptions.length > 0) {
      const latestSubscription = allSubscriptions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0];

      // Use collection data if it's more recent
      if (!subscriptionData || 
          new Date(latestSubscription.createdAt) > new Date(subscriptionData.createdAt || 0)) {
        subscriptionData = latestSubscription;
      }
    }

    console.log("✅ Loaded subscription data:", subscriptionData);
    return subscriptionData;
  } catch (error) {
    console.error("❌ Error loading user subscription:", error);
    throw error;
  }
};