import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, Boxes, Bell, User, LogOut, Building2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();

  const formattedRole =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'inventory_manager'
      ? 'Inventory Manager'
      : user?.role === 'warehouse_staff'
      ? 'Warehouse Staff'
      : user?.role || 'Staff Member';

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="mobile-toggle-btn"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Boxes size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Stock<span style={{ color: 'var(--primary)' }}>Sense</span>
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            v1.0 ERP
          </span>
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Company Organization Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
          className="company-nav-badge"
        >
          <Building2 size={14} color="#818cf8" />
          <span style={{ color: '#fff', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.company?.name || user?.companyName || 'StockSense Logistics'}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
            }}
          >
            {user?.company?.code || 'ORG'}
          </span>
        </div>

        <button
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
          title="Notifications"
        >
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f43f5e',
            }}
          />
        </button>

        <NavLink
          to="/profile"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
        >
          <div style={{ textAlign: 'right' }} className="user-text-info">
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0 }}>{user?.name || 'Authorized Member'}</p>
            <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, margin: 0 }}>{formattedRole}</p>
          </div>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </NavLink>

        <button
          onClick={logout}
          className="btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
