import React, { useState, useCallback, memo } from 'react';
import { Save, X } from 'lucide-react';
import { STATUSES, STATUS_COLORS, CATEGORY_COLORS, CATEGORIES, ASSIGNEES } from './constants';
import { styles } from './styles';

export const EditableCell = memo(({ 
  value, 
  columnType,
  columnId,
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
            background: STATUS_COLORS[value] || '#6b7280'
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
                background: CATEGORY_COLORS[item] || '#6b7280'
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
    return (
      <div style={styles.editControls} className="edit-controls-wrapper" onClick={(e) => e.stopPropagation()}>
        <select
          value={editValue || 'Not started'}
          onChange={(e) => setEditValue(e.target.value)}
          style={styles.editInput}
        >
          {STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
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
    // Determine which options to show based on column ID
    const options = columnId === 'assignee' ? ASSIGNEES : CATEGORIES;

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