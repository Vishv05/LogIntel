from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.api.auth import require_admin
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.audit import AuditLogOut
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    username: Optional[str] = Query(None, description="Filter by performing username"),
    action: Optional[str] = Query(None, description="Filter by action name"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Retrieve chronological audit trail of all security and administrative events."""
    _, logs = AuditService.get_logs(
        db=db,
        username=username,
        action=action,
        resource_type=resource_type,
        skip=skip,
        limit=limit
    )
    return logs
