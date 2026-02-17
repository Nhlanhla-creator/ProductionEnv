// ============================================================================
// STYLES
// ============================================================================

export const styles = {
  pageTitle: {
    padding: '20px 32px',
    background: '#fff',
    borderBottom: '1px solid var(--medium-brown)',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 600,
    margin: 0,
    color: 'var(--text-brown)',
    letterSpacing: '0.5px'
  },
  contentWrapper: {
    display: 'flex',
  },
  categorySidebar: {
    width: 300,
    background: 'var(--pale-brown)',
    borderRight: '1px solid var(--medium-brown)',
    padding: '20px 0',
    minHeight: 'calc(100vh - 68px)'
  },
  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: 15,
    color: 'var(--text-brown)',
    transition: 'all 0.2s',
    userSelect: 'none'
  },
  categoryButtonActive: {
    background: '#fff',
    fontWeight: 600,
  },
  mainContent: {
    flex: 1,
    padding: 24,
    minHeight: 'calc(100vh - 68px)',
    maxWidth: '100%',
    overflow: 'auto'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 100,
    gap: 12,
  },
  emptyText: {
    color: 'var(--accent-brown)',
    fontSize: 16
  },
  comingSoon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 100,
    gap: 12,
  },
  comingSoonText: {
    color: 'var(--accent-brown)',
    fontSize: 16
  },
  sprintsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sprintsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sprintsTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-brown)',
    margin: 0
  },
  addSprintBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: 'var(--primary-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  sprintCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    transition: 'box-shadow 0.2s'
  },
  sprintCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.2s'
  },
  sprintHeaderContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 16
  },
  sprintName: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-brown)'
  },
  sprintSubtitle: {
    fontSize: 13,
    color: '#666',
    flex: 1
  },
  taskCount: {
    fontSize: 12,
    color: '#999',
    background: 'var(--pale-brown)',
    padding: '4px 10px',
    borderRadius: 12
  },
  sprintContent: {
    borderTop: '1px solid #e0e0e0',
    padding: 20,
    background: '#fafafa'
  },
  tableContainer: {
    width: '100%'
  },
  tableControls: {
    display: 'flex',
    gap: 12,
    marginBottom: 16
  },
  addTaskBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'var(--primary-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  addColumnBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'var(--accent-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  tableWrapper: {
    overflowX: 'auto',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e0e0e0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14
  },
  tableHeaderRow: {
    background: 'var(--pale-brown)'
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--text-brown)',
    borderBottom: '2px solid var(--medium-brown)',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    transition: 'background 0.15s',
    cursor: 'pointer'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #e0e0e0',
    verticalAlign: 'middle'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    color: '#fff'
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 500,
    color: '#fff',
    marginRight: 4,
    marginBottom: 4
  },
  multiSelectDisplay: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4
  },
  editControls: {
    display: 'flex',
    gap: 6,
    alignItems: 'center'
  },
  editInput: {
    padding: '6px 10px',
    border: '1px solid var(--accent-brown)',
    borderRadius: 4,
    fontSize: 13,
    flex: 1,
    minWidth: 120
  },
  multiSelectEdit: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    background: '#f9f9f9',
    borderRadius: 4,
    maxHeight: 200,
    overflowY: 'auto',
    minWidth: 180
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 3,
    transition: 'background 0.15s',
    '&:hover': {
      background: '#e0e0e0'
    }
  },
  saveBtn: {
    padding: '6px 10px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0
  },
  cancelBtn: {
    padding: '6px 10px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0
  },
  deleteBtn: {
    padding: '6px 10px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0
  },
  emptyTable: {
    padding: 40,
    textAlign: 'center',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e0e0e0'
  },
  emptyTableText: {
    color: '#666',
    marginBottom: 16,
    fontSize: 14
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalContent: {
    padding: '24px'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  formInput: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  formSelect: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none'
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
    padding: 16
  },
  cancelButton: {
    padding: '10px 16px',
    background: '#fff',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  saveButton: {
    padding: '10px 16px',
    background: 'var(--primary-brown)',
    color: '#fff',
    border: '1px solid var(--primary-brown)',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  closeButton: {
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 6,
    background: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  addOptionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: 'var(--primary-brown)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginLeft: 'auto'
  },
  optionRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  },
  removeOptionBtn: {
    width: 32,
    height: 32,
    border: '1px solid #ef4444',
    background: '#fff',
    color: '#ef4444',
    borderRadius: 4,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  warningBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4
  },
  multiSelectContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    background: '#f9fafb',
    borderRadius: 6,
    border: '1px solid #e5e7eb'
  }
};