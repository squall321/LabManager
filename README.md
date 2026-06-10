# LabManager · HR Platform

인적 자원(HR) 관리를 위한 통합 플랫폼입니다.
**TypeScript + Vite + React** 프론트엔드, **FastAPI** 백엔드, 그리고 복잡한 계산을 담당하는 **C++ (pybind11)** 모듈로 구성되어 있습니다.

첫 번째 모듈은 **Birkman Workshop** — 한글 버크만 진단 설문과 자동 리포트 분석 기능입니다.

---

## 🏗️ 아키텍처

```
LabManager/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── core/               # 설정, 보안(JWT), DB
│   │   ├── models/             # SQLAlchemy 모델 (User, Survey, Report)
│   │   ├── schemas/            # Pydantic 스키마
│   │   ├── services/           # 비즈니스 로직
│   │   │   ├── auth_service.py     # YAML 계정 로딩, 인증
│   │   │   ├── birkman_engine.py   # 점수 계산 (C++ 우선, Python fallback)
│   │   │   └── report_service.py   # 리포트 내러티브 생성
│   │   ├── api/                # REST 라우터 (auth, survey, reports, admin)
│   │   └── main.py             # FastAPI 진입점
│   ├── cpp/                    # C++ 계산 모듈 (pybind11)
│   │   ├── birkman_calc/
│   │   │   ├── calculator.cpp/.h   # 점수 계산 엔진
│   │   │   └── bindings.cpp         # Python 바인딩
│   │   ├── CMakeLists.txt
│   │   └── setup.py
│   └── data/
│       └── users.yaml          # ★ 계정 정의 파일 (이름/이메일)
└── frontend/                   # React + Vite + Tailwind
    └── src/
        ├── components/         # Layout, birkman 시각화 컴포넌트
        ├── pages/              # Login, Dashboard, Survey, Report, Team, Admin
        ├── services/api.ts     # API 클라이언트
        └── store/              # Zustand 인증 스토어
```

### 디자인 패턴 — C++ ↔ FastAPI 바인딩
복잡한 점수 계산은 C++로 구현하고 `pybind11`로 Python에 바인딩합니다.
[birkman_engine.py](backend/app/services/birkman_engine.py)는 C++ 모듈(`birkman_calc`)이 빌드되어 있으면 이를 사용하고, 없으면 **동일 알고리즘의 Python 구현으로 자동 fallback**합니다. 따라서 C++ 빌드 없이도 즉시 동작합니다.

> **C++ 모듈 현재 상태:** 기본 배포에서는 **빌드되지 않은 참조 구현**이며(`USE_CPP=False`), 실제 채점은 Python 경로로 수행·검증됩니다. C++은 동일 가중치를 인자로 받아 같은 결과를 내도록 작성돼 있으나, 성능 가속이 필요할 때 선택적으로 빌드하는 용도입니다.

---

## 🚀 실행 방법

### 1) 백엔드
```powershell
cd backend
.\run.ps1          # 가상환경 생성 + 의존성 설치 + 서버 실행
```
서버: http://localhost:8000 · API 문서: http://localhost:8000/docs

### 2) 프론트엔드
```powershell
cd frontend
npm install
npm run dev
```
앱: http://localhost:5173

### 3) (선택) C++ 모듈 빌드 — 성능 가속
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install pybind11
cd cpp
pip install .       # birkman_calc 모듈을 가상환경에 설치
```
빌드 후 서버를 재시작하면 자동으로 C++ 엔진을 사용합니다.

---

## 🗄️ 데이터베이스 마이그레이션 (Alembic)

개발 중에는 서버 시작 시 `create_all`이 누락 테이블을 자동 생성하므로 별도 작업이 필요 없습니다.
**운영**에서는 데이터를 보존하며 스키마를 변경하기 위해 Alembic을 사용합니다.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1

# 신규 DB에 전체 스키마 적용
alembic upgrade head

# 이미 create_all 로 만든 기존 DB라면 최초 1회만 현재 버전으로 표시
alembic stamp head

# 모델 변경 후 새 마이그레이션 자동 생성 → 검토 후 적용
alembic revision --autogenerate -m "변경 설명"
alembic upgrade head
```

