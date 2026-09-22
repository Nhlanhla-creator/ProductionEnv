/**
 * useOnboardingVetting.js
 * 
 * Custom React Hook providing unified access to SME Onboarding & Vetting
 * notification dispatchers across SME dashboard, Universal Profile, and Admin portals.
 */

import { useState, useCallback } from "react";
import onboardingVettingService from "../services/onboardingVettingService";

export function useOnboardingVetting(user) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState(null);

  /**
   * Dispatches Profile Approved (Marketplace Activated) notification (SP8.17)
   */
  const notifyProfileApproved = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await onboardingVettingService.notifyProfileApproved({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useOnboardingVetting: Failed notifyProfileApproved:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Profile Rejected (Next Steps + How to Fix) notification (SP8.18)
   */
  const notifyProfileRejected = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await onboardingVettingService.notifyProfileRejected({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useOnboardingVetting: Failed notifyProfileRejected:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Vetting Status Update notification (SP8.24)
   */
  const notifyVettingStatusUpdate = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await onboardingVettingService.notifyVettingStatusUpdate({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useOnboardingVetting: Failed notifyVettingStatusUpdate:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Evidence/Supporting Documents Requested notification (SP8.25)
   */
  const notifyEvidenceRequested = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await onboardingVettingService.notifyEvidenceRequested({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useOnboardingVetting: Failed notifyEvidenceRequested:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Vetting Rejection notification (SP8.30)
   */
  const notifyVettingRejection = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await onboardingVettingService.notifyVettingRejection({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useOnboardingVetting: Failed notifyVettingRejection:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  return {
    notifyProfileApproved,
    notifyProfileRejected,
    notifyVettingStatusUpdate,
    notifyEvidenceRequested,
    notifyVettingRejection,
    isProcessing,
    lastError,
  };
}

export default useOnboardingVetting;
