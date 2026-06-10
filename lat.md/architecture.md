# LabManager — 시스템 아키텍처

→ 상위: [[overview#플랫폼 전체 구조]]

---

## 기술 스택

| 레이어 | 기술 | 버전/비고 |
|---|---|---|
| 프론트엔드 언어 | TypeScript | strict mode |
| 프론트엔드 프레임워크 | React 18 + Vite | 라우트 lazy() + Suspense |
| UI 스타일 | Tailwind CSS + PostCSS | `brand-*` 커스텀 컬러 팔레트 |
| 상태 관리 | Zustand | `authStore.ts` (JWT 토큰) |
| 애니메이션 | Framer Motion | 카드·모달 전환 |
| 차트 | Recharts | 라이프스타일 그리드, 컴포넌트 레이더 |
| 드래그앤드롭 | @dnd-kit/core | Pointer + Touch 센서, 칸반 보드 |
| 백엔드 프레임워크 | FastAPI (Python 3.11+) | lifespan 이벤트로 시작 시 초기화 |
| ORM | SQLAlchemy | 동기 세션 |
| 데이터베이스 | SQLite | `data/labmanager.db` |
| 마이그레이션 | Alembic | `render_as_batch=True` (SQLite 제한) |
| 유효성 검증 | Pydantic v2 | 스키마 레벨에서 민감 필드 배제 |
| 설정 관리 | pydantic-settings | `.env` + 환경변수 우선 |
| 계산 가속 (선택) | C++ + pybind11 | 현재 미빌드(`USE_CPP=False`) |
| 테스트 | pytest + FastAPI TestClient | 12 케이스 |
| CI | GitHub Actions | 백엔드 pytest + 프론트 빌드 |

---

## 디렉터리 구조

```
LabManager/
├── lat.md/                      # ← 이 지식 그래프
│   ├── overview.md
│   ├── architecture.md          # 이 파일
│   ├── birkman.md
│   ├── workcraft.md
│   ├── security.md
│   ├── status.md
│   └── tests.md
│
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 진입점, 라우터 등록, lifespan
│   │   ├── core/
│   │   │   ├── config.py        # Settings (pydantic-settings), SECRET_KEY 해석
│   │   │   ├── database.py      # engine, SessionLocal, Base
│   │   │   └── security.py      # JWT 생성·검증, 비밀번호 해싱
│   │   ├── models/
│   │   │   ├── user.py          # User (is_admin, is_part_leader, department)
│   │   │   ├── survey.py        # SurveyResponse, BirkmanReport
│   │   │   └── workcraft.py     # WorkFriction, GrowthMission, ClaudePrompt,
│   │   │                        #   MissionReview, SharedTemplate, SupportRequest
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── survey.py
│   │   │   └── workcraft.py     # 파트장 응답 스키마 → user_id·name 미포함
│   │   ├── services/
│   │   │   ├── auth_service.py  # YAML 계정 로딩, 초기 비밀번호 설정
│   │   │   ├── birkman_data.py  # 100문항·채점 규칙 단일 소스
│   │   │   ├── birkman_engine.py# 점수 계산 (C++ 우선, Python fallback)
│   │   │   ├── report_service.py# 리포트 내러티브 생성
│   │   │   ├── prompt_builder.py# 12블록 Claude 실행 명세서 조립 (외부 의존성 없음)
│   │   │   ├── recommendation.py# 순수 함수: Birkman 색상·관심영역 → 미션·스킬 추천
│   │   │   ├── trends_service.py# 익명 집계 (ANONYMITY_MIN_N=5, 개인정보 제거)
│   │   │   └── growth_service.py# 성장 회고 집계 (Phase 3 예정)
│   │   └── api/
│   │       ├── auth.py          # /api/auth/*
│   │       ├── survey.py        # /api/survey/*
│   │       ├── reports.py       # /api/reports/*
│   │       ├── admin.py         # /api/admin/* (is_admin 전용)
│   │       ├── workcraft.py     # /api/workcraft/* (개인 CRUD)
│   │       ├── templates.py     # /api/templates/* (공유 라이브러리)
│   │       ├── leader.py        # /api/leader/* (is_part_leader, 익명 집계 전용)
│   │       └── deps.py          # get_current_user, get_current_admin,
│   │                            #   get_current_part_leader
│   ├── alembic/
│   │   └── versions/
│   │       └── 17442b2eb4c7_initial_schema.py  # 10개 테이블 초기 마이그레이션
│   ├── cpp/
│   │   └── birkman_calc/
│   │       ├── calculator.cpp/.h   # 점수 계산 엔진 (Python과 동일 가중치)
│   │       └── bindings.cpp        # pybind11 바인딩
│   ├── data/
│   │   └── users.yaml           # 계정 정의 (name, email, is_admin, is_part_leader)
│   └── tests/
│       ├── conftest.py          # 세션 픽스처, 테스트 DB, SIGNUP_CODE 토글
│       ├── test_auth.py
│       ├── test_leader_growth.py
│       └── test_workcraft.py
│
└── frontend/
    └── src/
        ├── App.tsx              # 라우터 정의, lazy import
        ├── components/
        │   ├── Layout/Layout.tsx # 모바일 드로어 사이드바, 모듈 스위처
        │   ├── birkman/         # ComponentChart, InterestChart, LifestyleGrid
        │   └── workcraft/       # VisibilitySelector, ...
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx # WorkCraft 성장 스냅샷 포함
        │   ├── SurveyPage.tsx
        │   ├── ReportPage.tsx
        │   ├── TeamPage.tsx
        │   ├── AdminPage.tsx
        │   └── workcraft/        # 11개 WorkCraft 페이지
        ├── services/api.ts       # API 클라이언트 (Birkman + WorkCraft)
        ├── store/
        │   ├── authStore.ts      # JWT 토큰 보관 (localStorage)
        │   └── toastStore.ts
        └── types/index.ts
```

---

## C++ ↔ FastAPI 바인딩 패턴

```python
# birkman_engine.py (요약)
try:
    import birkman_calc          # pybind11 빌드 모듈
    USE_CPP = True
except ImportError:
    USE_CPP = False              # 자동 Python fallback
```

- **현재 상태**: `USE_CPP = False` — 기본 배포에서 미빌드 참조 구현
- **채점 경로**: Python 구현으로 수행·검증됨
- **C++ 모듈**: 동일 가중치·알고리즘으로 작성, 성능 가속 필요 시 선택적 빌드
- **WorkCraft와의 관계**: Phase 1·2는 수치 계산 없어 C++ 불필요. 후속 트렌드 클러스터링 필요 시 `workcraft_calc` 모듈로 확장 가능

→ 상세: [[birkman#채점 알고리즘]]

---

## 데이터베이스 전략

### 개발 vs 운영

| 환경 | 전략 | 설정 |
|---|---|---|
| 개발 | `create_all` 자동 생성 | `AUTO_CREATE_ALL=True` (기본) |
| 운영 | Alembic 마이그레이션 | `AUTO_CREATE_ALL=False` + `alembic upgrade head` |

### 마이그레이션 워크플로우
```powershell
# 신규 DB
alembic upgrade head

# 기존 create_all DB (최초 1회)
alembic stamp head

# 모델 변경 후
alembic revision --autogenerate -m "변경 설명"
alembic upgrade head
```

- `render_as_batch=True` — SQLite의 제한적 ALTER 우회
- 마이그레이션 파일: [[src/backend/alembic/versions/17442b2eb4c7_initial_schema.py]]

---

## 빌드·실행

### 백엔드
```powershell
cd backend
.\run.ps1   # 가상환경 생성 + 의존성 설치 + uvicorn 실행
# → http://localhost:8000  (Swagger: /docs)
```

### 프론트엔드
```powershell
cd frontend
npm install ; npm run dev
# → http://localhost:5173
```

### (선택) C++ 가속 빌드
```powershell
cd backend ; .\.venv\Scripts\Activate.ps1
pip install pybind11
cd cpp ; pip install .   # birkman_calc 모듈 설치
# 서버 재시작 시 자동 C++ 경로 사용
```

---

## CORS 설정

허용 오리진: `http://localhost:5173`, `http://localhost:3000` (개발 전용 하드코딩)

→ 운영 노출 시 환경변수로 분리 필요 ([[status#의도적 보류 항목]])
