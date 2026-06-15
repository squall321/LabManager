from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from ..core.database import get_db
from ..models.user import User
from ..models.agreement import TeamAgreement, TeamAgreementVote
from .deps import get_current_user

router = APIRouter(prefix="/agreements", tags=["팀 협업 합의서"])

CATEGORIES = ["회의", "소통/응답", "피드백", "업무 방식", "기타"]


class AgreementCreate(BaseModel):
    category: str = "기타"
    text: str


@router.get("/meta")
def meta(current_user: User = Depends(get_current_user)):
    return {"categories": CATEGORIES}


@router.get("")
def list_agreements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(TeamAgreement).order_by(TeamAgreement.created_at.asc()).all()
    # 동의 수
    counts = dict(
        db.query(TeamAgreementVote.agreement_id, func.count(TeamAgreementVote.id))
        .group_by(TeamAgreementVote.agreement_id).all()
    )
    my_votes = {
        v.agreement_id for v in db.query(TeamAgreementVote).filter(TeamAgreementVote.user_id == current_user.id).all()
    }
    authors = {u.id: u.name for u in db.query(User).all()}
    return [
        {
            "id": a.id,
            "category": a.category,
            "text": a.text,
            "author_name": authors.get(a.created_by, "?"),
            "is_mine": a.created_by == current_user.id,
            "agree_count": int(counts.get(a.id, 0)),
            "i_agree": a.id in my_votes,
            "created_at": a.created_at,
        }
        for a in rows
    ]


@router.post("")
def create_agreement(data: AgreementCreate,
                     current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="내용을 입력해주세요")
    a = TeamAgreement(created_by=current_user.id, category=data.category, text=data.text.strip())
    db.add(a)
    db.flush()
    # 작성자는 자동 동의
    db.add(TeamAgreementVote(agreement_id=a.id, user_id=current_user.id))
    db.commit()
    return {"id": a.id}


@router.delete("/{agreement_id}")
def delete_agreement(agreement_id: int,
                     current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(TeamAgreement).filter(TeamAgreement.id == agreement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    # 작성자 또는 파트장만 삭제
    if a.created_by != current_user.id and not current_user.is_part_leader:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")
    db.query(TeamAgreementVote).filter(TeamAgreementVote.agreement_id == agreement_id).delete()
    db.delete(a)
    db.commit()
    return {"deleted": agreement_id}


@router.post("/{agreement_id}/agree")
def toggle_agree(agreement_id: int,
                 current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = db.query(TeamAgreement).filter(TeamAgreement.id == agreement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    existing = db.query(TeamAgreementVote).filter(
        TeamAgreementVote.agreement_id == agreement_id, TeamAgreementVote.user_id == current_user.id
    ).first()
    if existing:
        db.delete(existing)
        agreed = False
    else:
        db.add(TeamAgreementVote(agreement_id=agreement_id, user_id=current_user.id))
        agreed = True
    db.commit()
    return {"i_agree": agreed}
