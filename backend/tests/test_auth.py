from app.core.config import settings


def test_check_email_unknown(client):
    r = client.post("/api/auth/check-email", json={"email": "nobody@nowhere.com"})
    assert r.status_code == 404


def test_set_password_and_login(client):
    email = "sua.choi@company.com"
    r = client.post("/api/auth/set-password",
                    json={"email": email, "password": "testpw123", "confirm_password": "testpw123"})
    assert r.status_code == 200
    assert r.json()["user"]["email"] == email

    # 잘못된 비번
    assert client.post("/api/auth/login", json={"email": email, "password": "wrong"}).status_code == 401
    # 올바른 비번
    assert client.post("/api/auth/login", json={"email": email, "password": "testpw123"}).status_code == 200


def test_signup_code_enforced(client):
    """SIGNUP_CODE 설정 시 코드 없이/틀리면 403, 맞으면 통과."""
    settings.SIGNUP_CODE = "LAB-CODE"
    try:
        # check-email은 signup_required=True 를 알려줌 (미설정 계정)
        info = client.post("/api/auth/check-email", json={"email": "hyunwoo.jung@company.com"}).json()
        assert info["signup_required"] is True

        base = {"email": "hyunwoo.jung@company.com", "password": "testpw123", "confirm_password": "testpw123"}
        assert client.post("/api/auth/set-password", json=base).status_code == 403
        assert client.post("/api/auth/set-password", json={**base, "signup_code": "WRONG"}).status_code == 403
        assert client.post("/api/auth/set-password", json={**base, "signup_code": "LAB-CODE"}).status_code == 200
    finally:
        settings.SIGNUP_CODE = ""


def test_protected_requires_token(client):
    assert client.get("/api/reports/me").status_code in (401, 403)
