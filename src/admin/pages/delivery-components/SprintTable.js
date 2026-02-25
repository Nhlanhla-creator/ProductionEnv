import React, { useState, useCallback, useMemo, memo } from 'react';
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

  // Filter state - QA style
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');

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

  // Extract unique values from tasks for filters
  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    sprint.tasks.forEach(task => {
      if (Array.isArray(task.category)) {
        task.category.forEach(cat => cats.add(cat));
      } else if (task.category) {
        cats.add(task.category);
      }
    });
    return Array.from(cats).sort();
  }, [sprint.tasks]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set();
    sprint.tasks.forEach(task => {
      if (Array.isArray(task.assignee)) {
        task.assignee.forEach(person => assignees.add(person));
      } else if (task.assignee) {
        assignees.add(task.assignee);
      }
    });
    return Array.from(assignees).sort();
  }, [sprint.tasks]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    sprint.tasks.forEach(task => {
      if (task.status) statuses.add(task.status);
    });
    return Array.from(statuses).sort();
  }, [sprint.tasks]);

  // Filter tasks - QA style with search
  const filteredTasks = useMemo(() => {
    return sprint.tasks.filter(task => {
      // Category filter
      if (filterCategory !== 'All') {
        if (Array.isArray(task.category)) {
          if (!task.category.includes(filterCategory)) return false;
        } else if (task.category !== filterCategory) {
          return false;
        }
      }

      // Assignee filter
      if (filterAssignee !== 'All') {
        if (Array.isArray(task.assignee)) {
          if (!task.assignee.includes(filterAssignee)) return false;
        } else if (task.assignee !== filterAssignee) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== 'All' && task.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (search && !Object.values(task).some(v => 
        String(v).toLowerCase().includes(search.toLowerCase())
      )) {
        return false;
      }

      return true;
    });
  }, [sprint.tasks, filterCategory, filterAssignee, filterStatus, search]);

  const hasActiveFilters = filterCategory !== 'All' || filterAssignee !== 'All' || filterStatus !== 'All';

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

      {/* Filter Controls - QA Style */}
      <div style={styles.filterBar}>
        {/* Search */}
        <input
          placeholder="Search tasks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        {/* Category filter */}
        {uniqueCategories.length > 0 && (
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            style={styles.filterSelect}
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {/* Assignee filter */}
        {uniqueAssignees.length > 0 && (
          <select 
            value={filterAssignee} 
            onChange={e => setFilterAssignee(e.target.value)} 
            style={styles.filterSelect}
          >
            <option value="All">All Assignees</option>
            {uniqueAssignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
        )}

        {/* Status filter */}
        {uniqueStatuses.length > 0 && (
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            style={styles.filterSelect}
          >
            <option value="All">All Status</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        )}
      </div>

      {/* Active Filter Chips - QA Style */}
      {hasActiveFilters && (
        <div style={styles.filterChipsContainer}>
          {filterCategory !== 'All' && (
            <span style={styles.filterChip}>
              Category: {filterCategory}
              <button 
                onClick={() => setFilterCategory('All')} 
                style={styles.filterChipClose}
              >
                ×
              </button>
            </span>
          )}
          {filterAssignee !== 'All' && (
            <span style={styles.filterChip}>
              Assignee: {filterAssignee}
              <button 
                onClick={() => setFilterAssignee('All')} 
                style={styles.filterChipClose}
              >
                ×
              </button>
            </span>
          )}
          {filterStatus !== 'All' && (
            <span style={styles.filterChip}>
              Status: {filterStatus}
              <button 
                onClick={() => setFilterStatus('All')} 
                style={styles.filterChipClose}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

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
            {filteredTasks.length === 0 ? (
              <tr>
                <td 
                  colSpan={sprint.columns.length + 1} 
                  style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: 'var(--accent-brown)',
                    fontSize: 14
                  }}
                >
                  {sprint.tasks.length === 0 
                    ? 'No tasks in this sprint yet'
                    : 'No tasks match the current filters'
                  }
                </td>
              </tr>
            ) : (
              filteredTasks.map(task => (
                <TableRow
                  key={task.id}
                  task={task}
                  columns={sprint.columns}
                  onUpdateTask={onUpdateTask}
                  onRequestDelete={setTaskToDelete}
                  editingCell={editingCell}
                  setEditingCell={setEditingCell}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Task count footer - QA style */}
      <p style={styles.taskCountFooter}>
        Showing {filteredTasks.length} of {sprint.tasks.length} tasks
        {hasActiveFilters && ' · Click × on chips to clear filters'}
      </p>

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