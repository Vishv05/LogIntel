import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1220] p-4 relative overflow-hidden">
      {/* Background Cyber Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#22D3EE_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="cyber-card-glow p-8 space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-slate-100 tracking-wider">
              LOG<span className="text-cyan-400">INTEL</span>
            </h1>
            <p className="text-xs text-slate-400">Centralized Log Intelligence & Security Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center gap-2 text-xs text-red-300 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 font-mono uppercase mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full cyber-input pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 font-mono uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full cyber-input pl-9"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Fillers */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Quick Test Accounts</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'adminpassword123')}
                className="p-2 rounded bg-[#0F172A] hover:bg-slate-800 border border-slate-700 text-cyan-300 text-left transition-colors"
              >
                <div className="font-bold">Admin</div>
                <div className="text-[10px] text-slate-400">admin / adminpassword123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('analyst', 'analystpassword123')}
                className="p-2 rounded bg-[#0F172A] hover:bg-slate-800 border border-slate-700 text-blue-300 text-left transition-colors"
              >
                <div className="font-bold">SOC Analyst</div>
                <div className="text-[10px] text-slate-400">analyst / analystpassword123</div>
              </button>
            </div>
          </div>

          {/* Academic Team Footer */}
          <div className="text-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
            <p className="text-slate-400 font-semibold">LogIntel Monitoring Platform</p>
            <p>Bhavsar Vishv (202201619010239) & Sojitra Dhruvil (202201619010336)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
