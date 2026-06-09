from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.user import User
from ..models.survey import BirkmanReport
from ..schemas.survey import ReportResponse, ReportVisibilityUpdate
from .deps import get_current_user, get_current_admin

router = APIRouter(prefix="/reports", tags=["리포트"])


def _format_report(report: BirkmanReport) -> dict:
    return {
        "id": report.id,
        "user_id": report.user_id,
        "user_name": report.user.name,
        "user_email": report.user.email,
        "is_public": report.is_public,
        "report_data": report.report_data,
        "created_at": report.created_at,
    }


@router.get("/me")
def get_my_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = db.query(BirkmanReport).filter(BirkmanReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="아직 리포트가 없습니다. 설문을 완료해주세요.")
    return _format_report(report)


@router.patch("/me/visibility")
def update_my_report_visibility(
    data: ReportVisibilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(BirkmanReport).filter(BirkmanReport.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="리포트가 없습니다")
    report.is_public = data.is_public
    db.commit()
    return {"is_public": report.is_public}


@router.get("/public")
def get_public_reports(db: Session = Depends(get_db)):
    """공개된 리포트 목록"""
    reports = db.query(BirkmanReport).filter(BirkmanReport.is_public == True).all()
    return [_format_report(r) for r in reports]


@router.get("/all")
def get_all_reports(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """관리자: 전체 리포트 조회"""
    reports = db.query(BirkmanReport).all()
    return [_format_report(r) for r in reports]


@router.patch("/{report_id}/visibility")
def admin_update_visibility(
    report_id: int,
    data: ReportVisibilityUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """관리자: 특정 리포트 공개/비공개 변경"""
    report = db.query(BirkmanReport).filter(BirkmanReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="리포트가 없습니다")
    report.is_public = data.is_public
    db.commit()
    return {"id": report_id, "is_public": report.is_public}


@router.get("/{user_id}")
def get_report_by_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(BirkmanReport).filter(BirkmanReport.user_id == user_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="리포트가 없습니다")
    if not report.is_public and not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="비공개 리포트입니다")
    return _format_report(report)
