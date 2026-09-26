import React from 'react';

export const Loading = ({ text = 'Loading data...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(99, 102, 241, 0.2)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</p>
    </div>
  );
};
