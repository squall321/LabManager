from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
from ..core.database import get_db
from ..models.user import User
from ..models.kudos import Kudos
from .deps import get_current_user, get_current_part_leader

router = APIRouter(prefix="/kudos", tags=["고마워요"])

CATEGORIES = ["고마워요", "꼼꼼함", "빠른 응답", "좋은 아이디어", "든든함", "분위기 메이커"]


class KudosCreate(BaseModel):
    to_user_id: int
    category: str = "고마워요"
    message: str = ""


def _names(db: Session) -> dict:
    return {u.id: u.name for u in db.query(User).all()}


@router.get("/meta")
def meta(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recipients = [
        {"id": u.id, "name": u.name, "department": u.department}
        for u in db.query(User).filter(User.id != current_user.id, User.is_active == True).order_by(User.name).all()
    ]
    return {"categories": CATEGORIES, "recipients": recipients}


@router.post("")
def give(data: KudosCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.to_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="자신에게는 보낼 수 없어요")
    target = db.query(User).filter(User.id == data.to_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="대상을 찾을 수 없습니다")
    cat = data.category if data.category in CATEGORIES else "고마워요"
    db.add(Kudos(from_user_id=current_user.id, to_user_id=data.to_user_id,
                 category=cat, message=data.message.strip()))
    db.commit()
    return {"ok": True}


@router.get("/feed")
def feed(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    names = _names(db)
    rows = db.query(Kudos).order_by(Kudos.created_at.desc()).limit(40).all()
    return [
        {
            "id": k.id,
            "from_name": names.get(k.from_user_id, "?"),
            "to_name": names.get(k.to_user_id, "?"),
            "to_me": k.to_user_id == current_user.id,
            "category": k.category,
            "message": k.message,
            "created_at": k.created_at,
        }
        for k in rows
    ]


@router.get("/received")
def received(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    names = _names(db)
    rows = db.query(Kudos).filter(Kudos.to_user_id == current_user.id).order_by(Kudos.created_at.desc()).all()
    return {
        "count": len(rows),
        "items": [
            {"from_name": names.get(k.from_user_id, "?"), "category": k.category,
             "message": k.message, "created_at": k.created_at}
            for k in rows
        ],
    }


@router.get("/recent-recognized")
def recent_recognized(current_user: User = Depends(get_current_part_leader), db: Session = Depends(get_db)):
    """파트장 전용 — 최근 30일 인정받은 동료(이름만, 순위·개수 없음).
    조용히 기여하는 사람을 알아보고 1:1 등에서 언급해 격려할 수 있게."""
    since = datetime.utcnow() - timedelta(days=30)
    names = _names(db)
    rows = db.query(Kudos.to_user_id).filter(Kudos.created_at >= since).distinct().all()
    recognized = sorted({names.get(r[0], "?") for r in rows})
    return {"window_days": 30, "recognized": recognized}
