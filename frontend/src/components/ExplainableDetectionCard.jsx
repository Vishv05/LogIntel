import React from 'react';
import { ShieldAlert, Info, HelpCircle, Layers, CheckCircle, Network, Clock } from 'lucide-react';

export const ExplainableDetectionCard = ({ detection = {}, patternName = '' }) => {
  if (!detection || Object.keys(detection).length === 0) {
    return null;
  }

  const mitre = detection.mitre || {};

  return (
    <div className="cyber-card p-5 space-y-4 font-mono text-xs border border-cyan-500/30">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Explainable Detection & Evidentiary Attribution
          </h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-bold">
          {detection.confidence || '95% Confidence'}
        </span>
      </div>

      {/* Detection Rule & Evidence Statement */}
      <div className="space-y-2">
        <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">CORRELATION RULE:</span>
            <span className="text-cyan-400 font-bold">{detection.detection_rule || 'RULE-CORR-AUTO'}</span>
          </div>
          <p className="text-slate-200 font-bold font-sans text-xs">
            {detection.rule_name || patternName || 'Multi-Event Correlation Engine Signature'}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase block">Supporting Evidentiary Grounds:</span>
          <p className="text-slate-300 font-sans text-xs leading-relaxed">
            {detection.supporting_evidence ||
              'Multiple related telemetry events met correlation frequency and cross-device sequencing criteria.'}
          </p>
        </div>
      </div>

      {/* Grid of Key Verification Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
          <span className="text-[10px] text-slate-500 block">EVENT COUNT</span>
          <span className="text-amber-400 font-bold text-sm">{detection.event_count || 'Multi'}</span>
        </div>
        <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
          <span className="text-[10px] text-slate-500 block">TIME WINDOW</span>
          <span className="text-slate-200 font-semibold">{detection.time_window || '300s Sliding'}</span>
        </div>
        <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
          <span className="text-[10px] text-slate-500 block">AFFECTED ASSETS</span>
          <span className="text-slate-200 font-semibold truncate block">
            {(detection.affected_devices || []).length > 0 ? detection.affected_devices.join(', ') : 'Infrastructure'}
          </span>
        </div>
        <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
          <span className="text-[10px] text-slate-500 block">TARGET USERS</span>
          <span className="text-cyan-300 font-semibold truncate block">
            {(detection.affected_users || []).length > 0 ? detection.affected_users.join(', ') : 'N/A'}
          </span>
        </div>
      </div>

      {/* MITRE ATT&CK Mapping */}
      {mitre && mitre.technique_id && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-950/40 via-[#0B1220] to-[#0F172A] border border-purple-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300 uppercase">
              MITRE ATT&CK Framework Mapping
            </span>
            <span className="text-[10px] text-slate-400 font-mono">MITRE Enterprise v14</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] text-slate-500 block">TACTIC</span>
              <span className="text-purple-400 font-semibold">{mitre.tactic || 'Credential Access'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">TECHNIQUE</span>
              <span className="text-cyan-400 font-bold">{mitre.technique_id}: {mitre.technique_name}</span>
            </div>
            {mitre.secondary_technique && (
              <div>
                <span className="text-[10px] text-slate-500 block">SECONDARY</span>
                <span className="text-slate-300">{mitre.secondary_technique}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplainableDetectionCard;
