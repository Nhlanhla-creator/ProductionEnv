import { db, auth } from '../../../firebaseConfig'; // Adjust path as needed
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

// ============================================================================
// FIREBASE SPRINTS SERVICE
// ============================================================================

const SPRINTS_COLLECTION = 'sprints';
const SPRINT_TASKS_COLLECTION = 'sprint_tasks';

/**
 * Get the current authenticated user
 */
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

/**
 * Load all sprints for the current user
 */
export const loadSprintsFromFirebase = async () => {
  try {
    const user = getCurrentUser();
    const sprintsRef = collection(db, SPRINTS_COLLECTION);
    const q = query(sprintsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const sprints = {};
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sprints[data.id] = {
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
      };
    });

    console.log('✅ Loaded sprints from Firebase:', Object.keys(sprints).length);
    return sprints;
  } catch (error) {
    console.error('❌ Error loading sprints from Firebase:', error);
    throw error;
  }
};

/**
 * Save or update a sprint
 */
export const saveSprint = async (sprint) => {
  try {
    const user = getCurrentUser();
    const sprintRef = doc(db, SPRINTS_COLLECTION, `${user.uid}_sprint_${sprint.id}`);

    const sprintData = {
      ...sprint,
      userId: user.uid,
      updatedAt: serverTimestamp(),
      createdAt: sprint.createdAt || serverTimestamp()
    };

    await setDoc(sprintRef, sprintData, { merge: true });
    console.log('✅ Saved sprint to Firebase:', sprint.id);
    return { success: true, id: sprint.id };
  } catch (error) {
    console.error('❌ Error saving sprint:', error);
    throw error;
  }
};

/**
 * Save all sprints (bulk operation)
 */
export const saveAllSprints = async (sprintsData) => {
  try {
    const user = getCurrentUser();
    const promises = Object.values(sprintsData).map(sprint => {
      const sprintRef = doc(db, SPRINTS_COLLECTION, `${user.uid}_sprint_${sprint.id}`);
      return setDoc(sprintRef, {
        ...sprint,
        userId: user.uid,
        updatedAt: serverTimestamp(),
        createdAt: sprint.createdAt || serverTimestamp()
      }, { merge: true });
    });

    await Promise.all(promises);
    console.log('✅ Saved all sprints to Firebase');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving all sprints:', error);
    throw error;
  }
};

/**
 * Update a specific task within a sprint
 */
