import React from 'react';
import { styles } from './styles';

export const ASSIGNEES = [
  'Lindelani', 'Nhlanhla', 'Makha', 'Lerato', 'Thando',
  'Molefi', 'Lethabo', 'Tracey', 'Sbonelo'
];

export const DASHBOARD_OPTIONS = ['SMSE', 'Investor', 'Advisor', 'Catalyst', 'All'];

export const Sidebar = ({ activeCategory, setActiveCategory }) => {

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
    </div>
  );
};