import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { adjustmentService } from '../../services/adjustmentService';
import { formatDate } from '../../utils/formatDate';

export const Adjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await adjustmentService.getAdjustments();
      setAdjustments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = async (id, e) => {
    e.stopPropagation();
    setApplyingId(id);
    try {
      await adjustmentService.applyAdjustment(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply adjustment');
    } finally {
      setApplyingId(null);
    }
  };

  const columns = [
    { header: 'Adjustment #', accessor: 'adjustmentNumber' },
    { header: 'Warehouse', render: (row) => row.warehouse?.name || 'Main Warehouse' },
    { header: 'Items / Reason', render: (row) => (
      <div>
        <div style={{ fontWeight: 600 }}>
          {row.items?.map((it) => it.product?.name || 'Product').join(', ') || 'Inventory Audit'}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {row.items?.[0]?.reason || row.notes || 'Discrepancy count'}
        </div>
      </div>
    )},
    { header: 'Difference', render: (row) => {
      const totalDiff = (row.items || []).reduce((sum, it) => sum + (it.difference || 0), 0);
      return (
        <span style={{ fontWeight: 700, color: totalDiff === 0 ? 'var(--text-muted)' : totalDiff > 0 ? '#34d399' : '#f87171' }}>
          {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
        </span>
      );
    }},
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', render: (row) => formatDate(row.adjustmentDate || row.createdAt) },
    { header: 'Action', render: (row) => (
      row.status !== 'done' ? (
        <button
          className="btn-primary"
          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          onClick={(e) => handleApply(row._id, e)}
          disabled={applyingId === row._id}
        >
          {applyingId === row._id ? 'Applying...' : 'Apply Now'}
        </button>
      ) : (
        <span style={{ color: '#34d399', fontSize: '0.85rem' }}>✓ Reconciled</span>
      )
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Physical Inventory Adjustments"
        description="Reconcile recorded stock levels against physical warehouse counts."
        actions={
          <button className="btn-primary" onClick={() => navigate('/adjustments/new')}>
            + New Adjustment
          </button>
        }
      />

      {loading ? <Loading text="Loading adjustments..." /> : (
        <DataTable columns={columns} data={adjustments} />
      )}
    </div>
  );
};
