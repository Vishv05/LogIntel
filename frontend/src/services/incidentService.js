import api from './api';

export const incidentService = {
  getIncidents: async (params = {}) => {
    const response = await api.get('/incidents', { params });
    return response.data;
  },

  getIncidentStats: async () => {
    const response = await api.get('/incidents/stats');
    return response.data;
  },

  getIncidentById: async (incidentId) => {
    const response = await api.get(`/incidents/${incidentId}`);
    return response.data;
  },

  triggerCorrelation: async () => {
    const response = await api.post('/incidents/correlate');
    return response.data;
  },

  acknowledgeIncident: async (incidentId, notes = '') => {
    const response = await api.patch(`/incidents/${incidentId}/acknowledge`, { notes });
    return response.data;
  },

  addIncidentNote: async (incidentId, note) => {
    const response = await api.post(`/incidents/${incidentId}/notes`, { note });
    return response.data;
  },

  resolveIncident: async (incidentId, notes = '') => {
    const response = await api.patch(`/incidents/${incidentId}/resolve`, { notes });
    return response.data;
  },

  getIncidentTimeline: async (incidentId) => {
    const response = await api.get(`/incidents/${incidentId}/timeline`);
    return response.data;
  },

  getIncidentAIExplanation: async (incidentId) => {
    const response = await api.get(`/incidents/${incidentId}/explain`);
    return response.data;
  },
};

export default incidentService;
