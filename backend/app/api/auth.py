from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import create_access_token
from ..schemas.user import UserLogin, UserSetPassword, Token, UserResponse
from ..services.auth_service import authenticate_user, get_user_by_email, set_user_password
from .deps import get_current_user
from ..models.user import User

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/login", response_model=Token)
def login(form: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, form.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="등록되지 않은 이메일입니다")
    if not user.password_set:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PASSWORD_NOT_SET")
    user = authenticate_user(db, form.email, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="비밀번호가 올바르지 않습니다")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="비활성화된 계정입니다")

    access_token = create_access_token(data={"sub": user.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/check-email")
def check_email(body: dict, db: Session = Depends(get_db)):
    """이메일이 시스템에 등록되어 있는지, 비밀번호 설정 여부 확인"""
    email = body.get("email", "")
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="등록되지 않은 이메일입니다")
    return {"exists": True, "password_set": user.password_set, "name": user.name}


@router.post("/set-password")
def set_password(form: UserSetPassword, db: Session = Depends(get_db)):
    """최초 로그인 시 비밀번호 설정"""
    if form.password != form.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="비밀번호가 일치하지 않습니다")
    if len(form.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="비밀번호는 8자 이상이어야 합니다")
    user = get_user_by_email(db, form.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="등록되지 않은 이메일입니다")
    if user.password_set:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 비밀번호가 설정되어 있습니다")

    updated = set_user_password(db, form.email, form.password)
    access_token = create_access_token(data={"sub": updated.email})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(updated)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
