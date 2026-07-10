from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime
from ..core.database import Base


class ApiToken(Base):
    """개인 API 토큰 — MCP 등 외부 도구가 본인 계정으로 접근하는 데 사용.
    원문 토큰은 해시(token_hash)로만 저장하고, 발급 시 한 번만 노출한다."""
    __tablename__ = "api_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, default="")            # 사용자가 붙인 이름 (예: "내 노트북 Claude")
    token_hash = Column(String, unique=True, nullable=False, index=True)
    prefix = Column(String, default="")           # 식별용 앞 8자 (lmk_xxxxxxxx)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
