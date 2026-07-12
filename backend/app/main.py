import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.database import engine, Base, SessionLocal
from .core.logging import (
    setup_logging, RequestLogMiddleware, unhandled_exception_handler,
)
from .models import (  # noqa: F401
    user, survey, workcraft, assessment, pulse, agreement, reflection, kudos, decision,
    working_backwards, wb_domain, api_token,
)
from .api import (
    auth, survey as survey_router, reports, admin,
    workcraft as workcraft_router, templates as templates_router, leader as leader_router,
    assessments as assessments_router, pulse as pulse_router, agreements as agreements_router,
    reflections as reflections_router, kudos as kudos_router, decisions as decisions_router,
    working_backwards as wb_router, tokens as tokens_router,
)
from .services.auth_service import load_users_from_yaml
from .core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logging.getLogger("labmanager").info(
        "%s v%s 시작 (backup=%s, log=%s)",
        settings.APP_NAME, settings.APP_VERSION,
        settings.AUTO_BACKUP_ENABLED, settings.LOG_LEVEL,
    )
    # 개발 편의용 자동 테이블 생성 (운영에서는 AUTO_CREATE_ALL=false + Alembic)
    if settings.AUTO_CREATE_ALL:
        Base.metadata.create_all(bind=engine)
    # YAML 사용자 동기화 + WB 도메인 프리셋 시드
    db = SessionLocal()
    try:
        load_users_from_yaml(db)
        from .services.wb_data import seed_domains
        seed_domains(db)
    finally:
        db.close()
    # 자동 정기 백업 스케줄러 시작
    from .services import backup_scheduler
    backup_scheduler.start()
    yield
    await backup_scheduler.stop()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 접근 로그 (메서드/경로/상태/소요시간)
app.add_middleware(RequestLogMiddleware)

# 처리되지 않은 예외 → 스택은 로그, 사용자에겐 안전한 500
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(auth.router, prefix="/api")
app.include_router(survey_router.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(workcraft_router.router, prefix="/api")
app.include_router(templates_router.router, prefix="/api")
app.include_router(leader_router.router, prefix="/api")
app.include_router(assessments_router.router, prefix="/api")
app.include_router(pulse_router.router, prefix="/api")
app.include_router(agreements_router.router, prefix="/api")
app.include_router(reflections_router.router, prefix="/api")
app.include_router(kudos_router.router, prefix="/api")
app.include_router(decisions_router.router, prefix="/api")
app.include_router(wb_router.router, prefix="/api")
app.include_router(tokens_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
