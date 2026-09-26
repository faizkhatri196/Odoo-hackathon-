import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/receipts', label: 'Receipts', icon: '📥' },
  { path: '/deliveries', label: 'Deliveries', icon: '📤' },
  { path: '/transfers', label: 'Transfers', icon: '🔄' },
  { path: '/adjustments', label: 'Adjustments', icon: '⚖️' },
  { path: '/ledger', label: 'Stock Ledger', icon: '📜' },
];

export const Sidebar = () => {
  return (
    <aside style={{
      width: '240px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px',
      gap: '8px',
      minHeight: 'calc(100vh - 64px)',
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: isActive ? '#ffffff' : 'var(--text-muted)',
            background: isActive ? 'var(--primary)' : 'transparent',
            transition: 'all 0.15s ease',
          })}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
};
