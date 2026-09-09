import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.core.opensearch import log_storage
from backend.app.models.device import Device
from backend.app.schemas.log import LogEvent
from backend.app.services.detection_service import DetectionEngine
from backend.app.services.device_service import DeviceService

logger = logging.getLogger("logintel.logs")


class LogService:
    @staticmethod
    def ingest_log(db: Session, log_data: Dict[str, Any]) -> Tuple[str, List[Any]]:
        """
        Ingest, normalize, enrich, index, and trigger threat detection on a single log.
        """
        # 1. Normalize fields
        device_id = log_data.get("device_id") or "UNKNOWN-DEV"
        device_name = log_data.get("device_name") or device_id
        source_type = (log_data.get("source_type") or "server").lower()
        severity = (log_data.get("severity") or "info").lower()
        event_type = (log_data.get("event_type") or "EVENT").upper()

        if "timestamp" not in log_data or not log_data["timestamp"]:
            log_data["timestamp"] = datetime.now(timezone.utc).isoformat()
        elif isinstance(log_data["timestamp"], datetime):
            log_data["timestamp"] = log_data["timestamp"].isoformat()

        log_data["source_type"] = source_type
        log_data["severity"] = severity
        log_data["event_type"] = event_type
        log_data["device_id"] = device_id
        log_data["device_name"] = device_name
        if "message" not in log_data or not log_data["message"]:
            log_data["message"] = f"{source_type.upper()} {event_type} event on {device_name}"

        # 2. Update device heartbeat or auto-register if new
        existing_device = db.query(Device).filter(Device.device_id == device_id).first()
        if existing_device:
            existing_device.last_seen = datetime.now(timezone.utc)
            if existing_device.status == "offline":
                existing_device.status = "online"
            db.commit()
        else:
            # Auto-register newly discovered device
            try:
                new_dev = Device(
                    device_id=device_id,
                    device_name=device_name,
                    device_type=source_type.upper(),
                    ip_address=log_data.get("source_ip") or "127.0.0.1",
                    location="Auto-Discovered",
                    status="online",
                    is_enabled=True,
                    created_at=datetime.now(timezone.utc),
                    last_seen=datetime.now(timezone.utc)
                )
                db.add(new_dev)
                db.commit()
            except Exception as e:
                db.rollback()
                logger.warning(f"Could not auto-register device {device_id}: {e}")

        # 3. Index into OpenSearch / Storage Engine
        log_id = log_storage.index_log(log_data)

        # 4. Evaluate against Threat Detection Rules
        triggered_alerts = DetectionEngine.evaluate_log(db, log_data)

        return log_id, triggered_alerts

    @staticmethod
    def ingest_bulk(db: Session, logs: List[Dict[str, Any]]) -> Tuple[int, int]:
        """Bulk ingest and process multiple logs."""
        ingested_count = 0
        total_alerts = 0
        for log in logs:
            try:
                _, alerts = LogService.ingest_log(db, log)
                ingested_count += 1
                total_alerts += len(alerts)
            except Exception as e:
                logger.error(f"Error ingesting log: {e}")
        return ingested_count, total_alerts

    @staticmethod
    def parse_syslog(raw_line: str) -> Dict[str, Any]:
        """
        Parse standard Syslog RFC3164 / RFC5424 formatted string into normalized LogEvent.
        Example: <134>Aug 23 10:30:00 fw-01 firewall: DENY TCP 192.168.1.50:45321 -> 10.0.0.25:22 Connection blocked
        """
        raw_line = raw_line.strip()
        timestamp = datetime.now(timezone.utc).isoformat()
        severity = "info"
        source_type = "firewall"
        device_id = "SYSLOG-DEV"
        device_name = "Syslog Source"
        event_type = "SYSLOG_EVENT"
        action = None
        source_ip = None
        destination_ip = None
        source_port = None
        destination_port = None
        protocol = "TCP"
        message = raw_line

        # Match IP addresses
        ip_pattern = r'(\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b)'
        ips = re.findall(ip_pattern, raw_line)
        if len(ips) >= 1:
            source_ip = ips[0]
        if len(ips) >= 2:
            destination_ip = ips[1]

        # Match ports
        port_pattern = r':(\d{1,5})'
        ports = re.findall(port_pattern, raw_line)
        if len(ports) >= 1:
            source_port = int(ports[0])
        if len(ports) >= 2:
            destination_port = int(ports[1])

        # Severity detection
        lower_msg = raw_line.lower()
        if "critical" in lower_msg or "panic" in lower_msg or "tamper" in lower_msg:
            severity = "critical"
        elif "error" in lower_msg or "deny" in lower_msg or "block" in lower_msg or "failed" in lower_msg:
            severity = "high"
        elif "warning" in lower_msg or "warn" in lower_msg:
            severity = "medium"

        # Action detection
        if "deny" in lower_msg or "drop" in lower_msg:
            action = "DENY"
        elif "block" in lower_msg:
            action = "BLOCK"
        elif "allow" in lower_msg or "accept" in lower_msg or "pass" in lower_msg:
            action = "ALLOW"
        elif "login" in lower_msg and "fail" in lower_msg:
            action = "LOGIN_FAILURE"
            event_type = "LOGIN_FAILED"

        return {
            "timestamp": timestamp,
            "source_type": source_type,
            "device_id": device_id,
            "device_name": device_name,
            "event_type": event_type,
            "severity": severity,
            "source_ip": source_ip,
            "destination_ip": destination_ip,
            "source_port": source_port,
            "destination_port": destination_port,
            "protocol": protocol,
            "action": action,
            "username": None,
            "message": message,
            "metadata": {"raw_syslog": raw_line}
        }
