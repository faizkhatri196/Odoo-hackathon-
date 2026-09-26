import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { productService } from '../../services/productService';
import api from '../../services/api';

export const ProductForm = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Construction',
    unitOfMeasure: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    initialStock: 0,
    warehouse: '',
    locationRack: 'MAIN-RACK-A',
    minReorderLevel: 10,
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await api.get('/warehouses');
        const whs = res.data.data || res.data || [];
        setWarehouses(whs);
        if (whs.length > 0) {
          setForm((prev) => ({ ...prev, warehouse: whs[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load warehouses', err);
      }
    };
    fetchWarehouses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await productService.createProduct({
        ...form,
        warehouseId: form.warehouse,
      });
      navigate('/products');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error creating product';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Product" description="Register a new item with multi-warehouse tracking and initial stock." />

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.9rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Product Name *</label>
            <input
              required
              placeholder="e.g. Steel Rod"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>SKU *</label>
            <input
              required
              placeholder="e.g. STEEL-001"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', textTransform: 'uppercase' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'rgba(30, 41, 59, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            >
              <option value="Construction">Construction</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="General">General</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Unit of Measure (UOM)</label>
            <input
              required
              placeholder="e.g. pcs, kg, units"
              value={form.unitOfMeasure}
              onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Cost Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Selling Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Reorder Level</label>
            <input
              type="number"
              min="0"
              value={form.minReorderLevel}
              onChange={(e) => setForm({ ...form, minReorderLevel: parseInt(e.target.value, 10) || 0 })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: '#93c5fd' }}>Initial Inventory Setup (Optional)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Initial Stock</label>
              <input
                type="number"
                min="0"
                value={form.initialStock}
                onChange={(e) => setForm({ ...form, initialStock: parseInt(e.target.value, 10) || 0 })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Warehouse</label>
              <select
                value={form.warehouse}
                onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
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
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Rack / Location</label>
              <input
                placeholder="e.g. MAIN-RACK-A"
                value={form.locationRack}
                onChange={(e) => setForm({ ...form, locationRack: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Product...' : 'Create Product'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
