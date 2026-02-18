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
  onDeleteColumn,
  onDeleteSprint,
  onUpdateSprint
}) => {
  const [isEditingSubtitle, setIsEditingSubtitle] = React.useState(false);
  const [subtitle, setSubtitle] = React.useState(sprint.subtitle);

  const handleSubtitleSave = (e) => {
    e.stopPropagation();
    onUpdateSprint(sprint.id, { subtitle });
    setIsEditingSubtitle(false);
  };

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
          {isEditingSubtitle ? (
            <div style={{ display: 'flex', gap: 8, flex: 1 }} onClick={e => e.stopPropagation()}>
              <input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                onBlur={handleSubtitleSave}
                onKeyDown={e => e.key === 'Enter' && handleSubtitleSave(e)}
                style={{ ...styles.formInput, padding: '2px 8px', fontSize: 14 }}
                autoFocus
              />
            </div>
          ) : (
            <span 
              style={styles.sprintSubtitle}
              onClick={e => {
                e.stopPropagation();
                setIsEditingSubtitle(true);
              }}
              title="Click to edit description"
            >
              {sprint.subtitle}
            </span>
          )}
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
            onDeleteColumn={onDeleteColumn}
            onDeleteSprint={onDeleteSprint}
          />
        </div>
      )}
    </div>
  );
});