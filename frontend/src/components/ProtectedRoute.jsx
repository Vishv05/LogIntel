import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0B1220] text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <span className="font-mono text-sm tracking-wider uppercase">Authenticating LogIntel Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1220] p-4">
        <div className="cyber-card-glow max-w-md w-full p-8 text-center space-y-5 border border-red-500/40">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-950/80 border-2 border-red-500/60 flex items-center justify-center text-red-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z" />
            </svg>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold block mb-1">
              403 • Administrator Access Required
            </span>
            <h2 className="text-xl font-bold font-mono text-slate-100">
              Admin Side Restricted
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Access to this administrative module is restricted. Your account does not have the required administrative role privileges.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
