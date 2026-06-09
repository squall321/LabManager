"""
Birkman 진단 문항 · 채점 가중치 단일 소스 (Single Source of Truth)

이 파일 하나가 설문 문항과 채점 규칙을 모두 정의합니다.
- survey.py        → 문항(SECTIONS)을 읽어 사용자에게 제공
- birkman_engine.py → 가중치(self/others/interest)를 읽어 점수 계산
- C++ 모듈          → 동일 가중치를 Python에서 인자로 전달받아 계산
문항을 추가/수정하려면 이 파일만 고치면 됩니다.
"""
from typing import Dict, List, Tuple

# 11개 성격 컴포넌트
COMPONENTS = [
    "esteem",          # 자존감 / 인정 욕구
    "acceptance",      # 사교성 / 수용
    "structure",       # 구조화 / 체계
    "authority",       # 주도 / 권위
    "advantage",       # 경쟁 / 실리
    "activity",        # 활동성
    "empathy",         # 공감
    "freedom",         # 독립성
    "change",          # 변화 수용
    "physical_energy", # 체력 / 에너지
    "emotionality",    # 감정 표현
]

COMPONENT_NAMES = {
    "esteem": "자존감",
    "acceptance": "수용성",
    "structure": "구조화",
    "authority": "주도성",
    "advantage": "경쟁의식",
    "activity": "활동성",
    "empathy": "공감능력",
    "freedom": "독립성",
    "change": "변화수용",
    "physical_energy": "활력",
    "emotionality": "감정표현",
}

# 8개 관심(흥미) 영역
INTEREST_CATEGORIES = [
    "artistic", "scientific", "social_service", "persuasive",
    "numerical", "clerical", "mechanical", "outdoor",
]

INTEREST_NAMES = {
    "artistic": "예술적 창작",
    "scientific": "과학/기술",
    "social_service": "사회봉사/교육",
    "persuasive": "비즈니스/설득",
    "numerical": "수리/분석",
    "clerical": "사무/행정",
    "mechanical": "기계/공학",
    "outdoor": "야외/자연",
}

SCALE_LABELS = ["전혀 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"]

SECTION_META = {
    1: {"title": "나의 행동과 성향", "subtitle": "평소 자신의 모습에 얼마나 가까운지 솔직하게 응답해주세요"},
    2: {"title": "사람과 환경에 대한 생각", "subtitle": "'대부분의 사람들은 ~' 관점에서 동의하는 정도를 응답해주세요"},
    3: {"title": "나의 관심 영역", "subtitle": "어떤 활동에 흥미를 느끼는지 응답해주세요"},
}

