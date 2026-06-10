def test_friction_default_private_and_isolation(client, login):
    a = login("seoyeon.lee@company.com")
    b = login("jiho.park@company.com")

    f = client.post("/api/workcraft/frictions", headers=a,
                    json={"title": "격리 테스트 불편함", "friction_type": "기타"}).json()
    assert f["visibility"] == "private"  # 기본 비공개

    # 본인은 보임, 타인 목록엔 없음
    mine = client.get("/api/workcraft/frictions", headers=a).json()
    assert any(x["id"] == f["id"] for x in mine)
    others = client.get("/api/workcraft/frictions", headers=b).json()
    assert all(x["id"] != f["id"] for x in others)

    # 타인은 수정/삭제 불가
    assert client.put(f"/api/workcraft/frictions/{f['id']}", headers=b, json={"title": "x"}).status_code == 404
    assert client.delete(f"/api/workcraft/frictions/{f['id']}", headers=b).status_code == 404


def test_mission_prompt_and_status(client, login):
    a = login("seoyeon.lee@company.com")
    m = client.post("/api/workcraft/missions", headers=a,
                    json={"title": "프롬프트 테스트 미션", "success_criteria": "동작한다"}).json()
    assert m["status"] == "idea"

    p = client.post(f"/api/workcraft/missions/{m['id']}/prompt/generate", headers=a).json()
    assert "Acceptance Criteria" in p["prompt_text"]
    # 프롬프트 생성 시 idea -> prompt_ready
    after = [x for x in client.get("/api/workcraft/missions", headers=a).json() if x["id"] == m["id"]][0]
    assert after["status"] == "prompt_ready"

    # 타인 미션 수정 불가
    b = login("jiho.park@company.com")
    assert client.put(f"/api/workcraft/missions/{m['id']}", headers=b, json={"status": "done"}).status_code == 404


def test_shared_friction_visibility(client, login):
    a = login("seoyeon.lee@company.com")
    b = login("jiho.park@company.com")
    # private는 공유 목록에 안 뜨고, team_public은 뜸
    client.post("/api/workcraft/frictions", headers=a, json={"title": "비공개X", "visibility": "private"})
    shared = client.post("/api/workcraft/frictions", headers=a,
                         json={"title": "공유O 보고서", "visibility": "team_public"}).json()
    lst = client.get("/api/workcraft/frictions/shared", headers=b).json()
    titles = [s["title"] for s in lst]
    assert "공유O 보고서" in titles
    assert "비공개X" not in titles

    # 비공개 friction을 origin으로 미션 생성 시도 → 404 (역추적 차단)
    priv = client.post("/api/workcraft/frictions", headers=a,
                       json={"title": "은밀한 불편함", "visibility": "private"}).json()
    assert client.post("/api/workcraft/missions", headers=b,
                       json={"title": "x", "origin_friction_id": priv["id"]}).status_code == 404
    # 공유 friction을 origin으로는 가능
    ok = client.post("/api/workcraft/missions", headers=b,
                     json={"title": "동료문제 해결", "origin_friction_id": shared["id"]})
    assert ok.status_code == 200


def test_recommendation_graceful_without_birkman(client, login):
    a = login("jiho.park@company.com")
    rec = client.get("/api/workcraft/recommendations", headers=a).json()
    assert "has_birkman" in rec
