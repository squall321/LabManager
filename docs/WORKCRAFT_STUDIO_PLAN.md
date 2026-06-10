# WorkCraft Studio — 확장 계획서

> LabManager 플랫폼의 두 번째 모듈. 기획 원문: [part_leader_workcraft_mvp.md](../part_leader_workcraft_mvp.md)

## 0. 한 줄 정의

> 구성원이 자신의 반복 업무를 안전하게 기록하고, 이를 작은 개선 미션으로 바꾸며,
> Claude Code 실행 명세서를 생성하고, **원하는 경우에만** 결과물·템플릿을 공유하는 내부 성장 실험 공간.

WorkCraft Studio는 Birkman Workshop과 **같은 플랫폼(LabManager) 위의 별도 모듈**로 들어간다.
계정/인증/레이아웃/권한 인프라를 그대로 재사용하고, 도메인(업무 개선 미션)만 새로 얹는다.

---

## 1. 핵심 설계 원칙 (절대 원칙)

기획서가 반복해서 강조하는 **신뢰**가 이 모듈의 생사를 가른다. 기능보다 **데이터 공개 범위·표현·운영**이 우선이다.

| 원칙 | 시스템 차원의 강제 방법 |
|---|---|
| 개인 내용은 기본 비공개 | 모든 레코드 `visibility = 'private'` 기본값. 파트장 조회 쿼리는 `private` 레코드를 **물리적으로 제외** |
| 파트장은 개인이 아니라 시스템 문제를 본다 | 파트장 API는 개인 레코드를 반환하지 않고 **익명 집계만** 반환 (이름·user_id 미포함) |
| 공유는 사용자가 선택 | `visibility` 4단계: `private` / `leader_only` / `team_public` / `anonymous_template` |
| 익명 템플릿 공유 | 템플릿화 시 작성자 식별정보 제거(anonymized), 집계에서도 분리 |
| "진단·평가·갭·부족" 용어 회피 | UI 카피는 "관심·개선·실험·미션·기록" 어휘만 사용 |

> ⚠️ 기존 Birkman 모듈의 "관리자(admin)" 권한과 WorkCraft의 "파트장(part_leader)"은 **다른 축**이다.
> 관리자는 계정/시스템 관리자, 파트장은 익명 집계만 보는 스폰서. 한 사람이 둘 다일 수 있으나 권한은 분리해서 다룬다.

---

## 2. 기존 아키텍처에 어떻게 녹이는가

현재 LabManager 구조와 1:1로 매핑한 통합 지점:

```
backend/app/
├── models/
│   ├── user.py            # [수정] department, is_part_leader 컬럼 추가
│   ├── survey.py          # (기존 Birkman — 유지)
│   └── workcraft.py       # [신규] WorkFriction, GrowthMission, ClaudePrompt,
│                          #        MissionReview, SharedTemplate, SupportRequest
├── schemas/
│   └── workcraft.py       # [신규] Pydantic 스키마
├── services/
│   ├── prompt_builder.py  # [신규] Claude Code 실행 명세서 생성기 (C++ 불필요, 템플릿 엔진)
│   └── trends_service.py  # [신규] 익명 집계 로직 (개인정보 제거)
├── api/
│   ├── workcraft.py       # [신규] 개인 영역 CRUD (frictions, missions, prompts, reviews)
│   ├── templates.py       # [신규] 공유 템플릿 라이브러리
│   └── leader.py          # [신규] 파트장용 익명 대시보드 (집계 전용)
└── main.py                # [수정] 신규 라우터 3개 include

frontend/src/
├── pages/workcraft/       # [신규] FrictionsPage, MissionBuilderPage, PromptStudioPage,
│                          #        ActionBoardPage, TemplateLibraryPage, LeaderTrendsPage
├── components/workcraft/  # [신규] MissionCard, VisibilitySelector, PromptPreview, KanbanColumn
├── components/Layout/     # [수정] 사이드바에 모듈 스위처(Birkman / WorkCraft) 추가
└── services/api.ts        # [수정] workcraft API 클라이언트 추가
```

