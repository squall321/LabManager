# 개발 현황 (2026-06-11)

→ 상위: [[overview#개발 현황]]  
→ 개선 계획 원문: `docs/IMPROVEMENT_PLAN.md`  
→ WorkCraft 계획 원문: `docs/WORKCRAFT_STUDIO_PLAN.md`

---

## 전체 요약

| 구분 | 완료 | 전체 | 상태 |
|---|---|---|---|
| P0 보안·데이터 안전 | 4 | 4 | ✅ 전부 완료 |
| P1 사용 경험 | 5 | 5 | ✅ 전부 완료 |
| P2 완성도·확장 | 6 | 9 | ⚠️ 3건 의도적 보류 |
| WorkCraft Phase 1 | — | — | ✅ 완료 |
| WorkCraft Phase 2 | — | — | ✅ 완료 |
| WorkCraft Phase 3 | 0 | 2 | ⬜ 미착수 |

---

## P0 — 보안·데이터 안전 (운영 전 필수)

> **모두 완료** ✅

| ID | 항목 | 상태 | 내용 |
|---|---|---|---|
| P0-1 | DB 마이그레이션 (Alembic) | ✅ | Alembic 도입, SQLite batch 모드, 전체 10테이블 초기 마이그레이션 생성·검증. 운영은 `alembic upgrade head`. |
| P0-2 | 첫 로그인 인증 강화 | ✅ | `SIGNUP_CODE` 도입. 등록 이메일+가입 코드 두 조건 충족해야 계정 활성화. `check-email`이 `signup_required` 반환. → [[security#SIGNUP_CODE]] |
| P0-3 | SECRET_KEY 안전화 | ✅ | 커밋된 기본키 제거. env 우선 + 미설정 시 `data/.secret_key`에 배포별 무작위 키 자동 생성(gitignore). `.env.example` 추가. → [[security#SECRET_KEY 관리]] |
| P0-4 | 테스트·CI | ✅ | pytest 12케이스 + GitHub Actions(백엔드 pytest + 프론트 빌드). → [[tests#테스트 커버리지]] |

---

## P1 — 사용 경험

> **모두 완료** ✅

| ID | 항목 | 상태 | 내용 |
|---|---|---|---|
| P1-5 | 모바일 반응형 | ✅ | 모바일 상단바+햄버거, 슬라이드인 사이드바 드로어(오버레이, 라우트 변경 시 자동 닫힘), `lg:ml-64` 반응형 레이아웃. → [[src/frontend/src/components/Layout/Layout.tsx]] |
| P1-6 | 칸반 터치 DnD | ✅ | HTML5 DnD → `@dnd-kit/core` 교체. Pointer/Touch 센서, 드래그 핸들(그립). 보드 라우트 청크에만 포함. |
| P1-7 | 코드 스플리팅 | ✅ | 라우트 `lazy()` + Suspense, vendor 청크 분리(react/charts/motion). 920KB 단일 청크 → 라우트별 분할. |
| P1-8 | Birkman 모델 고지 | ✅ | 리포트 하단: "자체 성향 모델 · 공식 Birkman과 다를 수 있음 · 평가/선발 근거 아님". → [[birkman#리포트 구조]] |
| P1-9 | 통합 홈 | ✅ | 대시보드에 WorkCraft 성장 스냅샷(불편함/미션/완성/배운점 + 역량 + CTA) 추가. 설문 문항 수 표기 수정(60→실제값). |

---

## P2 — 완성도·확장성

| ID | 항목 | 상태 | 내용 |
|---|---|---|---|
| P2-10 | 미션 상세 보기 | ✅ | 보드 카드 제목 클릭 시 전체 내용 읽기 모달(+수정/명세서 진입). |
| P2-11 | 템플릿→미션 생성 | ✅ | 템플릿 "미션 만들기" → 제목·내용을 미션 빌더에 시드. 공유→재사용 순환 완성. |
| P2-12 | 캘린더 개선 | ✅ | 아젠다에 "일정 미지정" 진행 미션 목록 추가(클릭 시 날짜 지정 편집). |
| P2-13 | 접근성(1차) | ✅ | 토스트 `aria-live`+닫기 라벨, 미션 상세 모달 `role=dialog`/`aria-modal`/ESC, 캘린더 이동 버튼 aria-label. |
| P2-14 | 익명 집계 동의 고지 | ✅ | 불편함 입력 화면에 고지 추가: "내용·이름 비공개, N=5 이상 익명 집계만 파트장 지원 목적으로 활용." |
| P2-18 | C++ 모듈 상태 명시 | ✅ | README에 "미빌드 참조 구현, 채점은 Python 경로" 명시. |

---

## 의도적 보류 항목

> 현재 내부 MVP 규모에서 **과투자**로 판단. 지정 트리거 발생 시 진행.

| ID | 항목 | 트리거 |
|---|---|---|
| P2-15 | 페이지네이션 | 목록 데이터 증가 시 `limit/offset` + 무한 스크롤 |
| P2-16 | 토큰 보관 강화 (httpOnly 쿠키) | 외부 노출 또는 민감도 상승 시 |
| P2-17 | Docker / 운영 배포 산출물 | 배포 착수 시 |

---

## WorkCraft Studio 개발 현황

### Phase 1 — 개인 코어 ✅ 완료

- [x] User 모델 확장 (department, is_part_leader) + YAML 필드 + 동기화
- [x] models/workcraft.py 6개 테이블
- [x] 개인 CRUD API (frictions, missions) + visibility 강제(기본 private)
- [x] prompt_builder.py + 프롬프트 생성 API
- [x] recommendation.py (Birkman 색상·관심영역 → 미션·스킬 추천)
- [x] 프론트 페이지 1·2·3·4 + 모듈 스위처
- [x] VisibilitySelector 컴포넌트 (4단계)
- [x] 공유 불편함 보드 (타인 공유 불편함 → 미션 생성)
- [x] 미션 일정(start/due) + 캘린더 페이지
- [x] 칸반 드래그앤드롭

### Phase 2 — 공유와 익명 집계 ✅ 완료

- [x] 공유 템플릿 라이브러리 (페이지 7) + 익명화 로직
- [x] trends_service.py 익명 집계 + ANONYMITY_MIN_N=5 + get_current_part_leader
- [x] 파트장 익명 대시보드 (페이지 8) + "기여자 N/5" 진행 상태 UI
- [x] 지원 요청 등록

### Phase 3 — 회고·성장 ⬜ 미착수

- [ ] 배운 점 기록 (MissionReview CRUD + ReviewPage.tsx)
- [ ] "성장 관심 영역" 자가 점검 (Birkman 관심영역 데이터 연계)

---

## 진행 로그 (시계열)

| 항목 | 상태 | 비고 |
|---|---|---|
| P0-2 가입 코드 | ✅ | SIGNUP_CODE on/off E2E 통과 |
| P0-3 SECRET_KEY | ✅ | 무작위 영속 키, 커밋 키 제거 |
| P1-8 모델 고지 | ✅ | 리포트 하단 고지 |
| P2-18 C++ 상태 | ✅ | README 명시 |
| P1-7 코드 스플리팅 | ✅ | 라우트 lazy + vendor 분리 |
| P2-11 템플릿→미션 | ✅ | 공유→재사용 순환 |
| P1-9 통합 홈 | ✅ | 대시보드 성장 스냅샷 |
| P2-10 미션 상세 | ✅ | 보드 읽기 모달 |
| P0-4 테스트·CI | ✅ | pytest 12 통과 + GH Actions |
| P0-1 Alembic | ✅ | 초기 마이그레이션 + upgrade 검증 |
| P1-5 모바일 반응형 | ✅ | 드로어 사이드바 + 반응형 레이아웃 |
| P2-14 익명 집계 고지 | ✅ | 불편함 화면 고지 |
| P2-12 캘린더 미지정 | ✅ | 미지정 미션 목록 |
| P2-13 접근성(1차) | ✅ | 토스트/모달/aria 라벨 |
| P1-6 터치 DnD | ✅ | @dnd-kit 핸들 드래그 |

---

## 다음 작업 후보

우선순위순:

1. **WorkCraft Phase 3**: MissionReview CRUD + ReviewPage 구현 (Birkman 관심영역 연계)
2. **P2-15 페이지네이션**: 데이터 증가 확인 후 `limit/offset` 도입
3. **파일럿 운영 착수**: 4주 계획 → [[workcraft#파일럿 운영 계획]]
4. **P2-16/17**: 외부 노출 시점에 토큰 강화 + Docker 배포
