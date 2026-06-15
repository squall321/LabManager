from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from ..core.database import Base


class PulseResponse(Base):
    """주간 펄스 응답 (사용자 × 주차 × 문항당 1건, 최신 upsert)."""
    __tablename__ = "pulse_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    week = Column(String, nullable=False, index=True)        # ISO "2026-W24"
    question_key = Column(String, nullable=False)
    value = Column(Integer, nullable=False)                   # 1~5
    created_at = Column(DateTime, default=datetime.utcnow)