**재사용하는 기존 자산**: JWT 인증(`core/security.py`), `deps.get_current_user`, Zustand authStore,
Tailwind 디자인 시스템(`btn-primary`, `card`, glass UI), Framer Motion, Recharts.

**C++ 바인딩과의 관계**: WorkCraft MVP는 무거운 수치 계산이 없으므로 C++ 모듈을 쓰지 않는다.
단, 후속 단계에서 "익명 트렌드 클러스터링/유사 미션 추천" 같은 계산이 필요해지면
기존 `cpp/` 패턴(pybind11)을 그대로 확장해 `workcraft_calc` 모듈을 추가할 수 있다.

---

## 3. 데이터 모델 (SQLAlchemy)

기획서 §13 기반. 모든 사용자 작성 테이블은 `visibility` 컬럼을 가진다.

```python
# models/workcraft.py (요약)
class Visibility(str, enum.Enum):
    private = "private"
    leader_only = "leader_only"
    team_public = "team_public"
    anonymous_template = "anonymous_template"

class WorkFriction(Base):       # 업무 불편함 카드
    id, user_id, title, description, friction_type,
    frequency, expected_effect, related_skill,
    claude_feasible(bool), visibility, created_at

class GrowthMission(Base):      # 업무 개선 미션
    id, user_id, work_friction_id(nullable),
    title, problem, goal, output, scope,
    success_criteria, deadline, learning_goal,
    status, visibility, created_at, updated_at

class ClaudePrompt(Base):       # Claude Code 실행 명세서
    id, mission_id, prompt_text, prompt_type,
    visibility, created_at

class MissionReview(Base):      # 배운 점 기록
    id, mission_id, result_summary, learned_skill,
    business_impact, claude_good_points, claude_bad_points,
    next_action, visibility, created_at

class SharedTemplate(Base):     # 공유 템플릿 (익명 가능)
    id, source_type, source_id, title, category,
    description, anonymized(bool), created_at

class SupportRequest(Base):     # 지원 요청
    id, user_id, request_type, description,
    anonymous(bool), status, created_at
```

`User` 모델 확장: `department`(str), `is_part_leader`(bool). 기존 `is_admin`과 독립.
YAML 계정 파일(`data/users.yaml`)에도 `department`, `is_part_leader` 필드를 선택적으로 추가.

미션 상태 값(기획 §11.4): `Idea → Prompt Ready → In Progress → Review → Done → Shared`.

---

## 4. API 설계

```
# 개인 영역 (본인 것만 — get_current_user 스코프)
GET/POST/PUT/DELETE  /api/workcraft/frictions
GET/POST/PUT/DELETE  /api/workcraft/missions
POST                 /api/workcraft/prompts/generate   # 미션 → 실행 명세서 생성
GET                  /api/workcraft/prompts/{mission_id}
GET/POST             /api/workcraft/reviews

# 공유 영역
GET   /api/templates                  # team_public + anonymous_template 만
POST  /api/templates/share            # 내 미션/프롬프트를 템플릿으로 공유
POST  /api/workcraft/support-requests

# 파트장 영역 (get_current_part_leader — 익명 집계 전용, 개인 레코드 반환 금지)
GET   /api/leader/anonymous-trends    # 공통 불편함 TOP, 관심 역량 집계
GET   /api/leader/shared-outcomes     # team_public 으로 공개된 산출물
GET   /api/leader/support-requests    # 익명 지원 요청 집계
```

**보안 핵심**: `/api/leader/*`는 새 의존성 `get_current_part_leader`를 쓰고,
응답 직렬화 단계에서 `user_id`·`name`·원문 필드를 **스키마 레벨에서 배제**한다(집계 수치/카테고리만).

---

## 5. Claude Code 실행 명세서 생성기 (`prompt_builder.py`)

웹사이트가 LLM을 내장하지 않고도, 미션 입력을 기획서 §22의 12블록 구조 프롬프트로 조립한다.

