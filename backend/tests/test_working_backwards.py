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


def test_trash_soft_delete_restore_and_purge(client, login):
    a = login("seoyeon.lee@company.com")
    pid = client.post("/api/wb/projects", headers=a, json={"name": "지울 프로젝트"}).json()["id"]

    # 삭제 = 보관함으로 이동(소프트). 기본 목록에서 사라지고 보관함에 나타남
    r = client.delete(f"/api/wb/projects/{pid}", headers=a).json()
    assert r["trashed"] == pid
    assert not any(p["id"] == pid for p in client.get("/api/wb/projects", headers=a).json())
    trashed = client.get("/api/wb/projects", headers=a, params={"trashed": True}).json()
    assert any(p["id"] == pid for p in trashed)

    # 보관함 항목은 조회·수정 불가(먼저 복구해야 함)
    assert client.get(f"/api/wb/projects/{pid}", headers=a).status_code == 404
    assert client.put(f"/api/wb/projects/{pid}", headers=a, json={"one_liner": "x"}).status_code == 404

    # 복구 → 다시 정상
    assert client.post(f"/api/wb/projects/{pid}/restore", headers=a).status_code == 200
    assert client.get(f"/api/wb/projects/{pid}", headers=a).status_code == 200

    # purge 는 보관함에 있을 때만 허용
    assert client.delete(f"/api/wb/projects/{pid}", headers=a, params={"purge": True}).status_code == 400
    client.delete(f"/api/wb/projects/{pid}", headers=a)  # 보관함으로
    assert client.delete(f"/api/wb/projects/{pid}", headers=a, params={"purge": True}).json()["purged"] == pid
    # 이제 완전히 사라짐
    assert not any(p["id"] == pid for p in client.get("/api/wb/projects", headers=a, params={"trashed": True}).json())


def test_project_search_filter_sort(client, login):
    a = login("sua.choi@company.com")
    p1 = client.post("/api/wb/projects", headers=a, json={"name": "낙하 자동화", "domain": "drop_impact"}).json()["id"]
    client.post("/api/wb/projects", headers=a, json={"name": "열 해석 도구", "domain": "thermal"})
    client.put(f"/api/wb/projects/{p1}", headers=a, json={"status": "validated"})

    # 이름 검색
    res = client.get("/api/wb/projects", headers=a, params={"q": "낙하"}).json()
    assert len(res) == 1 and res[0]["id"] == p1
    # 업무유형 필터
    thermal = client.get("/api/wb/projects", headers=a, params={"domain": "thermal"}).json()
    assert len(thermal) == 1 and thermal[0]["name"] == "열 해석 도구"
    # 상태 필터
    validated = client.get("/api/wb/projects", headers=a, params={"status": "validated"}).json()
    assert len(validated) == 1 and validated[0]["id"] == p1
    # 이름순 정렬
    names = [p["name"] for p in client.get("/api/wb/projects", headers=a, params={"sort": "name"}).json()]
    assert names == sorted(names)


def test_create_from_interview(client, login):
    a = login("seoyeon.lee@company.com")
    # 프로젝트 없이 인터뷰 프롬프트 생성
    pr = client.post("/api/wb/projects/prompt/interview-new", headers=a,
                     json={"name": "낙하 자동화", "transcript": "매번 손으로 케이스 만듦"}).json()
    assert "JSON" in pr["prompt"] and "매번 손으로" in pr["prompt"]
    # 전체 JSON으로 새 프로젝트 생성 + 채우기
    content = ('{"idea":{"one_liner":"낙하 자동화"},'
               '"personas":[{"name":"해석자"}],"pains":[{"title":"반복"}],'
               '"features":[{"name":"자동생성","priority":1}]}')
    p = client.post("/api/wb/projects/create-from-interview", headers=a,
                    json={"name": "낙하 자동화", "content": content, "domain": "drop_impact"}).json()
    assert p["id"] and p["one_liner"] == "낙하 자동화"
    assert len(client.get(f"/api/wb/projects/{p['id']}/personas", headers=a).json()) == 1
    # 빈 내용이면 프로젝트가 생성되지 않음
    bad = client.post("/api/wb/projects/create-from-interview", headers=a,
                      json={"name": "빈", "content": "{}"})
    assert bad.status_code == 400
    assert not any(x["name"] == "빈" for x in client.get("/api/wb/projects", headers=a).json())


