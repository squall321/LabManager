# 파트장 배포형 AI/AX 성장 지원 웹사이트 MVP 기획안

## 1. 배경과 목적

파트장으로서 파트원들에게 근로의욕과 자기계발을 지원하는 웹사이트를 배포하려는 경우, 가장 중요한 문제는 기능 자체보다 **신뢰**이다.

일반적인 HR 도구처럼 보이면 구성원들은 다음과 같이 느낄 수 있다.

> “내 의욕 점수를 파트장이 보는 것 아닌가?”  
> “내 부족 역량을 적으면 평가에 불리한 것 아닌가?”  
> “성장 미션이라고 해놓고 결국 일을 더 시키려는 것 아닌가?”  
> “Claude Code로 무언가 만들라는 압박 아닌가?”

따라서 이 웹사이트는 **구성원을 평가하거나 관리하기 위한 시스템**이 아니라, 구성원이 자기 업무를 스스로 개선하고 성장 미션을 설계할 수 있도록 돕는 **안전한 성장 실험실**로 설계되어야 한다.

---

## 2. 서비스의 핵심 철학

이 서비스의 철학은 다음과 같다.

> 파트장이 구성원을 분석하는 시스템이 아니라,  
> 구성원이 자기 성장과 업무 개선을 스스로 설계하고,  
> 파트장은 그 실행을 막는 장애물을 제거해주는 시스템이다.

즉, 서비스의 중심은 “근로의욕 진단”이 아니라 다음 흐름이어야 한다.

```text
업무 불편함 발견
→ 성장 미션 생성
→ Claude Code 실행 명세서 생성
→ 작은 결과물 제작
→ 선택적 공유
→ 파트 차원의 지원과 확산
```

구성원에게 직접적으로 전달되는 메시지는 다음과 같아야 한다.

> 반복 업무를 줄이고,  
> 개인 성장 미션을 만들고,  
> Claude Code로 작은 업무 개선을 실험하는 공간입니다.

내부적으로 달성하고 싶은 목표는 다음이다.

- 자기효능감 회복
- 성장감 확보
- AI/AX 역량 강화
- 반복 업무 감소
- 파트 전체 생산성 개선
- 좋은 자동화 사례의 공유 자산화
- 장기적으로 근로의욕 향상

---

## 3. 파트장 배포 시 가장 큰 리스크

파트장이 직접 배포하는 시스템은 아무리 좋은 의도로 만들어도 구성원이 다음과 같이 받아들일 수 있다.

| 리스크 | 구성원이 느낄 수 있는 반응 |
|---|---|
| 감시로 인식 | “내 상태를 파트장이 모니터링하나?” |
| 평가로 인식 | “부족한 역량을 적으면 불이익이 있나?” |
| 추가 업무로 인식 | “성장 미션이라는 이름으로 일이 늘어나는 것 아닌가?” |
| 강제 자기계발로 인식 | “Claude Code를 반드시 써야 하나?” |
| 솔직한 기록 회피 | “좋게 보이는 내용만 적어야겠다.” |

따라서 MVP의 핵심은 기능보다 **데이터 공개 범위, 표현 방식, 운영 방식**이다.

---

## 4. 반드시 지켜야 할 설계 원칙

### 4.1 개인 내용은 기본적으로 비공개

다음 항목은 파트장이 직접 볼 수 없어야 한다.

- 개인 업무 컨디션 기록
- 근로의욕 점수
- 번아웃 느낌
- 의욕 저하 이유
- 관계 스트레스
- 커리어 불안
- 부족 역량 자가진단
- 개인 회고 원문
- 자유 서술형 고민

이런 내용이 파트장에게 보이는 순간, 구성원은 솔직하게 입력하지 않는다.

### 4.2 파트장은 개인이 아니라 시스템 문제를 본다

파트장이 봐야 할 것은 개인의 점수나 부족함이 아니라, 파트 전체의 공통 문제이다.

좋지 않은 대시보드 예시는 다음과 같다.

