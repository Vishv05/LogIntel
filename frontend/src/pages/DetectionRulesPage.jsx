import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit2, Trash2, CheckCircle2, X, RefreshCw, Power, ShieldCheck } from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { adminService } from '../services/adminService';

export const DetectionRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formValues, setFormValues] = useState({
    rule_id: '',
    name: '',
    description: '',
    severity: 'HIGH',
    event_type: '',
    threshold: 5,
    window_seconds: 60,
    is_enabled: true,
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRules();
      setRules(data);
    } catch (e) {
      console.error('Failed to load rules:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId) => {
    try {
      await adminService.toggleRule(ruleId);
      fetchRules();
    } catch (e) {
      alert('Toggle failed: ' + e.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await adminService.updateRule(editingRule.rule_id, formValues);
      } else {
        await adminService.createRule(formValues);
      }
      setShowModal(false);
      setEditingRule(null);
      setFormValues({ rule_id: '', name: '', description: '', severity: 'HIGH', event_type: '', threshold: 5, window_seconds: 60, is_enabled: true });
      fetchRules();
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.detail || e.message));
    }
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm(`Delete rule '${ruleId}'?`)) {
      try {
        await adminService.deleteRule(ruleId);
        fetchRules();
      } catch (e) {
        alert('Delete failed: ' + e.message);
      }
    }
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setFormValues({
      rule_id: rule.rule_id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      event_type: rule.event_type || '',
      threshold: rule.threshold,
      window_seconds: rule.window_seconds,
      is_enabled: rule.is_enabled,
    });
    setShowModal(true);
  };

  return (
    <Layout title="Deterministic Threat Detection Rules" onRefresh={fetchRules}>
      {/* Header Actions */}
      <div className="cyber-card p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
            Active Security Rules & Heuristic Policies
          </h3>
          <p className="text-xs text-slate-400">Deterministic correlation rules evaluating real-time telemetry</p>
        </div>

        <button
          onClick={() => {
            setEditingRule(null);
            setFormValues({ rule_id: '', name: '', description: '', severity: 'HIGH', event_type: '', threshold: 5, window_seconds: 60, is_enabled: true });
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="cyber-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0F172A] border-b border-slate-800 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Rule ID</th>
                <th className="p-3">Rule Name & Logic</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Threshold</th>
                <th className="p-3">Window</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading detection rules...</td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.rule_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(rule.rule_id)}
                        className={`p-1.5 rounded-full ${
                          rule.is_enabled
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                        title={rule.is_enabled ? 'Enabled (Click to disable)' : 'Disabled (Click to enable)'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-3 text-cyan-400 font-bold whitespace-nowrap">{rule.rule_id}</td>
                    <td className="p-3 max-w-sm">
                      <div className="font-bold text-slate-200">{rule.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{rule.description}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <SeverityBadge severity={rule.severity} />
                    </td>
                    <td className="p-3 text-amber-400 font-bold whitespace-nowrap">&ge; {rule.threshold} events</td>
                    <td className="p-3 text-slate-300 whitespace-nowrap">{rule.window_seconds}s</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(rule)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.rule_id)}
                          className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#17243A] border border-cyan-500/30 rounded-xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase">
                {editingRule ? `Edit Rule (${editingRule.rule_id})` : 'Create Custom Detection Rule'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs font-mono">
              {!editingRule && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">RULE ID</label>
                  <input
                    type="text"
                    value={formValues.rule_id}
                    onChange={(e) => setFormValues({ ...formValues, rule_id: e.target.value })}
                    placeholder="e.g. RULE-CUSTOM-007"
                    className="w-full cyber-input"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">RULE NAME</label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  placeholder="e.g. Excessive VPN Auth Failures"
                  className="w-full cyber-input"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">DESCRIPTION</label>
                <textarea
                  value={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  placeholder="Describe threat logic and alert rationale..."
                  className="w-full h-20 cyber-input resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">SEVERITY</label>
                  <select
                    value={formValues.severity}
                    onChange={(e) => setFormValues({ ...formValues, severity: e.target.value })}
                    className="w-full cyber-input"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">THRESHOLD</label>
                  <input
                    type="number"
                    min="1"
                    value={formValues.threshold}
                    onChange={(e) => setFormValues({ ...formValues, threshold: Number(e.target.value) })}
                    className="w-full cyber-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WINDOW (SEC)</label>
                  <input
                    type="number"
                    min="10"
                    value={formValues.window_seconds}
                    onChange={(e) => setFormValues({ ...formValues, window_seconds: Number(e.target.value) })}
                    className="w-full cyber-input"
                    required
                  />
                </div>
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
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
