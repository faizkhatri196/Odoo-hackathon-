import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Building2, ShieldCheck, Mail, Lock, User } from 'lucide-react';

export const Signup = () => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Please provide your Company / Organization name.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'admin', // Registration registers the Executive Admin who creates the isolated Company
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '36px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}>
          <ShieldCheck size={14} />
          <span>Company Administrator Setup</span>
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
          Register Your Enterprise
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Create an isolated company workspace and assign your inventory team.
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--accent-rose-light)', color: '#fb7185', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '0.85rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <Building2 size={15} color="var(--primary)" />
            <span>Company / Organization Name *</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Apex Industrial Logistics Ltd"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <User size={15} color="var(--primary)" />
            <span>Administrator Full Name *</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rajesh Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <Mail size={15} color="var(--primary)" />
            <span>Work Email *</span>
          </label>
          <input
            type="email"
            required
            placeholder="e.g. admin@apexlogistics.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
            <Lock size={15} color="var(--primary)" />
            <span>Password (min 6 characters) *</span>
          </label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          />
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          🔒 Registering creates your isolated company inventory database. You can assign <strong>Inventory Managers</strong> and <strong>Warehouse Staff</strong> from your admin panel.
        </div>

        <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '12px' }} disabled={loading}>
          {loading ? 'Setting up Enterprise...' : 'Create Company Workspace'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Already have a company account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
      </div>
    </div>
  );
};

export default Signup;
