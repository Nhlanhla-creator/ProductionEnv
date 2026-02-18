import React, { useState, useCallback, memo } from 'react';
import { Save, X } from 'lucide-react';
import { styles } from './styles';

export const EditableCell = memo(({ 
  value, 
  columnType,
  columnId,
  columnOptions,
  isEditing, 
  onSave, 
  onCancel 
}) => {
  const [editValue, setEditValue] = useState(value);

  const handleSave = useCallback(() => {
    onSave(editValue);
  }, [editValue, onSave]);

  if (!isEditing) {
    if (columnType === 'select') {
      return (
        <span 
          style={{
            ...styles.statusBadge,
            background: value === 'Done' ? '#10b981' : value === 'In Progress' ? '#f59e0b' : value === 'Blocked' ? '#ef4444' : '#6b7280'
          }}
        >
          {value || 'Not started'}
        </span>
      );
    }
    
    if (columnType === 'multi-select') {
      const items = Array.isArray(value) ? value : [];
      return (
        <div style={styles.multiSelectDisplay}>
          {items.map((item, idx) => (
            <span 
              key={idx}
              style={{
                ...styles.categoryBadge,
                background: '#3b82f6'
              }}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    return <span>{value || '-'}</span>;
  }

  // Editing mode
  if (columnType === 'select') {
    // Use column options or fallback options
    const getFallbackOptions = () => {
      if (columnId === 'status') {
        return ["Not started", "In Progress", "Done", "Blocked"];
      }
      return [];
    };
    const options = columnOptions || getFallbackOptions();
    
    return (
      <div style={styles.editControls} className="edit-controls-wrapper" onClick={(e) => e.stopPropagation()}>
        <select
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          style={styles.editInput}
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} />
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  if (columnType === 'multi-select') {
    const selectedItems = Array.isArray(editValue) ? editValue : [];
    const getFallbackOptions = () => {
      if (columnId === 'assignee') {
        return ["Nhlanhla Msomi", "Lerato Nama", "Makha", "Lindelani", "Thando", "Sbonelo", "Lethabo"];
      } else if (columnId === 'category') {
        return ["Frontend", "Backend", "QA", "Security", "Traction", "Funding", "Design", "DevOps"];
      }
      return [];
    };
    const options = columnOptions || getFallbackOptions();

    return (
      <div style={styles.editControls} className="edit-controls-wrapper" onClick={(e) => e.stopPropagation()}>
        <div style={styles.multiSelectEdit}>
          {options.map(option => (
            <label key={option} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedItems.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditValue([...selectedItems, option]);
                  } else {
                    setEditValue(selectedItems.filter(item => item !== option));
                  }
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} />
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  if (columnType === 'date') {
    return (
      <div style={styles.editControls} className="edit-controls-wrapper" onClick={(e) => e.stopPropagation()}>
        <input
          type="date"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          style={styles.editInput}
        />
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} />
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          <X size={14} />
        </button>
      </div>
    );
  }

  // Default text input
  return (
    <div style={styles.editControls} className="edit-controls-wrapper" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        value={editValue || ''}
        onChange={(e) => setEditValue(e.target.value)}
        style={styles.editInput}
        autoFocus
      />
      <button onClick={handleSave} style={styles.saveBtn}>
        <Save size={14} />
      </button>
      <button onClick={onCancel} style={styles.cancelBtn}>
        <X size={14} />
      </button>
    </div>
  );
});