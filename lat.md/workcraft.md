# WorkCraft Studio 모듈

→ 상위: [[overview#모듈 맵]]  
→ 보안/권한: [[security#WorkCraft 권한 계층]]  
→ 아키텍처: [[architecture#디렉터리 구조]]

---

## WorkCraft Studio 모듈

### 한 줄 정의
> 구성원이 자신의 반복 업무를 안전하게 기록하고, 작은 개선 미션으로 바꾸며,  
> Claude Code 실행 명세서를 생성하고, **원하는 경우에만** 결과물·템플릿을 공유하는 내부 성장 실험 공간.

LabManager의 **두 번째 모듈**. 기존 인증·레이아웃·디자인 인프라를 완전 재사용.

---

## 핵심 설계 원칙 (불변식)

> 이 원칙들은 기능 편의보다 **우선**하며, 코드 레벨에서 강제된다.

| 원칙 | 강제 방법 |
|---|---|
| 개인 내용은 기본 비공개 | 모든 레코드 `visibility = 'private'` 기본값. 파트장 쿼리는 private 레코드를 **물리적으로 제외** |
| 파트장은 개인을 볼 수 없다 | `/api/leader/*` 응답 스키마에서 `user_id`·`name`·원문을 **스키마 레벨에서 배제** |
| 공유는 사용자가 선택 | `visibility` 4단계로 사용자가 직접 제어 |
| 익명 템플릿 공유 | 템플릿화 시 작성자 식별정보 제거 (`anonymized=True`) |
| 평가·진단 언어 금지 | UI 카피는 "관심·개선·실험·미션·기록" 어휘만. 부정형 사용 금지 ("코끼리를 생각하지 마" 효과) |

---

## Visibility 불변식

### 4단계 공개 범위

```python
class Visibility(str, enum.Enum):
    private           = "private"           # 본인만
    leader_only       = "leader_only"       # 파트장 익명 집계에 포함
    team_public       = "team_public"       # 팀원 열람 가능
    anonymous_template = "anonymous_template"  # 작성자 식별 제거 후 공유
```

- **기본값**: 항상 `private`
- **파트장 API**: `leader_only` 이상만 집계. 단, 응답에 개인 식별 정보 미포함.

→ 구현: [[src/backend/app/schemas/workcraft.py]]

---

## 파트장 API 제약

### `get_current_part_leader` 의존성

`/api/leader/*` 라우터는 새 의존성 `get_current_part_leader`를 사용:
- `is_part_leader=True` 사용자만 접근
- 응답은 집계 수치·카테고리만 포함 (개인 레코드 반환 금지)

### 익명 최소 표본 N=5

```python
# trends_service.py
ANONYMITY_MIN_N = 5  # 기여자 5명 미만 항목은 비표시
```

- N<5 항목: `"기여자 5명 이상일 때 공개됩니다 (현재 N/5)"` 진행 표시
- 순수 총계(파트 전체 생성 미션 수 등)는 임계값 없이 노출
- 파일럿(3~5명)에서는 대부분 가려질 수 있음 — **의도된 신뢰 우선 선택**

---

## 데이터 모델

[[src/backend/app/models/workcraft.py]] 에 정의된 6개 테이블:

| 모델 | 설명 | 핵심 컬럼 |
|---|---|---|
| `WorkFriction` | 업무 불편함 카드 | title, friction_type, frequency, claude_feasible, visibility |
| `GrowthMission` | 업무 개선 미션 | title, problem, goal, output, scope, success_criteria, deadline, status, visibility |
| `ClaudePrompt` | Claude 실행 명세서 | prompt_text, prompt_type, mission_id, visibility |
| `MissionReview` | 배운 점 기록 | result_summary, learned_skill, business_impact, claude_good/bad_points, next_action |
| `SharedTemplate` | 공유 템플릿 (익명 가능) | source_type, source_id, anonymized, category |
| `SupportRequest` | 지원 요청 | request_type, description, anonymous, status |

### User 모델 확장 (Birkman 기존 모델에 추가)
```python
# models/user.py 추가 컬럼
department: str | None       # 미래 부서별 집계 대비 저장 (현재 집계에 미사용)
is_part_leader: bool = False # Birkman의 is_admin과 독립적인 별도 축
```

### 미션 상태 FSM

```
Idea → Prompt Ready → In Progress → Review → Done → Shared
```

---

## Claude 실행 명세서 생성기

[[src/backend/app/services/prompt_builder.py]]

### 12블록 구조

```
1. Goal               7. Constraints
2. Context            8. Files likely involved
3. Current Problem    9. Acceptance Criteria
4. Input Data        10. Test Plan
5. Expected Output   11. Do Not Modify
6. Requirements      12. Implementation Steps
```

- **외부 의존성 없음** — 순수 템플릿 문자열 포매팅
- 말미에 가드 문구 항상 포함: "먼저 프로젝트 구조를 파악하고 수정 계획을 제안한 뒤, 승인 후 구현"

---

## Birkman 연계

[[src/backend/app/services/recommendation.py]] — **순수 함수** (테스트 용이)

본인 `BirkmanReport.report_data`를 입력으로 받아 미션·스킬·템플릿 추천.

### 색상 유형별 추천 톤

| 색상 유형 | 추천 방향 |
|---|---|
| 🔴 빨강 (행동가) | "빠른 결과가 보이는 자동화" |
| 🟢 초록 (소통가) | "협업·공유형 도구" |
| 🟡 노랑 (조직가) | "반복 정리·체계화 자동화" |
| 🔵 파랑 (기획가) | "구조 설계·분석형 미션" |

- 상위 관심영역(예: 과학/기술, 수리/분석) 기반 스킬 태그·템플릿 우선 노출
- **본인 화면에서만** 노출 — 파트장·타인에게는 절대 미노출
- Birkman 미완료 사용자: graceful degradation (추천 없이 일반 흐름)

---

## API 설계

### 개인 영역 (본인 것만)
```
GET/POST/PUT/DELETE  /api/workcraft/frictions
GET/POST/PUT/DELETE  /api/workcraft/missions
POST                 /api/workcraft/prompts/generate   # 미션 → 12블록 명세서
GET                  /api/workcraft/prompts/{mission_id}
GET/POST             /api/workcraft/reviews
```

### 공유 영역
```
GET   /api/templates                  # team_public + anonymous_template 만
POST  /api/templates/share            # 내 미션/프롬프트 → 템플릿 공유
POST  /api/workcraft/support-requests
```

### 파트장 영역 (익명 집계 전용)
```
GET   /api/leader/anonymous-trends    # 공통 불편함 TOP, 관심 역량 집계
GET   /api/leader/shared-outcomes     # team_public 산출물
GET   /api/leader/support-requests    # 익명 지원 요청 집계
```

---

## 프론트엔드 11페이지

[[src/frontend/src/pages/workcraft/]] 에 위치:

| # | 경로 | 파일 | 핵심 기능 |
|---|---|---|---|
| 1 | `/workcraft/frictions` | `FrictionsPage.tsx` | 업무 불편함 카드 기록, 유형 체크박스 |
| 2 | `/workcraft/frictions/shared` | `TeamFrictionsPage.tsx` | 공유된 불편함 열람 → 미션 생성 |
| 3 | `/workcraft/missions/new` | `MissionBuilderPage.tsx` | 불편함 → 실행 가능한 미션 카드 |
| 4 | `/workcraft/missions/:id/prompt` | `PromptStudioPage.tsx` | 12블록 명세서 생성·복사 |
| 5 | `/workcraft/board` | `ActionBoardPage.tsx` | 칸반 보드 (Idea~Shared), 본인만, 터치 DnD |
| 6 | `/workcraft/calendar` | `CalendarPage.tsx` | 미션 일정 캘린더 + 미지정 미션 목록 |
| 7 | `/workcraft/templates` | `TemplateLibraryPage.tsx` | 익명 템플릿 열람·재사용 |
| 8 | `/workcraft/leader` | `LeaderDashboardPage.tsx` | 파트장 익명 대시보드 (N≥5 집계) |
| 9 | `/workcraft/support` | `SupportRequestPage.tsx` | 지원 요청 등록 |
| 10 | `/workcraft/growth` | `MyGrowthPage.tsx` | 내 성장 현황 |
| 11 | `/workcraft/review` | `ReviewPage.tsx` | 배운 점 기록 (Phase 3) |

사이드바 **모듈 스위처**: Birkman Workshop ↔ WorkCraft Studio  
→ [[src/frontend/src/components/Layout/Layout.tsx]]

---

## 개발 단계별 현황

### Phase 1 — 개인 코어 ✅ 완료
- User 모델 확장 (department, is_part_leader)
- models/workcraft.py 6개 테이블
- 개인 CRUD API (frictions, missions) + visibility 강제
- prompt_builder.py + 프롬프트 생성 API
- recommendation.py (Birkman 연계)
- 프론트 페이지 1·2·3·4 + 모듈 스위처
- VisibilitySelector 컴포넌트 (4단계)
- 공유 불편함 보드, 미션 일정(start/due) + 캘린더, 칸반 DnD

### Phase 2 — 공유와 익명 집계 ✅ 완료
- 공유 템플릿 라이브러리 + 익명화 로직
- trends_service.py + ANONYMITY_MIN_N=5 + get_current_part_leader
- 파트장 익명 대시보드 ("기여자 N/5" 진행 UI)
- 지원 요청 등록

### Phase 3 — 회고·성장 ⬜ 미착수
- 배운 점 기록 (MissionReview) + 회고 템플릿
- "성장 관심 영역" 자가 점검 (Birkman 관심영역 데이터 연계)

### 후순위 (신뢰 형성 후)
- 의욕 점수·번아웃 체크·심리적 안전감 — **초기 배제** (기획서 경고)
- AI API 직접 연동 (웹 내장 생성)

---

## 파일럿 운영 계획

4주, 목표: **성공 사례 2~3개** (사용량이 아닌 질적 성과 중심)

| 주차 | 목표 | 산출물 |
|---:|---|---|
| 1 | 업무 불편함 찾기 | 불편함 카드 1개 |
| 2 | 미션으로 전환 | Mission Card + Claude Prompt 초안 |
| 3 | Claude Code로 실행 | 작은 결과물 1개 |
| 4 | 선택적 공유 | 재사용 가능한 템플릿/사례 |

**성공 지표**: "누가 많이 했는가"가 아닌 "어떤 문제가 반복되고 어떤 지원이 필요한가"