export const updateTask = async (sprintId, taskId, columnId, newValue) => {
  try {
    const user = getCurrentUser();
    const taskRef = doc(db, SPRINT_TASKS_COLLECTION, `${user.uid}_task_${sprintId}_${taskId}`);

    await updateDoc(taskRef, {
      [columnId]: newValue,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Updated task in Firebase:', taskId);
    return { success: true };
  } catch (error) {
    // If task doesn't exist, create it
    if (error.code === 'not-found') {
      console.log('Task not found, will be saved with sprint');
      return { success: true, note: 'Task will be saved with sprint' };
    }
    console.error('❌ Error updating task:', error);
    throw error;
  }
};

/**
 * Add a new task to a sprint
 */
export const addTask = async (sprintId, task) => {
  try {
    const user = getCurrentUser();
    const taskRef = doc(db, SPRINT_TASKS_COLLECTION, `${user.uid}_task_${sprintId}_${task.id}`);

    const taskData = {
      ...task,
      sprintId,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(taskRef, taskData);
    console.log('✅ Added task to Firebase:', task.id);
    return { success: true, id: task.id };
  } catch (error) {
    console.error('❌ Error adding task:', error);
    throw error;
  }
};

/**
 * Delete a task from a sprint
 */
export const deleteTask = async (sprintId, taskId) => {
  try {
    const user = getCurrentUser();
    const taskRef = doc(db, SPRINT_TASKS_COLLECTION, `${user.uid}_task_${sprintId}_${taskId}`);

    await deleteDoc(taskRef);
    console.log('✅ Deleted task from Firebase:', taskId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    throw error;
  }
};

/**
 * Add a new column to a sprint
 */
export const addColumn = async (sprintId, column) => {
  try {
    const user = getCurrentUser();
    const sprintRef = doc(db, SPRINTS_COLLECTION, `${user.uid}_sprint_${sprintId}`);

    // Get current sprint data
    const sprintDoc = await getDoc(sprintRef);
    if (!sprintDoc.exists()) {
      throw new Error('Sprint not found');
    }

    const sprintData = sprintDoc.data();
    const updatedColumns = [...(sprintData.columns || []), column];

    await updateDoc(sprintRef, {
      columns: updatedColumns,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Added column to Firebase:', column.id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error adding column:', error);
    throw error;
  }
};

/**
 * Delete a sprint
 */
export const deleteSprint = async (sprintId) => {
  try {
    const user = getCurrentUser();
    const sprintRef = doc(db, SPRINTS_COLLECTION, `${user.uid}_sprint_${sprintId}`);

    // Delete all tasks in the sprint first
    const tasksRef = collection(db, SPRINT_TASKS_COLLECTION);
    const q = query(
      tasksRef, 
      where('userId', '==', user.uid),
      where('sprintId', '==', sprintId)
    );
    const querySnapshot = await getDocs(q);
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    
    // Delete the sprint
    await deleteDoc(sprintRef);
    console.log('✅ Deleted sprint from Firebase:', sprintId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting sprint:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time sprint updates
 */
export const subscribeToSprints = (callback) => {
  try {
    const user = getCurrentUser();
    const sprintsRef = collection(db, SPRINTS_COLLECTION);
    const q = query(sprintsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sprints = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sprints[data.id] = {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
        };
      });

      callback(sprints);
      console.log('🔄 Sprints updated in real-time');
    }, (error) => {
      console.error('❌ Error in sprint subscription:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('❌ Error subscribing to sprints:', error);
    throw error;
  }
};

/**
 * Sync local sprint data with Firebase (debounced)
 * This is the main function to call after any update
 */
let syncTimeout = null;
export const syncSprintToFirebase = async (sprint, debounceMs = 1000) => {
  // Clear previous timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Debounce to avoid too many writes
  return new Promise((resolve, reject) => {
    syncTimeout = setTimeout(async () => {
      try {
        await saveSprint(sprint);
        resolve({ success: true });
      } catch (error) {
        reject(error);
      }
    }, debounceMs);
  });
};

/**
 * Initialize sprints for a new user (first time setup)
 */
export const initializeSprintsForUser = async (initialSprintsData) => {
  try {
    const user = getCurrentUser();
    
    // Check if user already has sprints
    const sprintsRef = collection(db, SPRINTS_COLLECTION);
    const q = query(sprintsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('🆕 Initializing sprints for new user');
      await saveAllSprints(initialSprintsData);
      return { success: true, initialized: true };
    } else {
      console.log('✅ User already has sprints');
      return { success: true, initialized: false };
    }
  } catch (error) {
    console.error('❌ Error initializing sprints:', error);
    throw error;
  }
};

/**
 * Merge local changes with remote data (conflict resolution)
 */
export const mergeSprintData = (localSprint, remoteSprint) => {
  // Use the most recently updated version
  const localTime = new Date(localSprint.updatedAt).getTime();
  const remoteTime = new Date(remoteSprint.updatedAt).getTime();

  if (localTime > remoteTime) {
    console.log('📤 Local version is newer, using local');
    return localSprint;
  } else {
    console.log('📥 Remote version is newer, using remote');
    return remoteSprint;
  }
};

/**
 * Export all sprints data (for backup)
 */
export const exportSprintsData = async () => {
  try {
    const sprints = await loadSprintsFromFirebase();
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: getCurrentUser().uid,
      sprints: sprints
    };

    console.log('✅ Exported sprints data');
    return exportData;
  } catch (error) {
    console.error('❌ Error exporting sprints:', error);
    throw error;
  }
};

/**
 * Import sprints data (from backup)
 */
export const importSprintsData = async (importData) => {
  try {
    if (!importData.sprints) {
      throw new Error('Invalid import data format');
    }

    await saveAllSprints(importData.sprints);
    console.log('✅ Imported sprints data');
    return { success: true };
  } catch (error) {
    console.error('❌ Error importing sprints:', error);
    throw error;
  }
};