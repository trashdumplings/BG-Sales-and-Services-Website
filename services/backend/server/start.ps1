# PowerShell script to start the FastAPI server
# Usage: .\server\start.ps1

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$venvScripts = Join-Path $projectRoot "venv\Scripts\Activate.ps1"

Write-Host "`n=== BG Sales Portal - Server Startup ===" -ForegroundColor Cyan

if (Test-Path $venvScripts) {
    Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Yellow
    & $venvScripts
    
    Write-Host "[2/3] Checking Python packages..." -ForegroundColor Yellow
    $hasUvicorn = python -c "import uvicorn" 2>$null
    $hasFastAPI = python -c "import fastapi" 2>$null
    
    if (-not $hasUvicorn -or -not $hasFastAPI) {
        Write-Host "ERROR: Required packages not found!" -ForegroundColor Red
        Write-Host "Please run: pip install -r server\requirements.txt" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "[3/3] Starting FastAPI server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Server will be available at:" -ForegroundColor Green
    Write-Host "  - API: http://localhost:8000" -ForegroundColor White
    Write-Host "  - Docs: http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  - ReDoc: http://localhost:8000/redoc" -ForegroundColor White
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Yellow
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
    
    Set-Location $projectRoot
    try {
        python -m server.main
    } catch {
        Write-Host ""
        Write-Host "ERROR: Server failed to start!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  1. PostgreSQL is not running" -ForegroundColor White
        Write-Host "  2. DATABASE_URL in .env file is incorrect" -ForegroundColor White
        Write-Host "  3. Database 'bgsales_portal' doesn't exist" -ForegroundColor White
        Write-Host ""
        Write-Host "Check server\.env file and ensure PostgreSQL is running." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "ERROR: Virtual environment not found at:" -ForegroundColor Red
    Write-Host "  $venvScripts" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create a virtual environment first:" -ForegroundColor Yellow
    Write-Host "  1. python -m venv venv" -ForegroundColor White
    Write-Host "  2. .\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host "  3. pip install -r server\requirements.txt" -ForegroundColor White
    exit 1
}
