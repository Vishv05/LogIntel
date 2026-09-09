import React from 'react';
import { Sparkles, X, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export const AIExplainerModal = ({ data, loading = false, onClose }) => {
  if (!data && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#121E33] border border-cyan-500/40 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0B1220]/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  LogIntel AI Threat Analyst
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700/50">
                  Decision Support
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Cognitive telemetry synthesis & explainable threat intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <p className="text-sm font-bold text-slate-200">Synthesizing Log & Threat Intelligence...</p>
              <p className="text-xs text-slate-500">Correlating contextual telemetry against SOC heuristics & MITRE ATT&CK.</p>
            </div>
          ) : (
            <>
              {/* Headline Banner */}
              <div className="p-3.5 rounded-lg bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-[#0F172A] border border-cyan-500/30">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">
                  Executive Briefing
                </span>
                <h4 className="text-sm font-bold text-slate-100 font-sans">
                  {data?.headline || data?.executive_briefing || 'Telemetry Analysis Assessment'}
                </h4>
                {data?.confidence && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confidence Score: {data.confidence}</span>
                  </div>
                )}
              </div>

              {/* 1. What Happened */}
              <div className="p-3.5 rounded-lg bg-[#0A0F1A] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase text-[11px]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>1. What Happened (Observed Behavior)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {data?.what_happened || 'Standard infrastructure activity observed across monitored assets.'}
                </p>
              </div>

              {/* 2. Why Suspicious */}
              <div className="p-3.5 rounded-lg bg-[#0A0F1A] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>2. Why It May Be Suspicious (Threat Rationale)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  {data?.why_suspicious || 'Behavior deviates from established operational baselines or matches attack progression signatures.'}
                </p>
              </div>

              {/* 3. Affected Systems & Assets */}
              <div className="p-3.5 rounded-lg bg-[#0A0F1A] border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold uppercase text-[11px]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>3. Potentially Affected Systems & Users</span>
                </div>
                <ul className="space-y-1">
                  {(data?.affected_systems || ['Target Host', 'Perimeter Firewall']).map((sys, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{sys}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. MITRE ATT&CK Context */}
              {data?.mitre && (
                <div className="p-3.5 rounded-lg bg-[#0A0F1A] border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase block">
                    MITRE ATT&CK Taxonomy Mapping
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[#070D18] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">TACTIC</span>
                      <span className="text-purple-400 font-semibold">{data.mitre.tactic || 'Discovery'}</span>
                    </div>
                    <div className="p-2 rounded bg-[#070D18] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">TECHNIQUE ID</span>
                      <span className="text-cyan-400 font-bold">{data.mitre.technique_id || 'T1046'}</span>
                    </div>
                    <div className="p-2 rounded bg-[#070D18] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">TECHNIQUE NAME</span>
                      <span className="text-slate-200 truncate block">{data.mitre.technique_name || 'Service Discovery'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Recommended Next Steps for SOC Analyst */}
              <div className="p-3.5 rounded-lg bg-[#0A0F1A] border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>5. Analyst Investigation Checklist</span>
                </div>
                <div className="space-y-1.5">
                  {(data?.recommended_next_steps || []).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded bg-[#070D18] border border-slate-800/80">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-600/60 text-cyan-300 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 italic">
                <strong className="text-slate-300 not-italic">SOC Advisory: </strong>
                {data?.disclaimer ||
                  'AI Log Explainer serves as an augmented decision-support layer to accelerate triage. Final operational determinations and containment actions require human analyst verification.'}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0B1220]/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Acknowledge Intelligence
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIExplainerModal;
