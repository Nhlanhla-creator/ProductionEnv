import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { SprintCard } from './SprintCard';
import { styles } from './styles';

export const SprintsView = ({
  sprintsData,
  expandedSprints,
  toggleSprint,
  handleUpdateTask,
  handleAddTask,
  handleDeleteTask,
  handleAddColumn,
  handleAddSprint
}) => {
  const sortedSprints = useMemo(() => {
    return Object.values(sprintsData).sort((a, b) => a.id - b.id);
  }, [sprintsData]);

  return (
    <div style={styles.sprintsContainer}>
      <div style={styles.sprintsHeader}>
        <h2 style={styles.sprintsTitle}>Sprint Management</h2>
        <button onClick={handleAddSprint} style={styles.addSprintBtn}>
          <Plus size={18} />
          Add Sprint
        </button>
      </div>

      {sortedSprints.map((sprint) => (
        <SprintCard
          key={sprint.id}
          sprint={sprint}
          isExpanded={expandedSprints[sprint.id]}
          onToggle={toggleSprint}
          onUpdateTask={(taskId, columnId, newValue) =>
            handleUpdateTask(sprint.id, taskId, columnId, newValue)
          }
          onAddTask={(newTask) => handleAddTask(sprint.id, newTask)}
          onDeleteTask={(taskId) => handleDeleteTask(sprint.id, taskId)}
          onAddColumn={handleAddColumn}
        />
      ))}
    </div>
  );
};