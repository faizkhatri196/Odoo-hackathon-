import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../components/StatCard';
import { DataTable } from '../../../components/DataTable';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatNumber';
import { formatDate } from '../../../utils/formatDate';
import { useAuth } from '../../../hooks/useAuth';
import { teamService } from '../../../services/teamService';
import { warehouseService } from '../../../services/warehouseService';
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
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  X,
  Key,
  Mail,
  Briefcase,
  AlertCircle,
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
  const { user } = useAuth();

  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [teamFeedback, setTeamFeedback] = useState(null);
  const [assignForm, setAssignForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'inventory_manager',
    warehouse: '',
  });

  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [submittingWarehouse, setSubmittingWarehouse] = useState(false);
  const [warehouseFeedback, setWarehouseFeedback] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    location: '',
    capacity: 25000,
  });

  const handleAddWarehouseSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      setWarehouseFeedback({ type: 'error', text: 'Facility Name and Code are required.' });
      return;
    }

    setSubmittingWarehouse(true);
    setWarehouseFeedback(null);
    try {
      await warehouseService.createWarehouse({
        name: warehouseForm.name.trim(),
        code: warehouseForm.code.trim().toUpperCase(),
        location: warehouseForm.location.trim() || 'Central Logistics Hub',
        capacity: Number(warehouseForm.capacity) || 25000,
      });

      setWarehouseFeedback({
        type: 'success',
        text: `Successfully registered warehouse facility "${warehouseForm.name}"!`,
      });

      if (onRefresh) onRefresh();
      setTimeout(() => {
        setShowAddWarehouseModal(false);
        setWarehouseForm({ name: '', code: '', location: '', capacity: 25000 });
        setWarehouseFeedback(null);
      }, 1400);
    } catch (err) {
      setWarehouseFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to register warehouse facility',
      });
    } finally {
      setSubmittingWarehouse(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await teamService.getTeamMembers();
      if (res && res.data) {
        setTeamMembers(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch company team members:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenAssignModal = () => {
    setAssignForm({
      name: '',
      email: '',
      password: '',
      role: 'inventory_manager',
      warehouse: warehouses[0]?._id || warehouses[0]?.id || '',
    });
    setTeamFeedback(null);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.name.trim() || !assignForm.email.trim() || !assignForm.password.trim()) {
      setTeamFeedback({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setSubmittingTeam(true);
    setTeamFeedback(null);

    try {
      await teamService.createTeamMember({
        name: assignForm.name.trim(),
        email: assignForm.email.trim(),
        password: assignForm.password,
        role: assignForm.role,
        warehouse: assignForm.warehouse || undefined,
      });

      setTeamFeedback({
        type: 'success',
        text: `Successfully assigned ${assignForm.name} as ${assignForm.role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}!`,
      });

      await fetchTeam();
      setTimeout(() => {
        setShowAssignModal(false);
      }, 1400);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign team member';
      setTeamFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingTeam(false);
    }
  };

  const handleRemoveMember = async (id, memberName) => {
    if (!window.confirm(`Are you sure you want to revoke system access for "${memberName}"?`)) {
      return;
    }

    try {
      await teamService.removeTeamMember(id);
      await fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not revoke access');
    }
  };

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
      {/* Enterprise Multi-Tenant Company Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Building2 size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {user?.company?.name || user?.companyName || 'StockSense Global Logistics'}
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                ORG CODE: {user?.company?.code || 'SSGL'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Company Multi-Tenant Boundary • Scoped Warehouses, Stock & Workforce
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleOpenAssignModal}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
          >
            <UserPlus size={16} />
            <span>Assign Staff / Manager</span>
          </button>
        </div>
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setWarehouseForm({ name: '', code: '', location: '', capacity: 25000 });
                setWarehouseFeedback(null);
                setShowAddWarehouseModal(true);
              }}
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <Plus size={14} />
              <span>+ Add Warehouse</span>
            </button>
            <button
              onClick={() => navigate('/settings/warehouse')}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings size={14} />
              <span>Manage Facilities</span>
            </button>
          </div>
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

      {/* Company Team & Workforce Delegation */}
      <div id="team-management" className="glass-panel" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Company Team & Operational Workforce
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Assign Inventory Managers and Warehouse Staff to operate this company's logistics facilities
            </p>
          </div>

          <button
            onClick={handleOpenAssignModal}
            className="btn-primary"
            style={{ fontSize: '0.825rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={15} />
            <span>+ Assign Team Member</span>
          </button>
        </div>

        {loadingTeam ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading team roster...
          </div>
        ) : teamMembers.length === 0 ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <Users size={36} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
            <p style={{ color: '#fff', fontWeight: 600, margin: '0 0 6px 0' }}>
              No Team Members Assigned Yet
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              Delegate facility management by creating an Inventory Manager or Warehouse Staff account.
            </p>
            <button onClick={handleOpenAssignModal} className="btn-primary">
              <UserPlus size={16} />
              <span>Assign First Member</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Team Member</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Facility</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Date Joined</th>
                  <th style={{ padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => {
                  const isCurrent = (member._id || member.id) === (user?._id || user?.id);
                  let roleColor = '#818cf8';
                  let roleLabel = 'Administrator';
                  if (member.role === 'inventory_manager') {
                    roleColor = '#34d399';
                    roleLabel = 'Inventory Manager';
                  } else if (member.role === 'warehouse_staff') {
                    roleColor = '#fbbf24';
                    roleLabel = 'Warehouse Staff';
                  }

                  return (
                    <tr
                      key={member._id || member.id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${roleColor}, #4f46e5)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#fff',
                              fontSize: '0.8rem',
                            }}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <strong style={{ color: '#fff', display: 'block' }}>{member.name}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: `${roleColor}18`,
                            color: roleColor,
                            border: `1px solid ${roleColor}40`,
                          }}
                        >
                          {roleLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                        {member.warehouse?.name || 'All Facilities (Executive)'}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        {formatDate(member.createdAt || new Date())}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {isCurrent ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            You (Admin)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRemoveMember(member._id || member.id, member.name)}
                            title="Revoke access"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Modal: Assign Team Member */}
      {showAssignModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => !submittingTeam && setShowAssignModal(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Assign Company Team Member
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Scoped to {user?.company?.name || user?.companyName || 'your enterprise'}
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                disabled={submittingTeam}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {teamFeedback && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: teamFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: teamFeedback.type === 'success' ? '#34d399' : '#fb7185',
                  border: `1px solid ${teamFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                }}
              >
                {teamFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{teamFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={assignForm.name}
                  onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav@company.com"
                  value={assignForm.email}
                  onChange={(e) => setAssignForm({ ...assignForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    System Role *
                  </label>
                  <select
                    value={assignForm.role}
                    onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#1e293b',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="warehouse_staff">Warehouse Staff</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Assigned Facility
                  </label>
                  <select
                    value={assignForm.warehouse}
                    onChange={(e) => setAssignForm({ ...assignForm, warehouse: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#1e293b',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="">All Company Facilities</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id || wh.id} value={wh._id || wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={assignForm.password}
                  onChange={(e) => setAssignForm({ ...assignForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  disabled={submittingTeam}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={16} />
                  <span>{submittingTeam ? 'Assigning...' : 'Assign Role & Access'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register New Warehouse Facility */}
      {showAddWarehouseModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => !submittingWarehouse && setShowAddWarehouseModal(false)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '500px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Register New Warehouse Facility
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Scoped to {user?.company?.name || user?.companyName || 'your enterprise'}
                </p>
              </div>
              <button
                onClick={() => setShowAddWarehouseModal(false)}
                disabled={submittingWarehouse}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {warehouseFeedback && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: warehouseFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: warehouseFeedback.type === 'success' ? '#34d399' : '#fb7185',
                  border: `1px solid ${warehouseFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                }}
              >
                {warehouseFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{warehouseFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleAddWarehouseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Facility / Hub Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Central Logistics Park"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-PUN"
                    value={warehouseForm.code}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Rated Capacity (units)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={warehouseForm.capacity}
                    onChange={(e) => setWarehouseForm({ ...warehouseForm, capacity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Physical Location / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. MIDC Industrial Area Phase II, Pune, Maharashtra"
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  disabled={submittingWarehouse}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWarehouse}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Building2 size={16} />
                  <span>{submittingWarehouse ? 'Registering...' : 'Register Warehouse Hub'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
