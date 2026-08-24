import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ShieldAlert,
  Server,
  BarChart3,
  Sliders,
  FileText,
  Users,
  User,
  LogOut,
  Shield,
  Activity,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Log Explorer', href: '/logs', icon: Search, adminOnly: false },
    { name: 'Alerts', href: '/alerts', icon: ShieldAlert, adminOnly: false },
    { name: 'Devices', href: '/devices', icon: Server, adminOnly: false },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, adminOnly: false },
    { name: 'Detection Rules', href: '/rules', icon: Sliders, adminOnly: true },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText, adminOnly: true },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
    { name: 'Profile', href: '/profile', icon: User, adminOnly: false },
  ];

  const visibleNav = navigation.filter((item) => !item.adminOnly || isAdmin());

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0E1726] border-r border-[#1E2D4A] flex flex-col justify-between h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-[#1E2D4A] gap-3 bg-[#0B1220]/60">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">
              LOG<span className="text-cyan-400">INTEL</span>
            </span>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight leading-none">Security Monitoring</p>
          </div>
        </div>

        {/* User Session Bar */}
        <div className="p-4 mx-3 my-3 rounded-lg bg-[#17243A] border border-[#1E2D4A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs font-mono">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || user?.username}</p>
              <span
                className={`inline-block text-[10px] font-mono font-medium px-1.5 py-0.2 rounded ${
                  isAdmin() ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/50' : 'bg-blue-950 text-blue-400 border border-blue-700/50'
                }`}
              >
                {isAdmin() ? 'ADMINISTRATOR' : 'SECURITY ANALYST'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1 mt-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Project Team & Logout */}
      <div className="p-3 border-t border-[#1E2D4A] bg-[#0B1220]/40 space-y-3">
        {/* Project Team Credits */}
        <div className="p-2.5 rounded-md bg-[#131E33] border border-slate-800/80 text-[11px]">
          <p className="text-[10px] text-cyan-400 font-mono font-semibold uppercase tracking-wider mb-1">Project Team</p>
          <p className="text-slate-300 font-medium truncate">Vishv Bhavsar <span className="text-[10px] text-slate-500 font-mono">(...0239)</span></p>
          <p className="text-slate-300 font-medium truncate">Dhruvil Sojitra <span className="text-[10px] text-slate-500 font-mono">(...0336)</span></p>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
