// actions.js
import { doc, collection, getFirestore, addDoc, updateDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
    await addDoc(subscriptionsRef, {
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving to Firebase:", error);
    throw error;
  }
};

// Update current plan function
export const updateCurrentPlan = async (planName, cycle) => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated");

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
  } catch (error) {
    console.error("Error updating current plan:", error);
    throw error;
  }
};

// Create Peach Payments checkout
export const createPeachPaymentsCheckout = async (
  amount,
  currency,
  userId,
  planName,
  billingCycle,
  actionType,
  previousPlan = null,
  addOnName = null,
  addOnId = null,
  toolName = null,
  toolCategory = null,
  toolTier = null
) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Validate required parameters
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log("Creating checkout with params:", {
      amount,
      currency,
      userId,
      planName,
      billingCycle,
      actionType
    });

    const requestBody = {
      amount: amount.toString(),
      currency: currency || "ZAR",
      userId,
      customerEmail: user?.email || "nhlanhlamsomi2024@gmail.com",
      customerName: user?.displayName || "Nhlanhla Msomi",
      planName,
      billingCycle,
      actionType,
      previousPlan,
      addOnName,
      addOnId,
      toolName,
      toolCategory,
      toolTier,
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
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error("API Error Response:", errorData);
      throw new Error(errorData.error || errorData.message || `Failed to create checkout: ${response.status}`);
    }

    const result = await response.json();
    console.log("Checkout creation successful:", result);

    if (!result.success || !result.checkoutId) {
      throw new Error(result.error || "Invalid response from checkout service");
    }

    return result;
  } catch (error) {
    console.error("Checkout error:", error);
    
    // Provide more specific error messages
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

    console.log("Checking payment status for checkout:", checkoutId);

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
    console.log("Payment status result:", result);
    
    return result;
  } catch (error) {
    console.error("Status check error:", error);
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

    return await response.json();
  } catch (error) {
    console.error("Error saving card:", error);
    throw error;
  }
};