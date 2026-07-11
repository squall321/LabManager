"""
디지털트윈AX랩 — MCP 서버

Claude/ChatGPT 같은 생성형 AI가 대화(인터뷰·음성인식 정리)만으로 이 앱의
Working Backwards 프로젝트를 직접 읽고 채울 수 있게 해주는 얇은 래퍼입니다.

- 앱의 REST API(기본 http://localhost:8010/api)를 그대로 호출합니다.
- 인증은 앱에서 발급한 개인 API 토큰(lmk_...)을 LABMGR_TOKEN 환경변수로 받습니다.
- '전체 채우기'는 앱 백엔드와 동일한 JSON 계약(idea/personas/pains/features/prfaq)을 씁니다.

실행:
    LABMGR_TOKEN=lmk_xxx  LABMGR_API=http://localhost:8010/api  python server.py

Claude Desktop 등록 예시는 docs/MCP_GUIDE.md 참고.
"""
from __future__ import annotations

import json
import os
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP

API_BASE = os.environ.get("LABMGR_API", "http://localhost:8010/api").rstrip("/")
TOKEN = os.environ.get("LABMGR_TOKEN", "")

mcp = FastMCP("labmanager-wb")


def _client() -> httpx.Client:
    if not TOKEN:
        raise RuntimeError(
            "LABMGR_TOKEN 환경변수가 없습니다. 앱의 'API 토큰' 페이지에서 개인 토큰(lmk_...)을 "
            "발급해 LABMGR_TOKEN에 넣어주세요."
        )
    return httpx.Client(
        base_url=API_BASE,
        headers={"Authorization": f"Bearer {TOKEN}"},
        timeout=30.0,
    )


def _handle(resp: httpx.Response) -> Any:
    if resp.status_code == 401:
        raise RuntimeError("인증 실패 — 토큰이 만료·해지되었거나 잘못되었습니다.")
    if resp.status_code >= 400:
        detail = ""
        try:
            detail = resp.json().get("detail", "")
        except Exception:
            detail = resp.text[:300]
        raise RuntimeError(f"요청 실패 ({resp.status_code}): {detail}")
    if resp.headers.get("content-type", "").startswith("application/json"):
        return resp.json()
    return resp.text


def _request(method: str, path: str, *, body: Any = None, params: dict | None = None) -> Any:
    try:
        with _client() as c:
            return _handle(c.request(method, path, json=body, params=params or None))
    except httpx.ConnectError:
        raise RuntimeError(
            f"앱 백엔드에 연결할 수 없습니다({API_BASE}). "
            "백엔드 서버가 실행 중인지, LABMGR_API 주소가 맞는지 확인하세요."
        )
    except httpx.TimeoutException:
        raise RuntimeError("요청이 시간 내에 응답하지 않았습니다. 잠시 후 다시 시도하세요.")


def _get(path: str, **params) -> Any:
    return _request("GET", path, params=params)


def _post(path: str, body: Any = None, **params) -> Any:
    return _request("POST", path, body=body, params=params)


def _put(path: str, body: Any = None) -> Any:
    return _request("PUT", path, body=body)


# ─────────────────────────── 읽기 도구 ───────────────────────────
@mcp.tool()
def whoami() -> dict:
    """현재 토큰의 소유 계정(이름·부서·이메일)을 확인합니다. 연결이 잘 되었는지 점검할 때 사용하세요."""
    return _get("/auth/me")


@mcp.tool()
def list_projects() -> list[dict]:
    """내 Working Backwards 프로젝트 목록을 반환합니다. 각 항목은 id, name, one_liner, status를 포함합니다."""
    projects = _get("/wb/projects")
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "one_liner": p.get("one_liner", ""),
            "status": p.get("status", "draft"),
            "domain": p.get("domain", ""),
        }
        for p in projects
    ]


@mcp.tool()
def create_project(name: str, one_liner: str = "", current_problem: str = "") -> dict:
    """새 Working Backwards 프로젝트를 만듭니다. 인터뷰로 새 아이디어를 정리했다면 여기서 프로젝트부터 만든 뒤 fill_project로 채우세요."""
    if not name or not name.strip():
        raise RuntimeError("프로젝트 이름(name)이 필요합니다.")
    return _post("/wb/projects", {"name": name.strip(), "one_liner": one_liner, "current_problem": current_problem})


@mcp.tool()
def get_project(project_id: int) -> dict:
    """프로젝트 하나의 전체 내용(아이디어 캔버스·페르소나·문제·PR/FAQ·기능·검증)을 한 번에 읽어옵니다. 채우기 전에 현재 상태를 파악할 때 쓰세요."""
    proj = _get(f"/wb/projects/{project_id}")
    personas = _get(f"/wb/projects/{project_id}/personas")
    pains = _get(f"/wb/projects/{project_id}/pains")
    features = _get(f"/wb/projects/{project_id}/features")
    try:
        prfaq = _get(f"/wb/projects/{project_id}/prfaq")
    except RuntimeError:
        prfaq = None
    try:
        validation = _get(f"/wb/projects/{project_id}/validation")
    except RuntimeError:
        validation = None
    return {
        "idea": proj,
        "personas": personas,
        "pains": pains,
        "features": features,
        "prfaq": prfaq,
        "validation": validation,
    }


