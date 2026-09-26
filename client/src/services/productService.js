import api from './api';

export const productService = {
  getProducts: async (params) => {
    const { data } = await api.get('/products', { params });
    return data;
  },
  getProductById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },
  createProduct: async (productData) => {
    const { data } = await api.post('/products', productData);
    return data;
  },
  updateProduct: async (id, productData) => {
    const { data } = await api.put(`/products/${id}`, productData);
    return data;
  },
  deleteProduct: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },
};
