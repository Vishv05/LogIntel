import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';

export const LogDetailModal = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100">Log Event Details</h3>
              <p className="text-xs text-slate-400 font-mono">{log.id || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Key metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Severity</span>
              <div className="mt-1"><SeverityBadge severity={log.severity} /></div>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Source Type</span>
              <span className="text-xs font-mono font-semibold text-cyan-400 uppercase">{log.source_type || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Device ID</span>
              <span className="text-xs font-mono text-slate-200">{log.device_id || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Action</span>
              <span className="text-xs font-mono font-semibold text-slate-200">{log.action || 'NONE'}</span>
            </div>
          </div>

          {/* Network details */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">SOURCE IP</span>
              <span className="text-cyan-300">{log.source_ip || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">SRC PORT</span>
              <span className="text-slate-300">{log.source_port || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">DEST IP</span>
              <span className="text-cyan-300">{log.destination_ip || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">DEST PORT</span>
              <span className="text-slate-300">{log.destination_port || 'N/A'}</span>
            </div>
          </div>

          {/* Message */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Message</span>
            <p className="text-xs font-mono text-slate-200">{log.message}</p>
          </div>

          {/* Formatted JSON Document */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Raw OpenSearch Document</span>
            <pre className="p-4 rounded-lg bg-[#0A0F1A] border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
