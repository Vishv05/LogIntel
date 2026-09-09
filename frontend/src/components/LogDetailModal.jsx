import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Copy,
  Check,
  Terminal,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import { logService } from '../services/logService';

export const LogDetailModal = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplainLog = async () => {
    setLoadingAi(true);
    setAiError('');
    try {
      const data = await logService.explainLog(log);
      setAiData(data);
    } catch (e) {
      setAiError('Failed to generate AI log explanation: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B1220]/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Log Event Details</h3>
              <p className="text-xs text-slate-400">{log.id || log.device_id || 'Telemetry Record'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExplainLog}
              disabled={loadingAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
              <span>{loadingAi ? 'Explaining...' : 'Explain This Log (AI)'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition-colors"
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* AI Explanation Drawer (if triggered) */}
          {aiData && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/50 via-[#151D30] to-[#0F172A] border border-purple-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    {aiData.headline || 'AI Security Assessment'}
                  </h4>
                </div>
                {aiData.confidence && (
                  <span className="text-[10px] text-purple-300 font-bold">{aiData.confidence}</span>
                )}
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="p-2.5 rounded bg-[#0A0F1A] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold block">1. What Happened:</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{aiData.what_happened}</p>
                </div>

                <div className="p-2.5 rounded bg-[#0A0F1A] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 font-mono uppercase font-bold block">2. Why It May Be Suspicious:</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{aiData.why_suspicious}</p>
                </div>

                {aiData.recommended_next_steps && (
                  <div className="p-2.5 rounded bg-[#0A0F1A] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold block">3. Analyst Next Steps:</span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {aiData.recommended_next_steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-mono">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-400 italic">
                {aiData.disclaimer || 'AI SOC decision support. Validate with telemetry.'}
              </div>
            </div>
          )}

          {aiError && (
            <div className="p-3 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
              {aiError}
            </div>
          )}

          {/* Key metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Severity</span>
              <div className="mt-1"><SeverityBadge severity={log.severity} /></div>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Source Type</span>
              <span className="text-xs font-semibold text-cyan-400 uppercase">{log.source_type || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Device ID</span>
              <span className="text-xs text-slate-200">{log.device_id || 'N/A'}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Action</span>
              <span className="text-xs font-semibold text-slate-200">{log.action || 'NONE'}</span>
            </div>
          </div>

          {/* Network details */}
          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">SOURCE IP</span>
              {log.source_ip ? (
                <Link
                  to={`/threat-intel?ip=${log.source_ip}`}
                  className="text-cyan-300 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>{log.source_ip}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              ) : (
                <span className="text-slate-400">N/A</span>
              )}
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
            <span className="text-[10px] text-slate-400 uppercase block mb-1">Message</span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">{log.message}</p>
          </div>

          {/* Formatted JSON Document */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1">Raw OpenSearch Document</span>
            <pre className="p-4 rounded-lg bg-[#0A0F1A] border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto">
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
