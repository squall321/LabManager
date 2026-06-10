"""
진단 채점 엔진 — instrument 정의 + 응답 → 점수/해석.
팀 진단은 익명 집계(ANONYMITY_MIN_N 미만이면 비공개)도 제공.
"""
from typing import Dict, List
from .trends_service import ANONYMITY_MIN_N


def _val(responses: Dict, item_id: int, default: int = 3) -> int:
    # responses 키는 JSON 직렬화로 문자열일 수 있음
    return int(responses.get(str(item_id), responses.get(item_id, default)))


def _scaled(mean_1_5: float) -> float:
    return round(max(0.0, min(100.0, (mean_1_5 - 1.0) / 4.0 * 100.0)), 1)


def _band(instrument: Dict, score: float) -> Dict:
    bands = instrument.get("bands", [])
    chosen = bands[0] if bands else {"label": "", "text": ""}
    for b in bands:
        if score >= b["min"]:
            chosen = b
    return {"label": chosen["label"], "text": chosen["text"]}


def _effective(item: Dict, raw: int) -> float:
    """역채점 반영 (1~5 척도)."""
    return (6 - raw) if item.get("reverse") else raw


def score(instrument: Dict, responses: Dict) -> Dict:
    """개인 결과: 하위척도별 0~100 점수 + 전체 + 해석 밴드."""
    subs = instrument["subscales"]
    sub_scores: Dict[str, Dict] = {}
    for sub_key, sub_name in subs.items():
        items = [it for it in instrument["items"] if it["subscale"] == sub_key]
        if not items:
            continue
        vals = [_effective(it, _val(responses, it["id"])) for it in items]
        s = _scaled(sum(vals) / len(vals))
        sub_scores[sub_key] = {"name": sub_name, "score": s, "band": _band(instrument, s)}

    overall = round(sum(v["score"] for v in sub_scores.values()) / len(sub_scores), 1) if sub_scores else 0.0
    return {
        "instrument_key": instrument["key"],
        "instrument_name": instrument["name"],
        "scope": instrument["scope"],
        "overall": overall,
        "overall_band": _band(instrument, overall),
        "subscales": sub_scores,
    }


def team_aggregate(instrument: Dict, responses_list: List[Dict]) -> Dict:
    """
    팀 진단 익명 집계. 참여자 N>=ANONYMITY_MIN_N 일 때만 공개.
    개인 식별 정보는 포함하지 않는다(문항·하위척도 평균만).
    """
    n = len(responses_list)
    if n < ANONYMITY_MIN_N:
        return {"visible": False, "n": n, "min_n": ANONYMITY_MIN_N,
                "instrument_name": instrument["name"]}

    # 문항별 평균(역채점 반영, 1~5)
    item_means: List[Dict] = []
    for it in instrument["items"]:
        vals = [_effective(it, _val(r, it["id"])) for r in responses_list]
        avg = sum(vals) / len(vals)
        item_means.append({"id": it["id"], "text": it["text"], "mean": round(avg, 2)})

    # 하위척도별 0~100
    sub_scores: Dict[str, Dict] = {}
    for sub_key, sub_name in instrument["subscales"].items():
        items = [it for it in instrument["items"] if it["subscale"] == sub_key]
        per_user = []
        for r in responses_list:
            vals = [_effective(it, _val(r, it["id"])) for it in items]
            per_user.append(sum(vals) / len(vals))
        s = _scaled(sum(per_user) / len(per_user))
        sub_scores[sub_key] = {"name": sub_name, "score": s, "band": _band(instrument, s)}

    overall = round(sum(v["score"] for v in sub_scores.values()) / len(sub_scores), 1)
    return {
        "visible": True,
        "n": n,
        "min_n": ANONYMITY_MIN_N,
        "instrument_name": instrument["name"],
        "overall": overall,
        "overall_band": _band(instrument, overall),
        "subscales": sub_scores,
        "item_means": item_means,
    }
