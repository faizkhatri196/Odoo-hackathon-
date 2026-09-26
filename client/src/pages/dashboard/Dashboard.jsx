import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { DataTable } from '../../components/DataTable';
import { Loading } from '../../components/Loading';
import { dashboardService } from '../../services/dashboardService';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';
import { formatDate } from '../../utils/formatDate';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getDashboardMetrics();
        setData(res.data);
      } catch (err) {
        console.error('Error loading dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loading text="Aggregating warehouse operations..." />;

  const columns = [
    { header: 'Type', accessor: 'transactionType' },
    { header: 'Reference', accessor: 'referenceNumber' },
    { header: 'Product', render: (row) => row.product?.name || 'Product' },
    { header: 'Change', render: (row) => (
      <span style={{ color: row.quantityChange > 0 ? '#34d399' : '#fb7185', fontWeight: 600 }}>
        {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
      </span>
    )},
    { header: 'Date', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouse Operations Dashboard"
        description="Live overview of stock valuations, receipts, dispatches and ledger activity."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard title="Total Inventory Value" value={formatCurrency(data?.totalStockValuation)} icon="💰" accent="emerald" />
        <StatCard title="Total SKUs" value={formatNumber(data?.totalProducts)} icon="📦" accent="primary" />
        <StatCard title="Low Stock Alerts" value={formatNumber(data?.lowStockCount)} icon="⚠️" accent="rose" />
        <StatCard title="Pending Receipts" value={formatNumber(data?.pendingReceipts)} icon="📥" accent="blue" />
        <StatCard title="Pending Deliveries" value={formatNumber(data?.pendingDeliveries)} icon="📤" accent="amber" />
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Recent Stock Ledger Activity</h3>
        <DataTable columns={columns} data={data?.recentActivities || []} />
      </div>
    </div>
  );
};
