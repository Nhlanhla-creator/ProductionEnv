/**
 * billingNotificationService.js
 * 
 * Centralized Client-Side Billing & Subscription Notification Service.
 * Universal across all dashboards (Investor, SME, Catalyst, Program Sponsor).
 * 
 * Multi-Channel Dispatch:
 * 1. Branded HTML Email via backend /api/email/* (or Firebase Cloud Functions)
 * 2. In-App Notification (dispatches role-specific events like `newInvestorNotification`)
 * 3. Persistent Firestore `messages` collection record (synced with useMessages & useNotifications)
 */

import { collection, addDoc, getFirestore } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebaseConfig";

// Base API URL configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://brown-ivory-website-h8srool38-big-league.vercel.app");

class ClientBillingNotificationService {
  /**
   * Helper: Dispatches in-app notification events
   */
  dispatchInAppNotification({ message, type = "info", userType = "investor", details = {} }) {
    if (typeof window === "undefined") return;

    // 1. Investor Dashboard: dispatch event + persist to localStorage
    if (userType === "investor") {
      const investorEvent = new CustomEvent("newInvestorNotification", {
        detail: {
          message,
          type: type === "error" ? "error" : type === "warning" ? "warning" : "status_change",
          companyName: details.companyName || "BigMarketplace Billing",
          timestamp: new Date().toISOString(),
          ...details,
        },
      });
      window.dispatchEvent(investorEvent);

      try {
        const saved = JSON.parse(localStorage.getItem("investorNotifications") || "[]");
        const newNotif = {
          id: Date.now(),
          message,
          type: type === "error" ? "error" : type === "warning" ? "warning" : "status_change",
          timestamp: new Date().toISOString(),
          read: false,
          companyName: details.companyName || "BigMarketplace Billing",
        };
        localStorage.setItem("investorNotifications", JSON.stringify([newNotif, ...saved].slice(0, 50)));
      } catch (e) {
        console.warn("Could not write to investorNotifications localStorage", e);
      }
    }

    // 2. Catalyst Dashboard: persist to catalystNotifications localStorage
    if (userType === "catalyst") {
      try {
        const saved = JSON.parse(localStorage.getItem("catalystNotifications") || "[]");
        const newNotif = {
          id: Date.now(),
          message,
          type: type === "error" ? "error" : "info",
          timestamp: new Date().toISOString(),
          read: false,
          title: "Billing & Subscription",
        };
        localStorage.setItem("catalystNotifications", JSON.stringify([newNotif, ...saved].slice(0, 50)));
      } catch (e) {
        console.warn("Could not write to catalystNotifications localStorage", e);
      }
    }

    // 3. Universal cross-dashboard event
    const universalEvent = new CustomEvent("newBillingNotification", {
      detail: {
        message,
        type,
        userType,
        timestamp: new Date().toISOString(),
        details,
      },
    });
    window.dispatchEvent(universalEvent);
  }

  /**
   * Helper: Persists message to Firestore `messages` and `notifications` collections
   */
  async persistToFirestoreMessages({ userId, subject, content, type = "billing", metadata = {} }) {
    if (!userId) return;
    try {
      const firestore = db || getFirestore();
      
      // Write to 'messages' collection (used by useMessages and useNotifications hooks)
      const messageDoc = {
        to: userId,
        from: "BigMarketplace Billing",
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        type: "billing",
        billingType: type,
        ...metadata,
      };
      await addDoc(collection(firestore, "messages"), messageDoc);

      // Write to 'notifications' collection (used by Program Sponsor & other dashboard listeners)
      const notificationDoc = {
        userId,
        title: subject,
        message: content,
        type: type === "payment_failed" ? "error" : "status_change",
        read: false,
        createdAt: new Date().toISOString(),
        ...metadata,
      };
      await addDoc(collection(firestore, "notifications"), notificationDoc).catch(() => {});

      console.log(`✅ [BillingNotification] Persistent message saved to Firestore for user ${userId}`);
    } catch (err) {
      console.error("⚠️ [BillingNotification] Failed to save message to Firestore:", err);
    }
  }

