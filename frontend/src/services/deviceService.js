import api from './api';

export const deviceService = {
  getDevices: async (params = {}) => {
    const response = await api.get('/devices', { params });
    return response.data;
  },

  getDeviceStats: async () => {
    const response = await api.get('/devices/stats');
    return response.data;
  },

  getDeviceById: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data;
  },

  createDevice: async (deviceData) => {
    const response = await api.post('/devices', deviceData);
    return response.data;
  },

  updateDevice: async (deviceId, deviceData) => {
    const response = await api.put(`/devices/${deviceId}`, deviceData);
    return response.data;
  },

  deleteDevice: async (deviceId) => {
    const response = await api.delete(`/devices/${deviceId}`);
    return response.data;
  },

  pingHeartbeat: async (deviceId, status) => {
    const response = await api.post(`/devices/${deviceId}/heartbeat`, null, {
      params: { status },
    });
    return response.data;
  },
};
