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
  FolderPlus,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Edit2
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
  onRenameItem,
  contentStatus,
  activityDots
}) => {
  const [hovered, setHovered] = useState(false);
  const currentPath = [...path, name];
  const pathKey     = currentPath.join(' > ');
  const isExpanded  = expandedFolders[pathKey];
  const isSelected  = selectedPath?.join(' > ') === pathKey;
  const isFolder    = item.type === 'folder';
  const isChecklist  = item.type === 'checklist';
  const isQATable    = item.type === 'qa-table' || item.type === 'table' || item.type === 'database';
  const hasContent  = contentStatus[pathKey];
  const isCustom    = !!item._custom;
  const showActions = hovered || isSelected;

  // Label helper: strip leading "N_" prefix for display
  const displayName = name.replace(/^\d+_/, '');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(displayName);

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(currentPath);
    } else {
      onSelectItem(currentPath, item);
    }
  };

  const handleSaveRename = () => {
    setIsEditing(false);
    const trimmed = editName.trim();
    if (trimmed && trimmed !== displayName) {
      const match = name.match(/^(\d+_)/);
      const prefix = match ? match[1] : '';
      onRenameItem(currentPath, prefix + trimmed);
    }
  };

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
        {isEditing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveRename();
              if (e.key === 'Escape') { setEditName(displayName); setIsEditing(false); }
            }}
            onClick={e => e.stopPropagation()}
            autoFocus
            style={{
              flex: 1,
              fontSize: 14,
              padding: '2px 6px',
              border: '1px solid var(--primary-brown)',
              borderRadius: 4,
              color: 'black',
              background: 'white'
            }}
          />
        ) : (
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
        )}

        {/* Rename */}
        {onRenameItem && !isEditing && (
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditName(displayName); }}
            title="Rename"
            style={{
              opacity: hovered || isSelected ? 0.75 : 0,
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
            <Edit2 size={14} />
          </button>
        )}

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

        {/* Delete */}
        {onDeleteItem && (
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

        {/* Pulsing activity dot for new sprint items in QA Master Table or folders */}
        {activityDots && (() => {
          const hasActivity = [...activityDots].some(dotPath => dotPath === pathKey || dotPath.startsWith(pathKey + ' > '));
          if (!hasActivity) return null;
          return (
            <>
              <style>{`
                @keyframes fileExplorerPulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(0.85); opacity: 0.65; }
                }
              `}</style>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#f59e0b',
                  marginLeft: 6,
                  animation: 'fileExplorerPulse 1.5s infinite ease-in-out',
                  boxShadow: '0 0 4px #f59e0b',
                  flexShrink: 0
                }}
                title="New activity from sprint tasks"
              />
            </>
          );
        })()}

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
                  onRenameItem={onRenameItem}
                  contentStatus={contentStatus}
                  activityDots={activityDots}
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
  onRenameItem,
  contentStatus = {},
  explorerState = 'normal',
  onToggleState,
  activityDots
}) => {
  if (explorerState === 'minimized') {
    return (
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid var(--medium-brown)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        height: '100%',
        gap: 20
      }}>
        <button
          onClick={() => onToggleState('normal')}
          title="Expand File Explorer"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--primary-brown)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--pale-brown)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ChevronRight size={20} />
        </button>
        <div style={{
          writingMode: 'vertical-rl',
          textTransform: 'uppercase',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-brown)',
          letterSpacing: '1.5px',
          userSelect: 'none',
          opacity: 0.7
        }}>
          Working Repository
        </div>
      </div>
    );
  }

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
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-brown)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          Working Repository
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {onToggleState && (
            <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
              <button
                onClick={() => onToggleState(explorerState === 'maximized' ? 'normal' : 'maximized')}
                title={explorerState === 'maximized' ? "Restore Size" : "Maximize Explorer"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-brown)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--medium-brown)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {explorerState === 'maximized' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              
              <button
                onClick={() => onToggleState('minimized')}
                title="Minimize / Collapse"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-brown)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--medium-brown)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronLeft size={13} />
              </button>
            </div>
          )}

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
            onRenameItem={onRenameItem}
            contentStatus={contentStatus}
            activityDots={activityDots}
          />
        ))}
      </div>
    </div>
  );
});