import React, { useState } from 'react';
import { Activity, ShieldCheck, RefreshCw, Radio, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Header = ({ title, onRefresh, onToggleSidebar }) => {
  const { user, isAdmin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <header className="h-16 bg-[#0E1726]/90 backdrop-blur border-b border-[#1E2D4A] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors flex-shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold font-mono text-slate-100 uppercase tracking-wide truncate">{title}</h1>
          <p className="hidden sm:block text-[11px] text-slate-400 font-mono truncate">Centralized Infrastructure Intelligence & Threat Telemetry</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#17243A] border border-emerald-500/30 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SOC ENGINE: ACTIVE</span>
        </div>

        {/* Threat Detection Status */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#17243A] border border-cyan-500/30 text-xs text-cyan-400 font-mono">
          <Radio className="w-3.5 h-3.5" />
          <span>TELEMETRY: SYNCHRONIZED</span>
        </div>

        {/* Manual Refresh Button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-all disabled:opacity-50"
            title="Refresh Telemetry Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
