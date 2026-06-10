from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.user import User
from ..models.workcraft import SharedTemplate, GrowthMission, ClaudePrompt
from ..schemas.workcraft import (
    TemplateShareRequest, TemplateResponse,
    SupportRequestCreate, SupportRequestResponse,
)
from ..models.workcraft import SupportRequest
from .deps import get_current_user

router = APIRouter(prefix="/workcraft", tags=["WorkCraft 공유"])


# ─────────────── 공유 템플릿 라이브러리 (전체 구성원) ───────────────
@router.get("/templates", response_model=List[TemplateResponse])
def list_templates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(SharedTemplate, User)
        .outerjoin(User, SharedTemplate.created_by == User.id)
        .order_by(SharedTemplate.created_at.desc())
        .all()
    )
    out = []
    for tpl, owner in rows:
        anon = tpl.anonymized or owner is None
        out.append(TemplateResponse(
            id=tpl.id, title=tpl.title, category=tpl.category or "",
            description=tpl.description or "", body=tpl.body or "",
            source_type=tpl.source_type,
            owner_name="익명" if anon else owner.name,
            created_at=tpl.created_at,
        ))
    return out


@router.post("/templates/share", response_model=TemplateResponse)
def share_template(
    data: TemplateShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    body = data.body
    # 미션/프롬프트에서 본문 자동 채우기 (본인 소유만)
    if data.source_type == "mission" and data.source_id:
        m = db.query(GrowthMission).filter(
            GrowthMission.id == data.source_id, GrowthMission.user_id == current_user.id
        ).first()
        if not m:
            raise HTTPException(status_code=404, detail="미션을 찾을 수 없습니다")
        if not body:
            body = f"문제: {m.problem}\n목표: {m.goal}\n결과물: {m.output}\n성공 기준:\n{m.success_criteria}"
    elif data.source_type == "prompt" and data.source_id:
        p = (
            db.query(ClaudePrompt)
            .join(GrowthMission, ClaudePrompt.mission_id == GrowthMission.id)
            .filter(ClaudePrompt.id == data.source_id, GrowthMission.user_id == current_user.id)
            .first()
        )
        if not p:
            raise HTTPException(status_code=404, detail="프롬프트를 찾을 수 없습니다")
        if not body:
            body = p.prompt_text

    tpl = SharedTemplate(
        created_by=current_user.id,
        source_type=data.source_type,
        source_id=data.source_id,
        title=data.title,
        category=data.category,
        description=data.description,
        body=body,
        anonymized=data.anonymized,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return TemplateResponse(
        id=tpl.id, title=tpl.title, category=tpl.category or "",
        description=tpl.description or "", body=tpl.body or "",
        source_type=tpl.source_type,
        owner_name="익명" if tpl.anonymized else current_user.name,
        created_at=tpl.created_at,
    )


# ─────────────── 지원 요청 (구성원 → 파트장) ───────────────
@router.get("/support-requests/mine", response_model=List[SupportRequestResponse])
def my_support_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(SupportRequest)
        .filter(SupportRequest.user_id == current_user.id)
        .order_by(SupportRequest.created_at.desc())
        .all()
    )


@router.post("/support-requests", response_model=SupportRequestResponse)
def create_support_request(
    data: SupportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = SupportRequest(
        user_id=current_user.id,
        request_type=data.request_type,
        description=data.description,
        anonymous=data.anonymous,
        status="open",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req
