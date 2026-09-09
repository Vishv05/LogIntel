import api from './api';

export const adminService = {
  // Platform Overview
  getOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  // Topology Manager
  getTopology: async () => {
    const response = await api.get('/admin/topology');
    return response.data;
  },

  // Log Source Health & Ingestion Coverage
  getSourceHealth: async () => {
    const response = await api.get('/admin/sources/health');
    return response.data;
  },

  // Detection Rule Performance & Effectiveness
  getRulePerformance: async () => {
    const response = await api.get('/admin/rules/performance');
    return response.data;
  },

  // Alert Policies
  getAlertPolicies: async () => {
    const response = await api.get('/admin/alert-policies');
    return response.data;
  },

  updateAlertPolicies: async (policies) => {
    const response = await api.put('/admin/alert-policies', { policies });
    return response.data;
  },

  // System Health Center
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  // Privileged Access Monitoring
  getPrivilegedAudit: async (params = {}) => {
    const response = await api.get('/admin/audit/privileged', { params });
    return response.data;
  },

  // Storage & Retention Management
  getStorageRetention: async () => {
    const response = await api.get('/admin/storage/retention');
    return response.data;
  },

  updateStorageRetention: async (settings) => {
    const response = await api.put('/admin/storage/retention', { settings });
    return response.data;
  },

  // Log Simulator Control Center
  runSimulator: async (simData) => {
    const response = await api.post('/admin/simulator/generate', simData);
    return response.data;
  },

  // Enterprise Security Settings
  getSecuritySettings: async () => {
    const response = await api.get('/admin/security/settings');
    return response.data;
  },

  updateSecuritySettings: async (settings) => {
    const response = await api.put('/admin/security/settings', { settings });
    return response.data;
  },

  // Third-Party Integrations
  getIntegrations: async () => {
    const response = await api.get('/admin/integrations');
    return response.data;
  },

  updateIntegrations: async (integrations) => {
    const response = await api.put('/admin/integrations', { integrations });
    return response.data;
  },

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

export default adminService;
