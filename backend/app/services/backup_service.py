"""
DB 백업 서비스 — SQLite 온라인 백업 API 기반.
관리자 API와 CLI(scripts/backup_db.py)가 공유한다.
"""
import sqlite3
from datetime import datetime
from pathlib import Path
from ..core.config import BASE_DIR, settings


def _db_path() -> Path:
    url = settings.DATABASE_URL
    if url.startswith("sqlite:///"):
        raw = url[len("sqlite:///"):]
        p = Path(raw)
        return p if p.is_absolute() else (BASE_DIR / raw).resolve()
    return (BASE_DIR / "data" / "labmanager.db").resolve()


DB_PATH = _db_path()
BACKUP_DIR = DB_PATH.parent / "backups"
PREFIX = f"{DB_PATH.stem}_"   # 실 DB와 테스트 DB 백업을 분리


def _ts() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def online_backup(src: Path, dst: Path) -> None:
    """일관된 스냅샷 (서버 실행 중에도 안전)."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    src_con = sqlite3.connect(str(src))
    dst_con = sqlite3.connect(str(dst))
    try:
        with dst_con:
            src_con.backup(dst_con)
    finally:
        src_con.close()
        dst_con.close()


def create_backup() -> dict:
    if not DB_PATH.exists():
        raise FileNotFoundError("데이터베이스 파일이 없습니다")
    out = BACKUP_DIR / f"{PREFIX}{_ts()}.db"
    online_backup(DB_PATH, out)
    st = out.stat()
    return {"name": out.name, "size": st.st_size, "created_at": datetime.fromtimestamp(st.st_mtime).isoformat()}


def list_backups() -> list:
    if not BACKUP_DIR.exists():
        return []
    files = sorted(BACKUP_DIR.glob(f"{PREFIX}*.db"), key=lambda f: f.stat().st_mtime, reverse=True)
    out = []
    for f in files:
        st = f.stat()
        out.append({"name": f.name, "size": st.st_size,
                    "created_at": datetime.fromtimestamp(st.st_mtime).isoformat()})
    return out


def safe_backup_path(name: str) -> Path:
    """다운로드용 경로 검증 — 경로 traversal 차단, 백업 파일만 허용."""
    if "/" in name or "\\" in name or ".." in name or not name.startswith(PREFIX) or not name.endswith(".db"):
        raise ValueError("잘못된 파일명입니다")
    p = (BACKUP_DIR / name).resolve()
    if p.parent != BACKUP_DIR.resolve() or not p.exists():
        raise FileNotFoundError("백업 파일을 찾을 수 없습니다")
    return p


def prune_backups(keep: int = 20) -> int:
    files = sorted(BACKUP_DIR.glob(f"{PREFIX}*.db"), key=lambda f: f.stat().st_mtime, reverse=True)
    to_delete = files[keep:]
    for f in to_delete:
        f.unlink()
    return len(to_delete)
