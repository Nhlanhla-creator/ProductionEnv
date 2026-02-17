import React, { memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SprintTable } from './SprintTable';
import { styles } from './styles';

export const SprintCard = memo(({ 
  sprint, 
  isExpanded, 
  onToggle, 
  onUpdateTask, 
  onAddTask,
  onDeleteTask,
  onAddColumn,
  onDeleteSprint
}) => {
  return (
    <div style={styles.sprintCard}>
      <div
        style={styles.sprintCardHeader}
        onClick={() => onToggle(sprint.id)}
      >
        {isExpanded ? (
          <ChevronDown size={20} />
        ) : (
          <ChevronRight size={20} />
        )}
        <div style={styles.sprintHeaderContent}>
          <strong style={styles.sprintName}>{sprint.name}</strong>
          <span style={styles.sprintSubtitle}>{sprint.subtitle}</span>
          <span style={styles.taskCount}>
            {sprint.tasks.length} task{sprint.tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div style={styles.sprintContent}>
          <SprintTable
            sprint={sprint}
            onUpdateTask={onUpdateTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
            onAddColumn={onAddColumn}
            onDeleteSprint={onDeleteSprint}
          />
        </div>
      )}
    </div>
  );
});