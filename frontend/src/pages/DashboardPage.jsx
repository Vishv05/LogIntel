import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Server,
  Activity,
  Layers,
  Flame,
  AlertTriangle,
  Radio,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LogDetailModal } from '../components/LogDetailModal';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { analyticsService } from '../services/analyticsService';
import { alertService } from '../services/alertService';
import { deviceService } from '../services/deviceService';
import { logService } from '../services/logService';

const PIE_COLORS = ['#22D3EE', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [sumData, alertsData, devData, logsData] = await Promise.all([
        analyticsService.getSummary(),
        alertService.getAlerts({ limit: 5 }),
        deviceService.getDevices({ limit: 6 }),
        logService.searchLogs({ page_size: 6 }),
      ]);
      setSummary(sumData);
      setAlerts(alertsData);
      setDevices(devData);
      setRecentLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 10 seconds for real-time monitoring
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const overview = summary?.overview || {
    total_logs: 0,
    critical_events: 0,
    active_devices: 0,
    open_alerts: 0,
    events_last_hour: 0,
    failed_logins: 0,
    blocked_connections: 0,
  };

  const timelineData = summary?.timeline || [];
  const sourceData = summary?.sources || [];
  const severityData = summary?.severities || [];

  return (
    <Layout title="SOC Operations Command Center" onRefresh={fetchDashboardData}>
      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ingested Logs"
          value={overview.total_logs.toLocaleString()}
          subtitle="OpenSearch Centrally Indexed"
          icon={Layers}
          color="cyan"
          trend="+Dynamic"
        />
        <StatCard
          title="Critical Threats"
          value={overview.critical_events.toLocaleString()}
          subtitle="Physical & Network Anomalies"
          icon={Flame}
          color="red"
          trend={`${overview.failed_logins} failed auth`}
        />
        <StatCard
          title="Monitored Devices"
          value={`${overview.active_devices} / ${overview.total_devices || devices.length}`}
          subtitle="AWS, Firewalls, CCTV, Routers"
          icon={Server}
          color="green"
          trend="Healthy"
        />
        <StatCard
          title="Open Security Alerts"
          value={overview.open_alerts.toLocaleString()}
          subtitle="Triage & Remediation Required"
          icon={ShieldAlert}
          color="amber"
          trend="Rule-Based"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Timeline Area Chart */}
        <div className="cyber-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Event Ingestion Velocity & Anomaly Trends
              </h3>
              <p className="text-xs text-slate-400">Past 24 Hours Log Stream Frequency</p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              <Radio className="w-3 h-3 animate-pulse" /> LIVE STREAM
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickFormatter={(v) => v.substring(11, 16) || v} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17243A', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#22D3EE' }}
                />
                <Area type="monotone" dataKey="count" name="Total Events" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                <Area type="monotone" dataKey="critical" name="Critical Events" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCrit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Distribution Doughnut Chart */}
        <div className="cyber-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Logs by Source
            </h3>
            <p className="text-xs text-slate-400">Heterogeneous Infrastructure Breakdown</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="source"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#17243A" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#17243A', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Monitored Devices & Severity Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Status Matrix */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                Infrastructure Nodes
              </h3>
              <p className="text-xs text-slate-400">Source Heartbeat & Availability</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">{devices.length} Monitored</span>
          </div>

          <div className="space-y-2.5">
            {devices.slice(0, 5).map((device) => (
              <div
                key={device.device_id}
                className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center justify-between hover:border-cyan-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-800 text-slate-300">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold font-mono text-slate-200">{device.device_id}</p>
                    <p className="text-[10px] text-slate-400 truncate">{device.device_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{device.ip_address}</span>
                  <StatusBadge status={device.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Severity Distribution Bar Chart */}
        <div className="cyber-card p-5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Log Volume by Severity Classification
            </h3>
            <p className="text-xs text-slate-400">Normalized Threat and Health Levels</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="severity" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#17243A', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Event Count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: Recent Alerts & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Alerts */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                <span>Recent Threat Detections</span>
              </h3>
              <p className="text-xs text-slate-400">Correlated Rule Alerts</p>
            </div>
            <a href="/alerts" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-slate-500 bg-[#0F172A] rounded-lg">
                No active threat alerts triggered yet.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => setSelectedAlert(alert)}
                  className="p-3.5 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs font-mono font-bold text-slate-200">{alert.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{alert.description}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    <StatusBadge status={alert.status} />
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Stream of Recent Ingested Logs */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Live Ingestion Stream</span>
              </h3>
              <p className="text-xs text-slate-400">Incoming Normalized Logs</p>
            </div>
            <a href="/logs" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
              Explore All <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-2">
            {recentLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                onClick={() => setSelectedLog(log)}
                className="p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-cyan-500/30 cursor-pointer transition-all flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <SeverityBadge severity={log.severity} />
                  <span className="text-[10px] text-cyan-400 uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-950/40">
                    {log.source_type}
                  </span>
                  <span className="text-slate-200 truncate text-[11px]">{log.message}</span>
                </div>
                <span className="text-slate-400 text-[10px] flex-shrink-0 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onStatusUpdated={fetchDashboardData}
      />
    </Layout>
  );
};
