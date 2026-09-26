import React from 'react';

export const StatCard = ({ title, value, change, icon, accent = 'primary' }) => {
  const accentColors = {
    primary: 'var(--primary)',
    emerald: 'var(--accent-emerald)',
    amber: 'var(--accent-amber)',
    rose: 'var(--accent-rose)',
    blue: 'var(--accent-blue)',
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: '1.5rem', color: accentColors[accent] || accentColors.primary }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{value}</div>
      {change && (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{change}</span>
      )}
    </div>
  );
};
