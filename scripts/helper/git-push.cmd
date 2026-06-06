@echo off
setlocal EnableExtensions
set "SCRIPT_DIR=%~dp0"
set "GIT_REMOTE="
set "TARGET_BRANCH="
set "SET_UPSTREAM=0"

REM Usage: git-push.cmd [branch] [remote] [/u]
REM   git-push.cmd
REM   git-push.cmd feature/my-work
REM   git-push.cmd feature/my-work origin /u

:parse
if "%~1"=="" goto run
if /i "%~1"=="/u" set "SET_UPSTREAM=1" & shift & goto parse
if /i "%~1"=="-u" set "SET_UPSTREAM=1" & shift & goto parse
if not defined TARGET_BRANCH (
  set "TARGET_BRANCH=%~1"
  shift
  goto parse
)
if not defined GIT_REMOTE (
  set "GIT_REMOTE=%~1"
  shift
  goto parse
)
shift
goto parse

:run
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1

if not defined TARGET_BRANCH (
  call "%SCRIPT_DIR%_git-common.cmd" :GetCurrentBranch
  if errorlevel 1 exit /b 1
  set "TARGET_BRANCH=%GIT_BRANCH%"
)

call "%SCRIPT_DIR%_git-common.cmd" :ResolveRemote "%GIT_REMOTE%"
if errorlevel 1 exit /b 1

call "%SCRIPT_DIR%_git-common.cmd" :EnsureBranchExists "%TARGET_BRANCH%"
if errorlevel 1 exit /b 1

echo Pushing branch '%TARGET_BRANCH%' to '%GIT_REMOTE%'...
if "%SET_UPSTREAM%"=="1" (
  git push -u %GIT_REMOTE% %TARGET_BRANCH%
) else (
  git push %GIT_REMOTE% %TARGET_BRANCH%
)
if errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "git push failed."
  exit /b 1
)

echo Push complete.
exit /b 0
