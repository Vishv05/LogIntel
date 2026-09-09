import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  Search,
  Server,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const RecommendedResponseCard = ({ recommendations = [], sourceIp = '', onActionExecuted }) => {
  const { isAdmin } = useAuth();
  const [stagedActions, setStagedActions] = useState({});
  const [message, setMessage] = useState('');

  const handleStageAction = (rec) => {
    setStagedActions((prev) => ({
      ...prev,
      [rec.id]: prev[rec.id] ? false : true,
    }));
    setMessage(
      rec.requires_admin && !isAdmin()
        ? `Action '${rec.title}' staged for Administrator approval. Security Analysts cannot execute destructive perimeter blocks directly.`
        : `Action '${rec.title}' acknowledged and added to the incident investigation playbook.`
    );
    setTimeout(() => setMessage(''), 5000);
  };

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="cyber-card p-5 space-y-4 font-mono text-xs border border-emerald-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Safe Recommended Incident Responses & Containment Playbooks
          </h4>
        </div>
        <span className="text-[10px] text-slate-400">
          SOC Governance Controlled
        </span>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recommendations.map((rec) => {
          const isStaged = stagedActions[rec.id];

          return (
            <div
              key={rec.id}
              className={`p-4 rounded-xl bg-[#0F172A] border transition-all space-y-3 flex flex-col justify-between ${
                isStaged
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="font-bold text-slate-200 text-xs font-sans">
                    {rec.title}
                  </h5>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                      rec.severity === 'CRITICAL'
                        ? 'bg-red-950/70 text-red-400 border-red-500/50'
                        : rec.severity === 'HIGH'
                        ? 'bg-orange-950/70 text-orange-400 border-orange-500/50'
                        : 'bg-blue-950/70 text-blue-400 border-blue-500/50'
                    }`}
                  >
                    {rec.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {rec.details}
                </p>

                {rec.requires_admin && (
                  <div className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Lock className="w-3 h-3" />
                    <span>Requires Administrator Approval for Execution</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {rec.target_url ? (
                  <Link
                    to={rec.target_url}
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Open in Log Explorer &rarr;</span>
                  </Link>
                ) : rec.action_type === 'THREAT_INTEL' && sourceIp ? (
                  <Link
                    to={`/threat-intel?ip=${sourceIp}`}
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    <span>Investigate IP Reputation &rarr;</span>
                  </Link>
                ) : (
                  <span className="text-[10px] text-slate-500">Playbook {rec.id}</span>
                )}

                <button
                  onClick={() => handleStageAction(rec)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    isStaged
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : rec.requires_admin && !isAdmin()
                      ? 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-600/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isStaged
                      ? 'Playbook Staged'
                      : rec.requires_admin && !isAdmin()
                      ? 'Stage for Admin Sign-Off'
                      : 'Stage Response Action'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedResponseCard;
