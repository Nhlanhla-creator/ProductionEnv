import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { styles } from './styles';

export const EmptyState = () => {
  return (
    <div style={styles.emptyState}>
      <AlertCircle size={48} color="var(--accent-brown)" />
      <p style={styles.emptyText}>Select a category to view details</p>
    </div>
  );
};

export const ComingSoon = () => {
  return (
    <div style={styles.comingSoon}>
      <Clock size={48} color="var(--accent-brown)" />
      <p style={styles.comingSoonText}>Meetings view coming soon...</p>
    </div>
  );
};