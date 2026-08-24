from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from backend.app.api.auth import get_current_user, require_admin, require_analyst_or_admin
from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.device import DeviceCreate, DeviceOut, DeviceStats, DeviceUpdate
from backend.app.services.audit_service import AuditService
from backend.app.services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceOut])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    device_type: Optional[str] = Query(None, description="AWS, FIREWALL, ROUTER, SWITCH, CCTV, SERVER, APPLICATION"),
    status: Optional[str] = Query(None, description="online, offline, warning"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Retrieve list of registered infrastructure log source devices."""
    _, devices = DeviceService.get_devices(
        db=db, skip=skip, limit=limit, device_type=device_type, status=status
    )
    return devices


@router.get("/stats", response_model=DeviceStats)
def get_device_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Get aggregate statistics on device health and counts by type."""
    return DeviceService.get_device_stats(db)


@router.get("/{device_id}", response_model=DeviceOut)
def get_device_details(
    device_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_admin)
):
    """Retrieve details of a single device by ID."""
    device = DeviceService.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    return device


@router.post("", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def create_new_device(
    device_in: DeviceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Register a new log source device."""
    existing = DeviceService.get_device_by_id(db, device_in.device_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Device with ID '{device_in.device_id}' already exists"
        )
    device = DeviceService.create_device(db, device_in)

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_DEVICE",
        resource_type="DEVICE",
        resource_id=device.device_id,
        details=f"Registered device {device.device_id} ({device.device_name}, type: {device.device_type})",
        ip_address=request.client.host if request.client else None
    )
    return device


@router.put("/{device_id}", response_model=DeviceOut)
def update_existing_device(
    device_id: str,
    device_in: DeviceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Update an existing log source device."""
    device = DeviceService.update_device(db, device_id, device_in)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_DEVICE",
        resource_type="DEVICE",
        resource_id=device.device_id,
        details=f"Updated device {device.device_id}",
        ip_address=request.client.host if request.client else None
    )
    return device


@router.delete("/{device_id}")
def delete_existing_device(
    device_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Delete a log source device."""
    success = DeviceService.delete_device(db, device_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="DELETE_DEVICE",
        resource_type="DEVICE",
        resource_id=device_id,
        details=f"Deleted device {device_id}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": f"Device '{device_id}' successfully removed"}


@router.post("/{device_id}/heartbeat")
def ping_device_heartbeat(
    device_id: str,
    status: Optional[str] = Query(None, description="online, offline, warning"),
    db: Session = Depends(get_db)
):
    """Endpoint for device heartbeat / status keepalive."""
    device = DeviceService.update_heartbeat(db, device_id, status)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device '{device_id}' not found"
        )
    return {"status": "ok", "device_id": device_id, "current_status": device.status}
