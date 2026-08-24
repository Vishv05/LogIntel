import random
from datetime import datetime, timezone
from typing import Any, Dict


class ServerLogGenerator:
    """Generates Linux / Windows server system logs (Login, Process, CPU/Disk warnings)."""

    SOURCE_TYPE = "server"
    DEVICE_ID = "SRV-APP-CLUSTER-01"
    DEVICE_NAME = "Kubernetes Node Master 01"

    EVENT_TEMPLATES = [
        {
            "event_type": "PROCESS_STARTED",
            "severity": "info",
            "action": "EXEC",
            "template": "systemd[1]: Started Service unit {process_name}.service (PID {pid})",
            "metadata": {"facility": "systemd", "status": "active"}
        },
        {
            "event_type": "PROCESS_STOPPED",
            "severity": "info",
            "action": "STOP",
            "template": "systemd[1]: Stopped Service unit {process_name}.service cleanly",
            "metadata": {"facility": "systemd", "status": "inactive"}
        },
        {
            "event_type": "LOGIN_SUCCESS",
            "severity": "low",
            "action": "LOGIN",
            "template": "sshd[{pid}]: Accepted publickey for {username} from {source_ip} port {source_port} ssh2",
            "metadata": {"auth_method": "publickey", "service": "sshd"}
        },
        {
            "event_type": "LOGIN_FAILED",
            "severity": "high",
            "action": "LOGIN_FAILURE",
            "template": "sshd[{pid}]: Failed password for invalid user {username} from {source_ip} port {source_port} ssh2",
            "metadata": {"auth_method": "password", "service": "sshd"}
        },
        {
            "event_type": "CPU_HIGH_WARNING",
            "severity": "medium",
            "action": "ALERT",
            "template": "kernel: CPU usage exceeded 92% for 5 consecutive minutes (load avg: 8.42, 6.10, 4.22)",
            "metadata": {"cpu_percent": 94.5, "load_avg": [8.42, 6.10, 4.22]}
        },
        {
            "event_type": "DISK_USAGE_WARNING",
            "severity": "medium",
            "action": "ALERT",
            "template": "smartd[921]: Device: /dev/nvme0n1, disk usage above 88% capacity limit (/var/log)",
            "metadata": {"mount": "/var/log", "used_percent": 89.2}
        }
    ]

    PROCESSES = ["nginx", "docker", "kubelet", "postgres", "opensearch", "node-exporter", "fluent-bit"]
    USERNAMES = ["root", "admin", "ubuntu", "devops", "testuser", "oracle", "deploy"]

    @classmethod
    def generate_log(cls, force_event: str = None, attacker_ip: str = None, target_user: str = None) -> Dict[str, Any]:
        template_obj = None
        if force_event:
            for t in cls.EVENT_TEMPLATES:
                if t["event_type"] == force_event:
                    template_obj = t
                    break

        if not template_obj:
            weights = [35, 15, 25, 12, 7, 6]
            template_obj = random.choices(cls.EVENT_TEMPLATES, weights=weights, k=1)[0]

        source_ip = attacker_ip or f"10.0.20.{random.randint(2, 50)}"
        source_port = random.randint(30000, 65000)
        username = target_user or random.choice(cls.USERNAMES)
        process_name = random.choice(cls.PROCESSES)
        pid = random.randint(1000, 65000)

        message = template_obj["template"].format(
            process_name=process_name,
            username=username,
            source_ip=source_ip,
            source_port=source_port,
            pid=pid
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_type": cls.SOURCE_TYPE,
            "device_id": cls.DEVICE_ID,
            "device_name": cls.DEVICE_NAME,
            "event_type": template_obj["event_type"],
            "severity": template_obj["severity"],
            "source_ip": source_ip,
            "destination_ip": "10.0.20.10",
            "source_port": source_port,
            "destination_port": 22 if "ssh" in message else 8080,
            "protocol": "TCP",
            "action": template_obj["action"],
            "username": username if "user" in template_obj["template"] else None,
            "message": message,
            "metadata": template_obj["metadata"].copy()
        }
