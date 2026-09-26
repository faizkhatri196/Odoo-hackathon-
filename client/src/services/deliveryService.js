import api from './api';

export const deliveryService = {
  getDeliveries: async () => {
    const { data } = await api.get('/deliveries');
    return data;
  },
  getDeliveryById: async (id) => {
    const { data } = await api.get(`/deliveries/${id}`);
    return data;
  },
  createDelivery: async (deliveryData) => {
    const { data } = await api.post('/deliveries', deliveryData);
    return data;
  },
  updateDelivery: async (id, deliveryData) => {
    const { data } = await api.put(`/deliveries/${id}`, deliveryData);
    return data;
  },
  validateDelivery: async (id) => {
    const { data } = await api.post(`/deliveries/${id}/validate`);
    return data;
  },
};
