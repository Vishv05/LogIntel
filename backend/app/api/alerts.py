from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from backend.app.api.auth import get_current_user, require_analyst_or_admin
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.alert import (
    AlertAcknowledgeRequest,
    AlertOut,
    AlertResolveRequest,
    AlertStats,
)
from backend.app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts & Threat Intelligence"])


@router.get("", response_model=List[AlertOut])
def list_alerts(
    status: Optional[str] = Query(None, description="OPEN, ACKNOWLEDGED, RESOLVED"),
    severity: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Retrieve security alerts detected by the platform rules."""
    _, alerts = AlertService.get_alerts(
        db=db,
        status=status,
        severity=severity,
        device_id=device_id,
        source_ip=source_ip,
        skip=skip,
        limit=limit
    )
    return alerts


@router.get("/stats", response_model=AlertStats)
def get_alert_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get counts of alerts categorized by status and severity."""
    return AlertService.get_alert_stats(db)


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert_by_id(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Retrieve details of a specific security alert."""
    alert = AlertService.get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found"
        )
    return alert


@router.patch("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_security_alert(
    alert_id: str,
    request: Request,
    body: AlertAcknowledgeRequest = Body(default_factory=AlertAcknowledgeRequest),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Acknowledge an open alert for investigation."""
    alert = AlertService.acknowledge_alert(
        db=db,
        alert_id=alert_id,
        username=current_user.username,
        notes=body.notes,
        ip_address=request.client.host if request.client else None
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found"
        )
    return alert


@router.patch("/{alert_id}/resolve", response_model=AlertOut)
def resolve_security_alert(
    alert_id: str,
    request: Request,
    body: AlertResolveRequest = Body(default_factory=AlertResolveRequest),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Mark an alert as resolved with mitigation notes."""
    alert = AlertService.resolve_alert(
        db=db,
        alert_id=alert_id,
        username=current_user.username,
        notes=body.notes,
        ip_address=request.client.host if request.client else None
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert '{alert_id}' not found"
        )
    return alert


@router.get("/{alert_id}/related-logs", response_model=List[Dict[str, Any]])
def get_alert_related_logs(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Fetch logs from OpenSearch directly associated with this threat alert."""
    return AlertService.get_related_logs_for_alert(db, alert_id)
