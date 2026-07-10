from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from ..core.database import get_db
from ..models.user import User
from ..models.api_token import ApiToken
from ..services import token_service
from .deps import get_current_user

router = APIRouter(prefix="/tokens", tags=["API 토큰"])


class TokenCreate(BaseModel):
    name: str = ""


@router.get("")
def list_tokens(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(ApiToken).filter(ApiToken.user_id == current_user.id).order_by(ApiToken.created_at.desc()).all()
    return [
        {"id": t.id, "name": t.name, "prefix": t.prefix, "active": t.active,
         "created_at": t.created_at, "last_used_at": t.last_used_at}
        for t in rows
    ]


@router.post("")
def create_token(data: TokenCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """새 개인 토큰 발급. 원문 token은 이 응답에서만 확인할 수 있다(다시 볼 수 없음)."""
    raw, row = token_service.generate_token(db, current_user, data.name)
    return {"id": row.id, "name": row.name, "prefix": row.prefix, "token": raw}


@router.delete("/{token_id}")
def revoke_token(token_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t = db.query(ApiToken).filter(ApiToken.id == token_id, ApiToken.user_id == current_user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="토큰을 찾을 수 없습니다")
    db.delete(t)
    db.commit()
    return {"deleted": token_id}
