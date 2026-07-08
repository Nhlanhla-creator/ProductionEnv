/**
 * Growth section structure with type definitions
 * Types:
 * - 'text': Rich text editor for written content
 * - 'file': File upload for documents/images
 * - 'folder': Container for nested items
 */

export const GROWTH_STRUCTURE = {
  "Strategy Vision": {
    type: "folder",
    icon: "target",
    items: {
      "Vision Mission": { 
        type: "file", 
        icon: "flag",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760, // 2MB in bytes
        description: "Upload your vision and mission statements (PDF/Word, max 10MB)"
      },
      "Platform Thesis": { 
        type: "file", 
        icon: "layers",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload your platform thesis document (PDF/Word, max 10MB)"
      },
      "Unicorn Roadmap": { 
        type: "file", 
        icon: "trending-up",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload your roadmap to unicorn status (PDF/Word, max 10MB)"
      },
      "Market Problem Definition": { 
        type: "file", 
        icon: "alert-circle",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload market problem analysis (PDF/Word, max 10MB)"
      },
      "Competitive Analysis": { 
        type: "file", 
        icon: "bar-chart",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload competitive analysis (PDF/Word/Excel, max 10MB)"
      },
      "ESG ESD Strategy": { 
        type: "file", 
        icon: "leaf",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload ESG/ESD strategy document (PDF/Word, max 10MB)"
      },
      "Expansion Roadmap": { 
        type: "file", 
        icon: "map",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload expansion roadmap (PDF/Word, max 10MB)"
      },
      "Financial Models": { 
        type: "file", 
        icon: "file-spreadsheet",
        accept: ".xlsx,.xls,.csv,.pdf",
        maxSize: 10485760,
        description: "Upload financial projection spreadsheets (Excel/PDF, max 10MB)"
      },
      "Budgets Forecasts": { 
        type: "file", 
        icon: "calculator",
        accept: ".xlsx,.xls,.csv,.pdf",
        maxSize: 10485760,
        description: "Upload budget and forecast documents (Excel/PDF, max 10MB)"
      }
    }
  },

  "Finance & Funding": {
    type: "folder",
    icon: "dollar-sign",
    items: {
      "Funding Rounds": {
        type: "folder",
        icon: "trending-up",
        items: {
          "Pre-Seed": { 
            type: "file", 
            icon: "seed",
            accept: ".pdf,.docx,.doc",
            maxSize: 10485760,
            description: "Upload pre-seed funding documentation (PDF/Word, max 10MB)"
          },
          "Seed": { 
            type: "file", 
            icon: "sprout",
            accept: ".pdf,.docx,.doc",
            maxSize: 10485760,
            description: "Upload seed funding documentation (PDF/Word, max 10MB)"
          },
          "Series A": { 
            type: "file", 
            icon: "bar-chart-2",
            accept: ".pdf,.docx,.doc",
            maxSize: 10485760,
            description: "Upload Series A funding documentation (PDF/Word, max 10MB)"
          }
        }
      },
      "Investor Decks": { 
        type: "file", 
        icon: "presentation",
        accept: ".pdf,.pptx,.key",
        maxSize: 10485760,
        description: "Upload pitch decks and investor presentations (PDF/PPT, max 10MB)"
      },
      "Grant Applications": { 
        type: "file", 
        icon: "file-text",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload grant application documents (PDF/Word, max 10MB)"
      },
      "Revenue Models": { 
        type: "file", 
        icon: "dollar-sign",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload revenue model documentation (PDF/Word/Excel, max 10MB)"
      }
    }
  },

  "Marketing & Branding": {
    type: "folder",
    icon: "megaphone",
    items: {
      "Brand Positioning": { 
        type: "file", 
        icon: "target",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload brand positioning document (PDF/Word, max 10MB)"
      },
      "Website Content": { 
        type: "file", 
        icon: "globe",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload website content and messaging (PDF/Word, max 10MB)"
      },
      "Thought Leadership": { 
        type: "file", 
        icon: "message-circle",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload thought leadership content (PDF/Word, max 10MB)"
      },
      "BIG Pulse": { 
        type: "file", 
        icon: "activity",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload market pulse and trends analysis (PDF/Word/Excel, max 10MB)"
      },
      "Campaigns": { 
        type: "file", 
        icon: "zap",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload marketing campaign plans (PDF/Word, max 10MB)"
      },
      "Partnerships Comms": { 
        type: "file", 
        icon: "users",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Upload partnership communications (PDF/Word, max 10MB)"
      },
      "Asset Design & Templates": {
        type: "folder",
        icon: "palette",
        items: {
          "Brand Guidelines": { 
            type: "file", 
            icon: "book",
            accept: ".pdf,.docx",
            maxSize: 10485760,
            description: "Upload brand style guides (PDF/Word, max 10MB)"
          },
          "Logos": { 
            type: "file", 
            icon: "image",
            accept: ".svg,.png,.jpg,.ai,.eps,.pdf",
            maxSize: 10485760,
            description: "Upload logo files and variations (max 10MB)"
          },
          "UI Designs": { 
            type: "file", 
            icon: "layout",
            accept: ".fig,.sketch,.xd,.png,.jpg,.pdf",
            maxSize: 10485760,
            description: "Upload UI design files (max 10MB)"
          },
          "Pitch Visuals": { 
            type: "file", 
            icon: "presentation",
            accept: ".pdf,.pptx,.png,.jpg",
            maxSize: 10485760,
            description: "Upload pitch presentation visuals (PDF/PPT/Images, max 10MB)"
          },
          "Diagrams": { 
            type: "file", 
            icon: "git-branch",
            accept: ".svg,.png,.jpg,.pdf",
            maxSize: 10485760,
            description: "Upload diagrams and flowcharts (max 10MB)"
          }
        }
      }
    }
  },

  "Business Development": {
    type: "folder",
    icon: "briefcase",
    items: {
      "Target List": {
        type: "folder",
        icon: "folder",
        items: {
          "Corporate": {
            type: "table",
            icon: "building",
            accept: ".pdf,.docx,.doc,.xlsx,.xls",
            maxSize: 10485760,
            description: "Manage corporate partnerships database / spreadsheet"
          },
          "Government": {
            type: "table",
            icon: "landmark",
            accept: ".pdf,.docx,.doc,.xlsx,.xls",
            maxSize: 10485760,
            description: "Manage government partnerships database / spreadsheet"
          }
        }
      }
    }
  }
};

