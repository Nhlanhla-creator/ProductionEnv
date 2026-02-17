// ============================================================================
// QA TABLE COLUMNS DEFINITION
// ============================================================================

export const QA_COLUMNS = [
  { id: 'taskId',       label: 'Task ID',       type: 'text',   editable: false, width: 90  },
  { id: 'category',     label: 'Category',      type: 'select', editable: true,  width: 110 },
  { id: 'dashboard',    label: 'Dashboard',     type: 'select', editable: true,  width: 110 },
  { id: 'section',      label: 'Section',       type: 'text',   editable: true,  width: 150 },
  { id: 'taskName',     label: 'Task Name',     type: 'text',   editable: true,  width: 200 },
  { id: 'status',       label: 'Status',        type: 'status', editable: true,  width: 100 },
  { id: 'dueDate',      label: 'Due Date',      type: 'date',   editable: true,  width: 110 },
  { id: 'testedWhen',   label: 'Tested When',   type: 'date',   editable: true,  width: 120 },
  { id: 'assignedTo',   label: 'Assigned To',   type: 'select', editable: true,  width: 130 },
  { id: 'testType',     label: 'Test Type',     type: 'select', editable: true,  width: 120 },
  { id: 'actionStatus', label: 'Action Status', type: 'action', editable: true,  width: 110 },
];

// ============================================================================
// OPTION LISTS
// ============================================================================

export const DASHBOARD_OPTIONS   = ['SMSE', 'Investor', 'Advisor', 'Catalyst', 'All'];
export const CATEGORY_OPTIONS    = ['Security', 'Unit Tests', 'Integration Tests', 'E2E Tests', 'Performance Tests', 'Test Data'];
export const STATUS_OPTIONS      = ['Pass', 'Fail', 'Not started', 'In progress', 'Blocked'];
export const ACTION_STATUS_OPTIONS = ['Done', 'Not started', 'In progress'];
export const TEST_TYPE_OPTIONS   = ['Security', 'Integration', 'Functionality', 'Performance'];
export const ASSIGNEE_OPTIONS    = ['Lindelani', 'Nhlanhla Msomi', 'Makha', 'Lerato Nama', 'Molefi', 'Owami Ngobese', 'Lethabo Mashimby'];

// ============================================================================
// COLOR MAPS
// ============================================================================

export const STATUS_COLORS = {
  'Pass':        { bg: '#10b981', text: '#fff' },
  'Fail':        { bg: '#ef4444', text: '#fff' },
  'Not started': { bg: '#6b7280', text: '#fff' },
  'In progress': { bg: '#f59e0b', text: '#fff' },
  'Blocked':     { bg: '#8b5cf6', text: '#fff' },
};

export const ACTION_COLORS = {
  'Done':        { bg: '#10b981', text: '#fff' },
  'Not started': { bg: '#6b7280', text: '#fff' },
  'In progress': { bg: '#f59e0b', text: '#fff' },
};

export const DASHBOARD_COLORS = {
  'SMSE':     '#3b82f6',
  'Investor': '#8b5cf6',
  'Advisor':  '#ec4899',
  'Catalyst': '#f59e0b',
  'All':      '#10b981',
};

// ============================================================================
// STATIC INITIAL DATA (from Notion screenshots)
// ============================================================================

