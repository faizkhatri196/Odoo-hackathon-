import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../components/StatCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatNumber';
import { formatDate } from '../../../utils/formatDate';
import { receiptService } from '../../../services/receiptService';
import { deliveryService } from '../../../services/deliveryService';
import { transferService } from '../../../services/transferService';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  CheckCircle,
  Plus,
  ArrowRight,
  Truck,
  PackageCheck,
} from 'lucide-react';

export const StaffDashboardView = ({
  receipts = [],
  deliveries = [],
  transfers = [],
  onRefresh,
}) => {
  const navigate = useNavigate();

  const [actionLoading, setActionLoading] = useState({});
  const [feedback, setFeedback] = useState('');

  // Ready/pending tasks
  const readyReceipts = React.useMemo(() => {
    return receipts.filter((r) => r.status !== 'done' && r.status !== 'canceled');
  }, [receipts]);

  const readyDeliveries = React.useMemo(() => {
    return deliveries.filter((d) => d.status !== 'done' && d.status !== 'canceled');
  }, [deliveries]);

  const activeTransfersList = React.useMemo(() => {
    return transfers.filter((t) => t.status !== 'done' && t.status !== 'canceled');
  }, [transfers]);

  const handleValidateReceipt = async (e, id) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [`rec-${id}`]: true }));
    setFeedback('');
    try {
      await receiptService.validateReceipt(id);
      setFeedback('✅ Inbound shipment received into warehouse stock successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Receipt intake failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`rec-${id}`]: false }));
    }
  };

  const handleValidateDelivery = async (e, id) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [`del-${id}`]: true }));
    setFeedback('');
    try {
      await deliveryService.validateDelivery(id);
      setFeedback('✅ Outbound order dispatched and stock deducted successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Delivery dispatch failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`del-${id}`]: false }));
    }
  };

  const handleValidateTransfer = async (e, id) => {
    e.stopPropagation();
    setActionLoading((prev) => ({ ...prev, [`trf-${id}`]: true }));
    setFeedback('');
    try {
      await transferService.validateTransfer(id);
      setFeedback('✅ Internal warehouse transfer executed cleanly!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Transfer execution failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`trf-${id}`]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: 'var(--radius-sm)',
            color: '#6ee7b7',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {feedback}
        </div>
      )}

      {/* Staff Fast Action KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          title="Inbound Receiving Dock"
          subtitle="Shipments awaiting stock intake"
          value={formatNumber(readyReceipts.length)}
          icon={<ArrowDownLeft size={22} />}
          accent="emerald"
          onClick={() => {
            const el = document.getElementById('receiving-dock');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="Outbound Dispatch Staging"
          subtitle="Orders ready for carrier pickup"
          value={formatNumber(readyDeliveries.length)}
          icon={<ArrowUpRight size={22} />}
          accent="rose"
          onClick={() => {
            const el = document.getElementById('dispatch-bay');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <StatCard
          title="Facility Transfer Orders"
          subtitle="Items moving between hubs"
          value={formatNumber(activeTransfersList.length)}
          icon={<Repeat size={22} />}
          accent="amber"
          onClick={() => {
            const el = document.getElementById('transfer-bay');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>

      {/* Staff Quick Actions Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(17, 24, 39, 0.6) 100%)',
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Floor Worker Fast Tasks:</span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/receipts/new')}
            className="btn-primary"
            style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Receive New Shipment</span>
          </button>
          <button
            onClick={() => navigate('/transfers/new')}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Repeat size={14} />
            <span>Move Items To Another Hub</span>
          </button>
        </div>
      </div>

      {/* Inbound Receiving Dock Queue */}
      <div id="receiving-dock" className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageCheck size={20} color="#34d399" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Inbound Receiving Dock Queue ({readyReceipts.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Inspect and validate stock intakes directly from incoming freight carriers
            </p>
          </div>
          <button
            onClick={() => navigate('/receipts')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
          >
            View All Receipts
          </button>
        </div>

        {readyReceipts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No incoming shipments pending intake at the moment.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {readyReceipts.map((rec) => (
              <div
                key={rec._id}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>{rec.receiptNumber}</strong>
                    <StatusBadge status={rec.status} />
                  </div>
                  <span style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Supplier: <strong style={{ color: '#fff' }}>{rec.supplier?.name || 'N/A'}</strong> | Target: {rec.warehouse?.name || 'Main Hub'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Scheduled: {formatDate(rec.scheduledDate)} | Items: {rec.items?.length || 1} line(s)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/receipts/${rec._id}`)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => handleValidateReceipt(e, rec._id)}
                    disabled={actionLoading[`rec-${rec._id}`]}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#059669', borderColor: '#10b981' }}
                  >
                    {actionLoading[`rec-${rec._id}`] ? 'Receiving...' : '✓ Receive & Validate Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outbound Dispatch Staging Queue */}
      <div id="dispatch-bay" className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} color="#fb7185" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Outbound Dispatch Staging Queue ({readyDeliveries.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Confirm pick lists and release orders to courier & logistics carriers
            </p>
          </div>
          <button
            onClick={() => navigate('/deliveries')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
          >
            View All Deliveries
          </button>
        </div>

        {readyDeliveries.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No outbound customer orders pending dispatch.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {readyDeliveries.map((del) => (
              <div
                key={del._id}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>{del.deliveryNumber}</strong>
                    <StatusBadge status={del.status} />
                  </div>
                  <span style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Customer: <strong style={{ color: '#fff' }}>{del.customer?.name || 'N/A'}</strong> | Warehouse: {del.warehouse?.name || 'Main Hub'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Total Order Value: {formatCurrency(del.totalAmount || 0)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/deliveries/${del._id}`)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => handleValidateDelivery(e, del._id)}
                    disabled={actionLoading[`del-${del._id}`]}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#dc2626', borderColor: '#ef4444' }}
                  >
                    {actionLoading[`del-${del._id}`] ? 'Dispatching...' : '🚀 Validate & Dispatch'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inter-Warehouse Transfer Loading Dock */}
      <div id="transfer-bay" className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Repeat size={20} color="#fbbf24" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Inter-Warehouse Relocation Movements ({activeTransfersList.length})
              </h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Execute physical inventory movement between logistics facilities
            </p>
          </div>
          <button
            onClick={() => navigate('/transfers')}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
          >
            View All Transfers
          </button>
        </div>

        {activeTransfersList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No inter-facility transfer orders waiting to be moved.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeTransfersList.map((trf) => (
              <div
                key={trf._id}
                style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>{trf.transferNumber}</strong>
                    <StatusBadge status={trf.status} />
                  </div>
                  <span style={{ display: 'block', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Route: <strong style={{ color: '#fff' }}>{trf.fromWarehouse?.name || 'From'}</strong> ➡️ <strong style={{ color: '#fff' }}>{trf.toWarehouse?.name || 'To'}</strong>
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Items: {trf.items?.length || 1} line(s)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/transfers/${trf._id}`)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => handleValidateTransfer(e, trf._id)}
                    disabled={actionLoading[`trf-${trf._id}`]}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#d97706', borderColor: '#f59e0b' }}
                  >
                    {actionLoading[`trf-${trf._id}`] ? 'Transferring...' : '⚡ Execute Transfer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
