/**
 * Pilots & Case Studies structure with file upload definitions
 * All sections use file uploads (no text editors or databases)
 */

export const PILOTS_STRUCTURE = {
  "Pilot Design": {
    type: "file",
    icon: "compass",
    accept: ".pdf,.docx,.doc,.pptx",
    maxSize: 2097152,
    description: "Upload pilot program designs and planning documents (PDF/Word/PPT, max 2MB)"
  },

  "Pilot Participants": {
    type: "file",
    icon: "users",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.csv",
    maxSize: 2097152,
    description: "Upload participant lists and profiles (PDF/Word/Excel/CSV, max 2MB)"
  },

  "Results Insights": {
    type: "file",
    icon: "bar-chart-2",
    accept: ".pdf,.docx,.doc,.xlsx,.xls,.pptx",
    maxSize: 2097152,
    description: "Upload pilot results, data analysis, and insights (PDF/Word/Excel/PPT, max 2MB)"
  },

  "Testimonials": {
    type: "file",
    icon: "message-square",
    accept: ".pdf,.docx,.doc,.mp4,.mp3",
    maxSize: 2097152,
    description: "Upload testimonial documents, videos, and audio (PDF/Word/Video/Audio, max 2MB)"
  },

  "Case Studies": {
    type: "file",
    icon: "book-open",
    accept: ".pdf,.docx,.doc,.pptx",
    maxSize: 2097152,
    description: "Upload detailed case study documentation (PDF/Word/PPT, max 2MB)"
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