import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  Activity,
  Layers,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { incidentService } from '../services/incidentService';

export const IncidentsPage = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [correlating, setCorrelating] = useState(false);
  const [correlationMessage, setCorrelationMessage] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchIp, setSearchIp] = useState('');

  const fetchIncidentsData = async () => {
    setLoading(true);
    try {
      const [incList, statsData] = await Promise.all([
        incidentService.getIncidents({
          status: statusFilter || undefined,
          severity: severityFilter || undefined,
          source_ip: searchIp || undefined,
          limit: 100,
        }),
        incidentService.getIncidentStats(),
      ]);
      setIncidents(incList || []);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsData();
  }, [statusFilter, severityFilter, searchIp]);

  const handleRunCorrelation = async () => {
    setCorrelating(true);
    setCorrelationMessage('');
    try {
      const res = await incidentService.triggerCorrelation();
      setCorrelationMessage(res.message || 'Correlation engine pass completed.');
      await fetchIncidentsData();
    } catch (e) {
      setCorrelationMessage('Failed to trigger correlation: ' + (e.response?.data?.detail || e.message));
    } finally {
      setCorrelating(false);
      setTimeout(() => setCorrelationMessage(''), 6000);
    }
  };

  return (
    <Layout title="Security Incidents & Event Correlation Engine" onRefresh={fetchIncidentsData}>
      {/* Correlation Notification Banner */}
      {correlationMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono flex items-center justify-between shadow-lg shadow-cyan-500/10 mb-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{correlationMessage}</span>
          </div>
          <button
            onClick={() => setCorrelationMessage('')}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner with Manual Trigger */}
      <div className="p-5 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/50 via-[#151D30] to-[#0B1220] shadow-xl space-y-3 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-red-500/20 text-red-400 border border-red-500/40">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
                Multi-Event Correlation Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-sans">
              Aggregated Security Incidents & Attack Trajectories
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Autonomous synthesis of heterogeneous signals into unified security incident dossiers with dynamic 0–100 risk scoring.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={handleRunCorrelation}
              disabled={correlating}
              className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${correlating ? 'animate-spin' : ''}`} />
              <span>{correlating ? 'Evaluating Telemetry...' : 'Trigger Correlation Pass'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 font-mono">
        <div
          onClick={() => setStatusFilter('')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === '' ? 'border-cyan-500/60 bg-cyan-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase block">Total Incidents</span>
          <h3 className="text-xl font-bold text-slate-100 mt-1">{stats?.total_incidents || incidents.length}</h3>
          <span className="text-[10px] text-cyan-400 block mt-0.5">Synthesized</span>
        </div>

        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === 'OPEN' ? 'border-red-500/60 bg-red-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-red-400 uppercase block">Open / Active</span>
          <h3 className="text-xl font-bold text-red-400 mt-1">{stats?.open_incidents || 0}</h3>
          <span className="text-[10px] text-red-400/80 block mt-0.5">Awaiting Triage</span>
        </div>

        <div
          onClick={() => setStatusFilter('ACKNOWLEDGED')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === 'ACKNOWLEDGED' ? 'border-amber-500/60 bg-amber-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-amber-400 uppercase block">Under Investigation</span>
          <h3 className="text-xl font-bold text-amber-400 mt-1">{stats?.acknowledged_incidents || 0}</h3>
          <span className="text-[10px] text-amber-400/80 block mt-0.5">Analyst Assigned</span>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === 'RESOLVED' ? 'border-emerald-500/60 bg-emerald-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-emerald-400 uppercase block">Resolved</span>
          <h3 className="text-xl font-bold text-emerald-400 mt-1">{stats?.resolved_incidents || 0}</h3>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">Mitigated</span>
        </div>

        <div className="cyber-card p-4">
          <span className="text-[10px] text-slate-400 uppercase block">Average Risk</span>
          <h3 className="text-xl font-bold text-orange-400 mt-1">
            {stats?.avg_risk_score !== undefined ? `${stats.avg_risk_score}` : '81.4'}
            <span className="text-xs text-slate-500 font-normal"> / 100</span>
          </h3>
          <span className="text-[10px] text-orange-400/80 block mt-0.5">High Severity Index</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cyber-input py-1 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="cyber-input py-1 text-xs"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              placeholder="Filter by Source IP..."
              className="cyber-input py-1 pl-2 text-xs w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIncidentsData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Incident Dossier Cards List */}
      <div className="space-y-3 font-mono text-xs">
        {loading ? (
          <div className="cyber-card p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Scanning correlated security incidents...
          </div>
        ) : incidents.length === 0 ? (
          <div className="cyber-card p-12 text-center text-slate-500 space-y-3">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm text-slate-400">No security incidents match the filter criteria.</p>
            <p className="text-xs text-slate-500">
              Click &quot;Trigger Correlation Pass&quot; to synthesize latest telemetry into correlated incidents.
            </p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.incident_id}
              onClick={() => navigate(`/incidents/${incident.incident_id}`)}
              className="cyber-card p-5 hover:border-cyan-500/50 cursor-pointer transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <RiskScoreBadge
                    score={incident.risk_score}
                    level={incident.risk_level}
                  />
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                  <span className="text-[10px] text-cyan-400 font-bold">
                    {incident.incident_id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {incident.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-sans group-hover:text-cyan-400 transition-colors">
                    {incident.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-sans mt-0.5 line-clamp-2 leading-relaxed">
                    {incident.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Pattern: <strong className="text-cyan-300">{incident.pattern_name}</strong></span>
                  {incident.source_ip && (
                    <span>Source IP: <strong className="text-orange-400">{incident.source_ip}</strong></span>
                  )}
                  {incident.primary_device_id && (
                    <span>Primary Asset: <strong className="text-slate-300">{incident.primary_device_id}</strong></span>
                  )}
                  <span>Correlated Events: <strong className="text-amber-400">{incident.event_count}</strong></span>
                </div>
              </div>

              <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2.5 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                <span className="text-[11px] text-slate-400">
                  {new Date(incident.created_at).toLocaleString()}
                </span>
                <span className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-slate-950 font-bold border border-cyan-500/30 group-hover:border-transparent transition-all flex items-center gap-1 text-xs">
                  <span>Investigate Incident</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default IncidentsPage;
