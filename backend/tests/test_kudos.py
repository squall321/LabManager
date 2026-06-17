def test_kudos_give_feed_received(client, login):
    a = login("seoyeon.lee@company.com")
    # 대상 id 확보
    recipients = client.get("/api/kudos/meta", headers=a).json()["recipients"]
    target = next(r for r in recipients if r["name"] == "박지호")

    client.post("/api/kudos", headers=a,
                json={"to_user_id": target["id"], "category": "빠른 응답", "message": "덕분에 막힌 게 풀렸어요"})

    # 피드에 노출
    feed = client.get("/api/kudos/feed", headers=a).json()
    assert any(k["to_name"] == "박지호" and k["category"] == "빠른 응답" for k in feed)

    # 받은 사람(박지호) 입장
    b = login("jiho.park@company.com")
    rec = client.get("/api/kudos/received", headers=b).json()
    assert rec["count"] == 1 and rec["items"][0]["from_name"] == "이서연"


def test_kudos_cannot_self_and_leader_recognized(client, login):
    a = login("sua.choi@company.com")
    me = client.get("/api/auth/me", headers=a).json()
    assert client.post("/api/kudos", headers=a, json={"to_user_id": me["id"]}).status_code == 400

    # 비-파트장은 recent-recognized 접근 불가
    assert client.get("/api/kudos/recent-recognized", headers=a).status_code == 403

    # 칭찬 한 건 발생 후 파트장이 인정받은 동료(이름만) 확인
    recipients = client.get("/api/kudos/meta", headers=a).json()["recipients"]
    target = next(r for r in recipients if r["name"] == "정현우")
    client.post("/api/kudos", headers=a, json={"to_user_id": target["id"], "category": "든든함"})

    leader = login("koo.park@samsung.com")
    data = client.get("/api/kudos/recent-recognized", headers=leader).json()
    assert "정현우" in data["recognized"]
    # 개수/순위는 노출하지 않음
    assert isinstance(data["recognized"], list)
