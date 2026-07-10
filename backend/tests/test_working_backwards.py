def _complete_style(client, headers, value_seed=3):
    """협업 스타일 진단 완료 → 공개 (페르소나 후보로 쓰기 위함)."""
    sid = client.post("/api/survey/start", headers=headers).json()["survey_id"]
    for sec in (1, 2, 3):
        q = client.get(f"/api/survey/questions/{sec}", headers=headers).json()
        client.post(f"/api/survey/submit/{sid}", headers=headers, json={
            "section": sec,
            "responses": [{"question_id": x["id"], "response": ((x["id"] * value_seed) % 5) + 1} for x in q["questions"]],
        })
    client.patch("/api/reports/me/visibility", headers=headers, json={"is_public": True})


def test_wb_project_crud_and_ownership(client, login):
    a = login("seoyeon.lee@company.com")
    b = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=a, json={"name": "Drop 해석 자동화", "domain": "drop_impact"}).json()["id"]
    assert any(p["id"] == pid for p in client.get("/api/wb/projects", headers=a).json())
    # 타인은 접근 불가
    assert client.get(f"/api/wb/projects/{pid}", headers=b).status_code == 404
    # 수정
    client.put(f"/api/wb/projects/{pid}", headers=a, json={"current_problem": "반복 케이스 생성"})
    assert client.get(f"/api/wb/projects/{pid}", headers=a).json()["current_problem"] == "반복 케이스 생성"


def test_living_persona_from_collab_style(client, login):
    owner = login("seoyeon.lee@company.com")
    mate = login("jiho.park@company.com")
    _complete_style(client, mate)  # 동료가 협업 스타일 공개

    # 후보 목록에 동료 등장
    cands = client.get("/api/wb/persona-candidates", headers=owner).json()
    mate_c = next(c for c in cands if c["name"] == "박지호")
    assert mate_c["style_code"] in ("red", "green", "yellow", "blue")

    pid = client.post("/api/wb/projects", headers=owner, json={"name": "P"}).json()["id"]
    # 실제 동료 기반 페르소나 → 스타일 기본값 자동 채움
    persona = client.post(f"/api/wb/projects/{pid}/personas", headers=owner,
                          json={"name": "", "role": "임원", "source_user_id": mate_c["user_id"]}).json()
    assert persona["name"] == "박지호"
    assert persona["style_code"] == mate_c["style_code"]
    assert persona["goals"]  # 스타일에서 자동 채워짐

    # 비공개/미완료 동료는 페르소나 불가
    other = login("sua.choi@company.com")  # 스타일 미완료
    other_me = client.get("/api/auth/me", headers=other).json()
    r = client.post(f"/api/wb/projects/{pid}/personas", headers=owner,
                    json={"name": "x", "source_user_id": other_me["id"]})
    assert r.status_code == 400


def test_pain_import_from_workcraft(client, login):
    owner = login("seoyeon.lee@company.com")
    # 공유 불편함 1건
    client.post("/api/workcraft/frictions", headers=owner,
                json={"title": "반복 보고서", "friction_type": "반복 보고서 작성", "visibility": "team_public"})
    # 회고 마찰 5명(익명 집계 대상)
    for e in ["seoyeon.lee@company.com", "jiho.park@company.com", "sua.choi@company.com",
              "hyunwoo.jung@company.com", "koo.park@samsung.com"]:
        h = login(e)
        client.post("/api/reflections/submit", headers=h, json={"friction_type": "정보 공유 부족", "note": "x"})

    pid = client.post("/api/wb/projects", headers=owner, json={"name": "P"}).json()["id"]
    res = client.post(f"/api/wb/projects/{pid}/pains/import", headers=owner).json()
    assert res["imported"] >= 2
    pains = client.get(f"/api/wb/projects/{pid}/pains", headers=owner).json()
    assert any(p["source"] == "friction" for p in pains)
    assert any(p["source"] == "reflection" and p["title"] == "정보 공유 부족" for p in pains)


def test_generators_validation_and_export(client, login):
    owner = login("seoyeon.lee@company.com")
    mate = login("jiho.park@company.com")
    _complete_style(client, mate, value_seed=2)
    mate_c = next(c for c in client.get("/api/wb/persona-candidates", headers=owner).json() if c["name"] == "박지호")

    pid = client.post("/api/wb/projects", headers=owner, json={
        "name": "AP Thermal Automation", "one_liner": "AP 발열 기반 BGA fatigue 자동화",
        "current_problem": "조건 변경마다 수작업", "expected_benefit": "판단 표준화",
    }).json()["id"]
    client.post(f"/api/wb/projects/{pid}/personas", headers=owner,
                json={"name": "", "role": "임원", "source_user_id": mate_c["user_id"]})

    # Today's Statement 생성
    assert client.post(f"/api/wb/projects/{pid}/generate/today-statements", headers=owner).json()["generated"] == 1
    personas = client.get(f"/api/wb/projects/{pid}/personas", headers=owner).json()
    assert personas[0]["today_statement"]

    # PR/FAQ skeleton — 스타일 기반 반론이 risks에 자동 포함
    pf = client.post(f"/api/wb/projects/{pid}/generate/prfaq-skeleton", headers=owner).json()
    assert pf["headline"] and len(pf["risks"]) >= 1
    assert any("박지호" in (r["q"] or "") for r in pf["risks"])

    # Validation
    scores = {i["key"]: 4 for i in client.get("/api/wb/meta", headers=owner).json()["validation_items"]}
    v = client.put(f"/api/wb/projects/{pid}/validation", headers=owner, json={"scores": scores}).json()
    assert v["total"] == 32 and v["verdict"]
    # 자동 힌트
    hints = client.get(f"/api/wb/projects/{pid}/validation/hints", headers=owner).json()
    assert hints["stakeholders"] >= 1

    # Export: Markdown + LLM 프롬프트
    exp = client.get(f"/api/wb/projects/{pid}/export", headers=owner).json()
    assert "# AP Thermal Automation" in exp["markdown"]
    assert "PR/FAQ" in exp["markdown"]
    assert "Working Backwards" in exp["llm_prompt"] and exp["markdown"] in exp["llm_prompt"]
