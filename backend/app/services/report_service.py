"""버크만 리포트 내러티브 생성 서비스 (캐노니컬 4색상 매핑)"""
from typing import Dict
from . import birkman_data as bd

# 캐노니컬 Birkman 사분면 색상
#   red(행동가)   : 업무중심 + 적극/직접
#   green(소통가) : 관계중심 + 적극/직접
#   yellow(조직가): 업무중심 + 신중/간접
#   blue(기획가)  : 관계중심 + 신중/간접
COLOR_PROFILES = {
    "red": {
        "name": "빨강 (Red)",
        "keyword": "행동가 · Doer",
        "tagline": "결단력 있게 밀어붙여 결과를 만들어내는 추진형",
        "usual_behavior": "직접적이고 행동 지향적입니다. 빠르게 결정하고 즉각적인 결과를 추구하며, 실용적인 방식으로 목표를 향해 적극적으로 움직입니다.",
        "needs": "명확한 목표와 즉각적인 성과, 그리고 스스로 행동할 수 있는 자율성이 필요합니다. 자신의 성취가 분명히 인정받기를 원합니다.",
        "stress_behavior": "욕구가 충족되지 않으면 조급해지고 공격적으로 변할 수 있습니다. 타인의 의견을 건너뛰거나 성급하게 결론을 내리기 쉽습니다.",
        "communication": "간결하게 요점부터 말하세요. 결론을 먼저 제시하고 실행 가능한 다음 단계를 분명히 하면 효과적입니다.",
        "team_role": "팀의 추진력과 실행력을 담당합니다. 프로젝트를 전진시키고 빠른 결정이 필요한 국면에서 강점을 발휘합니다.",
        "growth": "인내심을 기르고 타인의 속도를 존중하는 연습이 필요합니다. 장기적 관점과 경청의 습관을 더하면 좋습니다.",
        "color_hex": "#EF4444",
    },
    "green": {
        "name": "초록 (Green)",
        "keyword": "소통가 · Communicator",
        "tagline": "사람을 연결하고 분위기를 이끄는 관계형",
        "usual_behavior": "열정적이고 사람 중심적입니다. 타인을 설득하고 동기를 부여하는 데 능하며, 긍정적인 에너지로 협력을 이끌어냅니다.",
        "needs": "긍정적인 관계와 사회적 인정, 활발한 상호작용이 필요합니다. 협력적인 환경에서 에너지를 얻습니다.",
        "stress_behavior": "욕구가 충족되지 않으면 산만해지거나 현실을 회피할 수 있습니다. 갈등을 피하려 결정을 미루기도 합니다.",
        "communication": "친근하고 긍정적인 분위기에서 감정적 연결을 먼저 만드세요. 공감하는 방식의 대화가 잘 통합니다.",
        "team_role": "팀의 사기와 협업 분위기를 담당합니다. 사람을 모으고 긍정적인 팀 문화를 형성하는 데 기여합니다.",
        "growth": "현실적인 계획과 세부 사항에 더 집중하고, 어려운 대화도 회피하지 않는 용기를 기르면 좋습니다.",
        "color_hex": "#22C55E",
    },
    "yellow": {
        "name": "노랑 (Yellow)",
        "keyword": "조직가 · Organizer",
        "tagline": "체계와 절차로 안정적인 결과를 만드는 관리형",
        "usual_behavior": "체계적이고 신중합니다. 절차와 규칙을 중시하며, 꼼꼼하게 정리하고 일관되게 일을 처리합니다. 안정적인 실행력이 강점입니다.",
        "needs": "명확한 기대치와 정돈된 절차, 충분한 준비 시간이 필요합니다. 예측 가능하고 질서 있는 환경을 선호합니다.",
        "stress_behavior": "욕구가 충족되지 않으면 지나치게 경직되거나 사소한 것에 집착할 수 있습니다. 변화에 저항하기도 합니다.",
        "communication": "구체적이고 정돈된 정보를 단계적으로 전달하세요. 갑작스러운 변경보다 사전 공유가 효과적입니다.",
        "team_role": "팀의 안정성과 품질 관리를 담당합니다. 절차를 정비하고 일을 빠짐없이 마무리하는 데 기여합니다.",
        "growth": "유연성을 기르고 큰 그림을 함께 보는 연습이 필요합니다. 완벽보다 진척을 택하는 균형이 도움이 됩니다.",
        "color_hex": "#EAB308",
    },
    "blue": {
        "name": "파랑 (Blue)",
        "keyword": "기획가 · Planner",
        "tagline": "깊이 사고하고 아이디어로 방향을 그리는 전략형",
        "usual_behavior": "사색적이고 창의적입니다. 깊이 있게 사고하고 아이디어와 가능성을 탐구하며, 신중하게 전략과 방향을 설계합니다.",
        "needs": "충분한 사고 시간과 의미 있는 일, 독립적으로 몰입할 공간이 필요합니다. 자신의 아이디어가 존중받기를 원합니다.",
        "stress_behavior": "욕구가 충족되지 않으면 위축되거나 지나치게 비판적이 될 수 있습니다. 결정을 미루고 혼자 고립되기 쉽습니다.",
        "communication": "맥락과 의미를 충분히 설명하고 생각할 시간을 주세요. 강압적인 재촉보다 깊이 있는 논의가 잘 통합니다.",
        "team_role": "팀의 전략적 사고와 혁신을 담당합니다. 장기 방향을 그리고 새로운 관점을 제시하는 데 기여합니다.",
        "growth": "아이디어를 실행으로 옮기고, 불완전해도 먼저 공유하는 연습이 도움이 됩니다. 관계에 시간을 투자하세요.",
        "color_hex": "#3B82F6",
    },
}


