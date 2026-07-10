"""
Working Backwards 프로젝트 → Markdown 문서 + LLM 다듬기용 붙여넣기 프롬프트.
(원문 §18 브릿지: 로컬 LLM 없이도 사용자가 Claude에 붙여 품질을 올릴 수 있게)
"""
from typing import List
from . import wb_data


def _qa_block(items: List[dict]) -> str:
    if not items:
        return "_(없음)_\n"
    out = ""
    for it in items:
        q = (it.get("q") or "").strip()
        a = (it.get("a") or "").strip()
        if not q:
            continue
        out += f"- **Q. {q}**\n"
        if a:
            out += f"  - {a}\n"
    return out or "_(없음)_\n"


def to_markdown(project, personas, pains, prfaq, features, validation) -> str:
    domain_name = wb_data.domain_name(project.domain)
    md = [f"# {project.name}", ""]
    if project.one_liner:
        md.append(f"> {project.one_liner}")
    md.append(f"\n**업무 유형**: {domain_name}  ")
    for label, val in [("대상", project.target_user), ("현재 문제", project.current_problem),
                       ("기대 효과", project.expected_benefit), ("기존 대체 수단", project.current_alternative),
                       ("성공 기준", project.success_criteria), ("하지 않을 것", project.not_doing)]:
        if (val or "").strip():
            md.append(f"**{label}**: {val}  ")

    # 페르소나 + Today's Statement + DITL
    md.append("\n## 이해관계자 페르소나\n")
    for p in personas:
        tag = f" · {wb_data.STYLE_PERSONA.get(p.style_code, {}).get('label', '')}" if p.style_code else ""
        md.append(f"### {p.name} ({p.role}){tag}")
        if p.goals: md.append(f"- 관심사: {p.goals}")
        if p.fears: md.append(f"- 두려움: {p.fears}")
        if p.comm_style: md.append(f"- 소통 방식: {p.comm_style}")
        if p.today_statement: md.append(f"- **Today's Statement**: {p.today_statement}")
        if p.scenarios:
            md.append("- Day in the Life:")
            for s in sorted(p.scenarios, key=lambda x: (x.order, x.id)):
                md.append(f"  - _{s.time_block}_ — {s.activity}"
                          + (f" (문제: {s.pain_point})" if s.pain_point else ""))
        md.append("")

    # Pain Cluster
    md.append("## 공통 문제 (Pain Cluster)\n")
    for pc in pains:
        src = {"friction": "WorkCraft 불편함", "reflection": "협업 회고"}.get(pc.source, "")
        md.append(f"- **{pc.title}**{f' _({src})_' if src else ''}"
                  + (f": {pc.description}" if pc.description else ""))
    md.append("")

    # PR/FAQ
    if prfaq:
        md.append("## PR/FAQ\n")
        md.append(f"**{prfaq.headline}**  ")
        if prfaq.subtitle: md.append(f"_{prfaq.subtitle}_\n")
        for label, val in [("고객 문제", prfaq.customer_problem), ("기회", prfaq.opportunity),
                           ("솔루션", prfaq.solution), ("리더 인용문", prfaq.leader_quote),
                           ("고객 경험", prfaq.customer_experience), ("행동 유도", prfaq.cta)]:
            if val: md.append(f"**{label}**: {val}\n")
        md.append("### FAQ")
        md.append(_qa_block(prfaq.faq or []))
        md.append("### 리스크 · 반론")
        md.append(_qa_block(prfaq.risks or []))

    # Features
    if features:
        md.append("## 기능 우선순위\n")
        md.append("| 우선순위 | 기능 | 이유 |")
        md.append("|---:|---|---|")
        for f in sorted(features, key=lambda x: x.priority):
            md.append(f"| {f.priority} | {f.name} | {f.reason} |")
        md.append("")

    # Validation
    if validation and validation.scores:
        md.append("## 검증 점수\n")
        for item in wb_data.VALIDATION_ITEMS:
            sc = validation.scores.get(item["key"])
            if sc is not None:
                md.append(f"- {item['label']}: {sc}/5")
        md.append(f"\n**총점: {validation.total}/{wb_data.VALIDATION_MAX}** — {validation.verdict}")
        if validation.note:
            md.append(f"\n> {validation.note}")

    return "\n".join(m for m in md if m is not None)


def llm_polish_prompt(markdown: str) -> str:
    """이 skeleton을 Claude에 붙여 다듬게 하는 프롬프트 (§18 브릿지)."""
    return (
        "아래는 Working Backwards 방식으로 정리한 기술 과제 기획 초안입니다.\n"
        "당신의 역할은 새 내용을 지어내는 것이 아니라, 아래 초안을 바탕으로:\n"
        "1) 각 페르소나의 Today's Statement와 PR/FAQ 문장을 더 자연스럽고 설득력 있게 다듬고,\n"
        "2) '리스크·반론' 항목마다 이해관계자 관점에서 균형 잡힌 답변(A)을 제안하고,\n"
        "3) 임원 보고용 3~4문장 요약을 마지막에 추가해 주세요.\n"
        "사실을 새로 만들지 말고, 근거가 약한 부분은 '추가 확인 필요'로 표시하세요.\n\n"
        "----- 초안 -----\n" + markdown
    )
