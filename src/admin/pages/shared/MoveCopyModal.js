import React, { useState, useMemo } from 'react';
import { X, Folder, AlertCircle } from 'lucide-react';

/**
 * Helper to recursively list all folders in the structure tree.
 */
const getFolderList = (structure, currentPath = [], list = []) => {
  // If list is empty, always ensure the root "/" option exists
  if (list.length === 0) {
    list.push({ path: [], label: '/' });
  }

  for (const [name, item] of Object.entries(structure || {})) {
    if (item.type === 'folder') {
      const fullPath = [...currentPath, name];
      list.push({ path: fullPath, label: '/' + fullPath.join('/') });
      getFolderList(item.items || {}, fullPath, list);
    }
  }
  return list;
};

/**
 * Modal to select a target parent folder for Move or Copy actions.
 */
export const MoveCopyModal = ({
  isOpen,
  onClose,
  action, // 'move' or 'copy'
  itemName,
  itemPath,
  structure,
  onSubmit
}) => {
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);

  // Compute allowed folders (excluding the item itself and any of its children)
  const allowedFolders = useMemo(() => {
    if (!structure) return [];
    const allFolders = getFolderList(structure);
    
    // Filter out item path itself and its descendants
    return allFolders.filter(folder => {
      // Root is always allowed unless the item itself is at root
      if (itemPath.length === 0) return false;
      
      // If folder path starts with itemPath, it's the item itself or a descendant
      const isDescendantOrSelf = folder.path.length >= itemPath.length &&
        itemPath.every((seg, idx) => folder.path[idx] === seg);
        
      return !isDescendantOrSelf;
    });
  }, [structure, itemPath]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const target = allowedFolders[selectedPathIndex];
    if (target) {
      onSubmit(target.path);
    }
  };

  const actionLabel = action === 'move' ? 'Move' : 'Copy';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '100%',
        maxWidth: 450,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        border: '1px solid var(--medium-brown)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0e6d9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#faf6f0'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-brown)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Folder size={18} />
            {actionLabel} "{itemName.replace(/^\d+_/, '')}"
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#666',
              marginBottom: 8
            }}>
              Select target destination folder:
            </label>
            
            {allowedFolders.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                background: '#fef2f2',
                borderRadius: 6,
                border: '1px solid #fee2e2',
                color: '#ef4444',
                fontSize: 13
              }}>
                <AlertCircle size={16} />
                No destination folders available.
              </div>
            ) : (
              <select
                value={selectedPathIndex}
                onChange={(e) => setSelectedPathIndex(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--medium-brown)',
                  fontSize: 14,
                  outline: 'none',
                  color: 'var(--text-brown)',
                  backgroundColor: '#fff'
                }}
              >
                {allowedFolders.map((folder, idx) => (
                  <option key={idx} value={idx}>
                    {folder.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid #f0e6d9',
            paddingTop: 16
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--medium-brown)',
                background: 'transparent',
                color: 'var(--text-brown)',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={allowedFolders.length === 0}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'var(--primary-brown)',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: allowedFolders.length === 0 ? 0.5 : 1
              }}
            >
              Confirm {actionLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoveCopyModal;
