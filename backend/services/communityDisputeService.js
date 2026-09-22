/**
 * communityDisputeService.js
 * 
 * Centralized email notification service for Community Moderation, Disputes, Ratings, and Monthly Updates.
 * Covers Sprint 8 tasks:
 * - SP8.13: Monthly Product Updates / What’s New
 * - SP8.58: Community Flag / Report Actioned (moderation update)
 * - SP8.57: Dispute Filed & Rating Submitted
 * 
 * Replicates the canonical BigMarketplace HTML/CSS email design system from EmailService.js.
 * Pure functions prepped for Firebase Cloud Functions.
 */

const emailService = require("./EmailService");

class CommunityDisputeService {
  constructor() {
    this.colors = {
      primary: "#a67c52",
      dark: "#7d5a50",
      text: "#4a352f",
      background: "#faf7f2",
      pale: "#f0e6d9",
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#0284c7",
      gold: "#d97706",
      lightGray: "#e5e7eb",
    };

    this.defaultDashboardUrl = process.env.FRONTEND_URL || "https://bigmarketplace.africa";
  }

  /**
   * Standard BigMarketplace email footer
   */
  getFooter(actionNote = "Keep this notification for your business records.") {
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
        <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.6;">
          This is an automated message from BigMarketplace.<br>
          ${actionNote}<br>
          Questions? Contact our team at <a href="mailto:support@bigmarketplace.africa" style="color: ${this.colors.primary}; text-decoration: none;">support@bigmarketplace.africa</a>
        </p>
      </div>
    `;
  }

  /**
   * 1. MONTHLY PRODUCT UPDATES / WHAT'S NEW (SP8.13)
   */
  async sendMonthlyProductUpdateEmail({
    to,
    recipientName = "Valued Member",
    updateMonth = "June 2026",
    headline = "New features, enhanced vetting speeds, and improved investor matching",
    highlights = [],
    newFeaturesUrl = null,
    changelogUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const defaultHighlights = [
      {
        icon: "⚡",
        title: "Automated Compliance Auditing",
        desc: "Instant preliminary scoring and automated document validity verifications are now live."
      },
      {
        icon: "🎯",
        title: "Smart Deal Matching 2.0",
        desc: "Enhanced thematic filters matching institutional capital mandates directly to verified SMEs."
      },
      {
        icon: "📊",
        title: "Interactive Financial Health Analytics",
        desc: "New real-time forecasting and cashflow stress-test metrics across company profiles."
      },
      {
        icon: "🔒",
        title: "Granular Role-Based Document Sharing",
        desc: "Fine-grained permissions for catalysts, advisors, and corporate procurement teams."
      }
    ];

    const featureItems = (highlights && highlights.length > 0) ? highlights : defaultHighlights;
    const targetUrl = newFeaturesUrl || `${this.defaultDashboardUrl}/dashboard`;
    const changelogLink = changelogUrl || `${this.defaultDashboardUrl}/changelog`;

    const highlightsHtml = featureItems.map(item => `
      <div style="background-color: #ffffff; border: 1px solid ${this.colors.pale}; border-left: 4px solid ${this.colors.primary}; border-radius: 6px; padding: 14px 18px; margin-bottom: 12px;">
        <div style="font-weight: 700; color: ${this.colors.dark}; font-size: 15px; margin-bottom: 4px;">
          <span style="font-size: 18px; margin-right: 6px;">${item.icon || "✨"}</span> ${item.title}
        </div>
        <p style="color: #555; margin: 0; font-size: 13.5px; line-height: 1.5;">${item.desc}</p>
      </div>
    `).join("");

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
          Product Updates & Innovations
        </span>
        <h2 style="color: ${this.colors.dark}; margin: 12px 0 6px 0; font-size: 24px;">What's New in BigMarketplace</h2>
        <p style="color: #666; margin: 0; font-size: 15px; font-weight: 500;">Edition: ${updateMonth}</p>
      </div>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        Dear <strong>${recipientName}</strong>,
      </p>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        We have been continuously refining the BigMarketplace ecosystem to empower high-growth enterprises, investors, and ecosystem partners. Here is a summary of what's newly released this month:
      </p>

      <div style="background-color: ${this.colors.pale}; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-style: italic; color: ${this.colors.text}; border-left: 4px solid ${this.colors.primary};">
        "${headline}"
      </div>

      <div style="margin: 24px 0;">
        ${highlightsHtml}
      </div>

      <div style="text-align: center; margin: 30px 0 15px 0;">
        <a href="${targetUrl}" style="background-color: ${this.colors.primary}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          Explore New Features Now →
        </a>
      </div>

      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${changelogLink}" style="color: ${this.colors.dark}; font-size: 13px; text-decoration: underline; font-weight: 500;">
          View Full Platform Changelog & Release Notes
        </a>
      </div>

      ${this.getFooter("Thank you for building the future of African commerce with BigMarketplace.")}
    `;

    return await emailService.sendEmail(
      to,
      `What's New in BigMarketplace (${updateMonth}) 🚀`,
      content
    );
  }

