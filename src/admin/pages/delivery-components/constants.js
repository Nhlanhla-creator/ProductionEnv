// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

export const CATEGORIES = [
  'Frontend',
  'Backend',
  'QA',
  'Security',
  'Traction',
  'Funding',
  'Intake/Comms'
];

export const ASSIGNEES = [
  'Lindelani',
  'Nhlanhla Msomi',
  'Makha',
  'Lerato Nama',
  'Thando',
  'Edward Molefe',
  'Lethabo',
  'Sbonelo'
];

export const STATUSES = ['Not started', 'In progress', 'Done', 'Blocked'];

export const STATUS_COLORS = {
  'Not started': '#ef4444',
  'In progress': '#f59e0b',
  'Done': '#10b981',
  'Blocked': '#6b7280'
};

export const CATEGORY_COLORS = {
  'Frontend': '#3b82f6',
  'Backend': '#8b5cf6',
  'QA': '#ec4899',
  'Security': '#f59e0b',
  'Traction': '#10b981',
  'Funding': '#ef4444',
  'Intake/Comms': '#06b6d4'
};

export const MEETING_TYPES = [
  'daily-standups',
  'weekly-reviews',
  'stakeholders',
  'technical-reviews'
];

// ============================================================================
// DEFAULT SPRINT COLUMNS
// Use these exact column definitions everywhere for consistency
// ============================================================================
export const DEFAULT_SPRINT_COLUMNS = [
  { 
    id: "id", 
    label: "Number", 
    type: "text", 
    editable: false 
  },
  { 
    id: "action", 
    label: "Task", 
    type: "text", 
    editable: true 
  },
  { 
    id: "category", 
    label: "Category", 
    type: "multi-select", 
    editable: true,
    options: CATEGORIES
  },
  { 
    id: "dependencies", 
    label: "Dependencies", 
    type: "text", 
    editable: true 
  },
  { 
    id: "assignee", 
    label: "By who", 
    type: "multi-select", 
    editable: true,
    options: ASSIGNEES
  },
  { 
    id: "startDate", 
    label: "From when", 
    type: "date", 
    editable: true 
  },
  { 
    id: "endDate", 
    label: "By when", 
    type: "date", 
    editable: true 
  },
  { 
    id: "status", 
    label: "Status", 
    type: "select", 
    editable: true,
    options: STATUSES
  }
];