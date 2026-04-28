import React, { useState, useEffect } from 'react';
import { X, Folder, File } from 'lucide-react';
import { FILE_TYPE_PRESETS } from '../structure/growthStructure';

/**
 * Modal for creating a new folder or file entry inside the Growth tree.
 * The actual file upload happens after creation via the existing FileUploader.
 */
export const CreateItemDialog = ({
  open,
  parentPath = [],
  existingNames = [],
  onClose,
  onCreate,
}) => {
  const [type, setType] = useState('folder');
  const [name, setName] = useState('');
  const [fileType, setFileType] = useState('document');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setType('folder');
      setName('');
      setFileType('document');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (trimmed.includes('/') || trimmed.includes('|') || trimmed.includes('>')) {
      setError('Name cannot contain "/", "|" or ">"');
      return;
    }
    if (existingNames.includes(trimmed)) {
      setError('An item with this name already exists at this level');
      return;
    }
    onCreate({ type, name: trimmed, fileType });
  };

  const parentLabel =
    parentPath.length === 0 ? 'Top level' : parentPath.join(' > ');

  const TypeButton = ({ value, icon: Icon, label }) => {
    const active = type === value;
    return (
      <button
        type="button"
        onClick={() => setType(value)}
        style={{
          flex: 1,
          padding: 12,
          borderRadius: 6,
          border: `2px solid ${active ? 'var(--primary-brown)' : 'var(--medium-brown)'}`,
          background: active ? 'var(--pale-brown)' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          color: 'var(--text-brown)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <Icon size={16} /> {label}
      </button>
    );
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid var(--medium-brown)',
    fontSize: 14,
    boxSizing: 'border-box',
    color: 'var(--text-brown)',
    background: 'white',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          borderRadius: 8,
          padding: 24,
          width: 440,
          maxWidth: '90vw',
          border: '1px solid var(--medium-brown)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-brown)' }}>
            Create New Item
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-brown)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#666' }}>
          Adding to: <strong style={{ color: 'var(--text-brown)' }}>{parentLabel}</strong>
        </p>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-brown)',
              marginBottom: 6,
              display: 'block',
            }}
          >
            Type
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <TypeButton value="folder" icon={Folder} label="Folder" />
            <TypeButton value="file" icon={File} label="File" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-brown)',
              marginBottom: 6,
              display: 'block',
            }}
          >
            {type === 'folder' ? 'Folder name' : 'File name'}
          </label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={type === 'folder' ? 'e.g. My Documents' : 'e.g. Project Plan'}
            style={inputStyle}
          />
        </div>

        {type === 'file' && (
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-brown)',
                marginBottom: 6,
                display: 'block',
              }}
            >
              File type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              style={inputStyle}
            >
              {Object.entries(FILE_TYPE_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#888' }}>
              Maximum file size: 10MB
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: '#c53030', fontSize: 13, margin: '0 0 12px 0' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: '1px solid var(--medium-brown)',
              background: 'white',
              color: 'var(--text-brown)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--primary-brown)',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateItemDialog;
