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
