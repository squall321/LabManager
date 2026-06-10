from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..core.database import Base


class Visibility(str, enum.Enum):
    private = "private"                       # 나만 보기 (기본)
    leader_only = "leader_only"               # 파트장에게 공유
    team_public = "team_public"               # 파트 전체에 공유
    anonymous_template = "anonymous_template"  # 익명 템플릿으로 공유


class MissionStatus(str, enum.Enum):
    idea = "idea"
    prompt_ready = "prompt_ready"
    in_progress = "in_progress"
    review = "review"
    done = "done"
    shared = "shared"


class WorkFriction(Base):
    """업무 불편함 카드 — 반복적으로 불편하거나 개선하고 싶은 업무"""
    __tablename__ = "work_frictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    friction_type = Column(String, default="기타")
    frequency = Column(String, default="")          # 예: "주 3회 이상"
    expected_effect = Column(Text, default="")
    related_skill = Column(String, default="")
    claude_feasible = Column(Boolean, default=True)
    visibility = Column(String, default=Visibility.private.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="work_frictions")
    missions = relationship("GrowthMission", back_populates="work_friction")


class GrowthMission(Base):
    """업무 개선 미션 — 불편함을 실행 가능한 작은 성장 미션으로 전환"""
    __tablename__ = "growth_missions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_friction_id = Column(Integer, ForeignKey("work_frictions.id"), nullable=True)
    title = Column(String, nullable=False)
    problem = Column(Text, default="")
    goal = Column(Text, default="")
    output = Column(Text, default="")
    scope = Column(Text, default="")
    success_criteria = Column(Text, default="")
    deadline = Column(String, default="")
    learning_goal = Column(String, default="")
    start_date = Column(String, default="")   # ISO "YYYY-MM-DD"
    due_date = Column(String, default="")      # ISO "YYYY-MM-DD"
    origin_friction_id = Column(Integer, nullable=True)  # 타인의 공유 불편함에서 출발한 경우 출처
    status = Column(String, default=MissionStatus.idea.value)
    visibility = Column(String, default=Visibility.private.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="growth_missions")
    work_friction = relationship("WorkFriction", back_populates="missions")
    prompts = relationship("ClaudePrompt", back_populates="mission", cascade="all, delete-orphan")
    reviews = relationship("MissionReview", back_populates="mission", cascade="all, delete-orphan")


class ClaudePrompt(Base):
    """Claude Code 실행 명세서"""
    __tablename__ = "claude_prompts"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("growth_missions.id"), nullable=False)
    prompt_text = Column(Text, nullable=False)
    prompt_type = Column(String, default="default")
    visibility = Column(String, default=Visibility.private.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("GrowthMission", back_populates="prompts")


class MissionReview(Base):
    """배운 점 기록 (Phase 3) — 모델은 미리 정의"""
    __tablename__ = "mission_reviews"

    id = Column(Integer, primary_key=True, index=True)
    mission_id = Column(Integer, ForeignKey("growth_missions.id"), nullable=False)
    result_summary = Column(Text, default="")
    learned_skill = Column(String, default="")
    business_impact = Column(Text, default="")
    claude_good_points = Column(Text, default="")
    claude_bad_points = Column(Text, default="")
    next_action = Column(Text, default="")
    visibility = Column(String, default=Visibility.private.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("GrowthMission", back_populates="reviews")


class SharedTemplate(Base):
    """공유 템플릿 — 좋은 미션/프롬프트를 조직 학습 자산으로"""
    __tablename__ = "shared_templates"

    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # 익명이면 표시 안 함
    source_type = Column(String, nullable=False)   # mission | prompt
    source_id = Column(Integer, nullable=True)
    title = Column(String, nullable=False)
    category = Column(String, default="")
    description = Column(Text, default="")
    body = Column(Text, default="")                 # 템플릿 본문(프롬프트 등)
    anonymized = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SupportRequest(Base):
    """지원 요청 (Phase 2) — 모델은 미리 정의"""
    __tablename__ = "support_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    request_type = Column(String, default="")
    description = Column(Text, default="")
    anonymous = Column(Boolean, default=True)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=datetime.utcnow)
