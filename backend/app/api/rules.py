import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from backend.app.api.auth import require_admin
from backend.app.core.database import get_db
from backend.app.models.rule import DetectionRule
from backend.app.models.user import User
from backend.app.schemas.rule import DetectionRuleCreate, DetectionRuleOut, DetectionRuleUpdate
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/rules", tags=["Detection Rules"])


@router.get("", response_model=List[DetectionRuleOut])
def list_detection_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: List all active and configured threat detection rules."""
    rules = db.query(DetectionRule).order_by(DetectionRule.id.asc()).all()
    return rules


@router.get("/{rule_id}", response_model=DetectionRuleOut)
def get_detection_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Get rule by rule ID."""
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Detection rule '{rule_id}' not found"
        )
    return rule


@router.post("", response_model=DetectionRuleOut, status_code=status.HTTP_201_CREATED)
def create_detection_rule(
    rule_in: DetectionRuleCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Create a new custom threat detection rule."""
    existing = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_in.rule_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rule with ID '{rule_in.rule_id}' already exists"
        )

    rule = DetectionRule(
        rule_id=rule_in.rule_id,
        name=rule_in.name,
        description=rule_in.description,
        severity=rule_in.severity.upper(),
        event_type=rule_in.event_type.upper() if rule_in.event_type else None,
        threshold=rule_in.threshold,
        window_seconds=rule_in.window_seconds,
        conditions=json.dumps(rule_in.conditions or {}),
        is_enabled=rule_in.is_enabled,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_RULE",
        resource_type="RULE",
        resource_id=rule.rule_id,
        details=f"Created detection rule {rule.rule_id} ({rule.name})",
        ip_address=request.client.host if request.client else None
    )
    return rule


@router.put("/{rule_id}", response_model=DetectionRuleOut)
def update_detection_rule(
    rule_id: str,
    rule_in: DetectionRuleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Update an existing threat detection rule."""
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{rule_id}' not found"
        )

    update_data = rule_in.model_dump(exclude_unset=True)
    if "severity" in update_data and update_data["severity"]:
        rule.severity = update_data["severity"].upper()
    if "name" in update_data and update_data["name"]:
        rule.name = update_data["name"]
    if "description" in update_data and update_data["description"]:
        rule.description = update_data["description"]
    if "threshold" in update_data and update_data["threshold"] is not None:
        rule.threshold = update_data["threshold"]
    if "window_seconds" in update_data and update_data["window_seconds"] is not None:
        rule.window_seconds = update_data["window_seconds"]
    if "is_enabled" in update_data and update_data["is_enabled"] is not None:
        rule.is_enabled = update_data["is_enabled"]
    if "conditions" in update_data and update_data["conditions"] is not None:
        rule.conditions = json.dumps(update_data["conditions"])

    rule.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rule)

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_RULE",
        resource_type="RULE",
        resource_id=rule.rule_id,
        details=f"Updated detection rule {rule.rule_id}",
        ip_address=request.client.host if request.client else None
    )
    return rule


@router.patch("/{rule_id}/toggle", response_model=DetectionRuleOut)
def toggle_detection_rule(
    rule_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Toggle enabled/disabled state of a detection rule."""
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{rule_id}' not found"
        )
    rule.is_enabled = not rule.is_enabled
    rule.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rule)

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="TOGGLE_RULE",
        resource_type="RULE",
        resource_id=rule.rule_id,
        details=f"Rule {rule.rule_id} status set to is_enabled={rule.is_enabled}",
        ip_address=request.client.host if request.client else None
    )
    return rule


@router.delete("/{rule_id}")
def delete_detection_rule(
    rule_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Delete a detection rule."""
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{rule_id}' not found"
        )
    db.delete(rule)
    db.commit()

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="DELETE_RULE",
        resource_type="RULE",
        resource_id=rule_id,
        details=f"Deleted detection rule {rule_id}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": f"Rule '{rule_id}' deleted"}
