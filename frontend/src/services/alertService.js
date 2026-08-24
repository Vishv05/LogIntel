import api from './api';

export const alertService = {
  getAlerts: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  getAlertStats: async () => {
    const response = await api.get('/alerts/stats');
    return response.data;
  },

  getAlertById: async (alertId) => {
    const response = await api.get(`/alerts/${alertId}`);
    return response.data;
  },

  acknowledgeAlert: async (alertId, notes = '') => {
    const response = await api.patch(`/alerts/${alertId}/acknowledge`, { notes });
    return response.data;
  },

  resolveAlert: async (alertId, notes = '') => {
    const response = await api.patch(`/alerts/${alertId}/resolve`, { notes });
    return response.data;
  },

  getRelatedLogs: async (alertId) => {
    const response = await api.get(`/alerts/${alertId}/related-logs`);
    return response.data;
  },
};
