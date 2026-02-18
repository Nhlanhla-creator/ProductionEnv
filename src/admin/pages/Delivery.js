import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './delivery-components/Sidebar';
import { EmptyState, ComingSoon } from './delivery-components/Placeholders';
import { SprintsView } from './delivery-components/SprintsView';
import { INITIAL_SPRINTS_DATA } from './delivery-components/initialData';
import { DEFAULT_SPRINT_COLUMNS } from './delivery-components/constants';
// import { ReseedDataButton } from './delivery-components/ReseedDataButton';
import { styles } from './delivery-components/styles';
import { useAuth } from '../../smses/hooks/useAuth'; // Adjust path as needed
import { useSprintSync } from '../../hooks/useSprintSync';
import { syncSprintToFirebase, deleteSprint } from './services/sprints';

// ============================================================================
// MAIN DELIVERY COMPONENT
// ============================================================================

const Delivery = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedSprints, setExpandedSprints] = useState({});
  const [showSyncStatus, setShowSyncStatus] = useState(false);
  
  // Firebase authentication
  const { user, loading: authLoading } = useAuth();
  
  // Firebase sync hook
  const {
    sprintsData,
    setSprintsData,
    isLoading: sprintsLoading,
    isSyncing,
    syncError,
    lastSyncTime,
    syncSprint,
    syncAllSprints,
    refreshFromFirebase
  } = useSprintSync(INITIAL_SPRINTS_DATA, user);

  // Auto-hide sync status after 3 seconds
  useEffect(() => {
    if (isSyncing) {
      // Show immediately when syncing starts
      setShowSyncStatus(true);
    } else if (syncError) {
      // Show when there's an error and keep visible (don't auto-hide)
      setShowSyncStatus(true);
    } else if (lastSyncTime) {
      // Show success message
      setShowSyncStatus(true);
      
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setShowSyncStatus(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSyncing, syncError, lastSyncTime]);

  // Manual dismiss for error state
  const dismissSyncError = useCallback(() => {
    setShowSyncStatus(false);
  }, []);

  // ========== SPRINT MANAGEMENT ==========
  const toggleSprint = useCallback((id) => {
    setExpandedSprints((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleUpdateTask = useCallback(async (sprintId, taskId, columnId, newValue) => {
    // Update local state
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      const updatedTasks = sprint.tasks.map(task =>
        task.id === taskId ? { ...task, [columnId]: newValue } : task
      );
      
      const updatedSprint = {
        ...sprint,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      };

      // Sync to Firebase (debounced)
      if (user) {
        syncSprintToFirebase(updatedSprint, 2000).catch(err => {
          console.error('Failed to sync task update:', err);
        });
      }

      return {
        ...prev,
        [sprintId]: updatedSprint
      };
    });
  }, [user]);

  const handleAddTask = useCallback(async (sprintId, newTask) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      if (!sprint) return prev;
      
      // Ensure newTask is an object, not just the ID
      console.log('Adding task to sprint:', sprintId, 'Task data:', newTask);
      
      const updatedSprint = {
        ...sprint,
        tasks: [...sprint.tasks, newTask],
        updatedAt: new Date().toISOString()
      };

      // Sync to Firebase
      if (user) {
        syncSprintToFirebase(updatedSprint, 1000).catch(err => {
          console.error('Failed to sync new task:', err);
        });
      }

      return {
        ...prev,
        [sprintId]: updatedSprint
      };
    });
  }, [user]);

  const handleUpdateSprint = useCallback(async (sprintId, updates) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      if (!sprint) return prev;

      const updatedSprint = {
        ...sprint,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Sync to Firebase
      if (user) {
        syncSprintToFirebase(updatedSprint, 1000).catch(err => {
          console.error('Failed to sync sprint update:', err);
        });
      }

      return {
        ...prev,
        [sprintId]: updatedSprint
      };
    });
  }, [user]);

  const handleDeleteTask = useCallback(async (sprintId, taskId) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      const updatedSprint = {
        ...sprint,
        tasks: sprint.tasks.filter(task => task.id !== taskId),
        updatedAt: new Date().toISOString()
      };

      // Sync to Firebase
      if (user) {
        syncSprintToFirebase(updatedSprint, 500).catch(err => {
          console.error('Failed to sync task deletion:', err);
        });
      }

      return {
        ...prev,
        [sprintId]: updatedSprint
      };
    });
  }, [user]);

  const handleAddColumn = useCallback(async (sprintId, newColumn) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      const updatedColumns = [...(sprint.columns || []), newColumn];
      
      // Add new column to all existing tasks with default value
      const updatedTasks = sprint.tasks.map(task => ({
        ...task,
        [newColumn.id]: newColumn.type === 'multi-select' ? [] : 
                       newColumn.type === 'select' ? 'Not started' : ''
      }));

      const updatedSprint = {
        ...sprint,
        columns: updatedColumns,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      };

      // Sync to Firebase
      if (user) {
        syncSprintToFirebase(updatedSprint, 1000).catch(err => {
          console.error('Failed to sync column addition:', err);
        });
      }

      return {
        ...prev,
        [sprintId]: updatedSprint
      };
    });
  }, [user]);

  const handleDeleteColumn = useCallback(async (sprintId, columnId) => {
    setSprintsData(prev => {
      const sprint = prev[sprintId];
      
      // Remove column from columns array
      const updatedColumns = sprint.columns.filter(col => col.id !== columnId);
      
      // Remove column data from all tasks
      const updatedTasks = sprint.tasks.map(task => {
        const { [columnId]: removed, ...rest } = task;
        return rest;
      });

      const updatedSprint = {
        ...sprint,
        columns: updatedColumns,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      };

      // Sync to Firebase
      if (user) {
        syncSprintToFirebase(updatedSprint, 1000).catch(err => {
          console.error('Failed to sync column deletion:', err);
        });
      }

      return {
        ...prev,
        [sprintId]: updatedSprint
      };
    });
  }, [user]);

  const handleAddSprint = useCallback(async () => {
    const newSprintId = Math.max(...Object.keys(sprintsData).map(Number)) + 1;
    
    const newSprint = {
      id: newSprintId,
      name: `Sprint ${newSprintId}`,
      subtitle: 'New sprint - add your description',
      tasks: [],
      columns: DEFAULT_SPRINT_COLUMNS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSprintsData(prev => {
      const updated = {
        ...prev,
        [newSprintId]: newSprint
      };

      // Sync to Firebase
      if (user) {
        syncSprintToFirebase(newSprint, 500).catch(err => {
          console.error('Failed to sync new sprint:', err);
        });
      }

      return updated;
    });
  }, [sprintsData, user]);

  const handleDeleteSprint = useCallback(async (sprintId) => {
    try {
      // Delete from Firebase first
      if (user) {
        await deleteSprint(sprintId);
      }
      
      // Then update local state
      setSprintsData(prev => {
        const newSprintsData = { ...prev };
        delete newSprintsData[sprintId];
        return newSprintsData;
      });
    } catch (error) {
      console.error('Failed to delete sprint:', error);
      throw error;
    }
  }, [user]);

  // ========== RENDER ==========
  
  // Show loading state while auth or sprints are loading
  if (authLoading || sprintsLoading) {
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
            min-height: 100vh;
          }

          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            gap: 16px;
          }

          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--pale-brown);
            border-top-color: var(--primary-brown);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        
        <div className="delivery-wrapper">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p style={{ color: 'var(--text-brown)' }}>
              {authLoading ? 'Authenticating...' : 'Loading sprints...'}
            </p>
          </div>
        </div>
      </>
    );
  }

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
          min-height: 100vh;
        }

        * {
          box-sizing: border-box;
        }

        /* Hover effects */
        .delivery-wrapper tr:hover {
          background: #f9f9f9;
        }

        .delivery-wrapper button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .delivery-wrapper button:active {
          transform: translateY(0);
        }

        .delivery-wrapper label:has(input[type="checkbox"]):hover {
          background: #e0e0e0;
        }

        /* Prevent click propagation on edit controls */
        .edit-controls-wrapper {
          pointer-events: all;
        }

        .edit-controls-wrapper * {
          pointer-events: all;
        }

        /* Sync status indicator */
        .sync-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 12px 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-brown);
          z-index: 1000;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease-in-out;
          pointer-events: none;
        }

        .sync-status.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .sync-status.syncing {
          background: #fef3c7;
          border: 1px solid #fbbf24;
        }

        .sync-status.error {
          background: #fee2e2;
          border: 1px solid #ef4444;
        }

        .sync-status.success {
          background: #d1fae5;
          border: 1px solid #10b981;
        }

        .sync-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .sync-indicator.syncing {
          background: #fbbf24;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .sync-indicator.error {
          background: #ef4444;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="delivery-wrapper">
        <div style={styles.pageTitle}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <h1 style={styles.titleText}>DELIVERY</h1>
              {user && (
                <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {lastSyncTime && (
                    <span style={{ fontSize: 11, color: '#999' }}>
                      Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* {user && activeCategory === 'sprints' && (
              <ReseedDataButton onComplete={refreshFromFirebase} />
            )} */}
          </div>
        </div>

        <div>
          <Sidebar 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
          />

          <div style={styles.mainContent}>
            {!activeCategory && <EmptyState />}
            
            {activeCategory === 'meetings' && <ComingSoon />}

            {activeCategory === 'sprints' && (
              <SprintsView
                sprintsData={sprintsData}
                expandedSprints={expandedSprints}
                toggleSprint={toggleSprint}
                handleUpdateTask={handleUpdateTask}
                handleAddTask={handleAddTask}
                handleDeleteTask={handleDeleteTask}
                handleAddColumn={handleAddColumn}
                handleDeleteColumn={handleDeleteColumn}
                handleAddSprint={handleAddSprint}
                handleDeleteSprint={handleDeleteSprint}
                handleUpdateSprint={handleUpdateSprint}
              />
            )}
          </div>
        </div>

        {/* Sync Status Indicator */}
        {user && (
          <div className={`sync-status ${showSyncStatus ? 'visible' : ''} ${isSyncing ? 'syncing' : syncError ? 'error' : 'success'}`}>
            <div className={`sync-indicator ${isSyncing ? 'syncing' : syncError ? 'error' : ''}`}></div>
            <span>
              {isSyncing ? 'Syncing...' : syncError ? 'Sync error' : 'All changes saved'}
            </span>
            {syncError && (
              <>
                <button 
                  onClick={() => {
                    refreshFromFirebase();
                    dismissSyncError();
                  }}
                  style={{
                    padding: '4px 8px',
                    background: 'var(--primary-brown)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
                <button 
                  onClick={dismissSyncError}
                  style={{
                    padding: '4px 8px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                    marginLeft: 4
                  }}
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Delivery;