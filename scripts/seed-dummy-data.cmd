@echo off
setlocal

call "%~dp0_python.cmd"
if errorlevel 1 exit /b 1

cd /d "%ROOT%"
"%PY%" scripts\seed_dummy_data.py %*

endlocal
