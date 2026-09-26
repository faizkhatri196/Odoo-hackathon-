import React from 'react';

export const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px 8px 36px',
          color: 'var(--text-main)',
          fontSize: '0.875rem',
          outline: 'none',
        }}
      />
      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
    </div>
  );
};
