import { v4 as uuidv4 } from "uuid"

/**
 * Creates a Peach Payments checkout session
 * Note: This will run on the client side in React
 */
export async function createPeachPaymentsCheckout(
  amount,
  currency,
  userId,
  planName,
  billingCycle,
  actionType,
  previousPlan,
  addOnName,
  addOnId,
  toolName,
  toolCategory,
  toolTier,
) {
  console.log("=== createPeachPaymentsCheckout called ===")
  console.log("Parameters:", { amount, currency, userId, planName, billingCycle, actionType })

  // Use REACT_APP_ prefixed environment variables
  const PEACH_PAYMENTS_BASE_URL = process.env.REACT_APP_PEACH_PAYMENTS_BASE_URL || "https://test.oppwa.com"
  const PEACH_PAYMENTS_ENTITY_ID = process.env.REACT_APP_PEACH_PAYMENTS_ENTITY_ID
  const PEACH_PAYMENTS_ACCESS_TOKEN = process.env.REACT_APP_PEACH_PAYMENTS_ACCESS_TOKEN
  const BASE_URL = process.env.REACT_APP_BASE_URL || window.location.origin

  console.log("Environment variables check:", {
    PEACH_PAYMENTS_BASE_URL,
    PEACH_PAYMENTS_ENTITY_ID: !!PEACH_PAYMENTS_ENTITY_ID,
    PEACH_PAYMENTS_ACCESS_TOKEN: !!PEACH_PAYMENTS_ACCESS_TOKEN,
    BASE_URL,
  })

  if (!PEACH_PAYMENTS_ENTITY_ID || !PEACH_PAYMENTS_ACCESS_TOKEN) {
    throw new Error("Peach Payments environment variables are not set. Check your .env file.")
  }

  const merchantTransactionId = `txn_${uuidv4()}`
  const body = new URLSearchParams()
  body.append("entityId", PEACH_PAYMENTS_ENTITY_ID)
  body.append("amount", amount.toFixed(2))
  body.append("currency", currency)
  body.append("paymentType", "DB")
  body.append("merchantTransactionId", merchantTransactionId)
  body.append(
    "shopperResultUrl",
    `${BASE_URL}/billing/subscriptions?status=success&transactionId=${merchantTransactionId}`,
  )
  body.append("cancelUrl", `${BASE_URL}/billing/subscriptions?status=cancelled&transactionId=${merchantTransactionId}`)
  body.append("notificationUrl", `${BASE_URL}/api/peachpayments-webhook`)
  body.append("customParameters[userId]", userId)
  body.append("customParameters[planName]", planName)
  body.append("customParameters[billingCycle]", billingCycle)
  body.append("customParameters[actionType]", actionType)

  if (previousPlan) body.append("customParameters[previousPlan]", previousPlan)
  if (addOnName) body.append("customParameters[addOnName]", addOnName)
  if (addOnId) body.append("customParameters[addOnId]", addOnId)
  if (toolName) body.append("customParameters[toolName]", toolName)
  if (toolCategory) body.append("customParameters[toolCategory]", toolCategory)
  if (toolTier) body.append("customParameters[toolTier]", toolTier)

  try {
    console.log("Making request to Peach Payments...")
    const response = await fetch(`${PEACH_PAYMENTS_BASE_URL}/v1/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PEACH_PAYMENTS_ACCESS_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Peach Payments error response:", errorText)
      throw new Error(`Failed to create Peach Payments checkout: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Peach Payments response data:", data)

    const redirectUrl = `${PEACH_PAYMENTS_BASE_URL}/v1/paymentWidgets.js?checkoutId=${data.id}`

    const result = { checkoutId: data.id, merchantTransactionId, redirectUrl }
    console.log("Returning result:", result)

    return result
  } catch (error) {
    console.error("Error creating Peach Payments checkout:", error)
    throw error
  }
}

/**
 * Verifies a Peach Payments transaction status
 * This can be used to double-check payment status from the client side
 */
export async function verifyPeachPaymentsTransaction(checkoutId) {
  const PEACH_PAYMENTS_BASE_URL = process.env.REACT_APP_PEACH_PAYMENTS_BASE_URL || "https://test.oppwa.com"
  const PEACH_PAYMENTS_ENTITY_ID = process.env.REACT_APP_PEACH_PAYMENTS_ENTITY_ID
  const PEACH_PAYMENTS_ACCESS_TOKEN = process.env.REACT_APP_PEACH_PAYMENTS_ACCESS_TOKEN

  if (!PEACH_PAYMENTS_ENTITY_ID || !PEACH_PAYMENTS_ACCESS_TOKEN) {
    throw new Error("Peach Payments environment variables are not set.")
  }

  try {
    const response = await fetch(
      `${PEACH_PAYMENTS_BASE_URL}/v1/checkouts/${checkoutId}/payment?entityId=${PEACH_PAYMENTS_ENTITY_ID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PEACH_PAYMENTS_ACCESS_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Peach Payments verification error:", errorText)
      throw new Error(`Failed to verify Peach Payments transaction: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error verifying Peach Payments transaction:", error)
    throw error
  }
}

/**
 * Creates a refund for a Peach Payments transaction
 * This can be used for handling refunds programmatically
 */
export async function createPeachPaymentsRefund(originalTransactionId, refundAmount, currency, reason) {
  const PEACH_PAYMENTS_BASE_URL = process.env.REACT_APP_PEACH_PAYMENTS_BASE_URL || "https://test.oppwa.com"
  const PEACH_PAYMENTS_ENTITY_ID = process.env.REACT_APP_PEACH_PAYMENTS_ENTITY_ID
  const PEACH_PAYMENTS_ACCESS_TOKEN = process.env.REACT_APP_PEACH_PAYMENTS_ACCESS_TOKEN

  if (!PEACH_PAYMENTS_ENTITY_ID || !PEACH_PAYMENTS_ACCESS_TOKEN) {
    throw new Error("Peach Payments environment variables are not set.")
  }

  const refundTransactionId = `refund_${uuidv4()}`
  const body = new URLSearchParams()
  body.append("entityId", PEACH_PAYMENTS_ENTITY_ID)
  body.append("amount", refundAmount.toFixed(2))
  body.append("currency", currency)
  body.append("paymentType", "RF") // 'RF' for Refund
  body.append("merchantTransactionId", refundTransactionId)
  if (reason) body.append("descriptor", reason)

  try {
    const response = await fetch(`${PEACH_PAYMENTS_BASE_URL}/v1/payments/${originalTransactionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PEACH_PAYMENTS_ACCESS_TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Peach Payments refund error:", errorText)
      throw new Error(`Failed to create Peach Payments refund: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return {
      refundId: data.id,
      refundTransactionId,
      status: data.result?.code,
      message: data.result?.description,
    }
  } catch (error) {
    console.error("Error creating Peach Payments refund:", error)
    throw error
  }
}

/**
 * Utility function to determine if a Peach Payments result code indicates success
 */
export function isPeachPaymentsSuccess(resultCode) {
  const successCodes = [
    "000.000.000", // Transaction succeeded
    "000.100.112", // Request successfully processed
    "000.100.110", // Request successfully processed
    "000.300.000", // Two-step transaction succeeded
  ]
  return successCodes.includes(resultCode)
}

/**
 * Utility function to determine if a Peach Payments result code indicates pending status
 */
export function isPeachPaymentsPending(resultCode) {
  const pendingCodes = [
    "000.200.000", // Transaction pending
    "800.400.500", // Transaction pending, waiting for external system response
    "900.100.300", // Transaction pending
  ]
  return pendingCodes.includes(resultCode)
}

/**
 * Utility function to get human-readable status from Peach Payments result code
 */
export function getPeachPaymentsStatus(resultCode) {
  if (isPeachPaymentsSuccess(resultCode)) {
    return "Success"
  } else if (isPeachPaymentsPending(resultCode)) {
    return "Pending"
  } else if (resultCode?.startsWith("100.400")) {
    return "Cancelled"
  } else {
    return "Failed"
  }
}
