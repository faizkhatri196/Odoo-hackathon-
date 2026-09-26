import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Warehouse, MapPin, Package, Plus, CheckCircle2 } from 'lucide-react';

const initialWarehouses = [
  { id: 'wh-1', code: 'WH-MAIN', name: 'Main Central Warehouse', location: 'Building A, Zone 1', capacity: '50,000 units', status: 'Active' },
  { id: 'wh-2', code: 'WH-NORTH', name: 'North Distribution Hub', location: 'Industrial Park North', capacity: '25,000 units', status: 'Active' },
  { id: 'wh-3', code: 'WH-WEST', name: 'West Regional Depot', location: 'West Logistics Park', capacity: '15,000 units', status: 'Active' },
];

export const WarehouseSettings = () => {
  const [warehouses] = useState(initialWarehouses);

  return (
    <div>
      <PageHeader
        title="Warehouse & Location Settings"
        description="Manage multi-warehouse facilities, storage zones, and location identifiers for StockSense."
        action={
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Add Warehouse Facility</span>
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <StatCard title="Active Warehouses" value={warehouses.length.toString()} icon={<Warehouse size={22} />} accent="primary" />
        <StatCard title="Total Storage Nodes" value="12 Zones" icon={<MapPin size={22} />} accent="emerald" />
        <StatCard title="Capacity Utilization" value="68%" icon={<Package size={22} />} accent="blue" />
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>Registered Facilities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  {wh.code}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#34d399' }}>
                  <CheckCircle2 size={12} /> {wh.status}
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{wh.name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {wh.location}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Capacity: {wh.capacity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
