/**
 * useBillingNotifications.js
 * 
 * Custom React Hook providing centralized access to billing, subscription,
 * and invoicing notifications across any dashboard.
 */

import { useState, useCallback } from "react";
import billingNotificationService from "../services/billingNotificationService";

export function useBillingNotifications(user, userType = "investor") {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [failedPayment, setFailedPayment] = useState({
    hasFailed: false,
    planName: "",
    amount: 0,
    currency: "ZAR",
    errorReason: "",
    retryCallback: null,
  });

  /**
   * Dispatches Subscription Started notifications across all channels
   */
  const notifySubscriptionStarted = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifySubscriptionStarted({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifySubscriptionStarted:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Payment Failed notifications across all channels and sets local failed state
   */
  const notifyPaymentFailed = useCallback(
    async (params, retryCallback = null) => {
      setIsProcessing(true);
      setLastError(null);

      // Set interactive UI state so dashboard can show banner or modal
      setFailedPayment({
        hasFailed: true,
        planName: params.planName || "Subscription",
        amount: params.amount || 0,
        currency: params.currency || "ZAR",
        errorReason: params.failureReason || "Payment authorization declined",
        retryCallback: retryCallback || null,
      });

      try {
        const result = await billingNotificationService.notifyPaymentFailed({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifyPaymentFailed:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Subscription Cancelled notifications
   */
  const notifySubscriptionCancelled = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifySubscriptionCancelled({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifySubscriptionCancelled:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Tax Invoice notifications & email delivery
   */
  const notifyInvoiceIssued = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifyInvoiceIssued({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifyInvoiceIssued:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Subscription Renewal Reminder notifications (SP8.47)
   */
  const notifySubscriptionRenewalReminder = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifySubscriptionRenewalReminder({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifySubscriptionRenewalReminder:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Pricing Plan Upgrade notifications (SP8.51)
   */
  const notifyPlanUpgrade = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifyPlanUpgrade({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifyPlanUpgrade:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Refund Issued notifications (SP8.48)
   */
  const notifyRefundIssued = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifyRefundIssued({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifyRefundIssued:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Success Fee Triggered / Invoiced notifications (SP8.49)
   */
  const notifySuccessFeeTriggered = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifySuccessFeeTriggered({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifySuccessFeeTriggered:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dispatches Success Fee Receipt notifications (SP8.50)
   */
  const notifySuccessFeeReceipt = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await billingNotificationService.notifySuccessFeeReceipt({
          user,
          userType,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useBillingNotifications: Failed notifySuccessFeeReceipt:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user, userType]
  );

  /**
   * Dismisses failed payment banner/modal
   */
  const clearFailedPayment = useCallback(() => {
    setFailedPayment({
      hasFailed: false,
      planName: "",
      amount: 0,
      currency: "ZAR",
      errorReason: "",
      retryCallback: null,
    });
  }, []);

  return {
    notifySubscriptionStarted,
    notifyPaymentFailed,
    notifySubscriptionCancelled,
    notifyInvoiceIssued,
    notifySubscriptionRenewalReminder,
    notifyPlanUpgrade,
    notifyRefundIssued,
    notifySuccessFeeTriggered,
    notifySuccessFeeReceipt,
    failedPayment,
    clearFailedPayment,
    isProcessing,
    lastError,
  };
}

export default useBillingNotifications;

