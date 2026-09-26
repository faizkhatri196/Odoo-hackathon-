import api from './api';

export const teamService = {
  getTeamMembers: async () => {
    const { data } = await api.get('/team');
    return data;
  },

  createTeamMember: async (memberData) => {
    const { data } = await api.post('/team', memberData);
    return data;
  },

  removeTeamMember: async (id) => {
    const { data } = await api.delete(`/team/${id}`);
    return data;
  },
};

export default teamService;
