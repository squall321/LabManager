from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from ..core.database import Base


class TeamAgreement(Base):
    """팀 협업 합의 항목 — 팀이 함께 정하는 일하는 방식 규칙 (전체 공개)."""
    __tablename__ = "team_agreements"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, default="기타")
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TeamAgreementVote(Base):
    """합의 항목에 대한 '동의' 표시 (사용자당 1회)."""
    __tablename__ = "team_agreement_votes"
    __table_args__ = (UniqueConstraint("agreement_id", "user_id", name="uq_agreement_user"),)

    id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("team_agreements.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