| 이름 | 의욕 | 부족 역량 | 미션 완료 |
|---|---:|---|---:|
| A | 3 | Python | 0 |
| B | 5 | React | 1 |

이런 화면은 감시 도구로 보일 가능성이 높다.

대신 다음과 같은 익명 집계가 적절하다.

| 공통 이슈 | 건수 | 필요한 지원 |
|---|---:|---|
| 반복 보고서 작성 | 8 | 보고서 자동화 템플릿 |
| CSV 후처리 | 6 | Python 샘플 코드 |
| 결과 비교 시각화 | 5 | React Chart 예제 |
| Claude Code 사용법 미숙 | 7 | 프롬프트 작성 가이드 |
| 파일/데이터 접근 불편 | 4 | 공용 데이터 폴더 정리 |

이런 화면은 구성원을 감시하는 것이 아니라, 파트장이 지원할 지점을 찾는 화면이다.

### 4.3 공유는 사용자가 선택한다

개인이 만든 미션, 프롬프트, 회고는 기본적으로 비공개여야 한다.

공유 범위는 다음처럼 선택 가능해야 한다.

```text
공개 범위
□ 나만 보기
□ 파트장에게 공유
□ 파트 전체에 공유
□ 템플릿으로 익명 공유
```

특히 중요한 기능은 **익명 템플릿 공유**이다.

예를 들어 한 구성원이 “시험 결과 CSV 자동 그래프 생성 도구 만들기” 미션을 만들었다면, 이름을 드러내지 않고 다음처럼 공유할 수 있다.

```text
[익명 공유 템플릿]
반복 CSV 분석 업무를 자동화하는 Claude Code 프롬프트
```

이렇게 하면 다른 구성원들도 부담 없이 참고할 수 있다.

---

## 5. 서비스 이름과 표현 방식

### 5.1 피해야 할 이름

다음과 같은 이름은 평가나 감시의 느낌을 줄 수 있다.

- Motivation Tracker
- Performance Growth System
- Employee Diagnosis
- Work Attitude Dashboard
- Productivity Booster
- Skill Gap Evaluation

### 5.2 추천 이름

파트장 배포용으로는 다음과 같은 이름이 더 적절하다.

| 이름 | 느낌 |
|---|---|
| WorkCraft Studio | 내 일을 스스로 개선하는 도구 |
| Growth Mission Lab | 성장 실험실 |
| My Work Upgrade | 개인 업무 개선 |
| AX Practice Lab | AI/AX 실습 공간 |
| Small Automation Lab | 작은 자동화 실험실 |
| My Growth Board | 개인 성장 보드 |

가장 추천하는 이름은 **WorkCraft Studio**이다.

이 이름은 “의욕을 진단한다”보다 “내 일을 스스로 다듬고 개선한다”는 느낌을 준다.

---

## 6. 첫 화면 안내 문구

서비스 첫 화면에는 신뢰를 주는 문구가 반드시 필요하다.

### 추천 문구

```text
이 사이트는 평가 도구가 아닙니다.

반복 업무, 답답한 업무, 배우고 싶은 기술을
작은 성장 미션으로 바꾸기 위한 개인용 작업 공간입니다.

개인 체크인, 회고, 역량 자가진단 내용은 본인만 볼 수 있습니다.
파트장은 개인별 내용을 보지 않고,
공유자가 선택한 미션과 익명 집계만 확인합니다.
```

### 피해야 할 문구

```text
당신의 근로의욕을 진단합니다.
당신의 역량 수준을 평가합니다.
부족한 역량을 분석합니다.
업무 태도를 개선합니다.
```

이런 표현은 구성원에게 방어감을 줄 수 있다.

---

## 7. 기능 명칭 변경

HR 느낌이 강한 용어는 부드럽게 바꾸는 것이 좋다.

