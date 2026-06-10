"""
파트장용 익명 집계 서비스.

불변식: 개인 레코드/이름/원문을 절대 반환하지 않는다. 카테고리·집계 수치만.
- 친구도 가린다: 카테고리별 '기여한 서로 다른 사람 수'가 ANONYMITY_MIN_N 미만이면
  내용을 공개하지 않고 진행 상태(N/MIN)만 노출 → 소표본 역추적 방지.
- 개인 역추적이 불가능한 순수 총계(전체 미션 수 등)는 임계값 없이 노출.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.workcraft import WorkFriction, GrowthMission, ClaudePrompt, SharedTemplate, SupportRequest

ANONYMITY_MIN_N = 5


def friction_trends(db: Session):
    """friction_type별 '서로 다른 기여자 수'. 임계값 이상이면 공개, 미만이면 진행만."""
    rows = (
        db.query(
            WorkFriction.friction_type.label("category"),
            func.count(func.distinct(WorkFriction.user_id)).label("contributors"),
        )
        .group_by(WorkFriction.friction_type)
        .all()
    )
    items = []
    for r in rows:
        contributors = int(r.contributors)
        visible = contributors >= ANONYMITY_MIN_N
        items.append({
            "category": r.category,
            "contributors": contributors if visible else None,  # 미공개 시 정확한 수 숨김
            "progress": min(contributors, ANONYMITY_MIN_N),       # 0..MIN (예: 3/5)
            "min_n": ANONYMITY_MIN_N,
            "visible": visible,
        })
    # 공개된 것 먼저(기여자 많은 순), 그 다음 진행 항목(진행도 높은 순)
    items.sort(key=lambda x: (x["visible"], x["contributors"] or 0, x["progress"]), reverse=True)
    return items


def support_trends(db: Session):
    """지원 요청 유형별 집계 (요청 자체가 파트장 대상이라 노출 목적)."""
    rows = (
        db.query(SupportRequest.request_type.label("type"), func.count().label("count"))
        .group_by(SupportRequest.request_type)
        .order_by(func.count().desc())
        .all()
    )
    return [{"type": r.type or "기타", "count": int(r.count)} for r in rows]


def support_list(db: Session):
    """지원 요청 목록 — 익명이면 요청자 미표시, 아니면 이름만. (원문 설명은 본인이 파트장에 보낸 것)"""
    from ..models.user import User
    rows = (
        db.query(SupportRequest, User)
        .outerjoin(User, SupportRequest.user_id == User.id)
        .order_by(SupportRequest.created_at.desc())
        .all()
    )
    out = []
    for req, user in rows:
        out.append({
            "id": req.id,
            "request_type": req.request_type or "기타",
            "description": req.description or "",
            "requester": "익명" if (req.anonymous or user is None) else user.name,
            "status": req.status,
            "created_at": req.created_at,
        })
    return out


def totals(db: Session):
    """개인 역추적 불가능한 순수 총계 — 임계값 없이 노출."""
    total_missions = db.query(func.count(GrowthMission.id)).scalar() or 0
    completed = db.query(func.count(GrowthMission.id)).filter(
        GrowthMission.status.in_(["done", "shared"])
    ).scalar() or 0
    total_frictions = db.query(func.count(WorkFriction.id)).scalar() or 0
    shared_prompts = db.query(func.count(ClaudePrompt.id)).scalar() or 0
    shared_templates = db.query(func.count(SharedTemplate.id)).scalar() or 0
    participants = db.query(func.count(func.distinct(WorkFriction.user_id))).scalar() or 0
    return {
        "total_frictions": total_frictions,
        "total_missions": total_missions,
        "completed_missions": completed,
        "generated_prompts": shared_prompts,
        "shared_templates": shared_templates,
        "participants": participants,
    }


def build_dashboard(db: Session):
    return {
        "anonymity_min_n": ANONYMITY_MIN_N,
        "totals": totals(db),
        "friction_trends": friction_trends(db),
        "support_trends": support_trends(db),
    }
