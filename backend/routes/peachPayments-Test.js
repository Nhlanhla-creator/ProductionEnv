
const express = require("express")
const router = express.Router()

// Simple test route that doesn't require Firebase
router.get("/payment/result", async (req, res) => {
  try {
    console.log("🔍 CRITICAL: Payment result GET request received:", {
      query: req.query,
      timestamp: new Date().toISOString(),
    })

    const {
      checkoutId,
      merchantTxnId,
      status = "success",
      amount,
      currency = "ZAR",
      type,
      planName,
      cycle,
      toolName,
      userId,
      transactionId,
    } = req.query

    console.log("📊 Payment result data:", {
      checkoutId,
      merchantTxnId,
      status,
      amount,
      currency,
      type,
      planName,
      cycle,
      toolName,
      userId,
      transactionId,
    })

    // Create HTML response
    const htmlResponse = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment ${status === "success" ? "Successful" : "Result"}</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: ${
              status === "success"
                ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                : "linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%)"
            };
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 90%;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: ${status === "success" ? "#059669" : "#dc2626"};
        }
        .message {
            color: #6b7280;
            margin-bottom: 2rem;
            line-height: 1.5;
        }
        .debug-info {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(0,0,0,0.05);
            border-radius: 8px;
            font-size: 12px;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            ${status === "success" ? "✅" : "❌"}
        </div>
        
        <h1 class="title">
            ${status === "success" ? "Payment Successful!" : "Payment Status"}
        </h1>
        
        <p class="message">
            ${
              status === "success"
                ? "TEST MODE: Payment result page working correctly!"
                : "Processing payment result..."
            }
        </p>
        
        <div class="debug-info">
            <h4>Debug Info:</h4>
            <p>Status: ${status}</p>
            <p>Checkout ID: ${checkoutId || "Not provided"}</p>
            <p>Amount: ${amount || "Not provided"}</p>
            <p>Type: ${type || "Not provided"}</p>
            <p>Plan Name: ${planName || "Not provided"}</p>
            <p>Tool Name: ${toolName || "Not provided"}</p>
            <p>Transaction ID: ${transactionId || merchantTxnId || "Not provided"}</p>
            <p>Mode: TEST (Firebase disabled)</p>
        </div>
    </div>

    <script>
        console.log('🔍 Payment result page loaded (TEST MODE)');
        console.log('🔍 Query parameters:', ${JSON.stringify(req.query)});

        const paymentData = {
            type: 'payment_completed',
            status: '${status}',
            checkoutId: '${checkoutId || merchantTxnId || ""}',
            merchantTxnId: '${merchantTxnId || checkoutId || ""}',
            transactionId: '${transactionId || merchantTxnId || checkoutId || ""}',
            userId: '${userId || "user-" + Date.now()}',
            paymentType: '${type || "payment"}',
            amount: ${amount ? Number.parseFloat(amount) : 0},
            currency: '${currency}',
            planName: '${planName || ""}',
            cycle: '${cycle || ""}',
            toolName: '${toolName || ""}',
            timestamp: new Date().toISOString(),
            testMode: true
        };

        console.log('📤 Sending payment data to parent:', paymentData);

        if ('${status}' === 'success') {
            function sendMessage() {
                if (window.opener) {
                    window.opener.postMessage(paymentData, '*');
                    console.log('✅ Message sent to opener window');
                }

                if (window.parent && window.parent !== window) {
                    window.parent.postMessage(paymentData, '*');
                    console.log('✅ Message sent to parent window');
                }
            }

            sendMessage();
            setTimeout(sendMessage, 1000);
            setTimeout(sendMessage, 3000);

            setTimeout(() => {
                if (window.opener) {
                    console.log('🔄 Closing popup window');
                    window.close();
                }
            }, 5000);
        }
    </script>
</body>
</html>
    `

    res.setHeader("Content-Type", "text/html")
    res.send(htmlResponse)
  } catch (error) {
    console.error("❌ CRITICAL: Payment result error:", error)
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Payment Error</title>
    <style>
        body { font-family: system-ui; text-align: center; padding: 2rem; }
        .error { color: #dc2626; }
    </style>
</head>
<body>
    <h1 class="error">Payment Processing Error</h1>
    <p>There was an error processing your payment result.</p>
    <p>Error: ${error.message}</p>
</body>
</html>
    `)
  }
})

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "peach-payments-test",
    timestamp: new Date().toISOString(),
    mode: "test",
    firebase: "disabled"
  })
})

module.exports = router
