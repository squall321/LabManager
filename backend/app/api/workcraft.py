from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..core.database import get_db
from ..models.user import User
from ..models.survey import BirkmanReport
from ..models.workcraft import WorkFriction, GrowthMission, ClaudePrompt
from ..schemas.workcraft import (
    WorkFrictionCreate, WorkFrictionUpdate, WorkFrictionResponse,
    GrowthMissionCreate, GrowthMissionUpdate, GrowthMissionResponse,
    ClaudePromptResponse, RecommendationResponse,
    VISIBILITY_VALUES, MISSION_STATUS_VALUES,
)
from ..services.prompt_builder import build_prompt
from ..services.recommendation import recommend
from .deps import get_current_user

router = APIRouter(prefix="/workcraft", tags=["WorkCraft"])

FRICTION_TYPES = [
    "반복 보고서 작성", "CSV/Excel 후처리", "해석 결과 그래프 작성",
    "파일명/조건 정리", "회의록 정리", "코드 수정 반복",
    "문서 템플릿 작성", "데이터 비교", "타부서 요청 정리", "기타",
]


@router.get("/meta")
def get_meta(current_user: User = Depends(get_current_user)):
    return {
        "friction_types": FRICTION_TYPES,
        "visibility_values": VISIBILITY_VALUES,
        "mission_statuses": MISSION_STATUS_VALUES,
    }


def _validate_visibility(v: str):
    if v not in VISIBILITY_VALUES:
        raise HTTPException(status_code=400, detail="유효하지 않은 공개 범위입니다")


# ─────────────── Work Frictions (개인 전용) ───────────────
@router.get("/frictions", response_model=List[WorkFrictionResponse])
def list_frictions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(WorkFriction)
        .filter(WorkFriction.user_id == current_user.id)
        .order_by(WorkFriction.created_at.desc())
        .all()
    )


@router.post("/frictions", response_model=WorkFrictionResponse)
def create_friction(
    data: WorkFrictionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_visibility(data.visibility)
    friction = WorkFriction(user_id=current_user.id, **data.model_dump())
    db.add(friction)
    db.commit()
    db.refresh(friction)
    return friction


def _get_own_friction(friction_id: int, user: User, db: Session) -> WorkFriction:
    friction = db.query(WorkFriction).filter(
        WorkFriction.id == friction_id, WorkFriction.user_id == user.id
    ).first()
    if not friction:
        raise HTTPException(status_code=404, detail="불편함 카드를 찾을 수 없습니다")
    return friction


@router.put("/frictions/{friction_id}", response_model=WorkFrictionResponse)
def update_friction(
    friction_id: int,
    data: WorkFrictionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    friction = _get_own_friction(friction_id, current_user, db)
    updates = data.model_dump(exclude_unset=True)
    if "visibility" in updates:
        _validate_visibility(updates["visibility"])
    for k, v in updates.items():
        setattr(friction, k, v)
    db.commit()
    db.refresh(friction)
    return friction


@router.delete("/frictions/{friction_id}")
def delete_friction(
    friction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    friction = _get_own_friction(friction_id, current_user, db)
    db.delete(friction)
    db.commit()
    return {"deleted": friction_id}


# ─────────────── Growth Missions (개인 전용) ───────────────
@router.get("/missions", response_model=List[GrowthMissionResponse])
def list_missions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(GrowthMission)
        .filter(GrowthMission.user_id == current_user.id)
        .order_by(GrowthMission.created_at.desc())
        .all()
    )


@router.post("/missions", response_model=GrowthMissionResponse)
def create_mission(
    data: GrowthMissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_visibility(data.visibility)
    if data.status not in MISSION_STATUS_VALUES:
        raise HTTPException(status_code=400, detail="유효하지 않은 상태입니다")
    # work_friction_id가 있으면 본인 소유인지 확인
    if data.work_friction_id is not None:
        _get_own_friction(data.work_friction_id, current_user, db)
    mission = GrowthMission(user_id=current_user.id, **data.model_dump())
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission


def _get_own_mission(mission_id: int, user: User, db: Session) -> GrowthMission:
    mission = db.query(GrowthMission).filter(
        GrowthMission.id == mission_id, GrowthMission.user_id == user.id
    ).first()
    if not mission:
        raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")
    return mission


@router.put("/missions/{mission_id}", response_model=GrowthMissionResponse)
def update_mission(
    mission_id: int,
    data: GrowthMissionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mission = _get_own_mission(mission_id, current_user, db)
    updates = data.model_dump(exclude_unset=True)
    if "visibility" in updates:
        _validate_visibility(updates["visibility"])
    if "status" in updates and updates["status"] not in MISSION_STATUS_VALUES:
        raise HTTPException(status_code=400, detail="유효하지 않은 상태입니다")
    for k, v in updates.items():
        setattr(mission, k, v)
    db.commit()
    db.refresh(mission)
    return mission


@router.delete("/missions/{mission_id}")
def delete_mission(
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mission = _get_own_mission(mission_id, current_user, db)
    db.delete(mission)
    db.commit()
    return {"deleted": mission_id}


# ─────────────── Claude Code 실행 명세서 ───────────────
@router.post("/missions/{mission_id}/prompt/generate", response_model=ClaudePromptResponse)
def generate_mission_prompt(
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mission = _get_own_mission(mission_id, current_user, db)
    prompt_text = build_prompt(mission)

    prompt = db.query(ClaudePrompt).filter(ClaudePrompt.mission_id == mission_id).first()
    if prompt:
        prompt.prompt_text = prompt_text
        prompt.created_at = datetime.utcnow()
    else:
        prompt = ClaudePrompt(mission_id=mission_id, prompt_text=prompt_text)
        db.add(prompt)

    # 미션 상태가 아이디어면 prompt_ready 로 진전
    if mission.status == "idea":
        mission.status = "prompt_ready"

    db.commit()
    db.refresh(prompt)
    return prompt


@router.get("/missions/{mission_id}/prompt", response_model=ClaudePromptResponse)
def get_mission_prompt(
    mission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_own_mission(mission_id, current_user, db)
    prompt = db.query(ClaudePrompt).filter(ClaudePrompt.mission_id == mission_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="아직 생성된 프롬프트가 없습니다")
    return prompt


# ─────────────── Birkman 기반 추천 (본인 전용) ───────────────
@router.get("/recommendations", response_model=RecommendationResponse)
def get_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(BirkmanReport).filter(BirkmanReport.user_id == current_user.id).first()
    report_data = report.report_data if report else None
    return recommend(report_data)
