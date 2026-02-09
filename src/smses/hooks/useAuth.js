import { useState, useEffect, useRef } from 'react';
import { auth } from '../../firebaseConfig';
import {
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const INACTIVITY_MS = 30 * 60 * 1000; 
  const WARNING_MS = 90 * 1000; // show warning 90 seconds before logout

  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const userRef = useRef(null);
  const showIdleModalRef = useRef(false);

  const [showIdleModal, setShowIdleModal] = useState(false);
  const [idleSecondsLeft, setIdleSecondsLeft] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearWarnTimer = () => {
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current);
      warnTimerRef.current = null;
    }
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const updateIdleSeconds = () => {
    const deadline = lastActivityRef.current + INACTIVITY_MS;
    const msLeft = Math.max(0, deadline - Date.now());
    setIdleSecondsLeft(Math.ceil(msLeft / 1000));
    if (msLeft <= 0) {
      setShowIdleModal(false);
      showIdleModalRef.current = false;
      stopCountdown();
    }
  };

  const startCountdown = () => {
    stopCountdown();
    updateIdleSeconds();
    countdownIntervalRef.current = setInterval(updateIdleSeconds, 1000);
  };

  const scheduleInactivityTimer = () => {
    clearTimer();
    clearWarnTimer();
    
    // Schedule the actual logout
    timerRef.current = setTimeout(async () => {
      // Clean up UI state first
      try {
        setShowIdleModal(false);
        showIdleModalRef.current = false;
      } catch (e) {
        /* ignore */
      }
      try {
        stopCountdown();
      } catch (e) {
        /* ignore */
      }

      // Sign out on inactivity
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn('Error auto-signing out due to inactivity', e);
      }
    }, INACTIVITY_MS);

    // Schedule warning modal
    const warnDelay = Math.max(0, INACTIVITY_MS - WARNING_MS);
    warnTimerRef.current = setTimeout(() => {
      setShowIdleModal(true);
      showIdleModalRef.current = true; // Pause activity tracking
      startCountdown();
    }, warnDelay);
  };

  const handleActivity = () => {
    // If idle warning modal is visible, ignore activity
    // User must explicitly choose to stay signed in
    if (showIdleModalRef.current) return;

    lastActivityRef.current = Date.now();
    scheduleInactivityTimer(); // Reset the inactivity timer
  };

  const activityEvents = [
    'mousemove',
    'keydown',
    'scroll',
    'click',
    'touchstart',
    'visibilitychange',
  ];

  const attachActivityListeners = () => {
    activityEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
  };

  const clearActivityListeners = () => {
    activityEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      userRef.current = u;
      setLoading(false);
      
      // Clean up any existing timers
      clearTimer();
      clearWarnTimer();
      stopCountdown();
      
      // Reset modal state when signed out
      if (!u) {
        setShowIdleModal(false);
        showIdleModalRef.current = false;
      }
      
      // Start inactivity tracking when user is signed in
      if (u) {
        lastActivityRef.current = Date.now();
        scheduleInactivityTimer();
        
        // Firebase automatically refreshes tokens in the background
        // We don't need to manually refresh on sign-in
      }
    });

    // Attach global activity listeners once
    attachActivityListeners();

    return () => {
      unsubscribe();
      clearActivityListeners();
      clearTimer();
      clearWarnTimer();
      stopCountdown();
      setShowIdleModal(false);
      showIdleModalRef.current = false;
    };
    // empty deps: subscribe once
  }, []);

  const signInAnonymous = async () => {
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    if (!userRef.current) return;
    
    try {
      // When user clicks "Stay signed in", we explicitly refresh the token
      // This ensures they get a fresh session and resets Firebase's internal timer
      await userRef.current.getIdToken(true);
      
      // Reset inactivity tracking
      lastActivityRef.current = Date.now();
      scheduleInactivityTimer();
      
      // Hide modal and resume activity tracking
      setShowIdleModal(false);
      showIdleModalRef.current = false;
      stopCountdown();
    } catch (e) {
      console.warn('refreshSession failed', e);
      throw e;
    }
  };

  return {
    user,
    loading,
    signInAnonymous,
    signOut,
    // idle modal helpers
    showIdleModal,
    idleSecondsLeft,
    refreshSession,
  };
};

export default useAuth;