/**
 * useVerificationNudges.js
 * 
 * Custom React Hook providing unified access to Verification Badges,
 * Application Draft Nudges, and Document Expiry Warnings.
 */

import { useState, useCallback } from "react";
import verificationNudgeService from "../services/verificationNudgeService";

export function useVerificationNudges(user) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState(null);

  /**
   * Dispatches BIG Score Verified Badge Issued notification (SP8.29)
   */
  const notifyVerifiedBadgeIssued = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await verificationNudgeService.notifyVerifiedBadgeIssued({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useVerificationNudges: Failed notifyVerifiedBadgeIssued:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Application Draft Saved Nudge notification (SP8.20)
   */
  const notifyApplicationDraftSaved = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await verificationNudgeService.notifyApplicationDraftSaved({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useVerificationNudges: Failed notifyApplicationDraftSaved:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Document Expiry Warning notification (SP8.41)
   */
  const notifyDocumentExpiryWarning = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await verificationNudgeService.notifyDocumentExpiryWarning({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useVerificationNudges: Failed notifyDocumentExpiryWarning:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  return {
    notifyVerifiedBadgeIssued,
    notifyApplicationDraftSaved,
    notifyDocumentExpiryWarning,
    isProcessing,
    lastError,
  };
}

export default useVerificationNudges;
