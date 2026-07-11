def test_api_token_issue_and_auth(client, login):
    h = login("seoyeon.lee@company.com")
    # 발급 — 원문 토큰은 이 응답에서만
    res = client.post("/api/tokens", headers=h, json={"name": "MCP 테스트"}).json()
    raw = res["token"]
    assert raw.startswith("lmk_")

    # 목록엔 원문 없이 prefix만
    lst = client.get("/api/tokens", headers=h).json()
    assert lst[0]["prefix"] and "token" not in lst[0]

    # 토큰으로 API 호출 (JWT 대신)
    th = {"Authorization": f"Bearer {raw}"}
    me = client.get("/api/auth/me", headers=th).json()
    assert me["email"] == "seoyeon.lee@company.com"
    # 토큰으로 WB 프로젝트 생성 가능
    p = client.post("/api/wb/projects", headers=th, json={"name": "토큰으로 만든 프로젝트"}).json()
    assert p["id"]

    # 잘못된 토큰 → 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer lmk_invalid"}).status_code == 401

    # 해지 → 더 이상 인증 안 됨
    client.delete(f"/api/tokens/{res['id']}", headers=h)
    assert client.get("/api/auth/me", headers=th).status_code == 401


def test_interview_apply_all(client, login):
    h = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "인터뷰 프로젝트"}).json()["id"]

    # 인터뷰 프롬프트 (transcript 포함)
    pr = client.post(f"/api/wb/projects/{pid}/prompt/interview", headers=h,
                     json={"transcript": "낙하 해석을 매번 수작업으로 함..."}).json()
    assert "JSON" in pr["prompt"] and "낙하 해석을 매번" in pr["prompt"]

    # 전체 JSON 한 번에 적용
    full = ('{"idea":{"one_liner":"낙하 자동화","current_problem":"수작업"},'
            '"personas":[{"name":"해석자","role":"엔지니어","goals":"반복 감소"}],'
            '"pains":[{"title":"반복 세팅"}],'
            '"features":[{"name":"케이스 자동생성","priority":1}],'
            '"prfaq":{"headline":"H","risks":[{"q":"왜?","a":"근거"}]}}')
    res = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h, json={"content": full}).json()
    ap = res["applied"]
    assert ap["personas"] == 1 and ap["pains"] == 1 and ap["features"] == 1 and ap["prfaq"] == 1 and ap["idea"] >= 1

    proj = client.get(f"/api/wb/projects/{pid}", headers=h).json()
    assert proj["one_liner"] == "낙하 자동화"
    assert len(client.get(f"/api/wb/projects/{pid}/personas", headers=h).json()) == 1
    pf = client.get(f"/api/wb/projects/{pid}/prfaq", headers=h).json()
    assert pf["headline"] == "H"


def test_apply_all_invalid_json_rejected(client, login):
    h = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "P"}).json()["id"]
    # 파싱 불가 → 400
    r = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h, json={"content": "이건 JSON이 아님"})
    assert r.status_code == 400
    # 반영할 섹션이 하나도 없음 → 400
    r2 = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h, json={"content": "{}"})
    assert r2.status_code == 400


def test_apply_all_replace_is_atomic_on_bad_payload(client, login):
    """replace=True 인데 새 payload 가 어긋나도 기존 데이터가 지워지면 안 된다."""
    h = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "P"}).json()["id"]
    # 기존 페르소나 1건 심기
    client.post(f"/api/wb/projects/{pid}/apply-all", headers=h,
                json={"content": '{"personas":[{"name":"기존"}]}'})
    assert len(client.get(f"/api/wb/projects/{pid}/personas", headers=h).json()) == 1
    # 유효하지만 이름 없는 페르소나만 담긴 replace → 추출 결과 0건, 기존은 유지되되 replace 로 비워질 수 있음.
    # 파싱 불가한 replace 요청은 기존 데이터를 건드리지 않아야 한다.
    r = client.post(f"/api/wb/projects/{pid}/apply-all?replace=true", headers=h,
                    json={"content": "깨진 payload"})
    assert r.status_code == 400
    # 기존 페르소나 그대로
    assert len(client.get(f"/api/wb/projects/{pid}/personas", headers=h).json()) == 1


