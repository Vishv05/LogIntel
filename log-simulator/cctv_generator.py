import random
from datetime import datetime, timezone
from typing import Any, Dict


class CCTVLogGenerator:
    """Generates realistic CCTV & NVR physical security events (Motion, Connect, Disconnect, Tamper)."""

    SOURCE_TYPE = "cctv"
    DEVICE_ID = "CCTV-SERVER-ROOM"
    DEVICE_NAME = "Server Room 360 Camera"

    EVENT_TEMPLATES = [
        {
            "event_type": "MOTION_DETECTED",
            "severity": "info",
            "action": "RECORD",
            "template": "PIR / Optical motion detected in Zone A (Datacenter Rack 4). Recording triggered.",
            "metadata": {"zone": "Zone A", "confidence": 0.94, "fps": 30}
        },
        {
            "event_type": "CAMERA_CONNECTED",
            "severity": "low",
            "action": "CONNECT",
            "template": "IP Camera RTSP stream connected to NVR channel 02 at 1080p 60fps",
            "metadata": {"channel": "CH-02", "codec": "H.265"}
        },
        {
            "event_type": "RECORDING_FAILURE",
            "severity": "high",
            "action": "ERROR",
            "template": "NVR storage pool full: Frame write dropped on Storage Volume /mnt/nvr_disk2",
            "metadata": {"storage_percent": 99.8, "disk": "/mnt/nvr_disk2"}
        },
        {
            "event_type": "CAMERA_DISCONNECTED",
            "severity": "high",
            "action": "DISCONNECT",
            "template": "Loss of video signal on camera {device_id}. Network timeout after 10000ms.",
            "metadata": {"error_code": "RTSP_TIMEOUT", "last_heartbeat": "10s ago"}
        },
        {
            "event_type": "TAMPERING_DETECTED",
            "severity": "critical",
            "action": "BLOCK",
            "template": "CRITICAL: Video tamper alarm triggered on {device_id}. Optical lens covered or spray painted.",
            "metadata": {"tamper_algorithm": "DARKNESS_DETECTION", "lux_level": 0.0}
        },
        {
            "event_type": "NVR_AUTH_FAILURE",
            "severity": "medium",
            "action": "DENY",
            "template": "Unauthorized web login attempt on NVR management portal from {source_ip}",
            "metadata": {"service": "NVR_WEB", "user_agent": "Mozilla/5.0"}
        }
    ]

    @classmethod
    def generate_log(cls, force_event: str = None, attacker_ip: str = None) -> Dict[str, Any]:
        template_obj = None
        if force_event:
            for t in cls.EVENT_TEMPLATES:
                if t["event_type"] == force_event:
                    template_obj = t
                    break

        if not template_obj:
            weights = [45, 25, 10, 8, 4, 8]
            template_obj = random.choices(cls.EVENT_TEMPLATES, weights=weights, k=1)[0]

        source_ip = attacker_ip or "192.168.50.102"
        message = template_obj["template"].format(
            device_id=cls.DEVICE_ID,
            source_ip=source_ip
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_type": cls.SOURCE_TYPE,
            "device_id": cls.DEVICE_ID,
            "device_name": cls.DEVICE_NAME,
            "event_type": template_obj["event_type"],
            "severity": template_obj["severity"],
            "source_ip": source_ip,
            "destination_ip": "192.168.50.1",
            "source_port": 554,
            "destination_port": 554,
            "protocol": "RTSP",
            "action": template_obj["action"],
            "username": "nvr_operator",
            "message": message,
            "metadata": template_obj["metadata"].copy()
        }
