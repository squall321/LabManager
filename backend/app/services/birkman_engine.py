"""
Birkman 점수 계산 엔진 (개선판)

설계:
- 채점 가중치는 birkman_data.py 단일 소스에서 가져옵니다.
- C++ 모듈(birkman_calc)이 빌드돼 있으면 가중치를 인자로 넘겨 사용하고,
  없으면 동일 로직의 Python 구현으로 자동 fallback합니다 → 결과가 항상 일치.

알고리즘 개선점:
1. 컴포넌트별 '가중 평균 응답(1~5)'을 0~99로 선형 매핑 → 점수 분포가 자연스러움
2. Usual(평소 행동)과 Need(내면의 욕구)를 별도로 산출
3. 라이프스타일 그리드에 Usual·Need 두 좌표를 모두 산출 (Birkman Map 방식)
4. Stress(스트레스 행동)를 Usual–Need 격차 기반으로 모델링
5. 색상은 Usual 그리드 사분면(캐노니컬 Birkman 매핑)으로 결정
"""
import importlib
from typing import List, Dict
from . import birkman_data as bd

try:
    birkman_cpp = importlib.import_module("birkman_calc")
    USE_CPP = True
except ImportError:
    USE_CPP = False


def _scale_to_99(weighted_avg_response: float) -> float:
    """가중 평균 응답(1~5)을 0~99로 선형 변환. 1→0, 3→49.5, 5→99"""
    v = (weighted_avg_response - 1.0) / 4.0 * 99.0
    return round(max(0.0, min(99.0, v)), 1)


def _component_scores(responses: Dict[int, int]) -> Dict[str, Dict[str, float]]:
    """컴포넌트별 usual / need / stress 산출"""
    # 가중 합과 가중치 합 (가중 평균 계산용)
    usual_num = {c: 0.0 for c in bd.COMPONENTS}
    usual_den = {c: 0.0 for c in bd.COMPONENTS}
    need_num = {c: 0.0 for c in bd.COMPONENTS}
    need_den = {c: 0.0 for c in bd.COMPONENTS}

    for qid, weights in bd.SELF_WEIGHTS.items():
        r = responses.get(qid, 3)
        for comp, w in weights.items():
            if w > 0:
                usual_num[comp] += r * w
                usual_den[comp] += w

    for qid, weights in bd.OTHERS_WEIGHTS.items():
        r = responses.get(qid, 3)
        for comp, w in weights.items():
            if w > 0:
                need_num[comp] += r * w
                need_den[comp] += w
            elif w < 0:  # 역채점
                aw = -w
                need_num[comp] += (6 - r) * aw
                need_den[comp] += aw

    components: Dict[str, Dict[str, float]] = {}
    for c in bd.COMPONENTS:
        u_avg = usual_num[c] / usual_den[c] if usual_den[c] else 3.0
        n_avg = need_num[c] / need_den[c] if need_den[c] else 3.0
        usual = _scale_to_99(u_avg)
        need = _scale_to_99(n_avg)
        # 스트레스: 욕구(need)가 평소행동(usual)보다 크게 충족되지 않을수록 강해짐
        gap = need - usual
        stress = round(max(0.0, min(99.0, need + 0.4 * gap)), 1)
        components[c] = {"usual": usual, "need": need, "stress": stress}
    return components


def _grid_point(comp: Dict[str, Dict[str, float]], key: str) -> Dict[str, float]:
    """
    라이프스타일 그리드 좌표 (-50~+50).
    X축: 업무중심(-) ↔ 관계중심(+)
    Y축: 신중·간접(-) ↔ 적극·직접(+)
    """
    def v(c):
        return comp[c][key]

    people = (v("acceptance") + v("empathy")) / 2.0
    task = (v("structure") + v("advantage")) / 2.0
    direct = (v("authority") + v("activity")) / 2.0
    indirect = (v("structure") + v("freedom")) / 2.0

    x = (people - task) / 99.0 * 50.0
    y = (direct - indirect) / 99.0 * 50.0
    return {"x": round(x, 2), "y": round(y, 2)}


