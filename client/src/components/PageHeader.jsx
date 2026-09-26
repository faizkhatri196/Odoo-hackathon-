import React from 'react';

export const PageHeader = ({ title, description, actions }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px',
    }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f9fafb' }}>{title}</h1>
        {description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
    </div>
  );
};