| 기존 표현 | 파트장 배포용 표현 |
|---|---|
| Motivation Check-in | 나의 업무 컨디션 체크 |
| Skill Gap Map | 성장 관심 영역 |
| Strength Finder | 내가 잘 쓰는 업무 방식 |
| Growth Mission Builder | 업무 개선 미션 만들기 |
| Claude Prompt Studio | Claude Code 실행 명세서 |
| Action Board | 내 미션 보드 |
| Review | 배운 점 기록 |
| Diagnosis | 정리하기 / 돌아보기 |
| Evaluation | 자가 점검 |
| Weakness | 보완하고 싶은 영역 |

가능하면 “진단”, “평가”, “갭”, “부족”이라는 단어는 줄이고, “관심”, “개선”, “실험”, “미션”, “기록”이라는 단어를 사용하는 것이 좋다.

---

## 8. 권한 구조

### 8.1 개인 사용자 권한

개인 사용자는 다음을 볼 수 있다.

- 자신의 업무 불편함 카드
- 자신의 성장 미션
- 자신의 Claude Code 프롬프트
- 자신의 진행 상태
- 자신의 회고 기록
- 본인이 공유한 항목
- 다른 사람이 공개 또는 익명 공유한 템플릿

### 8.2 파트장 권한

파트장은 다음만 볼 수 있다.

- 구성원이 공개 선택한 미션
- 구성원이 공개 선택한 프롬프트
- 구성원이 공개 선택한 결과물
- 익명화된 파트 전체 통계
- 지원 요청 목록
- 공유 가능한 템플릿 라이브러리

### 8.3 파트장이 보면 안 되는 데이터

| 데이터 | 파트장 접근 |
|---|---:|
| 개인 업무 컨디션 원문 | 불가 |
| 개인 의욕 점수 | 불가 |
| 개인 관계 스트레스 | 불가 |
| 개인 커리어 불안 | 불가 |
| 개인 역량 자가진단 원문 | 기본 불가 |
| 개인 회고 원문 | 기본 불가 |
| 비공개 미션 | 불가 |
| 비공개 프롬프트 | 불가 |

---

## 9. 전체 서비스 구조

```text
WorkCraft Studio

개인 영역
 ├─ My Work Frictions
 │   └─ 내가 불편한 업무 기록
 ├─ My Growth Missions
 │   └─ 업무 개선 미션 카드
 ├─ Claude Prompt Builder
 │   └─ Claude Code 실행 명세서 생성
 ├─ My Action Board
 │   └─ 개인 미션 진행 상태
 └─ My Learning Log
     └─ 배운 점 기록

공유 영역
 ├─ Prompt Library
 │   └─ 좋은 Claude Code 프롬프트 템플릿
 ├─ Mission Examples
 │   └─ 업무 개선 사례
 └─ Reusable Tools
     └─ 공유 가능한 스크립트/도구 링크

파트장 영역
 ├─ Anonymous Trends
 │   └─ 공통 불편함/성장 관심사
 ├─ Support Requests
 │   └─ 필요한 교육/환경/권한
 └─ Shared Outcomes
     └─ 공개된 산출물과 확산 후보
```

---

## 10. MVP 목표

파트장 배포형 MVP의 목표는 다음이다.

> 구성원이 자신의 반복 업무나 답답한 업무를 작은 개선 미션으로 바꾸고,  
> Claude Code에서 실행 가능한 명세서를 만들며,  
> 원하는 경우에만 결과물이나 템플릿을 공유할 수 있게 한다.

MVP에서 처음부터 “근로의욕 점수”나 “심리 상태 진단”을 전면에 내세우지 않는 것이 좋다.

초기 MVP에서는 다음에 집중한다.

1. 업무 불편함 기록
2. 성장 미션 생성
3. Claude Code 실행 명세서 생성
4. 내 미션 보드
5. 공유 템플릿 라이브러리
6. 파트장용 익명 집계 대시보드

---

## 11. MVP 핵심 페이지

## 11.1 페이지 1: 업무 불편함 카드

### 목적

구성원이 현재 업무에서 반복적으로 불편하거나 개선하고 싶은 부분을 부담 없이 기록한다.

