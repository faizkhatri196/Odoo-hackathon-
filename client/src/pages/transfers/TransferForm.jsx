import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { transferService } from '../../services/transferService';
import { productService } from '../../services/productService';
import { dashboardService } from '../../services/dashboardService';

export const TransferForm = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 10 }]);
  const [notes, setNotes] = useState('Relocate inventory to secondary facility');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, prodRes] = await Promise.all([
          dashboardService.getWarehouses(),
          productService.getProducts().catch(() => ({ data: [] })),
        ]);
        const whs = whRes.data || [];
        setWarehouses(whs);
        if (whs.length > 0) {
          setFromWarehouse(whs[0]._id || whs[0].id);
          if (whs.length > 1) {
            setToWarehouse(whs[1]._id || whs[1].id);
          } else {
            setToWarehouse(whs[0]._id || whs[0].id);
          }
        }

        const prods = Array.isArray(prodRes.data) ? prodRes.data : [];
        setProducts(prods);
        if (prods.length > 0) {
          setItems([{ product: prods[0]._id, quantity: 10 }]);
        }
      } catch (err) {
        console.error('Failed to load warehouses/products', err);
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { product: products[0]?._id || '', quantity: 10 }]);
  };

  const removeItemRow = (index) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!fromWarehouse || !toWarehouse) {
      setErrorMsg('Please select both source and destination warehouses.');
      setLoading(false);
      return;
    }

    if (fromWarehouse === toWarehouse) {
      setErrorMsg('Source and destination warehouses cannot be the same facility');
      setLoading(false);
      return;
    }

    try {
      const validItems = items.filter((it) => it.product && it.quantity > 0);
      if (validItems.length === 0) {
        throw new Error('Please specify at least one product with quantity > 0');
      }

      await transferService.createTransfer({
        fromWarehouse,
        toWarehouse,
        items: validItems,
        notes,
      });
      navigate('/transfers');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error creating transfer request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="New Inter-Warehouse Transfer"
        description="Relocate inventory units between logistics hubs with zero loss."
        actions={
          <button type="button" className="btn-secondary" onClick={() => navigate('/transfers')}>
            Back to Transfers
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.9rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Source Warehouse (FROM) *</label>
            <select
              value={fromWarehouse}
              onChange={(e) => setFromWarehouse(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            >
              {warehouses.map((w) => (
                <option key={w._id || w.id} value={w._id || w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Destination Warehouse (TO) *</label>
            <select
              value={toWarehouse}
              onChange={(e) => setToWarehouse(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            >
              {warehouses.map((w) => (
                <option key={w._id || w.id} value={w._id || w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#93c5fd' }}>Transfer Items</label>
            <button type="button" onClick={addItemRow} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              + Add Line Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <select
                required
                value={item.product}
                onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku}) — Available: {p.totalQuantity || 0}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                required
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Transfer Notes / Internal Memo</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Transfer...' : 'Initiate Transfer Order'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/transfers')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
