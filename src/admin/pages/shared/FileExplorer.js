import React, { memo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  File,
  ClipboardList,
  Table,
  Plus,
  Trash2,
  FolderPlus
} from 'lucide-react';

const FileExplorerItem = memo(({
  name,
  item,
  level = 0,
  path = [],
  expandedFolders,
  selectedPath,
  onToggleFolder,
  onSelectItem,
  onAddItem,
  onDeleteItem,
  contentStatus
}) => {
  const [hovered, setHovered] = useState(false);
  const currentPath = [...path, name];
  const pathKey     = currentPath.join(' > ');
  const isExpanded  = expandedFolders[pathKey];
  const isSelected  = selectedPath?.join(' > ') === pathKey;
  const isFolder    = item.type === 'folder';
  const isChecklist  = item.type === 'checklist';
  const isQATable    = item.type === 'qa-table';
  const hasContent  = contentStatus[pathKey];
  const isCustom    = !!item._custom;
  const showActions = hovered || isSelected;

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(currentPath);
    } else {
      onSelectItem(currentPath, item);
    }
  };

  // Label helper: strip leading "N_" prefix for display
  const displayName = name.replace(/^\d+_/, '');

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          paddingLeft: `${level * 20 + 12}px`,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          background: isSelected ? 'var(--primary-brown)' : 'transparent',
          color: isSelected ? 'white' : 'var(--text-brown)',
          transition: 'all 0.15s',
          userSelect: 'none'
        }}
        onMouseEnter={e => { setHovered(true); if (!isSelected) e.currentTarget.style.background = 'var(--pale-brown)'; }}
        onMouseLeave={e => { setHovered(false); if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Expand / chevron */}
        {isFolder ? (
          <div style={{ width: 16, display: 'flex', alignItems: 'center' }}>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        ) : (
          <div style={{ width: 16 }} />
        )}

        {/* Icon */}
        {isFolder ? (
          isExpanded
            ? <FolderOpen size={18} color={isSelected ? 'white' : 'var(--primary-brown)'} />
            : <Folder    size={18} color={isSelected ? 'white' : 'var(--primary-brown)'} />
        ) : isChecklist ? (
          <ClipboardList size={18} color={isSelected ? 'white' : '#a67c52'} />
        ) : isQATable ? (
          <Table size={18} color={isSelected ? 'white' : '#a67c52'} />
        ) : item.type === 'text' ? (
          <FileText size={18} color={isSelected ? 'white' : 'var(--accent-brown)'} />
        ) : (
          <File size={18} color={isSelected ? 'white' : 'var(--accent-brown)'} />
        )}

        {/* Name */}
        <span style={{
          flex: 1,
          fontSize: 14,
          fontWeight: isFolder ? 500 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {displayName}
        </span>

        {/* Add child (folders only) */}
        {isFolder && onAddItem && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddItem(currentPath); }}
            title="Add folder or file inside"
            style={{
              opacity: 0.55,
              transition: 'opacity 0.15s',
              padding: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSelected ? 'white' : 'var(--text-brown)',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4
            }}
          >
            <Plus size={14} />
          </button>
        )}

        {/* Delete (custom items only) */}
        {isCustom && onDeleteItem && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteItem(currentPath, item); }}
            title="Delete"
            style={{
              opacity: 1,
              transition: 'opacity 0.15s',
              padding: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSelected ? 'white' : '#c53030',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4
            }}
          >
            <Trash2 size={14} />
          </button>
        )}

        {/* Dot indicator for file content */}
        {!isFolder && !isChecklist && !isQATable && hasContent && (
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? 'white' : 'var(--primary-brown)', marginLeft: 4 }} />
        )}
      </div>

      {/* Children */}
      {isFolder && isExpanded && item.items && (
        <div>
          {Object.entries(item.items)
            .filter(([childName]) => childName !== '_placeholder' || Object.keys(item.items).length === 1)
            .map(([childName, childItem]) => (
              childName === '_placeholder' ? (
                // Placeholder folder items — show disabled label
                <div
                  key={childName}
                  style={{
                    paddingLeft: `${(level + 1) * 20 + 12}px`,
                    paddingTop: 6, paddingBottom: 6,
                    fontSize: 12, color: '#bbb', fontStyle: 'italic'
                  }}
                >
                  Managed separately
                </div>
              ) : (
                <FileExplorerItem
                  key={childName}
                  name={childName}
                  item={childItem}
                  level={level + 1}
                  path={currentPath}
                  expandedFolders={expandedFolders}
                  selectedPath={selectedPath}
                  onToggleFolder={onToggleFolder}
                  onSelectItem={onSelectItem}
                  onAddItem={onAddItem}
                  onDeleteItem={onDeleteItem}
                  contentStatus={contentStatus}
                />
              )
            ))}
        </div>
      )}
    </div>
  );
});

export const FileExplorer = memo(({
  structure,
  expandedFolders,
  selectedPath,
  onToggleFolder,
  onSelectItem,
  onAddItem,
  onDeleteItem,
  contentStatus = {}
}) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      border: '1px solid var(--medium-brown)',
      overflow: 'auto',
      maxHeight: 'calc(100vh - 200px)'
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'var(--pale-brown)',
        borderBottom: '1px solid var(--medium-brown)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-brown)' }}>
          Working Repository
        </span>
        {onAddItem && (
          <button
            onClick={() => onAddItem([])}
            title="Add a top-level folder or file"
            style={{
              padding: '6px 10px',
              background: 'var(--primary-brown)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <FolderPlus size={14} /> New
          </button>
        )}
      </div>

      <div style={{ padding: '8px 0' }}>
        {Object.entries(structure).map(([name, item]) => (
          <FileExplorerItem
            key={name}
            name={name}
            item={item}
            level={0}
            path={[]}
            expandedFolders={expandedFolders}
            selectedPath={selectedPath}
            onToggleFolder={onToggleFolder}
            onSelectItem={onSelectItem}
            onAddItem={onAddItem}
            onDeleteItem={onDeleteItem}
            contentStatus={contentStatus}
          />
        ))}
      </div>
    </div>
  );
});