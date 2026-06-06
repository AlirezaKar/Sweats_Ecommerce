@echo off
REM Shared git helpers. Call: call "%~dp0_git-common.cmd" :LabelName arg1 arg2
REM Sets ERRORLEVEL and may set output variables (GIT_MAIN, GIT_REMOTE, etc.)

if "%~1"=="" exit /b 1
goto %~1

:Die
echo ERROR: %~1
exit /b 1

:TestRefExists
set "BR=%~1"
git show-ref --verify --quiet "refs/heads/%BR%" 2>nul
if errorlevel 1 exit /b 1
exit /b 0

:ResolveRemote
set "GIT_REMOTE=%~1"
if not "%GIT_REMOTE%"=="" exit /b 0
set "GIT_REMOTE="
for /f "usebackq delims=" %%r in (`git config --get remote.pushDefault 2^>nul`) do set "GIT_REMOTE=%%r"
if not defined GIT_REMOTE set "GIT_REMOTE=origin"
exit /b 0

:ResolveMain
call :TestRefExists main
if not errorlevel 1 (
  set "GIT_MAIN=main"
  exit /b 0
)
call :TestRefExists master
if not errorlevel 1 (
  set "GIT_MAIN=master"
  exit /b 0
)
call :Die "Git Flow needs a main branch named 'main' or 'master', but neither exists locally."
exit /b 1

:GetCurrentBranch
for /f "usebackq delims=" %%b in (`git rev-parse --abbrev-ref HEAD 2^>nul`) do set "GIT_BRANCH=%%b"
if not defined GIT_BRANCH call :Die "Unable to determine current branch. Are you inside a Git repo?"
if /i "%GIT_BRANCH%"=="HEAD" call :Die "Detached HEAD. Checkout a branch first."
exit /b 0

:AssertClean
git status --porcelain >nul 2>&1
if errorlevel 1 call :Die "Unable to run 'git status'. Are you inside a Git repo?"
for /f "delims=" %%l in ('git status --porcelain 2^>nul') do (
  call :Die "Working tree is not clean. Commit or stash changes first."
  exit /b 1
)
exit /b 0

:EnsureBranchExists
call :TestRefExists "%~1"
if errorlevel 1 call :Die "Branch '%~1' does not exist locally."
exit /b 0

:IsAncestor
REM %1 = ancestor, %2 = descendant. exit 0 if yes
git merge-base --is-ancestor "%~1" "%~2" 2>nul
exit /b %errorlevel%

:AssertGitFlowMergeAllowed
set "GF_FROM=%~1"
set "GF_INTO=%~2"
call :ResolveMain
if not "%GF_INTO%"=="%GIT_MAIN%" exit /b 0
if /i "%GF_FROM%"=="develop" (
  call :Die "Refusing merge: develop -^> %GIT_MAIN%. Use finish-release instead."
  exit /b 1
)
echo %GF_FROM%| findstr /b /i "feature/" >nul && (
  call :Die "Refusing merge: %GF_FROM% -^> %GIT_MAIN%. Use finish-feature/finish-fix, then finish-release."
  exit /b 1
)
echo %GF_FROM%| findstr /b /i "fix/" >nul && (
  call :Die "Refusing merge: %GF_FROM% -^> %GIT_MAIN%. Use finish-fix, then finish-release."
  exit /b 1
)
exit /b 0

:MergeNoFF
set "MF=%~1"
set "MT=%~2"
set "MM=%~3"
call :AssertGitFlowMergeAllowed "%MF%" "%MT%"
if errorlevel 1 exit /b 1
git checkout "%MT%"
if errorlevel 1 exit /b 1
git merge --no-ff "%MF%" -m "%MM%"
if errorlevel 1 call :Die "Merge failed (%MF% -^> %MT%). Resolve conflicts, then re-run."
exit /b 0

:NormalizeFlowBranch
set "NF_IN=%~1"
set "NF_PX=%~2"
echo %NF_IN%| findstr /b /i "%NF_PX%/" >nul
if not errorlevel 1 (
  set "FLOW_BRANCH=%NF_IN%"
) else (
  set "FLOW_BRANCH=%NF_PX%/%NF_IN%"
)
exit /b 0

:TestRemoteBranchExists
set "TR_REMOTE=%~1"
set "TR_BRANCH=%~2"
git show-ref --verify --quiet "refs/remotes/%TR_REMOTE%/%TR_BRANCH%" 2>nul
exit /b %errorlevel%

:TryPullRemoteBranch
set "TP_REMOTE=%~1"
set "TP_BRANCH=%~2"
call :TestRemoteBranchExists "%TP_REMOTE%" "%TP_BRANCH%"
if errorlevel 1 (
  echo Remote branch '%TP_REMOTE%/%TP_BRANCH%' not found; skipping remote update.
  exit /b 0
)
git checkout "%TP_BRANCH%"
if errorlevel 1 exit /b 1
git pull --ff-only "%TP_REMOTE%" "%TP_BRANCH%"
exit /b %errorlevel%

:UpdateDevelop
set "UD_REMOTE=%~1"
call :EnsureBranchExists develop
git fetch --prune "%UD_REMOTE%"
if errorlevel 1 call :Die "git fetch failed."
git checkout develop
if errorlevel 1 exit /b 1
git pull --ff-only "%UD_REMOTE%" develop
if errorlevel 1 call :Die "Failed to update develop."
exit /b 0

:AssertDevelopExists
call :TestRefExists develop
if errorlevel 1 call :Die "Branch 'develop' does not exist locally."
exit /b 0
