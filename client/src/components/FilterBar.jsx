import React from 'react';

export const FilterBar = ({ options = [], activeFilter, onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            background: activeFilter === opt.value ? 'var(--primary-light)' : 'transparent',
            borderColor: activeFilter === opt.value ? 'var(--primary)' : 'var(--border-subtle)',
            color: activeFilter === opt.value ? '#818cf8' : 'var(--text-muted)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
