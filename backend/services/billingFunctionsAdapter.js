/**
 * billingFunctionsAdapter.js
 * 
 * Firebase Cloud Functions Adapter.
 * Prepares the billing & subscription notification services for Firebase Cloud Functions deployment.
 * 
 * WHEN MIGRATING TO FIREBASE CLOUD FUNCTIONS:
 * 1. Ensure `firebase-functions` and `firebase-admin` are installed in your functions directory.
 * 2. In your functions index.js:
 *      const billingFunctions = require('./services/billingFunctionsAdapter');
 *      exports.onSubscriptionStarted = billingFunctions.onSubscriptionStarted;
 *      exports.onPaymentFailed = billingFunctions.onPaymentFailed;
 *      exports.onSubscriptionCancelled = billingFunctions.onSubscriptionCancelled;
 *      exports.sendTaxInvoice = billingFunctions.sendTaxInvoice;
 *      exports.onSubscriptionCreatedTrigger = billingFunctions.onSubscriptionCreatedTrigger;
 */

const billingNotificationService = require("./billingNotificationService");

/**
 * Callable Firebase Function: onSubscriptionStarted
 * Payload: { to, customerName, planName, billingCycle, amount, currency, transactionId, invoiceNumber, isTrialPeriod, trialEndDate, userType }
 */
const onSubscriptionStartedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendSubscriptionStartedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onSubscriptionStarted] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onPaymentFailed
 * Payload: { to, customerName, planName, amount, currency, failureReason, transactionId, userType, gracePeriodDays }
 */
const onPaymentFailedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendPaymentFailedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onPaymentFailed] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: onSubscriptionCancelled
 * Payload: { to, customerName, planName, effectiveDate, freePlanName, userType, accessChanges }
 */
const onSubscriptionCancelledHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendSubscriptionCancelledEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:onSubscriptionCancelled] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendTaxInvoice
 * Payload: { to, customerName, companyName, invoiceNumber, items, subtotal, vat, total, currency, transactionId }
 */
const sendTaxInvoiceHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendInvoiceEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendTaxInvoice] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Firestore Document Trigger: onSubscriptionCreatedTrigger
 * Triggers automatically when a new subscription document is written to Firestore:
 * subscriptions/{subscriptionId}
 */
const onSubscriptionCreatedTriggerHandler = async (snap, context) => {
  try {
    const data = snap.data();
    if (!data || !data.email) {
      console.log("[Trigger:onSubscriptionCreated] No email found in document, skipping.");
      return null;
    }

    if (data.status === "Success" || data.status === "active" || data.status === "Active") {
      return await billingNotificationService.sendSubscriptionStartedEmail({
        to: data.email,
        customerName: data.fullName || data.customerName || "Valued Member",
        planName: data.plan || data.planName || "Premium",
        billingCycle: data.cycle || data.billingCycle || "monthly",
        amount: data.amount || 0,
        currency: data.currency || "ZAR",
        transactionId: data.transactionRef || data.transactionId || context.params?.subscriptionId,
        invoiceNumber: `INV-${context.params?.subscriptionId?.slice(-6) || Date.now().toString().slice(-6)}`,
        isTrialPeriod: !!data.isTrialPeriod,
        trialEndDate: data.trialEndDate,
        userType: data.userType || "investor",
      });
    }

    return null;
  } catch (error) {
    console.error("[Trigger:onSubscriptionCreated] Error processing trigger:", error);
    return null;
  }
};

/**
 * Callable Firebase Function: sendRenewalReminder
 * Payload: { to, customerName, planName, billingCycle, amount, currency, renewalDate, userType, manageUrl }
 */
const sendRenewalReminderHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendSubscriptionRenewalReminderEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendRenewalReminder] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendPlanUpgrade
 * Payload: { to, customerName, previousPlan, newPlan, billingCycle, newAmount, effectiveDate, currency, userType }
 */
const sendPlanUpgradeHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendPlanUpgradeConfirmationEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendPlanUpgrade] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendRefundIssued
 * Payload: { to, customerName, planName, refundAmount, originalTransactionId, refundId, reason, currency, userType }
 */
const sendRefundIssuedHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendRefundIssuedEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendRefundIssued] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendSuccessFeeTriggered
 * Payload: { to, customerName, companyName, dealName, dealAmount, feePercentage, feeAmount, invoiceNumber, dueDate, bankingDetails, currency, userType }
 */
const sendSuccessFeeTriggeredHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendSuccessFeeTriggeredEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendSuccessFeeTriggered] Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Callable Firebase Function: sendSuccessFeeReceipt
 * Payload: { to, customerName, companyName, receiptNumber, invoiceNumber, dealReference, amountPaid, paymentMethod, paymentDate, currency, userType }
 */
const sendSuccessFeeReceiptHandler = async (data, context) => {
  try {
    const payload = (data && data.data) ? data.data : (data || {});
    if (!payload.to) {
      return { success: false, error: "Recipient email is required" };
    }
    const result = await billingNotificationService.sendSuccessFeeReceiptEmail(payload);
    return { success: true, result };
  } catch (error) {
    console.error("[CloudFunction:sendSuccessFeeReceipt] Error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  onSubscriptionStartedHandler,
  onPaymentFailedHandler,
  onSubscriptionCancelledHandler,
  sendTaxInvoiceHandler,
  sendRenewalReminderHandler,
  sendPlanUpgradeHandler,
  sendRefundIssuedHandler,
  sendSuccessFeeTriggeredHandler,
  sendSuccessFeeReceiptHandler,
  onSubscriptionCreatedTriggerHandler,
};