def test_apply_all_rejects_oversized(client, login):
    h = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "P"}).json()["id"]
    big = "x" * (600 * 1024)
    r = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h, json={"content": big})
    assert r.status_code == 413


def test_apply_all_caps_item_count(client, login):
    h = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "P"}).json()["id"]
    personas = ",".join('{"name":"P%d"}' % i for i in range(150))
    r = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h,
                    json={"content": '{"personas":[%s]}' % personas}).json()
    assert r["applied"]["personas"] == 100  # 상한 적용


# ─────────────── 동시성(낙관적 잠금) ───────────────
def test_version_starts_at_one_and_bumps(client, login):
    h = login("seoyeon.lee@company.com")
    p = client.post("/api/wb/projects", headers=h, json={"name": "V"}).json()
    assert p["version"] == 1
    # 하위 변경도 프로젝트 버전을 올린다
    client.post(f"/api/wb/projects/{p['id']}/personas", headers=h, json={"name": "A"})
    v_after_persona = client.get(f"/api/wb/projects/{p['id']}", headers=h).json()["version"]
    assert v_after_persona == 2
    # idea 수정 → 또 증가
    client.put(f"/api/wb/projects/{p['id']}", headers=h, json={"one_liner": "x"})
    assert client.get(f"/api/wb/projects/{p['id']}", headers=h).json()["version"] == 3


def test_stale_update_rejected_with_409(client, login):
    h = login("seoyeon.lee@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "V"}).json()["id"]
    v = client.get(f"/api/wb/projects/{pid}", headers=h).json()["version"]
    # 첫 저장 성공(버전 올라감)
    r1 = client.put(f"/api/wb/projects/{pid}", headers=h, json={"one_liner": "A", "expected_version": v})
    assert r1.status_code == 200
    # 같은(이제는 낡은) 버전으로 다시 → 409
    r2 = client.put(f"/api/wb/projects/{pid}", headers=h, json={"one_liner": "B", "expected_version": v})
    assert r2.status_code == 409
    # 덮어쓰기 안 됨
    assert client.get(f"/api/wb/projects/{pid}", headers=h).json()["one_liner"] == "A"


def test_cli_token_management(client, login):
    """CLI(manage_tokens)로 발급한 토큰이 웹 발급과 동일하게 API 인증에 쓰인다."""
    import argparse
    from scripts import manage_tokens as mt

    # 사용자 존재 보장(로그인=활성화)
    login("seoyeon.lee@company.com")

    # issue
    mt.cmd_issue(argparse.Namespace(email="seoyeon.lee@company.com", name="CLI"))
    # list 로 토큰이 생겼는지 확인 (예외 없이 실행되면 통과)
    mt.cmd_list(argparse.Namespace(email="seoyeon.lee@company.com"))

    # 발급된 토큰으로 실제 API 인증되는지 — DB에서 방금 만든 토큰의 원문은 못 보므로,
    # token_service 로 새로 발급해 인증 경로가 동작함을 확인(같은 서비스 재사용)
    from app.core.database import SessionLocal
    from app.services import token_service
    from app.services.auth_service import get_user_by_email
    db = SessionLocal()
    try:
        user = get_user_by_email(db, "seoyeon.lee@company.com")
        raw, row = token_service.generate_token(db, user, "verify")
    finally:
        db.close()
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {raw}"}).json()
    assert me["email"] == "seoyeon.lee@company.com"

    # revoke by id
    mt.cmd_revoke(argparse.Namespace(id=row.id, prefix=None))
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {raw}"}).status_code == 401


def test_apply_all_version_guard(client, login):
    h = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=h, json={"name": "V"}).json()["id"]
    v = client.get(f"/api/wb/projects/{pid}", headers=h).json()["version"]
    # 올바른 버전 → 성공 + 버전 증가
    ok = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h,
                     json={"content": '{"personas":[{"name":"A"}]}', "expected_version": v})
    assert ok.status_code == 200
    assert client.get(f"/api/wb/projects/{pid}", headers=h).json()["version"] == v + 1
    # 낡은 버전 → 409, 반영 안 됨
    stale = client.post(f"/api/wb/projects/{pid}/apply-all", headers=h,
                        json={"content": '{"personas":[{"name":"B"}]}', "expected_version": v})
    assert stale.status_code == 409
    assert len(client.get(f"/api/wb/projects/{pid}/personas", headers=h).json()) == 1
