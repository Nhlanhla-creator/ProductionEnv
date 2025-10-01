const nodemailer = require("nodemailer");
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

class EmailService {
  constructor() {
    // Color scheme
    this.colors = {
      primary: "#a67c52",
      dark: "#7d5a50",
      text: "#4a352f",
      background: "#faf7f2",
      pale: "#f0e6d9",
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
    };

    // Initialize
    this.fromEmail = process.env.GMAIL_USER || process.env.FROM_EMAIL;
    this.fromName = process.env.FROM_NAME || "BigMarketplace";
    this.transporter = null;
    this.emailCount = 0;
    this.lastEmailTime = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Validate environment variables
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error("Gmail credentials not configured");
      }

      console.log("🔧 Initializing email transporter...");

      // Create transporter with enhanced configuration
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false // Only for testing, remove in production
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log("✅ Email transporter ready");
    } catch (error) {
      console.error("❌ Failed to initialize email transporter:", error.message);
      throw error;
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      // Rate limiting (max 5 emails per minute)
      const now = Date.now();
      if (this.lastEmailTime && (now - this.lastEmailTime) < 12000 && this.emailCount >= 5) {
        throw new Error("Rate limit exceeded (5 emails per minute)");
      }

      // Validate inputs
      if (!to || !subject || !htmlContent) {
        throw new Error("Missing required email parameters");
      }

      // Prepare email
      const mailOptions = {
        from: {
          name: this.fromName,
          address: this.fromEmail,
        },
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
        headers: {
          "X-Priority": "1",
          "X-Mailer": "BigMarketplace",
        },
      };

      console.log(`📤 Sending email to ${to} with subject: ${subject}`);

      // Send email
      const info = await this.transporter.sendMail(mailOptions);

      // Update rate limiting counters
      this.emailCount++;
      this.lastEmailTime = now;

      console.log(`✅ Email sent to ${to}`, {
        messageId: info.messageId,
        response: info.response
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      
      // Specific error handling
      if (error.code === "EAUTH") {
        console.error("🔐 Authentication error - check your Gmail credentials");
      } else if (error.code === "EENVELOPE") {
        console.error("✉️ Address error - check recipient email");
      }

      return {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  }

  // Test email method
  async testEmail(recipient = "nhlanhlamsomi2024@gmail.com") {
    const subject = "BigMarketplace Email Test";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${this.colors.primary};">Email Service Test</h1>
        <p>This test email confirms your BigMarketplace email service is working.</p>
        <p><strong>Time sent:</strong> ${new Date().toString()}</p>
        <p><strong>From:</strong> ${this.fromName} &lt;${this.fromEmail}&gt;</p>
      </div>
    `;

    console.log(`🧪 Sending test email to ${recipient}...`);
    return this.sendEmail(recipient, subject, html);
  }

  // STEP 1 FIX: Send payment receipt email
  async sendPaymentReceipt(to, amount, currency, transactionId, toolName) {
    const subject = `Payment Confirmation - ${toolName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0;">Payment Successful! ✅</h1>
          <p style="color: ${this.colors.text}; font-size: 18px; margin: 10px 0;">Thank you for your purchase</p>
        </div>
        
        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 20px;">Purchase Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Tool:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">${toolName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Amount:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark}; font-size: 18px; font-weight: bold;">${currency} ${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Transaction ID:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark}; font-family: monospace;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Date:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: ${this.colors.success}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">🎉 You can now access your growth tool!</h3>
          <p style="margin: 0; opacity: 0.9;">Log into your dashboard to start using ${toolName}</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated email from BigMarketplace.<br>
            Transaction processed on ${new Date().toString()}<br>
            Keep this email for your records.
          </p>
        </div>
      </div>
    `;

    console.log(`📧 Sending payment receipt for ${toolName} (${currency} ${amount}) to ${to}`);
    return this.sendEmail(to, subject, html);
  }

  // STEP 1 FIX: Send subscription confirmation email
  async sendSubscriptionConfirmation(to, planName, billingCycle, amount, transactionId) {
    const subject = `Subscription Activated - ${planName}`;
    const nextBilling = billingCycle === 'monthly' ? '1 month' : '1 year';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${this.colors.primary}; margin: 0;">Subscription Activated! 🚀</h1>
          <p style="color: ${this.colors.text}; font-size: 18px; margin: 10px 0;">Welcome to ${planName}</p>
        </div>
        
        <div style="background: ${this.colors.background}; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${this.colors.primary};">
          <h2 style="color: ${this.colors.text}; margin-top: 0; margin-bottom: 20px;">Subscription Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Plan:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark}; font-weight: bold;">${planName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Billing:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">${billingCycle} (auto-renews every ${nextBilling})</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Amount:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark}; font-size: 18px; font-weight: bold;">ZAR ${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Transaction ID:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark}; font-family: monospace;">${transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: ${this.colors.text};">Start Date:</td>
              <td style="padding: 8px 0; color: ${this.colors.dark};">${new Date().toLocaleDateString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: ${this.colors.success}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">🎉 Your subscription is now active!</h3>
          <p style="margin: 0; opacity: 0.9;">You have full access to all premium features</p>
        </div>

        <div style="background: ${this.colors.pale}; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: ${this.colors.text}; margin-top: 0;">What's Next?</h4>
          <ul style="color: ${this.colors.dark}; margin: 0; padding-left: 20px;">
            <li>Access your dashboard to explore premium features</li>
            <li>Download exclusive tools and resources</li>
            <li>Join our premium community</li>
            <li>Get priority customer support</li>
          </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated email from BigMarketplace.<br>
            Subscription activated on ${new Date().toString()}<br>
            You can manage your subscription in your account dashboard.
          </p>
        </div>
      </div>
    `;

    console.log(`📧 Sending subscription confirmation for ${planName} (${billingCycle}) to ${to}`);
    return this.sendEmail(to, subject, html);
  }
}

// Singleton instance
module.exports = new EmailService();