"""
Working Backwards Studio — 정적 데이터 단일 소스
(도메인 프리셋 · 역할 프리셋 · 협업 스타일→페르소나 규칙 · 검증 항목)

이 파일 하나가 WB 모듈의 프리셋/규칙을 정의한다. 새 도메인·역할을 늘리려면 여기만 고친다.
"""
from typing import Dict, List

# ── CAE/기술 조직 업무 유형 기본 프리셋 (원문 §14) — DB 시드용 ──
DEFAULT_DOMAINS: List[Dict] = [
    {"key": "drop_impact", "name": "Drop / Impact", "desc": "낙하·충격, 각도/위치 sweep, 파손 모드 비교"},
    {"key": "thermal", "name": "Thermal", "desc": "발열 조건, 방열 구조, 온도 분포 비교"},
    {"key": "solder_fatigue", "name": "Solder Fatigue", "desc": "AP/BGA, thermal cycle, field condition"},
    {"key": "fpcb_connector", "name": "FPCB / Connector", "desc": "strain, 반복 하중, 체결 영향"},
    {"key": "test_cae_corr", "name": "Test-CAE Correlation", "desc": "시험 결과와 해석 결과 연결"},
    {"key": "report_automation", "name": "Report Automation", "desc": "반복 리포트 자동 생성"},
    {"key": "material_db", "name": "Material DB", "desc": "물성 측정 자동 수집·검색"},
    {"key": "knowledge_search", "name": "Knowledge Search", "desc": "과거 유사 사례 검색"},
    {"key": "doe_automation", "name": "DOE Automation", "desc": "설계 변수 sweep·ranking"},
    {"key": "risk_dashboard", "name": "Reliability Risk Dashboard", "desc": "과제별 리스크 비교"},
    {"key": "other", "name": "기타", "desc": "직접 정의"},
]


def seed_domains(db) -> int:
    """DB에 도메인이 비어 있으면 코드 프리셋으로 시드."""
    from ..models.wb_domain import WBDomain
    if db.query(WBDomain).count() > 0:
        return 0
    for i, d in enumerate(DEFAULT_DOMAINS):
        db.add(WBDomain(key=d["key"], name=d["name"], description=d["desc"], active=True, order=i))
    db.commit()
    return len(DEFAULT_DOMAINS)


def domains(db=None) -> List[Dict]:
    """활성 도메인 목록. db가 있으면 DB에서, 없으면 코드 프리셋(fallback)."""
    if db is not None:
        from ..models.wb_domain import WBDomain
        rows = db.query(WBDomain).filter(WBDomain.active == True).order_by(WBDomain.order, WBDomain.id).all()
        if rows:
            return [{"key": r.key, "name": r.name, "desc": r.description} for r in rows]
    return DEFAULT_DOMAINS

# ── 기본 이해관계자 역할 프리셋 (원문 §9.2) ──
ROLE_PRESETS: List[Dict] = [
    {"role": "해석 실무자", "goals": "반복 세팅 감소, 결과 정리 자동화",
     "pains": "조건 구성·결과 비교·리포트 작성에 시간 소모", "fears": "자동화가 전문성을 약화시킬까"},
    {"role": "랩장/리드", "goals": "과제별 리스크 비교, 품질 관리",
     "pains": "조건·결과 포맷이 달라 빠른 판단이 어려움", "fears": "투자 대비 효과가 불분명"},
    {"role": "설계자", "goals": "설계 변경 영향 빠른 확인",
     "pains": "매번 해석 요청을 기다려야 함", "fears": "자동 결과를 믿어도 되는가"},
    {"role": "시험 담당", "goals": "시험-해석 correlation 강화",
     "pains": "파손 모드와 해석 근거 연결이 느림", "fears": "해석과 시험이 따로 논다"},
    {"role": "임원/의사결정자", "goals": "투자 효과·일정 단축·품질 리스크 감소",
     "pains": "자동화 효과를 한눈에 보기 어려움", "fears": "유지보수 부담과 ROI 불확실성"},
]

# ── 협업 스타일(색상) → 페르소나 관점 규칙 (연계의 핵심) ──
#   실제 동료의 공개 리포트 색상으로 관심사/톤/반론을 채운다.
STYLE_PERSONA: Dict[str, Dict] = {
    "red": {
        "label": "추진형",
        "goals": "빠른 결과와 즉각적인 성과, 명확한 ROI",
        "fears": "속도가 느려지거나 결과가 늦게 나오는 것",
        "comm_style": "결론부터 간결하게. 다음 행동과 기대 효과를 먼저 제시하세요.",
        "objection": "언제 결과가 나오나요? 지금 방식 대비 얼마나 빨라지죠?",
    },
    "green": {
        "label": "관계형",
        "goals": "팀 수용성과 협업, 실제 현업의 사용",
        "fears": "만들어도 아무도 쓰지 않는 것",
        "comm_style": "함께 만들어가는 톤으로. 현업 온보딩과 사용성을 강조하세요.",
        "objection": "현업이 실제로 쓸까요? 도입·온보딩은 어떻게 하나요?",
    },
    "yellow": {
        "label": "체계형",
        "goals": "표준·절차·품질과 안정적 유지보수",
        "fears": "검증되지 않은 자동화가 잘못된 결과를 양산하는 것",
        "comm_style": "구체적 절차와 검증 기준을 단계적으로 제시하세요.",
        "objection": "표준/검증 절차는? 유지보수는 누가 책임지나요?",
    },
    "blue": {
        "label": "전략형",
        "goals": "장기 방향과 구조적 정합성, 의미 있는 문제 해결",
        "fears": "큰 그림 없이 단발성 도구로 끝나는 것",
        "comm_style": "맥락과 '왜'를 충분히. 장기 방향과의 연결을 설명하세요.",
        "objection": "왜 이 방식인가요? 조직의 큰 그림과 어떻게 맞물리죠?",
    },
}

