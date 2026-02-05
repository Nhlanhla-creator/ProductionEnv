import { useState, useEffect, useCallback } from 'react';
import {
  loadSprintsFromFirebase,
  syncSprintToFirebase,
  subscribeToSprints,
  initializeSprintsForUser,
  saveAllSprints
} from '../admin/pages/services/sprints';

/**
 * Custom hook for syncing sprints with Firebase
 * Handles loading, saving, and real-time updates
 */
export const useSprintSync = (initialSprintsData, user) => {
  const [sprintsData, setSprintsData] = useState(initialSprintsData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load sprints from Firebase on mount
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadSprints = async () => {
      try {
        setIsLoading(true);
        setSyncError(null);

        // Try to load existing sprints
        const remoteSprints = await loadSprintsFromFirebase();

        if (Object.keys(remoteSprints).length > 0) {
          // User has existing sprints
          console.log('📥 Loaded sprints from Firebase');
          setSprintsData(remoteSprints);
        } else {
          // Initialize with default data for new users
          console.log('🆕 Initializing default sprints');
          await initializeSprintsForUser(initialSprintsData);
          setSprintsData(initialSprintsData);
        }

        setLastSyncTime(new Date());
      } catch (error) {
        console.error('❌ Error loading sprints:', error);
        setSyncError(error.message);
        // Fall back to initial data
        setSprintsData(initialSprintsData);
      } finally {
        setIsLoading(false);
      }
    };

    loadSprints();
  }, [user, initialSprintsData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Setting up real-time sync');
    
    const unsubscribe = subscribeToSprints((updatedSprints) => {
      setSprintsData(updatedSprints);
      setLastSyncTime(new Date());
    });

    return () => {
      console.log('🔌 Disconnecting real-time sync');
      unsubscribe();
    };
  }, [user]);

  // Sync a single sprint to Firebase
  const syncSprint = useCallback(async (sprint) => {
    if (!user) {
      console.warn('⚠️ Cannot sync: User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      await syncSprintToFirebase(sprint);
      setLastSyncTime(new Date());

      return { success: true };
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Sync all sprints to Firebase
  const syncAllSprints = useCallback(async (sprints) => {
    if (!user) {
      console.warn('⚠️ Cannot sync: User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      await saveAllSprints(sprints);
      setLastSyncTime(new Date());

      return { success: true };
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // Force refresh from Firebase
  const refreshFromFirebase = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const remoteSprints = await loadSprintsFromFirebase();
      setSprintsData(remoteSprints);
      setLastSyncTime(new Date());
      return { success: true };
    } catch (error) {
      console.error('❌ Refresh error:', error);
      setSyncError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    sprintsData,
    setSprintsData,
    isLoading,
    isSyncing,
    syncError,
    lastSyncTime,
    syncSprint,
    syncAllSprints,
    refreshFromFirebase
  };
};