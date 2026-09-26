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
  const navigate = useNavigate();

  useEffect(() => {
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
    load();
  }, []);

  const columns = [
    { header: 'Adjustment #', accessor: 'adjustmentNumber' },
    { header: 'Warehouse', render: (row) => row.warehouse?.name || 'Main' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', render: (row) => formatDate(row.adjustmentDate) },
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
