import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
  Star,
  RefreshCw,
  User,
  Zap,
  Search,
  SlidersHorizontal,
  Plus,
  MoreHorizontal
} from 'lucide-react';

const Delivery = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [activeViews, setActiveViews] = useState({});

  const setActiveView = (sprintId, view) => {
    setActiveViews(prev => ({
      ...prev,
      [sprintId]: view
    }));
  };

  const getActiveView = (sprintId) => {
    return activeViews[sprintId] || 'all-tasks';
  };

  const meetingTypes = [
    'daily-standups',
    'weekly-reviews',
    'stakeholders',
    'technical-reviews'
  ];

  const sprintsData = [
    { id: 0, name: 'Sprint 0', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 1, name: 'Sprint 1', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 2, name: 'Sprint 2', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 3, name: 'Sprint 3', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 4, name: 'Sprint 4', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    {
      id: 5,
      name: 'Sprint 5',
      subtitle: 'Stay organized with tasks, your way.',
      tasks: [
        {
          name: 'Fix login redirector for smse, change the name sme to smses',
          status: 'Done',
          category: 'Backend',
          assignee: 'Lindelani',
          startDate: '01/05/2025',
          dueDate: '08/05/2025',
        },
        {
          name: 'remove payment methods everywhere',
          status: 'Done',
          category: 'Frontend',
          assignee: 'Nhlanhla Msomi',
          startDate: '05/11/2025',
          dueDate: '08/11/2025',
        }
      ]
    },
    { id: 6, name: 'Sprint 6', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 7, name: 'Sprint 7', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 8, name: 'Sprint 8', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    { id: 9, name: 'Sprint 9', subtitle: 'Stay organized with tasks, your way.', tasks: [] },
    {
      id: 10,
      name: 'Sprint 10',
      subtitle: 'Stay organized with tasks, your way.',
      tasks: [
        {
          name: 'Big score summary not up to date',
          status: 'Not started',
          category: 'Backend',
          assignee: 'Lindelani',
          startDate: '',
          dueDate: '',
        },
        {
          name: 'Conditional business plan upload based on advisor existence',
          status: 'Not started',
          category: 'Backend',
          assignee: 'Lindelani',
          startDate: '',
          dueDate: '',
        }
      ]
    },
  ];

  const toggleSprint = (id) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
      <style>{`
        :root {
          --light-brown: #f5f0e1;
          --medium-brown: #e6d7c3;
          --accent-brown: #c8b6a6;
          --primary-brown: #a67c52;
          --dark-brown: #7d5a50;
          --text-brown: #4a352f;
          --background-brown: #faf7f2;
          --pale-brown: #f0e6d9;
          --sidebar-width: 280px;
        }

        .delivery-wrapper {
          margin-left: var(--sidebar-width);
          background: var(--background-brown);
          min-height: 100vh;
        }
      `}</style>

      <div className="delivery-wrapper">
        <div style={styles.pageTitle}>
          <h1 style={styles.titleText}>DELIVERY</h1>
        </div>

        <div style={styles.contentWrapper}>
          {/* Sidebar */}
          <div style={styles.categorySidebar}>
            <div
              style={{
                ...styles.categoryButton,
                ...(activeCategory === 'meetings' && styles.categoryButtonActive)
              }}
              onClick={() =>
                setActiveCategory(activeCategory === 'meetings' ? null : 'meetings')
              }
            >
              <ChevronRight
                size={16}
                style={{
                  transform: activeCategory === 'meetings' ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
              <span>Meetings</span>
            </div>

            <div
              style={{
                ...styles.categoryButton,
                ...(activeCategory === 'sprints' && styles.categoryButtonActive)
              }}
              onClick={() =>
                setActiveCategory(activeCategory === 'sprints' ? null : 'sprints')
              }
            >
              <ChevronRight
                size={16}
                style={{
                  transform: activeCategory === 'sprints' ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
              <span>Sprints</span>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {!activeCategory && (
              <div style={styles.emptyState}>
                <AlertCircle size={48} color="var(--accent-brown)" />
                <p style={styles.emptyText}>Select a category to view details</p>
              </div>
            )}

            {/* ✅ MEETINGS VIEW */}
            {activeCategory === 'meetings' && (
              <div style={styles.sprintsContainer}>
                {meetingTypes.map((meeting) => (
                  <div key={meeting} style={styles.sprintCard}>
                    <div style={styles.sprintCardHeader}>
                      <ChevronRight size={18} />
                      <strong style={styles.sprintName}>{meeting}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SPRINTS VIEW (unchanged) */}
            {activeCategory === 'sprints' && (
              <div style={styles.sprintsContainer}>
                {sprintsData.map((sprint) => (
                  <div key={sprint.id} style={styles.sprintCard}>
                    <div
                      style={styles.sprintCardHeader}
                      onClick={() => toggleSprint(sprint.id)}
                    >
                      {expandedSprints[sprint.id] ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                      <strong style={styles.sprintName}>{sprint.name}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
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
  },
  contentWrapper: {
    display: 'flex',
  },
  categorySidebar: {
    width: 300,
    background: 'var(--pale-brown)',
    borderRight: '1px solid var(--medium-brown)',
    padding: '20px 0',
  },
  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: 15,
    color: 'var(--text-brown)',
  },
  categoryButtonActive: {
    background: '#fff',
    fontWeight: 600,
  },
  mainContent: {
    flex: 1,
    padding: 24,
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
  },
  sprintsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sprintCard: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: 6,
  },
  sprintCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 18px',
  },
  sprintName: {
    fontSize: 15,
    fontWeight: 600,
  },
};

export default Delivery;
