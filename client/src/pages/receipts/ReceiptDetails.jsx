import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { receiptService } from '../../services/receiptService';
import { formatCurrency } from '../../utils/formatNumber';
import { formatDate } from '../../utils/formatDate';

export const ReceiptDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    try {
      const res = await receiptService.getReceiptById(id);
      setReceipt(res.data);
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
      await receiptService.validateReceipt(id);
      await load();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <Loading text="Loading receipt details..." />;
  if (!receipt) return <div>Receipt not found.</div>;

  return (
    <div>
      <PageHeader
        title={`Receipt ${receipt.receiptNumber}`}
        description={`Supplier: ${receipt.supplier?.name || 'Supplier'} | Warehouse: ${receipt.warehouse?.name || 'Main Warehouse'}`}
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            {receipt.status !== 'done' && (
              <button className="btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? 'Validating...' : 'Validate & Receive Stock'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate('/receipts')}>Back to Receipts</button>
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
            <div style={{ marginTop: '4px' }}><StatusBadge status={receipt.status} /></div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created At</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{formatDate(receipt.createdAt)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Warehouse</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{receipt.warehouse?.name} ({receipt.warehouse?.code})</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Valuation</span>
            <div style={{ marginTop: '4px', fontWeight: 700, color: '#34d399', fontSize: '1.1rem' }}>
              {formatCurrency(receipt.totalAmount || 0)}
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#93c5fd' }}>Inbound Line Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '8px 12px' }}>Product</th>
              <th style={{ padding: '8px 12px' }}>SKU</th>
              <th style={{ padding: '8px 12px' }}>Ordered</th>
              <th style={{ padding: '8px 12px' }}>Received</th>
              <th style={{ padding: '8px 12px' }}>Unit Cost</th>
              <th style={{ padding: '8px 12px' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(receipt.items || []).map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.product?.name || 'Product'}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{it.product?.sku || '-'}</td>
                <td style={{ padding: '10px 12px' }}>{it.orderedQty}</td>
                <td style={{ padding: '10px 12px', color: it.receivedQty > 0 ? '#34d399' : 'inherit' }}>
                  {it.receivedQty || (receipt.status === 'done' ? it.orderedQty : 0)}
                </td>
                <td style={{ padding: '10px 12px' }}>{formatCurrency(it.unitCost || 0)}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{formatCurrency(it.subtotal || it.orderedQty * it.unitCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
