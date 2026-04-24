import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, CheckCircle } from 'lucide-react';

const FileExplorer = ({
  structure,
  expandedFolders,
  selectedPath,
  onToggleFolder,
  onSelectItem,
  contentStatus = {}
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const getPathKey = (path) => path.join(" > ");

  const renderTree = (items, currentPath = []) => {
    return items.map((item) => {
      const itemPath = [...currentPath, item.name];
      const pathKey = getPathKey(itemPath);
      const isExpanded = expandedFolders[pathKey];
      const isSelected = selectedPath && getPathKey(selectedPath) === pathKey;
      const hasContent = contentStatus[pathKey];
      const isFolder = item.type === 'folder';

      if (isFolder) {
        return (
          <div key={item.id || pathKey} style={{ marginLeft: currentPath.length > 0 ? 16 : 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                background: isSelected ? 'var(--primary-brown)' : hoveredItem === pathKey ? 'var(--light-brown)' : 'transparent',
                color: isSelected ? 'white' : 'var(--text-brown)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onToggleFolder(itemPath)}
              onMouseEnter={() => setHoveredItem(pathKey)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
              <span style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>{item.name}</span>
              {hasContent && <CheckCircle size={12} color="#2e7d32" />}
            </div>
            {isExpanded && item.children && (
              <div style={{ marginLeft: 8, borderLeft: '1px solid var(--pale-brown)', paddingLeft: 8 }}>
                {renderTree(item.children, itemPath)}
              </div>
            )}
          </div>
        );
      } else {
        // File item
        return (
          <div
            key={item.id || pathKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              marginLeft: 24,
              borderRadius: 6,
              cursor: 'pointer',
              background: isSelected ? 'var(--primary-brown)' : hoveredItem === pathKey ? 'var(--light-brown)' : 'transparent',
              color: isSelected ? 'white' : 'var(--text-brown)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => onSelectItem(itemPath, item)}
            onMouseEnter={() => setHoveredItem(pathKey)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <FileText size={14} />
            <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400 }}>{item.name}</span>
            {hasContent && <CheckCircle size={12} color="#2e7d32" style={{ marginLeft: 'auto' }} />}
          </div>
        );
      }
    });
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid var(--medium-brown)',
      padding: 16,
      overflowY: 'auto',
      height: '100%',
    }}>
      <div style={{ marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--pale-brown)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-brown)', margin: 0 }}>File Explorer</h3>
      </div>
      <div>{renderTree(structure)}</div>
    </div>
  );
};

export { FileExplorer };