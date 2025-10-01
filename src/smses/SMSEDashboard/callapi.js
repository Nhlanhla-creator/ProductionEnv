"use client"

import { useState, useEffect,useRef } from "react"
import { ChevronDown, RefreshCw, AlertCircle, DollarSign, CheckCircle, TrendingUp } from "lucide-react"
import { db, auth } from "../../firebaseConfig"
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore"
import { collection, query, where, getDocs } from "firebase/firestore"
import { API_KEYS } from "../../API"


import { useFirebaseFunctions } from './hooks';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { callFunction } = useFirebaseFunctions();
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchApiKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await callFunction('getUserData', {});
      
      if (response?.key) {
        setApiKey(response.key);
        retryCountRef.current = 0; // Reset retry count on success
        return response.key;
      } else {
        throw new Error('API key not found in response');
      }
    } catch (err) {
      console.error('Failed to fetch API key:', err);
      setError(err.message);
      
      // Retry mechanism
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchApiKey();
        }, 1000 * retryCountRef.current); // Exponential backoff
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKey();
  }, []);

  const refetchApiKey = () => {
    retryCountRef.current = 0;
    return fetchApiKey();
  };

  return apiKey
};