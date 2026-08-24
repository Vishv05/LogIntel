import random
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
try:
    from .aws_generator import AWSLogGenerator
    from .cctv_generator import CCTVLogGenerator
    from .firewall_generator import FirewallLogGenerator
    from .server_generator import ServerLogGenerator
    from .switch_generator import SwitchLogGenerator
except (ImportError, ValueError):
    from aws_generator import AWSLogGenerator
    from cctv_generator import CCTVLogGenerator
    from firewall_generator import FirewallLogGenerator
    from server_generator import ServerLogGenerator
    from switch_generator import SwitchLogGenerator


class AttackScenarioInjector:
    """
    Simulates targeted cybersecurity attack vectors and complex incidents
    to validate the LogIntel Threat Detection Engine and Alerting Pipeline.
    """

    @staticmethod
    def generate_brute_force(attacker_ip: str = "198.51.100.77", attempts: int = 7) -> List[Dict[str, Any]]:
        """Generates a rapid sequence of failed SSH / LDAP logins from a single IP."""
        logs = []
        now = datetime.now(timezone.utc)
        usernames = ["root", "admin", "administrator", "guest", "oracle", "test", "user1"]

        for i in range(attempts):
            ts = (now - timedelta(seconds=(attempts - i) * 3)).isoformat()
            user = usernames[i % len(usernames)]
            logs.append({
                "timestamp": ts,
                "source_type": "server",
                "device_id": "SRV-AUTH-LDAP-01",
                "device_name": "Active Directory / LDAP Server",
                "event_type": "LOGIN_FAILED",
                "severity": "high",
                "source_ip": attacker_ip,
                "destination_ip": "10.0.20.5",
                "source_port": 52000 + i,
                "destination_port": 22,
                "protocol": "TCP",
                "action": "LOGIN_FAILURE",
                "username": user,
                "message": f"sshd[{14000+i}]: Failed password for invalid user {user} from {attacker_ip} port {52000+i} ssh2",
                "metadata": {"attack_vector": "BRUTE_FORCE", "attempt_seq": i + 1}
            })
        return logs

    @staticmethod
    def generate_port_scan(attacker_ip: str = "185.220.101.44") -> List[Dict[str, Any]]:
        """Generates a multi-port reconnaissance probe."""
        logs = []
        now = datetime.now(timezone.utc)
        ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 1433, 3306, 3389, 5432, 8080]

        for i, port in enumerate(ports):
            ts = (now - timedelta(seconds=(len(ports) - i) * 2)).isoformat()
            logs.append({
                "timestamp": ts,
                "source_type": "firewall",
                "device_id": "FW-CORP-EDGE-01",
                "device_name": "Corporate Perimeter Firewall",
                "event_type": "PORT_SCAN",
                "severity": "high",
                "source_ip": attacker_ip,
                "destination_ip": "192.168.1.1",
                "source_port": 61000 + i,
                "destination_port": port,
                "protocol": "TCP",
                "action": "DENY",
                "username": None,
                "message": f"Port scan probe TCP SYN to port {port} dropped by perimeter firewall ACL",
                "metadata": {"scanned_port": port, "tcp_flags": "SYN"}
            })
        return logs

    @staticmethod
    def generate_blocked_flood(attacker_ip: str = "203.0.113.88", count: int = 8) -> List[Dict[str, Any]]:
        """Generates excessive blocked connection attempts."""
        logs = []
        now = datetime.now(timezone.utc)

        for i in range(count):
            ts = (now - timedelta(seconds=(count - i) * 2)).isoformat()
            logs.append({
                "timestamp": ts,
                "source_type": "firewall",
                "device_id": "FW-CORP-EDGE-01",
                "device_name": "Corporate Perimeter Firewall",
                "event_type": "CONNECTION_BLOCKED",
                "severity": "medium",
                "source_ip": attacker_ip,
                "destination_ip": "10.0.10.25",
                "source_port": 45000 + i,
                "destination_port": 80,
                "protocol": "TCP",
                "action": "BLOCK",
                "username": None,
                "message": f"Connection blocked: Rate limit exceeded for source {attacker_ip}",
                "metadata": {"acl_drop_reason": "RATE_LIMIT_EXCEEDED"}
            })
        return logs

    @staticmethod
    def generate_cctv_sabotage(camera_id: str = "CCTV-SERVER-ROOM") -> List[Dict[str, Any]]:
        """Generates a coordinated CCTV physical tampering and disconnect incident."""
        now = datetime.now(timezone.utc)
        return [
            {
                "timestamp": (now - timedelta(seconds=20)).isoformat(),
                "source_type": "cctv",
                "device_id": camera_id,
                "device_name": "Server Room 360 Camera",
                "event_type": "MOTION_DETECTED",
                "severity": "info",
                "source_ip": "192.168.50.102",
                "destination_ip": "192.168.50.1",
                "source_port": 554,
                "destination_port": 554,
                "protocol": "RTSP",
                "action": "RECORD",
                "username": "camera_sensor",
                "message": "High-velocity motion detected in Datacenter Row 3",
                "metadata": {"zone": "ROW_3", "confidence": 0.98}
            },
            {
                "timestamp": (now - timedelta(seconds=10)).isoformat(),
                "source_type": "cctv",
                "device_id": camera_id,
                "device_name": "Server Room 360 Camera",
                "event_type": "TAMPERING_DETECTED",
                "severity": "critical",
                "source_ip": "192.168.50.102",
                "destination_ip": "192.168.50.1",
                "source_port": 554,
                "destination_port": 554,
                "protocol": "RTSP",
                "action": "BLOCK",
                "username": "camera_agent",
                "message": "CRITICAL: Lens covered or physical tamper switch activated on Server Room 360 Camera",
                "metadata": {"tamper_type": "OPTICAL_OCCLUSION"}
            },
            {
                "timestamp": now.isoformat(),
                "source_type": "cctv",
                "device_id": camera_id,
                "device_name": "Server Room 360 Camera",
                "event_type": "CAMERA_DISCONNECTED",
                "severity": "high",
                "source_ip": "192.168.50.102",
                "destination_ip": "192.168.50.1",
                "source_port": 554,
                "destination_port": 554,
                "protocol": "RTSP",
                "action": "DISCONNECT",
                "username": "nvr_monitor",
                "message": f"Loss of signal on {camera_id}: Cable severed or power failure",
                "metadata": {"status": "offline"}
            }
        ]

    @staticmethod
    def generate_aws_cloud_threat() -> List[Dict[str, Any]]:
        """Generates an unauthorized AWS privilege escalation event."""
        now = datetime.now(timezone.utc)
        return [
            {
                "timestamp": (now - timedelta(seconds=30)).isoformat(),
                "source_type": "aws",
                "device_id": "AWS-EC2-PROD-01",
                "device_name": "AWS EC2 Web App Cluster",
                "event_type": "ROOT_LOGIN",
                "severity": "high",
                "source_ip": "203.0.113.111",
                "destination_ip": "172.31.10.45",
                "source_port": 443,
                "destination_port": 443,
                "protocol": "HTTPS",
                "action": "LOGIN_SUCCESS",
                "username": "root",
                "message": "AWS IAM Root Account logged in from unrecognized IP 203.0.113.111 without MFA token",
                "metadata": {"service": "signin.amazonaws.com", "mfa_authenticated": False}
            },
            {
                "timestamp": now.isoformat(),
                "source_type": "aws",
                "device_id": "AWS-EC2-PROD-01",
                "device_name": "AWS EC2 Web App Cluster",
                "event_type": "UNAUTHORIZED_IAM_CHANGE",
                "severity": "critical",
                "source_ip": "203.0.113.111",
                "destination_ip": "172.31.10.45",
                "source_port": 443,
                "destination_port": 443,
                "protocol": "HTTPS",
                "action": "DENY",
                "username": "root",
                "message": "Unauthorized PutRolePolicy attempted to grant s3:* to external account",
                "metadata": {"service": "iam.amazonaws.com", "denied_policy": "AdministratorAccess"}
            }
        ]