### 입력 항목

```text
1. 반복적으로 불편한 업무는 무엇인가요?
2. 왜 불편한가요?
3. 얼마나 자주 발생하나요?
4. 이 업무가 줄어들면 어떤 효과가 있나요?
5. 이 업무를 개선하면 어떤 역량을 배울 수 있을까요?
6. 이 업무는 Claude Code로 개선 가능할 것 같나요?
```

### 선택 항목 예시

```text
불편함 유형
□ 반복 보고서 작성
□ CSV/Excel 후처리
□ 해석 결과 그래프 작성
□ 파일명/조건 정리
□ 회의록 정리
□ 코드 수정 반복
□ 문서 템플릿 작성
□ 데이터 비교
□ 타부서 요청 정리
□ 기타
```

### 출력 예시

```text
업무 불편함 카드

제목: 시험 결과 CSV 그래프 작성 반복
문제: 매번 CSV를 열고 수동으로 그래프를 만들어야 한다.
빈도: 주 3회 이상
효과: 자동화되면 분석 시간과 보고서 작성 시간이 줄어든다.
연결 역량: Python, 데이터 시각화, Claude Code 활용
```

---

## 11.2 페이지 2: 업무 개선 미션 만들기

### 목적

업무 불편함을 실행 가능한 작은 성장 미션으로 바꾼다.

### 입력 항목

```text
1. 개선하고 싶은 업무는 무엇인가요?
2. 현재 가장 불편한 점은 무엇인가요?
3. 원하는 결과물은 무엇인가요?
4. 이번 달 안에 가능한 최소 결과물은 무엇인가요?
5. 성공 기준은 무엇인가요?
6. 이 과정에서 배우고 싶은 역량은 무엇인가요?
7. 공유 여부를 선택해주세요.
```

### 출력 예시

```text
Growth Mission Card

Mission: CSV 결과 자동 리포트 MVP 만들기

Why:
반복 분석 업무를 줄이고 데이터 기반 판단 시간을 확보한다.

Output:
CSV 업로드 → 그래프 생성 → 요약 통계 표시 웹페이지

Scope:
1차 MVP는 CSV 3개 업로드와 선 그래프 1개로 제한한다.

Success Criteria:
- 사용자가 CSV를 업로드할 수 있다.
- x축 시간, y축 결과값을 자동 인식한다.
- 그래프가 표시된다.
- 평균/최대/최소값이 표로 출력된다.

Deadline:
2주

Learning Goal:
React + Flask 기반 데이터 시각화 흐름 이해
```

---

## 11.3 페이지 3: Claude Code 실행 명세서 생성

### 목적

웹사이트가 AI를 직접 내장하지 않더라도, Claude Code에 복사해서 사용할 수 있는 고품질 실행 프롬프트를 생성한다.

### 프롬프트 구조

```text
Goal
Context
Current Problem
Input Data
Expected Output
Requirements
Constraints
Files likely involved
Acceptance Criteria
Test Plan
Do Not Modify
Implementation Steps
```

### 출력 예시

```text
You are working in my existing React + Flask project.

Goal:
Build a CSV result analysis MVP page.

Context:
This tool is for engineers who repeatedly analyze test/simulation CSV files.
They need to upload multiple CSV files and compare time-series results.

Current Problem:
Engineers manually open CSV files, create graphs, and calculate basic statistics repeatedly.

Requirements:
1. Add a new page named CsvReportPage.
2. Support drag-and-drop upload of multiple CSV files.
3. Parse the first column as time.
4. Treat remaining columns as result channels.
5. Show a line chart for selected file and selected channel.
6. Show summary statistics: min, max, mean, peak time.
7. Add a simple table listing uploaded files.
8. Keep the UI simple and use Ant Design components.
9. Do not modify existing routes except adding this page route.
10. Add basic error handling for invalid CSV files.

Acceptance Criteria:
- The page builds without TypeScript errors.
- A user can upload at least 3 CSV files.
- A chart appears after selecting a file and channel.
- Summary statistics are shown correctly.
- Existing pages are not broken.

Test Plan:
1. Run npm install if needed.
2. Run npm run build.
3. Upload sample CSV files.
4. Confirm chart and statistics are displayed.

Do Not Modify:
- Existing unrelated pages
- Existing backend routes unless needed
- Authentication logic

Please first inspect the project structure, then propose the files to modify.
After I approve, implement the changes.
```

