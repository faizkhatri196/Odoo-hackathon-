import api from './api';

export const dashboardService = {
  getDashboardMetrics: async (params = {}) => {
    const { data } = await api.get('/dashboard', { params });
    return data;
  },

  getSummary: async () => {
    const { data } = await api.get('/dashboard/summary');
    return data;
  },

  getLowStockItems: async () => {
    try {
      const { data } = await api.get('/dashboard/low-stock');
      return data;
    } catch {
      try {
        const { data } = await api.get('/products', { params: { lowStock: true, limit: 10 } });
        return data;
      } catch (err) {
        console.warn('Backend lowStock query fallback', err);
        return { success: false, data: [] };
      }
    }
  },

  getPendingReceipts: async () => {
    const { data } = await api.get('/dashboard/pending-receipts');
    return data;
  },

  getPendingDeliveries: async () => {
    const { data } = await api.get('/dashboard/pending-deliveries');
    return data;
  },

  getTransfers: async () => {
    const { data } = await api.get('/dashboard/transfers');
    return data;
  },

  getWarehouses: async () => {
    try {
      const { data } = await api.get('/warehouses');
      return data;
    } catch {
      // Fallback static structure if Member 3 hasn't completed warehouses API
      return {
        success: true,
        data: [
          { id: 'WH-MAIN', code: 'WH-MAIN', name: 'Main Central Warehouse' },
          { id: 'WH-NORTH', code: 'WH-NORTH', name: 'North Distribution Hub' },
          { id: 'WH-WEST', code: 'WH-WEST', name: 'West Regional Depot' },
        ],
      };
    }
  },

  getCategories: async () => {
    try {
      const { data } = await api.get('/products/categories');
      return data;
    } catch {
      // Fallback static categories if Member 3 API pending
      return {
        success: true,
        data: [
          { name: 'Raw Materials' },
          { name: 'Finished Goods' },
          { name: 'Electronics & Components' },
          { name: 'Packaging & Supplies' },
          { name: 'Hardware & Tools' },
        ],
      };
    }
  },
};
