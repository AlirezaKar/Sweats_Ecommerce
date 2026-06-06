@echo off
setlocal

call "%~dp0_python.cmd"
if errorlevel 1 exit /b 1

cd /d "%ROOT%\backend"

if not exist ".env" (
    echo Copy backend\.env.example to backend\.env and set DB_PASSWORD, then run again.
    exit /b 1
)

"%PY%" -c "import psycopg" 2>nul
if errorlevel 1 (
    echo Installing Python dependencies...
    "%ROOT%\.venv\Scripts\pip.exe" install -r "%ROOT%\requirements.txt"
    if errorlevel 1 exit /b 1
)

"%PY%" "%ROOT%\scripts\setup_postgres.py"
if errorlevel 1 exit /b 1

"%PY%" manage.py migrate
if errorlevel 1 exit /b 1

echo.
echo PostgreSQL is ready. Run start-all-dev.cmd to start the stack.

endlocal
