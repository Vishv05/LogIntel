def test_incident_correlation_and_listing(client, analyst_headers):
    # Trigger correlation engine
    corr_res = client.post("/api/incidents/correlate", headers=analyst_headers)
    assert corr_res.status_code == 200
    assert corr_res.json()["success"] is True

    # List incidents
    res = client.get("/api/incidents", headers=analyst_headers)
    assert res.status_code == 200
    incidents = res.json()
    assert isinstance(incidents, list)

    # Get incident statistics
    stats_res = client.get("/api/incidents/stats", headers=analyst_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_incidents" in stats
    assert "avg_risk_score" in stats


def test_incident_details_and_lifecycle(client, analyst_headers):
    # Ensure correlation run
    client.post("/api/incidents/correlate", headers=analyst_headers)
    incidents = client.get("/api/incidents", headers=analyst_headers).json()
    if len(incidents) > 0:
        inc_id = incidents[0]["incident_id"]

        # Get full incident dossier
        detail_res = client.get(f"/api/incidents/{inc_id}", headers=analyst_headers)
        assert detail_res.status_code == 200
        data = detail_res.json()
        assert data["incident_id"] == inc_id
        assert "risk_score" in data
        assert "risk_breakdown" in data
        assert "attack_timeline" in data
        assert "explainable_detection" in data

        # Timeline endpoint
        timeline_res = client.get(f"/api/incidents/{inc_id}/timeline", headers=analyst_headers)
        assert timeline_res.status_code == 200
        assert isinstance(timeline_res.json(), list)

        # AI explanation endpoint
        explain_res = client.get(f"/api/incidents/{inc_id}/explain", headers=analyst_headers)
        assert explain_res.status_code == 200
        explain_data = explain_res.json()
        assert "what_happened" in explain_data
        assert "why_suspicious" in explain_data

        # Add analyst note
        note_res = client.post(f"/api/incidents/{inc_id}/notes", json={"note": "SOC Analyst initial triage note."}, headers=analyst_headers)
        assert note_res.status_code == 200

        # Acknowledge incident
        ack_res = client.patch(f"/api/incidents/{inc_id}/acknowledge", json={"notes": "Investigating with team."}, headers=analyst_headers)
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] in ("ACKNOWLEDGED", "INVESTIGATING")

        # Resolve incident
        resolve_res = client.patch(f"/api/incidents/{inc_id}/resolve", json={"notes": "Threat neutralized."}, headers=analyst_headers)
        assert resolve_res.status_code == 200
        assert resolve_res.json()["status"] == "RESOLVED"


def test_threat_intel_endpoints(client, analyst_headers):
    # Get top suspicious IPs
    top_res = client.get("/api/threat-intel/suspicious-ips", headers=analyst_headers)
    assert top_res.status_code == 200
    top_ips = top_res.json()
    assert isinstance(top_ips, list)

    # Analyze known IP
    ip_res = client.get("/api/threat-intel/ip/198.51.100.77", headers=analyst_headers)
    assert ip_res.status_code == 200
    data = ip_res.json()
    assert data["ip"] == "198.51.100.77"
    assert "threat_score" in data
    assert "threat_level" in data
    assert "geo" in data
    assert "behavior" in data
