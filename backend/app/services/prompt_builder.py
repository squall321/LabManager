"""
Claude Code 실행 명세서 생성기.
미션 입력을 기획서 §22의 12블록 구조 프롬프트로 조립한다.
순수 문자열 포매팅 — 외부 의존성/LLM 호출 없음.
"""
from ..models.workcraft import GrowthMission


def _block(label: str, value: str, fallback: str) -> str:
    value = (value or "").strip()
    return f"{label}:\n{value if value else fallback}\n"


def build_prompt(mission: GrowthMission) -> str:
    title = (mission.title or "업무 개선 도구").strip()
    problem = (mission.problem or "").strip()
    goal = (mission.goal or title).strip()
    output = (mission.output or "").strip()
    scope = (mission.scope or "").strip()
    success = (mission.success_criteria or "").strip()
    learning = (mission.learning_goal or "").strip()

    # 성공 기준을 줄 단위로 분해해 Acceptance Criteria / Test Plan에 활용
    criteria_lines = [c.strip("-• ").strip() for c in success.splitlines() if c.strip()]
    acceptance = "\n".join(f"- {c}" for c in criteria_lines) if criteria_lines else \
        "- 빌드/실행이 오류 없이 완료된다.\n- 의도한 결과물이 실제로 동작한다.\n- 기존 기능이 깨지지 않는다."
    test_plan = (
        "1. 의존성 설치 후 빌드한다.\n"
        "2. 샘플 입력으로 핵심 흐름을 실행한다.\n"
        "3. 결과물이 성공 기준을 만족하는지 확인한다."
    )

    parts = [
        "You are working in my existing project.",
        "",
        _block("Goal", goal, title + " 를 위한 작은 결과물을 만든다."),
        _block("Context", scope, "반복적이고 번거로운 업무를 줄이기 위한 개인 업무 개선 작업입니다."),
        _block("Current Problem", problem, "현재 이 작업을 수동으로 반복하고 있어 시간이 많이 듭니다."),
        _block("Expected Output", output, "작게 동작하는 결과물(스크립트/페이지/도구) 한 가지."),
        "Requirements:\n"
        "1. 가장 작은 단위의 동작하는 MVP부터 만든다.\n"
        "2. UI/코드는 단순하고 읽기 쉽게 유지한다.\n"
        "3. 기존 코드의 관련 없는 부분은 수정하지 않는다.\n"
        "4. 잘못된 입력에 대한 기본적인 오류 처리를 포함한다.\n",
        "Constraints:\n"
        "- 인증/배포 로직은 변경하지 않는다.\n"
        "- 새 외부 의존성은 꼭 필요한 경우에만 추가한다.\n",
        _block("Acceptance Criteria", acceptance, ""),
        _block("Test Plan", test_plan, ""),
        "Do Not Modify:\n"
        "- 관련 없는 기존 페이지/모듈\n"
        "- 인증 로직\n",
        _block("Learning Goal", learning, "이 작업을 통해 새로운 도구/흐름을 익힌다.") if learning else "",
        "Please first inspect the project structure, then propose the files to modify.\n"
        "After I approve, implement the changes.",
    ]
    return "\n".join(p for p in parts if p != "")
