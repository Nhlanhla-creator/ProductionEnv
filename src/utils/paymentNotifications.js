// utils/paymentNotifications.js
// Helper functions to notify backend about payment results

const API_URL = process.env.REACT_APP_API_URL || 'https://brown-ivory-website-h8srool38-big-league.vercel.app';

/**
 * Notify backend about successful payment
 * Call this from your PaymentResult component when payment is successful
 */
export const notifyPaymentSuccess = async (paymentData) => {
  try {
    console.log('📤 Notifying backend about payment success:', paymentData);
    
    const response = await fetch(`${API_URL}/api/payments/handle-payment-success`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Payment success notification sent:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to notify backend about payment success:', error);
    // Don't throw - this is a background notification
    return { success: false, error: error.message };
  }
};

/**
 * Notify backend about failed payment
 * Call this from your PaymentResult component when payment fails
 */
export const notifyPaymentFailure = async (failureData) => {
  try {
    console.log('📤 Notifying backend about payment failure:', failureData);
    
    const response = await fetch(`${API_URL}/api/payments/handle-payment-failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(failureData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Payment failure notification sent:', result);
    return result;

  } catch (error) {
    console.error('❌ Failed to notify backend about payment failure:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify a payment with the backend
 * Optional - only use if you want to double-check payment status
 */
export const verifyPaymentStatus = async (checkoutId) => {
  try {
    console.log('🔍 Verifying payment status with backend:', checkoutId);
    
    const response = await fetch(`${API_URL}/api/payments/verify-payment-status?checkoutId=${checkoutId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Payment verification result:', result);
    return result;

  } catch (error) {
    console.error('❌ Payment verification failed:', error);
    return { success: false, error: error.message };
  }
};