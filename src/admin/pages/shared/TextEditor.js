// growth-components/TextEditor.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, FileText } from 'lucide-react';

export const TextEditor = ({ 
  path, 
  itemConfig,
  content, 
  onSave, 
  onClose,
  isSaving 
}) => {
  const [text, setText] = useState(content?.content || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setText(content?.content || '');
    setHasChanges(false);
  }, [content]);

  const handleSave = useCallback(() => {
    onSave(text);
    setHasChanges(false);
  }, [text, onSave]);

  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
    setHasChanges(true);
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

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
          <FileText size={18} color="var(--primary-brown)" />
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
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            style={{
              padding: '8px 16px',
              background: hasChanges && !isSaving ? 'var(--primary-brown)' : '#e0e0e0',
              color: hasChanges && !isSaving ? 'white' : '#999',
              border: 'none',
              borderRadius: 6,
              cursor: hasChanges && !isSaving ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save'}
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

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={itemConfig?.placeholder || 'Start typing...'}
          style={{
            flex: 1,
            padding: 20,
            border: 'none',
            outline: 'none',
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'inherit',
            resize: 'none',
            color: 'var(--text-brown)'
          }}
        />

        {/* Footer Stats */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--background-brown)',
          borderTop: '1px solid var(--medium-brown)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#666'
        }}>
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          {content?.updatedAt && (
            <span>Last saved: {new Date(content.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};