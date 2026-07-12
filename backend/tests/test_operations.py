"""운영 강건성: 비활성 계정 차단, 요청 ID 헤더, 전역 예외 → 안전한 500."""


def test_inactive_user_jwt_blocked(client, login):
    h = login("seoyeon.lee@company.com")
    # 정상 동작 확인
    assert client.get("/api/auth/me", headers=h).status_code == 200

    # 계정 비활성화 (DB 직접)
    from app.core.database import SessionLocal
    from app.services.auth_service import get_user_by_email
    db = SessionLocal()
    try:
        u = get_user_by_email(db, "seoyeon.lee@company.com")
        u.is_active = False
        db.commit()
    finally:
        db.close()

    # 유효한 JWT 여도 403 으로 차단 (정지 즉시 반영)
    r = client.get("/api/auth/me", headers=h)
    assert r.status_code == 403


def test_request_id_header_present(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.headers.get("X-Request-ID")


def test_unhandled_exception_returns_safe_500(login, monkeypatch):
    """처리 안 된 예외는 스택을 노출하지 않고 안전한 메시지로 500.

    TestClient 기본값은 서버 예외를 재던지므로, 실제 ASGI 처럼 응답을 받으려면
    raise_server_exceptions=False 로 별도 클라이언트를 만든다."""
    from fastapi.testclient import TestClient
    from app.main import app
    import app.services.backup_service as bs

    def boom():
        raise RuntimeError("internal detail should not leak")

    admin = login("admin@company.com")   # /admin/backups 는 관리자 전용
    monkeypatch.setattr(bs, "list_backups", boom)
    with TestClient(app, raise_server_exceptions=False) as safe_client:
        r = safe_client.get("/api/admin/backups", headers=admin)
    assert r.status_code == 500
    body = r.json()
    assert "internal detail" not in str(body)   # 스택/원문 미노출
    assert "오류" in body["detail"]
