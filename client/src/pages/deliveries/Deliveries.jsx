import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { deliveryService } from '../../services/deliveryService';
import { formatDate } from '../../utils/formatDate';

export const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await deliveryService.getDeliveries();
        setDeliveries(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { header: 'Delivery #', accessor: 'deliveryNumber' },
    { header: 'Customer', render: (row) => row.customer?.name || 'N/A' },
    { header: 'Warehouse', render: (row) => row.warehouse?.name || 'Main' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Date', render: (row) => formatDate(row.scheduledDate) },
  ];

  return (
    <div>
      <PageHeader
        title="Outgoing Deliveries"
        description="Manage customer shipments, dispatches and delivery orders."
        actions={
          <button className="btn-primary" onClick={() => navigate('/deliveries/new')}>
            + Create Delivery
          </button>
        }
      />

      {loading ? <Loading text="Loading delivery orders..." /> : (
        <DataTable
          columns={columns}
          data={deliveries}
          onRowClick={(row) => navigate(`/deliveries/${row._id}`)}
        />
      )}
    </div>
  );
};