# ── 프로젝트 모드 ──
#   discovery  = 기회 발굴("무엇을 만들까" — 자동화/시스템 가치 판단)
#   simulation = 시뮬레이션 계획("이 문제/컨셉을 어떻게 해석할까")
MODES = ["discovery", "simulation"]
DEFAULT_MODE = "discovery"


# ── 검증 점수 8항목 (기회 발굴, 원문 §9.7) ──
VALIDATION_ITEMS: List[Dict] = [
    {"key": "repeatability", "label": "반복성", "question": "같은 유형의 일이 자주 반복되는가?", "auto": True},
    {"key": "severity", "label": "문제 심각도", "question": "해결하지 않으면 일정/품질에 영향이 큰가?", "auto": False},
    {"key": "stakeholders", "label": "이해관계자 수", "question": "여러 역할이 같은 문제를 겪는가?", "auto": True},
    {"key": "manual_dependency", "label": "수작업 의존도", "question": "개인 숙련도에 크게 의존하는가?", "auto": False},
    {"key": "standardizable", "label": "표준화 가능성", "question": "입력/출력/판단 기준을 정형화할 수 있는가?", "auto": False},
    {"key": "data_value", "label": "데이터 축적 가치", "question": "쌓이면 다음 프로젝트에 재사용 가능한가?", "auto": True},
    {"key": "roi", "label": "ROI 설명 가능성", "question": "시간/비용/품질 효과를 설명할 수 있는가?", "auto": False},
    {"key": "buildability", "label": "개발 난이도", "question": "MVP를 작게 만들 수 있는가?", "auto": False},
]

# ── 검증 점수 8항목 (시뮬레이션 계획) ──
#   "이 문제/컨셉을 어떻게 해석할지"가 타당한지 판단한다.
SIMULATION_VALIDATION_ITEMS: List[Dict] = [
    {"key": "dominant_physics", "label": "지배 물리현상 명확성", "question": "무엇이 지배하는가(구조/열/충격/피로 등)가 특정되었는가?", "auto": False},
    {"key": "method_fit", "label": "해석방법 적합성", "question": "정적/동적·명시적/암시적·재료모델 선택이 문제에 맞는가?", "auto": False},
    {"key": "boundary_confidence", "label": "경계·하중 조건 신뢰도", "question": "실제 사용/시험 조건을 반영하는가?", "auto": False},
    {"key": "test_correlation", "label": "시험 상관성 확보 가능성", "question": "결과를 시험으로 검증·보정할 수 있는가?", "auto": False},
    {"key": "simplification", "label": "모델 단순화 타당성", "question": "가정·단순화가 결론을 왜곡하지 않는가?", "auto": False},
    {"key": "compute_cost", "label": "계산비용 타당성", "question": "필요한 정밀도를 현실적 리소스로 얻는가?", "auto": False},
    {"key": "pass_criteria", "label": "판단기준 명확성", "question": "합/불 또는 비교 기준이 정의되었는가?", "auto": False},
    {"key": "reusability", "label": "재현·재사용성", "question": "세팅·결과가 다음 과제에 재사용 가능한가?", "auto": True},
]

VALIDATION_MAX = len(VALIDATION_ITEMS) * 5  # 40 (하위호환)


def validation_items_for(mode: str = DEFAULT_MODE) -> List[Dict]:
    return SIMULATION_VALIDATION_ITEMS if mode == "simulation" else VALIDATION_ITEMS


def validation_max_for(mode: str = DEFAULT_MODE) -> int:
    return len(validation_items_for(mode)) * 5


def verdict_for(total: int, mode: str = DEFAULT_MODE) -> str:
    max_ = validation_max_for(mode)
    ratio = total / max_ if max_ else 0
    if mode == "simulation":
        if ratio >= 0.75:
            return "해석 계획이 탄탄합니다. 이대로 착수하되 시험 상관성 검증을 계획에 포함하세요."
        if ratio >= 0.5:
            return "방향은 맞으나 경계조건·가정·판단기준을 더 다듬어야 합니다."
        return "아직 계획이 약합니다. 지배 물리현상과 해석방법부터 명확히 하세요."
    if ratio >= 0.75:
        return "자동화/시스템으로 만들 가치가 높습니다. 단, 1차 MVP는 작게 시작하세요."
    if ratio >= 0.5:
        return "가치가 있으나 범위를 좁혀 검증부터 하는 것이 좋습니다."
    return "아직 근거가 약합니다. 문제 정의와 이해관계자를 더 확인하세요."


DITL_TIME_BLOCKS = ["오전", "점심 전", "오후", "저녁"]


def domain_name(key: str, db=None) -> str:
    for d in domains(db):
        if d["key"] == key:
            return d["name"]
    return key


def meta(db=None) -> Dict:
    return {
        "domains": domains(db),
        "role_presets": ROLE_PRESETS,
        # 하위호환: 기본(발굴) 항목을 그대로 노출
        "validation_items": VALIDATION_ITEMS,
        "validation_max": VALIDATION_MAX,
        # 모드별 검증 항목 (프론트가 프로젝트 mode 에 맞춰 사용)
        "modes": MODES,
        "validation_by_mode": {
            "discovery": {"items": VALIDATION_ITEMS, "max": len(VALIDATION_ITEMS) * 5},
            "simulation": {"items": SIMULATION_VALIDATION_ITEMS, "max": len(SIMULATION_VALIDATION_ITEMS) * 5},
        },
        "time_blocks": DITL_TIME_BLOCKS,
        "style_persona": STYLE_PERSONA,
    }
