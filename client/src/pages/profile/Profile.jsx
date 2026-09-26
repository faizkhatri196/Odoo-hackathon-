import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Shield, Building, Calendar, KeyRound, LogOut } from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'System Administrator (Executive)', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' };
      case 'inventory_manager':
        return { label: 'Inventory & Replenishment Manager', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'warehouse_staff':
        return { label: 'Warehouse Floor Execution Staff', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: role || 'Operations Associate', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  const getFacilityScope = (role) => {
    if (role === 'admin') return 'Global Multi-Facility Enterprise Network (All Hubs)';
    if (role === 'inventory_manager') return 'Central Supply Chain & Regional Depots';
    return 'Mumbai Central Logistics Hub (WH-MUM)';
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Active Registered Member';

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader
        title="User Profile & Security"
        description="Enterprise session context, authentication credentials, and role privileges."
      />

      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>{user?.name || 'StockSense Operator'}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{user?.email || 'operator@stocksense.com'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
              <Shield size={14} /> Assigned System Role
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: roleInfo.color,
                background: roleInfo.bg,
                padding: '4px 8px',
                borderRadius: '4px',
              }}
            >
              {roleInfo.label}
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
              <Building size={14} /> Operational Facility Scope
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0 }}>
              {getFacilityScope(user?.role)}
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '6px' }}>
              <Calendar size={14} /> Member since
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34d399', margin: 0 }}>
              Active (Since {memberSince})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#f43f5e' }}>
            <LogOut size={16} /> Sign Out Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
