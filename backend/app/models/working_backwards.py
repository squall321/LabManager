from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class WBProject(Base):
    """Working Backwards 프로젝트 = Idea Canvas 통합."""
    __tablename__ = "wb_projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, default="other")
    one_liner = Column(Text, default="")
    current_problem = Column(Text, default="")
    target_user = Column(Text, default="")
    expected_benefit = Column(Text, default="")
    current_alternative = Column(Text, default="")
    success_criteria = Column(Text, default="")
    not_doing = Column(Text, default="")
    status = Column(String, default="draft")          # draft | validated | archived
    visibility = Column(String, default="private")
    origin_mission_id = Column(Integer, nullable=True)  # WorkCraft 미션에서 승격된 경우
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    personas = relationship("WBPersona", back_populates="project", cascade="all, delete-orphan")
    pains = relationship("WBPainCluster", back_populates="project", cascade="all, delete-orphan")
    features = relationship("WBFeature", back_populates="project", cascade="all, delete-orphan")
    prfaq = relationship("WBPRFAQ", back_populates="project", uselist=False, cascade="all, delete-orphan")
    validation = relationship("WBValidation", back_populates="project", uselist=False, cascade="all, delete-orphan")


class WBPersona(Base):
    """이해관계자 페르소나. source_user_id가 있으면 실제 동료(공개 협업 스타일) 기반."""
    __tablename__ = "wb_personas"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("wb_projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, default="")
    source_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    style_code = Column(String, default="")            # red/green/yellow/blue (협업 스타일)
    goals = Column(Text, default="")
    pains = Column(Text, default="")
    fears = Column(Text, default="")
    comm_style = Column(Text, default="")
    success_criteria = Column(Text, default="")
    today_statement = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("WBProject", back_populates="personas")
    scenarios = relationship("WBScenario", back_populates="persona", cascade="all, delete-orphan")


class WBScenario(Base):
    """Day in the Life — 페르소나별 시간대 시나리오."""
    __tablename__ = "wb_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    persona_id = Column(Integer, ForeignKey("wb_personas.id"), nullable=False, index=True)
    time_block = Column(String, default="오전")
    activity = Column(Text, default="")
    pain_point = Column(Text, default="")
    opportunity = Column(Text, default="")
    order = Column(Integer, default=0)

    persona = relationship("WBPersona", back_populates="scenarios")


class WBPainCluster(Base):
    """Pain Point 묶음. source: manual/friction/reflection."""
    __tablename__ = "wb_pain_clusters"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("wb_projects.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    source = Column(String, default="manual")
    source_ref = Column(String, default="")

    project = relationship("WBProject", back_populates="pains")


class WBPRFAQ(Base):
    """PR/FAQ (프로젝트당 1건)."""
    __tablename__ = "wb_prfaqs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("wb_projects.id"), nullable=False, unique=True, index=True)
    headline = Column(String, default="")
    subtitle = Column(String, default="")
    summary = Column(Text, default="")
    customer_problem = Column(Text, default="")
    opportunity = Column(Text, default="")
    solution = Column(Text, default="")
    leader_quote = Column(Text, default="")
    customer_experience = Column(Text, default="")
    testimonial = Column(Text, default="")
    cta = Column(Text, default="")
    faq = Column(JSON, default=list)      # [{"q":..,"a":..}]
    risks = Column(JSON, default=list)    # [{"q":..,"a":..}]  (반론/리스크)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("WBProject", back_populates="prfaq")


class WBFeature(Base):
    """기능 백로그."""
    __tablename__ = "wb_features"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("wb_projects.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    priority = Column(Integer, default=3)
    reason = Column(Text, default="")
    related_pain_id = Column(Integer, nullable=True)

    project = relationship("WBProject", back_populates="features")


class WBValidation(Base):
    """검증 점수 (프로젝트당 1건)."""
    __tablename__ = "wb_validations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("wb_projects.id"), nullable=False, unique=True, index=True)
    scores = Column(JSON, default=dict)   # {item_key: 1~5}
    total = Column(Integer, default=0)
    verdict = Column(Text, default="")
    note = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("WBProject", back_populates="validation")
