import secrets
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def _resolve_secret_key() -> str:
    """
    배포별 안전한 비밀키 해석:
      1) 환경변수 SECRET_KEY (pydantic이 우선 적용 — 이 함수는 미설정 시에만 호출)
      2) data/.secret_key 파일 (없으면 무작위 생성·저장, gitignore 대상)
    소스에 비밀키를 커밋하지 않는다.
    """
    key_path = BASE_DIR / "data" / ".secret_key"
    if key_path.exists():
        existing = key_path.read_text(encoding="utf-8").strip()
        if existing:
            return existing
    key = secrets.token_hex(32)
    key_path.parent.mkdir(parents=True, exist_ok=True)
    key_path.write_text(key, encoding="utf-8")
    return key


class Settings(BaseSettings):
    # 환경변수 SECRET_KEY가 있으면 그것을, 없으면 배포별 무작위 키를 사용
    SECRET_KEY: str = Field(default_factory=_resolve_secret_key)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # 첫 로그인(비밀번호 설정) 시 요구할 조직 가입 코드.
    # 비어 있으면(기본) 코드 없이 설정 가능(개발 편의). 운영에서는 반드시 설정 권장.
    SIGNUP_CODE: str = ""

    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/data/labmanager.db"
    USERS_YAML_PATH: str = str(BASE_DIR / "data" / "users.yaml")

    APP_NAME: str = "LabManager HR System"
    APP_VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"


settings = Settings()
