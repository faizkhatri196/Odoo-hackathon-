import api from './api';

export const authService = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  signup: async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    return data;
  },
  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  logout: async () => {
    try {
      const { data } = await api.post('/auth/logout');
      return data;
    } catch {
      return { success: true };
    }
  },
  resetPassword: async ({ email, otp, newPassword }) => {
    const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

