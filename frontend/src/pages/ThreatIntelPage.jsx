import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Globe,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Server,
  Network,
  Activity,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  Flame,
  Radio,
  Sliders,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { threatIntelService } from '../services/threatIntelService';

export const ThreatIntelPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIp = searchParams.get('ip') || '198.51.100.77';

  const [searchIp, setSearchIp] = useState(initialIp);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [topSuspicious, setTopSuspicious] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingTop, setLoadingTop] = useState(true);

  const fetchTopSuspicious = async () => {
    setLoadingTop(true);
    try {
      const list = await threatIntelService.getTopSuspiciousIps(10);
      setTopSuspicious(list || []);
    } catch (e) {
      console.error('Failed to load suspicious IPs:', e);
    } finally {
      setLoadingTop(false);
    }
  };

  const handleAnalyze = async (ipToSearch) => {
    const target = (ipToSearch || searchIp).trim();
    if (!target) return;
    setLoadingAnalysis(true);
    try {
      const data = await threatIntelService.analyzeIp(target);
      setAnalyzedData(data);
      setSearchParams({ ip: target });
    } catch (e) {
      alert('Failed to analyze IP: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchTopSuspicious();
    if (initialIp) {
      handleAnalyze(initialIp);
    }
  }, []);

  const getThreatScoreColor = (score = 0) => {
    if (score >= 80) return 'text-red-400 bg-red-950/70 border-red-500/50';
    if (score >= 60) return 'text-orange-400 bg-orange-950/70 border-orange-500/50';
    if (score >= 35) return 'text-amber-400 bg-amber-950/70 border-amber-500/50';
    return 'text-emerald-400 bg-emerald-950/70 border-emerald-500/50';
  };

  return (
    <Layout title="Threat Intelligence & Suspicious IP Analysis" onRefresh={fetchTopSuspicious}>
      {/* Header Search Hero */}
      <div className="cyber-card p-6 space-y-4 font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <Globe className="w-5 h-5" />
          <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
            Investigate IP Address Threat Profile
          </h2>
        </div>
        <p className="text-xs text-slate-300 font-sans">
          Query IP addresses against real-time local telemetry, external threat intelligence profiles, Geo/ASN databases, and correlated attack incidents.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze(searchIp);
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              placeholder="Enter IPv4 or IPv6 address (e.g. 198.51.100.77, 203.0.113.45)..."
              className="w-full cyber-input pl-9 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loadingAnalysis}
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{loadingAnalysis ? 'Analyzing...' : 'Investigate Host'}</span>
          </button>
        </form>

        {/* Quick Sample Candidates */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Known Threat Samples:</span>
          {['198.51.100.77', '203.0.113.45', '185.220.101.5', '198.51.100.88'].map((ip) => (
            <button
              key={ip}
              type="button"
              onClick={() => {
                setSearchIp(ip);
                handleAnalyze(ip);
              }}
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-cyan-950/40 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-[11px] transition-colors"
            >
              {ip}
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Layout: Dossier & Top Suspicious Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
        {/* Left 2 Cols: Deep IP Dossier */}
        <div className="lg:col-span-2 space-y-6">
          {loadingAnalysis ? (
            <div className="cyber-card p-16 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
              <p className="text-sm font-bold text-slate-200">Querying Threat Intelligence & Telemetry...</p>
            </div>
          ) : analyzedData ? (
            <>
              {/* Threat Dossier Card */}
              <div className="cyber-card p-6 space-y-5 border border-cyan-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-100">{analyzedData.ip}</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${getThreatScoreColor(
                          analyzedData.threat_score
                        )}`}
                      >
                        {analyzedData.threat_level} THREAT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans">{analyzedData.geo?.threat_category || 'Identified Endpoint'}</p>
                  </div>

                  {/* Threat Score Big Badge */}
                  <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Threat Reputation</span>
                      <span className="text-2xl font-black text-slate-100">
                        {analyzedData.threat_score}
                        <span className="text-xs text-slate-500 font-normal"> / 100</span>
                      </span>
                    </div>
                    <Flame
                      className={`w-6 h-6 ${
                        analyzedData.threat_score >= 70 ? 'text-red-400' : 'text-amber-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Geo & Network Attribution */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">COUNTRY</span>
                    <span className="text-slate-200 font-bold">{analyzedData.geo?.country || 'Unknown'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">LOCATION</span>
                    <span className="text-slate-200 font-bold truncate block">{analyzedData.geo?.city || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ISP / HOSTING</span>
                    <span className="text-slate-200 font-bold truncate block">{analyzedData.geo?.isp || 'Generic Network'}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0F172A] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ASN ROUTE</span>
                    <span className="text-cyan-400 font-bold truncate block">{analyzedData.geo?.asn || 'Private/N/A'}</span>
                  </div>
                </div>

                {/* Threat Indicators / Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-slate-400 text-[11px]">Threat Flags:</span>
                  {(analyzedData.threat_flags || []).length === 0 ? (
                    <span className="text-slate-500 italic text-[11px]">No active malicious flags</span>
                  ) : (
                    analyzedData.threat_flags.map((flag) => (
                      <span
                        key={flag}
                        className="px-2 py-0.5 rounded bg-red-950/70 text-red-300 border border-red-700/50 text-[10px] font-bold"
                      >
                        {flag}
                      </span>
                    ))
                  )}

                  {analyzedData.geo?.is_tor && (
                    <span className="px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-700/50 text-[10px] font-bold">
                      TOR EXIT NODE
                    </span>
                  )}
                  {analyzedData.geo?.is_proxy && (
                    <span className="px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-700/50 text-[10px] font-bold">
                      PUBLIC PROXY
                    </span>
                  )}
                  {analyzedData.geo?.is_vpn && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-700/50 text-[10px] font-bold">
                      ANONYMOUS VPN
                    </span>
                  )}
                </div>

                {/* Behavioral Activity in Monitored Estate */}
                <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Internal Telemetry & Behavioral Activity
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">TOTAL LOGS</span>
                      <span className="text-slate-200 font-bold text-sm">
                        {analyzedData.behavior?.total_events || 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">DROPPED / BLOCKED</span>
                      <span className="text-red-400 font-bold text-sm">
                        {analyzedData.behavior?.blocked_events || 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">FAILED LOGINS</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {analyzedData.behavior?.failed_logins || 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-[#0B1220] border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">ALLOWED SESSIONS</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        {analyzedData.behavior?.allowed_events || 0}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">TARGETED PORTS:</span>
                      <span className="text-cyan-300">
                        {(analyzedData.behavior?.targeted_ports || []).length > 0
                          ? analyzedData.behavior.targeted_ports.join(', ')
                          : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">AFFECTED DEVICES:</span>
                      <span className="text-slate-200 truncate block">
                        {(analyzedData.behavior?.targeted_devices || []).length > 0
                          ? analyzedData.behavior.targeted_devices.join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safe Recommendation */}
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20 space-y-1.5 font-sans">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Recommended Analyst Response</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {analyzedData.safe_recommendation}
                  </p>
                </div>

                {/* Associated Incidents & Alerts */}
                {analyzedData.associated_incidents?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-300 uppercase block">
                      Associated Security Incidents ({analyzedData.associated_incidents.length})
                    </span>
                    <div className="space-y-2">
                      {analyzedData.associated_incidents.map((inc) => (
                        <div
                          key={inc.incident_id}
                          className="p-3 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <Link
                              to={`/incidents/${inc.incident_id}`}
                              className="font-bold text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>{inc.incident_id}: {inc.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <span className="text-[10px] text-slate-400">Risk Score: {inc.risk_score}/100</span>
                          </div>
                          <StatusBadge status={inc.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="cyber-card p-12 text-center text-slate-500">
              Enter an IP address above to inspect its threat reputation dossier.
            </div>
          )}
        </div>

        {/* Right 1 Col: Top Suspicious IPs Leaderboard */}
        <div className="space-y-4">
          <div className="cyber-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Top Suspicious IP Rankings
                </h3>
              </div>
              <button
                onClick={fetchTopSuspicious}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTop ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5">
              {loadingTop ? (
                <div className="p-8 text-center text-slate-500">Loading rankings...</div>
              ) : topSuspicious.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No suspicious IPs recorded yet.</div>
              ) : (
                topSuspicious.map((item, idx) => (
                  <div
                    key={item.ip}
                    onClick={() => {
                      setSearchIp(item.ip);
                      handleAnalyze(item.ip);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      analyzedData?.ip === item.ip
                        ? 'bg-cyan-950/40 border-cyan-500/60'
                        : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-200">{item.ip}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getThreatScoreColor(
                          item.threat_score
                        )}`}
                      >
                        {item.threat_score} / 100
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span className="truncate">{item.country || 'Global WAN'}</span>
                      <span className="text-red-400 font-bold">
                        {item.blocked_events} drops • {item.failed_logins} fails
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ThreatIntelPage;
