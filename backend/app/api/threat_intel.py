from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.api.auth import require_analyst_or_admin
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.services.threat_intel_service import ThreatIntelService

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence & IP Analysis"])


@router.get("/ip/{ip_address}", response_model=Dict[str, Any])
def analyze_ip_address(
    ip_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Threat Intelligence: Investigate a specific IP address.
    Returns dynamic threat reputation score, Geo/ASN profiling, observed event telemetry,
    targeted ports/devices, and associated alerts or security incidents.
    """
    if not ip_address or ip_address.strip() == "":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="IP address must be specified")
    
    return ThreatIntelService.analyze_ip(ip_address.strip(), db=db)


@router.get("/suspicious-ips", response_model=List[Dict[str, Any]])
def get_suspicious_ip_rankings(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Retrieve ranked list of top suspicious IP addresses identified across all collected logs.
    """
    return ThreatIntelService.get_top_suspicious_ips(db=db, limit=limit)
