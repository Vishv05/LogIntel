def test_list_alerts(client, analyst_headers):
    response = client.get("/api/alerts", headers=analyst_headers)
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)


def test_alert_lifecycle_acknowledge_and_resolve(client, analyst_headers):
    alerts = client.get("/api/alerts", headers=analyst_headers).json()
    if len(alerts) > 0:
        alert_id = alerts[0]["alert_id"]

        # Acknowledge
        ack_res = client.patch(f"/api/alerts/{alert_id}/acknowledge", json={"notes": "Investigating incident"}, headers=analyst_headers)
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"

        # Resolve
        res_res = client.patch(f"/api/alerts/{alert_id}/resolve", json={"notes": "Mitigated and attacker IP blacklisted"}, headers=analyst_headers)
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "RESOLVED"
