import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';

export const LedgerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Stock Ledger Entry" description={`Audit Transaction ID: ${id}`} actions={
        <button className="btn-secondary" onClick={() => navigate('/ledger')}>Back to Ledger</button>
      } />
      <div className="glass-panel" style={{ padding: '24px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Detailed immutable audit trail entry snapshot.</p>
      </div>
    </div>
  );
};
