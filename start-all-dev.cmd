@echo off
setlocal
set "ROOT=%~dp0"
set "PY=%ROOT%.venv\Scripts\python.exe"

if not exist "%PY%" (
    echo ERROR: Virtualenv not found at .venv\Scripts\python.exe
    echo Run: python -m venv .venv
    echo Then: .venv\Scripts\pip install -r requirements.txt
    exit /b 1
)

echo Ecommerce dev stack
echo   Sweats_E_commerce API        http://127.0.0.1:8000/
echo   Sweats_E_commerce SPA        http://127.0.0.1:5173/
echo.

start "Ecommerce API (8000)" cmd /k "cd /d "%ROOT%backend" && set FRONTEND_URL=http://localhost:5173 && "%PY%" manage.py runserver 8000"
start "Ecommerce SPA (5173)" cmd /k cd /d "%ROOT%frontend" ^&^& npm run dev -- -p 5173

echo Opened two windows. Close each window to stop that service.
endlocal
