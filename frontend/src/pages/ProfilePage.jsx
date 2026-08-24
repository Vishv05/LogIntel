import React, { useState } from 'react';
import { User, Key, Shield, CheckCircle2, AlertCircle, Award, Code2, Server } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';

export const ProfilePage = () => {
  const { user, isAdmin } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      await authService.changePassword(currentPassword, newPassword);
      setStatusMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Password change failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Operator Profile & System Credits">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="cyber-card p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 font-mono font-bold text-2xl">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div>
              <h3 className="text-base font-bold font-mono text-slate-100">{user?.full_name || user?.username}</h3>
              <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            </div>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  isAdmin()
                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-600/60'
                    : 'bg-blue-950 text-blue-400 border border-blue-600/60'
                }`}
              >
                {isAdmin() ? 'SECURITY ADMINISTRATOR' : 'SOC SECURITY ANALYST'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-bold">Active & Verified</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Account Created:</span>
              <span className="text-slate-200">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Last Session:</span>
              <span className="text-slate-200">
                {user?.last_login ? new Date(user.last_login).toLocaleTimeString() : 'Current Session'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="cyber-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Key className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">Change Account Password</h3>
          </div>

          {statusMsg && (
            <div className="p-3 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">CURRENT PASSWORD</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full cyber-input"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">NEW PASSWORD</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters..."
                className="w-full cyber-input"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">CONFIRM NEW PASSWORD</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password..."
                className="w-full cyber-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Project Team & Academic Credits */}
        <div className="cyber-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">Project Team</h3>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-[#0F172A] border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block">Student 1</span>
              <p className="text-sm font-bold text-slate-100 mt-0.5">Bhavsar Vishv Jigneshkumar</p>
              <p className="text-slate-400 text-[11px] mt-1">Enrollment No: <strong className="text-slate-200">202201619010239</strong></p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0F172A] border border-cyan-500/30">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block">Student 2</span>
              <p className="text-sm font-bold text-slate-100 mt-0.5">Sojitra Dhruvil Vipulbhai</p>
              <p className="text-slate-400 text-[11px] mt-1">Enrollment No: <strong className="text-slate-200">202201619010336</strong></p>
            </div>

            <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">LogIntel Platform Core Pipeline:</p>
              <p className="text-[10px] text-slate-400">
                Collect &rarr; Secure &rarr; Process &rarr; Normalize &rarr; Store &rarr; Search &rarr; Analyze &rarr; Detect &rarr; Alert &rarr; Monitor
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
