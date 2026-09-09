import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  UserPlus,
  LogIn,
  CheckCircle2,
  Eye,
  EyeOff,
  Activity,
  Server,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = ({ initialRegister = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, isPort3001 } = useAuth();

  const [isRegister, setIsRegister] = useState(
    initialRegister || location.pathname === '/register'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.pathname === '/register') {
      setIsRegister(true);
    } else if (location.pathname === '/login') {
      setIsRegister(initialRegister || false);
    }
  }, [location.pathname, initialRegister]);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    if (isRegister) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify and try again.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password, fullName);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070D18] p-4 sm:p-6 lg:p-10 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E3A5F_1px,transparent_1px)] [background-size:28px_28px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Dual-Column Container */}
      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-800/80 bg-[#0E1726]/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Left Column: SIEM Enterprise Overview & Capabilities (5 cols) */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-[#0A1322] via-[#0D1B30] to-[#080E1A] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-mono tracking-wider text-slate-100 flex items-center gap-1.5">
                  LOG<span className="text-cyan-400">INTEL</span>
                </h1>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400/80 uppercase font-semibold">
                  SIEM & Cyber Telemetry
                </span>
              </div>
            </div>

            {/* Mission & Overview */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
                Enterprise Log Intelligence & Threat Correlation
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized security operations platform delivering sub-second threat detection,
                multi-protocol log ingestion, and role-governed access control.
              </p>
            </div>

            {/* Platform Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-[#132238]/60 border border-slate-800 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Real-Time Ingestion Engine</h3>
                  <p className="text-[11px] text-slate-400">
                    Dual pipeline supporting Syslog UDP (RFC 5424 :5140) and high-speed JSON REST APIs.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#132238]/60 border border-slate-800 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Automated Threat Correlation</h3>
                  <p className="text-[11px] text-slate-400">
                    Sub-second multi-event threshold matching with automated incident dispatch.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#132238]/60 border border-slate-800 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Strict Role-Based Isolation</h3>
                  <p className="text-[11px] text-slate-400">
                    Cryptographic token-based session management ensuring strict data access boundaries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Badges & System Pulse */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-semibold">ENGINE ACTIVE</span>
              </div>
              <span className="text-slate-500">v2.4.0-ENTERPRISE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>TLS 1.3 Transport</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>NIST CSF / SOC 2</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Immutable Audit Trail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Dual-Store Indexing</span>
              </div>
            </div>

            {/* Project Credits */}
            <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
              <span className="text-slate-400 font-semibold">Nexus Hackathon Edition</span> • Vishv Bhavsar & Dhruvil Sojitra
            </div>
          </div>
        </div>

        {/* Right Column: Professional Authentication Form (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Top Security Status Indicator */}
            <div className="flex items-center justify-between pb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-slate-800/80 text-slate-300 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ENTERPRISE ACCESS PORTAL
              </span>
              <span className="text-[11px] font-mono text-cyan-400">256-BIT ENCRYPTED</span>
            </div>

            {/* Header Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100">
                {isRegister ? 'Create Your Account' : 'Sign in to LogIntel'}
              </h2>
              <p className="text-xs text-slate-400">
                {isRegister
                  ? 'Enter your details below to register your security portal account.'
                  : 'Enter your credentials to access your security intelligence dashboard.'}
              </p>
            </div>

            {/* Tab Selector (Sign In / Register) */}
            <div className="p-1 bg-[#090F1C] rounded-xl border border-slate-800 grid grid-cols-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  !isRegister
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isRegister
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Account</span>
              </button>
            </div>

            {/* Feedback Alerts: Error & Success */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-300 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-300 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Register mode only) */}
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Full Name <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090F1C] border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email / Mail-ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Email Address / Mail-ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090F1C] border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090F1C] border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register mode only) */}
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#090F1C] border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Session Retention Option */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-[#090F1C] border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Keep session authenticated</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">TLS 1.3 Active</span>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </span>
                ) : isRegister ? (
                  <>
                    <span>Create & Activate Account</span>
                    <UserPlus className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Privacy & Compliance Assurance */}
            <div className="pt-4 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 font-mono">
                LogIntel Security Suite • End-to-End Encrypted Session Verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
