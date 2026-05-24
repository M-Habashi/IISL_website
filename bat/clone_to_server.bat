@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
for %%I in ("%SCRIPT_DIR%\..") do set "SOURCE=%%~fI"
set "DEST=Z:\entities\IISL"
for %%I in ("%DEST%") do set "DEST_FULL=%%~fI"

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

if /I "%SOURCE%"=="%DEST_FULL%" (
    powershell -NoProfile -Command "Write-Host 'Clone to server refused: source and destination are the same path.' -ForegroundColor Red"
    echo You are running the server copy of this script.
    echo Run the local repo copy instead:
    echo "%USERPROFILE%\OneDrive\Desktop\Folder old windows\IISL_website_working\bat\clone_to_server.bat"
    echo.
    pause
    exit /b 17
)

if not exist "%SOURCE%\.git\" (
    powershell -NoProfile -Command "Write-Host 'Clone to server refused: source does not look like the local Git repo.' -ForegroundColor Red"
    echo Source path: "%SOURCE%"
    echo Expected a .git folder under the source path.
    echo.
    pause
    exit /b 18
)

robocopy "%SOURCE%" "%DEST%" /E /PURGE /COPY:DT /DCOPY:T /XD .git unused /R:1 /W:1 /TEE /LOG:"%LOG%"
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
