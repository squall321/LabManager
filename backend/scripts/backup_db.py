"""
디지털트윈AX랩 - 데이터베이스 백업/복원 스크립트

SQLite의 온라인 백업 API를 사용하므로 서버가 떠 있는 상태에서도 안전하게 백업됩니다.
(단순 파일 복사와 달리 쓰기 중간에 깨진 스냅샷이 나오지 않음)

사용법:
  # 백업 (기본: data/backups/labmanager_YYYYMMDD_HHMMSS.db)
  python -m scripts.backup_db backup
  python -m scripts.backup_db backup --out mybackup.db

  # 백업 목록
  python -m scripts.backup_db list

  # 복원 (현재 DB는 자동으로 안전 백업 후 교체)
  python -m scripts.backup_db restore data/backups/labmanager_20260706_120000.db

  # 오래된 백업 정리 (최근 N개만 유지, 기본 20)
  python -m scripts.backup_db prune --keep 20
"""
import argparse
import sqlite3
import sys
import shutil
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "labmanager.db"
BACKUP_DIR = BASE_DIR / "data" / "backups"
PREFIX = "labmanager_"


def _ts() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _online_backup(src: Path, dst: Path) -> None:
    """SQLite 온라인 백업 API로 일관된 스냅샷 생성."""
    dst.parent.mkdir(parents=True, exist_ok=True)
    src_con = sqlite3.connect(str(src))
    dst_con = sqlite3.connect(str(dst))
    try:
        with dst_con:
            src_con.backup(dst_con)
    finally:
        src_con.close()
        dst_con.close()


def cmd_backup(args) -> None:
    if not DB_PATH.exists():
        sys.exit(f"[오류] DB가 없습니다: {DB_PATH}")
    out = Path(args.out) if args.out else BACKUP_DIR / f"{PREFIX}{_ts()}.db"
    if not out.is_absolute():
        out = BASE_DIR / out
    _online_backup(DB_PATH, out)
    size_kb = out.stat().st_size / 1024
    print(f"[백업 완료] {out}  ({size_kb:.1f} KB)")


def cmd_list(args) -> None:
    if not BACKUP_DIR.exists():
        print("(백업 없음)")
        return
    files = sorted(BACKUP_DIR.glob(f"{PREFIX}*.db"), reverse=True)
    if not files:
        print("(백업 없음)")
        return
    print(f"{'파일':45} {'크기':>10}  {'생성시각'}")
    for f in files:
        st = f.stat()
        print(f"{f.name:45} {st.st_size/1024:8.1f}KB  "
              f"{datetime.fromtimestamp(st.st_mtime):%Y-%m-%d %H:%M:%S}")
    print(f"\n총 {len(files)}개 · 위치: {BACKUP_DIR}")


def cmd_restore(args) -> None:
    src = Path(args.file)
    if not src.is_absolute():
        src = BASE_DIR / src
    if not src.exists():
        sys.exit(f"[오류] 백업 파일이 없습니다: {src}")
    # 현재 DB를 먼저 안전 백업 (되돌리기 대비)
    if DB_PATH.exists():
        safety = BACKUP_DIR / f"{PREFIX}before_restore_{_ts()}.db"
        _online_backup(DB_PATH, safety)
        print(f"[안전 백업] 복원 전 현재 DB 보관: {safety.name}")
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, DB_PATH)
    print(f"[복원 완료] {src.name} → {DB_PATH}")
    print("  ⚠ 서버가 실행 중이면 재시작해야 반영됩니다.")


def cmd_prune(args) -> None:
    keep = args.keep
    files = sorted(BACKUP_DIR.glob(f"{PREFIX}*.db"), key=lambda f: f.stat().st_mtime, reverse=True)
    to_delete = files[keep:]
    for f in to_delete:
        f.unlink()
    print(f"[정리] {len(to_delete)}개 삭제, 최근 {min(keep, len(files))}개 유지")


def main() -> None:
    p = argparse.ArgumentParser(description="디지털트윈AX랩 DB 백업/복원")
    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("backup", help="현재 DB를 백업")
    b.add_argument("--out", help="저장 경로 (기본: data/backups/labmanager_<시각>.db)")
    b.set_defaults(func=cmd_backup)

    sub.add_parser("list", help="백업 목록").set_defaults(func=cmd_list)

    r = sub.add_parser("restore", help="백업으로 복원")
    r.add_argument("file", help="복원할 백업 파일 경로")
    r.set_defaults(func=cmd_restore)

    pr = sub.add_parser("prune", help="오래된 백업 정리")
    pr.add_argument("--keep", type=int, default=20, help="유지할 최근 백업 개수 (기본 20)")
    pr.set_defaults(func=cmd_prune)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
