def test_reflection_submit_private(client, login):
    h = login("seoyeon.lee@company.com")
    cur = client.get("/api/reflections/current", headers=h).json()
    assert cur["answered"] is False
    client.post("/api/reflections/submit", headers=h,
                json={"friction_type": "정보 공유 부족", "note": "비공개 메모"})
    cur2 = client.get("/api/reflections/current", headers=h).json()
    assert cur2["answered"] and cur2["my"]["friction_type"] == "정보 공유 부족"
    mine = client.get("/api/reflections/mine", headers=h).json()
    assert mine[0]["note"] == "비공개 메모"


def test_reflection_trends_anonymous_no_notes(client, login):
    member = login("jiho.park@company.com")
    assert client.get("/api/reflections/trends", headers=member).status_code == 403

    emails = ["seoyeon.lee@company.com", "jiho.park@company.com", "sua.choi@company.com",
              "hyunwoo.jung@company.com", "koo.park@samsung.com"]
    for e in emails:
        h = login(e)
        client.post("/api/reflections/submit", headers=h,
                    json={"friction_type": "응답/일정 지연", "note": f"secret-{e}"})

    leader = login("koo.park@samsung.com")
    data = client.get("/api/reflections/trends", headers=leader).json()
    item = next(i for i in data["items"] if i["category"] == "응답/일정 지연")
    assert item["visible"] is True and item["contributors"] >= 5
    # 메모는 절대 노출되지 않음
    assert "secret-" not in str(data)
    assert "note" not in str(data)