---

## 11.4 페이지 4: 내 미션 보드

### 목적

개인이 만든 미션의 진행 상태를 관리한다.

### 상태 값

```text
Idea
Prompt Ready
In Progress with Claude Code
Review
Done
Shared
```

### 상태 설명

| 상태 | 의미 |
|---|---|
| Idea | 아직 아이디어 단계 |
| Prompt Ready | Claude Code에 넣을 명세서 준비 완료 |
| In Progress | Claude Code로 구현 중 |
| Review | 동료 또는 본인 리뷰 중 |
| Done | 결과물 완성 |
| Shared | 공유 가능한 형태로 정리 완료 |

### 주의점

파트장이 이 보드를 개인별로 감시하는 구조가 되면 안 된다.  
개인의 미션 보드는 기본적으로 본인만 볼 수 있어야 하며, 공유 선택한 미션만 파트장 또는 파트 전체에 노출되어야 한다.

---

## 11.5 페이지 5: 공유 템플릿 라이브러리

### 목적

좋은 미션 카드, Claude Code 프롬프트, 자동화 사례를 공유 자산으로 축적한다.

### 공유 가능한 항목

```text
- 좋은 미션 카드
- 좋은 Claude Code 프롬프트
- 성공 사례
- 실패 사례
- 재사용 가능한 체크리스트
- 자동화 스크립트 링크
- 내부 도구 사용법
```

### 템플릿 예시

```text
템플릿 이름: CSV 결과 자동 분석 프롬프트
분류: 데이터 후처리 / 자동화
추천 대상: 반복적으로 CSV 그래프를 만드는 구성원
필요 역량: Python, React, 데이터 시각화
공유 방식: 익명 공유
```

---

## 11.6 페이지 6: 파트장용 익명 대시보드

### 목적

파트장이 개인을 평가하는 것이 아니라, 파트 전체의 공통 불편함과 지원 필요 영역을 파악한다.

### 표시 항목

```text
- 공통 업무 불편함 TOP 10
- 많이 선택된 성장 관심 영역
- 생성된 성장 미션 수
- 공유된 Claude Code 프롬프트 수
- 완료된 개선 사례 수
- 익명 지원 요청 목록
- 가장 많이 요청된 교육/환경 지원
```

### 예시 화면

| 항목 | 내용 |
|---|---|
| 공통 불편함 1위 | CSV/Excel 후처리 |
| 공통 불편함 2위 | 반복 보고서 작성 |
| 공통 불편함 3위 | 해석 결과 비교 시각화 |
| 많이 선택된 역량 | Python 자동화, 데이터 시각화, Claude Code 활용 |
| 지원 요청 | 샘플 코드, 프롬프트 가이드, 공용 데이터 폴더 |

### 파트장이 해석해야 하는 방식

좋은 해석:

> 반복 업무 자동화 니즈가 많으니, 공통 템플릿과 교육 시간을 제공해야겠다.

나쁜 해석:

> 누가 미션을 안 했는지 확인해야겠다.

---

## 12. MVP에서 제외하거나 후순위로 둘 기능

초기 MVP에서는 다음 기능을 후순위로 두는 것이 좋다.

| 기능 | 후순위 이유 |
|---|---|
| 근로의욕 점수 | 감시로 오해받기 쉬움 |
| 심리 상태 진단 | 민감 정보에 해당할 수 있음 |
| 번아웃 체크 | 신뢰 형성 후 도입 필요 |
| 개인별 Skill Gap 공개 | 평가로 오해될 가능성 높음 |
| 관리자 코멘트 기능 | 업무 지시처럼 느껴질 수 있음 |
| 미션 완료율 개인 랭킹 | 경쟁/압박으로 변질 가능 |
| 자동 성과 점수화 | HR 평가 도구처럼 보일 위험 |

