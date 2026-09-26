import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DataTable } from '../../components/DataTable';
import { SearchBar } from '../../components/SearchBar';
import { Loading } from '../../components/Loading';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/formatNumber';
import { useAuth } from '../../hooks/useAuth';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await productService.getProducts({ search });
        setProducts(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    { header: 'SKU', accessor: 'sku' },
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Cost Price', render: (row) => formatCurrency(row.costPrice) },
    { header: 'Selling Price', render: (row) => formatCurrency(row.sellingPrice) },
    { header: 'On Hand', render: (row) => (
      <span style={{ fontWeight: 700, color: row.totalQuantity <= row.minReorderLevel ? '#fb7185' : '#34d399' }}>
        {row.totalQuantity} {row.unitOfMeasure}
      </span>
    )},
  ];

  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Products & Inventory Master"
        description="Manage product catalogs, SKUs, pricing and multi-warehouse stock levels."
        actions={
          (user?.role === 'admin' || user?.role === 'inventory_manager') && (
            <button className="btn-primary" onClick={() => navigate('/products/new')}>
              + Add Product
            </button>
          )
        }
      />

      <div style={{ marginBottom: '20px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or SKU..." />
      </div>

      {loading ? <Loading text="Loading products..." /> : (
        <DataTable
          columns={columns}
          data={products}
          onRowClick={(row) => navigate(`/products/${row._id}`)}
        />
      )}
    </div>
  );
};
