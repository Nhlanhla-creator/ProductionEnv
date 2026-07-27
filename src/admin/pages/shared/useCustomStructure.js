import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FILE_TYPE_PRESETS,
  DEFAULT_FILE_MAX_SIZE,
  mergeStructures,
  addItemToStructure,
  removeItemFromStructure,
  collectFilePaths,
  renameItemInStructure,
  deleteItemInStructure,
  findItemAtPath,
} from '../structure/growthStructure';

/**
 * Shared hook for adding user-custom folders/file entries on top of any
 * static section structure (Growth, Admin, Partners, Ops, etc.).
 *
 * Discards runtime static-merge overrides; instead, loads the dynamic
 * structure from Firestore. If Firestore has no saved structure yet,
 * initializes Firestore with a copy of staticStructure.
 */
export const useCustomStructure = ({
  user,
  staticStructure,
  loadUserStructure,
  saveUserStructure,
  deleteContent,
  renameContent,
  copyContent,
  enableTables = false,
}) => {
  // null represents loading state to prevent resetting selection paths on mount
  const [customStructure, setCustomStructure] = useState(null);
  const [createDialog, setCreateDialog] = useState({ open: false, parentPath: [] });

  const mergedStructure = useMemo(() => {
    if (customStructure === null) {
      return staticStructure || {};
    }
    return customStructure;
  }, [staticStructure, customStructure]);

  // Load on user/auth change
  useEffect(() => {
    if (!user) {
      setCustomStructure(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        let struct = await loadUserStructure();
        if (!struct || Object.keys(struct).length === 0) {
          // Initialize database with static structure
          struct = JSON.parse(JSON.stringify(staticStructure || {}));
          await saveUserStructure(struct);
        }
        if (active) setCustomStructure(struct);
      } catch (e) {
        console.error('Failed to load user structure:', e);
        if (active) setCustomStructure(staticStructure || {});
      }
    })();
    return () => {
      active = false;
    };
  }, [user, loadUserStructure, staticStructure, saveUserStructure]);

  const openCreateDialog = useCallback((parentPath) => {
    setCreateDialog({ open: true, parentPath });
  }, []);

  const closeCreateDialog = useCallback(() => {
    setCreateDialog({ open: false, parentPath: [] });
  }, []);

  // Build a new item (folder or file) and persist the updated tree.
  const createItem = useCallback(
    async ({ type, name, fileType }) => {
      const { parentPath } = createDialog;
      let newItem;
      if (type === 'folder') {
        newItem = { type: 'folder', icon: 'folder', items: {} };
      } else {
        const preset = FILE_TYPE_PRESETS[fileType] || FILE_TYPE_PRESETS.any;
        if (enableTables && fileType === 'spreadsheet') {
          newItem = {
            type: 'table',
            icon: 'file-spreadsheet',
            accept: preset.accept,
            maxSize: DEFAULT_FILE_MAX_SIZE,
            description: `Manage ${name} database / spreadsheet`,
            _custom: true
          };
        } else {
          newItem = {
            type: 'file',
            icon: 'file',
            accept: preset.accept,
            maxSize: DEFAULT_FILE_MAX_SIZE,
            description: `Upload ${preset.label} (max 10MB)`,
            _custom: true
          };
        }
      }

      const previous = customStructure || {};
      const next = addItemToStructure(previous, parentPath, name, newItem);
      setCustomStructure(next);
      closeCreateDialog();

      try {
        await saveUserStructure(next);
      } catch (e) {
        console.error('Failed to save user structure:', e);
        alert('Failed to save. Please try again.');
        setCustomStructure(previous);
        return null;
      }
      return { parentPath, name, type };
    },
    [createDialog, customStructure, saveUserStructure, closeCreateDialog, enableTables]
  );

  // Delete a folder/file. Folders also remove every uploaded file inside the subtree.
  const deleteItem = useCallback(
    async (path, item) => {
      if (!item) return { handled: false };
      const isFolder = item.type === 'folder';
      const childFilePaths = collectFilePaths(item, path);
      const fileCount = childFilePaths.length;

      let confirmMsg;
      if (isFolder) {
        confirmMsg =
          fileCount > 0
            ? `Delete the folder "${path.join(' > ')}" and all ${fileCount} file entr${fileCount === 1 ? 'y' : 'ies'} inside it? Uploaded files will be permanently removed.`
            : `Delete the folder "${path.join(' > ')}"?`;
      } else {
        confirmMsg = `Delete the file entry "${path.join(' > ')}"? Any uploaded files will be permanently removed.`;
      }
      if (!window.confirm(confirmMsg)) return { handled: false };

      const previous = customStructure || {};
      try {
        for (const fp of childFilePaths) {
          try {
            if (deleteContent) await deleteContent(fp);
          } catch (e) {
            console.warn('Failed to delete content for', fp, e);
          }
        }

        const next = deleteItemInStructure(previous, path);
        setCustomStructure(next);
        await saveUserStructure(next);
        return { handled: true, basePath: path, deletedFilePaths: childFilePaths };
      } catch (e) {
        console.error('Failed to delete item:', e);
        alert('Failed to delete. Please try again.');
        setCustomStructure(previous);
        return { handled: false };
      }
    },
    [customStructure, saveUserStructure, deleteContent]
  );

  // Rename a folder/file.
  const renameItem = useCallback(
    async (path, newName) => {
      const oldName = path[path.length - 1];
      if (oldName === newName) return { handled: true, oldPath: path, newPath: path };

      const parentPath = path.slice(0, -1);

      // Sibling check for collisions
      let current = mergedStructure;
      for (const seg of parentPath) {
        if (!current[seg] || !current[seg].items) break;
        current = current[seg].items;
      }
      if (current && current[newName]) {
        alert(`An item named "${newName}" already exists in this folder.`);
        return { handled: false };
      }

      const previous = customStructure || {};
      const next = renameItemInStructure(previous, path, newName);
      setCustomStructure(next);

      try {
        const newPath = [...parentPath, newName];
        if (renameContent) {
          await renameContent(path, newPath);
        }
        await saveUserStructure(next);
        return { handled: true, oldPath: path, newPath };
      } catch (e) {
        console.error('Failed to rename item:', e);
        alert('Failed to rename. Please try again.');
        setCustomStructure(previous);
        return { handled: false };
      }
    },
    [customStructure, mergedStructure, saveUserStructure, renameContent]
  );

  // Move a folder/file to another parent folder
  const moveItem = useCallback(
    async (path, targetParentPath) => {
      const oldName = path[path.length - 1];
      const previous = customStructure || {};

      // Sibling check for collisions in the destination folder
      let targetFolder = previous;
      for (const seg of targetParentPath) {
        if (!targetFolder[seg] || !targetFolder[seg].items) {
          targetFolder = null;
          break;
        }
        targetFolder = targetFolder[seg].items;
      }
      if (targetFolder && targetFolder[oldName]) {
        alert(`An item named "${oldName}" already exists in that destination folder.`);
        return { handled: false };
      }

      const itemToMove = findItemAtPath(previous, path);
      if (!itemToMove) return { handled: false };

      // 1. Remove old item from tree
      let next = removeItemFromStructure(previous, path);
      // 2. Add it to new parent path
      next = addItemToStructure(next, targetParentPath, oldName, itemToMove);
      setCustomStructure(next);

      try {
        const newPath = [...targetParentPath, oldName];
        if (renameContent) {
          await renameContent(path, newPath);
        }
        await saveUserStructure(next);
        return { handled: true, oldPath: path, newPath };
      } catch (e) {
        console.error('Failed to move item:', e);
        alert('Failed to move. Please try again.');
        setCustomStructure(previous);
        return { handled: false };
      }
    },
    [customStructure, saveUserStructure, renameContent]
  );

  // Copy a folder/file to another parent folder (along with its content recursively)
  const copyItem = useCallback(
    async (path, targetParentPath) => {
      const oldName = path[path.length - 1];
      const previous = customStructure || {};

      // Sibling collision check: auto-suffix name if target already contains it
      let finalName = oldName;
      let targetFolder = previous;
      for (const seg of targetParentPath) {
        if (!targetFolder[seg] || !targetFolder[seg].items) {
          targetFolder = null;
          break;
        }
        targetFolder = targetFolder[seg].items;
      }
      if (targetFolder && targetFolder[oldName]) {
        finalName = `${oldName} - Copy`;
        let counter = 1;
        while (targetFolder[finalName]) {
          finalName = `${oldName} - Copy (${counter})`;
          counter++;
        }
      }

      const itemToCopy = findItemAtPath(previous, path);
      if (!itemToCopy) return { handled: false };

      // Deep copy item structure
      const itemCopy = JSON.parse(JSON.stringify(itemToCopy));

      const next = addItemToStructure(previous, targetParentPath, finalName, itemCopy);
      setCustomStructure(next);

      try {
        const newPath = [...targetParentPath, finalName];
        if (copyContent) {
          await copyContent(path, newPath);
        }
        await saveUserStructure(next);
        return { handled: true, oldPath: path, newPath };
      } catch (e) {
        console.error('Failed to copy item:', e);
        alert('Failed to copy. Please try again.');
        setCustomStructure(previous);
        return { handled: false };
      }
    },
    [customStructure, saveUserStructure, copyContent]
  );

  // Convert a file to a folder
  const convertItemType = useCallback(
    async (path, targetType) => {
      if (targetType !== 'folder') {
        alert("Conversion is only supported from File to Folder.");
        return { handled: false };
      }

      const confirmMsg = `Are you sure you want to convert this file entry into a folder? Existing uploaded files under this entry will be preserved.`;
      if (!window.confirm(confirmMsg)) return { handled: false };

      const previous = customStructure || {};
      const next = JSON.parse(JSON.stringify(previous));

      let current = next;
      const parentPath = path.slice(0, -1);
      const name = path[path.length - 1];
      for (const seg of parentPath) {
        if (!current[seg] || !current[seg].items) return { handled: false };
        current = current[seg].items;
      }

      if (!current[name]) return { handled: false };

      // Convert to folder, keeping folder items empty initially
      current[name] = {
        type: 'folder',
        icon: 'folder',
        items: {}
      };

      setCustomStructure(next);

      try {
        // Keep the files! Do not call deleteContent(path)
        await saveUserStructure(next);
        return { handled: true };
      } catch (e) {
        console.error('Failed to convert item type:', e);
        alert('Failed to convert. Please try again.');
        setCustomStructure(previous);
        return { handled: false };
      }
    },
    [customStructure, saveUserStructure]
  );

  // Sibling names at the dialog's parent path (for collision check)
  const existingNamesAtParent = useMemo(() => {
    if (!createDialog.open) return [];
    let current = mergedStructure;
    for (const seg of createDialog.parentPath) {
      if (!current[seg] || !current[seg].items) return [];
      current = current[seg].items;
    }
    return Object.keys(current);
  }, [createDialog, mergedStructure]);

  return {
    customStructure,
    mergedStructure,
    createDialog,
    existingNamesAtParent,
    openCreateDialog,
    closeCreateDialog,
    createItem,
    deleteItem,
    renameItem,
    moveItem,
    copyItem,
    convertItemType,
  };
};

export default useCustomStructure;
