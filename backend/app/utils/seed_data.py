import json
import logging
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.core.security import get_password_hash
from backend.app.core.opensearch import log_storage
from backend.app.models.user import User
from backend.app.models.device import Device
from backend.app.models.rule import DetectionRule
from backend.app.models.alert import Alert
from backend.app.models.audit import AuditLog
from backend.app.services.log_service import LogService

logger = logging.getLogger("logintel.seed")


def seed_database_and_logs(db_engine=None, session_maker=None):
    """Create tables, seed initial users, devices, detection rules, and baseline logs."""
    target_engine = db_engine or engine
    target_session = session_maker or SessionLocal
    Base.metadata.create_all(bind=target_engine)
    db: Session = target_session()

    try:
        # 1. Seed or synchronize Users (Admin: admin@gmail.com / admin123, User: any mail-id & password)
        admin_user = db.query(User).filter(
            (User.email == "admin@gmail.com") | (User.username == "admin")
        ).first()

        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@gmail.com",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role="admin",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)
        else:
            admin_user.email = "admin@gmail.com"
            admin_user.role = "admin"
            admin_user.hashed_password = get_password_hash("admin123")

        # Ensure default User account (user@gmail.com / user123)
        default_user = db.query(User).filter(
            (User.email == "user@gmail.com") | (User.username == "user")
        ).first()

        if not default_user:
            default_user = User(
                username="user",
                email="user@gmail.com",
                hashed_password=get_password_hash("user123"),
                full_name="Standard User",
                role="user",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(default_user)
        else:
            default_user.role = "user"
            default_user.hashed_password = get_password_hash("user123")

        # Ensure analyst test account exists with role 'user'
        analyst_user = db.query(User).filter(User.username == "analyst").first()
        if not analyst_user:
            analyst_user = User(
                username="analyst",
                email="analyst@logintel.org",
                hashed_password=get_password_hash("analystpassword123"),
                full_name="SOC Analyst",
                role="user",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(analyst_user)
        else:
            analyst_user.hashed_password = get_password_hash("analystpassword123")

        # Ensure creator admin accounts exist (vishv / vishvpassword123, dhruvil / dhruvilpassword123)
        vishv_user = db.query(User).filter(User.username == "vishv").first()
        if not vishv_user:
            vishv_user = User(
                username="vishv",
                email="vishv@logintel.local",
                hashed_password=get_password_hash("vishvpassword123"),
                full_name="Bhavsar Vishv Jigneshkumar",
                role="admin",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(vishv_user)
        else:
            vishv_user.role = "admin"
            vishv_user.hashed_password = get_password_hash("vishvpassword123")

        dhruvil_user = db.query(User).filter(User.username == "dhruvil").first()
        if not dhruvil_user:
            dhruvil_user = User(
                username="dhruvil",
                email="dhruvil@logintel.local",
                hashed_password=get_password_hash("dhruvilpassword123"),
                full_name="Sojitra Dhruvil Vipulbhai",
                role="admin",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(dhruvil_user)
        else:
            dhruvil_user.role = "admin"
            dhruvil_user.hashed_password = get_password_hash("dhruvilpassword123")

        db.commit()

        # 2. Seed Devices
        if db.query(Device).count() == 0:
            logger.info("Seeding initial infrastructure devices...")
            devices_to_create = [
                Device(device_id="AWS-EC2-PROD-01", device_name="AWS EC2 Web App Cluster", device_type="AWS", ip_address="172.31.10.45", location="AWS us-east-1", status="online"),
                Device(device_id="AWS-LAMBDA-AUTH", device_name="AWS Lambda Auth Service", device_type="AWS", ip_address="172.31.20.12", location="AWS Serverless", status="online"),
                Device(device_id="FW-CORP-EDGE-01", device_name="Corporate Perimeter Firewall", device_type="FIREWALL", ip_address="192.168.1.1", location="Gateway DMZ", status="online"),
                Device(device_id="FW-INTERNAL-SEC", device_name="Internal Segregation Firewall", device_type="FIREWALL", ip_address="10.0.10.1", location="Datacenter Core", status="online"),
                Device(device_id="RTR-GATEWAY-01", device_name="Border BGP Router", device_type="ROUTER", ip_address="192.168.1.254", location="Edge WAN", status="online"),
                Device(device_id="SW-CORE-L3-01", device_name="Core Layer-3 Switch", device_type="SWITCH", ip_address="10.0.0.2", location="Main Rack A1", status="online"),
                Device(device_id="SW-ACCESS-L2-04", device_name="Access Switch Floor 2", device_type="SWITCH", ip_address="10.0.0.14", location="Floor 2 Rack B", status="warning"),
                Device(device_id="CCTV-HQ-ENTRANCE", device_name="HQ Main Entrance Camera", device_type="CCTV", ip_address="192.168.50.101", location="Lobby Entrance", status="online"),
                Device(device_id="CCTV-SERVER-ROOM", device_name="Server Room 360 Camera", device_type="CCTV", ip_address="192.168.50.102", location="Server Room DC-1", status="online"),
                Device(device_id="SRV-AUTH-LDAP-01", device_name="Active Directory / LDAP Server", device_type="SERVER", ip_address="10.0.20.5", location="Server Farm Rack 3", status="online"),
                Device(device_id="SRV-APP-CLUSTER-01", device_name="Kubernetes Node Master 01", device_type="SERVER", ip_address="10.0.20.10", location="Server Farm Rack 4", status="online"),
                Device(device_id="APP-PAYMENT-API", device_name="Payment Processing Microservice", device_type="APPLICATION", ip_address="10.0.30.15", location="App Container Mesh", status="online"),
            ]
            db.add_all(devices_to_create)
            db.commit()

        # 3. Seed Detection Rules
        if db.query(DetectionRule).count() == 0:
            logger.info("Seeding detection rules...")
            rules_to_create = [
                DetectionRule(
                    rule_id="RULE-AUTH-001",
                    name="Multiple Failed Logins (Brute Force)",
                    description="Trigger alert when 5 or more failed logins occur from the same source IP within 60 seconds.",
                    severity="HIGH",
                    event_type="LOGIN_FAILED",
                    threshold=5,
                    window_seconds=60,
                    conditions=json.dumps({"match_field": "source_ip", "event": "LOGIN_FAILED"})
                ),
                DetectionRule(
                    rule_id="RULE-NET-002",
                    name="Port Scan Activity Detected",
                    description="Detect when a single source IP initiates connections to 4 or more distinct destination ports in 60s.",
                    severity="HIGH",
                    event_type="PORT_SCAN",
                    threshold=4,
                    window_seconds=60,
                    conditions=json.dumps({"match_field": "destination_port", "unique_threshold": 4})
                ),
                DetectionRule(
                    rule_id="RULE-NET-003",
                    name="Excessive Blocked Connections",
                    description="Trigger when an IP generates 5 or more blocked/dropped packets within 60s.",
                    severity="MEDIUM",
                    event_type="BLOCKED_CONNECTIONS",
                    threshold=5,
                    window_seconds=60,
                    conditions=json.dumps({"action": "DENY", "threshold": 5})
                ),
                DetectionRule(
                    rule_id="RULE-DEV-004",
                    name="Critical Device Disconnection",
                    description="Trigger high-priority alert when a critical device or switch interface reports offline/down.",
                    severity="HIGH",
                    event_type="DEVICE_DISCONNECTED",
                    threshold=1,
                    window_seconds=60,
                    conditions=json.dumps({"event": "INTERFACE_DOWN"})
                ),
                DetectionRule(
                    rule_id="RULE-CCTV-005",
                    name="CCTV Tampering & Camera Sabotage",
                    description="Critical alert when a physical camera detects lens covering, optical blinding, or hardware tampering.",
                    severity="CRITICAL",
                    event_type="CCTV_TAMPERING",
                    threshold=1,
                    window_seconds=60,
                    conditions=json.dumps({"event": "TAMPERING_DETECTED"})
                ),
                DetectionRule(
                    rule_id="RULE-AWS-006",
                    name="AWS Cloud Privileged Security Anomaly",
                    description="Alert on root account console login, unauthorized IAM policy modifications, or public S3 bucket exposure.",
                    severity="HIGH",
                    event_type="AWS_SECURITY_ANOMALY",
                    threshold=1,
                    window_seconds=60,
                    conditions=json.dumps({"event": "ROOT_LOGIN"})
                ),
            ]
            db.add_all(rules_to_create)
            db.commit()

        # 4. Seed Baseline Logs into OpenSearch Storage
        total_logs_existing, _ = log_storage.search_logs(page_size=1)
        if total_logs_existing < 15:
            logger.info("Seeding realistic baseline logs...")
            now = datetime.now(timezone.utc)
            sample_logs = []

            # Generate hourly distributed logs over the past 24 hours
            for hour_offset in range(24, -1, -1):
                base_time = now - timedelta(hours=hour_offset)
                
                # Normal Server log
                sample_logs.append({
                    "timestamp": (base_time + timedelta(minutes=random.randint(1, 15))).isoformat(),
                    "source_type": "server",
                    "device_id": "SRV-APP-CLUSTER-01",
                    "device_name": "Kubernetes Node Master 01",
                    "event_type": "PROCESS_STARTED",
                    "severity": "info",
                    "source_ip": "10.0.20.10",
                    "destination_ip": "10.0.20.15",
                    "source_port": 41200,
                    "destination_port": 8080,
                    "protocol": "TCP",
                    "action": "ALLOW",
                    "username": "system",
                    "message": "Process 'nginx-ingress-controller' spawned successfully (PID: 4912)",
                    "metadata": {"cpu_percent": 14.2, "mem_mb": 512}
                })

                # Firewall ALLOW log
                sample_logs.append({
                    "timestamp": (base_time + timedelta(minutes=random.randint(16, 30))).isoformat(),
                    "source_type": "firewall",
                    "device_id": "FW-CORP-EDGE-01",
                    "device_name": "Corporate Perimeter Firewall",
                    "event_type": "CONNECTION_ALLOWED",
                    "severity": "info",
                    "source_ip": f"198.51.100.{random.randint(10, 99)}",
                    "destination_ip": "172.31.10.45",
                    "source_port": random.randint(30000, 60000),
                    "destination_port": 443,
                    "protocol": "TCP",
                    "action": "ALLOW",
                    "username": None,
                    "message": "TLS 1.3 session established to https backend",
                    "metadata": {"rule_id": "FW-RULE-HTTPS-INBOUND"}
                })

                # AWS CloudWatch event
                sample_logs.append({
                    "timestamp": (base_time + timedelta(minutes=random.randint(31, 45))).isoformat(),
                    "source_type": "aws",
                    "device_id": "AWS-EC2-PROD-01",
                    "device_name": "AWS EC2 Web App Cluster",
                    "event_type": "IAM_AUTH_SUCCESS",
                    "severity": "info",
                    "source_ip": "54.239.28.85",
                    "destination_ip": "172.31.10.45",
                    "source_port": 443,
                    "destination_port": 443,
                    "protocol": "HTTPS",
                    "action": "ALLOW",
                    "username": "devops_service_role",
                    "message": "AWS AssumeRole succeeded for CloudWatch agent telemetry",
                    "metadata": {"aws_region": "us-east-1", "service": "sts"}
                })

                # Switch Link State
                sample_logs.append({
                    "timestamp": (base_time + timedelta(minutes=random.randint(46, 59))).isoformat(),
                    "source_type": "switch",
                    "device_id": "SW-CORE-L3-01",
                    "device_name": "Core Layer-3 Switch",
                    "event_type": "INTERFACE_UP",
                    "severity": "low",
                    "source_ip": "10.0.0.2",
                    "destination_ip": "10.0.0.14",
                    "source_port": None,
                    "destination_port": None,
                    "protocol": "ETH",
                    "action": "CONNECT",
                    "username": "snmp_monitor",
                    "message": "GigabitEthernet1/0/24 changed state to up, duplex full, speed 1000Mb/s",
                    "metadata": {"vlan": 10, "port": "Gi1/0/24"}
                })

            # Seed specific simulated attack logs for initial demonstration
            attack_time = now - timedelta(minutes=15)
            attacker_ip = "203.0.113.195"

            # 1. Multiple Failed Logins attack sequence (Brute force)
            for i in range(6):
                sample_logs.append({
                    "timestamp": (attack_time + timedelta(seconds=i * 5)).isoformat(),
                    "source_type": "server",
                    "device_id": "SRV-AUTH-LDAP-01",
                    "device_name": "Active Directory / LDAP Server",
                    "event_type": "LOGIN_FAILED",
                    "severity": "high",
                    "source_ip": attacker_ip,
                    "destination_ip": "10.0.20.5",
                    "source_port": 51000 + i,
                    "destination_port": 389,
                    "protocol": "TCP",
                    "action": "LOGIN_FAILURE",
                    "username": f"user_test_{i}",
                    "message": f"Failed password authentication attempt for user_test_{i} from {attacker_ip}",
                    "metadata": {"attempt": i + 1, "auth_mechanism": "SIMPLE"}
                })

            # 2. Port scan sequence
            port_scan_ip = "185.220.101.5"
            scanned_ports = [21, 22, 23, 80, 443, 3389, 8080, 5432]
            for i, p in enumerate(scanned_ports):
                sample_logs.append({
                    "timestamp": (now - timedelta(minutes=8) + timedelta(seconds=i * 3)).isoformat(),
                    "source_type": "firewall",
                    "device_id": "FW-CORP-EDGE-01",
                    "device_name": "Corporate Perimeter Firewall",
                    "event_type": "PORT_SCAN",
                    "severity": "high",
                    "source_ip": port_scan_ip,
                    "destination_ip": "192.168.1.1",
                    "source_port": 60000 + i,
                    "destination_port": p,
                    "protocol": "TCP",
                    "action": "DENY",
                    "username": None,
                    "message": f"SYN connection to port {p} dropped by perimeter firewall ACL",
                    "metadata": {"flags": "SYN", "ttl": 48}
                })

            # 3. CCTV Tampering Event
            sample_logs.append({
                "timestamp": (now - timedelta(minutes=5)).isoformat(),
                "source_type": "cctv",
                "device_id": "CCTV-SERVER-ROOM",
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
                "message": "Video signal obstruction / Optical sensor blinded in Server Room DC-1",
                "metadata": {"tamper_type": "OCCLUSION", "lux_level": 0.0}
            })

            # Bulk ingest seed logs and trigger detection rules
            LogService.ingest_bulk(db, sample_logs)
            logger.info(f"Successfully seeded {len(sample_logs)} baseline logs.")

        # 5. Ensure baseline correlated security incidents exist
        from backend.app.models.incident import Incident
        from backend.app.services.correlation_service import CorrelationEngine
        if db.query(Incident).count() == 0:
            logger.info("Synthesizing baseline correlated security incidents...")
            CorrelationEngine.run_correlation(db)

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
