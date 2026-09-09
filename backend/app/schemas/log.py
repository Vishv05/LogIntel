from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LogEvent(BaseModel):
    id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source_type: str = Field(..., description="aws, firewall, router, switch, cctv, server, application")
    device_id: str
    device_name: str
    event_type: str
    severity: str = Field(default="info", description="info, low, medium, high, critical")
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = None
    action: Optional[str] = None
    username: Optional[str] = None
    message: str = Field(default="", description="Human-readable event message")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RawLogIngest(BaseModel):
    raw_text: Optional[str] = None
    source_type: Optional[str] = None
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    format: Optional[str] = "json"  # json, syslog, raw


class LogIngestRequest(BaseModel):
    logs: List[LogEvent] = []
    raw_logs: Optional[List[RawLogIngest]] = None


class LogIngestResponse(BaseModel):
    success: bool
    ingested_count: int
    alerts_triggered: int = 0
    errors: List[str] = []


class LogSearchQuery(BaseModel):
    query: Optional[str] = None
    source_type: Optional[str] = None
    severity: Optional[str] = None
    device_id: Optional[str] = None
    event_type: Optional[str] = None
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    action: Optional[str] = None
    username: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    page: int = 1
    page_size: int = 50
    sort_field: str = "timestamp"
    sort_order: str = "desc"


class LogSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    logs: List[LogEvent]
