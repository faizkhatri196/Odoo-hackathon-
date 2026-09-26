import React from 'react';
import { Search, RotateCcw, Filter, Building2, Tag, FileText, CheckCircle2 } from 'lucide-react';

export const DashboardFilters = ({
  filters,
  onFilterChange,
  onReset,
  warehouses = [],
  categories = [],
}) => {
  const documentTypes = [
    { value: 'ALL', label: 'All Operations' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'delivery', label: 'Deliveries' },
    { value: 'transfer', label: 'Internal Transfers' },
    { value: 'adjustment', label: 'Adjustments' },
  ];

  const statuses = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
  ];

  const activeCount = Object.values(filters).filter(
    (val) => val && val !== 'ALL' && val !== ''
  ).length;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
            Dynamic Operation Filters
          </h3>
          {activeCount > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'var(--primary)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {activeCount} active
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Select Controls Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search SKU, Product, Ref..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Document Type Filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={filters.type || 'ALL'}
            onChange={(e) => onFilterChange('type', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {documentTypes.map((dt) => (
              <option key={dt.value} value={dt.value} style={{ background: '#111827', color: '#fff' }}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {statuses.map((st) => (
              <option key={st.value} value={st.value} style={{ background: '#111827', color: '#fff' }}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* Warehouse Filter */}
        <div>
          <select
            value={filters.warehouse || 'ALL'}
            onChange={(e) => onFilterChange('warehouse', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{ background: '#111827', color: '#fff' }}>
              All Warehouses / Locations
            </option>
            {warehouses.map((wh) => (
              <option key={wh._id || wh.id || wh.code} value={wh.code || wh._id} style={{ background: '#111827', color: '#fff' }}>
                {wh.name || wh.code}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.category || 'ALL'}
            onChange={(e) => onFilterChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{ background: '#111827', color: '#fff' }}>
              All Product Categories
            </option>
            {categories.map((cat) => (
              <option key={cat._id || cat.id || cat.name} value={cat.name || cat._id} style={{ background: '#111827', color: '#fff' }}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
