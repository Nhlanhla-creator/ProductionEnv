require('dotenv').config();
const EmailService = require('./services/EmailService');

(async () => {
  try {
    const result = await EmailService.sendSubscriptionConfirmation(
      'nhlanhlamsomi2024@gmail.com',
      'Premium Plan',
      'monthly',
      299.99
    );
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
})();