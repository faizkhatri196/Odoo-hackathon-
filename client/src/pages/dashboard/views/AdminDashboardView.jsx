import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../components/StatCard';
import { DataTable } from '../../../components/DataTable';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatNumber';
import { formatDate } from '../../../utils/formatDate';
import {
  ShieldCheck,
  Building2,
  Package,
  History,
  TrendingUp,
  Plus,
  ArrowRight,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  SlidersHorizontal,
  Settings,
} from 'lucide-react';

export const AdminDashboardView = ({
  data,
  products = [],
  warehouses = [],
  categories = [],
  onRefresh,
  refreshing,
}) => {
  const navigate = useNavigate();

  // Compute category valuation distribution
  const categoryStats = React.useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      if (!map[cat]) map[cat] = { count: 0, valuation: 0 };
      map[cat].count += 1;
      map[cat].valuation += (p.totalQuantity || 0) * (p.costPrice || 0);
    });
    return Object.entries(map).map(([name, stat]) => ({ name, ...stat }));
  }, [products]);

  const activityColumns = [
    {
      header: 'Type',
      render: (row) => {
        const type = (row.transactionType || '').toLowerCase();
        let badgeColor = '#38bdf8';
        let IconComp = Boxes;
        if (type.includes('receipt') || type.includes('in')) {
          badgeColor = '#34d399';
          IconComp = ArrowDownLeft;
        } else if (type.includes('delivery') || type.includes('out')) {
          badgeColor = '#fb7185';
          IconComp = ArrowUpRight;
        } else if (type.includes('transfer')) {
          badgeColor = '#fbbf24';
          IconComp = Repeat;
        } else if (type.includes('adjustment')) {
          badgeColor = '#a78bfa';
          IconComp = SlidersHorizontal;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconComp size={16} color={badgeColor} />
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {row.transactionType || 'Operation'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Reference #',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
          {row.referenceNumber || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Product / SKU',
      render: (row) => (
        <div>
          <strong style={{ color: '#fff' }}>{row.product?.name || 'Stock Item'}</strong>
          {row.product?.sku && (
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              SKU: {row.product.sku}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Stock Delta',
      render: (row) => {
        const delta = row.quantityChange || 0;
        const isPos = delta > 0;
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: isPos ? '#34d399' : '#fb7185',
              border: `1px solid ${isPos ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}
          >
            {isPos ? `+${delta}` : delta}
          </span>
        );
      },
    },
    {
      header: 'Facility',
      render: (row) => row.warehouse?.name || row.warehouse?.code || 'Main Hub',
    },
    {
      header: 'Timestamp',
      render: (row) => formatDate(row.createdAt || new Date()),
    },
  ];

  const pendingApprovalsCount =
    (data?.pendingReceipts || 0) +
    (data?.pendingDeliveries || 0) +
    (data?.activeTransfers || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Executive KPI Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Total Network Valuation"
          subtitle="All active logistics facilities"
          value={formatCurrency(data?.totalStockValuation || 0)}
          icon={<TrendingUp size={22} />}
          accent="primary"
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="Active Logistics Hubs"
          subtitle="Regional distribution centers"
          value={formatNumber(warehouses.length || 4)}
          icon={<Building2 size={22} />}
          accent="blue"
          onClick={() => navigate('/settings/warehouse')}
        />
        <StatCard
          title="Total Managed SKUs"
          subtitle={`${categories.length} active categories`}
          value={formatNumber(data?.totalProducts || products.length)}
          icon={<Package size={22} />}
          accent="emerald"
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="Pending Operations Sign-Off"
          subtitle="Receipts, deliveries, transfers"
          value={formatNumber(pendingApprovalsCount)}
          icon={<ShieldCheck size={22} />}
          accent={pendingApprovalsCount > 0 ? 'amber' : 'primary'}
          onClick={() => navigate('/receipts')}
        />
      </div>

      {/* Multi-Facility Logistics Infrastructure */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Multi-Facility Logistics Hubs Infrastructure
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Real-time monitoring of facility capacity, location, and operational status
            </p>
          </div>
          <button
            onClick={() => navigate('/settings/warehouse')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Settings size={14} />
            <span>Manage Facilities</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {warehouses.map((wh) => (
            <div
              key={wh._id || wh.id || wh.code}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{wh.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Code: {wh.code}
                  </span>
                </div>
                <StatusBadge status={wh.isActive !== false ? 'ready' : 'canceled'} />
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                📍 {wh.location?.city ? `${wh.location.city}, ${wh.location.state || wh.location.country}` : 'Central Logistics Zone'}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <span>Rated Capacity:</span>
                <strong style={{ color: '#fff' }}>{formatNumber(wh.capacity || 25000)} units</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Valuation by Category */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Enterprise Stock Valuation Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {categoryStats.map((cat, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{cat.name}</span>
              <strong style={{ fontSize: '1.25rem', color: '#38bdf8', display: 'block', margin: '6px 0' }}>
                {formatCurrency(cat.valuation)}
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {cat.count} product lines registered
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Master Audit Ledger Activity */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Master Inventory Audit Ledger
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Immutable transaction log of all warehouse movements and adjustments
            </p>
          </div>
          <button
            onClick={() => navigate('/ledger')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>View Full Move History</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <DataTable columns={activityColumns} data={data?.recentActivities || []} />
      </div>
    </div>
  );
};
