from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from ..core.database import Base


class CollabReflection(Base):
    """가벼운 주간 협업 회고 (사용자×주차 1건). 메모는 비공개, 카테고리만 익명 집계."""
    __tablename__ = "collab_reflections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    week = Column(String, nullable=False, index=True)     # ISO "2026-W24"
    friction_type = Column(String, nullable=False)
    note = Column(Text, default="")                        # 비공개 — 파트장에게 노출 안 함
    created_at = Column(DateTime, default=datetime.utcnow)
