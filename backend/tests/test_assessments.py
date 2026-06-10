def _answers(client, headers, key, value=4):
    q = client.get(f"/api/assessments/{key}/questions", headers=headers).json()
    return {str(it["id"]): value for it in q["items"]}


def test_list_and_submit_sdt(client, login):
    h = login("seoyeon.lee@company.com")
    lst = client.get("/api/assessments", headers=h).json()
    keys = {i["key"] for i in lst}
    assert {"psych_safety", "sdt"} <= keys

    # SDT(개인) 제출 → 결과
    resp = _answers(client, h, "sdt", 5)
    r = client.post("/api/assessments/sdt/submit", headers=h, json={"responses": resp}).json()
    assert r["scope"] == "individual"
    assert set(r["subscales"].keys()) == {"autonomy", "competence", "relatedness"}
    # 모두 5점 → 100
    assert r["subscales"]["autonomy"]["score"] == 100.0
    assert r["overall"] == 100.0

    # 결과 재조회 + 목록에 completed 반영
    assert client.get("/api/assessments/sdt/result", headers=h).status_code == 200
    lst2 = client.get("/api/assessments", headers=h).json()
    assert next(i for i in lst2 if i["key"] == "sdt")["completed"] is True


def test_psych_safety_reverse_scoring(client, login):
    h = login("jiho.park@company.com")
    q = client.get("/api/assessments/psych_safety/questions", headers=h).json()
    # 정상문항은 5, 역채점 문항은 1 → 모두 '안전감 높음'으로 해석되어야 함
    resp = {str(it["id"]): (1 if it["reverse"] else 5) for it in q["items"]}
    r = client.post("/api/assessments/psych_safety/submit", headers=h, json={"responses": resp}).json()
    assert r["overall"] == 100.0  # 역채점이 올바르면 만점


def test_team_aggregate_threshold_and_access(client, login):
    # 5명이 psych_safety 제출 → 익명 집계 공개
    emails = ["seoyeon.lee@company.com", "jiho.park@company.com", "sua.choi@company.com",
              "hyunwoo.jung@company.com", "koo.park@samsung.com"]
    for e in emails:
        h = login(e)
        resp = _answers(client, h, "psych_safety", 4)
        client.post("/api/assessments/psych_safety/submit", headers=h, json={"responses": resp})

    # 비-파트장 접근 차단
    member = login("seoyeon.lee@company.com")
    assert client.get("/api/assessments/psych_safety/team", headers=member).status_code == 403

    leader = login("koo.park@samsung.com")  # part_leader
    agg = client.get("/api/assessments/psych_safety/team", headers=leader).json()
    assert agg["visible"] is True
    assert agg["n"] >= 5
    assert "overall" in agg and "item_means" in agg
    # 개인 식별 정보 없음
    assert "user_id" not in str(agg)

    # 개인 척도(SDT)는 팀 집계 미제공
    assert client.get("/api/assessments/sdt/team", headers=leader).status_code == 400
