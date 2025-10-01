"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const PaymentMethods = () => {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, 'paymentMethods', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCards([docSnap.data()]);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [auth]);

  const handleAddCard = async () => {
    try {
      setProcessing(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Please log in to add payment methods');

      const response = await fetch('/api/payments/register-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid
        })
      });

      const result = await response.json();
      
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        throw new Error(result.error || 'Failed to initiate card registration');
      }
    } catch (error) {
      alert(error.message);
      setProcessing(false);
    }
  };

  const handleRemoveCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      await deleteDoc(doc(db, 'paymentMethods', user.uid));
      setCards([]);
    } catch (error) {
      console.error('Error removing payment method:', error);
      alert('Failed to remove payment method');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Payment Methods</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Saved Payment Methods</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : cards.length > 0 ? (
          <div className="space-y-4">
            {cards.map((card) => (
              <div key={card.registrationId} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">Card ending in ****</p>
                  <p className="text-sm text-gray-500">Registered on {new Date(card.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleRemoveCard(card.registrationId)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No payment methods saved yet</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Payment Method</h2>
        <button
          onClick={handleAddCard}
          disabled={processing}
          className={`px-4 py-2 rounded-md font-medium ${
            processing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {processing ? 'Processing...' : 'Add New Card'}
        </button>
      </div>
    </div>
  );
};

export default PaymentMethods;