  /**
   * Helper: Dispatches via Firebase Cloud Function callable primarily, with backend API fallback
   */
  async callEmailEndpoint(endpoint, payload, functionName = null) {
    // 1. Primary: Dispatch via Firebase Cloud Function callable
    if (functionName) {
      try {
        const callable = httpsCallable(functions, functionName);
        const fnResult = await callable(payload);
        console.log(`✅ [BillingNotification] Dispatched via Firebase Cloud Function (${functionName}):`, fnResult.data);
        return fnResult.data;
      } catch (fnError) {
        console.warn(`⚠️ [BillingNotification] Cloud Function (${functionName}) unavailable, falling back to backend API:`, fnError.message);
      }
    }

    // 2. Fallback: Dispatch via backend API endpoint
    try {
      const response = await fetch(`${API_BASE_URL}/api/email/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [BillingNotification] Email sent via API fallback (${endpoint}):`, result);
        return result;
      }
      throw new Error(`API responded with status ${response.status}`);
    } catch (apiError) {
      console.error(`❌ [BillingNotification] Both Cloud Function and API failed:`, apiError);
      return { success: false, error: apiError.message };
    }
  }

  /**
   * 1. NOTIFY SUBSCRIPTION STARTED
   */
  async notifySubscriptionStarted({
    user,
    planName,
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    transactionId,
    isTrialPeriod = false,
    trialEndDate = null,
    userType = "investor",
    customerName = null,
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Member";
    const userId = user?.uid;

    const notificationMessage = isTrialPeriod
      ? `🎉 3-Month Free Trial Activated! Welcome to the ${planName} plan.`
      : `🎉 Subscription Activated: Welcome to the ${planName} plan!`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      userType,
      details: { planName, billingCycle, amount, isTrialPeriod },
    });

    // 2. Persistent Firestore message
    if (userId) {
      const content = isTrialPeriod
        ? `Your 3-month free trial for the ${planName} plan is active until ${trialEndDate ? new Date(trialEndDate).toLocaleDateString() : '3 months from now'}. You now have full access to all ${planName} features.`
        : `Your ${planName} (${billingCycle}) subscription of ${currency} ${amount} has been successfully activated. Transaction Ref: ${transactionId || 'N/A'}.`;

      await this.persistToFirestoreMessages({
        userId,
        subject: `Subscription Activated: ${planName}`,
        content,
        type: "subscription_started",
        metadata: { planName, billingCycle, amount, isTrialPeriod, trialEndDate },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "subscription-started",
        {
          to: recipientEmail,
          customerName: recipientName,
          planName,
          billingCycle,
          amount,
          currency,
          transactionId: transactionId || `TXN-${Date.now()}`,
          isTrialPeriod,
          trialEndDate,
          userType,
        },
        "onSubscriptionStarted"
      );
    }

    return { success: true };
  }

  /**
   * 2. NOTIFY PAYMENT FAILED (with retry + update card actions)
   */
  async notifyPaymentFailed({
    user,
    planName,
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    failureReason = "Card transaction declined by issuing bank",
    transactionId,
    userType = "investor",
    customerName = null,
    retryUrl = null,
    updateCardUrl = null,
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Member";
    const userId = user?.uid;

    const notificationMessage = `⚠️ Payment Failed: Could not process ${currency} ${amount} for ${planName}. Please update your card.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "error",
      userType,
      details: { planName, amount, failureReason },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Action Required: Payment Failed for ${planName}`,
        content: `We were unable to process your payment of ${currency} ${amount} for ${planName}. Reason: ${failureReason}. Please update your payment method within 3 days to avoid service interruption.`,
        type: "payment_failed",
        metadata: { planName, amount, failureReason, requiresAction: true },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "payment-failed",
        {
          to: recipientEmail,
          customerName: recipientName,
          planName,
          billingCycle,
          amount,
          currency,
          failureReason,
          transactionId: transactionId || `FAIL-${Date.now()}`,
          userType,
          retryUrl,
          updateCardUrl,
        },
        "onPaymentFailed"
      );
    }

    return { success: true };
  }

  /**
   * 3. NOTIFY SUBSCRIPTION CANCELLED (access changes explained)
   */
  async notifySubscriptionCancelled({
    user,
    planName,
    effectiveDate = null,
    freePlanName = "Basic Free",
    userType = "investor",
    customerName = null,
    accessChanges = null,
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Member";
    const userId = user?.uid;

    const notificationMessage = `ℹ️ Subscription Cancelled: Your ${planName} plan has been cancelled. Premium access remains until ${effectiveDate ? new Date(effectiveDate).toLocaleDateString() : 'end of cycle'}.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "warning",
      userType,
      details: { planName, effectiveDate },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Subscription Cancelled: ${planName}`,
        content: `Your cancellation request for the ${planName} plan has been processed. You retain full access until ${effectiveDate ? new Date(effectiveDate).toLocaleDateString() : 'the end of your current period'}, after which your account will transition to ${freePlanName}. Your historical data remains safe.`,
        type: "subscription_cancelled",
        metadata: { planName, effectiveDate, freePlanName },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "subscription-cancelled",
        {
          to: recipientEmail,
          customerName: recipientName,
          planName,
          effectiveDate,
          freePlanName,
          userType,
          accessChanges,
        },
        "onSubscriptionCancelled"
      );
    }

    return { success: true };
  }

  /**
   * 4. NOTIFY INVOICE ISSUED / EMAIL INVOICE
   */
  async notifyInvoiceIssued({
    user,
    invoiceNumber,
    items = [],
    subtotal = 0,
    vat = 0,
    total = 0,
    currency = "ZAR",
    transactionId,
    customerName = null,
    companyName = "",
    userType = "investor",
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Customer";
    const userId = user?.uid;

    const notificationMessage = `🧾 Tax Invoice #${invoiceNumber || 'receipt'} generated. Sent to ${recipientEmail || 'your email'}.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      userType,
      details: { invoiceNumber, total },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Tax Invoice #${invoiceNumber || 'Receipt'}`,
        content: `A tax invoice (#${invoiceNumber}) for ${currency} ${Number(total).toFixed(2)} has been issued and sent to ${recipientEmail}. You can download or view it anytime from your Billing History.`,
        type: "invoice_issued",
        metadata: { invoiceNumber, total, transactionId },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "send-invoice",
        {
          to: recipientEmail,
          customerName: recipientName,
          companyName,
          invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          items,
          subtotal,
          vat,
          total,
          currency,
          transactionId: transactionId || `TXN-${Date.now()}`,
          userType,
        },
        "sendTaxInvoice"
      );
    }

    return { success: true };
  }

  /**
   * 5. NOTIFY SUBSCRIPTION RENEWAL REMINDER (3 Days Prior - SP8.47)
   */
  async notifySubscriptionRenewalReminder({
    user,
    planName,
    billingCycle = "monthly",
    amount = 0,
    currency = "ZAR",
    renewalDate = null,
    userType = "investor",
    customerName = null,
    manageUrl = null,
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Member";
    const userId = user?.uid;

    const formattedDate = renewalDate ? new Date(renewalDate).toLocaleDateString() : "in 3 days";
    const notificationMessage = `🔔 Subscription Renewal: Your ${planName} renews on ${formattedDate} (${currency} ${amount}).`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "info",
      userType,
      details: { planName, billingCycle, amount, renewalDate },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Upcoming Subscription Renewal - ${planName}`,
        content: `Your subscription for ${planName} (${billingCycle}) will automatically renew on ${formattedDate} for ${currency} ${Number(amount).toFixed(2)}. Ensure your payment method is up to date.`,
        type: "renewal_reminder",
        metadata: { planName, billingCycle, amount, renewalDate },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "renewal-reminder",
        {
          to: recipientEmail,
          customerName: recipientName,
          planName,
          billingCycle,
          amount,
          currency,
          renewalDate,
          userType,
          manageUrl,
        },
        "sendRenewalReminder"
      );
    }

    return { success: true };
  }

  /**
   * 6. NOTIFY PLAN UPGRADE CONFIRMATION (SP8.51)
   */
  async notifyPlanUpgrade({
    user,
    previousPlan = "Previous Plan",
    newPlan = "Upgraded Plan",
    billingCycle = "monthly",
    newAmount = 0,
    effectiveDate = null,
    currency = "ZAR",
    userType = "investor",
    customerName = null,
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Member";
    const userId = user?.uid;

    const notificationMessage = `🚀 Plan Upgraded: You are now on the ${newPlan} plan! Enjoy your new features and enhanced limits.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      userType,
      details: { previousPlan, newPlan, billingCycle, newAmount },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Plan Upgrade Confirmed: Welcome to ${newPlan}`,
        content: `Your subscription has been successfully upgraded from ${previousPlan} to ${newPlan} (${billingCycle}). New billing amount is ${currency} ${Number(newAmount).toFixed(2)}. All higher-tier perks are now active immediately.`,
        type: "plan_upgraded",
        metadata: { previousPlan, newPlan, billingCycle, newAmount, effectiveDate },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "plan-upgrade",
        {
          to: recipientEmail,
          customerName: recipientName,
          previousPlan,
          newPlan,
          billingCycle,
          newAmount,
          effectiveDate: effectiveDate || new Date().toISOString(),
          currency,
          userType,
        },
        "sendPlanUpgrade"
      );
    }

    return { success: true };
  }

  /**
   * 7. NOTIFY REFUND ISSUED (SP8.48)
   */
  async notifyRefundIssued({
    user,
    planName = "Subscription",
    refundAmount = 0,
    originalTransactionId = null,
    refundId = null,
    reason = "Requested by customer and approved by administration",
    currency = "ZAR",
    userType = "investor",
    customerName = null,
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Customer";
    const userId = user?.uid;

    const formattedRefund = `${currency} ${Number(refundAmount).toFixed(2)}`;
    const notificationMessage = `💳 Refund Processed: ${formattedRefund} for ${planName} has been refunded to your original payment method.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      userType,
      details: { planName, refundAmount, refundId },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Refund Processed: ${formattedRefund}`,
        content: `A refund of ${formattedRefund} for ${planName} has been processed (Ref: ${refundId || 'REF-' + Date.now()}). Please allow 3 to 5 business days for it to reflect on your statement. Reason: ${reason}`,
        type: "refund_issued",
        metadata: { planName, refundAmount, originalTransactionId, refundId, reason },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "refund-issued",
        {
          to: recipientEmail,
          customerName: recipientName,
          planName,
          refundAmount,
          originalTransactionId,
          refundId: refundId || `REF-${Date.now().toString().slice(-6)}`,
          reason,
          currency,
          userType,
        },
        "sendRefundIssued"
      );
    }

    return { success: true };
  }

  /**
   * 8. NOTIFY SUCCESS FEE TRIGGERED / INVOICED (SP8.49)
   */
  async notifySuccessFeeTriggered({
    user,
    dealName = "Funded Deal",
    dealAmount = 0,
    feePercentage = 3,
    feeAmount = 0,
    invoiceNumber = null,
    dueDate = null,
    bankingDetails = null,
    currency = "ZAR",
    userType = "investor",
    customerName = null,
    companyName = "",
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Partner";
    const userId = user?.uid;

    const computedFee = feeAmount > 0 ? feeAmount : (dealAmount * feePercentage) / 100;
    const invNum = invoiceNumber || `SF-INV-${Date.now().toString().slice(-6)}`;
    const notificationMessage = `💼 Success Fee Invoice #${invNum} (${currency} ${Number(computedFee).toFixed(2)}) has been generated for deal "${dealName}".`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      userType,
      details: { dealName, computedFee, invoiceNumber: invNum },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Success Fee Invoice #${invNum} - ${dealName}`,
        content: `A success fee invoice (#${invNum}) for ${currency} ${Number(computedFee).toFixed(2)} (${feePercentage}% of deal value ${currency} ${Number(dealAmount).toLocaleString()}) has been issued. Payment terms: Net 30.`,
        type: "success_fee_invoice",
        metadata: { dealName, dealAmount, feePercentage, feeAmount: computedFee, invoiceNumber: invNum, dueDate },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "success-fee-triggered",
        {
          to: recipientEmail,
          customerName: recipientName,
          companyName,
          dealName,
          dealAmount,
          feePercentage,
          feeAmount: computedFee,
          invoiceNumber: invNum,
          dueDate,
          bankingDetails,
          currency,
          userType,
        },
        "sendSuccessFeeTriggered"
      );
    }

    return { success: true };
  }

  /**
   * 9. NOTIFY SUCCESS FEE RECEIPT (SP8.50)
   */
  async notifySuccessFeeReceipt({
    user,
    receiptNumber = null,
    invoiceNumber = null,
    dealReference = "DEAL-001",
    amountPaid = 0,
    paymentMethod = "EFT / Bank Wire",
    paymentDate = null,
    currency = "ZAR",
    userType = "investor",
    customerName = null,
    companyName = "",
  }) {
    const recipientEmail = user?.email;
    const recipientName = customerName || user?.displayName || user?.email?.split("@")[0] || "Valued Partner";
    const userId = user?.uid;

    const rNumber = receiptNumber || `REC-SF-${Date.now().toString().slice(-6)}`;
    const notificationMessage = `🧾 Success Fee Cleared: Receipt #${rNumber} for ${currency} ${Number(amountPaid).toFixed(2)} issued.`;

    // 1. In-app notification
    this.dispatchInAppNotification({
      message: notificationMessage,
      type: "status_change",
      userType,
      details: { receiptNumber: rNumber, dealReference, amountPaid },
    });

    // 2. Persistent Firestore message
    if (userId) {
      await this.persistToFirestoreMessages({
        userId,
        subject: `Success Fee Settlement Cleared: Receipt #${rNumber}`,
        content: `Payment of ${currency} ${Number(amountPaid).toFixed(2)} for deal ${dealReference} has been verified and settled. Official receipt #${rNumber} is attached and stored in your records.`,
        type: "success_fee_receipt",
        metadata: { receiptNumber: rNumber, invoiceNumber, dealReference, amountPaid, paymentMethod, paymentDate },
      });
    }

    // 3. Branded HTML Email
    if (recipientEmail) {
      return this.callEmailEndpoint(
        "success-fee-receipt",
        {
          to: recipientEmail,
          customerName: recipientName,
          companyName,
          receiptNumber: rNumber,
          invoiceNumber: invoiceNumber || "N/A",
          dealReference,
          amountPaid,
          paymentMethod,
          paymentDate: paymentDate || new Date().toLocaleDateString(),
          currency,
          userType,
        },
        "sendSuccessFeeReceipt"
      );
    }

    return { success: true };
  }
}

const billingNotificationService = new ClientBillingNotificationService();
export default billingNotificationService;

