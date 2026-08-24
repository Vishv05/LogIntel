from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)
    device_name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)  # AWS, FIREWALL, ROUTER, SWITCH, CCTV, SERVER, APPLICATION
    ip_address = Column(String(50), nullable=False)
    location = Column(String(100), nullable=True, default="Primary Datacenter")
    status = Column(String(20), default="online", nullable=False)  # online, offline, warning
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_seen = Column(DateTime(timezone=True), nullable=True)
