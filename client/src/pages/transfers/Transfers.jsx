import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { transferService } from '../../services/transferService';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';

export const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === 'warehouse_staff';
  const isManagerOrAdmin = user?.role === 'inventory_manager' || user?.role === 'admin';

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
        title={isStaff ? 'Inter-Facility Freight Bay' : 'Internal Stock Transfers'}
        description={
          isStaff
            ? 'Execute truck loading, transit dispatch, and receiving for your warehouse facility.'
            : 'Plan and balance inventory distribution across regional logistics hubs.'
        }
        actions={
          isManagerOrAdmin && (
            <button className="btn-primary" onClick={() => navigate('/transfers/new')}>
              + Plan New Transfer
            </button>
          )
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
