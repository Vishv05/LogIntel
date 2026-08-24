import React from 'react';

export const StatusBadge = ({ status }) => {
  const st = (status || 'UNKNOWN').toUpperCase();

  const styles = {
    // Alerts
    OPEN: 'bg-red-950/60 text-red-400 border-red-800/80',
    ACKNOWLEDGED: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
    RESOLVED: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80',

    // Devices
    ONLINE: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80',
    WARNING: 'bg-amber-950/60 text-amber-400 border-amber-800/80',
    OFFLINE: 'bg-slate-800 text-slate-400 border-slate-700',
  };

  const activeStyle = styles[st] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${activeStyle}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          st === 'OPEN' || st === 'OFFLINE'
            ? 'bg-red-400'
            : st === 'ACKNOWLEDGED' || st === 'WARNING'
            ? 'bg-amber-400'
            : 'bg-emerald-400'
        }`}
      />
      {st}
    </span>
  );
};
