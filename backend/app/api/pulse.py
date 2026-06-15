from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from pydantic import BaseModel
from typing import Dict
from ..core.database import get_db
from ..models.user import User
from ..models.pulse import PulseResponse
from ..services import pulse_data as pd
from ..services.trends_service import ANONYMITY_MIN_N
from .deps import get_current_user, get_current_part_leader

router = APIRouter(prefix="/pulse", tags=["주간 펄스"])


class PulseSubmit(BaseModel):
    responses: Dict[str, int]   # {question_key: 1~5}


@router.get("/current")
def current(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week = pd.current_week()
    mine = {
        r.question_key: r.value
        for r in db.query(PulseResponse).filter(
            PulseResponse.user_id == current_user.id, PulseResponse.week == week
        ).all()
    }
    return {
        "week": week,
        "scale_labels": pd.SCALE_LABELS,
        "questions": pd.PULSE_QUESTIONS,
        "answered": len(mine) == len(pd.QUESTION_KEYS) and len(mine) > 0,
        "my_responses": mine,
    }


@router.post("/submit")
def submit(data: PulseSubmit,
           current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    week = pd.current_week()
    for key, value in data.responses.items():
        if key not in pd.QUESTION_KEYS:
            continue
        value = max(1, min(5, int(value)))
        row = db.query(PulseResponse).filter(
            PulseResponse.user_id == current_user.id,
            PulseResponse.week == week,
            PulseResponse.question_key == key,
        ).first()
        if row:
            row.value = value
            row.created_at = datetime.utcnow()
        else:
            db.add(PulseResponse(user_id=current_user.id, week=week, question_key=key, value=value))
    db.commit()
    return {"week": week, "ok": True}


@router.get("/trends")
def trends(current_user: User = Depends(get_current_part_leader), db: Session = Depends(get_db)):
    """파트장 전용 — 최근 주차별 익명 평균(참여 N>=임계값일 때만 공개)."""
    weeks = pd.recent_weeks(8)
    series = []
    for week in weeks:
        rows = db.query(
            PulseResponse.question_key,
            func.avg(PulseResponse.value).label("avg"),
            func.count(func.distinct(PulseResponse.user_id)).label("n"),
        ).filter(PulseResponse.week == week).group_by(PulseResponse.question_key).all()

        by_q = {r.question_key: r for r in rows}
        point = {"week": week}
        n_max = 0
        for q in pd.PULSE_QUESTIONS:
            r = by_q.get(q["key"])
            n = int(r.n) if r else 0
            n_max = max(n_max, n)
            point[q["key"]] = round(float(r.avg), 2) if (r and n >= ANONYMITY_MIN_N) else None
        point["n"] = n_max
        point["visible"] = n_max >= ANONYMITY_MIN_N
        series.append(point)

    return {
        "min_n": ANONYMITY_MIN_N,
        "questions": pd.PULSE_QUESTIONS,
        "series": series,
    }
