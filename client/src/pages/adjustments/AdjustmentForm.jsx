import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';

export const AdjustmentForm = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="New Inventory Adjustment" description="Recalibrate discrepancies discovered in stock audits." />
      <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Configure counted quantity discrepancies.</p>
        <button className="btn-secondary" onClick={() => navigate('/adjustments')}>Back to Adjustments</button>
      </div>
    </div>
  );
};
