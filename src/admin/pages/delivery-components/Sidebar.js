import React, { useState } from 'react';
import { styles } from './styles';
import { db, auth } from '../../../firebaseConfig';
import { collection, query, where, getDocs, writeBatch, serverTimestamp, doc, setDoc } from 'firebase/firestore';

export const ASSIGNEES = [
  'Lindelani', 'Nhlanhla', 'Makha', 'Lerato', 'Thando',
  'Molefi', 'Lethabo', 'Tracey', 'Sbonelo'
];

export const DASHBOARD_OPTIONS = ['SMSE', 'Investor', 'Advisor', 'Catalyst', 'All'];

const SPRINT_9_DATA = {
  id: 9,
  name: 'Sprint 9',
  subtitle: 'Association Admin Dashboard',
  columns: [
    { id: 'id', label: 'Number', type: 'text', editable: false },
    { id: 'action', label: 'Task', type: 'text', editable: true },
    { id: 'category', label: 'Category', type: 'multi-select', editable: true, options: ['Frontend', 'Backend', 'QA', 'Security', 'Traction', 'Funding', 'Intake/Comms'] },
    { id: 'dashboard', label: 'Dashboard', type: 'multi-select', editable: true, options: DASHBOARD_OPTIONS },
    { id: 'dependencies', label: 'Dependencies', type: 'text', editable: true },
    { id: 'assignee', label: 'By who', type: 'multi-select', editable: true, options: ASSIGNEES },
    { id: 'endDate', label: 'By when', type: 'date', editable: true },
    { id: 'revDate', label: 'Revised date', type: 'date', editable: true },
    { id: 'status', label: 'Status', type: 'select', editable: true, options: ['Done', 'Not done'] },
  ],
  tasks: [
    {
      id: 'SP9.1',
      action: 'Add a profile on register page for Associations',
      category: ['Frontend', 'Backend'],
      dashboard: [],
      dependencies: 'non',
      assignee: ['Nhlanhla'],
      endDate: '2026-04-20',
      revDate: '2026-04-17',
      status: 'Not done',
    },
    {
      id: 'SP9.2',
      action: 'User rules for the admin',
      category: ['Backend'],
      dashboard: [],
      dependencies: '',
      assignee: ['Lindelani'],
      endDate: '2026-04-20',
      revDate: '2026-04-20',
      status: 'Not done',
    },
    {
      id: 'SP9.3',
      action: 'Duplicate our current dashboard for Associations',
      category: ['Backend', 'Frontend'],
      dashboard: [],
      dependencies: '',
      assignee: ['Nhlanhla'],
      endDate: '2026-04-20',
      revDate: '2026-04-17',
      status: 'Not done',
    },
  ],
};

async function seedSprint9() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docId = `${user.uid}_sprint_9`;
  const ref = doc(db, 'sprints', docId);

  await setDoc(ref, {
    ...SPRINT_9_DATA,
    userId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const Sidebar = ({ activeCategory, setActiveCategory }) => {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm('Seed Sprint 9 (Association Admin Dashboard)? This will overwrite any existing sprint 9.')) return;
    setSeeding(true);
    try {
      await seedSprint9();
      alert('✅ Sprint 9 seeded.');
    } catch (err) {
      alert(`❌ Seed failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const categoryBtn = (key) => ({
    ...styles.categoryButton,
    ...(activeCategory === key && styles.categoryButtonActive),
    display: 'inline-block',
    marginRight: '10px',
  });

  return (
    <div style={styles.categorySidebar}>
      <div style={categoryBtn('meetings')} onClick={() => setActiveCategory(activeCategory === 'meetings' ? null : 'meetings')}>
        <span>Meetings</span>
      </div>
      <div style={categoryBtn('sprints')} onClick={() => setActiveCategory(activeCategory === 'sprints' ? null : 'sprints')}>
        <span>Sprints</span>
      </div>
      <div style={{ ...styles.categoryButton, display: 'inline-block', opacity: seeding ? 0.5 : 1 }} onClick={!seeding ? handleSeed : undefined}>
        <span>{seeding ? 'Seeding…' : '⚙️ Seed Sprint 9'}</span>
      </div>
    </div>
  );
};