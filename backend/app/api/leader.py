"""
파트장 영역 — 익명 집계만 반환. 개인 레코드/이름/원문 노출 금지.
get_current_part_leader 로 보호.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.user import User
from ..services import trends_service
from .deps import get_current_part_leader

router = APIRouter(prefix="/leader", tags=["파트장"])


@router.get("/anonymous-trends")
def anonymous_trends(
    current_user: User = Depends(get_current_part_leader),
    db: Session = Depends(get_db),
):
    return trends_service.build_dashboard(db)


@router.get("/support-requests")
def support_requests(
    current_user: User = Depends(get_current_part_leader),
    db: Session = Depends(get_db),
):
    return trends_service.support_list(db)
