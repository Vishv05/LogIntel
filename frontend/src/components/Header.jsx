import React, { useState } from 'react';
import { Activity, ShieldCheck, Zap, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { logService } from '../services/logService';

export const Header = ({ title, onRefresh }) => {
  const [injecting, setInjecting] = useState(false);
  const [injectStatus, setInjectStatus] = useState(null);

  const triggerScenario = async (scenarioType) => {
    setInjecting(true);
    setInjectStatus(null);
    try {
      let logs = [];
      const now = new Date().toISOString();

      if (scenarioType === 'bruteforce') {
        const attackerIp = '198.51.100.77';
        for (let i = 0; i < 6; i++) {
          logs.push({
            timestamp: new Date(Date.now() - (6 - i) * 3000).toISOString(),
            source_type: 'server',
            device_id: 'SRV-AUTH-LDAP-01',
            device_name: 'Active Directory / LDAP Server',
            event_type: 'LOGIN_FAILED',
            severity: 'high',
            source_ip: attackerIp,
            destination_ip: '10.0.20.5',
            source_port: 52000 + i,
            destination_port: 22,
            protocol: 'TCP',
            action: 'LOGIN_FAILURE',
            username: `admin_target_${i}`,
            message: `sshd[1420${i}]: Failed password for invalid user admin_target_${i} from ${attackerIp} port ${52000+i} ssh2`,
            metadata: { attack_vector: 'BRUTE_FORCE', attempt: i + 1 },
          });
        }
      } else if (scenarioType === 'portscan') {
        const scanIp = '185.220.101.44';
        const ports = [21, 22, 80, 443, 3389, 8080];
        ports.forEach((p, idx) => {
          logs.push({
            timestamp: new Date(Date.now() - (ports.length - idx) * 2000).toISOString(),
            source_type: 'firewall',
            device_id: 'FW-CORP-EDGE-01',
            device_name: 'Corporate Perimeter Firewall',
            event_type: 'PORT_SCAN',
            severity: 'high',
            source_ip: scanIp,
            destination_ip: '192.168.1.1',
            source_port: 61000 + idx,
            destination_port: p,
            protocol: 'TCP',
            action: 'DENY',
            message: `Port scan probe TCP SYN to port ${p} dropped by perimeter firewall ACL`,
            metadata: { scanned_port: p },
          });
        });
      } else if (scenarioType === 'cctv') {
        logs.push({
          timestamp: now,
          source_type: 'cctv',
          device_id: 'CCTV-SERVER-ROOM',
          device_name: 'Server Room 360 Camera',
          event_type: 'TAMPERING_DETECTED',
          severity: 'critical',
          source_ip: '192.168.50.102',
          destination_ip: '192.168.50.1',
          source_port: 554,
          destination_port: 554,
          protocol: 'RTSP',
          action: 'BLOCK',
          username: 'camera_agent',
          message: 'CRITICAL: Video tamper alarm triggered on Server Room 360 Camera. Optical occlusion detected.',
          metadata: { tamper_type: 'OPTICAL_OCCLUSION' },
        });
      }

      const res = await logService.ingestLogs(logs);
      setInjectStatus(`Ingested ${res.ingested_count} logs. ${res.alerts_triggered} Alert(s) generated!`);
      if (onRefresh) onRefresh();
    } catch (e) {
      setInjectStatus('Simulation error: ' + e.message);
    } finally {
      setInjecting(false);
      setTimeout(() => setInjectStatus(null), 4000);
    }
  };

  return (
    <header className="h-16 bg-[#0E1726]/90 backdrop-blur border-b border-[#1E2D4A] px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">{title}</h1>
        <p className="text-[11px] text-slate-400">Centralized Infrastructure Intelligence & Threat Monitoring</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulation Feedback Alert */}
        {injectStatus && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{injectStatus}</span>
          </div>
        )}

        {/* Live System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#17243A] border border-emerald-500/30 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>SOC ENGINE: ACTIVE</span>
        </div>

        {/* Quick Scenario Injector Button */}
        <div className="relative group">
          <button
            disabled={injecting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{injecting ? 'Injecting...' : 'Inject Attack Scenario'}</span>
          </button>

          {/* Scenario Dropdown */}
          <div className="absolute right-0 mt-2 w-56 p-2 rounded-lg bg-[#17243A] border border-cyan-500/30 shadow-2xl hidden group-hover:block z-50">
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider px-2 py-1">Threat Scenarios</p>
            <button
              onClick={() => triggerScenario('bruteforce')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-cyan-500/10 text-xs text-slate-200 hover:text-cyan-300 transition-colors flex items-center justify-between"
            >
              <span>Brute Force (SSH/LDAP)</span>
              <span className="text-[10px] text-orange-400 font-mono">Rule 1</span>
            </button>
            <button
              onClick={() => triggerScenario('portscan')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-cyan-500/10 text-xs text-slate-200 hover:text-cyan-300 transition-colors flex items-center justify-between"
            >
              <span>Network Port Scan</span>
              <span className="text-[10px] text-orange-400 font-mono">Rule 2</span>
            </button>
            <button
              onClick={() => triggerScenario('cctv')}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-cyan-500/10 text-xs text-slate-200 hover:text-cyan-300 transition-colors flex items-center justify-between"
            >
              <span>CCTV Lens Tampering</span>
              <span className="text-[10px] text-red-400 font-mono">Rule 5</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
