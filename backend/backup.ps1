# 디지털트윈AX랩 - DB 백업 편의 스크립트 (Windows)
#
# 사용법:
#   .\backup.ps1              # 즉시 백업 1회
#   .\backup.ps1 list         # 백업 목록
#   .\backup.ps1 restore <파일>  # 복원 (복원 전 현재 DB 자동 안전백업)
#   .\backup.ps1 prune        # 오래된 백업 정리(최근 20개 유지)
#
# 매일 자동 백업 등록(작업 스케줄러) 예시는 파일 하단 주석 참고.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$py = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) { $py = "python" }   # venv 없으면 시스템 파이썬

$env:PYTHONIOENCODING = "utf-8"
if ($args.Count -eq 0) {
    & $py -m scripts.backup_db backup
} else {
    & $py -m scripts.backup_db @args
}

# ── 매일 오전 3시 자동 백업 등록(관리자 PowerShell에서 1회 실행) ──
# $action  = New-ScheduledTaskAction -Execute "powershell.exe" `
#            -Argument "-NoProfile -File `"$PSScriptRoot\backup.ps1`""
# $trigger = New-ScheduledTaskTrigger -Daily -At 3am
# Register-ScheduledTask -TaskName "DTAXLab-DB-Backup" -Action $action -Trigger $trigger
