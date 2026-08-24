from datetime import datetime, timezone


def test_ingest_single_log(client):
    log_payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_type": "firewall",
        "device_id": "FW-TEST-01",
        "device_name": "Test Firewall",
        "event_type": "CONNECTION_ALLOWED",
        "severity": "info",
        "source_ip": "192.168.1.100",
        "destination_ip": "10.0.0.5",
        "source_port": 45000,
        "destination_port": 443,
        "protocol": "TCP",
        "action": "ALLOW",
        "message": "Outbound connection established"
    }
    response = client.post("/api/logs/ingest", json=log_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["ingested_count"] == 1


def test_search_logs(client, analyst_headers):
    response = client.get("/api/logs", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "logs" in data
    assert len(data["logs"]) > 0


def test_search_filter_by_source(client, analyst_headers):
    response = client.get("/api/logs?source_type=firewall", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    for log in data["logs"]:
        assert log["source_type"].lower() == "firewall"
