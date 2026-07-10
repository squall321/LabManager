"""개인 API 토큰 발급/검증. 원문은 해시로만 보관한다."""
import secrets
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.api_token import ApiToken
from ..models.user import User

TOKEN_PREFIX = "lmk_"   # LabManager Key


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def generate_token(db: Session, user: User, name: str = "") -> tuple[str, ApiToken]:
    """새 토큰 발급. 원문(raw)은 이번 한 번만 반환된다."""
    raw = TOKEN_PREFIX + secrets.token_urlsafe(32)
    row = ApiToken(
        user_id=user.id, name=(name or "API 토큰").strip(),
        token_hash=_hash(raw), prefix=raw[:12], active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return raw, row


def resolve_token(db: Session, raw: str) -> User | None:
    """원문 토큰 → 사용자. 유효하지 않으면 None."""
    if not raw or not raw.startswith(TOKEN_PREFIX):
        return None
    row = db.query(ApiToken).filter(ApiToken.token_hash == _hash(raw), ApiToken.active == True).first()
    if not row:
        return None
    user = db.query(User).filter(User.id == row.user_id, User.is_active == True).first()
    if not user:
        return None
    row.last_used_at = datetime.utcnow()
    db.commit()
    return user
