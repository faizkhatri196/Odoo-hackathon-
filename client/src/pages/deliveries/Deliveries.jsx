import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { deliveryService } from '../../services/deliveryService';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';

export const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaff = user?.role === 'warehouse_staff';
  const isManagerOrAdmin = user?.role === 'inventory_manager' || user?.role === 'admin';

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
        title={isStaff ? 'Outbound Dispatch Bay' : 'Outgoing Deliveries & Shipments'}
        description={
          isStaff
            ? 'Warehouse pick, pack, and vehicle loading queue for orders assigned to your facility.'
            : 'Manage customer sales shipments, dispatch schedules, and inventory allocation.'
        }
        actions={
          isManagerOrAdmin && (
            <button className="btn-primary" onClick={() => navigate('/deliveries/new')}>
              + Create Delivery Order
            </button>
          )
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
