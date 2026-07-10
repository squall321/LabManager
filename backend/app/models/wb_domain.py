from sqlalchemy import Column, Integer, String, Boolean
from ..core.database import Base


class WBDomain(Base):
    """WB 업무 유형(도메인). 관리자가 UI에서 추가/수정/삭제.
    기본 프리셋은 서버 시작 시 코드에서 시드된다."""
    __tablename__ = "wb_domains"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
