"""
디지털트윈AX랩 - 개인 API 토큰 관리 CLI

웹 UI(대시보드)에 로그인하지 않고도, 서버에 붙지 않고 DB에서 직접
개인 API 토큰(lmk_...)을 발급/조회/해지한다. MCP·REST를 UI 없이 쓰기 위한 진입점.

앱의 token_service를 그대로 재사용하므로 해시·형식이 웹 발급과 100% 동일하다.

사용법 (backend 디렉터리에서):
  # 토큰 발급 (원문은 이때 한 번만 출력됨 — 안전한 곳에 복사)
  python -m scripts.manage_tokens issue user@company.com --name "내 노트북 Claude"

  # 특정 사용자의 토큰 목록 (원문은 안 보이고 prefix만)
  python -m scripts.manage_tokens list user@company.com

  # 토큰 해지 (id 또는 prefix로)
  python -m scripts.manage_tokens revoke --id 3
  python -m scripts.manage_tokens revoke --prefix lmk_ab12cd34

DB 위치는 DATABASE_URL 환경변수를 따른다(앱과 동일).
"""
import argparse
import sys

# Windows 콘솔(cp949)에서도 한글/기호 출력이 깨지지 않도록 UTF-8로 재설정
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

from app.core.database import SessionLocal
# User 매퍼가 다른 모델(Survey 등)과 관계를 갖고 있어, 전체 모델을 등록해야 로드된다.
from app.models import (  # noqa: F401
    user, survey, workcraft, assessment, pulse, agreement, reflection, kudos, decision,
    working_backwards, wb_domain, api_token,
)
from app.models.api_token import ApiToken
from app.services import token_service
from app.services.auth_service import get_user_by_email


def cmd_issue(args) -> None:
    db = SessionLocal()
    try:
        user = get_user_by_email(db, args.email)
        if not user:
            sys.exit(f"[오류] 등록된 사용자가 없습니다: {args.email}")
        raw, row = token_service.generate_token(db, user, args.name or "")
        print("[발급 완료] 아래 토큰은 지금만 볼 수 있어요. 안전한 곳에 복사하세요:\n")
        print(f"  {raw}\n")
        print(f"  이름: {row.name}   소유자: {user.email}   prefix: {row.prefix}")
        print("\nMCP 사용 시:  LABMGR_TOKEN 환경변수에 위 값을 넣으세요.")
    finally:
        db.close()


def cmd_list(args) -> None:
    db = SessionLocal()
    try:
        user = get_user_by_email(db, args.email)
        if not user:
            sys.exit(f"[오류] 등록된 사용자가 없습니다: {args.email}")
        rows = (
            db.query(ApiToken).filter(ApiToken.user_id == user.id)
            .order_by(ApiToken.created_at.desc()).all()
        )
        if not rows:
            print("(발급된 토큰 없음)")
            return
        print(f"{'id':>4}  {'prefix':14} {'활성':4} {'이름':20} {'최근사용'}")
        for t in rows:
            used = t.last_used_at.strftime("%Y-%m-%d") if t.last_used_at else "미사용"
            print(f"{t.id:>4}  {t.prefix:14} {'O' if t.active else 'X':4} {(t.name or ''):20} {used}")
    finally:
        db.close()


def cmd_revoke(args) -> None:
    if not args.id and not args.prefix:
        sys.exit("[오류] --id 또는 --prefix 중 하나가 필요합니다")
    db = SessionLocal()
    try:
        q = db.query(ApiToken)
        t = q.filter(ApiToken.id == args.id).first() if args.id else q.filter(ApiToken.prefix == args.prefix).first()
        if not t:
            sys.exit("[오류] 해당 토큰을 찾을 수 없습니다")
        db.delete(t)
        db.commit()
        print(f"[해지 완료] id={t.id} prefix={t.prefix}")
    finally:
        db.close()


def main() -> None:
    p = argparse.ArgumentParser(description="디지털트윈AX랩 개인 API 토큰 관리")
    sub = p.add_subparsers(dest="cmd", required=True)

    i = sub.add_parser("issue", help="토큰 발급")
    i.add_argument("email", help="토큰 소유자 이메일")
    i.add_argument("--name", default="", help="토큰 이름 (예: 내 노트북 Claude)")
    i.set_defaults(func=cmd_issue)

    ls = sub.add_parser("list", help="사용자의 토큰 목록")
    ls.add_argument("email", help="사용자 이메일")
    ls.set_defaults(func=cmd_list)

    r = sub.add_parser("revoke", help="토큰 해지")
    r.add_argument("--id", type=int, help="토큰 id")
    r.add_argument("--prefix", help="토큰 prefix (예: lmk_ab12cd34)")
    r.set_defaults(func=cmd_revoke)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
