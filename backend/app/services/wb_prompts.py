"""
Working Backwards — 단계별 LLM 프롬프트 생성기 (Claude/ChatGPT/Gemini 공용).

핵심: LLM이 자유 문장이 아니라 '정해진 JSON'으로만 답하게 지시한다.
사용자가 그 JSON을 붙여넣으면 wb_apply가 파싱해 저장한다.
→ API 없이도 완전한 왕복. 나중에 API를 붙일 때도 같은 JSON 계약을 재사용.
"""
from typing import List
from . import wb_data

_COMMON_RULES = (
    "규칙:\n"
    "- 반드시 아래 스키마의 JSON '하나만' 출력하세요. 코드블록/설명/서론 없이 순수 JSON만.\n"
    "- 사실을 지어내지 말고, 주어진 맥락에서 합리적으로 추론하세요. 모르면 빈 문자열(\"\")로 두세요.\n"
    "- 한국어로 작성하세요.\n"
)


def _project_context(project, personas=None, pains=None) -> str:
    domain = wb_data.domain_name(project.domain)
    # 값이 있는 필드만 넣어 프롬프트 품질을 높인다 (빈 라인 제거)
    fields = [
        ("이름", project.name), ("업무 유형", domain), ("한 줄 설명", project.one_liner),
        ("현재 문제", project.current_problem), ("대상 사용자", project.target_user),
        ("기대 효과", project.expected_benefit), ("기존 대체 수단", project.current_alternative),
        ("성공 기준", project.success_criteria), ("하지 않을 것", project.not_doing),
    ]
    ctx = ["## 맥락 (아이디어)"] + [f"- {k}: {v}" for k, v in fields if (v or "").strip()]
    if personas:
        ctx.append("\n## 이해관계자(페르소나)")
        for p in personas:
            style = wb_data.STYLE_PERSONA.get(p.style_code, {}).get("label", "")
            ctx.append(f"- {p.name} ({p.role}{', ' + style if style else ''}) — 관심사: {p.goals or '?'}")
    if pains:
        ctx.append("\n## 공통 문제(Pain)")
        for pc in pains:
            ctx.append(f"- {pc.title}: {pc.description}")
    return "\n".join(ctx)


# ─────────── 각 단계 프롬프트 ───────────
def personas_prompt(project) -> str:
    return (
        "당신은 제품 기획 퍼실리테이터입니다. 아래 기술 아이디어에 대해 서로 다른 관점의 "
        "이해관계자 페르소나 5명을 만들어 주세요.\n\n"
        + _project_context(project) + "\n\n"
        + _COMMON_RULES +
        '스키마:\n'
        '{ "personas": [ { "name": "역할 기반 이름", "role": "역할", '
        '"goals": "관심사/목표", "pains": "겪는 문제", "fears": "두려움", '
        '"success_criteria": "이 사람 기준의 성공" } ] }'
    )


def ditl_prompt(project, persona) -> str:
    return (
        f"'{persona.name}({persona.role})'의 하루 업무(Day in the Life)를 시간대별로 시뮬레이션하세요.\n"
        "이 아이디어가 다루려는 문제가 하루 중 어디서 발생하는지 드러나게 하세요.\n\n"
        + _project_context(project) + "\n\n"
        + _COMMON_RULES +
        f'시간대는 {wb_data.DITL_TIME_BLOCKS} 를 사용하세요.\n'
        '스키마:\n'
        '{ "scenarios": [ { "time_block": "오전", "activity": "하는 일", '
        '"pain_point": "그때의 문제/불편", "opportunity": "개선 기회" } ] }'
    )


def pains_prompt(project, personas, scenarios_text: str) -> str:
    return (
        "아래 페르소나들의 하루 시나리오에서 나타난 개별 Pain Point들을 "
        "공통 문제 그룹(Pain Cluster) 5개 내외로 묶어 정리하세요.\n\n"
        + _project_context(project, personas) + "\n\n"
        "## 시나리오 요약\n" + (scenarios_text or "(아직 시나리오가 없으면 아이디어의 현재 문제에서 추론)") + "\n\n"
        + _COMMON_RULES +
        '스키마:\n'
        '{ "pains": [ { "title": "문제 그룹 이름", "description": "설명" } ] }'
    )


