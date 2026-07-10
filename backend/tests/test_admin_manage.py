def test_wb_domains_seeded_and_crud(client, login):
    admin = login("koo.park@samsung.com")  # is_admin
    member = login("seoyeon.lee@company.com")

    # 시드된 기본 도메인이 존재
    doms = client.get("/api/admin/wb-domains", headers=admin).json()
    assert any(d["key"] == "thermal" for d in doms)

    # 비-관리자는 접근 불가
    assert client.get("/api/admin/wb-domains", headers=member).status_code == 403

    # 생성 (key 자동 slug)
    res = client.post("/api/admin/wb-domains", headers=admin, json={"name": "진동/모달", "description": "modal"})
    did = res.json()["id"]; key = res.json()["key"]
    assert key  # slug 생성됨

    # WB meta(사용자)에도 반영됨 (DB 우선)
    meta = client.get("/api/wb/meta", headers=member).json()
    assert any(d["name"] == "진동/모달" for d in meta["domains"])

    # 수정 (비활성화 → meta에서 제외)
    client.put(f"/api/admin/wb-domains/{did}", headers=admin, json={"active": False})
    meta2 = client.get("/api/wb/meta", headers=member).json()
    assert not any(d.get("name") == "진동/모달" for d in meta2["domains"])

    # 삭제
    assert client.delete(f"/api/admin/wb-domains/{did}", headers=admin).status_code == 200
    # 비-관리자는 생성/삭제 불가
    assert client.post("/api/admin/wb-domains", headers=member, json={"name": "x"}).status_code == 403


def test_backup_admin_only(client, login):
    admin = login("koo.park@samsung.com")
    member = login("seoyeon.lee@company.com")

    assert client.get("/api/admin/backups", headers=member).status_code == 403
    assert client.post("/api/admin/backups", headers=member).status_code == 403

    # 관리자: 백업 생성 → 목록에 노출
    created = client.post("/api/admin/backups", headers=admin).json()
    assert created["ok"] and created["name"].endswith(".db")
    lst = client.get("/api/admin/backups", headers=admin).json()["backups"]
    assert any(b["name"] == created["name"] for b in lst)

    # 다운로드 (관리자) + 경로 traversal 차단
    dl = client.get(f"/api/admin/backups/{created['name']}/download", headers=admin)
    assert dl.status_code == 200 and len(dl.content) > 0
    bad = client.get("/api/admin/backups/..%2f..%2fusers.yaml/download", headers=admin)
    assert bad.status_code == 404
