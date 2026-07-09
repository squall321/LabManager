# Working Backwards Studio — 확장 계획서 (3번째 모듈)

> 디지털트윈AX랩 플랫폼의 세 번째 모듈. 기획 원문: [working_backward.md](../working_backward.md)
> 진행 순서: **협업 스타일 워크샵 → WorkCraft Studio → Working Backwards Studio**

---

## 0. 한 줄 정의

> 아이디어(특히 CAE·시뮬레이션·자동화 과제)를 **여러 이해관계자 관점에서 검증**해,
> 페르소나 → DITL → Today's Statement → Pain Point → PR/FAQ → 기능 우선순위 → 검증 점수 → MVP 정의로
> 구조화하는 **기획 시뮬레이터**. AI 문서 작성기가 아니라 **"이 일을 왜 해야 하는지"를 검증하는 도구**.

핵심: **LLM 없이 1차 MVP 가능**(템플릿 + 룰). 우리는 이미 WorkCraft에서 "외부 API 없이 구조화된 산출물(Claude 실행 명세서)을 조립"하는 패턴을 검증했다 → 그대로 재사용.

---

## 1. 세 모듈의 서사 (왜 이 순서인가)

| 단계 | 모듈 | 질문 | 산출물 |
|---|---|---|---|
| 1 | 협업 스타일 워크샵 | **나/동료는 누구인가** | 협업 스타일, 함께 일하기 가이드, 팀 협업 맵 |
| 2 | WorkCraft Studio | **내 반복 업무를 어떻게 개선하나** | 업무 불편함 → 미션 → 실행 명세서 → 성장 |
| 3 | **Working Backwards** | **이 아이디어가 조직적으로 필요한 일인가** | 페르소나·PR/FAQ·기능·검증점수·MVP 정의 |

작은 개인 개선(2단계)이 커져 **시스템/투자 판단이 필요한 과제**가 되면 3단계로 승격된다.
그리고 3단계에 필요한 **페르소나·Pain Point 원료를 1·2단계가 실제 데이터로 공급**한다 — 이 연계가 이 계획의 핵심.

---

## 2. 핵심 연계 (이 계획의 심장) 🔗

원문 §9.2/§11의 "여러 이해관계자 관점"과 "페르소나"를, **가상이 아니라 우리 조직의 실제 데이터**로 채운다.

### 2.1 협업 스타일 → **살아있는 페르소나(Living Persona)**
- 이해관계자를 정의할 때 **실제 동료(공개 리포트 보유)를 선택**할 수 있다.
  → 그 사람의 **4색 스타일**이 페르소나의 기본 관심사·두려움·소통 방식을 자동 채움.
- 스타일별 기본값 (자체 모델 기반, 편집 가능):

  | 스타일 | 페르소나 관심사 | 이 사람이 던질 리뷰 질문(반론) |
  |---|---|---|
  | 추진형(빨강) | 빠른 결과·ROI·즉시 실행 | "언제 결과가 나오나? 지금 대비 얼마나 빨라지나?" |
  | 관계형(초록) | 협업·확산·팀 수용성 | "현업이 실제로 쓸까? 온보딩은?" |
  | 체계형(노랑) | 절차·품질·유지보수 | "표준/검증 절차는? 유지보수는 누가?" |
  | 전략형(파랑) | 장기 방향·구조·정합성 | "왜 이 방식인가? 큰 그림과 맞나?" |

- **함께 일하기 가이드(work_with_me)** → PR/FAQ의 "리더 인용문/커뮤니케이션 톤"과 각 페르소나 설득 포인트에 반영.
- 효과: 원문 §11.2 "보수적 반론 생성"을 **LLM 없이도** 스타일 룰로 근사 → 실제 그 사람이 물어볼 법한 질문을 미리 준비.

### 2.2 WorkCraft → **실데이터 Pain Point / 아이디어 승격**
- **Pain Point 가져오기**: 프로젝트의 Pain Point Cluster를 아래에서 시드.
  - 팀 **공유 불편함**(team_public WorkFriction) — 실제 반복 문제.
  - **협업 회고 트렌드**(익명, 카테고리별 반복 마찰) — 조직 차원 병목의 근거.
