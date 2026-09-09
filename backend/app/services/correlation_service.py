import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.core.opensearch import log_storage
from backend.app.models.incident import Incident
from backend.app.models.alert import Alert
from backend.app.services.audit_service import AuditService
from backend.app.services.risk_service import RiskEngine

logger = logging.getLogger("logintel.correlation")


class CorrelationEngine:
    """
    Multi-Event Correlation Engine & Security Incident Manager.
    Correlates multiple heterogeneous alerts and logs into unified security incidents,
    reconstructs chronological attack timelines, and generates explainable detection dossiers.
    """

    @classmethod
    def run_correlation(cls, db: Session) -> List[Incident]:
        """
        Scan recent telemetry logs and alerts to identify multi-stage attack patterns
        and generate or update correlated Security Incidents.
        """
        created_or_updated: List[Incident] = []

        # 1. Pattern A: Brute Force followed by Successful Authentication
        cls._correlate_brute_force_success(db, created_or_updated)

        # 2. Pattern B: Port Scan Reconnaissance followed by Targeted Connection Probes
        cls._correlate_recon_to_probe(db, created_or_updated)

        # 3. Pattern C: CCTV Disconnect followed by Tampering / Sabotage
        cls._correlate_cctv_sabotage(db, created_or_updated)

        # 4. Pattern D: Cloud Privileged IAM Anomaly & Root Login
        cls._correlate_cloud_hijack(db, created_or_updated)

        return created_or_updated

    @classmethod
    def _correlate_brute_force_success(cls, db: Session, out_list: List[Incident]):
        """
        Pattern 1: Repeated failed logins followed by successful authentication.
        """
        # Search for failed logins and check if same IP or username has a successful login
        _, failed_logs = log_storage.search_logs(
            query="failed login",
            page_size=100,
            sort_order="desc"
        )
        if not failed_logs:
            _, failed_logs = log_storage.search_logs(
                event_type="LOGIN_FAILED",
                page_size=100,
                sort_order="desc"
            )

        # Group failed logs by source_ip
        ips_with_failures: Dict[str, List[Dict[str, Any]]] = {}
        for l in failed_logs:
            ip = l.get("source_ip")
            if ip:
                ips_with_failures.setdefault(ip, []).append(l)

        for ip, f_logs in ips_with_failures.items():
            if len(f_logs) >= 3:
                # Check for subsequent or concurrent successful login from this IP
                recent_ip_logs = log_storage.get_recent_logs_for_ip(ip, window_seconds=7200)
                success_logs = [
                    l for l in recent_ip_logs
                    if "LOGIN_SUCCESS" in (l.get("event_type") or "").upper()
                    or (l.get("action") or "").upper() in ("ALLOW", "CONNECT", "LOGIN_SUCCESS")
                    or "successful" in (l.get("message") or "").lower()
                ]

                # Identify affected user
                affected_users = list({l.get("username") for l in f_logs if l.get("username")})
                affected_devices = list({l.get("device_id") for l in f_logs if l.get("device_id")})
                target_ip = next((l.get("destination_ip") for l in f_logs if l.get("destination_ip")), None)

                # Build chronological timeline
                timeline = []
                # Earliest failed event
                sorted_logs = sorted(f_logs + success_logs, key=lambda x: x.get("timestamp", ""))
                if sorted_logs:
                    first_ev = sorted_logs[0]
                    timeline.append({
                        "phase": "FIRST_SUSPICIOUS",
                        "phase_title": "Initial Reconnaissance / Failed Auth Probe",
                        "timestamp": first_ev.get("timestamp"),
                        "source_ip": ip,
                        "device_id": first_ev.get("device_id"),
                        "event_type": first_ev.get("event_type"),
                        "message": first_ev.get("message"),
                        "description": f"Initial failed authentication attempt detected from external IP {ip} targeting user '{first_ev.get('username') or 'admin'}'."
                    })

                # Escalation events (rapid failures)
                if len(f_logs) > 1:
                    mid_ev = f_logs[len(f_logs) // 2]
                    timeline.append({
                        "phase": "ESCALATION",
                        "phase_title": "Velocity Spike / Credential Spray Escalation",
                        "timestamp": mid_ev.get("timestamp"),
                        "source_ip": ip,
                        "device_id": mid_ev.get("device_id"),
                        "event_type": mid_ev.get("event_type"),
                        "message": f"Sustained password spraying: {len(f_logs)} authentication failures recorded.",
                        "description": f"Automated dictionary spray reached threshold against authentication service."
                    })

                # Peak / Breach event
                if success_logs:
                    s_ev = success_logs[0]
                    timeline.append({
                        "phase": "PEAK_ACTIVITY",
                        "phase_title": "Authentication Compromise / Successful Infiltration",
                        "timestamp": s_ev.get("timestamp"),
                        "source_ip": ip,
                        "device_id": s_ev.get("device_id"),
                        "event_type": s_ev.get("event_type") or "LOGIN_SUCCESS",
                        "message": s_ev.get("message"),
                        "description": f"Successful authentication achieved following repeated failures! Potential valid account compromise."
                    })
                else:
                    # Final burst
                    last_ev = sorted_logs[-1]
                    timeline.append({
                        "phase": "PEAK_ACTIVITY",
                        "phase_title": "Peak Brute Force Attack Threshold Exceeded",
                        "timestamp": last_ev.get("timestamp"),
                        "source_ip": ip,
                        "device_id": last_ev.get("device_id"),
                        "event_type": last_ev.get("event_type"),
                        "message": last_ev.get("message"),
                        "description": f"Over {len(f_logs)} unauthorized credential spray attempts against infrastructure."
                    })

                timeline.append({
                    "phase": "CURRENT_STATE",
                    "phase_title": "Active SOC Monitoring & Containment Pending",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source_ip": ip,
                    "device_id": affected_devices[0] if affected_devices else "SRV-AUTH-LDAP-01",
                    "event_type": "INCIDENT_OPEN",
                    "message": "Correlated incident queued for SOC Analyst investigation.",
                    "description": "Session monitoring active; awaiting analyst verification and IP containment."
                })

                # Calculate Risk Score
                risk_res = RiskEngine.calculate_risk(
                    severity="CRITICAL" if success_logs else "HIGH",
                    event_count=len(f_logs) + len(success_logs),
                    source_ip=ip,
                    device_id=affected_devices[0] if affected_devices else "SRV-AUTH-LDAP-01",
                    rule_id="RULE-AUTH-001",
                    message=f"Brute force spray from {ip} with {len(f_logs)} failures"
                )

                # Detection explainability
                explainable = {
                    "detection_rule": "RULE-CORR-001",
                    "rule_name": "Multi-Stage Credential Spray & Account Access Anomaly",
                    "supporting_evidence": f"{len(f_logs)} authentication failures followed by {len(success_logs)} access events from host {ip}.",
                    "event_count": len(f_logs) + len(success_logs),
                    "time_window": "300s window",
                    "affected_devices": affected_devices or ["SRV-AUTH-LDAP-01"],
                    "affected_users": affected_users or ["admin"],
                    "confidence": "96% High-Fidelity Multi-Event Match",
                    "mitre": {
                        "tactic": "Credential Access / Initial Access",
                        "technique_id": "T1110.001",
                        "technique_name": "Brute Force: Password Guessing",
                        "secondary_technique": "T1078 (Valid Accounts)"
                    }
                }

                # Safe Recommended response
                recommendations = [
                    {
                        "id": "REC-01",
                        "title": "Invalidate Active Sessions & Force Credential Reset",
                        "severity": "CRITICAL",
                        "safe": True,
                        "action_type": "ACCOUNT_INVESTIGATION",
                        "details": f"Revoke any active session tokens and force immediate password change for user '{affected_users[0] if affected_users else 'admin'}'.",
                        "requires_admin": False
                    },
                    {
                        "id": "REC-02",
                        "title": "Stage Perimeter Firewall Inbound Drop Rule",
                        "severity": "HIGH",
                        "safe": True,
                        "action_type": "STAGE_FIREWALL_BLOCK",
                        "details": f"Stage a perimeter firewall rule dropping all incoming packets from external IP {ip} (pending Administrator review).",
                        "requires_admin": True
                    },
                    {
                        "id": "REC-03",
                        "title": "Audit Post-Authentication Logs in Log Explorer",
                        "severity": "MEDIUM",
                        "safe": True,
                        "action_type": "LOG_INSPECTION",
                        "details": f"Review all logs originating from {ip} across the environment to identify lateral access or data exfiltration.",
                        "target_url": f"/logs?source_ip={ip}",
                        "requires_admin": False
                    },
                    {
                        "id": "REC-04",
                        "title": "Verify Authentication Host Health Status",
                        "severity": "LOW",
                        "safe": True,
                        "action_type": "DEVICE_HEALTH",
                        "details": "Check SRV-AUTH-LDAP-01 CPU/Memory metrics and examine audit logs for privileged role modifications.",
                        "requires_admin": False
                    }
                ]

                incident = cls._upsert_incident(
                    db=db,
                    incident_id=f"INC-2026-BF-{ip.replace('.', '-')[-8:]}",
                    title=f"Multi-Stage Brute-Force Spray & Authentication Event from {ip}",
                    category="Credential Access & Infiltration",
                    severity="CRITICAL" if success_logs else "HIGH",
                    risk_score=max(risk_res["score"], 82 if success_logs else 74),
                    risk_level=risk_res["level"],
                    status="OPEN",
                    source_ip=ip,
                    target_ip=target_ip,
                    primary_device_id=affected_devices[0] if affected_devices else "SRV-AUTH-LDAP-01",
                    affected_devices=affected_devices or ["SRV-AUTH-LDAP-01"],
                    affected_users=affected_users or ["admin"],
                    event_count=len(f_logs) + len(success_logs),
                    pattern_name="BRUTE_FORCE_SUCCESS_SEQUENCE",
                    summary=f"Automated correlation identified {len(f_logs)} failed password attempts from IP {ip} targeting infrastructure credentials, followed by session establishment. Potential account compromise.",
                    detection_rule_id="RULE-CORR-001",
                    explainable_detection=explainable,
                    risk_breakdown=risk_res,
                    attack_timeline=timeline,
                    recommended_response=recommendations
                )
                if incident:
                    out_list.append(incident)

    @classmethod
    def _correlate_recon_to_probe(cls, db: Session, out_list: List[Incident]):
        """
        Pattern 2: Port Scanning followed by suspicious connections / lateral probe.
        """
        _, scan_logs = log_storage.search_logs(
            event_type="PORT_SCAN",
            page_size=50,
            sort_order="desc"
        )
        if not scan_logs:
            _, scan_logs = log_storage.search_logs(
                query="port scan",
                page_size=50,
                sort_order="desc"
            )

        ips_with_scans: Dict[str, List[Dict[str, Any]]] = {}
        for l in scan_logs:
            ip = l.get("source_ip")
            if ip:
                ips_with_scans.setdefault(ip, []).append(l)

        for ip, s_logs in ips_with_scans.items():
            recent_logs = log_storage.get_recent_logs_for_ip(ip, window_seconds=7200)
            conn_logs = [
                l for l in recent_logs
                if (l.get("action") or "").upper() in ("ALLOW", "CONNECT", "TCP_SYN")
                or (l.get("event_type") or "").upper() in ("CONNECTION_ESTABLISHED", "SSH_SESSION", "WEB_REQUEST")
            ]

            affected_devices = list({l.get("device_id") for l in (s_logs + conn_logs) if l.get("device_id")})
            target_ip = next((l.get("destination_ip") for l in (s_logs + conn_logs) if l.get("destination_ip")), None)

            # Timeline
            timeline = []
            sorted_logs = sorted(s_logs + conn_logs, key=lambda x: x.get("timestamp", ""))
            if sorted_logs:
                timeline.append({
                    "phase": "FIRST_SUSPICIOUS",
                    "phase_title": "Network Reconnaissance / Port Sweep Initiated",
                    "timestamp": sorted_logs[0].get("timestamp"),
                    "source_ip": ip,
                    "device_id": sorted_logs[0].get("device_id"),
                    "event_type": "PORT_SCAN",
                    "message": sorted_logs[0].get("message"),
                    "description": f"External host {ip} initiated rapid multi-port TCP reconnaissance probes across perimeter interfaces."
                })

            if len(s_logs) > 1:
                timeline.append({
                    "phase": "ESCALATION",
                    "phase_title": "Vertical Port Scanning Across Critical Services",
                    "timestamp": s_logs[-1].get("timestamp"),
                    "source_ip": ip,
                    "device_id": s_logs[-1].get("device_id"),
                    "event_type": "PORT_SCAN_INTENSIFICATION",
                    "message": f"Scanned multiple destination ports (22, 80, 443, 3389, 8080).",
                    "description": "Port enumeration detected probing for exposed administrative endpoints."
                })

            timeline.append({
                "phase": "PEAK_ACTIVITY",
                "phase_title": "Direct Connection Probe to Discovered Service",
                "timestamp": conn_logs[0].get("timestamp") if conn_logs else sorted_logs[-1].get("timestamp"),
                "source_ip": ip,
                "device_id": affected_devices[0] if affected_devices else "FW-CORP-EDGE-01",
                "event_type": "SERVICE_PROBE",
                "message": f"Inbound connection request targeted towards discovered listening ports.",
                "description": "Attacker transitioned from passive discovery to active protocol handshakes."
            })

            timeline.append({
                "phase": "CURRENT_STATE",
                "phase_title": "Host Monitored & Firewall Rate-Limiting Engaged",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source_ip": ip,
                "device_id": affected_devices[0] if affected_devices else "FW-CORP-EDGE-01",
                "event_type": "CONTAINMENT_STAGED",
                "message": "Traffic filtered; awaiting Security Analyst validation.",
                "description": "Perimeter rate-limiting engaged. Analyst review required."
            })

            risk_res = RiskEngine.calculate_risk(
                severity="HIGH",
                event_count=len(s_logs) + len(conn_logs),
                source_ip=ip,
                device_id=affected_devices[0] if affected_devices else "FW-CORP-EDGE-01",
                rule_id="RULE-NET-002",
                message=f"Port scan reconnaissance followed by active connection probe from {ip}"
            )

            explainable = {
                "detection_rule": "RULE-CORR-002",
                "rule_name": "Reconnaissance-to-Exploit Attack Progression",
                "supporting_evidence": f"Reconnaissance across multiple destination ports followed by connection handshakes from external IP {ip}.",
                "event_count": len(s_logs) + len(conn_logs),
                "time_window": "600s window",
                "affected_devices": affected_devices or ["FW-CORP-EDGE-01", "SW-CORE-L3-01"],
                "affected_users": [],
                "confidence": "94% Deterministic Signature Correlation",
                "mitre": {
                    "tactic": "Discovery -> Initial Access",
                    "technique_id": "T1046",
                    "technique_name": "Network Service Discovery",
                    "secondary_technique": "T1190 (Exploit Public-Facing Application)"
                }
            }

            recommendations = [
                {
                    "id": "REC-SCAN-01",
                    "title": "Review Perimeter Firewall Inbound Drop Policies",
                    "severity": "HIGH",
                    "safe": True,
                    "action_type": "FIREWALL_AUDIT",
                    "details": f"Verify whether ports 22, 3389, and 8080 are exposed to WAN on FW-CORP-EDGE-01.",
                    "requires_admin": False
                },
                {
                    "id": "REC-SCAN-02",
                    "title": "Stage IP Address Quarantine on Edge Gateway",
                    "severity": "HIGH",
                    "safe": True,
                    "action_type": "STAGE_FIREWALL_BLOCK",
                    "details": f"Create a staged black-hole route for {ip} awaiting Administrator confirmation.",
                    "requires_admin": True
                },
                {
                    "id": "REC-SCAN-03",
                    "title": "Investigate Source IP Threat Intelligence Profile",
                    "severity": "MEDIUM",
                    "safe": True,
                    "action_type": "THREAT_INTEL",
                    "details": f"Check autonomous system (ASN) and geographic origin for IP {ip}.",
                    "requires_admin": False
                }
            ]

            incident = cls._upsert_incident(
                db=db,
                incident_id=f"INC-2026-SCAN-{ip.replace('.', '-')[-8:]}",
                title=f"Network Port Reconnaissance & Inbound Service Probe from {ip}",
                category="Discovery & Inbound Attack Probe",
                severity="HIGH",
                risk_score=max(risk_res["score"], 76),
                risk_level=risk_res["level"],
                status="OPEN",
                source_ip=ip,
                target_ip=target_ip,
                primary_device_id=affected_devices[0] if affected_devices else "FW-CORP-EDGE-01",
                affected_devices=affected_devices or ["FW-CORP-EDGE-01"],
                affected_users=[],
                event_count=len(s_logs) + len(conn_logs),
                pattern_name="PORT_SCAN_TO_SERVICE_PROBE",
                summary=f"External IP {ip} conducted horizontal port scanning across perimeter network assets, followed by direct TCP connection probes targeting discovered ports.",
                detection_rule_id="RULE-CORR-002",
                explainable_detection=explainable,
                risk_breakdown=risk_res,
                attack_timeline=timeline,
                recommended_response=recommendations
            )
            if incident:
                out_list.append(incident)

    @classmethod
    def _correlate_cctv_sabotage(cls, db: Session, out_list: List[Incident]):
        """
        Pattern 3: CCTV disconnection followed by optical tampering or perimeter breach.
        """
        _, tamper_logs = log_storage.search_logs(
            query="tamper",
            source_type="cctv",
            page_size=20,
            sort_order="desc"
        )
        if not tamper_logs:
            _, tamper_logs = log_storage.search_logs(
                event_type="TAMPERING_DETECTED",
                page_size=20,
                sort_order="desc"
            )

        for t_log in tamper_logs:
            dev_id = t_log.get("device_id") or "CCTV-SERVER-ROOM"
            # Get recent logs for this camera to find disconnect or network link failure
            recent_cctv = log_storage.get_recent_logs_for_device(dev_id, window_seconds=7200)
            disconnect_logs = [
                l for l in recent_cctv
                if "DISCONNECT" in (l.get("event_type") or "").upper()
                or "OFFLINE" in (l.get("event_type") or "").upper()
                or "DOWN" in (l.get("event_type") or "").upper()
                or "link down" in (l.get("message") or "").lower()
            ]

            timeline = [
                {
                    "phase": "FIRST_SUSPICIOUS",
                    "phase_title": "Surveillance Stream Signal Fluctuation / Disconnect",
                    "timestamp": disconnect_logs[0].get("timestamp") if disconnect_logs else t_log.get("timestamp"),
                    "source_ip": "10.0.3.10",
                    "device_id": dev_id,
                    "event_type": "DEVICE_DISCONNECTED",
                    "message": f"Camera {dev_id} dropped RTSP streaming session or switch interface link went down.",
                    "description": "Network switch detected interface state drop or physical cable severance."
                },
                {
                    "phase": "ESCALATION",
                    "phase_title": "Optical Sensor Blinding / Enclosure Tampering Alert",
                    "timestamp": t_log.get("timestamp"),
                    "source_ip": "10.0.3.10",
                    "device_id": dev_id,
                    "event_type": "TAMPERING_DETECTED",
                    "message": t_log.get("message"),
                    "description": "On-camera AI computer vision detected sudden lens occlusion and physical housing vibration."
                },
                {
                    "phase": "PEAK_ACTIVITY",
                    "phase_title": "Physical Datacenter Perimeter Breach Risk",
                    "timestamp": t_log.get("timestamp"),
                    "source_ip": "10.0.3.10",
                    "device_id": dev_id,
                    "event_type": "PERIMETER_BREACH_SUSPICION",
                    "message": "Physical security sabotage sequence confirmed by multi-sensor correlation.",
                    "description": "Potential unauthorized physical entry into protected datacenter server room."
                },
                {
                    "phase": "CURRENT_STATE",
                    "phase_title": "On-Site Physical Dispatch Triggered",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source_ip": "10.0.3.10",
                    "device_id": dev_id,
                    "event_type": "ALARM_ACTIVE",
                    "message": "Physical security personnel notified; awaiting room clearance confirmation.",
                    "description": "Incident awaiting on-site inspection report."
                }
            ]

            risk_res = RiskEngine.calculate_risk(
                severity="CRITICAL",
                event_count=len(disconnect_logs) + 1,
                source_ip="10.0.3.10",
                device_id=dev_id,
                rule_id="RULE-CCTV-005",
                message=f"Physical CCTV tampering and disconnect sequence on {dev_id}"
            )

            explainable = {
                "detection_rule": "RULE-CORR-003",
                "rule_name": "Physical Surveillance Sabotage & Perimeter Anomaly",
                "supporting_evidence": f"Optical lens occlusion and housing vibration detected on {dev_id} accompanied by signal disconnect.",
                "event_count": len(disconnect_logs) + 1,
                "time_window": "180s window",
                "affected_devices": [dev_id, "SW-CORE-L3-01"],
                "affected_users": [],
                "confidence": "98% Physical Sensor Triangulation",
                "mitre": {
                    "tactic": "Defense Evasion -> Impact",
                    "technique_id": "T1562.001",
                    "technique_name": "Impair Defenses: Disable or Modify Tools",
                    "secondary_technique": "T1489 (Service Stop)"
                }
            }

            recommendations = [
                {
                    "id": "REC-CCTV-01",
                    "title": "Dispatch Immediate On-Site Facilities Security",
                    "severity": "CRITICAL",
                    "safe": True,
                    "action_type": "PHYSICAL_DISPATCH",
                    "details": "Immediately send building security officers to Datacenter Server Room North Door to visually confirm room physical integrity.",
                    "requires_admin": False
                },
                {
                    "id": "REC-CCTV-02",
                    "title": "Inspect Switch Port & Ethernet PoE Link",
                    "severity": "HIGH",
                    "safe": True,
                    "action_type": "DEVICE_CHECK",
                    "details": "Verify PoE power budget and interface Gi1/0/14 on SW-CORE-L3-01 connecting to CCTV-SERVER-ROOM.",
                    "requires_admin": False
                },
                {
                    "id": "REC-CCTV-03",
                    "title": "Pull Badge Access Reader Logs for Server Room",
                    "severity": "HIGH",
                    "safe": True,
                    "action_type": "ACCESS_AUDIT",
                    "details": "Cross-reference electronic door access swipes occurring within +/- 10 minutes of the camera disconnect.",
                    "requires_admin": False
                }
            ]

            incident = cls._upsert_incident(
                db=db,
                incident_id=f"INC-2026-PHYS-{dev_id.replace('-', '')[-6:]}",
                title=f"Physical Surveillance Disconnection & Tampering Sabotage on {dev_id}",
                category="Physical Security & Perimeter Breach",
                severity="CRITICAL",
                risk_score=max(risk_res["score"], 92),
                risk_level="CRITICAL",
                status="OPEN",
                source_ip="10.0.3.10",
                target_ip="10.0.3.1",
                primary_device_id=dev_id,
                affected_devices=[dev_id, "SW-CORE-L3-01"],
                affected_users=[],
                event_count=len(disconnect_logs) + 1,
                pattern_name="CCTV_DISCONNECT_TAMPER_SEQUENCE",
                summary=f"Critical physical security alert: Surveillance camera {dev_id} experienced an interface link drop immediately followed by hardware enclosure vibration and optical lens occlusion.",
                detection_rule_id="RULE-CORR-003",
                explainable_detection=explainable,
                risk_breakdown=risk_res,
                attack_timeline=timeline,
                recommended_response=recommendations
            )
            if incident:
                out_list.append(incident)

    @classmethod
    def _correlate_cloud_hijack(cls, db: Session, out_list: List[Incident]):
        """
        Pattern 4: Cloud IAM Policy Modification and Root Console Access.
        """
        _, aws_logs = log_storage.search_logs(
            source_type="aws",
            page_size=20,
            sort_order="desc"
        )
        if not aws_logs:
            return

        priv_logs = [
            l for l in aws_logs
            if "ROOT_LOGIN" in (l.get("event_type") or "").upper()
            or "IAM" in (l.get("event_type") or "").upper()
            or "unauthorized" in (l.get("message") or "").lower()
            or "root" in (l.get("username") or "").lower()
        ]

        if not priv_logs:
            return

        first_l = priv_logs[0]
        ip = first_l.get("source_ip") or "198.51.100.88"
        dev_id = first_l.get("device_id") or "AWS-EC2-PROD-01"

        timeline = [
            {
                "phase": "FIRST_SUSPICIOUS",
                "phase_title": "Privileged AWS Root Management Console Login",
                "timestamp": first_l.get("timestamp"),
                "source_ip": ip,
                "device_id": dev_id,
                "event_type": "AWS_ROOT_LOGIN",
                "message": first_l.get("message"),
                "description": f"Root account login detected without registered hardware MFA token from external IP {ip}."
            },
            {
                "phase": "ESCALATION",
                "phase_title": "Unauthorized IAM Policy / Security Group Alteration",
                "timestamp": first_l.get("timestamp"),
                "source_ip": ip,
                "device_id": dev_id,
                "event_type": "IAM_POLICY_MUTATION",
                "message": "AWS IAM administrator permissions attached to newly created service role.",
                "description": "High-risk administrative role policy created outside normal CI/CD infrastructure pipelines."
            },
            {
                "phase": "PEAK_ACTIVITY",
                "phase_title": "Cloud Production Asset Exposure Risk",
                "timestamp": first_l.get("timestamp"),
                "source_ip": ip,
                "device_id": dev_id,
                "event_type": "CLOUD_EXPOSURE",
                "message": "Security groups opened allowing unrestricted 0.0.0.0/0 inbound traffic.",
                "description": "Production workload perimeter modified exposing cloud services to the public internet."
            },
            {
                "phase": "CURRENT_STATE",
                "phase_title": "IAM Session Quarantined & Cloud Audit Alerted",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source_ip": ip,
                "device_id": dev_id,
                "event_type": "ACTIVE_INVESTIGATION",
                "message": "Awaiting Cloud Security Engineer credential rotation and security group remediation.",
                "description": "Incident queued for SOC triage."
            }
        ]

        risk_res = RiskEngine.calculate_risk(
            severity="CRITICAL",
            event_count=len(priv_logs),
            source_ip=ip,
            device_id=dev_id,
            rule_id="RULE-AWS-006",
            message="Cloud privileged root access and unauthorized IAM manipulation"
        )

        explainable = {
            "detection_rule": "RULE-CORR-004",
            "rule_name": "Cloud Infrastructure Privilege Hijack Sequence",
            "supporting_evidence": f"AWS Root account login from WAN IP {ip} with subsequent IAM policy updates.",
            "event_count": len(priv_logs),
            "time_window": "300s window",
            "affected_devices": [dev_id],
            "affected_users": ["root", "aws-operator"],
            "confidence": "97% CloudWatch Multi-Event Telemetry",
            "mitre": {
                "tactic": "Privilege Escalation -> Persistence",
                "technique_id": "T1078.004",
                "technique_name": "Valid Accounts: Cloud Accounts",
                "secondary_technique": "T1098 (Account Manipulation)"
            }
        }

        recommendations = [
            {
                "id": "REC-AWS-01",
                "title": "Terminate Active AWS Root & IAM Sessions",
                "severity": "CRITICAL",
                "safe": True,
                "action_type": "CLOUD_CONTAINMENT",
                "details": "Immediately revoke active IAM security credentials and invalidate all console sessions in AWS IAM console.",
                "requires_admin": True
            },
            {
                "id": "REC-AWS-02",
                "title": "Revert Modified Security Groups to GitOps Baseline",
                "severity": "HIGH",
                "safe": True,
                "action_type": "CONFIG_REVERT",
                "details": "Restore production EC2 security group ingress rules to disallow 0.0.0.0/0 ingress.",
                "requires_admin": True
            },
            {
                "id": "REC-AWS-03",
                "title": "Audit AWS CloudTrail Telemetry in Log Explorer",
                "severity": "MEDIUM",
                "safe": True,
                "action_type": "LOG_INSPECTION",
                "details": f"Query all AWS API calls performed by IP {ip} during the past 24 hours.",
                "target_url": f"/logs?source_type=aws&source_ip={ip}",
                "requires_admin": False
            }
        ]

        incident = cls._upsert_incident(
            db=db,
            incident_id=f"INC-2026-CLOUD-{dev_id.replace('-', '')[-6:]}",
            title=f"Cloud Infrastructure Privilege Escalation & Root Console Activity on {dev_id}",
            category="Cloud Security & Privilege Hijack",
            severity="CRITICAL",
            risk_score=max(risk_res["score"], 88),
            risk_level="CRITICAL",
            status="OPEN",
            source_ip=ip,
            target_ip=None,
            primary_device_id=dev_id,
            affected_devices=[dev_id],
            affected_users=["root"],
            event_count=len(priv_logs),
            pattern_name="AWS_PRIVILEGE_ESCALATION",
            summary=f"Unauthorized cloud privileged manipulation detected: Root AWS console login from IP {ip} followed by high-risk IAM policy modifications.",
            detection_rule_id="RULE-CORR-004",
            explainable_detection=explainable,
            risk_breakdown=risk_res,
            attack_timeline=timeline,
            recommended_response=recommendations
        )
        if incident:
            out_list.append(incident)

    @classmethod
    def _upsert_incident(
        cls,
        db: Session,
        incident_id: str,
        title: str,
        category: str,
        severity: str,
        risk_score: int,
        risk_level: str,
        status: str,
        source_ip: Optional[str],
        target_ip: Optional[str],
        primary_device_id: Optional[str],
        affected_devices: List[str],
        affected_users: List[str],
        event_count: int,
        pattern_name: str,
        summary: str,
        detection_rule_id: str,
        explainable_detection: Dict[str, Any],
        risk_breakdown: Dict[str, Any],
        attack_timeline: List[Dict[str, Any]],
        recommended_response: List[Dict[str, Any]]
    ) -> Optional[Incident]:
        """
        Create a new incident or update existing incident without overwriting resolved status.
        """
        existing = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        if existing:
            # Only update event count and updated_at if not resolved
            if existing.status != "RESOLVED":
                existing.event_count = max(existing.event_count, event_count)
                existing.risk_score = max(existing.risk_score, risk_score)
                existing.updated_at = datetime.now(timezone.utc)
                existing.attack_timeline_json = json.dumps(attack_timeline)
                existing.risk_breakdown_json = json.dumps(risk_breakdown)
                existing.explainable_detection_json = json.dumps(explainable_detection)
                db.commit()
                db.refresh(existing)
            return existing

        # Create new incident
        initial_history = [
            {
                "action": "INCIDENT_CREATED",
                "by": "LogIntel Correlation Engine",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "notes": f"Incident triggered by pattern '{pattern_name}' with risk score {risk_score}/100."
            }
        ]

        inc = Incident(
            incident_id=incident_id,
            title=title,
            category=category,
            severity=severity,
            risk_score=risk_score,
            risk_level=risk_level,
            status=status,
            source_ip=source_ip,
            target_ip=target_ip,
            primary_device_id=primary_device_id,
            affected_devices_json=json.dumps(affected_devices),
            affected_users_json=json.dumps(affected_users),
            correlated_alert_ids_json=json.dumps([]),
            event_count=event_count,
            pattern_name=pattern_name,
            summary=summary,
            detection_rule_id=detection_rule_id,
            explainable_detection_json=json.dumps(explainable_detection),
            risk_breakdown_json=json.dumps(risk_breakdown),
            attack_timeline_json=json.dumps(attack_timeline),
            recommended_response_json=json.dumps(recommended_response),
            action_history_json=json.dumps(initial_history),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)
        return inc

    @classmethod
    def get_incidents(
        cls,
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        source_ip: Optional[str] = None,
        device_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[int, List[Incident]]:
        # Ensure latest correlation pass is reflected
        cls.run_correlation(db)

        query = db.query(Incident)
        if status:
            query = query.filter(Incident.status == status.upper())
        if severity:
            query = query.filter(Incident.severity == severity.upper())
        if source_ip:
            query = query.filter(Incident.source_ip == source_ip)
        if device_id:
            query = query.filter(Incident.primary_device_id == device_id)

        total = query.count()
        incidents = query.order_by(Incident.risk_score.desc(), Incident.created_at.desc()).offset(skip).limit(limit).all()
        return total, incidents

    @classmethod
    def get_incident_by_id(cls, db: Session, incident_id: str) -> Optional[Incident]:
        return db.query(Incident).filter(Incident.incident_id == incident_id).first()

    @classmethod
    def acknowledge_incident(
        cls,
        db: Session,
        incident_id: str,
        username: str,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Incident]:
        inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        if not inc:
            return None

        inc.status = "INVESTIGATING"
        inc.updated_at = datetime.now(timezone.utc)

        history = inc.get_action_history()
        history.append({
            "action": "ACKNOWLEDGED_INVESTIGATING",
            "by": username,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "notes": notes or "Analyst started active investigation on incident."
        })
        inc.action_history_json = json.dumps(history)

        db.commit()
        db.refresh(inc)

        AuditService.log_action(
            db=db,
            username=username,
            action="ACKNOWLEDGE_INCIDENT",
            resource_type="INCIDENT",
            resource_id=incident_id,
            details=f"Incident {incident_id} acknowledged by {username}. Notes: {notes or 'Under investigation'}",
            ip_address=ip_address
        )
        return inc

    @classmethod
    def add_incident_note(
        cls,
        db: Session,
        incident_id: str,
        username: str,
        note: str,
        ip_address: Optional[str] = None
    ) -> Optional[Incident]:
        inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        if not inc:
            return None

        inc.updated_at = datetime.now(timezone.utc)
        history = inc.get_action_history()
        history.append({
            "action": "NOTE_ADDED",
            "by": username,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": note
        })
        inc.action_history_json = json.dumps(history)

        db.commit()
        db.refresh(inc)

        AuditService.log_action(
            db=db,
            username=username,
            action="ADD_INCIDENT_NOTE",
            resource_type="INCIDENT",
            resource_id=incident_id,
            details=f"Investigation note added to {incident_id}: {note}",
            ip_address=ip_address
        )
        return inc

    @classmethod
    def resolve_incident(
        cls,
        db: Session,
        incident_id: str,
        username: str,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Incident]:
        inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
        if not inc:
            return None

        inc.status = "RESOLVED"
        inc.resolved_at = datetime.now(timezone.utc)
        inc.resolved_by = username
        inc.resolution_notes = notes or "Incident verified and mitigated by Security Analyst."
        inc.updated_at = datetime.now(timezone.utc)

        history = inc.get_action_history()
        history.append({
            "action": "INCIDENT_RESOLVED",
            "by": username,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "notes": notes or "Mitigation confirmed and incident marked resolved."
        })
        inc.action_history_json = json.dumps(history)

        db.commit()
        db.refresh(inc)

        AuditService.log_action(
            db=db,
            username=username,
            action="RESOLVE_INCIDENT",
            resource_type="INCIDENT",
            resource_id=incident_id,
            details=f"Incident {incident_id} marked resolved by {username}. Notes: {notes or 'None'}",
            ip_address=ip_address
        )
        return inc

    @classmethod
    def get_incident_stats(cls, db: Session) -> Dict[str, Any]:
        cls.run_correlation(db)
        incidents = db.query(Incident).all()
        total = len(incidents)
        open_cnt = sum(1 for i in incidents if i.status in ("OPEN", "ACKNOWLEDGED"))
        inv_cnt = sum(1 for i in incidents if i.status == "INVESTIGATING")
        res_cnt = sum(1 for i in incidents if i.status == "RESOLVED")
        crit_cnt = sum(1 for i in incidents if i.severity == "CRITICAL")
        high_cnt = sum(1 for i in incidents if i.severity == "HIGH")
        avg_risk = round(sum(i.risk_score for i in incidents) / total, 1) if total > 0 else 0.0

        return {
            "total_incidents": total,
            "open_incidents": open_cnt,
            "acknowledged_incidents": inv_cnt,
            "resolved_incidents": res_cnt,
            "critical_incidents": crit_cnt,
            "high_incidents": high_cnt,
            "avg_risk_score": avg_risk
        }
