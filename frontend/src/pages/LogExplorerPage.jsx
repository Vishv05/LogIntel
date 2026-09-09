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
  Sparkles,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { LogDetailModal } from '../components/LogDetailModal';
import { AIExplainerModal } from '../components/AIExplainerModal';
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
  const [deviceId, setDeviceId] = useState('');
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');
  const [sourceIp, setSourceIp] = useState('');
  const [destinationIp, setDestinationIp] = useState('');
  const [username, setUsername] = useState('');
  const [protocol, setProtocol] = useState('');
  const [action, setAction] = useState('');
  const [timePreset, setTimePreset] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  // AI Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Handle Preset Time ranges
  const handleTimePresetChange = (preset) => {
    setTimePreset(preset);
    if (!preset) {
      setStartTime('');
      setEndTime('');
      return;
    }
    const now = new Date();
    let start = new Date();
    if (preset === '15m') start.setMinutes(now.getMinutes() - 15);
    else if (preset === '1h') start.setHours(now.getHours() - 1);
    else if (preset === '24h') start.setHours(now.getHours() - 24);
    else if (preset === '7d') start.setDate(now.getDate() - 7);

    setStartTime(start.toISOString());
    setEndTime(now.toISOString());
    setPage(1);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logService.searchLogs({
        query: query || undefined,
        source_type: sourceType || undefined,
        device_id: deviceId || undefined,
        severity: severity || undefined,
        event_type: eventType || undefined,
        source_ip: sourceIp || undefined,
        destination_ip: destinationIp || undefined,
        username: username || undefined,
        protocol: protocol || undefined,
        action: action || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
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
  }, [
    page,
    pageSize,
    sourceType,
    deviceId,
    severity,
    eventType,
    sourceIp,
    destinationIp,
    username,
    protocol,
    action,
    startTime,
    endTime,
    sortField,
    sortOrder,
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setQuery('');
    setSourceType('');
    setDeviceId('');
    setSeverity('');
    setEventType('');
    setSourceIp('');
    setDestinationIp('');
    setUsername('');
    setProtocol('');
    setAction('');
    setTimePreset('');
    setStartTime('');
    setEndTime('');
    setPage(1);
  };

  const handleExplainRow = async (e, log) => {
    e.stopPropagation();
    setAiModalOpen(true);
    setLoadingAi(true);
    try {
      const result = await logService.explainLog(log);
      setAiData(result);
    } catch (err) {
      alert('AI Explanation failed: ' + (err.response?.data?.detail || err.message));
      setAiModalOpen(false);
    } finally {
      setLoadingAi(false);
    }
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

  const hasActiveFilters =
    query ||
    sourceType ||
    deviceId ||
    severity ||
    eventType ||
    sourceIp ||
    destinationIp ||
    username ||
    protocol ||
    action ||
    startTime;

  return (
    <Layout title="Centralized Log Explorer & Threat Telemetry" onRefresh={fetchLogs}>
      {/* Primary Search Bar */}
      <div className="cyber-card p-4 space-y-4 font-mono text-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Full-text query: IPs (e.g. 198.51.100.77), keywords ('tamper', 'failed'), devices, users..."
              className="w-full cyber-input pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Query Logs</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </form>

        {/* Quick Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Time Preset */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timePreset}
                onChange={(e) => handleTimePresetChange(e.target.value)}
                className="cyber-input py-1 text-xs"
              >
                <option value="">All Time</option>
                <option value="15m">Last 15 Minutes</option>
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            {/* Source Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Source:</span>
              <select
                value={sourceType}
                onChange={(e) => {
                  setSourceType(e.target.value);
                  setPage(1);
                }}
                className="cyber-input py-1 text-xs"
              >
                <option value="">All Sources</option>
                <option value="aws">AWS</option>
                <option value="firewall">Firewall</option>
                <option value="router">Router</option>
                <option value="switch">Switch</option>
                <option value="cctv">CCTV</option>
                <option value="server">Server</option>
                <option value="application">Application</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Severity:</span>
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPage(1);
                }}
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
              <span className="text-slate-400">Action:</span>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
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
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-700/50 text-xs transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Multi-Dimensional Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-xl bg-[#0B1220] border border-cyan-500/30 space-y-3 animate-in fade-in">
            <span className="text-[11px] font-bold text-cyan-400 uppercase block">
              Multi-Dimensional Field Filtering
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">DEVICE ID</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. FW-CORP-EDGE-01"
                  className="w-full cyber-input py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">EVENT TYPE</label>
                <input
                  type="text"
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. LOGIN_FAILED"
                  className="w-full cyber-input py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SOURCE IP</label>
                <input
                  type="text"
                  value={sourceIp}
                  onChange={(e) => {
                    setSourceIp(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. 198.51.100.77"
                  className="w-full cyber-input py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">DESTINATION IP</label>
                <input
                  type="text"
                  value={destinationIp}
                  onChange={(e) => {
                    setDestinationIp(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. 172.31.10.45"
                  className="w-full cyber-input py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setPage(1);
                  }}
                  placeholder="e.g. root, admin"
                  className="w-full cyber-input py-1 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">PROTOCOL</label>
                <select
                  value={protocol}
                  onChange={(e) => {
                    setProtocol(e.target.value);
                    setPage(1);
                  }}
                  className="w-full cyber-input py-1 text-xs"
                >
                  <option value="">All</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="HTTPS">HTTPS</option>
                  <option value="RTSP">RTSP</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Results Table */}
      <div className="cyber-card overflow-hidden font-mono text-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">
            Showing <strong className="text-cyan-400">{logs.length}</strong> of{' '}
            <strong className="text-cyan-400">{total}</strong> total logs
          </span>
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
                <th className="p-3 text-right">AI Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Querying OpenSearch Index...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No logs matched your query criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-cyan-950/20 cursor-pointer transition-colors group"
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
                          log.action === 'DENY' ||
                          log.action === 'BLOCK' ||
                          log.action === 'LOGIN_FAILURE'
                            ? 'bg-red-950 text-red-400 border border-red-800/60'
                            : log.action === 'ALLOW' || log.action === 'CONNECT'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {log.action || 'NONE'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate font-sans" title={log.message}>
                      {log.message}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => handleExplainRow(e, log)}
                        className="px-2.5 py-1 rounded bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 text-[10px] font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                        title="Explain this log entry using AI Threat Analyst"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Explain</span>
                      </button>
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
            <span className="text-xs text-slate-400">Page Size:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
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
            <span className="text-xs text-slate-300 px-2">
              {page} / {totalPages}
            </span>
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

      {/* Detail Modal */}
      <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />

      {/* AI Explainer Modal */}
      <AIExplainerModal
        data={aiData}
        loading={loadingAi}
        onClose={() => setAiModalOpen(false)}
      />
    </Layout>
  );
};

export default LogExplorerPage;
