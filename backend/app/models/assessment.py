from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from datetime import datetime
from ..core.database import Base


class Assessment(Base):
    """진단 응답/결과 (instrument별 사용자당 1건, 최신 upsert)."""
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    instrument_key = Column(String, nullable=False, index=True)
    responses = Column(JSON, nullable=False)   # {item_id: 1~5}
    result = Column(JSON, nullable=False)       # 채점 결과 (개인)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