  /**
   * 2. COMMUNITY FLAG / REPORT ACTIONED (SP8.58)
   */
  async sendCommunityReportActionedEmail({
    to,
    recipientName = "Community Member",
    reportId = "REP-" + Date.now().toString().slice(-6),
    itemType = "listing", // 'listing' | 'comment' | 'post' | 'user' | 'message'
    itemTitle = "Marketplace Listing",
    actionTaken = "content_removed", // 'content_removed' | 'user_warned' | 'account_suspended' | 'report_dismissed'
    resolutionNotes = "Our moderation team reviewed the reported material and determined it violated our community guidelines on accuracy and professional conduct.",
    appealsUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const actionConfig = {
      content_removed: {
        badgeColor: "#fee2e2",
        textColor: "#991b1b",
        borderColor: "#ef4444",
        label: "Content Removed",
        icon: "🛡️",
        headline: "Report Actioned: Content Removed"
      },
      user_warned: {
        badgeColor: "#fef3c7",
        textColor: "#92400e",
        borderColor: "#f59e0b",
        label: "Official Warning Issued",
        icon: "⚠️",
        headline: "Report Actioned: Guidelines Warning Issued"
      },
      account_suspended: {
        badgeColor: "#fee2e2",
        textColor: "#991b1b",
        borderColor: "#b91c1c",
        label: "Account Suspended",
        icon: "⛔",
        headline: "Report Actioned: Account Suspended"
      },
      report_dismissed: {
        badgeColor: "#ecfdf5",
        textColor: "#065f46",
        borderColor: "#10b981",
        label: "Report Reviewed & Dismissed",
        icon: "✅",
        headline: "Report Review Completed"
      }
    };

    const cfg = actionConfig[actionTaken] || actionConfig.content_removed;
    const appealLink = appealsUrl || `${this.defaultDashboardUrl}/contact?type=appeal&ref=${reportId}`;

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 32px;">${cfg.icon}</span>
        <h2 style="color: ${this.colors.dark}; margin: 8px 0 4px 0; font-size: 22px;">${cfg.headline}</h2>
        <div style="display: inline-block; background-color: ${cfg.badgeColor}; color: ${cfg.textColor}; border: 1px solid ${cfg.borderColor}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
          ${cfg.label}
        </div>
      </div>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        Dear <strong>${recipientName}</strong>,
      </p>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        This is an official moderation update regarding community report reference <strong>#${reportId}</strong> involving <strong>${itemTitle}</strong> (${itemType}).
      </p>

      <div style="background-color: ${this.colors.background}; border: 1.5px solid ${this.colors.pale}; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 140px;">Report Reference:</td>
            <td style="padding: 6px 0; color: ${this.colors.dark}; font-weight: bold;">#${reportId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Reported Item:</td>
            <td style="padding: 6px 0; color: ${this.colors.text}; font-weight: 600;">${itemTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Action Taken:</td>
            <td style="padding: 6px 0; color: ${cfg.textColor}; font-weight: 700;">${cfg.label}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; vertical-align: top;">Moderation Notes:</td>
            <td style="padding: 6px 0; color: ${this.colors.text}; line-height: 1.4;">${resolutionNotes}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13.5px; color: #92400e; line-height: 1.5;">
        <strong>Platform Integrity Standards:</strong> BigMarketplace enforces rigorous community trust, anti-fraud, and professional discourse standards to protect all participants in commercial matching and deal flow.
      </div>

      <div style="text-align: center; margin: 25px 0 10px 0;">
        <a href="${appealLink}" style="background-color: ${this.colors.dark}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
          View Moderation Case & Appeals →
        </a>
      </div>

      ${this.getFooter("Our trust & safety team reviews every dispute and report impartially.")}
    `;

    return await emailService.sendEmail(
      to,
      `Moderation Update: Report #${reportId} Actioned (${cfg.label}) 🛡️`,
      content
    );
  }

  /**
   * 3. DISPUTE FILED (SP8.57)
   */
  async sendDisputeFiledEmail({
    to,
    recipientName = "Valued Partner",
    disputeNumber = "DSP-" + Date.now().toString().slice(-6),
    filedByRole = "SME", // 'SME' | 'Investor' | 'Corporate' | 'Advisor'
    filerName = "Filer Party",
    opponentName = "Counterparty",
    dealTitle = "Commercial Agreement / Funding Mandate",
    disputeReason = "Non-performance of milestones / Payment settlement dispute",
    disputeDetails = "A formal dispute has been submitted regarding deliverables agreed upon in the commercial agreement.",
    claimAmount = null,
    viewDisputeUrl = null,
    isFiler = false,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const disputeUrl = viewDisputeUrl || `${this.defaultDashboardUrl}/disputes/${disputeNumber}`;

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 32px;">⚖️</span>
        <h2 style="color: ${this.colors.dark}; margin: 8px 0 4px 0; font-size: 22px;">
          ${isFiler ? "Dispute Successfully Logged" : "Formal Dispute Notice Filed"}
        </h2>
        <div style="display: inline-block; background-color: #fee2e2; color: #991b1b; border: 1px solid #ef4444; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
          Case Status: Open & Under Mediation Review
        </div>
      </div>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        Dear <strong>${recipientName}</strong>,
      </p>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        ${isFiler 
          ? `Your formal dispute <strong>#${disputeNumber}</strong> has been successfully registered on BigMarketplace and assigned to our dispute mediation team.`
          : `A formal commercial dispute <strong>#${disputeNumber}</strong> has been lodged by <strong>${filerName}</strong> regarding your commercial engagement.`
        }
      </p>

      <div style="background-color: ${this.colors.background}; border: 1.5px solid ${this.colors.pale}; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 140px;">Dispute ID:</td>
            <td style="padding: 6px 0; color: ${this.colors.dark}; font-weight: bold;">#${disputeNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Associated Deal:</td>
            <td style="padding: 6px 0; color: ${this.colors.text}; font-weight: 600;">${dealTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Initiated By:</td>
            <td style="padding: 6px 0; color: ${this.colors.text}; font-weight: 600;">${filerName} (${filedByRole})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Counterparty:</td>
            <td style="padding: 6px 0; color: ${this.colors.text}; font-weight: 600;">${opponentName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Primary Reason:</td>
            <td style="padding: 6px 0; color: #b91c1c; font-weight: 600;">${disputeReason}</td>
          </tr>
          ${claimAmount ? `
          <tr>
            <td style="padding: 6px 0; color: #666;">Claim Amount:</td>
            <td style="padding: 6px 0; color: ${this.colors.dark}; font-weight: bold; font-size: 15px;">R ${Number(claimAmount).toLocaleString()}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 6px 0; color: #666; vertical-align: top;">Dispute Particulars:</td>
            <td style="padding: 6px 0; color: ${this.colors.text}; line-height: 1.5;">${disputeDetails}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13.5px; color: #1e40af; line-height: 1.5;">
        <strong>Dispute Resolution Process:</strong><br>
        1. Both parties have <strong>5 business days</strong> to provide supporting evidence and counter-statements.<br>
        2. Platform settlement escrow holds will remain active until resolved.<br>
        3. A BigMarketplace legal mediator will review and initiate an arbitration session if required.
      </div>

      <div style="text-align: center; margin: 30px 0 15px 0;">
        <a href="${disputeUrl}" style="background-color: #b91c1c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
          Open Dispute Case File →
        </a>
      </div>

      ${this.getFooter("Official legal & commercial mediation correspondence.")}
    `;

    return await emailService.sendEmail(
      to,
      `Notice: Formal Dispute Lodged #${disputeNumber} — ${dealTitle} ⚖️`,
      content
    );
  }

  /**
   * 4. RATING SUBMITTED (SP8.57)
   */
  async sendRatingSubmittedEmail({
    to,
    recipientName = "Valued Business Partner",
    raterName = "Corporate Buyer",
    dealTitle = "Project Procurement Mandate",
    ratingScore = 5,
    categoryBreakdown = {
      communication: 5,
      deliveryPunctuality: 5,
      qualityOfWork: 5,
      professionalism: 5
    },
    reviewComments = "Exceptional performance, rigorous adherence to technical specifications, and outstanding project communication.",
    viewRatingUrl = null,
  }) {
    if (!to) throw new Error("Recipient email (to) is required");

    const targetUrl = viewRatingUrl || `${this.defaultDashboardUrl}/profile`;
    const stars = "★".repeat(Math.round(ratingScore)) + "☆".repeat(Math.max(0, 5 - Math.round(ratingScore)));

    const categoriesHtml = Object.entries(categoryBreakdown).map(([key, val]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `
        <tr>
          <td style="padding: 4px 0; color: #555; font-size: 13px;">${formattedKey}</td>
          <td style="padding: 4px 0; text-align: right; color: ${this.colors.gold}; font-weight: bold; font-size: 13px;">
            ${"★".repeat(val)} (${val}/5)
          </td>
        </tr>
      `;
    }).join("");

    const content = `
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 32px;">🌟</span>
        <h2 style="color: ${this.colors.dark}; margin: 8px 0 4px 0; font-size: 22px;">New Commercial Rating & Review</h2>
        <div style="font-size: 26px; color: ${this.colors.gold}; margin: 8px 0; letter-spacing: 2px;">
          ${stars} <span style="font-size: 18px; color: ${this.colors.dark}; font-weight: bold;">(${ratingScore}.0/5.0)</span>
        </div>
      </div>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        Dear <strong>${recipientName}</strong>,
      </p>

      <p style="color: ${this.colors.text}; font-size: 15px; line-height: 1.6;">
        <strong>${raterName}</strong> has completed a post-deal evaluation and submitted a verified rating for your performance on <strong>"${dealTitle}"</strong>.
      </p>

      <div style="background-color: ${this.colors.background}; border: 1.5px solid ${this.colors.pale}; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="font-weight: 700; color: ${this.colors.dark}; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid ${this.colors.pale}; padding-bottom: 6px;">
          Performance Evaluation Breakdown
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${categoriesHtml}
        </table>

        ${reviewComments ? `
        <div style="margin-top: 15px; padding-top: 12px; border-top: 1px solid ${this.colors.pale};">
          <span style="font-size: 12px; color: #777; text-transform: uppercase; font-weight: bold;">Client Feedback:</span>
          <p style="margin: 6px 0 0 0; color: ${this.colors.text}; font-style: italic; font-size: 14px; line-height: 1.5;">
            "${reviewComments}"
          </p>
        </div>` : ""}
      </div>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 14px 16px; margin: 20px 0; font-size: 13.5px; color: #065f46; line-height: 1.5;">
        <strong>Trust & Credibility Impact:</strong> Verified commercial ratings feed directly into your BigMarketplace reputation score, boosting your visibility on buyer shortlists and funder discovery matrices.
      </div>

      <div style="text-align: center; margin: 30px 0 15px 0;">
        <a href="${targetUrl}" style="background-color: ${this.colors.primary}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block;">
          View Public Profile & Ratings →
        </a>
      </div>

      ${this.getFooter("Verified ratings build transparent market relationships.")}
    `;

    return await emailService.sendEmail(
      to,
      `New Rating Received: ${ratingScore} Stars from ${raterName} on ${dealTitle} ⭐`,
      content
    );
  }
}

module.exports = new CommunityDisputeService();