def prfaq_prompt(project, personas, pains) -> str:
    style_notes = []
    for p in personas:
        s = wb_data.STYLE_PERSONA.get(p.style_code)
        if s:
            style_notes.append(f"- {p.name}({s['label']})는 이런 반론을 던질 수 있음: {s['objection']}")
    notes = "\n".join(style_notes)
    return (
        "Amazon Working Backwards 방식의 PR/FAQ를 작성하세요. 아직 만들지 않은 제품이 "
        "완성되어 출시된 것처럼 미래 시점으로 쓰되, 과장 없이 설득력 있게 작성하세요.\n"
        "특히 'risks'에는 각 이해관계자가 실제로 던질 법한 반론과 그에 대한 균형 잡힌 답변을 넣으세요.\n\n"
        + _project_context(project, personas, pains) + "\n\n"
        + ("## 이해관계자별 예상 반론(참고)\n" + notes + "\n\n" if notes else "")
        + _COMMON_RULES +
        '스키마:\n'
        '{ "headline": "", "subtitle": "", "customer_problem": "", "opportunity": "", '
        '"solution": "", "leader_quote": "", "cta": "", '
        '"faq": [ {"q":"", "a":""} ], "risks": [ {"q":"반론", "a":"대응"} ] }'
    )


def features_prompt(project, pains) -> str:
    return (
        "아래 공통 문제(Pain)에서 실행 가능한 기능을 도출하고, 우선순위(1=가장 높음)와 이유를 붙이세요.\n"
        "1차 MVP로 작게 시작할 수 있는 순서로 정렬하세요.\n\n"
        + _project_context(project, pains=pains) + "\n\n"
        + _COMMON_RULES +
        '스키마:\n'
        '{ "features": [ { "name": "기능명", "priority": 1, "reason": "왜 이 우선순위인가" } ] }'
    )


def interview_prompt(project, transcript: str = "") -> str:
    """인터뷰/대화 정리 → WB 전체를 한 번에 채우는 프롬프트.
    음성인식 등으로 얻은 대화 원문을 넣으면 AI가 전체 구조를 JSON으로 정리한다."""
    base = _project_context(project)
    src = ("아래 인터뷰/대화 내용을 근거로 정리하세요. 내용에 없는 사실은 지어내지 말고 빈 값으로 두세요.\n\n"
           "## 인터뷰/대화 원문\n" + transcript.strip() + "\n") if transcript.strip() else \
          "아래 아이디어 맥락을 바탕으로 합리적으로 구성하세요.\n"
    return (
        "당신은 Amazon Working Backwards 퍼실리테이터입니다. "
        "아이디어를 이해관계자 관점에서 검증할 수 있도록 전체 구조를 한 번에 정리하세요.\n\n"
        + base + "\n\n" + src + "\n"
        + _COMMON_RULES +
        "아래 스키마의 JSON '하나만' 출력하세요. 각 배열은 비어 있어도 됩니다.\n"
        '{\n'
        '  "idea": { "one_liner": "", "current_problem": "", "target_user": "", '
        '"expected_benefit": "", "current_alternative": "", "success_criteria": "", "not_doing": "" },\n'
        '  "personas": [ { "name": "", "role": "", "goals": "", "pains": "", "fears": "" } ],\n'
        '  "pains": [ { "title": "", "description": "" } ],\n'
        '  "features": [ { "name": "", "priority": 1, "reason": "" } ],\n'
        '  "prfaq": { "headline": "", "subtitle": "", "customer_problem": "", "opportunity": "", '
        '"solution": "", "cta": "", "faq": [ {"q":"","a":""} ], "risks": [ {"q":"","a":""} ] }\n'
        '}'
    )


# 붙여넣기 파싱이 기대하는 최상위 키
STEP_ROOT_KEY = {
    "personas": "personas",
    "ditl": "scenarios",
    "pains": "pains",
    "prfaq": None,        # prfaq는 객체 자체
    "features": "features",
}
