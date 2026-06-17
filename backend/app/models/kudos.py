from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from ..core.database import Base


class Kudos(Base):
    """동료 인정/감사 — 가볍게 고마움을 남기는 긍정 피드 (팀 공개)."""
    __tablename__ = "kudos"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, default="고마워요")
    message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
