import React from 'react';

export const EmptyState = ({ title = 'No data available', description = 'There are no items to show currently.', action }) => {
  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: action ? '20px' : 0 }}>{description}</p>
      {action && action}
    </div>
  );
};