def _color_from_point(x: float, y: float) -> str:
    """캐노니컬 Birkman 사분면 매핑"""
    if y >= 0:  # 적극/직접
        return "red" if x < 0 else "green"     # Task+Direct=Red, People+Direct=Green
    else:       # 신중/간접
        return "yellow" if x < 0 else "blue"   # Task+Indirect=Yellow, People+Indirect=Blue


def _secondary_color(x: float, y: float, primary: str) -> str:
    """축 중 약한 쪽을 뒤집어 보조 색상 결정"""
    if abs(x) >= abs(y):
        flipped_y = -y if y != 0 else -1
        return _color_from_point(x, flipped_y)
    else:
        flipped_x = -x if x != 0 else -1
        return _color_from_point(flipped_x, y)


def _interest_scores(responses: Dict[int, int]) -> Dict[str, float]:
    totals = {c: 0.0 for c in bd.INTEREST_CATEGORIES}
    counts = {c: 0 for c in bd.INTEREST_CATEGORIES}
    for qid, cat in bd.INTEREST_MAP.items():
        totals[cat] += responses.get(qid, 3)
        counts[cat] += 1
    return {
        cat: _scale_to_99(totals[cat] / counts[cat]) if counts[cat] else 0.0
        for cat in bd.INTEREST_CATEGORIES
    }


def _assemble(components, interests) -> Dict:
    usual_pt = _grid_point(components, "usual")
    need_pt = _grid_point(components, "need")
    primary = _color_from_point(usual_pt["x"], usual_pt["y"])
    secondary = _secondary_color(usual_pt["x"], usual_pt["y"], primary)

    # 유형 강도: 원점에서의 거리 (0~1)
    intensity = round(min(1.0, (usual_pt["x"] ** 2 + usual_pt["y"] ** 2) ** 0.5 / 50.0), 2)

    return {
        "primary_color": primary,
        "secondary_color": secondary,
        "life_style_x": usual_pt["x"],
        "life_style_y": usual_pt["y"],
        "life_style_need_x": need_pt["x"],
        "life_style_need_y": need_pt["y"],
        "intensity": intensity,
        "components": components,
        "interests": interests,
    }


def _calculate_python(responses: Dict[int, int]) -> Dict:
    components = _component_scores(responses)
    interests = _interest_scores(responses)
    return _assemble(components, interests)


def _calculate_cpp(responses: Dict[int, int]) -> Dict:
    """C++ 모듈에 가중치를 인자로 전달 (단일 소스 유지)."""
    self_ids = sorted(bd.SELF_WEIGHTS.keys())
    others_ids = sorted(bd.OTHERS_WEIGHTS.keys())
    interest_ids = sorted(bd.INTEREST_MAP.keys())

    self_resp = [responses.get(i, 3) for i in self_ids]
    others_resp = [responses.get(i, 3) for i in others_ids]
    interest_resp = [responses.get(i, 3) for i in interest_ids]

    # 가중치를 {컴포넌트: float} dict 리스트로 변환
    self_w = [{k: float(v) for k, v in bd.SELF_WEIGHTS[i].items()} for i in self_ids]
    others_w = [{k: float(v) for k, v in bd.OTHERS_WEIGHTS[i].items()} for i in others_ids]
    interest_cat = [bd.INTEREST_MAP[i] for i in interest_ids]

    raw = birkman_cpp.calculate(
        self_resp, others_resp, interest_resp,
        self_w, others_w, interest_cat,
        bd.COMPONENTS, bd.INTEREST_CATEGORIES,
    )
    # C++은 components/interests/그리드 좌표를 동일 규약으로 반환
    return raw


def calculate_birkman(responses: Dict[int, int]) -> Dict:
    """
    responses: {question_id: 1~5} 전체 응답 dict
    반환: 점수/좌표/색상 raw 결과 (report_service가 내러티브를 덧붙임)
    """
    if USE_CPP:
        try:
            return _calculate_cpp(responses)
        except Exception:
            pass
    return _calculate_python(responses)
