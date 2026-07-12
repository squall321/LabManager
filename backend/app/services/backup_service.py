"""
DB 백업 서비스 — SQLite 온라인 백업 API 기반.
관리자 API와 CLI(scripts/backup_db.py)가 공유한다.
"""
import os
import sqlite3
import time
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


def _latest_backup_age_hours() -> float | None:
    """가장 최근 백업의 경과 시간(시간). 백업이 없으면 None."""
    if not BACKUP_DIR.exists():
        return None
    files = list(BACKUP_DIR.glob(f"{PREFIX}*.db"))
    if not files:
        return None
    newest = max(f.stat().st_mtime for f in files)
    return (datetime.now().timestamp() - newest) / 3600.0


def backup_if_due(interval_hours: int, keep: int) -> dict | None:
    """마지막 백업이 interval_hours 이상 지났으면(또는 없으면) 백업 후 오래된 것 정리.
    재시작해도 최근 백업 시각을 파일에서 판단하므로 중복 백업하지 않는다.

    멀티 워커 안전: O_CREAT|O_EXCL 락으로 동시에 여러 프로세스가 백업하지 않게 한다.
    락을 못 잡으면(다른 워커가 처리 중) 조용히 건너뛴다."""
    if not DB_PATH.exists():
        return None
    age = _latest_backup_age_hours()
    if age is not None and age < interval_hours:
        return None

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    lock = BACKUP_DIR / f".{PREFIX}backup.lock"
    try:
        fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        # 오래된(고아) 락은 정리: 60초 이상이면 무시하고 재시도 없이 이번은 건너뜀
        try:
            if time.time() - lock.stat().st_mtime > 60:
                lock.unlink(missing_ok=True)
        except OSError:
            pass
        return None
    try:
        # 락을 잡은 뒤 다시 한 번 확인(그 사이 다른 워커가 방금 백업했을 수 있음)
        age = _latest_backup_age_hours()
        if age is not None and age < interval_hours:
            return None
        result = create_backup()
        prune_backups(keep)
        return result
    finally:
        os.close(fd)
        lock.unlink(missing_ok=True)
