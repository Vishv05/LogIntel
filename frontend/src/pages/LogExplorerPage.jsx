import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { LogDetailModal } from '../components/LogDetailModal';
import { logService } from '../services/logService';

export const LogExplorerPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [query, setQuery] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [severity, setSeverity] = useState('');
  const [action, setAction] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logService.searchLogs({
        query: query || undefined,
        source_type: sourceType || undefined,
        severity: severity || undefined,
        action: action || undefined,
        page,
        page_size: pageSize,
        sort_field: sortField,
        sort_order: sortOrder,
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      console.error('Failed to search logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, sourceType, severity, action, sortField, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logintel-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Layout title="Centralized Log Explorer" onRefresh={fetchLogs}>
      {/* Search & Filter Bar */}
      <div className="cyber-card p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword, IP address (e.g. 198.51.100.77), device, username, message..."
              className="w-full cyber-input pl-9"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Execute Search</span>
          </button>
        </form>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Source Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">Source:</span>
              <select
                value={sourceType}
                onChange={(e) => { setSourceType(e.target.value); setPage(1); }}
                className="cyber-input py-1 text-xs"
              >
                <option value="">All Sources</option>
                <option value="aws">AWS</option>
                <option value="firewall">Firewall</option>
                <option value="switch">Switch</option>
                <option value="cctv">CCTV</option>
                <option value="server">Server</option>
                <option value="application">Application</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">Severity:</span>
              <select
                value={severity}
                onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
                className="cyber-input py-1 text-xs"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">Action:</span>
              <select
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                className="cyber-input py-1 text-xs"
              >
                <option value="">All Actions</option>
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
                <option value="BLOCK">BLOCK</option>
                <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
                <option value="CONNECT">CONNECT</option>
                <option value="DISCONNECT">DISCONNECT</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Results Table */}
      <div className="cyber-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-300">
            Showing <strong className="text-cyan-400">{logs.length}</strong> of <strong className="text-cyan-400">{total}</strong> total logs
          </span>
          <span className="text-xs font-mono text-slate-400">Page {page} of {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th onClick={() => toggleSort('timestamp')} className="p-3 cursor-pointer hover:text-cyan-400">
                  <div className="flex items-center gap-1">
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => toggleSort('severity')} className="p-3 cursor-pointer hover:text-cyan-400">
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-3">Source</th>
                <th className="p-3">Device ID</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">IP Flow</th>
                <th className="p-3">Action</th>
                <th className="p-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Querying OpenSearch Index...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No logs matched your query criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-cyan-950/20 cursor-pointer transition-colors"
                  >
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="p-3 uppercase font-bold text-cyan-400 whitespace-nowrap">
                      {log.source_type}
                    </td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">{log.device_id}</td>
                    <td className="p-3 text-slate-200 whitespace-nowrap">{log.event_type}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {log.source_ip ? (
                        <span>
                          <span className="text-cyan-300">{log.source_ip}</span>
                          {log.destination_ip && (
                            <span className="text-slate-500"> → {log.destination_ip}</span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'DENY' || log.action === 'BLOCK' || log.action === 'LOGIN_FAILURE'
                            ? 'bg-red-950 text-red-400 border border-red-800/60'
                            : log.action === 'ALLOW' || log.action === 'CONNECT'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.action || 'NONE'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="cyber-input py-0.5 text-xs font-mono"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </Layout>
  );
};
