@echo off
setlocal

for %%I in ("%~dp0..") do set "REPO_ROOT=%%~fI"
cd /d "%REPO_ROOT%"

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
    powershell -NoProfile -Command "Write-Host 'Error: this folder is not a Git repository.' -ForegroundColor Red"
    echo.
    pause
    exit /b 1
)

for /f %%i in ('git status --porcelain') do (
    powershell -NoProfile -Command "Write-Host 'Error: working tree is not clean. Commit or discard changes before pushing.' -ForegroundColor Red"
    echo.
    git status --short
    echo.
    pause
    exit /b 1
)

echo Pushing current branch to GitHub...
echo.
git push
set "GIT_EXIT=%ERRORLEVEL%"

echo.
if %GIT_EXIT% EQU 0 (
    powershell -NoProfile -Command "Write-Host 'Push to GitHub completed successfully.' -ForegroundColor Green"
) else (
    powershell -NoProfile -Command "Write-Host 'Push to GitHub failed. Review the Git output above.' -ForegroundColor Red"
)

echo Git exit code: %GIT_EXIT%
echo.
pause
exit /b %GIT_EXIT%
