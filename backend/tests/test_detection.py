from datetime import datetime, timezone


def test_failed_logins_brute_force_detection(client):
    attacker_ip = "198.51.100.99"
    logs = []
    for i in range(6):
        logs.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_type": "server",
            "device_id": "SRV-AUTH-LDAP-01",
            "device_name": "Active Directory / LDAP Server",
            "event_type": "LOGIN_FAILED",
            "severity": "high",
            "source_ip": attacker_ip,
            "destination_ip": "10.0.20.5",
            "source_port": 50000 + i,
            "destination_port": 22,
            "protocol": "TCP",
            "action": "LOGIN_FAILURE",
            "username": f"user_test_{i}",
            "message": f"Failed password authentication attempt from {attacker_ip}"
        })

    response = client.post("/api/logs/ingest", json=logs)
    assert response.status_code == 200
    data = response.json()
    assert data["ingested_count"] == 6
    assert data["alerts_triggered"] >= 1


def test_cctv_tampering_detection(client):
    tamper_log = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_type": "cctv",
        "device_id": "CCTV-SERVER-ROOM",
        "device_name": "Server Room 360 Camera",
        "event_type": "TAMPERING_DETECTED",
        "severity": "critical",
        "source_ip": "192.168.50.102",
        "destination_ip": "192.168.50.1",
        "source_port": 554,
        "destination_port": 554,
        "protocol": "RTSP",
        "action": "BLOCK",
        "message": "CRITICAL: Lens covered or physical tamper switch activated on CCTV-SERVER-ROOM"
    }

    response = client.post("/api/logs/ingest", json=[tamper_log])
    assert response.status_code == 200
    data = response.json()
    assert data["alerts_triggered"] >= 1
