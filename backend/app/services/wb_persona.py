"""
협업 스타일 리포트 → 페르소나 매핑 (연계의 핵심, 순수 함수).
공개된 협업 스타일 리포트만 페르소나 후보로 노출한다(비공개 보호).
"""
from typing import Dict, List, Optional
from . import wb_data


def persona_defaults_from_style(style_code: str) -> Dict[str, str]:
    """색상 스타일 → 페르소나 기본 관심사/두려움/소통/반론."""
    s = wb_data.STYLE_PERSONA.get(style_code)
    if not s:
        return {"goals": "", "fears": "", "comm_style": "", "objection": "", "style_label": ""}
    return {
        "goals": s["goals"],
        "fears": s["fears"],
        "comm_style": s["comm_style"],
        "objection": s["objection"],
        "style_label": s["label"],
    }


def candidates_from_reports(reports: List, users_by_id: Dict[int, object]) -> List[Dict]:
    """공개 BirkmanReport 목록 → 페르소나 후보 카드."""
    out = []
    for rep in reports:
        data = rep.report_data or {}
        color = data.get("primary_color", "")
        info = (data.get("color_info", {}) or {}).get("primary", {})
        u = users_by_id.get(rep.user_id)
        out.append({
            "user_id": rep.user_id,
            "name": getattr(u, "name", info.get("name", "?")),
            "department": getattr(u, "department", None),
            "style_code": color,
            "style_name": info.get("name", ""),
            "keyword": info.get("keyword", ""),
        })
    return out


def build_persona_from_report(report, user, role: str = "") -> Dict:
    """공개 리포트 → 페르소나 생성용 dict (관심사·소통·오늘의 진술 톤 자동)."""
    data = report.report_data or {}
    color = data.get("primary_color", "")
    d = persona_defaults_from_style(color)
    narrative = data.get("narrative", {}) or {}
    # 함께 일하기 가이드가 있으면 소통 방식에 반영
    work_with_me = narrative.get("work_with_me", "")
    comm = d["comm_style"]
    if work_with_me:
        comm = f"{comm} (참고: {work_with_me})"
    return {
        "name": user.name,
        "role": role or "이해관계자",
        "source_user_id": user.id,
        "style_code": color,
        "goals": d["goals"],
        "fears": d["fears"],
        "comm_style": comm,
        "pains": "",
        "success_criteria": "",
    }


def objection_for(style_code: str, persona_name: str) -> Optional[Dict[str, str]]:
    """스타일 기반 리뷰 반론(Q). PR/FAQ 리스크 섹션 자동 초안용."""
    s = wb_data.STYLE_PERSONA.get(style_code)
    if not s:
        return None
    return {"q": f"[{persona_name}] {s['objection']}", "a": ""}
