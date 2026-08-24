import React, { useState, useEffect } from 'react';
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
import { analyticsService } from '../services/analyticsService';

const COLORS = ['#22D3EE', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getSummary();
      setSummary(data);
    } catch (e) {
      console.error('Failed to load analytics summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const topIps = summary?.top_ips || [];
  const topEvents = summary?.top_events || [];
  const topPorts = summary?.top_ports || [];
  const timeline = summary?.timeline || [];
  const severities = summary?.severities || [];
  const sources = summary?.sources || [];

  return (
    <Layout title="Deep Security Analytics & Threat Intelligence" onRefresh={fetchAnalytics}>
      {/* Top Velocity Area Chart */}
      <div className="cyber-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              24-Hour Ingestion Velocity & Severity Waveform
            </h3>
            <p className="text-xs text-slate-400">Dynamic OpenSearch Time Series Aggregations</p>
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
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="anCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickFormatter={(v) => v.substring(11, 16) || v} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#17243A', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="count" name="Total Events" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#anCount)" />
              <Area type="monotone" dataKey="high" name="High/Crit Events" stroke="#EF4444" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row: Top Attacking Source IPs & Top Targeted Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Source IPs */}
        <div className="cyber-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Top Source / Attacking IP Addresses</span>
            </h3>
            <p className="text-xs text-slate-400">Volume and Threat Correlation</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topIps} layout="vertical">
                <XAxis type="number" stroke="#64748B" fontSize={10} />
                <YAxis dataKey="ip" type="category" stroke="#64748B" fontSize={10} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#17243A', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" name="Total Events" fill="#22D3EE" radius={[0, 4, 4, 0]} />
                <Bar dataKey="blocked_count" name="Blocked" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Targeted Destination Ports */}
        <div className="cyber-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Targeted Destination Ports</span>
            </h3>
            <p className="text-xs text-slate-400">Services under Reconnaissance or Connection Traffic</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPorts}>
                <XAxis dataKey="port" stroke="#64748B" fontSize={10} tickFormatter={(p) => `Port ${p}`} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#17243A', borderColor: '#1E2D4A', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" name="Traffic Count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Third Row: Top Event Types Frequency Table & Sources Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Event Types Table */}
        <div className="cyber-card p-5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              High-Frequency Event Signatures
            </h3>
            <p className="text-xs text-slate-400">Normalized Infrastructure Action Ranking</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
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
                      <span className="text-[10px] text-slate-300">{ev.severity}</span>
                    </td>
                    <td className="p-2.5 text-right text-cyan-400 font-bold">{ev.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source Distribution Doughnut */}
        <div className="cyber-card p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Source Composition
            </h3>
            <p className="text-xs text-slate-400">Telemetry Ingest Proportion</p>
          </div>

          <div className="space-y-3">
            {sources.map((src, idx) => (
              <div key={src.source} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">{src.source}</span>
                  <span className="text-cyan-400">{src.percentage}% ({src.count})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{ width: `${Math.min(src.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};
