"""
pytest 공통 설정.
앱을 import 하기 전에 테스트 전용 DB/설정 환경변수를 지정한다.
"""
import os
import pathlib

_BACKEND = pathlib.Path(__file__).resolve().parent.parent
_TEST_DB = _BACKEND / "data" / "test_ci.db"

os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB}"
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci")
os.environ["SIGNUP_CODE"] = ""  # 기본 비활성 (개별 테스트에서 토글)

# 깨끗한 상태로 시작
if _TEST_DB.exists():
    _TEST_DB.unlink()

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

PW = "testpw123"


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_db(client):
    """각 테스트 전에 모든 데이터를 비우고 YAML 시드를 다시 로드 → 순서 독립."""
    from app.core.database import SessionLocal, Base
    from app.services.auth_service import load_users_from_yaml
    db = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        load_users_from_yaml(db)
    finally:
        db.close()
    yield


@pytest.fixture
def login(client):
    """이메일로 계정 활성화(또는 로그인) 후 Authorization 헤더 반환."""
    def _login(email: str, password: str = PW):
        r = client.post("/api/auth/set-password",
                        json={"email": email, "password": password, "confirm_password": password})
        if r.status_code != 200:
            r = client.post("/api/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}
    return _login
