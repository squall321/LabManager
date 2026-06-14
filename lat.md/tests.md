# 테스트 명세

require-code-mention: true

→ 상위: [[overview#개발 현황]]  
→ 구현: [[src/backend/tests/]]  
→ 상태: [[status#P0 — 보안·데이터 안전]]

---

## 테스트 환경 구성

[[src/backend/tests/conftest.py]]

- **격리 DB**: `data/test_ci.db` (테스트 시작 시 초기화, 세션 공유)
- **환경변수**: `DATABASE_URL` + `SECRET_KEY=test-secret-key-for-ci` + `SIGNUP_CODE=""` (기본 비활성)
- **TestClient**: FastAPI lifespan 실행 포함 (YAML 사용자 자동 로딩)
- **`login` 픽스처**: 이메일로 계정 활성화(set-password) 또는 재로그인 후 `Authorization` 헤더 반환
- **테스트 격리 개선** (커밋 e0506ee): 테스트당 DB 리셋 + 재시드 → 순서 독립성 보장

---

## 인증 테스트 (`test_auth.py`)

### TC-AUTH-1: 미등록 이메일 거부
- `POST /api/auth/check-email` → 404
- 검증: 등록되지 않은 이메일은 진입 불가

### TC-AUTH-2: 비밀번호 설정 및 로그인
- `set-password` → 200, 응답에 email 포함
- 잘못된 비밀번호 → 401
- 올바른 비밀번호 → 200
- 검증: 비밀번호 해싱·검증 정상 동작

### TC-AUTH-3: SIGNUP_CODE 강제
- `SIGNUP_CODE = "LAB-CODE"` 설정 시
  - `check-email` → `signup_required: True`
  - 코드 없이 set-password → 403
  - 틀린 코드 → 403
  - 올바른 코드 → 200
- 검증: 이메일 선점 공격 차단, on/off 동작

### TC-AUTH-4: 토큰 없이 보호된 엔드포인트 접근
- `GET /api/reports/me` 토큰 없이 → 401/403
- 검증: 인증 미들웨어 동작

---

## WorkCraft 격리·소유권 테스트 (`test_workcraft.py`)

### TC-WC-1: 불편함 기본 비공개 + 사용자 격리
- 사용자 A 불편함 생성 → `visibility == "private"` 확인
- A 목록에는 보임, B 목록에는 미포함
- B가 A 불편함 수정/삭제 시도 → 404
- 검증: 기본값 private + 소유권 격리

### TC-WC-2: 미션·프롬프트·소유권
- 미션 생성 → `status == "idea"`
- 프롬프트 생성 → 응답에 `"Acceptance Criteria"` 포함 + status `→ "prompt_ready"` 전환 확인
- 타인이 미션 수정 시도 → 404
- 검증: 12블록 프롬프트 생성 + FSM 전환 + 소유권 보호

### TC-WC-3: 공유/역추적 차단
- `visibility = "private"` 불편함 → `/frictions/shared` 목록에 미노출
- `visibility = "team_public"` 불편함 → 목록에 노출
- 비공개 불편함을 origin으로 타인이 미션 생성 시도 → 404
- 공개 불편함을 origin으로 미션 생성 → 200
- 검증: 공개 범위 경계 + 역추적 차단

### TC-WC-4: Birkman 미연동 시 graceful degradation
- Birkman 미완료 사용자 추천 요청 → `has_birkman` 필드 포함 응답
- 검증: 설문 미완료 사용자 에러 없이 처리

---

## 파트장 권한·익명 집계 테스트 (`test_leader_growth.py`)

### TC-LG-1: 파트장 권한 강제
- 일반 구성원이 `GET /api/leader/anonymous-trends` → 403
- 검증: `get_current_part_leader` 의존성 동작

### TC-LG-2: 익명 최소 표본 N=5
- 서로 다른 5명이 동일 유형 불편함 생성
- 파트장 집계 조회 → `anonymity_min_n == 5`, 해당 카테고리 `visible == True`, `contributors >= 5`
- **개인 식별 정보 부재 확인**: 응답 전체에 `"user_id"` 미포함
- 검증: N=5 임계값 + 익명성 보장 + 개인정보 누출 방지

### TC-LG-3: 템플릿 익명 처리
- `anonymized=False` 템플릿 → `owner_name != "익명"`
- `anonymized=True` 템플릿 → `owner_name == "익명"`
- 다른 구성원도 목록 조회 가능
- 검증: 선택적 익명 공유 동작

### TC-LG-4: 성장 회고 → 역량 집계 흐름
- 미션 생성 + 회고 작성 → 미션 `status → "done"` 자동 전환
- `/api/workcraft/growth` 응답:
  - `counts.completed >= 1`
  - `counts.learnings >= 1`
  - `skills`에 회고·학습목표에서 언급한 기술 포함
  - `milestones`에 달성 항목 존재
- 검증: FSM done 전환 + 역량 병합 집계

---

## CI 구성 (GitHub Actions)

```yaml
# .github/workflows/ci.yml (요약)
jobs:
  backend:
    - pip install -r requirements.txt -r requirements-dev.txt
    - pytest tests/ -v

  frontend:
    - npm ci
    - npm run build
```

- **백엔드**: pytest **15케이스** 전체 실행
- **프론트엔드**: Vite 프로덕션 빌드 (타입 에러·번들 오류 감지)
- PR/push 시 자동 실행

---

## Assessment 테스트 (`test_assessments.py`)

### TC-AS-1: 목록 조회 + SDT 제출·채점
- `/assessments` 목록에 `psych_safety`, `sdt` 두 키 포함 확인
- SDT 전체 5점 응답 제출 → `scope == "individual"`, 3개 하위척도 키 존재, `autonomy.score == 100.0`, `overall == 100.0`
- 결과 재조회 200, 목록에 `completed == True` 반영
- 검증: 채점 공식 정확성 + upsert 동작

### TC-AS-2: 심리적 안전감 역채점 정확성
- 정방향 문항: 응답 5, 역채점 문항: 응답 1 → 역채점 후 모두 유효값 5
- 최종 `overall == 100.0`
- 검증: `_effective(item, raw) = 6 - raw` (reverse=True) 정확성

### TC-AS-3: 팀 집계 임계값 + 접근 제어
- 5명이 psych_safety 응답 제출
- 일반 구성원이 `/team` 접근 → 403
- 파트장이 `/team` 접근 → `visible == True`, `n >= 5`, `overall` + `item_means` 포함, `"user_id"` 미포함
- 파트장이 SDT (개인 진단)의 `/team` 접근 → 400
- 검증: `get_current_part_leader` 강제 + scope 검증 + 개인 정보 미노출

**총 테스트 케이스: 15개** (인증 4 + WorkCraft 4 + 파트장·성장 4 + Assessment 3)

---

## 테스트 대상 외 (의도적 비포함)

| 영역 | 이유 |
|---|---|
| 리포트 내러티브 텍스트 내용 | 자유 형식 문자열, 내용보다 구조 검증이 중요 |
| 프론트엔드 E2E | 현재 규모에서 단위+통합 테스트로 충분 |
| C++ 계산 모듈 | 현재 미빌드, Python fallback으로 채점 검증 |
| 페이지네이션 | P2-15 의도적 보류 → [[status#의도적 보류 항목]] |
