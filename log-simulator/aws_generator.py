import random
import uuid
from datetime import datetime, timezone
from typing import Any, Dict


class AWSLogGenerator:
    """Generates realistic AWS CloudWatch, IAM, EC2, and VPC flow logs."""

    SOURCE_TYPE = "aws"
    DEVICE_ID = "AWS-EC2-PROD-01"
    DEVICE_NAME = "AWS EC2 Web App Cluster"

    EVENT_TEMPLATES = [
        {
            "event_type": "IAM_AUTH_SUCCESS",
            "severity": "info",
            "action": "ALLOW",
            "template": "AWS AssumeRole succeeded for {username} via STS from {source_ip}",
            "metadata": {"service": "sts", "region": "us-east-1"}
        },
        {
            "event_type": "EC2_INSTANCE_STATE",
            "severity": "info",
            "action": "RUNNING",
            "template": "EC2 instance i-{instance_id} changed state to 'running' in us-east-1a",
            "metadata": {"service": "ec2", "region": "us-east-1"}
        },
        {
            "event_type": "S3_OBJECT_ACCESS",
            "severity": "info",
            "action": "ALLOW",
            "template": "REST.GET.OBJECT logintel-assets/config.json requested by {username}",
            "metadata": {"service": "s3", "bucket": "logintel-assets"}
        },
        {
            "event_type": "VPC_FLOW_ACCEPT",
            "severity": "info",
            "action": "ALLOW",
            "template": "VPC Flow Log: ACCEPT TCP {source_ip}:{source_port} -> 172.31.10.45:443 (bytes: 1420)",
            "metadata": {"service": "vpc", "interface_id": "eni-08f32a1b"}
        },
        {
            "event_type": "ROOT_LOGIN",
            "severity": "high",
            "action": "LOGIN_SUCCESS",
            "template": "AWS Console Login: Root user logged in without MFA from {source_ip}",
            "metadata": {"service": "iam", "risk_score": 85, "mfa_used": False}
        },
        {
            "event_type": "UNAUTHORIZED_IAM_CHANGE",
            "severity": "high",
            "action": "DENY",
            "template": "User {username} attempted unauthorized PutRolePolicy on AdministratorAccess role from {source_ip}",
            "metadata": {"service": "iam", "errorCode": "AccessDenied"}
        }
    ]

    USERNAMES = ["devops_admin", "app_service_role", "backup_agent", "vishv_cloud", "dhruvil_cloud", "unknown_iam_user"]

    @classmethod
    def generate_log(cls, force_event: str = None, attacker_ip: str = None) -> Dict[str, Any]:
        template_obj = None
        if force_event:
            for t in cls.EVENT_TEMPLATES:
                if t["event_type"] == force_event:
                    template_obj = t
                    break

        if not template_obj:
            weights = [35, 25, 25, 10, 3, 2]
            template_obj = random.choices(cls.EVENT_TEMPLATES, weights=weights, k=1)[0]

        source_ip = attacker_ip or f"{random.randint(50, 198)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
        source_port = random.randint(30000, 65000)
        username = random.choice(cls.USERNAMES)
        instance_id = str(uuid.uuid4())[:8]

        message = template_obj["template"].format(
            username=username,
            source_ip=source_ip,
            source_port=source_port,
            instance_id=instance_id
        )

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_type": cls.SOURCE_TYPE,
            "device_id": cls.DEVICE_ID,
            "device_name": cls.DEVICE_NAME,
            "event_type": template_obj["event_type"],
            "severity": template_obj["severity"],
            "source_ip": source_ip,
            "destination_ip": "172.31.10.45",
            "source_port": source_port,
            "destination_port": 443,
            "protocol": "HTTPS",
            "action": template_obj["action"],
            "username": username,
            "message": message,
            "metadata": template_obj["metadata"].copy()
        }
