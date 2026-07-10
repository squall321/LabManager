"""
MCP 서버(mcp/server.py)를 인메모리 TestClient 백엔드에 붙여 end-to-end 검증.
녹음/전사/AI 없이, MCP 도구 → REST → DB 경로가 실제로 동작하는지 확인한다.
실제 dev DB는 건드리지 않는다(테스트 전용 DB 사용).
"""
import json
import pathlib
import sys

import pytest

_MCP_DIR = pathlib.Path(__file__).resolve().parents[2] / "mcp"
sys.path.insert(0, str(_MCP_DIR))

# mcp 패키지가 없으면 이 모듈 전체를 건너뛴다(서버는 별도 venv 로 동작).
pytest.importorskip("mcp.server.fastmcp")


@pytest.fixture
def mcp_server(client, login, monkeypatch):
    """server.py 의 HTTP 헬퍼를 TestClient + 개인 토큰으로 라우팅."""
    import server  # noqa: E402  mcp/server.py

    h = login("seoyeon.lee@company.com")
    raw = client.post("/api/tokens", headers=h, json={"name": "MCP e2e"}).json()["token"]
    auth = {"Authorization": f"Bearer {raw}"}

    def _get(path, **params):
        return server._handle(client.get(f"/api{path}", headers=auth, params=params or None))

    def _post(path, body=None, **params):
        return server._handle(client.post(f"/api{path}", headers=auth, json=body, params=params or None))

    def _put(path, body=None):
        return server._handle(client.put(f"/api{path}", headers=auth, json=body))

    monkeypatch.setattr(server, "_get", _get)
    monkeypatch.setattr(server, "_post", _post)
    monkeypatch.setattr(server, "_put", _put)
    return server


def test_mcp_whoami_and_project_lifecycle(mcp_server):
    s = mcp_server
    # 연결 점검
    me = s.whoami()
    assert me["email"] == "seoyeon.lee@company.com"

    # 프로젝트 생성 → 목록에 보임
    proj = s.create_project("MCP 낙하 자동화", one_liner="한 줄", current_problem="수작업")
    pid = proj["id"]
    assert any(p["id"] == pid for p in s.list_projects())

    # 채우기 스키마(인터뷰 포함)
    schema = s.get_fill_schema(pid, transcript="낙하 해석을 매번 수작업으로 함")
    assert "JSON" in schema and "낙하 해석을 매번" in schema

    # 전체 채우기
    content = json.dumps({
        "idea": {"one_liner": "낙하 자동화", "target_user": "해석 엔지니어"},
        "personas": [{"name": "해석자", "role": "엔지니어", "goals": "반복 감소"}],
        "pains": [{"title": "반복 세팅"}],
        "features": [{"name": "케이스 자동생성", "priority": 1}],
        "prfaq": {"headline": "H"},
    }, ensure_ascii=False)
    applied = s.fill_project(pid, content)["applied"]
    assert applied["personas"] == 1 and applied["pains"] == 1 and applied["features"] == 1

    # 읽어서 확인
    full = s.get_project(pid)
    assert full["idea"]["one_liner"] == "낙하 자동화"
    assert len(full["personas"]) == 1 and len(full["pains"]) == 1
    assert full["prfaq"]["headline"] == "H"

    # 개별 추가 도구
    s.add_persona(pid, "리더", role="랩장", fears="리소스")
    s.add_pain(pid, "포맷 제각각")
    s.add_feature(pid, "리포트 표준화", priority=2, reason="비교 용이")
    full2 = s.get_project(pid)
    assert len(full2["personas"]) == 2 and len(full2["pains"]) == 2 and len(full2["features"]) == 2

    # 부분 수정 + 리포트
    s.update_idea(pid, current_problem="수작업+포맷 불일치", status="validated")
    assert s.get_project(pid)["idea"]["current_problem"] == "수작업+포맷 불일치"
    md = s.export_report(pid)
    assert "MCP 낙하 자동화" in md


def test_mcp_fill_accepts_dict_and_replace(mcp_server):
    s = mcp_server
    pid = s.create_project("교체 테스트")["id"]
    s.fill_project(pid, {"personas": [{"name": "A"}, {"name": "B"}]})
    assert len(s.get_project(pid)["personas"]) == 2
    # replace=True → 기존 페르소나 대체
    s.fill_project(pid, {"personas": [{"name": "C"}]}, replace=True)
    names = [p["name"] for p in s.get_project(pid)["personas"]]
    assert names == ["C"]
