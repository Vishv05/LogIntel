from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DeviceBase(BaseModel):
    device_id: str = Field(..., min_length=2, max_length=50)
    device_name: str = Field(..., min_length=2, max_length=100)
    device_type: str  # AWS, FIREWALL, ROUTER, SWITCH, CCTV, SERVER, APPLICATION
    ip_address: str
    location: Optional[str] = "Primary Datacenter"
    status: str = "online"  # online, offline, warning
    is_enabled: bool = True


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    ip_address: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    is_enabled: Optional[bool] = None


class DeviceOut(DeviceBase):
    id: int
    created_at: datetime
    last_seen: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DeviceStats(BaseModel):
    total_devices: int
    online_count: int
    offline_count: int
    warning_count: int
    by_type: dict
