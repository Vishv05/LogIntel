import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Shield,
  Server,
  Activity,
  Layers,
  Flame,
  AlertTriangle,
  Radio,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Globe,
  BarChart3,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { LogDetailModal } from '../components/LogDetailModal';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { analyticsService } from '../services/analyticsService';
import { alertService } from '../services/alertService';
import { incidentService } from '../services/incidentService';
import { deviceService } from '../services/deviceService';
import { logService } from '../services/logService';
import { threatIntelService } from '../services/threatIntelService';
import { useAuth } from '../hooks/useAuth';

const PIE_COLORS = ['#22D3EE', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
const SEVERITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6',
  info: '#10B981',
};

export const UserDashboard = ({ onSwitchView }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentStats, setIncidentStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [topSuspiciousIps, setTopSuspiciousIps] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [triagingId, setTriagingId] = useState(null);

  const fetchUserDashboardData = async () => {
    try {
      const [sumData, alertsData, incData, incStats, devData, logsData, suspData] = await Promise.all([
        analyticsService.getSummary(),
        alertService.getAlerts({ limit: 6 }),
        incidentService.getIncidents({ limit: 4 }),
        incidentService.getIncidentStats(),
        deviceService.getDevices({ limit: 8 }),
        logService.searchLogs({ page_size: 6 }),
        threatIntelService.getTopSuspiciousIps(5),
      ]);
      setSummary(sumData);
      setAlerts(alertsData || []);
      setIncidents(incData || []);
      setIncidentStats(incStats);
      setDevices(devData || []);
      setRecentLogs(logsData.logs || []);
      setTopSuspiciousIps(suspData || []);
    } catch (err) {
      console.error('Failed to load user dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDashboardData();
    const interval = setInterval(fetchUserDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickTriage = async (alertId, newStatus) => {
    setTriagingId(alertId);
    try {
      await alertService.updateAlertStatus(alertId, newStatus, `Triaged from User Dashboard by ${user?.username}`);
      await fetchUserDashboardData();
    } catch (e) {
      alert('Triage update failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setTriagingId(null);
    }
  };

  const overview = summary?.overview || {
    total_logs: 0,
    critical_events: 0,
    active_devices: 0,
    open_alerts: 0,
    total_incidents: 0,
    open_incidents: 0,
    events_last_hour: 0,
    failed_logins: 0,
    blocked_connections: 0,
  };

  const timelineData = summary?.timeline || [];
  const sourceData = summary?.sources || [];
  const severityData = summary?.severities || [];
  const topEventsData = (summary?.top_events || []).slice(0, 6);

  // Device status aggregation
  const onlineDevicesCount = devices.filter((d) => d.status === 'online').length;
  const warningDevicesCount = devices.filter((d) => d.status === 'warning').length;
  const offlineDevicesCount = devices.filter((d) => d.status === 'offline').length;

  return (
    <Layout title="SOC Threat Monitoring & Live Telemetry" onRefresh={fetchUserDashboardData}>
      {/* Admin Authority Return Banner (Visible when Admin inspects User Dashboard) */}
      {isAdmin && isAdmin() && (
        <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-lg shadow-cyan-500/10 mb-4">
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
              <Shield className="w-4 h-4" />
            </span>
            <span>
              <strong className="text-cyan-200">Administrator Authority Mode:</strong> You are inspecting the User / SOC Analyst Operations Dashboard.
            </span>
          </div>
          {onSwitchView && (
            <button
              onClick={onSwitchView}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 shadow-md shadow-cyan-500/20"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Return to Admin Command Center &rarr;</span>
            </button>
          )}
        </div>
      )}

      {/* Top SOC Analyst Operations Banner */}
      <div className="p-5 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-[#121E33] to-[#0B1220] shadow-xl space-y-3 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                <Activity className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                Security Operations Center (SOC) Console
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-sans">
              Centralized Threat Intelligence & Live Incident Triage
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Logged in as <strong className="text-blue-300 font-semibold">{user?.email || user?.username}</strong> • Monitoring & Triage Active
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              to="/incidents"
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/20"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Correlated Incidents</span>
            </Link>
            <Link
              to="/logs"
              className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Log Explorer</span>
            </Link>
            <Link
              to="/threat-intel"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Threat Intel</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5-KPI High-Level Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Ingested Logs"
          value={overview.total_logs.toLocaleString()}
          subtitle="OpenSearch Normalized"
          icon={Layers}
          color="cyan"
          trend="+Live Stream"
        />
        <StatCard
          title="Critical Events"
          value={overview.critical_events.toLocaleString()}
          subtitle="High-Severity Signals"
          icon={Flame}
          color="red"
          trend={`${overview.failed_logins} auth failures`}
        />
        <StatCard
          title="Security Incidents"
          value={(incidentStats?.total_incidents || overview.total_incidents || incidents.length).toString()}
          subtitle={`${incidentStats?.open_incidents || overview.open_incidents || 0} Open Incidents`}
          icon={ShieldAlert}
          color="red"
          trend="Correlated Attack Sets"
        />
        <StatCard
          title="Open Alerts"
          value={overview.open_alerts.toLocaleString()}
          subtitle="Awaiting Triage"
          icon={AlertTriangle}
          color="amber"
          trend="Action Required"
        />
        <StatCard
          title="Monitored Assets"
          value={`${overview.active_devices} / ${overview.total_devices || devices.length}`}
          subtitle="Firewalls, AWS, CCTV, Switch"
          icon={Server}
          color="green"
          trend="Infrastructure Active"
        />
      </div>

      {/* Correlated Security Incidents Queue (Priority 1) */}
      <div className="cyber-card p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              High-Risk Correlated Security Incidents
            </h3>
          </div>
          <Link
            to="/incidents"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All Incidents &rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loading && incidents.length === 0 ? (
            <div className="p-6 text-center text-slate-500 col-span-2">Loading correlated incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="p-6 text-center text-slate-500 col-span-2">
              No active correlated incidents. All systems normal.
            </div>
          ) : (
            incidents.slice(0, 4).map((inc) => (
              <div
                key={inc.incident_id}
                onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RiskScoreBadge score={inc.risk_score} level={inc.risk_level} />
                      <SeverityBadge severity={inc.severity} />
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>

                  <h4 className="font-bold text-slate-200 text-xs font-sans hover:text-cyan-400 transition-colors">
                    {inc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2">{inc.summary}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Host: <strong className="text-orange-400">{inc.source_ip || 'Internal'}</strong></span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <span>Investigate &rarr;</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Row 2: Charts (24h Volume AreaChart & Source Distribution Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* 24-Hour Volume AreaChart (2 Cols) */}
        <div className="lg:col-span-2 cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                24-Hour Telemetry Volume & Traffic Spikes
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Live Polling</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="userColorLogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1220',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#userColorLogs)" name="Logs" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ingestion Source Breakdown (1 Col) */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Source Distribution
            </h3>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1220',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800 pt-3">
            {sourceData.slice(0, 6).map((src, i) => (
              <div key={src.source} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-400 truncate uppercase">{src.source}:</span>
                <span className="text-slate-200 font-bold">{src.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Severity Distribution & Top Suspicious IPs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Severity Breakdown Bar Chart */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Severity Distribution
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Threat Weighting</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="severity" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1220',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell
                      key={`sev-${index}`}
                      fill={SEVERITY_COLORS[entry.severity?.toLowerCase()] || '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Suspicious IP Rankings Preview */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Top Suspicious IP Rankings
              </h3>
            </div>
            <Link to="/threat-intel" className="text-xs text-cyan-400 hover:underline">
              Analyze Any IP &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {topSuspiciousIps.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No suspicious IPs recorded yet.</div>
            ) : (
              topSuspiciousIps.slice(0, 4).map((ipObj) => (
                <div
                  key={ipObj.ip}
                  onClick={() => navigate(`/threat-intel?ip=${ipObj.ip}`)}
                  className="p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{ipObj.ip}</span>
                    <span className="text-[10px] text-slate-500">({ipObj.country || 'WAN'})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-red-400 font-bold">{ipObj.blocked_events} drops</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        ipObj.threat_score >= 80
                          ? 'bg-red-950 text-red-400 border-red-500/50'
                          : 'bg-amber-950 text-amber-400 border-amber-500/50'
                      }`}
                    >
                      {ipObj.threat_score} / 100
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Device Health & Monitored Status */}
      <div className="cyber-card p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Monitored Infrastructure Health & Device Status
            </h3>
          </div>
          <Link to="/devices" className="text-xs text-cyan-400 hover:underline">
            Manage All Devices &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {devices.slice(0, 4).map((dev) => (
            <div
              key={dev.device_id}
              className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 truncate">{dev.device_id}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    dev.status === 'online'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      : dev.status === 'warning'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      : 'bg-red-950 text-red-400 border border-red-800/60'
                  }`}
                >
                  {dev.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">{dev.device_name}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                <span>{dev.device_type}</span>
                <span>{dev.ip_address}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: Recent Alerts Queue */}
      <div className="cyber-card p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Active Security Alerts Triage Queue
            </h3>
          </div>
          <Link to="/alerts" className="text-xs text-cyan-400 hover:text-cyan-300">
            View All Alerts &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">Severity</th>
                <th className="pb-2.5">Alert Title</th>
                <th className="pb-2.5">Source & Location</th>
                <th className="pb-2.5">Triggered At</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Quick Triage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {alerts.slice(0, 5).map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="font-bold text-slate-200 hover:text-cyan-400 text-left transition-colors font-sans"
                    >
                      {alert.title}
                    </button>
                    <p className="text-[10px] text-slate-400 truncate max-w-sm font-sans">{alert.description}</p>
                  </td>
                  <td className="py-3 text-slate-300">
                    <span className="text-cyan-400">{alert.source_ip || 'Internal'}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{alert.source_type}</span>
                  </td>
                  <td className="py-3 text-slate-400 text-[11px]">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={alert.status} />
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {alert.status === 'OPEN' && (
                        <button
                          onClick={() => handleQuickTriage(alert.id, 'ACKNOWLEDGED')}
                          disabled={triagingId === alert.id}
                          className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleQuickTriage(alert.id, 'RESOLVED')}
                          disabled={triagingId === alert.id}
                          className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      {alert.status === 'RESOLVED' && (
                        <span className="text-[10px] text-slate-500 font-mono">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modals */}
      {selectedAlert && <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} onStatusUpdated={fetchUserDashboardData} />}
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </Layout>
  );
};

export default UserDashboard;
