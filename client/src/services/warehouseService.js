import api from './api';

export const warehouseService = {
  getWarehouses: async (params) => {
    const { data } = await api.get('/warehouses', { params });
    return data;
  },
  getWarehouseById: async (id) => {
    const { data } = await api.get(`/warehouses/${id}`);
    return data;
  },
  createWarehouse: async (warehouseData) => {
    const { data } = await api.post('/warehouses', warehouseData);
    return data;
  },
  updateWarehouse: async (id, warehouseData) => {
    const { data } = await api.put(`/warehouses/${id}`, warehouseData);
    return data;
  },
  deleteWarehouse: async (id) => {
    const { data } = await api.delete(`/warehouses/${id}`);
    return data;
  },
};

export default warehouseService;
