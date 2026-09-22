const express = require('express');
const router = express.Router();
const emailService = require('../services/EmailService');
const billingNotificationService = require('../services/billingNotificationService');

/**
 * Generic send-email endpoint
 */
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    console.log('Email request received:', { to: to ? '***' : 'MISSING', subject });
    const result = await emailService.sendEmail(to, subject, html);
    res.json(result);
  } catch (error) {
    console.error('Email failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 1. Subscription Started Email
 * POST /api/email/subscription-started
 */
router.post('/subscription-started', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendSubscriptionStartedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Subscription started email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. Payment Failed Email
 * POST /api/email/payment-failed
 */
router.post('/payment-failed', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendPaymentFailedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Payment failed email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. Subscription Cancelled Email
 * POST /api/email/subscription-cancelled
 */
router.post('/subscription-cancelled', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendSubscriptionCancelledEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Subscription cancelled email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. Tax Invoice Email
 * POST /api/email/send-invoice
 */
router.post('/send-invoice', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendInvoiceEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Send invoice email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. Subscription Renewal Reminder Email (SP8.47)
 * POST /api/email/renewal-reminder
 */
router.post('/renewal-reminder', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendSubscriptionRenewalReminderEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Renewal reminder email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6. Pricing Plan Upgrade Confirmation Email (SP8.51)
 * POST /api/email/plan-upgrade
 */
router.post('/plan-upgrade', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendPlanUpgradeConfirmationEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Plan upgrade confirmation email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. Refund Issued Email (SP8.48)
 * POST /api/email/refund-issued
 */
router.post('/refund-issued', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendRefundIssuedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Refund issued email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 8. Success Fee Triggered / Invoiced Email (SP8.49)
 * POST /api/email/success-fee-triggered
 */
router.post('/success-fee-triggered', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendSuccessFeeTriggeredEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Success fee invoice email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 9. Success Fee Receipt Email (SP8.50)
 * POST /api/email/success-fee-receipt
 */
router.post('/success-fee-receipt', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await billingNotificationService.sendSuccessFeeReceiptEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Success fee receipt email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const onboardingVettingService = require('../services/onboardingVettingService');

/**
 * 10. SME Profile Approved – Marketplace Activated (SP8.17)
 * POST /api/email/profile-approved
 */
router.post('/profile-approved', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await onboardingVettingService.sendProfileApprovedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Profile approved email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 11. SME Profile Rejected – Next Steps + How to Fix (SP8.18)
 * POST /api/email/profile-rejected
 */
router.post('/profile-rejected', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await onboardingVettingService.sendProfileRejectedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Profile rejected email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 12. Vetting Status Update (SP8.24)
 * POST /api/email/vetting-status
 */
router.post('/vetting-status', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await onboardingVettingService.sendVettingStatusUpdateEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Vetting status update email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 13. Evidence/Proof Requested (SP8.25)
 * POST /api/email/evidence-requested
 */
router.post('/evidence-requested', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await onboardingVettingService.sendEvidenceRequestedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Evidence requested email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 14. Vetting Rejection – Detailed Reason + Reapplication Date (SP8.30)
 * POST /api/email/vetting-rejected
 */
router.post('/vetting-rejected', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await onboardingVettingService.sendVettingRejectionEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Vetting rejection email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const verificationNudgeService = require('../services/verificationNudgeService');

/**
 * 15. BIG Score Verified Badge Issued (SP8.29)
 * POST /api/email/verified-badge-issued
 */
router.post('/verified-badge-issued', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await verificationNudgeService.sendVerifiedBadgeIssuedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Verified badge email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 16. SME Application Draft Saved – Nudge to Submit (SP8.20)
 * POST /api/email/application-draft-nudge
 */
router.post('/application-draft-nudge', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await verificationNudgeService.sendApplicationDraftSavedNudgeEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Draft nudge email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 17. Document Expiry Warning (30d / 7d / expired) (SP8.41)
 * POST /api/email/document-expiry-warning
 */
router.post('/document-expiry-warning', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await verificationNudgeService.sendDocumentExpiryWarningEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Document expiry warning email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const communityDisputeService = require('../services/communityDisputeService');

/**
 * 18. Monthly Product Updates / What’s New (SP8.13)
 * POST /api/email/monthly-product-update
 */
router.post('/monthly-product-update', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await communityDisputeService.sendMonthlyProductUpdateEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Monthly product update email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 19. Community Flag / Report Actioned (SP8.58)
 * POST /api/email/community-report-actioned
 */
router.post('/community-report-actioned', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await communityDisputeService.sendCommunityReportActionedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Community report actioned email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 20. Dispute Filed (SP8.57)
 * POST /api/email/dispute-filed
 */
router.post('/dispute-filed', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await communityDisputeService.sendDisputeFiledEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Dispute filed email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 21. Rating Submitted (SP8.57)
 * POST /api/email/rating-submitted
 */
router.post('/rating-submitted', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.to) {
      return res.status(400).json({ success: false, error: 'Recipient email (to) is required' });
    }
    const result = await communityDisputeService.sendRatingSubmittedEmail(payload);
    res.json(result);
  } catch (error) {
    console.error('Rating submitted email failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

