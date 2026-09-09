import React from 'react';

export const StatCard = ({ title, value, subtitle, subtext, icon: Icon, color = 'cyan', trend }) => {
  const colorMap = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/20',
    red: 'text-red-400 border-red-500/20 bg-red-950/20',
    rose: 'text-rose-400 border-rose-500/20 bg-rose-950/20',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
    green: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-950/20',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-950/20',
    indigo: 'text-indigo-400 border-indigo-500/20 bg-indigo-950/20',
  };

  const iconBg = colorMap[color] || colorMap.cyan;
  const displaySubtitle = subtitle || subtext;
  const trendText = typeof trend === 'object' && trend !== null ? trend.value : trend;
  const trendColor = typeof trend === 'object' && trend !== null
    ? trend.direction === 'up'
      ? 'text-emerald-400'
      : trend.direction === 'down'
      ? 'text-rose-400'
      : 'text-cyan-400'
    : 'text-cyan-400';

  return (
    <div className="cyber-card p-5 transition-all duration-200 hover:border-cyan-500/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-1 text-2xl font-bold font-mono text-slate-100">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {(displaySubtitle || trendText) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
          <span>{displaySubtitle}</span>
          {trendText && <span className={`font-mono ${trendColor}`}>{trendText}</span>}
        </div>
      )}
    </div>
  );
};
