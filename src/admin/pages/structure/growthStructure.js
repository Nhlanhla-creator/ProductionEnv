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
        maxSize: 2097152, // 2MB in bytes
        description: "Upload your vision and mission statements (PDF/Word, max 2MB)"
      },
      "Platform Thesis": { 
        type: "file", 
        icon: "layers",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload your platform thesis document (PDF/Word, max 2MB)"
      },
      "Unicorn Roadmap": { 
        type: "file", 
        icon: "trending-up",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload your roadmap to unicorn status (PDF/Word, max 2MB)"
      },
      "Market Problem Definition": { 
        type: "file", 
        icon: "alert-circle",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload market problem analysis (PDF/Word, max 2MB)"
      },
      "Competitive Analysis": { 
        type: "file", 
        icon: "bar-chart",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 2097152,
        description: "Upload competitive analysis (PDF/Word/Excel, max 2MB)"
      },
      "ESG ESD Strategy": { 
        type: "file", 
        icon: "leaf",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload ESG/ESD strategy document (PDF/Word, max 2MB)"
      },
      "Expansion Roadmap": { 
        type: "file", 
        icon: "map",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload expansion roadmap (PDF/Word, max 2MB)"
      },
      "Financial Models": { 
        type: "file", 
        icon: "file-spreadsheet",
        accept: ".xlsx,.xls,.csv,.pdf",
        maxSize: 2097152,
        description: "Upload financial projection spreadsheets (Excel/PDF, max 2MB)"
      },
      "Budgets Forecasts": { 
        type: "file", 
        icon: "calculator",
        accept: ".xlsx,.xls,.csv,.pdf",
        maxSize: 2097152,
        description: "Upload budget and forecast documents (Excel/PDF, max 2MB)"
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
            maxSize: 2097152,
            description: "Upload pre-seed funding documentation (PDF/Word, max 2MB)"
          },
          "Seed": { 
            type: "file", 
            icon: "sprout",
            accept: ".pdf,.docx,.doc",
            maxSize: 2097152,
            description: "Upload seed funding documentation (PDF/Word, max 2MB)"
          },
          "Series A": { 
            type: "file", 
            icon: "bar-chart-2",
            accept: ".pdf,.docx,.doc",
            maxSize: 2097152,
            description: "Upload Series A funding documentation (PDF/Word, max 2MB)"
          }
        }
      },
      "Investor Decks": { 
        type: "file", 
        icon: "presentation",
        accept: ".pdf,.pptx,.key",
        maxSize: 2097152,
        description: "Upload pitch decks and investor presentations (PDF/PPT, max 2MB)"
      },
      "Grant Applications": { 
        type: "file", 
        icon: "file-text",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload grant application documents (PDF/Word, max 2MB)"
      },
      "Revenue Models": { 
        type: "file", 
        icon: "dollar-sign",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 2097152,
        description: "Upload revenue model documentation (PDF/Word/Excel, max 2MB)"
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
        maxSize: 2097152,
        description: "Upload brand positioning document (PDF/Word, max 2MB)"
      },
      "Website Content": { 
        type: "file", 
        icon: "globe",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload website content and messaging (PDF/Word, max 2MB)"
      },
      "Thought Leadership": { 
        type: "file", 
        icon: "message-circle",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload thought leadership content (PDF/Word, max 2MB)"
      },
      "BIG Pulse": { 
        type: "file", 
        icon: "activity",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 2097152,
        description: "Upload market pulse and trends analysis (PDF/Word/Excel, max 2MB)"
      },
      "Campaigns": { 
        type: "file", 
        icon: "zap",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload marketing campaign plans (PDF/Word, max 2MB)"
      },
      "Partnerships Comms": { 
        type: "file", 
        icon: "users",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload partnership communications (PDF/Word, max 2MB)"
      },
      "Asset Design & Templates": {
        type: "folder",
        icon: "palette",
        items: {
          "Brand Guidelines": { 
            type: "file", 
            icon: "book",
            accept: ".pdf,.docx",
            maxSize: 2097152,
            description: "Upload brand style guides (PDF/Word, max 2MB)"
          },
          "Logos": { 
            type: "file", 
            icon: "image",
            accept: ".svg,.png,.jpg,.ai,.eps,.pdf",
            maxSize: 2097152,
            description: "Upload logo files and variations (max 2MB)"
          },
          "UI Designs": { 
            type: "file", 
            icon: "layout",
            accept: ".fig,.sketch,.xd,.png,.jpg,.pdf",
            maxSize: 2097152,
            description: "Upload UI design files (max 2MB)"
          },
          "Pitch Visuals": { 
            type: "file", 
            icon: "presentation",
            accept: ".pdf,.pptx,.png,.jpg",
            maxSize: 2097152,
            description: "Upload pitch presentation visuals (PDF/PPT/Images, max 2MB)"
          },
          "Diagrams": { 
            type: "file", 
            icon: "git-branch",
            accept: ".svg,.png,.jpg,.pdf",
            maxSize: 2097152,
            description: "Upload diagrams and flowcharts (max 2MB)"
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