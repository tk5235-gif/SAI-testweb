@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ================================================
echo   PRODUCTION BUILD  --^>  saigroupe.com
echo ================================================
echo.
node build-dist.js
if errorlevel 1 goto ERR
echo.
start "" "%~dp0dist"
goto END
:ERR
echo.
echo [ERROR] Build failed. Is Node.js installed?
echo         Check with: node -v
:END
echo.
pause
