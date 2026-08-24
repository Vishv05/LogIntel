from typing import Any, Dict
from sqlalchemy.orm import Session
from backend.app.core.opensearch import log_storage
from backend.app.models.device import Device
from backend.app.models.alert import Alert


class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        """
        Dynamically calculate and merge log intelligence metrics from OpenSearch
        with relational device status and alert status.
        """
        analytics = log_storage.get_analytics()

        # Augment with relational database active device counts
        active_devices = db.query(Device).filter(Device.status == "online", Device.is_enabled == True).count()
        total_devices = db.query(Device).count()

        # Augment with alert counts
        open_alerts = db.query(Alert).filter(Alert.status == "OPEN").count()
        total_alerts = db.query(Alert).count()

        analytics["overview"]["active_devices"] = active_devices
        analytics["overview"]["total_devices"] = total_devices
        analytics["overview"]["open_alerts"] = open_alerts
        analytics["overview"]["total_alerts"] = total_alerts

        return analytics