- **아이디어 승격**: WorkCraft 미션이 시스템 규모일 때 "이 미션을 Working Backwards로 검증" 버튼 → WB 프로젝트로 seed(제목/문제/학습목표 프리필).
- **검증 점수 자동 힌트**: 원문 §9.7 8개 항목 중 일부를 데이터로 제안(사용자 조정).
  - `이해관계자 수` ← 선택한 페르소나 수 / `반복성` ← 회고 마찰 빈도 / `데이터 축적 가치` ← 연결된 미션·프롬프트 수.

### 2.3 결과의 되먹임
- 완료된 WB 프로젝트의 go/no-go 결론 → **결정 기록(Decision Log)** 에 한 줄로 남김(왜 착수/보류인지 근거 보존).
- 좋은 PR/FAQ·기능 백로그 → WorkCraft **공유 템플릿**으로 익명/실명 공유 가능(선택).

> 연계 원칙: 모두 **본인/공개 데이터만** 사용. 협업 스타일 비공개 리포트는 페르소나로 못 씀. 익명 집계(회고 트렌드)는 랩장 열람 규칙(N≥5) 유지.

---

## 3. Working Backwards 흐름 (10단계) → 화면 매핑

원문 §8/§9를 우리 화면으로:

```
① Idea Canvas        아이디어·문제·대상·성공기준·하지 않을 것
② 업무 유형 선택      CAE 도메인 프리셋(Drop/Thermal/Solder Fatigue…) — §14
③ 이해관계자 선택      실제 동료(협업 스타일) + 기본 역할 프리셋
④ Persona Simulator  페르소나 카드(관심사·두려움·성공기준) — 스타일 자동 채움
⑤ Day in the Life    페르소나별 하루 시나리오(시간대·행동·문제·기회)
⑥ Problem Cluster    Pain Point 묶기 (+ WorkCraft에서 가져오기)
⑦ Today's Statement  페르소나별 자동 생성(템플릿, §10.1)
⑧ PR/FAQ Builder     헤드라인~FAQ~리스크/반론(스타일 기반 반론 자동 초안)
⑨ Feature Backlog    Pain→기능 도출, 우선순위·이유
⑩ Validation & MVP   8항목 점수화 → 총점/판정 → MVP 범위 제안
→ Markdown 출력 (Phase 1) / LLM 다듬기용 프롬프트 동봉
```

---

## 4. 아키텍처 적합성 (기존 패턴 재사용)

WorkCraft가 쓴 인프라를 그대로 재사용: JWT 인증, 레이아웃/모듈 스위처, Tailwind 디자인, `visibility` 4단계, 익명 집계(`ANONYMITY_MIN_N`), Alembic 마이그레이션, pytest, 토스트, lazy 라우트.

```
backend/app/
├── models/working_backwards.py   # WBProject, WBPersona, WBScenario,
│                                  # WBPainCluster, WBPRFAQ, WBFeature, WBValidation
├── schemas/working_backwards.py
├── services/
│   ├── wb_data.py                 # 도메인 프리셋, 역할 프리셋, 검증항목, 스타일→페르소나 규칙
│   ├── wb_templates.py            # Today's Statement·자동화 필요성·PR/FAQ skeleton 조립(§10) — LLM 불필요
│   ├── wb_persona.py              # 협업 스타일 리포트 → 페르소나/반론 매핑 (순수 함수)
│   └── wb_export.py               # 전체 → Markdown 문서 + "LLM 다듬기용 프롬프트" 생성
└── api/working_backwards.py       # 프로젝트/페르소나/시나리오/painpoint/prfaq/feature/validation CRUD
                                   #  + /import (WorkCraft 불편함·회고에서 시드) + /export

frontend/src/pages/wb/            # IdeaCanvas, PersonaSimulator, DITLMap, ProblemCluster,
                                  # PRFAQBuilder, FeatureBacklog, ValidationScore, WBReport
frontend/src/components/Layout/   # 모듈 스위처 3개로 확장 (협업/WorkCraft/WB)
```

**C++ 바인딩과의 관계**: WB는 무거운 수치 계산이 없어 C++ 미사용. 단, 검증 점수 가중/클러스터링을 고도화하면 기존 `cpp/` 패턴으로 확장 가능(선택).

---

