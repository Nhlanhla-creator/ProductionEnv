// Frontend PaymentService.js
// Save this as: src/services/PaymentService.js

class PaymentService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://brown-ivory-website-h8srool38-big-league.vercel.app';
    this.apiURL = `${this.baseURL}/api/payments`;
  }

  // Check user subscription status before showing payment options
  async checkUserStatus(userId) {
    try {
      console.log('👤 Checking user status for:', userId);

      const response = await fetch(`${this.apiURL}/user/${userId}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to get user status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ User status retrieved:', result);
      return result;

    } catch (error) {
      console.error('❌ Check user status error:', error);
      return {
        success: false,
        userStatus: {
          userId,
          hasActiveSubscription: false,
          subscription: null,
          savedPaymentMethods: [],
          canUpgrade: true,
          cardTokenized: false,
          currentPlan: 'Basic'
        }
      };
    }
  }

  // Create subscription payment (cards only, with tokenization)
  async createSubscriptionPayment(subscriptionData) {
    try {
      console.log('🔄 Creating subscription payment with data:', subscriptionData);

      // First check if user already has active subscription
      const userStatus = await this.checkUserStatus(subscriptionData.userId);
      
      if (userStatus.userStatus?.hasActiveSubscription) {
        console.log('⚠️ User already has active subscription:', userStatus.userStatus.subscription);
      }

      // Validate required fields
      const requiredFields = ['userId', 'planName', 'billingCycle', 'amount'];
      const missingFields = requiredFields.filter(field => !subscriptionData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Prepare the request payload
      const payload = {
        userId: subscriptionData.userId,
        planName: subscriptionData.planName,
        billingCycle: subscriptionData.billingCycle, // 'monthly' or 'annually'
        amount: parseFloat(subscriptionData.amount),
        currency: subscriptionData.currency || 'ZAR',
        customerEmail: subscriptionData.customerEmail || subscriptionData.email,
        customerName: subscriptionData.customerName || subscriptionData.name,
        actionType: userStatus.userStatus?.hasActiveSubscription ? 'upgrade' : 'subscription'
      };

      console.log('📤 Sending subscription request to:', `${this.apiURL}/create-subscription`);

      const response = await fetch(`${this.apiURL}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Subscription payment error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ Subscription payment session created:', result);

      if (!result.success || !result.checkoutId) {
        throw new Error(result.error || 'Invalid response from payment service');
      }

      return {
        success: true,
        checkoutId: result.checkoutId,
        entityId: result.entityId,
        merchantTransactionId: result.merchantTransactionId,
        checkoutEndpoint: result.checkoutEndpoint,
        redirectUrl: result.redirectUrl,
        orderId: result.orderId,
        paymentType: 'subscription',
        subscriptionType: result.subscriptionType,
        planName: result.planName,
        billingCycle: result.billingCycle,
        requiresCardRegistration: result.requiresCardRegistration,
        userHadActiveSubscription: userStatus.userStatus?.hasActiveSubscription
      };

    } catch (error) {
      console.error('❌ Create subscription payment error:', error);
      throw new Error(`Failed to create subscription payment session: ${error.message}`);
    }
  }

  // Create one-time payment (all payment methods available)
  async createOneTimePayment(paymentData) {
    try {
      console.log('💳 Creating one-time payment with data:', paymentData);

      if (!paymentData.userId) {
        throw new Error('User ID is required');
      }
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('Valid amount is required');
      }

      const payload = {
        userId: paymentData.userId,
        amount: parseFloat(paymentData.amount),
        currency: paymentData.currency || 'ZAR',
        customerEmail: paymentData.customerEmail || paymentData.email || 'customer@example.com',
        customerName: paymentData.customerName || paymentData.name || 'Customer User',
        planName: paymentData.planName || '',
        billingCycle: paymentData.billingCycle || '',
        actionType: paymentData.actionType || 'one_time',
        toolName: paymentData.toolName || '',
        toolCategory: paymentData.toolCategory || '',
        toolTier: paymentData.toolTier || '',
        orderId: paymentData.orderId || `order_${Date.now()}_${paymentData.userId.slice(0, 8)}`
      };

      console.log('📤 Sending one-time payment request to:', `${this.apiURL}/create-checkout`);

      const response = await fetch(`${this.apiURL}/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ One-time payment error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('✅ One-time payment session created:', result);

      if (!result.success || !result.checkoutId) {
        throw new Error(result.error || 'Invalid response from payment service');
      }

      return {
        success: true,
        checkoutId: result.checkoutId,
        entityId: result.entityId,
        merchantTransactionId: result.merchantTransactionId,
        checkoutEndpoint: result.checkoutEndpoint,
        redirectUrl: result.redirectUrl,
        orderId: result.orderId,
        paymentType: 'one_time'
      };

    } catch (error) {
      console.error('❌ Create one-time payment error:', error);
      throw new Error(`Failed to create payment session: ${error.message}`);
    }
  }

  // Verify card tokenization after subscription payment
  async verifyCardTokenization(checkoutId) {
    try {
      console.log('🔍 Verifying card tokenization for checkout:', checkoutId);

      const response = await fetch(`${this.apiURL}/verify-tokenization/${checkoutId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.warn('⚠️ Could not verify tokenization:', response.status);
        return { success: false, tokenized: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      console.log('✅ Card tokenization verified:', result);
      return result;

    } catch (error) {
      console.error('❌ Verify tokenization error:', error);
      return { success: false, tokenized: false, error: error.message };
    }
  }

  // Get user's dashboard data
  async getUserDashboardData(userId) {
    try {
      console.log('📊 Getting dashboard data for user:', userId);

      const response = await fetch(`${this.apiURL}/dashboard/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to get dashboard data: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Dashboard data retrieved:', result);
      return result;

    } catch (error) {
      console.error('❌ Get dashboard data error:', error);
      return { success: false, dashboard: null, error: error.message };
    }
  }

  // Send subscription completion notification (triggers email)
  async notifySubscriptionComplete(checkoutId, userId) {
    try {
      console.log('📧 Notifying subscription completion:', { checkoutId, userId });

      const response = await fetch(`${this.apiURL}/subscription-completed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ checkoutId, userId })
      });

      if (!response.ok) {
        console.warn('⚠️ Could not notify completion:', response.status);
        return { success: false, error: `HTTP ${response.status}` };
      }

      const result = await response.json();
      console.log('✅ Subscription completion notified:', result);
      return result;

    } catch (error) {
      console.error('❌ Notify completion error:', error);
      return { success: false, error: error.message };
    }
  }

  // Test connection to backend
  async testConnection() {
    try {
      console.log('🔍 Testing connection to backend:', this.baseURL);
      
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Backend not reachable: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Backend connection test successful:', result);
      return result;

    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      throw new Error(`Cannot connect to backend at ${this.baseURL}: ${error.message}`);
    }
  }
}

// Export singleton instance
const paymentService = new PaymentService();
export default paymentService;