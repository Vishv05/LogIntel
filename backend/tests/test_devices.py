def test_list_devices(client, analyst_headers):
    response = client.get("/api/devices", headers=analyst_headers)
    assert response.status_code == 200
    devices = response.json()
    assert isinstance(devices, list)
    assert len(devices) > 0


def test_device_stats(client, analyst_headers):
    response = client.get("/api/devices/stats", headers=analyst_headers)
    assert response.status_code == 200
    stats = response.json()
    assert "total_devices" in stats
    assert "online_count" in stats
    assert stats["total_devices"] >= stats["online_count"]


def test_create_and_delete_device(client, admin_headers):
    new_device = {
        "device_id": "TEST-RTR-99",
        "device_name": "Test Core Router",
        "device_type": "ROUTER",
        "ip_address": "10.254.254.1",
        "location": "Test Lab Rack",
        "status": "online"
    }
    # Create
    create_res = client.post("/api/devices", json=new_device, headers=admin_headers)
    assert create_res.status_code == 201
    assert create_res.json()["device_id"] == "TEST-RTR-99"

    # Get by ID
    get_res = client.get("/api/devices/TEST-RTR-99", headers=admin_headers)
    assert get_res.status_code == 200

    # Delete
    del_res = client.delete("/api/devices/TEST-RTR-99", headers=admin_headers)
    assert del_res.status_code == 200
