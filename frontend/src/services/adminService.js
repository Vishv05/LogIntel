import api from './api';

export const adminService = {
  // User Management
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Detection Rules Management
  getRules: async () => {
    const response = await api.get('/rules');
    return response.data;
  },

  getRuleById: async (ruleId) => {
    const response = await api.get(`/rules/${ruleId}`);
    return response.data;
  },

  createRule: async (ruleData) => {
    const response = await api.post('/rules', ruleData);
    return response.data;
  },

  updateRule: async (ruleId, ruleData) => {
    const response = await api.put(`/rules/${ruleId}`, ruleData);
    return response.data;
  },

  toggleRule: async (ruleId) => {
    const response = await api.patch(`/rules/${ruleId}/toggle`);
    return response.data;
  },

  deleteRule: async (ruleId) => {
    const response = await api.delete(`/rules/${ruleId}`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },
};
