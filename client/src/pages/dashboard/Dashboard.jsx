import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { DataTable } from '../../components/DataTable';
import { Loading } from '../../components/Loading';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';
import { DashboardFilters } from '../../components/DashboardFilters';
import { dashboardService } from '../../services/dashboardService';
import { productService } from '../../services/productService';
import { formatCurrency, formatNumber } from '../../utils/formatNumber';
import { formatDate } from '../../utils/formatDate';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  RefreshCw,
  Plus,
  SlidersHorizontal,
  ArrowRight,
  Boxes,
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Filters State
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    warehouse: 'ALL',
    category: 'ALL',
    search: '',
  });

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const [dashRes, prodRes, whRes, catRes] = await Promise.all([
        dashboardService.getDashboardMetrics(filters),
        productService.getProducts().catch(() => ({ data: [] })),
        dashboardService.getWarehouses(),
        dashboardService.getCategories(),
      ]);

      setData(dashRes.data);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setWarehouses(whRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('Unable to load warehouse operations from backend engine. Please verify connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'ALL',
      status: 'ALL',
      warehouse: 'ALL',
      category: 'ALL',
      search: '',
    });
  };

  // Compute Low Stock Items from Products list
  const lowStockItems = useMemo(() => {
    return products.filter((p) => (p.totalQuantity || 0) <= (p.minReorderLevel || 10));
  }, [products]);

  // Filter Recent Activities dynamically based on user controls
  const filteredActivities = useMemo(() => {
    if (!data?.recentActivities) return [];

    return data.recentActivities.filter((act) => {
      // Filter Document Type
      if (filters.type !== 'ALL') {
        const actType = (act.transactionType || '').toLowerCase();
        if (filters.type === 'receipt' && !actType.includes('receipt')) return false;
        if (filters.type === 'delivery' && !actType.includes('delivery')) return false;
        if (filters.type === 'transfer' && !actType.includes('transfer')) return false;
        if (filters.type === 'adjustment' && !actType.includes('adjustment')) return false;
      }

      // Filter Status
      if (filters.status !== 'ALL') {
        const actStatus = (act.status || 'done').toLowerCase();
        if (actStatus !== filters.status.toLowerCase()) return false;
      }

      // Filter Warehouse
      if (filters.warehouse !== 'ALL') {
        const whVal = filters.warehouse.toLowerCase();
        const whCode = (act.warehouse?.code || '').toLowerCase();
        const whId = (act.warehouse?._id || act.warehouse?.id || '').toLowerCase();
        const whName = (act.warehouse?.name || '').toLowerCase();
        if (!whCode.includes(whVal) && !whId.includes(whVal) && !whName.includes(whVal)) {
          return false;
        }
      }

      // Filter Category
      if (filters.category !== 'ALL') {
        const catVal = filters.category.toLowerCase();
        const prodCat = (act.product?.category || act.category || '').toLowerCase();
        if (!prodCat.includes(catVal)) {
          return false;
        }
      }

      // Filter Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const prodName = (act.product?.name || '').toLowerCase();
        const prodSku = (act.product?.sku || '').toLowerCase();
        const ref = (act.referenceNumber || '').toLowerCase();
        if (!prodName.includes(query) && !prodSku.includes(query) && !ref.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  if (loading) {
    return <Loading text="Aggregating warehouse stock counts and operations metrics..." />;
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <AlertTriangle size={48} color="#f43f5e" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Backend Service Error</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          <RefreshCw size={16} />
          <span>Retry Loading Dashboard</span>
        </button>
      </div>
    );
  }

  const columns = [
    {
      header: 'Document Type',
      render: (row) => {
        const type = (row.transactionType || 'Movement').toLowerCase();
        let badgeColor = 'blue';
        let IconComp = Boxes;

        if (type.includes('receipt') || type.includes('in')) {
          badgeColor = 'emerald';
          IconComp = ArrowDownLeft;
        } else if (type.includes('delivery') || type.includes('out')) {
          badgeColor = 'rose';
          IconComp = ArrowUpRight;
        } else if (type.includes('transfer')) {
          badgeColor = 'amber';
          IconComp = Repeat;
        } else if (type.includes('adjustment')) {
          badgeColor = 'purple';
          IconComp = SlidersHorizontal;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconComp size={16} color={`var(--accent-${badgeColor})`} />
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {row.transactionType || 'Operation'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Reference',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
          {row.referenceNumber || `REF-${(row._id || '').slice(-6).toUpperCase()}`}
        </span>
      ),
    },
    {
      header: 'Product',
      render: (row) => (
        <div>
          <p style={{ fontWeight: 600, color: '#fff' }}>{row.product?.name || 'Stock Item'}</p>
          {row.product?.sku && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SKU: {row.product.sku}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Stock Delta',
      render: (row) => {
        const change = row.quantityChange || 0;
        const isPositive = change > 0;
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: isPositive ? '#34d399' : '#fb7185',
              border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            }}
          >
            {isPositive ? `+${change}` : change}
          </span>
        );
      },
    },
    {
      header: 'Warehouse',
      render: (row) => row.warehouse?.name || row.warehouse?.code || 'Main Central (WH-MAIN)',
    },
    {
      header: 'Timestamp',
      render: (row) => formatDate(row.createdAt || new Date()),
    },
  ];

  return (
    <div>
      {/* Header with Quick Actions */}
      <PageHeader
        title="StockSense Inventory Dashboard"
        description="Real-time multi-warehouse stock monitoring, automated reorder tracking, and operational movement audit."
        action={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRefresh}
              className="btn-secondary"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => navigate('/receipts/new')}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>New Receipt</span>
            </button>
          </div>
        }
      />

      {/* 5 KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <StatCard
          title="Total Products in Stock"
          subtitle={`Valuation: ${formatCurrency(data?.totalStockValuation || 0)}`}
          value={formatNumber(data?.totalProducts || 0)}
          icon={<Package size={20} />}
          accent="primary"
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="Low Stock / Out of Stock"
          subtitle="Attention required"
          value={formatNumber(data?.lowStockCount || lowStockItems.length)}
          icon={<AlertTriangle size={20} />}
          accent="rose"
          onClick={() => {
            const el = document.getElementById('low-stock-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="Pending Receipts"
          subtitle="Inbound inventory"
          value={formatNumber(data?.pendingReceipts || 0)}
          icon={<ArrowDownLeft size={20} />}
          accent="blue"
          onClick={() => navigate('/receipts')}
        />
        <StatCard
          title="Pending Deliveries"
          subtitle="Outbound dispatches"
          value={formatNumber(data?.pendingDeliveries || 0)}
          icon={<ArrowUpRight size={20} />}
          accent="amber"
          onClick={() => navigate('/deliveries')}
        />
        <StatCard
          title="Internal Transfers"
          subtitle="Inter-warehouse moves"
          value={formatNumber(data?.activeTransfers || 0)}
          icon={<Repeat size={20} />}
          accent="emerald"
          onClick={() => navigate('/transfers')}
        />
      </div>

      {/* Dynamic Filters Component */}
      <DashboardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        warehouses={warehouses}
        categories={categories}
      />

      {/* Low Stock Warning Section */}
      {lowStockItems.length > 0 && (
        <div
          id="low-stock-section"
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '28px',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(17, 24, 39, 0.8) 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#fb7185" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Low Stock Reorder Alerts ({lowStockItems.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>View All SKUs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
            }}
          >
            {lowStockItems.slice(0, 4).map((item) => (
              <div
                key={item._id || item.sku}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: 0 }}>{item.name}</h4>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#fb7185',
                    }}
                  >
                    SKU: {item.sku}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stock: <strong style={{ color: '#fb7185' }}>{item.totalQuantity || 0} {item.uom || 'pcs'}</strong></span>
                  <span style={{ color: 'var(--text-dim)' }}>Reorder at: {item.minReorderLevel || 10}</span>
                </div>
                <button
                  onClick={() => navigate(`/receipts/new?product=${item._id}`)}
                  className="btn-secondary"
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '0.775rem',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: 'rgba(99, 102, 241, 0.4)',
                    color: '#818cf8',
                  }}
                >
                  <Plus size={14} />
                  <span>Create Restock Receipt</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Movements & Stock Ledger Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Recent Inventory Ledger Activity
          </h3>
          <button
            onClick={() => navigate('/ledger')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Full Move History</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {filteredActivities.length === 0 ? (
          <EmptyState
            title="No inventory movements found"
            description="No transaction logs match your active filter criteria. Try clearing search or resetting options."
            action={
              <button onClick={handleResetFilters} className="btn-secondary" style={{ marginTop: '12px' }}>
                Reset All Filters
              </button>
            }
          />
        ) : (
          <DataTable columns={columns} data={filteredActivities} />
        )}
      </div>
    </div>
  );
};
