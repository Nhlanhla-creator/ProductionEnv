/**
 * Partners & Ecosystem structure with type definitions
 * Types:
 * - 'text': Rich text editor for written content
 * - 'file': File upload for documents/images
 * - 'folder': Container for nested items
 * - 'database': Interactive data management (partners list, agreements, etc.)
 */

export const PARTNERS_STRUCTURE = {
  "Funders Investors": {
    type: "file",
    icon: "building-2",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload funder and investor database/list (PDF/Word/Excel, max 2MB)"
  },

  "Service Providers": {
    type: "folder",
    icon: "briefcase",
    items: {
      "Onboarded Vendors": {
        type: "file",
        icon: "users",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 2097152,
        description: "Upload vendor database/list (PDF/Word/Excel, max 2MB)"
      },
      "Vendor Agreements": {
        type: "file",
        icon: "file-text",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload vendor contracts and agreements (PDF/Word, max 2MB)"
      },
      "Vendor Communications": {
        type: "file",
        icon: "message-square",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload vendor communication logs (PDF/Word, max 2MB)"
      }
    }
  },

  "Corporates ESD": {
    type: "file",
    icon: "building",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload corporate ESD partnerships database (PDF/Word/Excel, max 2MB)"
  },

  "Government": {
    type: "file",
    icon: "landmark",
    accept: ".pdf,.docx,.doc,.xlsx,.xls",
    maxSize: 2097152,
    description: "Upload government partnerships database (PDF/Word/Excel, max 2MB)"
  },

  "MOUs Agreements": {
    type: "file",
    icon: "file-signature",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload MOUs, contracts, and partnership agreements (PDF/Word, max 2MB)"
  },

  "Product Platform": {
    type: "folder",
    icon: "layers",
    items: {
      "Product Overview": {
        type: "file",
        icon: "layout",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload product overview document (PDF/Word, max 2MB)"
      },
      "Feature Roadmap": {
        type: "file",
        icon: "map",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 2097152,
        description: "Upload feature roadmap (PDF/Word/Excel, max 2MB)"
      },
      "MVP Definition": {
        type: "file",
        icon: "target",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload MVP definition document (PDF/Word, max 2MB)"
      },
      "SME Onboarding": {
        type: "folder",
        icon: "user-plus",
        items: {
          "Overview & Definitions": {
            type: "file",
            icon: "book-open",
            accept: ".pdf,.docx,.doc",
            maxSize: 2097152,
            description: "Upload SME onboarding documentation (PDF/Word, max 2MB)"
          }
        }
      },
      "BIG Score": {
        type: "folder",
        icon: "award",
        items: {
          "Scoring Logic": {
            type: "folder",
            icon: "calculator",
            items: {
              "BIG Score Methodology": {
                type: "file",
                icon: "book",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload scoring methodology document (PDF/Word, max 2MB)"
              },
              "Scoring Logic Rules": {
                type: "file",
                icon: "list",
                accept: ".pdf,.docx,.doc,.xlsx,.xls",
                maxSize: 2097152,
                description: "Upload scoring rules document (PDF/Word/Excel, max 2MB)"
              },
              "Lifecycle Models": {
                type: "file",
                icon: "activity",
                accept: ".pdf,.docx,.doc,.xlsx,.xls",
                maxSize: 2097152,
                description: "Upload lifecycle models (PDF/Word/Excel, max 2MB)"
              },
              "Validation Framework": {
                type: "file",
                icon: "check-circle",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload validation framework (PDF/Word, max 2MB)"
              },
              "AI / ML Models": {
                type: "file",
                icon: "cpu",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload AI/ML model documentation (PDF/Word, max 2MB)"
              },
              "Training Data": {
                type: "file",
                icon: "database",
                accept: ".csv,.xlsx,.xls,.json,.pdf",
                maxSize: 2097152,
                description: "Upload training datasets (CSV/Excel/JSON/PDF, max 2MB)"
              },
              "Funder Feedback": {
                type: "file",
                icon: "message-circle",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload funder feedback documentation (PDF/Word, max 2MB)"
              }
            }
          }
        }
      }
    }
  }
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

// Helper to check if item has schema (database type)
export const hasSchema = (item) => {
  return item?.type === 'database' && item?.schema;
};