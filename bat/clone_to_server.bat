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

set "PUBLICATIONS_APP=%SOURCE%\publications_modern"
set "PUBLICATIONS_DIST=%PUBLICATIONS_APP%\dist"

if exist "%PUBLICATIONS_APP%\package.json" (
    echo Building modern publications page...
    echo.
    pushd "%PUBLICATIONS_APP%"
    if not exist "node_modules\" (
        echo Installing publications dependencies with npm ci...
        call npm ci
        if errorlevel 1 (
            popd
            powershell -NoProfile -Command "Write-Host 'Clone to server failed: npm ci failed for publications_modern.' -ForegroundColor Red"
            echo.
            pause
            exit /b 19
        )
    )
    call npm run build
    if errorlevel 1 (
        popd
        powershell -NoProfile -Command "Write-Host 'Clone to server failed: publications_modern build failed.' -ForegroundColor Red"
        echo.
        pause
        exit /b 20
    )
    popd
) else (
    powershell -NoProfile -Command "Write-Host 'Clone to server failed: publications_modern package.json was not found.' -ForegroundColor Red"
    echo Expected path: "%PUBLICATIONS_APP%\package.json"
    echo.
    pause
    exit /b 21
)

if not exist "%PUBLICATIONS_DIST%\index.html" (
    powershell -NoProfile -Command "Write-Host 'Clone to server failed: publications_modern dist output was not found.' -ForegroundColor Red"
    echo Expected path: "%PUBLICATIONS_DIST%\index.html"
    echo.
    pause
    exit /b 22
)

robocopy "%SOURCE%" "%DEST%" /E /PURGE /COPY:DT /DCOPY:T /XD .git unused node_modules dist publications_modern /R:1 /W:1 /TEE /LOG:"%LOG%"
set "ROBOCOPY_EXIT=%ERRORLEVEL%"

echo.
findstr /C:"ERROR " "%LOG%" >nul
set "HAS_ROBOCOPY_ERROR=%ERRORLEVEL%"

if %ROBOCOPY_EXIT% GTR 7 goto robocopy_failed
if %HAS_ROBOCOPY_ERROR% EQU 0 goto robocopy_failed

echo.
echo Deploying built publications_modern output...
robocopy "%PUBLICATIONS_DIST%" "%DEST%\publications_modern" /E /PURGE /COPY:DT /DCOPY:T /R:1 /W:1 /TEE /LOG+:"%LOG%"
set "PUBLICATIONS_ROBOCOPY_EXIT=%ERRORLEVEL%"

if %PUBLICATIONS_ROBOCOPY_EXIT% GTR 7 goto publications_failed

set "DEPLOY_EXIT=%ROBOCOPY_EXIT%"
powershell -NoProfile -Command "Write-Host 'Clone to server completed successfully.' -ForegroundColor Green"
goto robocopy_done

:robocopy_failed
set "DEPLOY_EXIT=%ROBOCOPY_EXIT%"
powershell -NoProfile -Command "Write-Host 'Clone to server finished with errors. Review the robocopy output above.' -ForegroundColor Red"
goto robocopy_done

:publications_failed
set "DEPLOY_EXIT=%PUBLICATIONS_ROBOCOPY_EXIT%"
powershell -NoProfile -Command "Write-Host 'Clone to server finished with errors while deploying publications_modern. Review the robocopy output above.' -ForegroundColor Red"

:robocopy_done

echo Robocopy exit code: %ROBOCOPY_EXIT%
if defined PUBLICATIONS_ROBOCOPY_EXIT echo Publications robocopy exit code: %PUBLICATIONS_ROBOCOPY_EXIT%
echo Robocopy log: "%LOG%"
echo.
pause

exit /b %DEPLOY_EXIT%
