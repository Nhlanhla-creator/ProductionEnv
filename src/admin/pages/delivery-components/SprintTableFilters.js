import React from 'react';
import { X, Filter } from 'lucide-react';
import { styles } from './styles';

// ============================================================================
// SPRINT TABLE FILTERS COMPONENT
// ============================================================================

export const SprintTableFilters = ({ 
  filters, 
  onFilterChange, 
  sprint,
  onClearFilters 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Extract unique values from sprint tasks
  const uniqueCategories = React.useMemo(() => {
    const cats = new Set();
    sprint.tasks.forEach(task => {
      if (Array.isArray(task.category)) {
        task.category.forEach(cat => cats.add(cat));
      } else if (task.category) {
        cats.add(task.category);
      }
    });
    return Array.from(cats).sort();
  }, [sprint.tasks]);

  const uniqueAssignees = React.useMemo(() => {
    const assignees = new Set();
    sprint.tasks.forEach(task => {
      if (Array.isArray(task.assignee)) {
        task.assignee.forEach(person => assignees.add(person));
      } else if (task.assignee) {
        assignees.add(task.assignee);
      }
    });
    return Array.from(assignees).sort();
  }, [sprint.tasks]);

  const uniqueStatuses = React.useMemo(() => {
    const statuses = new Set();
    sprint.tasks.forEach(task => {
      if (task.status) statuses.add(task.status);
    });
    return Array.from(statuses).sort();
  }, [sprint.tasks]);

  const hasActiveFilters = 
    filters.categories.length > 0 || 
    filters.assignees.length > 0 || 
    filters.statuses.length > 0;

  const handleCategoryToggle = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const handleAssigneeToggle = (assignee) => {
    const newAssignees = filters.assignees.includes(assignee)
      ? filters.assignees.filter(a => a !== assignee)
      : [...filters.assignees, assignee];
    onFilterChange({ ...filters, assignees: newAssignees });
  };

  const handleStatusToggle = (status) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  return (
    <div style={styles.filterContainer}>
      <div style={styles.filterHeader}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.filterToggleBtn}
        >
          <Filter size={16} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span style={styles.filterBadge}>
              {filters.categories.length + filters.assignees.length + filters.statuses.length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button onClick={onClearFilters} style={styles.clearFiltersBtn}>
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      {isExpanded && (
        <div style={styles.filterPanel}>
          {/* Category Filters */}
          {uniqueCategories.length > 0 && (
            <div style={styles.filterGroup}>
              <div style={styles.filterGroupLabel}>Category</div>
              <div style={styles.filterOptions}>
                {uniqueCategories.map(category => (
                  <label key={category} style={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      style={styles.checkbox}
                    />
                    <span style={styles.filterLabel}>{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Assignee Filters */}
          {uniqueAssignees.length > 0 && (
            <div style={styles.filterGroup}>
              <div style={styles.filterGroupLabel}>Assignee</div>
              <div style={styles.filterOptions}>
                {uniqueAssignees.map(assignee => (
                  <label key={assignee} style={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={filters.assignees.includes(assignee)}
                      onChange={() => handleAssigneeToggle(assignee)}
                      style={styles.checkbox}
                    />
                    <span style={styles.filterLabel}>{assignee}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Status Filters */}
          {uniqueStatuses.length > 0 && (
            <div style={styles.filterGroup}>
              <div style={styles.filterGroupLabel}>Status</div>
              <div style={styles.filterOptions}>
                {uniqueStatuses.map(status => (
                  <label key={status} style={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      style={styles.checkbox}
                    />
                    <span style={styles.filterLabel}>{status}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