def generate_narrative(report_data: Dict) -> Dict[str, str]:
    color = report_data.get("primary_color", "blue")
    profile = COLOR_PROFILES.get(color, COLOR_PROFILES["blue"])
    components = report_data.get("components", {})
    interests = report_data.get("interests", {})

    top_interests = sorted(interests.items(), key=lambda x: x[1], reverse=True)[:3]
    interest_text = ", ".join([bd.INTEREST_NAMES.get(k, k) for k, _ in top_interests])

    high_components = [
        bd.COMPONENT_NAMES.get(k, k)
        for k, v in components.items()
        if v.get("usual", 0) > 65
    ]

    summary = (
        f"{profile['name']} 유형 — {profile['keyword']}\n\n"
        f"{profile['tagline']}.\n{profile['usual_behavior']}\n\n"
        f"두드러진 강점 영역: {', '.join(high_components[:3]) if high_components else '균형 잡힌 프로필'}\n"
        f"주요 관심사: {interest_text}"
    )

    return {
        "summary": summary,
        "usual_behavior": profile["usual_behavior"],
        "needs": profile["needs"],
        "stress_behavior": profile["stress_behavior"],
        "communication": profile["communication"],
        "team_role": profile["team_role"],
        "growth": profile["growth"],
    }


def build_full_report(raw_result: Dict, user_name: str) -> Dict:
    narrative = generate_narrative(raw_result)
    color = raw_result.get("primary_color", "blue")
    profile = COLOR_PROFILES.get(color, COLOR_PROFILES["blue"])
    secondary_code = raw_result.get("secondary_color", "")
    secondary_profile = COLOR_PROFILES.get(secondary_code, {})

    interests = raw_result.get("interests", {})
    top_interests = sorted(interests.items(), key=lambda x: x[1], reverse=True)

    return {
        **raw_result,
        "user_name": user_name,
        "color_info": {
            "primary": {
                "code": color,
                "name": profile["name"],
                "keyword": profile["keyword"],
                "tagline": profile["tagline"],
                "hex": profile["color_hex"],
            },
            "secondary": {
                "code": secondary_code,
                "name": secondary_profile.get("name", ""),
                "keyword": secondary_profile.get("keyword", ""),
                "hex": secondary_profile.get("color_hex", ""),
            },
        },
        "top_interests": [
            {"category": k, "name": bd.INTEREST_NAMES.get(k, k), "score": v}
            for k, v in top_interests[:3]
        ],
        "component_names": bd.COMPONENT_NAMES,
        "narrative": narrative,
    }