## 5. 데이터 모델 (원문 §12 기반, 우리 규약으로)

```python
class WBProject(Base):        # Idea Canvas 통합
    id, user_id, name, domain, one_liner, current_problem, target_user,
    expected_benefit, current_alternative, success_criteria, not_doing,
    status(draft/validated/archived), visibility, created_at, updated_at
    origin_mission_id (nullable)     # WorkCraft 미션에서 승격된 경우

class WBPersona(Base):
    id, project_id, name, role, source_user_id(nullable),  # 실제 동료 연결
    style_code(nullable),            # 협업 스타일 색상
    goals, pains, fears, success_criteria, comm_style, today_statement

class WBScenario(Base):        # Day in the Life
    id, persona_id, time_block, activity, pain_point, opportunity, order

class WBPainCluster(Base):
    id, project_id, title, description,
    source(manual/friction/reflection), source_ref(nullable)

class WBPRFAQ(Base):
    id, project_id, headline, subtitle, summary,
    customer_problem, opportunity, solution, leader_quote,
    customer_experience, testimonial, cta, faq(JSON), risks(JSON)

class WBFeature(Base):
    id, project_id, name, description, priority, reason, related_pain_id

class WBValidation(Base):
    id, project_id, scores(JSON: 8항목 1~5), total, verdict, note
```

`visibility` 기본 private. 팀 리뷰(Phase 4)에서 team_public로 열람/코멘트.

---

## 6. API 설계 (요약)

```
# 프로젝트
GET/POST/PUT/DELETE  /api/wb/projects            (본인 스코프)
POST  /api/wb/projects/from-mission/{mission_id}  # WorkCraft 미션 승격

# 하위 리소스 (프로젝트 소유 검증)
CRUD  /api/wb/projects/{id}/personas
CRUD  /api/wb/projects/{id}/scenarios
CRUD  /api/wb/projects/{id}/pains
POST  /api/wb/projects/{id}/pains/import          # 공유 불편함/회고 트렌드에서 시드
GET/PUT /api/wb/projects/{id}/prfaq
CRUD  /api/wb/projects/{id}/features
GET/PUT /api/wb/projects/{id}/validation

# 생성기(LLM 불필요)
POST  /api/wb/projects/{id}/generate/today-statements   # 템플릿 조립
POST  /api/wb/projects/{id}/generate/prfaq-skeleton
POST  /api/wb/projects/{id}/generate/objections         # 스타일 기반 반론 초안
GET   /api/wb/projects/{id}/export?format=md            # Markdown + LLM 다듬기 프롬프트

# 메타/연계
GET   /api/wb/meta                                # 도메인·역할·검증항목 프리셋
GET   /api/wb/persona-candidates                  # 공개 협업 스타일 리포트 목록
```

---

## 7. 화면 (프론트, 8페이지 + 리포트)

| # | 화면 | 핵심 |
|---|---|---|
| 1 | Idea Canvas | 아이디어·문제·성공기준·하지 않을 것 + 도메인 프리셋 |
| 2 | Persona Simulator | 동료 선택 → 스타일 자동 채움 + 편집, 역할 프리셋 |
| 3 | Day in the Life | 페르소나별 시간대 시나리오 (드래그 정렬) |
| 4 | Problem Cluster | Pain 묶기 + "WorkCraft에서 가져오기" |
| 5 | Today's Statement | 자동 생성·수정 |
| 6 | PR/FAQ Builder | 12블록 + 스타일 기반 반론 자동 초안 |
| 7 | Feature Backlog | Pain→기능, 우선순위 표 |
| 8 | Validation & MVP | 8항목 슬라이더 → 총점/판정/레이더, MVP 범위 제안 |
| — | WB Report | 전체 Markdown 미리보기 + 복사/다운로드 |

사이드바 **모듈 스위처를 3개로 확장** (협업 스타일 / WorkCraft / Working Backwards).

---

## 8. LLM 전략 (원문 §4·§18 준수)

