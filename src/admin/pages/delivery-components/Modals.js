import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { styles } from './styles';
import { CATEGORIES, ASSIGNEES, STATUSES } from './constants';

// ============================================================================
// ADD COLUMN MODAL
// ============================================================================
export const AddColumnModal = ({ isOpen, onClose, onAdd, sprint }) => {
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState('text');
  const [options, setOptions] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setColumnName('');
    setColumnType('text');
    setOptions(['']);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!columnName.trim()) return;

    setIsLoading(true);
    
    const columnData = {
      id: columnName.toLowerCase().replace(/\s+/g, '_'),
      label: columnName.trim(),
      type: columnType,
      editable: true
    };

    // Add options for select/multi-select types
    if ((columnType === 'select' || columnType === 'multi-select') && options.filter(opt => opt.trim()).length > 0) {
      columnData.options = options.filter(opt => opt.trim());
    }

    try {
      await onAdd(columnData);
      handleClose();
    } catch (error) {
      console.error('Failed to add column:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2>Add New Column</h2>
          <button onClick={handleClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={{...styles.formGroup, padding: 16}}>
            <label style={styles.formLabel}>Column Name</label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="Enter column name"
              style={styles.formInput}
              required
            />
          </div>

          <div style={{...styles.formGroup, padding: 16}}> 
            <label style={styles.formLabel}>Column Type</label>
            <select
              value={columnType}
              onChange={(e) => setColumnType(e.target.value)}
              style={styles.formSelect}
            >
              <option value="text">Text</option>
              <option value="select">Single Select</option>
              <option value="multi-select">Multi Select</option>
              <option value="date">Date</option>
            </select>
          </div>

          {(columnType === 'select' || columnType === 'multi-select') && (
            <div style={{...styles.formGroup, padding: 16}}>
              <label style={styles.formLabel}>
                Options
                <button
                  type="button"
                  onClick={handleAddOption}
                  style={styles.addOptionBtn}
                >
                  <Plus size={14} />
                  Add Option
                </button>
              </label>
              {options.map((option, index) => (
                <div key={index} style={{...styles.optionRow, padding: 0}}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={styles.formInput}
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      style={styles.removeOptionBtn}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{...styles.modalActions, padding: 16}}>
            <button
              type="button"
              onClick={handleClose}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveButton}
              disabled={isLoading || !columnName.trim()}
            >
              {isLoading ? 'Adding...' : 'Add Column'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// DELETE SPRINT MODAL
// ============================================================================
export const DeleteSprintModal = ({ isOpen, onClose, onDelete, sprint }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setPasscode('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passcode !== 'admin123') {
      setError('Invalid passcode. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onDelete(sprint.id);
      handleClose();
    } catch (error) {
      setError('Failed to delete sprint. Please try again.');
      console.error('Failed to delete sprint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            <h2>Delete Sprint</h2>
          </div>
          <button onClick={handleClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.modalContent}>
          <div style={styles.warningBox}>
            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
              Are you sure you want to delete this sprint?
            </p>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
              <strong>{sprint.name}</strong> - {sprint.subtitle}
            </p>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
              This action cannot be undone and will delete all associated tasks.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.modalForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Enter Admin Passcode
                <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode to confirm deletion"
                style={styles.formInput}
                required
              />
              {error && (
                <p style={styles.errorMessage}>{error}</p>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={handleClose}
                style={styles.cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.saveButton,
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444'
                }}
                disabled={isLoading || !passcode}
              >
                {isLoading ? 'Deleting...' : 'Delete Sprint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DELETE COLUMN MODAL
// ============================================================================
export const DeleteColumnModal = ({ isOpen, onClose, onDelete, column, sprint }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmText.toLowerCase() !== 'delete') {
      setError('Please type "DELETE" to confirm.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onDelete(column.id);
      handleClose();
    } catch (error) {
      setError('Failed to delete column. Please try again.');
      console.error('Failed to delete column:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !column) return null;

  const taskCount = sprint?.tasks?.length || 0;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
            <h2>Delete Column</h2>
          </div>
          <button onClick={handleClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div style={styles.modalContent}>
          <div style={styles.warningBox}>
            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
              Are you sure you want to delete {column.label}?
            </p>
            <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: '14px' }}>
              This will permanently delete this column and all its data from {taskCount} task{taskCount !== 1 ? 's' : ''}.
            </p>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '13px' }}>
              This action cannot be undone.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.modalForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                placeholder="Type DELETE"
                style={{
                  ...styles.formInput,
                  borderColor: error ? '#ef4444' : '#e5e7eb'
                }}
                autoFocus
              />
              {error && (
                <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>
                  {error}
                </p>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={handleClose}
                style={styles.cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.saveButton,
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444'
                }}
                disabled={isLoading || !confirmText}
              >
                {isLoading ? 'Deleting...' : 'Delete Column'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DELETE TASK MODAL
// ============================================================================
export const DeleteTaskModal = ({ isOpen, onClose, onDelete, task, sprint }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (confirmText.toUpperCase() !== task.id) {
      setError('Type "' + task.id + '" to confirm.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onDelete(task.id);
      handleClose();
    } catch (error) {
      setError('Failed to delete task. Please try again.');
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  // Get task name/action for display
  const taskName = task.action || task.id || 'Unnamed task';

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
            <h2>Delete Task {task.id}</h2>
          </div>
          <button onClick={handleClose} style={styles.closeButton}>
            <X size={16} />
          </button>
        </div>

        <div style={styles.modalContent}>
          <div style={styles.warningBox}>
            <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>
              Are you sure you want to delete this task?
            </p>
            <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '14px' }}>
              <strong>{task.id}</strong>: {taskName}
            </p>
            <p style={{ margin: '8px 0 0', color: '#ef4444', fontSize: '12px'}}>
              This action cannot be undone.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={styles.modalForm}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Type <strong>{task.id}</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                placeholder={task.id}
                style={{
                  ...styles.formInput,
                  borderColor: error ? '#ef4444' : '#e5e7eb'
                }}
                autoFocus
              />
              {error && (
                <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>
                  {error}
                </p>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={handleClose}
                style={styles.cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.saveButton,
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444'
                }}
                disabled={isLoading || !confirmText}
              >
                {isLoading ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ADD TASK MODAL - FIXED VERSION
// ============================================================================
export const AddTaskModal = ({ isOpen, onClose, onAdd, sprint }) => {
  const [taskData, setTaskData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && sprint) {
      const initialData = {};
      
      sprint.columns.forEach(col => {
        if (col.type === 'multi-select') {
          initialData[col.id] = [];
        } else if (col.type === 'select') {
          const options = col.options || STATUSES;
          initialData[col.id] = options[0] || 'Not started';
        } else if (col.type === 'date') {
          initialData[col.id] = new Date().toISOString().split('T')[0];
        } else {
          initialData[col.id] = '';
        }
      });
      
      setTaskData(initialData);
    } else {
      // Clear data when modal closes
      setTaskData({});
    }
  }, [isOpen, sprint]);

  const handleClose = () => {
    setTaskData({});
    onClose();
  };

  const handleFieldChange = (columnId, value) => {
    setTaskData(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      // Generate ID
      const existingTaskNumbers = (sprint.tasks || [])
        .map(task => {
          const match = task.id.match(/SP(\d+)\.(\d+)/);
          return match ? parseInt(match[2]) : 0;
        })
        .filter(num => num > 0);
      
      const nextTaskNumber = existingTaskNumbers.length > 0 ? Math.max(...existingTaskNumbers) + 1 : 1;
      const taskId = `SP${sprint.id}.${nextTaskNumber}`;
      
      // Merge with generated ID - USE CURRENT taskData, not re-initialized
      const newTask = {
        ...taskData,
        id: taskId
      };

      // Debug log to verify data
      console.log('Adding new task:', newTask);

      await onAdd(newTask);
      handleClose(); // This will clear the form
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2>Add New Task</h2>
          <button onClick={handleClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{...styles.modalForm, padding: 16}}>
          {/* Warning about custom options */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'start'
          }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: '#92400e' }}>
              <strong>Note:</strong> Custom options for multi-select and single-select fields cannot be changed after the column is created. Make sure to set them up correctly when adding columns.
            </div>
          </div>

          {sprint.columns.filter(col => col.id !== 'id').map(column => {
            return (
              <div key={column.id} style={styles.formGroup}>
                <label style={styles.formLabel}>{column.label}</label>
                {column.type === 'select' ? (
                  <select
                    value={taskData[column.id] || ''}
                    onChange={(e) => handleFieldChange(column.id, e.target.value)}
                    style={styles.formSelect}
                    required={column.id === 'action'}
                  >
                    {(column.options || STATUSES).map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : column.type === 'multi-select' ? (
                  <div style={styles.multiSelectContainer}>
                    {(column.options || (column.id === 'category' ? CATEGORIES : ASSIGNEES)).map(option => (
                      <label key={option} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={taskData[column.id]?.includes(option) || false}
                          onChange={(e) => {
                            const currentValues = taskData[column.id] || [];
                            if (e.target.checked) {
                              handleFieldChange(column.id, [...currentValues, option]);
                            } else {
                              handleFieldChange(column.id, currentValues.filter(v => v !== option));
                            }
                          }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={column.type === 'date' ? 'date' : 'text'}
                    value={taskData[column.id] || ''}
                    onChange={(e) => handleFieldChange(column.id, e.target.value)}
                    placeholder={`Enter ${column.label.toLowerCase()}`}
                    style={styles.formInput}
                    required={column.id === 'action'}
                  />
                )}
              </div>
            );
          })}

          <div style={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              style={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};