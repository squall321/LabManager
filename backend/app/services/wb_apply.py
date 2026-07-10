"""
LLM이 돌려준 JSON(붙여넣기)을 파싱해 각 단계 데이터로 반영.
관대한 파싱: 코드블록/앞뒤 잡텍스트가 섞여도 JSON 부분만 추출한다.
"""
import json
import re
from typing import Any, Dict


def parse_json_lenient(raw: str) -> Any:
    """```json ... ``` 나 앞뒤 텍스트가 있어도 첫 번째 유효 JSON 객체를 추출."""
    if raw is None:
        raise ValueError("빈 입력입니다")
    s = raw.strip()
    # 코드펜스 제거
    fence = re.search(r"```(?:json)?\s*(.+?)```", s, re.DOTALL)
    if fence:
        s = fence.group(1).strip()
    # 바로 파싱 시도
    try:
        return json.loads(s)
    except Exception:
        pass
    # 첫 '{' ~ 마지막 '}' 사이만 시도
    start, end = s.find("{"), s.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(s[start:end + 1])
        except Exception:
            pass
    raise ValueError("JSON을 해석할 수 없습니다. LLM 응답의 JSON 부분만 붙여넣어 주세요.")


def _s(v) -> str:
    return str(v).strip() if v is not None else ""


def extract_personas(data: Dict) -> list:
    items = data.get("personas", data) if isinstance(data, dict) else data
    out = []
    for it in items or []:
        if not isinstance(it, dict) or not _s(it.get("name")):
            continue
        out.append({
            "name": _s(it.get("name")), "role": _s(it.get("role")),
            "goals": _s(it.get("goals")), "pains": _s(it.get("pains")),
            "fears": _s(it.get("fears")), "success_criteria": _s(it.get("success_criteria")),
        })
    return out


def extract_scenarios(data: Dict) -> list:
    items = data.get("scenarios", data) if isinstance(data, dict) else data
    out = []
    for i, it in enumerate(items or []):
        if not isinstance(it, dict):
            continue
        out.append({
            "time_block": _s(it.get("time_block")) or "오전",
            "activity": _s(it.get("activity")),
            "pain_point": _s(it.get("pain_point")),
            "opportunity": _s(it.get("opportunity")),
            "order": i,
        })
    return out


def extract_pains(data: Dict) -> list:
    items = data.get("pains", data) if isinstance(data, dict) else data
    out = []
    for it in items or []:
        if isinstance(it, str):
            it = {"title": it}
        if not isinstance(it, dict) or not _s(it.get("title")):
            continue
        out.append({"title": _s(it.get("title")), "description": _s(it.get("description"))})
    return out


def extract_features(data: Dict) -> list:
    items = data.get("features", data) if isinstance(data, dict) else data
    out = []
    for it in items or []:
        if not isinstance(it, dict) or not _s(it.get("name")):
            continue
        try:
            pr = int(it.get("priority", 3))
        except Exception:
            pr = 3
        out.append({"name": _s(it.get("name")), "priority": max(1, min(5, pr)), "reason": _s(it.get("reason"))})
    return out


def extract_prfaq(data: Dict) -> Dict:
    d = data if isinstance(data, dict) else {}

    def qalist(key):
        out = []
        for it in d.get(key, []) or []:
            if isinstance(it, dict):
                out.append({"q": _s(it.get("q")), "a": _s(it.get("a"))})
        return out

    return {
        "headline": _s(d.get("headline")), "subtitle": _s(d.get("subtitle")),
        "summary": _s(d.get("summary")), "customer_problem": _s(d.get("customer_problem")),
        "opportunity": _s(d.get("opportunity")), "solution": _s(d.get("solution")),
        "leader_quote": _s(d.get("leader_quote")), "customer_experience": _s(d.get("customer_experience")),
        "testimonial": _s(d.get("testimonial")), "cta": _s(d.get("cta")),
        "faq": qalist("faq"), "risks": qalist("risks"),
    }
