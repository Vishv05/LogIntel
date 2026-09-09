import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Terminal,
  Activity,
  Server,
  User,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { ExplainableDetectionCard } from '../components/ExplainableDetectionCard';
import { RecommendedResponseCard } from '../components/RecommendedResponseCard';
import { AIExplainerModal } from '../components/AIExplainerModal';
import { incidentService } from '../services/incidentService';
import { useAuth } from '../hooks/useAuth';

export const IncidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timeline, logs, history, response
  const [actionNotes, setActionNotes] = useState('');
  const [newNote, setNewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // AI Briefing Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchIncident = async () => {
    setLoading(true);
    try {
      const data = await incidentService.getIncidentById(id);
      setIncident(data);
    } catch (e) {
      console.error('Failed to load incident:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleAcknowledge = async () => {
    setActionLoading(true);
    try {
      await incidentService.acknowledgeIncident(id, actionNotes || `Acknowledged by analyst ${user?.username}`);
      setActionNotes('');
      await fetchIncident();
    } catch (e) {
      alert('Action failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      await incidentService.resolveIncident(id, actionNotes || `Mitigated and resolved by analyst ${user?.username}`);
      setActionNotes('');
      await fetchIncident();
    } catch (e) {
      alert('Action failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setActionLoading(true);
    try {
      await incidentService.addIncidentNote(id, newNote);
      setNewNote('');
      await fetchIncident();
    } catch (e) {
      alert('Failed to add note: ' + (e.response?.data?.detail || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAIBriefing = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const briefing = await incidentService.getIncidentAIExplanation(id);
      setAiData(briefing);
    } catch (e) {
      console.error('Failed to load AI briefing:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(incident, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !incident) {
    return (
      <Layout title="Incident Dossier Investigation">
        <div className="cyber-card p-16 text-center text-slate-400 font-mono text-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          Loading security incident investigation dossier...
        </div>
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout title="Incident Not Found">
        <div className="cyber-card p-12 text-center text-slate-400 font-mono text-xs space-y-4">
          <ShieldAlert className="w-10 h-10 mx-auto text-red-400" />
          <p className="text-sm font-bold text-slate-200">Security Incident &apos;{id}&apos; Not Found</p>
          <button
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold"
          >
            Return to Incidents Queue
          </button>
        </div>
      </Layout>
    );
  }

  const timeline = incident.attack_timeline || [];
  const explainable = incident.explainable_detection || {};
  const recommendations = incident.recommended_response || [];
  const actionHistory = incident.action_history || [];
  const riskBreakdown = incident.risk_breakdown || {};

  return (
    <Layout title={`Incident Dossier: ${incident.incident_id}`} onRefresh={fetchIncident}>
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 font-mono text-xs">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Export JSON'}</span>
          </button>

          <button
            onClick={handleOpenAIBriefing}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Incident Briefing</span>
          </button>
        </div>
      </div>

      {/* Incident Hero Dossier Header */}
      <div className="p-6 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/60 via-[#152033] to-[#0B1220] shadow-xl space-y-4 font-mono">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <RiskScoreBadge
                score={incident.risk_score}
                level={incident.risk_level}
                breakdown={riskBreakdown}
                showBreakdownButton={true}
              />
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <span className="text-cyan-400 font-bold">{incident.incident_id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                {incident.category}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-sans tracking-tight">
              {incident.title}
            </h1>

            <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-4xl">
              {incident.summary}
            </p>
          </div>

          {/* Rapid Triage Action Controls */}
          {incident.status !== 'RESOLVED' && (
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              {incident.status === 'OPEN' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-500/50 font-bold transition-colors disabled:opacity-50"
                >
                  Acknowledge & Triage
                </button>
              )}
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve Incident</span>
              </button>
            </div>
          )}
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-500 block">SOURCE IP</span>
            {incident.source_ip ? (
              <Link
                to={`/threat-intel?ip=${incident.source_ip}`}
                className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>{incident.source_ip}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            ) : (
              <span className="text-slate-400">Internal</span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">TARGET HOST</span>
            <span className="text-slate-300 font-bold">{incident.target_ip || 'Cluster WAN'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">PRIMARY ASSET</span>
            <span className="text-slate-200 font-semibold">{incident.primary_device_id || 'Infrastructure'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">AFFECTED USERS</span>
            <span className="text-orange-400 font-semibold truncate block">
              {(incident.affected_users || []).length > 0 ? incident.affected_users.join(', ') : 'None'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">EVENT COUNT</span>
            <span className="text-amber-400 font-bold">{incident.event_count} signals</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block">FIRST DETECTED</span>
            <span className="text-slate-400">{new Date(incident.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 font-mono text-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'Detection & Evidence' },
          { id: 'timeline', label: `Attack Timeline (${timeline.length})` },
          { id: 'response', label: `Playbooks & Response (${recommendations.length})` },
          { id: 'history', label: `Action History & Notes (${actionHistory.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Detection & Evidence */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <ExplainableDetectionCard
            detection={explainable}
            patternName={incident.pattern_name}
          />

          <RecommendedResponseCard
            recommendations={recommendations}
            sourceIp={incident.source_ip}
          />
        </div>
      )}

      {/* Tab 2: Attack Timeline */}
      {activeTab === 'timeline' && (
        <div className="cyber-card p-6">
          <IncidentTimeline timeline={timeline} />
        </div>
      )}

      {/* Tab 3: Recommended Response Playbooks */}
      {activeTab === 'response' && (
        <RecommendedResponseCard
          recommendations={recommendations}
          sourceIp={incident.source_ip}
        />
      )}

      {/* Tab 4: Action History & Analyst Triage Notes */}
      {activeTab === 'history' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Add Analyst Investigation Note Card */}
          <div className="cyber-card p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Append Investigation Finding to Incident Log
            </h4>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Document technical findings, forensic analysis, network captures, or containment confirmations..."
                className="w-full h-24 cyber-input text-xs resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Recorded in immutable incident action history as {user?.username}
                </span>
                <button
                  type="submit"
                  disabled={actionLoading || !newNote.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Attach Investigation Note</span>
                </button>
              </div>
            </form>
          </div>

          {/* Action History Audit Trail */}
          <div className="cyber-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Immutable Action History & Audit Log
              </h4>
              <span className="text-[10px] text-slate-500">{actionHistory.length} Actions Logged</span>
            </div>

            <div className="space-y-3">
              {actionHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-700/50">
                        {item.action}
                      </span>
                      <span className="text-slate-300 font-semibold">{item.by}</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Explainer Modal */}
      <AIExplainerModal
        data={aiData}
        loading={aiLoading}
        onClose={() => setAiModalOpen(false)}
      />
    </Layout>
  );
};

export default IncidentDetailPage;
