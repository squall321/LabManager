"""주간 펄스 — 가벼운 1~2문항 반복 체크인 정의 + 주차 유틸."""
from datetime import date, timedelta

SCALE_LABELS = ["전혀", "조금", "보통", "꽤", "매우"]

# 매주 묻는 가벼운 문항 (지속성이 핵심이라 2개로 최소화)
PULSE_QUESTIONS = [
    {"key": "safety", "short": "솔직함",
     "text": "이번 주, 팀에서 솔직하게 의견을 말할 수 있었나요?"},
    {"key": "progress", "short": "진전감",
     "text": "이번 주, 내 업무에서 의미와 진전을 느꼈나요?"},
]

QUESTION_KEYS = [q["key"] for q in PULSE_QUESTIONS]


def week_of(d: date) -> str:
    iso = d.isocalendar()  # (year, week, weekday)
    return f"{iso[0]}-W{iso[1]:02d}"


def current_week() -> str:
    return week_of(date.today())


def recent_weeks(n: int = 8) -> list:
    """오늘 기준 최근 n개 주차(과거→현재)."""
    today = date.today()
    weeks = []
    for i in range(n - 1, -1, -1):
        weeks.append(week_of(today - timedelta(weeks=i)))
    return weeks
