import React from 'react';
import { ChevronRight } from 'lucide-react';
import { styles } from './styles';

export const Sidebar = ({ activeCategory, setActiveCategory }) => {
  return (
    <div style={styles.categorySidebar}>
      <div
        style={{
          ...styles.categoryButton,
          ...(activeCategory === 'meetings' && styles.categoryButtonActive)
        }}
        onClick={() =>
          setActiveCategory(activeCategory === 'meetings' ? null : 'meetings')
        }
      >
        <ChevronRight
          size={16}
          style={{
            transform: activeCategory === 'meetings' ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
        <span>Meetings</span>
      </div>

      <div
        style={{
          ...styles.categoryButton,
          ...(activeCategory === 'sprints' && styles.categoryButtonActive)
        }}
        onClick={() =>
          setActiveCategory(activeCategory === 'sprints' ? null : 'sprints')
        }
      >
        <ChevronRight
          size={16}
          style={{
            transform: activeCategory === 'sprints' ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
        <span>Sprints</span>
      </div>
    </div>
  );
};