import React, { useState, useCallback, memo } from 'react';
import { Plus } from 'lucide-react';
import { TableRow } from './TableRow';
import { styles } from './styles';

export const SprintTable = memo(({ 
  sprint, 
  onUpdateTask, 
  onAddTask, 
  onDeleteTask,
  onAddColumn 
}) => {
  const [editingCell, setEditingCell] = useState(null);

  const handleAddTask = useCallback(() => {
    const newTaskId = `SP${sprint.id}.${sprint.tasks.length + 1}`;
    const newTask = { id: newTaskId };
    
    sprint.columns.forEach(col => {
      if (col.type === 'multi-select') {
        newTask[col.id] = [];
      } else if (col.type === 'select') {
        newTask[col.id] = 'Not started';
      } else {
        newTask[col.id] = '';
      }
    });
    
    onAddTask(sprint.id, newTask);
  }, [sprint, onAddTask]);

  const handleAddColumn = useCallback(() => {
    const columnName = prompt('Enter column name:');
    if (!columnName) return;
    
    const columnType = prompt('Enter column type (text/select/multi-select/date):');
    if (!['text', 'select', 'multi-select', 'date'].includes(columnType)) {
      alert('Invalid column type');
      return;
    }

    onAddColumn(sprint.id, {
      id: columnName.toLowerCase().replace(/\s+/g, '_'),
      label: columnName,
      type: columnType,
      editable: true
    });
  }, [sprint.id, onAddColumn]);

  if (!sprint.columns || sprint.columns.length === 0) {
    return (
      <div style={styles.emptyTable}>
        <p style={styles.emptyTableText}>No table structure defined for this sprint</p>
        <button onClick={handleAddColumn} style={styles.addColumnBtn}>
          <Plus size={16} />
          Add Column
        </button>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <div style={styles.tableControls}>
        <button onClick={handleAddTask} style={styles.addTaskBtn}>
          <Plus size={16} />
          Add Task
        </button>
        <button onClick={handleAddColumn} style={styles.addColumnBtn}>
          <Plus size={16} />
          Add Column
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
    </div>
  );
});