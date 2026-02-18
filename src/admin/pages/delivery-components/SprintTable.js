import React, { useState, useCallback, memo } from 'react';
import { Plus, Trash2, Edit2, X as XIcon } from 'lucide-react';
import { TableRow } from './TableRow';
import { AddColumnModal, AddTaskModal, DeleteSprintModal, DeleteColumnModal, DeleteTaskModal } from './Modals';
import { styles } from './styles';

export const SprintTable = memo(({ 
  sprint, 
  onUpdateTask, 
  onAddTask, 
  onDeleteTask,
  onAddColumn,
  onDeleteSprint,
  onDeleteColumn
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showDeleteSprintModal, setShowDeleteSprintModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleAddTask = useCallback((newTask) => {
    console.log('Adding task to sprint:', sprint.id, 'Task data:', newTask);
    onAddTask(sprint.id, newTask);
  }, [sprint.id, onAddTask]);

  const handleAddColumn = useCallback(async (columnData) => {
    await onAddColumn(sprint.id, columnData);
  }, [sprint.id, onAddColumn]);

  const handleDeleteSprint = useCallback(async () => {
    await onDeleteSprint(sprint.id);
  }, [sprint.id, onDeleteSprint]);

  const handleDeleteColumn = useCallback(async (columnId) => {
    await onDeleteColumn(sprint.id, columnId);
    setColumnToDelete(null);
    setIsEditMode(false);
  }, [sprint.id, onDeleteColumn]);

  const handleDeleteTask = useCallback(async (taskId) => {
    await onDeleteTask(sprint.id, taskId);
    setTaskToDelete(null);
  }, [sprint.id, onDeleteTask]);

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
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowAddTaskModal(true)} style={styles.addTaskBtn}>
            <Plus size={10} />
            Add Task
          </button>
          <button onClick={() => setShowAddColumnModal(true)} style={styles.addColumnBtn}>
            <Plus size={10} />
            Add Column
          </button>
          <button 
            onClick={() => setIsEditMode(!isEditMode)} 
            style={{
              ...styles.addColumnBtn,
              backgroundColor: isEditMode ? '#ef4444' : 'var(--primary-brown)',
              borderColor: isEditMode ? '#ef4444' : 'var(--primary-brown)'
            }}
          >
            {isEditMode ? <XIcon size={10} /> : <Edit2 size={10} />}
            {isEditMode ? 'Cancel Edit' : 'Edit Columns'}
          </button>
        </div>
        <button 
          onClick={() => setShowDeleteSprintModal(true)} 
          style={{...styles.deleteBtn, padding: '4px 8px', fontSize: 10}}
        >
          <Trash2 size={10} style={{marginRight: 4}} />
          Delete Sprint
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              {sprint.columns.map(column => (
                <th key={column.id} style={styles.tableHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{column.label}</span>
                    {isEditMode && column.editable !== false && (
                      <button
                        onClick={() => setColumnToDelete(column)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: '8px'
                        }}
                        title={`Delete ${column.label} column`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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
                onRequestDelete={setTaskToDelete}
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

      <DeleteColumnModal
        isOpen={columnToDelete !== null}
        onClose={() => setColumnToDelete(null)}
        onDelete={handleDeleteColumn}
        column={columnToDelete}
        sprint={sprint}
      />

      <DeleteTaskModal
        isOpen={taskToDelete !== null}
        onClose={() => setTaskToDelete(null)}
        onDelete={handleDeleteTask}
        task={taskToDelete}
        sprint={sprint}
      />
    </div>
  );
});