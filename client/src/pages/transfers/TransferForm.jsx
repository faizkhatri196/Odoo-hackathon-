import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';

export const TransferForm = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="New Inter-Warehouse Transfer" description="Relocate inventory units between logistics hubs." />
      <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Select source and destination facilities to initiate transfer.</p>
        <button className="btn-secondary" onClick={() => navigate('/transfers')}>Back to Transfers</button>
      </div>
    </div>
  );
};
