def test_agreement_create_agree_delete(client, login):
    a = login("seoyeon.lee@company.com")
    b = login("jiho.park@company.com")
    leader = login("koo.park@samsung.com")

    # 생성 (작성자는 자동 동의 1)
    res = client.post("/api/agreements", headers=a, json={"category": "회의", "text": "오후 2~4시는 집중 시간"})
    aid = res.json()["id"]
    items = client.get("/api/agreements", headers=b).json()
    item = next(i for i in items if i["id"] == aid)
    assert item["agree_count"] == 1 and item["i_agree"] is False and item["is_mine"] is False

    # B 동의 → 2
    client.post(f"/api/agreements/{aid}/agree", headers=b)
    item = next(i for i in client.get("/api/agreements", headers=b).json() if i["id"] == aid)
    assert item["agree_count"] == 2 and item["i_agree"] is True
    # 토글 해제 → 1
    client.post(f"/api/agreements/{aid}/agree", headers=b)
    item = next(i for i in client.get("/api/agreements", headers=b).json() if i["id"] == aid)
    assert item["agree_count"] == 1

    # 타인은 삭제 불가(작성자/파트장 아님)
    assert client.delete(f"/api/agreements/{aid}", headers=b).status_code == 403
    # 파트장은 삭제 가능
    assert client.delete(f"/api/agreements/{aid}", headers=leader).status_code == 200
    assert all(i["id"] != aid for i in client.get("/api/agreements", headers=a).json())


def test_agreement_author_can_delete(client, login):
    a = login("sua.choi@company.com")
    aid = client.post("/api/agreements", headers=a, json={"category": "피드백", "text": "피드백은 행동 중심으로"}).json()["id"]
    assert client.delete(f"/api/agreements/{aid}", headers=a).status_code == 200
