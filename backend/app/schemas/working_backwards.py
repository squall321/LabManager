from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


# ── Project ──
class WBProjectBase(BaseModel):
    name: str
    domain: str = "other"
    one_liner: str = ""
    current_problem: str = ""
    target_user: str = ""
    expected_benefit: str = ""
    current_alternative: str = ""
    success_criteria: str = ""
    not_doing: str = ""
    status: str = "draft"
    visibility: str = "private"


class WBProjectCreate(WBProjectBase):
    pass


class WBProjectUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    one_liner: Optional[str] = None
    current_problem: Optional[str] = None
    target_user: Optional[str] = None
    expected_benefit: Optional[str] = None
    current_alternative: Optional[str] = None
    success_criteria: Optional[str] = None
    not_doing: Optional[str] = None
    status: Optional[str] = None
    visibility: Optional[str] = None


class WBProjectResponse(WBProjectBase):
    id: int
    user_id: int
    origin_mission_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Persona ──
class WBPersonaCreate(BaseModel):
    name: str
    role: str = ""
    source_user_id: Optional[int] = None
    style_code: str = ""
    goals: str = ""
    pains: str = ""
    fears: str = ""
    comm_style: str = ""
    success_criteria: str = ""
    today_statement: str = ""


class WBPersonaUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    goals: Optional[str] = None
    pains: Optional[str] = None
    fears: Optional[str] = None
    comm_style: Optional[str] = None
    success_criteria: Optional[str] = None
    today_statement: Optional[str] = None


class WBScenarioIn(BaseModel):
    time_block: str = "오전"
    activity: str = ""
    pain_point: str = ""
    opportunity: str = ""
    order: int = 0


class WBScenarioResponse(WBScenarioIn):
    id: int

    class Config:
        from_attributes = True


class WBPersonaResponse(BaseModel):
    id: int
    project_id: int
    name: str
    role: str
    source_user_id: Optional[int]
    style_code: str
    goals: str
    pains: str
    fears: str
    comm_style: str
    success_criteria: str
    today_statement: str
    scenarios: List[WBScenarioResponse] = []

    class Config:
        from_attributes = True


# ── Persona candidate (공개 협업 스타일 리포트) ──
class PersonaCandidate(BaseModel):
    user_id: int
    name: str
    department: Optional[str] = None
    style_code: str
    style_name: str
    keyword: str


# ── Pain Cluster ──
class WBPainCreate(BaseModel):
    title: str
    description: str = ""
    source: str = "manual"
    source_ref: str = ""


class WBPainResponse(WBPainCreate):
    id: int

    class Config:
        from_attributes = True


# ── PR/FAQ ──
class QA(BaseModel):
    q: str = ""
    a: str = ""


class WBPRFAQIn(BaseModel):
    headline: str = ""
    subtitle: str = ""
    summary: str = ""
    customer_problem: str = ""
    opportunity: str = ""
    solution: str = ""
    leader_quote: str = ""
    customer_experience: str = ""
    testimonial: str = ""
    cta: str = ""
    faq: List[QA] = []
    risks: List[QA] = []


class WBPRFAQResponse(WBPRFAQIn):
    id: int
    project_id: int

    class Config:
        from_attributes = True


# ── Feature ──
class WBFeatureCreate(BaseModel):
    name: str
    description: str = ""
    priority: int = 3
    reason: str = ""
    related_pain_id: Optional[int] = None


class WBFeatureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    reason: Optional[str] = None
    related_pain_id: Optional[int] = None


class WBFeatureResponse(WBFeatureCreate):
    id: int

    class Config:
        from_attributes = True


# ── Validation ──
class WBValidationIn(BaseModel):
    scores: Dict[str, int] = {}
    note: str = ""


class WBValidationResponse(BaseModel):
    id: int
    project_id: int
    scores: Dict[str, int]
    total: int
    verdict: str
    note: str

    class Config:
        from_attributes = True