초기에는 최대한 안전하게 “업무 개선 미션”과 “Claude Code 실행 명세서”에 집중하는 것이 좋다.

---

## 13. 추천 데이터 모델

Flask + React 기반으로 개발한다고 가정하면 기본 데이터 모델은 다음과 같이 잡을 수 있다.

```text
User
- id
- name
- email
- department
- role
- is_part_leader

WorkFriction
- id
- user_id
- title
- description
- friction_type
- frequency
- expected_effect
- related_skill
- visibility
- created_at

GrowthMission
- id
- user_id
- work_friction_id
- title
- problem
- goal
- output
- scope
- success_criteria
- deadline
- learning_goal
- status
- visibility
- created_at
- updated_at

ClaudePrompt
- id
- mission_id
- prompt_text
- prompt_type
- visibility
- created_at

MissionReview
- id
- mission_id
- result_summary
- learned_skill
- business_impact
- claude_good_points
- claude_bad_points
- next_action
- visibility
- created_at

SharedTemplate
- id
- source_type
- source_id
- title
- category
- description
- anonymized
- created_at

SupportRequest
- id
- user_id
- request_type
- description
- anonymous
- status
- created_at
```

### visibility 값 예시

```text
private
leader_only
team_public
anonymous_template
```

---

## 14. 추천 화면 흐름

### 사용자 흐름

```text
1. 첫 화면에서 “평가 도구가 아님” 안내 확인
2. 업무 불편함 카드 작성
3. 해당 불편함을 성장 미션으로 변환
4. Claude Code 실행 명세서 생성
5. Claude Code에서 실행
6. 결과를 내 미션 보드에 기록
7. 공유할 항목만 선택적으로 공유
8. 배운 점 기록
```

### 파트장 흐름

```text
1. 익명 대시보드 확인
2. 공통 불편함 TOP 항목 확인
3. 많이 요청된 지원 항목 확인
4. 공유된 좋은 프롬프트와 사례 확인
5. 공통 교육/템플릿/환경 지원 제공
6. 개인별 완료율이 아니라 파트 차원의 장애물 제거에 집중
```

---

## 15. 파일럿 운영 방식

처음부터 전체 파트에 강제 배포하면 부담이 커질 수 있다.  
따라서 3~5명 정도의 희망자 중심 파일럿으로 시작하는 것이 좋다.

### 파일럿 대상 추천

- Claude Code에 관심 있는 사람
- 반복 업무 자동화에 관심 있는 사람
- 새로운 도구를 부담 없이 써볼 사람
- 파트 내에서 신뢰도가 있는 사람
- 결과물을 공유하는 데 거부감이 적은 사람

### 4주 파일럿 운영안

| 주차 | 목표 | 산출물 |
|---:|---|---|
| 1주차 | 개인 업무 불편함 찾기 | 업무 불편함 카드 1개 |
| 2주차 | 성장 미션으로 바꾸기 | Growth Mission Card, Claude Prompt 초안 |
| 3주차 | Claude Code로 실행하기 | 작은 결과물, 코드, 문서, 체크리스트 중 하나 |
| 4주차 | 공유 가능한 것만 공유하기 | 재사용 가능한 프롬프트, 성공/실패 사례 |

파일럿의 목표는 “많이 쓰게 하기”가 아니라, **좋은 성공 사례 2~3개를 만드는 것**이다.

---

## 16. 파트장 공지문 예시