// Helper function to get icon component name
export const getIconName = (iconString) => {
  // Convert kebab-case to PascalCase for Lucide icons
  return iconString
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

// Helper function to navigate structure
export const navigateToPath = (structure, path) => {
  let current = structure;
  for (const segment of path) {
    if (current[segment]) {
      current = current[segment].items || current[segment];
    } else {
      return null;
    }
  }
  return current;
};

// Helper function to get item type
export const getItemType = (structure, path) => {
  const item = navigateToPath(structure, path);
  return item?.type || null;
};

// ---------------------------------------------------------------------------
// User-custom structure support
// ---------------------------------------------------------------------------

// Default max file size used for any user-created file entry (10MB).
export const DEFAULT_FILE_MAX_SIZE = 10485760;

// File-type presets shown in the "Create file" dialog. The "accept" string
// matches the existing static-entry format so FileUploader treats them the
// same way (extension filter + multi-extension accept).
export const FILE_TYPE_PRESETS = {
  document:     { label: 'Document (PDF, Word)',      accept: '.pdf,.docx,.doc' },
  pdf:          { label: 'PDF only',                  accept: '.pdf' },
  spreadsheet:  { label: 'Spreadsheet (Excel, CSV)',  accept: '.xlsx,.xls,.csv' },
  presentation: { label: 'Presentation (PPT, Keynote)', accept: '.pptx,.ppt,.key' },
  image:        { label: 'Image (PNG, JPG, SVG)',     accept: '.png,.jpg,.jpeg,.gif,.svg,.webp' },
  video:        { label: 'Video (MP4, MOV)',          accept: '.mp4,.mov,.avi,.webm' },
  audio:        { label: 'Audio (MP3, WAV)',          accept: '.mp3,.wav,.m4a,.ogg' },
  archive:      { label: 'Archive (ZIP, RAR)',        accept: '.zip,.rar,.7z' },
  any:          { label: 'Any file type',             accept: '' }
};

// Merge a static (code) structure with a user's custom structure. User-created
// items are tagged with `_custom: true` at runtime so the UI can show
// delete affordances for them. If a custom name collides with a static name
// at the same level, the static entry wins (collisions are also blocked at
// creation time in the dialog).
export const mergeStructures = (staticStruct, customStruct) => {
  const merged = {};
  for (const [name, item] of Object.entries(staticStruct || {})) {
    if (item.type === 'folder') {
      const customChild = customStruct?.[name];
      const customItems = customChild?.items || {};
      merged[name] = {
        ...item,
        items: mergeStructures(item.items || {}, customItems)
      };
    } else {
      merged[name] = { ...item };
    }
  }
  for (const [name, item] of Object.entries(customStruct || {})) {
    if (!merged[name]) {
      merged[name] = markCustomRecursively(item);
    }
  }
  return merged;
};

const markCustomRecursively = (item) => {
  if (item?.type === 'folder') {
    const items = {};
    for (const [n, i] of Object.entries(item.items || {})) {
      items[n] = markCustomRecursively(i);
    }
    return { ...item, _custom: true, items };
  }
  return { ...item, _custom: true };
};

// Insert a new item at parentPath > name in the saved (custom) tree.
// Passthrough containers are auto-created when parentPath crosses through
// folders that exist in the static tree but not yet in the custom tree.
export const addItemToStructure = (structure, parentPath, name, item) => {
  const next = structure ? JSON.parse(JSON.stringify(structure)) : {};
  let current = next;
  for (const segment of parentPath) {
    if (!current[segment]) {
      current[segment] = { type: 'folder', items: {} };
    } else if (!current[segment].items) {
      current[segment].items = {};
    }
    current = current[segment].items;
  }
  current[name] = item;
  return next;
};

// Remove the item at the given path from the saved (custom) tree.
export const removeItemFromStructure = (structure, path) => {
  if (!structure || !path || path.length === 0) return structure;
  const next = JSON.parse(JSON.stringify(structure));
  let current = next;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!current[segment] || !current[segment].items) return next;
    current = current[segment].items;
  }
  delete current[path[path.length - 1]];
  return next;
};

// Look up the item at a given path in any structure (static, custom, or merged).
export const findItemAtPath = (structure, path) => {
  if (!structure || !path || path.length === 0) return null;
  let current = structure;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    if (!current[segment] || !current[segment].items) return null;
    current = current[segment].items;
  }
  return current[path[path.length - 1]] || null;
};

// Walk a subtree and return the absolute path of every file-type leaf,
// rooted at basePath.
export const collectFilePaths = (item, basePath = []) => {
  const paths = [];
  if (!item) return paths;
  if (item.type === 'file') {
    paths.push([...basePath]);
  } else if (item.type === 'folder' && item.items) {
    for (const [name, child] of Object.entries(item.items)) {
      paths.push(...collectFilePaths(child, [...basePath, name]));
    }
  }
  return paths;
};