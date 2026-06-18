from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..core.database import get_db
from ..models.user import User
from ..models.decision import Decision
from .deps import get_current_user

router = APIRouter(prefix="/decisions", tags=["결정 기록"])


class DecisionCreate(BaseModel):
    title: str
    context: str = ""
    decision: str
    rationale: str = ""
    tags: str = ""


class DecisionUpdate(BaseModel):
    title: Optional[str] = None
    context: Optional[str] = None
    decision: Optional[str] = None
    rationale: Optional[str] = None
    tags: Optional[str] = None


def _serialize(d: Decision, names: dict) -> dict:
    return {
        "id": d.id,
        "title": d.title,
        "context": d.context or "",
        "decision": d.decision,
        "rationale": d.rationale or "",
        "tags": [t.strip() for t in (d.tags or "").split(",") if t.strip()],
        "author_name": names.get(d.created_by, "?"),
        "created_by": d.created_by,
        "created_at": d.created_at,
    }


@router.get("")
def list_decisions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    names = {u.id: u.name for u in db.query(User).all()}
    rows = db.query(Decision).order_by(Decision.created_at.desc()).all()
    return [_serialize(d, names) for d in rows]


@router.post("")
def create_decision(data: DecisionCreate,
                    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not data.title.strip() or not data.decision.strip():
        raise HTTPException(status_code=400, detail="제목과 결정 내용을 입력해주세요")
    d = Decision(
        created_by=current_user.id, title=data.title.strip(), context=data.context.strip(),
        decision=data.decision.strip(), rationale=data.rationale.strip(), tags=data.tags.strip(),
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id}


def _get_editable(decision_id: int, user: User, db: Session) -> Decision:
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    if d.created_by != user.id and not user.is_part_leader:
        raise HTTPException(status_code=403, detail="수정/삭제 권한이 없습니다")
    return d


@router.put("/{decision_id}")
def update_decision(decision_id: int, data: DecisionUpdate,
                    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = _get_editable(decision_id, current_user, db)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v.strip() if isinstance(v, str) else v)
    db.commit()
    return {"id": d.id}


@router.delete("/{decision_id}")
def delete_decision(decision_id: int,
                    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = _get_editable(decision_id, current_user, db)
    db.delete(d)
    db.commit()
    return {"deleted": decision_id}
