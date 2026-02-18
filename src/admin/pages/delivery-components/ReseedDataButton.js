import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { deleteAllSprints, saveAllSprints } from '../services/sprints';
import { INITIAL_SPRINTS_DATA } from './initialData';

/**
 * Emergency button to re-seed all sprints with fresh initial data
 * This will DELETE all existing data and create fresh sprints
 */
export const ReseedDataButton = ({ onComplete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReseed = async () => {
    if (confirmText !== 'RESEED') {
      setError('Please type "RESEED" to confirm.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Delete ALL existing sprints and tasks
      console.log('🗑️ Deleting all existing sprints...');
      await deleteAllSprints();
      
      // Step 2: Save fresh initial data
      console.log('📥 Creating fresh sprints from initial data...');
      await saveAllSprints(INITIAL_SPRINTS_DATA);
      
      console.log('✅ Successfully re-seeded all sprint data');
      
      // Close modal
      setShowConfirm(false);
      setConfirmText('');
      
      // Notify parent to refresh
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('❌ Failed to reseed data:', err);
      setError('Failed to reseed data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const warningBoxStyle = {
    background: '#fee2e2',
    border: '2px solid #ef4444',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '20px',
  };

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white',
  };

  const normalButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f59e0b',
    color: 'white',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    marginRight: '12px',
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={normalButtonStyle}
        title="Re-seed all sprints with initial data (WARNING: This will overwrite all existing data)"
      >
        🔄 Re-seed Sprint Data
      </button>

      {showConfirm && (
        <div style={modalOverlayStyle} onClick={() => setShowConfirm(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <h2 style={{ margin: 0 }}>Re-seed Sprint Data</h2>
            </div>

            <div style={warningBoxStyle}>
              <p style={{ margin: 0, fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>
                ⚠️ DANGER: This will PERMANENTLY DELETE all existing sprint data
              </p>
              <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}>
                All sprints, tasks, and custom changes will be completely deleted from Firebase, 
                then fresh initial data will be created. This action cannot be undone.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ marginBottom: '8px', fontWeight: 500 }}>
                What this will do:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#374151' }}>
                <li>Delete ALL existing sprints and tasks from Firebase</li>
                <li>Create fresh sprints with proper column structure and options</li>
                <li>Reset to default Sprint 0, 1, 2, etc. with sample data</li>
                <li>Fix any column mismatch issues</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Type <strong>RESEED</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError('');
                }}
                placeholder="Type RESEED"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                autoFocus
              />
              {error && (
                <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 0' }}>
                  {error}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                  setError('');
                }}
                style={cancelButtonStyle}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReseed}
                style={dangerButtonStyle}
                disabled={isLoading || !confirmText}
              >
                {isLoading ? 'Re-seeding...' : 'Re-seed Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};