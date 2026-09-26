import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { receiptService } from '../../services/receiptService';

export const ReceiptForm = () => {
  const navigate = useNavigate();
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await receiptService.createReceipt({
        supplier: { name: supplierName },
        items: [],
      });
      navigate('/receipts');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Receipt" description="Initiate a supplier inbound shipment." />
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Supplier Name</label>
          <input
            required
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Receipt Draft'}
        </button>
      </form>
    </div>
  );
};
