from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from backend.app.api.auth import require_admin
from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.schemas.user import UserCreate, UserOut, UserUpdate
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: List all user accounts and their assigned RBAC roles."""
    users = db.query(User).order_by(User.id.asc()).all()
    return users


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user_account(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Create a new user with Admin or Security Analyst role."""
    existing_username = db.query(User).filter(User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_in.username}' is already registered"
        )
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_in.email}' is already registered"
        )

    valid_roles = ("admin", "security_analyst", "viewer", "user")
    assigned_role = user_in.role.lower() if user_in.role and user_in.role.lower() in valid_roles else "user"

    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=assigned_role,
        is_active=user_in.is_active,
        created_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="CREATE_USER",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Created user {user.username} with role {user.role} and email {user.email}",
        ip_address=request.client.host if request.client else None
    )
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Get user details by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user_account(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Update user profile, role, or active status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    before_state = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active
    }

    update_data = user_in.model_dump(exclude_unset=True)
    if "role" in update_data and update_data["role"]:
        valid_roles = ("admin", "security_analyst", "viewer", "user")
        new_role = update_data["role"].lower()
        if new_role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role '{new_role}'. Allowed: {', '.join(valid_roles)}"
            )
        update_data["role"] = new_role

    if "password" in update_data and update_data["password"]:
        user.hashed_password = get_password_hash(update_data.pop("password"))

    for field, val in update_data.items():
        setattr(user, field, val)

    db.commit()
    db.refresh(user)

    after_state = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active
    }

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="UPDATE_USER",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Updated user {user.username}. Before: {before_state}, After: {after_state}",
        ip_address=request.client.host if request.client else None
    )
    return user


@router.delete("/{user_id}")
def deactivate_user_account(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Admin only: Deactivate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate currently authenticated admin user"
        )

    user.is_active = False
    db.commit()

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="DEACTIVATE_USER",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Deactivated user {user.username}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": f"User '{user.username}' deactivated"}
