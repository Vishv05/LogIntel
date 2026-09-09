import re
from typing import Any, Dict, List, Optional


class RiskEngine:
    """
    Dynamic Risk Scoring & Threat Explainability Engine.
    Assigns a dynamic risk score from 0-100 to alerts and incidents based on:
    - Base Threat Severity
    - Attack Velocity & Event Frequency
    - Asset Criticality
    - Source IP Threat Behavior & Provenance
    - Impact & MITRE ATT&CK Classification
    """

    CRITICAL_ASSETS = {
        "SRV-AUTH-LDAP-01": {"tier": "Tier-1 Identity Core", "points": 20, "desc": "Active Directory / LDAP Authentication Server"},
        "AWS-EC2-PROD-01": {"tier": "Tier-1 Cloud Production", "points": 20, "desc": "AWS Production Web App & IAM Cluster"},
        "CCTV-SERVER-ROOM": {"tier": "Tier-1 Physical Security", "points": 18, "desc": "Server Room Datacenter Surveillance Camera"},
        "FW-CORP-EDGE-01": {"tier": "Tier-2 Network Perimeter", "points": 15, "desc": "Corporate Edge Perimeter Firewall"},
        "SW-CORE-L3-01": {"tier": "Tier-2 Core Switch", "points": 12, "desc": "Core Layer-3 Infrastructure Switch"},
    }

    MITRE_ATTACK_MAPPINGS = {
        "RULE-AUTH-001": {
            "technique_id": "T1110.001",
            "technique_name": "Password Guessing / Brute Force",
            "tactic": "Credential Access",
            "sub_technique": "Multi-attempt automated password spraying"
        },
        "RULE-NET-002": {
            "technique_id": "T1046",
            "technique_name": "Network Service Discovery",
            "tactic": "Discovery",
            "sub_technique": "Port scanning across multiple destination ports"
        },
        "RULE-NET-003": {
            "technique_id": "T1498",
            "technique_name": "Network Denial of Service",
            "tactic": "Impact",
            "sub_technique": "Excessive connection attempts triggering perimeter firewall drops"
        },
        "RULE-DEV-004": {
            "technique_id": "T1489",
            "technique_name": "Service Stop / Infrastructure Tampering",
            "tactic": "Impact",
            "sub_technique": "Device connection failure or unexpected offline state"
        },
        "RULE-CCTV-005": {
            "technique_id": "T1562.001",
            "technique_name": "Impair Defenses: Disable or Modify Tools",
            "tactic": "Defense Evasion",
            "sub_technique": "Physical video occlusion or optical sensor blinding"
        },
        "RULE-AWS-006": {
            "technique_id": "T1078.004",
            "technique_name": "Valid Accounts: Cloud Accounts",
            "tactic": "Privilege Escalation",
            "sub_technique": "Privileged IAM manipulation or root credentials usage"
        }
    }

    @classmethod
    def calculate_risk(
        cls,
        severity: str,
        event_count: int = 1,
        source_ip: Optional[str] = None,
        device_id: Optional[str] = None,
        rule_id: Optional[str] = None,
        event_type: Optional[str] = None,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dynamically compute a risk score (0-100) with a comprehensive breakdown of scoring factors.
        """
        score = 0
        factors: List[Dict[str, Any]] = []

        # 1. Base Severity Factor
        sev = (severity or "MEDIUM").upper()
        if sev == "CRITICAL":
            base_pts = 42
            factors.append({
                "factor": "Base Threat Severity",
                "points": base_pts,
                "category": "SEVERITY",
                "reason": "Detection rule classifies this threat signature as CRITICAL."
            })
        elif sev == "HIGH":
            base_pts = 30
            factors.append({
                "factor": "Base Threat Severity",
                "points": base_pts,
                "category": "SEVERITY",
                "reason": "Detection rule classifies this threat signature as HIGH severity."
            })
        elif sev == "MEDIUM":
            base_pts = 18
            factors.append({
                "factor": "Base Threat Severity",
                "points": base_pts,
                "category": "SEVERITY",
                "reason": "Detection rule classifies this threat signature as MEDIUM severity."
            })
        else:
            base_pts = 8
            factors.append({
                "factor": "Base Threat Severity",
                "points": base_pts,
                "category": "SEVERITY",
                "reason": "Baseline operational event severity."
            })
        score += base_pts

        # 2. Asset Criticality Factor
        dev_key = device_id or ""
        asset_info = cls.CRITICAL_ASSETS.get(dev_key)
        if asset_info:
            asset_pts = asset_info["points"]
            score += asset_pts
            factors.append({
                "factor": "Asset Criticality Tier",
                "points": asset_pts,
                "category": "ASSET",
                "reason": f"Target asset '{dev_key}' ({asset_info['desc']}) is classified as {asset_info['tier']}."
            })
        else:
            asset_pts = 5
            score += asset_pts
            factors.append({
                "factor": "Standard Infrastructure Asset",
                "points": asset_pts,
                "category": "ASSET",
                "reason": f"Target infrastructure asset '{dev_key or 'Network'}' standard operational tier."
            })

        # 3. Attack Velocity & Event Frequency Factor
        if event_count >= 50:
            freq_pts = 20
            score += freq_pts
            factors.append({
                "factor": "Massive Event Velocity",
                "points": freq_pts,
                "category": "FREQUENCY",
                "reason": f"High volume spike: {event_count} correlated events in detection window."
            })
        elif event_count >= 20:
            freq_pts = 15
            score += freq_pts
            factors.append({
                "factor": "High Event Velocity",
                "points": freq_pts,
                "category": "FREQUENCY",
                "reason": f"Sustained attack burst: {event_count} correlated events in detection window."
            })
        elif event_count >= 5:
            freq_pts = 10
            score += freq_pts
            factors.append({
                "factor": "Repeated Event Threshold",
                "points": freq_pts,
                "category": "FREQUENCY",
                "reason": f"Repeated suspicious threshold reached: {event_count} events recorded."
            })
        elif event_count > 1:
            freq_pts = 5
            score += freq_pts
            factors.append({
                "factor": "Multi-Event Recurrence",
                "points": freq_pts,
                "category": "FREQUENCY",
                "reason": f"{event_count} correlated event occurrences detected."
            })

        # 4. Source IP Threat Behavior & Public WAN Provenance
        if source_ip:
            is_private = cls._is_private_ip(source_ip)
            if not is_private:
                wan_pts = 12
                score += wan_pts
                factors.append({
                    "factor": "External Public WAN Inbound",
                    "points": wan_pts,
                    "category": "PROVENANCE",
                    "reason": f"Originates from untrusted external public IP ({source_ip})."
                })
            else:
                factors.append({
                    "factor": "Internal Network Origin",
                    "points": 2,
                    "category": "PROVENANCE",
                    "reason": f"Traffic originates from internal RFC1918 subnet ({source_ip})."
                })
                score += 2

        # 5. MITRE ATT&CK Technique & Attack Vector Bonus
        mitre = cls.get_mitre_info(rule_id, event_type)
        if mitre:
            tactic = mitre.get("tactic", "")
            if tactic in ("Credential Access", "Defense Evasion", "Privilege Escalation"):
                tactic_pts = 10
                score += tactic_pts
                factors.append({
                    "factor": f"High-Impact MITRE Tactic ({tactic})",
                    "points": tactic_pts,
                    "category": "TACTIC",
                    "reason": f"Matches ATT&CK Technique {mitre.get('technique_id')} ({mitre.get('technique_name')})."
                })

        # Cap score between 0 and 100
        score = max(0, min(100, score))

        # Determine qualitative level
        if score >= 80:
            level = "CRITICAL"
        elif score >= 60:
            level = "HIGH"
        elif score >= 35:
            level = "ELEVATED"
        else:
            level = "LOW"

        # Generate clear explanation
        explanation = (
            f"Risk score of {score}/100 ({level}) assigned based on {len(factors)} evaluated telemetry factors: "
            + "; ".join([f"{f['factor']} (+{f['points']} pts)" for f in factors[:3]])
            + ("..." if len(factors) > 3 else ".")
        )

        return {
            "score": score,
            "level": level,
            "factors": factors,
            "explanation": explanation,
            "mitre": mitre
        }

    @classmethod
    def get_mitre_info(cls, rule_id: Optional[str], event_type: Optional[str] = None) -> Optional[Dict[str, str]]:
        if rule_id and rule_id in cls.MITRE_ATTACK_MAPPINGS:
            return cls.MITRE_ATTACK_MAPPINGS[rule_id]
        
        # Fallback based on event_type
        ev = (event_type or "").upper()
        if "LOGIN" in ev or "AUTH" in ev:
            return cls.MITRE_ATTACK_MAPPINGS["RULE-AUTH-001"]
        elif "SCAN" in ev:
            return cls.MITRE_ATTACK_MAPPINGS["RULE-NET-002"]
        elif "TAMPER" in ev or "CCTV" in ev:
            return cls.MITRE_ATTACK_MAPPINGS["RULE-CCTV-005"]
        elif "IAM" in ev or "AWS" in ev or "ROOT" in ev:
            return cls.MITRE_ATTACK_MAPPINGS["RULE-AWS-006"]
        elif "BLOCK" in ev or "DENY" in ev:
            return cls.MITRE_ATTACK_MAPPINGS["RULE-NET-003"]
        elif "DISCONNECT" in ev or "OFFLINE" in ev or "DOWN" in ev:
            return cls.MITRE_ATTACK_MAPPINGS["RULE-DEV-004"]
        
        return {
            "technique_id": "T1000",
            "technique_name": "General Security Event",
            "tactic": "Execution",
            "sub_technique": "Unclassified infrastructure telemetry"
        }

    @staticmethod
    def _is_private_ip(ip: str) -> bool:
        if not ip:
            return True
        if ip in ("127.0.0.1", "localhost", "::1"):
            return True
        parts = ip.split(".")
        if len(parts) != 4:
            return False
        try:
            p0, p1 = int(parts[0]), int(parts[1])
            if p0 == 10:
                return True
            if p0 == 172 and 16 <= p1 <= 31:
                return True
            if p0 == 192 and p1 == 168:
                return True
            return False
        except ValueError:
            return False
