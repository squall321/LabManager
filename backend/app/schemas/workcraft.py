from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

VISIBILITY_VALUES = ["private", "leader_only", "team_public", "anonymous_template"]
MISSION_STATUS_VALUES = ["idea", "prompt_ready", "in_progress", "review", "done", "shared"]


# ── Work Friction ──
class WorkFrictionBase(BaseModel):
    title: str
    description: str = ""
    friction_type: str = "기타"
    frequency: str = ""
    expected_effect: str = ""
    related_skill: str = ""
    claude_feasible: bool = True
    visibility: str = "private"


class WorkFrictionCreate(WorkFrictionBase):
    pass


class WorkFrictionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    friction_type: Optional[str] = None
    frequency: Optional[str] = None
    expected_effect: Optional[str] = None
    related_skill: Optional[str] = None
    claude_feasible: Optional[bool] = None
    visibility: Optional[str] = None


class WorkFrictionResponse(WorkFrictionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Growth Mission ──
class GrowthMissionBase(BaseModel):
    title: str
    problem: str = ""
    goal: str = ""
    output: str = ""
    scope: str = ""
    success_criteria: str = ""
    deadline: str = ""
    learning_goal: str = ""
    start_date: str = ""
    due_date: str = ""
    work_friction_id: Optional[int] = None
    origin_friction_id: Optional[int] = None
    status: str = "idea"
    visibility: str = "private"


class GrowthMissionCreate(GrowthMissionBase):
    pass


class GrowthMissionUpdate(BaseModel):
    title: Optional[str] = None
    problem: Optional[str] = None
    goal: Optional[str] = None
    output: Optional[str] = None
    scope: Optional[str] = None
    success_criteria: Optional[str] = None
    deadline: Optional[str] = None
    learning_goal: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    visibility: Optional[str] = None


class GrowthMissionResponse(GrowthMissionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Shared Friction (타인이 공유한 불편함) ──
class SharedFrictionResponse(BaseModel):
    id: int
    owner_name: str           # team_public이면 실명, anonymous_template이면 "익명"
    department: Optional[str] = None
    title: str
    description: str
    friction_type: str
    frequency: str
    related_skill: str
    claude_feasible: bool
    visibility: str
    created_at: datetime


# ── Claude Prompt ──
class ClaudePromptResponse(BaseModel):
    id: int
    mission_id: int
    prompt_text: str
    prompt_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Recommendation (Birkman 연계) ──
class RecommendationItem(BaseModel):
    title: str
    reason: str


class RecommendationResponse(BaseModel):
    has_birkman: bool
    color_name: Optional[str] = None
    color_keyword: Optional[str] = None
    tone: Optional[str] = None
    skill_tags: List[str] = []
    mission_ideas: List[RecommendationItem] = []
