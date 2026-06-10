from pydantic import BaseModel
from typing import Dict, List, Optional


class AssessmentSubmit(BaseModel):
    responses: Dict[str, int]   # {"1": 4, "2": 3, ...}


class InstrumentSummary(BaseModel):
    key: str
    name: str
    subtitle: str
    scope: str
    item_count: int
    completed: bool = False


class InstrumentDetail(BaseModel):
    key: str
    name: str
    subtitle: str
    scope: str
    scale_labels: List[str]
    subscales: Dict[str, str]
    items: List[Dict]
