def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "adminpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "admin"


def test_login_failure_bad_password(client):
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_get_current_user_me(client, admin_headers):
    response = client.get("/api/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"


def test_rbac_analyst_forbidden_on_admin_endpoint(client, analyst_headers):
    response = client.get("/api/users", headers=analyst_headers)
    assert response.status_code == 403


def test_admin_gmail_credentials(client):
    """Verify Admin is authenticated with admin@gmail.com and admin123 and has full access."""
    response = client.post("/api/auth/login", json={
        "username": "admin@gmail.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "admin@gmail.com"
    assert data["user"]["role"] == "admin"
    
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Admin has full access to Admin side:
    assert client.get("/api/users", headers=headers).status_code == 200
    assert client.get("/api/rules", headers=headers).status_code == 200
    # Admin also has full access to User side:
    assert client.get("/api/alerts", headers=headers).status_code == 200
    assert client.get("/api/devices", headers=headers).status_code == 200


def test_user_any_mail_id_and_password(client):
    """Verify any user can use any mail-id and password, gets role 'user', and is restricted to User side."""
    unique_mail = "new_developer_42@external-company.io"
    response = client.post("/api/auth/login", json={
        "username": unique_mail,
        "password": "custom_secure_password_999"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == unique_mail
    assert data["user"]["role"] == "user"
    
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # User side endpoints are fully accessible:
    assert client.get("/api/alerts", headers=headers).status_code == 200
    assert client.get("/api/devices", headers=headers).status_code == 200
    
    # Admin side endpoints are strictly FORBIDDEN (403):
    assert client.get("/api/users", headers=headers).status_code == 403
    assert client.get("/api/rules", headers=headers).status_code == 403


def test_vishv_and_dhruvil_admin_logins(client):
    """Verify vishv and dhruvil default credentials authenticate as Admin with full rights."""
    # Test vishv
    res_vishv = client.post("/api/auth/login", json={
        "username": "vishv",
        "password": "vishvpassword123"
    })
    assert res_vishv.status_code == 200
    data_v = res_vishv.json()
    assert data_v["user"]["username"] == "vishv"
    assert data_v["user"]["role"] == "admin"
    headers_v = {"Authorization": f"Bearer {data_v['access_token']}"}
    assert client.get("/api/users", headers=headers_v).status_code == 200

    # Test dhruvil
    res_dhruvil = client.post("/api/auth/login", json={
        "username": "dhruvil",
        "password": "dhruvilpassword123"
    })
    assert res_dhruvil.status_code == 200
    data_d = res_dhruvil.json()
    assert data_d["user"]["username"] == "dhruvil"
    assert data_d["user"]["role"] == "admin"
    headers_d = {"Authorization": f"Bearer {data_d['access_token']}"}
    assert client.get("/api/users", headers=headers_d).status_code == 200


def test_missing_and_malformed_tokens(client):
    """Verify missing, expired, or corrupted Bearer tokens return 401 Unauthorized."""
    # 1. Missing Authorization header
    res_missing = client.get("/api/auth/me")
    assert res_missing.status_code == 401

    # 2. Malformed token
    res_malformed = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert res_malformed.status_code == 401

    # 3. Invalid header format
    res_bad_format = client.get("/api/auth/me", headers={"Authorization": "Basic 12345"})
    assert res_bad_format.status_code == 401


def test_logout_flow(client, admin_headers):
    """Verify logout records audit trail and returns 200."""
    res = client.post("/api/auth/logout", headers=admin_headers)
    assert res.status_code == 200
    assert "logged out" in res.json()["message"]


def test_change_password_flow(client):
    """Verify password change with valid current password succeeds, and bad password fails."""
    # Login as user to get token
    login_res = client.post("/api/auth/login", json={
        "username": "user",
        "password": "user123"
    })
    assert login_res.status_code == 200
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Bad current password
    bad_res = client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "wrongpassword",
        "new_password": "newuserpassword123"
    })
    assert bad_res.status_code == 400

    # Valid current password
    good_res = client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "user123",
        "new_password": "newuserpassword123"
    })
    assert good_res.status_code == 200

    # Revert password back for test idempotence
    revert_res = client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "newuserpassword123",
        "new_password": "user123"
    })
    assert revert_res.status_code == 200

