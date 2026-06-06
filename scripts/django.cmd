@echo off
setlocal

call "%~dp0_python.cmd"
if errorlevel 1 exit /b 1

cd /d "%ROOT%\backend"
"%PY%" manage.py %*

endlocal
