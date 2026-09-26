import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { receiptService } from '../../services/receiptService';
import { formatDate } from '../../utils/formatDate';

export const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        title="Incoming Receipts"
        description="Manage incoming purchase orders and supplier stock intakes."
        actions={
          <button className="btn-primary" onClick={() => navigate('/receipts/new')}>
            + Create Receipt
          </button>
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
