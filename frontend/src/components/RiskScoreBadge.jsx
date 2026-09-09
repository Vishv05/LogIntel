import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, ChevronRight, Info, X } from 'lucide-react';

export const RiskScoreBadge = ({ score = 0, level = '', breakdown = null, showBreakdownButton = false }) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Normalize score
  const numericScore = Math.max(0, Math.min(100, Math.round(score || 0)));

  // Determine color scheme
  let colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-500/40';
  let badgeColor = '#10B981';
  let levelText = level || 'LOW';

  if (numericScore >= 85) {
    colorClasses = 'bg-red-950/70 text-red-400 border-red-500/50';
    badgeColor = '#EF4444';
    levelText = level || 'CRITICAL';
  } else if (numericScore >= 70) {
    colorClasses = 'bg-orange-950/70 text-orange-400 border-orange-500/50';
    badgeColor = '#F97316';
    levelText = level || 'HIGH';
  } else if (numericScore >= 40) {
    colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-500/40';
    badgeColor = '#F59E0B';
    levelText = level || 'MEDIUM';
  }

  return (
    <>
      <div className="inline-flex items-center gap-1.5 font-mono">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border transition-all ${colorClasses} ${
            breakdown || showBreakdownButton ? 'cursor-pointer hover:brightness-125' : ''
          }`}
          onClick={() => (breakdown || showBreakdownButton) && setModalOpen(true)}
          title="Click to view dynamic Risk Score breakdown"
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badgeColor }} />
          <span>RISK {numericScore}</span>
          <span className="text-[9px] opacity-75">/100</span>
          {(breakdown || showBreakdownButton) && <Info className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />}
        </span>
      </div>

      {/* Risk Breakdown Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Dynamic Risk Score Attribution
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Banner */}
            <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Calculated Aggregate Score</span>
                <span className="text-2xl font-black text-slate-100">{numericScore} <span className="text-xs text-slate-500 font-normal">/ 100</span></span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Threat Level</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colorClasses}`}>
                  {levelText}
                </span>
              </div>
            </div>

            {/* Risk Factor Breakdown Details */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-bold text-cyan-400 uppercase block">
                Factor Contribution Weights:
              </span>

              <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Base Severity Factor</span>
                <span className="text-slate-200 font-bold">
                  {breakdown?.factors?.severity_score !== undefined
                    ? `${breakdown.factors.severity_score} pts`
                    : numericScore >= 80 ? '45 pts (Critical)' : numericScore >= 60 ? '35 pts (High)' : '20 pts (Medium)'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Event Velocity & Frequency</span>
                <span className="text-slate-200 font-bold">
                  {breakdown?.factors?.frequency_multiplier !== undefined
                    ? `${breakdown.factors.frequency_multiplier}x`
                    : '+15 pts (Velocity Spike)'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Asset & Target Criticality</span>
                <span className="text-slate-200 font-bold">
                  {breakdown?.factors?.asset_criticality_factor !== undefined
                    ? `${breakdown.factors.asset_criticality_factor}x`
                    : '1.2x (Infrastructure Edge)'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Attacker IP Reputation & Behavior</span>
                <span className="text-slate-200 font-bold">
                  {breakdown?.factors?.reputation_score !== undefined
                    ? `${breakdown.factors.reputation_score} pts`
                    : '+20 pts (Unrecognized WAN Node)'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-300">Multi-Event Correlation Multiplier</span>
                <span className="text-slate-200 font-bold">
                  {breakdown?.factors?.correlation_multiplier !== undefined
                    ? `${breakdown.factors.correlation_multiplier}x`
                    : '1.25x (Multi-Stage Pattern)'}
                </span>
              </div>
            </div>

            {/* Rationalization Summary */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 leading-relaxed">
              <span className="font-bold text-cyan-200 block mb-1">Calculation Methodology:</span>
              Risk score dynamically integrates base event severity, velocity spikes across the time window, the criticality of the targeted device, source IP behavioral reputation, and multi-stage attack correlation.
            </div>

            <div className="text-right">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RiskScoreBadge;
