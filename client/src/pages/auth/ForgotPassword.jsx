import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message + (res.devOtp ? ` (Dev OTP: ${res.devOtp})` : ''));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Password Reset</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Enter email to receive an OTP</p>
      </div>

      {message && (
        <div style={{ background: 'var(--accent-emerald-light)', color: '#34d399', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--accent-rose-light)', color: '#fb7185', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <Link to="/login" style={{ color: 'var(--primary)' }}>Back to Login</Link>
      </div>
    </div>
  );
};
