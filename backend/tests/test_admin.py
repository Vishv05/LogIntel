import pytest


def test_admin_restrictions_enforcement(client, analyst_headers):
    """Verify that non-admin users (Security Analysts, Viewers, Users) are blocked from admin routes (Feature 16)."""
    endpoints = [
        "/api/admin/overview",
        "/api/admin/topology",
        "/api/admin/sources/health",
        "/api/admin/rules/performance",
        "/api/admin/alert-policies",
        "/api/admin/system/health",
        "/api/admin/audit/privileged",
        "/api/admin/storage/retention",
        "/api/admin/security/settings",
        "/api/admin/integrations",
    ]
    for ep in endpoints:
        response = client.get(ep, headers=analyst_headers)
        assert response.status_code == 403, f"Expected 403 for {ep}, got {response.status_code}"


def test_admin_dashboard_overview(client, admin_headers):
    """Test Admin Dashboard overview statistics (Feature 1)."""
    response = client.get("/api/admin/overview", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "active_users" in data
    assert "total_devices" in data
    assert "active_log_sources" in data
    assert "offline_sources" in data
    assert "total_detection_rules" in data
    assert "open_incidents" in data
    assert "system_health" in data
    assert "current_eps_rate" in data
    assert "storage_usage" in data


def test_infrastructure_topology(client, admin_headers):
    """Test Infrastructure Topology Manager graph data (Feature 4)."""
    response = client.get("/api/admin/topology", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert "topology_layers" in data
    assert len(data["nodes"]) >= 5
    # Verify presence of core gateway and firewall
    node_types = [n["type"] for n in data["nodes"]]
    assert "INTERNET" in node_types
    assert "FIREWALL" in node_types


def test_log_source_health_monitoring(client, admin_headers):
    """Test Log Source Health Monitoring and Coverage Calculation (Feature 5)."""
    response = client.get("/api/admin/sources/health", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "coverage_percent" in data
    assert "total_sources" in data
    assert "healthy_sources" in data
    assert "sources" in data
    assert len(data["sources"]) > 0
    src = data["sources"][0]
    assert "device_id" in src
    assert "heartbeat_status" in src
    assert "collector_type" in src


def test_detection_rule_performance(client, admin_headers):
    """Test Detection Rule Performance, Triggers, and Effectiveness (Feature 7)."""
    response = client.get("/api/admin/rules/performance", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_rules" in data
    assert "rules" in data
    assert len(data["rules"]) > 0
    rule = data["rules"][0]
    assert "trigger_count" in rule
    assert "false_positive_rate" in rule
    assert "true_positive_rate" in rule
    assert "effectiveness_score" in rule
    assert "status" in rule


def test_alert_policy_management(client, admin_headers):
    """Test Alert Policy Management GET and PUT (Feature 8)."""
    get_res = client.get("/api/admin/alert-policies", headers=admin_headers)
    assert get_res.status_code == 200
    policies = get_res.json()
    assert len(policies) >= 4

    # Update policy
    policies[0]["escalation_sla_minutes"] = 20
    put_res = client.put(
        "/api/admin/alert-policies",
        headers=admin_headers,
        json={"policies": policies}
    )
    assert put_res.status_code == 200
    assert put_res.json()["policies"][0]["escalation_sla_minutes"] == 20


def test_system_health_center(client, admin_headers):
    """Test System Health Center Subsystem Telemetry (Feature 9)."""
    response = client.get("/api/admin/system/health", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "HEALTHY"
    assert "subsystems" in data
    assert len(data["subsystems"]) >= 5
    subsystem_names = [s["name"] for s in data["subsystems"]]
    assert any("FastAPI" in name for name in subsystem_names)
    assert any("Database" in name for name in subsystem_names)
    assert any("OpenSearch" in name for name in subsystem_names)


def test_privileged_audit_monitoring(client, admin_headers):
    """Test Privileged Access Monitoring and Sensitive Admin Auditing (Features 10 & 11)."""
    response = client.get("/api/admin/audit/privileged", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_privileged_events" in data
    assert "events" in data


def test_storage_and_data_retention(client, admin_headers):
    """Test Data Retention & Storage Management (Feature 12)."""
    get_res = client.get("/api/admin/storage/retention", headers=admin_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "total_capacity_gb" in data
    assert "used_storage_gb" in data
    assert "retention_tiers" in data
    assert data["retention_tiers"]["normal_logs_days"] >= 30

    put_res = client.put(
        "/api/admin/storage/retention",
        headers=admin_headers,
        json={"settings": {"normal_logs_days": 45, "security_logs_days": 120}}
    )
    assert put_res.status_code == 200
    assert put_res.json()["settings"]["normal_logs_days"] == 45


def test_log_simulator_control_center(client, admin_headers):
    """Test Log Simulator Control Center Synthetic Event Ingestion (Feature 13)."""
    sim_payload = {
        "scenario": "BRUTE_FORCE",
        "target_device_id": "SRV-AUTH-LDAP-01",
        "event_count": 6
    }
    response = client.post("/api/admin/simulator/generate", headers=admin_headers, json=sim_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["scenario"] == "BRUTE_FORCE"
    assert data["ingested_count"] == 6
    assert data["alerts_triggered"] >= 1


def test_security_settings_and_masking(client, admin_headers):
    """Test Security Settings with Masked Secrets (Feature 14)."""
    get_res = client.get("/api/admin/security/settings", headers=admin_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "jwt_expiry_minutes" in data
    assert "min_password_length" in data
    assert "secret_key_masked" in data
    assert "••••" in data["secret_key_masked"]

    put_res = client.put(
        "/api/admin/security/settings",
        headers=admin_headers,
        json={"settings": {"min_password_length": 10}}
    )
    assert put_res.status_code == 200
    assert put_res.json()["settings"]["min_password_length"] == 10


def test_integrations_management(client, admin_headers):
    """Test Third-party Integrations and Secret Masking (Feature 15)."""
    get_res = client.get("/api/admin/integrations", headers=admin_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert "slack" in data
    assert "webhook" in data
    assert "••••" in data["slack"]["webhook_url"]

    put_res = client.put(
        "/api/admin/integrations",
        headers=admin_headers,
        json={"integrations": {"slack": {"channel": "#security-war-room"}}}
    )
    assert put_res.status_code == 200
    assert put_res.json()["integrations"]["slack"]["channel"] == "#security-war-room"


def test_user_management_rbac_roles(client, admin_headers):
    """Test User Management with Admin, Security Analyst, and Viewer Roles (Feature 2)."""
    # Create a viewer user
    viewer_payload = {
        "username": "viewer_alice",
        "email": "alice@logintel.org",
        "password": "viewerpassword123",
        "full_name": "Alice Viewer",
        "role": "viewer",
        "is_active": True
    }
    create_res = client.post("/api/users", headers=admin_headers, json=viewer_payload)
    assert create_res.status_code in (201, 400)
    if create_res.status_code == 201:
        user_data = create_res.json()
        assert user_data["role"] == "viewer"

        # Update to security analyst
        update_res = client.put(
            f"/api/users/{user_data['id']}",
            headers=admin_headers,
            json={"role": "security_analyst"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["role"] == "security_analyst"
