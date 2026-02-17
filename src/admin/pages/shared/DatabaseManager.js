// partners-components/DatabaseManager.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Database, Search } from 'lucide-react';

export const DatabaseManager = ({ 
  path, 
  itemConfig,
  entries = [],
  onAdd,
  onUpdate,
  onDelete,
  onClose,
  isLoading 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const schema = itemConfig?.schema?.fields || [];

  // Initialize form data
  const initializeForm = useCallback((data = {}) => {
    const initialized = {};
    schema.forEach(field => {
      initialized[field.id] = data[field.id] || (field.type === 'multi-select' ? [] : '');
    });
    return initialized;
  }, [schema]);

  const handleStartAdd = () => {
    setFormData(initializeForm());
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (entry) => {
    setFormData(initializeForm(entry));
    setEditingId(entry.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
  };

  const handleSave = async () => {
    // Validate required fields
    const missingFields = schema
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onAdd(formData);
    }

    handleCancel();
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleMultiSelectChange = (fieldId, option, checked) => {
    setFormData(prev => {
      const current = prev[fieldId] || [];
      return {
        ...prev,
        [fieldId]: checked 
          ? [...current, option]
          : current.filter(item => item !== option)
      };
    });
  };

  // Filter entries based on search
  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schema.some(field => {
      const value = entry[field.id];
      if (!value) return false;
      if (Array.isArray(value)) {
        return value.some(v => v.toLowerCase().includes(searchLower));
      }
      return String(value).toLowerCase().includes(searchLower);
    });
  });

  const renderField = (field) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid var(--medium-brown)',
              borderRadius: 4,
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid var(--medium-brown)',
              borderRadius: 4,
              fontSize: 14
            }}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'multi-select':
        return (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8,
            padding: 8,
            border: '1px solid var(--medium-brown)',
            borderRadius: 4,
            minHeight: 40
          }}>
            {field.options?.map(option => {
              const selected = (value || []).includes(option);
              return (
                <label
                  key={option}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    background: selected ? 'var(--primary-brown)' : 'var(--pale-brown)',
                    color: selected ? 'white' : 'var(--text-brown)',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => handleMultiSelectChange(field.id, option, e.target.checked)}
                    style={{ marginRight: 4 }}
                  />
                  {option}
                </label>
              );
            })}
          </div>
        );

      default:
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid var(--medium-brown)',
              borderRadius: 4,
              fontSize: 14
            }}
          />
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'white',
      borderRadius: 8,
      border: '1px solid var(--medium-brown)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--pale-brown)',
        borderBottom: '1px solid var(--medium-brown)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Database size={18} color="var(--primary-brown)" />
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 16, 
              fontWeight: 600,
              color: 'var(--text-brown)'
            }}>
              {path[path.length - 1]}
            </h3>
            {itemConfig?.description && (
              <p style={{ 
                margin: 0, 
                fontSize: 12, 
                color: '#666',
                marginTop: 2
              }}>
                {itemConfig.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleStartAdd}
            disabled={isAdding || editingId}
            style={{
              padding: '8px 16px',
              background: 'var(--primary-brown)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: (isAdding || editingId) ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: (isAdding || editingId) ? 0.5 : 1
            }}
          >
            <Plus size={14} />
            Add New
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: 'transparent',
              color: 'var(--text-brown)',
              border: '1px solid var(--medium-brown)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      {!isAdding && !editingId && entries.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--medium-brown)' }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: 10, 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#999'
              }} 
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                border: '1px solid var(--medium-brown)',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div style={{ padding: 20 }}>
            <h4 style={{ 
              margin: '0 0 16px 0', 
              fontSize: 14, 
              fontWeight: 600,
              color: 'var(--text-brown)'
            }}>
              {editingId ? 'Edit Entry' : 'Add New Entry'}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {schema.map(field => (
                <div key={field.id}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-brown)'
                  }}>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444' }}> *</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid var(--medium-brown)'
            }}>
              <button
                onClick={handleSave}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'var(--primary-brown)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Save size={16} />
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'transparent',
                  color: 'var(--text-brown)',
                  border: '1px solid var(--medium-brown)',
                  borderRadius: 6,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {!isAdding && !editingId && (
          <div style={{ padding: 20 }}>
            {filteredEntries.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: 40,
                color: '#999'
              }}>
                {entries.length === 0 ? (
                  <>
                    <Database size={48} color="var(--accent-brown)" style={{ marginBottom: 16 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>
                      No entries yet. Click "Add New" to get started.
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 14 }}>
                    No entries match your search.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredEntries.map(entry => (
                  <div
                    key={entry.id}
                    style={{
                      padding: 16,
                      background: 'var(--background-brown)',
                      border: '1px solid var(--medium-brown)',
                      borderRadius: 6
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: 12
                    }}>
                      <h4 style={{ 
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--text-brown)'
                      }}>
                        {entry[schema[0]?.id] || 'Untitled'}
                      </h4>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleStartEdit(entry)}
                          style={{
                            padding: '4px 8px',
                            background: 'var(--primary-brown)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this entry?')) {
                              onDelete(entry.id);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 12
                    }}>
                      {schema.slice(1).map(field => {
                        const value = entry[field.id];
                        if (!value) return null;

                        return (
                          <div key={field.id}>
                            <div style={{ 
                              fontSize: 11,
                              color: '#999',
                              marginBottom: 4,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              {field.label}
                            </div>
                            <div style={{ 
                              fontSize: 13,
                              color: 'var(--text-brown)'
                            }}>
                              {Array.isArray(value) ? value.join(', ') : value}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--medium-brown)',
                      fontSize: 11,
                      color: '#999'
                    }}>
                      Last updated: {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};