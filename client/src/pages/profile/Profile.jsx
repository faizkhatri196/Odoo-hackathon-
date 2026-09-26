import React from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Shield, Building, Calendar, KeyRound, LogOut } from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: '800px' }}>
      <PageHeader
        title="User Profile"
        description="Manage your account credentials, role permissions, and session preferences."
      />

      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#fff', fontWeight: 700 }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{user?.name || 'Inventory Manager'}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email || 'admin@stocksense.io'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Shield size={14} /> Assigned Role
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#818cf8' }}>{user?.role || 'System Administrator'}</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Building size={14} /> Assigned Location
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Central Warehouse (WH-MAIN)</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
              <Calendar size={14} /> Member since
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Sept 2026</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} /> Reset Password
          </button>
          <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#f43f5e' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
