# Assessments — 재사용 진단 프레임워크

→ 상위: [[overview#모듈 맵]]  
→ 보안/권한: [[security#권한 계층]]  
→ 테스트: [[tests#Assessment 테스트]]

---

## Assessment 프레임워크

### 한 줄 정의
> 설문형 진단 도구들이 **하나의 채점 파이프라인을 공유**하는 데이터 기반 프레임워크.  
> 새 진단을 추가하려면 `assessment_data.py`에 instrument 정의 하나만 추가하면 된다 — 엔진·API·UI는 자동 적용.

---

## 설계 원칙

| 원칙 | 구현 |
|---|---|
| 개인 진단 결과는 본인만 | `scope = "individual"` → 결과 조회 시 `get_current_user` 소유권 확인 |
| 팀 진단은 익명 집계만 | `scope = "team"` → N≥5 익명 집계만 파트장에게, 개인 응답/이름 미노출 |
| 새 진단 = 데이터만 추가 | 엔진·라우터·UI가 instrument 정의를 동적으로 소비 |
| N=5 임계값 공유 | `ANONYMITY_MIN_N`을 [[workcraft#파트장 API 제약]]와 동일한 상수로 참조 |

---

## 등록된 진단 도구 (Instruments)

[[src/backend/app/services/assessment_data.py]]

### 1. 팀 심리적 안전감 (`psych_safety`)

| 항목 | 값 |
|---|---|
| 출처 | Edmondson 7문항 척도 |
| 범위(scope) | `team` — 개인 응답 비공개, 파트장 익명 집계 |
| 문항 수 | 7문항 |
| 하위척도 | `psychological_safety` 1개 |
| 역채점 | 3개 문항 (id 1·3·5) |
| 척도 | 5점 리커트 ("전혀 아니다" ~ "매우 그렇다") |

### 2. 일에서의 동기 — SDT (`sdt`)

| 항목 | 값 |
|---|---|
| 출처 | 자기결정이론(Self-Determination Theory) |
| 범위(scope) | `individual` — 개인 비공개 |
| 문항 수 | 9문항 (하위척도별 3문항) |
| 하위척도 | `autonomy`(자율성) · `competence`(유능감) · `relatedness`(관계성) |
| 역채점 | 없음 |

---

## 채점 엔진

[[src/backend/app/services/assessment_engine.py]]

### 개인 점수 계산

$$\text{Score}_{0\text{–}100} = \frac{\bar{x}_{1\text{–}5} - 1}{4} \times 100$$

- 역채점: `effective = 6 - raw` (reverse=True 문항)
- 하위척도별 독립 산출 → 전체(overall) = 하위척도 평균
- 0–100 점수 → **밴드 해석** (낮음 < 45, 보통 45–69, 높음 ≥ 70)

### 팀 익명 집계

```python
def team_aggregate(instrument, responses_list):
    n = len(responses_list)
    if n < ANONYMITY_MIN_N:        # 5명 미만 → 비공개
        return {"visible": False, "n": n, ...}
    # 문항별 역채점 반영 평균 + 하위척도별 0~100 집계
    # 응답 응답에 user_id 없음
```

- 출력: `visible`, `n`, `overall`, `subscales`, `item_means` (문항별 팀 평균)
- 개인 식별 정보 구조적 미포함

---

## 데이터 모델

[[src/backend/app/models/assessment.py]]

```python
class Assessment(Base):
    __tablename__ = "assessments"
    id, user_id, instrument_key
    responses = Column(JSON)   # {item_id: 1~5}
    result = Column(JSON)      # 채점 결과 (개인)
    created_at, updated_at
```

- **사용자+진단 키당 1건** (재응답 시 upsert)
- Alembic 마이그레이션: [[src/backend/alembic/versions/64e0e90650ca_add_assessments_table.py]]

---

## API

[[src/backend/app/api/assessments.py]] — prefix: `/api/assessments`

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/assessments` | 로그인 | 진단 목록 + 완료 여부 |
| GET | `/assessments/{key}/questions` | 로그인 | 문항 + 척도 레이블 |
| POST | `/assessments/{key}/submit` | 로그인 | 응답 제출 + 채점 (upsert) |
| GET | `/assessments/{key}/result` | 로그인(본인) | 개인 결과 조회 |
| GET | `/assessments/{key}/team` | **파트장만** | 익명 팀 집계 |

**보안 불변식**: `/assessments/{key}/team`은 `get_current_part_leader` 의존성 + `scope == "team"` 강제 검증. 개인 척도(SDT)에 팀 집계 요청 시 400.

---

## 프론트엔드 4페이지

[[src/frontend/src/pages/assessments/]] 에 위치:

| 페이지 | 파일 | 핵심 기능 |
|---|---|---|
| 진단 허브 | `AssessmentsHubPage.tsx` | instrument 목록, scope 배지(개인·비공개 / 팀·익명), 완료 상태, 파트장 "팀 결과" 버튼 |
| 진단 응답 | `AssessmentTakePage.tsx` | 5점 리커트 설문, 남은 문항 수 안내, 첫 미답변 문항 자동 스크롤 |
| 개인 결과 | `AssessmentResultPage.tsx` | overall + 하위척도별 점수 바·밴드 해석 |
| 팀 집계 | `AssessmentTeamPage.tsx` | 파트장 전용, N/5 "모이는 중" 게이트, 문항별 팀 평균, 개인 데이터 없음 |

### 레이아웃 연동
- 사이드바 "진단" 항목 → Birkman 그룹에 추가
- 라우트: `/assessments`, `/assessments/:key`, `/assessments/:key/result`, `/assessments/:key/team` (모두 `lazy()`)
- [[src/frontend/src/components/Layout/Layout.tsx]] — 11개 수정

---

## 새 진단 추가 방법

`assessment_data.py`의 `INSTRUMENTS` 딕셔너리에 항목 하나 추가:

```python
INSTRUMENTS["my_new_instrument"] = {
    "key": "my_new_instrument",
    "name": "새 진단 이름",
    "subtitle": "한 줄 설명",
    "scope": "individual",        # 또는 "team"
    "scale_labels": SCALE_5,
    "subscales": {"sub1": "하위척도 1"},
    "bands": DEFAULT_BANDS,
    "items": [
        {"id": 1, "subscale": "sub1", "reverse": False, "text": "문항 텍스트"},
        ...
    ],
}
```

엔진·API·UI는 추가 코드 없이 자동 적용됨.
