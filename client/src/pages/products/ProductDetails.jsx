import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/formatNumber';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await productService.getProductById(id);
        setProduct(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Loading text="Fetching product specs..." />;
  if (!product) return <div>Product not found.</div>;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku} | Category: ${product.category} | UOM: ${product.unitOfMeasure || 'pcs'}`}
        actions={
          <button className="btn-secondary" onClick={() => navigate('/products')}>
            Back to Products
          </button>
        }
      />

      <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cost Price</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(product.costPrice)}</h3>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Selling Price</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(product.sellingPrice)}</h3>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Stock</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: product.totalQuantity <= product.minReorderLevel ? '#fb7185' : '#34d399' }}>
            {product.totalQuantity} {product.unitOfMeasure}
          </h3>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Stock Status</p>
          <div style={{ marginTop: '4px' }}>
            <StatusBadge status={product.stockSummary?.status || (product.totalQuantity <= 0 ? 'OUT_OF_STOCK' : product.totalQuantity <= product.minReorderLevel ? 'LOW_STOCK' : 'IN_STOCK')} />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#93c5fd' }}>
          Multi-Warehouse & Rack Inventory Breakdown
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '8px 12px' }}>Warehouse Facility</th>
              <th style={{ padding: '8px 12px' }}>Facility Code</th>
              <th style={{ padding: '8px 12px' }}>Rack / Location</th>
              <th style={{ padding: '8px 12px' }}>Quantity On Hand</th>
            </tr>
          </thead>
          <tbody>
            {(product.warehouseStock || []).length > 0 ? (
              product.warehouseStock.map((ws, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{ws.warehouse?.name || 'Warehouse'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{ws.warehouse?.code || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#93c5fd' }}>{ws.locationRack || 'A-01'}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: ws.quantity > 0 ? '#34d399' : '#f87171' }}>
                    {ws.quantity} {product.unitOfMeasure}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No warehouse inventory allocated for this product yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
