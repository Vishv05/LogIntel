from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AlertBase(BaseModel):
    alert_id: str
    rule_id: str
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    title: str
    description: str
    source_ip: Optional[str] = None
    device_id: Optional[str] = None
    event_count: int = 1
    status: str = "OPEN"  # OPEN, ACKNOWLEDGED, RESOLVED


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    resolution_notes: Optional[str] = None


class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None


class AlertResolveRequest(BaseModel):
    notes: Optional[str] = None


class AlertOut(AlertBase):
    id: int
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AlertStats(BaseModel):
    total_alerts: int
    open_alerts: int
    acknowledged_alerts: int
    resolved_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
