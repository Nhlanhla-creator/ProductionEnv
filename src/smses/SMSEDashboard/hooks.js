// src/hooks/useFirebaseFunctions.js
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

export const useFirebaseFunctions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callFunction = async (functionName, data = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const functionRef = httpsCallable(functions, functionName);
      const result = await functionRef(data);
      setLoading(false);
      return result.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { callFunction, loading, error };
};