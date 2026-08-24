import asyncio
import logging
import socket
from datetime import datetime, timezone
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.services.log_service import LogService

logger = logging.getLogger("logintel.syslog")


class SyslogUDPProtocol(asyncio.DatagramProtocol):
    def connection_made(self, transport):
        self.transport = transport
        logger.info(f"Syslog UDP listener active on port {settings.SYSLOG_UDP_PORT}")

    def datagram_received(self, data: bytes, addr):
        message = data.decode("utf-8", errors="ignore").strip()
        if not message:
            return
        
        db = SessionLocal()
        try:
            parsed_log = LogService.parse_syslog(message)
            if not parsed_log.get("source_ip"):
                parsed_log["source_ip"] = addr[0]
            LogService.ingest_log(db, parsed_log)
        except Exception as e:
            logger.error(f"Error processing syslog datagram from {addr}: {e}")
        finally:
            db.close()


async def start_syslog_server():
    """Start asynchronous Syslog UDP receiver on configured port."""
    if not settings.SYSLOG_ENABLED:
        return
    try:
        loop = asyncio.get_running_loop()
        transport, protocol = await loop.create_datagram_endpoint(
            lambda: SyslogUDPProtocol(),
            local_addr=("0.0.0.0", settings.SYSLOG_UDP_PORT)
        )
        logger.info(f"Syslog server started on 0.0.0.0:{settings.SYSLOG_UDP_PORT}")
    except Exception as e:
        logger.warning(f"Could not bind Syslog UDP server (port {settings.SYSLOG_UDP_PORT}): {e}")
