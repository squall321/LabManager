from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from pydantic import BaseModel
from ..core.database import get_db
from ..models.user import User
from ..models.reflection import CollabReflection
from ..services import pulse_data as pd  # 주차 유틸 재사용
from ..services.trends_service import ANONYMITY_MIN_N
from .deps import get_current_user, get_current_part_leader

router = APIRouter(prefix="/reflections", tags=["협업 회고"])

FRICTION_TYPES = [
    "원활했음", "정보 공유 부족", "역할/책임 불명확", "응답/일정 지연",
    "우선순위 충돌", "피드백/소통 방식", "회의 비효율", "기타",
]
RECENT_WEEKS = 4


class ReflectionSubmit(BaseModel):
    friction_type: str
    note: str = ""


@router.get("/meta")
def meta(current_user: User = Depends(get_current_user)):
    return {"friction_types": FRICTION_TYPES}


@router.get("/current")
def current(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week = pd.current_week()
    row = db.query(CollabReflection).filter(
        CollabReflection.user_id == current_user.id, CollabReflection.week == week
    ).first()
    return {
        "week": week,
        "friction_types": FRICTION_TYPES,
        "answered": row is not None,
        "my": {"friction_type": row.friction_type, "note": row.note} if row else None,
    }


@router.get("/mine")
def mine(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(CollabReflection).filter(
        CollabReflection.user_id == current_user.id
    ).order_by(CollabReflection.week.desc()).limit(12).all()
    return [{"week": r.week, "friction_type": r.friction_type, "note": r.note} for r in rows]


@router.post("/submit")
def submit(data: ReflectionSubmit,
           current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.friction_type not in FRICTION_TYPES:
        raise HTTPException(status_code=400, detail="유효하지 않은 유형입니다")
    week = pd.current_week()
    row = db.query(CollabReflection).filter(
        CollabReflection.user_id == current_user.id, CollabReflection.week == week
    ).first()
    if row:
        row.friction_type = data.friction_type
        row.note = data.note
        row.created_at = datetime.utcnow()
    else:
        db.add(CollabReflection(user_id=current_user.id, week=week,
                                friction_type=data.friction_type, note=data.note))
    db.commit()
    return {"week": week, "ok": True}


@router.get("/trends")
def trends(current_user: User = Depends(get_current_part_leader), db: Session = Depends(get_db)):
    """파트장 전용 — 최근 N주 카테고리별 '서로 다른 기여자 수' 익명 집계 (메모는 절대 미노출)."""
    weeks = pd.recent_weeks(RECENT_WEEKS)
    rows = (
        db.query(
            CollabReflection.friction_type.label("cat"),
            func.count(func.distinct(CollabReflection.user_id)).label("contributors"),
        )
        .filter(CollabReflection.week.in_(weeks))
        .group_by(CollabReflection.friction_type)
        .all()
    )
    by_cat = {r.cat: int(r.contributors) for r in rows}
    items = []
    for cat in FRICTION_TYPES:
        contributors = by_cat.get(cat, 0)
        if contributors == 0:
            continue
        visible = contributors >= ANONYMITY_MIN_N
        items.append({
            "category": cat,
            "contributors": contributors if visible else None,
            "progress": min(contributors, ANONYMITY_MIN_N),
            "visible": visible,
        })
    items.sort(key=lambda x: (x["visible"], x["contributors"] or 0, x["progress"]), reverse=True)
    participants = db.query(func.count(func.distinct(CollabReflection.user_id))).filter(
        CollabReflection.week.in_(weeks)
    ).scalar() or 0
    return {"min_n": ANONYMITY_MIN_N, "weeks": RECENT_WEEKS, "participants": participants, "items": items}
