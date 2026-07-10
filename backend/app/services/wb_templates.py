"""
Working Backwards 템플릿 생성기 (LLM 불필요 · 원문 §10).
페르소나/아이디어/Pain을 받아 Today's Statement, PR/FAQ skeleton, 스타일 반론을 조립한다.
"""
from typing import List, Dict
from . import wb_persona


def today_statement(persona, project) -> str:
    """오늘 {페르소나}는 {업무}를 하면서 {문제} 때문에 ... 부담을 겪는다. (§10.1)"""
    role = persona.role or persona.name
    work = project.one_liner or project.name
    problem = persona.pains or project.current_problem or "반복적인 수작업과 비표준화된 절차"
    return (
        f"오늘 {role}는 {work} 관련 업무를 수행하면서 "
        f"{problem} 때문에 시간·품질·판단 측면의 부담을 겪고 있다. "
        f"그 결과 핵심 가치 업무에 집중하지 못하고, 같은 문제가 반복된다."
    )


def automation_need(project, personas) -> str:
    """자동화 필요성 문단 (§10.2)."""
    alt = project.current_alternative or "엑셀·개별 스크립트·수동 리포트"
    stakeholders = ", ".join([p.role or p.name for p in personas][:6]) or "여러 이해관계자"
    return (
        f"{project.name}은(는) 현재 {alt}에 의존하고 있으며, "
        f"{project.current_problem or '반복 조건 설정과 결과 비교의 비표준화'}로 인해 "
        f"판단 속도와 품질에 영향이 발생하고 있다.\n\n"
        f"특히 {stakeholders}이(가) 각기 다른 관점에서 같은 병목을 겪고 있어, "
        f"이는 단순한 개인 생산성 문제가 아니라 조직적 의사결정 문제로 볼 수 있다.\n\n"
        f"따라서 {project.name}은(는) 단순 자동화 도구가 아니라, "
        f"{project.expected_benefit or '업무 흐름을 표준화하고 핵심 판단을 빠르게 하는'} 업무 시스템으로 필요하다."
    )


def prfaq_skeleton(project, personas, pains) -> Dict:
    """PR/FAQ 초안 조립 (§9.5). 스타일 반론을 risks에 자동 포함."""
    problem = project.current_problem or (pains[0].description if pains else "")
    solution = project.expected_benefit or project.one_liner
    # 스타일 기반 반론(연계): 실제 동료 페르소나의 색상으로 예상 질문 생성
    risks: List[Dict] = []
    for p in personas:
        obj = wb_persona.objection_for(p.style_code, p.name)
        if obj:
            risks.append(obj)
    if not risks:
        risks = [
            {"q": "기존 스크립트·엑셀로도 충분한데 왜 시스템이 필요한가?", "a": ""},
            {"q": "자동화가 잘못된 결과를 빠르게 양산할 위험은 없는가?", "a": ""},
        ]
    faq = [
        {"q": "누가 가장 큰 문제를 겪고 있나요?",
         "a": ", ".join([p.role or p.name for p in personas][:4]) or "핵심 이해관계자"},
        {"q": "1차 MVP는 어디까지인가요?", "a": project.not_doing and f"하지 않을 것: {project.not_doing}" or ""},
        {"q": "성공을 어떻게 판단하나요?", "a": project.success_criteria or ""},
    ]
    return {
        "headline": f"{project.name}: {solution or '반복 업무를 시스템으로'}",
        "subtitle": project.one_liner or "",
        "summary": today_statement(personas[0], project) if personas else project.current_problem,
        "customer_problem": problem,
        "opportunity": automation_need(project, personas),
        "solution": solution,
        "leader_quote": "",
        "customer_experience": "",
        "testimonial": "",
        "cta": "이 과제를 1차 MVP 범위로 착수할지 검증합니다.",
        "faq": faq,
        "risks": risks,
    }
