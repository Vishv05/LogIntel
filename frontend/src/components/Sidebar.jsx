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
  Flame,
  Globe,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, logout, isAdmin, isPort3001 } = useAuth();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const userNav = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Incidents', href: '/incidents', icon: Flame },
    { name: 'Alerts', href: '/alerts', icon: ShieldAlert },
    { name: 'Log Explorer', href: '/logs', icon: Search },
    { name: 'Threat Intel', href: '/threat-intel', icon: Globe },
    { name: 'Devices', href: '/devices', icon: Server },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const adminNav = [
    { name: 'Detection Rules', href: '/rules', icon: Sliders },
    { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
    { name: 'Users', href: '/users', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer: Off-canvas on mobile, fixed sticky on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0E1726] border-r border-[#1E2D4A] flex flex-col justify-between h-screen font-sans transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:flex-shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-cyan-500/10' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="overflow-y-auto">
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E2D4A] bg-[#0B1220]/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-wider text-slate-100 font-mono">
                    LOG<span className="text-cyan-400">INTEL</span>
                  </span>
                  {isAdmin() && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded border bg-cyan-950 text-cyan-400 border-cyan-700/60">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight leading-none">
                  {isAdmin() ? 'Governance Console' : 'Security Operations'}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

        {/* User Session Bar */}
        <div className="p-3 mx-3 my-3 rounded-lg bg-[#17243A] border border-[#1E2D4A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold text-xs font-mono">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || user?.username}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    user?.role === 'admin'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-700/50'
                      : user?.role === 'security_analyst'
                      ? 'bg-purple-950 text-purple-400 border border-purple-700/50'
                      : user?.role === 'viewer'
                      ? 'bg-amber-950 text-amber-400 border border-amber-700/50'
                      : 'bg-blue-950 text-blue-400 border border-blue-700/50'
                  }`}
                >
                  {user?.role === 'admin'
                    ? 'ADMINISTRATOR'
                    : user?.role === 'security_analyst'
                    ? 'SECURITY ANALYST'
                    : user?.role === 'viewer'
                    ? 'VIEWER'
                    : 'STANDARD USER'}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                {user?.role === 'admin'
                  ? 'Full System Authority'
                  : user?.role === 'security_analyst'
                  ? 'SOC Investigations & Response'
                  : user?.role === 'viewer'
                  ? 'Read-Only Security View'
                  : 'Telemetry & Incident Access'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section 1: Standard Operations */}
        <div className="px-3 mt-3">
          <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>Operations & Telemetry</span>
          </div>
          <nav className="space-y-1">
            {userNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
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

        {/* Navigation Section 2: Administration (ONLY rendered if user is an Administrator) */}
        {isAdmin() && (
          <div className="px-3 mt-4 pt-3 border-t border-[#1E2D4A]/60">
            <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
              <span className="text-cyan-400 font-bold">
                Governance & Policy
              </span>
              <span className="text-[9px] px-1 rounded font-mono text-cyan-400 bg-cyan-950 border border-cyan-800/60">
                Admin
              </span>
            </div>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Navigation Section 3: Profile */}
        <div className="px-3 mt-3 pt-2 border-t border-[#1E2D4A]/40">
          <NavLink
            to="/profile"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <span>Profile</span>
          </NavLink>
        </div>
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
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/50 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  </>
  );
};

export default Sidebar;
