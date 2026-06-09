# Backend 실행 스크립트
# 사용법: .\run.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 가상환경 생성 (없는 경우)
if (-not (Test-Path ".venv")) {
    Write-Host "[1/3] 가상환경 생성 중..." -ForegroundColor Cyan
    python -m venv .venv
}

# 가상환경 활성화
& ".venv\Scripts\Activate.ps1"

# 의존성 설치
Write-Host "[2/3] 의존성 설치 중..." -ForegroundColor Cyan
pip install -q -r requirements.txt

# (선택) C++ 모듈 빌드 — pybind11이 있으면 빌드 시도
Write-Host "[INFO] C++ 모듈 빌드를 원하면: cd cpp; pip install pybind11; pip install ." -ForegroundColor DarkGray

# 서버 실행
Write-Host "[3/3] FastAPI 서버 시작 (http://localhost:8000)" -ForegroundColor Green
uvicorn app.main:app --reload --port 8000