@mcp.tool()
def get_fill_schema(project_id: int, transcript: str = "") -> str:
    """
    프로젝트를 '한 번에 채우기' 위해 만들어야 하는 JSON 스키마와 작성 지침을 반환합니다.
    transcript(인터뷰·회의 녹취 정리)를 넣으면 현재 프로젝트 맥락과 함께 지침에 포함됩니다.
    이 지침대로 JSON을 구성한 뒤 fill_project로 넘기면 됩니다.
    """
    r = _post(f"/wb/projects/{project_id}/prompt/interview", {"transcript": transcript})
    return r["prompt"]


# ─────────────────────────── 쓰기 도구 ───────────────────────────
@mcp.tool()
def fill_project(project_id: int, content: str, replace: bool = False) -> dict:
    """
    인터뷰/대화에서 정리한 내용을 프로젝트 전체에 한 번에 반영합니다.

    content 는 다음 형태의 JSON 문자열(또는 이미 객체)입니다. 모든 키는 선택이며 있는 것만 채워집니다:
      {
        "idea": {"one_liner": ..., "current_problem": ..., "target_user": ...,
                 "expected_benefit": ..., "current_alternative": ...,
                 "success_criteria": ..., "not_doing": ...},
        "personas": [{"name": ..., "role": ..., "goals": ..., "fears": ..., "comm_style": ...}],
        "pains":    [{"title": ..., "description": ...}],
        "features": [{"name": ..., "priority": 1~5, "reason": ...}],
        "prfaq":    {"headline": ..., "subtitle": ..., "customer_problem": ...,
                     "solution": ..., "faq": [{"q":...,"a":...}], "risks": [{"q":...,"a":...}]}
      }

    get_fill_schema 의 지침에 맞춰 만드세요.
    replace=True 이면 기존 페르소나·문제·기능을 지우고 새로 채웁니다(기본은 추가).
    """
    if isinstance(content, (dict, list)):
        content = json.dumps(content, ensure_ascii=False)
    if not content or not str(content).strip():
        raise RuntimeError("채울 내용(content JSON)이 비어 있습니다.")
    return _post(f"/wb/projects/{project_id}/apply-all", {"content": content}, replace=replace)


@mcp.tool()
def update_idea(
    project_id: int,
    name: str | None = None,
    one_liner: str | None = None,
    current_problem: str | None = None,
    target_user: str | None = None,
    expected_benefit: str | None = None,
    current_alternative: str | None = None,
    success_criteria: str | None = None,
    not_doing: str | None = None,
    domain: str | None = None,
    status: str | None = None,
) -> dict:
    """
    아이디어 캔버스 필드를 부분 수정합니다. 값을 준 필드만 바뀝니다(None 은 무시).
    status 는 'draft' 또는 'validated'.
    """
    body = {
        k: v
        for k, v in {
            "name": name, "one_liner": one_liner, "current_problem": current_problem,
            "target_user": target_user, "expected_benefit": expected_benefit,
            "current_alternative": current_alternative, "success_criteria": success_criteria,
            "not_doing": not_doing, "domain": domain, "status": status,
        }.items()
        if v is not None
    }
    if not body:
        raise RuntimeError("수정할 필드가 없습니다.")
    return _put(f"/wb/projects/{project_id}", body)


@mcp.tool()
def add_persona(project_id: int, name: str, role: str = "", goals: str = "", fears: str = "", comm_style: str = "") -> dict:
    """프로젝트에 페르소나 한 명을 추가합니다."""
    return _post(
        f"/wb/projects/{project_id}/personas",
        {"name": name, "role": role, "goals": goals, "fears": fears, "comm_style": comm_style},
    )


@mcp.tool()
def add_pain(project_id: int, title: str, description: str = "") -> dict:
    """프로젝트에 공통 문제(Pain) 하나를 추가합니다."""
    return _post(f"/wb/projects/{project_id}/pains", {"title": title, "description": description})


@mcp.tool()
def add_feature(project_id: int, name: str, priority: int = 3, reason: str = "") -> dict:
    """프로젝트 기능 백로그에 항목 하나를 추가합니다. priority 는 1(높음)~5(낮음)."""
    return _post(f"/wb/projects/{project_id}/features", {"name": name, "priority": priority, "reason": reason})


@mcp.tool()
def export_report(project_id: int) -> str:
    """프로젝트를 Markdown 리포트로 내보냅니다(문서화·공유용)."""
    r = _get(f"/wb/projects/{project_id}/export")
    return r.get("markdown", "")


if __name__ == "__main__":
    mcp.run()
