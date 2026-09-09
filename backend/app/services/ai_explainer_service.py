from typing import Any, Dict, List, Optional
from backend.app.services.risk_service import RiskEngine


class AIExplainerService:
    """
    AI-Assisted SOC Log & Incident Explainer Service.
    Converts raw technical telemetry, system anomalies, and correlated multi-event incidents
    into human-understandable, explainable SOC intelligence dossiers.
    """

    @classmethod
    def explain_log(cls, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Produce a clear, explainable SOC assessment for a single log event.
        """
        source_type = (log_data.get("source_type") or "system").lower()
        event_type = (log_data.get("event_type") or "UNKNOWN").upper()
        action = (log_data.get("action") or "").upper()
        severity = (log_data.get("severity") or "info").lower()
        source_ip = log_data.get("source_ip") or "Internal Host"
        destination_ip = log_data.get("destination_ip") or "Local Service"
        dest_port = log_data.get("destination_port")
        protocol = log_data.get("protocol") or "TCP"
        username = log_data.get("username")
        device_id = log_data.get("device_id") or "Network Device"
        message = log_data.get("message") or ""

        # Default classification
        mitre_info = RiskEngine.get_mitre_info(None, event_type)
        is_suspicious = severity in ("high", "critical") or action in ("DENY", "BLOCK", "LOGIN_FAILURE")

        # Scenario 1: Authentication Failure / Password Guessing
        if "LOGIN_FAILED" in event_type or action == "LOGIN_FAILURE" or "failed login" in message.lower():
            what_happened = (
                f"An authentication request was rejected by {device_id} for user account '{username or 'unknown'}' "
                f"originating from IP address {source_ip} via {protocol}."
            )
            why_suspicious = (
                f"Repeated or single failed credential handshakes can signify automated dictionary spray, "
                f"credential stuffing, or brute force enumeration attempting to gain unauthorized initial access."
            )
            affected_systems = [
                f"Identity Server / LDAP: {device_id}",
                f"Target Account: {username or 'System Users'}",
                f"Perimeter Gateway: {source_ip}"
            ]
            next_steps = [
                "Verify whether the user account is actively locked or experiencing multiple concurrent login attempts.",
                f"Query Log Explorer for all recent connections originating from source IP {source_ip}.",
                "Check whether the user is an authorized internal employee or connecting from an unapproved geographic location.",
                "If multiple distinct usernames are being targeted from the same IP, consider staging an IP perimeter block."
            ]
            confidence = "92% (Deterministic Authentication Telemetry)"
            mitre_id = "T1110.001"
            mitre_name = "Brute Force: Password Guessing"
            tactic = "Credential Access"

        # Scenario 2: Port Scanning / Discovery
        elif "PORT_SCAN" in event_type or ("scan" in message.lower() and action in ("DENY", "BLOCK")):
            what_happened = (
                f"The perimeter firewall on {device_id} recorded rapid successive connection packets "
                f"from {source_ip} probing port {dest_port or 'multiple ports'} ({protocol})."
            )
            why_suspicious = (
                f"Automated port scanning is an early-stage reconnaissance technique used by threat actors "
                f"to discover open listening services, identify vulnerable software banners, and map internal topology."
            )
            affected_systems = [
                f"Perimeter Firewall: {device_id}",
                f"Protected IP Range: {destination_ip}",
                f"Inspected Port: {dest_port or 'Multiple TCP/UDP Services'}"
            ]
            next_steps = [
                f"Inspect the destination port {dest_port or 'targets'} to ensure no sensitive administrative services (SSH, RDP, Web Admin) are exposed to public WAN.",
                f"Examine threat intelligence reputation for {source_ip} to identify known Shodan/Censys scanners or malicious botnets.",
                "Verify that perimeter firewall drop rules are actively suppressing inbound connections.",
                "Review intrusion prevention system (IPS) signatures for subsequent exploit payloads."
            ]
            confidence = "94% (Reconnaissance Pattern)"
            mitre_id = "T1046"
            mitre_name = "Network Service Discovery"
            tactic = "Discovery"

        # Scenario 3: CCTV Camera Tampering / Optical Occlusion
        elif "TAMPER" in event_type or source_type == "cctv" or "tamper" in message.lower():
            what_happened = (
                f"Surveillance device {device_id} registered a sensor event: '{message}'. "
                f"Possible optical lens occlusion, spray paint blinding, or physical camera displacement."
            )
            why_suspicious = (
                "Physical security surveillance cameras in restricted areas (e.g. Server Rooms, North Entrances) "
                "are primary targets for physical defense evasion prior to unauthorized facility entry or hardware theft."
            )
            affected_systems = [
                f"Surveillance Camera: {device_id}",
                "Datacenter Physical Enclosure / Server Room",
                "Perimeter Access Control System"
            ]
            next_steps = [
                f"Dispatch on-site physical facilities security to inspect the physical mounting and lens of camera {device_id}.",
                "Check adjacent corridor cameras to observe whether personnel were present in the immediate vicinity.",
                "Review electronic badge reader logs for doors adjacent to the camera location.",
                "Verify video management system (VMS) health to rule out optical lens focus error or IR sensor failure."
            ]
            confidence = "97% (Hardware Diagnostic & Vision Telemetry)"
            mitre_id = "T1562.001"
            mitre_name = "Impair Defenses: Disable or Modify Tools"
            tactic = "Defense Evasion"

        # Scenario 4: AWS / Cloud Privileged Activity
        elif source_type == "aws" or "ROOT" in event_type or "IAM" in event_type:
            what_happened = (
                f"A cloud security management event was logged in AWS CloudWatch for resource {device_id}: "
                f"'{message}' by identity '{username or 'root'}'."
            )
            why_suspicious = (
                "Cloud Root credentials and out-of-band IAM policy modifications bypass standard GitOps / CI/CD pipelines, "
                "often indicating either accidental administrative misconfiguration or compromised AWS API access keys."
            )
            affected_systems = [
                f"Cloud Asset: {device_id}",
                f"IAM Identity: {username or 'root'}",
                "AWS Management Console / Production VPC"
            ]
            next_steps = [
                f"Verify whether the login from {source_ip} was authorized by the cloud infrastructure team.",
                "Confirm that multi-factor authentication (MFA) was successfully passed during the session.",
                "Review AWS CloudTrail logs for unexpected IAM user creation, policy changes, or S3 bucket policy updates.",
                "Immediately revoke active access keys if the origin IP cannot be tied to a corporate VPN egress."
            ]
            confidence = "95% (Cloud Provider Audit Telemetry)"
            mitre_id = "T1078.004"
            mitre_name = "Valid Accounts: Cloud Accounts"
            tactic = "Privilege Escalation"

        # Scenario 5: Network Switch Interface Disconnect
        elif "INTERFACE_DOWN" in event_type or "DEVICE_OFFLINE" in event_type or "DISCONNECT" in event_type:
            what_happened = (
                f"Infrastructure asset {device_id} reported an interface state transition: {message}. "
                f"Network port dropped offline."
            )
            why_suspicious = (
                "Unexpected interface disconnects on core switches or surveillance devices can indicate physical cable severance, "
                "switch port flapping, local power interruption, or intentional network isolation."
            )
            affected_systems = [
                f"Network Switch / Host: {device_id}",
                "Attached Downstream Devices & Endpoints"
            ]
            next_steps = [
                f"Check interface transceiver and link status on switch {device_id}.",
                "Determine if downstream servers or cameras are in an unreachable state.",
                "Review network topology maps for failover redundancy.",
                "Check for concurrent power outage or UPS notifications."
            ]
            confidence = "90% (Network Operational Telemetry)"
            mitre_id = "T1489"
            mitre_name = "Service Stop"
            tactic = "Impact"

        # General / Baseline Event
        else:
            what_happened = (
                f"An event of type '{event_type}' was logged by {device_id} ({source_type}): {message}."
            )
            why_suspicious = (
                "This event represents operational infrastructure telemetry. "
                "While not inherently malicious by itself, it provides contextual baseline data when correlated with adjacent security alerts."
                if not is_suspicious else
                f"The event exhibits a {severity.upper()} severity level with action '{action}', indicating potential policy violation or abnormal traffic."
            )
            affected_systems = [
                f"Source Host: {source_ip}",
                f"Destination Host: {destination_ip}",
                f"Device: {device_id}"
            ]
            next_steps = [
                f"Examine related logs within +/- 15 minutes of {log_data.get('timestamp')}.",
                f"Check if source IP {source_ip} appears in threat intelligence databases.",
                "Verify whether this traffic corresponds to a scheduled maintenance or automated batch task."
            ]
            confidence = "85% (Heuristic Telemetry Evaluation)"
            mitre_id = mitre_info.get("technique_id", "T1000") if mitre_info else "T1000"
            mitre_name = mitre_info.get("technique_name", "General Telemetry") if mitre_info else "General Telemetry"
            tactic = mitre_info.get("tactic", "Execution") if mitre_info else "Execution"

        return {
            "log_id": log_data.get("id"),
            "headline": f"AI SOC Assessment: {event_type} on {device_id}",
            "what_happened": what_happened,
            "why_suspicious": why_suspicious,
            "affected_systems": affected_systems,
            "recommended_next_steps": next_steps,
            "mitre": {
                "tactic": tactic,
                "technique_id": mitre_id,
                "technique_name": mitre_name
            },
            "confidence": confidence,
            "disclaimer": "AI-assisted SOC intelligence. Use as decision support alongside manual analyst validation."
        }

    @classmethod
    def explain_incident(cls, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Produce an executive AI briefing for an entire correlated Security Incident.
        """
        category = incident_data.get("category") or "Security Incident"
        title = incident_data.get("title") or "Correlated Threat Incident"
        severity = incident_data.get("severity") or "HIGH"
        risk_score = incident_data.get("risk_score") or 70
        source_ip = incident_data.get("source_ip") or "Unknown External Origin"
        devices = incident_data.get("affected_devices") or []
        event_count = incident_data.get("event_count") or 1
        summary = incident_data.get("summary") or ""

        what_happened = (
            f"LogIntel Correlation Engine linked {event_count} heterogeneous events into a unified security incident: '{title}'. "
            f"{summary}"
        )

        why_suspicious = (
            f"Unlike isolated alerts, this incident demonstrates a multi-phase attack trajectory with an aggregated risk score of {risk_score}/100 ({severity}). "
            f"The progression exhibits deliberate intent, escalating from reconnaissance/probing into active compromise attempts against infrastructure targets."
        )

        affected_assets = [
            f"Attacking / Source IP: {source_ip}",
            f"Affected Infrastructure Assets: {', '.join(devices) if devices else 'Perimeter & Internal Servers'}",
            f"Threat Category: {category}"
        ]

        next_steps = [
            "Review the chronological Attack Timeline to inspect the exact transition from initial probe to peak exploit activity.",
            "Verify whether any credentials or assets were compromised before applying mitigation playbooks.",
            f"Execute safe containment actions: verify asset health, check active user sessions, and stage perimeter firewall rule if needed.",
            "Attach analyst investigation findings to the Incident Action History and mark resolved once verified."
        ]

        return {
            "incident_id": incident_data.get("incident_id"),
            "executive_briefing": f"Executive Incident Dossier: {title} (Risk {risk_score}/100)",
            "what_happened": what_happened,
            "why_suspicious": why_suspicious,
            "affected_systems": affected_assets,
            "recommended_next_steps": next_steps,
            "confidence": "96% Correlated Telemetry Synthesis",
            "disclaimer": "AI SOC Analyst decision support. Human approval is required for all enforcement operations."
        }
