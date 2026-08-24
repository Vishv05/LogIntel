import json
import logging
import sqlite3
import threading
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
from opensearchpy import OpenSearch, RequestsHttpConnection
from backend.app.core.config import settings

logger = logging.getLogger("logintel.opensearch")


class LogStorageEngine:
    """
    Unified Log Storage & Search Engine.
    Connects to OpenSearch when available, and provides an automatic fallback
    structured storage engine for zero-dependency standalone local development and testing.
    """

    def __init__(self):
        self._os_client: Optional[OpenSearch] = None
        self._is_opensearch_connected = False
        self._lock = threading.Lock()
        self._db_path = "logintel_opensearch_store.db"
        self._init_fallback_db()
        self._connect_opensearch()

    def _init_fallback_db(self):
        """Initialize fallback structured SQLite storage for OpenSearch queries."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS opensearch_logs (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    device_id TEXT NOT NULL,
                    device_name TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    source_ip TEXT,
                    destination_ip TEXT,
                    source_port INTEGER,
                    destination_port INTEGER,
                    protocol TEXT,
                    action TEXT,
                    username TEXT,
                    message TEXT NOT NULL,
                    metadata_json TEXT,
                    raw_doc TEXT NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON opensearch_logs(timestamp)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_source_type ON opensearch_logs(source_type)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_severity ON opensearch_logs(severity)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_device_id ON opensearch_logs(device_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_source_ip ON opensearch_logs(source_ip)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_logs_event_type ON opensearch_logs(event_type)")
            conn.commit()

    def _connect_opensearch(self):
        """Try connecting to OpenSearch cluster."""
        try:
            auth = None
            if settings.OPENSEARCH_USER and settings.OPENSEARCH_PASSWORD:
                auth = (settings.OPENSEARCH_USER, settings.OPENSEARCH_PASSWORD)

            client = OpenSearch(
                hosts=[{"host": settings.OPENSEARCH_HOST, "port": settings.OPENSEARCH_PORT}],
                http_auth=auth,
                use_ssl=settings.OPENSEARCH_USE_SSL,
                verify_certs=settings.OPENSEARCH_VERIFY_CERTS,
                connection_class=RequestsHttpConnection,
                timeout=3,
                max_retries=1,
            )
            info = client.info()
            self._os_client = client
            self._is_opensearch_connected = True
            logger.info(f"Connected to OpenSearch: {info.get('version', {}).get('number', 'unknown')}")
            self._create_index_template()
        except Exception as e:
            self._is_opensearch_connected = False
            self._os_client = None
            logger.info(f"OpenSearch server not reachable at {settings.OPENSEARCH_HOST}:{settings.OPENSEARCH_PORT} ({e}). Using embedded high-performance log storage engine.")

    def _create_index_template(self):
        if not self._is_opensearch_connected or not self._os_client:
            return
        try:
            index_name = f"{settings.OPENSEARCH_INDEX_PREFIX}-default"
            if not self._os_client.indices.exists(index=index_name):
                body = {
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    },
                    "mappings": {
                        "properties": {
                            "timestamp": {"type": "date"},
                            "source_type": {"type": "keyword"},
                            "device_id": {"type": "keyword"},
                            "device_name": {"type": "keyword"},
                            "event_type": {"type": "keyword"},
                            "severity": {"type": "keyword"},
                            "source_ip": {"type": "ip"},
                            "destination_ip": {"type": "ip"},
                            "source_port": {"type": "integer"},
                            "destination_port": {"type": "integer"},
                            "protocol": {"type": "keyword"},
                            "action": {"type": "keyword"},
                            "username": {"type": "keyword"},
                            "message": {"type": "text"},
                            "metadata": {"type": "object"}
                        }
                    }
                }
                self._os_client.indices.create(index=index_name, body=body)
        except Exception as e:
            logger.warning(f"Could not create OpenSearch index template: {e}")

    def is_connected(self) -> bool:
        return self._is_opensearch_connected

    def get_health_status(self) -> Dict[str, Any]:
        if self._is_opensearch_connected and self._os_client:
            try:
                cluster_health = self._os_client.cluster.health()
                return {
                    "mode": "opensearch",
                    "status": cluster_health.get("status", "green"),
                    "cluster_name": cluster_health.get("cluster_name"),
                    "nodes": cluster_health.get("number_of_nodes"),
                }
            except Exception:
                pass
        return {
            "mode": "embedded_engine",
            "status": "green",
            "storage": "sqlite_indexed",
            "search_capability": "full_text_and_aggregations"
        }

    def index_log(self, log_data: Dict[str, Any]) -> str:
        """Index a single normalized log entry."""
        log_id = log_data.get("id") or str(uuid.uuid4())
        log_data["id"] = log_id

        # Normalize timestamp format
        ts = log_data.get("timestamp")
        if isinstance(ts, datetime):
            iso_ts = ts.isoformat()
            log_data["timestamp"] = iso_ts
        elif isinstance(ts, str):
            iso_ts = ts
        else:
            iso_ts = datetime.now(timezone.utc).isoformat()
            log_data["timestamp"] = iso_ts

        # 1. Store in fallback/local store
        self._store_fallback_log(log_data)

        # 2. Store in OpenSearch if connected
        if self._is_opensearch_connected and self._os_client:
            try:
                index_date = iso_ts[:10].replace("-", ".")
                index_name = f"{settings.OPENSEARCH_INDEX_PREFIX}-{index_date}"
                self._os_client.index(index=index_name, id=log_id, body=log_data)
            except Exception as e:
                logger.warning(f"Failed to push log to OpenSearch: {e}")

        return log_id

    def bulk_index_logs(self, logs: List[Dict[str, Any]]) -> int:
        """Index multiple logs in bulk."""
        count = 0
        for log in logs:
            self.index_log(log)
            count += 1
        return count

    def _store_fallback_log(self, log_data: Dict[str, Any]):
        with self._lock:
            with sqlite3.connect(self._db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO opensearch_logs (
                        id, timestamp, source_type, device_id, device_name,
                        event_type, severity, source_ip, destination_ip,
                        source_port, destination_port, protocol, action,
                        username, message, metadata_json, raw_doc
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    log_data["id"],
                    log_data.get("timestamp"),
                    log_data.get("source_type", "unknown").lower(),
                    log_data.get("device_id", "unknown"),
                    log_data.get("device_name", "unknown"),
                    log_data.get("event_type", "unknown").upper(),
                    log_data.get("severity", "info").lower(),
                    log_data.get("source_ip"),
                    log_data.get("destination_ip"),
                    log_data.get("source_port"),
                    log_data.get("destination_port"),
                    log_data.get("protocol"),
                    log_data.get("action"),
                    log_data.get("username"),
                    log_data.get("message", ""),
                    json.dumps(log_data.get("metadata", {})),
                    json.dumps(log_data)
                ))
                conn.commit()

    def get_log_by_id(self, log_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single log document by ID."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT raw_doc FROM opensearch_logs WHERE id = ?", (log_id,))
            row = cursor.fetchone()
            if row:
                return json.loads(row[0])
        return None

    def search_logs(
        self,
        query: Optional[str] = None,
        source_type: Optional[str] = None,
        severity: Optional[str] = None,
        device_id: Optional[str] = None,
        event_type: Optional[str] = None,
        source_ip: Optional[str] = None,
        destination_ip: Optional[str] = None,
        action: Optional[str] = None,
        username: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 50,
        sort_field: str = "timestamp",
        sort_order: str = "desc"
    ) -> Tuple[int, List[Dict[str, Any]]]:
        """
        Execute filtered and full-text search against the log repository.
        """
        conditions = []
        params = []

        if query:
            q_str = f"%{query}%"
            conditions.append("(message LIKE ? OR raw_doc LIKE ? OR source_ip LIKE ? OR destination_ip LIKE ? OR username LIKE ?)")
            params.extend([q_str, q_str, q_str, q_str, q_str])

        if source_type:
            conditions.append("LOWER(source_type) = ?")
            params.append(source_type.lower())

        if severity:
            conditions.append("LOWER(severity) = ?")
            params.append(severity.lower())

        if device_id:
            conditions.append("device_id = ?")
            params.append(device_id)

        if event_type:
            conditions.append("UPPER(event_type) = ?")
            params.append(event_type.upper())

        if source_ip:
            conditions.append("source_ip = ?")
            params.append(source_ip)

        if destination_ip:
            conditions.append("destination_ip = ?")
            params.append(destination_ip)

        if action:
            conditions.append("UPPER(action) = ?")
            params.append(action.upper())

        if username:
            conditions.append("LOWER(username) = ?")
            params.append(username.lower())

        if start_time:
            conditions.append("timestamp >= ?")
            params.append(start_time.isoformat())

        if end_time:
            conditions.append("timestamp <= ?")
            params.append(end_time.isoformat())

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        # Validate sort field
        allowed_sort_fields = {
            "timestamp": "timestamp",
            "severity": "severity",
            "source_type": "source_type",
            "event_type": "event_type",
            "device_id": "device_id"
        }
        order_col = allowed_sort_fields.get(sort_field, "timestamp")
        order_dir = "DESC" if sort_order.lower() == "desc" else "ASC"

        offset = (page - 1) * page_size

        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            count_query = f"SELECT COUNT(*) FROM opensearch_logs {where_clause}"
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            data_query = f"""
                SELECT raw_doc FROM opensearch_logs
                {where_clause}
                ORDER BY {order_col} {order_dir}
                LIMIT ? OFFSET ?
            """
            cursor.execute(data_query, params + [page_size, offset])
            rows = cursor.fetchall()
            logs = [json.loads(row[0]) for row in rows]

        return total, logs

    def get_recent_logs_for_ip(self, ip: str, window_seconds: int = 60) -> List[Dict[str, Any]]:
        """Get logs from a specific IP within the last N seconds."""
        cutoff = (datetime.now(timezone.utc) - timedelta(seconds=window_seconds)).isoformat()
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT raw_doc FROM opensearch_logs
                WHERE source_ip = ? AND timestamp >= ?
                ORDER BY timestamp DESC
            """, (ip, cutoff))
            rows = cursor.fetchall()
            return [json.loads(row[0]) for row in rows]

    def get_recent_logs_for_device(self, device_id: str, window_seconds: int = 300) -> List[Dict[str, Any]]:
        """Get logs for a specific device within the last N seconds."""
        cutoff = (datetime.now(timezone.utc) - timedelta(seconds=window_seconds)).isoformat()
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT raw_doc FROM opensearch_logs
                WHERE device_id = ? AND timestamp >= ?
                ORDER BY timestamp DESC
            """, (device_id, cutoff))
            rows = cursor.fetchall()
            return [json.loads(row[0]) for row in rows]

    def get_analytics(self) -> Dict[str, Any]:
        """Compute aggregated metrics dynamically."""
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()

            # 1. Total logs
            cursor.execute("SELECT COUNT(*) FROM opensearch_logs")
            total_logs = cursor.fetchone()[0]

            # 2. Critical & High events
            cursor.execute("SELECT COUNT(*) FROM opensearch_logs WHERE LOWER(severity) IN ('critical')")
            critical_events = cursor.fetchone()[0]

            # 3. Events in last hour
            hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
            cursor.execute("SELECT COUNT(*) FROM opensearch_logs WHERE timestamp >= ?", (hour_ago,))
            events_last_hour = cursor.fetchone()[0]

            # 4. Failed logins
            cursor.execute("SELECT COUNT(*) FROM opensearch_logs WHERE UPPER(event_type) LIKE '%LOGIN_FAILED%' OR UPPER(action) = 'LOGIN_FAILURE'")
            failed_logins = cursor.fetchone()[0]

            # 5. Blocked connections
            cursor.execute("SELECT COUNT(*) FROM opensearch_logs WHERE UPPER(action) IN ('DENY', 'BLOCK', 'DROP')")
            blocked_connections = cursor.fetchone()[0]

            # 6. Source Distribution
            cursor.execute("SELECT source_type, COUNT(*) FROM opensearch_logs GROUP BY source_type ORDER BY COUNT(*) DESC")
            sources_raw = cursor.fetchall()
            sources = []
            for src, cnt in sources_raw:
                pct = round((cnt / total_logs * 100), 1) if total_logs > 0 else 0
                sources.append({"source": src.upper(), "count": cnt, "percentage": pct})

            # 7. Severity Breakdown
            cursor.execute("SELECT LOWER(severity), COUNT(*) FROM opensearch_logs GROUP BY LOWER(severity)")
            severities_raw = dict(cursor.fetchall())
            severity_colors = {
                "critical": "#EF4444",
                "high": "#F97316",
                "medium": "#F59E0B",
                "low": "#3B82F6",
                "info": "#10B981"
            }
            severities = []
            for sev in ["critical", "high", "medium", "low", "info"]:
                cnt = severities_raw.get(sev, 0)
                severities.append({"severity": sev.upper(), "count": cnt, "color": severity_colors.get(sev)})

            # 8. Timeline (Hourly aggregations for the past 24 hours)
            cursor.execute("""
                SELECT substr(timestamp, 1, 13) as hour_bucket,
                       COUNT(*) as total,
                       SUM(CASE WHEN LOWER(severity) = 'critical' THEN 1 ELSE 0 END) as crit,
                       SUM(CASE WHEN LOWER(severity) = 'high' THEN 1 ELSE 0 END) as hi,
                       SUM(CASE WHEN LOWER(severity) = 'medium' THEN 1 ELSE 0 END) as med,
                       SUM(CASE WHEN LOWER(severity) = 'low' THEN 1 ELSE 0 END) as lo,
                       SUM(CASE WHEN LOWER(severity) = 'info' THEN 1 ELSE 0 END) as inf
                FROM opensearch_logs
                GROUP BY hour_bucket
                ORDER BY hour_bucket ASC
                LIMIT 24
            """)
            timeline_rows = cursor.fetchall()
            timeline = []
            for row in timeline_rows:
                timeline.append({
                    "timestamp": f"{row[0]}:00:00Z" if row[0] else "Now",
                    "count": row[1],
                    "critical": row[2] or 0,
                    "high": row[3] or 0,
                    "medium": row[4] or 0,
                    "low": row[5] or 0,
                    "info": row[6] or 0,
                })

            # 9. Top Source IPs
            cursor.execute("""
                SELECT source_ip, COUNT(*) as total,
                       SUM(CASE WHEN UPPER(action) IN ('DENY', 'BLOCK', 'DROP') THEN 1 ELSE 0 END) as blocked,
                       SUM(CASE WHEN UPPER(event_type) LIKE '%LOGIN_FAILED%' THEN 1 ELSE 0 END) as failed_logins
                FROM opensearch_logs
                WHERE source_ip IS NOT NULL AND source_ip != ''
                GROUP BY source_ip
                ORDER BY total DESC
                LIMIT 10
            """)
            top_ips = []
            for ip, total, blocked, fl in cursor.fetchall():
                top_ips.append({
                    "ip": ip,
                    "count": total,
                    "blocked_count": blocked or 0,
                    "failed_login_count": fl or 0
                })

            # 10. Top Event Types
            cursor.execute("""
                SELECT event_type, COUNT(*) as total, severity
                FROM opensearch_logs
                GROUP BY event_type
                ORDER BY total DESC
                LIMIT 10
            """)
            top_events = []
            for ev, total, sev in cursor.fetchall():
                top_events.append({
                    "event_type": ev,
                    "count": total,
                    "severity": sev.upper() if sev else "INFO"
                })

            # 11. Top Targeted Destination Ports
            cursor.execute("""
                SELECT destination_port, protocol, COUNT(*) as total
                FROM opensearch_logs
                WHERE destination_port IS NOT NULL AND destination_port > 0
                GROUP BY destination_port, protocol
                ORDER BY total DESC
                LIMIT 8
            """)
            top_ports = []
            for port, proto, total in cursor.fetchall():
                top_ports.append({
                    "port": port,
                    "protocol": proto or "TCP",
                    "count": total
                })

            return {
                "overview": {
                    "total_logs": total_logs,
                    "critical_events": critical_events,
                    "active_devices": 0,  # Filled by service from DB
                    "open_alerts": 0,     # Filled by service from DB
                    "total_alerts": 0,
                    "events_last_hour": events_last_hour,
                    "failed_logins": failed_logins,
                    "blocked_connections": blocked_connections
                },
                "timeline": timeline,
                "sources": sources,
                "severities": severities,
                "top_ips": top_ips,
                "top_events": top_events,
                "top_ports": top_ports
            }


log_storage = LogStorageEngine()
