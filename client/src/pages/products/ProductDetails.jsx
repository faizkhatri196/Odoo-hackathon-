import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
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
        description={`SKU: ${product.sku} | Category: ${product.category}`}
        actions={
          <button className="btn-secondary" onClick={() => navigate('/products')}>
            Back to Products
          </button>
        }
      />

      <div className="glass-panel" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cost Price</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(product.costPrice)}</h3>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Selling Price</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(product.sellingPrice)}</h3>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total On-Hand</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>{product.totalQuantity} {product.unitOfMeasure}</h3>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Reorder Level</p>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>{product.minReorderLevel}</h3>
        </div>
      </div>
    </div>
  );
};
