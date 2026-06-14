# LabManager — 프로젝트 개요

> **한 줄 정의:** 구성원이 자신의 강점을 발견하고, 반복 업무를 개선하며, 스스로 성장 방향을 그려가도록 돕는 **모듈형 HR 워크스페이스**.

기록과 리포트는 온전히 당신의 것입니다.

---

## 플랫폼 전체 구조

```
LabManager (플랫폼)
├── Module 1: Birkman Workshop  ← [[birkman#Birkman Workshop 모듈]]     ✅ 완료
├── Module 2: WorkCraft Studio  ← [[workcraft#WorkCraft Studio 모듈]]  ✅ Phase 1·2 완료
└── Module 3: Assessments       ← [[assessments#Assessment 프레임워크]] ✅ 완료
```

두 모듈은 **같은 플랫폼 인프라를 공유**한다.

| 공유 자산 | 내용 |
|---|---|
| 계정·인증 | JWT, YAML 계정 동기화, `get_current_user` 의존성 |
| 데이터베이스 | SQLite + SQLAlchemy + Alembic 마이그레이션 |
| 디자인 시스템 | Tailwind CSS (`btn-primary`, `card`, glass UI), Framer Motion, Recharts |
| 레이아웃 | [[src/frontend/src/components/Layout/Layout.tsx]] — 모바일 드로어 사이드바 |
| 권한 계층 | [[security#권한 계층]] |

---

## 모듈 맵

| 모듈 | 핵심 가치 | 주요 파일 | 상태 |
|---|---|---|---|
| **Birkman Workshop** | 성향·강점 진단 + 자동 리포트 | [[src/backend/app/services/birkman_engine.py]], [[src/backend/app/services/birkman_data.py]] | ✅ 완료 |
| **WorkCraft Studio** | 업무 개선 미션 + Claude 실행 명세서 | [[src/backend/app/api/workcraft.py]], [[src/backend/app/services/prompt_builder.py]] | ✅ Phase 1·2 완료 |
| **Assessments** | 재사용 진단 프레임워크 (심리적 안전감·SDT) | [[src/backend/app/services/assessment_data.py]], [[src/backend/app/services/assessment_engine.py]] | ✅ 완료 |

---

## 기술 스택 요약

→ 상세: [[architecture#기술 스택]]

- **프론트엔드**: TypeScript + Vite + React 18 + Tailwind CSS
- **백엔드**: Python 3.11+ + FastAPI + SQLAlchemy + SQLite
- **계산 모듈**: C++ (pybind11) — 현재 미빌드, Python fallback 사용
- **인증**: JWT (24h, localStorage) — [[security#JWT 인증]]

---

## 핵심 설계 제약

1. **개인 데이터는 기본 비공개** (`visibility = 'private'`) — [[workcraft#Visibility 불변식]]
2. **파트장은 개인을 볼 수 없다** — 익명 집계(N≥5)만 반환 — [[workcraft#파트장 API 제약]]
3. **평가·진단 프레임 금지** — UI 카피는 "관심·개선·실험·미션·기록" 어휘만 사용
4. **C++ 바인딩은 선택적 가속** — 미빌드 시 Python 동일 알고리즘으로 자동 fallback

---

## 개발 현황 (2026-06-12)

→ 전체 진행 현황: [[status#개발 현황]]

| 구분 | 완료 | 보류 |
|---|---|---|
| P0 보안·데이터 | 4/4 ✅ | — |
| P1 사용 경험 | 5/5 ✅ | — |
| P2 완성도·확장 | 6/9 ✅ | 3건 의도적 보류 |
| WorkCraft Phase 1 | ✅ 완료 | — |
| WorkCraft Phase 2 | ✅ 완료 | — |
| WorkCraft Phase 3 | ⬜ 미착수 | 배운 점 기록·성장 회고 |
| **Assessments** | ✅ 완료 | 진단 도구 추가 가능 |
