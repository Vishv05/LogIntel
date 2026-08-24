import api from './api';

export const logService = {
  searchLogs: async (params = {}) => {
    const response = await api.get('/logs', { params });
    return response.data;
  },

  getLogById: async (logId) => {
    const response = await api.get(`/logs/${logId}`);
    return response.data;
  },

  ingestLogs: async (logs) => {
    const response = await api.post('/logs/ingest', logs);
    return response.data;
  },

  ingestSyslog: async (rawSyslogText) => {
    const response = await api.post('/logs/ingest/syslog', rawSyslogText, {
      headers: { 'Content-Type': 'text/plain' },
    });
    return response.data;
  },
};
