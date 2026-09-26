import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { adjustmentService } from '../../services/adjustmentService';
import { productService } from '../../services/productService';
import api from '../../services/api';

export const AdjustmentForm = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(0);
  const [countedQty, setCountedQty] = useState(0);
  const [reason, setReason] = useState('Physical inventory recount discrepancy');
  const [autoApply, setAutoApply] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, prodRes] = await Promise.all([
          api.get('/warehouses'),
          productService.getProducts(),
        ]);
        const whs = whRes.data.data || whRes.data || [];
        setWarehouses(whs);
        if (whs.length > 0) setWarehouseId(whs[0]._id);

        const prods = prodRes.data || [];
        setProducts(prods);
        if (prods.length > 0) {
          setProductId(prods[0]._id);
          const initialRecorded = prods[0].totalQuantity || 0;
          setCurrentQty(initialRecorded);
          setCountedQty(initialRecorded);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchData();
  }, []);

  const handleProductChange = (pId) => {
    setProductId(pId);
    const prod = products.find((p) => p._id === pId);
    if (prod) {
      // Find stock in current warehouse if available
      let qty = prod.totalQuantity || 0;
      if (prod.warehouseStock && warehouseId) {
        const ws = prod.warehouseStock.find(
          (w) => (w.warehouse?._id || w.warehouse)?.toString() === warehouseId.toString()
        );
        if (ws) qty = ws.quantity;
      }
      setCurrentQty(qty);
      setCountedQty(qty);
    }
  };

  const difference = countedQty - currentQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (!productId) {
        throw new Error('Please select a product to adjust');
      }

      await adjustmentService.createAdjustment({
        warehouse: warehouseId,
        items: [
          {
            product: productId,
            recordedQty: currentQty,
            countedQty,
            difference,
            reason,
          },
        ],
        autoApply,
      });

      navigate('/adjustments');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error processing adjustment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="New Inventory Adjustment"
        description="Recalibrate discrepancies between system ledger and physical warehouse counts."
      />

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.9rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Audit Facility / Warehouse *</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            >
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Audited Product *</label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recorded in System</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>{currentQty}</h3>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#93c5fd', marginBottom: '4px' }}>Physical Counted *</label>
            <input
              type="number"
              min="0"
              required
              value={countedQty}
              onChange={(e) => setCountedQty(parseInt(e.target.value, 10) || 0)}
              style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid #38bdf8', borderRadius: 'var(--radius-sm)', color: '#fff', fontWeight: 700 }}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Adjustment Delta</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: difference === 0 ? 'var(--text-muted)' : difference > 0 ? '#34d399' : '#f87171' }}>
              {difference > 0 ? `+${difference}` : difference}
            </h3>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Audit Reason / Discrepancy Note</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="autoApply"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="autoApply" style={{ fontSize: '0.85rem', cursor: 'pointer', color: '#93c5fd' }}>
            Apply adjustment immediately and update stock ledger
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Reconciling Stock...' : 'Submit & Reconcile Stock'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/adjustments')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
