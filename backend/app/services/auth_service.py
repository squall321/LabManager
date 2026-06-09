import yaml
from sqlalchemy.orm import Session
from ..models.user import User
from ..core.security import get_password_hash, verify_password
from ..core.config import settings
from typing import Optional


def load_users_from_yaml(db: Session) -> int:
    """YAML에서 사용자 계정을 로드하여 DB에 없는 경우 추가"""
    try:
        with open(settings.USERS_YAML_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
    except FileNotFoundError:
        return 0

    created = 0
    for user_data in data.get("users", []):
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                is_admin=user_data.get("is_admin", False),
                is_part_leader=user_data.get("is_part_leader", False),
                department=user_data.get("department"),
                is_active=True,
                password_set=False,
            )
            db.add(user)
            created += 1
        else:
            # 기존 계정의 권한/부서 정보는 YAML 기준으로 동기화 (비번/활성상태는 유지)
            existing.is_admin = user_data.get("is_admin", existing.is_admin)
            existing.is_part_leader = user_data.get("is_part_leader", existing.is_part_leader)
            if user_data.get("department") is not None:
                existing.department = user_data["department"]

    db.commit()
    return created


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not user.hashed_password:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def set_user_password(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    user.hashed_password = get_password_hash(password)
    user.password_set = True
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session):
    return db.query(User).all()
