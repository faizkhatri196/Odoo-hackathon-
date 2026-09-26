import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { Loading } from '../../components/Loading';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { productService } from '../../services/productService';
import { receiptService } from '../../services/receiptService';
import { deliveryService } from '../../services/deliveryService';
import { transferService } from '../../services/transferService';
import { AdminDashboardView } from './views/AdminDashboardView';
import { ManagerDashboardView } from './views/ManagerDashboardView';
import { StaffDashboardView } from './views/StaffDashboardView';
import {
  RefreshCw,
  ShieldCheck,
  Package,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Role can be defaulted to the logged in user's role
  const userRole = user?.role || 'admin';
  const [activeRoleView, setActiveRoleView] = useState(userRole);

  // Sync state if user loads after mount
  useEffect(() => {
    if (user?.role) {
      setActiveRoleView(user.role);
    }
  }, [user?.role]);

  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const [
        dashRes,
        prodRes,
        whRes,
        catRes,
        recRes,
        delRes,
        trfRes,
      ] = await Promise.all([
        dashboardService.getDashboardMetrics(),
        productService.getProducts().catch(() => ({ data: [] })),
        dashboardService.getWarehouses(),
        dashboardService.getCategories(),
        receiptService.getReceipts().catch(() => ({ data: [] })),
        deliveryService.getDeliveries().catch(() => ({ data: [] })),
        transferService.getTransfers().catch(() => ({ data: [] })),
      ]);

      setData(dashRes.data);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setWarehouses(whRes.data || []);
      setCategories(catRes.data || []);
      setReceipts(recRes.data || []);
      setDeliveries(delRes.data || []);
      setTransfers(trfRes.data || []);
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

  if (loading) {
    return <Loading text="Loading role-specific operational workspace..." />;
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <AlertTriangle size={48} color="#f43f5e" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>Operational Service Offline</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          <RefreshCw size={16} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const roleMeta = {
    admin: {
      title: 'Executive Operations Command Center',
      desc: 'Enterprise multi-warehouse control, network valuation, master audit ledger, and facility monitoring.',
      color: '#818cf8',
      label: 'Administrator',
      icon: ShieldCheck,
    },
    inventory_manager: {
      title: 'Inventory Replenishment & Planning Center',
      desc: 'Reorder safety thresholds, inbound supplier pipelines, outbound sales allocations, and stock accuracy.',
      color: '#34d399',
      label: 'Inventory Manager',
      icon: Package,
    },
    warehouse_staff: {
      title: 'Warehouse Floor Execution Terminal',
      desc: 'Immediate receiving queue, order pick-and-dispatch bay, and inter-hub transfer loading tasks.',
      color: '#fbbf24',
      label: 'Warehouse Staff',
      icon: Wrench,
    },
  };

  const currentRoleConfig = roleMeta[activeRoleView] || roleMeta.admin;
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div>
      {/* Role Header & Role Switcher */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: `rgba(${activeRoleView === 'admin' ? '99, 102, 241' : activeRoleView === 'inventory_manager' ? '16, 185, 129' : '245, 158, 11'}, 0.15)`,
                  color: currentRoleConfig.color,
                  border: `1px solid ${currentRoleConfig.color}`,
                }}
              >
                <RoleIcon size={14} />
                <span>{currentRoleConfig.label} Workspace</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                User: <strong style={{ color: '#fff' }}>{user?.name || 'Authorized Member'}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {currentRoleConfig.title}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
              {currentRoleConfig.desc}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleRefresh}
              className="btn-secondary"
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
            </button>
          </div>
        </div>

        {/* Role View Tabs (Automatic by role, with preview switcher) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '6px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            width: 'fit-content',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveRoleView('admin')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: activeRoleView === 'admin' ? 700 : 500,
              background: activeRoleView === 'admin' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: activeRoleView === 'admin' ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldCheck size={14} />
            <span>Administrator View</span>
            {user?.role === 'admin' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Your Role)</span>}
          </button>

          <button
            onClick={() => setActiveRoleView('inventory_manager')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: activeRoleView === 'inventory_manager' ? 700 : 500,
              background: activeRoleView === 'inventory_manager' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeRoleView === 'inventory_manager' ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Package size={14} />
            <span>Inventory Manager View</span>
            {user?.role === 'inventory_manager' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Your Role)</span>}
          </button>

          <button
            onClick={() => setActiveRoleView('warehouse_staff')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: activeRoleView === 'warehouse_staff' ? 700 : 500,
              background: activeRoleView === 'warehouse_staff' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: activeRoleView === 'warehouse_staff' ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <Wrench size={14} />
            <span>Warehouse Staff View</span>
            {user?.role === 'warehouse_staff' && <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>(Your Role)</span>}
          </button>
        </div>
      </div>

      {/* Role-Specific Dynamic Dashboard Component */}
      {activeRoleView === 'admin' && (
        <AdminDashboardView
          data={data}
          products={products}
          warehouses={warehouses}
          categories={categories}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}

      {activeRoleView === 'inventory_manager' && (
        <ManagerDashboardView
          data={data}
          products={products}
          receipts={receipts}
          deliveries={deliveries}
          transfers={transfers}
        />
      )}

      {activeRoleView === 'warehouse_staff' && (
        <StaffDashboardView
          receipts={receipts}
          deliveries={deliveries}
          transfers={transfers}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};