# ─────────────────────────────────────────────────────────────
# 섹션 1: 자기 평가 (Usual Behavior) — 컴포넌트 가중치
#   각 문항: (문항 텍스트, {컴포넌트: 가중치})
# ─────────────────────────────────────────────────────────────
SELF_QUESTIONS: List[Tuple[str, Dict[str, int]]] = [
    ("나는 내 능력과 성취에 대해 자부심을 느낀다.", {"esteem": 3}),
    ("나는 일을 할 때 스스로에게 높은 기준을 적용한다.", {"esteem": 3, "structure": 1}),
    ("나는 인정과 칭찬을 받을 때 큰 동기를 얻는다.", {"esteem": 2, "acceptance": 1}),
    ("나는 처음 만나는 사람들과도 쉽게 대화를 시작한다.", {"acceptance": 3}),
    ("나는 여러 사람과 어울리는 자리를 즐긴다.", {"acceptance": 3, "physical_energy": 1}),
    ("나는 새로운 모임에도 자연스럽게 섞여 든다.", {"acceptance": 2}),
    ("나는 일을 시작하기 전에 구체적인 계획을 세운다.", {"structure": 3}),
    ("나는 정해진 절차와 규칙을 따르는 것이 편안하다.", {"structure": 3}),
    ("나는 정리정돈과 질서가 잡힌 환경에서 더 집중이 잘 된다.", {"structure": 2}),
    ("나는 마감과 일정에 맞춰 체계적으로 일한다.", {"structure": 2, "activity": 1}),
    ("나는 그룹에서 자연스럽게 주도적인 역할을 맡는다.", {"authority": 3}),
    ("나는 내 의견을 분명하고 직접적으로 말한다.", {"authority": 3, "emotionality": 1}),
    ("나는 결정을 내리고 다른 사람을 이끄는 것이 편하다.", {"authority": 3}),
    ("나는 책임이 따르는 역할을 기꺼이 맡는다.", {"authority": 2, "esteem": 1}),
    ("나는 경쟁적인 상황에서 동기부여를 더 강하게 받는다.", {"advantage": 3}),
    ("나는 노력에 대한 실질적인 보상을 중요하게 생각한다.", {"advantage": 3}),
    ("나는 목표를 이기고 달성하는 데서 성취감을 느낀다.", {"advantage": 2, "authority": 1}),
    ("나는 빠른 속도로 움직이며 즉각적인 결과를 추구한다.", {"activity": 3}),
    ("나는 여러 가지 일을 동시에 진행하는 것을 즐긴다.", {"activity": 3}),
    ("나는 가만히 있기보다 늘 무언가를 하고 있을 때 편하다.", {"activity": 2, "physical_energy": 1}),
    ("나는 다른 사람의 감정 변화를 민감하게 알아차린다.", {"empathy": 3}),
    ("나는 동료가 힘들어할 때 먼저 다가가 살핀다.", {"empathy": 3, "acceptance": 1}),
    ("나는 결정을 내릴 때 사람들의 기분을 함께 고려한다.", {"empathy": 2}),
    ("나는 갈등 상황에서 중재자 역할을 자주 한다.", {"empathy": 2, "acceptance": 1}),
    ("나는 스스로 방식을 정해 독립적으로 일하는 것을 선호한다.", {"freedom": 3}),
    ("나는 틀에 얽매이지 않고 자유롭게 일할 때 능률이 오른다.", {"freedom": 3}),
    ("나는 남들과 다른 나만의 방식으로 일을 처리한다.", {"freedom": 2, "change": 1}),
    ("나는 새로운 방식으로 문제를 해결하는 것을 즐긴다.", {"change": 3}),
    ("나는 익숙한 것보다 새로운 시도를 선호한다.", {"change": 3}),
    ("나는 변화와 예상치 못한 상황을 흥미롭게 받아들인다.", {"change": 2}),
    ("나는 활동적이고 몸을 움직이는 일에서 에너지를 얻는다.", {"physical_energy": 3}),
    ("나는 장시간의 업무에도 지치지 않고 활력을 유지한다.", {"physical_energy": 3}),
    ("나는 내 감정을 솔직하게 표현하는 편이다.", {"emotionality": 3}),
    ("나는 기쁨이나 실망 같은 감정을 겉으로 잘 드러낸다.", {"emotionality": 3}),
    ("나는 분위기나 상황에 따라 감정이 쉽게 움직인다.", {"emotionality": 2}),
    ("나는 어려운 결정 앞에서도 내 직관을 신뢰한다.", {"esteem": 2, "freedom": 1}),
]

