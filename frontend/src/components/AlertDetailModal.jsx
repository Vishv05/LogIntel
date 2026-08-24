import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Terminal, ArrowRight } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import { alertService } from '../services/alertService';

export const AlertDetailModal = ({ alert, onClose, onStatusUpdated }) => {
  const [notes, setNotes] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [relatedLogs, setRelatedLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    if (alert?.alert_id) {
      const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
          const logs = await alertService.getRelatedLogs(alert.alert_id);
          setRelatedLogs(logs);
        } catch (e) {
          console.error('Failed to load related logs:', e);
        } finally {
          setLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [alert]);

  if (!alert) return null;

  const handleAcknowledge = async () => {
    setLoadingAction(true);
    try {
      await alertService.acknowledgeAlert(alert.alert_id, notes);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResolve = async () => {
    setLoadingAction(true);
    try {
      await alertService.resolveAlert(alert.alert_id, notes || 'Resolved by security operator');
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-red-950/60 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-slate-100">{alert.title}</h3>
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {alert.alert_id} | Rule: {alert.rule_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Threat Description Card */}
          <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800">
            <h4 className="text-xs font-bold font-mono uppercase text-slate-300 mb-2">Threat Intelligence Summary</h4>
            <p className="text-xs text-slate-200 leading-relaxed">{alert.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">SOURCE IP</span>
                <span className="text-cyan-400 font-bold">{alert.source_ip || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">DEVICE ID</span>
                <span className="text-slate-300">{alert.device_id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">CORRELATED EVENTS</span>
                <span className="text-amber-400 font-bold">{alert.event_count}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">DETECTED AT</span>
                <span className="text-slate-300">{new Date(alert.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Investigation & Mitigation Actions */}
          {alert.status !== 'RESOLVED' && (
            <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Incident Triage & Mitigation</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter investigation notes, IP blocking confirmation, or resolution reason..."
                className="w-full h-20 cyber-input text-xs resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                {alert.status === 'OPEN' && (
                  <button
                    disabled={loadingAction}
                    onClick={handleAcknowledge}
                    className="px-4 py-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-600/50 text-xs font-mono transition-colors"
                  >
                    Acknowledge Investigation
                  </button>
                )}
                <button
                  disabled={loadingAction}
                  onClick={handleResolve}
                  className="px-4 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Resolved</span>
                </button>
              </div>
            </div>
          )}

          {/* Correlated Logs Section */}
          <div>
            <h4 className="text-xs font-bold font-mono uppercase text-slate-300 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Correlated OpenSearch Logs ({relatedLogs.length})</span>
            </h4>
            {loadingLogs ? (
              <div className="p-4 text-center text-xs font-mono text-slate-400">Loading correlated logs...</div>
            ) : relatedLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-[#0F172A] rounded-lg">No related logs found.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {relatedLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-[#0F172A] border border-slate-800 text-xs font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <SeverityBadge severity={log.severity} />
                      <span className="text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="text-slate-200 truncate">{log.message}</span>
                    </div>
                    <span className="text-cyan-400 text-[11px] flex-shrink-0">{log.source_ip || log.device_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
