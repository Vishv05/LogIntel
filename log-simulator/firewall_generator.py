import random
from datetime import datetime, timezone
from typing import Any, Dict


class FirewallLogGenerator:
    """Generates realistic enterprise firewall events (ALLOW, DENY, BLOCK, VPN, PORT_SCAN)."""

    SOURCE_TYPE = "firewall"
    DEVICE_ID = "FW-CORP-EDGE-01"
    DEVICE_NAME = "Corporate Perimeter Firewall"

    EVENT_TEMPLATES = [
        {
            "event_type": "CONNECTION_ALLOWED",
            "severity": "info",
            "action": "ALLOW",
            "protocol": "TCP",
            "dest_port": 443,
            "template": "Built outbound TCP connection 98124 for outside:{source_ip}/{source_port} to inside:10.0.10.50/{dest_port}",
            "metadata": {"acl": "PERMIT_HTTPS_INBOUND", "bytes_transferred": 8420}
        },
        {
            "event_type": "CONNECTION_BLOCKED",
            "severity": "medium",
            "action": "DENY",
            "protocol": "TCP",
            "dest_port": 23,
            "template": "Deny inbound TCP (no xlate) from {source_ip}/{source_port} to 192.168.1.1/{dest_port} on interface WAN_1",
            "metadata": {"acl": "DEFAULT_BLOCK_TELNET", "flags": "SYN"}
        },
        {
            "event_type": "VPN_SESSION_ESTABLISHED",
            "severity": "low",
            "action": "ALLOW",
            "protocol": "UDP",
            "dest_port": 1194,
            "template": "IPsec / SSL VPN Client tunnel established for user {username} from {source_ip}",
            "metadata": {"tunnel_type": "SSL-VPN", "encryption": "AES-256-GCM"}
        },
        {
            "event_type": "PORT_SCAN",
            "severity": "high",
            "action": "DENY",
            "protocol": "TCP",
            "dest_port": 3389,
            "template": "Port scan attempt detected from {source_ip} targeting port {dest_port}. Packet dropped.",
            "metadata": {"threat_category": "Reconnaissance", "rate_pps": 120}
        },
        {
            "event_type": "DDoS_SYN_FLOOD",
            "severity": "high",
            "action": "BLOCK",
            "protocol": "TCP",
            "dest_port": 80,
            "template": "SYN Flood threshold exceeded from {source_ip}. Blacklisting source IP temporarily.",
            "metadata": {"attack_signature": "TCP_SYN_FLOOD", "threshold_exceeded": 500}
        }
    ]

    USERNAMES = ["corp_user_01", "dev_sec_ops", "admin_remote", "consultant_ext", "service_mon"]

    @classmethod
    def generate_log(cls, force_event: str = None, attacker_ip: str = None, target_port: int = None) -> Dict[str, Any]:
        template_obj = None
        if force_event:
            for t in cls.EVENT_TEMPLATES:
                if t["event_type"] == force_event:
                    template_obj = t
                    break

        if not template_obj:
            weights = [50, 25, 15, 7, 3]
            template_obj = random.choices(cls.EVENT_TEMPLATES, weights=weights, k=1)[0]

        source_ip = attacker_ip or f"{random.randint(180, 220)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
        source_port = random.randint(30000, 65000)
        dest_port = target_port or template_obj["dest_port"]
        username = random.choice(cls.USERNAMES) if "user" in template_obj["template"] else None

        message = template_obj["template"].format(
            username=username or "anonymous",
            source_ip=source_ip,
            source_port=source_port,
            dest_port=dest_port
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_type": cls.SOURCE_TYPE,
            "device_id": cls.DEVICE_ID,
            "device_name": cls.DEVICE_NAME,
            "event_type": template_obj["event_type"],
            "severity": template_obj["severity"],
            "source_ip": source_ip,
            "destination_ip": "192.168.1.1",
            "source_port": source_port,
            "destination_port": dest_port,
            "protocol": template_obj["protocol"],
            "action": template_obj["action"],
            "username": username,
            "message": message,
            "metadata": template_obj["metadata"].copy()
        }