```
Goal / Context / Current Problem / Input Data / Expected Output /
Requirements / Constraints / Files likely involved /
Acceptance Criteria / Test Plan / Do Not Modify / Implementation Steps
```

순수 템플릿 문자열 포매팅이라 외부 의존성이 없다.
"먼저 프로젝트 구조를 파악하고 수정 계획을 제안한 뒤, 승인 후 구현" 가드 문구를 항상 말미에 포함한다.

---

## 6. 화면 흐름 (프론트엔드 6페이지)

| # | 페이지 | 경로 | 핵심 |
|---|---|---|---|
| 1 | 업무 불편함 카드 | `/workcraft/frictions` | 부담 없는 기록, 유형 체크박스 |
| 2 | 업무 개선 미션 만들기 | `/workcraft/missions/new` | 불편함 → 실행 가능한 미션 카드 |
| 3 | Claude 실행 명세서 | `/workcraft/missions/:id/prompt` | 12블록 프롬프트 생성·복사 |
| 4 | 내 미션 보드 | `/workcraft/board` | 칸반(Idea~Shared), **본인만** |
| 5 | 공유 템플릿 라이브러리 | `/workcraft/templates` | 익명 템플릿 열람·재사용 |
| 6 | 파트장 익명 대시보드 | `/workcraft/leader` | 공통 불편함 TOP·지원 요청 집계 |

사이드바에 **모듈 스위처**를 추가해 Birkman Workshop ↔ WorkCraft Studio를 전환한다.

> **카피 원칙 (중요):** 기획서 §6은 "이 사이트는 평가 도구가 아닙니다"라는 안내를 제안하지만,
> 평가·감시를 **부정하는 문장은 오히려 그 프레임을 환기**시킨다("코끼리를 생각하지 마" 효과).
> 따라서 진입 안내는 부정형을 쓰지 않고 **긍정 가치와 사용자 통제권만** 서술한다.
> 예: "반복 업무를 작은 개선 미션으로 바꾸는 개인 작업 공간입니다. 기록과 공유 범위는 언제나 본인이 정합니다."

---

## 7. 단계별 개발 로드맵

기획서 §19 우선순위를 LabManager 구현 단위로 변환:

### Phase 1 — 개인 코어 (MVP 1순위) ✅ 완료
- [x] `User` 모델 확장(department, is_part_leader) + YAML 필드 + 동기화 반영
- [x] `models/workcraft.py` 6개 테이블
- [x] 개인 CRUD API (frictions, missions) + `visibility` 강제(기본 private)
- [x] `prompt_builder.py` + 프롬프트 생성 API
- [x] `recommendation.py` (본인 BirkmanReport 기반 미션/스킬 추천, 순수 함수)
- [x] 프론트 페이지 1·2·3·4 + 모듈 스위처
- [x] 공유 범위 셀렉터 컴포넌트(4단계)
- [x] (추가) 공유 불편함 보드 — 타인의 공유 불편함에서 미션 생성
- [x] (추가) 미션 일정(start/due) + 캘린더 페이지
- [x] (추가) 칸반 드래그앤드롭

### Phase 2 — 공유와 익명 집계 (2순위) ✅ 완료
- [x] 공유 템플릿 라이브러리(페이지 5) + 익명화 로직
- [x] `trends_service.py` 익명 집계 + `ANONYMITY_MIN_N=5` 임계값 + `get_current_part_leader`
- [x] 파트장 익명 대시보드(페이지 6) + "기여자 N/5" 진행 상태 UI
- [x] 지원 요청 등록

### Phase 3 — 회고·성장 (3순위)
- [ ] 배운 점 기록(MissionReview) + 회고 템플릿
- [ ] "성장 관심 영역" 자가 점검 (← Birkman 관심영역 데이터와 연계 가능)

### 후순위 (신뢰 형성 후)
- 의욕 점수·번아웃 체크·심리적 안전감 — 기획서 §12 경고대로 **초기 배제**
- AI API 직접 연동(웹 내장 생성)

---

## 8. 파일럿 운영 (기획서 §15)

