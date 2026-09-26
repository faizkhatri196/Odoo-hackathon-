import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { deliveryService } from '../../services/deliveryService';
import { productService } from '../../services/productService';
import api from '../../services/api';

export const DeliveryForm = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState('Global Distribution Ltd');
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState([
    { product: '', demandedQty: 20, unitPrice: 25 },
  ]);
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
          setItems([{ product: prods[0]._id, demandedQty: 20, unitPrice: prods[0].sellingPrice || 25 }]);
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'product') {
        const found = products.find((p) => p._id === value);
        if (found) copy[index].unitPrice = found.sellingPrice || 0;
      }
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { product: products[0]?._id || '', demandedQty: 1, unitPrice: products[0]?.sellingPrice || 0 },
    ]);
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
    try {
      const validItems = items.filter((it) => it.product && it.demandedQty > 0);
      if (validItems.length === 0) {
        throw new Error('Please select at least one product with quantity > 0');
      }

      await deliveryService.createDelivery({
        customer: { name: customerName },
        warehouse: warehouseId,
        items: validItems,
      });
      navigate('/deliveries');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error creating delivery order');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce(
    (sum, it) => sum + (Number(it.demandedQty) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  return (
    <div>
      <PageHeader title="New Delivery Order" description="Prepare customer dispatch order with inventory deduction." />

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.9rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Customer Name *</label>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Apex Construction Corp"
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Dispatch Warehouse *</label>
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
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#93c5fd' }}>Dispatch Items</label>
            <button type="button" onClick={addItemRow} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              + Add Item
            </button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <select
                required
                value={item.product}
                onChange={(e) => handleItemChange(idx, 'product', e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku}) — Stock: {p.totalQuantity}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                required
                placeholder="Qty"
                value={item.demandedQty}
                onChange={(e) => handleItemChange(idx, 'demandedQty', parseInt(e.target.value, 10) || 1)}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Unit Price"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
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

          <div style={{ textAlign: 'right', marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Total Value: <strong style={{ color: '#34d399' }}>${totalAmount.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Order...' : 'Create Delivery Draft'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/deliveries')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