export const INITIAL_QA_TASKS = [
  { taskId: 'ID-ST-01', category: 'Security',           dashboard: 'Investor', section: 'LoginRegisterPage',      taskName: 'Investor email verification',           status: 'Pass',        dueDate: '2025-11-18', testedWhen: '2025-11-18', assignedTo: 'Lindelani',        testType: 'Security',      actionStatus: 'Done'        },
  { taskId: 'SD-IT-01', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'Profile document upload', taskName: 'Document files unnamed',               status: 'Pass',        dueDate: '2025-11-18', testedWhen: '2025-11-18', assignedTo: 'Lindelani',        testType: 'Integration',   actionStatus: 'Done'        },
  { taskId: 'SD-IT-02', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'Matches',                taskName: 'Match breakdown underscores',           status: 'Pass',        dueDate: '2025-11-18', testedWhen: '2025-11-18', assignedTo: 'Lindelani',        testType: 'Integration',   actionStatus: 'Done'        },
  { taskId: 'SD-FT-01', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Funder matches',         taskName: 'Funder Filters',                       status: 'Pass',        dueDate: '2026-01-21', testedWhen: '2026-02-02', assignedTo: 'Owami Ngobese',    testType: 'Functionality', actionStatus: 'Done'        },
  { taskId: 'SD-IT-03', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'Customer matches',       taskName: 'Eye action on Customer matches',        status: 'Pass',        dueDate: '2026-01-24', testedWhen: '2026-02-03', assignedTo: 'Makha',            testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'SD-FT-02', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Customer matches',       taskName: 'Message action on customer matches',    status: 'Pass',        dueDate: '2026-01-23', testedWhen: '2026-02-03', assignedTo: 'Makha',            testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'SD-FT-03', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Advisor matches',        taskName: 'Rate and eye buttons advisor matches',  status: 'Fail',        dueDate: '2026-01-23', testedWhen: '2026-02-04', assignedTo: 'Molefi',           testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'SD-FT-04', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Funder matches',         taskName: 'Anonymous Investor',                   status: 'Pass',        dueDate: '2026-01-23', testedWhen: '2026-02-05', assignedTo: 'Molefi',           testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'D-IT-04',  category: 'Integration Tests',  dashboard: 'All',      section: 'Settings',               taskName: 'Settings account information',          status: 'Pass',        dueDate: '2025-11-19', testedWhen: '2026-02-06', assignedTo: 'Molefi',           testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'SD-IT-05', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'Supplier matches',       taskName: 'Supplier matches breakdown controls',   status: 'Pass',        dueDate: '2025-11-19', testedWhen: '2026-02-06', assignedTo: 'Lindelani',        testType: 'Integration',   actionStatus: 'Done'        },
  { taskId: 'SD-FT-05', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Funder matches',         taskName: 'Funder matches help button',            status: 'Pass',        dueDate: '2025-11-19', testedWhen: '2026-02-09', assignedTo: 'Lindelani',        testType: 'Functionality', actionStatus: 'Done'        },
  { taskId: 'SD-FT-06', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Supplier matches',       taskName: 'Supplier matches filters',              status: 'Fail',        dueDate: '2026-01-21', testedWhen: '',           assignedTo: 'Owami Ngobese',    testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'SD-FT-07', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Customer matches',       taskName: 'Customer matches filter',               status: 'Fail',        dueDate: '2026-01-21', testedWhen: '',           assignedTo: 'Owami Ngobese',    testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'SD-FT-08', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Catalyst matches',       taskName: 'Catalyst matches filter',               status: 'Fail',        dueDate: '2026-01-21', testedWhen: '',           assignedTo: 'Owami Ngobese',    testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'D-FT-09',  category: 'E2E Tests',          dashboard: 'All',      section: 'Profile icon',           taskName: 'Role switch',                          status: 'Pass',        dueDate: '',           testedWhen: '',           assignedTo: 'Lindelani',        testType: 'Functionality', actionStatus: 'Done'        },
  { taskId: 'SD-FT-10', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Funder matches',         taskName: 'Get help button on funder matches',     status: 'Pass',        dueDate: '',           testedWhen: '',           assignedTo: 'Nhlanhla Msomi',   testType: 'Functionality', actionStatus: 'Done'        },
  { taskId: 'SD-IT-06', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'Big Score',              taskName: 'Governance score breakdown',            status: 'Pass',        dueDate: '',           testedWhen: '',           assignedTo: 'Makha',            testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'ID-IT-07', category: 'Integration Tests',  dashboard: 'Investor', section: 'Portfolio',              taskName: 'Finish up my portfolio',               status: 'Pass',        dueDate: '',           testedWhen: '',           assignedTo: 'Lerato Nama',      testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'ID-IT-08', category: 'Integration Tests',  dashboard: 'Investor', section: 'Notification bell',      taskName: 'Notification bell unnamed business',   status: 'Fail',        dueDate: '2026-01-23', testedWhen: '',           assignedTo: 'Lindelani',        testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'ID-IT-09', category: 'Integration Tests',  dashboard: 'Investor', section: 'Notification bell',      taskName: 'Unnamed business font size',           status: 'Fail',        dueDate: '2026-01-23', testedWhen: '',           assignedTo: 'Nhlanhla Msomi',   testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'SD-FT-11', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'Big score',              taskName: 'Capital appeal',                       status: 'Pass',        dueDate: '',           testedWhen: '',           assignedTo: 'Lindelani',        testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'AD-FT-12', category: 'E2E Tests',          dashboard: 'Advisor',  section: 'Profile',                taskName: 'Verification score',                   status: 'Fail',        dueDate: '2026-02-06', testedWhen: '',           assignedTo: 'Lindelani',        testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'D-IT-10',  category: 'Integration Tests',  dashboard: 'All',      section: 'Billings & Payments',    taskName: 'Payment gateway',                      status: 'Fail',        dueDate: '2026-02-10', testedWhen: '2026-02-10', assignedTo: 'Lethabo Mashimby',  testType: 'Integration',   actionStatus: 'Done'        },
  { taskId: 'SD-IT-11', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'My BIG Score',           taskName: 'BIG Score Calculation',                status: 'Pass',        dueDate: '',           testedWhen: '2026-02-06', assignedTo: 'Lindelani',        testType: 'Integration',   actionStatus: 'Done'        },
  { taskId: 'SD-FT-13', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'My Growth suite',        taskName: 'Growth suite functionality',           status: 'Pass',        dueDate: '2026-02-11', testedWhen: '2026-02-11', assignedTo: 'Nhlanhla Msomi',   testType: 'Functionality', actionStatus: 'Done'        },
  { taskId: 'SD-FT-14', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'My Matches',             taskName: 'Matches functionality & UI',           status: 'Fail',        dueDate: '2026-02-10', testedWhen: '',           assignedTo: 'Makha',            testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'SD-FT-15', category: 'E2E Tests',          dashboard: 'SMSE',     section: 'My matches',             taskName: 'The Lifecycle',                        status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'SD-IT-14', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'My Documents',           taskName: 'Documents Integration',                status: 'Pass',        dueDate: '2026-02-10', testedWhen: '2026-02-11', assignedTo: 'Lethabo Mashimby',  testType: 'Integration',   actionStatus: 'Done'        },
  { taskId: 'SD-IT-15', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'My messages',            taskName: 'Events functionality',                 status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'ID-IT-17', category: 'Integration Tests',  dashboard: 'SMSE',     section: 'BIG Insights',           taskName: 'BIG Insights functionality',           status: 'Pass',        dueDate: '2026-02-11', testedWhen: '2026-02-11', assignedTo: 'Lethabo Mashimby',  testType: 'Functionality', actionStatus: 'Done'        },
  { taskId: 'ID-FT-17', category: 'E2E Tests',          dashboard: 'Investor', section: 'Profile',                taskName: 'Verification score',                   status: 'Pass',        dueDate: '2026-02-06', testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'ID-FT-16', category: 'E2E Tests',          dashboard: 'Investor', section: 'My matches',             taskName: 'My matches functionality & UI',        status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'ID-FT-17', category: 'E2E Tests',          dashboard: 'Investor', section: 'My Cohorts',             taskName: 'My cohort functionality',              status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'ID-FT-18', category: 'E2E Tests',          dashboard: 'Investor', section: 'My Portfolio',           taskName: 'My portfolio functionality',           status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'ID-IT-18', category: 'Integration Tests',  dashboard: 'Investor', section: 'BIG Insight',            taskName: 'BIG Insight functionality',            status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'ID-IT-19', category: 'Integration Tests',  dashboard: 'Investor', section: 'My Documents',           taskName: 'Documents Functionality',              status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'ID-IT-19', category: 'Integration Tests',  dashboard: 'Investor', section: 'My messages',            taskName: 'Events functionality',                 status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'AD-FT-20', category: 'E2E Tests',          dashboard: 'Advisor',  section: 'My matches',             taskName: 'My matches functionality & UI',        status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'AD-FT-21', category: 'E2E Tests',          dashboard: 'Advisor',  section: 'My matches',             taskName: 'Match filters',                        status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'AD-IT-20', category: 'Integration Tests',  dashboard: 'Advisor',  section: 'BIG Insights',           taskName: 'BIG Insight functionality',            status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'AD-FT-22', category: 'E2E Tests',          dashboard: 'Advisor',  section: 'My documents',           taskName: 'Documents functionality',              status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'AD-IT-21', category: 'Integration Tests',  dashboard: 'Advisor',  section: 'My messages',            taskName: 'Event functionality',                  status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'CD-IT-22', category: 'Integration Tests',  dashboard: 'Catalyst', section: 'BIG Insight',            taskName: 'BIG Insight functionality',            status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Integration',   actionStatus: 'Not started' },
  { taskId: 'CD-FT-23', category: 'E2E Tests',          dashboard: 'Catalyst', section: 'My Cohorts',             taskName: 'My Cohorts functionality',             status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'CD-FT-24', category: 'E2E Tests',          dashboard: 'Catalyst', section: 'My investments',         taskName: 'My Investment functionality',          status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'CD-FT-23', category: 'E2E Tests',          dashboard: 'Catalyst', section: 'My Matches',             taskName: 'My matches functionality & UI',        status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'CD-FT-24', category: 'E2E Tests',          dashboard: 'Catalyst', section: 'My documents',           taskName: 'My document functionality',            status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
  { taskId: 'CD-FT-25', category: 'E2E Tests',          dashboard: 'Catalyst', section: 'My Messages',            taskName: 'Event functionality',                  status: 'Not started', dueDate: '',           testedWhen: '',           assignedTo: '',                 testType: 'Functionality', actionStatus: 'Not started' },
];