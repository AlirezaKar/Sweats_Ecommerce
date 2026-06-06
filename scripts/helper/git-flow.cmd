@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
set "ACTION=%~1"
set "GIT_REMOTE="
set "GIT_PUSH=0"
set "VAL="

REM Git Flow helper (CMD). develop = daily work; main = releases + hotfixes only.
REM Usage:
REM   git-flow.cmd status
REM   git-flow.cmd rules
REM   git-flow.cmd list
REM   git-flow.cmd start-feature my-work
REM   git-flow.cmd finish-feature my-work [/push] [/remote origin]
REM   git-flow.cmd start-fix login-bug
REM   git-flow.cmd finish-fix login-bug
REM   git-flow.cmd start-release 1.2.0
REM   git-flow.cmd finish-release 1.2.0
REM   git-flow.cmd start-hotfix 1.2.1
REM   git-flow.cmd finish-hotfix 1.2.1

if "%ACTION%"=="" set "ACTION=status"
shift

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="/push" set "GIT_PUSH=1" & shift & goto parse_args
if /i "%~1"=="-push" set "GIT_PUSH=1" & shift & goto parse_args
if /i "%~1"=="/remote" (
  set "GIT_REMOTE=%~2"
  shift
  shift
  goto parse_args
)
if not defined VAL set "VAL=%~1"
shift
goto parse_args

:args_done
call "%SCRIPT_DIR%_git-common.cmd" :ResolveRemote "%GIT_REMOTE%"
if errorlevel 1 exit /b 1

if /i "%ACTION%"=="status" goto do_status
if /i "%ACTION%"=="rules" goto do_rules
if /i "%ACTION%"=="list" goto do_list
if /i "%ACTION%"=="start-feature" goto do_start_feature
if /i "%ACTION%"=="finish-feature" goto do_finish_feature
if /i "%ACTION%"=="start-fix" goto do_start_fix
if /i "%ACTION%"=="finish-fix" goto do_finish_fix
if /i "%ACTION%"=="start-release" goto do_start_release
if /i "%ACTION%"=="finish-release" goto do_finish_release
if /i "%ACTION%"=="start-hotfix" goto do_start_hotfix
if /i "%ACTION%"=="finish-hotfix" goto do_finish_hotfix

call "%SCRIPT_DIR%_git-common.cmd" :Die "Unknown action: %ACTION%"
exit /b 1

:do_rules
call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
if errorlevel 1 exit /b 1
call :print_rules
exit /b 0

