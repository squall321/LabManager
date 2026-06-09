from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    password_set = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    surveys = relationship("Survey", back_populates="user")
    report = relationship("BirkmanReport", back_populates="user", uselist=False)
