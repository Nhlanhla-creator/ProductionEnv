// qa-components/qaTableFirebaseService.js
import { db, auth } from '../../../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { INITIAL_QA_TASKS } from '../structure/qaTableData';

const QA_TABLE_DOC = 'qa_master_table';

const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

/**
 * Load QA master table for current user.
 * Falls back to initial static data if none exists yet.
 */
export const loadQATable = async () => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, QA_TABLE_DOC, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.tasks;
    }

    // First time – seed with static data and persist
    await setDoc(docRef, {
      userId: user.uid,
      tasks: INITIAL_QA_TASKS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return INITIAL_QA_TASKS;
  } catch (error) {
    console.error('❌ Error loading QA table:', error);
    throw error;
  }
};

/**
 * Persist full tasks array back to Firestore (full-replace strategy).
 * Call this after any add / update / delete.
 */
export const saveQATable = async (tasks) => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, QA_TABLE_DOC, user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      tasks,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving QA table:', error);
    throw error;
  }
};

/**
 * Append a sprint task as a new row in the QA master table.
 * Guards against duplicates (same sprint + task ID).
 * Returns the updated tasks array.
 */
export const appendSprintTask = async (sprintTask, sprint) => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, QA_TABLE_DOC, user.uid);
    const docSnap = await getDoc(docRef);

    let existingTasks = [];
    if (docSnap.exists()) {
      existingTasks = docSnap.data().tasks || [];
    }

    // Guard: don't duplicate
    const alreadyExists = existingTasks.some(
      t => t._sourceSprintId === sprint.id && t._sourceTaskId === sprintTask.id
    );
    if (alreadyExists) {
      console.warn('⚠️ Task already exists in QA table, skipping append');
      return existingTasks;
    }

    // Build QA row from sprint task data
    const assignee = Array.isArray(sprintTask.assignee)
      ? sprintTask.assignee[0] || ''
      : sprintTask.assignee || '';

    // Derive dashboard from sprint task category
    const sprintCats = Array.isArray(sprintTask.category) ? sprintTask.category : [sprintTask.category || ''];
    let dashboard = 'SMSE';
    if (sprintCats.some(cat => String(cat).toLowerCase().includes('funding'))) {
      dashboard = 'Investor';
    } else if (sprintCats.some(cat => String(cat).toLowerCase().includes('intake') || String(cat).toLowerCase().includes('comms'))) {
      dashboard = 'Advisor';
    } else if (sprintCats.some(cat => String(cat).toLowerCase().includes('security'))) {
      dashboard = 'All';
    } else {
      dashboard = 'SMSE';
    }

    // Derive category and testType for QA master table
    let category = 'Unit Tests';
    let testType = 'Functionality';
    if (sprintCats.some(cat => String(cat).toLowerCase().includes('security'))) {
      category = 'Security';
      testType = 'Security';
    } else if (sprintCats.some(cat => String(cat).toLowerCase().includes('frontend'))) {
      category = 'E2E Tests';
      testType = 'Functionality';
    } else if (sprintCats.some(cat => String(cat).toLowerCase().includes('backend'))) {
      category = 'Integration Tests';
      testType = 'Integration';
    } else if (sprintCats.some(cat => String(cat).toLowerCase().includes('qa'))) {
      category = 'Unit Tests';
      testType = 'Integration';
    }

    // Map dashboard to code prefix (e.g. Investor -> ID)
    const dashboardCode = dashboard === 'SMSE' ? 'SD'
                        : dashboard === 'Investor' ? 'ID'
                        : dashboard === 'Advisor' ? 'AD'
                        : dashboard === 'Catalyst' ? 'CD'
                        : dashboard === 'Intern' ? 'XD'
                        : 'D';

    // Compute unique sequential ID with SP prefix (e.g. ID-SP-01)
    const prefix = `${dashboardCode}-SP-`;
    const siblingTasks = existingTasks.filter(t => t.taskId && t.taskId.startsWith(prefix));
    let nextIndex = 1;
    if (siblingTasks.length > 0) {
      const indices = siblingTasks.map(t => {
        const parts = t.taskId.split('-');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        return isNaN(num) ? 0 : num;
      });
      nextIndex = Math.max(...indices) + 1;
    }
    const suffix = String(nextIndex).padStart(2, '0');
    const taskId = `${prefix}${suffix}`;

    const newQATask = {
      taskId,
      taskName: sprintTask.action || sprintTask.name || `Sprint ${sprint.id} Task`,
      category,
      dashboard,
      section: sprint.name || `Sprint ${sprint.id}`,
      status: '—',
      dueDate: sprintTask.endDate || '',
      testedWhen: '',
      assignedTo: assignee,
      testType,
      actionStatus: '—',
      _sourceSprintId: sprint.id,
      _sourceTaskId: sprintTask.id,
      _new: true,
      _appendedAt: new Date().toISOString(),
    };

    const updatedTasks = [...existingTasks, newQATask];

    await setDoc(docRef, {
      userId: user.uid,
      tasks: updatedTasks,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return updatedTasks;
  } catch (error) {
    console.error('❌ Error appending sprint task to QA table:', error);
    throw error;
  }
};