:do_status
call "%SCRIPT_DIR%_git-common.cmd" :AssertDevelopExists
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
if errorlevel 1 exit /b 1
echo Main branch: %GIT_MAIN% ^(releases + hotfixes only^)
echo Develop branch: develop ^(all feature/fix work^)
echo Remote: %GIT_REMOTE%
echo.
set "FOUND=0"
for /f "delims=" %%b in ('git for-each-ref --format^="%%(refname:short)" refs/heads 2^>nul') do (
  call :maybe_print_flow_branch "%%b"
)
if "!FOUND!"=="0" echo No local Git Flow branches found ^(feature/*, fix/*, release/*, hotfix/*^).
call :print_rules
exit /b 0

:do_list
set "FOUND=0"
for /f "delims=" %%b in ('git for-each-ref --format^="%%(refname:short)" refs/heads 2^>nul') do (
  call :maybe_print_flow_branch "%%b"
)
if "!FOUND!"=="0" echo No local Git Flow branches found.
exit /b 0

:maybe_print_flow_branch
set "B=%~1"
set "IS_FLOW=0"
echo %B%| findstr /b "feature/" >nul && set "IS_FLOW=1"
echo %B%| findstr /b "fix/" >nul && set "IS_FLOW=1"
echo %B%| findstr /b "release/" >nul && set "IS_FLOW=1"
echo %B%| findstr /b "hotfix/" >nul && set "IS_FLOW=1"
if not "!IS_FLOW!"=="1" exit /b 0
if "!FOUND!"=="0" (
  echo Local Git Flow branches:
  set "FOUND=1"
)
echo   %B%
exit /b 0

:print_rules
call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
echo.
echo === Git Flow rules (this repo) ===
echo.
echo   develop  -^> integration; all features and fixes merge here
echo   %GIT_MAIN%    -^> production only; release/* and hotfix/* merge here
echo.
echo   Daily work:
echo     git-flow.cmd start-feature / start-fix  ^(from develop^)
echo     git-flow.cmd finish-feature / finish-fix  -^> develop
echo.
echo   Ship: start-release -^> finish-release  ^(release -^> %GIT_MAIN%, then %GIT_MAIN% -^> develop^)
echo   Hotfix: start-hotfix -^> finish-hotfix  ^(hotfix -^> %GIT_MAIN%, then sync develop^)
echo.
echo   Do NOT merge develop, feature/*, or fix/* into %GIT_MAIN% by hand.
echo.
exit /b 0

:do_start_feature
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide a name: git-flow.cmd start-feature my-work"
  exit /b 1
)
call :start_dev_work feature feature "%VAL%"
exit /b %errorlevel%

:do_start_fix
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide a name: git-flow.cmd start-fix my-bugfix"
  exit /b 1
)
call :start_dev_work fix fix "%VAL%"
exit /b %errorlevel%

:start_dev_work
set "SD_PREFIX=%~1"
set "SD_KIND=%~2"
set "SD_NAME=%~3"
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :AssertDevelopExists
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :NormalizeFlowBranch "%SD_NAME%" "%SD_PREFIX%"
call "%SCRIPT_DIR%_git-common.cmd" :UpdateDevelop "%GIT_REMOTE%"
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :TestRefExists "%FLOW_BRANCH%"
if not errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Branch '%FLOW_BRANCH%' already exists locally."
  exit /b 1
)
git checkout -b %FLOW_BRANCH%
if errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Failed to create '%FLOW_BRANCH%'."
  exit /b 1
)
echo Created %SD_KIND% branch: %FLOW_BRANCH% ^(from develop^)
echo When done: git-flow.cmd finish-%SD_KIND% %FLOW_BRANCH%
exit /b 0

:do_finish_feature
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide branch: git-flow.cmd finish-feature my-work"
  exit /b 1
)
call :finish_dev_work feature feature "%VAL%"
exit /b %errorlevel%

:do_finish_fix
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide branch: git-flow.cmd finish-fix my-bugfix"
  exit /b 1
)
call :finish_dev_work fix fix "%VAL%"
exit /b %errorlevel%

:finish_dev_work
set "FD_PREFIX=%~1"
set "FD_KIND=%~2"
set "FD_INPUT=%~3"
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :AssertDevelopExists
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :NormalizeFlowBranch "%FD_INPUT%" "%FD_PREFIX%"
set "WB=%FLOW_BRANCH%"
call "%SCRIPT_DIR%_git-common.cmd" :EnsureBranchExists "%WB%"
if errorlevel 1 exit /b 1
git fetch --prune %GIT_REMOTE%
if errorlevel 1 call "%SCRIPT_DIR%_git-common.cmd" :Die "git fetch failed." & exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :TryPullRemoteBranch "%GIT_REMOTE%" "%WB%"
git checkout develop
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% develop
if errorlevel 1 call "%SCRIPT_DIR%_git-common.cmd" :Die "Failed to update develop." & exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :IsAncestor "%WB%" "develop"
if not errorlevel 1 (
  echo '%WB%' is already in develop. Skipping merge.
) else (
  call "%SCRIPT_DIR%_git-common.cmd" :MergeNoFF "%WB%" "develop" "Merge %WB% into develop"
  if errorlevel 1 exit /b 1
)
if "%GIT_PUSH%"=="1" (
  git push %GIT_REMOTE% develop
  if errorlevel 1 call "%SCRIPT_DIR%_git-common.cmd" :Die "Push failed." & exit /b 1
)
echo finish-%FD_KIND% complete. Work is on develop only ^(not on main^).
exit /b 0

:do_start_release
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide version: git-flow.cmd start-release 1.2.0"
  exit /b 1
)
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :AssertDevelopExists
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :NormalizeFlowBranch "%VAL%" "release"
set "RB=%FLOW_BRANCH%"
call "%SCRIPT_DIR%_git-common.cmd" :UpdateDevelop "%GIT_REMOTE%"
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :TestRefExists "%RB%"
if not errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Branch '%RB%' already exists."
  exit /b 1
)
git checkout -b %RB%
if errorlevel 1 call "%SCRIPT_DIR%_git-common.cmd" :Die "Failed to create '%RB%'." & exit /b 1
echo Created release branch: %RB% ^(from develop^)
echo Then: git-flow.cmd finish-release %RB%
exit /b 0

:do_finish_release
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide branch: git-flow.cmd finish-release 1.2.0"
  exit /b 1
)
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :AssertDevelopExists
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :NormalizeFlowBranch "%VAL%" "release"
set "RB=%FLOW_BRANCH%"
call "%SCRIPT_DIR%_git-common.cmd" :EnsureBranchExists "%RB%"
if errorlevel 1 exit /b 1
git fetch --prune %GIT_REMOTE%
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :TryPullRemoteBranch "%GIT_REMOTE%" "%RB%"
git checkout %GIT_MAIN%
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% %GIT_MAIN%
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :IsAncestor "%RB%" "%GIT_MAIN%"
if not errorlevel 1 (
  echo Main already contains '%RB%'. Skipping merge into main.
) else (
  call "%SCRIPT_DIR%_git-common.cmd" :MergeNoFF "%RB%" "%GIT_MAIN%" "Release: merge %RB% into %GIT_MAIN%"
  if errorlevel 1 exit /b 1
)
if "%GIT_PUSH%"=="1" (
  git push %GIT_REMOTE% %GIT_MAIN%
  if errorlevel 1 exit /b 1
)
git checkout develop
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% develop
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :IsAncestor "%GIT_MAIN%" "develop"
if not errorlevel 1 (
  echo Develop already contains main. Skipping sync.
) else (
  call "%SCRIPT_DIR%_git-common.cmd" :MergeNoFF "%GIT_MAIN%" "develop" "Sync production %GIT_MAIN% into develop"
  if errorlevel 1 exit /b 1
)
if "%GIT_PUSH%"=="1" (
  git push %GIT_REMOTE% develop
  if errorlevel 1 exit /b 1
)
echo finish-release complete.
exit /b 0

:do_start_hotfix
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide version: git-flow.cmd start-hotfix 1.2.1"
  exit /b 1
)
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :NormalizeFlowBranch "%VAL%" "hotfix"
set "HB=%FLOW_BRANCH%"
git fetch --prune %GIT_REMOTE%
if errorlevel 1 exit /b 1
git checkout %GIT_MAIN%
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% %GIT_MAIN%
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :TestRefExists "%HB%"
if not errorlevel 1 (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Branch '%HB%' already exists."
  exit /b 1
)
git checkout -b %HB%
if errorlevel 1 exit /b 1
echo Created hotfix branch: %HB% ^(from %GIT_MAIN%^)
exit /b 0

:do_finish_hotfix
if "%VAL%"=="" (
  call "%SCRIPT_DIR%_git-common.cmd" :Die "Provide branch: git-flow.cmd finish-hotfix 1.2.1"
  exit /b 1
)
call "%SCRIPT_DIR%_git-common.cmd" :AssertClean
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :AssertDevelopExists
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :ResolveMain
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :NormalizeFlowBranch "%VAL%" "hotfix"
set "HB=%FLOW_BRANCH%"
call "%SCRIPT_DIR%_git-common.cmd" :EnsureBranchExists "%HB%"
if errorlevel 1 exit /b 1
git fetch --prune %GIT_REMOTE%
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :TryPullRemoteBranch "%GIT_REMOTE%" "%HB%"
git checkout %GIT_MAIN%
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% %GIT_MAIN%
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :IsAncestor "%HB%" "%GIT_MAIN%"
if not errorlevel 1 (
  echo Main already contains '%HB%'. Skipping merge.
) else (
  call "%SCRIPT_DIR%_git-common.cmd" :MergeNoFF "%HB%" "%GIT_MAIN%" "Hotfix: merge %HB% into %GIT_MAIN%"
  if errorlevel 1 exit /b 1
)
if "%GIT_PUSH%"=="1" (
  git push %GIT_REMOTE% %GIT_MAIN%
  if errorlevel 1 exit /b 1
)
git checkout develop
if errorlevel 1 exit /b 1
git pull --ff-only %GIT_REMOTE% develop
if errorlevel 1 exit /b 1
call "%SCRIPT_DIR%_git-common.cmd" :IsAncestor "%GIT_MAIN%" "develop"
if not errorlevel 1 (
  echo Develop already contains main. Skipping sync.
) else (
  call "%SCRIPT_DIR%_git-common.cmd" :MergeNoFF "%GIT_MAIN%" "develop" "Sync production %GIT_MAIN% into develop"
  if errorlevel 1 exit /b 1
)
if "%GIT_PUSH%"=="1" (
  git push %GIT_REMOTE% develop
  if errorlevel 1 exit /b 1
)
echo finish-hotfix complete.
exit /b 0
