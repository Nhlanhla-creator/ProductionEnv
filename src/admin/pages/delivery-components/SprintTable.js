import React, { useState, useCallback, memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TableRow } from './TableRow';
import { AddColumnModal, AddTaskModal, DeleteSprintModal } from './Modals';
import { styles } from './styles';

export const SprintTable = memo(({ 
  sprint, 
  onUpdateTask, 
  onAddTask, 
  onDeleteTask,
  onAddColumn,
  onDeleteSprint 
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showDeleteSprintModal, setShowDeleteSprintModal] = useState(false);

  const handleAddTask = useCallback((newTask) => {
    onAddTask(sprint.id, newTask);
  }, [sprint.id, onAddTask]);

  const handleAddColumn = useCallback(async (columnData) => {
    await onAddColumn(sprint.id, columnData);
  }, [sprint.id, onAddColumn]);

  const handleDeleteSprint = useCallback(async () => {
    await onDeleteSprint(sprint.id);
  }, [sprint.id, onDeleteSprint]);

  if (!sprint.columns || sprint.columns.length === 0) {
    return (
      <div style={styles.emptyTable}>
        <p style={styles.emptyTableText}>No table structure defined for this sprint</p>
        <button onClick={() => setShowAddColumnModal(true)} style={styles.addColumnBtn}>
          <Plus size={16} />
          Add Column
        </button>
        
        <AddColumnModal
          isOpen={showAddColumnModal}
          onClose={() => setShowAddColumnModal(false)}
          onAdd={handleAddColumn}
          sprint={sprint}
        />
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableControls}>
        <button onClick={() => setShowAddTaskModal(true)} style={styles.addTaskBtn}>
          <Plus size={16} />
          Add Task
        </button>
        <button onClick={() => setShowAddColumnModal(true)} style={styles.addColumnBtn}>
          <Plus size={16} />
          Add Column
        </button>
        <button 
          onClick={() => setShowDeleteSprintModal(true)} 
          style={{...styles.deleteBtn, padding: '8px 14px'}}
        >
          <Trash2 size={16} />
          Delete Sprint
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              {sprint.columns.map(column => (
                <th key={column.id} style={styles.tableHeader}>
                  {column.label}
                </th>
              ))}
              <th style={styles.tableHeader}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sprint.tasks.map(task => (
              <TableRow
                key={task.id}
                task={task}
                columns={sprint.columns}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                editingCell={editingCell}
                setEditingCell={setEditingCell}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddColumnModal
        isOpen={showAddColumnModal}
        onClose={() => setShowAddColumnModal(false)}
        onAdd={handleAddColumn}
        sprint={sprint}
      />

      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onAdd={handleAddTask}
        sprint={sprint}
      />

      <DeleteSprintModal
        isOpen={showDeleteSprintModal}
        onClose={() => setShowDeleteSprintModal(false)}
        onDelete={handleDeleteSprint}
        sprint={sprint}
      />
    </div>
  );
});