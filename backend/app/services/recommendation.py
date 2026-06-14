"""
협업 스타일 → 미션 추천 (강한 연계).
본인의 협업 스타일 리포트 data 만 입력으로 받는 순수 함수.
- 색상 유형별 추천 톤
- 상위 관심영역 기반 스킬 태그 / 미션 아이디어
추천은 호출자(개인 API)에서 본인에게만 노출한다.
"""
from typing import Dict, List, Optional

# 색상 유형별 추천 톤
COLOR_TONE = {
    "red": "빠르게 결과가 보이는 자동화부터 시작해보세요. 작게 만들어 바로 써보는 미션이 잘 맞습니다.",
    "green": "함께 쓰면 좋은 협업·공유형 도구가 잘 맞습니다. 팀의 반복 소통을 줄이는 미션을 추천합니다.",
    "yellow": "반복되는 정리·점검 업무를 체계화하는 자동화가 잘 맞습니다. 절차를 정돈하는 미션이 좋습니다.",
    "blue": "구조를 설계하고 데이터를 분석하는 미션이 잘 맞습니다. 충분히 구상한 뒤 만드는 흐름을 추천합니다.",
}

# 관심영역별 스킬 태그 + 미션 아이디어 시드
INTEREST_PLAYBOOK = {
    "scientific": {
        "skills": ["Python", "데이터 처리", "Claude Code"],
        "ideas": [("실험/측정 데이터 자동 정리 스크립트", "데이터를 다루는 데 강점이 있어요")],
    },
    "numerical": {
        "skills": ["Python", "데이터 시각화", "pandas"],
        "ideas": [("반복 CSV/Excel 후처리 자동화", "수치 분석에 관심이 높아요"),
                  ("결과 요약 통계 자동 리포트", "데이터 패턴을 잘 찾는 편이에요")],
    },
    "clerical": {
        "skills": ["문서 자동화", "템플릿", "Claude Code"],
        "ideas": [("반복 보고서 템플릿 자동 채우기", "정리·체계화에 강점이 있어요")],
    },
    "artistic": {
        "skills": ["디자인", "프론트엔드", "시각화"],
        "ideas": [("결과를 보기 좋게 보여주는 간단한 대시보드", "시각적 표현에 관심이 있어요")],
    },
    "persuasive": {
        "skills": ["기획", "프레젠테이션", "자동화"],
        "ideas": [("회의/보고 자료 자동 생성 도구", "전달·설득 업무에 관심이 있어요")],
    },
    "social_service": {
        "skills": ["협업 도구", "공유 템플릿"],
        "ideas": [("팀이 함께 쓰는 체크리스트 도구", "사람을 돕는 일에 관심이 있어요")],
    },
    "mechanical": {
        "skills": ["스크립트", "자동화", "시스템 연동"],
        "ideas": [("반복 작업을 묶어 실행하는 자동화 스크립트", "도구·시스템 다루기에 강점이 있어요")],
    },
    "outdoor": {
        "skills": ["현장 데이터", "모바일 친화 UI"],
        "ideas": [("현장 기록을 간편하게 입력·정리하는 도구", "현장 중심 업무에 관심이 있어요")],
    },
}

COLOR_NAMES = {
    "red": ("빨강 (Red)", "추진형"),
    "green": ("초록 (Green)", "관계형"),
    "yellow": ("노랑 (Yellow)", "체계형"),
    "blue": ("파랑 (Blue)", "전략형"),
}


def recommend(report_data: Optional[Dict]) -> Dict:
    """report_data 가 없으면 has_birkman=False 로 graceful degradation"""
    if not report_data:
        return {
            "has_birkman": False,
            "color_name": None,
            "color_keyword": None,
            "tone": None,
            "skill_tags": [],
            "mission_ideas": [],
        }

    color = report_data.get("primary_color", "blue")
    color_name, keyword = COLOR_NAMES.get(color, COLOR_NAMES["blue"])
    tone = COLOR_TONE.get(color, COLOR_TONE["blue"])

    interests: Dict[str, float] = report_data.get("interests", {})
    top = sorted(interests.items(), key=lambda kv: kv[1], reverse=True)[:3]

    skills: List[str] = []
    ideas: List[Dict[str, str]] = []
    for cat, _score in top:
        play = INTEREST_PLAYBOOK.get(cat)
        if not play:
            continue
        for s in play["skills"]:
            if s not in skills:
                skills.append(s)
        for title, reason in play["ideas"]:
            ideas.append({"title": title, "reason": reason})

    return {
        "has_birkman": True,
        "color_name": color_name,
        "color_keyword": keyword,
        "tone": tone,
        "skill_tags": skills[:6],
        "mission_ideas": ideas[:4],
    }
