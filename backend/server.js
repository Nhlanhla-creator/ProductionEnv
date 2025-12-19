const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cron = require("node-cron");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Vercel Authentication Bypass Middleware - MUST BE FIRST
app.use((req, res, next) => {
  // Bypass Vercel authentication for all API routes
  if (req.path.startsWith('/api')) {
    res.setHeader('x-vercel-protection-bypass', '1');
  }
  next();
});

// Import your routes
const paymentRoutes = require("./routes/peachPayments");
const tenderRoutes = require("./routes/tenders");

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    headers: {
      origin: req.headers.origin,
      "user-agent": req.headers["user-agent"]?.substring(0, 50),
      "content-type": req.headers["content-type"],
    },
    body: req.method === "POST" ? req.body : undefined,
  });
  next();
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://127.0.0.1:3000",
      "https://www.bigmarketplace.africa",
      "https://bigmarketplace.africa",
      process.env.FRONTEND_URL,
      "https://testsecure.peachpayments.com",
      "https://checkout.peachpayments.com",
      "https://sandbox-dashboard.peachpayments.com",
    ].filter(Boolean);

    const isNgrokDomain = origin.includes("ngrok-free.app") || origin.includes("ngrok.io");
    const isPeachDomain = origin.includes("peachpayments.com");

    if (allowedOrigins.includes(origin) || isNgrokDomain || isPeachDomain) {
      console.log("✅ CORS allowed for origin:", origin);
      return callback(null, true);
    }

    console.log("❌ CORS blocked for origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "ngrok-skip-browser-warning",
    "X-Requested-With",
    "Accept",
    "Origin",
    "X-Peach-Signature",
    "x-vercel-protection-bypass"
  ],
};

app.use(cors(corsOptions));

// Add ngrok-specific middleware
app.use((req, res, next) => {
  res.header("ngrok-skip-browser-warning", "true");
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// ==================== MOUNT ROUTES ====================

// Payment routes with bypass header
app.use("/api/payments", (req, res, next) => {
  res.setHeader('x-vercel-protection-bypass', '1');
  next();
}, paymentRoutes);

// Tender routes with bypass header
app.use("/api/tenders", (req, res, next) => {
  res.setHeader('x-vercel-protection-bypass', '1');
  next();
}, tenderRoutes.router);

// ==================== EXISTING ROUTES ====================

// Email confirmation endpoint
app.post('/api/payments/send-confirmation-email', async (req, res) => {
  try {
    console.log('📧 Email confirmation request received:', req.body);
    
    const { checkoutId, merchantTxnId, userId, type, amount, currency, toolName, planName, cycle } = req.body;
    
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount required' });
    }
    
    const EmailService = require('./services/EmailService');
    const emailAddress = "nhlanhlamsomi2024@gmail.com";
    const finalAmount = Number.parseFloat(amount) || 0;
    const finalTransactionId = merchantTxnId || checkoutId || `EMAIL-${Date.now()}`;

    let emailResult;
    if (type === 'subscription' || planName) {
      emailResult = await EmailService.sendSubscriptionConfirmation(
        emailAddress,
        planName || "Premium Plan",
        cycle || "monthly",
        finalAmount,
        finalTransactionId
      );
    } else {
      emailResult = await EmailService.sendPaymentReceipt(
        emailAddress,
        finalAmount,
        currency || "ZAR",
        finalTransactionId,
        toolName || "Growth Tool"
      );
    }
    
    res.json({
      success: true,
      emailSent: !!emailResult?.success,
      messageId: emailResult?.messageId,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoints
app.get("/test-email", async (req, res) => {
  try {
    const EmailService = require("./services/EmailService");
    const result = await EmailService.testEmail();
    res.json({
      success: result.success,
      messageId: result.messageId,
      message: "Test email sent"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  const tenderCache = tenderRoutes.getTenderCache();
  
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      peachPayments: !!process.env.PEACH_ENTITY_ID,
      email: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      tenderScraping: !!tenderCache.data
    },
    tenders: {
      cached: tenderCache.data ? tenderCache.data.length : 0,
      lastScraped: tenderCache.lastScraped
    }
  });
});

// ==================== SCHEDULED SCRAPING ====================

// Schedule automatic scraping every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Running scheduled tender scraping...');
  await tenderRoutes.refreshTenderCache();
});

// Initialize cache on server start
async function initializeServer() {
  console.log('🚀 Initializing BIG BIDS Tender Engine...');
  
  // Initial cache load
  await tenderRoutes.refreshTenderCache();
  
  const tenderCache = tenderRoutes.getTenderCache();
  console.log('✅ Tender engine ready!');
  console.log(`📊 Loaded ${tenderCache.data?.length || 0} tenders`);
}

// ==================== ERROR HANDLING ====================

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", error);
  res.status(500).json({
    success: false,
    error: error.message
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// ==================== START SERVER ====================

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Vercel auth bypass enabled for /api routes`);
  console.log(`🌐 CORS configured for frontend: ${process.env.FRONTEND_URL}`);
  console.log(`💳 Peach Payments configured: ${!!process.env.PEACH_ENTITY_ID}`);
  console.log(`🔍 Tender scraping initialized`);
  
  // Initialize tender cache
  await initializeServer();
});

module.exports = app;