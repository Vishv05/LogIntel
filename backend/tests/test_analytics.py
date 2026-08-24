def test_analytics_summary(client, analyst_headers):
    response = client.get("/api/analytics/summary", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert "overview" in data
    assert "timeline" in data
    assert "sources" in data
    assert "severities" in data
    assert "top_ips" in data
    assert "top_events" in data
    assert "top_ports" in data
    assert data["overview"]["total_logs"] > 0


def test_analytics_overview_kpis(client, analyst_headers):
    response = client.get("/api/analytics/overview", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_logs" in data
    assert "critical_events" in data
    assert "active_devices" in data
    assert "open_alerts" in data
