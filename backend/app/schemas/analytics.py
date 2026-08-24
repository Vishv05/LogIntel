from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_logs: int
    critical_events: int
    active_devices: int
    open_alerts: int
    total_alerts: int
    events_last_hour: int
    failed_logins: int
    blocked_connections: int


class TimelinePoint(BaseModel):
    timestamp: str
    count: int
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class SourceCount(BaseModel):
    source: str
    count: int
    percentage: float = 0.0


class SeverityCount(BaseModel):
    severity: str
    count: int
    color: Optional[str] = None


class TopIP(BaseModel):
    ip: str
    count: int
    blocked_count: int = 0
    failed_login_count: int = 0


class TopEventType(BaseModel):
    event_type: str
    count: int
    severity: Optional[str] = None


class PortActivity(BaseModel):
    port: int
    protocol: Optional[str] = "TCP"
    count: int


class AnalyticsSummary(BaseModel):
    overview: OverviewStats
    timeline: List[TimelinePoint]
    sources: List[SourceCount]
    severities: List[SeverityCount]
    top_ips: List[TopIP]
    top_events: List[TopEventType]
    top_ports: List[PortActivity]
