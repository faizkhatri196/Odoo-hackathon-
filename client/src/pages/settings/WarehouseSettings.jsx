import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Loading } from '../../components/Loading';
import { warehouseService } from '../../services/warehouseService';
import { Warehouse, MapPin, Package, Plus, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const WarehouseSettings = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    location: '',
    capacity: 25000,
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await warehouseService.getWarehouses();
      if (res && res.data) {
        setWarehouses(res.data);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      setError('Unable to load warehouse facilities from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;

    try {
      setSubmitting(true);
      await warehouseService.createWarehouse({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        location: form.location.trim() || 'Central Logistics Hub',
        capacity: Number(form.capacity) || 20000,
      });
      setForm({ name: '', code: '', location: '', capacity: 25000 });
      setShowAddModal(false);
      await fetchWarehouses();
    } catch (err) {
      console.error('Failed to create warehouse:', err);
      alert(err.response?.data?.message || 'Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCapacity = warehouses.reduce((sum, wh) => sum + (wh.capacity || 0), 0);

  return (
    <div>
      <PageHeader
        title="Warehouse & Facility Network"
        description="Enterprise multi-facility logistics hubs, physical capacities, and regional nodes."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Add Facility</span>
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <StatCard title="Active Logistics Hubs" value={warehouses.length.toString()} icon={<Warehouse size={22} />} accent="primary" />
        <StatCard title="Total Network Capacity" value={`${totalCapacity.toLocaleString()} Units`} icon={<Package size={22} />} accent="emerald" />
        <StatCard title="Status" value="Live Connected" icon={<CheckCircle2 size={22} />} accent="blue" />
      </div>

      {loading ? (
        <Loading text="Loading live facilities..." />
      ) : error ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#f43f5e' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
          <button onClick={fetchWarehouses} className="btn-secondary" style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
              Live Logistics Infrastructure ({warehouses.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Source: MongoDB Atlas Enterprise Storage
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {warehouses.map((wh) => (
              <div
                key={wh._id || wh.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', letterSpacing: '0.5px' }}>
                    {wh.code}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: wh.isActive !== false ? '#34d399' : '#f43f5e', fontWeight: 600 }}>
                    <CheckCircle2 size={13} /> {wh.isActive !== false ? 'OPERATIONAL' : 'INACTIVE'}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{wh.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    📍 {typeof wh.location === 'object' ? wh.location?.address || 'Primary Logistics Zone' : wh.location || 'Primary Logistics Zone'}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Capacity Limit:</span>
                  <span style={{ fontWeight: 600, color: '#fff' }}>{(wh.capacity || 0).toLocaleString()} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Register New Logistics Hub</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Facility Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Distribution Center"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-PUN"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Storage Capacity (units)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Physical Location / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chakan Industrial Area Phase II, Pune"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Registering...' : 'Register Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseSettings;
