import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from backend.app.core.opensearch import log_storage
from backend.app.models.alert import Alert
from backend.app.models.rule import DetectionRule
from backend.app.models.device import Device
from backend.app.services.notification_service import NotificationService

logger = logging.getLogger("logintel.detection")


class DetectionEngine:
    """
    Deterministic Threat Detection Engine.
    Evaluates real-time log streams against active security rules and correlates events.
    """

    @staticmethod
    def evaluate_log(db: Session, log_data: Dict[str, Any]) -> List[Alert]:
        """
        Evaluate an ingested log event against active security rules.
        Returns a list of newly created or updated Alerts.
        """
        triggered_alerts = []
        active_rules = db.query(DetectionRule).filter(DetectionRule.is_enabled == True).all()

        source_ip = log_data.get("source_ip")
        device_id = log_data.get("device_id")
        event_type = (log_data.get("event_type") or "").upper()
        action = (log_data.get("action") or "").upper()
        severity = (log_data.get("severity") or "").lower()
        source_type = (log_data.get("source_type") or "").lower()
        message = log_data.get("message", "")

        for rule in active_rules:
            try:
                alert = None
                cond = rule.get_conditions_dict()

                # --- Rule 1: Multiple Failed Logins ---
                if rule.rule_id == "RULE-AUTH-001" or "LOGIN_FAILED" in (rule.event_type or ""):
                    if "LOGIN_FAILED" in event_type or action == "LOGIN_FAILURE" or "failed login" in message.lower():
                        if source_ip:
                            recent_logs = log_storage.get_recent_logs_for_ip(source_ip, window_seconds=rule.window_seconds)
                            failed_count = sum(
                                1 for l in recent_logs
                                if "LOGIN_FAILED" in (l.get("event_type") or "").upper()
                                or (l.get("action") or "").upper() == "LOGIN_FAILURE"
                                or "failed login" in (l.get("message") or "").lower()
                            )
                            if failed_count >= rule.threshold:
                                alert = DetectionEngine._create_or_update_alert(
                                    db=db,
                                    rule_id=rule.rule_id,
                                    severity=rule.severity,
                                    title=f"Multiple Failed Logins from {source_ip}",
                                    description=f"Detected {failed_count} failed login attempts from IP {source_ip} within {rule.window_seconds}s. Possible brute force attack.",
                                    source_ip=source_ip,
                                    device_id=device_id,
                                    event_count=failed_count
                                )

                # --- Rule 2: Port Scan Detection ---
                elif rule.rule_id == "RULE-NET-002" or "PORT_SCAN" in (rule.event_type or ""):
                    if source_ip and (event_type == "PORT_SCAN" or action in ("DENY", "BLOCK", "REJECT")):
                        recent_logs = log_storage.get_recent_logs_for_ip(source_ip, window_seconds=rule.window_seconds)
                        dest_ports = set()
                        for l in recent_logs:
                            p = l.get("destination_port")
                            if p:
                                dest_ports.add(p)
                        
                        if len(dest_ports) >= rule.threshold or event_type == "PORT_SCAN":
                            alert = DetectionEngine._create_or_update_alert(
                                db=db,
                                rule_id=rule.rule_id,
                                severity=rule.severity,
                                title=f"Port Scan Detected from {source_ip}",
                                description=f"Host {source_ip} scanned {len(dest_ports)} distinct destination ports within {rule.window_seconds}s window.",
                                source_ip=source_ip,
                                device_id=device_id,
                                event_count=len(dest_ports)
                            )

                # --- Rule 3: Excessive Blocked Connections ---
                elif rule.rule_id == "RULE-NET-003" or "BLOCKED_CONNECTIONS" in (rule.event_type or ""):
                    if action in ("DENY", "BLOCK", "DROP") and source_ip:
                        recent_logs = log_storage.get_recent_logs_for_ip(source_ip, window_seconds=rule.window_seconds)
                        blocked_count = sum(
                            1 for l in recent_logs
                            if (l.get("action") or "").upper() in ("DENY", "BLOCK", "DROP")
                        )
                        if blocked_count >= rule.threshold:
                            alert = DetectionEngine._create_or_update_alert(
                                db=db,
                                rule_id=rule.rule_id,
                                severity=rule.severity,
                                title=f"Excessive Blocked Connections from {source_ip}",
                                description=f"Source IP {source_ip} generated {blocked_count} blocked connection requests within {rule.window_seconds}s.",
                                source_ip=source_ip,
                                device_id=device_id,
                                event_count=blocked_count
                            )

                # --- Rule 4: Device Disconnection Alert ---
                elif rule.rule_id == "RULE-DEV-004" or "DEVICE_DISCONNECTED" in (rule.event_type or ""):
                    if event_type in ("INTERFACE_DOWN", "DEVICE_OFFLINE", "DEVICE_DISCONNECTED", "CAMERA_DISCONNECTED") or severity == "critical":
                        alert = DetectionEngine._create_or_update_alert(
                            db=db,
                            rule_id=rule.rule_id,
                            severity=rule.severity,
                            title=f"Critical Device Disconnection: {device_id}",
                            description=f"Device {device_id} ({log_data.get('device_name')}) reported disconnect/down event: {message}",
                            source_ip=source_ip,
                            device_id=device_id,
                            event_count=1
                        )
                        # Update device status in DB to offline
                        dev = db.query(Device).filter(Device.device_id == device_id).first()
                        if dev:
                            dev.status = "offline"
                            db.commit()

                # --- Rule 5: CCTV Security Event (Tampering / Sabotage) ---
                elif rule.rule_id == "RULE-CCTV-005" or "CCTV_TAMPERING" in (rule.event_type or "") or source_type == "cctv":
                    if event_type in ("TAMPERING_DETECTED", "RECORDING_FAILURE", "CAMERA_TAMPERING", "LENS_OBSTRUCTION") or "tamper" in message.lower():
                        alert = DetectionEngine._create_or_update_alert(
                            db=db,
                            rule_id=rule.rule_id,
                            severity="CRITICAL",
                            title=f"CCTV Tampering Alert on {device_id}",
                            description=f"Physical or optical tampering detected on CCTV camera {device_id}: {message}",
                            source_ip=source_ip,
                            device_id=device_id,
                            event_count=1
                        )

                # --- Rule 6: AWS / Cloud Privileged Security Anomaly ---
                elif rule.rule_id == "RULE-AWS-006" or source_type == "aws":
                    if event_type in ("ROOT_LOGIN", "UNAUTHORIZED_IAM_CHANGE", "S3_BUCKET_PUBLIC_EXPOSURE", "SECURITY_GROUP_MODIFIED") or "unauthorized" in message.lower():
                        alert = DetectionEngine._create_or_update_alert(
                            db=db,
                            rule_id=rule.rule_id,
                            severity="HIGH",
                            title=f"AWS Cloud Security Anomaly on {device_id}",
                            description=f"Suspicious Cloud/AWS event ({event_type}): {message}",
                            source_ip=source_ip,
                            device_id=device_id,
                            event_count=1
                        )

                if alert:
                    triggered_alerts.append(alert)

            except Exception as e:
                logger.error(f"Error evaluating rule {rule.rule_id}: {e}")

        return triggered_alerts

    @staticmethod
    def _create_or_update_alert(
        db: Session,
        rule_id: str,
        severity: str,
        title: str,
        description: str,
        source_ip: Optional[str],
        device_id: Optional[str],
        event_count: int = 1
    ) -> Alert:
        """
        Check if an open alert exists for this rule and target within the last 10 minutes.
        If yes, increment count; otherwise create a new alert.
        """
        ten_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=10)

        query = db.query(Alert).filter(
            Alert.rule_id == rule_id,
            Alert.status == "OPEN",
            Alert.created_at >= ten_mins_ago
        )
        if source_ip:
            query = query.filter(Alert.source_ip == source_ip)
        elif device_id:
            query = query.filter(Alert.device_id == device_id)

        existing_alert = query.first()

        if existing_alert:
            existing_alert.event_count = max(existing_alert.event_count + 1, event_count)
            existing_alert.description = description
            existing_alert.severity = severity
            db.commit()
            db.refresh(existing_alert)
            return existing_alert

        # Create new alert
        alert_number = str(uuid.uuid4())[:8].upper()
        new_alert = Alert(
            alert_id=f"ALT-{datetime.now(timezone.utc).year}-{alert_number}",
            rule_id=rule_id,
            severity=severity.upper(),
            title=title,
            description=description,
            source_ip=source_ip,
            device_id=device_id,
            event_count=event_count,
            status="OPEN",
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        # Dispatch notification
        NotificationService.dispatch_alert_notification(new_alert)

        return new_alert
