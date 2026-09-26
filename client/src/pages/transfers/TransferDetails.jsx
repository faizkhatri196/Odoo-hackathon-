import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';

export const TransferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    try {
      const res = await transferService.getTransferById(id);
      setTransfer(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleValidate = async () => {
    setValidating(true);
    setErrorMsg('');
    try {
      await transferService.validateTransfer(id);
      await load();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Transfer execution failed');
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <Loading text="Loading transfer..." />;
  if (!transfer) return <div>Transfer record not found.</div>;

  return (
    <div>
      <PageHeader
        title={`Transfer ${transfer.transferNumber}`}
        description={`From: ${transfer.fromWarehouse?.name} ➡️ To: ${transfer.toWarehouse?.name}`}
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            {transfer.status !== 'done' && (
              <button className="btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? 'Processing...' : 'Validate & Execute Transfer'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate('/transfers')}>Back to Transfers</button>
          </div>
        }
      />

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', marginBottom: '16px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</span>
            <div style={{ marginTop: '4px' }}><StatusBadge status={transfer.status} /></div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Source Facility</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{transfer.fromWarehouse?.name} ({transfer.fromWarehouse?.code})</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Destination Facility</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{transfer.toWarehouse?.name} ({transfer.toWarehouse?.code})</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initiated At</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{formatDate(transfer.createdAt)}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#93c5fd' }}>Transfer Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '8px 12px' }}>Product</th>
              <th style={{ padding: '8px 12px' }}>SKU</th>
              <th style={{ padding: '8px 12px' }}>Quantity Transferred</th>
              <th style={{ padding: '8px 12px' }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {(transfer.items || []).map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.product?.name || 'Product'}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{it.product?.sku || '-'}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#38bdf8' }}>{it.quantity}</td>
                <td style={{ padding: '10px 12px' }}>{it.product?.unitOfMeasure || 'pcs'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
