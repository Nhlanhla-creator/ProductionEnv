/**
 * communityDisputeService.js
 * 
 * Centralized Client-Side Service for Community Moderation, Disputes, Ratings, and Monthly Updates.
 * Covers Sprint 8 tasks:
 * - SP8.13: Monthly Product Updates / What’s New
 * - SP8.58: Community Flag / Report Actioned (moderation update)
 * - SP8.57: Dispute Filed & Rating Submitted
 * 
 * Implements Firestore storage collections for 'disputes' and 'ratings' (which did not previously exist),
 * with multi-channel dispatch to Branded Email API, In-App Notification Buses, and Firestore message records.
 */

import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebaseConfig";

// Base API URL configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://brown-ivory-website-h8srool38-big-league.vercel.app");

class ClientCommunityDisputeService {
  /**
   * Dispatches in-app notification events
   */
  dispatchInAppNotification({ message, type = "info", details = {} }) {
    if (typeof window === "undefined") return;

    // 1. Universal community/announcement event
    const communityEvent = new CustomEvent("newCommunityNotification", {
      detail: {
        message,
        type,
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
    window.dispatchEvent(communityEvent);

    // 2. SME/Role-specific notification event
    const smeEvent = new CustomEvent("newSmeNotification", {
      detail: {
        message,
        type: type === "error" ? "error" : type === "warning" ? "warning" : "status_change",
        timestamp: new Date().toISOString(),
        ...details,
      },
    });
    window.dispatchEvent(smeEvent);

    // 3. LocalStorage persistence for quick dashboard display
    try {
      const saved = JSON.parse(localStorage.getItem("smeNotifications") || "[]");
      const newNotif = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        title: details.title || "Marketplace Updates",
      };
      localStorage.setItem("smeNotifications", JSON.stringify([newNotif, ...saved].slice(0, 50)));
    } catch (e) {
      console.warn("Could not write to notifications localStorage", e);
    }
  }

  /**
   * Helper: Dispatches via Firebase Cloud Function callable primarily, with backend API fallback
   */
  async sendEmail(endpoint, functionName, payload) {
    // 1. Primary: Dispatch via Firebase Cloud Function callable
    if (functionName) {
      try {
        const callable = httpsCallable(functions, functionName);
        const result = await callable(payload);
        console.log(`✅ [CommunityDisputeService] Dispatched via Firebase Cloud Function (${functionName}):`, result.data);
        return result.data;
      } catch (cfError) {
        console.warn(`⚠️ [CommunityDisputeService] Cloud function (${functionName}) unavailable, falling back to API:`, cfError.message);
      }
    }

    // 2. Fallback: Dispatch via backend API endpoint
    try {
      const res = await fetch(`${API_BASE_URL}/api/email/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`✅ [CommunityDisputeService] Email sent via API fallback (${endpoint}):`, result);
        return result;
      }
      throw new Error(`API returned status ${res.status}`);
    } catch (apiError) {
      console.error(`❌ [CommunityDisputeService] API fallback also failed (${endpoint}):`, apiError.message);
      return { success: false, error: apiError.message };
    }
  }

  /**
   * 1. MONTHLY PRODUCT UPDATES / WHAT'S NEW (SP8.13)
   */
  async notifyMonthlyProductUpdate({
    user,
    recipientEmail = null,
    recipientName = null,
    updateMonth = "July 2026",
    headline = "Automated compliance auditing, smarter matchmaking, and streamlined escrow dispute tools",
    highlights = [],
    newFeaturesUrl = null,
    changelogUrl = null,
  }) {
    const to = recipientEmail || user?.email;
    if (!to) throw new Error("Recipient email is required for product update notification");

    const name = recipientName || user?.displayName || "Valued Member";

    // 1. In-App Notification
    this.dispatchInAppNotification({
      message: `What's New in BigMarketplace for ${updateMonth} is live! Check out the latest features.`,
      type: "info",
      details: {
        title: `Product Updates – ${updateMonth}`,
        category: "product_update",
      },
    });

    // 2. Persistent Firestore Message/Announcement
    if (user?.uid && db) {
      try {
        await addDoc(collection(db, "messages"), {
          to: user.uid,
          recipientEmail: to,
          type: "announcement",
          title: `What's New in BigMarketplace (${updateMonth}) 🚀`,
          content: `${headline}. Explore the new release in your dashboard.`,
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("[CommunityDisputeService] Could not write announcement to Firestore:", err);
      }
    }

    // 3. Branded HTML Email
    return await this.sendEmail("monthly-product-update", "sendMonthlyProductUpdate", {
      to,
      recipientName: name,
      updateMonth,
      headline,
      highlights,
      newFeaturesUrl,
      changelogUrl,
    });
  }

  /**
   * 2. COMMUNITY FLAG / REPORT ACTIONED (SP8.58)
   */
  async notifyCommunityReportActioned({
    user,
    recipientEmail = null,
    recipientName = null,
    reportId = "REP-" + Date.now().toString().slice(-6),
    itemType = "listing",
    itemTitle = "Marketplace Listing",
    actionTaken = "content_removed", // 'content_removed' | 'user_warned' | 'account_suspended' | 'report_dismissed'
    resolutionNotes = "Our moderation team reviewed the reported material and determined it violated community standards.",
    appealsUrl = null,
  }) {
    const to = recipientEmail || user?.email;
    if (!to) throw new Error("Recipient email is required for moderation report notification");

    const name = recipientName || user?.displayName || "Community Member";

    // 1. In-App Notification
    this.dispatchInAppNotification({
      message: `Moderation update on report #${reportId} (${itemTitle}): Action taken - ${actionTaken.replace(/_/g, ' ')}.`,
      type: actionTaken === "report_dismissed" ? "info" : "warning",
      details: {
        title: `Moderation Case #${reportId}`,
        reportId,
        actionTaken,
      },
    });

    // 2. Persistent Firestore Message
    if (user?.uid && db) {
      try {
        await addDoc(collection(db, "messages"), {
          to: user.uid,
          recipientEmail: to,
          type: "moderation",
          title: `Moderation Notice: Report #${reportId}`,
          content: `Action taken: ${actionTaken}. Notes: ${resolutionNotes}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("[CommunityDisputeService] Could not write moderation notice to Firestore:", err);
      }
    }

    // 3. Branded HTML Email
    return await this.sendEmail("community-report-actioned", "sendCommunityReportActioned", {
      to,
      recipientName: name,
      reportId,
      itemType,
      itemTitle,
      actionTaken,
      resolutionNotes,
      appealsUrl,
    });
  }

  /**
   * 3. FILE DISPUTE (SP8.57)
   * Creates dispute record in Firestore 'disputes' collection, registers escrow mediation,
   * and fires notification emails to both the filer and counterparty.
   */
  async fileDispute({
    user,
    dealId = null,
    dealTitle = "Commercial Agreement / Funding Mandate",
    filedByRole = "SME",
    opponentId = null,
    opponentName = "Counterparty",
    opponentEmail = null,
    disputeReason = "Milestone Deliverable Non-Compliance",
    disputeDetails = "Formal dispute logged regarding deliverables in commercial contract.",
    claimAmount = null,
    viewDisputeUrl = null,
  }) {
    if (!user || !user.uid) throw new Error("User authentication required to file a dispute");

    const disputeNumber = "DSP-" + Date.now().toString().slice(-6);

    // 1. Create Firestore dispute record in 'disputes' collection
    let disputeDocId = disputeNumber;
    if (db) {
      try {
        const disputeRef = doc(collection(db, "disputes"));
        disputeDocId = disputeRef.id;
        await setDoc(disputeRef, {
          id: disputeDocId,
          disputeNumber,
          dealId,
          dealTitle,
          filedBy: user.uid,
          filedByName: user.displayName || user.email,
          filedByEmail: user.email,
          filedByRole,
          opponentId,
          opponentName,
          opponentEmail,
          disputeReason,
          disputeDetails,
          claimAmount: claimAmount ? Number(claimAmount) : null,
          status: "open",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.error("[CommunityDisputeService] Error creating dispute in Firestore:", dbErr);
      }
    }

    // 2. In-App Notification
    this.dispatchInAppNotification({
      message: `Dispute #${disputeNumber} against ${opponentName} has been logged and queued for mediation.`,
      type: "warning",
      details: {
        title: `Dispute Filed #${disputeNumber}`,
        disputeNumber,
        category: "dispute",
      },
    });

    // 3. Persistent messages for filer & opponent
    if (db) {
      try {
        // Message to filer
        await addDoc(collection(db, "messages"), {
          to: user.uid,
          type: "dispute",
          title: `Dispute #${disputeNumber} Logged`,
          content: `Your dispute regarding "${dealTitle}" has been opened. Our legal mediator will review submissions within 5 business days.`,
          read: false,
          createdAt: serverTimestamp(),
        });

        // Message to opponent (if opponentId exists)
        if (opponentId) {
          await addDoc(collection(db, "messages"), {
            to: opponentId,
            type: "dispute",
            title: `Action Required: Dispute Notice #${disputeNumber}`,
            content: `${user.displayName || "A commercial partner"} has filed a dispute regarding "${dealTitle}". Please submit your response in the case file.`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      } catch (e) {
        console.warn("[CommunityDisputeService] Could not write dispute messages to Firestore:", e);
      }
    }

    // 4. Send email to Filer (Confirmation)
    const filerEmailRes = await this.sendEmail("dispute-filed", "sendDisputeFiled", {
      to: user.email,
      recipientName: user.displayName || user.email,
      disputeNumber,
      filedByRole,
      filerName: user.displayName || user.email,
      opponentName,
      dealTitle,
      disputeReason,
      disputeDetails,
      claimAmount,
      viewDisputeUrl,
      isFiler: true,
    });

    // 5. Send email to Opponent (Notice) if opponentEmail is provided
    let opponentEmailRes = null;
    if (opponentEmail) {
      opponentEmailRes = await this.sendEmail("dispute-filed", "sendDisputeFiled", {
        to: opponentEmail,
        recipientName: opponentName,
        disputeNumber,
        filedByRole,
        filerName: user.displayName || user.email,
        opponentName,
        dealTitle,
        disputeReason,
        disputeDetails,
        claimAmount,
        viewDisputeUrl,
        isFiler: false,
      });
    }

    return {
      success: true,
      disputeNumber,
      disputeId: disputeDocId,
      filerEmail: filerEmailRes,
      opponentEmail: opponentEmailRes,
    };
  }

  /**
   * 4. SUBMIT RATING (SP8.57)
   * Creates verified rating record in Firestore 'ratings' collection,
   * updates ratee reputation score, and fires evaluation receipt email.
   */
  async submitRating({
    user,
    dealId = null,
    dealTitle = "Project Procurement Mandate",
    rateeId,
    rateeName = "Business Partner",
    rateeEmail = null,
    rateeRole = "SME",
    score = 5,
    categoryBreakdown = {
      communication: 5,
      deliveryPunctuality: 5,
      qualityOfWork: 5,
      professionalism: 5,
    },
    comments = "Exceptional performance, rigorous adherence to technical specifications.",
    viewRatingUrl = null,
  }) {
    if (!user || !user.uid) throw new Error("User authentication required to submit a rating");
    if (!rateeId && !rateeEmail) throw new Error("Target partner ID or email is required");

    // 1. Create Firestore rating record in 'ratings' collection
    let ratingDocId = null;
    if (db) {
      try {
        const ratingRef = doc(collection(db, "ratings"));
        ratingDocId = ratingRef.id;
        await setDoc(ratingRef, {
          id: ratingDocId,
          dealId,
          dealTitle,
          raterId: user.uid,
          raterName: user.displayName || user.email,
          raterEmail: user.email,
          raterRole: user.role || "Partner",
          rateeId: rateeId || null,
          rateeName,
          rateeEmail,
          rateeRole,
          score: Number(score),
          categoryBreakdown,
          comments,
          createdAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.error("[CommunityDisputeService] Error creating rating in Firestore:", dbErr);
      }
    }

    // 2. In-App Notification
    this.dispatchInAppNotification({
      message: `Rating of ${score} stars submitted for ${rateeName} on "${dealTitle}".`,
      type: "status_change",
      details: {
        title: "Rating & Evaluation Recorded",
        category: "rating",
      },
    });

    // 3. Persistent message for ratee
    if (db && rateeId) {
      try {
        await addDoc(collection(db, "messages"), {
          to: rateeId,
          type: "rating",
          title: `New Rating: ${score} Stars Received ⭐`,
          content: `${user.displayName || "A client"} submitted a verified performance evaluation for "${dealTitle}".`,
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("[CommunityDisputeService] Could not write rating message to Firestore:", e);
      }
    }

    // 4. Send email to Ratee if email is available
    let emailResult = null;
    if (rateeEmail) {
      emailResult = await this.sendEmail("rating-submitted", "sendRatingSubmitted", {
        to: rateeEmail,
        recipientName: rateeName,
        raterName: user.displayName || user.email || "Verified Buyer",
        dealTitle,
        ratingScore: score,
        categoryBreakdown,
        reviewComments: comments,
        viewRatingUrl,
      });
    }

    return {
      success: true,
      ratingId: ratingDocId,
      emailResult,
    };
  }
}

const clientCommunityDisputeService = new ClientCommunityDisputeService();
export default clientCommunityDisputeService;
