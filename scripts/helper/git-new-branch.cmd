@echo off
setlocal EnableExtensions
set "SCRIPT_DIR=%~dp0"
set "GIT_REMOTE="
set "BRANCH_NAME="
set "BASE_BRANCH="
set "FROM_MAIN=0"

REM Usage: git-new-branch.cmd <name> [base] [remote] [/frommain]
REM   git-new-branch.cmd feature/cart-ui
REM   git-new-branch.cmd hotfix/1.0.1 main origin /frommain

:parse
if "%~1"=="" goto after_parse
if /i "%~1"=="/frommain" set "FROM_MAIN=1" & shift & goto parse
if /i "%~1"=="-frommain" set "FROM_MAIN=1" & shift & goto parse
if not defined BRANCH_NAME (
  set "BRANCH_NAME=%~1"
  shift
  goto parse
)
if not defined BASE_BRANCH (
  set "BASE_BRANCH=%~1"
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

:after_parse
if "%BRANCH_NAME%"=="" (
  echo Usage: git-new-branch.cmd ^<name^> [base] [remote] [/frommain]
  exit /b 1
)

call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1

call "%SCRIPT_DIR%_git-common.cmd" :ResolveRemote "%GIT_REMOTE%"
if errorlevel 1 exit /b 1

if not "%BASE_BRANCH%"=="" goto have_base
if "%FROM_MAIN%"=="1" (
  call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
  if errorlevel 1 exit /b 1
  set "BASE_BRANCH=%GIT_MAIN%"
) else (
  call "%SCRIPT_DIR%_git-common.cmd" :TestRefExists develop
  if errorlevel 1 (
    echo ERROR: Branch 'develop' does not exist. Create it first.
    echo For features/fixes use: git-flow.cmd start-feature my-work
    echo For hotfix from main use: git-new-branch.cmd hotfix/x main /frommain
    exit /b 1
  )
  set "BASE_BRANCH=develop"
)
goto base_ok

:have_base
if "%FROM_MAIN%"=="0" (
  call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
  if not errorlevel 1 (
    if /i "%BASE_BRANCH%"=="%GIT_MAIN%" (
      call "%SCRIPT_DIR%_git-common.cmd" :Die "Refusing to branch from '%GIT_MAIN%'. Use develop, or pass /frommain for hotfix."
      exit /b 1
    )
  )
)

:base_ok
call "%SCRIPT_DIR%_git-common.cmd" :EnsureBranchExists "%BASE_BRANCH%"
if errorlevel 1 exit /b 1

echo Fetching '%GIT_REMOTE%'...
git fetch --prune %GIT_REMOTE%
if errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "git fetch failed."
  exit /b 1
)

echo Checking out base '%BASE_BRANCH%' and pulling latest...
git checkout %BASE_BRANCH%
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% %BASE_BRANCH%
if errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Failed to update base branch."
  exit /b 1
)

call "%SCRIPT_DIR%_git-common.cmd" :TestRefExists "%BRANCH_NAME%"
if not errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Branch '%BRANCH_NAME%' already exists locally."
  exit /b 1
)

echo Creating new branch '%BRANCH_NAME%' from '%BASE_BRANCH%'...
git checkout -b %BRANCH_NAME%
if errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Branch creation failed."
  exit /b 1
)

if /i "%BASE_BRANCH%"=="develop" (
  echo Tip: when done, merge with git-flow.cmd finish-feature or finish-fix ^(into develop, not main^).
)

echo New branch created: %BRANCH_NAME%
exit /b 0
