import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # Credential Access, Lateral Movement, Physical Sabotage, Cloud Hijack, etc.
    severity = Column(String(20), default="HIGH", nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score = Column(Integer, default=50, nullable=False)  # 0 - 100
    risk_level = Column(String(20), default="HIGH", nullable=False)  # LOW, ELEVATED, HIGH, CRITICAL
    status = Column(String(20), default="OPEN", nullable=False, index=True)  # OPEN, ACKNOWLEDGED, INVESTIGATING, RESOLVED
    
    source_ip = Column(String(50), nullable=True, index=True)
    target_ip = Column(String(50), nullable=True)
    primary_device_id = Column(String(50), nullable=True, index=True)
    affected_devices_json = Column(Text, default="[]", nullable=False)
    affected_users_json = Column(Text, default="[]", nullable=False)
    correlated_alert_ids_json = Column(Text, default="[]", nullable=False)
    event_count = Column(Integer, default=1, nullable=False)
    pattern_name = Column(String(100), nullable=False)
    summary = Column(Text, nullable=False)
    detection_rule_id = Column(String(50), nullable=True)

    # Rich structured intelligence
    explainable_detection_json = Column(Text, default="{}", nullable=False)
    risk_breakdown_json = Column(Text, default="{}", nullable=False)
    attack_timeline_json = Column(Text, default="[]", nullable=False)
    recommended_response_json = Column(Text, default="[]", nullable=False)
    action_history_json = Column(Text, default="[]", nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(50), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    def get_affected_devices(self) -> List[str]:
        try:
            return json.loads(self.affected_devices_json or "[]")
        except Exception:
            return []

    def get_affected_users(self) -> List[str]:
        try:
            return json.loads(self.affected_users_json or "[]")
        except Exception:
            return []

    def get_correlated_alert_ids(self) -> List[str]:
        try:
            return json.loads(self.correlated_alert_ids_json or "[]")
        except Exception:
            return []

    def get_explainable_detection(self) -> Dict[str, Any]:
        try:
            return json.loads(self.explainable_detection_json or "{}")
        except Exception:
            return {}

    def get_risk_breakdown(self) -> Dict[str, Any]:
        try:
            return json.loads(self.risk_breakdown_json or "{}")
        except Exception:
            return {}

    def get_attack_timeline(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.attack_timeline_json or "[]")
        except Exception:
            return []

    def get_recommended_response(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.recommended_response_json or "[]")
        except Exception:
            return []

    def get_action_history(self) -> List[Dict[str, Any]]:
        try:
            return json.loads(self.action_history_json or "[]")
        except Exception:
            return []
