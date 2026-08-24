from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from backend.app.api.auth import require_analyst_or_admin
from backend.app.core.database import get_db
from backend.app.core.opensearch import log_storage
from backend.app.models.user import User
from backend.app.schemas.log import LogEvent, LogIngestResponse, LogSearchResponse
from backend.app.services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["Logs & Ingestion"])


@router.post("/ingest", response_model=LogIngestResponse)
def ingest_logs(
    payload: Union[Dict[str, Any], List[Dict[str, Any]]] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Ingest logs via HTTP/HTTPS JSON endpoint.
    Accepts a single log object or an array of normalized log objects.
    Enriches, indexes to OpenSearch, and evaluates against Threat Detection Rules in real-time.
    """
    if isinstance(payload, list):
        logs = payload
    elif isinstance(payload, dict) and "logs" in payload and isinstance(payload["logs"], list):
        logs = payload["logs"]
    else:
        logs = [payload]

    ingested_count = 0
    alerts_triggered = 0
    errors = []

    for item in logs:
        try:
            _, triggered = LogService.ingest_log(db, item)
            ingested_count += 1
            alerts_triggered += len(triggered)
        except Exception as e:
            errors.append(str(e))

    return {
        "success": len(errors) == 0,
        "ingested_count": ingested_count,
        "alerts_triggered": alerts_triggered,
        "errors": errors
    }


@router.post("/ingest/syslog", response_model=LogIngestResponse)
def ingest_syslog_raw(
    request: Request,
    body: str = Body(..., media_type="text/plain"),
    db: Session = Depends(get_db)
):
    """
    Ingest raw Syslog (RFC3164 / RFC5424) lines.
    Parses, normalizes, indexes to OpenSearch, and runs Threat Detection.
    """
    lines = [line.strip() for line in body.splitlines() if line.strip()]
    ingested_count = 0
    alerts_triggered = 0
    errors = []

    for line in lines:
        try:
            parsed_log = LogService.parse_syslog(line)
            _, triggered = LogService.ingest_log(db, parsed_log)
            ingested_count += 1
            alerts_triggered += len(triggered)
        except Exception as e:
            errors.append(f"Error parsing line '{line[:30]}...': {e}")

    return {
        "success": len(errors) == 0,
        "ingested_count": ingested_count,
        "alerts_triggered": alerts_triggered,
        "errors": errors
    }


@router.get("", response_model=LogSearchResponse)
def search_and_explore_logs(
    query: Optional[str] = Query(None, description="Keyword search in messages and payload"),
    source_type: Optional[str] = Query(None, description="aws, firewall, router, switch, cctv, server, application"),
    severity: Optional[str] = Query(None, description="info, low, medium, high, critical"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    destination_ip: Optional[str] = Query(None, description="Filter by destination IP"),
    action: Optional[str] = Query(None, description="ALLOW, DENY, BLOCK, etc."),
    username: Optional[str] = Query(None, description="Filter by username"),
    start_time: Optional[datetime] = Query(None, description="Start time ISO-8601"),
    end_time: Optional[datetime] = Query(None, description="End time ISO-8601"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort_field: str = Query("timestamp", description="timestamp, severity, source_type, event_type"),
    sort_order: str = Query("desc", description="asc or desc"),
    current_user: User = Depends(require_analyst_or_admin)
):
    """
    Search, filter, and explore logs stored in OpenSearch.
    Provides multi-dimensional filtering, full-text search, time-bounding, and pagination.
    """
    total, logs = log_storage.search_logs(
        query=query,
        source_type=source_type,
        severity=severity,
        device_id=device_id,
        event_type=event_type,
        source_ip=source_ip,
        destination_ip=destination_ip,
        action=action,
        username=username,
        start_time=start_time,
        end_time=end_time,
        page=page,
        page_size=page_size,
        sort_field=sort_field,
        sort_order=sort_order
    )

    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(total_pages, 1),
        "logs": logs
    }


@router.get("/{log_id}", response_model=Dict[str, Any])
def get_log_details(
    log_id: str,
    current_user: User = Depends(require_analyst_or_admin)
):
    """Retrieve full structured document for a single log from OpenSearch."""
    log_doc = log_storage.get_log_by_id(log_id)
    if not log_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Log with ID '{log_id}' not found"
        )
    return log_doc