# ─────────────────────────────────────────────────────────────
# 섹션 2: 타인/환경 인식 (Needs) — 컴포넌트 가중치
#   음수 가중치 = 역채점(응답이 높을수록 해당 욕구는 낮음)
# ─────────────────────────────────────────────────────────────
OTHERS_QUESTIONS: List[Tuple[str, Dict[str, int]]] = [
    ("대부분의 사람들은 자신의 노력을 인정받을 때 더 열심히 한다.", {"esteem": 3}),
    ("대부분의 사람들은 공개적으로 칭찬받는 것을 좋아한다.", {"esteem": 2}),
    ("대부분의 사람들은 성과를 인정받지 못하면 의욕을 잃는다.", {"esteem": 2}),
    ("대부분의 사람들은 팀으로 함께 일할 때 더 안정감을 느낀다.", {"acceptance": 3}),
    ("대부분의 사람들은 동료와의 친밀한 관계를 필요로 한다.", {"acceptance": 2}),
    ("대부분의 사람들은 소속감을 느낄 때 더 헌신한다.", {"acceptance": 2}),
    ("대부분의 사람들은 명확한 지시와 가이드라인을 필요로 한다.", {"structure": 3}),
    ("대부분의 사람들은 일을 시작하기 전에 충분한 준비가 필요하다.", {"structure": 2}),
    ("대부분의 사람들은 모호한 상황에서 불안을 느낀다.", {"structure": 2}),
    ("대부분의 사람들은 예측 가능한 환경에서 더 편안해한다.", {"structure": 2}),
    ("대부분의 사람들은 스스로 결정할 권한을 갖고 싶어한다.", {"authority": 3}),
    ("대부분의 사람들은 자신의 의견이 존중받기를 원한다.", {"authority": 2}),
    ("대부분의 사람들은 리더가 되기보다 따르는 역할을 선호한다.", {"authority": -2}),
    ("대부분의 사람들은 경쟁적인 환경에서 최고의 성과를 낸다.", {"advantage": 3}),
    ("대부분의 사람들은 노력한 만큼의 보상을 기대한다.", {"advantage": 2}),
    ("대부분의 사람들은 위험을 감수하기보다 안전한 선택을 한다.", {"advantage": -2}),
    ("대부분의 사람들은 바쁘게 움직일 때 더 활기를 느낀다.", {"activity": 3}),
    ("대부분의 사람들은 정확함을 위해 천천히 일하는 것을 선호한다.", {"activity": -2}),
    ("대부분의 사람들은 어려울 때 정서적 지지를 필요로 한다.", {"empathy": 3}),
    ("대부분의 사람들은 갈등 상황을 피하려는 경향이 있다.", {"empathy": 2}),
    ("대부분의 사람들은 다른 사람의 감정에 크게 영향받지 않는다.", {"empathy": -2}),
    ("대부분의 사람들은 자신만의 방식으로 일할 자유를 원한다.", {"freedom": 3}),
    ("대부분의 사람들은 세세한 통제를 받는 것을 싫어한다.", {"freedom": 2}),
    ("대부분의 사람들은 변화와 새로운 도전을 즐긴다.", {"change": 3}),
    ("대부분의 사람들은 새로운 아이디어를 시도하는 것을 좋아한다.", {"change": 2}),
    ("대부분의 사람들은 익숙한 방식이 바뀌는 것을 부담스러워한다.", {"change": -2}),
    ("대부분의 사람들은 신체적으로 활동적인 업무를 즐긴다.", {"physical_energy": 3}),
    ("대부분의 사람들은 오래 앉아서 하는 일을 선호한다.", {"physical_energy": -2}),
    ("대부분의 사람들은 자신의 기분을 주변에 잘 표현한다.", {"emotionality": 2}),
    ("대부분의 사람들은 감정을 솔직하게 드러내기를 꺼린다.", {"emotionality": -2}),
    ("대부분의 사람들은 진심 어린 격려에서 큰 힘을 얻는다.", {"esteem": 2, "empathy": 1}),
    ("대부분의 사람들은 역할과 책임이 분명할 때 더 잘 협력한다.", {"structure": 2, "acceptance": 1}),
]

