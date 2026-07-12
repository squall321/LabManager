"""
Working Backwards 템플릿 생성기 (LLM 불필요 · 원문 §10).
페르소나/아이디어/Pain을 받아 Today's Statement, PR/FAQ skeleton, 스타일 반론을 조립한다.
"""
from typing import List, Dict
from . import wb_persona


def _mode(project) -> str:
    return getattr(project, "mode", "discovery") or "discovery"


def today_statement(persona, project) -> str:
    """오늘 {페르소나}는 ... 부담/판단을 겪는다. (§10.1) — 모드에 맞춰 문장을 조립."""
    role = persona.role or persona.name
    work = project.one_liner or project.name
    if _mode(project) == "simulation":
        concern = persona.pains or project.current_problem or "해석 결과를 어디까지 믿어도 되는지"
        return (
            f"오늘 {role}는 {work}에 대한 해석 결과를 근거로 판단해야 하지만, "
            f"{concern} 때문에 결과의 신뢰 범위를 확신하기 어렵다. "
            f"그 결과 결정이 지연되거나 시험에 과도하게 의존하게 된다."
        )
    problem = persona.pains or project.current_problem or "반복적인 수작업과 비표준화된 절차"
    return (
        f"오늘 {role}는 {work} 관련 업무를 수행하면서 "
        f"{problem} 때문에 시간·품질·판단 측면의 부담을 겪고 있다. "
        f"그 결과 핵심 가치 업무에 집중하지 못하고, 같은 문제가 반복된다."
    )


def automation_need(project, personas) -> str:
    """왜 이 접근이 필요한가 문단 (§10.2) — 모드에 맞춰."""
    stakeholders = ", ".join([p.role or p.name for p in personas][:6]) or "여러 이해관계자"
    if _mode(project) == "simulation":
        alt = project.current_alternative or "시험 반복과 경험적 판단"
        return (
            f"{project.name}은(는) 현재 {alt}에 주로 의존하고 있어, "
            f"{project.current_problem or '지배 물리현상과 판단 기준이 명확히 정의되지 않아'} "
            f"결과의 신뢰 범위를 설명하기 어렵다.\n\n"
            f"특히 {stakeholders}이(가) 각기 다른 관점에서 같은 결정을 기다리고 있어, "
            f"이는 개인의 해석 역량 문제가 아니라 '무엇을 어떻게 해석해 무엇을 판단할지'의 "
            f"계획 문제로 볼 수 있다.\n\n"
            f"따라서 {project.name}은(는) 단발성 해석이 아니라, "
            f"{project.expected_benefit or '지배 물리현상·해석방법·시험 상관성을 명시해 결과를 신뢰 가능하게 만드는'} "
            f"해석 계획으로 접근할 필요가 있다."
        )
    alt = project.current_alternative or "엑셀·개별 스크립트·수동 리포트"
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
    """PR/FAQ 초안 조립 (§9.5). 스타일 반론을 risks에 자동 포함. 모드에 맞춰 문구 전환."""
    sim = _mode(project) == "simulation"
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
            {"q": "이 해석 결과를 왜 신뢰할 수 있는가? 시험과 얼마나 맞는가?", "a": ""},
            {"q": "경계조건·재료물성·단순화 가정이 결론을 바꾸지는 않는가?", "a": ""},
        ] if sim else [
            {"q": "기존 스크립트·엑셀로도 충분한데 왜 시스템이 필요한가?", "a": ""},
            {"q": "자동화가 잘못된 결과를 빠르게 양산할 위험은 없는가?", "a": ""},
        ]
    if sim:
        faq = [
            {"q": "무엇이 지배하는 물리현상인가요?", "a": project.current_problem or ""},
            {"q": "어떤 해석 방법·범위로 답하나요?",
             "a": ", ".join([f.role or f.name for f in personas][:1]) and "" or ""},
            {"q": "결과를 어떻게 검증(시험 상관)하나요?", "a": ""},
            {"q": "합/불(판단) 기준은 무엇인가요?", "a": project.success_criteria or ""},
            {"q": "무엇은 이번 범위에서 다루지 않나요?",
             "a": project.not_doing and f"제외: {project.not_doing}" or ""},
        ]
        headline = f"{project.name}: {solution or '해석으로 답할 질문과 검증 계획'}"
        cta = "이 해석 계획으로 착수할지, 시험 상관 검증을 포함해 검토합니다."
    else:
        faq = [
            {"q": "누가 가장 큰 문제를 겪고 있나요?",
             "a": ", ".join([p.role or p.name for p in personas][:4]) or "핵심 이해관계자"},
            {"q": "1차 MVP는 어디까지인가요?", "a": project.not_doing and f"하지 않을 것: {project.not_doing}" or ""},
            {"q": "성공을 어떻게 판단하나요?", "a": project.success_criteria or ""},
        ]
        headline = f"{project.name}: {solution or '반복 업무를 시스템으로'}"
        cta = "이 과제를 1차 MVP 범위로 착수할지 검증합니다."
    return {
        "headline": headline,
        "subtitle": project.one_liner or "",
        "summary": today_statement(personas[0], project) if personas else project.current_problem,
        "customer_problem": problem,
        "opportunity": automation_need(project, personas),
        "solution": solution,
        "leader_quote": "",
        "customer_experience": "",
        "testimonial": "",
        "cta": cta,
        "faq": faq,
        "risks": risks,
    }
