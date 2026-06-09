from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class SurveyResponseItem(BaseModel):
    question_id: int
    response: int  # 1-5


class SurveySubmit(BaseModel):
    section: int
    responses: List[SurveyResponseItem]


class SurveyStatusResponse(BaseModel):
    id: int
    status: str
    current_section: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    responses_count: int

    class Config:
        from_attributes = True


class ComponentScore(BaseModel):
    usual: float
    need: float
    stress: float


class BirkmanReportData(BaseModel):
    primary_color: str
    secondary_color: str
    life_style_x: float
    life_style_y: float
    components: Dict[str, ComponentScore]
    interests: Dict[str, float]
    narrative: Dict[str, str]


class ReportResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    is_public: bool
    report_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class ReportVisibilityUpdate(BaseModel):
    is_public: bool
