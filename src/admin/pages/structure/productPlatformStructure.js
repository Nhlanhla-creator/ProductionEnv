/**
 * Platform & Product structure
 * Restructured hierarchy with 5 top-level sections
 */

export const PRODUCT_STRUCTURE = {
  "1_Product Modules": {
    type: "folder",
    icon: "layers",
    items: {
      "BIG Score": {
        type: "folder",
        icon: "award",
        items: {
          "Overview & Definitions": {
            type: "file",
            icon: "book-open",
            accept: ".pdf,.docx,.doc",
            maxSize: 10485760,
            description: "Upload BIG Score overview document (PDF/Word, max 10MB)"
          },
          "Scoring Logic": {
            type: "folder",
            icon: "calculator",
            items: {
              "BIG Score Methodology": {
                type: "file",
                icon: "book",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload scoring methodology (PDF/Word, max 10MB)"
              },
              "Scoring Logic Rules": {
                type: "file",
                icon: "list",
                accept: ".pdf,.docx,.doc,.xlsx,.xls",
                maxSize: 10485760,
                description: "Upload scoring rules (PDF/Word/Excel, max 10MB)"
              },
              "Lifecycle Models": {
                type: "file",
                icon: "activity",
                accept: ".pdf,.docx,.doc,.xlsx,.xls",
                maxSize: 10485760,
                description: "Upload lifecycle models (PDF/Word/Excel, max 10MB)"
              },
              "Validation Framework": {
                type: "file",
                icon: "check-circle",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload validation framework (PDF/Word, max 10MB)"
              },
              "AI ML Models": {
                type: "file",
                icon: "cpu",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload AI/ML model documentation (PDF/Word, max 10MB)"
              },
              "Training Data": {
                type: "file",
                icon: "database",
                accept: ".csv,.xlsx,.xls,.json,.pdf",
                maxSize: 10485760,
                description: "Upload training datasets (CSV/Excel/JSON/PDF, max 10MB)"
              },
              "Funder Feedback": {
                type: "file",
                icon: "message-circle",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload funder feedback (PDF/Word, max 10MB)"
              }
            }
          },
          "Improve BIG Score": {
            type: "folder",
            icon: "trending-up",
            items: {
              "Compliance Score": {
                type: "file",
                icon: "shield-check",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload compliance score documentation (PDF/Word, max 10MB)"
              },
              "Legitimacy Score": {
                type: "file",
                icon: "check-square",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload legitimacy score documentation (PDF/Word, max 10MB)"
              },
              "Leadership Score": {
                type: "file",
                icon: "users",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload leadership score documentation (PDF/Word, max 10MB)"
              },
              "Governance Score": {
                type: "file",
                icon: "briefcase",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload governance score documentation (PDF/Word, max 10MB)"
              },
              "Capital Appeal Score": {
                type: "file",
                icon: "dollar-sign",
                accept: ".pdf,.docx,.doc",
                maxSize: 10485760,
                description: "Upload capital appeal score documentation (PDF/Word, max 10MB)"
              }
            }
          }
        }
      },
      "Matching Engine": {
        type: "file",
        icon: "git-merge",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload matching engine documentation (PDF/Word/Excel, max 10MB)"
      },
      "Growth Suite": {
        type: "file",
        icon: "trending-up",
        accept: ".pdf,.docx,.doc,.png,.jpg,.fig",
        maxSize: 10485760,
        description: "Upload Growth Suite specs and designs (PDF/Word/Images, max 10MB)"
      },
      "ESD Dashboard": {
        type: "file",
        icon: "layout-dashboard",
        accept: ".pdf,.docx,.doc,.png,.jpg,.fig",
        maxSize: 10485760,
        description: "Upload ESD Dashboard documentation and designs (PDF/Word/Images, max 10MB)"
      },
      "Association Management": {
        type: "file",
        icon: "users",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload Association Management documentation (PDF/Word/Excel, max 10MB)"
      }
    }
  },

  "2_Technical Architecture": {
    type: "folder",
    icon: "server",
    items: {
      "_placeholder": {
        type: "file",
        icon: "info",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "Technical Architecture — managed separately. Placeholder only."
      }
    }
  },

  "3_QA & Testing": {
    type: "folder",
    icon: "check-circle",
    items: {
      "_placeholder": {
        type: "file",
        icon: "info",
        accept: ".pdf,.docx,.doc",
        maxSize: 10485760,
        description: "QA & Testing — managed separately. Placeholder only."
      }
    }
  },

  "4_Customer & Support": {
    type: "folder",
    icon: "headphones",
    items: {
      "Email Trigger Logic": {
        type: "file",
        icon: "mail",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload email trigger logic documentation (PDF/Word/Excel, max 10MB)"
      },
      "Notification Workflows": {
        type: "file",
        icon: "bell",
        accept: ".pdf,.docx,.doc,.png,.jpg",
        maxSize: 10485760,
        description: "Upload notification workflow diagrams and specs (PDF/Word/Images, max 10MB)"
      },
      "Onboarding Flow Documentation": {
        type: "file",
        icon: "user-plus",
        accept: ".pdf,.docx,.doc,.png,.jpg,.svg",
        maxSize: 10485760,
        description: "Upload onboarding flow documentation (PDF/Word/Images, max 10MB)"
      },
      "Reporting Templates": {
        type: "file",
        icon: "file-text",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload reporting templates (PDF/Word/Excel, max 10MB)"
      },
      "SLA Execution Mechanics": {
        type: "file",
        icon: "clock",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 10485760,
        description: "Upload SLA execution mechanics documentation (PDF/Word/Excel, max 10MB)"
      }
    }
  },

  "5_Documentation & Governance Checklist": {
    type: "checklist",
    icon: "clipboard-list",
    description: "Live documentation and governance checklist — edit rows directly"
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

export const getItemType = (structure, path) => {
  const item = navigateToPath(structure, path);
  return item?.type || null;
};