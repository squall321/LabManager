from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from ..core.database import Base


class Decision(Base):
    """결정 기록 — 작은 의사결정과 근거를 남겨 '왜 이렇게 했지?' 반복을 줄인다 (팀 공개)."""
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    context = Column(Text, default="")       # 어떤 상황/문제였나
    decision = Column(Text, nullable=False)   # 무엇으로 정했나
    rationale = Column(Text, default="")      # 왜 (근거)
    tags = Column(String, default="")         # 쉼표 구분
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
