import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../components/StatCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatNumber';
import { formatDate } from '../../../utils/formatDate';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Package,
  Plus,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

export const ManagerDashboardView = ({
  data,
  products = [],
  receipts = [],
  deliveries = [],
  transfers = [],
}) => {
  const navigate = useNavigate();

  const lowStockItems = React.useMemo(() => {
    return products.filter((p) => (p.totalQuantity || 0) <= (p.minReorderLevel || 10));
  }, [products]);

  const pendingReceiptsList = React.useMemo(() => {
    return receipts.filter((r) => r.status !== 'done' && r.status !== 'canceled').slice(0, 5);
  }, [receipts]);

  const pendingDeliveriesList = React.useMemo(() => {
    return deliveries.filter((d) => d.status !== 'done' && d.status !== 'canceled').slice(0, 5);
  }, [deliveries]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Manager Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Low Stock Critical Alerts"
          subtitle="Requires replenishment order"
          value={formatNumber(lowStockItems.length)}
          icon={<AlertTriangle size={22} />}
          accent="rose"
          onClick={() => {
            const el = document.getElementById('reorder-board');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="Inbound Receipts Pipeline"
          subtitle="Supplier deliveries pending"
          value={formatNumber(data?.pendingReceipts || pendingReceiptsList.length)}
          icon={<ArrowDownLeft size={22} />}
          accent="blue"
          onClick={() => navigate('/receipts')}
        />
        <StatCard
          title="Outbound Delivery Queue"
          subtitle="Customer shipments pending"
          value={formatNumber(data?.pendingDeliveries || pendingDeliveriesList.length)}
          icon={<ArrowUpRight size={22} />}
          accent="amber"
          onClick={() => navigate('/deliveries')}
        />
        <StatCard
          title="Active Inter-Hub Transfers"
          subtitle="Facility rebalancing in transit"
          value={formatNumber(data?.activeTransfers || 0)}
          icon={<Repeat size={22} />}
          accent="emerald"
          onClick={() => navigate('/transfers')}
        />
      </div>

      {/* Quick Action Bar for Manager */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(17, 24, 39, 0.6) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Manager Operations:</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/receipts/new')}
            className="btn-primary"
            style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Create Inbound PO</span>
          </button>
          <button
            onClick={() => navigate('/deliveries/new')}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Create Delivery Order</span>
          </button>
          <button
            onClick={() => navigate('/transfers/new')}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Repeat size={14} />
            <span>Initiate Hub Transfer</span>
          </button>
          <button
            onClick={() => navigate('/adjustments/new')}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <SlidersHorizontal size={14} />
            <span>Stock Recount Audit</span>
          </button>
        </div>
      </div>

      {/* Urgent Reorder & Low Stock Alerts */}
      <div
        id="reorder-board"
        className="glass-panel"
        style={{
          padding: '24px',
          borderColor: lowStockItems.length > 0 ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)',
          background: lowStockItems.length > 0 ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(17, 24, 39, 0.8) 100%)' : 'transparent',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#fb7185" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Replenishment Reorder Board ({lowStockItems.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Items currently at or below the automated minimum safety threshold
            </p>
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

        {lowStockItems.length === 0 ? (
          <p style={{ color: '#34d399', fontSize: '0.9rem' }}>
            ✓ All catalog items are adequately stocked above reorder thresholds.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {lowStockItems.map((item) => (
              <div
                key={item._id || item.sku}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: 0 }}>{item.name}</h4>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                    SKU: {item.sku}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Current Stock: <strong style={{ color: '#fb7185' }}>{item.totalQuantity || 0} {item.unitOfMeasure || 'units'}</strong>
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>
                    Reorder at: {item.minReorderLevel || 10}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/receipts/new')}
                  className="btn-primary"
                  style={{
                    marginTop: '4px',
                    width: '100%',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} />
                  <span>Issue Supplier Restock Order</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Operational Pipeline: Inbound vs Outbound */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Pending Inbound Receipts */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
              Inbound Supplier PO Pipeline
            </h3>
            <button
              onClick={() => navigate('/receipts')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              All Receipts
            </button>
          </div>

          {pendingReceiptsList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending inbound receipts.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingReceiptsList.map((rec) => (
                <div
                  key={rec._id}
                  onClick={() => navigate(`/receipts/${rec._id}`)}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.875rem' }}>{rec.receiptNumber}</strong>
                    <span style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Supplier: {rec.supplier?.name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={rec.status} />
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
                      {formatCurrency(rec.totalAmount || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Outbound Deliveries */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fb7185', margin: 0 }}>
              Outbound Customer Dispatch Queue
            </h3>
            <button
              onClick={() => navigate('/deliveries')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              All Deliveries
            </button>
          </div>

          {pendingDeliveriesList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending customer deliveries.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingDeliveriesList.map((del) => (
                <div
                  key={del._id}
                  onClick={() => navigate(`/deliveries/${del._id}`)}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.875rem' }}>{del.deliveryNumber}</strong>
                    <span style={{ display: 'block', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Customer: {del.customer?.name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatusBadge status={del.status} />
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px', fontWeight: 600 }}>
                      {formatCurrency(del.totalAmount || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
