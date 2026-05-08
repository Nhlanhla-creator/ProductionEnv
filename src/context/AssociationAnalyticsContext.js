// src/context/AssociationAnalyticsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

const AssociationAnalyticsContext = createContext();

export const useAssociationAnalytics = () => {
  const context = useContext(AssociationAnalyticsContext);
  if (!context) {
    // Return a fallback instead of throwing error for better UX
    console.warn('useAssociationAnalytics used outside of AssociationAnalyticsProvider');
    return {
      analyticsData: null,
      loading: false,
      error: 'Provider not initialized',
      associationName: null,
      refreshAnalytics: () => {}
    };
  }
  return context;
};

export const AssociationAnalyticsProvider = ({ children }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [associationName, setAssociationName] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }
      
      console.log('Fetching analytics for user:', currentUser.uid);
      
      const profileDoc = await getDoc(doc(db, "universalProfiles", currentUser.uid));
      if (!profileDoc.exists()) {
        console.log('Association profile not found');
        setError('Association profile not found');
        setLoading(false);
        return;
      }
      
      const assocName = profileDoc.data()?.entityOverview?.industryAssociation;
      if (!assocName) {
        console.log('No industry association selected in profile');
        setError('No industry association selected in profile');
        setLoading(false);
        return;
      }
      
      console.log('Association name found:', assocName);
      setAssociationName(assocName);
      
      // Rest of your fetch logic...
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAnalytics();
      } else {
        setAnalyticsData(null);
        setAssociationName(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const value = {
    analyticsData,
    loading,
    error,
    associationName,
    refreshAnalytics: fetchAnalytics
  };

  return (
    <AssociationAnalyticsContext.Provider value={value}>
      {children}
    </AssociationAnalyticsContext.Provider>
  );
};