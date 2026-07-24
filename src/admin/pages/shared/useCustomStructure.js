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
} from '../structure/growthStructure';

/**
 * Shared hook for adding user-custom folders/file entries on top of any
 * static section structure (Growth, Admin, Partners, Ops, etc.).
 *
 * The hook owns: customStructure (loaded from Firestore), the create-dialog
 * state, the merged structure, and the create/delete operations.
 *
 * Pages remain in charge of selection/contentStatus/expansion side-effects
 * — the hook returns enough info on each operation for the caller to wire
 * those up.
 */
export const useCustomStructure = ({
  user,
  staticStructure,
  loadUserStructure,
  saveUserStructure,
  deleteContent,
  renameContent,
  enableTables = false,
}) => {
  const [customStructure, setCustomStructure] = useState({});
  const [createDialog, setCreateDialog] = useState({ open: false, parentPath: [] });

  const mergedStructure = useMemo(
    () => mergeStructures(staticStructure, customStructure),
    [staticStructure, customStructure]
  );

  // Load on user/auth change
  useEffect(() => {
    if (!user) {
      setCustomStructure({});
      return;
    }
    let active = true;
    (async () => {
      try {
        const struct = await loadUserStructure();
        if (active) setCustomStructure(struct || {});
      } catch (e) {
        console.error('Failed to load user structure:', e);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, loadUserStructure]);

  const openCreateDialog = useCallback((parentPath) => {
    setCreateDialog({ open: true, parentPath });
  }, []);

  const closeCreateDialog = useCallback(() => {
    setCreateDialog({ open: false, parentPath: [] });
  }, []);

  // Build a new item (folder or file) and persist the updated tree.
  // Returns { parentPath, name, type } on success, or null on failure.
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
          };
        } else {
          newItem = {
            type: 'file',
            icon: 'file',
            accept: preset.accept,
            maxSize: DEFAULT_FILE_MAX_SIZE,
            description: `Upload ${preset.label} (max 10MB)`,
          };
        }
      }

      const previous = customStructure;
      const next = addItemToStructure(customStructure, parentPath, name, newItem);
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

  // Delete a folder/file. Folders also remove every uploaded
  // file inside the subtree (best effort, via the supplied deleteContent).
  // Returns { handled, basePath, deletedFilePaths } on success.
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

      const previous = customStructure;
      try {
        for (const fp of childFilePaths) {
          try {
            if (deleteContent) await deleteContent(fp);
          } catch (e) {
            console.warn('Failed to delete content for', fp, e);
          }
        }

        const next = deleteItemInStructure(customStructure, staticStructure, path);
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
    [customStructure, staticStructure, saveUserStructure, deleteContent]
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

      const previous = customStructure;
      const next = renameItemInStructure(customStructure, staticStructure, path, newName);
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
    [customStructure, staticStructure, mergedStructure, saveUserStructure, renameContent]
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
  };
};

export default useCustomStructure;
