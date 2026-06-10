from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..core.database import get_db
from ..models.user import User
from ..models.assessment import Assessment
from ..schemas.assessment import AssessmentSubmit, InstrumentSummary, InstrumentDetail
from ..services import assessment_data as ad
from ..services.assessment_engine import score, team_aggregate
from .deps import get_current_user, get_current_part_leader

router = APIRouter(prefix="/assessments", tags=["진단"])


@router.get("", response_model=List[InstrumentSummary])
def list_assessments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    done = {
        a.instrument_key
        for a in db.query(Assessment).filter(Assessment.user_id == current_user.id).all()
    }
    return [
        InstrumentSummary(**meta, completed=(meta["key"] in done))
        for meta in ad.list_instruments()
    ]


@router.get("/{key}/questions", response_model=InstrumentDetail)
def get_questions(key: str, current_user: User = Depends(get_current_user)):
    inst = ad.get_instrument(key)
    if not inst:
        raise HTTPException(status_code=404, detail="존재하지 않는 진단입니다")
    return InstrumentDetail(
        key=inst["key"], name=inst["name"], subtitle=inst["subtitle"], scope=inst["scope"],
        scale_labels=inst["scale_labels"], subscales=inst["subscales"], items=inst["items"],
    )


@router.post("/{key}/submit")
def submit(key: str, data: AssessmentSubmit,
           current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inst = ad.get_instrument(key)
    if not inst:
        raise HTTPException(status_code=404, detail="존재하지 않는 진단입니다")
    result = score(inst, data.responses)

    existing = db.query(Assessment).filter(
        Assessment.user_id == current_user.id, Assessment.instrument_key == key
    ).first()
    if existing:
        existing.responses = data.responses
        existing.result = result
        existing.updated_at = datetime.utcnow()
    else:
        db.add(Assessment(user_id=current_user.id, instrument_key=key,
                          responses=data.responses, result=result))
    db.commit()
    return result


@router.get("/{key}/result")
def get_result(key: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(
        Assessment.user_id == current_user.id, Assessment.instrument_key == key
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="아직 완료한 진단이 없습니다")
    return a.result


@router.get("/{key}/team")
def team(key: str, current_user: User = Depends(get_current_part_leader), db: Session = Depends(get_db)):
    """팀 진단 익명 집계 — 파트장 전용. 개인 응답/이름 미노출."""
    inst = ad.get_instrument(key)
    if not inst:
        raise HTTPException(status_code=404, detail="존재하지 않는 진단입니다")
    if inst["scope"] != "team":
        raise HTTPException(status_code=400, detail="팀 집계를 제공하지 않는 진단입니다")
    rows = db.query(Assessment).filter(Assessment.instrument_key == key).all()
    return team_aggregate(inst, [r.responses for r in rows])
