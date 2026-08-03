import { db, auth } from '../../../firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';


const TEAM_DOC = 'admin_team_members';

const getCurrentUser = (userParam) => {
  const user = userParam || auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

const NORMALIZE_MAP = {
  'nhlanhla': 'Nhlanhla Msomi',
  'nhlanhla msomi': 'Nhlanhla Msomi',
  'n. msomi': 'Nhlanhla Msomi',
  'n msomi': 'Nhlanhla Msomi',
  
  'lerato': 'Lerato Nama',
  'lerato nama': 'Lerato Nama',
  'l. nama': 'Lerato Nama',
  'l nama': 'Lerato Nama',
  
  'owami': 'Owami Ngobese',
  'owami ngobese': 'Owami Ngobese',
  'o. ngobese': 'Owami Ngobese',
  'o ngobese': 'Owami Ngobese',
  
  'lindelani': 'Lindelani',
  'makha': 'Makha',
  'thando': 'Thando',
  'molefi': 'Molefi',
  'lethabo': 'Lethabo',
  'tracey': 'Tracey',
  'sbonelo': 'Sbonelo'
};

/**
 * Standardizes a name to a unified first and last name from our mapping if recognized,
 * otherwise reformats to standardized Title Case.
 */
export const normalizeName = (name) => {
  if (!name || typeof name !== 'string') return '';
  const cleaned = name.trim().toLowerCase().replace(/\s+/g, ' ');
  
  if (NORMALIZE_MAP[cleaned]) {
    return NORMALIZE_MAP[cleaned];
  }
  
  if (cleaned.startsWith('n ') || cleaned.startsWith('n. ')) {
    if (cleaned.endsWith('msomi')) return 'Nhlanhla Msomi';
  }
  if (cleaned.startsWith('l ') || cleaned.startsWith('l. ')) {
    if (cleaned.endsWith('nama')) return 'Lerato Nama';
  }
  if (cleaned.startsWith('o ') || cleaned.startsWith('o. ')) {
    if (cleaned.endsWith('ngobese')) return 'Owami Ngobese';
  }

  if (!cleaned.includes(' ')) {
    const firstToken = cleaned.split(' ')[0];
    if (NORMALIZE_MAP[firstToken]) {
      return NORMALIZE_MAP[firstToken];
    }
  }
  
  return name.trim().split(/\s+/).map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

/**
 * Extracts first name from a full name.
 */
export const getFirstName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().split(/\s+/)[0];
};



/**
 * Load team members for current user.
 * If none exist in Firestore, derive them from sprints + QA, save them, and return.
 */
export const loadTeamMembers = async (userParam) => {
  try {
    const user = getCurrentUser(userParam);
    const docRef = doc(db, TEAM_DOC, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.members || [];
    }

    // Initialize with static default team list (no automatic DB scraping)
    const defaultAssignees = [
      { name: 'Lindelani', role: 'Add role' },
      { name: 'Nhlanhla Msomi', role: 'Add role' },
      { name: 'Makha', role: 'Add role' },
      { name: 'Lerato Nama', role: 'Add role' },
      { name: 'Thando', role: 'Add role' },
      { name: 'Molefi', role: 'Add role' },
      { name: 'Lethabo', role: 'Add role' },
      { name: 'Tracey', role: 'Add role' },
      { name: 'Sbonelo', role: 'Add role' },
      { name: 'Owami Ngobese', role: 'Add role' }
    ];
    const fallbackMembers = defaultAssignees.map((item, idx) => ({
      id: `default_${Date.now()}_${idx}`,
      name: item.name,
      role: item.role,
      avatar: '',
      isDerived: false
    }));
    await saveTeamMembers(fallbackMembers, user);
    return fallbackMembers;
  } catch (error) {
    console.error('❌ Error loading team members:', error);
    throw error;
  }
};

/**
 * Save full team members array back to Firestore (full-replace strategy).
 */
export const saveTeamMembers = async (members, userParam) => {
  try {
    const user = getCurrentUser(userParam);
    const docRef = doc(db, TEAM_DOC, user.uid);
    await setDoc(docRef, {
      userId: user.uid,
      members,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving team members:', error);
    throw error;
  }
};
