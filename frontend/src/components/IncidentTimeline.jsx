import React from 'react';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Server,
  Network,
  Activity,
  ArrowDown,
} from 'lucide-react';

export const IncidentTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs cyber-card">
        No attack timeline events available for this incident.
      </div>
    );
  }

  // Phase badge styling helper
  const getPhaseMeta = (phase = '', index = 0) => {
    switch (phase.toUpperCase()) {
      case 'FIRST_SUSPICIOUS':
        return {
          label: 'Initial Suspicious Event',
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
          dotColor: 'bg-amber-400',
          borderColor: 'border-amber-500/40',
          icon: AlertTriangle,
        };
      case 'ESCALATION':
        return {
          label: 'Attack Escalation / Velocity Spike',
          badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
          dotColor: 'bg-orange-400',
          borderColor: 'border-orange-500/40',
          icon: Activity,
        };
      case 'PEAK_ACTIVITY':
        return {
          label: 'Peak Compromise / Critical Activity',
          badgeClass: 'bg-red-950/80 text-red-300 border-red-500/50',
          dotColor: 'bg-red-400',
          borderColor: 'border-red-500/40',
          icon: Flame,
        };
      case 'CURRENT_STATE':
        return {
          label: 'Current State / Containment Status',
          badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
          dotColor: 'bg-cyan-400',
          borderColor: 'border-cyan-500/40',
          icon: ShieldAlert,
        };
      default:
        return {
          label: `Timeline Step ${index + 1}`,
          badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
          dotColor: 'bg-blue-400',
          borderColor: 'border-blue-500/40',
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Chronological Attack Reconstruction Timeline
          </h4>
        </div>
        <span className="text-[10px] text-slate-400">
          {timeline.length} Sequenced Phases
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-red-500 before:to-cyan-400">
        {timeline.map((event, idx) => {
          const meta = getPhaseMeta(event.phase, idx);
          const Icon = meta.icon;
          const isLast = idx === timeline.length - 1;

          return (
            <div key={idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-[27px] top-1.5 w-5 h-5 rounded-full border-2 border-[#121E33] ${meta.dotColor} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#121E33]" />
              </div>

              {/* Event Card */}
              <div
                className={`p-4 rounded-xl bg-[#0F172A] border ${meta.borderColor} hover:border-cyan-500/50 transition-all space-y-2.5 shadow-md`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-slate-200 font-bold text-xs">
                      {event.phase_title || event.event_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {event.timestamp
                      ? new Date(event.timestamp).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>

                {/* Narrative Description */}
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {event.description || event.message}
                </p>

                {/* Technical Telemetry Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-[10px] text-slate-500 block">SOURCE IP</span>
                    <span className="text-cyan-400 font-bold">
                      {event.source_ip || 'Internal'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">AFFECTED DEVICE</span>
                    <span className="text-slate-300 font-semibold truncate block">
                      {event.device_id || 'Global'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">EVENT TYPE</span>
                    <span className="text-slate-200 uppercase truncate block">
                      {event.event_type || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">RAW SIGNAL</span>
                    <span className="text-amber-400 truncate block" title={event.message}>
                      {event.message || 'Telemetry pulse'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentTimeline;
