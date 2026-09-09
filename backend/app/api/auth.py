from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)
from backend.app.models.user import User
from backend.app.schemas.user import PasswordChange, Token, UserCreate, UserLogin, UserOut, UserRegister
from backend.app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORDS = ("admin123", "adminpassword123")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency: Extract and validate user from JWT Bearer token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = db.query(User).filter((User.username == username) | (User.email == username)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Restrict endpoint to admin role (Admin side)."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required for this operation"
        )
    return current_user


def require_user_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency: Allow user, analyst, viewer, and admin roles (User/Analyst side)."""
    if current_user.role not in ("admin", "user", "security_analyst", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user


# Backwards-compatibility alias
require_analyst_or_admin = require_user_or_admin


def _authenticate_or_provision_user(
    identifier_raw: str,
    password_raw: str,
    db: Session,
    ip_addr: Optional[str] = None
) -> User:
    """
    Central authentication & auto-provisioning logic:
    - Admin: Identified by Mail-id 'admin@gmail.com' (or username 'admin') with password 'admin123'.
    - User: Any other mail-id & password is an authenticated standard User (auto-registers if first visit).
    """
    ident = identifier_raw.strip().lower()
    is_admin = (ident == ADMIN_EMAIL or ident == "admin")

    if is_admin:
        # 1. Admin Authentication
        admin_user = db.query(User).filter(
            (User.email == ADMIN_EMAIL) | (User.username == "admin")
        ).first()

        if not admin_user:
            admin_user = User(
                username="admin",
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role="admin",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        valid_pwd = verify_password(password_raw, admin_user.hashed_password)
        if not valid_pwd and password_raw in ADMIN_PASSWORDS:
            admin_user.hashed_password = get_password_hash(password_raw)
            admin_user.role = "admin"
            admin_user.email = ADMIN_EMAIL
            db.commit()
            valid_pwd = True

        if not valid_pwd:
            AuditService.log_action(
                db=db,
                username=ident,
                action="LOGIN_FAILED",
                resource_type="USER",
                details="Invalid password for Administrator account",
                ip_address=ip_addr
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password for Administrator account",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Enforce role and email for Admin
        if admin_user.role != "admin" or admin_user.email != ADMIN_EMAIL:
            admin_user.role = "admin"
            admin_user.email = ADMIN_EMAIL
            db.commit()

        user = admin_user

    else:
        # 2. Standard User Authentication ("User can use any mail-id and password")
        user = db.query(User).filter(
            (User.email == ident) | (User.username == ident)
        ).first()

        if not user:
            # Auto-provision new User with role 'user'
            base_name = ident.split("@")[0].replace(" ", "_")[:30] or "user"
            candidate_username = base_name
            counter = 1
            while db.query(User).filter(User.username == candidate_username).first():
                candidate_username = f"{base_name}_{counter}"
                counter += 1

            email_val = identifier_raw.strip() if "@" in identifier_raw else f"{identifier_raw.strip()}@user.local"
            user = User(
                username=candidate_username,
                email=email_val,
                hashed_password=get_password_hash(password_raw),
                full_name=base_name.replace("_", " ").title(),
                role="user",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            AuditService.log_action(
                db=db,
                user_id=user.id,
                username=user.username,
                action="USER_REGISTER_AUTO",
                resource_type="USER",
                resource_id=str(user.id),
                details=f"Auto-registered user with mail-id {user.email} and role user",
                ip_address=ip_addr
            )
        else:
            # Existing User: verify password
            if not verify_password(password_raw, user.hashed_password):
                AuditService.log_action(
                    db=db,
                    username=user.username,
                    action="LOGIN_FAILED",
                    resource_type="USER",
                    details=f"Incorrect password for user {user.username}",
                    ip_address=ip_addr
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect password for this user account",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Ensure role is valid without overwriting assigned analyst or viewer roles
            if user.role not in ("admin", "user", "security_analyst", "viewer") and user.email != ADMIN_EMAIL and user.username != "admin":
                user.role = "user"
                db.commit()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    AuditService.log_action(
        db=db,
        user_id=user.id,
        username=user.username,
        action="LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"User {user.username} ({user.email}) logged in with role {user.role}",
        ip_address=ip_addr
    )

    return user


@router.post("/login", response_model=Token)
def login(
    login_data: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user:
    - Admin: Identified by Mail-id 'admin@gmail.com' and Password 'admin123' (full access: Admin & User sides).
    - User: Can use ANY mail-id and password (restricted to User side only).
    """
    ip_addr = request.client.host if request.client else None
    user = _authenticate_or_provision_user(
        identifier_raw=login_data.username,
        password_raw=login_data.password,
        db=db,
        ip_addr=ip_addr
    )
    access_token = create_access_token(subject=user.username, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/register", response_model=Token)
def register(
    register_data: UserRegister,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new standard user:
    - Any user can register with any mail-id and password as role 'user'.
    - 'admin@gmail.com' is reserved for Administrator.
    """
    clean_email = register_data.email.strip().lower()
    if clean_email in (ADMIN_EMAIL, "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The email 'admin@gmail.com' is reserved for Administrator. Please use Login.",
        )

    existing = db.query(User).filter(
        (User.email == clean_email) | (User.username == register_data.username)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email is already registered. Please log in.",
        )

    base_name = (register_data.username or clean_email.split("@")[0]).strip()
    candidate_username = base_name
    counter = 1
    while db.query(User).filter(User.username == candidate_username).first():
        candidate_username = f"{base_name}_{counter}"
        counter += 1

    new_user = User(
        username=candidate_username,
        email=clean_email,
        hashed_password=get_password_hash(register_data.password),
        full_name=register_data.full_name or base_name.replace("_", " ").title(),
        role="user",
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    ip_addr = request.client.host if request.client else None
    AuditService.log_action(
        db=db,
        user_id=new_user.id,
        username=new_user.username,
        action="USER_REGISTER",
        resource_type="USER",
        resource_id=str(new_user.id),
        details=f"Registered user {new_user.username} ({new_user.email}) with role user",
        ip_address=ip_addr
    )

    access_token = create_access_token(subject=new_user.username, role=new_user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """OAuth2 compatible token login for Swagger UI documentation."""
    user = _authenticate_or_provision_user(
        identifier_raw=form_data.username,
        password_raw=form_data.password,
        db=db
    )
    access_token = create_access_token(subject=user.username, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log out active session and record audit trail."""
    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="LOGOUT",
        resource_type="USER",
        resource_id=str(current_user.id),
        details=f"User {current_user.username} logged out",
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get profile information of currently authenticated user."""
    return current_user


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password."""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed"
        )
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    AuditService.log_action(
        db=db,
        user_id=current_user.id,
        username=current_user.username,
        action="PASSWORD_CHANGE",
        resource_type="USER",
        resource_id=str(current_user.id),
        details=f"Password updated for user {current_user.username}",
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Password changed successfully"}
