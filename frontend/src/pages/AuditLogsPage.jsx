import React, { useState, useEffect } from 'react';
import { FileText, Shield, User, Filter, RefreshCw, Clock } from 'lucide-react';
import { Layout } from '../components/Layout';
import { adminService } from '../services/adminService';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs({
        action: actionFilter || undefined,
        username: userFilter || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, userFilter]);

  return (
    <Layout title="Administrative & Security Audit Trail" onRefresh={fetchAuditLogs}>
      {/* Filters Bar */}
      <div className="cyber-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Action Type:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="cyber-input py-1 text-xs font-mono"
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="CREATE_DEVICE">CREATE_DEVICE</option>
              <option value="UPDATE_DEVICE">UPDATE_DEVICE</option>
              <option value="CREATE_RULE">CREATE_RULE</option>
              <option value="TOGGLE_RULE">TOGGLE_RULE</option>
              <option value="ACKNOWLEDGE_ALERT">ACKNOWLEDGE_ALERT</option>
              <option value="RESOLVE_ALERT">RESOLVE_ALERT</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">Username:</span>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filter by operator..."
              className="cyber-input py-1 text-xs font-mono"
            />
          </div>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Action Signature</th>
                <th className="p-3">Target Resource</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Event Narrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading audit trail records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No audit events recorded for current filters.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-cyan-400 whitespace-nowrap">{log.username}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('FAIL')
                            ? 'bg-red-950 text-red-400 border border-red-800/60'
                            : log.action.includes('RESOLVE') || log.action.includes('SUCCESS')
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      {log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-300 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
