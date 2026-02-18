import React from 'react';
import { styles } from './styles';

export const Sidebar = ({ activeCategory, setActiveCategory }) => {
  return (
    <div style={styles.categorySidebar}>
      <div
        style={{
          ...styles.categoryButton,
          ...(activeCategory === 'meetings' && styles.categoryButtonActive),
          display: 'inline-block',
          marginRight: '10px'
        }}
        onClick={() =>
          setActiveCategory(activeCategory === 'meetings' ? null : 'meetings')
        }
      >
        <span>Meetings</span>
      </div>

      <div
        style={{
          ...styles.categoryButton,
          ...(activeCategory === 'sprints' && styles.categoryButtonActive),
          display: 'inline-block',
          marginRight: '10px'
        }}
        onClick={() =>
          setActiveCategory(activeCategory === 'sprints' ? null : 'sprints')
        }
      >
        <span>Sprints</span>
      </div>
    </div>
  );
};