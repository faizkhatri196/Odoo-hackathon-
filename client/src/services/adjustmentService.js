import api from './api';

export const adjustmentService = {
  getAdjustments: async () => {
    const { data } = await api.get('/adjustments');
    return data;
  },
  getAdjustmentById: async (id) => {
    const { data } = await api.get(`/adjustments/${id}`);
    return data;
  },
  createAdjustment: async (adjustmentData) => {
    const { data } = await api.post('/adjustments', adjustmentData);
    return data;
  },
  applyAdjustment: async (id) => {
    const { data } = await api.post(`/adjustments/${id}/apply`);
    return data;
  },
};
