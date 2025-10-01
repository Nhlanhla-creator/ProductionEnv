require("dotenv").config()

const config = {
  entityId: process.env.PEACH_ENTITY_ID || "8ac7a4c89806ea2e01980a5ef7ed0470",
  clientId: process.env.PEACH_CLIENT_ID,
  clientSecret: process.env.PEACH_CLIENT_SECRET,
  merchantId: process.env.PEACH_MERCHANT_ID,
  recurringId: process.env.PEACH_RECURRING_ID,
  accessToken: process.env.PEACH_ACCESS_TOKEN || "OGFjN2E0Y2E5ODA2ZWEzNTAxOTgwYTVlYjVlZDAzNmZ8VHRLNkRRSmFLRTpMdCE9IWtoS0Q=",
  secretToken: process.env.PEACH_SECRET_TOKEN,
  
  // DYNAMIC allowlisted domain - uses environment variable
  allowlistedDomain: process.env.FRONTEND_URL || "http://localhost:3000",
  
  authenticationEndpoint: process.env.NODE_ENV === "production"
    ? "https://dashboard.peachpayments.com/api/oauth/token"
    : "https://sandbox-dashboard.peachpayments.com/api/oauth/token",
    
  checkoutEndpoint: process.env.NODE_ENV === "production" 
    ? "https://secure.peachpayments.com" 
    : "https://testsecure.peachpayments.com",
    
  checkoutJs: process.env.PEACH_CHECKOUT_JS || "https://checkout.peachpayments.com/js/checkout.js",
  
  // DYNAMIC URLs - uses environment variables
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL || "https://brown-ivory-website-h8srool38-big-league.vercel.app",
}

module.exports = config