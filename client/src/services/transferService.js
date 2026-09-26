import api from './api';

export const transferService = {
  getTransfers: async () => {
    const { data } = await api.get('/transfers');
    return data;
  },
  getTransferById: async (id) => {
    const { data } = await api.get(`/transfers/${id}`);
    return data;
  },
  createTransfer: async (transferData) => {
    const { data } = await api.post('/transfers', transferData);
    return data;
  },
  validateTransfer: async (id) => {
    const { data } = await api.post(`/transfers/${id}/validate`);
    return data;
  },
};
