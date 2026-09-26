import api from './api';

export const dashboardService = {
  getDashboardMetrics: async () => {
    const { data } = await api.get('/dashboard');
    return data;
  },
};
