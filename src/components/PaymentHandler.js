// In your frontend: src/pages/PaymentResult.js or similar
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Extract payment info from URL parameters
    const checkoutId = searchParams.get('checkoutId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    
    if (checkoutId) {
      // Make API call to your localhost backend to process the result
      fetch('https://brown-ivory-website-h8srool38-big-league.vercel.app/api/payments/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutId, userId, type })
      })
      .then(res => res.json())
      .then(data => {
        console.log('Payment processed:', data);
        // Redirect to success page or show message
        if (data.status === 'success') {
          window.location.href = '/subscription-success';
        } else {
          window.location.href = '/subscription-failed';
        }
      })
      .catch(err => console.error('Payment processing error:', err));
    }
  }, [searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Processing your payment...</h2>
      <p>Please wait while we confirm your payment.</p>
    </div>
  );
};

export default PaymentResult;