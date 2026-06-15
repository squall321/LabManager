def test_pulse_submit_and_current(client, login):
    h = login("seoyeon.lee@company.com")
    cur = client.get("/api/pulse/current", headers=h).json()
    assert cur["answered"] is False
    keys = [q["key"] for q in cur["questions"]]
    assert "safety" in keys

    resp = {k: 4 for k in keys}
    assert client.post("/api/pulse/submit", headers=h, json={"responses": resp}).status_code == 200
    cur2 = client.get("/api/pulse/current", headers=h).json()
    assert cur2["answered"] is True
    assert cur2["my_responses"]["safety"] == 4


def test_pulse_trends_threshold_and_access(client, login):
    member = login("jiho.park@company.com")
    assert client.get("/api/pulse/trends", headers=member).status_code == 403

    # 5명 제출 → 이번 주 추세 공개
    emails = ["seoyeon.lee@company.com", "jiho.park@company.com", "sua.choi@company.com",
              "hyunwoo.jung@company.com", "koo.park@samsung.com"]
    for e in emails:
        h = login(e)
        q = client.get("/api/pulse/current", headers=h).json()["questions"]
        client.post("/api/pulse/submit", headers=h, json={"responses": {x["key"]: 3 for x in q}})

    leader = login("koo.park@samsung.com")
    data = client.get("/api/pulse/trends", headers=leader).json()
    assert data["min_n"] == 5
    last = data["series"][-1]  # 이번 주
    assert last["visible"] is True
    assert last["safety"] is not None
    assert "user_id" not in str(data)
