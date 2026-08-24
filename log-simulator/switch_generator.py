import random
from datetime import datetime, timezone
from typing import Any, Dict


class SwitchLogGenerator:
    """Generates realistic Layer-2 / Layer-3 switch events (Interface state, MAC changes, STP, CRC)."""

    SOURCE_TYPE = "switch"
    DEVICE_ID = "SW-CORE-L3-01"
    DEVICE_NAME = "Core Layer-3 Switch"

    EVENT_TEMPLATES = [
        {
            "event_type": "INTERFACE_UP",
            "severity": "low",
            "action": "CONNECT",
            "template": "%LINK-3-UPDOWN: Interface GigabitEthernet1/0/{port_num}, changed state to up",
            "metadata": {"facility": "LINK", "vlan": 10}
        },
        {
            "event_type": "INTERFACE_DOWN",
            "severity": "high",
            "action": "DISCONNECT",
            "template": "%LINK-3-UPDOWN: Interface GigabitEthernet1/0/{port_num}, changed state to down. Link loss detected.",
            "metadata": {"facility": "LINK", "reason": "CarrierLost"}
        },
        {
            "event_type": "CONFIG_CHANGE",
            "severity": "medium",
            "action": "MODIFY",
            "template": "%SYS-5-CONFIG_I: Configured from console by {username} on vty0 (10.0.0.50)",
            "metadata": {"facility": "SYS", "config_source": "vty0"}
        },
        {
            "event_type": "AUTH_FAILURE",
            "severity": "high",
            "action": "DENY",
            "template": "%SEC-4-AUTH_FAIL: SSH login failed for user '{username}' from {source_ip} (bad credentials)",
            "metadata": {"facility": "SEC", "service": "SSH"}
        },
        {
            "event_type": "PACKET_CRC_ERROR",
            "severity": "medium",
            "action": "ERROR",
            "template": "%ETH-4-CRC_ERR: Excessive FCS/CRC alignment errors on port Gi1/0/{port_num} ({err_count} frames dropped)",
            "metadata": {"facility": "ETH", "error_type": "CRC"}
        }
    ]

    USERNAMES = ["netadmin", "cisco_mgr", "snmp_user", "secops_lead"]

    @classmethod
    def generate_log(cls, force_event: str = None, attacker_ip: str = None) -> Dict[str, Any]:
        template_obj = None
        if force_event:
            for t in cls.EVENT_TEMPLATES:
                if t["event_type"] == force_event:
                    template_obj = t
                    break

        if not template_obj:
            weights = [45, 10, 20, 15, 10]
            template_obj = random.choices(cls.EVENT_TEMPLATES, weights=weights, k=1)[0]

        source_ip = attacker_ip or "10.0.0.2"
        port_num = random.randint(1, 48)
        username = random.choice(cls.USERNAMES)
        err_count = random.randint(50, 500)

        message = template_obj["template"].format(
            port_num=port_num,
            username=username,
            source_ip=source_ip,
            err_count=err_count
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_type": cls.SOURCE_TYPE,
            "device_id": cls.DEVICE_ID,
            "device_name": cls.DEVICE_NAME,
            "event_type": template_obj["event_type"],
            "severity": template_obj["severity"],
            "source_ip": source_ip,
            "destination_ip": "10.0.0.1",
            "source_port": None,
            "destination_port": 22 if "SSH" in message else None,
            "protocol": "ETH",
            "action": template_obj["action"],
            "username": username if "user" in template_obj["template"] else None,
            "message": message,
            "metadata": template_obj["metadata"].copy()
        }