> SQLite의 제한적 ALTER를 위해 `render_as_batch=True`로 구성되어 있습니다. 마이그레이션 파일은
> [backend/alembic/versions/](backend/alembic/versions/)에 커밋됩니다.
>
> 운영 시 `AUTO_CREATE_ALL=false`로 두면 시작 시 자동 테이블 생성을 끄고 Alembic만으로 스키마를 관리합니다.

---

## 👤 계정 관리 (YAML 기반)

[backend/data/users.yaml](backend/data/users.yaml)에 이름과 이메일을 추가하면
서버 시작 시 **자동으로 계정이 생성**됩니다.

```yaml
users:
  - name: 관리자
    email: admin@company.com
    is_admin: true
  - name: 김민준
    email: minjun.kim@company.com
```

- **최초 로그인**: 등록된 이메일 입력 → 본인이 직접 비밀번호 설정
- **이후 로그인**: 이메일 + 비밀번호
- 관리자 페이지에서 **YAML 동기화** 버튼으로 신규 계정 즉시 반영

> 기본 관리자 계정: `admin@company.com` (최초 로그인 시 비밀번호 설정)

---

## 📋 Birkman Workshop 흐름

1. **설문 (100문항, 3섹션)** — 문항·채점 규칙은 [birkman_data.py](backend/app/services/birkman_data.py) 단일 소스에서 관리
   - 섹션 1: 나의 행동과 성향 (자기 평가, 36문항 · 11개 컴포넌트 전체 커버)
   - 섹션 2: 사람과 환경에 대한 생각 (타인 인식 → 내면의 욕구, 32문항 · 일부 역채점)
   - 섹션 3: 나의 관심 영역 (흥미, 32문항 · 8개 영역 균등)
2. **자동 분석** → 캐노니컬 4색상 유형(빨강 행동가/초록 소통가/노랑 조직가/파랑 기획가), 라이프스타일 그리드(평소 행동·내면의 욕구 **이중 좌표**), 11개 컴포넌트, 8개 관심 영역, 유형 강도(intensity)
3. **리포트** → 평소 행동·욕구·스트레스·팀 역할·소통법·성장 포인트 내러티브
4. **공개/비공개** → 본인이 직접 토글, 관리자도 제어 가능
5. **팀 리포트** → 공개된 동료 리포트 열람

> 채점 알고리즘: 컴포넌트별 가중 평균 응답(1~5)을 0~99로 선형 매핑, Usual/Need를 분리 산출하고
> 격차 기반으로 Stress를 모델링합니다. C++ 모듈이 빌드된 경우 동일 가중치를 인자로 받아 계산하므로 결과가 일치합니다.

---

## 🔌 주요 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/check-email` | 이메일 등록 여부 확인 |
| POST | `/api/auth/set-password` | 최초 비밀번호 설정 |
| POST | `/api/auth/login` | 로그인 |
| GET  | `/api/survey/questions/{section}` | 섹션별 문항 조회 |
| POST | `/api/survey/submit/{id}` | 섹션 응답 제출 (마지막 섹션 시 자동 분석) |
| GET  | `/api/reports/me` | 내 리포트 |
| PATCH| `/api/reports/me/visibility` | 공개/비공개 전환 |
| GET  | `/api/reports/public` | 공개 리포트 목록 |
| GET  | `/api/admin/stats` | 관리자 통계 |

---

## 🧩 향후 HR 모듈 확장
모듈식 구조로 설계되어 있어, 인증·레이아웃·디자인 인프라를 재사용해 다른 HR 모듈을 얹을 수 있습니다.

- **다음 모듈: WorkCraft Studio** — 구성원이 반복 업무를 작은 개선 미션으로 바꾸고 Claude Code 실행 명세서를 만드는 "안전한 성장 실험실". 상세 확장 계획: [docs/WORKCRAFT_STUDIO_PLAN.md](docs/WORKCRAFT_STUDIO_PLAN.md)
- 그 외 360도 피드백, OKR 관리 등도 동일 패턴으로 추가 가능

> ⚠️ 본 버크만 구현은 교육/워크숍 목적의 자체 점수 모델입니다. 공식 Birkman Method®와는 별개입니다.
