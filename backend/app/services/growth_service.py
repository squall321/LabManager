"""
개인 성장 여정 요약 (비공개 · 본인만).

철학: 랭킹/점수화가 아니라, "내가 이만큼 해냈다"는 개인적 성장감을 비춰주는 거울.
스펙 §12 경고대로 경쟁·완료율 순위는 만들지 않는다.
"""
from sqlalchemy.orm import Session
from ..models.workcraft import WorkFriction, GrowthMission, ClaudePrompt, MissionReview, SharedTemplate

COMPLETED = ["done", "shared"]


def _split_skills(text: str):
    if not text:
        return []
    parts = []
    for chunk in text.replace("/", ",").replace("·", ",").split(","):
        s = chunk.strip()
        if s:
            parts.append(s)
    return parts


def build_growth(db: Session, user_id: int) -> dict:
    frictions = db.query(WorkFriction).filter(WorkFriction.user_id == user_id).all()
    missions = db.query(GrowthMission).filter(GrowthMission.user_id == user_id).all()
    reviews = (
        db.query(MissionReview)
        .join(GrowthMission, MissionReview.mission_id == GrowthMission.id)
        .filter(GrowthMission.user_id == user_id)
        .all()
    )
    prompts = (
        db.query(ClaudePrompt)
        .join(GrowthMission, ClaudePrompt.mission_id == GrowthMission.id)
        .filter(GrowthMission.user_id == user_id)
        .all()
    )
    templates = db.query(SharedTemplate).filter(SharedTemplate.created_by == user_id).all()

    completed = [m for m in missions if m.status in COMPLETED]
    shared = [m for m in missions if m.status == "shared"]

    counts = {
        "frictions": len(frictions),
        "missions": len(missions),
        "completed": len(completed),
        "shared": len(shared) + len(templates),
        "prompts": len(prompts),
        "learnings": len(reviews),
    }

    # 내가 키운 역량 — 완료 미션의 학습 목표 + 회고의 배운 역량
    skills = []
    for m in completed:
        for s in _split_skills(m.learning_goal):
            if s not in skills:
                skills.append(s)
    for r in reviews:
        for s in _split_skills(r.learned_skill):
            if s not in skills:
                skills.append(s)

    # 마일스톤 — 격려형, 비경쟁
    def ms(key, title, desc, ok):
        return {"key": key, "title": title, "desc": desc, "achieved": ok}

    milestones = [
        ms("first_friction", "첫 걸음", "처음으로 업무 불편함을 정의했어요", counts["frictions"] >= 1),
        ms("first_mission", "미션 시작", "첫 성장 미션을 만들었어요", counts["missions"] >= 1),
        ms("first_prompt", "실행 준비", "첫 실행 명세서를 만들었어요", counts["prompts"] >= 1),
        ms("first_complete", "첫 완성", "첫 개선을 완성했어요", counts["completed"] >= 1),
        ms("three_complete", "꾸준함", "세 개의 개선을 해냈어요", counts["completed"] >= 3),
        ms("first_learning", "돌아보기", "배운 점을 처음 기록했어요", counts["learnings"] >= 1),
        ms("first_shared", "나눔", "처음으로 동료와 공유했어요", counts["shared"] >= 1),
        ms("five_skills", "성장하는 나", "다섯 가지 역량을 키웠어요", len(skills) >= 5),
    ]

    # 타임라인 — 최근 이벤트
    events = []
    for f in frictions:
        events.append({"date": f.created_at, "type": "friction", "title": f"불편함 정의 · {f.title}"})
    for m in missions:
        events.append({"date": m.created_at, "type": "mission", "title": f"미션 시작 · {m.title}"})
        if m.status in COMPLETED:
            events.append({"date": m.updated_at, "type": "completed", "title": f"미션 완성 · {m.title}"})
    for r in reviews:
        mission = next((m for m in missions if m.id == r.mission_id), None)
        events.append({"date": r.created_at, "type": "learning",
                       "title": f"배운 점 기록 · {mission.title if mission else ''}"})
    events.sort(key=lambda e: e["date"], reverse=True)
    timeline = events[:12]

    # 월별 완료 추이 (간단한 성장 그래프용)
    monthly = {}
    for m in completed:
        key = m.updated_at.strftime("%Y-%m")
        monthly[key] = monthly.get(key, 0) + 1
    monthly_completed = [{"month": k, "count": v} for k, v in sorted(monthly.items())]

    return {
        "counts": counts,
        "skills": skills,
        "milestones": milestones,
        "timeline": timeline,
        "monthly_completed": monthly_completed,
    }