- **Phase 1 (LLM 없음)**: 템플릿+룰로 Today's Statement·자동화 필요성·PR/FAQ skeleton·스타일 반론·검증 점수·Markdown까지 완성. (플랫폼 철학: "구조가 사고를 만든다")
- **브릿지(우리 강점)**: WorkCraft가 Claude 실행 명세서를 "붙여넣어 쓰는 프롬프트"로 만든 것처럼, WB도 **"이 skeleton을 다듬어 달라"는 붙여넣기용 LLM 프롬프트를 동봉** → 외부/로컬 LLM이 없어도 사용자가 Claude에 바로 붙여 품질을 올릴 수 있음.
- **Phase 2 (로컬 LLM, 선택)**: Ollama/llama.cpp 연동 시 페르소나 자동 확장·DITL 자동 생성·반론 생성·문장 다듬기·발표 요약. 어댑터 인터페이스로 추상화(없으면 Phase 1 동작).
- **Phase 3 (RAG)**: 사내 리포트/사례 기반. 폐쇄망 고려.

---

## 9. 단계별 로드맵

### Phase 1 — 템플릿 MVP (LLM 없음) ← 먼저 구현
- [ ] 모델 7종 + 마이그레이션
- [ ] Idea Canvas / Persona(협업 스타일 연계) / DITL / Problem Cluster CRUD
- [ ] Today's Statement·PR/FAQ skeleton·스타일 반론 **템플릿 생성기**
- [ ] Feature Backlog + Validation Score(레이더·판정)
- [ ] WorkCraft Pain 가져오기 + 미션 승격
- [ ] Markdown 출력 + LLM 다듬기 프롬프트 동봉
- [ ] 모듈 스위처 3개 확장, 프론트 8페이지, pytest

### Phase 2 — 로컬 LLM 어댑터 (선택)
- [ ] LLM 어댑터 인터페이스(Ollama 우선) + 페르소나/DITL/반론 자동 생성

### Phase 3 — RAG
- [ ] 사내 문서 인덱싱 + 사례 기반 PR/FAQ·리스크 FAQ

### Phase 4 — 조직형
- [ ] 팀 리뷰(코멘트)·버전·승인·DOCX/PPTX/PDF 출력·결정 기록 연계

---

## 10. CAE 도메인 프리셋 (원문 §14 — 우리 랩에 딱 맞음)

디지털트윈AX랩 성격상 범용보다 **기술 조직용**으로 시작:
Drop/Impact · Thermal · Solder Fatigue · FPCB/Connector · Test-CAE Correlation ·
Report Automation · Material DB · Knowledge Search · DOE Automation · Reliability Risk Dashboard.
각 유형은 기본 페르소나 세트·Pain 체크리스트·기능 후보를 프리셋으로 제공.

---

## 11. 결정이 필요한 열린 질문

1. **모듈 진입점** — WB를 사이드바 3번째 모듈로? 아니면 WorkCraft 하위 "검증" 탭으로? (추천: 독립 모듈 — 서사가 뚜렷)
2. **페르소나 데이터 범위** — 실제 동료는 **공개 리포트만** 페르소나로 허용(비공개 보호). 미완료자는 역할 프리셋만. → 이 원칙 확정?
3. **Pain 가져오기 소스** — 팀 공유 불편함(실명 가능) + 회고 트렌드(익명 카테고리)만? 개인 불편함은 본인 것만.
4. **검증 점수 자동 힌트** — 데이터 기반 제안을 어디까지(반복성/이해관계자 수/데이터가치)? 나머지는 수동.
5. **출력 형식** — Phase 1은 Markdown만? DOCX/PPTX는 Phase 4로?
6. **LLM 브릿지** — "붙여넣기용 프롬프트 동봉" 방식을 Phase 1에 포함할지(추천: 포함 — 저비용 고효용).

---

## 12. 요약

Working Backwards Studio는 **협업 스타일·WorkCraft 데이터를 원료로 삼아** 아이디어의 조직적 필요성을 검증하는 3번째 모듈이다.
가장 큰 차별점이자 이 계획의 핵심은 **"살아있는 페르소나"** — 가상의 이해관계자가 아니라, 우리 랩의 실제 동료 스타일로 관점·반론을 시뮬레이션한다는 것.
Phase 1은 WorkCraft에서 검증한 **"LLM 없이 구조화된 산출물 조립"** 패턴을 그대로 재사용하므로 즉시 착수 가능하고, 로컬 LLM/RAG는 어댑터로 나중에 얹는다.
