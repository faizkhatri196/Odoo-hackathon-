import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { Loading } from '../../components/Loading';
import api from '../../services/api';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatNumber';

export const StockLedger = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/ledger');
        setEntries(res.data.entries || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    { header: 'Type', accessor: 'transactionType' },
    { header: 'Reference', accessor: 'referenceNumber' },
    { header: 'Product', render: (row) => row.product?.name || 'Product' },
    { header: 'Quantity Change', render: (row) => (
      <span style={{ fontWeight: 700, color: row.quantityChange >= 0 ? '#34d399' : '#fb7185' }}>
        {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
      </span>
    )},
    { header: 'Stock After', accessor: 'newQuantity' },
    { header: 'Unit Cost', render: (row) => formatCurrency(row.unitCost) },
    { header: 'Timestamp', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Double-Entry Stock Ledger"
        description="Immutable audit trail of all inventory events and valuation shifts."
      />

      {loading ? <Loading text="Fetching ledger entries..." /> : (
        <DataTable
          columns={columns}
          data={entries}
          onRowClick={(row) => navigate(`/ledger/${row._id}`)}
        />
      )}
    </div>
  );
};