# ─────────────────────────────────────────────────────────────
# 섹션 3: 관심(흥미) 영역 — 카테고리 매핑 (8개 × 4문항)
# ─────────────────────────────────────────────────────────────
INTEREST_QUESTIONS: List[Tuple[str, str]] = [
    ("그림, 음악, 글쓰기 같은 예술적 창작 활동에 관심이 있다.", "artistic"),
    ("디자인이나 시각적 표현으로 아이디어를 나타내는 것을 좋아한다.", "artistic"),
    ("공연, 전시, 콘텐츠 제작 같은 창작 분야에 흥미가 있다.", "artistic"),
    ("새로운 스타일이나 미적 감각을 탐구하는 것을 즐긴다.", "artistic"),
    ("과학적 원리나 현상을 탐구하는 것에 관심이 있다.", "scientific"),
    ("실험하고 데이터를 통해 가설을 검증하는 것을 좋아한다.", "scientific"),
    ("소프트웨어, 프로그래밍, IT 기술에 흥미가 있다.", "scientific"),
    ("복잡한 시스템의 작동 원리를 분석하는 것을 즐긴다.", "scientific"),
    ("다른 사람을 돕고 지원하는 활동에 보람을 느낀다.", "social_service"),
    ("가르치거나 코칭하며 사람을 성장시키는 일에 관심이 있다.", "social_service"),
    ("상담이나 정서적 지원으로 사람을 돕는 것을 좋아한다.", "social_service"),
    ("공동체와 사회에 기여하는 활동에 흥미가 있다.", "social_service"),
    ("사람들을 설득하고 협상하는 일에 흥미가 있다.", "persuasive"),
    ("영업, 마케팅, 사업 기획 같은 비즈니스 활동을 좋아한다.", "persuasive"),
    ("대중 앞에서 발표하거나 강연하는 것에 관심이 있다.", "persuasive"),
    ("새로운 사업이나 프로젝트를 주도하는 것을 즐긴다.", "persuasive"),
    ("숫자, 통계, 재무 데이터를 다루는 것에 관심이 있다.", "numerical"),
    ("수치를 분석해 의사결정을 내리는 일을 좋아한다.", "numerical"),
    ("예산, 회계, 정량적 관리 업무에 흥미가 있다.", "numerical"),
    ("데이터 속 패턴과 추세를 찾아내는 것을 즐긴다.", "numerical"),
    ("문서를 정리하고 체계적으로 관리하는 일에 관심이 있다.", "clerical"),
    ("일정과 자료를 꼼꼼하게 조직하는 것을 좋아한다.", "clerical"),
    ("정확하고 반복적인 행정 업무를 안정적으로 수행한다.", "clerical"),
    ("규정과 절차에 따라 업무를 처리하는 것에 흥미가 있다.", "clerical"),
    ("기계나 장비를 다루고 수리하는 것에 관심이 있다.", "mechanical"),
    ("도구를 사용해 직접 무언가를 만드는 것을 좋아한다.", "mechanical"),
    ("공학적 설계나 제작 과정에 흥미가 있다.", "mechanical"),
    ("기술 시스템을 조립하고 작동시키는 것을 즐긴다.", "mechanical"),
    ("야외에서 활동하거나 자연을 다루는 일에 관심이 있다.", "outdoor"),
    ("농업, 임업, 환경 관련 활동에 흥미가 있다.", "outdoor"),
    ("신체를 움직이는 현장 중심의 일을 좋아한다.", "outdoor"),
    ("동식물이나 자연환경을 가꾸는 것을 즐긴다.", "outdoor"),
]


# ─────────────────────────────────────────────────────────────
# 빌더: 문항에 연속 ID를 부여하고 섹션/가중치 맵을 생성
# ─────────────────────────────────────────────────────────────
def _build():
    sections: Dict[int, List[Dict]] = {1: [], 2: [], 3: []}
    self_weights: Dict[int, Dict[str, int]] = {}
    others_weights: Dict[int, Dict[str, int]] = {}
    interest_map: Dict[int, str] = {}

    qid = 1
    for text, weights in SELF_QUESTIONS:
        sections[1].append({"id": qid, "text": text})
        self_weights[qid] = weights
        qid += 1
    for text, weights in OTHERS_QUESTIONS:
        sections[2].append({"id": qid, "text": text})
        others_weights[qid] = weights
        qid += 1
    for text, category in INTEREST_QUESTIONS:
        sections[3].append({"id": qid, "text": text})
        interest_map[qid] = category
        qid += 1

    return sections, self_weights, others_weights, interest_map


SECTIONS, SELF_WEIGHTS, OTHERS_WEIGHTS, INTEREST_MAP = _build()

TOTAL_QUESTIONS = sum(len(v) for v in SECTIONS.values())
TOTAL_SECTIONS = len(SECTIONS)


def section_question_ids(section: int) -> List[int]:
    return [q["id"] for q in SECTIONS.get(section, [])]