```text
이번에 파트 내에서 작은 실험을 해보려고 합니다.

목적은 구성원 개개인의 평가나 업무 추적이 아니라,
각자가 반복적으로 불편하다고 느끼는 업무를 찾아
Claude Code를 활용해 작은 개선 미션으로 바꿔보는 것입니다.

개인의 체크인, 회고, 역량 자가진단 내용은 본인만 볼 수 있도록 설계하겠습니다.
파트 차원에서는 개인별 데이터를 보는 것이 아니라,
어떤 공통 불편함이 많은지, 어떤 교육이나 환경 지원이 필요한지만 보겠습니다.

처음에는 희망자 중심으로 작게 파일럿을 진행하고,
좋은 프롬프트나 자동화 사례가 나오면 공유 가능한 범위에서 템플릿화해보겠습니다.

이 활동의 핵심은 성과 평가가 아니라,
각자의 반복 업무를 조금 줄이고,
Claude Code를 실제 업무 개선에 활용하는 방법을 함께 찾아보는 것입니다.
```

---

## 17. 파트장 운영 원칙

### 해야 할 말

```text
반복 업무 자동화 니즈가 많으니 공통 템플릿을 만들어보겠습니다.
이번 달에는 미션 완료 여부보다, 각자 하나의 불편한 업무를 정의하는 것까지만 해봅시다.
공유하고 싶은 사람만 공유하면 됩니다.
개인 내용은 보지 않습니다.
파트 차원에서 시간과 환경을 지원하겠습니다.
```

### 하지 말아야 할 말

```text
이번 주 미션 왜 안 했어요?
의욕 점수가 낮네요.
Skill Gap이 큰데 공부해야겠네요.
Claude Code로 자동화 하나씩 만들어오세요.
누가 몇 개 했는지 확인하겠습니다.
```

파트장의 역할은 점검자가 아니라 **스폰서**이다.

---

## 18. 성공 지표

초기 MVP의 성공 지표는 개인별 완료율이나 접속 횟수가 아니라 다음에 가까워야 한다.

| 지표 | 의미 |
|---|---|
| 업무 불편함 카드 수 | 구성원들이 개선할 문제를 정의했는가 |
| 성장 미션 생성 수 | 문제를 실행 가능한 미션으로 바꾸었는가 |
| Claude Code 프롬프트 생성 수 | 실행 명세서로 변환되었는가 |
| 공유 템플릿 수 | 조직 학습 자산이 생겼는가 |
| 재사용된 템플릿 수 | 다른 구성원에게 확산되었는가 |
| 지원 요청 수 | 파트장이 제거해야 할 장애물이 드러났는가 |
| 완료된 작은 개선 사례 수 | 실제 업무 개선 결과가 생겼는가 |

주의할 점은 “누가 많이 했는가”보다 “어떤 문제가 반복적으로 드러났고, 어떤 지원이 필요한가”를 보는 것이다.

---

## 19. MVP 개발 우선순위

### 1순위

- 로그인 / 사용자 구분
- 업무 불편함 카드 CRUD
- 성장 미션 카드 CRUD
- Claude Code 프롬프트 생성 템플릿
- 개인별 미션 보드
- 공유 범위 설정

### 2순위

- 공유 템플릿 라이브러리
- 익명 템플릿 공유
- 파트장용 익명 집계 대시보드
- 지원 요청 등록

### 3순위

- 성장 관심 영역 자가 점검
- 내가 잘 쓰는 업무 방식 체크
- 배운 점 기록
- 미션 완료 후 회고 템플릿

### 후순위

- 의욕 점수
- 번아웃 체크
- 심리적 안전감 체크
- 개인별 성장 리포트
- AI API 연동

---

## 20. 개발 스택 예시

사용자가 기존에 Flask + React 기반 프로젝트를 많이 다루고 있으므로 다음 구성이 적합하다.

```text
Frontend
- React
- TypeScript
- Vite
- Ant Design
- React Router
- Zustand 또는 Context API

Backend
- Flask 또는 FastAPI
- SQLAlchemy
- SQLite 또는 PostgreSQL
- REST API

Auth
- 사내 SSO 연동 가능 시 SSO
- MVP에서는 간단한 로그인/권한 구분

DB
- 초기: SQLite
- 확장: PostgreSQL

배포
- 내부 서버
- Docker Compose
- Nginx Reverse Proxy
```