4주 희망자 파일럿. 목표는 사용량이 아니라 **좋은 성공 사례 2~3개**.

| 주차 | 목표 | 산출물 |
|---:|---|---|
| 1 | 업무 불편함 찾기 | 불편함 카드 1개 |
| 2 | 미션으로 전환 | Mission Card + Claude Prompt 초안 |
| 3 | Claude Code로 실행 | 작은 결과물 1개 |
| 4 | 선택적 공유 | 재사용 가능한 템플릿/사례 |

성공 지표(§18): 불편함 카드 수, 미션 생성 수, 프롬프트 생성 수, 공유/재사용 템플릿 수, 지원 요청 수.
**"누가 많이 했는가"가 아니라 "어떤 문제가 반복되고 어떤 지원이 필요한가"를 측정.**

---

## 9. 결정된 설계 사항 (2026-06-10 확정)

| # | 질문 | 결정 | 구현 함의 |
|---|---|---|---|
| 1 | 파트장 권한 부여 | **YAML 고정** (`is_part_leader: true`) | `users.yaml`에 필드 추가, 로그인 동기화 시 반영. UI 토글 없음 (admin과 독립 축) |
| 2 | 집계 범위 | **전체 단일 집계** | `department`는 저장만 해두고(미래 대비) 집계는 파트 전체 1개로 |
| 3 | 익명 최소 표본 | **N = 5** | 항목별 기여자 5명 미만이면 비표시. 파일럿(3~5명) 동안엔 대부분 가려질 수 있음 |
| 4 | Birkman 연계 | **강한 연계 (미션 추천)** | WorkCraft가 본인 `BirkmanReport`를 읽어 색상 유형·상위 관심영역 기반으로 미션/스킬/템플릿 추천 |

### 9.1 N=5 임계값과 파일럿의 긴장 (주의 설계)

파일럿은 3~5명이라 N=5면 초기엔 대시보드 항목 대부분이 가려질 수 있다.
이는 "개인이 역추적되지 않는다"는 신뢰 원칙을 사용량보다 우선한 **의도된 선택**이다.
대시보드는 빈 화면 대신 다음처럼 동작한다.

- 항목별로 `기여자 5명 이상일 때 공개됩니다 (현재 N/5)` 진행 표시 → 가린다는 사실 자체를 투명하게
- 개인 역추적이 불가능한 **순수 총계**(예: 파트 전체 생성 미션 수)는 임계값 없이 노출
- 표본이 쌓이면 자동 공개, 별도 조작 불필요
- `trends_service.ANONYMITY_MIN_N = 5` 상수로 두어 조직 규모에 따라 추후 조정

### 9.2 Birkman → 미션 추천 메커니즘 (강한 연계)

- `services/recommendation.py`를 **순수 함수**로 두고 본인 `BirkmanReport.report_data`를 입력으로 받는다(테스트 용이).
- **색상 유형별 추천 톤**: 빨강(행동가)→"빠른 결과가 보이는 자동화", 초록(소통가)→"협업·공유형 도구", 노랑(조직가)→"반복 정리·체계화 자동화", 파랑(기획가)→"구조 설계·분석형 미션".
- **상위 관심영역**(예: 과학/기술, 수리/분석)에 맞는 스킬 태그·템플릿을 우선 노출.
- 추천은 **본인 화면(미션 만들기·템플릿 라이브러리)에서만** 노출하고 파트장·타인에겐 절대 노출하지 않는다 → 비공개 원칙 유지.
- Birkman 미완료 사용자는 추천 없이 일반 흐름으로 동작(graceful degradation).

---

## 10. 요약

WorkCraft Studio는 LabManager의 인증·레이아웃·디자인 인프라를 재사용하는 **두 번째 모듈**이며,
가장 큰 구현 난제는 기능이 아니라 **"파트장이 개인을 볼 수 없다"는 불변식을 코드 레벨에서 보장**하는 것이다.
이를 위해 `visibility` 기본 비공개 + 파트장 API의 익명-집계-전용 직렬화를 아키텍처의 1급 제약으로 둔다.
