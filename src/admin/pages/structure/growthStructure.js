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