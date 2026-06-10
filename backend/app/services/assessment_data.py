"""
진단(Assessment) 도구 레지스트리 — 재사용 가능한 설문형 진단의 단일 소스.

각 instrument는 데이터로 정의되며, 동일한 엔진(assessment_engine)이 채점한다.
새 진단을 추가하려면 여기에 instrument 하나만 더 정의하면 된다.

scope:
  - "individual" : 개인 비공개 결과 (본인만)
  - "team"       : 개인 응답은 비공개, 파트장은 익명 집계(N>=5)만 열람
"""
from typing import Dict, List

SCALE_5 = ["전혀 아니다", "아니다", "보통이다", "그렇다", "매우 그렇다"]

# 0~100 점수 해석 밴드 (공통)
DEFAULT_BANDS = [
    {"min": 0, "label": "낮음", "text": "이 영역은 아직 충분히 채워지지 않았어요. 작은 변화부터 시작해볼 수 있습니다."},
    {"min": 45, "label": "보통", "text": "무난한 수준이에요. 조금 더 의식적으로 가꾸면 더 단단해집니다."},
    {"min": 70, "label": "높음", "text": "잘 갖춰져 있어요. 지금의 강점을 유지하고 나눠보세요."},
]


INSTRUMENTS: Dict[str, Dict] = {
    # ── 팀 심리적 안전감 (Edmondson 7문항) ──
    "psych_safety": {
        "key": "psych_safety",
        "name": "팀 심리적 안전감",
        "subtitle": "이 팀에서 솔직하게 말하고 시도해도 안전하다고 느끼는 정도",
        "scope": "team",
        "scale_labels": SCALE_5,
        "subscales": {"psychological_safety": "심리적 안전감"},
        "bands": DEFAULT_BANDS,
        "items": [
            {"id": 1, "subscale": "psychological_safety", "reverse": True,
             "text": "이 팀에서 실수를 하면 그것이 두고두고 불리하게 작용한다."},
            {"id": 2, "subscale": "psychological_safety", "reverse": False,
             "text": "이 팀에서는 문제나 어려운 이슈를 편하게 꺼내 말할 수 있다."},
            {"id": 3, "subscale": "psychological_safety", "reverse": True,
             "text": "이 팀 사람들은 때때로 자신과 다르다는 이유로 남을 배척한다."},
            {"id": 4, "subscale": "psychological_safety", "reverse": False,
             "text": "이 팀에서는 위험을 감수하는 시도를 해도 안전하다."},
            {"id": 5, "subscale": "psychological_safety", "reverse": True,
             "text": "이 팀의 다른 구성원에게 도움을 요청하기 어렵다."},
            {"id": 6, "subscale": "psychological_safety", "reverse": False,
             "text": "이 팀에서 누구도 의도적으로 내 노력을 깎아내리지 않는다."},
            {"id": 7, "subscale": "psychological_safety", "reverse": False,
             "text": "이 팀과 일하면서 나의 고유한 능력과 강점이 존중받고 활용된다."},
        ],
    },

    # ── 일에서의 동기 (자기결정이론 · SDT) ──
    "sdt": {
        "key": "sdt",
        "name": "일에서의 동기 (SDT)",
        "subtitle": "자율성·유능감·관계성 — 내적 동기를 떠받치는 세 기둥",
        "scope": "individual",
        "scale_labels": SCALE_5,
        "subscales": {
            "autonomy": "자율성",
            "competence": "유능감",
            "relatedness": "관계성",
        },
        "bands": DEFAULT_BANDS,
        "items": [
            {"id": 1, "subscale": "autonomy", "reverse": False, "text": "나는 내 업무 방식을 스스로 정할 수 있다."},
            {"id": 2, "subscale": "autonomy", "reverse": False, "text": "업무에서 내 의견과 선택이 존중받는다고 느낀다."},
            {"id": 3, "subscale": "autonomy", "reverse": False, "text": "나는 일을 어떻게 할지에 대해 충분한 재량을 가진다."},
            {"id": 4, "subscale": "competence", "reverse": False, "text": "나는 내 업무를 잘 해낼 수 있다고 느낀다."},
            {"id": 5, "subscale": "competence", "reverse": False, "text": "업무에서 내 역량이 점점 늘고 있다고 느낀다."},
            {"id": 6, "subscale": "competence", "reverse": False, "text": "나는 맡은 일을 효과적으로 처리한다고 느낀다."},
            {"id": 7, "subscale": "relatedness", "reverse": False, "text": "나는 함께 일하는 동료들과 연결되어 있다고 느낀다."},
            {"id": 8, "subscale": "relatedness", "reverse": False, "text": "직장에서 나를 이해하고 지지해주는 사람이 있다."},
            {"id": 9, "subscale": "relatedness", "reverse": False, "text": "나는 팀에 소속감을 느낀다."},
        ],
    },
}


def list_instruments() -> List[Dict]:
    return [
        {"key": i["key"], "name": i["name"], "subtitle": i["subtitle"],
         "scope": i["scope"], "item_count": len(i["items"])}
        for i in INSTRUMENTS.values()
    ]


def get_instrument(key: str) -> Dict:
    return INSTRUMENTS.get(key)
