import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { transferService } from '../../services/transferService';

export const TransferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await transferService.getTransferById(id);
        setTransfer(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Loading text="Loading transfer..." />;
  if (!transfer) return <div>Transfer record not found.</div>;

  return (
    <div>
      <PageHeader
        title={`Transfer ${transfer.transferNumber}`}
        description={`From: ${transfer.fromWarehouse?.name} ➡️ To: ${transfer.toWarehouse?.name}`}
        actions={<button className="btn-secondary" onClick={() => navigate('/transfers')}>Back</button>}
      />

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Transfer Status</h3>
          <StatusBadge status={transfer.status} />
        </div>
      </div>
    </div>
  );
};
