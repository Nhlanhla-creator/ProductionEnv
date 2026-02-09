import React from 'react';
import { Clock, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../../shared/theme';
import './idle-timeout-modal.css';

export default function IdleTimeoutModal() {
  const { showIdleModal, idleSecondsLeft, refreshSession, signOut } = useAuth();

  if (!showIdleModal) return null;

  const minutes = Math.floor(idleSecondsLeft / 60);
  const seconds = idleSecondsLeft % 60;
  const timeDisplay = minutes > 0 
    ? `${minutes}m ${seconds}s` 
    : `${seconds}s`;

  return (
    <div className="idle-overlay">
      <div className="idle-modal">
        <div className="idle-modal-header">
          <div className="idle-modal-icon">
            <Clock size={24} />
          </div>
          <div className="idle-modal-title">
            <h3>Still there?</h3>
            <p className="idle-modal-subtitle">Due to inactivity, you will be signed out soon</p>
          </div>
        </div>

        <div className="idle-modal-content">
          <div className="idle-timer">
            <div className="idle-timer-progress">
              <div 
                className="idle-timer-fill" 
                style={{ 
                  width: `${(idleSecondsLeft / 300) * 100}%`,
                  background: `linear-gradient(90deg, ${colors.primaryBrown} 0%, ${colors.accentGold} 100%)`
                }}
              />
            </div>
            <div className="idle-timer-text">
              <Shield size={16} />
              <span>Time remaining: <strong>{timeDisplay}</strong></span>
            </div>
          </div>
        </div>

        <div className="idle-modal-actions">
          <button 
            className="idle-action-stay" 
            onClick={() => { void refreshSession(); }}
            autoFocus
          >
            Stay signed in
          </button>
          <button 
            className="idle-action-signout" 
            onClick={() => { void signOut(); }}
          >
            <LogOut size={18} />
            Sign out now
          </button>
        </div>
      </div>
    </div>
  );
}
