import api from './api';

export const analyticsService = {
  getSummary: async () => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },

  getOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  getTimeline: async () => {
    const response = await api.get('/analytics/timeline');
    return response.data;
  },

  getSources: async () => {
    const response = await api.get('/analytics/sources');
    return response.data;
  },

  getSeverity: async () => {
    const response = await api.get('/analytics/severity');
    return response.data;
  },

  getTopIps: async () => {
    const response = await api.get('/analytics/top-ips');
    return response.data;
  },

  getTopEvents: async () => {
    const response = await api.get('/analytics/top-events');
    return response.data;
  },

  getTopPorts: async () => {
    const response = await api.get('/analytics/top-ports');
    return response.data;
  },
};
