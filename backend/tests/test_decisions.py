def test_decision_crud_and_permissions(client, login):
    a = login("seoyeon.lee@company.com")
    b = login("jiho.park@company.com")
    leader = login("koo.park@samsung.com")

    # 생성
    res = client.post("/api/decisions", headers=a, json={
        "title": "리포트 라이브러리 A 채택", "context": "A vs B 비교", "decision": "A 사용",
        "rationale": "문서·번들 우수", "tags": "프론트엔드, 라이브러리",
    })
    did = res.json()["id"]

    # 목록 + 직렬화(태그 분리, 작성자)
    items = client.get("/api/decisions", headers=b).json()
    d = next(x for x in items if x["id"] == did)
    assert d["author_name"] == "이서연"
    assert d["tags"] == ["프론트엔드", "라이브러리"]
    assert d["decision"] == "A 사용"

    # 필수값 검증
    assert client.post("/api/decisions", headers=a, json={"title": "x", "decision": ""}).status_code == 400

    # 타인은 수정/삭제 불가
    assert client.put(f"/api/decisions/{did}", headers=b, json={"decision": "B 사용"}).status_code == 403
    assert client.delete(f"/api/decisions/{did}", headers=b).status_code == 403

    # 작성자 수정
    client.put(f"/api/decisions/{did}", headers=a, json={"decision": "A 사용 (확정)"})
    d2 = next(x for x in client.get("/api/decisions", headers=a).json() if x["id"] == did)
    assert d2["decision"] == "A 사용 (확정)"

    # 파트장 삭제
    assert client.delete(f"/api/decisions/{did}", headers=leader).status_code == 200
    assert all(x["id"] != did for x in client.get("/api/decisions", headers=a).json())
