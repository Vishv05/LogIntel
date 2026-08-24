import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  Edit2,
  Trash2,
  Activity,
  Radio,
  CheckCircle2,
  X,
  RefreshCw,
  Cpu,
  Video,
  Shield,
  Cloud,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { deviceService } from '../services/deviceService';
import { useAuth } from '../hooks/useAuth';

export const DevicesPage = () => {
  const { isAdmin } = useAuth();
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({ total_devices: 0, online_count: 0, offline_count: 0, warning_count: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formValues, setFormValues] = useState({
    device_id: '',
    device_name: '',
    device_type: 'SERVER',
    ip_address: '',
    location: 'Primary Datacenter',
    status: 'online',
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const [devData, statsData] = await Promise.all([
        deviceService.getDevices({
          device_type: typeFilter || undefined,
          status: statusFilter || undefined,
        }),
        deviceService.getDeviceStats(),
      ]);
      setDevices(devData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load devices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [typeFilter, statusFilter]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await deviceService.updateDevice(editingDevice.device_id, formValues);
      } else {
        await deviceService.createDevice(formValues);
      }
      setShowAddModal(false);
      setEditingDevice(null);
      setFormValues({ device_id: '', device_name: '', device_type: 'SERVER', ip_address: '', location: 'Primary Datacenter', status: 'online' });
      fetchDevices();
    } catch (e) {
      alert('Operation failed: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDelete = async (deviceId) => {
    if (window.confirm(`Are you sure you want to remove device '${deviceId}'?`)) {
      try {
        await deviceService.deleteDevice(deviceId);
        fetchDevices();
      } catch (e) {
        alert('Delete failed: ' + (e.response?.data?.detail || e.message));
      }
    }
  };

  const openEditModal = (dev) => {
    setEditingDevice(dev);
    setFormValues({
      device_id: dev.device_id,
      device_name: dev.device_name,
      device_type: dev.device_type,
      ip_address: dev.ip_address,
      location: dev.location,
      status: dev.status,
    });
    setShowAddModal(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'AWS': return <Cloud className="w-5 h-5 text-cyan-400" />;
      case 'FIREWALL': return <Shield className="w-5 h-5 text-orange-400" />;
      case 'CCTV': return <Video className="w-5 h-5 text-emerald-400" />;
      case 'SWITCH':
      case 'ROUTER': return <Cpu className="w-5 h-5 text-blue-400" />;
      default: return <Server className="w-5 h-5 text-slate-300" />;
    }
  };

  return (
    <Layout title="Infrastructure & Log Source Management" onRefresh={fetchDevices}>
      {/* Device Health Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="cyber-card p-4">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Registered Sources</span>
          <h3 className="text-xl font-bold font-mono text-slate-100 mt-1">{stats.total_devices}</h3>
        </div>
        <div className="cyber-card p-4">
          <span className="text-[10px] text-emerald-400 uppercase font-mono block">Online & Healthy</span>
          <h3 className="text-xl font-bold font-mono text-emerald-400 mt-1">{stats.online_count}</h3>
        </div>
        <div className="cyber-card p-4">
          <span className="text-[10px] text-amber-400 uppercase font-mono block">Warning State</span>
          <h3 className="text-xl font-bold font-mono text-amber-400 mt-1">{stats.warning_count}</h3>
        </div>
        <div className="cyber-card p-4">
          <span className="text-[10px] text-red-400 uppercase font-mono block">Offline / Disconnected</span>
          <h3 className="text-xl font-bold font-mono text-red-400 mt-1">{stats.offline_count}</h3>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Source Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="cyber-input py-1 text-xs font-mono"
            >
              <option value="">All Types</option>
              <option value="AWS">AWS</option>
              <option value="FIREWALL">FIREWALL</option>
              <option value="ROUTER">ROUTER</option>
              <option value="SWITCH">SWITCH</option>
              <option value="CCTV">CCTV</option>
              <option value="SERVER">SERVER</option>
              <option value="APPLICATION">APPLICATION</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cyber-input py-1 text-xs font-mono"
            >
              <option value="">All Statuses</option>
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin() && (
            <button
              onClick={() => { setEditingDevice(null); setFormValues({ device_id: '', device_name: '', device_type: 'SERVER', ip_address: '', location: 'Primary Datacenter', status: 'online' }); setShowAddModal(true); }}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Device</span>
            </button>
          )}
          <button
            onClick={fetchDevices}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full cyber-card p-12 text-center text-slate-400 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Loading infrastructure devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="col-span-full cyber-card p-12 text-center text-slate-500 font-mono text-xs">
            No devices found matching filter criteria.
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.device_id}
              className="cyber-card p-5 space-y-4 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center justify-center">
                    {getTypeIcon(device.device_type)}
                  </div>
                  <StatusBadge status={device.status} />
                </div>

                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100">{device.device_id}</h3>
                  <p className="text-xs text-slate-300 font-medium">{device.device_name}</p>
                </div>

                <div className="p-2.5 rounded bg-[#0F172A] border border-slate-800/80 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>IP Address:</span>
                    <span className="text-cyan-400 font-semibold">{device.ip_address}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Type:</span>
                    <span className="text-slate-200">{device.device_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Location:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{device.location}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Last Seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Never'}</span>
                {isAdmin() && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(device)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                      title="Edit Device"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(device.device_id)}
                      className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                {editingDevice ? `Edit Device (${editingDevice.device_id})` : 'Register Log Source Device'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-3 text-xs font-mono">
              {!editingDevice && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">DEVICE ID</label>
                  <input
                    type="text"
                    value={formValues.device_id}
                    onChange={(e) => setFormValues({ ...formValues, device_id: e.target.value })}
                    placeholder="e.g. FW-EDGE-02"
                    className="w-full cyber-input"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">DEVICE NAME</label>
                <input
                  type="text"
                  value={formValues.device_name}
                  onChange={(e) => setFormValues({ ...formValues, device_name: e.target.value })}
                  placeholder="e.g. Edge Firewall Cluster"
                  className="w-full cyber-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">DEVICE TYPE</label>
                  <select
                    value={formValues.device_type}
                    onChange={(e) => setFormValues({ ...formValues, device_type: e.target.value })}
                    className="w-full cyber-input"
                  >
                    <option value="AWS">AWS</option>
                    <option value="FIREWALL">FIREWALL</option>
                    <option value="ROUTER">ROUTER</option>
                    <option value="SWITCH">SWITCH</option>
                    <option value="CCTV">CCTV</option>
                    <option value="SERVER">SERVER</option>
                    <option value="APPLICATION">APPLICATION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">STATUS</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                    className="w-full cyber-input"
                  >
                    <option value="online">Online</option>
                    <option value="warning">Warning</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">IP ADDRESS</label>
                <input
                  type="text"
                  value={formValues.ip_address}
                  onChange={(e) => setFormValues({ ...formValues, ip_address: e.target.value })}
                  placeholder="e.g. 192.168.1.50"
                  className="w-full cyber-input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">LOCATION / ZONE</label>
                <input
                  type="text"
                  value={formValues.location}
                  onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                  placeholder="e.g. Primary Datacenter Rack 4"
                  className="w-full cyber-input"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  {editingDevice ? 'Save Changes' : 'Register Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
