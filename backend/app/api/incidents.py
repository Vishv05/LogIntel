from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from backend.app.api.auth import require_analyst_or_admin
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.incident import (
    IncidentAcknowledgeRequest,
    IncidentNoteRequest,
    IncidentOut,
    IncidentResolveRequest,
    IncidentStats,
    IncidentSummaryOut,
)
from backend.app.services.correlation_service import CorrelationEngine
from backend.app.services.ai_explainer_service import AIExplainerService

router = APIRouter(prefix="/incidents", tags=["Security Incidents & Event Correlation"])


@router.get("", response_model=List[IncidentSummaryOut])
def list_incidents(
    status: Optional[str] = Query(None, description="OPEN, ACKNOWLEDGED, INVESTIGATING, RESOLVED"),
    severity: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    device_id: Optional[str] = Query(None, description="Filter by primary device ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    List correlated security incidents detected across heterogeneous infrastructure telemetry.
    """
    _, incidents = CorrelationEngine.get_incidents(
        db=db,
        status=status,
        severity=severity,
        source_ip=source_ip,
        device_id=device_id,
        skip=skip,
        limit=limit
    )
    return incidents


@router.get("/stats", response_model=IncidentStats)
def get_incident_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Get aggregated counts and average risk metrics across all correlated incidents.
    """
    return CorrelationEngine.get_incident_stats(db)


@router.post("/correlate", response_model=Dict[str, Any])
def trigger_correlation_engine(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Trigger an on-demand pass of the Event Correlation Engine across all recent telemetry.
    """
    incidents = CorrelationEngine.run_correlation(db)
    return {
        "success": True,
        "correlated_count": len(incidents),
        "message": f"Correlation pass completed. {len(incidents)} active attack patterns analyzed."
    }


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident_details(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Retrieve full incident dossier including summary, affected devices, attack timeline,
    risk score factor breakdown, explainable detection evidence, and analyst action history.
    """
    incident = CorrelationEngine.get_incident_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Incident '{incident_id}' not found"
        )
    
    # Prepare full structure
    return {
        "id": incident.id,
        "incident_id": incident.incident_id,
        "title": incident.title,
        "category": incident.category,
        "severity": incident.severity,
        "risk_score": incident.risk_score,
        "risk_level": incident.risk_level,
        "status": incident.status,
        "source_ip": incident.source_ip,
        "target_ip": incident.target_ip,
        "primary_device_id": incident.primary_device_id,
        "event_count": incident.event_count,
        "pattern_name": incident.pattern_name,
        "summary": incident.summary,
        "detection_rule_id": incident.detection_rule_id,
        "affected_devices": incident.get_affected_devices(),
        "affected_users": incident.get_affected_users(),
        "correlated_alert_ids": incident.get_correlated_alert_ids(),
        "explainable_detection": incident.get_explainable_detection(),
        "risk_breakdown": incident.get_risk_breakdown(),
        "attack_timeline": incident.get_attack_timeline(),
        "recommended_response": incident.get_recommended_response(),
        "action_history": incident.get_action_history(),
        "resolution_notes": incident.resolution_notes,
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
        "resolved_at": incident.resolved_at,
        "resolved_by": incident.resolved_by
    }


@router.patch("/{incident_id}/acknowledge", response_model=IncidentOut)
def acknowledge_incident(
    incident_id: str,
    request: Request,
    body: IncidentAcknowledgeRequest = Body(default_factory=IncidentAcknowledgeRequest),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Analyst action: Acknowledge an incident and transition it to active investigation.
    """
    incident = CorrelationEngine.acknowledge_incident(
        db=db,
        incident_id=incident_id,
        username=current_user.username,
        notes=body.notes,
        ip_address=request.client.host if request.client else None
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Incident '{incident_id}' not found"
        )
    return get_incident_details(incident_id, db, current_user)


@router.post("/{incident_id}/notes", response_model=IncidentOut)
def add_incident_investigation_note(
    incident_id: str,
    request: Request,
    body: IncidentNoteRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Analyst action: Add an investigation note to the incident's immutable action history.
    """
    incident = CorrelationEngine.add_incident_note(
        db=db,
        incident_id=incident_id,
        username=current_user.username,
        note=body.note,
        ip_address=request.client.host if request.client else None
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Incident '{incident_id}' not found"
        )
    return get_incident_details(incident_id, db, current_user)


@router.patch("/{incident_id}/resolve", response_model=IncidentOut)
def resolve_incident(
    incident_id: str,
    request: Request,
    body: IncidentResolveRequest = Body(default_factory=IncidentResolveRequest),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Analyst action: Mark incident as resolved with mitigation verification notes.
    """
    incident = CorrelationEngine.resolve_incident(
        db=db,
        incident_id=incident_id,
        username=current_user.username,
        notes=body.notes,
        ip_address=request.client.host if request.client else None
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Incident '{incident_id}' not found"
        )
    return get_incident_details(incident_id, db, current_user)


@router.get("/{incident_id}/timeline", response_model=List[Dict[str, Any]])
def get_incident_attack_timeline(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Visually reconstruct how an incident occurred over time chronologically:
    First Suspicious Event -> Escalation -> Peak Activity -> Current State.
    """
    incident = CorrelationEngine.get_incident_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Incident '{incident_id}' not found"
        )
    return incident.get_attack_timeline()


@router.get("/{incident_id}/explain", response_model=Dict[str, Any])
def get_incident_ai_explanation(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Generate an AI-assisted executive briefing and analyst guidance for this incident.
    """
    incident = CorrelationEngine.get_incident_by_id(db, incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security Incident '{incident_id}' not found"
        )
    
    inc_dict = {
        "incident_id": incident.incident_id,
        "title": incident.title,
        "category": incident.category,
        "severity": incident.severity,
        "risk_score": incident.risk_score,
        "source_ip": incident.source_ip,
        "affected_devices": incident.get_affected_devices(),
        "event_count": incident.event_count,
        "summary": incident.summary
    }
    return AIExplainerService.explain_incident(inc_dict)
