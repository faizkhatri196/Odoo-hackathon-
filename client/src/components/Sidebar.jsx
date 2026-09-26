import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  SlidersHorizontal,
  History,
  Settings,
  Warehouse,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isOperationsActive = [
    '/receipts',
    '/deliveries',
    '/transfers',
    '/adjustments',
    '/ledger',
  ].some((path) => location.pathname.startsWith(path));

  const isSettingsActive = ['/settings/warehouse', '/warehouses'].some((path) =>
    location.pathname.startsWith(path)
  );

  const [opsExpanded, setOpsExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const activeLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#ffffff' : 'var(--text-muted)',
    background: isActive
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)'
      : 'transparent',
    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
          height: 'calc(100vh - 64px)',
          position: 'sticky',
          top: '64px',
          overflowY: 'auto',
          zIndex: 46,
          transition: 'transform 0.3s ease',
          ...(isOpen ? { transform: 'translateX(0)', position: 'fixed', left: 0, top: '64px' } : {}),
        }}
        className={`sidebar-container ${isOpen ? 'mobile-open' : ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {/* Main Dashboard */}
          <NavLink to="/" end style={activeLinkStyle} onClick={onClose}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LayoutDashboard size={18} color="var(--primary)" />
              <span>Dashboard</span>
            </div>
          </NavLink>

          {/* Products */}
          <NavLink to="/products" style={activeLinkStyle} onClick={onClose}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Package size={18} color="#38bdf8" />
              <span>Products</span>
            </div>
          </NavLink>

          {/* Group Header: Operations */}
          <div style={{ marginTop: '14px', marginBottom: '4px' }}>
            <button
              onClick={() => setOpsExpanded(!opsExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: isOperationsActive ? 'var(--primary)' : 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={14} />
                <span>Operations</span>
              </div>
              {opsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {opsExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', marginTop: '2px' }}>
                <NavLink to="/receipts" style={activeLinkStyle} onClick={onClose}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowDownLeft size={16} color="#34d399" />
                    <span>Receipts</span>
                  </div>
                </NavLink>

                <NavLink to="/deliveries" style={activeLinkStyle} onClick={onClose}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ArrowUpRight size={16} color="#fb7185" />
                    <span>Deliveries</span>
                  </div>
                </NavLink>

                <NavLink to="/transfers" style={activeLinkStyle} onClick={onClose}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Repeat size={16} color="#fbbf24" />
                    <span>Internal Transfers</span>
                  </div>
                </NavLink>

                <NavLink to="/adjustments" style={activeLinkStyle} onClick={onClose}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SlidersHorizontal size={16} color="#a78bfa" />
                    <span>Adjustments</span>
                  </div>
                </NavLink>

                <NavLink to="/ledger" style={activeLinkStyle} onClick={onClose}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <History size={16} color="#818cf8" />
                    <span>Move History</span>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group Header: Settings */}
          <div style={{ marginTop: '10px', marginBottom: '4px' }}>
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: isSettingsActive ? 'var(--primary)' : 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={14} />
                <span>Settings</span>
              </div>
              {settingsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {settingsExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px', marginTop: '2px' }}>
                <NavLink to="/settings/warehouse" style={activeLinkStyle} onClick={onClose}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Warehouse size={16} color="#38bdf8" />
                    <span>Warehouse</span>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {/* Group Header: Profile */}
          <div style={{ marginTop: '10px' }}>
            <div
              style={{
                padding: '8px 12px',
                color: 'var(--text-dim)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Account
            </div>
            <NavLink to="/profile" style={activeLinkStyle} onClick={onClose}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={16} color="#a78bfa" />
                <span>My Profile</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* User Card at bottom of sidebar */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Inventory Manager'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.role || 'Staff Member'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};
