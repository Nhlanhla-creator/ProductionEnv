/**
 * Product Platform structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const PRODUCT_STRUCTURE = {
  "Platform Modules": {
    type: "folder",
    icon: "layers",
    items: {
      "SME Onboarding": {
        type: "file",
        icon: "user-plus",
        accept: ".pdf,.docx,.doc",
        maxSize: 2097152,
        description: "Upload SME onboarding documentation (PDF/Word, max 2MB)"
      },
      "BIG Score": {
        type: "folder",
        icon: "award",
        items: {
          "Overview & Definitions": {
            type: "file",
            icon: "book-open",
            accept: ".pdf,.docx,.doc",
            maxSize: 2097152,
            description: "Upload BIG Score overview document (PDF/Word, max 2MB)"
          },
          "Scoring Logic": {
            type: "folder",
            icon: "calculator",
            items: {
              "BIG Score Methodology": {
                type: "file",
                icon: "book",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload scoring methodology (PDF/Word, max 2MB)"
              },
              "Scoring Logic Rules": {
                type: "file",
                icon: "list",
                accept: ".pdf,.docx,.doc,.xlsx,.xls",
                maxSize: 2097152,
                description: "Upload scoring rules (PDF/Word/Excel, max 2MB)"
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
              "AI ML Models": {
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
                description: "Upload funder feedback (PDF/Word, max 2MB)"
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
                maxSize: 2097152,
                description: "Upload compliance score documentation (PDF/Word, max 2MB)"
              },
              "Legitimacy Score": {
                type: "file",
                icon: "check-square",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload legitimacy score documentation (PDF/Word, max 2MB)"
              },
              "Leadership Score": {
                type: "file",
                icon: "users",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload leadership score documentation (PDF/Word, max 2MB)"
              },
              "Governance Score": {
                type: "file",
                icon: "briefcase",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload governance score documentation (PDF/Word, max 2MB)"
              },
              "Capital Appeal Score": {
                type: "file",
                icon: "dollar-sign",
                accept: ".pdf,.docx,.doc",
                maxSize: 2097152,
                description: "Upload capital appeal score documentation (PDF/Word, max 2MB)"
              }
            }
          }
        }
      },
      "Matching Engine": {
        type: "file",
        icon: "git-merge",
        accept: ".pdf,.docx,.doc,.xlsx,.xls",
        maxSize: 2097152,
        description: "Upload matching engine documentation (PDF/Word/Excel, max 2MB)"
      },
      "Dashboards": {
        type: "file",
        icon: "layout-dashboard",
        accept: ".pdf,.docx,.doc,.png,.jpg,.fig",
        maxSize: 2097152,
        description: "Upload dashboard designs and specs (PDF/Word/Images, max 2MB)"
      },
      "Payments": {
        type: "folder",
        icon: "credit-card",
        items: {
          "Payment Gateways": {
            type: "file",
            icon: "landmark",
            accept: ".pdf,.docx,.doc",
            maxSize: 2097152,
            description: "Upload payment gateway documentation (PDF/Word, max 2MB)"
          },
          "Invoicing": {
            type: "file",
            icon: "file-text",
            accept: ".pdf,.docx,.doc,.xlsx,.xls",
            maxSize: 2097152,
            description: "Upload invoicing documentation (PDF/Word/Excel, max 2MB)"
          },
          "Refunds": {
            type: "file",
            icon: "rotate-ccw",
            accept: ".pdf,.docx,.doc",
            maxSize: 2097152,
            description: "Upload refunds policy and process (PDF/Word, max 2MB)"
          }
        }
      },
      "API Integrations": {
        type: "file",
        icon: "code",
        accept: ".pdf,.docx,.doc,.json",
        maxSize: 2097152,
        description: "Upload API documentation (PDF/Word/JSON, max 2MB)"
      }
    }
  },

  "Messaging and Alerts": {
    type: "file",
    icon: "bell",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload messaging and alerts specifications (PDF/Word, max 2MB)"
  },

  "Customer Services": {
    type: "file",
    icon: "headphones",
    accept: ".pdf,.docx,.doc",
    maxSize: 2097152,
    description: "Upload customer service documentation (PDF/Word, max 2MB)"
  },

  "User Flows": {
    type: "file",
    icon: "workflow",
    accept: ".pdf,.docx,.doc,.png,.jpg,.svg",
    maxSize: 2097152,
    description: "Upload user flow diagrams (PDF/Word/Images, max 2MB)"
  },

  "UX Requirements": {
    type: "file",
    icon: "monitor",
    accept: ".pdf,.docx,.doc,.fig",
    maxSize: 2097152,
    description: "Upload UX requirements and designs (PDF/Word/Figma, max 2MB)"
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