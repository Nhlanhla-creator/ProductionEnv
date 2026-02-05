import React, { useCallback, memo } from 'react';
import { Trash2 } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { styles } from './styles';

export const TableRow = memo(({ 
  task, 
  columns, 
  onUpdateTask, 
  onDeleteTask,
  editingCell,
  setEditingCell
}) => {
  const handleCellClick = useCallback((columnId) => {
    const column = columns.find(col => col.id === columnId);
    if (column && column.editable) {
      setEditingCell(`${task.id}-${columnId}`);
    }
  }, [columns, task.id, setEditingCell]);

  const handleSave = useCallback((columnId, newValue) => {
    onUpdateTask(task.id, columnId, newValue);
    setEditingCell(null);
  }, [task.id, onUpdateTask, setEditingCell]);

  const handleCancel = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);

  return (
    <tr style={styles.tableRow}>
      {columns.map(column => {
        const cellKey = `${task.id}-${column.id}`;
        const isEditing = editingCell === cellKey;
        
        return (
          <td 
            key={column.id} 
            style={styles.tableCell}
            onClick={() => !isEditing && handleCellClick(column.id)}
          >
            <EditableCell
              value={task[column.id]}
              columnType={column.type}
              columnId={column.id}
              isEditing={isEditing}
              onSave={(newValue) => handleSave(column.id, newValue)}
              onCancel={handleCancel}
            />
          </td>
        );
      })}
      <td style={styles.tableCell}>
        <button
          onClick={() => onDeleteTask(task.id)}
          style={styles.deleteBtn}
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
});