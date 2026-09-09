import React, { useState, useEffect } from 'react';
import { Users, Plus, UserCheck, UserX, X, RefreshCw, Shield, Key } from 'lucide-react';
import { Layout } from '../components/Layout';
import { adminService } from '../services/adminService';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
    is_active: true,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(formValues);
      setShowModal(false);
      setFormValues({ username: '', email: '', password: '', full_name: '', role: 'user', is_active: true });
      fetchUsers();
    } catch (e) {
      alert('Failed to create user: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDeactivate = async (userId, username) => {
    if (window.confirm(`Deactivate user account '${username}'?`)) {
      try {
        await adminService.deactivateUser(userId);
        fetchUsers();
      } catch (e) {
        alert('Action failed: ' + (e.response?.data?.detail || e.message));
      }
    }
  };

  return (
    <Layout title="Role-Based Access Control (RBAC) & Users" onRefresh={fetchUsers}>
      {/* Header Actions */}
      <div className="cyber-card p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
            Operator Accounts & Privileges
          </h3>
          <p className="text-xs text-slate-400">Manage Administrator and Security Analyst credentials</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Operator</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading user accounts...</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-cyan-400 whitespace-nowrap">{u.username}</td>
                    <td className="p-3 text-slate-200 whitespace-nowrap">{u.full_name || '—'}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">{u.email}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                            : u.role === 'security_analyst'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                            : u.role === 'viewer'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                        }`}
                      >
                        {u.role === 'admin'
                          ? 'ADMINISTRATOR'
                          : u.role === 'security_analyst'
                          ? 'SECURITY ANALYST'
                          : u.role === 'viewer'
                          ? 'VIEWER'
                          : 'STANDARD USER'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {u.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {u.is_active && (
                        <button
                          onClick={() => handleDeactivate(u.id, u.username)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 text-[10px] transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">Register New Operator</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">USERNAME</label>
                <input
                  type="text"
                  value={formValues.username}
                  onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
                  placeholder="e.g. jdoe_analyst"
                  className="w-full cyber-input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">FULL NAME</label>
                <input
                  type="text"
                  value={formValues.full_name}
                  onChange={(e) => setFormValues({ ...formValues, full_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full cyber-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={formValues.email}
                  onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                  placeholder="e.g. jdoe@logintel.local"
                  className="w-full cyber-input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">INITIAL PASSWORD</label>
                <input
                  type="password"
                  value={formValues.password}
                  onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
                  placeholder="Minimum 6 characters..."
                  className="w-full cyber-input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">RBAC ROLE</label>
                <select
                  value={formValues.role}
                  onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
                  className="w-full cyber-input"
                >
                  <option value="user">Standard User (Operations & Incident Triage)</option>
                  <option value="security_analyst">Security Analyst (SOC Investigations & Rule Performance)</option>
                  <option value="viewer">Viewer (Read-Only Telemetry & Dashboards)</option>
                  <option value="admin">Administrator (Full Administrative & Governance Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
