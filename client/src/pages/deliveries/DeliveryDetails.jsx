import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { deliveryService } from '../../services/deliveryService';
import { formatCurrency } from '../../utils/formatNumber';
import { formatDate } from '../../utils/formatDate';

export const DeliveryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    try {
      const res = await deliveryService.getDeliveryById(id);
      setDelivery(res.data);
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
      await deliveryService.validateDelivery(id);
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Delivery validation failed';
      setErrorMsg(msg);
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <Loading text="Loading delivery details..." />;
  if (!delivery) return <div>Delivery not found.</div>;

  return (
    <div>
      <PageHeader
        title={`Delivery ${delivery.deliveryNumber}`}
        description={`Customer: ${delivery.customer?.name || 'Customer'} | Warehouse: ${delivery.warehouse?.name || 'Main Warehouse'}`}
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            {delivery.status !== 'done' && (
              <button className="btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? 'Dispatching...' : 'Validate & Dispatch'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate('/deliveries')}>Back to Deliveries</button>
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
            <div style={{ marginTop: '4px' }}><StatusBadge status={delivery.status} /></div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created At</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{formatDate(delivery.createdAt)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dispatch Warehouse</span>
            <div style={{ marginTop: '4px', fontWeight: 600 }}>{delivery.warehouse?.name} ({delivery.warehouse?.code})</div>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Value</span>
            <div style={{ marginTop: '4px', fontWeight: 700, color: '#34d399', fontSize: '1.1rem' }}>
              {formatCurrency(delivery.totalAmount || 0)}
            </div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#93c5fd' }}>Dispatched Line Items</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '8px 12px' }}>Product</th>
              <th style={{ padding: '8px 12px' }}>SKU</th>
              <th style={{ padding: '8px 12px' }}>Demanded</th>
              <th style={{ padding: '8px 12px' }}>Delivered</th>
              <th style={{ padding: '8px 12px' }}>Unit Price</th>
              <th style={{ padding: '8px 12px' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(delivery.items || []).map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{it.product?.name || 'Product'}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{it.product?.sku || '-'}</td>
                <td style={{ padding: '10px 12px' }}>{it.demandedQty}</td>
                <td style={{ padding: '10px 12px', color: it.deliveredQty > 0 ? '#34d399' : 'inherit' }}>
                  {it.deliveredQty || (delivery.status === 'done' ? it.demandedQty : 0)}
                </td>
                <td style={{ padding: '10px 12px' }}>{formatCurrency(it.unitPrice || 0)}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{formatCurrency(it.subtotal || it.demandedQty * it.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
