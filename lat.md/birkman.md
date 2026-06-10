# Birkman Workshop 모듈

→ 상위: [[overview#모듈 맵]]  
→ 아키텍처: [[architecture#C++ ↔ FastAPI 바인딩 패턴]]  
→ 보안: [[security#권한 계층]]

> ⚠️ **중요 고지:** 본 버크만 구현은 교육/워크숍 목적의 **자체 점수 모델**입니다.  
> 공식 Birkman Method®와는 별개이며, 평가·선발 근거로 사용해선 안 됩니다.

---

## Birkman Workshop 모듈

### 한 줄 정의
한글 버크만 진단 설문(100문항)과 자동 리포트 분석 기능. LabManager의 **첫 번째 모듈**.

### 사용자 흐름
```
이메일 등록(YAML) → 비밀번호 설정 → 설문 3섹션 완료 → 자동 분석 → 리포트 열람
                                                        └→ 공개 전환 → 팀 리포트
```

---

## 설문 구조

### 100문항 3섹션

| 섹션 | 제목 | 문항 수 | 측정 대상 |
|---|---|---|---|
| 1 | 나의 행동과 성향 | 36문항 | 11개 컴포넌트 전체 (Usual 행동) |
| 2 | 사람과 환경에 대한 생각 | 32문항 | 타인 인식 → 내면의 욕구 (일부 역채점) |
| 3 | 나의 관심 영역 | 32문항 | 8개 관심 영역 균등 배분 |

- 단일 소스: [[src/backend/app/services/birkman_data.py]] — 문항·채점 규칙·가중치 모두 이 파일에서 관리
- 섹션별 API: `GET /api/survey/questions/{section}`
- 응답 제출: `POST /api/survey/submit/{id}` — **마지막 섹션 완료 시 자동 분석 실행**

---

## 채점 알고리즘

### 핵심 공식

$$\text{Score}_{0\text{–}99} = \frac{\text{weighted\_avg}_{1\text{–}5} - 1}{4} \times 99$$

- **컴포넌트별 가중 평균 응답** (1–5 리커트) → 0–99 선형 매핑
- **Usual** (평소 행동) / **Need** (내면의 욕구) 분리 산출
- **Stress** = Usual–Need 격차 기반 모델링
- 역채점(reverse scoring): 섹션 2 일부 문항에 적용

### C++ / Python 이중 경로

```python
# birkman_engine.py
try:
    import birkman_calc   # pybind11 모듈 (선택적 빌드)
    USE_CPP = True
except ImportError:
    USE_CPP = False        # Python 구현으로 자동 fallback
```

두 경로는 **동일 가중치·알고리즘** → 결과 일치 보장.  
→ [[architecture#C++ ↔ FastAPI 바인딩 패턴]]

---

## 분석 결과 구조

### 4색상 유형 (Canonical Types)

| 색상 | 이름 | 특징 |
|---|---|---|
| 🔴 빨강 | 행동가 | 빠른 실행, 결과 지향 |
| 🟢 초록 | 소통가 | 관계 중심, 팀워크 |
| 🟡 노랑 | 조직가 | 반복·체계, 안정 선호 |
| 🔵 파랑 | 기획가 | 구조 설계, 분석형 |

> 4색상은 WorkCraft Studio의 **미션 추천 메커니즘**과 강하게 연계됨 → [[workcraft#Birkman 연계]]

### 라이프스타일 그리드
- **이중 좌표**: Usual(평소 행동) × Need(내면의 욕구) 2D 공간에 배치
- 시각화 컴포넌트: [[src/frontend/src/components/birkman/LifestyleGrid.tsx]]

### 11개 컴포넌트
Authority, Challenge, Empathy, Esteem, Acceptance, Order, Activity, Advantage, Sociability, Freedom, Change

- 시각화: [[src/frontend/src/components/birkman/ComponentChart.tsx]] (Recharts 레이더)

### 8개 관심 영역
Outdoor, Mechanical, Scientific, Numerical, Persuasive, Artistic, Literary, Social Service

- 시각화: [[src/frontend/src/components/birkman/InterestChart.tsx]]

### 유형 강도 (Intensity)
4색상 중 가장 높은 점수와 차순위의 격차로 산출.

---

## 리포트 구조

`report_service.py`가 점수 데이터를 기반으로 **내러티브 텍스트** 생성.

- 평소 행동 (Usual)
- 내면의 욕구 (Need)
- 스트레스 트리거 (Stress)
- 팀 역할·소통법
- 성장 포인트
- **고지 문구 (P1-8)**: "자체 성향 모델 · 공식 Birkman과 다를 수 있음 · 평가/선발 근거 아님"

---

## 공개/비공개 제어

- 기본값: **비공개**
- 본인 토글: `PATCH /api/reports/me/visibility`
- 관리자 제어: AdminPage에서 강제 전환 가능
- 팀 리포트: `GET /api/reports/public` — `visibility='public'` 레코드만

---

## 주요 API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/survey/questions/{section}` | 섹션별 문항 조회 |
| POST | `/api/survey/submit/{id}` | 섹션 응답 제출 (마지막 섹션 → 자동 분석) |
| GET | `/api/reports/me` | 내 리포트 |
| PATCH | `/api/reports/me/visibility` | 공개/비공개 전환 |
| GET | `/api/reports/public` | 공개 리포트 목록 (팀 열람) |
| GET | `/api/admin/stats` | 관리자 통계 |

---

## 프론트엔드 페이지

| 경로 | 파일 | 설명 |
|---|---|---|
| `/survey` | [[src/frontend/src/pages/SurveyPage.tsx]] | 섹션별 설문, sticky 푸터 반응형 |
| `/report` | [[src/frontend/src/pages/ReportPage.tsx]] | 내 리포트 + 고지 문구 |
| `/team` | [[src/frontend/src/pages/TeamPage.tsx]] | 공개된 팀원 리포트 열람 |
| `/admin` | [[src/frontend/src/pages/AdminPage.tsx]] | 계정·가시성 관리, YAML 동기화 |
