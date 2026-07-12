"""
운영 로깅 설정 + 요청 로깅 미들웨어 + 전역 예외 핸들러.
외부 의존성 없이 표준 logging 만 사용한다(필요 시 Sentry 등으로 확장 가능).
"""
import logging
import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import settings

logger = logging.getLogger("labmanager")
access_logger = logging.getLogger("labmanager.access")


def setup_logging() -> None:
    """루트 핸들러를 구성. uvicorn 이 이미 핸들러를 붙였어도 포맷을 통일한다."""
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    fmt = logging.Formatter(
        "%(asctime)s %(levelname)-7s %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    root = logging.getLogger()
    root.setLevel(level)
    # 우리 로거는 자체 핸들러 하나만 갖게 해서 중복 출력 방지
    for lg in (logger, access_logger):
        lg.setLevel(level)
        lg.propagate = False
        if not lg.handlers:
            h = logging.StreamHandler()
            h.setFormatter(fmt)
            lg.addHandler(h)


class RequestLogMiddleware(BaseHTTPMiddleware):
    """요청별 접근 로그(메서드/경로/상태/소요시간). 5xx는 ERROR, 4xx는 WARNING."""

    async def dispatch(self, request: Request, call_next):
        if not settings.LOG_REQUESTS:
            return await call_next(request)
        # 상관 추적용 요청 id (응답 헤더로도 반환)
        req_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:8]
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # 여기서 잡히면 아래 전역 핸들러가 처리하지만, 소요시간은 남긴다
            elapsed = (time.perf_counter() - start) * 1000
            access_logger.error(
                "%s %s -> 500 (%.0fms) req=%s [unhandled]",
                request.method, request.url.path, elapsed, req_id,
            )
            raise
        elapsed = (time.perf_counter() - start) * 1000
        code = response.status_code
        line = "%s %s -> %d (%.0fms) req=%s" % (
            request.method, request.url.path, code, elapsed, req_id,
        )
        if code >= 500:
            access_logger.error(line)
        elif code >= 400:
            access_logger.warning(line)
        else:
            access_logger.info(line)
        response.headers["X-Request-ID"] = req_id
        return response


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """처리되지 않은 예외: 스택트레이스는 로그로, 사용자에겐 안전한 500만 반환."""
    req_id = request.headers.get("x-request-id") or "-"
    logger.exception(
        "Unhandled error on %s %s (req=%s): %s",
        request.method, request.url.path, req_id, exc,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "서버 내부 오류가 발생했어요. 잠시 후 다시 시도해 주세요."},
    )
