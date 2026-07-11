"""
자동 정기 백업 스케줄러 — 외부 의존성 없이 asyncio 백그라운드 태스크로 동작.

- 서버가 켜져 있는 동안 주기적으로 backup_if_due()를 호출.
- backup_if_due()가 '마지막 백업 이후 경과 시간'으로 판단하므로, 서버를 자주 껐다 켜도
  간격보다 자주 백업하지 않는다.
- 매 시간(또는 간격이 더 짧으면 그만큼) 깨어나 '지금 백업할 때가 됐는지'만 확인.
"""
import asyncio
import logging

from ..core.config import settings
from . import backup_service

logger = logging.getLogger("labmanager.backup")

_task: asyncio.Task | None = None


async def _loop():
    # 확인 주기: 최소 1시간, 다만 간격이 더 짧게 설정되면 그 간격으로.
    check_every_sec = max(1, min(settings.AUTO_BACKUP_INTERVAL_HOURS, 1)) * 3600
    # 시작 직후 한 번 확인(부팅 직후 오래된 상태면 즉시 백업)
    while True:
        try:
            res = backup_service.backup_if_due(
                settings.AUTO_BACKUP_INTERVAL_HOURS, settings.AUTO_BACKUP_KEEP
            )
            if res:
                logger.info("자동 백업 생성: %s (%d bytes)", res["name"], res["size"])
        except Exception:  # 백업 실패가 서버를 죽이면 안 됨
            logger.exception("자동 백업 중 오류")
        await asyncio.sleep(check_every_sec)


def start():
    """앱 lifespan 에서 호출 — 백업 루프를 백그라운드로 띄운다."""
    global _task
    if not settings.AUTO_BACKUP_ENABLED:
        return
    if _task and not _task.done():
        return
    _task = asyncio.create_task(_loop())


async def stop():
    global _task
    if _task and not _task.done():
        _task.cancel()
        try:
            await _task
        except (asyncio.CancelledError, Exception):
            pass
    _task = None
