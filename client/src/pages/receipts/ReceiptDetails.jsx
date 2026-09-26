import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { receiptService } from '../../services/receiptService';

export const ReceiptDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

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
    try {
      await receiptService.validateReceipt(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Validation failed');
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
        description={`Supplier: ${receipt.supplier?.name} | Warehouse: ${receipt.warehouse?.name}`}
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            {receipt.status !== 'done' && (
              <button className="btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? 'Validating...' : 'Validate & Receive Stock'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate('/receipts')}>Back</button>
          </div>
        }
      />

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Status</h3>
          <StatusBadge status={receipt.status} />
        </div>
      </div>
    </div>
  );
};
