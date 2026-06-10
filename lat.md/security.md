# 보안 설계

→ 상위: [[overview#핵심 설계 제약]]  
→ 구현 파일: [[src/backend/app/core/security.py]], [[src/backend/app/core/config.py]], [[src/backend/app/api/deps.py]]

---

## JWT 인증

### 토큰 구성

| 항목 | 값 | 설정 위치 |
|---|---|---|
| 알고리즘 | HS256 | `config.py: ALGORITHM` |
| 유효기간 | 24시간 | `config.py: ACCESS_TOKEN_EXPIRE_MINUTES = 60*24` |
| 저장 위치 | localStorage | `authStore.ts` |
| 헤더 방식 | `Authorization: Bearer <token>` | |

> ⚠️ **현재 상태 (P2-16 의도적 보류)**: localStorage JWT는 내부망 도구로 통상 허용 범위.  
> httpOnly 쿠키 전환은 CSRF 방어·인증 흐름 변경 수반 → 외부 노출/민감도 상승 시 진행.

---

## SECRET_KEY 관리 (P0-3 완료)

```python
# config.py: _resolve_secret_key()
# 우선순위:
# 1) 환경변수 SECRET_KEY
# 2) data/.secret_key 파일 (없으면 무작위 생성·저장)
```

- 커밋된 기본키 제거 (이전 취약점 해결)
- `data/.secret_key` → `.gitignore` 대상
- `.env.example` 추가 (안전한 예시 제공)
- 배포별 서로 다른 무작위 키 자동 생성

---

## 계정 관리 흐름

### YAML 기반 계정 동기화

```yaml
# data/users.yaml
users:
  - name: 관리자
    email: admin@company.com
    is_admin: true
  - name: 김민준
    email: minjun.kim@company.com
    is_part_leader: true     # WorkCraft 파트장
    department: engineering  # 미래 집계 대비 저장
```

- 서버 시작 시 `auth_service.load_users_from_yaml()` 자동 실행
- AdminPage의 "YAML 동기화" 버튼으로 즉시 반영
- `is_admin`과 `is_part_leader`는 독립적인 두 축

### 최초 로그인 흐름

```
이메일 입력
  → check-email: 등록 여부 + signup_required 반환
  → (SIGNUP_CODE 활성화 시) 조직 가입 코드 입력
  → set-password: 비밀번호 설정 (이메일 선점 공격 방지)
  → 이후: email + password 로그인
```

### SIGNUP_CODE (P0-2 완료)

```python
# config.py
SIGNUP_CODE: str = ""  # 빈 문자열 = 비활성 (개발 편의)
```

- 활성화 시: 등록 이메일 + 가입 코드 두 조건 모두 충족해야 계정 활성화
- 이메일 선점(임의 비밀번호 설정) 공격 차단
- E2E 테스트: SIGNUP_CODE on/off 두 경로 모두 검증

---

## 권한 계층

### 3개 의존성 레이어 (`deps.py`)

```python
get_current_user          # 로그인한 모든 사용자
get_current_admin         # is_admin=True 사용자만
get_current_part_leader   # is_part_leader=True 사용자만 (WorkCraft 전용)
```

### 권한 매트릭스

| 기능 | 일반 사용자 | 관리자(admin) | 파트장(part_leader) |
|---|---|---|---|
| 내 Birkman 설문·리포트 | ✅ | ✅ | ✅ |
| 공개된 팀 리포트 열람 | ✅ | ✅ | ✅ |
| 계정·가시성 관리 | ❌ | ✅ | ❌ |
| 내 WorkCraft 기록 | ✅ | ✅ | ✅ |
| 공유 템플릿 열람 | ✅ | ✅ | ✅ |
| **익명 집계 대시보드** | ❌ | ❌ | ✅ |
| 개인 WorkCraft 기록 조회 | ❌ | ❌ | ❌ (구조적 금지) |

> **admin과 part_leader는 독립 축**: 한 사람이 둘 다일 수 있으나 권한은 분리.

---

## WorkCraft 권한 계층

→ [[workcraft#파트장 API 제약]] 참조

파트장 API의 보안 불변식은 두 레이어에서 중복 보호:

1. **쿼리 레이어**: `visibility = 'private'` 레코드 물리적 제외
2. **스키마 레이어**: Pydantic 응답 스키마에서 `user_id`·`name`·원문 필드 미포함

---

## 알려진 보안 트레이드오프

| 항목 | 현재 결정 | 트리거 (재검토 시점) |
|---|---|---|
| JWT localStorage 저장 | 내부망 MVP 수준으로 허용 | 외부 노출 또는 민감 데이터 추가 시 |
| httpOnly 쿠키 미전환 | P2-16 의도적 보류 | CSRF 위협 발생 시 |
| Docker 미사용 | P2-17 의도적 보류 | 배포 계획 수립 시 |
| CORS 하드코딩 | 개발 환경 전용 | 운영 배포 시 환경변수 분리 |

→ 전체 보류 항목: [[status#의도적 보류 항목]]
