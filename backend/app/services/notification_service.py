import logging
from typing import Any, Dict, List
from backend.app.models.alert import Alert

logger = logging.getLogger("logintel.notifications")


class NotificationService:
    """
    Extensible Notification Dispatcher.
    Supports in-app queues, console logging, and webhook integrations (Slack/Teams/Email).
    """

    _in_app_notifications: List[Dict[str, Any]] = []

    @classmethod
    def dispatch_alert_notification(cls, alert: Alert):
        """Dispatch security alert notification to active channels."""
        notification_payload = {
            "alert_id": alert.alert_id,
            "rule_id": alert.rule_id,
            "severity": alert.severity,
            "title": alert.title,
            "description": alert.description,
            "source_ip": alert.source_ip,
            "device_id": alert.device_id,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
        }

        # 1. In-App Notification Store
        cls._in_app_notifications.insert(0, notification_payload)
        if len(cls._in_app_notifications) > 100:
            cls._in_app_notifications.pop()

        # 2. Console Notification Output
        logger.warning(
            f"[SECURITY ALERT TRIGGERED] ID: {alert.alert_id} | "
            f"Severity: {alert.severity} | "
            f"Title: {alert.title} | "
            f"IP: {alert.source_ip} | Device: {alert.device_id}"
        )

    @classmethod
    def get_recent_notifications(cls, limit: int = 20) -> List[Dict[str, Any]]:
        return cls._in_app_notifications[:limit]
