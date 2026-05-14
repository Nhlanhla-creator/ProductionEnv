import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import {
  DASHBOARD_OPTIONS, CATEGORY_OPTIONS, STATUS_OPTIONS,
  ACTION_STATUS_OPTIONS, TEST_TYPE_OPTIONS, ASSIGNEE_OPTIONS,
  DASHBOARD_CODE_MAP, CATEGORY_CODE_MAP
} from './qaTableData';

const AddTaskModal = ({ isOpen, onClose, onAddTask, existingTasks }) => {
  const [formData, setFormData] = useState({
    taskId: '',
    category: '',
    dashboard: '',
    section: '',
    taskName: '',
    status: 'Not started',
    dueDate: '',
    testedWhen: '',
    assignedTo: '',
    testType: '',
    actionStatus: 'Not started',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && formData.dashboard && formData.category) {
      const newTaskId = generateTaskId(existingTasks, formData.dashboard, formData.category);
      setFormData(prev => ({ ...prev, taskId: newTaskId }));
    }
  }, [isOpen, existingTasks, formData.dashboard, formData.category]);

  const generateTaskId = (tasks, dashboard, category) => {
    if (!dashboard || !category) {
      return '';
    }

    // Get codes from mappings
    const dashboardCode = DASHBOARD_CODE_MAP[dashboard];
    const categoryCode = CATEGORY_CODE_MAP[category];

    if (!dashboardCode || !categoryCode) {
      return '';
    }

    // Create prefix from codes
    const prefix = `${dashboardCode}-${categoryCode}-`;

    if (!tasks || tasks.length === 0) {
      return `${prefix}01`;
    }

    // Collect all existing numbers for this prefix
    const existingNumbers = new Set();
    tasks.forEach(task => {
      if (task.taskId && task.taskId.trim() && task.taskId.startsWith(prefix)) {
        const match = task.taskId.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          existingNumbers.add(num);
        }
      }
    });

    // Find the first available number starting from 01
    let nextNum = 1;
    while (existingNumbers.has(nextNum)) {
      nextNum++;
    }

    const paddedNum = String(nextNum).padStart(2, '0');
    return `${prefix}${paddedNum}`;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Mandatory fields
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.dashboard) newErrors.dashboard = 'Dashboard is required';
    if (!formData.taskName) newErrors.taskName = 'Task name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onAddTask(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          border: '1px solid #e6d7c3',
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#4a352f' }}>Add New Task</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Task ID Preview */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
              Task ID (Auto-generated)
            </label>
            <div
              style={{
                padding: '8px 12px',
                border: '1px solid #e6d7c3',
                borderRadius: 6,
                backgroundColor: '#f5f0e1',
                fontSize: 14,
                fontWeight: 600,
                color: '#a67c52',
              }}
            >
              {formData.taskId}
            </div>
          </div>

          {/* Mandatory Fields */}
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f9faf2', borderRadius: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#a67c52', marginBottom: 12 }}>
              * Mandatory Fields
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.category ? '#ef4444' : '#e6d7c3'}`,
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.category && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.category}</div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                Dashboard *
              </label>
              <select
                value={formData.dashboard}
                onChange={(e) => handleChange('dashboard', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.dashboard ? '#ef4444' : '#e6d7c3'}`,
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: '#fff',
                }}
              >
                <option value="">Select dashboard</option>
                {DASHBOARD_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {errors.dashboard && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.dashboard}</div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                Task Name *
              </label>
              <input
                type="text"
                value={formData.taskName}
                onChange={(e) => handleChange('taskName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.taskName ? '#ef4444' : '#e6d7c3'}`,
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: '#fff',
                }}
                placeholder="Enter task name"
              />
              {errors.taskName && (
                <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.taskName}</div>
              )}
            </div>
          </div>

          {/* Optional Fields */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
              Optional Fields
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => handleChange('section', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6d7c3',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                  placeholder="Section"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6d7c3',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6d7c3',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                  Tested When
                </label>
                <input
                  type="date"
                  value={formData.testedWhen}
                  onChange={(e) => handleChange('testedWhen', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6d7c3',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                  Assigned To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6d7c3',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="">Select assignee</option>
                  {ASSIGNEE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                  Test Type
                </label>
                <select
                  value={formData.testType}
                  onChange={(e) => handleChange('testType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e6d7c3',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="">Select test type</option>
                  {TEST_TYPE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a352f', marginBottom: 6 }}>
                Action Status
              </label>
              <select
                value={formData.actionStatus}
                onChange={(e) => handleChange('actionStatus', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e6d7c3',
                  borderRadius: 6,
                  fontSize: 13,
                  outline: 'none',
                  backgroundColor: '#fff',
                }}
              >
                {ACTION_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 20px',
                background: '#fff',
                color: '#4a352f',
                border: '1px solid #e6d7c3',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                background: '#a67c52',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