---

## 21. 핵심 API 예시

```text
GET    /api/work-frictions
POST   /api/work-frictions
GET    /api/work-frictions/:id
PUT    /api/work-frictions/:id
DELETE /api/work-frictions/:id

GET    /api/growth-missions
POST   /api/growth-missions
GET    /api/growth-missions/:id
PUT    /api/growth-missions/:id
DELETE /api/growth-missions/:id

POST   /api/claude-prompts/generate
GET    /api/claude-prompts/:mission_id

GET    /api/templates
POST   /api/templates/share

GET    /api/leader/anonymous-trends
GET    /api/leader/shared-outcomes
GET    /api/leader/support-requests
```

---

## 22. Claude Code 프롬프트 생성 템플릿

웹사이트에서 자동으로 만들어줄 기본 템플릿은 다음 구조를 갖는 것이 좋다.

```text
You are working in my existing project.

Goal:
[목표]

Context:
[업무 배경]

Current Problem:
[현재 불편함]

Expected Output:
[원하는 결과물]

Requirements:
1. [요구사항 1]
2. [요구사항 2]
3. [요구사항 3]

Constraints:
- [제약사항 1]
- [제약사항 2]

Acceptance Criteria:
- [성공 기준 1]
- [성공 기준 2]
- [성공 기준 3]

Test Plan:
1. [테스트 1]
2. [테스트 2]
3. [테스트 3]

Do Not Modify:
- [수정 금지 영역 1]
- [수정 금지 영역 2]

Please first inspect the project structure, then propose the files to modify.
After I approve, implement the changes.
```

이 템플릿은 Claude Code가 무작정 코드를 수정하지 않고, 먼저 프로젝트 구조를 파악하고 수정 계획을 제안하도록 유도한다.

---

## 23. MVP의 핵심 차별점

이 서비스는 일반적인 HR 플랫폼과 다르다.

일반적인 HR 플랫폼은 이렇게 말한다.

> 목표를 세우세요.  
> 역량을 개발하세요.  
> 성장 계획을 작성하세요.

하지만 이 서비스는 이렇게 말한다.

> 당신의 현재 업무 불편함을 성장 미션으로 바꾸고,  
> Claude Code로 실행 가능한 명세서까지 만들어드립니다.

이 차이가 중요하다.

구성원은 막연한 자기계발보다 **내 일을 당장 편하게 만드는 성장**에 더 잘 반응한다.

---

## 24. 최종 MVP 정의

파트장 배포형 MVP는 다음 한 문장으로 정의할 수 있다.

> 구성원이 자신의 반복 업무와 답답한 업무를 안전하게 기록하고,  
> 이를 작은 업무 개선 미션으로 바꾸며,  
> Claude Code에서 실행 가능한 프롬프트를 생성하고,  
> 원하는 경우에만 결과물과 템플릿을 공유하는 내부 성장 실험 플랫폼.

초기 MVP의 핵심 화면은 다음 6개이다.

1. 업무 불편함 카드
2. 업무 개선 미션 만들기
3. Claude Code 실행 명세서 생성
4. 내 미션 보드
5. 공유 템플릿 라이브러리
6. 파트장용 익명 대시보드

이 구조라면 파트장으로서 배포하더라도 평가나 감시로 오해될 가능성을 줄이면서, 파트원들의 자기계발과 업무 개선을 자연스럽게 촉진할 수 있다.

---

## 25. 한 줄 요약

파트장이 이 서비스를 배포할 때 핵심은 다음이다.

> 개인을 진단하는 HR 시스템이 아니라,  
> 개인이 자기 업무를 개선하도록 돕는 안전한 성장 실험실로 만들어야 한다.

따라서 MVP는 반드시 다음 흐름에 집중해야 한다.

```text
업무 불편함
→ 성장 미션
→ Claude Code 프롬프트
→ 작은 결과물
→ 선택적 공유
→ 파트 차원의 지원
```
