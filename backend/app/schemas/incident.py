from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class IncidentSummaryOut(BaseModel):
    id: int
    incident_id: str
    title: str
    category: str
    severity: str
    risk_score: int
    risk_level: str
    status: str
    source_ip: Optional[str] = None
    target_ip: Optional[str] = None
    primary_device_id: Optional[str] = None
    event_count: int
    pattern_name: str
    summary: str
    detection_rule_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IncidentOut(IncidentSummaryOut):
    affected_devices: List[str] = []
    affected_users: List[str] = []
    correlated_alert_ids: List[str] = []
    explainable_detection: Dict[str, Any] = {}
    risk_breakdown: Dict[str, Any] = {}
    attack_timeline: List[Dict[str, Any]] = []
    recommended_response: List[Dict[str, Any]] = []
    action_history: List[Dict[str, Any]] = []
    resolution_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class IncidentAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None


class IncidentResolveRequest(BaseModel):
    notes: Optional[str] = None


class IncidentNoteRequest(BaseModel):
    note: str


class IncidentStats(BaseModel):
    total_incidents: int
    open_incidents: int
    acknowledged_incidents: int
    resolved_incidents: int
    critical_incidents: int
    high_incidents: int
    avg_risk_score: float
