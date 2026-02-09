// growth-components/FileExplorer.jsx
import React, { memo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  FileText,
  File
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
  contentStatus
}) => {
  const currentPath = [...path, name];
  const pathKey = currentPath.join(' > ');
  const isExpanded = expandedFolders[pathKey];
  const isSelected = selectedPath?.join(' > ') === pathKey;
  const isFolder = item.type === 'folder';
  const hasContent = contentStatus[pathKey];

  const handleClick = () => {
    if (isFolder) {
      onToggleFolder(currentPath);
    } else {
      onSelectItem(currentPath, item);
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          paddingLeft: `${level * 20 + 12}px`,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          background: isSelected ? 'var(--primary-brown)' : 'transparent',
          color: isSelected ? 'white' : 'var(--text-brown)',
          transition: 'all 0.15s',
          userSelect: 'none',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'var(--pale-brown)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* Expand/Collapse Icon */}
        {isFolder && (
          <div style={{ width: 16, display: 'flex', alignItems: 'center' }}>
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </div>
        )}
        {!isFolder && <div style={{ width: 16 }} />}

        {/* Folder/File Icon */}
        {isFolder ? (
          isExpanded ? (
            <FolderOpen size={18} color={isSelected ? 'white' : 'var(--primary-brown)'} />
          ) : (
            <Folder size={18} color={isSelected ? 'white' : 'var(--primary-brown)'} />
          )
        ) : item.type === 'text' ? (
          <FileText size={18} color={isSelected ? 'white' : 'var(--accent-brown)'} />
        ) : (
          <File size={18} color={isSelected ? 'white' : 'var(--accent-brown)'} />
        )}

        {/* Name */}
        <span style={{ 
          flex: 1, 
          fontSize: 14,
          fontWeight: isFolder ? 500 : 400
        }}>
          {name}
        </span>

        {/* Content Indicator */}
        {!isFolder && hasContent && (
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isSelected ? 'white' : 'var(--primary-brown)'
          }} />
        )}
      </div>

      {/* Render Children */}
      {isFolder && isExpanded && item.items && (
        <div>
          {Object.entries(item.items).map(([childName, childItem]) => (
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
              contentStatus={contentStatus}
            />
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
        fontWeight: 600,
        fontSize: 14,
        color: 'var(--text-brown)'
      }}>
        Growth Repository
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
            contentStatus={contentStatus}
          />
        ))}
      </div>
    </div>
  );
});