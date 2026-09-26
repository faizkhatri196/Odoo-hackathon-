import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { productService } from '../../services/productService';

export const ProductForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    costPrice: 0,
    sellingPrice: 0,
    minReorderLevel: 10,
    unitOfMeasure: 'Units',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productService.createProduct(form);
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Product" description="Register a new item in the inventory system." />

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Product Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>SKU</label>
          <input
            required
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Cost Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Selling Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Create Product'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
