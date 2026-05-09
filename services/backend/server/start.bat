@echo off
REM Batch script to start the FastAPI server (for Command Prompt)
REM Usage: server\start.bat

echo.
echo === BG Sales Portal - Server Startup ===
echo.

cd /d "%~dp0"
cd ..

if exist "venv\Scripts\activate.bat" (
    echo [1/3] Activating virtual environment...
    call venv\Scripts\activate.bat
    
    echo [2/3] Checking Python packages...
    python -c "import uvicorn" 2>nul
    if errorlevel 1 (
        echo ERROR: Required packages not found!
        echo Please run: pip install -r server\requirements.txt
        pause
        exit /b 1
    )
    
    echo [3/3] Starting FastAPI server...
    echo.
    echo Server will be available at:
    echo   - API: http://localhost:8000
    echo   - Docs: http://localhost:8000/docs
    echo   - ReDoc: http://localhost:8000/redoc
    echo.
    echo Press Ctrl+C to stop the server
    echo ---
    echo.
    
    cd server
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
    if errorlevel 1 (
        echo.
        echo ERROR: Server failed to start!
        echo.
        echo Common issues:
        echo   1. PostgreSQL is not running
        echo   2. DATABASE_URL in .env file is incorrect
        echo   3. Database doesn't exist
        echo.
        echo Check server\.env file and ensure PostgreSQL is running.
        pause
        exit /b 1
    )
) else (
    echo ERROR: Virtual environment not found
    echo.
    echo Please create a virtual environment first:
    echo   1. python -m venv venv
    echo   2. venv\Scripts\activate.bat
    echo   3. pip install -r server\requirements.txt
    pause
    exit /b 1
)
