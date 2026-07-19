import React, { useState, memo } from 'react';

/**
 * QA Checkbox cell for sprint tables.
 * - Enabled only when task.status === 'Done'
 * - Disabled with tooltip otherwise
 * - On check → fires onQAToggle(task, true)
 * - On uncheck → fires onQAToggle(task, false)
 */
export const QACheckboxCell = memo(({ task, onQAToggle }) => {
  const [hovered, setHovered] = useState(false);
  const isDone = task.status === 'Done';
  const isChecked = !!task.qa;

  const handleChange = (e) => {
    e.stopPropagation();
    if (!isDone) return;
    onQAToggle(task, e.target.checked);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 6,
          cursor: isDone ? 'pointer' : 'not-allowed',
          opacity: isDone ? 1 : 0.45,
          transition: 'all 0.2s ease',
          background: isChecked ? '#a67c52' : (hovered && isDone) ? '#f0e6d9' : 'transparent',
          border: isChecked ? '2px solid #a67c52' : '2px solid #c8b6a6',
        }}
        title={isDone ? (isChecked ? 'Task flagged for QA' : 'Flag task for QA') : 'Task must be marked as Done before requesting QA'}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          disabled={!isDone}
          style={{ display: 'none' }}
        />
        {/* Checkmark icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            opacity: isChecked ? 1 : 0,
            transform: isChecked ? 'scale(1)' : 'scale(0.5)',
            transition: 'all 0.15s ease',
          }}
        >
          <path
            d="M2.5 7L5.5 10L11.5 4"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </label>

      {/* Tooltip for disabled state */}
      {hovered && !isDone && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            padding: '6px 10px',
            background: '#4a352f',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 6,
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
          }}
        >
          Task must be Done before requesting QA
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #4a352f',
            }}
          />
        </div>
      )}
    </div>
  );
});
