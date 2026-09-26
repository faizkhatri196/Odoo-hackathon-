import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';

export const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await transferService.getTransfers();
        setTransfers(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { header: 'Transfer #', accessor: 'transferNumber' },
    { header: 'From Warehouse', render: (row) => row.fromWarehouse?.name || 'N/A' },
    { header: 'To Warehouse', render: (row) => row.toWarehouse?.name || 'N/A' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', render: (row) => formatDate(row.scheduledDate) },
  ];

  return (
    <div>
      <PageHeader
        title="Internal Stock Transfers"
        description="Move items between warehouses or internal locations."
        actions={
          <button className="btn-primary" onClick={() => navigate('/transfers/new')}>
            + Create Transfer
          </button>
        }
      />

      {loading ? <Loading text="Loading transfers..." /> : (
        <DataTable
          columns={columns}
          data={transfers}
          onRowClick={(row) => navigate(`/transfers/${row._id}`)}
        />
      )}
    </div>
  );
};
