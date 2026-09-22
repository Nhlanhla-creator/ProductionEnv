/**
 * useCommunityDisputes.js
 * 
 * Custom React Hook providing unified access to Community Moderation Updates,
 * Dispute Filing, Rating Submissions, and Monthly Product Updates.
 */

import { useState, useCallback } from "react";
import communityDisputeService from "../services/communityDisputeService";

export function useCommunityDisputes(user) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState(null);

  /**
   * Dispatches Monthly Product Updates / What's New (SP8.13)
   */
  const notifyMonthlyProductUpdate = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await communityDisputeService.notifyMonthlyProductUpdate({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useCommunityDisputes: Failed notifyMonthlyProductUpdate:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Dispatches Community Flag / Report Actioned notification (SP8.58)
   */
  const notifyCommunityReportActioned = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await communityDisputeService.notifyCommunityReportActioned({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useCommunityDisputes: Failed notifyCommunityReportActioned:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Files a formal dispute in Firestore 'disputes' and sends notices (SP8.57)
   */
  const fileDispute = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await communityDisputeService.fileDispute({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useCommunityDisputes: Failed fileDispute:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  /**
   * Submits a rating/review in Firestore 'ratings' and sends receipt (SP8.57)
   */
  const submitRating = useCallback(
    async (params) => {
      setIsProcessing(true);
      setLastError(null);
      try {
        const result = await communityDisputeService.submitRating({
          user,
          ...params,
        });
        return result;
      } catch (err) {
        console.error("useCommunityDisputes: Failed submitRating:", err);
        setLastError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  return {
    notifyMonthlyProductUpdate,
    notifyCommunityReportActioned,
    fileDispute,
    submitRating,
    isProcessing,
    lastError,
  };
}

export default useCommunityDisputes;
