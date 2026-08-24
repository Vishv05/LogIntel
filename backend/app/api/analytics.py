from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.api.auth import require_analyst_or_admin
from backend.app.core.database import get_db
from backend.app.core.opensearch import log_storage
from backend.app.models.user import User
from backend.app.schemas.analytics import (
    AnalyticsSummary,
    OverviewStats,
    PortActivity,
    SeverityCount,
    SourceCount,
    TimelinePoint,
    TopEventType,
    TopIP,
)
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Reporting"])


@router.get("/summary", response_model=AnalyticsSummary)
def get_full_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Get full analytics summary including KPI cards, event timeline,
    source distribution, severity breakdown, top source IPs, top events, and targeted ports.
    """
    return AnalyticsService.get_dashboard_summary(db)


@router.get("/overview", response_model=OverviewStats)
def get_overview_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get high-level KPI cards for the dashboard header."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["overview"]


@router.get("/timeline", response_model=List[TimelinePoint])
def get_events_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get time-series event velocity for area and line charts."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["timeline"]


@router.get("/sources", response_model=List[SourceCount])
def get_logs_by_source_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get log distribution across infrastructure source types (AWS, Firewall, etc.)."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["sources"]


@router.get("/severity", response_model=List[SeverityCount])
def get_logs_by_severity_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get log distribution by severity level (Critical, High, Medium, Low, Info)."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["severities"]


@router.get("/top-ips", response_model=List[TopIP])
def get_top_source_ips(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get top source IP addresses generating events or security violations."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["top_ips"]


@router.get("/top-events", response_model=List[TopEventType])
def get_top_event_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get highest-frequency event types across the monitored estate."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["top_events"]


@router.get("/top-ports", response_model=List[PortActivity])
def get_top_targeted_ports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get most targeted network destination ports."""
    summary = AnalyticsService.get_dashboard_summary(db)
    return summary["top_ports"]
