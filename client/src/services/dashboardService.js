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
        console.warn('Backend lowStock query error', err);
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
    } catch (err) {
      console.warn('Failed to fetch warehouses from backend', err);
      return { success: false, data: [] };
    }
  },

  getCategories: async () => {
    try {
      const { data } = await api.get('/categories');
      return data;
    } catch {
      try {
        const { data } = await api.get('/products/categories');
        return data;
      } catch (err) {
        console.warn('Failed to fetch categories from backend', err);
        return { success: false, data: [] };
      }
    }
  },
};
