from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from ..core.database import get_db
from ..models.user import User
from ..models.survey import Survey, BirkmanReport
from ..models.wb_domain import WBDomain
from ..schemas.user import UserResponse
from ..services.auth_service import get_all_users, load_users_from_yaml
from ..services import backup_service
from ..core.config import settings
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


# ─────────────── WB 업무 유형(도메인) 관리 ───────────────
import re


class DomainIn(BaseModel):
    key: Optional[str] = None
    name: str
    description: str = ""
    active: bool = True


class DomainUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    order: Optional[int] = None


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9가-힣]+", "_", name.lower()).strip("_")
    return s or "domain"


@router.get("/wb-domains")
def list_domains(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    rows = db.query(WBDomain).order_by(WBDomain.order, WBDomain.id).all()
    return [{"id": d.id, "key": d.key, "name": d.name, "description": d.description,
             "active": d.active, "order": d.order} for d in rows]


@router.post("/wb-domains")
def create_domain(data: DomainIn, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="이름을 입력해주세요")
    key = (data.key or _slugify(data.name)).strip()
    base, i = key, 2
    while db.query(WBDomain).filter(WBDomain.key == key).first():
        key = f"{base}_{i}"; i += 1
    max_order = db.query(func.max(WBDomain.order)).scalar() or 0
    d = WBDomain(key=key, name=data.name.strip(), description=data.description.strip(),
                 active=data.active, order=max_order + 1)
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id, "key": d.key}


@router.put("/wb-domains/{domain_id}")
def update_domain(domain_id: int, data: DomainUpdate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    d = db.query(WBDomain).filter(WBDomain.id == domain_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(d, k, v.strip() if isinstance(v, str) else v)
    db.commit()
    return {"id": d.id}


@router.delete("/wb-domains/{domain_id}")
def delete_domain(domain_id: int, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    d = db.query(WBDomain).filter(WBDomain.id == domain_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="찾을 수 없습니다")
    db.delete(d)
    db.commit()
    return {"deleted": domain_id}


# ─────────────── 데이터 백업 (관리자 전용) ───────────────
@router.get("/backups")
def backup_list(current_user: User = Depends(get_current_admin)):
    return {
        "backups": backup_service.list_backups(),
        "auto": {
            "enabled": settings.AUTO_BACKUP_ENABLED,
            "interval_hours": settings.AUTO_BACKUP_INTERVAL_HOURS,
            "keep": settings.AUTO_BACKUP_KEEP,
        },
    }


@router.post("/backups")
def backup_create(current_user: User = Depends(get_current_admin)):
    try:
        info = backup_service.create_backup()
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, **info}


@router.get("/backups/{name}/download")
def backup_download(name: str, current_user: User = Depends(get_current_admin)):
    try:
        path = backup_service.safe_backup_path(name)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return FileResponse(str(path), media_type="application/octet-stream", filename=name)
