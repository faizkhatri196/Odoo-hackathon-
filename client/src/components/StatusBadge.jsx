import React from 'react';

const statusStyles = {
  done: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '#10b981' },
  ready: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '#0284c7' },
  waiting: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '#d97706' },
  draft: { bg: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: '#4b5563' },
  canceled: { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '#e11d48' },
};

export const StatusBadge = ({ status = 'draft' }) => {
  const current = statusStyles[status.toLowerCase()] || statusStyles.draft;

  return (
    <span
      style={{
        background: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
};
