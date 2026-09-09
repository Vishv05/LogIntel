import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Globe,
  Radio,
  RefreshCw,
  Cpu,
  Layers,
  ArrowUpRight,
  Flame,
  AlertTriangle,
  Lock,
  ExternalLink,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { analyticsService } from '../services/analyticsService';
import { incidentService } from '../services/incidentService';

const PIE_COLORS = ['#22D3EE', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const SEVERITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6',
  info: '#10B981',
};

export const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [incidentStats, setIncidentStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [sumData, incData] = await Promise.all([
        analyticsService.getSummary(),
        incidentService.getIncidentStats(),
      ]);
      setSummary(sumData);
      setIncidentStats(incData);
    } catch (e) {
      console.error('Failed to load analytics summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const overview = summary?.overview || {
    total_logs: 0,
    critical_events: 0,
    active_devices: 0,
    open_alerts: 0,
    total_incidents: 0,
    open_incidents: 0,
    failed_logins: 0,
    blocked_connections: 0,
  };

  const topIps = summary?.top_ips || [];
  const topEvents = summary?.top_events || [];
  const topPorts = summary?.top_ports || [];
  const timeline = summary?.timeline || [];
  const severities = summary?.severities || [];
  const sources = summary?.sources || [];

  return (
    <Layout title="Deep SOC Analytics & Infrastructure Telemetry" onRefresh={fetchAnalytics}>
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Processed Telemetry"
          value={overview.total_logs.toLocaleString()}
          subtitle="Normalized & Indexed"
          icon={Layers}
          color="cyan"
          trend="Continuous Stream"
        />
        <StatCard
          title="Authentication Failures"
          value={overview.failed_logins.toLocaleString()}
          subtitle="Credential Guessing / Spray"
          icon={Lock}
          color="red"
          trend="Auth Service Monitored"
        />
        <StatCard
          title="Blocked / Dropped Packets"
          value={overview.blocked_connections.toLocaleString()}
          subtitle="Firewall Perimeter Drops"
          icon={ShieldAlert}
          color="amber"
          trend="ACL Enforcement Active"
        />
        <StatCard
          title="Correlated Incidents"
          value={(incidentStats?.total_incidents || overview.total_incidents || 0).toString()}
          subtitle={`${incidentStats?.open_incidents || overview.open_incidents || 0} Awaiting Triage`}
          icon={Flame}
          color="red"
          trend="Multi-Stage Attack Sets"
        />
      </div>

      {/* Top Velocity Waveform Area Chart */}
      <div className="cyber-card p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              24-Hour Ingestion Velocity & Severity Waveform
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Dynamic OpenSearch Time Series Aggregations & Threat Waveforms
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="anCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickFormatter={(v) => v?.substring(11, 16) || v} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1220',
                  borderColor: '#1E2D4A',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Area type="monotone" dataKey="count" name="Total Events" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#anCount)" />
              <Area type="monotone" dataKey="high" name="High/Crit Events" stroke="#EF4444" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Severity Distribution & Source Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Severity Distribution */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Telemetry Severity Breakdown
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Threat Weighting</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severities} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="severity" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
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
                  {severities.map((entry, index) => (
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

        {/* Ingestion Source Breakdown */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Infrastructure Source Distribution
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">{sources.length} Ingest Channels</span>
          </div>

          <div className="space-y-3 pt-2">
            {sources.map((src, idx) => (
              <div key={src.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold uppercase">{src.source}</span>
                  <span className="text-cyan-400 font-bold">
                    {src.percentage}% ({src.count.toLocaleString()} logs)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(src.percentage, 100)}%`,
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Top Attacking Source IPs & Targeted Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Top Source IPs with 1-Click Jump to Threat Intel */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Top Attacking / Active Source IPs
              </h3>
            </div>
            <Link to="/threat-intel" className="text-xs text-cyan-400 hover:underline">
              Investigate in Threat Intel &rarr;
            </Link>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topIps} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#64748B" fontSize={10} />
                <YAxis dataKey="ip" type="category" stroke="#64748B" fontSize={10} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1220',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" name="Total Logs" fill="#22D3EE" radius={[0, 4, 4, 0]} />
                <Bar dataKey="blocked_count" name="Blocked" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Targeted Destination Ports */}
        <div className="cyber-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Targeted Destination Network Ports
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">Port Reconnaissance</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPorts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="port" stroke="#64748B" fontSize={10} tickFormatter={(p) => `P:${p}`} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1220',
                    borderColor: '#1E2D4A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" name="Traffic Volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: High-Frequency Event Signatures Table */}
      <div className="cyber-card p-5 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            High-Frequency Telemetry Signatures
          </h3>
          <span className="text-[10px] text-slate-400">Normalized Action Ranking</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-2.5">Event Signature</th>
                <th className="p-2.5">Severity</th>
                <th className="p-2.5 text-right">Occurrences</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topEvents.map((ev, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 text-slate-200 font-semibold">{ev.event_type}</td>
                  <td className="p-2.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        ev.severity?.toLowerCase() === 'critical'
                          ? 'bg-red-950 text-red-400 border-red-700/50'
                          : ev.severity?.toLowerCase() === 'high'
                          ? 'bg-orange-950 text-orange-400 border-orange-700/50'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {ev.severity || 'INFO'}
                    </span>
                  </td>
                  <td className="p-2.5 text-right text-cyan-400 font-bold">
                    {ev.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
