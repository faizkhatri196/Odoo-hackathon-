import api from './api';

export const receiptService = {
  getReceipts: async () => {
    const { data } = await api.get('/receipts');
    return data;
  },
  getReceiptById: async (id) => {
    const { data } = await api.get(`/receipts/${id}`);
    return data;
  },
  createReceipt: async (receiptData) => {
    const { data } = await api.post('/receipts', receiptData);
    return data;
  },
  validateReceipt: async (id) => {
    const { data } = await api.post(`/receipts/${id}/validate`);
    return data;
  },
};
