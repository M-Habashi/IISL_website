@echo off
setlocal

set "SOURCE=%~dp0"
if "%SOURCE:~-1%"=="\" set "SOURCE=%SOURCE:~0,-1%"
set "DEST=Z:\entities\IISL"

echo.
echo Mirroring IISL website to server...
echo Source: "%SOURCE%"
echo Dest:   "%DEST%"
echo.

set "LOG=%TEMP%\clone_to_server_robocopy.log"

if not exist "%DEST%\" (
    powershell -NoProfile -Command "Write-Host 'Clone to server failed: destination path is not available.' -ForegroundColor Red"
    echo Check that the Z: drive is connected and this path exists: "%DEST%"
    echo.
    pause
    exit /b 16
)

robocopy "%SOURCE%" "%DEST%" /E /PURGE /COPY:DT /DCOPY:T /XD .git /XF AGENTS.md /R:1 /W:1 /TEE /LOG:"%LOG%"
set "ROBOCOPY_EXIT=%ERRORLEVEL%"

echo.
findstr /C:"ERROR " "%LOG%" >nul
set "HAS_ROBOCOPY_ERROR=%ERRORLEVEL%"

if %ROBOCOPY_EXIT% GTR 7 goto robocopy_failed
if %HAS_ROBOCOPY_ERROR% EQU 0 goto robocopy_failed

powershell -NoProfile -Command "Write-Host 'Clone to server completed successfully.' -ForegroundColor Green"
goto robocopy_done

:robocopy_failed
powershell -NoProfile -Command "Write-Host 'Clone to server finished with errors. Review the robocopy output above.' -ForegroundColor Red"

:robocopy_done

echo Robocopy exit code: %ROBOCOPY_EXIT%
echo Robocopy log: "%LOG%"
echo.
pause

exit /b %ROBOCOPY_EXIT%