def test_duplicate_project(client, login):
    a = login("jiho.park@company.com")
    pid = client.post("/api/wb/projects", headers=a, json={"name": "원본", "domain": "thermal"}).json()["id"]
    client.post(f"/api/wb/projects/{pid}/personas", headers=a, json={"name": "P1"})
    client.post(f"/api/wb/projects/{pid}/pains", headers=a, json={"title": "문제1"})
    client.post(f"/api/wb/projects/{pid}/features", headers=a, json={"name": "기능1", "priority": 2})
    client.put(f"/api/wb/projects/{pid}", headers=a, json={"status": "validated"})

    dup = client.post(f"/api/wb/projects/{pid}/duplicate", headers=a).json()
    assert dup["id"] != pid
    assert dup["name"] == "원본 (복제)" and dup["domain"] == "thermal"
    assert dup["status"] == "draft"   # 복제본은 초안으로 초기화
    assert len(client.get(f"/api/wb/projects/{dup['id']}/personas", headers=a).json()) == 1
    assert len(client.get(f"/api/wb/projects/{dup['id']}/pains", headers=a).json()) == 1
    assert len(client.get(f"/api/wb/projects/{dup['id']}/features", headers=a).json()) == 1
    # 원본은 그대로
    assert client.get(f"/api/wb/projects/{pid}", headers=a).json()["status"] == "validated"


def test_wb_stats(client, login):
    a = login("sua.choi@company.com")
    p1 = client.post("/api/wb/projects", headers=a, json={"name": "A"}).json()["id"]
    client.post("/api/wb/projects", headers=a, json={"name": "B"})
    client.put(f"/api/wb/projects/{p1}", headers=a, json={"status": "validated"})
    s = client.get("/api/wb/stats", headers=a).json()
    assert s["total"] == 2 and s["validated"] == 1 and s["draft"] == 1
    assert len(s["recent"]) == 2
    # 보관함 항목은 통계에서 제외
    client.delete(f"/api/wb/projects/{p1}", headers=a)
    assert client.get("/api/wb/stats", headers=a).json()["total"] == 1


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


def test_llm_bridge_prompt_and_apply(client, login):
    owner = login("seoyeon.lee@company.com")
    pid = client.post("/api/wb/projects", headers=owner, json={
        "name": "Drop 자동화", "one_liner": "낙하 해석 자동화", "current_problem": "케이스 수작업"}).json()["id"]

    # 1) 프롬프트 생성 (JSON 계약 포함)
    pr = client.get(f"/api/wb/projects/{pid}/prompt/personas", headers=owner).json()
    assert "JSON" in pr["prompt"] and "personas" in pr["prompt"]

    # 2) LLM이 돌려준 것처럼 JSON 붙여넣기 (코드펜스/잡텍스트 섞여도 파싱)
    pasted = '설명 어쩌구...\n```json\n{"personas":[{"name":"해석 실무자","role":"엔지니어","goals":"반복 감소"},{"name":"임원","role":"의사결정","goals":"ROI"}]}\n```'
    res = client.post(f"/api/wb/projects/{pid}/apply/personas", headers=owner, json={"content": pasted}).json()
    assert res["applied"] == 2
    personas = client.get(f"/api/wb/projects/{pid}/personas", headers=owner).json()
    assert {p["name"] for p in personas} == {"해석 실무자", "임원"}

    # DITL 적용 (persona_id 지정, 교체)
    pers_id = personas[0]["id"]
    ditl = '{"scenarios":[{"time_block":"오전","activity":"모델 복사","pain_point":"조건 재확인"}]}'
    r = client.post(f"/api/wb/projects/{pid}/apply/ditl?persona_id={pers_id}", headers=owner, json={"content": ditl}).json()
    assert r["applied"] == 1

    # Pains 적용
    client.post(f"/api/wb/projects/{pid}/apply/pains", headers=owner,
                json={"content": '{"pains":[{"title":"반복 세팅","description":"매번 수작업"}]}'})
    pains = client.get(f"/api/wb/projects/{pid}/pains", headers=owner).json()
    assert any(p["source"] == "llm" and p["title"] == "반복 세팅" for p in pains)

    # Features 적용
    client.post(f"/api/wb/projects/{pid}/apply/features", headers=owner,
                json={"content": '{"features":[{"name":"케이스 자동 생성","priority":1,"reason":"핵심"}]}'})
    feats = client.get(f"/api/wb/projects/{pid}/features", headers=owner).json()
    assert feats and feats[0]["name"] == "케이스 자동 생성"

    # PR/FAQ 적용 (객체 자체)
    prfaq_json = '{"headline":"H","customer_problem":"CP","risks":[{"q":"왜?","a":"근거"}]}'
    client.post(f"/api/wb/projects/{pid}/apply/prfaq", headers=owner, json={"content": prfaq_json})
    pf = client.get(f"/api/wb/projects/{pid}/prfaq", headers=owner).json()
    assert pf["headline"] == "H" and pf["risks"][0]["q"] == "왜?"

    # 잘못된 입력 → 400
    bad = client.post(f"/api/wb/projects/{pid}/apply/personas", headers=owner, json={"content": "그냥 텍스트"})
    assert bad.status_code == 400
