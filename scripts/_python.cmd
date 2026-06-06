@echo off
REM Shared venv Python path. Usage: call "%~dp0_python.cmd"
set "ROOT=%~dp0.."
set "PY=%ROOT%\.venv\Scripts\python.exe"

if not exist "%PY%" (
    echo ERROR: Virtualenv not found at .venv\Scripts\python.exe
    echo Create it from the repo root:
    echo   python -m venv .venv
    echo   .venv\Scripts\pip install -r requirements.txt
    exit /b 1
)

exit /b 0
