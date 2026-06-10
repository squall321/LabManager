MARK = "리더테스트유형"  # 이 테스트에서만 쓰는 고유 불편함 유형


def test_leader_requires_part_leader(client, login):
    member = login("jiho.park@company.com")
    assert client.get("/api/leader/anonymous-trends", headers=member).status_code == 403


def test_anonymity_threshold(client, login):
    # 5명의 서로 다른 사용자가 동일 유형 불편함 생성 → 임계값(5) 충족 → 공개
    emails = ["seoyeon.lee@company.com", "jiho.park@company.com", "sua.choi@company.com",
              "admin@company.com", "koo.park@samsung.com"]
    for e in emails:
        h = login(e)
        client.post("/api/workcraft/frictions", headers=h,
                    json={"title": f"{e} {MARK}", "friction_type": MARK})

    leader = login("koo.park@samsung.com")  # part_leader
    data = client.get("/api/leader/anonymous-trends", headers=leader).json()
    assert data["anonymity_min_n"] == 5
    trend = next((t for t in data["friction_trends"] if t["category"] == MARK), None)
    assert trend is not None
    assert trend["visible"] is True
    assert trend["contributors"] >= 5
    # 응답에 개인 식별 정보가 없어야 함
    assert "user_id" not in str(data["friction_trends"])


def test_template_share_anonymity(client, login):
    a = login("seoyeon.lee@company.com")
    m = client.post("/api/workcraft/missions", headers=a, json={"title": "템플릿용 미션"}).json()

    named = client.post("/api/workcraft/templates/share", headers=a,
                        json={"source_type": "mission", "source_id": m["id"],
                              "title": "실명 템플릿", "anonymized": False}).json()
    anon = client.post("/api/workcraft/templates/share", headers=a,
                       json={"source_type": "mission", "source_id": m["id"],
                             "title": "익명 템플릿", "anonymized": True}).json()
    assert named["owner_name"] != "익명"
    assert anon["owner_name"] == "익명"

    # 다른 구성원도 템플릿 목록을 볼 수 있다
    b = login("jiho.park@company.com")
    titles = [t["title"] for t in client.get("/api/workcraft/templates", headers=b).json()]
    assert "실명 템플릿" in titles and "익명 템플릿" in titles


def test_growth_review_flow(client, login):
    a = login("sua.choi@company.com")
    m = client.post("/api/workcraft/missions", headers=a,
                    json={"title": "성장 테스트 미션", "learning_goal": "FastAPI"}).json()
    r = client.post(f"/api/workcraft/missions/{m['id']}/review", headers=a,
                    json={"result_summary": "완성", "learned_skill": "pytest, CI"})
    assert r.status_code == 200
    # 회고 시 미션 자동 완료
    after = [x for x in client.get("/api/workcraft/missions", headers=a).json() if x["id"] == m["id"]][0]
    assert after["status"] == "done"

    g = client.get("/api/workcraft/growth", headers=a).json()
    assert g["counts"]["completed"] >= 1
    assert g["counts"]["learnings"] >= 1
    # 역량이 미션 학습목표 + 회고에서 병합됨
    assert "pytest" in g["skills"] and "FastAPI" in g["skills"]
    assert any(mi["achieved"] for mi in g["milestones"])
