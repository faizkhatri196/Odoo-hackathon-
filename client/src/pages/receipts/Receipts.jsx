import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { receiptService } from '../../services/receiptService';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';

export const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === 'warehouse_staff';
  const isManagerOrAdmin = user?.role === 'inventory_manager' || user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await receiptService.getReceipts();
        setReceipts(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { header: 'Receipt #', accessor: 'receiptNumber' },
    { header: 'Supplier', render: (row) => row.supplier?.name || 'N/A' },
    { header: 'Warehouse', render: (row) => row.warehouse?.name || 'Main' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', render: (row) => formatDate(row.scheduledDate) },
  ];

  return (
    <div>
      <PageHeader
        title={isStaff ? 'Inbound Receiving Dock' : 'Incoming Purchase Receipts'}
        description={
          isStaff
            ? 'Warehouse floor bay: intake and validate supplier shipments into facility stock.'
            : 'Manage incoming supplier purchase orders, replenishments, and warehouse intake logs.'
        }
        actions={
          isManagerOrAdmin && (
            <button className="btn-primary" onClick={() => navigate('/receipts/new')}>
              + Create Purchase Receipt
            </button>
          )
        }
      />

      {loading ? <Loading text="Loading receipts..." /> : (
        <DataTable
          columns={columns}
          data={receipts}
          onRowClick={(row) => navigate(`/receipts/${row._id}`)}
        />
      )}
    </div>
  );
};
