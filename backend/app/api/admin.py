from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.user import User
from ..models.survey import Survey, BirkmanReport
from ..schemas.user import UserResponse
from ..services.auth_service import get_all_users, load_users_from_yaml
from .deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["관리자"])


@router.get("/users", response_model=List[UserResponse])
def list_users(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return get_all_users(db)


@router.post("/sync-users")
def sync_users_from_yaml(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """YAML에서 사용자 동기화"""
    created = load_users_from_yaml(db)
    return {"message": f"{created}명의 신규 사용자가 추가되었습니다"}


@router.get("/stats")
def get_stats(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    users_with_password = db.query(User).filter(User.password_set == True).count()
    completed_surveys = db.query(Survey).filter(Survey.status == "completed").count()
    total_reports = db.query(BirkmanReport).count()
    public_reports = db.query(BirkmanReport).filter(BirkmanReport.is_public == True).count()
    return {
        "total_users": total_users,
        "active_users": active_users,
        "users_with_password": users_with_password,
        "completed_surveys": completed_surveys,
        "total_reports": total_reports,
        "public_reports": public_reports,
    }


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user_id, "is_active": user.is_active}
