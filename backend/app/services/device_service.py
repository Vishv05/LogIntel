from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.device import Device
from backend.app.schemas.device import DeviceCreate, DeviceUpdate


class DeviceService:
    @staticmethod
    def get_devices(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        device_type: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[int, List[Device]]:
        query = db.query(Device)
        if device_type:
            query = query.filter(Device.device_type == device_type.upper())
        if status:
            query = query.filter(Device.status == status.lower())
        
        total = query.count()
        devices = query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()
        return total, devices

    @staticmethod
    def get_device_by_id(db: Session, device_id: str) -> Optional[Device]:
        return db.query(Device).filter(Device.device_id == device_id).first()

    @staticmethod
    def create_device(db: Session, device_in: DeviceCreate) -> Device:
        device = Device(
            device_id=device_in.device_id,
            device_name=device_in.device_name,
            device_type=device_in.device_type.upper(),
            ip_address=device_in.ip_address,
            location=device_in.location or "Primary Datacenter",
            status=device_in.status.lower() if device_in.status else "online",
            is_enabled=device_in.is_enabled,
            created_at=datetime.now(timezone.utc),
            last_seen=datetime.now(timezone.utc)
        )
        db.add(device)
        db.commit()
        db.refresh(device)
        return device

    @staticmethod
    def update_device(db: Session, device_id: str, device_in: DeviceUpdate) -> Optional[Device]:
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device:
            return None
        
        update_data = device_in.model_dump(exclude_unset=True)
        if "device_type" in update_data and update_data["device_type"]:
            update_data["device_type"] = update_data["device_type"].upper()
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].lower()
            
        for field, val in update_data.items():
            setattr(device, field, val)
            
        db.commit()
        db.refresh(device)
        return device

    @staticmethod
    def delete_device(db: Session, device_id: str) -> bool:
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if not device:
            return False
        db.delete(device)
        db.commit()
        return True

    @staticmethod
    def update_heartbeat(db: Session, device_id: str, status: Optional[str] = None) -> Optional[Device]:
        device = db.query(Device).filter(Device.device_id == device_id).first()
        if device:
            device.last_seen = datetime.now(timezone.utc)
            if status:
                device.status = status.lower()
            elif device.status == "offline":
                device.status = "online"
            db.commit()
            db.refresh(device)
        return device

    @staticmethod
    def get_device_stats(db: Session) -> Dict:
        devices = db.query(Device).all()
        total = len(devices)
        online = sum(1 for d in devices if d.status == "online")
        offline = sum(1 for d in devices if d.status == "offline")
        warning = sum(1 for d in devices if d.status == "warning")
        
        by_type = {}
        for d in devices:
            by_type[d.device_type] = by_type.get(d.device_type, 0) + 1
            
        return {
            "total_devices": total,
            "online_count": online,
            "offline_count": offline,
            "warning_count": warning,
            "by_type": by_type
        }
