@echo off
setlocal EnableExtensions
set "SCRIPT_DIR=%~dp0"
set "GIT_REMOTE="

REM Usage: git-fetch.cmd [remote]
REM   git-fetch.cmd
REM   git-fetch.cmd origin

if not "%~1"=="" set "GIT_REMOTE=%~1"
call "%SCRIPT_DIR%_git-common.cmd" :ResolveRemote "%GIT_REMOTE%"
if errorlevel 1 exit /b 1

echo Fetching from remote '%GIT_REMOTE%' (with prune)...
git fetch --prune %GIT_REMOTE%
if errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "git fetch failed."
  exit /b 1
)

echo Fetch complete.
exit /b 0
