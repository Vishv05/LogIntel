from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.core.opensearch import log_storage
from backend.app.models.alert import Alert
from backend.app.services.audit_service import AuditService


class AlertService:
    @staticmethod
    def get_alerts(
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        device_id: Optional[str] = None,
        source_ip: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[int, List[Alert]]:
        query = db.query(Alert)
        if status:
            query = query.filter(Alert.status == status.upper())
        if severity:
            query = query.filter(Alert.severity == severity.upper())
        if device_id:
            query = query.filter(Alert.device_id == device_id)
        if source_ip:
            query = query.filter(Alert.source_ip == source_ip)

        total = query.count()
        alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
        return total, alerts

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: str) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.alert_id == alert_id).first()

    @staticmethod
    def acknowledge_alert(
        db: Session,
        alert_id: str,
        username: str,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            return None

        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_at = datetime.now(timezone.utc)
        alert.acknowledged_by = username
        if notes:
            alert.resolution_notes = f"[ACK NOTE by {username}]: {notes}"

        db.commit()
        db.refresh(alert)

        AuditService.log_action(
            db=db,
            username=username,
            action="ACKNOWLEDGE_ALERT",
            resource_type="ALERT",
            resource_id=alert_id,
            details=f"Alert {alert_id} acknowledged: {alert.title}",
            ip_address=ip_address
        )
        return alert

    @staticmethod
    def resolve_alert(
        db: Session,
        alert_id: str,
        username: str,
        notes: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            return None

        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)
        alert.resolved_by = username
        if notes:
            alert.resolution_notes = notes

        db.commit()
        db.refresh(alert)

        AuditService.log_action(
            db=db,
            username=username,
            action="RESOLVE_ALERT",
            resource_type="ALERT",
            resource_id=alert_id,
            details=f"Alert {alert_id} resolved. Notes: {notes or 'No notes'}",
            ip_address=ip_address
        )
        return alert

    @staticmethod
    def get_alert_stats(db: Session) -> Dict:
        alerts = db.query(Alert).all()
        total = len(alerts)
        open_cnt = sum(1 for a in alerts if a.status == "OPEN")
        ack_cnt = sum(1 for a in alerts if a.status == "ACKNOWLEDGED")
        res_cnt = sum(1 for a in alerts if a.status == "RESOLVED")

        crit_cnt = sum(1 for a in alerts if a.severity == "CRITICAL")
        high_cnt = sum(1 for a in alerts if a.severity == "HIGH")
        med_cnt = sum(1 for a in alerts if a.severity == "MEDIUM")
        low_cnt = sum(1 for a in alerts if a.severity == "LOW")

        return {
            "total_alerts": total,
            "open_alerts": open_cnt,
            "acknowledged_alerts": ack_cnt,
            "resolved_alerts": res_cnt,
            "critical_alerts": crit_cnt,
            "high_alerts": high_cnt,
            "medium_alerts": med_cnt,
            "low_alerts": low_cnt
        }

    @staticmethod
    def get_related_logs_for_alert(db: Session, alert_id: str) -> List[Dict]:
        """Fetch logs from OpenSearch directly related to this alert."""
        alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
        if not alert:
            return []

        # Query logs matching source IP or device ID around alert time
        _, logs = log_storage.search_logs(
            source_ip=alert.source_ip,
            device_id=alert.device_id if not alert.source_ip else None,
            page_size=20,
            sort_order="desc"
        )
        return logs
