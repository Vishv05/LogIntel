from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    user_id: Optional[int] = None
    username: str


class AuditLogOut(AuditLogBase):
    id: int
    timestamp: datetime
    user_id: Optional[int] = None
    username: str

    model_config = ConfigDict(from_attributes=True)


class AuditLogFilter(BaseModel):
    username: Optional[str] = None
    action: Optional[str] = None
    resource_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    page: int = 1
    page_size: int = 50
