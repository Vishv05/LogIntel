import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Clock, Filter, RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { AlertDetailModal } from '../components/AlertDetailModal';
import { alertService } from '../services/alertService';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ total_alerts: 0, open_alerts: 0, acknowledged_alerts: 0, resolved_alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const [alertsData, statsData] = await Promise.all([
        alertService.getAlerts({
          status: statusFilter || undefined,
          severity: severityFilter || undefined,
          limit: 100,
        }),
        alertService.getAlertStats(),
      ]);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [statusFilter, severityFilter]);

  return (
    <Layout title="Threat Detection & Security Alerts" onRefresh={fetchAlertsData}>
      {/* Alert Stats Top Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === '' ? 'border-cyan-500/60 bg-cyan-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-mono block">All Alerts</span>
          <h3 className="text-xl font-bold font-mono text-slate-100 mt-1">{stats.total_alerts}</h3>
        </div>
        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === 'OPEN' ? 'border-red-500/60 bg-red-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-red-400 uppercase font-mono block">Open Incidents</span>
          <h3 className="text-xl font-bold font-mono text-red-400 mt-1">{stats.open_alerts}</h3>
        </div>
        <div
          onClick={() => setStatusFilter('ACKNOWLEDGED')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === 'ACKNOWLEDGED' ? 'border-amber-500/60 bg-amber-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-amber-400 uppercase font-mono block">In Investigation</span>
          <h3 className="text-xl font-bold font-mono text-amber-400 mt-1">{stats.acknowledged_alerts}</h3>
        </div>
        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`cyber-card p-4 cursor-pointer transition-all ${
            statusFilter === 'RESOLVED' ? 'border-emerald-500/60 bg-emerald-950/20' : ''
          }`}
        >
          <span className="text-[10px] text-emerald-400 uppercase font-mono block">Resolved</span>
          <h3 className="text-xl font-bold font-mono text-emerald-400 mt-1">{stats.resolved_alerts}</h3>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Status:</span>
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
            <span className="text-slate-400 font-mono">Severity:</span>
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
        </div>

        <button
          onClick={fetchAlertsData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts Grid / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="cyber-card p-12 text-center text-slate-400 font-mono text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            Loading security alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="cyber-card p-12 text-center text-slate-500 font-mono text-xs">
            No alerts matching the selected filter criteria.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.alert_id}
              onClick={() => setSelectedAlert(alert)}
              className="cyber-card p-5 hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={alert.severity} />
                  <h3 className="text-sm font-bold font-mono text-slate-100">{alert.title}</h3>
                  <StatusBadge status={alert.status} />
                </div>
                <p className="text-xs text-slate-300">{alert.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <span>ID: <strong className="text-cyan-400">{alert.alert_id}</strong></span>
                  <span>Rule: <strong className="text-slate-300">{alert.rule_id}</strong></span>
                  {alert.source_ip && <span>IP: <strong className="text-orange-300">{alert.source_ip}</strong></span>}
                  {alert.device_id && <span>Device: <strong className="text-slate-300">{alert.device_id}</strong></span>}
                  <span>Count: <strong className="text-amber-400">{alert.event_count}</strong></span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(alert.created_at).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300">
                  Investigate <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Alert Investigation Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onStatusUpdated={fetchAlertsData}
      />
    </Layout>
  );
};
