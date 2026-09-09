import api from './api';

export const threatIntelService = {
  analyzeIp: async (ipAddress) => {
    const response = await api.get(`/threat-intel/ip/${encodeURIComponent(ipAddress)}`);
    return response.data;
  },

  getTopSuspiciousIps: async (limit = 10) => {
    const response = await api.get('/threat-intel/suspicious-ips', { params: { limit } });
    return response.data;
  },
};

export default threatIntelService;
