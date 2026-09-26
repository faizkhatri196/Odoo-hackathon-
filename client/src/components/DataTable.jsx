import React from 'react';
import { EmptyState } from './EmptyState';

export const DataTable = ({ columns = [], data = [], onRowClick }) => {
  if (!data || data.length === 0) {
    return <EmptyState title="No records found" description="Try refining search or filters." />;
  }

  return (
    <div className="glass-panel" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
            {columns.map((col, idx) => (
              <th key={idx} style={{ padding: '14px 18px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rIdx) => (
            <tr
              key={row._id || rIdx}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {columns.map((col, cIdx) => (
                <td key={cIdx} style={{ padding: '14px 18px' }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
